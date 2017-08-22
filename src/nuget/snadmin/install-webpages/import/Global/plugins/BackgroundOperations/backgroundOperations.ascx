<%@ Control Language="C#" AutoEventWireup="true" %>
<%@ Import Namespace="SenseNet.Portal.Virtualization" %>
<%@ Import Namespace="SenseNet.BackgroundOperations" %>
<%@ Import Namespace="SenseNet.ContentRepository" %>
<%@ Import Namespace="SenseNet.ContentRepository.Storage.Data" %>
<%@ Import Namespace="SenseNet.ContentRepository.i18n" %>
<sn:ScriptRequest ID="respond" runat="server" Path="$skin/scripts/respond.js" />
<sn:ScriptRequest ID="signalR" runat="server" Path="$skin/scripts/jquery/plugins/jquery.signalR-2.2.0.min.js" />
<sn:ScriptRequest ID="Scriptrequest1" runat="server" Path="$skin/scripts/sn/SN.TaskMonitor.js" />
<sn:ScriptRequest ID="hub" runat="server" Path="/signalr/hubs" />
<sn:ScriptRequest ID="Scriptrequest2" runat="server" Path="$skin/scripts/kendoui/kendo.web.min.js" />
<sn:CssRequest ID="kendocss1" runat="server" CSSPath="$skin/styles/kendoui/kendo.common.min.css" />
<sn:CssRequest ID="kendocss2" runat="server" CSSPath="$skin/styles/kendoui/kendo.metro.min.css" />
<sn:CssRequest ID="CssRequest0" runat="server" CSSPath="$skin/styles/SN.TaskMonitor.css" />
<sn:CssRequest ID="CssRequest1" runat="server" CSSPath="$skin/styles/fontawesome/font-awesome.min.css" />

<div id="taskmonitorWrapper">
    <h1>Background Operations<span id="connectionState" class="sn-icon fa fa-plug disconnected" title='<%= SenseNetResourceManager.Current.GetString("$BackgroundOperations,Disconnected") %>'></span></h1>
    <div id="taskDataGrid"></div>
</div>


<script type="text/x-kendo-template" id="machinesContainerTemplate">
    <div id="machinesWrapper">
        <span class="deselectAllMachines" data-bind="attr:{class: deselectClass}, click: deselectMachines"><%= SenseNetResourceManager.Current.GetString("$BackgroundOperations,showAllMachines") %></span>
        <div data-bind="source: machinesSource" data-template="machineTemplate" id="machinesContainer"></div>
    </div>
</script>

<script type="text/x-kendo-template" id="machineTemplate">
    <div class="machine" data-bind="attr:{class: setClass}, click: selectMachine, style:{color: getColor, backgroundColor: getBackgroundColor}">
        <div class="machineName" data-bind="text: Machine"></div>
        <div class="indicator-container" data-bind="style:{borderColor:getColor}">
            <p>CPU</p><span class="CPUContainer"><span class="indicator cpuIndicator" data-bind="style: {width: CPUPercent, backgroundColor: getColor}"></span></span><br />
            <p>RAM</p><span class="RAMContainer"><span class="indicator ramIndicator" data-bind="style: {width: RAMPercent, backgroundColor: getColor}"></span></span>
        </div>
        <div class="machineDetails" data-bind="visible: isDetailsVisible">
            <div style="text-align: left;">
    <div class="detailsLabel">            
    <span data-role="button" class="fa fa-close hideDetails" data-bind="click:hideDetails"></span>
                <p>CPU usage:</p>
                <span class="" data-bind="text: CPUPercent"></span> <br />
                <p>Total RAM:</p>
                <span class="" data-bind="text: TotalRamText"></span> <br />
                <p>Used RAM:</p>
                <span class="" data-bind="text: UsedRamText"></span> <br />
    </div>
                <div id="agentsContainer" data-bind="source: Agents" data-template="agentTemplate"></div>
            </div>
        </div>
    </div>
</script>

<script type="text/x-kendo-template" id="agentTemplate">
    <div class="fa fa-desktop agent" data-bind="attr: {title: getAgentName, data-agentId: getAgentId}, text: getAgentName, click: selectAgent, style:{color: getColor, backgroundColor: getBackgroundColor}"></div>
</script>

<script type="text/x-kendo-template" id="template">
                <div class="toolbar">
                    <label class="category-label" for="category"><%= SenseNetResourceManager.Current.GetString("$BackgroundOperations,filterByStatus") %></label>
                    <input type="search" id="statusFilter" style="width: 150px"/>
                </div>
</script>

<script type="text/javascript">
    $(document).ready(function () {

        var appId = '<%= Settings.GetValue<string>(TaskManager.Settings.SETTINGSNAME, TaskManager.Settings.TASKMANAGEMENTAPPID, null, "SenseNet") %>';

        $("#taskDataGrid").SenseNetTaskGrid({
            appId: appId
        });
    });
</script>
