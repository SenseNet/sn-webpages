using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web.UI;
using System.Web.UI.WebControls;
using SenseNet.ContentRepository;
using SenseNet.Portal.UI.PortletFramework;

namespace SenseNet.Portal.UI.Controls
{
    public class RejectButton : ClientDialogButton
    {
        protected override void OnInit(EventArgs e)
        {
            // initialze default control path
            _layoutControlPath = "/Root/System/SystemPlugins/Controls/RejectDialog.ascx";

            base.OnInit(e);
        }

        public event EventHandler<VersioningActionEventArgs> OnReject;

        protected override void OnButtonClick(object sender, EventArgs e)
        {
            var button = sender as IButtonControl;
            if (button == null)
                return;

            switch (button.CommandName)
            {
                case "Reject":
                    var reason = this.CommentsTextBox == null ? string.Empty : this.CommentsTextBox.Text;

                    if (OnReject == null)
                    {
                        // retrieve the current content
                        var gc = ContextBoundPortlet.GetContextNodeForControl(this) as GenericContent;
                        if (gc == null)
                            return;

                        if (SavingAction.HasReject(gc))
                        {
                            gc["RejectReason"] = reason;
                            gc.Reject();
                            
                            var p = Page as PageBase;
                            if (p != null)
                                p.Done(false);
                        }
                    }
                    else
                    {
                        OnReject(sender, new VersioningActionEventArgs(VersioningAction.Reject, reason));
                    }
                    break;
            }
        }
    }
}
