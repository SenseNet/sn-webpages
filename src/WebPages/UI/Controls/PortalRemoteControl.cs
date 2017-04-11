using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.HtmlControls;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using SenseNet.ContentRepository.i18n;
using SenseNet.ContentRepository.Storage;
using SenseNet.ContentRepository.Storage.Security;
using SenseNet.Portal.Virtualization;
using SenseNet.ContentRepository;
using SenseNet.Diagnostics;
using SenseNet.Portal.UI.PortletFramework;
using SenseNet.ApplicationModel;
using SenseNet.ContentRepository.Schema;
using SenseNet.Search;

namespace SenseNet.Portal.UI.Controls
{
    public sealed class PortalRemoteControl : Control
    {
        internal static readonly string EventArgumentWebpartEdit = "SnWebPartEdit";
        internal static readonly string EventArgumentWebpartBrowse = "SnWebPartBrowse";
        internal static readonly string EventArgumentAddPortlet = "SnAddPortlet";
        internal static readonly string DisplayModeBrowse = "Browse";
        internal static readonly string DisplayModeEdit = "Edit";
        private static readonly string EventArgumentParameter = "__EVENTARGUMENT";

        private Control _prcControl;

        // members //////////////////////////////////////////////////////////////////
        private string _controlPath = string.Concat(PortalContext.WebRootFolderPath, "/prc.ascx");

        [Obsolete("Put a customized PRC into your skin instead ($skin/modules/Prc/prc.ascx).")]
        public string TemplatePath
        {
            get { return _controlPath; }
            set { _controlPath = value; }
        }

        private static readonly string PrcSkinPath = "$skin/modules/Prc/prc.ascx";

        // properties ///////////////////////////////////////////////////////////////

        /// <summary>
        /// Gets a value indicating whether this instance is in async postback.
        /// </summary>
        /// <value>
        /// 	<c>true</c> if this instance is in async postback; otherwise, <c>false</c>.
        /// </value>
        public bool IsInAsyncPostback
        {
            get
            {
                var scm = ScriptManager.GetCurrent(this.Page);
                return scm != null && scm.IsInAsyncPostBack;
            }
        }

        private bool? _isVisible;

        /// <summary>
        /// Gets a value indicating whether this instance is visible.
        /// </summary>
        /// <value>
        /// 	<c>true</c> if this instance is visible; otherwise, <c>false</c>.
        /// </value>
        public bool IsVisible
        {
            get
            {
                if (_isVisible.HasValue)
                    return _isVisible.Value;
                var user = User.Current;
                _isVisible = user != null && this.AdminGroupNodes.Any(ag => user.IsInGroup(ag.Id));
                return _isVisible.Value;
            }
        }

        private string _adminGroups;
        /// <summary>
        /// Gets or sets the groups that are allowed to open the Portal Remote Control. It is possible
        /// to define a group by name (Administrators) or with a domain name (MyDomain\MyGroup), or
        /// with a full content path. The list is a comma separated value of groups and it contains
        /// the Administrators and PRCViewers groups by default. 
        /// If you override this list in a control or page template, please include all the groups 
        /// you want to let access the PRC.
        /// </summary>
        public string Groups
        {
            get { return _adminGroups ?? "Administrators,/Root/IMS/BuiltIn/Portal/PRCViewers"; }
            set { _adminGroups = value; }
        }

        private List<ISecurityContainer> _adminGroupNodes;
        private IEnumerable<ISecurityContainer> AdminGroupNodes
        {
            get { return _adminGroupNodes ?? (_adminGroupNodes = GetAdminGroups().ToList()); }
        }

        /// <summary>
        /// Gets or sets the tag container.
        /// </summary>
        /// <value>The tag container.</value>
        public string TagContainer { get; set; }

        /// <summary>
        /// Gets or sets the PRC template which holds the declared server controls and html markup.
        /// </summary>
        /// <value>The PRC template.</value>
        [Obsolete("Put a customized PRC into your skin instead ($skin/modules/Prc/prc.ascx).")]
        [TemplateContainer(typeof(PortalRemoteControl))]
        public ITemplate PrcTemplate { get; set; }

        /// <summary>
        /// Gets a value indicating whether this instance is WCMS mode.
        /// </summary>
        /// <value>
        /// 	<c>true</c> if this instance is WCMS mode; otherwise, <c>false</c>.
        /// </value>
        [Obsolete("This property will be removed in the upcoming releases. It's recommended not to use it anymore.", true)]
        public bool IsWcmsMode
        {
            get
            {
                var pagePath = PortalContext.Current.Page.Path;
                var contextPath = PortalContext.Current.ContextNodePath;
                return pagePath.Equals(contextPath) || pagePath.ToLower().Contains("(apps)/this");
            }
        }

        public bool IsApplicationMode
        {
            get
            {
                return PortalContext.Current.GetApplicationContext() != null;
            }
        }

        [Obsolete("This property will be removed in the upcoming releases. It's recommended not to use it anymore.", true)]
        public bool IsPage
        {
            get
            {
                return IsWcmsMode;
            }
        }

        public WebPartManager WPManager
        {
            get
            {
                return WebPartManager.GetCurrentWebPartManager(this.Page);
            }
        }

        private Node _context;
        public Node ContextNode
        {
            get { return _context ?? (_context = LoadContextNode()); }
        }

        private User _lockedBy;
        private bool _lockedByEvaluated;
        /// <summary>
        /// Returns the user who checked out the current content or application.
        /// </summary>
        public User LockedBy
        {
            get
            {
                if (!_lockedByEvaluated && _lockedBy == null)
                {
                    if (ContextNode != null)
                        _lockedBy = ContextNode.LockedBy as User;

                    _lockedByEvaluated = true;
                }

                return _lockedBy;
            }
        }

        /// <summary>
        /// Returns a css class based on whether the current content is checked out or not.
        /// </summary>
        public string CheckedStateClass
        {
            get
            {
                if (ContextNode == null || !ContextNode.Locked)
                    return "sn-checkedin";

                return "sn-checkedout";
            }
        }

        private static Node LoadContextNode()
        {
            var application = PortalContext.Current.GetApplicationContext();
            return application ?? PortalContext.Current.ContextNode;
        }

        /// <summary>
        /// Loads the strongly typed PortalRemoteControl control 
        /// on the parent chain of the provided child control.
        /// </summary>
        public static PortalRemoteControl LoadPrc(Control childControl)
        {
            if (childControl == null)
                return null;

            PortalRemoteControl prc;

            do
            {
                prc = childControl as PortalRemoteControl;
                if (prc != null)
                    break;

                childControl = childControl.Parent;
            } while (childControl != null);

            return prc;
        }

        // events ///////////////////////////////////////////////////////////////////

        /// <summary>
        /// Raises the <see cref="E:System.Web.UI.Control.Init"/> event.
        /// </summary>
        /// <param name="e">An <see cref="T:System.EventArgs"/> object that contains the event data.</param>
        protected override void OnInit(EventArgs e)
        {
            if (!IsVisible)
            {
                base.OnInit(e);
                return;
            }

            var wpm = WebPartManager.GetCurrentWebPartManager(Page);
            if (wpm != null)
            {
                wpm.SelectedWebPartChanged += WpmSelectedWebPartChanged;

            }

            // Try to load the control from under the skin. If it is not found
            // there, the fallback is the old path in the virtual web root.
            string controlPath;
            if (!SkinManager.TryResolve(PrcSkinPath, out controlPath))
                controlPath = _controlPath;

            _prcControl = this.Page.LoadControl(controlPath);
            Controls.Add(_prcControl);

            base.OnInit(e);
        }

        /// <summary>
        /// Raises the <see cref="E:System.Web.UI.Control.Load"/> event.
        /// </summary>
        /// <param name="e">The <see cref="T:System.EventArgs"/> object that contains the event data.</param>
        protected override void OnLoad(EventArgs e)
        {
            if (!IsVisible)
            {
                base.OnLoad(e);
                return;
            }

            base.OnLoad(e);

            HandlePostback();
            InitializeControl();
        }

        /// <summary>
        /// Raises the <see cref="E:System.Web.UI.Control.PreRender"/> event.
        /// </summary>
        /// <param name="e">An <see cref="T:System.EventArgs"/> object that contains the event data.</param>
        protected override void OnPreRender(EventArgs e)
        {
            if (!IsVisible)
            {
                base.OnPreRender(e);
                return;
            }

            DisplayInformation();

            var iconControl = _prcControl.FindControlRecursive("PRCIcon");

            if (!string.IsNullOrEmpty(TagContainer))
            {
                if (iconControl != null) 
                    iconControl.Visible = false;

                var toolbarControl = _prcControl.FindControlRecursive("prctoolbarmenu");
                if (toolbarControl != null)
                {
                    toolbarControl.Visible = true;
                    var containerControl = Page.FindControlRecursive(TagContainer) as PlaceHolder;
                    if (containerControl == null)
                        return;

                    containerControl.Controls.Clear();
                    containerControl.Controls.Add(toolbarControl);

                    UITools.RegisterStartupScript(
                            "PortalRemoteControlIds",
                            String.Format(@"SN.PortalRemoteControl.PRCToolbarId = '{0}';", toolbarControl.ClientID),
                            this.Page);
                }

            }
            else
            {
                if (iconControl != null)
                    UITools.RegisterStartupScript(
                            "PortalRemoteControlIds",
                            String.Format(@"SN.PortalRemoteControl.PRCIconId = '{0}'; ", iconControl.ClientID),
                            this.Page);
            }

            var scm = ScriptManager.GetCurrent(Page);
            if (scm == null)
                return;

            //TODO: move the function call into the init.js file after the global folder is transformed to 'default' skin
            UITools.RegisterStartupScript(
                    "PortalRemoteControlInit",
                    String.Format(@"SN.PortalRemoteControl.init('{0}'); ", "PortalRemoteControl"),
                    this.Page);

            base.OnPreRender(e);
        }

        // internals ////////////////////////////////////////////////////////////////

        /// <summary>
        /// Displays the information at the top of the Portal Remote Control header.
        /// </summary>
        private void DisplayInformation()
        {
            var node = ContextNode;
            if (node == null)
                return;

            // Content name
            var text = HttpContext.GetGlobalResourceObject("PortalRemoteControl", "ContentName") as string;
            var infoLabel = _prcControl.FindControlRecursive("ContentNameLabel") as Label;
            if (infoLabel != null)
            {
                infoLabel.Text = string.Format(text ?? "{0}", node.Name);
                infoLabel.ToolTip = node.Path;
            }

            // Content type
            text = HttpContext.GetGlobalResourceObject("PortalRemoteControl", "ContentType") as string;
            infoLabel = _prcControl.FindControlRecursive("ContentTypeLabel") as Label;
            if (infoLabel != null)
                infoLabel.Text = string.Format(text ?? "{0}", node.NodeType.Name);

            // Content type icon
            string iconPath;
            if (node is GenericContent) iconPath = IconHelper.ResolveIconPath((node as GenericContent).Icon, 16);
            else if (node is ContentType) iconPath = IconHelper.ResolveIconPath((node as ContentType).Icon, 16);
            else iconPath = "";
            var ctImage = _prcControl.FindControlRecursive("ContentTypeImage") as System.Web.UI.WebControls.Image;
            if (!string.IsNullOrEmpty(iconPath) && ctImage != null)
                ctImage.ImageUrl = iconPath;

            // Version
            text = HttpContext.GetGlobalResourceObject("PortalRemoteControl", "Version") as string;
            infoLabel = _prcControl.FindControlRecursive("VersionLabel") as Label;
            if (infoLabel != null && !string.IsNullOrEmpty(text))
                infoLabel.Text = string.Format(text, node.Version.VersionString);

            // Page mode
            infoLabel = _prcControl.FindControlRecursive("ModeLabel") as Label;
            if (infoLabel != null && !string.IsNullOrEmpty(text))
            {
                if (IsApplicationMode)
                {
                    infoLabel.Visible = true;
                    text = HttpContext.GetGlobalResourceObject("PortalRemoteControl", "PageMode") as string;
                    var wpm = this.WPManager;
                    var modeName = wpm.DisplayMode == wpm.DisplayModes["Browse"]
                                       ? HttpContext.GetGlobalResourceObject("PortalRemoteControl", "Preview") as string
                                       : HttpContext.GetGlobalResourceObject("PortalRemoteControl", "Edit") as string;

                    if (!string.IsNullOrEmpty(text))
                        infoLabel.Text = string.Format(text, modeName);
                }
                else
                {
                    infoLabel.Visible = false;
                }
            }

            // Checked out
            infoLabel = _prcControl.FindControlRecursive("CheckedOutByLabel") as Label;
            if (infoLabel != null)
            {
                if (node.Locked)
                {
                    infoLabel.Text = (HttpContext.GetGlobalResourceObject("PortalRemoteControl", "Checked-out") as string);

                    var checkedOutLink = _prcControl.FindControlRecursive("CheckedOutLink") as System.Web.UI.WebControls.HyperLink;
                    if (checkedOutLink != null)
                    {
                        checkedOutLink.Visible = true;
                        checkedOutLink.NavigateUrl = node.LockedBy.Path;
                        checkedOutLink.Text = node.LockedBy.Username;
                    }

                    if (User.Current.Id != node.LockedById && !string.IsNullOrEmpty(node.LockedBy.Email))
                    {
                        var sendMailLink = _prcControl.FindControlRecursive("SendMessageLink") as System.Web.UI.WebControls.HyperLink;
                        if (sendMailLink != null)
                        {
                            sendMailLink.Visible = true;
                            sendMailLink.NavigateUrl = string.Format("mailto:{0}?subject={1}&body={2}{3}",
                                node.LockedBy.Email,
                                (HttpContext.GetGlobalResourceObject("PortalRemoteControl", "MailSubject") as string),
                                (HttpContext.GetGlobalResourceObject("PortalRemoteControl", "MailBody") as string),
                                PortalContext.Current.UrlWithoutBackUrl);
                        }
                    }
                }
                else
                {
                    text = HttpContext.GetGlobalResourceObject("PortalRemoteControl", "CheckedIn") as string;
                    infoLabel.Text = text;
                }
            }

            // Last modified
            text = HttpContext.GetGlobalResourceObject("PortalRemoteControl", "LastModified") as string;
            infoLabel = _prcControl.FindControlRecursive("LastModifiedLabel") as Label;
            if (infoLabel != null && !string.IsNullOrEmpty(text))
            {
                infoLabel.Text = string.Format(text, node.ModificationDate);
            }

            // Modified by
            var modLink = _prcControl.FindControlRecursive("LastModifiedLink") as System.Web.UI.WebControls.HyperLink;
            if (modLink != null)
            {
                User modifier = null;
                try
                {
                    modifier = node.ModifiedBy as User;
                }
                catch (Exception ex)
                {
                    SnLog.WriteException(ex);
                }

                modLink.NavigateUrl = modifier == null ? string.Empty : modifier.Path;
                modLink.Text = modifier == null ? "unknown" : modifier.Name;
            }

            // Page template
            text = HttpContext.GetGlobalResourceObject("PortalRemoteControl", "PageTemplate") as string;
            infoLabel = _prcControl.FindControlRecursive("PageTemplateLabel") as Label;
            if (infoLabel != null && !string.IsNullOrEmpty(text) && Portal.Page.Current != null && Portal.Page.Current.PageTemplateNode != null)
                infoLabel.ToolTip = infoLabel.Text = string.Format(text, Portal.Page.Current.PageTemplateNode.Name);

            // Skin
            text = HttpContext.GetGlobalResourceObject("PortalRemoteControl", "Skin") as string;
            infoLabel = _prcControl.FindControlRecursive("SkinLabel") as Label;
            if (infoLabel != null && !string.IsNullOrEmpty(text))
                infoLabel.Text = string.Format(text, SkinManager.CurrentSkinName);

        }

        private void InitializeControl()
        {
            Control c;
            var app = PortalContext.Current.GetApplicationContext();
            var isExplore = PortalContext.Current.ActionName != null &&
                            PortalContext.Current.ActionName.ToLower() == "explore";

            var browseLink = _prcControl.FindControlRecursive("BrowseLink") as System.Web.UI.WebControls.HyperLink;
            if (browseLink != null)
            {
                if (PortalContext.Current.ActionName == null || PortalContext.Current.ActionName.ToLower() == "browse")
                    browseLink.Visible = false;
            }

            var browseAppLink = _prcControl.FindControlRecursive("BrowseApp") as ActionLinkButton;
            if (browseAppLink != null)
            {
                if (app != null)
                {
                    browseAppLink.Visible = false;
                }
                else if (isExplore)
                {
                    browseAppLink.ParameterString = browseAppLink.ParameterString.Replace("context={CurrentContextPath}", string.Empty);
                }
            }

            var wbpm = this.WPManager;
            if (wbpm != null)
            {
                if (wbpm.DisplayMode.Name == "Edit")
                {
                    SetControlVisibility("Rename", true);
                    SetControlVisibility("CopyTo", true);
                    SetControlVisibility("MoveTo", true);
                    SetControlVisibility("DeletePage", true);
                    
                    var hyperLink = _prcControl.FindControlRecursive("Browse") as System.Web.UI.WebControls.HyperLink;
                    if (hyperLink != null)
                        hyperLink.Visible = false;

                    SetControlVisibility("Versions", false);
                    SetControlVisibility("EditPage", false);
                    SetControlVisibility("SetPermissions", false);
                }
                else if (wbpm.DisplayMode.Name == "Browse")
                {
                    SetControlVisibility("Versions", true);
                    SetControlVisibility("EditPage", true);
                    SetControlVisibility("SetPermissions", true);
                }

                var displayModeLink = _prcControl.FindControlRecursive("WebPartDisplayMode") as WebControl;
                if (displayModeLink != null)
                {
                    if (wbpm.DisplayMode == WebPartManager.BrowseDisplayMode)
                    {
                        var editModeVisible = IsApplicationMode &&
                                             (SavingAction.HasCheckOut(Portal.Page.Current) ||
                                              SavingAction.HasCheckIn(Portal.Page.Current) ||
                                              SavingAction.HasForceUndoCheckOutRight(Portal.Page.Current));

                        if (!editModeVisible)
                            displayModeLink.Visible = false;
                        else
                            displayModeLink.ToolTip = SR.GetString(SR.PRC.EditMode);
                    }
                    else
                    {
                        displayModeLink.ToolTip = SR.GetString(SR.PRC.BrowseMode);
                    }
                }
            }

            c = _prcControl.FindControlRecursive("CustomActionsHeader");
            if (c != null)
            {
                var context = app ?? PortalContext.Current.ContextNode;
                c.Visible = context != null && ActionFramework.GetActions(ContentRepository.Content.Create(context), "Prc", null).Any();
            }

            // hide or show Explore links, based on whether we are in Content Explorer or not
            SetControlVisibility("ExploreRootLink", isExplore);
            SetControlVisibility("BrowseRoot", !isExplore);
            SetControlVisibility("ExploreAdvancedLink", !isExplore);

            // show or hide the correct 'Back to content' action
            var btcPanel = _prcControl.FindControlRecursive("BackToContentPanel");
            var boAction = _prcControl.FindControlRecursive("BrowseOriginalContent");

            var urlNodePath = HttpContext.Current.Request.Params[PortalContext.ContextNodeParamName];
            if (!string.IsNullOrEmpty(urlNodePath))
            {
                var backUrl = PortalContext.Current.BackUrl;
                if (!string.IsNullOrEmpty(backUrl))
                    btcPanel.Visible = true;
                else
                    boAction.Visible = true;
            }
        }

        private void HandlePostback()
        {
            var arg = HttpContext.Current.Request[EventArgumentParameter];
            if (string.IsNullOrEmpty(arg))
                return;

            if (string.CompareOrdinal(arg, EventArgumentWebpartEdit) == 0)
                EnterEditMode();
            else if (string.CompareOrdinal(arg, EventArgumentWebpartBrowse) == 0)
                EnterBrowseMode();
            else if (string.CompareOrdinal(arg, EventArgumentAddPortlet) == 0)
                AddPortlet();
        }

        private void EnterEditMode()
        {
            var wpm = this.WPManager;
            if (wpm == null)
                return;

            var mode = wpm.SupportedDisplayModes[DisplayModeEdit];
            if (mode == null)
                return;

            wpm.DisplayMode = mode;

            if (SavingAction.HasCheckOut(Portal.Page.Current))
                Portal.Page.Current.CheckOut();

            ResetVersioningButtons();
        }

        private void EnterBrowseMode()
        {
            var wpm = this.WPManager;
            if (wpm == null)
                return;

            var mode = wpm.SupportedDisplayModes[DisplayModeBrowse];
            if (mode == null)
                return;

            wpm.DisplayMode = mode;

            ResetVersioningButtons();
        }

        private void AddPortlet()
        {
            var addPortletTextBox = _prcControl.FindControlRecursive("AddPortletButtonTextBox") as TextBox;
            if (addPortletTextBox == null)
                return;

            var addPortletInfo = addPortletTextBox.Text;
            var portletParams = addPortletInfo.Split(';');
            if (portletParams.Length != 2)
                return;

            this.AddPortlet(int.Parse(portletParams[0]), portletParams[1]);
        }

        /// <summary>
        /// Refreshes versioning related ActionLinkButtons after changing the versioning state of the content.
        /// </summary>
        private void ResetVersioningButtons()
        {
            var c = _prcControl.FindControlRecursive("CheckoutButton") as ActionLinkButton;
            if (c != null) c.Reset();
            c = _prcControl.FindControlRecursive("CheckinButton") as ActionLinkButton;
            if (c != null) c.Reset();
            c = _prcControl.FindControlRecursive("PublishButton") as ActionLinkButton;
            if (c != null) c.Reset();
            c = _prcControl.FindControlRecursive("Approve") as ActionLinkButton;
            if (c != null) c.Reset();
            c = _prcControl.FindControlRecursive("UndoCheckoutButton") as ActionLinkButton;
            if (c != null) c.Reset();
            c = _prcControl.FindControlRecursive("ForceUndoCheckOut") as ActionLinkButton;
            if (c != null) c.Reset();
        }

        private void AddPortlet(int portletId, string zoneId)
        {
            var portlet = Node.LoadNode(portletId);
            var typeName = portlet["TypeName"].ToString();
            var wpz = WPManager.Zones[zoneId];
            if (wpz == null)
                return;

            var privateType = Type.GetType(typeName);
            object instance = null;
            try
            {
                instance = Activator.CreateInstance(privateType);
            }
            catch (Exception e)
            {
                SnLog.WriteException(e);
            }
            var wp = (WebPart)instance;
            if (wp != null)
                WPManager.AddWebPart(wp, wpz, 0);

            var mode = WPManager.SupportedDisplayModes["Edit"];
            if (mode != null)
            {
                WPManager.DisplayMode = mode;
                InitializeControl();
            }

            var snwpm = this.WPManager as SNWebPartManager;
            if (snwpm != null)
                snwpm.SetDirty();
        }

        private IEnumerable<ISecurityContainer> GetAdminGroups()
        {
            var ag = new List<ISecurityContainer>();
            if (string.IsNullOrEmpty(this.Groups))
                return ag;

            var ags = this.Groups.Split(new[] { ',', ';', ' ' }, StringSplitOptions.RemoveEmptyEntries);

            using (new SystemAccount())
            {
                foreach (var agName in ags)
                {
                    try
                    {
                        if (agName.StartsWith("/Root/"))
                        {
                            var group = Node.LoadNode(agName) as ISecurityContainer;
                            if (group != null)
                                ag.Add(group);
                        }
                        else
                        {
                            ContentQuery cq = null;
                            var nameParts = agName.Split(new[] { '\\' }, StringSplitOptions.RemoveEmptyEntries);
                            var containerTypes = new[] { "Group", "OrganizationalUnit" };
                            switch (nameParts.Length)
                            {
                                case 0:
                                    break;
                                case 1:
                                    // load group or OU only by name
                                    cq = ContentQuery.CreateQuery(ContentRepository.SafeQueries.TypeIsAndName, null, containerTypes, nameParts[0]);
                                    break;
                                default:
                                    // load group or OU by domain and name
                                    var domain = ContentQuery.Query(ContentRepository.SafeQueries.TypeIsAndName, null, "Domain", nameParts[0]).Nodes.FirstOrDefault();
                                    if (domain != null)
                                        cq = ContentQuery.CreateQuery(ContentRepository.SafeQueries.InTreeAndTypeIsAndName, null,
                                            domain.Path, containerTypes, nameParts[1]);
                                    break;
                            }

                            if (cq != null)
                                ag.AddRange(cq.Execute().Nodes.Cast<ISecurityContainer>());
                        }
                    }
                    catch (Exception ex)
                    {
                        SnLog.WriteException(ex);
                    }
                }
            }

            return ag;
        }

        /// <summary>
        /// Fires when the selected webpart has changed.
        /// </summary>
        /// <param name="sender">The sender.</param>
        /// <param name="e">The <see cref="System.Web.UI.WebControls.WebParts.WebPartEventArgs"/> instance containing the event data.</param>
        private void WpmSelectedWebPartChanged(object sender, WebPartEventArgs e)
        {
            ToggleEditorZone(e.WebPart, this.Page);
        }

        /// <summary>
        /// Toggles the editor zone.
        /// </summary>
        /// <param name="webPart">The selected portlet.</param>
        /// <param name="page">Running Page instance.</param>
        internal static void ToggleEditorZone(IWebPart webPart, System.Web.UI.Page page)
        {
            var wpm = WebPartManager.GetCurrentWebPartManager(page);
            if (wpm == null)
                return;

            var mode = wpm.DisplayMode;
            var selectedWebPart = wpm.SelectedWebPart;
            var displaySidePanel = ((mode == WebPartManager.EditDisplayMode && selectedWebPart != null) || (mode == WebPartManager.CatalogDisplayMode) || (mode == WebPartManager.ConnectDisplayMode && selectedWebPart != null));

            if (!displaySidePanel)
                return;
            if (webPart == null)
                return;

            var toolPanel = page.Master.FindControl("snToolPanel") as HtmlGenericControl;
            if (toolPanel == null)
                throw new ApplicationException("sndlgToolPanel element does not exist in the MasterPage.");

            string webPartName = string.Empty;
            var portletBase = webPart as PortletBase;
            if (portletBase != null)
                webPartName = SenseNetResourceManager.Current.GetString(portletBase.Name);
            var webPartTypeName = webPart.GetType().Name;
            var title = String.Format(SenseNetResourceManager.Current.GetString("PortletFramework", "PortletDialog_Title"), webPartName, webPartTypeName);
            var callback = String.Format(@"SN.PortalRemoteControl.showDialog('{0}', {{ autoOpen: true, width: 850, height:600, minWidth: 800, minHeight: 550, resize: SN.PortalRemoteControl.ResizePortletEditorAccordion }});", toolPanel.ClientID);
            var editorZone = page.Master.FindControlRecursive("EditorZone_Editor") as CollapsibleEditorZone;
            if (editorZone != null)
            {
                var p = page.ClientScript.GetPostBackEventReference(editorZone, "cancel");
                callback = String.Format(
                    @"SN.PortalRemoteControl.showDialog('{0}', {{ autoOpen: true, width: 850, height:600, minWidth: 800, minHeight: 550, resize: SN.PortalRemoteControl.ResizePortletEditorAccordion, title:'{1}', close: function(event,ui) {{ {2}; }} }} );",
                    toolPanel.ClientID, title, p);
            }

            UITools.RegisterStartupScript("PropertyGridEditorShow", callback, page);
        }

        private void SetControlVisibility(string name, bool visible)
        {
            if (_prcControl == null)
                return;

            var c = _prcControl.FindControlRecursive(name);
            if (c != null)
                c.Visible = visible;
        }
    }
}
