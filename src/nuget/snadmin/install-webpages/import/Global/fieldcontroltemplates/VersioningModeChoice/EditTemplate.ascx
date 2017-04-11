<%@  Language="C#" %>
<div class="sn-radiogroup-info">
    <%= HttpContext.GetGlobalResourceObject("Ctd-GenericContent", "VersioningModeChoiceInfo") %>
</div>
<asp:RadioButtonList CssClass="sn-ctrl sn-radiogroup" ID="InnerControl" runat="server"  />