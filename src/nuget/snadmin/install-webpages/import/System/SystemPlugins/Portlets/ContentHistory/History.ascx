<%@ Control Language="C#" AutoEventWireup="false" Inherits="System.Web.UI.UserControl" %>
<%@ Import Namespace="SenseNet.Portal.UI" %>
<%@ Import Namespace="SenseNet.Portal.UI.PortletFramework" %>
<%@ Import Namespace="SNCR=SenseNet.ContentRepository" %>

<sn:ContextInfo runat="server" Selector="CurrentContext" UsePortletContext="true" ID="myContext" />
<sn:SenseNetDataSource ID="SNDSVersions" ContextInfoID="myContext" MemberName="Versions" FieldNames="Name DisplayName Version CheckInComments RejectReason" runat="server"  />

<% 
    var contextNode = ContextBoundPortlet.GetContainingContextBoundPortlet(this).ContextNode as SNCR.GenericContent;
    var versioningMode = UITools.GetVersioningModeText(contextNode);
    var lockedByName = contextNode == null ? string.Empty : (contextNode.Lock.LockedBy == null ? string.Empty : contextNode.Lock.LockedBy.Name);
%>

<div class="sn-pt-body-border ui-widget-content">
     <div class="sn-pt-body">
					
        <div class="sn-content">
            <div class="sn-floatleft"><%= SenseNet.Portal.UI.IconHelper.RenderIconTag(contextNode.Icon, null, 32)%></div>
            <div id="sn-version-info" style="padding-left: 40px; margin-bottom:1em;">
                <h1 class="sn-content-title"><%= contextNode["DisplayName"] %></h1>
                <div>
                    <strong><%= HttpContext.GetGlobalResourceObject("ContentHistory", "Path") as string%>:</strong> <%= contextNode["Path"] %><br />
                    <strong><%= HttpContext.GetGlobalResourceObject("Portal", "VersioningMode") as string %>:</strong> <%= versioningMode %>
                    <% if (!string.IsNullOrEmpty(lockedByName)) { %>
                    <br /><strong><%=HttpContext.GetGlobalResourceObject("ContentHistory", "ContentIsLockedBy") as string %></strong> <%= lockedByName %>
                    <% } %>
                </div>
            </div>
        </div>

<asp:ListView ID="HistoryListView" runat="server" EnableViewState="false" DataSourceID="SNDSVersions"  >
    <LayoutTemplate>

        <table id="sn-version-history" class="sn-listgrid ui-widget-content">
          <thead>
              <tr class="ui-widget-content">
                  <th width="160" class="sn-lg-col-1 ui-state-default"><asp:Label Text="<%$ Resources:ContentHistory,Version %>" runat="server" /></th>    
                  <th class="sn-lg-col-2 ui-state-default"><asp:Label Text="<%$ Resources:ContentHistory,Modified %>" runat="server" /></th>
                  <th class="sn-lg-col-3 ui-state-default"><asp:Label Text="<%$ Resources:ContentHistory,Comments %>" runat="server" /></th>
                  <th class="sn-lg-col-4 ui-state-default"><asp:Label Text="<%$ Resources:ContentHistory,RejectReason %>" runat="server" /></th>
                  <th width="70" nowrap="nowrap" class="sn-lg-col-5 ui-state-default">&nbsp;</th>
              </tr>
          </thead>
          <tbody>
              <tr runat="server" id="itemPlaceHolder" />
          </tbody>
        </table>
    </LayoutTemplate>
    <ItemTemplate>
        <tr class='sn-lg-row<%# Container.DisplayIndex % 2 %> ui-widget-content'>      		
          <td class="sn-lg-col-1">
              <sn:ActionLinkButton runat="server" ToolTip="View this version" ActionName="Browse" IncludeBackUrl="True"
                ContextInfoID="myContext" Text='<%# ((SenseNet.ContentRepository.Content)Container.DataItem).ContentHandler.Version.ToDisplayText() %>' ParameterString='<%# String.Concat("version=" + Eval("Version")) %>' />
          </td>
          <td class="sn-lg-col-2">
              <span class='<%# "sn-date-" + ((SNCR.Content)Container.DataItem).ContentHandler.VersionId  %>'><%# ((SNCR.Content)Container.DataItem).ContentHandler.VersionModificationDate.ToString() %></span>
              <script> $(function () { SN.Util.setFriendlyLocalDate('<%# "span.sn-date-" + ((SNCR.Content)Container.DataItem).ContentHandler.VersionId %>', '<%= 
                System.Globalization.CultureInfo.CurrentUICulture %>', '<%# 
                (((SNCR.Content)Container.DataItem).Fields["ModificationDate"].FieldSetting as SNCR.Fields.DateTimeFieldSetting).DateTimeMode == SNCR.Fields.DateTimeMode.Date 
                    ? ((DateTime)((SNCR.Content)Container.DataItem).ContentHandler.VersionModificationDate).ToString("M/d/yyyy", SNCR.Fields.DateTimeField.DefaultUICulture) 
                    : ((DateTime)((SNCR.Content)Container.DataItem).ContentHandler.VersionModificationDate).ToString(SNCR.Fields.DateTimeField.DefaultUICulture) %>', '<%=
                System.Globalization.CultureInfo.CurrentUICulture.DateTimeFormat.ShortDatePattern.ToUpper() %>', <%# 
                ((((SNCR.Content)Container.DataItem).Fields["ModificationDate"].FieldSetting as SNCR.Fields.DateTimeFieldSetting).DateTimeMode != SNCR.Fields.DateTimeMode.Date).ToString().ToLower() %>); }); </script>
              (<%# ((SNCR.Content)Container.DataItem).ContentHandler.VersionModifiedBy["Name"].ToString()%>)
          </td>
          <td class="sn-lg-col-3"><%# SenseNet.ContentRepository.Security.Sanitizer.Sanitize(Eval("CheckInComments") as string)%></td>
          <td class="sn-lg-col-4"><%# SenseNet.ContentRepository.Security.Sanitizer.Sanitize(Eval("RejectReason") as string)%></td>
          <td class="sn-lg-col-5"><sn:ActionLinkButton runat="server" ID="RestoreButton" ActionName="RestoreVersion" IconName="restoreversion" ContextInfoID="myContext" Text="<%$ Resources:ContentHistory,Restore %>" ParameterString='<%# String.Concat("version=" + Eval("Version")) %>' /></td>
        </tr>
    </ItemTemplate>
    <EmptyDataTemplate>
    </EmptyDataTemplate>
</asp:ListView>   

    </div>
</div> 

<div class="sn-pt-body-border ui-widget-content sn-dialog-buttons">
    <div class="sn-pt-body">
        <sn:BackButton Text="<%$ Resources:ContentHistory,Done %>" ID="BackButton1" runat="server" CssClass="sn-submit" />
    </div>
</div>
