using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace SenseNet.Portal.UI.Controls
{
    [ToolboxData("<{0}:QueryBuilder ID=\"QueryBuilder1\" runat=server></{0}:QueryBuilder>")]
    public class QueryBuilder : LongText
    {
        public bool ShowSaveButton { get; set; }
        public bool ShowSaveAsButton { get; set; }
        public bool ShowClearButton { get; set; }
        public bool ShowExecuteButton { get; set; }

        protected override void OnInit(EventArgs e)
        {
            UITools.AddScript(UITools.ClientScriptConfigurations.SNQueryBuilderJSPath);

            if (SkinManager.IsNewSkin())
                UITools.AddStyleSheetToHeader(UITools.GetHeader(), UITools.ClientScriptConfigurations.SNQueryBuilderNewCSSPath);
            else
                UITools.AddStyleSheetToHeader(UITools.GetHeader(), UITools.ClientScriptConfigurations.SNQueryBuilderCSSPath);

            base.OnInit(e);
        }

        protected override void OnPreRender(EventArgs e)
        {
            base.OnPreRender(e);

            var innerTextBox = GetInnerControl() as TextBox;
            if (innerTextBox == null)
                return;

            var fnClass = string.Concat("sn-field-", this.FieldName.ToLower());
            innerTextBox.CssClass += string.Concat(" ", fnClass);

            var contentPath = "";
            var contentName = "";
            if (this.Content.IsNew)
            {
                var parent = this.Content.ContentHandler.Parent;
                contentPath = parent.ParentPath;
                contentName = parent.Name;
            }
            else
            {
                contentPath = this.Content.ContentHandler.ParentPath;
                contentName = this.Content.Name;
            }

            var content = contentPath + "('" + contentName + "')";

            var script = string.Concat(@"$('.sn-ctrl-querybuilder." + fnClass + @"').queryBuilder({
                showQueryEditor: true,
                showQueryBuilder: true,
                commandButtons: {  
                    saveButton: " + ShowSaveButton.ToString().ToLower() + @",
                    saveasButton: " + ShowSaveAsButton.ToString().ToLower() + @",
                    clearButton: " + ShowClearButton.ToString().ToLower() + @",
                    executeButton: " + ShowExecuteButton.ToString().ToLower() + @"
                },
                content: """ + content + "\"            });");

            UITools.RegisterStartupScript("querybuilder_" + innerTextBox.ClientID, script, Page);
        }
    }
}
