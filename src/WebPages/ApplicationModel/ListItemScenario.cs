using System.Collections.Generic;
using System.Linq;
using SenseNet.ContentRepository;

namespace SenseNet.ApplicationModel
{
    [Scenario("ListItem")]
    public class ListItemScenario : GenericScenario
    {
        protected override IEnumerable<ActionBase> CollectActions(Content context, string backUrl)
        {
            var actions = base.CollectActions(context, backUrl).ToList();

            return actions;
        }
    }
}
