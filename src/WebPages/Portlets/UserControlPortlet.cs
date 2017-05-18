using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using SenseNet.ContentRepository.Storage;
using SenseNet.ContentRepository.Storage.Schema;
using SenseNet.ContentRepository.Storage.Security;
using SenseNet.Diagnostics;
using SenseNet.Portal.UI.PortletFramework;
using System.Web.UI.WebControls.WebParts;
using System.Web.UI;

namespace SenseNet.Portal.Portlets
{
    public class UserControlPortlet : PortletBase
    {
        private const string UserControlPortletClass = "UserControlPortlet";

        public UserControlPortlet()
        {
            this.Name = "$UserControlPortlet:PortletDisplayName";
            this.Description = "$UserControlPortlet:PortletDescription";
            this.Category = new PortletCategory(PortletCategoryType.Application);

            this.HiddenProperties.Add("Renderer");
        }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(UserControlPortletClass, "Prop_ControlPath_DisplayName")]
        [LocalizedWebDescription(UserControlPortletClass, "Prop_ControlPath_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(100)]
        [Editor(typeof(ContentPickerEditorPartField), typeof(IEditorPartField))]
        [ContentPickerEditorPartOptions(ContentPickerCommonType.Ascx)]
        public string ControlPath { get; set; }


        protected override void CreateChildControls()
        {
            if (RenderingMode == RenderMode.Native)
            {
                Controls.Clear();

                try
                {
                    var c = CreateViewControl(ControlPath);

                    c.ID = this.ClientID + "_userControlPortlet";
                    Controls.Add(c);
                }
                catch (Exception ex)
                {
                    SnLog.WriteException(ex);

                    this.Controls.Add(new LiteralControl(ex.Message));
                }
            }
            ChildControlsCreated = true;
        }

        private Control CreateViewControl(string path)
        {
            if (!string.IsNullOrEmpty(path))
            {
                // only display the view if the user has permissions for it
                var viewHead = NodeHead.Get(path);
                if (viewHead != null && SecurityHandler.HasPermission(viewHead, PermissionType.RunApplication))
                    return Page.LoadControl(path);
            }

            return new Control();
        }
    }
}
