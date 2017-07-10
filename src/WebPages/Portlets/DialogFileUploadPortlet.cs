using System;
using SenseNet.Portal.UI.PortletFramework;
using System.Web.UI.WebControls.WebParts;

namespace SenseNet.Portal.Portlets
{
    public class DialogFileUploadPortlet : ContextBoundPortlet
    {
        private const string DialogFileUploadPortletClass = "DialogFileUploadPortlet";
        private const string  VIEWPATH = "/Root/System/SystemPlugins/Controls/DialogFileUpload.ascx";

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(DialogFileUploadPortletClass, "Prop_AllowedContentTypes_DisplayName")]
        [LocalizedWebDescription(DialogFileUploadPortletClass, "Prop_AllowedContentTypes_Description")]
        [WebCategory("Dialog File Upload", 100)]
        [WebOrder(100)]
        public string AllowedContentTypes { get; set; }

        public DialogFileUploadPortlet()
        {
            this.Name = "$DialogFileUploadPortlet:PortletDisplayName";
            this.Description = "$DialogFileUploadPortlet:PortletDescription";
            this.Category = new PortletCategory(PortletCategoryType.Application);
        }

        protected override void OnInit(EventArgs e)
        {
            var control = this.Page.LoadControl(VIEWPATH) as UI.Controls.DialogFileUpload;
            if (control != null)
            {
                control.AllowedContentTypes = this.AllowedContentTypes;
                this.Controls.Add(control);
            }

            base.OnInit(e);
        }
    }
}
