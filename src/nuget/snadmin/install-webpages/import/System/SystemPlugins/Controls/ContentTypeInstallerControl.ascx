<%@ Control Language="C#" AutoEventWireup="false" Inherits="SenseNet.Portal.UI.Controls.ContentTypeInstallerControl" %>

<asp:Panel ID="pnlInstall" runat="server" Visible="true">
    <div class="sn-pt-body-border ui-widget-content" >
        <div class="sn-pt-body" >
            <%=GetGlobalResourceObject("Controls", "CTDInstall")%> <br/>
        </div> 
    </div>

    <div class="sn-pt-body-border ui-widget-content sn-dialog-buttons">
        <div class="sn-pt-body">
            <asp:Button ID="InstallerButton" runat="server" Text="<%$ Resources:Controls,Install %>" CssClass="sn-submit" OnClick="InstallerButton_Click" />
            <sn:BackButton Text="<%$ Resources:Controls,Cancel %>" ID="CancelButton" runat="server" CssClass="sn-submit" />
        </div>
    </div>
</asp:Panel>
<asp:Panel ID="pnlSuccess" runat="server" Visible="false">
    <div class="sn-pt-body-border ui-widget-content" >
        <div class="sn-pt-body" >
            <%=GetGlobalResourceObject("Controls", "CTDInstalled")%> <br/>
        </div> 
    </div>

    <div class="sn-pt-body-border ui-widget-content sn-dialog-buttons">
        <div class="sn-pt-body">
            <sn:BackButton Text="<%$ Resources:Controls,Done %>" ID="CancelButton1" runat="server" CssClass="sn-submit" />
        </div>
    </div>
</asp:Panel>
