using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using SenseNet.ApplicationModel;
using SenseNet.Diagnostics;
using SenseNet.Portal.UI.Controls;
using SenseNet.Portal.UI.PortletFramework;
using SenseNet.Portal.Virtualization;

namespace SenseNet.Portal.Portlets
{
    public class ApplicationListPresenterPortlet : ContextBoundPortlet
    {
        private const string ApplicationListPresenterPortletClass = "ApplicationListPresenterPortlet";

        public ApplicationListPresenterPortlet()
        {
            Name = "$ApplicationListPresenterPortlet:PortletDisplayName";
            Description = "$ApplicationListPresenterPortlet:PortletDescription";
            this.Category = new PortletCategory(PortletCategoryType.Content);

            this.HiddenProperties.Add("Renderer");
        }

        private string _controlPath = "/Root/System/SystemPlugins/Portlets/ApplicationList/ApplicationList.ascx";
        private bool _isHidden = true;

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(PORTLETFRAMEWORK_CLASSNAME, RENDERER_DISPLAYNAME)]
        [LocalizedWebDescription(PORTLETFRAMEWORK_CLASSNAME, RENDERER_DESCRIPTION)]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(100)]
        [Editor(typeof(ViewPickerEditorPartField), typeof(IEditorPartField))]
        [ContentPickerEditorPartOptions(ContentPickerCommonType.Ascx)]
        public string ControlPath
        {
            get { return _controlPath; }
            set { _controlPath = value; }
        }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ApplicationListPresenterPortletClass, "Prop_IsHidden_DisplayName")]
        [LocalizedWebDescription(ApplicationListPresenterPortletClass, "Prop_IsHidden_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(100)]
        public bool IsHidden
        {
            get { return _isHidden; }
            set { _isHidden = value; }
        }

        // portlet uses custom ascx, hide renderer property
        [WebBrowsable(false), Personalizable(true)]
        public override string Renderer { get; set; }


        private ListView _appListView;
        protected ListView ApplicationListView
        {
            get
            {
                return _appListView ?? (_appListView = this.FindControlRecursive("ApplicationListView") as ListView);
            }
        }

        protected override void CreateChildControls()
        {
            Controls.Clear();

            try
            {
                var viewControl = Page.LoadControl(ControlPath) as UserControl;
                if (viewControl != null)
                {
                    Controls.Add(viewControl);
                    FillControls();
                }
            }
            catch (Exception exc)
            {
                SnLog.WriteException(exc);
            }

            ChildControlsCreated = true;
        }

        protected void FillControls()
        {
            if (ApplicationListView == null)
                return;
            var apps = ApplicationStorage.Instance.GetApplications(ContentRepository.Content.Create(ContextNode), PortalContext.Current.DeviceName);

            ApplicationListView.DataSource = apps;
            ApplicationListView.DataBind();
        }
    }
}
