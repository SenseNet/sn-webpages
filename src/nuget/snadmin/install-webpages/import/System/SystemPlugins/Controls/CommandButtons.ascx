<%@ Control Language="C#" AutoEventWireup="true" Inherits="System.Web.UI.UserControl" %>

<!-- visible in states: L -->
<asp:Button CssClass="sn-button sn-submit" ID="Save" runat="server"
    Text="<%$ Resources:Controls,Save %>" 
    ToolTip="<%$ Resources:Controls,Save %>" />

<!-- visible in states: A -->
<asp:Button CssClass="sn-button sn-submit" ID="CheckoutSaveCheckin" runat="server"
    Text="<%$ Resources:Controls,Save %>" 
    ToolTip="<%$ Resources:Controls,Save %>" />

<!-- visible in states: A,L,D,P,R -->
<asp:Button CssClass="sn-button sn-submit sn-button-cancel" ID="Cancel" runat="server"
    Text="<%$ Resources:Controls,Cancel %>"  />
