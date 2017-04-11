using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using System.Web.Caching;
using System.Web.UI;
using System.Web.UI.WebControls.WebParts;
using SenseNet.ContentRepository.Storage.Caching.Dependency;
using SenseNet.ContentRepository;
using SenseNet.Portal.Virtualization;
using SenseNet.Diagnostics;

namespace SenseNet.Portal.UI.PortletFramework
{
    public abstract class CacheablePortlet : PortletBase
    {
        private const string CacheablePortletClass = "CacheablePortlet";

        public enum CacheableForOption 
        {
            /// <summary>
            /// Means only one user: the Visitor
            /// </summary>
            VisitorsOnly = 0,
            /// <summary>
            /// Means: everyone and Visitor
            /// </summary>
            Everyone
        }

        private static readonly string CacheTimerStringFormat =
            "Execution time of the {1} portlet was <b>{0:F10}</b> seconds. Cacheable:{2}, CanCache:{3}, IsInCache:{4}";

        // Properties /////////////////////////////////////////////////////////////
        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(CacheablePortletClass, "Prop_Cacheable_DisplayName")] 
        [LocalizedWebDescription(CacheablePortletClass, "Prop_Cacheable_Description")]
        [WebCategory(EditorCategory.Cache, EditorCategory.Cache_Order)]
        [WebOrder(10)]
        public bool Cacheable { get; set; }

        [WebBrowsable(true), Personalizable(false)]
        [LocalizedWebDisplayName(CacheablePortletClass, "Prop_CacheableFor_DisplayName")]
        [LocalizedWebDescription(CacheablePortletClass, "Prop_CacheableFor_Description")]
        [WebCategory(EditorCategory.Cache, EditorCategory.Cache_Order)]
        [WebOrder(11)]
        public CacheableForOption CacheableFor { get { return _cacheableForLoggedInUser ? CacheableForOption.Everyone : CacheableForOption.VisitorsOnly; } set { _cacheableForLoggedInUser = value == CacheableForOption.Everyone ? true : false; } }

        private bool _cacheableForLoggedInUser;
        [WebBrowsable(false), Personalizable(true)]
        public bool CacheableForLoggedInUser { get { return _cacheableForLoggedInUser; } set { _cacheableForLoggedInUser = value; } }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(CacheablePortletClass, "Prop_CacheByHost_DisplayName")]
        [LocalizedWebDescription(CacheablePortletClass, "Prop_CacheByHost_Description")]
        [WebCategory(EditorCategory.Cache, EditorCategory.Cache_Order)]
        [WebOrder(13)]
        public bool CacheByHost { get; set; }

        private bool _cacheByPath = true;
        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(CacheablePortletClass, "Prop_CacheByPath_DisplayName")]
        [LocalizedWebDescription(CacheablePortletClass, "Prop_CacheByPath_Description")]
        [WebCategory(EditorCategory.Cache, EditorCategory.Cache_Order)]
        [WebOrder(15)]
        public bool CacheByPath 
        {
            get { return _cacheByPath; }
            set { _cacheByPath = value; }
        }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(CacheablePortletClass, "Prop_CacheByParams_DisplayName")]
        [LocalizedWebDescription(CacheablePortletClass, "Prop_CacheByParams_Description")]
        [WebCategory(EditorCategory.Cache, EditorCategory.Cache_Order)]
        [WebOrder(20)]
        public bool CacheByParams { get; set; }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(CacheablePortletClass, "Prop_CacheByLanguage_DisplayName")]
        [LocalizedWebDescription(CacheablePortletClass, "Prop_CacheByLanguage_Description")]
        [WebCategory(EditorCategory.Cache, EditorCategory.Cache_Order)]
        [WebOrder(25)]
        public bool CacheByLanguage { get; set; }

        private double _absoluteExpiration = -1;
        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(CacheablePortletClass, "Prop_AbsoluteExpiration_DisplayName")]
        [LocalizedWebDescription(CacheablePortletClass, "Prop_AbsoluteExpiration_Description")]
        [WebCategory(EditorCategory.Cache, EditorCategory.Cache_Order)]
        [WebOrder(30)]
        [Editor(typeof(TextEditorPartField), typeof(IEditorPartField))]
        [TextEditorPartOptions(TextEditorCommonType.Small)]
        public double AbsoluteExpiration
        {
            get { return _absoluteExpiration; }
            set { _absoluteExpiration = value; }
        }

        private double _slidingExpirationMinutes = -1;
        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(CacheablePortletClass, "Prop_SlidingExpirationMinutes_DisplayName")]
        [LocalizedWebDescription(CacheablePortletClass, "Prop_SlidingExpirationMinutes_Description")]
        [WebCategory(EditorCategory.Cache, EditorCategory.Cache_Order)]
        [WebOrder(40)]
        [Editor(typeof(TextEditorPartField), typeof(IEditorPartField))]
        [TextEditorPartOptions(TextEditorCommonType.Small)]
        public double SlidingExpirationMinutes
        {
            get { return _slidingExpirationMinutes; }
            set { _slidingExpirationMinutes = value; }
        }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(CacheablePortletClass, "Prop_CustomCacheKey_DisplayName")]
        [LocalizedWebDescription(CacheablePortletClass, "Prop_CustomCacheKey_Description")]
        [WebCategory(EditorCategory.Cache, EditorCategory.Cache_Order)]
        [WebOrder(50)]
        public string CustomCacheKey { get; set; }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(CacheablePortletClass, "Prop_Debug_DisplayName")]
        [LocalizedWebDescription(CacheablePortletClass, "Prop_Debug_Description")]
        [WebCategory(EditorCategory.Cache, EditorCategory.Cache_Order)]
        [WebOrder(100)]
        public bool Debug { get; set; }

        protected string CachedOutput { get; set; }
        protected bool IsCacheRead { get; set; }
        protected bool IsInCache
        {
            get
            {
                return CheckCachedOutput();
            }
        }
        protected bool CanCache
        {
            get
            {
                if (Page == null)
                    return false;

                var wpm = WebPartManager.GetCurrentWebPartManager(Page);
                if (wpm == null)
                    return false;

                // portlets are not cached when page is being edited with webpart editor
                if (wpm.DisplayMode != WebPartManager.BrowseDisplayMode)
                    return false;

                return OutputCache.CanCache(this.CacheableForLoggedInUser);
            }
        }

        // =================================================================== Cached script and css references
        private IList<string> CachedScripts;
        private IList<StyleSheetReference> CachedStyleSheets;

        internal void AddScript(string scriptPath)
        {
            if (string.IsNullOrEmpty(scriptPath) || !this.Cacheable)
                return;

            if (CachedScripts == null)
                CachedScripts = new List<string>();

            if (CachedScripts.Contains(scriptPath))
                return;

            CachedScripts.Add(scriptPath);
        }

        internal void AddStyleSheet(StyleSheetReference styleSheetRef)
        {
            if (styleSheetRef == null || string.IsNullOrEmpty(styleSheetRef.CssPath) || !this.Cacheable)
                return;

            if (CachedStyleSheets == null)
                CachedStyleSheets = new List<StyleSheetReference>();

            if (CachedStyleSheets.Any(ssref => ssref.CssPath == styleSheetRef.CssPath))
                return;

            CachedStyleSheets.Add(styleSheetRef);
        }

        private void AddCachedReferences()
        {
            if (!Cacheable)
                return;

            var cachedData = OutputCache.GetCachedData(GetCacheKey());
            if (cachedData == null)
                return;

            if (cachedData.ScriptReferences != null)
            {
                // add all cached script references
                foreach (var reference in cachedData.ScriptReferences)
                {
                    UITools.AddScript(reference);
                }
            }

            if (cachedData.StyleSheetReferences != null)
            {
                var header = UITools.GetHeader();

                // add all cached stylesheet references
                foreach (var reference in cachedData.StyleSheetReferences)
                {
                    UITools.AddStyleSheetToHeader(header, reference.CssPath, reference.Order, reference.Rel,
                                                  reference.Type, reference.Media, reference.Title,
                                                  reference.AllowBundlingIfEnabled);
                }
            }
        }

        // Virtuals ///////////////////////////////////////////////////////////////
        private List<CacheDependency> _dependencies;
        protected virtual List<CacheDependency> Dependencies
        {
            get
            {
                if (_dependencies == null)
                    _dependencies = new List<CacheDependency>();
                return _dependencies;
            }
        }
        protected virtual string GetCacheKey()
        {
            var page = PortalContext.Current.Page;
            var pagePath = page == null ? string.Empty : page.Path;
            return OutputCache.GetCacheKey(this.CustomCacheKey, pagePath, this.ClientID,
                this.CacheByHost, this.CacheByPath, this.CacheByParams, this.CacheByLanguage);
        }
        /// <summary>
        /// Add dependencies of the portlet to dependencies list.
        /// </summary>
        public virtual void AddPortletDependency()
        {
            var portletDep = new PortletDependency(ID);
            Dependencies.Add(portletDep);
        }
        public virtual void NotifyCheckin()
        {
            PortletDependency.NotifyChange(ID);
        }

        // Events /////////////////////////////////////////////////////////////////
        protected override void Render(HtmlTextWriter writer)
        {
            if (!CanCache || !Cacheable)
            {
                RenderTimer = false;
                base.Render(writer);

                if (ShowExecutionTime)
                    RenderTimerValue(writer, "CacheablePortlet-normal workflow");

                if (Debug)
                    writer.Write(string.Concat("Portlet info: normal workflow.", "<br />Cache key: ", GetCacheKey()));
            }
            else if (IsInCache) // IsInCache calls the GetCachedOutput
            {
                writer.Write(CachedOutput);
                if (ShowExecutionTime)
                    RenderTimerValue(writer, "CacheablePortlet-retrieved from cache");
                if (Debug)
                    writer.Write(string.Concat("Portlet info: fragment has been retrieved from Cache.", "<br />Cache key: ", GetCacheKey()));
            }
            else
            {
                using (var sw = new StringWriter())
                {
                    using (var hw = new HtmlTextWriter(sw))
                    {
                        RenderTimer = false;
                        base.Render(hw);
                        CachedOutput = sw.ToString();
                        if (!HasError)
                            InsertOutputIntoCache(CachedOutput);

                        writer.Write(CachedOutput);

                        if (ShowExecutionTime)
                            RenderTimerValue(writer, "CacheablePortlet-output was placed in the cache");
                        if (Debug)
                            writer.Write(string.Concat("Portlet info: fragment has been put into Cache.", "<br />Cache key: ", GetCacheKey()));
                    }
                }
            }
        }
        protected override void OnInit(EventArgs e)
        {
            base.OnInit(e);

            var wpm = WebPartManager.GetCurrentWebPartManager(Page);
            if (wpm != null)
                wpm.SelectedWebPartChanged += new WebPartEventHandler(wpm_SelectedWebPartChanged);

        }
        protected override void OnPreRender(EventArgs e)
        {
            AddCachedReferences();

            var wpm = WebPartManager.GetCurrentWebPartManager(Page);
            if (wpm != null && wpm.DisplayMode != WebPartManager.BrowseDisplayMode)
            {
                // hide advanced cache parameters if portlet cache is switched off
                UITools.RegisterStartupScript("hidecacheparameters", "function showcacheparams(show) {$('.sn-editorpart-Cacheable').siblings().css('color',show?'':'#AAA');var cs=$('input,select', $('.sn-editorpart-Cacheable').siblings());show ? cs.removeAttr('disabled') : cs.attr('disabled','disabled');};showcacheparams($('.sn-editorpart-Cacheable input').attr('checked'));$('.sn-editorpart-Cacheable input').live('click', function() { showcacheparams($(this).attr('checked')); });", this.Page);
            }

            base.OnPreRender(e);
        }
        protected void wpm_SelectedWebPartChanged(object sender, WebPartEventArgs e)
        {
            // SelectedWebPartChanged event is called at the end of changing setting of the selected webpart.  
            // Fact: If a page is in EditDisplayMode, SelectedWebPartChanged will be called twice.
            // Interesting: in the second call the WebPartEventArgs.WebPart property is null, in the first call, the property is hold a reference
            // for the selected portlet.
            if (e.WebPart == null)
                NotifyCheckin();
        }

        // Internals //////////////////////////////////////////////////////////////
        private void InsertOutputIntoCache(string output)
        {
            AddPortletDependency();

            var cacheDependency = 
                (this.Dependencies.Count > 1) ? 
                            new AggregateCacheDependency() :
                            ((this.Dependencies.Count > 0) ? this.Dependencies[0] : null);

            if (this.Dependencies.Count > 1)
                foreach (var dep in this.Dependencies)
                    ((AggregateCacheDependency)cacheDependency).Add(dep);

            this._dependencies = null;

            var od = new OutputCacheData { Output = output, ScriptReferences = CachedScripts, StyleSheetReferences = CachedStyleSheets };

            OutputCache.InsertOutputIntoCache(AbsoluteExpiration, SlidingExpirationMinutes, this.GetCacheKey(), od, cacheDependency, CacheItemPriority.Normal);
        }
        private bool CheckCachedOutput()
        {
            // if the output was once read from the cache and contains anything the function returns with true
            // if it is empty or null it returns with false
            if (IsCacheRead)
                return !String.IsNullOrEmpty(CachedOutput);
            // if the output was not read from the cache, we load the cached value
            // if the cached value is empty or null, we return false, otherwise true
            CachedOutput = OutputCache.GetCachedOutput(this.GetCacheKey());
            IsCacheRead = true;
            return !String.IsNullOrEmpty(CachedOutput);
        }

        protected override void RenderTimerValue(HtmlTextWriter writer, string message)
        {
            var sb = new StringBuilder();
            if (IsInCache)
                sb.Append(@"<div style=""color:#fff;background:#060;font-weight:bold,padding:2px"">");
            else
                sb.Append(@"<div style=""color:#fff;background:#c00;font-weight:bold,padding:2px"">");
            var msg = String.Format(CacheTimerStringFormat, Timer.Elapsed.TotalSeconds, ID, Cacheable, CanCache,
                                    IsInCache);
            if (!string.IsNullOrEmpty(message))
                msg = String.Concat(msg, "-", message);
            sb.Append(msg);
            sb.Append(@"</div>");
            writer.Write(sb.ToString());
        }
    }
}
