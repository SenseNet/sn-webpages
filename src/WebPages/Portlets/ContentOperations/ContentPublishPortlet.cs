using System;
using System.ComponentModel;
using System.Web.UI.WebControls.WebParts;
using SenseNet.ContentRepository;
using SenseNet.Diagnostics;
using SenseNet.Portal.UI.PortletFramework;
using SenseNet.Portal.Virtualization;

namespace SenseNet.Portal.Portlets
{
    public class ContentPublishPortlet : ContextBoundPortlet
    {
        private const string ContentPublishPortletClass = "ContentPublishPortlet";

        private string _validationError = "/Root/System/SystemPlugins/Portlets/ContentPublish/ValidationError.ascx";
        private bool _needValidation = false;

        [LocalizedWebDisplayName(ContentPublishPortletClass, "Prop_NeedValidation_DisplayName")]
        [LocalizedWebDescription(ContentPublishPortletClass, "Prop_NeedValidation_Description")]
        [WebBrowsable(true), Personalizable(true)]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(100)]
        public bool NeedValidation
        {
            get { return _needValidation; }
            set { _needValidation = value; }
        }

        public ContentPublishPortlet()
        {
            this.Name = "$ContentPublishPortlet:PortletDisplayName";
            this.Description = "$ContentPublishPortlet:PortletDescription";
            this.Category = new PortletCategory(PortletCategoryType.ContentOperation);
        }

        protected override void OnInit(EventArgs e)
        {
            base.OnInit(e);

            var genericContent = GetContextNode() as GenericContent;
            if (genericContent != null)
            {
                try
                {
                    if (NeedValidation)
                    {
                        var cnt = Content.Create(genericContent);
                        if (!cnt.IsValid)
                        {
                            return;
                        }
                    }
                    // take action only if the action name is correct
                    if (!string.IsNullOrEmpty(PortalContext.Current.ActionName) &&
                        PortalContext.Current.ActionName.ToLower() == "publish")
                        genericContent.Publish();
                }
                catch (Exception ex)
                {
                    SnLog.WriteException(ex);
                }
            }

            CallDone();
        }
        protected override void CreateChildControls()
        {
            this.Controls.Clear();
            var view = this.Page.LoadControl(_validationError);
            this.Controls.Add(view);
            this.ChildControlsCreated = true;
        }
    }
}
