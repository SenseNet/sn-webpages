using System.Text.RegularExpressions;
using Microsoft.Ajax.Utilities;
using System;
using SenseNet.Diagnostics;
using System.Collections.Generic;
using System.Text;
using SenseNet.ContentRepository.Storage;
using SenseNet.ContentRepository;

namespace SenseNet.Portal.UI.Bundling
{
    /// <summary>
    /// Custom bundle dedicated for bundling and minifying CSS files.
    /// </summary>
    public class CssBundle : Bundle
    {
        private static readonly string REGEX_IMPORT = @"@import url\((?<url>.*?)\);";
        private static readonly string REGEX_URL = @"url\((?<url>.*?)\)";

        private List<string> _postponedPaths;

        /// <summary>
        /// The media type of this CSS bundle.
        /// </summary>
        public string Media { get; set; }

        public IEnumerable<string> PostponedPaths
        {
            get { return _postponedPaths ?? (_postponedPaths = new List<string>()); }
        }

        public static long MaxDataUriLengthInBytes { get { return 30 * 1024; } }

        /// <summary>
        /// Creates a new instance of the CssBundle class.
        /// </summary>
        public CssBundle()
        {
            MimeType = "text/css";
            _postponedPaths = new List<string>();
        }

        /// <summary>
        /// In addition to combining, also minifies the given CSS.
        /// </summary>
        /// <returns>The combined and minified CSS code for this bundle.</returns>
        public override string Combine()
        {
            var combined = base.Combine();

            // Step 1: Bubble the @import directives to the top and eliminate @charset directives (as this will always be UTF-8)
            var pattern = @"@.*?;";
            var importList = new StringBuilder();

            combined = Regex.Replace(combined, pattern, m =>
            {
                var directive = m.Groups[0].Value;

                if (directive.StartsWith("@import"))
                {
                    // Remember import directives to put them at the top
                    var url = directive.Substring(12, directive.Length - 14).Replace("\"", "").Replace("'", "");

                    if (url.Contains(" "))
                        importList.Append("@import url('" + url + "');\r\n");
                    else
                        importList.Append("@import url(" + url + ");\r\n");

                    return string.Empty;
                }
                else if (directive.StartsWith("@charset"))
                {
                    // Get rid of charset directives
                    return string.Empty;
                }

                // Leave the other directives alone
                return directive;
            }, RegexOptions.IgnoreCase | RegexOptions.Multiline | RegexOptions.Compiled);

            combined = "@charset \"UTF-8\";" + importList.ToString() + combined;

            // Step 2: The actual CSS minification

            var result = string.Empty;
            var errorLines = string.Empty;
            var hasError = false;

            try
            {
                var cssParser = new CssParser();

                cssParser.Settings.CommentMode = CssComment.None;
                cssParser.Settings.MinifyExpressions = true;
                cssParser.Settings.OutputMode = OutputMode.SingleLine;
                cssParser.Settings.TermSemicolons = false;

                cssParser.CssError += delegate(object sender, CssErrorEventArgs args)
                {
                    // The 0 severity means errors.
                    // We can safely ignore the rest.
                    if (args.Error.Severity == 0)
                    {
                        hasError = true;
                        errorLines += string.Format("\r\n/* CSS Parse error when processing the bundle.\r\nLine {0} column {1}.\r\nError message: {2}, severity: {3} */",
                            args.Error.StartLine,
                            args.Error.StartColumn,
                            args.Error.Message,
                            args.Error.Severity);
                    }
                };

                result = cssParser.Parse(combined);

                // CSS bundle will not break when a newline escape sequence was processed in the CSS.
                // \A is a CSS escape sequence which means a newline.
                // Ajax Minifier will substitute the sequences with their counterparts. (This can't be turned off, or 
                // And browsers will fail when they see a newline within a constant.
                result = result.Replace("\"\n\"", "\"\\A\"");
            }
            catch (Exception exc)
            {
                hasError = true;
                SnLog.WriteException(exc);
            }

            // If there were errors, use the non-minified version and append the errors to the bottom,
            // so that the portal builder can debug it.
            if (hasError)
                result = combined + "\r\n\r\n" + errorLines;

            return result;
        }

        protected override string GetTextFromPath(string path)
        {
            var text = base.GetTextFromPath(path);

            if (text != null)
            {
                var parentPath = path.Substring(0, path.LastIndexOf('/'));

                // Search for url(...) occurences in the CSS, and replace them with absolute URLs

                text = Regex.Replace(text, REGEX_URL, m =>
                {
                    var urlg = m.Groups["url"];
                    var url = urlg != null ? (urlg.Value ?? string.Empty) : string.Empty;
                    url = url.Trim('\"', '\'');

                    if (url == string.Empty)
                        return "url(\"\")";

                    var isAbsoluteUrl = url[0] == '/' || url.StartsWith("http:") || url.StartsWith("https:") || url.StartsWith("data:") || url.StartsWith("ftp:");

                    // Replace relative URLs with absolute ones
                    if (!isAbsoluteUrl)
                    {
                        var pp = parentPath;
                        while (url.StartsWith("../"))
                        {
                            // move up on the parent chain if needed
                            url = url.Substring(3);
                            pp = pp.Substring(0, pp.LastIndexOf('/'));
                        }

                        url = pp + "/" + url;
                    }

                    if (url.StartsWith("/Root"))
                    {
                        if (url.EndsWith(".jpg") || url.EndsWith(".jpeg") || url.EndsWith(".png"))
                        {
                            var file = Node.Load<File>(url);
                            if (file != null && file.Binary != null && file.Binary.Size <= MaxDataUriLengthInBytes)
                            {
                                var base64 = file.Binary.ToBase64();
                                var dataUri = "data:" + file.Binary.ContentType + ";base64," + base64;
                                if (dataUri.Length <= MaxDataUriLengthInBytes)
                                {
                                    url = dataUri;
                                }
                            }
                        }
                    }

                    if (url.Contains(" "))
                        return "url(\"" + url + "\")";

                    return "url(" + url + ")";
                }, RegexOptions.IgnoreCase | RegexOptions.Multiline | RegexOptions.Compiled);

                // Search for import directives and expand them if they are URLs in the portal
                // (Other import directives will be dealt with later in the pipeline.)

                text = Regex.Replace(text, REGEX_IMPORT, m =>
                {
                    try
                    {
                        var urlg = m.Groups["url"];
                        var url = urlg != null ? (urlg.Value ?? string.Empty) : string.Empty;
                        url = url.Trim('\"', '\'');

                        if (url == string.Empty)
                            return string.Empty;

                        // If this is a web URL, just ignore it for now
                        if (url.StartsWith("http:") || url.StartsWith("https:") || url.StartsWith("data:") || url.StartsWith("ftp:") || url.StartsWith("//"))
                        {
                            return "@import url('" + url + "');";
                        }

                        // Otherwise just recursively grab the url referenced by the import

                        var importedContent = GetTextFromPath(url);

                        if (importedContent == null)
                            return string.Empty;

                        return "\r\n" + importedContent + "\r\n";
                    }
                    catch (Exception exc)
                    {
                        SnLog.WriteException(exc);
                        return string.Empty;
                    }
                }, RegexOptions.IgnoreCase | RegexOptions.Multiline | RegexOptions.Compiled);
            }

            return text;
        }

        public void AddPostponedPath(string path)
        {
            if (string.IsNullOrEmpty(path) || _postponedPaths.Contains(path))
                return;

            _postponedPaths.Add(path);
        }
    }
}
