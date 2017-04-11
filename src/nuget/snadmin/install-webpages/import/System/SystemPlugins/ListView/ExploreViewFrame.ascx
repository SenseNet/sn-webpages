﻿<%@ Import Namespace="SenseNet.ApplicationModel"%>
<%@ Import Namespace="SNCR=SenseNet.ContentRepository"%>
<%@ Import Namespace="SenseNet.ContentRepository.Storage"%>
<%@ Import Namespace="SenseNet.Portal.Virtualization"%>
<%@ Import Namespace="SenseNet.Portal.Portlets" %>
<%@ Control Language="C#" AutoEventWireup="false" Inherits="SenseNet.Portal.UI.ContentListViews.ViewFrame" %>
<sn:ContextInfo runat="server" Selector="CurrentContext" UsePortletContext="true" ID="myContext" />
<sn:ContextInfo runat="server" Selector="CurrentList" UsePortletContext="true" ID="myList" />

<div class="sn-listview">
    <sn:Toolbar ID="Toolbar1" runat="server">
        <sn:ToolbarItemGroup ID="ToolbarItemGroup1" Align="Left" runat="server">
            <sn:ActionMenu ID="ActionMenu1" runat="server" Scenario="New" ScenarioParameters="DisplaySystemFolders=true" ContextInfoID="myContext" RequiredPermissions="AddNew" CheckActionCount="True">
                <sn:ActionLinkButton ID="ActionLinkButton1" runat="server" ActionName="Add" IconUrl="/Root/Global/images/icons/16/newfile.png" ContextInfoID="myContext" Text='<%$ Resources: Scenario, New %>' CheckActionCount="True"/>
            </sn:ActionMenu>
            <sn:ActionLinkButton ID="ActionLinkButton2" runat="server" ActionName="Upload" IconUrl="/Root/Global/images/icons/16/upload.png" ContextInfoID="myContext" Text="<%$ Resources: Action, Upload %>" />
            
            <% if (PortalContext.Current.ActionName == null || PortalContext.Current.ActionName.ToLower() != "explore")
               { %>
            <sn:ActionMenu ID="ActionMenu2" runat="server" IconUrl="/Root/Global/images/icons/16/wizard.png" Scenario="ListActions" ContextInfoID="myContext" CheckActionCount="True"><%= HttpContext.GetGlobalResourceObject("Scenario", "ActionsMenuDisplayName")%></sn:ActionMenu>
            <% } %>
                        
            <sn:ActionLinkButton CssClass="sn-batchaction" ID="ActionLinkButton3" runat="server" ActionName="CopyBatch" IconUrl="/Root/Global/images/icons/16/copy.png" ContextInfoID="myContext" Text="<%$ Resources: Action, CopyBatch %>" ParameterString="{PortletClientID}" />
            <sn:ActionLinkButton CssClass="sn-batchaction" ID="ActionLinkButton4" runat="server" ActionName="MoveBatch" IconUrl="/Root/Global/images/icons/16/move.png" ContextInfoID="myContext" Text="<%$ Resources: Action, MoveBatch %>" ParameterString="{PortletClientID}" />
            <sn:ActionLinkButton CssClass="sn-batchaction" ID="ActionLinkButton5" runat="server" ActionName="DeleteBatch" ContextInfoID="myContext" Text="<%$ Resources: Action, DeleteBatch %>" ParameterString="{PortletClientID}" />
        </sn:ToolbarItemGroup>
        <sn:ToolbarItemGroup ID="ToolbarItemGroup2" runat="server" Align="Right">
            <sn:ActionMenu ID="ActionMenu3" runat="server" IconUrl="/Root/Global/images/icons/16/settings.png" Scenario="Settings" ContextInfoID="myList" CheckActionCount="True"><%= HttpContext.GetGlobalResourceObject("Scenario", "SettingsMenuDisplayName")%></sn:ActionMenu>
            
            <% if (this.ContextList != null && ScenarioManager.GetScenario("Views").GetActions(SenseNet.ContentRepository.Content.Create(this.ContextList), null).Count() > 0) 
               {
                   %>
            <span class="sn-actionlabel"><%= HttpContext.GetGlobalResourceObject("Scenario", "ViewsMenuDisplayName")%></span>
            <sn:ActionMenu ID="ActionMenu4" runat="server" IconUrl="/Root/Global/images/icons/16/views.png" Scenario="Views" ContextInfoID="myList" CheckActionCount="True" ScenarioParameters="PortletID={PortletID};DefaultView={DefaultView}" >
              <%= HttpUtility.HtmlEncode(SNCR.Content.Create(ViewManager.LoadViewInContext(ContextNode, LoadedViewName)).DisplayName) %>
            </sn:ActionMenu>
            <% } %>
         </sn:ToolbarItemGroup>   
    </sn:Toolbar>
    <asp:Panel CssClass="sn-listview-checkbox" ID="ListViewPanel" runat="server"></asp:Panel>
</div>
