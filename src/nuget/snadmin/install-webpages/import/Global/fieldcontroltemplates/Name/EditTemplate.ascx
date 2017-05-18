<%@  Language="C#" %>
<%@ Import Namespace="SenseNet.Portal.Virtualization" %>
<%@ Import Namespace="SenseNet.Portal.UI.Controls" %>


<div class="sn-urlname" style="float:left;line-height: 24px;" title='<%# PortalContext.GetUrl(((FieldControl)Container).Content.ContentHandler.ParentPath) %>'><%# PortalContext.GetUrl(((FieldControl)Container).Content.ContentHandler.ParentPath) %>/</div><div style="display: none;float: left;line-height: 24px;margin-right: 2px;" class="sn-path-lastfolder" title='<%# PortalContext.GetUrl(((FieldControl)Container).Content.ContentHandler.ParentPath) %>'></div>

<asp:TextBox ID="InnerShortText" CssClass="sn-ctrl sn-ctrl-text sn-urlname-control" runat="server" style="display:none;"></asp:TextBox>
<asp:TextBox ID="ExtensionText" runat="server" CssClass="sn-ctrl sn-ctrl-text sn-urlname-extensionlabel" style="width: 50px; display:none;"></asp:TextBox>
<span class="sn-urlname-label-and-button">
<asp:Label ID="LabelControl" runat="server" CssClass="sn-urlname-label"></asp:Label>
<asp:ImageButton ID="EditButtonControl" class="EditButtonControl" runat="server" ImageUrl="/Root/Global/images/icons/16/edit.png" />
</span>
<asp:ImageButton ID="CancelButtonControl" class="CancelButtonControl" runat="server" ImageUrl="/Root/Global/images/icons/16/delete.png" style="display:none;"/>

<asp:TextBox ID="DisplayNameAvailableControl" runat="server" style="display:none;"></asp:TextBox>
