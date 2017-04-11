﻿<%@ Control Language="C#" AutoEventWireup="false" Inherits="SenseNet.Portal.UI.ContentListViews.ListView" %>
<%@ Import Namespace="SNCR=SenseNet.ContentRepository" %>
<%@ Import Namespace="SenseNet.Portal.UI.ContentListViews" %>
<%@ Import Namespace="SenseNet.Portal.Helpers" %>
<sn:SenseNetDataSource ID="ViewDatasource" runat="server" />
<sn:ContextInfo runat="server" Selector="CurrentContext" UsePortletContext="true" ID="myContext" />

<sn:ListGrid ID="ViewBody" DataSourceID="ViewDatasource" runat="server">
    <LayoutTemplate>
        <div class="sn-article-list sn-article-list-shortdetail">
            <asp:PlaceHolder runat="server" ID="itemPlaceHolder" />
        </div>
    </LayoutTemplate>
    <ItemTemplate>
        <div class="sn-article-list-item">
            <% if (Security.IsInRole("Editors"))
               { %>
            <div class="sn-content-actions">
                <sn:ActionMenu NodePath='<%# Eval("Path") %>' runat="server" Scenario="ListItem" Text="<%$ Resources: Portal, ManageContent %>" />
            </div>
            <%} %>
            <h2 class="sn-article-title">
                <a href="<%# Actions.BrowseUrl(((SenseNet.ContentRepository.Content)Container.DataItem)) %>"><%# HttpUtility.HtmlEncode(Eval("GenericContent_DisplayName")) %></a>
            </h2>
            <small class="sn-article-info"><%# Eval("GenericContent_ModificationDate")%></small>
            <div class="sn-article-lead">
                <%# Eval("GenericContent_Description") %>
            </div>
        </div>
    </ItemTemplate>
    <EmptyDataTemplate>
        <div class="sn-warning-msg ui-widget-content ui-state-default"><%=GetGlobalResourceObject("List", "EmptyList")%></div>
    </EmptyDataTemplate>
</sn:ListGrid>
<sn:ActionMenu ID="ActionMenu1" runat="server" Scenario="New" ContextInfoID="myContext" RequiredPermissions="AddNew" CheckActionCount="True">
    <sn:ActionLinkButton ID="ActionLinkButton1" runat="server" ActionName="Add" ContextInfoID="myContext" Text='<%$ Resources: Scenario, New %>' CheckActionCount="True"/>
</sn:ActionMenu>
<script> $(function () {

     $('.sn-article-info').each(function () {
         var that = $(this);
         that.text =
         SN.Util.setFriendlyLocalDate(that, '<%= System.Globalization.CultureInfo.CurrentUICulture%>', that.text(), '<%= System.Globalization.CultureInfo.CurrentUICulture.DateTimeFormat.ShortDatePattern %>', '<%= System.Globalization.CultureInfo.CurrentUICulture.DateTimeFormat.ShortTimePattern %>');
     });
    });
</script>
