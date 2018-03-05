using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Search;
using SenseNet.ContentRepository.Storage.Search;
using SenseNet.ContentRepository.Storage.Security;
using SenseNet.Diagnostics;
using SenseNet.Portal.UI;
using SenseNet.Portal.UI.PortletFramework;
using System.Web.UI.WebControls.WebParts;
using System.Web;
using System.Web.UI.WebControls;
using SenseNet.ContentRepository.Storage;
using SenseNet.Portal.UI.Controls;
using System.Web.UI;
using SenseNet.Portal.Virtualization;
using Content = SenseNet.ContentRepository.Content;
using SenseNet.ApplicationModel;
using SenseNet.ContentRepository.Workspaces;
using SenseNet.Search;
using SenseNet.Search.Querying;

namespace SenseNet.Portal.Portlets
{
    public class ContextSearch : ContentCollectionPortlet
    {
        private const string ContextSearchClass = "ContextSearch";

        public static readonly string QueryParameterName = "text";

        // ====================================================================== Constructor

        public ContextSearch()
        {
            this.Name = "$ContextSearch:PortletDisplayName";
            this.Description = "$ContextSearch:PortletDescription";
            this.Category = new PortletCategory(PortletCategoryType.Search);

            this.HiddenPropertyCategories = new List<string>() { EditorCategory.Cache };
            this.HiddenProperties.AddRange(new [] { "AllChildren", "UriParameterName", "ReferenceAxisName", "CollectionAxis", "VisibleFields" });
            Cacheable = false;   // by default, caching is switched off
        }

        // ====================================================================== Properties

        private string _viewPath = "/Root/System/SystemPlugins/Portlets/ContextSearch/AdvancedView.ascx";
        private string _rendererPath = "/Root/Global/renderers/SearchResultContentList.xslt";
        private bool _includeBackUrl;

        [LocalizedWebDisplayName(ContextSearchClass, "Prop_ViewPath_DisplayName")]
        [LocalizedWebDescription(ContextSearchClass, "Prop_ViewPath_Description")]
        [WebBrowsable(false), Personalizable(false)]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(100)]
        [Editor(typeof(ContentPickerEditorPartField), typeof(IEditorPartField))]
        [ContentPickerEditorPartOptions(ContentPickerCommonType.Ascx)]
        [Obsolete("Use Renderer property instead")]
        public string ViewPath
        {
            get { return _viewPath; }
            set
            {
                _viewPath = value;

                this.Renderer = value;
            }
        }

        [LocalizedWebDisplayName(ContextSearchClass, "Prop_RendererPath_DisplayName")]
        [LocalizedWebDescription(ContextSearchClass, "Prop_RendererPath_Description")]
        [WebBrowsable(false), Personalizable(false)]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(110)]
        [Editor(typeof(ContentPickerEditorPartField), typeof(IEditorPartField))]
        [ContentPickerEditorPartOptions(ContentPickerCommonType.Renderer)]
        [Obsolete("Use Renderer property instead")]
        public string RendererPath
        {
            get { return _rendererPath; }
            set { _rendererPath = value; }
        }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(PORTLETFRAMEWORK_CLASSNAME, RENDERER_DISPLAYNAME)]
        [LocalizedWebDescription(PORTLETFRAMEWORK_CLASSNAME, RENDERER_DESCRIPTION)]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(1000)]
        [Editor(typeof(ViewPickerEditorPartField), typeof(IEditorPartField))]
        [ContentPickerEditorPartOptions(PortletViewType.Ascx)]
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


        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ContextSearchClass, "Prop_SearchResultPagePath_DisplayName")]
        [LocalizedWebDescription(ContextSearchClass, "Prop_SearchResultPagePath_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(120)]
        [Editor(typeof(ContentPickerEditorPartField), typeof(IEditorPartField))]
        [ContentPickerEditorPartOptions(AllowedContentTypes = "Page")]
        public string SearchResultPagePath
        {
            get;
            set;
        }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ContextSearchClass, "Prop_FilterByContext_DisplayName")]
        [LocalizedWebDescription(ContextSearchClass, "Prop_FilterByContext_Description")]
        [WebCategory(EditorCategory.Search, EditorCategory.Search_Order)]
        [WebOrder(130)]
        public bool FilterByContext { get; set; }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ContextSearchClass, "Prop_AllowEmptySearch_DisplayName")]
        [LocalizedWebDescription(ContextSearchClass, "Prop_AllowEmptySearch_Description")]
        [WebCategory(EditorCategory.Search, EditorCategory.Search_Order)]
        [WebOrder(140)]
        public bool AllowEmptySearch { get; set; }

        public bool QuickSearchMode { get; set; }

        public string ContextInfoID { get; set; }

        private Button _button;
        protected Button SearchButton
        {
            get
            {
                if (_button == null && this.ViewControl != null)
                    _button = this.ViewControl.FindControlRecursive("SearchButton") as Button;

                return _button;
            }
        }

        private Button _qsButton;
        protected Button QuickSearchButton
        {
            get
            {
                if (_qsButton == null && this.ViewControl != null)
                    _qsButton = this.ViewControl.FindControlRecursive("QuickSearchButton") as Button;

                return _qsButton;
            }
        }

        private TextBox _textBox;
        protected TextBox SearchBox
        {
            get
            {
                if (_textBox == null && this.ViewControl != null)
                    _textBox = this.ViewControl.FindControlRecursive("SearchBox") as TextBox;

                return _textBox;
            }
        }

        private ListControl _users;
        protected ListControl Users
        {
            get
            {
                if (_users == null && this.ViewControl != null)
                    _users = this.ViewControl.FindControlRecursive("UsersListControl") as ListControl;

                return _users;
            }
        }

        private Label _resultCount;
        protected Label ResultCount
        {
            get
            {
                if (_resultCount == null && this.ViewControl != null)
                    _resultCount = this.ViewControl.FindControlRecursive("LabelResultCount") as Label;

                return _resultCount;
            }
        }

        private Label _resultList;
        protected Label ResultList
        {
            get
            {
                if (_resultList == null && this.ViewControl != null)
                    _resultList = this.ViewControl.FindControlRecursive("ResultList") as Label;

                return _resultList;
            }
        }

        private Panel _errorPanel;
        protected Panel ErrorPanel
        {
            get { return _errorPanel ?? (_errorPanel = this.ViewControl.FindControlRecursive("ErrorPanel") as Panel); }
        }

        private Label _errorLabel;
        protected Label ErrorLabel
        {
            get { return _errorLabel ?? (_errorLabel = this.ViewControl.FindControlRecursive("ErrorLabel") as Label); }
        }

        protected Control ViewControl
        {
            get { return this; }
        }

        public string QueryString
        {
            get { return HttpContext.Current.Request.Params[QueryParameterName]; }
        }

        protected Content ResultModel
        {
            get; set;
        }

        protected string ErrorMessage
        {
            get; set;
        }

        // ====================================================================== Methods

        protected override void OnLoad(EventArgs e)
        {
            base.OnLoad(e);

            SetSearchPlaceholder();
        }

        protected override void CreateChildControls()
        {
            // in quick search mode the portlet redirects to the real
            // search page without executing any query
            if (QuickSearchMode)
            {
                Controls.Clear();

                try
                {
                    var viewControl = Page.LoadControl(SkinManager.Resolve(Renderer)) as UserControl;
                    if (viewControl != null)
                    {
                        Controls.Add(viewControl);
                        InitializeControls();
                    }
                }
                catch (Exception exc)
                {
                    SnLog.WriteException(exc);
                }

                ChildControlsCreated = true;
                return;
            }

            base.CreateChildControls();

            InitializeControls();
        }

        protected override void BuildErrorMessage(Exception ex)
        {
            if (ex == null)
                return;

            SetError(GetFriendlyErrorMessage(ex));
        }

        protected override object GetModel()
        {
            var sf = SmartFolder.GetRuntimeQueryFolder();

            var model = Content.Create(sf);
            if (!this.AllowEmptySearch && SearchTextIsTooGeneric(this.QueryString))
            {
                if (HttpContext.Current.Request.Params.AllKeys.Contains(QueryParameterName))
                    this.ErrorMessage = SR.GetString(ContextSearchClass, "Error_GenericSearchExpression");
                return model;
            }

            sf.Query = ReplaceTemplates(this.QueryString);

            var baseModel = base.GetModel() as Content;
            if (baseModel != null)
            {
                model.ChildrenDefinition = baseModel.ChildrenDefinition;
                model.ChildrenDefinition.PathUsage = PathUsageMode.NotUsed;
                if (FilterByContext)
                {
                    var ctx = GetContextNode();
                    if (ctx != null)
                    {
                        // add filter: we search only under the current context
                        var escapedPath = ctx.Path.Replace("(", "\\(").Replace(")", "\\)");
                        model.ChildrenDefinition.ContentQuery =
                            ContentQuery.AddClause(model.ChildrenDefinition.ContentQuery,
                            ContentQuery.AddClause(sf.Query, string.Format("InTree:\"{0}\"", escapedPath), LogicalOperator.And), LogicalOperator.And);
                    }
                }
                else
                {
                    if (!string.IsNullOrEmpty(sf.Query))
                        model.ChildrenDefinition.ContentQuery = ContentQuery.AddClause(model.ChildrenDefinition.ContentQuery,  sf.Query, LogicalOperator.And);
                }
            }

            ResultModel = model;

            return model;
        }

        // ====================================================================== Event handlers

        private void SearchButton_Click(object sender, EventArgs e)
        {
            _includeBackUrl = false;
            RedirectToSearchPage();
        }

        private void QuickSearchButton_Click(object sender, EventArgs e)
        {
            _includeBackUrl = true;
            RedirectToSearchPage();
        }

        // ====================================================================== Helper methods

        private void InitializeControls()
        {
            if (this.QuickSearchButton != null)
                this.QuickSearchButton.Click += QuickSearchButton_Click;
            if (this.SearchButton != null)
                this.SearchButton.Click += SearchButton_Click;

            var resultCount = 0;

            try
            {
                resultCount = ResultModel == null ? 0 : ResultModel.Children.Count();
            }
            catch (Exception ex)
            {
                // No need to log this, the error is already occured and logged in the base class.
                // Set error message only if there was no previous message.
                if (string.IsNullOrEmpty(this.ErrorMessage))
                    BuildErrorMessage(ex);
            }

            if (this.ResultCount != null)
                this.ResultCount.Text = resultCount.ToString();

            if (!string.IsNullOrEmpty(this.ErrorMessage))
                SetError(this.ErrorMessage);

            if (!this.Page.IsPostBack && this.SearchBox != null)
            {
                this.SearchBox.Text = this.QueryString;
            }
        }

        private void RedirectToSearchPage()
        {
            // direct search page mode
            if (string.IsNullOrEmpty(SearchResultPagePath))
            {
                // COMMENT: sometimes the request contains the app url, not the actual node.
                // Only the rawurl property contains the original path (e.g. the workspace).

                var contextInfo = UITools.FindContextInfo(this, ContextInfoID);
                var ctxPath = contextInfo != null ? contextInfo.Path : string.Empty;

                if (string.IsNullOrEmpty(ctxPath))
                {
                    var ctx = GetContextNode();
                    if (ctx != null)
                        ctxPath = ctx.Path;
                }

                var actionUrl = string.IsNullOrEmpty(ctxPath) ? "?action=Search" : (_includeBackUrl ? ActionFramework.GetActionUrl(ctxPath, "Search") : ActionFramework.GetActionUrl(ctxPath, "Search", null));
                var url = string.Format("{0}&{1}={2}", actionUrl, QueryParameterName, HttpUtility.UrlEncode(this.SearchBox.Text.Trim()));

                HttpContext.Current.Response.Redirect(url);
            }
            else
            {
                var urlSeparator = SearchResultPagePath.Contains("?") ? "&" : "?";
                var url = string.Format("{0}{1}{2}={3}", PortalContext.GetSiteRelativePath(SearchResultPagePath), urlSeparator,
                    QueryParameterName, HttpUtility.UrlEncode(this.SearchBox.Text.Trim()));

                if (_includeBackUrl)
                    url = string.Format("{0}&{1}={2}", url, PortalContext.BackUrlParamName, HttpUtility.UrlEncode(HttpContext.Current.Request.RawUrl));

                HttpContext.Current.Response.Redirect(url, true);
            }
        }

        private void SetSearchPlaceholder()
        {
            var tbSearch = this.SearchBox;
            if (tbSearch == null || tbSearch.Attributes["placeholder"] != null) 
                return;

            string placeHolderText;
            var contextInfo = UITools.FindContextInfo(this, ContextInfoID);
            if (contextInfo != null)
            {
                placeHolderText = GetPlaceholderText(contextInfo.ContextNode);
                if (string.IsNullOrEmpty(placeHolderText))
                    placeHolderText = SR.GetString(SR.GetString(SR.Portlets.ContextSearch.SearchUnder + contextInfo.Selector));
            }
            else
            {
                placeHolderText = GetPlaceholderText(ContextNode);
                if (string.IsNullOrEmpty(placeHolderText))
                {
                    switch (this.BindTarget)
                    {
                        case BindTarget.CurrentSite:
                            placeHolderText = SR.GetString(SR.GetString(SR.Portlets.ContextSearch.SearchUnder + "currentsite"));
                            break;
                        case BindTarget.CurrentWorkspace:
                            placeHolderText = SR.GetString(SR.GetString(SR.Portlets.ContextSearch.SearchUnder + "currentworkspace"));
                            break;
                        case BindTarget.CurrentList:
                            placeHolderText = SR.GetString(SR.GetString(SR.Portlets.ContextSearch.SearchUnder + "currentlist"));
                            break;
                        case BindTarget.CurrentContent:
                            placeHolderText = SR.GetString(SR.GetString(SR.Portlets.ContextSearch.SearchUnder + "currentcontent"));
                            break;
                    }
                }
            }

            if (!string.IsNullOrEmpty(placeHolderText))
                tbSearch.Attributes.Add("placeholder", placeHolderText);
        }

        private static string GetPlaceholderText(Node contextNode)
        {
            if (contextNode == null)
                return string.Empty;

            if (contextNode is Site)
                return SR.GetString(SR.GetString(SR.Portlets.ContextSearch.SearchUnder + "currentsite"));
            if (contextNode is Workspace)
                return SR.GetString(SR.GetString(SR.Portlets.ContextSearch.SearchUnder + "currentworkspace"));
            if (contextNode is ContentList)
                return SR.GetString(SR.GetString(SR.Portlets.ContextSearch.SearchUnder + "currentlist"));

            return string.Empty;
        }

        private void SetError(string errorMessage)
        {
            if (ErrorLabel == null)
                return;

            ErrorLabel.Visible = true;

            if (ErrorPanel != null)
                ErrorPanel.Visible = true;

            ErrorLabel.Text = errorMessage;
        }

        protected static bool SearchTextIsTooGeneric(string text)
        {
            return (string.IsNullOrEmpty(text) || (text.CompareTo("*") == 0 || text.CompareTo("**") == 0));
        }
    }
}
