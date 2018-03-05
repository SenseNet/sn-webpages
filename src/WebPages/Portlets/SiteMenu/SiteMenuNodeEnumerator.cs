using System;
using System.Collections.Generic;
using SenseNet.ContentRepository.Storage;
using SenseNet.ContentRepository.Storage.Search;
using SenseNet.Search;
using SenseNet.Search.Querying;

namespace SenseNet.Portal.Portlets
{
    public class SiteMenuNodeEnumerator : NodeEnumerator
    {
        public static IEnumerable<Node> GetNodes(string path, ExecutionHint hint,
            string filter, int? depth, string contextPath, bool getContextChildren)
        {
            if (path == null)
                throw new ArgumentNullException(nameof(path));

            return new SiteMenuNodeEnumerator(path, hint, filter, depth, contextPath, getContextChildren);
        }

        // ================================================================== 

        private readonly string _contextPath;
        private readonly bool _getContextChildren;
        private readonly string _childrenFilter;

        protected SiteMenuNodeEnumerator(string path, ExecutionHint executionHint,
            string filter, int? depth, string contextPath, bool getContextChildren)
            : base(path, executionHint, null, depth)
        {
            _contextPath = contextPath;
            _getContextChildren = getContextChildren;
            _childrenFilter = filter;
        }

        protected override bool MoveToFirstChild()
        {
            if (!string.IsNullOrEmpty(_contextPath))
            {
                if (!_contextPath.StartsWith(CurrentNode.Path))
                    return false;

                if (!_getContextChildren && _contextPath.Equals(CurrentNode.Path))
                    return false;
            }

            return base.MoveToFirstChild();
        }
    }
}
