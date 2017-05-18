<%@ Import Namespace="SenseNet.ApplicationModel"%>
<%@ Import Namespace="SNCR=SenseNet.ContentRepository"%>
<%@ Import Namespace="SenseNet.ContentRepository.Storage"%>
<%@ Import Namespace="SenseNet.ContentRepository.Storage.Security"%>
<%@ Import Namespace="SenseNet.ContentRepository.Storage.Schema"%>
<%@ Import Namespace="SenseNet.Portal.Virtualization"%>
<%@ Import Namespace="SenseNet.Portal.Portlets" %>
<%@ Control Language="C#" AutoEventWireup="false" Inherits="SenseNet.Portal.UI.ContentListViews.ViewFrame" %>
<sn:ContextInfo runat="server" Selector="CurrentContext" UsePortletContext="true" ID="myContext" />
<sn:ContextInfo runat="server" Selector="CurrentList" UsePortletContext="true" ID="myList" />
<div class="sn-listview">

<script>
    $(function ()
    {
        $slider = $('.sn-gallery-toolbar .sn-actionlinkbutton:contains("Slider")');
        $slider.children('img').attr('src', '/Root/Global/images/icons/16/viewspreview.png');
        $slider.parent().css('border-left', 'solid 1px #ccc');
        $('.sn-gallery-toolbar .sn-disabled').parent().addClass('sn-gallery-hover');

        $eauButton = $('.editandUploadButton');

        if (!SN.Util.browserSupport(['canvas','filereader'])) {
            $eauButton.attr('disabled', 'disabled').addClass('sn-disabled');
        }


    });
</script>

<%if (this.ContextList != null && this.ContextList.Security.HasPermission(PermissionType.Save))
  {%>
  
    <sn:Toolbar ID="Toolbar1" runat="server">
        <sn:ToolbarItemGroup ID="ToolbarItemGroup1" Align="Left" runat="server">
            <sn:ActionLinkButton ID="ActionLinkButton2" runat="server" ActionName="Upload" ContextInfoID="myContext" Text="<%$ Resources: Action, Upload %>" />
            <sn:ActionLinkButton ID="ActionLinkButton1" runat="server" ActionName="EditAndUpload" ContextInfoID="myContext" Text="<%$ Resources: Action, EditAndUpload %>" CssClass="editandUploadButton" />
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
              <%= HttpUtility.HtmlEncode(SNCR.Content.Create(ViewManager.LoadViewInContext(ContextNode, LoadedViewName)).DisplayName)%>
            </sn:ActionMenu>
            <% } %>
         </sn:ToolbarItemGroup> 
    </sn:Toolbar>
<% }
else
{ %>
<sn:Toolbar ID="Toolbar2" runat="server" CssClass="sn-gallery-toolbar">
         <sn:ToolbarItemGroup ID="ToolbarItemGroup4" runat="server" Align="Right">
            <sn:ActionList ID="ActionList2" runat="server" Scenario="Views" ContextInfoID="myList" ControlPath="/Root/System/SystemPlugins/Controls/GalleryToolbar.ascx" ScenarioParameters="PortletID={PortletID};DefaultView={DefaultView}" />
         </sn:ToolbarItemGroup>   
</sn:Toolbar>
<%} %>

    <asp:Panel CssClass="sn-listview-checkbox" ID="ListViewPanel" runat="server"></asp:Panel>
</div>
