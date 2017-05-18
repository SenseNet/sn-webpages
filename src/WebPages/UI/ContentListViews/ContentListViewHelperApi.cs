using System;
using SenseNet.ApplicationModel;
using SenseNet.Portal.Virtualization;
using System.Web;
using System.Web.Services;
using SenseNet.ContentRepository;

namespace SenseNet.Portal.UI.ContentListViews
{
    public class ContentListViewHelperApi:GenericApi
    {

        [ODataFunction]
        [WebMethod(EnableSession = true)]
        public static void SetView(Content content, string uiContextId, string view, string back)
        {
            string hash = ViewFrame.GetHashCode(content.Path, uiContextId);
            ViewFrame.SetView(hash, view);
            HttpContext.Current.Response.Redirect(back, true);
        }

        [ODataFunction]
        public static void CopyViewLocal(Content content, string listPath, string viewPath, string back)
        {
            if (string.IsNullOrEmpty(listPath))
                throw new ArgumentNullException(nameof(listPath));
            if (string.IsNullOrEmpty(viewPath))
                throw new ArgumentNullException(nameof(viewPath));

            ViewManager.CopyViewLocal(listPath, viewPath, true);
            HttpContext.Current.Response.Redirect(back, true);
        }
    }
}
