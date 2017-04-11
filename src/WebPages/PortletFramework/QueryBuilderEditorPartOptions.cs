using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace SenseNet.Portal.UI.PortletFramework
{
    [AttributeUsage(AttributeTargets.Property, AllowMultiple = false)]
    public class QueryBuilderEditorPartOptions : TextEditorPartOptions
    {
        public QueryBuilderEditorPartOptions() { }
        public QueryBuilderEditorPartOptions(TextEditorCommonType commonType) : base(commonType) {}
    }
}
