using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.UI;
using System.Web.UI.WebControls;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Fields;
using SenseNet.ContentRepository.i18n;

namespace SenseNet.Portal.UI.Controls
{
    [ToolboxData("<{0}:VersioningModeChoice ID=\"VersioningModeChoice1\" runat=server></{0}:VersioningModeChoice>")]
    public class VersioningModeChoice : RadioButtonGroup
    {
        private readonly string InheritedValueLabelID = "InheritedValueLabel";
        private readonly string InheritedValuePlaceholderID = "plcInheritedInfo";
        private readonly Label _inheritedValueLabel;

        public VersioningModeChoice()
        {
            _inheritedValueLabel = new Label { ID = InheritedValueLabelID };
        }

        protected override void OnInit(EventArgs e)
        {
            base.OnInit(e);

            if (IsTemplated)
                return;

            Controls.Add(_inheritedValueLabel);
        }

        public override void SetData(object data)
        {
            base.SetData(data);

            var inheritedText = GetInheritedLabelText(true);

            // extend the Inherited option text with the actual inherited value

            var listControl = ListControl;
            if (!string.IsNullOrEmpty(inheritedText))
            {
                if (listControl != null)
                {
                    listControl.Items[0].Text = string.Format("{0} <i>({1})</i>", listControl.Items[0].Text, inheritedText);
                }
            }
            if (listControl != null)
            {
                for (var i = 1; i < listControl.Items.Count; i++)
                {
                    var labelText = GetLabelText(listControl.Items[i].Text, listControl.Items[i].Value);
                    listControl.Items[i].Text = string.Format("{0}", labelText);
                }
            }
            if (IsTemplated)
            {
                var inheritedLabel = GetInheritedValueLabel();
                if (inheritedLabel == null)
                    return;

                inheritedLabel.Text = inheritedText;
                if (!string.IsNullOrEmpty(inheritedLabel.Text))
                {
                    var inheritedPlc = GetInheritedValuePlaceholder();
                    if (inheritedPlc != null)
                        inheritedPlc.Visible = true;
                }
            }
            else
            {
                _inheritedValueLabel.Text = GetInheritedLabelText(false);
            }
        }
        protected override void RenderContents(HtmlTextWriter writer)
        {
            base.RenderContents(writer);

            if (IsTemplated)
                return;

            writer.Write("<br />");
            _inheritedValueLabel.RenderControl(writer);
        }

        protected override void FillBrowseControls()
        {
            base.FillBrowseControls();

            var ic = GetBrowseControl() as Label;
            if (ic == null)
                return;

            var data = this.GetData() as List<string>;
            if (data == null)
                return;

            if (data.Count == 1 && data[0] == "0")
            {
                var gc = this.Content == null ? null : this.Content.ContentHandler as GenericContent;
                var parentValue = gc == null ? string.Empty : gc.InheritableVersioningMode.ToString("g");

                ic.Text += ": " + parentValue;
            }
        }


        private string GetLabelText(string text, string value)
        {
            var listControl = ListControl;
            if (listControl == null || listControl.SelectedIndex > 0 || listControl.Items.Count == 0 || !listControl.Items[0].Selected)
                return string.Empty;

            if (value == "2" || value == "3")
            {
                text += SenseNetResourceManager.Current.GetString("Ctd-GenericContent", "InheritableVersioningMode-" + value + "-Example");
            }

            return text;
        }


        private string GetInheritedLabelText(bool onlyValue)
        {
            var listControl = ListControl;
            if (listControl == null || listControl.SelectedIndex > 0 || listControl.Items.Count == 0 || !listControl.Items[0].Selected)
                return string.Empty;

            var parentValue = GetInheritedValue();
            if (string.IsNullOrEmpty(parentValue))
                return string.Empty;

            // get the localized value of the setting
            parentValue = ((ChoiceFieldSetting)this.Field.FieldSetting).Options.First(co => co.Value == parentValue).Text;

            return onlyValue ? parentValue : SenseNetResourceManager.Current.GetString("Ctd-GenericContent", "VersioningApprovingControls-Value") + ": " + parentValue;
        }

        public Label GetInheritedValueLabel()
        {
            return this.FindControlRecursive(InheritedValueLabelID) as Label;
        }

        public PlaceHolder GetInheritedValuePlaceholder()
        {
            return this.FindControlRecursive(InheritedValuePlaceholderID) as PlaceHolder;
        }

        private string GetInheritedValue()
        {
            var gc = this.Content == null ? null : this.Content.ContentHandler as GenericContent;
            return gc == null ? string.Empty : ((int)gc.InheritableVersioningMode).ToString();
        }
    }
}
