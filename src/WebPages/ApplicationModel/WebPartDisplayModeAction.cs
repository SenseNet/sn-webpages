using System.Web;
using System.Web.UI.WebControls.WebParts;
using SenseNet.ContentRepository;
using SenseNet.Portal;
using SenseNet.Portal.UI.Controls;
using Page = System.Web.UI.Page;

namespace SenseNet.ApplicationModel
{
    public class WebPartDisplayModeAction : ClientAction
    {
        private static readonly string PostbackTemplate = "javascript:__doPostBack('','{0}')";

        private string DisplayModeArgument { get; set; }

        public override string Callback
        {
            get
            {
                if (HttpContext.Current == null)
                    return string.Empty;

                var page = HttpContext.Current.Handler as Page;
                if (page == null)
                    return string.Empty;

                return string.Format(PostbackTemplate, DisplayModeArgument);
            }
            set
            {
                base.Callback = value;
            }
        }

        public override void Initialize(Content context, string backUri, Application application, object parameters)
        {
            base.Initialize(context, backUri, application, parameters);

            var page = HttpContext.Current == null ? null : HttpContext.Current.Handler as Page;
            if (page == null)
                return;

            var wpm = WebPartManager.GetCurrentWebPartManager(page);
            if (wpm == null)
                return;

            // if we are in Browse mode, display the Edit link
            if (string.CompareOrdinal(wpm.DisplayMode.Name, PortalRemoteControl.DisplayModeBrowse) == 0)
            {
                this.CssClass = "sn-prc-editmode";
                this.DisplayModeArgument = PortalRemoteControl.EventArgumentWebpartEdit;
                this.Text = SR.GetString(SR.PRC.EditMode);
            }
            // if we are in Edit mode, display the Browse link
            if (string.CompareOrdinal(wpm.DisplayMode.Name, PortalRemoteControl.DisplayModeEdit) == 0)
            {
                this.CssClass = "sn-prc-browsemode";
                this.DisplayModeArgument = PortalRemoteControl.EventArgumentWebpartBrowse;
                this.Text = SR.GetString(SR.PRC.BrowseMode);
            }
        }
    }
}
