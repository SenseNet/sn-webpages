using System;
using System.Linq;
using SenseNet.ContentRepository;
using SenseNet.Portal.UI.ContentListViews.Handlers;
using SCS = SenseNet.ContentRepository.Schema;

namespace SenseNet.Packaging.Steps
{
    public class RenameContentListViewColumn : Step
    {
        public string ContentType { get; set; }
        public string OldName { get; set; }
        public string NewName { get; set; }

        public override void Execute(ExecutionContext context)
        {
            context.AssertRepositoryStarted();

            if (string.IsNullOrEmpty(ContentType))
                throw new ArgumentNullException(nameof(ContentType));
            if (string.IsNullOrEmpty(OldName))
                throw new ArgumentNullException(nameof(OldName));
            if (string.IsNullOrEmpty(NewName))
                throw new ArgumentNullException(nameof(NewName));

            ContentType = (string)context.ResolveVariable(ContentType);
            OldName = (string)context.ResolveVariable(OldName);
            NewName = (string)context.ResolveVariable(NewName);

            if (string.Compare(OldName, NewName, StringComparison.InvariantCulture) == 0)
            {
                Logger.LogWarningMessage($"Old name and new name are the same: {OldName}.");
                return;
            }

            UpdateContentListViews();
        }

        private void UpdateContentListViews()
        {
            // load the content type and field setting
            var contentType = SCS.ContentType.GetByName(ContentType);
            var fs2 = contentType.GetFieldSettingByName(NewName);

            // prepare grid column values
            var oldColumnName = string.Format("{0}.{1}", ContentType, OldName);
            var newColumnName = string.Format("{0}.{1}", ContentType, NewName);
            var newBindingName = SCS.FieldSetting.GetBindingNameFromFullName(newColumnName);

            // iterate through content list views that may contain a column for the field that we have changed
            foreach (var listView in Content.All.DisableAutofilters().Where(c => c.TypeIs("ListView"))
                .AsEnumerable()
                .Select(c => c.ContentHandler)
                .Cast<ListView>())
            {
                // do not bother with list views that are edited manually
                if (listView.Template == null)
                    continue;

                // look for a column that refers to the old field
                var columns = listView.GetColumns().ToArray();
                var column = columns.FirstOrDefault(c => c.FullName == oldColumnName);
                if (column == null)
                    continue;

                // change column properties to point to the new field
                column.FullName = newColumnName;
                column.BindingName = newBindingName;
                column.Title = fs2.DisplayName;

                Logger.LogMessage("Saving content list view {0}", listView.Path);

                // update the content list view
                listView.SetColumns(columns);
                listView.Save(SavingMode.KeepVersion);
            }
        }
    }
}
