<%@ Control Language="C#" AutoEventWireup="true" Inherits="SenseNet.Portal.Portlets.ContentCollectionView" %>
<%@ Import Namespace="System.Linq" %>
<%@ Import Namespace="SenseNet.Portal.Helpers" %>
<%@ Import Namespace="SenseNet.Portal.UI" %>
<%@ Import Namespace="SenseNet.Portal.Virtualization" %>
   
<ul class="sn-menu">
<% var index = 1;
  foreach (var content in this.Model.Items.Where(item => !(bool)item["Hidden"]))
  { %>
          <li class='<%="sn-menu-" + index++ %>'>
            <% var displayName = UITools.GetSafeText(content.DisplayName);
               
               if (PortalContext.Current.IsResourceEditorAllowed)
               { %>
            <% = displayName %>
            <% } else { %>
            <a href="<%= Actions.BrowseUrl(content) %>"><%= displayName %></a>
            <% } %>
          </li>
<%} %>
</ul>