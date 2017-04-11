﻿using System;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using SenseNet.ContentRepository;
using SenseNet.Diagnostics;
using SenseNet.Portal.UI.Controls;
using SenseNet.Portal.UI.PortletFramework;
using System.ComponentModel;
using System.Web;

namespace SenseNet.Portal.Portlets
{
    public class ContentApprovalPortlet : ContextBoundPortlet
    {
        private const string ContentApprovalPortletClass = "ContentApprovalPortlet";

        public ContentApprovalPortlet()
        {
            this.Name = "$ContentApprovalPortlet:PortletDisplayName";
            this.Description = "$ContentApprovalPortlet:PortletDescription";
            this.Category = new PortletCategory(PortletCategoryType.ContentOperation);
        }

        // ================================================================ Properties

        private string _viewPath = "/Root/System/SystemPlugins/Portlets/ContentApproval/Approval.ascx";
        private bool _needValidation = false;

        [LocalizedWebDisplayName(PORTLETFRAMEWORK_CLASSNAME, RENDERER_DISPLAYNAME)]
        [LocalizedWebDescription(PORTLETFRAMEWORK_CLASSNAME, RENDERER_DESCRIPTION)]
        [WebBrowsable(true), Personalizable(true)]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(100)]
        [Editor(typeof(ViewPickerEditorPartField), typeof(IEditorPartField))]
        [ContentPickerEditorPartOptions(ContentPickerCommonType.Ascx)]
        public string ViewPath
        {
            get { return _viewPath; }
            set { _viewPath = value; }
        }

        [LocalizedWebDisplayName(ContentApprovalPortletClass, "Prop_NeedValidation_DisplayName")]
        [LocalizedWebDescription(ContentApprovalPortletClass, "Prop_NeedValidation_Description")]
        [WebBrowsable(true), Personalizable(true)]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(200)]
        public bool NeedValidation
        {
            get { return _needValidation; }
            set { _needValidation = value; }
        }

        // portlet uses custom ascx, hide renderer property
        [WebBrowsable(false), Personalizable(true)]
        public override string Renderer { get; set; }

        private Button _approveButton;
        protected Button ApproveButton
        {
            get
            {
                return _approveButton ?? (_approveButton = this.FindControlRecursive("Approve") as Button);
            }
        }

        private RejectButton _rejectButton;
        protected RejectButton RejectButton
        {
            get
            {
                return _rejectButton ?? (_rejectButton = this.FindControlRecursive("RejectButton") as RejectButton);
            }
        }

        private Label _contentLabel;
        protected Label ContentLabel
        {
            get { return _contentLabel ?? (_contentLabel = this.FindControlRecursive("ContentName") as Label); }
        }

        private PlaceHolder _plcError;
        protected PlaceHolder ErrorPlaceholder
        {
            get
            {
                return _plcError ?? (_plcError = this.FindControlRecursive("ErrorPanel") as PlaceHolder);
            }
        }

        private Label _errorLabel;
        protected Label ErrorLabel
        {
            get
            {
                return _errorLabel ?? (_errorLabel = this.FindControlRecursive("ErrorLabel") as Label);
            }
        }

        // ================================================================ Overrides

        protected override void CreateChildControls()
        {
            Controls.Clear();

            try
            {
                var viewControl = Page.LoadControl(ViewPath) as UserControl;
                if (viewControl != null)
                {
                    Controls.Add(viewControl);
                    BindEvents();
                }
            }
            catch (Exception exc)
            {
                SnLog.WriteException(exc);
            }

            var genericContent = GetContextNode() as GenericContent;
            if (genericContent == null)
            {
                ShowError("This type of content cannot be approved");
                return;
            }

            if (ContentLabel != null)
                ContentLabel.Text = HttpUtility.HtmlEncode(genericContent.DisplayName);

            ChildControlsCreated = true;
        }

        // ====================================================================== Event handlers

        protected void ApprovalControl_ButtonsAction(object sender, CommandEventArgs e)
        {
            HandleCommand("Approve");
        }

        protected void RejectButton_OnReject(object sender, VersioningActionEventArgs e)
        {
            var genericContent = this.ContextNode as GenericContent;
            if (genericContent == null)
                return;

            genericContent["RejectReason"] = e.Comments;
            
            HandleCommand("Reject");
        }

        protected void HandleCommand(string commandName)
        {
            var genericContent = this.ContextNode as GenericContent;
            if (genericContent == null)
                return;

            try
            {
                if (NeedValidation)
                {
                    var cnt = ContentRepository.Content.Create(genericContent);
                    if (!cnt.IsValid)
                    {
                        ShowError("Current content is not valid. Please edit the content and fix the errors.");
                        return;
                    }
                }

                switch (commandName)
                {
                    case "Approve":
                        genericContent.Approve();
                        break;
                    case "Reject":
                        genericContent.Reject();
                        break;
                    default:
                        throw new InvalidOperationException("Unknown command");
                }

                CallDone(false);
            }
            catch (Exception ex)
            {
                SnLog.WriteException(ex);

                ShowError(ex.Message);
            }
        }

        // ====================================================================== Helper methods

        private void BindEvents()
        {
            if (this.ApproveButton != null)
                this.ApproveButton.Command += ApprovalControl_ButtonsAction;

            if (this.RejectButton != null)
                this.RejectButton.OnReject += RejectButton_OnReject;
        }

        private void ShowError(string message)
        {
            if (ErrorPlaceholder != null)
                ErrorPlaceholder.Visible = true;

            if (ErrorLabel != null && !string.IsNullOrEmpty(message))
                ErrorLabel.Text = message;
        }
    }
}
