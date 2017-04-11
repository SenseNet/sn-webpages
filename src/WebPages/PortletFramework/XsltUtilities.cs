using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using SenseNet.Portal.UI.PortletFramework;
using System.Xml.XPath;

namespace SenseNet.Diagnostics
{
    [XsltCreatable]
    public class XsltUtilities
    {
        public void TraceWrite(object thing)
        {
            string result;
            var iterator = thing as XPathNodeIterator;
            if (iterator != null)
            {
                if (!iterator.MoveNext())
                    return;
                result = iterator.Current.OuterXml;
            }
            else
            {
                result = thing.ToString();
            }
            SnLog.WriteInformation(result);
        }
    }
}
