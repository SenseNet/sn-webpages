using System;
using System.Collections.Generic;
using SenseNet.Portal.Resources;
using System.IO;
using SenseNet.ContentRepository.Storage.Events;
using SenseNet.Diagnostics;
using System.Threading;
using System.Web.Hosting;
using System.Globalization;
using SenseNet.Configuration;

namespace SenseNet.Portal.UI
{
    internal class SNScriptDependencyCache
    {
        private readonly SortedDictionary<string, SortedDictionary<string, IEnumerable<string>>> _depCache;
        private readonly ReaderWriterLockSlim _depCacheLock;

        private static readonly string _usingStr = "using";
        private static readonly string _resourceStr = "resource";

        public IEnumerable<string> GetDependencies(string path)
        {
            if (Skin.UseScriptDependencyCache)
            {
                try
                {
                    _depCacheLock.TryEnterUpgradeableReadLock(RepositoryEnvironment.DefaultLockTimeout);
                    if (!CacheContainsKey(path))
                    {
                        var deps = ReadDependencies(path) ?? new List<string>();

                        try
                        {
                            _depCacheLock.TryEnterWriteLock(RepositoryEnvironment.DefaultLockTimeout);
                            CacheAddOrUpdate(path, deps);
                        }
                        finally
                        {
                            if (_depCacheLock.IsWriteLockHeld)
                                _depCacheLock.ExitWriteLock();
                        }
                    }
                    if (CacheContainsKey(path))
                        return CacheGet(path);
                }
                finally
                {
                    if (_depCacheLock.IsUpgradeableReadLockHeld)
                        _depCacheLock.ExitUpgradeableReadLock();
                }
            }

            return ReadDependencies(path) ?? new List<string>();
        }

        private static IEnumerable<string> ReadDependencies(string path)
        {
            // read dependencies for .js files only
            if (!path.ToLower().EndsWith(".js"))
                return new List<string>();

            try
            {
                var deps = new List<string>();
                using (var str = VirtualPathProvider.OpenFile(path))
                using (var r = new StreamReader(str))
                {
                    var l = r.ReadLine();
                    var parsedDependency = ParseDependency(l);
                    while (parsedDependency != null)
                    {
                        deps.Add(parsedDependency);
                        l = r.ReadLine();
                        parsedDependency = ParseDependency(l);
                    }
                }
                return deps;
            }
            catch (Exception e)
            {
                SnLog.WriteException(e);
            }

            return null;
        }

        private static string ParseDependency(string line)
        {
            string path = null;

            if (line == null)
                return null;
            
            if (line.StartsWith("/// <depends"))
            {
                // old way: /// <depends path="$skin/scripts/jquery/jquery.js" />
                var startidx = line.IndexOf('"');
                var endidx = line.LastIndexOf('"');
                path = line.Substring(startidx + 1, endidx - startidx - 1);
            }
            else if (line.StartsWith("//"))
            {
                // new way:
                var linePart = line.Substring(2).Trim();
                if (linePart.StartsWith(_usingStr))
                {
                    // // using $skin/scripts/jquery/jquery.js
                    path = linePart.Substring(_usingStr.Length).Trim();
                }
                else if (linePart.StartsWith(_resourceStr))
                {
                    // // resource UserBrowse
                    var className = linePart.Substring(_resourceStr.Length).Trim();
                    path = ResourceScripter.GetResourceUrl(className);
                }
                else
                {
                    string tempCategory;

                    // template script will be resolved later on-the-fly, when the context is available
                    if (HtmlTemplate.TryParseTemplateCategory(linePart, out tempCategory))
                        path = linePart;
                }
            }

            return path;
        }

        #region Singleton instantiation

        private SNScriptDependencyCache()
        {
            _depCache = new SortedDictionary<string, SortedDictionary<string, IEnumerable<string>>>();
            _depCacheLock = new ReaderWriterLockSlim(LockRecursionPolicy.NoRecursion);
        }

        private static readonly SNScriptDependencyCache _instance = new SNScriptDependencyCache();

        public static SNScriptDependencyCache Instance
        {
            get { return _instance; }
        }

        #endregion

        #region nodeobserver handlers

        internal void RemovePath(string path)
        {
            try
            {
                _depCacheLock.TryEnterWriteLock(RepositoryEnvironment.DefaultLockTimeout);
                CacheRemove(path);
            }
            finally
            {
                if (_depCacheLock.IsWriteLockHeld)
                    _depCacheLock.ExitWriteLock();
            }
        }

        internal void UpdateDeps(string path)
        {
            try
            {
                _depCacheLock.TryEnterUpgradeableReadLock(RepositoryEnvironment.DefaultLockTimeout);
                if (CacheContainsKey(path))
                {
                    try
                    {
                        _depCacheLock.TryEnterWriteLock(RepositoryEnvironment.DefaultLockTimeout);
                         CacheAddOrUpdate(path, ReadDependencies(path));
                    }
                    finally
                    {
                        if (_depCacheLock.IsWriteLockHeld)
                            _depCacheLock.ExitWriteLock();
                    }
                }
            }
            finally
            {
                if (_depCacheLock.IsUpgradeableReadLockHeld)
                    _depCacheLock.ExitUpgradeableReadLock();
            }
        }

        #endregion

        #region Dictionary handling

        protected bool CacheContainsKey(string path)
        {
            // Locking is the responsibility of the caller!
            return _depCache.ContainsKey(CultureInfo.CurrentUICulture.Name) &&
                   _depCache[CultureInfo.CurrentUICulture.Name].ContainsKey(path);
        }

        protected void CacheAddOrUpdate(string path, IEnumerable<string> dependencies)
        {
            // Locking is the responsibility of the caller!
            var cultureName = CultureInfo.CurrentUICulture.Name;

            if (_depCache.ContainsKey(cultureName))
            {
                if (_depCache[cultureName].ContainsKey(path))
                    _depCache[cultureName][path] = dependencies;
                else
                    _depCache[cultureName].Add(path, dependencies);
            }
            else
            {
                var deps = new SortedDictionary<string, IEnumerable<string>> { { path, dependencies } };

                _depCache.Add(cultureName, deps);
            }
        }

        protected bool CacheRemove(string path)
        {
            // Locking is the responsibility of the caller!
            return _depCache.ContainsKey(CultureInfo.CurrentUICulture.Name) && _depCache[CultureInfo.CurrentUICulture.Name].Remove(path);
        }

        protected IEnumerable<string> CacheGet(string path)
        {
            // We do not lock or check for key here.
            // It is the responsibility of the caller.
            return _depCache[CultureInfo.CurrentUICulture.Name][path];
        }

        #endregion
    }

    internal class ScriptDependencyObserver : NodeObserver
    {
        protected override void OnNodeModified(object sender, NodeEventArgs e)
        {
            // renamed?
            if (!string.Equals(e.OriginalSourcePath, e.SourceNode.Path, StringComparison.InvariantCulture))
                SNScriptDependencyCache.Instance.RemovePath(e.OriginalSourcePath);
            else
                SNScriptDependencyCache.Instance.UpdateDeps(e.SourceNode.Path);
        }

        protected override void OnNodeMoved(object sender, NodeOperationEventArgs e)
        {
            SNScriptDependencyCache.Instance.RemovePath(e.OriginalSourcePath);
        }

        protected override void OnNodeDeleted(object sender, NodeEventArgs e)
        {
            SNScriptDependencyCache.Instance.RemovePath(e.SourceNode.Path);
        }
    }
}
