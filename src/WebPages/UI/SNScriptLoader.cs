using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using SenseNet.Portal.UI.PortletFramework;

namespace SenseNet.Portal.UI
{
    public sealed class SNScriptLoader
    {
        private readonly HashSet<string> _requestedScripts;
        private readonly SortedDictionary<string, List<string>> _depTree;
        
        public SNScriptLoader()
        {
            _requestedScripts = new HashSet<string>(new CaseInsensitiveEqualityComparer());
            _depTree = new SortedDictionary<string, List<string>>();
        }

        private IEnumerable<string> _scriptsToLoad;
        public IEnumerable<string> GetScriptsToLoad()
        {
            if (_scriptsToLoad == null)
            {
                var scriptsToLoad = new List<string>();

                var notInList = _requestedScripts.ToList();

                while (notInList.Any())
                {
                    // find scripts that have no more (unprocessed) dependencies
                    var noDeps = notInList.Where(n => !_depTree[n].Any());
                    var s = noDeps.FirstOrDefault();
                    if (s == null)
                        throw new ApplicationException("Cycle found in JavaScript/CSS dependency graph. Remaining scripts: " + string.Join(", ", notInList));

                    notInList.Remove(s);
                    _depTree.Remove(s);
                    scriptsToLoad.Add(s);

                    foreach (var kv in _depTree)
                        kv.Value.Remove(s);
                }

                _scriptsToLoad = scriptsToLoad.Select(s => SkinManager.Resolve(s));
            }

            return _scriptsToLoad;
        }

        public void AddScript(string relPath)
        {
            if (_scriptsToLoad != null)
                throw new InvalidOperationException("Cannot add new script after dependency resolution.");

            var isNew = _requestedScripts.Add(relPath);
            if (isNew)
                AddDependencies(relPath);
        }

        private void AddDependencies(string relPath)
        {
            var deps = GetDependencies(relPath);
            var dependencies = deps == null ? new string[0] : deps.ToArray();

            // Pre-process dependencies before adding them to the cache (!) and the header.
            for (var i = 0; i < dependencies.Length; i++)
            {
                string templateCategory;

                // in case of template dependencies we have to resolve them here on-the-fly, when the context is known
                if (HtmlTemplate.TryParseTemplateCategory(dependencies[i], out templateCategory))
                    dependencies[i] = UITools.GetTemplateScriptRequest(templateCategory);
            }

            CacheDeps(relPath, dependencies);

            foreach (var d in dependencies)
            {
                AddScript(d);
            }
        }

        private void CacheDeps(string requestedBy, IEnumerable<string> deps)
        {
            if (deps == null)
                deps = new List<string>();

            _depTree.Add(requestedBy, deps.ToList());
        }

        private static IEnumerable<string> GetDependencies(string relPath)
        {
            var fullpath = SkinManager.Resolve(relPath);
            return SNScriptDependencyCache.Instance.GetDependencies(fullpath);
        }
    }
}
