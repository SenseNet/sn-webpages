<%@ Control Language="C#" AutoEventWireup="false" Inherits="System.Web.UI.UserControl" %>

<asp:DropDownList ID="ddFieldName" runat="server" Width="180px" /> 

<asp:DropDownList ID="ddOrder" runat="server" Width="90px">
 <asp:ListItem Text="<%$ Resources:Controls, Sorting-Asc %>" Value="ASC" />
 <asp:ListItem Text="<%$ Resources:Controls, Sorting-Desc %>" Value="DESC" />
</asp:DropDownList>