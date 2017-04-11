<%@ Language="C#" AutoEventWireup="true" Inherits="SenseNet.Portal.UI.SingleContentView" %>
<%@ Import Namespace="SenseNet.Portal.Helpers" %>
<%@ Import Namespace="SenseNet.Portal.UI" %>
<%@ Import Namespace="SenseNet.ContentRepository" %>
<%@ Import Namespace="SenseNet.ContentRepository.Storage.Data" %>
<%@ Import Namespace="SenseNet.ContentRepository.Versioning" %>

<div class="sn-content-inlineview-header ui-helper-clearfix">
    <%= SenseNet.Portal.UI.IconHelper.RenderIconTag(Content.Icon, null, 32) %>
	<div class="sn-content-info">
        <h2 class="sn-view-title"><% = HttpUtility.HtmlEncode(DisplayName) %> (<%= SenseNet.ContentRepository.Content.Create(ContentType)["DisplayName"].ToString() %>)</h2>
        <strong><%=GetGlobalResourceObject("Content", "Path")%></strong> <%= ContentHandler.Path %>
    <% var gc = ContentHandler as GenericContent;
       if (gc.VersioningMode > VersioningType.None || gc.ApprovingMode == ApprovingType.True || gc.Locked || gc.Version.Major > 1) { %>
       <br /><strong><%=GetGlobalResourceObject("Content", "Version")%></strong> <%= ContentHandler.Version.ToDisplayText() %>
    <% } %>
    </div>
</div>

<sn:GenericFieldControl ID="GenericFields1" runat="server" FieldsOrder="DisplayName Name" />

<% if (SenseNet.Configuration.Identifiers.SpecialGroupPaths.Contains(this.Content.Path))
   { %>

    <div class="sn-inputunit ui-helper-clearfix" >
        <div class="sn-iu-label">
            <span class="sn-iu-title"><%= this.Content.Fields["Members"].DisplayName %></span>
            <br>
            <span class="sn-iu-desc"><%= this.Content.Fields["Members"].Description %></span>
        </div>
        <div class="sn-iu-control">        
            <img class="sn-icon sn-icon_16" src="/Root/Global/images/icons/16/warning.png" alt="" />
            <%=GetGlobalResourceObject("Content", "SystemGroup")%>
        </div>
    </div>

<% } else { %>
   <sn:GenericFieldControl ID="GenericFields2" runat="server" FieldsOrder="Members" />
<% }%>
   
 <sn:GenericFieldControl ID="GenericFieldControl3" runat="server" ExcludedFields="DisplayName Name Members" />

<div class="sn-panel sn-buttons">
  <sn:CommandButtons ID="CommandButtons1" runat="server" layoutControlPath="/Root/System/SystemPlugins/Controls/CommandButtons.ascx" />
</div>