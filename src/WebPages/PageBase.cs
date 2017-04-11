using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.UI.WebControls.WebParts;
using System.Web.UI.HtmlControls;
using System.Web.UI;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Storage.Security;
//using SenseNet.Portal.Personalization;
using System.Diagnostics;
using SenseNet.ContentRepository.Storage.Caching.DistributedActions;
using System.Web.SessionState;
using SNP = SenseNet.Portal;
using SenseNet.Diagnostics;
using SenseNet.Portal.Virtualization;
using System.IO;
using System.Xml;
using System.Xml.Xsl;
using SenseNet.ContentRepository.Storage;
using SenseNet.Portal.UI;
using System.Configuration;
using SenseNet.ContentRepository.i18n;
using System.Reflection;
using SenseNet.Portal.UI.PortletFramework;
using System.Reflection.Emit;
using SenseNet.Portal.Resources;

namespace SenseNet.Portal
{
    public class PageBase : System.Web.UI.Page, IRequiresSessionState
    {
        #region Timing
        protected Stopwatch _timer;

        public PageBase()
        {
            // start timer if the user has been requested it.
            if (ShowExecutionTime)
            {
                _timer = new Stopwatch();
                _timer.Start();
            }
        }

        private static readonly string[] EXECUTIONTIME_NAMES = new [] { "lx", "ShowExecutionTime"};
        private class ShowExecutionTimeComparer : IEqualityComparer<string>
        {
            public bool Equals(string x, string y)
            {
                return x.Equals(y, StringComparison.OrdinalIgnoreCase);
            }
            public int GetHashCode(string obj)
            {
                return obj.GetHashCode();
            }
        }

        /// <summary>
        /// Indicates that the page and the portlets on this page should render information about their execution time at the end of their html fragment.
        /// </summary>
        protected internal static bool ShowExecutionTime
        {
            get
            {
                if (HttpContext.Current == null)
                    return false;

                var request = HttpContext.Current.Request;
                if (request != null)
                {
                    var comparer = new ShowExecutionTimeComparer();

                    // check regular query string parameters (e.g. 'ShowExecutionTime=true')
                    if (request.QueryString.AllKeys.Any(q => EXECUTIONTIME_NAMES.Contains(q, comparer)))
                        return true;

                    // get values without parameter name (e.g. ?ShowExecutionTime)
                    var queryParams = request.QueryString.GetValues(null);
                    if (queryParams != null && queryParams.Any(q => EXECUTIONTIME_NAMES.Contains(q, comparer)))
                        return true;
                }

                return false;
            }
        }

        #endregion


        private bool CleanupCache
        {
            get
            {
                HttpRequest request = HttpContext.Current.Request;
                if (request != null && request.Params["CleanupCache"] != null)
                {
                    string cleanupCache = request.Params["CleanupCache"] as string;
                    bool cleanCacheValue = false;
                    if (bool.TryParse(cleanupCache, out cleanCacheValue))
                        return cleanCacheValue;
                }
                return false;
            }
        }

        
        
        protected override void OnPreInit(EventArgs e)
        {

            if (this.CleanupCache)
            {
                try
                {
                    new CacheCleanAction().Execute();
                }
                catch (Exception exc) // logged
                {
                    SnLog.WriteException(exc);
                }

            }

            // This hack solves the page template change timing issue.
            // If you change a page template from the Edit Page datasheet in PRC,
            // the page reloads with the correct master page. Without this hack, it does not.
            try
            {
                var currentPage = SNP.Page.Current;
                if (currentPage != null)
                {
                    // Elevation: the master page 
                    // is independent from the current user.
                    using (new SystemAccount())
                    {
                        var masterfile = currentPage.PageTemplateNode.Path.Replace(".html", ".Master");
                        if (!string.IsNullOrEmpty(masterfile) &&
                            masterfile.EndsWith(".master", StringComparison.InvariantCultureIgnoreCase) &&
                            masterfile != base.MasterPageFile)
                        {
                            base.MasterPageFile = masterfile;
                        } 
                    }
                }
            }
            catch (Exception ex) // logged
            {
                SnLog.WriteException(ex);
            }
            ////////////////////////////////////////////////////////////////////////////////////////


            base.OnPreInit(e);
        }

        protected override void OnLoadComplete(EventArgs e)
        {
			var currentPage = SNP.Page.Current;
            try
            {
                base.OnLoadComplete(e);
            }
            catch (InvalidOperationException exc) // logged
            {
                SnLog.WriteException(exc);
            }
            if (currentPage != null)
            {
                SetHeadMetaTagsAndTitle();
            }
        }

        private void SetHeadMetaTagsAndTitle()
        {
            var contextNode = PortalContext.Current.ContextNode ?? SenseNet.Portal.Page.Current;

            string keywords = GetSeoFieldValue(contextNode, "Keywords");
            string metaDesc = GetSeoFieldValue(contextNode, "MetaDescription");
            string author = GetSeoFieldValue(contextNode, "MetaAuthors");
            string customMeta = GetSeoFieldValue(contextNode, "CustomMeta");
            string metaTitle = GetSeoFieldValue(contextNode, "MetaTitle");

            if (!String.IsNullOrEmpty(metaTitle))
            {
                HtmlTitle t = GetTitle();
                if (t != null) t.Text = metaTitle;
            }

            if (!string.IsNullOrEmpty(keywords))
                AddMetaTag(keywords, "Keywords");

            if (!string.IsNullOrEmpty(metaDesc))
                AddMetaTag(metaDesc, "Description");

            if (!string.IsNullOrEmpty(author))
                AddMetaTag(author, "Author");

            if (!string.IsNullOrEmpty(customMeta))
                this.Header.Controls.Add(new LiteralControl(customMeta));

        }

        private static string GetSeoFieldValue(Node contextNode, string propertyName)
        {
            if (contextNode == null)
                return string.Empty;
            if (string.IsNullOrEmpty(propertyName))
                return string.Empty;

            var result = contextNode.GetPropertySafely(propertyName);
            string resultString = result as string;
            return string.IsNullOrEmpty(resultString) ? string.Empty : resultString;
        }

        private void AddMetaTag(string content, string name)
        {
            this.Header.Controls.Add(new HtmlMeta {Content = content, Name = name});
        }
        internal HtmlTitle GetTitle()
        {
            return this.Header.Controls.OfType<HtmlTitle>().FirstOrDefault();
        }

        protected override void Render(HtmlTextWriter writer)
        {
            if (ScriptManager.GetCurrent(this) is SNScriptManager)
            {
                // The SN script manager will take care of rendering WebForms.js into its bundle, we can hack it out here
                PageReflector.Current.DisableWebFormsScriptRendering(this);
            }

            base.Render(writer);

            if (ShowExecutionTime)
            {
                _timer.Stop();
                RenderTimerValue(writer);

            }
        }

        protected override void OnPreRender(EventArgs e)
        {
            if (SenseNetResourceManager.IsResourceEditorAllowed)
                UITools.InitEditorScript(this);

            base.OnPreRender(e);
        }

        /// <summary>
        /// Renders a(n) html fragment which contains the text will be displayed in the browser of the end user, if user has requested it.
        /// </summary>
        /// <param name="writer">HtmlTextWriter stores the content.</param>
        private void RenderTimerValue(System.Web.UI.HtmlTextWriter writer)
        {
            StringBuilder sb = new StringBuilder();
            sb.Append(@"<div style=""color:#fff;background:#008;font-weight:bold,padding:2px"">");
            sb.Append(String.Format("Execution time of the current page was <b>{0:F10}</b> seconds.", _timer.Elapsed.TotalSeconds));
            sb.Append(@"</div>");
            writer.Write(sb.ToString());
        }


        public void Done()
        {
            Done(true);
        }

        public void Done(bool endResponse)
        {
            Done(endResponse, null);
        }

        public void Done(Node newNode)
        {
            Done(true, newNode);
        }

        public void Done(bool endResponse, Node newNode)
        {
            var back = PortalContext.Current.BackUrl;
            var backTarget = PortalContext.Current.BackTarget;
            if (backTarget == BackTargetType.None && !string.IsNullOrEmpty(back))
            {
                Response.Redirect(back, endResponse);
            }
            else
            {
                var backTargetUrl = PortalContext.GetBackTargetUrl(newNode);
                if (!string.IsNullOrEmpty(backTargetUrl))
                    Response.Redirect(backTargetUrl, endResponse);
            }
        }


        /* ===================================================================== Helper Methods */

        /// <summary>
        /// The purpose of this class is to mitigate the cost of reflection when hacking out the web forms script.
        /// </summary>
        private class PageReflector
        {
            private Action<System.Web.UI.Page> _action = null;

            public PageReflector()
            {
                SetUp();
            }

            public void DisableWebFormsScriptRendering(System.Web.UI.Page page)
            {
                _action(page);
            }

            private void SetUp()
            {
                // The idea here is that we generate a compiled DynamicMethod that would do the dirty work for us.
                // Cost of creating the DynamicMethod occours only once and then calling it will not be any slower than without any reflection at all.

                var fRequireWebFormsScript = typeof(System.Web.UI.Page).GetField("_fRequireWebFormsScript", BindingFlags.NonPublic | BindingFlags.Instance);
                var fWebFormsScriptRendered = typeof(System.Web.UI.Page).GetField("_fWebFormsScriptRendered", BindingFlags.NonPublic | BindingFlags.Instance);

                var dm = new DynamicMethod("DisableWebFormsScriptRendering_SN_hack", null, new Type[] { typeof(System.Web.UI.Page) }, typeof(System.Web.UI.Page), true);
                ILGenerator ilgen = dm.GetILGenerator();
                
                // This will make the Page believe that it shouldn't render the webforms script in Page.BeginFormRender
                ilgen.Emit(OpCodes.Ldarg_0);
                ilgen.Emit(OpCodes.Ldc_I4_0);
                ilgen.Emit(OpCodes.Stfld, fRequireWebFormsScript);

                // This will make the Page believe that it shouldn't render the webforms script in Page.EndFormRenderPostBackAndWebFormsScript
                ilgen.Emit(OpCodes.Ldarg_0);
                ilgen.Emit(OpCodes.Ldc_I4_1);
                ilgen.Emit(OpCodes.Stfld, fWebFormsScriptRendered);

                ilgen.Emit(OpCodes.Ret);

                _action = (Action<System.Web.UI.Page>)dm.CreateDelegate(typeof(Action<System.Web.UI.Page>));
            }

            public static PageReflector Current = new PageReflector();
        }
    }
}
