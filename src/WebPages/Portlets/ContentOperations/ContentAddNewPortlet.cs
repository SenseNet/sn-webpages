﻿using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using SenseNet.ApplicationModel;
using SenseNet.ContentRepository.Schema;
using SenseNet.Portal.PortletFramework;
using SenseNet.Portal.UI;
using SenseNet.Portal.UI.PortletFramework;
using SenseNet.Portal.Virtualization;
using SenseNet.Diagnostics;
using SenseNet.ContentRepository;
using SenseNet.Portal.UI.ContentListViews;
using SenseNet.Portal.UI.ContentListViews.Handlers;
using SenseNet.ContentRepository.Storage;
using SenseNet.ContentRepository.Storage.Security;
using System.Web.Configuration;
using Content = SenseNet.ContentRepository.Content;

namespace SenseNet.Portal.Portlets
{
    public class ContentAddNewPortlet : ContextBoundPortlet, IContentProvider
    {
        private const string ContentAddNewPortletClass = "ContentAddNewPortlet";

        [Obsolete("After V6.5 PATCH 9: Use Configuration.Portlets.ContentAddNewPortletTemplate instead.")]
        public string GuiPath => Configuration.Portlets.ContentAddNewPortletTemplate;

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ContentAddNewPortletClass, "Prop_CreateRelativePath_DisplayName")]
        [LocalizedWebDescription(ContentAddNewPortletClass, "Prop_CreateRelativePath_Description")]
        [WebCategory(EditorCategory.AddNewPortlet, EditorCategory.AddNewPortlet_Order)]
        [WebOrder(20)]
        public bool CreateRelativePath { get; set; }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ContentAddNewPortletClass, "Prop_RelativeContentTypeName_DisplayName")]
        [LocalizedWebDescription(ContentAddNewPortletClass, "Prop_RelativeContentTypeName_Description")]
        [WebCategory(EditorCategory.AddNewPortlet, EditorCategory.AddNewPortlet_Order)]
        [WebOrder(30)]
        public string RelativeContentTypeName { get; set; }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ContentAddNewPortletClass, "Prop_AllowedContentTypes_DisplayName")]
        [LocalizedWebDescription(ContentAddNewPortletClass, "Prop_AllowedContentTypes_Description")]
        [WebCategory(EditorCategory.AddNewPortlet, EditorCategory.AddNewPortlet_Order)]
        [WebOrder(10)]
        public string AllowedContentTypes { get; set; }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(PORTLETFRAMEWORK_CLASSNAME, RENDERER_DISPLAYNAME)]
        [LocalizedWebDescription(PORTLETFRAMEWORK_CLASSNAME, RENDERER_DESCRIPTION)]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(100)]
        [Editor(typeof(ViewPickerEditorPartField), typeof(IEditorPartField))]
        [ContentPickerEditorPartOptions(ContentPickerCommonType.ContentView)]
        public string ContentViewPath { get; set; }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(ContentAddNewPortletClass, "Prop_AdvancedMode_DisplayName")]
        [LocalizedWebDescription(ContentAddNewPortletClass, "Prop_AdvancedMode_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(100)]
        public bool AdvancedMode { get; set; }

        // portlet uses custom ascx, hide renderer property
        [WebBrowsable(false), Personalizable(true)]
        public override string Renderer { get; set; }

        public List<string> AllowedContentTypeNames
        {
            get
            {
                return !string.IsNullOrEmpty(AllowedContentTypes) ? 
                    AllowedContentTypes.Split(" ,;".ToCharArray(), StringSplitOptions.RemoveEmptyEntries).ToList() :
                    new List<string>();
            }
        }

        protected ContentView ContentView
        {
            get { return _contentView; }
        }

        private ListItem[] _contentTypes;
        public ListItem[] ContentTypes
        {
            get
            {
                if (_contentTypes == null)
                {
                    var listItems = new List<ListItem>();
                    var ctx = GetContextNode() as GenericContent;
                    if (ctx != null)
                    {
                        // checks whether Portlet has texts in AllowedContentTypeNames property.
                        if (AllowedContentTypeNames.Count > 0)
                        {
                            var contentTypes = AllowedContentTypeNames.Select(item => ContentType.GetByName(item)).Where(cType => cType != null).ToList();
                            listItems.AddRange(GetListItems(contentTypes, ctx));
                        }

                        if (listItems.Count == 0)
                        {
                            // get all items from ContextNode as it works within the new scenario feature.
                            var newItems = GenericScenario.GetNewItemNodes(ctx);
                            listItems.AddRange(GetOtherListItems(newItems, ctx));
                        }
                    }
                    if (listItems.Count == 0)
                    {
                        // finally, if no other option: add all the content types
                        var r = GenericScenario.GetNewItemNodes(ctx, ContentType.GetContentTypes());
                        listItems.AddRange(GetOtherListItems(r, ctx));
                    }
                    _contentTypes = listItems.ToArray();
                }
                return _contentTypes;
            }
        }

        // Members ////////////////////////////////////////////////////////
        private static readonly string[] States = InitializeStates();
        private static string[] InitializeStates()
        {
            return new[] { "ContentTypeList", "AddNewContentType", "None" };
        }
        public string SelectedContentType { get; set; }
        public string CurrentState
        {
            get
            {
                if (String.IsNullOrEmpty(_currentState))
                    _currentState = States[0];
                return _currentState;
            }
            set { _currentState = value; }
        }

        protected Control _currentUserControl;
        private ContentView _contentView;
        private Content _currentContent;
        private string _currentState;

        // IContentProvider members ///////////////////////////////////////

        public string ContentTypeName { get; set; }
        public string ContentName { get; set; }

        // Constructors //////////////////////////////////////////////////////

        public ContentAddNewPortlet()
        {
            this.Name = "$ContentAddNewPortlet:PortletDisplayName";
            this.Description = "$ContentAddNewPortlet:PortletDescription";
            this.Category = new PortletCategory(PortletCategoryType.ContentOperation);
        }

        // Overrides /////////////////////////////////////////////////////////

        protected override void OnInit(EventArgs e)
        {
            this.AdvancedMode = true;
            Page.RegisterRequiresControlState(this);
            base.OnInit(e);
        }

        protected override object SaveControlState()
        {
            var selectedContentType = GetSelectedContentType();
            if (string.IsNullOrEmpty(selectedContentType))
                selectedContentType = SelectedContentType;
            var state = new[] { selectedContentType, CurrentState };
            return state;
        }

        protected override void LoadControlState(object savedState)
        {
            if (savedState == null)
                return;
            var o = savedState as object[];
            if (o == null)
                return;
            SelectedContentType = o[0] as string;
            CurrentState = o[1] as string;
        }

        protected override void CreateChildControls()
        {
            if (this.HiddenPropertyCategories == null)
                this.HiddenPropertyCategories = new List<string>();
            this.HiddenPropertyCategories.Add("Cache"); // this is an administrative portlet we don't need to use Cache functionality.
            Controls.Clear();

            _currentUserControl = LoadUserInterface(Page, Configuration.Portlets.ContentAddNewPortletTemplate);

            // 1st allowed types check: if allowed content types list is empty, only administrators should be able to use this portlet
            var parentPath = GetParentPath();
            if (!AllowCreationForEmptyAllowedContentTypes(parentPath))
            {
                Controls.Add(new LiteralControl("Allowed ContentTypes list is empty!"));
                return;
            }


            if (_currentUserControl != null)
            {
                var contentError = false;
                var contentTypeName = GetRequestedContentType();

                if (this.ContextNode != null && !string.IsNullOrEmpty(parentPath))
                {
                    try
                    {
                        _currentContent = ContentManager.CreateContentFromRequest(contentTypeName, null, parentPath, true);
                    }
                    catch (Exception ex)
                    {
                        SnLog.WriteException(ex);

                        // Something went wrong during content parsing, we should display 
                        // an error message instead of simply displaying the type list.
                        contentError = true;
                    }
                }

                if (_currentContent != null)
                {
                    CurrentState = States[1];
                }

                if (!contentError && ContentTypeIsValid())
                {
                    SetControlsByState();

                    try
                    {
                        Controls.Add(_currentUserControl);
                    }
                    catch (Exception ex)
                    {
                        SnLog.WriteException(ex);

                        Controls.Clear();

                        var message = ex.Message.Contains("does not contain Field")
                                          ? string.Format("Content and view mismatch: {0}", ex.Message)
                                          : string.Format("Error: {0}", ex.Message);

                        Controls.Add(new LiteralControl(message));
                    }
                }
                else
                {
                    Controls.Clear();

                    if (_currentContent != null)
                    {
                        contentTypeName = _currentContent.ContentType.Name;
                        parentPath = _currentContent.ContentHandler.ParentPath;
                    }

                    if (string.IsNullOrEmpty(contentTypeName))
                        contentTypeName = ContentManager.GetContentTypeNameFromRequest();

                    SnLog.WriteError($"Forbidden content type ({contentTypeName}) under {parentPath}");

                    Controls.Add(new LiteralControl($"It is not allowed to add a new {contentTypeName} here."));
                    
                }
            }

            ChildControlsCreated = true;
        }
        
        protected override Node GetContextNode()
        {
            var node = GetBindingRoot();
            if (node == null)
                return null;

            node = AncestorIndex == 0 ? node : node.GetAncestor(AncestorIndex);

            if (!string.IsNullOrEmpty(RelativeContentPath))
            {
                var fullRelativePath = RepositoryPath.Combine(node.Path, RelativeContentPath);

                if (!fullRelativePath.EndsWith("/(apps)") && !fullRelativePath.Contains("/(apps)/"))
                {
                    try
                    {
                        node = Node.LoadNode(fullRelativePath);
                        if (node != null)
                            return node;

                        if (CreateRelativePath)
                        {
                            using (new SystemAccount())
                            {
                                var container = RepositoryTools.CreateStructure(fullRelativePath, string.IsNullOrEmpty(RelativeContentTypeName) ? "Folder" : this.RelativeContentTypeName);
                                if (container != null)
                                    return container.ContentHandler;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        SnLog.WriteException(ex);
                        node = null;
                    }
                }
            }

            return node;
        }

        public override string FormatTitle(System.Globalization.CultureInfo cultureInfo, string titleFormat, string currentContentName)
        {
            if (CurrentState != "ContentTypeList")
                return base.FormatTitle(cultureInfo, titleFormat, currentContentName);
            titleFormat = ContentRepository.i18n.SenseNetResourceManager.Current.GetString("Portal", "AddNewContentUnder");
            var title = String.Format(cultureInfo, titleFormat, currentContentName);
            return title;
        }

        // Event handlers //////////////////////////////////////////////////////

        private void SelectCtButtonClick(object sender, EventArgs e)
        {
            CurrentState = States[1];
            var selectButton = sender as Button;
            if (selectButton == null)
                return;

            var redirUrl = GetRedirUrl(GetSelectedContentType());
            HttpContext.Current.Response.Redirect(redirUrl);
        }

        private void NewContentViewUserAction(object sender, UserActionEventArgs e)
        {
            var contentView = e.ContentView;
            var content = contentView.Content;

            contentView.UpdateContent();
            var backUrl = PortalContext.Current.BackUrl;
            if (String.IsNullOrEmpty(backUrl))
                backUrl = PortalContext.Current.RequestedUri.GetLeftPart(UriPartial.Path);
            switch (e.ActionName)
            {
                case "save":
                    if (contentView.IsUserInputValid && content.IsValid)
                    {
                        try
                        {
                            content.Save();

                            CallDone();
                        }
                        catch (Exception ex) // logged
                        {
                            SnLog.WriteException(ex);
                            contentView.ContentException = ex;
                        }
                    }
                    break;
                case "cancel":
                    CurrentState = States[0];
                    SetControlsByState();

                    CallDone();

                    break;
            }
        }

        private void CancelSelectClick(object sender, EventArgs e)
        {
            CallDone();
        }

        // Helper methods //////////////////////////////////////////////////////

        public string GetRedirUrl(string contentTypeName)
        {
            var urlQuery = PortalContext.Current.UrlWithoutBackUrl;
            var redir = new StringBuilder();
            redir = urlQuery.Contains("?action=") ? redir.Append(urlQuery).Append("&ContentTypeName=") : redir.Append(urlQuery).Append("?ContentTypeName=");
            redir.Append(contentTypeName);
            redir.Append(string.Format("&{0}={1}", PortalContext.BackUrlParamName, HttpUtility.UrlEncode(PortalContext.Current.BackUrl)));

            // return a relative url
            return new Uri(redir.ToString()).PathAndQuery;
        }

        protected virtual bool AllowCreationForEmptyAllowedContentTypes(string parentPath)
        {
            // if allowed content types list is empty, only administrators should be able to use this portlet
            if (!string.IsNullOrEmpty(parentPath))
            {
                var parent = Node.LoadNode(parentPath) as GenericContent;
                if (parent != null)
                {
                    if (parent.GetAllowedChildTypes().Count() == 0)
                        return false;
                }
            }
            return true;
        }

        private void SetControlsByState()
        {
            if (HasError)
                return;

            try
            {
                _currentUserControl.FindControl("ErrorMessage").Visible = false;

                if (CurrentState == States[0])
                {
                    var list = _currentUserControl.FindControl("ContentTypeList");
                    if (list == null)
                        return;
                    FillDropDownWithContentTypeNames(list);

                    if (this.AdvancedMode)
                    {
                        _currentUserControl.FindControl("AdvancedPanel").Visible = true;
                        _currentUserControl.FindControl("ContentTypeList").Visible = false;
                        _currentUserControl.FindControl("SelectContentTypeButton").Visible = false;
                        _currentUserControl.FindControl("CancelSelectContentTypeButton").Visible = false;
                    }
                    else
                    {
                        _currentUserControl.FindControl("AdvancedPanel").Visible = false;
                        _currentUserControl.FindControl("ContentTypeList").Visible = true;
                        _currentUserControl.FindControl("SelectContentTypeButton").Visible = true;
                        _currentUserControl.FindControl("CancelSelectContentTypeButton").Visible = true;
                    }

                    var selectCtButton = _currentUserControl.FindControl("SelectContentTypeButton") as Button;
                    if (selectCtButton != null)
                        selectCtButton.Click += SelectCtButtonClick;

                    var cancelSelect = _currentUserControl.FindControl("CancelSelectContentTypeButton") as Button;
                    if (cancelSelect != null)
                        cancelSelect.Click += CancelSelectClick;

                    var cancelSelect2 = _currentUserControl.FindControl("CancelSelectContentTypeButton2") as Button;
                    if (cancelSelect2 != null)
                        cancelSelect2.Click += CancelSelectClick;

                    var placeHolder = _currentUserControl.FindControl("ContentViewPlaceHolder") as PlaceHolder;
                    if (placeHolder != null)
                        placeHolder.Visible = false;

                    var itemsNum = ((DropDownList)list).Items.Count;
                    if (itemsNum == 1)
                        CurrentState = States[1];
                }

                if (CurrentState == States[1])
                {
                    _currentUserControl.FindControl("AdvancedPanel").Visible = false;
                    _currentUserControl.FindControl("ContentTypeList").Visible = false;
                    _currentUserControl.FindControl("SelectContentTypeButton").Visible = false;
                    _currentUserControl.FindControl("CancelSelectContentTypeButton").Visible = false;

                    var contentTypeName = GetSelectedContentType();

                    // request does not contain the contenttype name,
                    // SNWebPartChrome will need this info to generate the Title
                    ContentTypeName = contentTypeName;

                    AddSelectedNewContentView(contentTypeName);
                }
            }
            catch (Exception exc) // logged
            {
                SnLog.WriteException(exc);
                HasError = true;
                var msgLabel = _currentUserControl.FindControl("ErrorMessage") as Label;
                if (msgLabel == null)
                    Controls.Add(new Label { ID = "RuntimeErrorMsg", Text = "ErrorMessage control could not found.", ForeColor = Color.Red });
                else
                {
                    msgLabel.Visible = true;
                    msgLabel.Text = exc.Message;
                }
            }
        }

        protected Control LoadUserInterface(TemplateControl page, string path)
        {
            if (page == null)
                throw new ArgumentNullException("page");
            Control ui;
            try
            {
                ui = page.LoadControl(path);
            }
            catch (Exception e)
            {
                SnLog.WriteException(e);
                HasError = true;
                var msg = String.Format("{0}", e.Message);
                var msgControl = new Label { ID = "RuntimeErrMsg", Text = msg, ForeColor = Color.Red };
                return msgControl;
            }
            return ui;
        }

        private void FillDropDownWithContentTypeNames(Control listControl)
        {
            if (listControl == null)
                throw new ArgumentNullException("listControl");

            var dropDownList = listControl as DropDownList;
            if (dropDownList == null)
                return;

            dropDownList.Items.AddRange(ContentTypes);
        }

        private static ListItem[] GetListItems(IEnumerable<ContentType> contentTypes, Node contextNode)
        {
            var dict = new SortedDictionary<string, string>();

            if (contentTypes == null)
                return new ListItem[0];

            foreach (var contentType in contentTypes)
            {
                if (!SavingAction.CheckManageListPermission(contentType.NodeType, contextNode))
                    continue;

                var ct = Content.Create(contentType);
                var title = string.IsNullOrEmpty(ct.DisplayName) ? ct.Name : ct.DisplayName;
                if (!dict.ContainsKey(title))
                    dict.Add(title, ct.Name);
            }

            return dict.Keys.Count == 0 ? new ListItem[0] : dict.Keys.Select(key => new ListItem(key, dict[key])).ToArray();
        }

        private static ListItem[] GetOtherListItems(IEnumerable<Node> nodes, Node contextNode)
        {
            if (nodes == null) 
                return new ListItem[0];

            var dict = new SortedDictionary<string, string>();

            foreach (var node in nodes)
            {
                var displayName = string.Empty;
                var name = string.Empty;
                var c = node as GenericContent;
                var ctd = node as ContentType;
                if (ctd != null)    // content type
                {
                    if (!SavingAction.CheckManageListPermission(ctd.NodeType, contextNode))
                        continue;

                    var content = Content.Create(ctd);
                    displayName = content.DisplayName;
                    name = content.Name;
                }
                else if (c != null)   // content template
                {
                    if (!SavingAction.CheckManageListPermission(c.NodeType, contextNode))
                        continue;

                    var content = Content.Create(c);
                    displayName = content.DisplayName;
                    name = content.Path;
                }
                var validTitle = string.IsNullOrEmpty(displayName) ? name : displayName;
                if (!dict.ContainsKey(validTitle))
                    dict.Add(validTitle, name);
            }

            return dict.Keys.Count == 0 ? new ListItem[0] : dict.Keys.Select(key => new ListItem(key, dict[key])).ToArray();
        }

        protected virtual string GetSelectedContentType()
        {
            if (_currentUserControl == null)
                throw new Exception("ContentType dropdown not found");

            var dropDown = _currentUserControl.FindControl("ContentTypeList") as DropDownList;
            return dropDown != null ? dropDown.SelectedValue : null;
        }

        protected virtual string GetRequestedContentType()
        {
            return null;
        }

        protected virtual ContentView GetContentView(Content newContent)
        {
            return String.IsNullOrEmpty(ContentViewPath) ?
                    ContentView.Create(newContent, Page, ViewMode.InlineNew) :
                    ContentView.Create(newContent, Page, ViewMode.InlineNew, ContentViewPath);
        }

        protected virtual string GetParentPath()
        {
            return this.ContextNode == null ? string.Empty : this.ContextNode.Path;
        }

        private void AddSelectedNewContentView(string selectedContentTypeName)
        {
            var placeHolder = _currentUserControl.FindControl("ContentViewPlaceHolder") as PlaceHolder;
            if (placeHolder == null)
                return;

            var currentContextNode = GetContextNode();

            if (_currentContent != null)
            {
                _contentView = GetContentView(_currentContent);

                if (_contentView == null)
                {
                    placeHolder.Visible = true;
                    placeHolder.Controls.Clear();
                    placeHolder.Controls.Add(new LiteralControl(SR.GetString(SR.Exceptions.ContentView.NotFound)));
                    return;
                }

                // backward compatibility: use eventhandler for contentviews using defaultbuttons and not commandbuttons
                _contentView.UserAction += NewContentViewUserAction;

                placeHolder.Visible = true;
                placeHolder.Controls.Clear();
                placeHolder.Controls.Add(_contentView);
                return;
            }

            if (String.IsNullOrEmpty(selectedContentTypeName))
                selectedContentTypeName = SelectedContentType;

            Content newContent = null;
            var ctd = ContentType.GetByName(selectedContentTypeName);
            if (ctd == null) {
                // In this case, the selectedContentTypeName contains only the templatePath. It is maybe a security issue because path is rendered into value attribute of html option tag.
                string parentPath = currentContextNode.Path;
                string templatePath = selectedContentTypeName;
                newContent = ContentTemplate.CreateTemplated(parentPath, templatePath);
                _contentView = GetContentView(newContent);
            } else {
                //  Yes it is a valid contentTypeName
                newContent = ContentManager.CreateContentFromRequest(selectedContentTypeName, null, currentContextNode.Path, true);
                _contentView = GetContentView(newContent);
            }

            if (_contentView == null)
            {
                placeHolder.Visible = true;
                placeHolder.Controls.Clear();
                placeHolder.Controls.Add(new LiteralControl(SR.GetString(SR.Exceptions.ContentView.NotFound)));
                return;
            }

            // backward compatibility: use eventhandler for contentviews using defaultbuttons and not commandbuttons
            _contentView.UserAction += NewContentViewUserAction;

            placeHolder.Visible = true;
            placeHolder.Controls.Clear();
            placeHolder.Controls.Add(_contentView);
        }

        private bool ContentTypeIsValid()
        {
            // The content type is valid if the parent content has an empty ContentTypes list (any type is allowed),
            // or the type of the content to be created is among the allowed content types (or is a derived type).

            if (_currentContent == null)
                return true;

            var parent = SystemAccount.Execute(() => { return _currentContent.ContentHandler.Parent as GenericContent; });
            
            if (parent == null)
                return true;

            if (_currentContent.ContentType.IsInstaceOfOrDerivedFrom("FieldSettingContent") && parent is ContentList)
                return true;

            return parent.GetAllowedChildTypeNames().Any(ctn => ctn == _currentContent.ContentType.Name);
        }
    }
}
