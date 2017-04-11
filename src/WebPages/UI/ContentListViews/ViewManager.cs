using System;
using System.Collections.Generic;
using System.Linq;
using SenseNet.ContentRepository.Schema;
using SenseNet.ContentRepository.Storage;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Storage.Schema;
using SenseNet.ContentRepository.Storage.Security;
using SenseNet.Diagnostics;
using SenseNet.Portal.UI.ContentListViews.Handlers;

namespace SenseNet.Portal.UI.ContentListViews
{
    public class ViewManager : IViewManager
    {
        public static readonly string VIEWSFOLDERNAME = "Views";
        public static readonly string FALLBACKVIEWPATH = "/Root/System/SystemPlugins/ListView/Fallback.ascx";

        internal static IEnumerable<Node> GetViewsForContainer(string path)
        {
            return GetViewsInContext(Node.LoadNode(path));
        }

        public static IEnumerable<Node> GetViewsForContainer(Node container)
        {
            return Content.All.DisableAutofilters().Where(c => 
                c.Name.EndsWith(".ascx") &&
                c.InTree(RepositoryPath.Combine(container.Path, VIEWSFOLDERNAME)))
                .AsEnumerable()
                .Select(c => c.ContentHandler);
        }

        public static IEnumerable<Node> GetViewsInContext(Node subnode)
        {
            var subcont = subnode as GenericContent;
            if (subcont == null)
                return new Node[0];

            return GetViewsForContainer(subcont.MostRelevantContext);
        }

        private static File LoadView(Node container, string viewName)
        {
            File viewNode = null;

            if (!string.IsNullOrEmpty(viewName))
            {
                // simple view name (e.g. 'Default.ascx')
                if (container != null)
                    viewNode = LoadViewWithPermissions(RepositoryPath.Combine(container.Path, VIEWSFOLDERNAME, viewName));

                // full view name (e.g. '/Root/.../MyView.ascx')
                if (viewNode == null)
                    viewNode = LoadViewWithPermissions(viewName);
            }

            // hack - fallback view for non-list folders
            return viewNode ?? LoadViewWithPermissions(FALLBACKVIEWPATH);
        }

        internal static File LoadViewWithPermissions(string viewPath)
        {
            var viewHead = NodeHead.Get(viewPath);
            if (viewHead != null && SecurityHandler.HasPermission(viewHead, PermissionType.RunApplication))
            {
                // elevation: we have to serve the view, if the user has run 
                // application for it, even if no Open permission is given
                using (new SystemAccount())
                {
                    return Node.LoadNode(viewHead) as File;
                }
            }

            return null;
        }

        public static File LoadViewInContext(Node subnode, string viewName)
        {
            var subcont = subnode as GenericContent;
            return LoadView(subcont.MostRelevantContext, viewName);
        }

        public static string GetViewPathInContext(Node subnode, string viewName)
        {
            var view = LoadViewInContext(subnode, viewName);
            if (view != null)
                return view.Path;
            return null;
        }

        public static string GetViewPath(Node container, string viewName)
        {
            var view = LoadView(container, viewName);
            if (view != null)
                return view.Path;
            return null;
        }

        public static File LoadDefaultView(ContentList list)
        {
            return LoadView(list, list.DefaultView);
        }

        public static void AddToDefaultView(FieldSetting fieldSetting, ContentList contentList)
        {
            if (fieldSetting == null || contentList == null)
                return;

            var iv = LoadDefaultView(contentList) as IView;
            if (iv == null) 
                return;

            var viewNode = iv as Node;
            if (viewNode == null)
                return;

            // if the view is global, create local copy first
            if (!viewNode.Path.StartsWith(contentList.Path))
            {
                viewNode = ViewManager.CopyViewLocal(contentList.Path, viewNode.Path, true);
                iv = viewNode as IView;
            }

            fieldSetting.Owner = ContentType.GetByName("ContentList");

            iv.AddColumn(new Column
                             {
                                 FullName = fieldSetting.FullName,
                                 BindingName = fieldSetting.BindingName,
                                 Title = fieldSetting.DisplayName,
                                 Index = iv.GetColumns().Count() + 1
                             });

            viewNode.Save();
        }

        public static void RemoveFieldFromViews(FieldSetting fieldSetting, ContentList contentList)
        {
            using (new SystemAccount())
            {
                foreach (var iv in GetViewsForContainer(contentList).OfType<IView>())
                {
                    try
                    {
                        iv.RemoveColumn(fieldSetting.FullName);
                        ((Handlers.ViewBase)iv).Save();
                    }
                    catch (Exception ex)
                    {
                        var view = iv as Node;
                        SnLog.WriteException(ex, "Error removing column " + fieldSetting.Name + " from view " + view.Path);
                    }
                }
            }
        }

        public static Handlers.ViewBase CopyViewLocal(string listPath, string viewPath)
        {
            return CopyViewLocal(listPath, viewPath, false);
        }

        public static Handlers.ViewBase CopyViewLocal(string listPath, string viewPath, bool setAsDefault)
        {
            if (string.IsNullOrEmpty(listPath))
                throw new ArgumentNullException("listPath");
            if (string.IsNullOrEmpty(viewPath))
                throw new ArgumentNullException("viewPath");

            var viewName = RepositoryPath.GetFileNameSafe(viewPath);
            var viewsFolderPath = RepositoryPath.Combine(listPath, ViewManager.VIEWSFOLDERNAME);
            var views = Content.Load(viewsFolderPath) ?? RepositoryTools.CreateStructure(viewsFolderPath, "SystemFolder");
            var viewsGc = views != null ? views.ContentHandler as GenericContent : null;

            // set at least the ListView type as allowed content type
            if (viewsGc != null && viewsGc.GetAllowedChildTypes().Count() == 0)
            {
                using (new SystemAccount())
                {
                    viewsGc.AllowedChildTypes = new[] { ContentType.GetByName("ListView") };
                    viewsGc.Save(SavingMode.KeepVersion); 
                }
            }

            Node.Copy(viewPath, viewsFolderPath);

            var localView = Node.Load<Handlers.ViewBase>(RepositoryPath.Combine(viewsFolderPath, viewName));

            if (setAsDefault)
            {
                var cl = Node.Load<ContentList>(listPath);
                if (cl != null)
                {
                    cl.DefaultView = viewName;
                    cl.Save();
                }
            }

            return localView;
        }

        // =================================================================== IViewManager Members

        void IViewManager.AddToDefaultView(FieldSetting fieldSetting, ContentList contentList)
        {
            AddToDefaultView(fieldSetting, contentList);
        }
        void IViewManager.RemoveFieldFromViews(FieldSetting fieldSetting, ContentList contentList)
        {
            RemoveFieldFromViews(fieldSetting, contentList);
        }
    }
}
