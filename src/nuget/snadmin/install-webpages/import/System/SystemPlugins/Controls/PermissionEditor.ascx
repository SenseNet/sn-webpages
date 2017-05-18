<%@ Import Namespace="SenseNet.ContentRepository"%>
<%@ Import Namespace="SenseNet.ContentRepository.Storage"%>
<%@ Import Namespace="SenseNet.ContentRepository.Storage.Data" %>
<%@ Import Namespace="SenseNet.ContentRepository.Storage.Security" %>
<%@ Import Namespace="SenseNet.Services" %>
<%@ Import Namespace="SenseNet.Portal.Virtualization"%>
<%@ Control Language="C#" AutoEventWireup="false" Inherits="SenseNet.Portal.UI.Controls.PermissionEditor" %>
<sn:ScriptRequest ID="ScriptRequest1" runat="server" Path="$skin/scripts/jquery/jquery.js" />
<sn:ScriptRequest ID="ScriptRequest2" runat="server" Path="$skin/scripts/sn/SN.PermissionEditor.js" />

<sn:ContextInfo runat="server" Selector="CurrentContext" UsePortletContext="true" ID="PermissionContext" />

<script runat="server">
    string displayName = SenseNet.ContentRepository.Content.Create(PortalContext.Current.ContextNode).DisplayName;
    string owner = PortalContext.Current.ContextNode.Owner.DisplayName;
    
    int visiblePermissionCount = 19;
    
    protected override void OnInit(EventArgs e)
    {
        ((SenseNet.Portal.UI.Controls.PermissionEditor)this).VisiblePermissionCount = visiblePermissionCount;
        base.OnInit(e);
    }
</script>

<style type="text/css">
    .sn-owner-button
    {
        color: #fff;
        font-weight: bold;
        background: #007dc2;
        border: solid 1px #007dc2;
        padding: 5px 10px;
        margin: 0 5px;
        overflow: visible;
        font-family: Arial,Helvetica,sans-serif;
        font-size: 1em;
        cursor: pointer;
    }
    .hidden
    {
        display: none;
    }
</style>

  <div style="float:left"><%= SenseNet.Portal.UI.IconHelper.RenderIconTag("security", null, 32) %></div>
  <h2 class="sn-view-title"><%= displayName %></h2>
  <strong><%=GetGlobalResourceObject("Controls", "Path")%></strong> <%= PortalContext.Current.ContextNodePath %>
  <br/><br/>

<% if (SecurityHandler.HasPermission(PortalContext.Current.ContextNode.Id, PermissionType.TakeOwnership))
{ %>    
<asp:Panel ID="Panel1" runat="server">
    <div class="sn-pt-body" style="background: none; background-color: #FFFACD">
       <div ID="owner" class="sn-breadcrumb" style="float:left;">
             <%= String.Format((string)HttpContext.GetGlobalResourceObject("Portal", "PermEditor_TakeOwnership"), displayName, owner) %>
        </div>         
        <div style="float:right">
            <button type="button" class="sn-owner-button hidden" ID="makeMeTheOwner"><%= HttpContext.GetGlobalResourceObject("Portal", "PermEditor_MakeMeTheOwner") %></button>
            <button type="button" class="sn-owner-button" ID="changeOwner"><%= HttpContext.GetGlobalResourceObject("Portal", "PermEditor_ChangeOwner") %></button>            
        </div>               
    </div>
    <br/>
</asp:Panel>
<% } %>

  <asp:Panel ID="InheritanceIndicator" runat="server">
    <div class="sn-pt-body" style="background: none; background-color: #FFFACD">
        <div style="float:left;">
            <asp:Panel ID="BreakedPermission" runat="server" >
                <div class="sn-breadcrumb">
                   <%= String.Format((string)HttpContext.GetGlobalResourceObject("Portal", "PermEditor_InheritPermissionBegin"), displayName) %>
                   <asp:HyperLink ID="ParentLink" runat="server" CssClass="sn-link"></asp:HyperLink>
                   <%=HttpContext.GetGlobalResourceObject("Portal", "PermEditor_InheritPermissionEnd")%>
                </div>
            </asp:Panel>            
            <asp:Panel ID="InheritedPermission" runat="server" Enable="false">
                <div>
                    <div class="sn-breadcrumb" style="float:left;">
                        <%= String.Format((string)HttpContext.GetGlobalResourceObject("Portal","PermEditor_HasOwnPermission"), displayName) %>                    
                    </div>
                </div>
            </asp:Panel>
        </div>
        <div style="text-align:right; float:right">
            <asp:Button CssClass="sn-submit" ID="ButtonRemoveBreak" runat="server" OnClick="ButtonRemoveBreak_Click" Text="<%$ Resources: Portal, PermEditor_RemoveBreak %>" />
            <asp:Button CssClass="sn-submit" ID="ButtonBreak" runat="server" OnClick="ButtonBreak_Click" Text="<%$ Resources: Portal, PermEditor_BreakInheritance %>" />
        </div>        
        
        <% if (HasCustomPermissions())
           { %>    
           <br />   
            <div style="float:left;">
                <asp:Label runat="server" ID="LabelExplicitPermissions"><%= HttpContext.GetGlobalResourceObject("Portal", "PermEditor_HasExtended") %></asp:Label>        
            </div>    
        <% } %>
    </div>
    <br/>
</asp:Panel>

<div id="sn-permissions-edit">

<asp:UpdatePanel id="updPermissionEditor" UpdateMode="Conditional" runat="server">
   <ContentTemplate>

<asp:Panel ID="PanelError" runat="server" Visible="false" CssClass="sn-error" />

<asp:Button CssClass="sn-submit" ID="ButtonAddEntry" runat="server" OnClick="ButtonAddEntry_Click" Text="<%$ Resources: Portal, PermEditor_AddNewEntry %>" />

<asp:Panel ID="PlcAddEntry" CssClass="sn-permissions-addentry" runat="server" Visible="false" DefaultButton="ButtonSearchIdentity">

        <div class="sn-inputunit">
            <div class="sn-iu-label">
		        <label class="sn-iu-title"><%= HttpContext.GetGlobalResourceObject("Portal", "PermEditor_Type") %></label>
		    </div>
            <div class="sn-iu-control">
                <asp:RadioButtonList CssClass="sn-radiogroup sn-radiogroup-h" RepeatLayout="Flow" RepeatDirection="Horizontal" ID="RbListIdentityType" runat="server">
                    <asp:ListItem Value="User" Text="<%$ Resources:Controls,User %>" Selected="true" />
                    <asp:ListItem Value="Group" Text="<%$ Resources:Controls,Group %>" />
                    <asp:ListItem Value="OrganizationalUnit" Text="<%$ Resources:Controls,OrganizationalUnit %>" />
                </asp:RadioButtonList>
            </div>
        </div>

        <div class="sn-inputunit">
            <div class="sn-iu-label">
		        <label class="sn-iu-title"><%= HttpContext.GetGlobalResourceObject("Portal", "PermEditor_SearchName") %></label>
		    </div>
            <div class="sn-iu-control">
                <asp:TextBox CssClass="sn-ctrl sn-ctrl-text" ID="SearchText" runat="server" />
                <asp:Button CssClass="sn-submit" ID="ButtonSearchIdentity" runat="server" Text="<%$ Resources: Portal, PermEditor_BtnSearch %>" OnClick="ButtonSearchId_Click" />
            </div>
        </div>

        <div class="sn-inputunit">
            <div class="sn-iu-label">
		        <label class="sn-iu-title"><%= HttpContext.GetGlobalResourceObject("Portal", "PermEditor_ChooseEntry")%></label>
		    </div>
            <div class="sn-iu-control">
                <asp:ListBox CssClass="sn-ctrl sn-ctrl-select" ID="ListEntries" runat="server" Rows="5" SelectionMode="Multiple" Width="100%" />
		    </div>
        </div>

        <div class="sn-inputunit">
            <div class="sn-iu-label">
		        <label class="sn-iu-title"><%= HttpContext.GetGlobalResourceObject("Portal", "PermEditor_LocalOnlyEntry")%></label>
		    </div>
            <div class="sn-iu-control">
                <asp:CheckBox ID="CheckBoxLocalOnly" runat="server" />
		    </div>
        </div>
        
        <div class="sn-panel sn-buttons">
            <asp:Button CssClass="sn-submit" ID="ButtonAddSelectedItem" runat="server" OnClick="ButtonAddSelected_Click" Text="<%$ Resources: Portal, PermEditor_BtnAdd %>" /> 
            <asp:Button CssClass="sn-submit" ID="ButtonCancelAddIdentity" runat="server" OnClick="ButtonCancelAddId_Click" Text="<%$ Resources: Portal, PermEditor_BtnCancel %>" />
		</div>
    
</asp:Panel>

<asp:ListView ID="ListViewAcl" runat="server" EnableViewState="false" >
   <LayoutTemplate>
        <div style="margin-top:10px">
          <div class="sn-permissions-entry" runat="server" id="itemPlaceHolder"></div>
        </div>      
   </LayoutTemplate>
   <ItemTemplate>

         <h2 class="sn-permissions-title" style="clear:both">
            <div style="float:left">
                <asp:Label ID="LabelHiddenAce" runat="server" Visible="false" />
                <asp:Button runat="server" ID="ButtonVisibleAcePanel" Text="<%$ Resources:Controls,ShowHide %>" OnClick="ButtonAcePanelVisible_Click" />
                <asp:LinkButton runat="server" id="LinkIdentityName" OnClick="ButtonAcePanelVisible_Click">
                <asp:Label CssClass="sn-icon-button sn-icon-big" id="LabelIcon" runat="server"></asp:Label><asp:Label ID="LabelIdentityName" runat="server" />
                </asp:LinkButton>
                <asp:PlaceHolder runat="server" ID="LabelInherited" Visible='<%# !this.CustomEntryIds.Contains((Container.DataItem as SnAccessControlEntry).Identity.NodeId) %>'> <span style="background-color:#FFFACD;color:Black;font-size:small;font-weight:normal"><%=GetGlobalResourceObject("Controls", "Inherited")%></span></asp:PlaceHolder>
                <asp:PlaceHolder runat="server" ID="LabelPropagates" Visible='<%# !(Container.DataItem as SnAccessControlEntry).Propagates %>'> <span style="background-color:#E85743;color:White;font-size:small;font-weight:normal"><%=GetGlobalResourceObject("Controls", "LocalOnlyPermission")%></span></asp:PlaceHolder>
            </div>
            <div style="float:right;">            
                <sn:ActionLinkButton ID="ActionLinkButtonEditMembers" runat="server" ActionName="Edit" 
                    NodePath='<%# (Container.DataItem as SnAccessControlEntry).Identity.Path %>' Text="<%$ Resources: Portal, PermEditor_EditMembers %>" IconName="group"
                    Visible='<%# Node.LoadNode((Container.DataItem as SnAccessControlEntry).Identity.Path).NodeType.IsInstaceOfOrDerivedFrom("Group") && !SenseNet.Configuration.Identifiers.SpecialGroupPaths.Contains((Container.DataItem as SnAccessControlEntry).Identity.Path) %>' />

            </div>
         </h2>

         <asp:PlaceHolder ID="PanelAce" runat="server">
         <div class="sn-inputunit">
            
            <div class="sn-iu-label">
                <asp:Label ID="LabelTitle1" runat="server" CssClass="sn-iu-title" Text="<%$ Resources: Portal, PermEditor_PermSettings %>" />
                <br />
			    <label class="sn-iu-desc"></label>
			</div>
           
           <div class="sn-iu-control">
               <asp:ListView ID="ListViewAce" runat="server" EnableViewState="false" >
                   <LayoutTemplate>      
                       <table class="sn-permissions">
                         <tr>
                             <th style="width:400px"><asp:Label ID="LabelHeader1" runat="server" Text="<%$ Resources: Portal, PermEditor_Permission %>" /></th>
                             <th class="center" style="width:50px">
                                    <asp:CheckBox id="cbToggle1" runat="server" CssClass="sn-checkbox sn-checkbox-toggleall" ToolTip="<%$ Resources: Portal, PermEditor_ToggleAll %>" /><br />
                                    <asp:Label ID="LabelHeader3" runat="server" Text="<%$ Resources: Portal, PermEditor_Allow %>" /></th>
                             <th style="width:175px"><asp:Label ID="LabelHeader4" runat="server" Text="<%$ Resources: Portal, PermEditor_InheritsFrom %>" /></th>
                             <th class="center" style="width:50px">
                                    <asp:CheckBox id="cbToggle2" runat="server" CssClass="sn-checkbox sn-checkbox-toggleall" ToolTip="<%$ Resources: Portal, PermEditor_ToggleAll %>" /><br />
                                    <asp:Label ID="LabelHeader5" runat="server" Text="<%$ Resources: Portal, PermEditor_Deny %>" /></th>
                             <th style="width:175px"><asp:Label ID="LabelHeader6" runat="server" Text="<%$ Resources: Portal, PermEditor_InheritsFrom %>" /></th>
                             <th style="width:50px"><asp:Label ID="LabelHeader7" runat="server" Text="<%$ Resources: Portal, PermEditor_Effective %>" /></th>
                         </tr>
                         <tr runat="server" id="itemPlaceHolder" />
                       </table>
                   </LayoutTemplate>
                   <ItemTemplate>
                       <tr class="<%# Container.DisplayIndex % 2 == 0 ? "row0" : "row1" %>">      		
                         <td><asp:Label ID="LabelPermissionName" runat="server" Text='<%# HttpContext.GetGlobalResourceObject("Portal", "Permission_" + Eval("Name")) as string %>' />
                             <asp:Label ID="LabelHidden" runat="server" Visible="false" />
                         </td>
                         <td class="center"><asp:CheckBox ID="CbPermissionAllow" runat="server" Checked='<%# Eval("Allow") %>' Enabled='<%# Eval("AllowEnabled") %>' OnCheckedChanged="CbAllow_CheckedChanged" /></td>
                         <td><asp:Label CssClass="sn-path" ID="LabelAllowInheritsFrom" runat="server" Text='<%# Eval("AllowFrom") == null ? string.Empty : Eval("AllowFrom").ToString().Substring(Eval("AllowFrom").ToString().LastIndexOf("/") + 1) %>' ToolTip='<%# Eval("AllowFrom") %>' /></td>    	                   
                         <td class="center"><asp:CheckBox ID="CbPermissionDeny" runat="server" Checked='<%# Eval("Deny") %>' Enabled='<%# Eval("DenyEnabled") %>' OnCheckedChanged="CbDeny_CheckedChanged" /></td>
                         <td><asp:Label CssClass="sn-path" ID="LabelDenyInheritsFrom" runat="server" Text='<%# Eval("DenyFrom") == null ? string.Empty : Eval("DenyFrom").ToString().Substring(Eval("DenyFrom").ToString().LastIndexOf("/") + 1) %>' ToolTip='<%# Eval("DenyFrom") %>' /></td>    	                   
                         <td class="center"><span class="ui-icon ui-icon-check" title="<%=GetGlobalResourceObject("Controls", "Allow")%>"></span><span class="ui-icon ui-icon-closethick" title="<%=GetGlobalResourceObject("Controls", "Deny")%>"></span></td>
                       </tr>
                   </ItemTemplate>
              </asp:ListView>   
           </div>
         
         </div>
         </asp:PlaceHolder>   
   
   </ItemTemplate>
</asp:ListView>   

<sn:InlineScript ID="InlineScript1" runat="server">
<script type="text/javascript">

    $(function () {
        var dep = <% = GetPermissionDependencies() %>;

        // Initialize permission tables
        $(".sn-permissions").each(function () {
            var $table = $(this);
            var $allowall = $("tr:first th:nth-child(2) :checkbox", this);
            var $denyall = $("tr:first th:nth-child(4) :checkbox", this);
            var $effectiveallow = $(".ui-icon-check", this);
            var $effectivedeny = $(".ui-icon-closethick", this);
            var $allowcheckboxes = $("tr td:nth-child(2) :checkbox", this);
            var $denycheckboxes = $("tr td:nth-child(4) :checkbox", this);
            var $enabled_allowcheckboxes = $allowcheckboxes;
            var $enabled_denycheckboxes = $denycheckboxes;
            var visiblePermissionCount = <% = visiblePermissionCount %>;

            function snRefreshPermissionCol() {
                $allowcheckboxes.each(function (idx) {
                    if ($denycheckboxes.eq(idx).is(":checked")) {
                        $effectivedeny.eq(idx).show();
                        $effectiveallow.eq(idx).hide();
                    } else {
                        if ($allowcheckboxes.eq(idx).is(":checked")) {
                            $effectivedeny.eq(idx).hide();
                            $effectiveallow.eq(idx).show();
                        } else {
                            $effectivedeny.eq(idx).show();
                            $effectiveallow.eq(idx).hide();
                        }
                    }
                });
            }

            ($allowcheckboxes.filter(":not(:checked)").length > 0) ? $allowall.removeAttr("checked") : $allowall.attr("checked", "checked");
            ($enabled_allowcheckboxes.length > 0) ? $allowall.removeAttr("disabled") : $allowall.attr("disabled", "disabled");
            ($denycheckboxes.filter(":not(:checked)").length > 0) ? $denyall.removeAttr("checked") : $denyall.attr("checked", "checked");
            ($enabled_denycheckboxes.length > 0) ? $denyall.removeAttr("disabled") : $denyall.attr("disabled", "disabled");
            snRefreshPermissionCol();

            for (var y = 0; y < visiblePermissionCount; y++) {
                $allowcheckboxes.eq(y).click(function () {
                    var y = parseInt($(this).attr("data-index"));
                    var s = "y: ";
                    if ($(this).is(":checked")) {
                        for (var x = 0; x < visiblePermissionCount; x++) {
                            if (dep[y][x] == 1) {
                                // allow on
                                $allowcheckboxes.eq(x).attr("checked", "checked");
                                $denycheckboxes.eq(x).removeAttr("checked");
                            }
                        }
                    } else {
                        for (var x = 0; x < visiblePermissionCount; x++) {
                            if (dep[x][y] == 1) {
                                // allow off
                                $allowcheckboxes.eq(x).removeAttr("checked");
                            }
                        }
                    }
                });
                $denycheckboxes.eq(y).click(function () {
                    var y = parseInt($(this).attr("data-index"));
                    if ($(this).is(":checked")) {
                        for (var x = 0; x < visiblePermissionCount; x++) {
                            if (dep[x][y] == 1) {
                                // deny on
                                $denycheckboxes.eq(x).attr("checked", "checked");
                                $allowcheckboxes.eq(x).removeAttr("checked");
                            }
                        }
                    } else {
                        for (var x = 0; x < visiblePermissionCount; x++) {
                            if (dep[y][x] == 1) {
                                // deny off
                                $denycheckboxes.eq(x).removeAttr("checked");
                            }
                        }
                    }
                });
            }

            $allowall.click(function () {
                if ($(this).is(":checked")) {
                    $allowcheckboxes.filter(":enabled").attr("checked", "checked");
                    if ($denyall.is(":enabled")) $denyall.removeAttr("checked");
                    $denycheckboxes.filter(":enabled").removeAttr("checked");
                } else {
                    $allowcheckboxes.removeAttr("checked")
                        .filter("[data-inheritvalue]").attr("disabled", "disabled")
                        .filter("[data-inheritvalue='true']").attr("checked", "checked");
                }
                snRefreshPermissionCol();
            });
            $denyall.click(function () {
                if ($(this).is(":checked")) {
                    $denycheckboxes.attr("checked", "checked");
                    if ($allowall.is(":enabled")) $allowall.removeAttr("checked");
                    $allowcheckboxes.filter(":enabled").removeAttr("checked");
                } else {
                    $denycheckboxes.removeAttr("checked")
                        .filter("[data-inheritvalue]").attr("disabled", "disabled")
                        .filter("[data-inheritvalue='true']").attr("checked", "checked");
                }
                snRefreshPermissionCol();
            });

            $allowcheckboxes.click(function (index) {
                var $this = $(this);
                var idx = $allowcheckboxes.index($this);
                if ($this.is(":checked")) {
                    if ($denycheckboxes.eq(idx).is(":enabled")) $denycheckboxes.eq(idx).removeAttr("checked");
                    if ($denyall.is(":enabled")) $denyall.removeAttr("checked");
                    if ($allowcheckboxes.filter(":not(:checked)").length == 0) $allowall.attr("checked", "checked");
                } else {
                    if ($allowall.is(":enabled")) $allowall.removeAttr("checked");
                }
                snRefreshPermissionCol();
            });

            $denycheckboxes.click(function () {
                var $this = $(this);
                var idx = $denycheckboxes.index($this);
                if ($this.is(":checked")) {
                    if ($allowcheckboxes.eq(idx).is(":enabled")) $allowcheckboxes.eq(idx).removeAttr("checked");
                    if ($allowall.is(":enabled")) $allowall.removeAttr("checked");
                    if ($denycheckboxes.filter(":not(:checked)").length == 0) $denyall.attr("checked", "checked");
                } else {
                    if ($denyall.is(":enabled")) $denyall.removeAttr("checked");
                }
                snRefreshPermissionCol();
            });

        });

    });
</script>
</sn:InlineScript>

</ContentTemplate>
</asp:UpdatePanel>

<div style="clear:both;"></div>

<div class="sn-panel sn-buttons">
    <asp:Button CssClass="sn-submit" ID="ButtonSave" runat="server" Text="<%$ Resources: Portal, PermEditor_BtnSave %>" OnClick="ButtonSave_Click" />
    <sn:BackButton Text="<%$ Resources: Portal, PermEditor_BtnCancel %>" ID="BackButton1" runat="server" CssClass="sn-submit" />
</div>

</div>
