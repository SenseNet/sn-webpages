using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using SenseNet.ContentRepository.Storage;
using SenseNet.Portal.Virtualization;
using cs = SenseNet.Services.ContentStore;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Storage.Security;
using SenseNet.Search;
using SenseNet.ApplicationModel;
using SenseNet.Configuration;
using SenseNet.ContentRepository.Search;
using SenseNet.Search.Querying;

namespace SenseNet.Portal.ContentStore
{
    public class ContentStoreApi: GenericApi
    {
        /* ===================================================================== Picker */
        [ODataFunction]
        public static string GetChildren(Content content, string rnd, string contentTypes = null, bool simpleContent = false)
        {
            AssertPermission(PlaceholderPath);

            return JsonConvert.SerializeObject(GetChildrenInternal(content.Path, true, contentTypes, simpleContent));
        }

        [ODataFunction]
        public static string GetTreeNodeChildren(Content content, string path, string rootonly, string rnd, bool simpleContent = false)
        {
            AssertPermission(PlaceholderPath);

            if (path == null)
                throw new ArgumentNullException("id");

            if (rootonly == "1")
            {
                // return requested node
                return JsonConvert.SerializeObject(GetNodeInternal(path, simpleContent));
            }
            return JsonConvert.SerializeObject(GetChildrenInternal(path, false, null, simpleContent));
        }

        [ODataFunction]
        public static string GetTreeNodeAllChildren(Content content, string path, string rootonly, string rnd, bool simpleContent = false)
        {
            AssertPermission(PlaceholderPath);

            if (path == null)
                throw new ArgumentNullException("id");

            if (rootonly == "1")
            {
                // return requested node
                return JsonConvert.SerializeObject(GetNodeInternal(path, simpleContent));
            }
            else
            {
                return JsonConvert.SerializeObject(GetChildrenInternal(path, true, null, simpleContent));
            }
        }

        private static object[] GetNodeInternal(string parentPath, bool simpleContent = false)
        {
            Node node = null;
            if (parentPath == Repository.RootPath || parentPath == RepositoryStructure.ImsFolderPath)
            {
                // Elevation: Root and IMS should be accessible through this service 
                // (the user already passed the feature permission check).
                using (new SystemAccount())
                {
                    node = Node.LoadNode(parentPath);
                }
            }
            else
            {
                var head = NodeHead.Get(parentPath);
                if (head != null && SecurityHandler.HasPermission(head, PermissionType.Open))
                    node = Node.LoadNode(head);
            }

            if (node == null)
                throw new ArgumentNullException("parentPath");

            if (simpleContent)
            {
                return new List<cs.SimpleServiceContent> { new cs.SimpleServiceContent(node) }.ToArray();
            }
            else
            {
                return new List<cs.Content> { new cs.Content(node, true, false, false, false, 0, 0) }.ToArray();
            }
        }

        private static object[] GetChildrenInternal(string parentPath, bool includeLeafNodes, string contentTypes, bool simpleContent = false)
        {
            if (String.IsNullOrEmpty(parentPath))
                return null;

            Node parent = null;
            if (parentPath == Repository.RootPath || parentPath == RepositoryStructure.ImsFolderPath)
            {
                // Elevation: Root and IMS should be accessible through this service 
                // (the user already passed the feature permission check).
                using (new SystemAccount())
                {
                    parent = Node.LoadNode(parentPath);
                }
            }
            else
            {
                var head = NodeHead.Get(parentPath);
                if (head != null && SecurityHandler.HasPermission(head, PermissionType.Open))
                    parent = Node.LoadNode(head);
            }

            return GetChildrenByNodeInternal(parent, includeLeafNodes, contentTypes, simpleContent);
        }

        private static object[] GetChildrenByNodeInternal(Node node, bool includeLeafNodes, string contentTypes, bool simpleContent = false)
        {
            var folderParent = node as IFolder;
            if (folderParent == null)
                return null;

            var content = SenseNet.ContentRepository.Content.Create(node);
            var filter = GetContentTypesFilter(contentTypes);

            // add content type filter if needed
            if (!string.IsNullOrEmpty(filter))
                content.ChildrenDefinition.ContentQuery = ContentQuery.AddClause(content.ChildrenDefinition.ContentQuery, filter, LogicalOperator.And);

            // in case of SmartFolder: do not override the settings given on the content
            if (!(folderParent is SmartFolder))
                content.ChildrenDefinition.EnableAutofilters = FilterStatus.Disabled;

            var children = content.Children.AsEnumerable().Where(c => c != null).Select(c => c.ContentHandler);
            if (!includeLeafNodes)
                children = children.Where(c => c is IFolder).ToList();

            return children.Where(c => c != null).Select(child => new cs.SimpleServiceContent(child)).ToArray();
        }

        [ODataFunction]
        [Obsolete("Use IsContentQuery instead.")]
        public static bool IsLuceneQuery(Content content, string rnd)
        {
            return IsContentQuery(content, rnd);
        }
        [ODataFunction]
        public static bool IsContentQuery(Content content, string rnd)
        {
            AssertPermission(PlaceholderPath);

            return SearchManager.IsOuterEngineEnabled;
        }

        [ODataFunction]
        public static object[] Search(Content content, string searchStr, string searchRoot, string contentTypes, string rnd, bool simpleContent = false)
        {
            AssertPermission(PlaceholderPath);

            if (SearchManager.IsOuterEngineEnabled)
            {
                return SearchContentQuery(searchStr, searchRoot, contentTypes, simpleContent);
            }
            throw new SnNotSupportedException("ContentQuery is disabled.");
        }

        private static object[] SearchContentQuery(string searchStr, string searchRoot, string contentTypes, bool simpleContent = false)
        {
            var queryStr = CreateContentQueryString(searchStr, searchRoot, contentTypes);
            var query = ContentQuery.CreateQuery(queryStr, new QuerySettings
            {
                Sort = new List<SortInfo> { new SortInfo("DisplayName") },
                EnableAutofilters = FilterStatus.Disabled,
                EnableLifespanFilter = FilterStatus.Disabled
            });

            if (simpleContent)
            {
                return (from n in query.Execute().Nodes
                             where n != null
                             select new cs.SimpleServiceContent(n)).ToArray();
            }
            else
            {
                return (from n in query.Execute().Nodes
                             where n != null
                             select new cs.Content(n, true, false, false, false, 0, 0)).ToArray();
            }
        }

        private static bool IsContentQuerySyntax(string s)
        {
            return s.Contains(":") || s.Contains("+") || s.Contains("*");
        }

        private static string CreateContentQueryString(string searchStr, string searchRoot, string contentTypesStr)
        {
            var queryStr = string.Empty;

            if (!string.IsNullOrEmpty(searchStr))
            {
                if (!IsContentQuerySyntax(searchStr))
                {
                    // more than one word: _Text:<kifejezés>
                    // one word without quotation marks: _Text:<kifejezés>*
                    // one word with quotation marks: _Text:<kifejezés>

                    var words = searchStr.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                    if (words.Length == 1 && !searchStr.Contains('"'))
                    {
                        searchStr = string.Concat("_Text:", searchStr.TrimEnd('*'), "*");
                    }
                    else
                    {
                        searchStr = string.Concat("_Text:", searchStr);
                    }
                }

                // the given query will be AND-ed to all other query terms
                // ie.: _Text:user1 _Text:user2 
                // -> +(_Text:user1 _Text:user2) +(<ancestor and contentype queries>)
                // ie.: +_Text:user1 +_Text:user2 
                // -> +(+_Text:user1 +_Text:user2) +(<ancestor and contentype queries>)
                searchStr = $"+({searchStr})";

                queryStr = searchStr;
            }

            if (!string.IsNullOrEmpty(searchRoot))
            {
                var pathQuery = $"+InTree:\"{searchRoot.ToLower()}\"";
                queryStr = string.Concat(queryStr, " ", pathQuery);
            }

            if (!string.IsNullOrEmpty(contentTypesStr))
            {
                queryStr = $"{queryStr} +({GetContentTypesFilter(contentTypesStr)})";
            }

            return queryStr;
        }
        private static IEnumerable<string> GetContentTypes(string contentTypesStr)
        {
            return contentTypesStr.Split(',');
        }

        private static string GetContentTypesFilter(string contentTypeNames)
        {
            if (string.IsNullOrEmpty(contentTypeNames))
                return string.Empty;

            var filter = string.Empty;

            return contentTypeNames.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries).Aggregate(filter, (current, ctName) => current + ("TypeIs:" + ctName + " ")).Trim();
        }

        private static readonly string PlaceholderPath = "/Root/System/PermissionPlaceholders/ContentStore-mvc";
    }
}
