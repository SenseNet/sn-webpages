using System;
using System.ComponentModel;
using System.Web.UI;

namespace SenseNet.Portal.UI.Controls
{
    [DefaultProperty("Path")]
    [ToolboxData("<{0}:ScriptRequest runat=server></{0}:ScriptRequest>")]
    public class ScriptRequest : Control
    {
        [Bindable(true)]
        [DefaultValue("")]
        public string Path
        {
            get
            {
                return (string)ViewState["Path"] ?? string.Empty;
            }

            set
            {
                ViewState["Path"] = value;
            }
        }

        public string TemplateCategory { get; set; }

        protected override void OnLoad(EventArgs e)
        {
            if (!string.IsNullOrEmpty(Path))
                UITools.AddScript(Path, this);
            else if (!string.IsNullOrEmpty(TemplateCategory))
                UITools.AddTemplateScript(TemplateCategory, this);

            base.OnLoad(e);
        }

        protected override void Render(HtmlTextWriter writer)
        {
            return;
        }
    }
}
