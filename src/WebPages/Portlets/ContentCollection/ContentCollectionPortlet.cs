using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Web.UI.WebControls;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Search;
using SenseNet.ContentRepository.Storage;
using SenseNet.ContentRepository.Storage.Schema;
using SenseNet.ContentRepository.Storage.Security;
using SenseNet.Portal;
using SenseNet.Portal.UI.PortletFramework;
using System.Xml.Xsl;
using SenseNet.Search;
using Content = SenseNet.ContentRepository.Content;
using SenseNet.Diagnostics;
using System.Web.UI;
using System.Web.UI.WebControls.WebParts;
using System.Web;
using System.Xml.XPath;
using SenseNet.Portal.Virtualization;
using SenseNet.ContentRepository.Storage.Search;
using SenseNet.Search.Querying;

namespace SenseNet.Portal.Portlets
{
    public enum CollectionAxisMode
    {
        Children = 0,
        ReferenceProperty = 1,
        VersionHistory = 2,
        External = 4
    }

    public class ContentCollectionPortlet : ContextBoundPortlet
    {
        private const string ContentCollectionPortletClass = "ContentCollectionPortlet";

        public string PortletHash
        {
            get
            {
                return Math.Abs((PortalContext.Current.ContextNodePath + ID).GetHashCode()).ToString();
            }
        }

        public const string ContentListID = "ContentList";
        // Properties /////////////////////////////////////////////////////////
        #region Properties

        [LocalizedWebDisplayName(ContentCollectionPortletClass, "Prop_CustomPortletKey_DisplayName"), LocalizedWebDescription(ContentCollectionPortletClass, "Prop_CustomPortletKey_Description")] 
        [WebBrowsable(true), Personalizable(true)]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order), WebOrder(1200)]
        public string CustomPortletKey { get; set; }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ContentCollectionPortletClass, "Prop_CollectionAxis_DisplayName")]
        [LocalizedWebDescription(ContentCollectionPortletClass, "Prop_CollectionAxis_Description")]
        [WebCategory(EditorCategory.Collection, EditorCategory.Collection_Order), WebOrder(10)]
        public CollectionAxisMode CollectionAxis { get; set; }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ContentCollectionPortletClass, "Prop_ReferenceAxisName_DisplayName")]
        [LocalizedWebDescription(ContentCollectionPortletClass, "Prop_ReferenceAxisName_Description")]
        [WebCategory(EditorCategory.Collection, EditorCategory.Collection_Order), WebOrder(20)]
        public string ReferenceAxisName { get; set; }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ContentCollectionPortletClass, "Prop_UriParameterName_DisplayName")]
        [LocalizedWebDescription(ContentCollectionPortletClass, "Prop_UriParameterName_Description")]
        [WebCategory(EditorCategory.Collection, EditorCategory.Collection_Order), WebOrder(30)]
        public string UriParameterName { get; set; }

        [LocalizedWebDisplayName(ContentCollectionPortletClass, "Prop_AllChildren_DisplayName")]
        [LocalizedWebDescription(ContentCollectionPortletClass, "Prop_AllChildren_Description")]
        [WebBrowsable(true), Personalizable(true)]
        [WebCategory(EditorCategory.Collection, EditorCategory.Collection_Order), WebOrder(40)]
        public bool AllChildren { get; set; }

        [LocalizedWebDisplayName(ContentCollectionPortletClass, "Prop_QueryFilter_DisplayName")]
        [LocalizedWebDescription(ContentCollectionPortletClass, "Prop_QueryFilter_Description")]
        [WebBrowsable(true), Personalizable(true)]
        [WebCategory(EditorCategory.Collection, EditorCategory.Collection_Order), WebOrder(50)]
        [Editor(typeof(QueryBuilderEditorPartField), typeof(IEditorPartField))]
        [QueryBuilderEditorPartOptions(TextEditorCommonType.MiddleSize)]
        public string QueryFilter { get; set; }

        [LocalizedWebDisplayName(ContentCollectionPortletClass, "Prop_SortBy_DisplayName"), LocalizedWebDescription(ContentCollectionPortletClass, "Prop_SortBy_Description")]
        [WebBrowsable(true), Personalizable(true)]
        [WebCategory(EditorCategory.Collection, EditorCategory.Collection_Order), WebOrder(60)]
        public string SortBy { get; set; }

        [LocalizedWebDisplayName(ContentCollectionPortletClass, "Prop_SortDescending_DisplayName"), LocalizedWebDescription(ContentCollectionPortletClass, "Prop_SortDescending_Description")]
        [WebBrowsable(true), Personalizable(true)]
        [WebCategory(EditorCategory.Collection, EditorCategory.Collection_Order), WebOrder(70)]
        public bool SortDescending { get; set; }

        [LocalizedWebDisplayName(ContentCollectionPortletClass, "Prop_PagingEnabled_DisplayName"), LocalizedWebDescription(ContentCollectionPortletClass, "Prop_PagingEnabled_Description")]
        [WebBrowsable(true), Personalizable(true)]
        [WebCategory(EditorCategory.Collection, EditorCategory.Collection_Order), WebOrder(80)]
        public bool PagingEnabled { get; set; }

        [LocalizedWebDisplayName(ContentCollectionPortletClass, "Prop_ShowPagerControl_DisplayName"), LocalizedWebDescription(ContentCollectionPortletClass, "Prop_ShowPagerControl_Description")]
        [WebBrowsable(true), Personalizable(true)]
        [WebCategory(EditorCategory.Collection, EditorCategory.Collection_Order), WebOrder(90)]
        public bool ShowPagerControl { get; set; }

        [LocalizedWebDisplayName(ContentCollectionPortletClass, "Prop_Top_DisplayName"), LocalizedWebDescription(ContentCollectionPortletClass, "Prop_Top_Description")]
        [WebBrowsable(true), Personalizable(true)]
        [WebCategory(EditorCategory.Collection, EditorCategory.Collection_Order), WebOrder(100)]
        public int Top { get; set; }

        [LocalizedWebDisplayName(ContentCollectionPortletClass, "Prop_SkipFirst_DisplayName")]
        [LocalizedWebDescription(ContentCollectionPortletClass, "Prop_SkipFirst_Description")]
        [WebBrowsable(true), Personalizable(true)]
        [WebCategory(EditorCategory.Collection, EditorCategory.Collection_Order), WebOrder(110)]
        public int SkipFirst { get; set; }

        [LocalizedWebDisplayName(ContentCollectionPortletClass, "Prop_EnableAutofilters_DisplayName")]
        [LocalizedWebDescription(ContentCollectionPortletClass, "Prop_EnableAutofilters_Description")]
        [WebBrowsable(true), Personalizable(true)]
        [WebCategory(EditorCategory.Collection, EditorCategory.Collection_Order), WebOrder(120)]
        public FilterStatus EnableAutofilters { get; set; }

        [LocalizedWebDisplayName(ContentCollectionPortletClass, "Prop_EnableLifespanFilter_DisplayName")]
        [LocalizedWebDescription(ContentCollectionPortletClass, "Prop_EnableLifespanFilter_Description")]
        [WebBrowsable(true), Personalizable(true)]
        [WebCategory(EditorCategory.Collection, EditorCategory.Collection_Order), WebOrder(130)]
        public FilterStatus EnableLifespanFilter { get; set; }

        [LocalizedWebDisplayName(ContentCollectionPortletClass, "Prop_VisibleFields_DisplayName")]
        [LocalizedWebDescription(ContentCollectionPortletClass, "Prop_VisibleFields_Description")]
        [WebBrowsable(true), Personalizable(true)]
        [WebCategory(EditorCategory.Collection, EditorCategory.Collection_Order), WebOrder(140)]
        [Editor(typeof(TextEditorPartField), typeof(IEditorPartField))]
        [TextEditorPartOptions(TextEditorCommonType.MiddleSize)]
        public string VisibleFields { get; set; }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(PORTLETFRAMEWORK_CLASSNAME, RENDERER_DISPLAYNAME)]
        [LocalizedWebDescription(PORTLETFRAMEWORK_CLASSNAME, RENDERER_DESCRIPTION)]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(1000)]
        [Editor(typeof(ViewPickerEditorPartField), typeof(IEditorPartField))]
        [ContentPickerEditorPartOptions(PortletViewType.All)]
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

        #endregion


        public string[] VisisbleFieldNames
        {
            get
            {
                if (string.IsNullOrEmpty(VisibleFields))
                    return new string[] { };
                var vals = VisibleFields.Split(new[] { ',' });
                var result = vals.Select(s => s.Trim()).ToArray();
                return result;
            }
        }


        private List<Node> requestNodeList;
        public List<Node> RequestNodeList
        {
            get
            {
                return requestNodeList ??
                       (requestNodeList = RequestIdList.Count > 0 ? Node.LoadNodes(RequestIdList) : new List<Node>());
            }
        }

        private List<int> requestIdList;
        public List<int> RequestIdList
        {
            get
            {
                // collection's nodeid list comes from url
                if (requestIdList == null)
                {
                    var idList = new List<int>();
                    if (String.IsNullOrEmpty(UriParameterName))
                        return requestIdList = idList;

                    try
                    {
                        var ids = Page.Request[UriParameterName];
                        if (string.IsNullOrEmpty(ids))
                            return requestIdList = idList;

                        foreach (var idString in ids.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries))
                        {
                            int nodeId;
                            if (int.TryParse(idString, out nodeId) && nodeId != 0)
                                idList.Add(nodeId);
                        }
                    }
                    catch (Exception ex)
                    {
                        // likely a request error
                        SnLog.WriteException(ex);
                    }

                    requestIdList = idList.Distinct().ToList();
                }

                return requestIdList;
            }
        }

        // Constructors ///////////////////////////////////////////////////
        public ContentCollectionPortlet()
        {
            Name = "$ContentCollectionPortlet:PortletDisplayName";
            Description = "$ContentCollectionPortlet:PortletDescription";
            Category = new PortletCategory(PortletCategoryType.Collection);

            // remove the xml/xslt fields from the hidden collection
            this.HiddenProperties.RemoveAll(s => XmlFields.Contains(s));

            Cacheable = true;       // by default, any contentcollection portlet is cached (for visitors)
            CacheByParams = true;   // by default, params are also included -> this is useful for collections with paging
        }

        internal string GetPortletSpecificParamName(string paramName)
        {
            if (string.IsNullOrEmpty(this.CustomPortletKey))
                return PortletHash + "@" + paramName;
            else
                return this.CustomPortletKey + "@" + paramName;
        }

        public string GetPropertyActionUrlPart(string paramName, string paramValue)
        {
            var result = GetPortletSpecificParamName(paramName) + "=" + paramValue;
            return result;
        }

        private bool GetIntFromRequest(string paramName, out int value)
        {
            value = 0;

            if (!Page.Request.Params.AllKeys.Contains(paramName))
                return false;
            var svalue = Page.Request.Params[paramName];
            return !string.IsNullOrEmpty(svalue) && int.TryParse(svalue, out value);
        }
        // Methods /////////////////////////////////////////////////////////

        protected override void PrepareXsltRendering(object model)
        {
            var c = model as Content;
            if (c != null)
                c.ChildrenDefinition.AllChildren = AllChildren;
        }
        protected override object SerializeModel(object model)
        {
            var fc = model as FeedContent;
            switch (CollectionAxis)
            {
                case CollectionAxisMode.Children:
                    if (fc != null)
                        return fc.GetXml(true, this.GetContentSerializationOptions());
                    break;
                case CollectionAxisMode.VersionHistory:
                    if (fc != null)
                        return fc.GetXml(options: this.GetContentSerializationOptions());
                    break;
                case CollectionAxisMode.ReferenceProperty:
                    if (fc != null)
                        return fc.GetXml(ReferenceAxisName, this.GetContentSerializationOptions());
                    break;
                case CollectionAxisMode.External:
                    if (fc != null)
                        return fc.GetXml(true, this.GetContentSerializationOptions());
                    break;
            }
            return null;
        }

        protected override void RenderWithAscx(HtmlTextWriter writer)
        {
            base.RenderContents(writer);
        }

        private ContentCollectionPortletState _state;

        public virtual ContentCollectionPortletState State
        {

            get
            {
                if (_state == null)
                {
                    PortletState state;
                    if (PortletState.Restore(this, out state))
                    {
                        _state = state as ContentCollectionPortletState;
                    }
                    else
                    {
                        _state = new ContentCollectionPortletState(this) {Portlet = this};
                    }
                    _state.CollectValues();
                    HttpContext.Current.Session[_state.Portlet.ID] = _state;

                }
                return _state;
            }
        }

        protected override object GetModel()
        {
            if (ContextNode == null)
                return null;

            var content = Content.Create(ContextNode);

            var cdef = content.ChildrenDefinition;
            if (EnableAutofilters != FilterStatus.Default)
                cdef.EnableAutofilters = EnableAutofilters;
            if (EnableLifespanFilter != FilterStatus.Default)
                cdef.EnableLifespanFilter = EnableLifespanFilter;
            if (Top > 0)
                cdef.Top = Top;
            if (State.Skip > 0)
                cdef.Skip = State.Skip;
            if (!string.IsNullOrEmpty(State.SortColumn))
                cdef.Sort = new[] { new SortInfo ( State.SortColumn, State.SortDescending ) };

            var filter = GetQueryFilter();

            if (!string.IsNullOrEmpty(content.ChildrenDefinition.ContentQuery))
            {
                // combine the two queries (e.g. in case of a Smart Folder or a container with a custom children query)
                if (!string.IsNullOrEmpty(filter))
                    content.ChildrenDefinition.ContentQuery = ContentQuery.AddClause(content.ChildrenDefinition.ContentQuery, filter, LogicalOperator.And);
            }
            else
            {
                content.ChildrenDefinition.ContentQuery = filter;
            }

            content.XmlWriterExtender = writer => { };

            switch (CollectionAxis)
            {
                case CollectionAxisMode.Children:
                    return content;
                case CollectionAxisMode.VersionHistory:
                    var versionRoot = SearchFolder.Create(content.Versions);

                    return versionRoot;
                case CollectionAxisMode.ReferenceProperty:
                    return content;
                case CollectionAxisMode.External:
                    return SearchFolder.Create(RequestNodeList);
            }

            return null;
        }

        protected virtual string GetQueryFilter()
        {
            return ReplaceTemplates(QueryFilter);
        }

        protected XPathNavigator XmlModelData { get; set; }

        protected override XsltArgumentList GetXsltArgumentList()
        {
            var arglist = base.GetXsltArgumentList();
            if (XmlModelData != null)
            {
                arglist.AddParam("Model", string.Empty, XmlModelData.Select("/Model"));
            }
            return arglist;
        }

        protected override void CreateChildControls()
        {
            if (Cacheable && CanCache && IsInCache)
                return;

            if (ShowExecutionTime)
                Timer.Start();

            Content rootContent = null;
            Exception controlException = null;

            try
            {
                rootContent = GetModel() as Content;
                if (rootContent != null)
                    rootContent.ChildrenDefinition.AllChildren = AllChildren;
            }
            catch (Exception ex)
            {
                SnLog.WriteException(ex);
                controlException = ex;
            }

            var model = new ContentCollectionViewModel { State = this.State };

            try
            {
                var childCount = 0;
                if (rootContent != null)
                {
                    try
                    {
                        childCount = rootContent.Children.Count();
                    }
                    catch (Exception ex)
                    {
                        SnLog.WriteException(ex);
                        if (controlException == null)
                            controlException = ex;
                    }
                }

                try
                {
                    model.Pager = GetPagerModel(childCount, State, string.Empty);
                }
                catch (Exception ex)
                {
                    SnLog.WriteException(ex);
                    if (controlException == null)
                        controlException = ex;

                    // in case of error, set dummy pager model
                    model.Pager = new PagerModel(0, State, string.Empty);
                }

                model.ReferenceAxisName = CollectionAxis == CollectionAxisMode.ReferenceProperty ? ReferenceAxisName : null;
                model.Content = rootContent;

                if (RenderingMode == RenderMode.Xslt)
                {
                    XmlModelData = model.ToXPathNavigator();
                }
                else if (RenderingMode == RenderMode.Ascx || RenderingMode == RenderMode.Native)
                {
                    // the Renderer property may contain a skin-relative path
                    var viewPath = RenderingMode == RenderMode.Native
                                       ? "/root/Global/Renderers/ContentCollectionView.ascx"
                                       : SkinManager.Resolve(Renderer);

                    Control presenter = null;

                    try
                    {
                        var viewHead = NodeHead.Get(viewPath);
                        if (viewHead != null && SecurityHandler.HasPermission(viewHead, PermissionType.RunApplication))
                            presenter = Page.LoadControl(viewPath);
                        
                        // we may display a message if the user does not have enough permissions for the view
                    }
                    catch (Exception ex)
                    {
                        SnLog.WriteException(ex);
                        if (controlException == null)
                            controlException = ex;
                    }

                    if (presenter != null)
                    {
                        var ccView = presenter as ContentCollectionView;
                        if (ccView != null)
                            ccView.Model = model;

                        if (rootContent != null)
                        {
                            var itemlist = presenter.FindControl(ContentListID);
                            if (itemlist != null)
                            {
                                try
                                {
                                    ContentQueryPresenterPortlet.DataBindingHelper.SetDataSourceAndBind(itemlist,
                                                                                                        rootContent.Children);
                                }
                                catch (Exception ex)
                                {
                                    SnLog.WriteException(ex);
                                    if (controlException == null)
                                        controlException = ex;
                                }
                            }
                        }

                        var itemPager = presenter.FindControl("ContentListPager");
                        if (itemPager != null)
                        {
                            try
                            {
                                ContentQueryPresenterPortlet.DataBindingHelper.SetDataSourceAndBind(itemPager, 
                                    model.Pager.PagerActions);
                            }
                            catch (Exception ex)
                            {
                                SnLog.WriteException(ex);
                                if (controlException == null)
                                    controlException = ex;
                            }
                        }

                        Controls.Clear();
                        Controls.Add(presenter); 
                    }
                }
            }
            catch (Exception ex)
            {
                SnLog.WriteException(ex);
                if (controlException == null)
                    controlException = ex;
            }

            try 
            {	        
                if (controlException != null)
                    BuildErrorMessage(controlException);
            }
            catch (Exception ex)
            {
                var errorText = SR.GetString(SR.Portlets.ContentCollection.ErrorLoadingContentView, HttpUtility.HtmlEncode(ex.Message));

                this.Controls.Clear();
                this.Controls.Add(new LiteralControl(errorText));
            }

            ChildControlsCreated = true;

            if (ShowExecutionTime)
                Timer.Stop();
        }

        protected virtual void BuildErrorMessage(Exception ex)
        {
            this.Controls.Clear();

            var errorLabel = new Label
                                 {
                                     ID = "ErrorLabel",
                                     Text = GetFriendlyErrorMessage(ex),
                                     CssClass = "sn-error"
                                 };

            this.Controls.Add(errorLabel);
        }

        protected virtual string GetFriendlyErrorMessage(Exception ex)
        {
            if (ex is InvalidContentQueryException)
                return SR.GetString(SR.Portlets.ContentCollection.ErrorInvalidContentQuery);

            var text = SR.GetString(SR.Portlets.ContentCollection.ErrorLoadingContentView);

            return string.Format(text, ex != null ? HttpUtility.HtmlEncode(ex.Message) : string.Empty);
        }

        protected virtual PagerModel GetPagerModel(int totalCount, ContentCollectionPortletState state, string pageUrl)
        {
            return new PagerModel(totalCount, state, pageUrl);
        }
    }
}
