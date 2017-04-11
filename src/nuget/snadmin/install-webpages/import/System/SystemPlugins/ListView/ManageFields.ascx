<%@ Control Language="C#" AutoEventWireup="false" Inherits="System.Web.UI.UserControl" %>
<%@ Import Namespace="SNCR=SenseNet.ContentRepository" %>
<%@ Import Namespace="SenseNet.ContentRepository.Schema" %>
<%@ Import Namespace="SenseNet.Portal.UI.ContentListViews" %>

<sn:SenseNetDataSource ID="SNDSReadOnlyFields" ContextInfoID="ViewContext" MemberName="AvailableContentTypeFields" FieldNames="Name DisplayName ShortName Owner" runat="server"  />
<sn:SenseNetDataSource ID="ViewDatasource" ContextInfoID="ViewContext" MemberName="FieldSettingContents" FieldNames="Name DisplayName ShortName" runat="server" DefaultOrdering="FieldIndex" />
<sn:ContextInfo ID="ViewContext" runat="server" />    
<sn:ContextInfo runat="server" Selector="CurrentContext" ID="myContext" />

<div class="sn-listview">
    
    <h2 class="sn-content-title"><%=GetGlobalResourceObject("ManageFields", "ReadonlyFields")%></h2>

    <div class="sn-listgrid-container">
    <asp:ListView ID="ViewReadOnlyFields" DataSourceID="SNDSReadOnlyFields" runat="server" >
      <LayoutTemplate>
        <table class="sn-listgrid ui-widget-content">
            <thead>
                <tr id="Tr3" runat="server" class="ui-widget-content">
                    <th class="sn-lg-col-1 ui-state-default"><%=GetGlobalResourceObject("ManageFields", "FieldTitle")%></th>        
                    <th class="sn-lg-col-2 ui-state-default"><%=GetGlobalResourceObject("ManageFields", "FieldType")%></th>
                    <th class="sn-lg-col-3 ui-state-default"><%=GetGlobalResourceObject("ManageFields", "UsedIn")%></th>
                </tr>
            </thead>
            <tbody>
                <tr runat="server" id="itemPlaceHolder" />
            </tbody>
        </table>
      </LayoutTemplate>
      <ItemTemplate>
                <tr id="Tr5" runat="server" class='<%# Container.DisplayIndex % 2 == 0 ? "sn-lg-row0" : "sn-lg-row1" %> ui-widget-content'>      
                  <td class="sn-lg-col-1"><%# HttpUtility.HtmlEncode(Eval("DisplayName")) %></td>    
                  <td class="sn-lg-col-2"><%# HttpUtility.HtmlEncode(ListHelper.GetFieldTypeDisplayName(Eval("ShortName").ToString())) %></td>    
                  <td class="sn-lg-col-3"><%# SNCR.Content.Create(((ContentType)((SNCR.Content)Container.DataItem)["Owner"])).DisplayName %></td>     
                </tr>
      </ItemTemplate>
    </asp:ListView>
    </div>

    <sn:Toolbar runat="server">
        <sn:ActionMenu runat="server" IconUrl="/Root/Global/images/icons/16/addfield.png" Scenario="AddField" ContextInfoID="myContext" ><%=GetGlobalResourceObject("ManageFields", "Add")%></sn:ActionMenu>
    </sn:Toolbar>

    <br />
    <h2 class="sn-content-title"><%=GetGlobalResourceObject("ManageFields", "EditableFields")%></h2>

    <div class="sn-listgrid-container">
    <asp:ListView ID="ViewBody" DataSourceID="ViewDatasource" runat="server" >
      <LayoutTemplate>
        <table class="sn-listgrid ui-widget-content">
          <thead>
              <tr id="Tr1" runat="server" class="ui-widget-content">                
                <th class="sn-lg-col-2 ui-state-default"><%=GetGlobalResourceObject("ManageFields", "FieldTitle")%></th>        
                <th class="sn-lg-col-3 ui-state-default"><%=GetGlobalResourceObject("ManageFields", "FieldType")%></th>
                <th class="sn-lg-col-1 ui-state-default" width="110px">&nbsp;</th>
              </tr>
          </thead>  
          <tbody>
              <tr runat="server" id="itemPlaceHolder" />
          </tbody>
        </table>
      </LayoutTemplate>
      <ItemTemplate>
        <tr id="Tr2" runat="server" class='<%# Container.DisplayIndex % 2 == 0 ? "sn-lg-row0" : "sn-lg-row1" %> ui-widget-content'>                   
          <td class="sn-lg-col-2"><%# HttpUtility.HtmlEncode(Eval("DisplayName")) %></td>
          <td class="sn-lg-col-3"><%# HttpUtility.HtmlEncode(ListHelper.GetFieldTypeDisplayName(Eval("ShortName").ToString()))%></td>    
          <td class="sn-lg-col-1"  width="110px">
              <sn:ActionLinkButton CssClass="sn-icononly" ContextInfoID="myContext" ActionName="EditField" IconName="edit" ToolTip="<%$ Resources:ManageFields,Edit %>" ParameterString='<%# "FieldName=" + HttpUtility.UrlEncode(Eval("Name").ToString()) %>' runat="server" />
              <sn:ActionLinkButton CssClass="sn-icononly" ContextInfoID="myContext" ActionName="MoveField" IconName="up" ToolTip="<%$ Resources:ManageFields,MoveUp %>" ParameterString='<%# "Direction=Up&FieldName=" + HttpUtility.UrlEncode(Eval("Name").ToString()) %>' runat="server" />
              <sn:ActionLinkButton CssClass="sn-icononly" ContextInfoID="myContext" ActionName="MoveField" IconName="down" ToolTip="<%$ Resources:ManageFields,MoveDown %>" ParameterString='<%# "Direction=Down&FieldName=" + HttpUtility.UrlEncode(Eval("Name").ToString()) %>' runat="server" />
              <sn:ActionLinkButton CssClass="sn-icononly" ContextInfoID="myContext" ActionName="DeleteField" IconName="delete" ToolTip="<%$ Resources:ManageFields,Delete %>" ParameterString='<%# "FieldName=" + HttpUtility.UrlEncode(Eval("Name").ToString()) %>' runat="server" />
          </td> 
        </tr>
      </ItemTemplate>
      <EmptyDataTemplate>
        <table class="sn-listgrid ui-widget-content">
          <thead>
          <tr id="Tr4" runat="server" class="ui-widget-content">          	  
              <th class="sn-lg-col-1 ui-state-default"><%=GetGlobalResourceObject("ManageFields", "FieldTitle")%></th>
              <th class="sn-lg-col-2 ui-state-default"><%=GetGlobalResourceObject("ManageFields", "FieldType")%></th>
          </tr>
          </thead>
          <tbody>
          <tr class="ui-widget-content">
            <td colspan="2" class="sn-lg-col">
               <%=GetGlobalResourceObject("ManageFields", "NoEditable")%>      
            </td>
          </tr>
          </tbody>
        </table>
      </EmptyDataTemplate>
    </asp:ListView>
    </div>    

    <div class="sn-panel sn-buttons">
      <sn:BackButton CssClass="sn-submit" Text="<%$ Resources:ManageFields,Done %>" runat="server" ID="BackButton" />
    </div>
    
</div>
