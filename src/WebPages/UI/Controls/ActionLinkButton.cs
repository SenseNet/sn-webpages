using System;
using System.Linq;
using System.Text;
using System.Web.UI;
using System.Web.UI.WebControls;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Storage.Security;
using SenseNet.Portal.UI.PortletFramework;
using SenseNet.Portal.Virtualization;
using SenseNet.ApplicationModel;
using Content = SenseNet.ContentRepository.Content;
using System.Web;
using SenseNet.ContentRepository.Fields;
using SenseNet.ContentRepository.Storage;
using SenseNet.Diagnostics;
using SenseNet.ContentRepository.Storage.Schema;
using System.Collections.Generic;
using SenseNet.Portal.ApplicationModel;

namespace SenseNet.Portal.UI.Controls
{
    [ToolboxData("<{0}:ActionLinkButton ID=\"ActionLinkButton1\" runat=server></{0}:ActionLinkButton>")]
    public class ActionLinkButton : System.Web.UI.WebControls.HyperLink, IActionUiAdapter
    {
        // Properties

        #region IActionUiAdapter Members

        public string NodePath { get; set; }
        public string ContextInfoID { get; set; }
        public string WrapperCssClass { get; set; }
        public string Scenario { get; set; }
        public string ScenarioParameters { get; set; }
        public string ActionName { get; set; }
        public bool OverlayVisible { get; set; }

        private string _iconName;
        public string IconName
        {
            get { return _iconName ?? (Action != null ? Action.Icon : null); }
            set { _iconName = value; }
        }

        public string IconUrl { get; set; }

        #endregion

        public string ParameterString { get; set; }

        private object _parameters;
        public object Parameters
        {
            get { return _parameters ?? (_parameters = ActionFramework.ParseParameters(ReplaceTokens(ParameterString))); }
            set { _parameters = value; }
        }

        private bool _iconVisible = true;
        public bool IconVisible
        {
            get { return _iconVisible; }
            set { _iconVisible = value; }
        }

        private int _iconSize = 16;
        public int IconSize
        {
            get { return _iconSize; }
            set { _iconSize = value; }
        }

        public bool UseContentIcon { get; set; }

        public string SpanClass { get; set; }

        public bool? IncludeBackUrl { get; set; }

        public bool CheckActionCount { get; set; }

        public string Overlay { get; set; }

        public string Template { get; set; }

        public override string CssClass
        {
            get
            {
                var computedClass = base.CssClass ?? string.Empty;
                if (Action != null)
                {
                    if (Action.Forbidden)
                        computedClass += " sn-disabled";

                    if (!string.IsNullOrEmpty(Action.CssClass))
                        computedClass += " " + this.Action.CssClass;
                }

                return computedClass.Trim(' ');
            }
            set { base.CssClass = value; }
        }

        private ContextBoundPortlet _ctxBoundPortlet;
        protected ContextBoundPortlet ContainingContextBoundPortlet
        {
            get
            {
                return _ctxBoundPortlet ?? (_ctxBoundPortlet = ContextBoundPortlet.GetContainingContextBoundPortlet(this));
            }
        }

        // ======================================================== Overrides

        protected override void OnPreRender(EventArgs e)
        {
            base.OnPreRender(e);

            // hide action link if action is empty
            if (Action == null)
                this.Visible = false;
        }

        protected override void Render(HtmlTextWriter writer)
        {
            // render nothing if the action does not exist
            if (Action == null)
                return;

            var actionClickable = true;

            if (CheckActionCount)
            {
                var am = ActionMenu.FindContainerActionMenu(this);
                List<ActionBase> scActions = null;
                var scenario = string.Empty;

                if (am != null)
                {
                    scenario = am.Scenario;

                    if (!string.IsNullOrEmpty(scenario))
                        scActions = ActionFramework.GetActions(Content.Load(ContextPath), scenario, am.GetReplacedScenarioParameters()).ToList();
                }

                if (scActions != null)
                {
                    if (scActions.Count > 1)
                    {
                        actionClickable = false;
                    }
                    else if (scActions.Count == 1 
                        && string.Equals(scenario, "new", StringComparison.CurrentCultureIgnoreCase)
                        && string.Equals(this.ActionName, "add", StringComparison.CurrentCultureIgnoreCase))
                    {
                        // change action to the single "New" action found in the parent menu
                        _action = scActions.First();
                        _actionChecked = true;

                        this.Text = this.Text + " " + _action.Text;
                    }
                }
            }

            if (actionClickable)
            {
                var claction = Action as ClientAction;
                if (claction != null && claction.Callback != null)
                {
                    NavigateUrl = "javascript:";
                    this.Attributes["onclick"] = claction.Callback;
                }
                else
                {
                    NavigateUrl = Action.Uri;
                }
            }

            // load html template (provided by the builder)
            string templateText = null;
            if (!string.IsNullOrEmpty(Template))
                templateText = HtmlTemplate.GetActionLinkTemplate(Template);

            // load html template (by default names)
            if (string.IsNullOrEmpty(templateText))
            {
                templateText = IconVisible
                    ? (string.IsNullOrEmpty(IconUrl)
                        ? HtmlTemplate.GetActionLinkTemplate(HtmlTemplate.Names.ActionButton)       // icon is rendered as a <span>
                        : HtmlTemplate.GetActionLinkTemplate(HtmlTemplate.Names.ActionImageButton)) // icon is rendered as an <image> tag
                    : HtmlTemplate.GetActionLinkTemplate(HtmlTemplate.Names.ActionLink);            // no icon
            }

            // add actionlinkbutton class only if there is no template
            if (string.IsNullOrEmpty(templateText))
                this.CssClass += " sn-actionlinkbutton";

            // fill control properties according to the current state of the action
            FillProperties();

            // if a template was found, fill its parameters and render it
            if (!string.IsNullOrEmpty(templateText))
            {
                writer.Write(TemplateManager.Replace(typeof(ActionTemplateReplacer), templateText, this));
                return;
            }

            // backward compatibility (classic ASP.NET behavior, when there is no html template)
            base.Render(writer);
        }

        public override void RenderBeginTag(HtmlTextWriter writer)
        {
            base.RenderBeginTag(writer);

            if (!IconVisible)
                return;
            
            if (!string.IsNullOrEmpty(SpanClass))
            {
                writer.Write(IconHelper.RenderIconTagWithSpan(SpanClass, this.ToolTip));
            }
            else
            {
                writer.Write(!string.IsNullOrEmpty(IconUrl)
                    ? IconHelper.RenderIconTagFromPath(IconUrl, this.Overlay, IconSize, this.ToolTip)
                    : IconHelper.RenderIconTag(IconName, this.Overlay, IconSize, this.ToolTip));
            }
        }

        private void FillProperties()
        {
            if (Action.Forbidden)
            {
                this.Enabled = false;
                this.NavigateUrl = string.Empty;
            }

            if (!IconVisible)
                return;

            var content = this.Action != null ? this.Action.GetContent() : null;
            if (UseContentIcon && content != null)
                IconName = content.Icon;

            string title = null;
            this.Overlay = OverlayVisible ? IconHelper.GetOverlay(content, out title) : string.Empty;

            if (!string.IsNullOrEmpty(title))
                this.ToolTip = title;
        }

        // ======================================================== Internals

        private string _contextPath;
        protected virtual string ContextPath
        {
            get
            {
                if (string.IsNullOrEmpty(_contextPath))
                {
                    var context = UITools.FindContextInfo(this, ContextInfoID);
                    if (context != null)
                    {
                        _contextPath = context.Path;

                        // NodePath may contain a relative path
                        if (!string.IsNullOrEmpty(NodePath))
                        {
                            _contextPath = RepositoryPath.Combine(_contextPath, NodePath);
                        }
                    }
                    else if (!string.IsNullOrEmpty(NodePath))
                        _contextPath = NodePath;
                    else
                        _contextPath = ContentView.GetContentPath(Parent);
                }

                return _contextPath ?? string.Empty;
            }
        }

        private bool _actionChecked;
        private ActionBase _action;
        public ActionBase Action
        {
            get
            {
                if (!_actionChecked && _action == null && !string.IsNullOrEmpty(ActionName))
                {
                    _actionChecked = true;

                    try
                    {
                        var nodeHead = NodeHead.Get(ContextPath);
                        if (nodeHead == null || !SecurityHandler.HasPermission(nodeHead, PermissionType.See, PermissionType.Preview))
                            return null;

                        var c = Content.Load(ContextPath);
                        if (c != null)
                        {
                            _action = ActionFramework.GetAction(ActionName, c, Parameters);

                            if (_action != null && this.IncludeBackUrl.HasValue)
                                _action.IncludeBackUrl = IncludeBackUrl.Value;
                        }
                    }
                    catch (Exception ex)
                    {
                        SnLog.WriteException(ex);
                    }
                }

                return _action;
            }
            set
            {
                _action = value;
                _actionChecked = true;
            }
        }

        // ======================================================== Helper methods

        public void Reset()
        {
            _action = null;
            _actionChecked = false;
            this.Visible = true;
        }

        private string ReplaceTokens(string parameterString)
        {
            var result = parameterString;

            //TODO: refactor parameter token replacement!
            if (!string.IsNullOrEmpty(result))
            {
                if (result.Contains("{PortletClientID}"))
                {
                    if (ContainingContextBoundPortlet != null)
                        result = result.Replace("{PortletClientID}", "PortletClientID=" + ContainingContextBoundPortlet.ClientID);
                }

                if (result.Contains("{CurrentContextPath}"))
                {
                    var ctxPath = string.Empty;

                    if (ContainingContextBoundPortlet != null)
                        ctxPath = ContainingContextBoundPortlet.ContextNode.Path;
                    else if (PortalContext.Current != null)
                        ctxPath = PortalContext.Current.ContextNodePath;
                    
                    result = result.Replace("{CurrentContextPath}", ctxPath);
                }
            }

            return result;
        }
    }
}
