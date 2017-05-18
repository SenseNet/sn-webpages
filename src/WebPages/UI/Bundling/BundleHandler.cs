using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Runtime.Caching;
using System.Threading;
using System.Web;

namespace SenseNet.Portal.UI.Bundling
{
    public class BundleHandler : IHttpHandler
    {
        private static MemoryCache _cache = new MemoryCache("SenseNetBundleCache");

        private static List<Bundle> _bundles = new List<Bundle>();
        private static ReaderWriterLockSlim _bundlesLock = new ReaderWriterLockSlim();

        public static string UrlPart
        {
            get { return "sn-bundles"; }
        }

        bool IHttpHandler.IsReusable
        {
            get { return true; }
        }

        public static List<Bundle> Bundles
        {
            get
            {
                _bundlesLock.EnterReadLock();

                try
                {
                    return _bundles;
                }
                finally
                {
                    _bundlesLock.ExitReadLock();
                }
            }
        }

        public static void AddBundleIfNotThere(Bundle b)
        {
            if (!b.IsClosed)
                throw new Exception("You can only add closed bundles to the BundleHandler, sorry.");

            Bundle alreadyThere;

            _bundlesLock.EnterReadLock();

            try
            {
                alreadyThere = _bundles.SingleOrDefault(x => x.Hash == b.Hash);
            }
            finally
            {
                _bundlesLock.ExitReadLock();
            }

            if (alreadyThere == null)
            {
                _bundlesLock.EnterWriteLock();

                try
                {
                    alreadyThere = _bundles.SingleOrDefault(x => x.Hash == b.Hash);

                    if (alreadyThere == null)
                    {
                        _bundles.Add(b);
                    }
                }
                finally
                {
                    _bundlesLock.ExitWriteLock();
                }
            }
        }

        public static bool IsBundleInCache(Bundle b)
        {
            return (_cache[b.Hash] as string) != null;
        }

        public static void AddBundleToCache(Bundle bundle)
        {
            Bundle alreadyThere;

            _bundlesLock.EnterReadLock();

            try
            {
                alreadyThere = _bundles.SingleOrDefault(x => x.Hash == bundle.Hash);
            }
            finally
            {
                _bundlesLock.ExitReadLock();
            }

            if (alreadyThere == null)
            {
                AddBundleIfNotThere(bundle);
            }
            else
            {
                bundle = alreadyThere;
            }

            lock (bundle)
            {
                if (!IsBundleInCache(bundle))
                {
                    var result = bundle.Combine();
                    _cache.Set(bundle.Hash, result, new CacheItemPolicy() { AbsoluteExpiration = DateTime.UtcNow.AddDays(30) });
                }
            }
        }

        public static void InvalidateCacheForPath(string path)
        {
            Bundle[] matchingBundles = null;

            _bundlesLock.EnterReadLock();

            try
            {
                matchingBundles = _bundles.Where(x => x.Paths.Select(z => z.ToLower()).Contains(path.ToLower())).ToArray();
            }
            finally
            {
                _bundlesLock.ExitReadLock();
            }

            foreach (var bundle in matchingBundles)
            {
                var hash = bundle.Hash;
                bundle.ResetLastCacheInvalidationDate();

                if (_cache[hash] as string != null)
                {
                    _cache.Remove(hash);
                }
            }
        }

        public void ProcessRequest(HttpContext context)
        {
            if (context.Request.Headers["If-Modified-Since"] != null)
            {
                // Since the URLs contains the date of creation, we can be sure that the contents of a URL will never, ever change
                context.Response.StatusCode = 304;
                return;
            }

            var bundleUrl = Path.GetFileName(context.Request.RawUrl);
            Bundle bundle;

            _bundlesLock.EnterReadLock();

            try
            {
                bundle = _bundles.SingleOrDefault(x => x.FakeFilename == bundleUrl);
            }
            finally
            {
                _bundlesLock.ExitReadLock();
            }

            if (bundle == null)
            {
                // If the bundle is not found, just return 404
                context.Response.StatusCode = 404;
                return;
            }

            var bundleHash = bundle.Hash;
            var result = _cache[bundleHash] as string;

            if (result == null)
            {
                lock (bundle)
                {
                    if (!IsBundleInCache(bundle))
                    {
                        AddBundleToCache(bundle);
                    }
                }

                result = _cache[bundleHash] as string;
            }

            // Check what kind of encodings the client supports
            string acceptEncoding = context.Request.Headers["Accept-Encoding"];

            // Compress the response, if it's supported
            if (!string.IsNullOrEmpty(acceptEncoding))
            {
                if (acceptEncoding.Contains("deflate"))
                {
                    context.Response.Filter = new DeflateStream(context.Response.Filter, CompressionMode.Compress);
                    context.Response.AppendHeader("Content-Encoding", "deflate");
                }
                else if (acceptEncoding.Contains("gzip"))
                {
                    context.Response.Filter = new GZipStream(context.Response.Filter, CompressionMode.Compress);
                    context.Response.AppendHeader("Content-Encoding", "gzip");
                }
            }

            // Allow proxy servers to cache encoded and unencoded versions separately
            // http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.44
            context.Response.AppendHeader("Vary", "Accept-Encoding");

            SenseNet.Portal.Virtualization.HttpHeaderTools.SetCacheControlHeaders(
                httpCacheability: HttpCacheability.Public,
                lastModified: bundle.LastCacheInvalidationDate,
                maxAge: TimeSpan.FromDays(30));

            context.Response.ContentType = bundle.MimeType;
            // Send the actual response
            context.Response.Write(result);
        }
    }
}
