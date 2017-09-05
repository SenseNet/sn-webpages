using System;
using System.Web;
using SenseNet.ContentRepository;
using SenseNet.Portal.UI.ContentListViews.Handlers;
using SenseNet.Portal.Virtualization;

namespace SenseNet.ApplicationModel
{
    public class SetAsDefaultViewAction : ODataActionBase
    {
        public override string MethodName { get; set; } = "SetAsDefaultView";

        // This is not exactly true, as it changes the default view on the content list - but we
        // have to allow this action to be invoked as a simple GET request as a legacy feature.
        public override bool CausesStateChange => false;
        public override bool IsHtmlOperation => false;

        public override void Initialize(Content context, string backUri, Application application, object parameters)
        {
            base.Initialize(context, backUri, application, parameters);

            this.IncludeBackUrl = true;

            var clv = context.ContentHandler as ViewBase;
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

        public override object Execute(Content content, params object[] parameters)
        {
            var ctxView = content?.ContentHandler as ViewBase;
            if (ctxView != null)
            {
                var list = ContentList.GetContentListByParentWalk(ctxView);
                if (list != null)
                {
                    list.DefaultView = ctxView.Name;
                    list.Save(SavingMode.KeepVersion);
                }
            }

            var backUrl = PortalContext.Current.BackUrl;
            var back = string.IsNullOrWhiteSpace(backUrl) ? "/" : backUrl;

            HttpContext.Current.Response.Redirect(back, true);
            return null;
        }
    }
}
