<%@  Language="C#" %>
<%@ Import Namespace="SNControls=SenseNet.Portal.UI.Controls" %>
<%@ Import Namespace="SNFields=SenseNet.ContentRepository.Fields" %>

<table class='<%# "sn-ctrl-hyperlink" + (((SNControls.HyperLink)Container).Field.Name != "DefaultValue" && ((SNFields.HyperLinkFieldSetting)((SNControls.HyperLink)Container).Field.FieldSetting).UrlFormat == SNFields.UrlFormat.Picture ? " sn-ctrl-imagelink" : "")  %>'>
    <tr>
        <td>
            <asp:Label ID="HrefLabel" AssociatedControlID="_href_" runat="server" />
        </td>
        <td>
            <asp:TextBox ID="_href_" runat="server" />
        </td>
    </tr>
    <tr runat="server" visible='<%# ((SNControls.HyperLink)Container).Field.Name == "DefaultValue" || ((SNFields.HyperLinkFieldSetting)((SNControls.HyperLink)Container).Field.FieldSetting).UrlFormat != SNFields.UrlFormat.Picture %>'>
        <td>
            <asp:Label ID="TextLabel" AssociatedControlID="_text_" runat="server" />
        </td>
        <td>
            <asp:TextBox ID="_text_" runat="server" />
        </td>
    </tr>
    <tr>
        <td>
            <asp:Label ID="LinkLabel" AssociatedControlID="_title_" runat="server" />
        </td>
        <td>
            <asp:TextBox ID="_title_" runat="server" />
        </td>
    </tr>
    <tr>
        <td>
            <asp:Label ID="TargetLabel" AssociatedControlID="_target_" runat="server" />
        </td>
        <td>
            <asp:TextBox ID="_target_" runat="server" CssClass='<%# "sn-hyperlink-" + ((SNControls.HyperLink)Container).Field.Name.Replace("#", "") %>' /> <br />
        </td>
    </tr>
    <tr>
        <td>
        </td>
        <td>
            <span class="target-type-link" onclick='<%# string.Format("javascript:SetTarget(this, \"{0}\");", ((SNControls.HyperLink)Container).Field.Name.Replace("#", "")) %>' title='<%=HttpContext.GetGlobalResourceObject("FieldControlTemplates", "BlankTitle")%>'><%=HttpContext.GetGlobalResourceObject("FieldControlTemplates", "Blank")%></span>, 
            <span class="target-type-link" onclick='<%# string.Format("javascript:SetTarget(this, \"{0}\");", ((SNControls.HyperLink)Container).Field.Name.Replace("#", "")) %>' title='<%=HttpContext.GetGlobalResourceObject("FieldControlTemplates", "SelfTitle")%>'><%=GetGlobalResourceObject("FieldControlTemplates", "Self")%></span>, 
            <span class="target-type-link" onclick='<%# string.Format("javascript:SetTarget(this, \"{0}\");", ((SNControls.HyperLink)Container).Field.Name.Replace("#", "")) %>' title='<%=HttpContext.GetGlobalResourceObject("FieldControlTemplates", "ParentTitle")%>'><%=GetGlobalResourceObject("FieldControlTemplates", "Parent")%></span>, 
            <span class="target-type-link" onclick='<%# string.Format("javascript:SetTarget(this, \"{0}\");", ((SNControls.HyperLink)Container).Field.Name.Replace("#", "")) %>' title='<%=HttpContext.GetGlobalResourceObject("FieldControlTemplates", "TopTitle")%>'><%=GetGlobalResourceObject("FieldControlTemplates", "Top")%></span>, 
            
            <%=GetGlobalResourceObject("FieldControlTemplates", "FrameName")%>
        </td>
    </tr>
</table>

<script type="text/javascript" language="javascript">
    function SetTarget(link, fieldName) {
        $('.sn-hyperlink-' + fieldName).val(link.innerHTML);
    }
</script>
<style type="text/css">
    .target-type-link
    {
            cursor:pointer;color: Blue;text-decoration: underline
        }
</style>