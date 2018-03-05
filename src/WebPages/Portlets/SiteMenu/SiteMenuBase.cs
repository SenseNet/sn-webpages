using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Web.UI.WebControls.WebParts;
using System.Xml.Serialization;
using System.Xml.XPath;
using System.Xml.Xsl;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Storage;
using SenseNet.ContentRepository.Storage.Search;
using SenseNet.ContentRepository.Storage.Security;
using SenseNet.Portal.UI.PortletFramework;
using SenseNet.Portal.Virtualization;
using System.Web.UI;
using SenseNet.Diagnostics;
using SenseNet.Search;
using SenseNet.Search.Querying;

namespace SenseNet.Portal.Portlets
{
    public static class ObjectExtensions
    {
        public static XPathNavigator ToXPathNavigator(this object obj)
        {
            var serializer = new XmlSerializer(obj.GetType());
            var ms = new MemoryStream();
            serializer.Serialize(ms, obj); 
            ms.Position = 0;
            var doc = new XPathDocument(ms);

            return doc.CreateNavigator();
        }
    }

    public abstract class SiteMenuBase : ContextBoundPortlet
    {
        private const string SiteMenuBaseClass = "SiteMenuBase";

        #region Properties
        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(SiteMenuBaseClass, "Prop_Depth_DisplayName")]
        [LocalizedWebDescription(SiteMenuBaseClass, "Prop_Depth_Description")]
        [DefaultValue(1)]
        [WebCategory(EditorCategory.SiteMenu, EditorCategory.SiteMenu_Order)]
        [WebOrder(10)]
        public int Depth { get; set; }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(SiteMenuBaseClass, "Prop_ShowHiddenPages_DisplayName")]
        [LocalizedWebDescription(SiteMenuBaseClass, "Prop_ShowHiddenPages_Description")]
        [DefaultValue(false)]
        [WebCategory(EditorCategory.SiteMenu, EditorCategory.SiteMenu_Order)]
        [WebOrder(20)]
        public bool ShowHiddenPages { get; set; }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(SiteMenuBaseClass, "Prop_ShowTypeNames_DisplayName")]
        [LocalizedWebDescription(SiteMenuBaseClass, "Prop_ShowTypeNames_Description")]
        [WebCategory(EditorCategory.SiteMenu, EditorCategory.SiteMenu_Order)]
        [WebOrder(30)]
        public string ShowTypeNames { get; set; }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(SiteMenuBaseClass, "Prop_ShowPagesOnly_DisplayName")]
        [LocalizedWebDescription(SiteMenuBaseClass, "Prop_ShowPagesOnly_Description")]
        [DefaultValue(true)]
        [WebCategory(EditorCategory.SiteMenu, EditorCategory.SiteMenu_Order)]
        [WebOrder(40)]
        public bool ShowPagesOnly { get; set; }

        [WebBrowsable(false)]
        [Personalizable(true)]
        [DefaultValue(true)]
        [Obsolete("Use OmitContextNode instead")]
        public bool EmitContextNode { get; set; }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(SiteMenuBaseClass, "Prop_OmitContextNode_DisplayName")]
        [LocalizedWebDescription(SiteMenuBaseClass, "Prop_OmitContextNode_Description")]
        [DefaultValue(true)]
        [WebCategory(EditorCategory.SiteMenu, EditorCategory.SiteMenu_Order)]
        [WebOrder(50)]
        public bool OmitContextNode { get; set; }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(SiteMenuBaseClass, "Prop_ExpandToContext_DisplayName")]
        [LocalizedWebDescription(SiteMenuBaseClass, "Prop_ExpandToContext_Description")]
        [DefaultValue(true)]
        [WebCategory(EditorCategory.SiteMenu, EditorCategory.SiteMenu_Order)]
        [WebOrder(60)]
        public bool ExpandToContext { get; set; }
             
        private bool _loadFullTree = true;

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(SiteMenuBaseClass, "Prop_LoadFullTree_DisplayName")]
        [LocalizedWebDescription(SiteMenuBaseClass, "Prop_LoadFullTree_Description")]
        [DefaultValue(true)]
        [WebCategory(EditorCategory.SiteMenu, EditorCategory.SiteMenu_Order)]
        [WebOrder(70)]
        public bool LoadFullTree
        {
            get { return _loadFullTree; }
            set { _loadFullTree = value; }
        }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(SiteMenuBaseClass, "Prop_GetContextChildren_DisplayName")]
        [LocalizedWebDescription(SiteMenuBaseClass, "Prop_GetContextChildren_Description")]
        [DefaultValue(true)]
        [WebCategory(EditorCategory.SiteMenu, EditorCategory.SiteMenu_Order)]
        [WebOrder(80)]
        public bool GetContextChildren { get; set; }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(SiteMenuBaseClass, "Prop_PortletCssClass_DisplayName")]
        [LocalizedWebDescription(SiteMenuBaseClass, "Prop_PortletCssClass_Description")]
        [WebCategory(EditorCategory.SiteMenu, EditorCategory.SiteMenu_Order)]
        [WebOrder(90)]
        public string PortletCssClass { get; set; }

        [LocalizedWebDisplayName(SiteMenuBaseClass, "Prop_QueryFilter_DisplayName")]
        [LocalizedWebDescription(SiteMenuBaseClass, "Prop_QueryFilter_Description")]
        [WebBrowsable(true), Personalizable(true)]
        [WebCategory(EditorCategory.SiteMenu, EditorCategory.SiteMenu_Order)]
        [Editor(typeof(QueryBuilderEditorPartField), typeof(IEditorPartField))]
        [QueryBuilderEditorPartOptions(TextEditorCommonType.MiddleSize)]
        [WebOrder(100)]
        public string QueryFilter { get; set; }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(PORTLETFRAMEWORK_CLASSNAME, RENDERER_DISPLAYNAME)]
        [LocalizedWebDescription(PORTLETFRAMEWORK_CLASSNAME, RENDERER_DESCRIPTION)]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(1000)]
        [Editor(typeof(ViewPickerEditorPartField), typeof(IEditorPartField))]
        [ContentPickerEditorPartOptions(PortletViewType.Xslt)]
        public override string Renderer
        {
            get
            {
                return base.Renderer;
            }
            set
            {
                base.Renderer = value;
            }
        }

        protected NavigableNodeFeed Feed { get; set; }

        #endregion

        protected override XsltArgumentList GetXsltArgumentList()
        {
            var arguments = base.GetXsltArgumentList() ?? new XsltArgumentList();
            new[] 
                {
                    new {Name = "CurrentSite" , Value = (object)PortalContext.Current.Site as Node},
                    new {Name = "CurrentPage" , Value = (object)PortalContext.Current.Page as Node},
                    new {Name = "CurrentUser" , Value = (object)User.Current as Node },
                    new {Name = "CurrentContext" , Value = (object)PortalContext.Current.ContextNode as Node }
                }.Select(node =>
                {
                    arguments.AddParam(node.Name, string.Empty,
                        new SenseNet.Services.ContentStore.Content(node.Value).ToXPathNavigator());
                    return true;
                }).ToArray();

            new[]
                    {
                     new { Namespace = "urn:sn:hu", Value = (object)new NodeQueryXsltProxy() },
                     new { Namespace = "sn://SenseNet.ContentRepository.i18n.ResourceXsltClient", Value = (object)new ResourceXsltClient() }
                    }.Select(ext =>
                    {
                        arguments.AddExtensionObject(ext.Namespace, ext.Value); return true;
                    }
              ).ToArray();
            return arguments;
        }
        private string[] _typeNames;
        private bool _typesInitialized;

        private string[] TypeNames
        {
            get
            {
                if (!_typesInitialized)
                {
                    if (!string.IsNullOrEmpty(ShowTypeNames))
                        _typeNames = ShowTypeNames.Split(new[] { ',' }).Select(s => s.Trim()).ToArray();
                    _typesInitialized = true;
                }
                return _typeNames;
            }
        }
        
        protected override object GetModel()
        {
            if (Feed == null)
            {
                if (BindTarget == BindTarget.Breadcrumb)
                    Feed = ConvertNodesToFeed(GetParentsNodes());
                else
                    Feed = ConvertNodesToFeed(GetNavigableNodes());
                Feed.PortletCssClass = String.IsNullOrEmpty(PortletCssClass) ? "sn-menu" : PortletCssClass;
            }

            return Feed;
        }

        protected virtual Node[] GetParentsNodes()
        {
            var nodeList = new List<Node>();
            var current = GetBindingRoot();
            while (current != null)
            {
                Node page;
                if (ShowPagesOnly)
                    page = current as Page;
                else
                    page = current as GenericContent;
                if (page != null)
                    nodeList.Add(current);
                current = current.Parent; //TODO: Consider elevated mode
            }
            return nodeList.ToArray();
        }

        internal class TempControl : UserControl
        {
            public NavigableNodeFeed Feed { get; set; }
            protected override void Render(HtmlTextWriter writer)
            {
                Feed.Render(writer);
            }            
        }

        protected override void CreateChildControls()
        {
            if (CanCache && Cacheable && IsInCache)
                return;

            base.CreateChildControls();

            NavigableNodeFeed feed = null;

            try
            {
                feed = GetModel() as NavigableNodeFeed;
            }
            catch (Exception ex)
            {
                this.RenderException = ex;
                this.HasError = true;
            }

            if (feed != null)
            {
                this.Controls.Add(new TempControl { Feed = feed });
            }

        }

        protected virtual Node[] GetNavigableNodes()
        {
            var depth = Depth > 0 ? (OmitContextNode ? Depth + 1 : Depth) : 3;
            var enumeratorContext = LoadFullTree ? null : PortalContext.Current.ContextNodePath;

            if (ContextNode == null)
                return new Node[0];

            try
            {
                IEnumerable<Node> nodes = null;
                if (!string.IsNullOrEmpty(this.QueryFilter))
                {
                    nodes = SiteMenuNodeEnumerator.GetNodes(ContextNode.Path, ExecutionHint.None, this.QueryFilter, depth,
                                                            enumeratorContext, GetContextChildren).ToList();
                }
                else
                {
                    nodes = SiteMenuNodeEnumerator.GetNodes(ContextNode.Path, ExecutionHint.None, GetQuery(), depth,
                                                            enumeratorContext, GetContextChildren).ToList();
                }

                return nodes.Where(node => NodeIsValid(node)).ToArray();   
            }
            catch (Exception ex)
            {
                SnLog.WriteException(ex);
                return new Node[0];
            }
        }

        private static bool PathIsTopLevel(string p, string[] allp)
        {
            return allp.Count(path => p != path && p.StartsWith(path)) == 0;
        }

        protected virtual NavigableNodeFeed ConvertNodesToFeed(Node[] nodes)
        {
            var allPaths = nodes.Select(node => node.Path).ToArray();
            var topPaths = allPaths.Where(path => PathIsTopLevel(path, allPaths)).ToArray();
            var relativeRoots = nodes.Where(node => topPaths.Contains(node.Path)).ToArray();
            var treeNodes = relativeRoots.Select((node, index) => BuildUpTreeNodes(node, nodes, index, 0))
                .OrderBy(node => node.Index).ToArray();

            if (OmitContextNode && treeNodes.Count() > 0)
                treeNodes = treeNodes[0].Nodes;

            return new NavigableNodeFeed { Nodes = treeNodes };
        }

        protected virtual NavigableTreeNode BuildUpTreeNodes(Node relativeParent, Node[] allItems, int index, int level)
        {
            var sitePath = PortalContext.Current.Site == null ? null : PortalContext.Current.Site.Path;
            var contextNodePath = PortalContext.Current.ContextNodePath;

            if (string.IsNullOrEmpty(sitePath))
                throw new InvalidOperationException("Site cannot be null.");

            if (string.IsNullOrEmpty(contextNodePath))
                throw new InvalidOperationException("Context node cannot be null.");

            var treeNode = new NavigableTreeNode(relativeParent, sitePath, contextNodePath)
                {
                    Level = level,
                    PhysicalIndex = index + 1
                };

            treeNode.Nodes =
                allItems.Where(node => ((node != null) && node.ParentId == relativeParent.Id)).ToArray().
                    OrderBy(node => node.Index).
                    Select((node, idx) => BuildUpTreeNodes(node, allItems, idx, level + 1)
                    ).ToArray();

            if (treeNode.Nodes.Length > 0)
            {
                treeNode.Nodes[0].IsFirst = true;
                treeNode.Nodes[treeNode.Nodes.Length - 1].IsLast = true;
            }

            return treeNode;
        }

        protected virtual string GetQuery()
        {
            return ShowPagesOnly ? $"+TypeIs:{typeof(Page).Name} .SORT:Index" : null;
        }

        private static string ParentPath(string path)
        {
            return path.Substring(0, path.LastIndexOf('/'));
        }

        private static bool IsSiblingPath(string path1, string path2)
        {
            return ParentPath(path1).Equals(ParentPath(path2));
        }

        private static IEnumerable<string> GetPathCollection(string path)
        {
            var pathItems = path.Split('/');
            for (var i = 1; i < pathItems.Length; i++)
            {
                yield return String.Join("/", pathItems, 0, i + 1);
            }
        }

        protected virtual bool NodeIsValid(Node node)
        {
            if (node == null || node.Name == "(apps)") 
                return false;
            if (TypeNames != null && !TypeNames.Contains(node.NodeType.Name))
                return false;
            var contentNode = node as GenericContent;

            try
            {
                if (!ShowHiddenPages && ((contentNode != null) && contentNode.Hidden))
                    return false;
            }
            catch (InvalidOperationException)
            {
                // "Invalid property access attempt"
                // The user has only See permission for this node. Changing to Admin account does not 
                // help either, because the node is 'head only' and accessing any of its properties 
                // will throw an invalidoperation exception anyway.
                return false;
            }

            if (ExpandToContext)
            {
                var pathCollection = GetPathCollection(PortalContext.Current.Page.Path).ToList().
                    Union(GetPathCollection(ContextNode.Path)).
                    Union(GetPathCollection(PortalContext.Current.ContextNodePath)).
                    ToArray();

                foreach (var path in pathCollection)
                {
                    if (node.Path.Equals(path) || IsSiblingPath(path, node.Path))
                    {
                        return true;
                    }
                }

                if (GetContextChildren)
                {
                    var parentPath = RepositoryPath.GetParentPath(node.Path);
                    if (parentPath.Equals(PortalContext.Current.ContextNodePath) ||
                        parentPath.Equals(ContextNode.Path))
                        return true;
                }

                return false;
            }

            return true;
        }
    }
}
