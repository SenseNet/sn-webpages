using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Storage;
using SenseNet.Diagnostics;
using SenseNet.Portal.Virtualization;
using SenseNet.Portal.Resources;
using System.Globalization;
using System.Web.Hosting;
using SenseNet.Configuration;
using SenseNet.ContentRepository.Storage.Security;
using SenseNet.ContentRepository.Storage.Schema;

namespace SenseNet.Portal.UI.Bundling
{
    /// <summary>
    /// Class for bunding multiple files into one.
    /// </summary>
    public class Bundle
    {
        private List<Tuple<string, int>> _pathsWithOrders = new List<Tuple<string, int>>();
        private string _hash = null;
        private DateTime? _lastCacheInvalidationDate = null;
        private object _lockObject = new object();

        /// <summary>
        /// Gets the paths of the files to bundle.
        /// </summary>
        public IEnumerable<string> Paths
        {
            get { return GetPaths(_pathsWithOrders); }
        }

        /// <summary>
        /// The last date when this bundle was invalidated in the cache.
        /// </summary>
        public DateTime LastCacheInvalidationDate
        {
            get
            {
                if (!IsClosed)
                    throw new Exception("You can't get the invalidation date of this bundle until it's not closed. That would lead to undesired behaviour.");

                if (_lastCacheInvalidationDate == null)
                {
                    lock (_lockObject)
                    {
                        if (_lastCacheInvalidationDate == null)
                        {
                            var date = DateTime.MinValue;

                            foreach (var path in Paths)
                            {
                                if (path.StartsWith("http://") || path.StartsWith("https://"))
                                    continue;

                                var d = GetModificationDateForPath(path);
                                if (d > date)
                                    date = d;
                            }

                            _lastCacheInvalidationDate = date;
                        }
                    }
                }

                return _lastCacheInvalidationDate.Value;
            }
        }

        /// <summary>
        /// Gets or sets the MIME type of this bundle.
        /// </summary>
        public string MimeType { get; set; }

        /// <summary>
        /// Gets whether this bundle has been closed.
        /// </summary>
        public bool IsClosed { get; private set; }

        /// <summary>
        /// The checksum of this bundle, to be used in URLs. You can only get this checksum for closed bundles, to avoid mistaking an incomplete bundle for a complete one.
        /// </summary>
        public string Hash
        {
            get
            {
                if (!IsClosed)
                    throw new Exception("You can't get the hash of this bundle until it's not closed. That would lead to undesired behaviour.");

                if (!Paths.Any())
                    return string.Empty;

                if (_hash == null)
                {
                    _hash = Paths.Aggregate((sum, next) => sum + " " + next);
                    _hash = RepositoryTools.CalculateMD5(_hash);
                }

                return _hash;
            }
        }

        /// <summary>
        /// A unique string which also contains the last invalidation date and can be used as a URL for this bundle.
        /// </summary>
        public virtual string FakeFilename
        {
            get
            {
                return Hash + "_" + LastCacheInvalidationDate.ToString("yyyy.MM.dd_HH.mm.ss");
            }
        }

        /// <summary>
        /// Creates a new instance of the Bundle class.
        /// </summary>
        public Bundle()
        {
        }

        /// <summary>
        /// Closes the current bundle. It's not possible to reopen.
        /// </summary>
        public void Close()
        {
            IsClosed = true;
        }

        /// <summary>
        /// If necessary for the proper operation of the bundle, performs reordering on the input files.
        /// </summary>
        protected virtual IEnumerable<string> GetPaths(List<Tuple<string, int>> paths)
        {
            return _pathsWithOrders.Select(x => x.Item1);
        }

        /// <summary>
        /// Adds a path to the bundle with the order of 0.
        /// </summary>
        public void AddPath(string path, bool recursive)
        {
            AddPath(path, 0, recursive);
        }

        /// <summary>
        /// Adds a path to the bundle with the specified order.
        /// </summary>
        /// <param name="path">The path to add to the bundle.</param>
        /// <param name="order">The specified order.</param>
        /// <param name="recursive">When adding a folder, tells whether to include contents of subfolders</param>
        public void AddPath(string path, int order = 0, bool recursive = true)
        {
            if (string.IsNullOrEmpty(path))
                return;

            if (_pathsWithOrders.Any(x => x.Item1 == path))
                return;

            if (IsClosed)
                throw new Exception("You can't add more files to the bundle when it's closed.");

            // Take care of folders
            if (RepositoryTools.RecurseFilesInVirtualPath(path, recursive, p => AddPath(p, order, recursive)))
                return;

            // Take care of files
            var item = Tuple.Create(path, order);
            bool foundHigherOrder = false;
            int index = -1;

            foreach (var pathWithOrder in _pathsWithOrders)
            {
                index++;
                if (pathWithOrder.Item2 > order)
                {
                    foundHigherOrder = true;
                    break;
                }
            }

            if (foundHigherOrder)
                _pathsWithOrders.Insert(index, item);
            else
                _pathsWithOrders.Add(item);
        }

        /// <summary>
        /// Combines the files in this bundle into one.
        /// </summary>
        /// <returns>The combined content of the bundle.</returns>
        public virtual string Combine()
        {
            var stringBuilder = new StringBuilder();

            foreach (var path in Paths)
            {
                var text = GetTextFromPath(path);
                if (text != null)
                {
                    stringBuilder.Append(text);
                    stringBuilder.Append("\r\n");
                }
            }

            return stringBuilder.ToString();
        }

        /// <summary>
        /// Gets the modification date of a given path
        /// </summary>
        protected virtual DateTime GetModificationDateForPath(string path)
        {
            var fsPath = HostingEnvironment.MapPath(path);
            var nodeHead = NodeHead.Get(path);

            if ((WebApplication.DiskFSSupportMode == DiskFSSupportMode.Prefer || nodeHead == null) && System.IO.File.Exists(fsPath))
            {
                // If DiskFsSupportMode is Prefer and the file exists, or it's fallback but the node doesn't exist in the repo get the modification date from the file system
                return System.IO.File.GetLastWriteTime(fsPath);
            }
            else if (path[0] == '/' && nodeHead != null)
            {
                // If the node exists, get it from the repo
                return nodeHead.ModificationDate;
            }
            else if (path.Contains(ResourceHandler.UrlPart))
            {
                // Special case: resource script
                return ResourceHandler.GetLastResourceModificationDate(null);
            }

            return DateTime.MinValue;
        }

        /// <summary>
        /// Gets the text content from a given path and processes it. Override this method if you want to implement custom logic when each file is loaded.
        /// </summary>
        /// <param name="path">The path from which to the content should be retrieved.</param>
        /// <returns>The processed text content of the given path, or null if it was not found.</returns>
        protected virtual string GetTextFromPath(string path)
        {
            if (path[0] == '/')
            {
                // This is a repository URL

                var fsPath = HostingEnvironment.MapPath(path);
                var fileNodeHead = NodeHead.Get(path);
                var fileNode = fileNodeHead != null && SecurityHandler.HasPermission(fileNodeHead, PermissionType.Open)
                    ? Node.Load<File>(path)
                    : null;

                System.IO.Stream stream = null;

                if ((WebApplication.DiskFSSupportMode == DiskFSSupportMode.Prefer || fileNode == null) && System.IO.File.Exists(fsPath))
                {
                    // If DiskFsSupportMode is Prefer and the file exists, or it's fallback but the node doesn't exist in the repo get it from the file system
                    stream = new System.IO.FileStream(fsPath, System.IO.FileMode.Open, System.IO.FileAccess.Read);
                }
                else if (path[0] == '/' && fileNode != null)
                {
                    // If the node exists, get it from the repo
                    stream = fileNode.Binary.GetStream();
                }
                else if (path.StartsWith("/" + ResourceHandler.UrlPart + "/"))
                {
                    // Special case, this is a resource URL, we will just render the resource script here
                    var parsed = ResourceHandler.ParseUrl(path);
                    if (parsed == null)
                        return null;

                    var className = parsed.Item2;
                    var culture = CultureInfo.GetCultureInfo(parsed.Item1);

                    try
                    {
                        return ResourceScripter.RenderResourceScript(className, culture);
                    }
                    catch (Exception exc)
                    {
                        SnLog.WriteException(exc);
                        return null;
                    }
                }

                try
                {
                    return stream != null ? RepositoryTools.GetStreamString(stream) : null;
                }
                finally
                {
                    if (stream != null)
                        stream.Dispose();
                }
            }

            if (path.StartsWith("http://") || path.StartsWith("https://"))
            {
                // This is a web URL

                try
                {
                    HttpWebRequest req;
                    if (PortalContext.IsKnownUrl(path))
                    {
                        string url;
                        var ub = new UriBuilder(path);
                        var origHost = ub.Host;
                        ub.Host = "127.0.0.1";
                        url = ub.Uri.ToString();
                        req = (HttpWebRequest)HttpWebRequest.Create(url);
                        req.Host = origHost;
                    }
                    else
                    {
                        req = (HttpWebRequest)HttpWebRequest.Create(path);
                    }

                    req.AutomaticDecompression = DecompressionMethods.Deflate | DecompressionMethods.GZip;

                    var res = req.GetResponse();
                    
                    using (var st = res.GetResponseStream())
                    using (var stream = new System.IO.MemoryStream())
                    {
                        st.CopyTo(stream);

                        var arr = stream.ToArray();
                        var result = Encoding.UTF8.GetString(arr);
                        return result;
                    }
                }
                catch (Exception exc)
                {
                    SnLog.WriteException(exc, "Error during bundle request: ", EventId.Portal, properties: new Dictionary<string, object> { 
                        { "Path", path }
                    });
                    return null;
                }
            }

            return null;
        }

        /// <summary>
        /// Resets the invalidation date of this bundle.
        /// </summary>
        public void ResetLastCacheInvalidationDate()
        {
            _lastCacheInvalidationDate = null;
        }
    }
}
