using System;
using System.Globalization;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using SenseNet.ContentRepository.Fields;
using SenseNet.ContentRepository.Security;
using SenseNet.ContentRepository.Storage;
using SenseNet.Portal.Virtualization;
using Newtonsoft.Json;
using Content = SenseNet.ContentRepository.Content;

namespace SenseNet.Portal.UI.Controls
{
    [ToolboxData("<{0}:Number ID=\"Number1\" runat=server></{0}:Number>")]
    public class Number : FieldControl, INamingContainer, ITemplateFieldControl
    {
        // Properties ///////////////////////////////////////////////////////////////////
        protected string PercentageControlID = "LabelForPercentage";
        protected string NumberFormatControlID = "NumberFormat";
        private readonly TextBox _inputTextBox;
        // Constructor //////////////////////////////////////////////////////////////////
        public Number() { _inputTextBox = new TextBox { ID = InnerControlID }; }
        // Methods //////////////////////////////////////////////////////////////////////
        public override object GetData()
        {
            var stringValue = _inputTextBox.Text;

            if (IsTemplated)
            {
                var innerControl = GetInnerControl() as TextBox;
                if (innerControl != null)
                    stringValue = innerControl.Text;
            }

            if (string.IsNullOrEmpty(stringValue))
                return null;

            decimal decimalValue = Convert.ToDecimal(stringValue);

            var setting = (NumberFieldSetting)this.Field.FieldSetting;
            if (setting.ShowAsPercentage.HasValue && setting.ShowAsPercentage.Value)
            {
                decimalValue /= 100;
            }

            return decimalValue;
        }
        public override void SetData(object data)
        {
            var templated = this.IsTemplated;

            Label title = null;
            Label desc = null;
            TextBox innerControl = null;
            var setting = this.Field == null ? null : (NumberFieldSetting)this.Field.FieldSetting;
            var digits = Math.Min(setting == null || !setting.Digits.HasValue ? 2 : setting.Digits.Value, 29);
            var format = "F" + digits;

            if (templated)
            {
                title = GetLabelForTitleControl() as Label;
                desc = GetLabelForDescription() as Label;
                innerControl = GetInnerControl() as TextBox;

                if (this.Field != null)
                {
                    if (title != null)
                        title.Text = HttpUtility.HtmlEncode(this.Field.DisplayName);
                    if (desc != null)
                        desc.Text = Sanitizer.Sanitize(this.Field.Description);
                }

                if (desc != null)
                {
                    var text = SR.GetString(SR.FieldControls.Number_ValidFormatIs);
                    var formatDesc = text + ((decimal)1234.56).ToString(format);
                    var descText = desc.Text;
                    if (string.IsNullOrEmpty(descText) || descText.EndsWith("."))
                        desc.Text = string.Concat(descText, " ", formatDesc).Trim(' ');
                    else
                        desc.Text = string.Concat(descText, ". ", formatDesc).Trim(' ');
                }
            }

            if (data == null)
            {
                _inputTextBox.Text = string.Empty;

                if (innerControl != null)
                    innerControl.Text = string.Empty;

                return;
            }

            decimal decimalData;
            var stringData = data as string;
            if (stringData != null)
            {
                if (stringData == string.Empty)
                    decimalData = ActiveSchema.DecimalMinValue;
                else if (!Decimal.TryParse(stringData, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.GetCultureInfo("en-us"), out decimalData))
                    throw new ApplicationException(String.Concat(
                        "Default decimal value is not in a correct format. ContentType: ", this.Field.Content.ContentType.Name,
                        " Field Name: ", this.FieldName));
            }
            else
            {
                decimalData = (decimal)data;

                if (setting.ShowAsPercentage.HasValue && setting.ShowAsPercentage.Value)
                {
                    decimalData *= 100;
                }
            }

            _inputTextBox.Text = decimalData <= ActiveSchema.DecimalMinValue ? string.Empty : decimalData.ToString(format);

            if (!templated)
                return;

            if (innerControl != null)
                innerControl.Text = decimalData <= ActiveSchema.DecimalMinValue
                    ? string.Empty
                    : decimalData.ToString(format);


            var perc = GetLabelForPercentageControl();

            if (perc != null)
            {
                if (!SkinManager.IsNewSkin())
                {
                    perc.Text = GetPercentageSign();
                    perc.Visible = !string.IsNullOrEmpty(perc.Text);
                }
                else
                {
                    var percentageSign = GetPercentageSign();
                    perc.CssClass = "percentage";
                    perc.Attributes.Add("data-percentage", (!string.IsNullOrEmpty(percentageSign)).ToString());
                }
            }

            if (innerControl != null)
            {
                if (setting.MinValue.HasValue)
                    innerControl.Attributes.Add("data-min", setting.MinValue.Value.ToString());

                if (setting.MaxValue.HasValue)
                    innerControl.Attributes.Add("data-max", setting.MaxValue.Value.ToString());

                if (setting.Step.HasValue)
                    innerControl.Attributes.Add("data-step", setting.Step.Value.ToString());

                innerControl.Attributes.Add("data-digits", digits.ToString());
            }

            var formats = GetNumberFormatControl();
            if (formats != null)
                formats.Text = NumberFormatSerializer.GetJson(GetNumberFormatInfo());
        }

        protected override void OnInit(EventArgs e)
        {
            base.OnInit(e);

            if (IsTemplated)
                return;

            _inputTextBox.CssClass = String.IsNullOrEmpty(this.CssClass) ? "sn-ctrl sn-ctrl-number" : CssClass;
            Controls.Add(_inputTextBox);
        }
        protected override void RenderContents(HtmlTextWriter writer)
        {
            #region template
            if (IsTemplated)
            {
                if (!UseBrowseTemplate)
                    ManipulateTemplateControls();

                base.RenderContents(writer);
                return;
            }

            #endregion

            if (ControlMode == FieldControlControlMode.Browse)
                RenderSimple(writer);
            else
                RenderEditor(writer);
        }

        protected virtual NumberFormatInfo GetNumberFormatInfo()
        {
            return CultureInfo.CurrentUICulture.NumberFormat;
        }

        // Internals ////////////////////////////////////////////////////////////////////
        private void ManipulateTemplateControls()
        {
            var ic = GetInnerControl() as TextBox;
            if (ic == null)
                return;

            if (Field.ReadOnly)
                ic.Enabled = false;
            else if (ReadOnly)
            {
                ic.Enabled = !ReadOnly;
                ic.EnableViewState = false;
            }

            if (ControlMode != FieldControlControlMode.Edit)
                return;

            ic.Attributes.Add("Title", String.Concat(Field.DisplayName, " ", Field.Description));
        }
        protected virtual void RenderSimple(HtmlTextWriter writer)
        {
            writer.Write(_inputTextBox.Text);
            RenderPercentage(writer);
        }
        protected virtual void RenderEditor(HtmlTextWriter writer)
        {
            if (this.ControlMode == FieldControlControlMode.Edit)
            {
                var titleText = String.Concat(this.Field.DisplayName, " ", this.Field.Description);
                _inputTextBox.Attributes.Add("Title", titleText);
            }
            if (Field.ReadOnly)
                writer.Write(_inputTextBox.Text);
            else if (ReadOnly)
            {
                _inputTextBox.Enabled = !this.ReadOnly;
                _inputTextBox.EnableViewState = false;
                _inputTextBox.RenderControl(writer);
            }
            else
                _inputTextBox.RenderControl(writer);

            RenderPercentage(writer);
        }

        #region ITemplateFieldControl Members

        public Control GetInnerControl() { return this.FindControlRecursive(InnerControlID); }
        public Control GetLabelForDescription() { return this.FindControlRecursive(DescriptionControlID); }
        public Control GetLabelForTitleControl() { return this.FindControlRecursive(TitleControlID); }

        #endregion

        public Label GetLabelForPercentageControl()
        {
            return this.FindControlRecursive(PercentageControlID) as Label;
        }

        public TextBox GetNumberFormatControl()
        {
            return this.FindControlRecursive(NumberFormatControlID) as TextBox;
        }

        private void RenderPercentage(HtmlTextWriter writer)
        {
            writer.Write(GetPercentageSign());
        }

        private string GetPercentageSign()
        {
            var fs = this.Field.FieldSetting as NumberFieldSetting;

            if (fs == null)
                return string.Empty;

            if (fs.ShowAsPercentage.HasValue && fs.ShowAsPercentage.Value)
                return "%";

            return string.Empty;
        }
    }
}