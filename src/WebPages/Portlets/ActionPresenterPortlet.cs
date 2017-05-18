using System;
using System.ComponentModel;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls.WebParts;
using SenseNet.ContentRepository.i18n;
using SenseNet.Diagnostics;
using SenseNet.Portal.UI.PortletFramework;
using SenseNet.Portal.UI.Controls;

namespace SenseNet.Portal.Portlets
{
    public class ActionPresenterPortlet : ContextBoundPortlet
    {
        private const string ActionPresenterPortletClass = "ActionPresenterPortlet";

        public enum IncludeBackUrlMode { Default, True, False }

        public ActionPresenterPortlet()
        {
            Name = "$ActionPresenterPortlet:PortletDisplayName";
            Description = "$ActionPresenterPortlet:PortletDescription";
            this.Category = new PortletCategory(PortletCategoryType.Portal);

            this.HiddenProperties.Add("Renderer");
        }

        private static readonly string GlobalControlPath = "/Root/System/SystemPlugins/Controls/ActionPresenter.ascx";
        private static readonly string SkinControlPath = "$skin/Templates/action/ActionPresenter.ascx";

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(PORTLETFRAMEWORK_CLASSNAME, RENDERER_DISPLAYNAME)]
        [LocalizedWebDescription(PORTLETFRAMEWORK_CLASSNAME, RENDERER_DESCRIPTION)]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(100)]
        [Editor(typeof(ViewPickerEditorPartField), typeof(IEditorPartField))]
        [ContentPickerEditorPartOptions(ContentPickerCommonType.Ascx)]
        public string ControlPath { get; set; }

        // portlet uses custom ascx, hide renderer property
        [WebBrowsable(false), Personalizable(true)]
        public override string Renderer { get; set; }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(ActionPresenterPortletClass, "Prop_ActionName_DisplayName")]
        [LocalizedWebDescription(ActionPresenterPortletClass, "Prop_ActionName_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(110)]
        public string ActionName { get; set; }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(ActionPresenterPortletClass, "Prop_ActionText_DisplayName")]
        [LocalizedWebDescription(ActionPresenterPortletClass, "Prop_ActionText_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(120)]
        public string ActionText { get; set; }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(ActionPresenterPortletClass, "Prop_ParameterString_DisplayName")]
        [LocalizedWebDescription(ActionPresenterPortletClass, "Prop_ParameterString_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(130)]
        public string ParameterString { get; set; }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(ActionPresenterPortletClass, "Prop_IconUrl_DisplayName")]
        [LocalizedWebDescription(ActionPresenterPortletClass, "Prop_IconUrl_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(140)]
        [Editor(typeof(ContentPickerEditorPartField), typeof(IEditorPartField))]
        [ContentPickerEditorPartOptions(ContentPickerCommonType.Icon)]
        public string IconUrl { get; set; }

        private bool _iconVisible = true;

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(ActionPresenterPortletClass, "Prop_IconVisible_DisplayName")]
        [LocalizedWebDescription(ActionPresenterPortletClass, "Prop_IconVisible_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(150)]
        public bool IconVisible 
        {
            get { return _iconVisible; }
            set { _iconVisible = value; } 
        }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(ActionPresenterPortletClass, "Prop_IncludeBackUrl_DisplayName")]
        [LocalizedWebDescription(ActionPresenterPortletClass, "Prop_IncludeBackUrl_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(160)]
        public IncludeBackUrlMode IncludeBackUrl { get; set; }

        private ActionLinkButton _actionLink;
        protected ActionLinkButton ActionLink
        {
            get { return _actionLink ?? (_actionLink = this.FindControlRecursive("ActionLink") as ActionLinkButton); }
        }

        protected override void CreateChildControls()
        {
            Controls.Clear();

            try
            {
                // start with the property that may be filled by the parent control
                var controlPath = ControlPath;

                // If the property is empty, try to load the control from under the skin. 
                // If it is not found there, the fallback is the old global path.
                if (string.IsNullOrEmpty(controlPath) && !SkinManager.TryResolve(SkinControlPath, out controlPath))
                    controlPath = GlobalControlPath;

                var viewControl = Page.LoadControl(controlPath) as UserControl;
                if (viewControl != null)
                {
                    Controls.Add(viewControl);
                    SetParameters();
                }
            }
            catch (Exception exc)
            {
                SnLog.WriteException(exc);
            }

            ChildControlsCreated = true;
        }

        private void SetParameters()
        {
            if (ActionLink == null)
                return;

            ActionLink.ActionName = ActionName;
            ActionLink.ParameterString = ParameterString;
            ActionLink.IconUrl = IconUrl;
            ActionLink.IconVisible = IconVisible;

            if (!string.IsNullOrEmpty(ActionText))
                ActionLink.Text = HttpUtility.HtmlEncode(SenseNetResourceManager.Current.GetString(ActionText));

            if (this.IncludeBackUrl != IncludeBackUrlMode.Default)
                ActionLink.IncludeBackUrl = this.IncludeBackUrl == IncludeBackUrlMode.True;

            var ctx = GetContextNode();
            if (ctx != null)
                ActionLink.NodePath = ctx.Path;
        }
    }
}
