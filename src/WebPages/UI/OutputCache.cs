using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using SenseNet.Portal.Virtualization;
using System.Web;
using System.Security.Cryptography;
using SenseNet.ContentRepository;
using System.Web.Caching;

namespace SenseNet.Portal.UI
{
    internal class StyleSheetReference
    {
        public string CssPath;
        public int Order;
        public string Rel;
        public string Type;
        public string Media;
        public string Title;
        public bool AllowBundlingIfEnabled;
    }

    internal class OutputCacheData
    {
        public string Output;
        public IEnumerable<string> ScriptReferences;
        public IEnumerable<StyleSheetReference> StyleSheetReferences;
    }

    /// <summary>
    /// This class encloses functionality related to output caching (cacheableportlet, xsltapplication, ...)
    /// </summary>
    public class OutputCache
    {
        // ===================================================================================================== Consts
        private const string CacheKeyPrefix = "OutputCache_";
        private static readonly string DisableCacheParam = "DisableCache";


        // ===================================================================================================== Public static methods
        public static string GetCacheKey(string customCacheKey, string appNodePath, string portletClientId, bool cacheByHost, bool cacheByPath, bool cacheByParams, bool cacheByLanguage)
        {
            string key = string.Empty;
            if (!string.IsNullOrEmpty(customCacheKey))
            {
                // if custom cache key is explicitely given, it overrides any other logic, and cache key is explicitely set
                key = string.Concat(CacheKeyPrefix, customCacheKey);
            }
            else
            {
                // by default cache key consists of current application page path and portlet clientid
                key = String.Concat(CacheKeyPrefix, appNodePath, portletClientId);

                if (cacheByHost)
                {
                    // if cache by host is true, current host name (e.g. 'example.com') is also added to cache key
                    // added means: a different output will be cached for every host that the content is requested on.
                    key = String.Concat(key, HttpContext.Current.Request.Url.Host.ToLowerInvariant());
                }

                if (cacheByPath)
                {
                    // if cache by path is true, absoluteuri is also added to cache key
                    // added means: same content is requested, but presented with different application page the output will be cached independently
                    var absoluteUri = PortalContext.Current.RequestedUri.AbsolutePath;
                    key = String.Concat(key, absoluteUri);
                }

                if (cacheByParams)
                {
                    // if cachebyparams is true, url query params are also added to cache key
                    // added means: same parameters used, but different application page is requested the output will be cached independently
                    var queryPart = HttpContext.Current.Request.Url.GetComponents(UriComponents.Query, UriFormat.Unescaped);
                    key = String.Concat(key, queryPart);
                }

                if (cacheByLanguage)
                {
                    // if cache by language is true, current language code is also added to cache key
                    // added means: a different output will be cached for every language that the content is requested on.
                    key = String.Concat(key, CultureInfo.CurrentUICulture.Name);
                }
            }

            var sha = new SHA1CryptoServiceProvider();
            var encoding = new UnicodeEncoding();
            return Convert.ToBase64String(sha.ComputeHash(encoding.GetBytes(key)));
        }
        public static bool DisableCache()
        {
            var request = HttpContext.Current.Request;
            if (request != null && request.Params[DisableCacheParam] != null)
            {
                var enableCache = request.Params[DisableCacheParam] as string;
                var enableCacheValue = false;
                return bool.TryParse(enableCache, out enableCacheValue) && enableCacheValue;
            }
            return false;
        }
        public static bool CanCache(bool cacheableForLoggedInUser)
        {
            if (OutputCache.DisableCache())
                return false;

            if (User.Current.Id == User.Visitor.Id)
                return true;

            if(!cacheableForLoggedInUser)
                return false;

            return PortalContext.Current.LoggedInUserCacheEnabled;
        }
        public static string GetCachedOutput(string cacheKey)
        {
            var cachedValue = DistributedApplication.Cache.Get(cacheKey);
            if (cachedValue == null)
                return null;

            // if the cached value is a string, return that
            var cachedString = cachedValue as string;
            if (cachedString != null)
                return cachedString;

            var cachedData = cachedValue as OutputCacheData;
            
            // if the cached value is a complex type, return its string output property
            return cachedData != null ? cachedData.Output : null;
        }
        internal static OutputCacheData GetCachedData(string cacheKey)
        {
            return DistributedApplication.Cache.Get(cacheKey) as OutputCacheData;
           
        }
        public static void InsertOutputIntoCache(double absoluteExpiration, double slidingExpiration, string cacheKey, object output, CacheDependency cacheDependency, CacheItemPriority priority)
        {
            // -1 means it comes from web config
            var absBase = absoluteExpiration == -1 ? Configuration.Cache.AbsoluteExpirationSeconds : absoluteExpiration;
            var slidingBase = slidingExpiration == -1 ? Configuration.Cache.SlidingExpirationSeconds : slidingExpiration;

            // 0 means no caching
            var abs = absBase == 0 ? Cache.NoAbsoluteExpiration : DateTime.UtcNow.AddSeconds((double)absBase);
            var sliding = slidingBase == 0 ? Cache.NoSlidingExpiration : TimeSpan.FromSeconds((double)slidingBase);

            if (abs != Cache.NoAbsoluteExpiration && sliding != Cache.NoSlidingExpiration)
                sliding = Cache.NoSlidingExpiration;

            DistributedApplication.Cache.Insert(cacheKey, output, cacheDependency, abs, sliding, priority, null);
        }
    }
}
