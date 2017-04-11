using System;
using System.ComponentModel;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using SenseNet.ContentRepository.i18n;
using SenseNet.Diagnostics;
using SenseNet.Portal.UI.PortletFramework;
using SenseNet.Portal.UI.Controls;

namespace SenseNet.Portal.Portlets
{
    public class ActionListPresenterPortlet : ContextBoundPortlet
    {
        private const string ActionListPresenterPortletClass = "ActionListPresenterPortlet";

        public ActionListPresenterPortlet()
        {
            Name = "$ActionListPresenterPortlet:PortletDisplayName";
            Description = "$ActionListPresenterPortlet:PortletDescription";
            this.Category = new PortletCategory(PortletCategoryType.Portal);

            this.HiddenProperties.Add("Renderer");
        }

        private static readonly string GlobalControlPath = "/Root/System/SystemPlugins/Controls/ActionListPresenter.ascx";
        private static readonly string SkinControlPath = "$skin/Templates/action/ActionListPresenter.ascx";

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(PORTLETFRAMEWORK_CLASSNAME, RENDERER_DISPLAYNAME)]
        [LocalizedWebDescription(PORTLETFRAMEWORK_CLASSNAME, RENDERER_DESCRIPTION)]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [Editor(typeof(ViewPickerEditorPartField), typeof(IEditorPartField))]
        [ContentPickerEditorPartOptions(ContentPickerCommonType.Ascx)]
        [WebOrder(100)]
        public string ControlPath { get; set; }

        // portlet uses custom ascx, hide renderer property
        [WebBrowsable(false), Personalizable(true)]
        public override string Renderer { get; set; }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ActionListPresenterPortletClass, "Prop_Scenario_DisplayName")]
        [LocalizedWebDescription(ActionListPresenterPortletClass, "Prop_Scenario_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(110)]
        public string Scenario { get; set; }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ActionListPresenterPortletClass, "Prop_ScenarioParameters_DisplayName")]
        [LocalizedWebDescription(ActionListPresenterPortletClass, "Prop_ScenarioParameters_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(120)]
        public string ScenarioParameters { get; set; }

        [WebBrowsable(false), Personalizable(true)]
        [LocalizedWebDisplayName(ActionListPresenterPortletClass, "Prop_Mode_DisplayName")]
        [LocalizedWebDescription(ActionListPresenterPortletClass, "Prop_Mode_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(130)]
        public ActionMenuMode Mode { get; set; }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ActionListPresenterPortletClass, "Prop_ActionListText_DisplayName")]
        [LocalizedWebDescription(ActionListPresenterPortletClass, "Prop_ActionListText_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(140)]
        public string ActionListText { get; set; }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ActionListPresenterPortletClass, "Prop_IconUrl_DisplayName")]
        [LocalizedWebDescription(ActionListPresenterPortletClass, "Prop_IconUrl_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [Editor(typeof(ContentPickerEditorPartField), typeof(IEditorPartField))]
        [ContentPickerEditorPartOptions(ContentPickerCommonType.Icon)]
        [WebOrder(150)]
        public string IconUrl { get; set; }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ActionListPresenterPortletClass, "Prop_WrapperCssClass_DisplayName")]
        [LocalizedWebDescription(ActionListPresenterPortletClass, "Prop_WrapperCssClass_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(160)]
        public string WrapperCssClass { get; set; }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ActionListPresenterPortletClass, "Prop_ItemHoverCssClass_DisplayName")]
        [LocalizedWebDescription(ActionListPresenterPortletClass, "Prop_ItemHoverCssClass_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(170)]
        public string ItemHoverCssClass { get; set; }

        private bool _actionIconVisible = true;

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ActionListPresenterPortletClass, "Prop_ActionIconVisible_DisplayName")]
        [LocalizedWebDescription(ActionListPresenterPortletClass, "Prop_ActionIconVisible_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(180)]
        public bool ActionIconVisible
        {
            get { return _actionIconVisible; }
            set { _actionIconVisible = value; }
        }

        private ActionMenu _actionMenu;
        protected ActionMenu ActionMenu
        {
            get { return _actionMenu ?? (_actionMenu = this.FindControlRecursive("ActionMenu") as ActionMenu); }
        }

        private ActionList _actionList;
        protected ActionList ActionList
        {
            get { return _actionList ?? (_actionList = this.FindControlRecursive("ActionList") as ActionList); }
        }

        private ListView _actionListView;
        protected ListView ActionListView
        {
            get { return _actionListView ?? (_actionListView = this.FindControlRecursive("ActionListView") as ListView); }
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
            if (ActionMenu != null)
            {
                ActionMenu.Scenario = Scenario;
                ActionMenu.IconUrl = IconUrl;
                ActionMenu.ScenarioParameters = ScenarioParameters;
                ActionMenu.WrapperCssClass = WrapperCssClass;
                ActionMenu.ItemHoverCssClass = ItemHoverCssClass;

                if (!string.IsNullOrEmpty(ActionListText))
                    ActionMenu.Text = SenseNetResourceManager.Current.GetString(ActionListText);

                if (ContextNode != null)
                    ActionMenu.NodePath = ContextNode.Path;
            }

            if (ActionList != null)
            {
                ActionList.Scenario = Scenario;
                ActionList.ScenarioParameters = ScenarioParameters;
                ActionList.WrapperCssClass = WrapperCssClass;
                ActionList.ActionIconVisible = ActionIconVisible;

                if (!string.IsNullOrEmpty(ActionListText))
                    ActionList.Text = SenseNetResourceManager.Current.GetString(ActionListText);

                if (ContextNode != null)
                    ActionList.NodePath = ContextNode.Path;
            }
        }
    }
}
