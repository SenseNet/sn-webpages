using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web.UI.WebControls;
using System.Web.UI;
using System.Text.RegularExpressions;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Storage;
using SenseNet.ContentRepository.i18n;
using System.Globalization;
using System.Web.Script.Serialization;
using Newtonsoft.Json;
using SenseNet.Configuration;
using SenseNet.Portal.Resources;

namespace SenseNet.Portal.UI.Controls
{
    [ToolboxData("<{0}:DisplayName ID=\"DisplayName1\" runat=server></{0}:DisplayName>")]
    public class DisplayName : ShortText
    {
        /* ================================================================================================ Members */
        // presence of name control is determined clientside, since commenting out a name fieldcontrol in a contenview leads to false functionality
        private string NameAvailableControlID = "NameAvailableControl";
        private string _innerData;


        /* ================================================================================================ Properties */
        // when set to "true" from a contentview, the control will always update the name control, even if it is a new content
        [PersistenceMode(PersistenceMode.Attribute)]
        public bool AlwaysUpdateName { get; set; }


        /* ================================================================================================ Constructor */
        public DisplayName()
        {
        }


        /* ================================================================================================ Methods */
        protected override void OnInit(EventArgs e)
        {
            UITools.AddScript("$skin/scripts/sn/SN.ContentName.js");
            UITools.InitEditorScript(this.Page);

            base.OnInit(e);

            if (this.ControlMode == FieldControlControlMode.Browse)
                return;

            // init javascripts
            var innerControl = GetInnerControl() as TextBox;
            var nameAvailableControl = GetNameAvailableControl();

            // autofill enabled for new contents only.
            var originalName = this.Content.Name;
            if (this.Content.Id == 0 || AlwaysUpdateName)
                innerControl.Attributes.Add("onkeyup",
                                            string.Format("SN.ContentName.TextEnter('{0}', '{1}')", innerControl.ClientID, originalName));

            // this scripts sets state of nameAvailableControl, to indicate if name is visible in dom
            //TODO: Remove '_' parameter after the javascript method refactor.
            var initScript = string.Format("SN.ContentName.InitNameControl('{0}','{1}', '{2}');", nameAvailableControl.ClientID, ContentNaming.InvalidNameCharsPatternForClient, '_');
            UITools.RegisterStartupScript("InitNameControl", initScript, this.Page);
        }

        public override object GetData()
        {
            if (this.ControlMode == FieldControlControlMode.Browse || this.ReadOnly)
                return _innerData;

            var nameAvailableControl = GetNameAvailableControl();

            // name control is available
            var nameControlAvailable = false;
            if (nameAvailableControl != null)
            {
                if (nameAvailableControl.Text != "0")
                    nameControlAvailable = true;
            }

            var displayName = string.Empty;
            var innerControl = GetInnerControl() as TextBox;
            displayName = innerControl.Text;

            string className;
            string name;
            if (SenseNetResourceManager.ParseResourceKey(displayName, out className, out name))
            {
                // get resources
                var allresStr = GetResourcesBoxControl().Text;

                // if resources JSON is empty, we just entered a resource key into displayname control, but it does not yet come from the resource editor
                if (!string.IsNullOrEmpty(allresStr))
                {
                    var ser = new JavaScriptSerializer();
                    var allres = ser.Deserialize<ResourceEditorApi.ResourceKeyData>(allresStr);

                    // value comes from the resource editor ui
                    displayName = allres.Name;

                    // if the entered value is a resource key, then update corresponding resources
                    if (SenseNetResourceManager.ParseResourceKey(displayName, out className, out name))
                    {
                        ResourceEditorApi.SaveResource(className, name, allres.Datas);
                    }
                }
            }

            if (!nameControlAvailable && (this.Content.Id == 0 || AlwaysUpdateName))
            {
                // content name should be set automatically generated from displayname
                var newName = ContentNamingProvider.GetNameFromDisplayName(this.Content.Name, displayName);
                if (newName.Length > 0)
                    this.Content["Name"] = newName;
            }

            return displayName;
        }
        public override void SetData(object data)
        {
            var displayName = data as string;
            _innerData = displayName;
            string className;
            string name;
            if (SenseNetResourceManager.ParseResourceKey(displayName, out className, out name))
            {
                var rescontrol = GetResourceEditorLinkControl();
                if (rescontrol != null)
                {
                    // write resourcesJSON to hidden textbox
                    var resourcesData = new ResourceEditorApi.ResourceKeyData
                    {
                        Datas = ResourceEditorApi.GetResources(className, name).Select(p => new ResourceEditorApi.ResourceData { Lang = p.Key, Value = p.Value }).ToList(),
                        Name = displayName
                    };
                    var resourcesJSON = new JavaScriptSerializer().Serialize(resourcesData);
                    GetResourcesBoxControl().Text = resourcesJSON;

                    // send optionsJSON to client when clicked
                    string currentlang = CultureInfo.CurrentUICulture.Name;
                    string currentlangp = CultureInfo.CurrentUICulture.Parent == null ? string.Empty : CultureInfo.CurrentUICulture.Parent.Name;
                    string dialogtitle = SenseNetResourceManager.Current.GetString("Controls", "FieldControl-EditValue-Title");
                    var title = string.Format(dialogtitle, this.Field.DisplayName);

                    var optionsJSon = "{'link':$(this), 'currentlang':'" + currentlang + "','currentlangp':'" + currentlangp + "','title':'" + title + "'}";

                    rescontrol.OnClientClick = "SN.ResourceEditor.editResource('" + className + "','" + name + "'," + optionsJSon + "); return false;";
                    rescontrol.Text = SenseNetResourceManager.Current.GetString(className, name);
                }
                var innerControl = GetInnerControl() as TextBox;
                innerControl.Style.Add("display", "none");
            }
            else
            {
                var resourceDiv = GetResourceDivControl();
                if (resourceDiv != null)
                {
                    resourceDiv.Visible = false;
                }
            }

            base.SetData(data);
        }
        public TextBox GetNameAvailableControl()
        {
            return this.FindControlRecursive(NameAvailableControlID) as TextBox;
        }
        public System.Web.UI.WebControls.LinkButton GetResourceEditorLinkControl()
        {
            return this.FindControlRecursive("ResourceEditorLink") as System.Web.UI.WebControls.LinkButton;
        }
        public TextBox GetResourcesBoxControl()
        {
            return this.FindControlRecursive("Resources") as TextBox;
        }
        public PlaceHolder GetResourceDivControl()
        {
            return this.FindControlRecursive("ResourceDiv") as PlaceHolder;
        }
    }
}
