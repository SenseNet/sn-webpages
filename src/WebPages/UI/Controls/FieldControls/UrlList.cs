using System;
using System.Collections.Generic;
using System.Web.UI;
using System.Web.UI.WebControls;
using SenseNet.Diagnostics;

namespace SenseNet.Portal.UI.Controls
{
	[ToolboxData("<{0}:UrlList ID=\"UrlList1\" runat=server></{0}:UrlList>")]
    public class UrlList : FieldControl
    {
        private TextBox _inputTextBox;

        protected override void OnInit(EventArgs e)
        {
            base.OnInit(e);

            if (IsTemplated)
                return;

            _inputTextBox = new TextBox
            {
                ID = INNERDATAID,
                TextMode = TextBoxMode.MultiLine
            };

            Controls.Add(_inputTextBox);
        }

        public override object GetData()
        {
            string urlText = null;

            if (IsTemplated)
            {
                var innerControl = GetInnerControl();
                if (innerControl != null)
                    urlText = innerControl.Text;
            }
            else
            {
                if (_inputTextBox != null)
                    urlText = _inputTextBox.Text;
            }

            if (string.IsNullOrEmpty(urlText)) 
                return null;

            try
            {
                return Portal.Site.ParseUrlList(urlText);
            }
            catch (Exception ex)
            {
                // Set the original value, because the control cannot display an incorrectly formatted JSON,
                // and that would force the user to leave the whole page and loose all data entered into 
                // other field controls. This way only the incorrectly formatted URL data is lost.
                this.SetData(this.Field.GetData());

                throw new FieldControlDataException(this, "InvalidFormat", "Invalid URL format.", new Exception("Invalid URL data: " + urlText, ex));
            }
        }

        public override void SetData(object data)
        {
            var urlDict = data as IDictionary<string, string>;
            if (urlDict == null)
                return;

            var urlText = Portal.Site.UrlListToJson(urlDict);

            if (IsTemplated)
            {
                var innerControl = GetInnerControl();
                if (innerControl != null)
                    innerControl.Text = urlText;
            }
            else
            {
                if (_inputTextBox != null)
                    _inputTextBox.Text = urlText;
            }
        }

        private const string INNERDATAID = "InnerData";
        private TextBox GetInnerControl()
        {
            return this.FindControlRecursive(INNERDATAID) as TextBox;
        }
    }
}