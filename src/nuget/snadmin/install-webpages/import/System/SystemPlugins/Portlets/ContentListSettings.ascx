<%@ Control Language="C#" AutoEventWireup="false" Inherits="System.Web.UI.UserControl" %>
<%@ Import Namespace="SenseNet.Portal" %>
<%@ Import Namespace="SenseNet.Portal.Virtualization" %>
<%@ Import Namespace="SNCR=SenseNet.ContentRepository" %>
<%@ Import Namespace="SenseNet.ContentRepository.Storage" %>

<sn:ContextInfo runat="server" ID="ContextInfoContent" Selector="CurrentContent" />

<%
    var currentList = PortalContext.Current.ContextNode as SNCR.ContentList;
    var currentListc = SenseNet.ContentRepository.Content.Create(currentList);
     %>

<div class="sn-content sn-content-inlineview">
        <div class="sn-inputunit ui-helper-clearfix">
            <div class="sn-iu-label">
                <div class="sn-iu-title"><%= SNCR.Content.Create(currentList.ContentType)["DisplayName"].ToString()%> <%= SNSR.GetString("Ctd-GenericContent", "Name-DisplayName").ToLower() %></div>                    
            </div>
            <div class="sn-iu-control">
                <%= PortalContext.Current.ContextNode.Name %>
            </div>
            <div class="sn-iu-label">
                <div class="sn-iu-title"><%= SNCR.Content.Create(currentList.ContentType)["DisplayName"].ToString()%> <%= SNSR.GetString("Ctd-GenericContent", "DisplayName-DisplayName").ToLower()%></div>
            </div>
            <div class="sn-iu-control">
                <%= currentListc.DisplayName%>
            </div>
            <div class="sn-iu-label">
                <div class="sn-iu-title"><%= SNSR.GetString("Ctd-GenericContent", "Path-DisplayName") %></div>
            </div>
            <div class="sn-iu-control">
                <%= PortalContext.Current.ContextNodePath %>
            </div>
            <div class="sn-iu-label">
                <div class="sn-iu-title"><%= SNSR.GetString("Ctd-GenericContent", "Description-DisplayName") %></div>
            </div>
            <div class="sn-iu-control">
                <%= SNCR.Content.Create(PortalContext.Current.ContextNode).Description %>
            </div>
        </div>
    
    <br />
        <h2 class="sn-content-title"><%= SNSR.GetString("Controls", "Settings-ChoosePage") %></h2>
    
        <div class="sn-inputunit ui-helper-clearfix">
            <div class="sn-iu-label">
                <span class="sn-iu-title"><%= SNSR.GetString("Controls", "Settings-Title") %></span><br />
                <span class="sn-iu-desc"><%= SNSR.GetString("Controls", "Settings-Description") %></span>
            </div>
            <div class="sn-iu-control">
                <ul class="sn-list">
                    <li><sn:ActionLinkButton CssClass="sn-link" ActionName="Edit" ContextInfoID="ContextInfoContent" ID="EditLink" runat="server" IconVisible="False" ><%= SNSR.GetString("Controls", "Settings-General") %></sn:ActionLinkButton></li>
                    <li><sn:ActionLinkButton CssClass="sn-link" ActionName="ManageFields" ContextInfoID="ContextInfoContent" ID="ManageFieldsLink" runat="server" IconVisible="False" ><%= SNSR.GetString("Controls", "Settings-ManageFields") %></sn:ActionLinkButton></li>
                    <li><sn:ActionLinkButton CssClass="sn-link" ActionName="ManageViews" ContextInfoID="ContextInfoContent" ID="ManageViewsLink" runat="server" IconVisible="False" ><%= SNSR.GetString("Controls", "Settings-ManageViews") %></sn:ActionLinkButton></li>
                </ul>
            </div>
        </div>
    
    <div class="sn-panel sn-buttons">
      <sn:BackButton runat="server" ID="BackButton" CssClass="sn-submit" />
    </div>
    
</div>
