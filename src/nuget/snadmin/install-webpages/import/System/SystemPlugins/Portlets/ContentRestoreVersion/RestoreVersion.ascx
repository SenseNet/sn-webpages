<%@ Control Language="C#" AutoEventWireup="false" Inherits="System.Web.UI.UserControl" %>

 <div class="sn-pt-body-border ui-widget-content">
     <div class="sn-pt-body">
         <p class="sn-lead sn-dialog-lead">
             <%=GetGlobalResourceObject("ContentRestoreVersion", "AboutToRestore")%><strong><asp:Label ID="ContentVersion" runat="server" /></strong> <%=GetGlobalResourceObject("ContentRestoreVersion", "Of")%> <strong><asp:Label ID="ContentName" runat="server" /></strong>
         </p>
         <asp:PlaceHolder runat="server" ID="ErrorPanel" Visible="false">
             <div class="sn-error-msg">
                <asp:Label runat="server" ID="ErrorLabel" />
             </div>
         </asp:PlaceHolder>
     </div>
</div>   
        
<div class="sn-pt-body-border ui-widget-content sn-dialog-buttons">
    <div class="sn-pt-body">
        <asp:Button ID="Restore" runat="server" Text="<%$ Resources:ContentRestoreVersion,Restore %>" CommandName="Restore" CssClass="sn-submit" />
        <sn:BackButton Text="<%$ Resources:ContentRestoreVersion,Cancel %>" ID="BackButton1" runat="server" CssClass="sn-submit" />
    </div>
</div>
