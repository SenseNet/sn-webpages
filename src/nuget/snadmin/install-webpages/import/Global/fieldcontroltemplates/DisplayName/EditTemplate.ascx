<%@  Language="C#" %>
<asp:PlaceHolder ID="ResourceDiv" runat="server">
<div class="sn-resdiv">
    <asp:LinkButton ID="ResourceEditorLink" runat="server" ToolTip="<%$Resources: Controls,FieldControl-EditValue %>" />
    <asp:TextBox ID="Resources" runat="server" CssClass="sn-resbox" style="display:none" />
</div>
</asp:PlaceHolder>
<asp:TextBox ID="InnerShortText" CssClass="sn-ctrl sn-ctrl-text sn-urlname-name" runat="server"></asp:TextBox>
<asp:TextBox ID="NameAvailableControl" runat="server" style="display:none"></asp:TextBox>
