<%@ Control Language="C#" AutoEventWireup="true" Inherits="SenseNet.Portal.UI.SingleContentView" %>
<%@ Import Namespace="SenseNet.ContentRepository" %>
<%@ Import Namespace="SenseNet.ContentRepository.Mail" %>

<sn:ShortText runat="server" ID="ListEmail" FieldName="ListEmail" />
<sn:RadioButtonGroup runat="server" ID="GroupAttachments" FieldName="GroupAttachments" />
<sn:ShortText runat="server" ID="InboxFolder" FieldName="InboxFolder" />
<sn:Boolean runat="server" ID="SaveOriginalEmail" FieldName="SaveOriginalEmail" />
<sn:Boolean runat="server" ID="OverwriteFiles" FieldName="OverwriteFiles" />
<sn:Boolean runat="server" ID="OnlyFromLocalGroups" FieldName="OnlyFromLocalGroups" />
<sn:ReferenceGrid ID="IncomingEmailWorkflow" runat="server" FieldName="IncomingEmailWorkflow" />

<div class="sn-panel sn-buttons">
    <asp:Button ID="Save" CssClass="sn-button sn-submit" runat="server" CommandName="Save" Text="<%$ Resources:Content,Save %>" OnClick="Click" />
    <asp:Button ID="Cancel" CssClass="sn-button sn-submit sn-button-cancel" runat="server" CommandName="Cancel" Text="<%$ Resources:Content,Cancel %>" OnClick="Click" />
</div>