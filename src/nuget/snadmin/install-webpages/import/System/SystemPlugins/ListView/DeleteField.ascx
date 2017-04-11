<%@ Control Language="C#" AutoEventWireup="false" Inherits="System.Web.UI.UserControl" %>

<asp:Panel ID="pnlDelete" runat="server">
<div class="sn-dialog-confirmation">
<p class="sn-lead sn-dialog-lead">
    <%= HttpContext.GetGlobalResourceObject("Trash", "YouAreAboutToDelete")%><asp:Label ID="lblFieldName" runat="server" />
</p>
</div>
<div class="sn-dialog-buttons">
   <div class="sn-pt-body">
   <asp:Label CssClass="sn-confirmquestion" ID="RusLabel" runat="server" Text="<%$ Resources: Trash, AreYouSure %>" />

    <asp:Button ID="btnDelete" runat="server" CssClass="sn-submit" Text="Delete" /> 
    <asp:Button ID="btnCancel" runat="server" CssClass="sn-submit" Text="Cancel" />
   </div>
</div>

</asp:Panel>

