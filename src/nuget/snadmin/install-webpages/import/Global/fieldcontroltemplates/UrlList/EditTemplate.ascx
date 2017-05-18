<%@  Language="C#" %>
<%@ Import Namespace="SenseNet.Portal.UI" %>
<%@ Import Namespace="SNControls=SenseNet.Portal.UI.Controls" %> 

<asp:TextBox ID="InnerData" runat="server" style="display:none" CssClass='<%# "sn-urllist-innerdata-" + UITools.GetFieldNameClass(Container) %>' />
<div class='<%# "sn-url-list-" + UITools.GetFieldNameClass(Container) %>'></div>


<sn:scriptrequest runat="server" path="$skin/scripts/sn/sn.urllist.js" />
<script>
    $(function () {
        var siteCount = '<%# SenseNet.Configuration.UrlListSection.Current.Sites.Count %>';
        var note = '<%=GetGlobalResourceObject("FieldControlTemplates", "Note")%>';
        var $urlList = $('<%# ".sn-urllist-innerdata-" + UITools.GetFieldNameClass(Container) %>');

        var $list = $('<%# ".sn-url-list-" + UITools.GetFieldNameClass(Container) %>');

        if (Number(siteCount) > 0)
            var $note = $('<div class="url-warning"><span class="fa fa-warning"></span>' + note + '</div>').insertBefore($list);

        var urlList = $list.UrlList({
            data: $urlList.val(),
            textarea: $urlList,
            mode: 'edit'
        });
    })
</script>