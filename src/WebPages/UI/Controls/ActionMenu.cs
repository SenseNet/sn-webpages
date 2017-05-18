using System;
using System.Collections.Generic;
using System.Web.UI;
using System.Web.UI.WebControls;
using SenseNet.ApplicationModel;
using SenseNet.ContentRepository;
using SenseNet.Portal.Resources;
using SenseNet.Portal.Virtualization;
using System.ComponentModel;
using System.Linq;
using SenseNet.ContentRepository.Storage.Security;
using SenseNet.ContentRepository.Storage;
using SenseNet.Portal.OData;
using SenseNet.Portal.UI.Controls;
using Content = SenseNet.ContentRepository.Content;

[assembly: WebResource(ActionMenu.ClientResourceName, "application/x-javascript")]

namespace SenseNet.Portal.UI.Controls
{
    public enum ActionMenuMode
    {
        Default = 0,
        Text = 1,
        Link = 2,
        Split = 3
    }
    [ToolboxData("<{0}:ActionMenu ID=\"ActionMenu1\" runat=server></{0}:ActionMenu>")]
    public class ActionMenu : Label, IScriptControl, IActionUiAdapter
    {
        public const string ClientResourceName = "SenseNet.WebPages.UI.Controls.ActionMenu.js";

        // Members /////////////////////////////////////////////////////

        public string ServiceUrl { get; set; }
        public string Href { get; set; }
        [DefaultValue(typeof(ActionMenuMode), "Default")]
        public ActionMenuMode Mode { get; set; }
        public string LoadingText { get; set; }
        public string ItemHoverCssClass { get; set; }
        public bool CheckActionCount { get; set; }
        public string RequiredPermissions { get; set; }
        protected bool ClickDisabled { get; set; }

        protected Content Content { get; set; }

        // Events //////////////////////////////////////////////////////

        protected override void OnInit(EventArgs e)
        {
            UITools.AddPickerCss();

            UITools.AddScript(UITools.ClientScriptConfigurations.MSAjaxPath);
            UITools.AddScript(UITools.ClientScriptConfigurations.jQueryPath);
            UITools.AddScript(UITools.ClientScriptConfigurations.SNWebdavPath);

            if (!SkinManager.IsNewSkin())
            {
                UITools.AddScript(UITools.ClientScriptConfigurations.SNPickerPath);
                UITools.AddScript(UITools.ClientScriptConfigurations.SNUploadPath);
            }

            UITools.AddScript(ResourceScripter.GetResourceUrl("ActionMenu"));

            base.OnInit(e);
        }

        // Rendering //////////////////////////////////////////////////

        public override void RenderBeginTag(HtmlTextWriter writer)
        {
            if (ClickDisabled)
                return;

            var wrapperCssClass = PrepareWrapperCssClass();

            writer.Write(@"<span id=""{1}"" class=""{0}"">", wrapperCssClass, ClientID);

            if (!string.IsNullOrEmpty(CssClass))
                CssClass = "sn-actionmenu-inner ui-state-default ui-corner-all " + CssClass;
            else
                CssClass = "sn-actionmenu-inner ui-state-default ui-corner-all";

            base.RenderBeginTag(writer);

            var title = string.Empty;
            var overlay = OverlayVisible ? IconHelper.GetOverlay(this.Content, out title) : string.Empty;

            if (!string.IsNullOrEmpty(IconUrl))
                writer.Write(IconHelper.RenderIconTagFromPath(IconUrl, overlay, 16, title));
            else if (!string.IsNullOrEmpty(IconName))
                writer.Write(IconHelper.RenderIconTag(IconName, overlay, 16, title));
        }

        public override void RenderEndTag(HtmlTextWriter writer)
        {
            if (ClickDisabled)
                return;

            base.RenderEndTag(writer);

            writer.Write("</span>");
        }

        protected override void OnPreRender(EventArgs e)
        {
            if (!ClickDisabled)
            {
                var page = ScriptManager.GetCurrent(Page);
                if (page != null)
                    page.RegisterScriptControl(this);
            }

            base.OnPreRender(e);
        }

        protected override void Render(HtmlTextWriter writer)
        {
            if (!ClickDisabled)
            {
                var page = ScriptManager.GetCurrent(Page);
                if (page != null)
                    page.RegisterScriptDescriptors(this);
            }

            base.Render(writer);
        }

        protected override void CreateChildControls()
        {
            base.CreateChildControls();

            SetServiceUrl();
        }

        // IScriptControl members /////////////////////////////////////

        /// <summary>
        /// Gets a collection of script descriptors that represent ECMAScript (JavaScript) client components.
        /// </summary>
        /// <returns>
        /// An <see cref="T:System.Collections.IEnumerable"/> collection of <see cref="T:System.Web.UI.ScriptDescriptor"/> objects.
        /// </returns>
        public IEnumerable<ScriptDescriptor> GetScriptDescriptors()
        {
            var descriptor = new ScriptControlDescriptor("SenseNet.Portal.UI.Controls.ActionMenu", ClientID);
            descriptor.AddProperty("ServiceUrl", ServiceUrl);
            descriptor.AddProperty("WrapperCssClass", PrepareWrapperCssClass());
            descriptor.AddProperty("Mode", GetModeName);
            descriptor.AddProperty("ItemHoverCssClass", ItemHoverCssClass);
            yield return descriptor;
        }
        /// <summary>
        /// Gets a collection of <see cref="T:System.Web.UI.ScriptReference"/> objects that define script resources that the control requires.
        /// </summary>
        /// <returns>
        /// An <see cref="T:System.Collections.IEnumerable"/> collection of <see cref="T:System.Web.UI.ScriptReference"/> objects.
        /// </returns>
        public IEnumerable<ScriptReference> GetScriptReferences()
        {
            yield return new ScriptReference(ClientResourceName, GetType().Assembly.FullName);
        }

        // IActionUiAdapter members ////////////////////////////////////////

        [PersistenceMode(PersistenceMode.Attribute)]
        public string NodePath { get; set; }
        public string ContextInfoID { get; set; }
        public string WrapperCssClass { get; set; }
        public string Scenario { get; set; }
        public string ScenarioParameters { get; set; }
        public string ActionName { get; set; }
        public string IconName { get; set; }
        public string IconUrl { get; set; }
        public bool OverlayVisible { get; set; }

        // Internals //////////////////////////////////////////////////

        private string GetModeName
        {
            get { return Enum.GetName(typeof(ActionMenuMode), Mode).ToLower(); }
        }
        private string PrepareWrapperCssClass()
        {
            var enumName = Enum.GetName(typeof(ActionMenuMode), Mode);
            return string.Concat("sn-actionmenu sn-actionmenu-", enumName.ToLower(), "-mode ui-widget", string.IsNullOrEmpty(WrapperCssClass) ? "" : String.Concat(" ", WrapperCssClass));
        }
        /// <summary>
        /// Sets the callback URL of the ActionMenu. It represents the service url with correct parameters for the actions.
        /// </summary>
        private void SetServiceUrl()
        {
            var scParams = GetReplacedScenarioParameters();
            var context = UITools.FindContextInfo(this, ContextInfoID);
            var path = !string.IsNullOrEmpty(ContextInfoID) ? context.Path : NodePath;

            var encodedReturnUrl = Uri.EscapeDataString(PortalContext.Current.RequestedUri.PathAndQuery);
            var encodedParams = Uri.EscapeDataString(scParams ?? string.Empty);

            if (string.IsNullOrEmpty(path))
                path = ContentView.GetContentPath(this);

            if (string.IsNullOrEmpty(path))
            {
                this.Visible = false;
                return;
            }

            var head = NodeHead.Get(path);
            if (head == null || !SecurityHandler.HasPermission(head, PermissionType.See))
            {
                this.Visible = false;
                return;
            }

            this.Content = Content.Load(path);

            // Pre-check action count. If empty, hide the action menu.
            if (CheckActionCount)
            {
                var actionCount = 0;

                if (!string.IsNullOrEmpty(Scenario))
                    actionCount = ActionFramework.GetActions(this.Content, Scenario, scParams, null).Count();

                if (actionCount < 2 && string.Equals(Scenario, "new", StringComparison.CurrentCultureIgnoreCase))
                {
                    ClickDisabled = true;
                }
                else if (actionCount == 0)
                {
                    this.Visible = false;
                    return;
                }
            }

            // Pre-check required permissions
            var permissions = SenseNet.ContentRepository.Fields.PermissionChoiceField.ConvertToPermissionTypes(RequiredPermissions).ToArray();
            if (permissions.Length > 0 && !SecurityHandler.HasPermission(head, permissions))
            {
                this.Visible = false;
                return;
            }

            ServiceUrl = string.Format(ODataTools.GetODataOperationUrl(path,  "SmartAppGetActions") + "?scenario={0}&back={1}&parameters={2}", Scenario, encodedReturnUrl, encodedParams);
        }

        public string GetReplacedScenarioParameters()
        {
            var scParams = ScenarioParameters;
            if (string.IsNullOrEmpty(scParams))
                return scParams;

            // backward compatibility
            if (scParams.StartsWith("{PortletID}"))
                scParams = string.Concat("PortletID=", scParams);

            return TemplateManager.Replace(typeof(PortletTemplateReplacer), scParams, this);
        }

        public static ActionMenu FindContainerActionMenu(Control control)
        {
            while (true)
            {
                if (control == null)
                    return null;

                var am = control as ActionMenu;
                if (am != null)
                    return am;

                control = control.Parent;
            }
        }
    }
}
