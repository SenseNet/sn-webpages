using System;
using System.Collections.Generic;
using System.Text;
using System.Web.UI;
using System.Web.UI.WebControls;
using SenseNet.ContentRepository.Storage;
using System.Web;

using SenseNet.ContentRepository;

namespace SenseNet.Portal.UI.Controls
{
	[ToolboxData("<{0}:Version ID=\"Version1\" runat=server></{0}:Version>")]
    public class Version : FieldControl, INamingContainer, ITemplateFieldControl
	{
		private string _text = string.Empty;

		// ------------------------------------------------------------------ Properties

		// ------------------------------------------------------------------ Constructor
		public Version()
		{
			ReadOnly = true;
		}
		// ------------------------------------------------------------------ Methods
		public override void SetData(object data)
		{
			_text = data == null ? null : data.ToString();
            #region template

            if (!IsTemplated)
                return;

            // synchronize data with controls are given in the template
            SetTitleAndDescription();

            #endregion
		}
		public override object GetData()
		{
			return _text;
		}
		// ------------------------------------------------------------------ Events
		protected override void OnInit(EventArgs e)
		{
			base.OnInit(e);
		}
		protected override void RenderContents(HtmlTextWriter writer)
		{
            #region template

            if (IsTemplated)
            {
                base.RenderContents(writer);
                return;
            }

            #endregion

			RenderSimple(writer);
		}
        public override object Data
        {
            get
            {
                return RepositoryTools.GetVersionString(Content.ContentHandler);
            }
        }
		private void RenderSimple(HtmlTextWriter writer)
		{
			writer.Write(RepositoryTools.GetVersionString(Content.ContentHandler));
		}

        #region ITemplateFieldControl members

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
    }
}