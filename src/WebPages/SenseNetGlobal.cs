using System;
using System.Web;
using System.Web.Routing;
using SenseNet.Portal.Routing;
using SenseNet.Portal.UI.Bundling;
using SenseNet.Services;

namespace SenseNet.Portal
{
    [InternalSenseNetHttpApplication]
    public class SenseNetGlobal : Services.SenseNetGlobal
    {
        protected override void Application_Start(object sender, EventArgs e, HttpApplication application)
        {
            base.Application_Start(sender, e, application);

            WarmUp.Preload();
        }

        protected override void RegisterRoutes(RouteCollection routes, HttpApplication application)
        {
            base.RegisterRoutes(routes, application);

            routes.Add("SnBundleRoute", new Route(BundleHandler.UrlPart + "/{*anything}", new ProxyingRouteHandler(ctx => new BundleHandler())));
        }
    }
}
