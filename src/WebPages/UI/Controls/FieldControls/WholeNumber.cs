using System;
using System.Collections.Generic;
using System.Text;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using SenseNet.ContentRepository.Storage;
using SenseNet.ContentRepository.Fields;
using Content = SenseNet.ContentRepository.Content;

namespace SenseNet.Portal.UI.Controls
{
	[ToolboxData("<{0}:WholeNumber ID=\"WholeNumber1\" runat=server></{0}:WholeNumber>")]
	public class WholeNumber : FieldControl, INamingContainer, ITemplateFieldControl
	{
        protected string PercentageControlID = "LabelForPercentage";
        protected string NumberFormatControlID = "NumberFormat";

        // Fields ///////////////////////////////////////////////////////////////////////
        private TextBox _inputTextBox;

        // Constructor //////////////////////////////////////////////////////////////////
		public WholeNumber()
		{
            InnerControlID = "InnerWholeNumber";
			_inputTextBox = new TextBox { ID = InnerControlID };
		}

        // Methods //////////////////////////////////////////////////////////////////////
        public override void SetData(object data)
        {
            var setting = this.Field == null ? null : (IntegerFieldSetting)this.Field.FieldSetting;

            if (data == null)
            {
                _inputTextBox.Text = string.Empty;
            }
            else
            {
                _inputTextBox.Text = Convert.ToInt32(data) == int.MinValue ? string.Empty : data.ToString();
            }

            #region template

            if (!IsTemplated)
                return;

            SetTitleAndDescription();

            var innerControl = GetInnerControl() as TextBox;
            var perc = GetLabelForPercentageControl();
            
            if (innerControl != null)
                innerControl.Text = Convert.ToString(_inputTextBox.Text);
            if (perc != null)
            {
                if (!SkinManager.IsNewSkin())
                {
                    perc.Text = GetPercentageSign();
                    perc.Visible = !string.IsNullOrEmpty(perc.Text);
                }
                else
                {
                    perc.CssClass = "percentage";
                    perc.Attributes.Add("data-percentage", (!string.IsNullOrEmpty(GetPercentageSign())).ToString());
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
            }

            var formats = GetNumberFormatControl();
            if (formats != null)
                formats.Text = NumberFormatSerializer.GetJson();

            #endregion
        }
        public override object GetData()
		{
            var innerControl = GetInnerControl() as TextBox;

            if (!IsTemplated || innerControl == null)
            {
                #region original

                if (_inputTextBox.Text.Length == 0)
                    return null;

                return Convert.ToInt32(_inputTextBox.Text);

                #endregion
            }

            if (innerControl.Text.Length == 0) 
                return null;
            
            return Convert.ToInt32(innerControl.Text);
		}

		protected override void OnInit(EventArgs e)
		{

            base.OnInit(e);

		    #region template

		    if (IsTemplated)
		        return;

		    #endregion

		    #region original flow

		    _inputTextBox.CssClass = String.IsNullOrEmpty(this.CssClass) ? "sn-ctrl sn-ctrl-number" : this.CssClass;
		    Controls.Add(_inputTextBox);

		    #endregion

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

			if (this.ControlMode == FieldControlControlMode.Browse)
				RenderSimple(writer);
			else
				RenderEditor(writer);
		}
		private void RenderSimple(HtmlTextWriter writer)
		{
			writer.Write(_inputTextBox.Text);

            RenderPercentage(writer);
		}
		private void RenderEditor(HtmlTextWriter writer)
		{
			if (this.ControlMode == FieldControlControlMode.Edit)
            {
                var titleText = String.Concat(this.Field.DisplayName, " ", this.Field.Description);
                _inputTextBox.Attributes.Add("Title", titleText);
            }
			if (this.Field.ReadOnly)
			{
				writer.Write(_inputTextBox.Text);
			}
			else if (this.ReadOnly)
			{
				_inputTextBox.Enabled = !this.ReadOnly;
				_inputTextBox.EnableViewState = false;
				_inputTextBox.RenderControl(writer);
			}
			else
			{
				// render read/write control
				_inputTextBox.RenderControl(writer);
			}

		    RenderPercentage(writer);
		}

        private void ManipulateTemplateControls()
        {
            //  This method is needed to ensure the common fieldcontrol logic.
            var innerWholeNumber = GetInnerControl() as TextBox;
            var lt = GetLabelForTitleControl() as Label;
            var ld = GetLabelForDescription() as Label;

            if (innerWholeNumber == null) return;

            if (Field.ReadOnly)
            {
                var p = innerWholeNumber.Parent;
                if (p != null)
                {
                    p.Controls.Remove(innerWholeNumber);
                    if (lt != null) lt.AssociatedControlID = string.Empty;
                    if (ld != null) ld.AssociatedControlID = string.Empty;
                    p.Controls.Add(new LiteralControl(innerWholeNumber.Text));
                }
            }
            else if (ReadOnly)
            {
                innerWholeNumber.Enabled = !ReadOnly;
                innerWholeNumber.EnableViewState = false;
            }

            if (ControlMode != FieldControlControlMode.Edit)
                return;

            innerWholeNumber.Attributes.Add("Title", String.Concat(Field.DisplayName, " ", Field.Description));
   
        }

        private void RenderPercentage(HtmlTextWriter writer)
        {
            writer.Write(GetPercentageSign());
        }

        private string GetPercentageSign()
        {
            var fs = this.Field.FieldSetting as IntegerFieldSetting;

            if (fs == null)
                return string.Empty;

            if (fs.ShowAsPercentage.HasValue && fs.ShowAsPercentage.Value)
                return "%";

            return string.Empty;
        }

        #region ITemplateFieldControl Members

        public Control GetInnerControl()
        {
            return this.FindControlRecursive(InnerControlID) as TextBox;
        }

        public Control GetLabelForDescription()
        {
            return this.FindControlRecursive(DescriptionControlID) as Label;
        }

        public Control GetLabelForTitleControl()
        {
            return this.FindControlRecursive(TitleControlID) as Label;
        }

        #endregion

        public override object Data
        {
            get
            {
                return _inputTextBox.Text;
            }
        }

        public Label GetLabelForPercentageControl()
        {
            return this.FindControlRecursive(PercentageControlID) as Label;
        }

        public TextBox GetNumberFormatControl()
        {
            return this.FindControlRecursive(NumberFormatControlID) as TextBox;
        }
    }
}