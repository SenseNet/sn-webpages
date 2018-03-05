using System;
using System.Linq;
using System.Xml.Serialization;
using System.Xml.XPath;
using SenseNet.Diagnostics;
using SenseNet.Search;

namespace SenseNet.Portal.Portlets
{
    public class NodeQueryXsltProxy
    {
        [XmlRoot]
        public class Result
        {
            public Services.ContentStore.Content[] ContentList;
        }

        [XmlRoot("Exception")]
        public class QueryException
        {
            public string Message { get; set; }
        }

        public XPathNavigator Execute(object param)
        {
            return Execute(param, true);
        }

        public XPathNavigator Execute(object param, bool raiseExceptions)
        {
            try
            {
                var queryText = ((XPathNavigator) param).Value;
                var result = ContentQuery.Query(queryText, QuerySettings.Default);

                var queryResult = new Result
                {
                    ContentList = result.Nodes.Select(node => new Services.ContentStore.Content(node)).ToArray()
                };

                return queryResult.ToXPathNavigator();
            }
            catch (Exception exc) // logged
            {
                if (raiseExceptions)
                    throw;

                SnLog.WriteException(exc);
                return new QueryException { Message = exc.Message }.ToXPathNavigator();
            }
        }
    }
}
