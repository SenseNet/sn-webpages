using System.Linq;
using System.Web;
using Newtonsoft.Json;
using SenseNet.ApplicationModel;
using SenseNet.Portal.UI;
using SenseNet.Portal.Virtualization;
using SenseNet.ContentRepository;

namespace SenseNet.Portal.ApplicationModel
{
    public class SmartAppHelperApi: GenericApi
    {
        [ODataFunction]
        public static string GetActions(Content content, string scenario, string back, string parameters)
        {
            var path = HttpUtility.UrlDecode(content.Path);
            scenario = HttpUtility.UrlDecode(scenario);
            parameters = HttpUtility.UrlDecode(parameters);

            // this line caused an error in back url encoding (multiple back 
            // parameters when the user goes deep, through multiple actions)
            // back = HttpUtility.UrlDecode(back);

            var actions = ActionFramework.GetActions(Content.Load(path), scenario, parameters, back)
                .Select(IconHelper.AddIconTag).ToList();

            return JsonConvert.SerializeObject(actions);
        }
    }
}
