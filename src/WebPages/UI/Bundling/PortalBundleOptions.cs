using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.UI;
using System.Web.UI.HtmlControls;
using SenseNet.Portal.Virtualization;
using System.Threading;
using System.Web;
using SenseNet.Configuration;

namespace SenseNet.Portal.UI.Bundling
{
    /// <summary>
    /// Contains information about bundling options.
    /// </summary>
    public class PortalBundleOptions
    {
        /// <summary>
        /// The list of CSS bundles that need to be added to the HTML header.
        /// </summary>
        public List<CssBundle> CssBundles { get; } = new List<CssBundle>();

        /// <summary>
        /// Gets whether CSS bunding is configured to be enabled or not.
        /// </summary>
        public bool AllowCssBundling => WebApplication.AllowCssBundling;

        /// <summary>
        /// Gets whether Javascript bundling is configured to be enabled or not.
        /// </summary>
        public bool AllowJsBundling => WebApplication.AllowJsBundling;

        public IEnumerable<string> JsBlacklist => WebApplication.JsBundlingBlacklist;
        public IEnumerable<string> CssBlacklist => WebApplication.CssBundlingBlacklist;

        public static PortalBundleOptions Current => PortalContext.Current?
            .GetOrAdd<PortalBundleOptions>("BundleOptions", key => new PortalBundleOptions());

        /// <summary>
        /// Enables CSS bundling behaviour for the given HTML head control.
        /// </summary>
        /// <param name="header">The head control for which bundling needs to be enabled.</param>
        public void EnableCssBundling(Control header)
        {
            // Trick to ensure that this event handler is hooked up once and only once
            header.Page.PreRenderComplete -= OnPreRenderComplete;
            header.Page.PreRenderComplete += OnPreRenderComplete;
        }

        public static bool JsIsBlacklisted(string path)
        {
            return !string.IsNullOrEmpty(path) && WebApplication.JsBundlingBlacklist.Any(path.StartsWith);
        }

        public static bool CssIsBlacklisted(string path)
        {
            return !string.IsNullOrEmpty(path) && WebApplication.CssBundlingBlacklist.Any(path.StartsWith);
        }

        private static void OnPreRenderComplete(object sender, EventArgs args)
        {
            // Add a link tag for every CSS bundle in the current PortalContext

            var header = ((System.Web.UI.Page)sender).Header;

            foreach (var bundle in Current.CssBundles)
            {
                // Also adding it to the bundle handler
                bundle.Close();
                BundleHandler.AddBundleIfNotThere(bundle);
                ThreadPool.QueueUserWorkItem(x => BundleHandler.AddBundleToCache(bundle));

                if (BundleHandler.IsBundleInCache(bundle))
                {
                    var cssLink = new HtmlLink();

                    cssLink.Href = "/" + BundleHandler.UrlPart + "/" + bundle.FakeFilename;
                    cssLink.Attributes["rel"] = "stylesheet";
                    cssLink.Attributes["type"] = bundle.MimeType;
                    cssLink.Attributes["media"] = bundle.Media;

                    header.Controls.Add(cssLink);
                }
                else
                {
                    // The bundle will be complete in a few seconds; disallow caching the page until then
                    HttpHeaderTools.SetCacheControlHeaders(httpCacheability: HttpCacheability.NoCache);

                    foreach (var path in bundle.Paths)
                        UITools.AddStyleSheetToHeader(header, path, 0, "stylesheet", bundle.MimeType, bundle.Media, string.Empty, false);
                }

                foreach (var postponedPath in bundle.PostponedPaths)
                {
                    UITools.AddStyleSheetToHeader(header, postponedPath, 0, "stylesheet", bundle.MimeType, bundle.Media, string.Empty, false);
                }
            }
        }
    }
}
