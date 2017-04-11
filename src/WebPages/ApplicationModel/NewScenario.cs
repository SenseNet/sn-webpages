using System.Collections.Generic;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Schema;
using SenseNet.Portal.Virtualization;
using SenseNet.ContentRepository.Storage.Security;

namespace SenseNet.ApplicationModel
{
    [Scenario("New", false)]
    public class NewScenario : GenericScenario
    {
        public bool DisplaySystemFolders { get; set; }

        public override IComparer<ActionBase> GetActionComparer()
        {
            return new ActionComparerByText();
        }

        protected override IEnumerable<ActionBase> CollectActions(Content context, string backUrl)
        {
            var actList = new List<ActionBase>();

            if (context == null || !context.Security.HasPermission(PermissionType.AddNew))
                return actList;

            var app = ApplicationStorage.Instance.GetApplication("Add", context, PortalContext.Current.DeviceName);
            var gc = context.ContentHandler as GenericContent;

            if (gc != null && app != null)
            {
                foreach (var node in GetNewItemNodes(gc))
                {                    
                    var ctype = node as ContentType;
                    if (ctype != null)
                    {
                        if (!DisplaySystemFolders && ctype.IsInstaceOfOrDerivedFrom("SystemFolder"))
                            continue;

                        // skip Add action if the user tries to add a list without having a manage container permission
                        if (!SavingAction.CheckManageListPermission(ctype.NodeType, context.ContentHandler))
                            continue;

                        var act = app.CreateAction(context, backUrl, new { ContentTypeName = ctype.Name });
                        if (act == null)
                            continue;

                        var ctContent = Content.Create(ctype);
                        act.Text = ctContent.DisplayName;
                        act.Icon = ctype.Icon;
                        actList.Add(act);
                    }
                    else
                    {
                        var templateNode = node as GenericContent;
                        if (templateNode == null)
                            continue;

                        if (!DisplaySystemFolders && templateNode.NodeType.IsInstaceOfOrDerivedFrom("SystemFolder"))
                            continue;

                        // skip Add action if the user tries to add a list without having a manage container permission
                        if (!SavingAction.CheckManageListPermission(templateNode.NodeType, context.ContentHandler))
                            continue;

                        var act = app.CreateAction(context, backUrl, new { ContentTypeName = templateNode.Path });
                        if (act == null)
                            continue;

                        var templateContent = Content.Create(templateNode);
                        act.Text = templateContent.DisplayName;
                        act.Icon = templateNode.Icon;
                        actList.Add(act);
                    }
                }
            }

            return actList;
        }

        public override void Initialize(Dictionary<string, object> parameters)
        {
            base.Initialize(parameters);

            if (parameters == null)
                return;

            if (!parameters.ContainsKey("DisplaySystemFolders")) 
                return;

            var dsfVal = parameters["DisplaySystemFolders"];
            if (dsfVal == null)
                return;

            bool dsf;
            if (bool.TryParse(dsfVal.ToString().ToLower(), out dsf))
                DisplaySystemFolders = dsf;
        }
    }
}
