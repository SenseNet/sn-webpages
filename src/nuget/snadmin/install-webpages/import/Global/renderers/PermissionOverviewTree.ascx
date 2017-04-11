<%@ Control Language="C#" AutoEventWireup="true" Inherits="SenseNet.Portal.UI.SingleContentView" %>
<div class="sn-permission-overview-tree"></div>

<sn:scriptrequest runat="server" path="$skin/scripts/sn/sn.permissionTree.js" id="permissionTreeJs" />
<script>
    $(function () {
        var $treeContainer = $('.sn-permission-overview-tree');
        var permissionOverviewTree = $treeContainer.PermissionOverviewTree();
    })
</script>
