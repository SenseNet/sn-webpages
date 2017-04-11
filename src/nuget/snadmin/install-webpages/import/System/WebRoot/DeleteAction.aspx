<%@ Page Language="C#" %>
<%@ Import Namespace="SenseNet.ContentRepository.Storage" %>
<%@ Import Namespace="System.Linq" %>
<%@ Import Namespace="SenseNet.ContentRepository.Schema" %>
<%@ Import Namespace="SenseNet.ContentRepository" %>
<%@ Import Namespace="SenseNet.ContentRepository.Storage.Security" %>
<%@ Import Namespace="System.Web.Script.Serialization" %>
<%@ Import Namespace="SenseNet.Portal.UI" %>
<%@ Import Namespace="Newtonsoft.Json.Linq" %>
<%@ Import Namespace="Newtonsoft.Json" %>
<%@ Import Namespace="SenseNet.Portal.OData" %>


<%
    // get paths
    var dataStr = Request.Form["data"];
    JObject json = JObject.Parse(dataStr);
    var pathlist = (List<string>)JsonConvert.DeserializeObject(json["paths"].ToString(), typeof(List<string>));
    var idlist = (List<int>)JsonConvert.DeserializeObject(json["ids"].ToString(), typeof(List<int>));
    var contextPath = json["contextpath"].ToString();
    var redirectPath = (json["redirectPath"] ?? string.Empty).ToString();
    var batch = (bool)json["batch"];
    
    var requestNodeList = Node.LoadNodes(idlist);
    var nodesInTreeCount = (from node in requestNodeList
                            select node.NodesInTree).Sum();
    var contentTrashable = requestNodeList.Select(node => node as GenericContent).All(gc => gc != null && gc.IsTrashable);
    var isInTrash = (requestNodeList.Count(n => TrashBin.IsInTrash(n as GenericContent)) > 0);
    
    TrashBin trashBin = null;
    try
    {
        trashBin = TrashBin.Instance;
    }
    catch (SenseNetSecurityException)
    {
        //trashbin is not accessible due to lack of permissions
    }

    var allowTrash = false;
    
    var trashBinDisabled = false;
    var contentNotTrashable = false;
    var tooMuch = false;
    var trashBinNull = trashBin == null;
    if (!trashBinNull && !isInTrash)
    {
        trashBinDisabled = !trashBin.IsActive;
        if (!trashBinDisabled)
        {
            contentNotTrashable = !contentTrashable;
            if (!contentNotTrashable)
            {
                tooMuch = trashBin.BagCapacity != 0 && trashBin.BagCapacity < nodesInTreeCount;
                if (!tooMuch)
                {
                    allowTrash = true;
                }
            }
        }
    }

    var aboutToDelete = string.Empty;
    if (idlist.Count == 1)
    {
        aboutToDelete = GetGlobalResourceObject("ContentDelete", "AboutToDelete") as string;
        aboutToDelete = string.Format(aboutToDelete, HttpUtility.HtmlEncode(SenseNet.ContentRepository.Content.Create(requestNodeList[0]).DisplayName));
    }
    else
    {
        aboutToDelete = GetGlobalResourceObject("ContentDelete", "AboutToDeleteMore") as string;
        aboutToDelete = string.Format(aboutToDelete, idlist.Count.ToString());
    }
%>

<script>
    function deleteContent(link, permanent) {
        // determine target path to redirect. if we are deleting the current content, we should redirect to its parent. Otherwise refresh current location
        var contextPath = '<%=pathlist[0] %>'; 

        // determine path to refresh in tree
        var pathToRefresh = SN.Util.GetParentPath(contextPath);

        // determine path to redirect to - if current content is deleted we should redirect to parent
        var redirectPath = <%= string.IsNullOrEmpty(redirectPath) ? "SN.Util.GetParentUrlForPath(contextPath)" : "'" + redirectPath + "'" %>;

        var dialog = link.closest('.sn-statusdialog-window');
        dialog.html('<div class="sn-statusdialog-content sn-statusdialog-loading"><img src="/Root/Global/images/loading.gif" /></div>');
        $.ajax({
            url: '<%= batch ? ODataTools.GetODataOperationUrl(contextPath, "DeleteBatch", true) : ODataTools.GetODataOperationUrl(contextPath, "Delete", true) %>',
            type: 'POST',
            data: <%= batch ? "JSON.stringify({paths:" + json["paths"].ToString() + ", permanent:permanent })" : "JSON.stringify({permanent:permanent})" %>,
            success: function (data) {
                dialog.dialog('close');
                SN.Util.RefreshExploreTree([pathToRefresh]);
                SN.Util.CreateStatusDialog('<%=GetGlobalResourceObject("ContentDelete", "DeleteStatusDialogContent") %>', '<%=GetGlobalResourceObject("ContentDelete", "DeleteStatusDialogTitle") %>', 
                function () { 
                    location = redirectPath; 
                });
            },
            error: function (response) {
                dialog.dialog('close');
                SN.Util.RefreshExploreTree([pathToRefresh]);
                var respObj = JSON.parse(response.responseText); 
                SN.Util.CreateErrorDialog(respObj.error.message.value, '<%= GetGlobalResourceObject("Action", "ErrorDialogTitle") %>', function () {
                    location = location;
                });
            }
        });
    }
</script>

<div class='sn-statusdialog-content'>
    <%= aboutToDelete %>

    <% if (trashBinNull || trashBinDisabled || contentNotTrashable || tooMuch) {%>
        <div class="sn-deletewarning">
            <br />
            <% if (trashBinNull) {%>
                <asp:Label runat="server" ID="TrashBinNotFound" Text="<%$ Resources:ContentDelete,TrashBinNotFound %>" />
            <%}%>

            <% if (trashBinDisabled) {%>
                <asp:Label runat="server" ID="BinDisabledGlobalLabel" Text="<%$ Resources:ContentDelete,TrashBinDisabled %>"/>
            <%}%>

            <% if (contentNotTrashable) {%>
                <asp:Label runat="server" ID="BinNotConfiguredLabel" Text="<%$ Resources:ContentDelete,TrashBinNotConfigured %>"/>
            <%}%>

            <% if (tooMuch) {%>
                <asp:Label runat="server" ID="TooMuchContentLabel" Text="<%$ Resources:ContentDelete,TooMuch %>" />
            <%}%>
        </div>
    <%}%>
</div>

<div class='sn-statusdialog-footer'>
    <div class='sn-statusdialog-buttonsleft'>
        <input type='button' class='sn-submit sn-button sn-button-cancel' value='<%= GetGlobalResourceObject("ContentDelete","DeletePermanently") %>' onclick='deleteContent($(this), true);' />
    </div>
    <div class='sn-statusdialog-buttons'>
        <% if (allowTrash) {%>
            <input type='button' class='sn-submit sn-button' value='<% = GetGlobalResourceObject("ContentDelete","MoveToTrash") %>' onclick='deleteContent($(this), false);' />
        <%}%>
        <input type='button' class='sn-submit sn-button sn-button-cancel' value='<%= GetGlobalResourceObject("ContentDelete","Cancel") %>' onclick="$(this).closest('.sn-statusdialog-window').dialog('close');" />
    </div>
</div>
