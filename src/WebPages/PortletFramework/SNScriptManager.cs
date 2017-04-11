using System;
using System.Collections.Generic;
using System.Threading;
using System.Web.UI;
using SenseNet.Portal.UI.Bundling;
using SenseNet.Portal.Virtualization;
using System.Web;
using System.Reflection;
using System.Linq;
using System.Reflection.Emit;
using System.Collections;

namespace SenseNet.Portal.UI.PortletFramework
{
    public class SNScriptManager : System.Web.UI.AjaxScriptManager
    {
        private JsBundle _bundle = null;
        private List<string> _postponedList = null;

        private SNScriptLoader _smartLoader;
        public SNScriptLoader SmartLoader
        {
            get { return _smartLoader; }
        }

        public SNScriptManager()
        {
            _smartLoader = new SNScriptLoader();
            _postponedList = new List<string>();
        }

        protected override void OnInit(EventArgs args)
        {
            // Add event handler
            this.Page.PreRenderComplete += delegate(object s, EventArgs e)
            {
                this.RenderScriptReferences();
            };
            
            // Call base class method
            base.OnInit(args);
        }

        protected override void OnResolveScriptReference(ScriptReferenceEventArgs args)
        {
            base.OnResolveScriptReference(args);

            // If the bundle is created and it is not a postponed script, override the path of the script to the path of the bundle
            if (_bundle != null && _bundle.Paths.Contains(GetUrl(args.Script)) && !_postponedList.Contains(args.Script.Path))
            {
                args.Script.Path = "/" + BundleHandler.UrlPart + "/" + _bundle.FakeFilename;
            }
        }

        private string GetUrl(ScriptReference script)
        {
            base.OnResolveScriptReference(new ScriptReferenceEventArgs(script));
            var path = script.Path;

            if (!string.IsNullOrEmpty(script.Assembly) && !string.IsNullOrEmpty(script.Name))
            {
                var assembly = AppDomain.CurrentDomain.GetAssemblies().FirstOrDefault(a => a.FullName == script.Assembly);
                if (assembly != null)
                {
                    path = ScriptManagerReflector.Current.GetScriptResourceUrl(this, script.Name, assembly);
                }
            }

            if (path.StartsWith("/ScriptResource.axd?") || path.StartsWith("/WebResource.axd?"))
            {
                var url = HttpContext.Current.Request.Url;
                return url.Scheme + "://" + url.Authority + path;
            }
            return path;
        }

        /// <summary>
        /// Gets the ScriptReference.axd paths used by the .NET Framework itself
        /// </summary>
        private IEnumerable<string> GetFrameworkScripts()
        {
            var srl = new List<ScriptReferenceBase>();
            ScriptManagerReflector.Current.AddFrameworkScripts(this, srl);

            var result = srl
                .OfType<ScriptReference>()
                .Select(s => GetUrl(s));

            return result;            
        }

        private void RenderScriptReferences()
        {
            // Get scripts that are added by the framework
            var frameworkScriptPaths = GetFrameworkScripts();

            // Construct smart list
            var smartList = new List<string>();
            // Hard-code WebForms.js - it will be rendered here, and not in Page (like by default)
            smartList.Add(GetUrl(new ScriptReference(this.Page.ClientScript.GetWebResourceUrl(typeof(System.Web.UI.Page), "WebForms.js"))));
            // Add scripts needed by the framework
            smartList.AddRange(frameworkScriptPaths);
            // Add scripts previously added to this control
            smartList.AddRange(this.Scripts.Select(s => GetUrl(s)));
            // Add scripts from the smart loader
            smartList.AddRange(SmartLoader.GetScriptsToLoad());

            // Clear previous scripts (they are now part of smartList)
            Scripts.Clear();
            
            // Initialize bundling
            var allowJsBundling = PortalBundleOptions.Current.AllowJsBundling;
            var bundle = allowJsBundling ? new JsBundle() : null;

            // Go through all scripts
            foreach (var spath in smartList)
            {
                var lower = spath.ToLower();

                if (lower.EndsWith(".css"))
                {
                    UITools.AddStyleSheetToHeader(UITools.GetHeader(), spath);
                }
                else
                {
                    var isPostponed = PortalBundleOptions.JsIsBlacklisted(spath);
                    var isFrameworkScript = frameworkScriptPaths.Contains(spath);

                    if (isPostponed)
                        _postponedList.Add(spath);
                    if (allowJsBundling && !isPostponed)
                        bundle.AddPath(spath);
                    if (!isPostponed && !isFrameworkScript)
                        Scripts.Add(new ScriptReference(spath));
                }
            }

            // Go through postponed scripts
            foreach (var spath in _postponedList)
            {
                Scripts.Add(new ScriptReference(spath));
            }

            // NOTE: At this point, script order is the following:
            // 1) scripts added by the framework
            // 2) scripts added directly to this control
            // 3) scripts from SmartLoader (that are not blacklisted from bundling)
            // 4) scripts from SmartLoader (that are blacklisted from bundling)

            // Finalize bundling
            if (allowJsBundling)
            {
                // If bundling is allowed, close the bundle and process it
                bundle.Close();
                BundleHandler.AddBundleIfNotThere(bundle);
                ThreadPool.QueueUserWorkItem(x => BundleHandler.AddBundleToCache(bundle));

                if (BundleHandler.IsBundleInCache(bundle))
                {
                    // If the bundle is complete, use its path to replace the path of all the scripts that are not postponed
                    _bundle = bundle;
                }
            }
        }

        /// <summary>
        /// The purpose of this class is to mitigate the cost of calling the private methods of ScriptManager with reflection.
        /// </summary>
        private class ScriptManagerReflector
        {
            private Action<ScriptManager, List<ScriptReferenceBase>> _addFrameworkScripts = null;
            private Func<ScriptManager, string, Assembly, string> _getScriptResourceUrl = null;

            public ScriptManagerReflector()
            {
                SetUpAddFrameworkScripts();
                SetUpGetScriptResourceUrl();
            }

            public string GetScriptResourceUrl(ScriptManager m, string name, Assembly assembly)
            {
                return _getScriptResourceUrl(m, name, assembly);
            }

            public void AddFrameworkScripts(ScriptManager m, List<ScriptReferenceBase> str)
            {
                _addFrameworkScripts(m, str);
            }

            private void SetUpGetScriptResourceUrl()
            {
                // The idea here is that we generate a compiled DynamicMethod that would do the dirty work for us.
                // Cost of creating the DynamicMethod occours only once and then calling it will not be any slower than without any reflection at all.

                var tScriptManager = typeof(ScriptManager);
                var mGetScriptResourceUrl = tScriptManager.GetMethod("GetScriptResourceUrl", BindingFlags.NonPublic | BindingFlags.Instance);

                // This method will call the internal GetScriptResourceUrl method
                var dm = new DynamicMethod("GetScriptResourceUrl_SN_hack", typeof(string), new Type[] { typeof(ScriptManager), typeof(string), typeof(Assembly) }, typeof(ScriptManager), true);
                ILGenerator ilgen = dm.GetILGenerator();

                ilgen.Emit(OpCodes.Ldarg_0);
                ilgen.Emit(OpCodes.Ldarg_1);
                ilgen.Emit(OpCodes.Ldarg_2);
                ilgen.Emit(OpCodes.Call, mGetScriptResourceUrl);
                ilgen.Emit(OpCodes.Ret);

                _getScriptResourceUrl = (Func<ScriptManager, string, Assembly, string>)dm.CreateDelegate(typeof(Func<ScriptManager, string, Assembly, string>));
            }

            private void SetUpAddFrameworkScripts()
            {
                // The idea here is that we generate a compiled DynamicMethod that would do the dirty work for us.
                // Cost of creating the DynamicMethod occours only once and then calling it will not be any slower than without any reflection at all.

                var tScriptManager = typeof(ScriptManager);
                var tScriptControlManager = tScriptManager.Assembly.GetType("System.Web.UI.ScriptControlManager");
                var mAddScriptReferences = tScriptControlManager.GetMethod("AddScriptReferences", BindingFlags.Public | BindingFlags.Instance);

                var mAddScriptCollections = tScriptManager.GetMethod("AddScriptCollections", BindingFlags.NonPublic | BindingFlags.Instance);
                var mAddFrameworkScripts = tScriptManager.GetMethod("AddFrameworkScripts", BindingFlags.NonPublic | BindingFlags.Instance);
                var mGetScriptControlManager = tScriptManager.GetProperty("ScriptControlManager", BindingFlags.NonPublic | BindingFlags.Instance).GetAccessors(true)[0];
                var fProxies = tScriptManager.GetField("_proxies", BindingFlags.NonPublic | BindingFlags.Instance);

                // This method will mimic what System.Web.UI.ScriptManager.RegisterScripts is doing,
                // essentially giving us all the script URLs that the ScriptManager contains,
                // even those that do not appear in its Scripts collection.
                var dm = new DynamicMethod("AddFrameworkScripts_SN_hack", null, new Type[] { typeof(ScriptManager), typeof(List<ScriptReferenceBase>) }, typeof(ScriptManager), true);
                ILGenerator ilgen = dm.GetILGenerator();

                ilgen.Emit(OpCodes.Ldarg_0);
                ilgen.Emit(OpCodes.Ldarg_1);
                ilgen.Emit(OpCodes.Ldarg_0);
                ilgen.Emit(OpCodes.Ldfld, fProxies);
                ilgen.Emit(OpCodes.Call, mAddScriptCollections);

                ilgen.Emit(OpCodes.Ldarg_0);
                ilgen.Emit(OpCodes.Call, mGetScriptControlManager);
                ilgen.Emit(OpCodes.Ldarg_1);
                ilgen.Emit(OpCodes.Callvirt, mAddScriptReferences);

                ilgen.Emit(OpCodes.Ldarg_0);
                ilgen.Emit(OpCodes.Ldarg_1);
                ilgen.Emit(OpCodes.Call, mAddFrameworkScripts);
                
                ilgen.Emit(OpCodes.Ret);

                _addFrameworkScripts = (Action<ScriptManager, List<ScriptReferenceBase>>)dm.CreateDelegate(typeof(Action<ScriptManager, List<ScriptReferenceBase>>));
            }

            public static ScriptManagerReflector Current = new ScriptManagerReflector();
        }
    }
}