using System;
using SenseNet.Portal.UI.Controls;

namespace SenseNet.Portal.UI.ContentListViews.FieldControls
{
    [Obsolete("Use the QueryBuilder control instead.")]
    public class QueryFilter : FieldControl
    {
        // ========================================================================= FieldControl functions

        public override object GetData()
        {
            return _queryText ?? string.Empty;
        }

        private string _queryText;
        public override void SetData(object data)
        {
            _queryText = data as string;
        }
    }
}
