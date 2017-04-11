using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Schema;
using SenseNet.Portal.PortletFramework;
using SenseNet.Portal.UI.PortletFramework;
using System.Web.UI.WebControls;
using SenseNet.Portal.UI.ContentListViews;
using SenseNet.Portal.UI.ContentListViews.Handlers;
using SenseNet.ContentRepository.Fields;
using SenseNet.ContentRepository.Storage.Search;
using SenseNet.ContentRepository.Storage;
using SenseNet.ContentRepository.Storage.Security;
using SenseNet.Diagnostics;
using System.Web.UI;
using SenseNet.Search;

namespace SenseNet.Portal.Portlets
{
    public class FieldDeletePortlet : ContextBoundPortlet, IContentProvider
    {
        private FieldSettingContent FieldSettingNode { get; set; }

        public FieldDeletePortlet()
        {
            this.Name = "$FieldDeletePortlet:PortletDisplayName";
            this.Description = "$FieldDeletePortlet:PortletDescription";
            this.Category = new PortletCategory(PortletCategoryType.System);
        }

        private Button _deleteButton;
        private Button DeleteButton
        {
            get
            {
                if (_deleteButton == null && this.Controls.Count > 0)
                {
                    _deleteButton = this.Controls[0].FindControl("btnDelete") as Button;

                    if (_deleteButton != null)
                        _deleteButton.Click += DeleteButton_Click;
                }

                return _deleteButton;
            }
        }

        private Button _cancelButton;
        private Button CancelButton
        {
            get
            {
                if (_cancelButton == null && this.Controls.Count > 0)
                {
                    _cancelButton = this.Controls[0].FindControl("btnCancel") as Button;

                    if (_cancelButton != null)
                        _cancelButton.Click += CancelButton_Click;
                }

                return _cancelButton;
            }
        }

        private Label _labelFieldName;
        private Label LabelFieldName
        {
            get
            {
                if (_labelFieldName == null && this.Controls.Count > 0)
                {
                    _labelFieldName = this.Controls[0].FindControl("lblFieldName") as Label;
                }

                return _labelFieldName;
            }
        }
        
        private string FieldName
        {
            get
            {
                var fn = HttpContext.Current.Request.Params["FieldName"];

                if (!string.IsNullOrEmpty(fn) && !fn.StartsWith("#"))
                    fn = string.Concat("#", fn);

                return fn;
            }
        }

        #region IContentProvider Members

        string IContentProvider.ContentTypeName
        {
            get; set;
        }

        string IContentProvider.ContentName
        {
            get
            {
                var ctn = FieldName;
                
                return string.IsNullOrEmpty(ctn) ? null : ctn;
            } 
            set { }
        }

        #endregion

        protected override void CreateChildControls()
        {
            if (Cacheable && CanCache && IsInCache)
                return;

            Controls.Clear();

            var contentList = GetContextNode() as ContentList;
            if (contentList == null)
                return;

            var fieldName = FieldName;
            if (string.IsNullOrEmpty(fieldName))
                return;

            foreach (FieldSettingContent fieldSetting in contentList.FieldSettingContents)
            {
                if (string.CompareOrdinal(fieldSetting.FieldSetting.Name, fieldName) != 0)
                    continue;

                FieldSettingNode = fieldSetting;
                break;
            }

            if (FieldSettingNode == null)
                return;

            if (this.Controls.Count == 0)
            {
                var c = Page.LoadControl("/Root/System/SystemPlugins/ListView/DeleteField.ascx");
                if (c != null)
                {
                    this.Controls.Add(c);

                    if (LabelFieldName != null)
                        LabelFieldName.Text = HttpUtility.HtmlEncode(FieldSettingNode.FieldSetting.DisplayName);

                    // init: add event handlers...
                    var db = this.DeleteButton;
                    var cb = this.CancelButton;
                }
            }

            ChildControlsCreated = true;
        }

        private void DeleteButton_Click(object sender, EventArgs e)
        {
            try
            {
                // the content handler takes care of removing the column from views and clearing field values
                this.FieldSettingNode.Delete();
                CallDone(false);
            }
            catch (Exception ex)
            {
                SnLog.WriteException(ex);
                this.Controls.Add(new LiteralControl(ex.ToString()));
            }
        }

        private void CancelButton_Click(object sender, EventArgs e)
        {
            CallDone(false);
        }
    }
}
