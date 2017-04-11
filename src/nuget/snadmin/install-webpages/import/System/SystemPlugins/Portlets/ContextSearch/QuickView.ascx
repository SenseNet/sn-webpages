<%@ Control Language="C#" AutoEventWireup="false" Inherits="System.Web.UI.UserControl" %>

<asp:Panel CssClass="sn-quicksearch" runat="server" ID="quickPanel" DefaultButton="QuickSearchButton">
    <span class="sn-quicksearch-text"><asp:TextBox ID="SearchBox" CssClass="sn-quicksearch-input" runat="server" /></span>
    <asp:Button ID="QuickSearchButton" runat="server" CssClass="sn-quicksearch-button" UseSubmitBehavior="true" />
</asp:Panel>