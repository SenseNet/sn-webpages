<%@  Language="C#" EnableViewState="false" %> 
<%@ Import Namespace="SenseNet.Portal.UI" %>
<%@ Import Namespace="SNControls=SenseNet.Portal.UI.Controls" %> 

<asp:TextBox ID="InnerData" runat="server" style="display:none" CssClass='<%# "sn-urllist-innerdata-" + UITools.GetFieldNameClass(Container) %>' />
<div class='<%# "sn-url-list-" + UITools.GetFieldNameClass(Container) %>'></div>

<sn:scriptrequest runat="server" path="$skin/scripts/sn/sn.urllist.js" />
<script>
    $(function () {

        var $urlList = $('<%# ".sn-urllist-innerdata-" + UITools.GetFieldNameClass(Container) %>');
        var $list = $('<%# ".sn-url-list-" + UITools.GetFieldNameClass(Container) %>');
        var urlList = $list.UrlList({
            data: $urlList.val(),
            textarea: $urlList,
            mode: 'browse'
        });
    })
</script>

