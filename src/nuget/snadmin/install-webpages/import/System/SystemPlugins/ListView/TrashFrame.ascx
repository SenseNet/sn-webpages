<%@ Import Namespace="SenseNet.ApplicationModel"%>
<%@ Import Namespace="SenseNet.ContentRepository"%>
<%@ Import Namespace="SenseNet.ContentRepository.Storage"%>
<%@ Control Language="C#" AutoEventWireup="false" Inherits="SenseNet.Portal.UI.ContentListViews.ViewFrame" %>

<sn:ContextInfo runat="server" Selector="CurrentContext" UsePortletContext="true" ID="myContext" />

<% 
   var trashbin = SenseNet.ContentRepository.TrashBin.Instance;
   var fullsize = trashbin.GetTreeSize();
   double percent = (fullsize == 0) ? 0 : Math.Round((fullsize * 1.0 / (trashbin.SizeQuota * 1048576.0))*100.0);
%>

<div class="sn-dialog-header">
    <div id="sn-trash-pic">
    <% if (trashbin.SizeQuota != 0) { %>
            <div id="sn-trash-pic-trash" style="top:<%= percent > 100 ? "0": String.Format("{0:0.00}%", 100.0-percent) %>"></div>
            <div id="sn-trash-pic-mask"></div>
    <% } %>
    </div>
    <h1 class="sn-dialog-title"><%= HttpContext.GetGlobalResourceObject("Trash", "TrashBinInformation")%></h1>
    <p class="sn-lead sn-dialog-lead">
        <%= HttpContext.GetGlobalResourceObject("Trash", "TrashBinInformationLong")%>
    </p>
    <dl class="sn-dialog-properties">
        <dt>
            <%= HttpContext.GetGlobalResourceObject("Trash", "TrashBinState")%>
        </dt>
        <dd>
            <strong><%= HttpContext.GetGlobalResourceObject("Trash", "Globally")%> <%= trashbin.IsActive ? HttpContext.GetGlobalResourceObject("Trash", "Enabled") : HttpContext.GetGlobalResourceObject("Trash", "Disabled")%></strong>
        </dd>
        <dt>
            <%= HttpContext.GetGlobalResourceObject("Trash", "MinimumRetentionTime")%>
             <img src="/Root/Global/images/icon-info.png" alt="<%= GetGlobalResourceObject("ContentView", "Info")%>" title="<%= HttpContext.GetGlobalResourceObject("Trash", "ContentsDeletedToday")%> <%= DateTime.UtcNow.AddDays(trashbin.MinRetentionTime) %>. <%= HttpContext.GetGlobalResourceObject("Trash", "ContentsDeletedTodayNote")%>" />
        </dt>
        <dd>
            <%= trashbin.MinRetentionTime %> <%= trashbin.MinRetentionTime > 1 ? HttpContext.GetGlobalResourceObject("Trash", "Days") : HttpContext.GetGlobalResourceObject("Trash", "Day")%>
        </dd>
        <dt><%= HttpContext.GetGlobalResourceObject("Trash", "SpaceUsed")%> <img src="/Root/Global/images/icon-info.png" alt="<%= GetGlobalResourceObject("ContentView", "Info")%>" title="<%= trashbin.SizeQuota == 0 ? HttpContext.GetGlobalResourceObject("Trash", "SizeQuotaNotSet") : HttpContext.GetGlobalResourceObject("Trash", "MaximumCapacity") %>" /></dt>
        <dd>
        <% if (trashbin.SizeQuota != 0)
           { %>
            <span class="sn-trash-o-meter">
                <span class="sn-trashmeter-container">
                    <span style="width:<%= percent > 100 ? "104": percent.ToString() %>%"></span>
                </span>
                <strong<%= percent > 100 ? " class=\"overflow\"": "" %>><%= percent.ToString()%>% (<%= String.Format("{0:0.00}", (fullsize * 1.0 / 1048576.0))%>Mb <%= HttpContext.GetGlobalResourceObject("Trash", "UsedFrom")%> <%= trashbin.SizeQuota.ToString()%>Mb)</strong>
            </span>       
        <% } else { %>
            <%= String.Format("{0:0.00}", (fullsize * 1.0 / 1048576.0))%>Mb <%= HttpContext.GetGlobalResourceObject("Trash", "Used")%>
        <% } %>
        </dd>
    </dl>
</div>

<div class="sn-listview">

    <sn:Toolbar runat="server">
        <sn:ToolbarItemGroup Align="Left" runat="server">
            <sn:ActionLinkButton runat="server" ActionName="Purge" IconUrl="/Root/Global/images/icons/16/purge.png" ContextInfoID="myContext" Text="<%$ Resources: Trash, EmptyTrashBin %>" />
        </sn:ToolbarItemGroup>
        <sn:ToolbarItemGroup Align="Right" runat="server">
             <% if (this.ContextNode != null && ScenarioManager.GetScenario("Views").GetActions(SenseNet.ContentRepository.Content.Create(this.ContextNode), null).Count() > 0) 
               { %>
            <span class="sn-actionlabel"><%= HttpContext.GetGlobalResourceObject("Scenario", "ViewsMenuDisplayName")%></span>
            <sn:ActionMenu runat="server" IconUrl="/Root/Global/images/icons/16/views.png" Scenario="Views" ContextInfoID="myContext"
                ScenarioParameters="PortletID={PortletID};DefaultView={DefaultView}" >
              <%= HttpUtility.HtmlEncode(SenseNet.ContentRepository.Content.Create(ViewManager.LoadViewInContext(ContextNode, LoadedViewName)).DisplayName)%>
            </sn:ActionMenu>
             <% } %>
            <sn:ActionMenu runat="server" IconUrl="/Root/Global/images/icons/16/settings.png" Scenario="Settings" ContextInfoID="myContext"><%= HttpContext.GetGlobalResourceObject("Scenario", "SettingsMenuDisplayName")%></sn:ActionMenu>
        </sn:ToolbarItemGroup>                
    </sn:Toolbar>

    <asp:Panel ID="ListViewPanel" runat="server"></asp:Panel>
    
</div>

<div class="sn-pt-body-border ui-widget-content sn-dialog-buttons">
    <div class="sn-pt-body">
        <sn:BackButton ID="DoneButton" runat="server" CssClass="sn-submit" Target="currentsite" />
    </div>
</div>