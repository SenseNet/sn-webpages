using System;

namespace SenseNet.Portal.UI.Controls
{
    public enum VersioningAction
    {
        Checkout = 1,
        CheckIn = 2,
        Publish = 3,
        Approve = 4,
        Reject = 5
    }

    public class VersioningActionEventArgs : EventArgs
    {
        public VersioningAction VersioningAction { get; private set; }
        public string Comments { get; private set; }

        public VersioningActionEventArgs(VersioningAction action, string comments)
        {
            VersioningAction = action;
            Comments = comments;
        }
    }
}
