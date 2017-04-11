using System.Collections.Generic;
using SenseNet.ContentRepository;
using SenseNet.Portal.Virtualization;
using System.Web;

namespace SenseNet.ApplicationModel
{
    [Scenario("AddField")]
    public class AddFieldScenario : GenericScenario
    {
        protected override IEnumerable<ActionBase> CollectActions(Content context, string backUrl)
        {
            var actList = new List<ActionBase>();

            if (context == null)
                return actList;

            var app = ApplicationStorage.Instance.GetApplication("AddField", context, PortalContext.Current.DeviceName);

            actList.Add(GetAddFieldAction(app, context, backUrl, "ShortTextFieldSetting", 0, "ShortText", "addshorttextfield"));
            actList.Add(GetAddFieldAction(app, context, backUrl, "LongTextFieldSetting", 1, "LongText", "addlongtextfield"));
            actList.Add(GetAddFieldAction(app, context, backUrl, "ChoiceFieldSetting", 2, "Choice", "addchoicefield"));
            actList.Add(GetAddFieldAction(app, context, backUrl, "NumberFieldSetting", 3, "Number", "addnumberfield"));
            actList.Add(GetAddFieldAction(app, context, backUrl, "IntegerFieldSetting", 4, "Integer", "addnumberfield"));
            actList.Add(GetAddFieldAction(app, context, backUrl, "CurrencyFieldSetting", 5, "Currency", "addcurrencyfield"));
            actList.Add(GetAddFieldAction(app, context, backUrl, "DateTimeFieldSetting", 6, "DateTime", "adddatetimefield"));
            actList.Add(GetAddFieldAction(app, context, backUrl, "ReferenceFieldSetting", 7, "Reference", "addreferencefield"));
            actList.Add(GetAddFieldAction(app, context, backUrl, "YesNoFieldSetting", 8, "YesNo", "addyesnofield"));
            actList.Add(GetAddFieldAction(app, context, backUrl, "HyperLinkFieldSetting", 9, "HyperLink", "addhyperlinkfield"));

            return actList;
        }

        protected ActionBase GetAddFieldAction(Application app, Content content, string backUrl, string contentTypeName, int index, string textResource, string icon)
        {
            var action = app.CreateAction(content, backUrl, new { ContentTypeName = contentTypeName });
            
            action.Index = index;
            action.Text = HttpContext.GetGlobalResourceObject("ManageFields", textResource) as string;
            action.Icon = icon;

            return action;
        }

        public override IComparer<ActionBase> GetActionComparer()
        {
            return null;
        }
    }
}
