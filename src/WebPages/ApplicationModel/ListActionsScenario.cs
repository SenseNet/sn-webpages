using System.Collections.Generic;
using System.Linq;
using SenseNet.ContentRepository;

namespace SenseNet.ApplicationModel
{
    [Scenario("ListActions")]
    public class ListActionsScenario : GenericScenario
    {
        protected override IEnumerable<ActionBase> CollectActions(Content context, string backUrl)
        {
            var actList = base.CollectActions(context, backUrl).ToList();
            return actList;
        }
    }
}
