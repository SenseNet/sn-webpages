<%@ Control Language="C#" AutoEventWireup="false" Inherits="System.Web.UI.UserControl" %>

 <div class="sn-pt-body-border ui-widget-content">
     <div class="sn-pt-body">
         <p class="sn-lead sn-dialog-lead">
             <%=GetGlobalResourceObject("ContentApproval", "AboutToReject")%><strong><asp:Label ID="ContentName" runat="server" /></strong>
         </p>
         <asp:PlaceHolder runat="server" ID="ErrorPanel">
             <div class="sn-error-msg">
                <asp:Label runat="server" ID="ErrorLabel" />
             </div>
         </asp:PlaceHolder>
     </div>
</div>   
        
<div class="sn-pt-body-border ui-widget-content sn-dialog-buttons">
    <div class="sn-pt-body">
        <asp:Button ID="Approve" runat="server" Text="<%$ Resources:ContentApproval,Approve %>" CommandName="Approve" CssClass="sn-submit" />
        <sn:RejectButton ID="RejectButton" runat="server" />
        <sn:BackButton Text="<%$ Resources:ContentApproval,Cancel %>" ID="BackButton1" runat="server" CssClass="sn-submit" />
    </div>
</div>
