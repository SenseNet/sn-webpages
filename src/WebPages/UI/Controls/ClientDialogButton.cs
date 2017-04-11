using System;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace SenseNet.Portal.UI.Controls
{
    public abstract class ClientDialogButton : UserControl
    {
        // ======================================================================= Properties

        protected string _layoutControlPath;
        [PersistenceMode(PersistenceMode.Attribute)]
        public string LayoutControlPath
        {
            get { return _layoutControlPath; }
            set { _layoutControlPath = value; }
        }

        private TextBox _tbComments;
        protected TextBox CommentsTextBox
        {
            get
            {
                return _tbComments ?? (_tbComments = (this.LayoutControl == null
                                                                  ? null
                                                                  : this.LayoutControl.FindControlRecursive(
                                                                      "CommentsTextBox") as TextBox));
            }
        }

        private Control _layoutControl;
        protected Control LayoutControl
        {
            get
            {
                if (this._layoutControl == null && !string.IsNullOrEmpty(this.LayoutControlPath))
                    _layoutControl = this.Page.LoadControl(this.LayoutControlPath);

                return _layoutControl;
            }
        }

        // ======================================================================= Overrides

        protected override void CreateChildControls()
        {
            if (this.LayoutControl == null)
                return;

            this.Controls.Add(this.LayoutControl);

            AddClickEventRecursively(this.LayoutControl);
        }

        // ======================================================================= Event handlers

        protected virtual void OnButtonClick(object sender, EventArgs e)
        {
            // implement this in derived classes
        }

        // ======================================================================= Helper methods

        protected void AddClickEventRecursively(Control root)
        {
            if (root == null)
                return;

            // if this is a button: attach the click handler and finish the iteration
            var button = root as IButtonControl;
            if (button != null)
            {
                button.Click += OnButtonClick;
                return;
            }

            // iterate through all controls recursively
            foreach (Control c in root.Controls)
            {
                AddClickEventRecursively(c);
            }
        }

        public static string GetOpenDialogScript(string dialogSelector, string title)
        {
            return string.Format("javascript:$('{0}').dialog({{modal:true, resizable: false, open: function(type,data) {{ $(this).parent().appendTo(&quot;form&quot;); }}, title: '{1}' }});return false;", dialogSelector, title ?? string.Empty);
        }

        public static string GetCloseDialogScript(string dialogSelector)
        {
            return string.Format("javascript:$('{0}').dialog('close');return false;", dialogSelector);
        }
    }
}
