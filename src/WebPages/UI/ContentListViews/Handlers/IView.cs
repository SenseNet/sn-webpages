using System.Collections.Generic;

namespace SenseNet.Portal.UI.ContentListViews.Handlers
{
    public interface IView
    {
        void AddColumn(Column col);
        void RemoveColumn(string fullName);
        IEnumerable<Column> GetColumns();
    }
}
