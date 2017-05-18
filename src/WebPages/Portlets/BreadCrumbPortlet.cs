using System;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls.WebParts;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.i18n;
using SenseNet.ContentRepository.Storage;
using SenseNet.Portal.UI;
using SenseNet.Portal.UI.PortletFramework;
using SenseNet.Portal.Virtualization;
using SNP = SenseNet.Portal;
using System.Collections.Generic;
using SenseNet.ContentRepository.Storage.Security;
using System.Linq;

namespace SenseNet.Portal.Portlets
{
    public enum StartBindTarget { Root, CurrentSite, CurrentWorkspace, CurrentList }

    public class BreadCrumbPortlet : ContextBoundPortlet
    {
        private const string BreadCrumbPortletClass = "BreadCrumbPortlet";

        // Constructor ////////////////////////////////////////////////////////////

        public BreadCrumbPortlet()
        {
            this.Name = "$BreadCrumbPortlet:PortletDisplayName";
            this.Description = "$BreadCrumbPortlet:PortletDescription";
            this.Category = new PortletCategory(PortletCategoryType.Navigation);

            // maybe Renderer property will be resurrected later when the portlet html will be customizable
            this.HiddenProperties.Add("Renderer");
        }

        // Members and properties /////////////////////////////////////////////////
        private string _separator = " / ";
        private string _linkCssClass = string.Empty;
        private string _itemCssClass = string.Empty;
        private string _separatorCssClass = string.Empty;
        private string _activeItemCssClass = string.Empty;
        private bool _showSite = false;
        private string _siteDisplayName = string.Empty;
        private List<Node> _pathNodeList;

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(BreadCrumbPortletClass, "Prop_ItemCssClass_DisplayName")]
        [LocalizedWebDescription(BreadCrumbPortletClass, "Prop_ItemCssClass_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(100)]
        public string ItemCssClass
        {
            get { return _itemCssClass; }
            set { _itemCssClass = value; }
        }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(BreadCrumbPortletClass, "Prop_LinkCssClass_DisplayName")]
        [LocalizedWebDescription(BreadCrumbPortletClass, "Prop_LinkCssClass_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(110)]
        public string LinkCssClass
        {
            get { return _linkCssClass; }
            set { _linkCssClass = value; }
        }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(BreadCrumbPortletClass, "Prop_SeparatorCssClass_DisplayName")]
        [LocalizedWebDescription(BreadCrumbPortletClass, "Prop_SeparatorCssClass_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(120)]
        public string SeparatorCssClass
        {
            get { return _separatorCssClass; }
            set { _separatorCssClass = value; }
        }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(BreadCrumbPortletClass, "Prop_Separator_DisplayName")]
        [LocalizedWebDescription(BreadCrumbPortletClass, "Prop_Separator_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(130)]
        public string Separator
        {
            get { return _separator; }
            set { _separator = value; }
        }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(BreadCrumbPortletClass, "Prop_ActiveItemCssClass_DisplayName")]
        [LocalizedWebDescription(BreadCrumbPortletClass, "Prop_ActiveItemCssClass_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(140)]
        public string ActiveItemCssClass
        {
            get { return _activeItemCssClass; }
            set { _activeItemCssClass = value; }
        }

        private StartBindTarget _startBindTarget = StartBindTarget.CurrentSite;
        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(BreadCrumbPortletClass, "Prop_StartBindTarget_DisplayName")]
        [LocalizedWebDescription(BreadCrumbPortletClass, "Prop_StartBindTarget_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(150)]
        [Obsolete("Use BindTarget instead")]
        public StartBindTarget StartBindTarget
        {
            get { return _startBindTarget; }
            set { _startBindTarget = value; }
        }

        [WebBrowsable(false)]
        [Personalizable(true)]
        [Obsolete("Only for backward compatibility. Use ShowFirstElement instead.")]
        public bool ShowSite
        {
            get { return _showSite; }
            set { _showSite = value; }
        }

        [WebBrowsable(false)]
        [Personalizable(true)]
        [Obsolete("Only for backward compatibility. Use FirstDisplayName instead.")]
        public string SiteDisplayName
        {
            get { return _siteDisplayName; }
            set { _siteDisplayName = value; }
        }

        private bool? _showFirstElement;
        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(BreadCrumbPortletClass, "Prop_ShowFirstElement_DisplayName")]
        [LocalizedWebDescription(BreadCrumbPortletClass, "Prop_ShowFirstElement_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(160)]
        public bool ShowFirstElement
        {
            get { return _showFirstElement.HasValue ? _showFirstElement.Value : _showSite; }
            set { _showFirstElement = value; }
        }

        private string _firstDisplayName;
        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(BreadCrumbPortletClass, "Prop_FirstDisplayName_DisplayName")]
        [LocalizedWebDescription(BreadCrumbPortletClass, "Prop_FirstDisplayName_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(170)]
        public string FirstDisplayName
        {
            get { return _firstDisplayName == null ? _siteDisplayName : _firstDisplayName; }
            set { _firstDisplayName = value; }
        }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(BreadCrumbPortletClass, "Prop_CurrentElementAsLink_DisplayName")]
        [LocalizedWebDescription(BreadCrumbPortletClass, "Prop_CurrentElementAsLink_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(180)]
        public bool CurrentElementAsLink { get; set; }


        // Events /////////////////////////////////////////////////////////////////
        protected override void RenderContents(HtmlTextWriter writer)
        {
            if (ShowExecutionTime)
                Timer.Start();

            RenderContentsInternal(writer);

            if (ShowExecutionTime)
                Timer.Stop();

            base.RenderContents(writer);
        }

        // Internals //////////////////////////////////////////////////////////////

        protected override Node GetBindingRoot()
        {
            var node = GetBindingRootPrivate();
            if (node != null)
                return node;
            return Repository.Root;
        }

        private void RenderContentsInternal(HtmlTextWriter writer)
        {
            if (ContextNode != null)
            {
                RenderBreadCrumbItems(writer);
            }
            else if (this.RenderException != null)
            {
                writer.Write(String.Concat(String.Concat("Portlet Error: ", this.RenderException.Message), this.RenderException.InnerException == null ? string.Empty : this.RenderException.InnerException.Message));
            }
        }

        private static string[] EmptyNodeTypeBlacklistNames = new string[0];
        private string[] GetBlacklist()
        {
            return Settings.GetValue<string[]>(PortalSettings.SETTINGSNAME, "BreadCrumbBlackList", ContextNode.Path, EmptyNodeTypeBlacklistNames);
        }
        protected virtual List<Node> GetParentsNodes()
        {
            var pathNodeList = new List<Node>();
            var current = PortalContext.Current.ContextNode;

            var nodeTypeBlacklistNames = GetBlacklist();

            while (current != null)
            {
                if (!nodeTypeBlacklistNames.Any(nt => nt == current.NodeType.Name))
                    pathNodeList.Add(current);

                if (IsReachedEndpoint(current))
                {
                    current = null;
                }
                else
                {
                    var parentHead = NodeHead.Get(current.ParentId);
                    current = (SecurityHandler.HasPermission(parentHead, PermissionType.See, PermissionType.Open)) ? current.Parent : null;
                }
            }

            return pathNodeList;
        }

        private void RenderBreadCrumbItems(HtmlTextWriter writer)
        {
            bool first = true;
            if (_pathNodeList != null && _pathNodeList.Count > 0)
            {
                for (int i = _pathNodeList.Count - 1; i >= 0; i--)
                {
                    var isLink = i > 0 | CurrentElementAsLink;

                    var currentNode = _pathNodeList[i];
                    var currentContent = Content.Create(currentNode);

                    string displayName = currentNode is GenericContent ? currentContent.DisplayName : currentNode.Name;

                    if (first && ShowFirstElement)
                    {
                        first = false;
                        if ((currentContent.Id != Repository.Root.Id) && !string.IsNullOrEmpty(FirstDisplayName))
                            displayName = FirstDisplayName;
                    }

                    var pageHref = SenseNet.ApplicationModel.ActionFramework.GetActionUrl(currentNode.Path, "Browse");

                    RenderBreadCrumbItems(writer, pageHref, displayName, isLink);

                    if (i == 0)
                        continue;

                    writer.Write(string.Format("<span class='{0}'>", SeparatorCssClass));
                    writer.WriteEncodedText(Separator);
                    writer.Write("</span>");
                }
            }
        }

        private static string ProcessUrl(string url)
        {
            return url.Contains("/") ? url.Substring(url.IndexOf('/')) : url;
        }

        private void RenderBreadCrumbItems(HtmlTextWriter writer, string href, string menuText, bool renderLink)
        {
            var isEditor = PortalContext.Current.IsResourceEditorAllowed && SenseNetResourceManager.IsEditorMarkup(menuText);
            var text = UITools.GetSafeText(menuText);

            if (renderLink && !isEditor)
                writer.Write(string.Format("<a class=\"{0} {1}\" href=\"{2}\"><span>{3}</span></a>", ItemCssClass,
                                           LinkCssClass, href, text));
            else
                writer.Write(string.Format("<span class=\"{0} {1}\"><span>{2}</span></span>", ItemCssClass,
                                           ActiveItemCssClass, text));
        }

        protected override void CreateChildControls()
        {
            if (ShowExecutionTime)
                Timer.Start();

            // Later some point this should triggered from a GetModel method with ascx rendering support;
            _pathNodeList = GetParentsNodes();

            base.CreateChildControls();

            if (ShowExecutionTime)
                Timer.Stop();
        }

        private Node GetStartBindingRoot()
        {
            switch (BindTarget)
            {
                case BindTarget.CurrentSite:
                    return SNP.Site.GetSiteByNode(PortalContext.Current.ContextNode);
                case BindTarget.CurrentPage:
                    return SNP.Page.Current;
                case BindTarget.CurrentUser:
                    return HttpContext.Current.User.Identity as User;
                case BindTarget.CustomRoot:
                    return Node.LoadNode(this.CustomRootPath);
                case BindTarget.CurrentStartPage:
                    return PortalContext.Current.Site?.StartPage ?? PortalContext.Current.Site;
                case BindTarget.Breadcrumb:
                case BindTarget.CurrentContent:
                    return PortalContext.Current.ContextNode ?? Repository.Root;
                case BindTarget.CurrentWorkspace:
                    return PortalContext.Current.ContextWorkspace ?? PortalContext.Current.Site;
                case BindTarget.CurrentList:
                    return PortalContext.Current.ContentList;
                case BindTarget.Unselected:
                default:
                    return null;
            }
        }

        private bool IsReachedEndpoint(Node current)
        {
            if (current.ParentId == 0)
                return true;
            if (!SecurityHandler.HasPermission(current.ParentId, PermissionType.See))
                return true;

            var endPoint = GetStartBindingRoot();
            if (endPoint != null)
                if ((!ShowFirstElement && current.Parent.Id == endPoint.Id) ||
                          (ShowFirstElement && endPoint.Id == current.Id))
                    return true;

            return false;
        }

    }
}