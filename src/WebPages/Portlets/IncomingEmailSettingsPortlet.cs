using System;
using SenseNet.Portal.UI.PortletFramework;
using SenseNet.Portal.UI;
using SenseNet.ContentRepository;
using SenseNet.Diagnostics;

namespace SenseNet.Portal.Portlets
{
    public class IncomingEmailSettingsPortlet : ContextBoundPortlet
    {
        public IncomingEmailSettingsPortlet()
        {
            this.Name = "$IncomingEmailSettingsPortlet:PortletDisplayName";
            this.Description = "$IncomingEmailSettingsPortlet:PortletDescription";
            this.Category = new PortletCategory(PortletCategoryType.System);
        }

        protected override void CreateChildControls()
        {
            if (this.ContextNode == null)
                return;
            var content = Content.Create(this.ContextNode);
            var cv = ContentView.Create(content, this.Page, ViewMode.InlineEdit, "$skin/contentviews/ContentList/IncomingEmailSettings.ascx");

            cv.UserAction += cv_UserAction;
            
            this.Controls.Add(cv);

            this.ChildControlsCreated = true;
        }

        protected void cv_UserAction(object sender, UserActionEventArgs e)
        {
            if (e.ActionName == "Save")
            {
                var contentView = e.ContentView;
                var content = contentView.Content;

                contentView.UpdateContent();

                if (contentView.IsUserInputValid && content.IsValid)
                {
                    try
                    {
                        // The whole Inbox feature has been moved to the Content Repository layer: the Save
                        // method of the ContentList type will take care of the workflow and Exchange subscription.
                        content.Save();

                        CallDone(false);
                    }
                    catch (Exception ex)
                    {
                        SnLog.WriteException(ex);
                        contentView.ContentException = ex;
                    }
                }
                return;
            }
            if (e.ActionName == "Cancel")
            {
                CallDone(false);
            }
        }
    }
}