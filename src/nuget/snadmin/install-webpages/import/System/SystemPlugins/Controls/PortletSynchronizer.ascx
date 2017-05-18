<%@ Control Language="C#" AutoEventWireup="true" Inherits="SenseNet.Portal.UI.Controls.PortletSynchronizer" %>

<asp:Panel ID="pnlSuccess" runat="server" Visible="false">
	<b><%=GetGlobalResourceObject("Controls", "PortletInstalled")%></b>
	<br />
	<br />
</asp:Panel>

<asp:ListView ID="ListView1" runat="server">
    <LayoutTemplate>
        <table>
            <thead>
                <tr>
                    <th style="width:160px"><asp:Literal runat="server" ID="Literal1" Text="<%$ Resources: Controls, Name %>" /></th>
                    <th style="width:260px"><asp:Literal runat="server" ID="Literal2" Text="<%$ Resources: Controls, Description %>" /></th>
                    <th style="width:80px"><asp:Literal runat="server" ID="Literal3" Text="<%$ Resources: Controls, Category %>" /></th>
                </tr>
            </thead>
            <tbody>
                <tr id="itemPlaceholder" runat="server"></tr>
            </tbody>
        </table>
    </LayoutTemplate>
    <ItemTemplate>
        <tr>
            <td><%# Eval("DisplayName")%></td>
            <td><%# Eval("Description")%></td>
            <td><%# Eval("Category")%></td>
        </tr>
    </ItemTemplate>
    <EmptyDataTemplate>
        <asp:Literal runat="server" ID="Literal4" Text="<%$ Resources: Controls, NoPortlets %>" />
    </EmptyDataTemplate>
</asp:ListView>

<br />
<br />
<asp:Button CssClass="sn-submit" ID="btnInstallPortlets" runat="server" Text="<%$ Resources:Controls,InstallPortlets %>" onclick="btnInstallPortlets_Click" />
<asp:Button CssClass="sn-submit" ID="btnBack" runat="server" Text="<%$ Resources:Controls,Cancel %>" onclick="btnBack_Click" />
