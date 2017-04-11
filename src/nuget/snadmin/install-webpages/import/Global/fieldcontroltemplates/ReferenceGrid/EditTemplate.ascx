<%@  Language="C#" %>
<asp:TextBox ID="HiddenTextBoxControl" runat="server" TextMode="MultiLine" style="display: none;" Columns="20" Rows="2"/>
<asp:Table ID="TableControl" runat="server"></asp:Table>
<asp:Panel ID="PagerDiv" runat="server"></asp:Panel>
<asp:Button ID="AddButtonControl" runat="server" Text="<%$ Resources:FieldControlTemplates,AddButton %>" />
<asp:Button ID="ChangeButtonControl" runat="server" Text="<%$ Resources:FieldControlTemplates,ChangeButton %>" />
<asp:Button ID="ClearButtonControl" runat="server" Text="<%$ Resources:FieldControlTemplates,Clear %>" />
