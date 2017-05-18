<%@ Control Language="C#" AutoEventWireup="false" Inherits="System.Web.UI.UserControl" %>

<div class="sn-pt-body-border ui-widget-content" >
     <div class="sn-pt-body" >
            <%=GetGlobalResourceObject("ContentRename", "AboutToRename")%><strong><asp:Label ID="ContentName" runat="server" /></strong>. <br/>
            <%=GetGlobalResourceObject("ContentRename", "NewName")%>
            <br />
            <br />
            <asp:PlaceHolder runat="server" ID="ContentViewPlaceHolder"></asp:PlaceHolder>
                     
         <asp:PlaceHolder runat="server" ID="ErrorPanel" Visible="false">
             <div class="sn-error-msg">
                <asp:Label runat="server" ID="RenameErrorLabel" />
             </div>
         </asp:PlaceHolder>
     </div> 
</div>

<div class="sn-pt-body-border ui-widget-content sn-dialog-buttons">
    <div class="sn-pt-body">
        <asp:Button ID="RenameButton" runat="server" Text="<%$ Resources:ContentRename,Rename %>" CssClass="sn-submit" />
        <sn:BackButton Text="<%$ Resources:ContentRename,Cancel %>" ID="CancelButton" runat="server" CssClass="sn-submit" />
    </div>
</div>