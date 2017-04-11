using System;
using SenseNet.ContentRepository;

namespace SenseNet.ApplicationModel
{
    public class SetAsDefaultViewAction : UrlAction
    {
        public override void Initialize(Content context, string backUri, Application application, object parameters)
        {
            base.Initialize(context, backUri, application, parameters);

            var clv = context.ContentHandler as Portal.UI.ContentListViews.Handlers.ViewBase;
            if (clv == null)
            {
                this.Forbidden = true;
                return;
            }

            var cl = ContentList.GetContentListByParentWalk(clv);
            if (cl == null)
            {
                this.Forbidden = true;
                return;
            }

            if (string.IsNullOrEmpty(cl.DefaultView))
                return;

            // if this view is the default, the action is meaningless
            if (string.Compare(cl.DefaultView, context.Name, StringComparison.InvariantCulture) == 0)
                this.Forbidden = true;
        }
    }
}
