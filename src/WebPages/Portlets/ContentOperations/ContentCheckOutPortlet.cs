using System;
using SenseNet.ContentRepository;
using SenseNet.Diagnostics;
using SenseNet.Portal.UI.PortletFramework;
using SenseNet.Portal.Virtualization;

namespace SenseNet.Portal.Portlets
{
    public class ContentCheckOutPortlet : ContextBoundPortlet
    {
        public ContentCheckOutPortlet()
        {
            this.Name = "$ContentCheckOutPortlet:PortletDisplayName";
            this.Description = "$ContentCheckOutPortlet:PortletDescription";
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
                    // take action only if the action name is correct
                    if (!string.IsNullOrEmpty(PortalContext.Current.ActionName) &&
                        PortalContext.Current.ActionName.ToLower() == "checkout")
                        genericContent.CheckOut();
                }
                catch (Exception ex)
                {
                    SnLog.WriteException(ex);
                }
            }

            CallDone();
        }
    }
}
