<%@ Control Language="C#" AutoEventWireup="false" Inherits="System.Web.UI.UserControl" %>
<%@ Register Src="~/Root/System/SystemPlugins/Controls/AdvancedPanelButton.ascx" TagName="AdvancedFieldsButtonControl" TagPrefix="sn" %>
<%@ Import Namespace="System.Web" %>

<sn:ScriptRequest ID="request1" runat="server" Path="$skin/scripts/sn/SN.ColumnSelector.js" />

        <asp:ListView ID="InnerListView" runat="server" EnableViewState="false" >
            <LayoutTemplate>      
                <table style="width:100%" >
                  <tr style="background-color:#F5F5F5">  
                      <th><asp:Literal ID="Literal1" runat="server" Text="<%$ Resources: ManageFields, FieldDisplay %>" /></th>	                
                      <th style="width:205px"><asp:Literal ID="Literal2" runat="server" Text="<%$ Resources: ManageFields, FieldTitle %>" /></th>	   
                      <th><asp:Literal ID="Literal3" runat="server" Text="<%$ Resources: ManageFields, FieldTypeShort %>" /></th>    
                      <th><asp:Literal ID="Literal4" runat="server" Text="<%$ Resources: ManageFields, FieldWidth %>" /></th>    
                      <th><asp:Literal ID="Literal5" runat="server" Text="<%$ Resources: ManageFields, FieldAlign %>" /></th>    
                      <th><asp:Literal ID="Literal6" runat="server" Text="<%$ Resources: ManageFields, FieldWrap %>" /></th> 
                      <th><asp:Literal ID="Literal7" runat="server" Text="<%$ Resources: ManageFields, FieldPosition %>" /></th>           
                  </tr>
                  <tr runat="server" id="itemPlaceHolder" />
                </table>
            </LayoutTemplate>
            <ItemTemplate>
                <tr>      		
                  <td style="text-align:center"><asp:CheckBox id="cbField" runat="server" /></td>    	 
                  <td><%# HttpUtility.HtmlEncode(Eval("Title"))%>  <asp:Label ID="lblColumnFullName" runat="server" Visible="false" Text='<%# HttpUtility.HtmlEncode(Eval("FullName")) %>' /></td>
                  <td><asp:Label ID="lblColumnType" runat="server" /> </td>
                  <td><asp:TextBox id="tbWidth" runat="server" Width="30" /></td>    	 
                  <td><asp:DropDownList ID="ddHAlign" runat="server" Width="60px"></asp:DropDownList></td> 
                  <td><asp:DropDownList ID="ddWrap" runat="server" Width="65px"></asp:DropDownList></td> 
	              <td><asp:DropDownList ID="ddIndex" runat="server" Width="50px" onchange="SN.ColumnSelector.rearrangeSelects(this);"></asp:DropDownList></td> 
                </tr>
            </ItemTemplate>
            <EmptyDataTemplate>
                <asp:Literal ID="LiteralNo1" runat="server" Text="<%$ Resources: ManageFields, NoFields %>" />
            </EmptyDataTemplate>
        </asp:ListView>   
        
        <sn:AdvancedFieldsButtonControl runat="server" ID="AdvancedFieldsButton"/> <br/>
        
        <asp:Panel runat="server" ID="AdvancedPanel" style="display:none" >        
            <asp:ListView ID="InnerListViewAdvanced" runat="server" EnableViewState="false"  >
                <LayoutTemplate>      
                    <table style="width:100%" >
                      <tr style="background-color:#F5F5F5">  
                          <th><asp:Literal ID="Literal9" runat="server" Text="<%$ Resources: ManageFields, FieldDisplay %>" /></th>	                
                      <th style="width:205px"><asp:Literal ID="Literal2" runat="server" Text="<%$ Resources: ManageFields, FieldTitle %>" /></th>	   
                      <th><asp:Literal ID="Literal10" runat="server" Text="<%$ Resources: ManageFields, FieldTypeShort %>" /></th>    
                      <th><asp:Literal ID="Literal11" runat="server" Text="<%$ Resources: ManageFields, FieldWidth %>" /></th>    
                      <th><asp:Literal ID="Literal12" runat="server" Text="<%$ Resources: ManageFields, FieldAlign %>" /></th>    
                      <th><asp:Literal ID="Literal13" runat="server" Text="<%$ Resources: ManageFields, FieldWrap %>" /></th> 
                      <th><asp:Literal ID="Literal14" runat="server" Text="<%$ Resources: ManageFields, FieldPosition %>" /></th>        
                      </tr>
                      <tr runat="server" id="itemPlaceHolder" />
                    </table>
                </LayoutTemplate>
                <ItemTemplate>
                    <tr>      		
                      <td style="text-align:center"><asp:CheckBox id="cbField" runat="server" /></td>    	 
                      <td><%# HttpUtility.HtmlEncode(Eval("Title")) %>  <asp:Label ID="lblColumnFullName" runat="server" Visible="false" Text='<%# HttpUtility.HtmlEncode(Eval("FullName")) %>' /></td>
                      <td><asp:Label ID="lblColumnType" runat="server" /> </td>
                      <td><asp:TextBox id="tbWidth" runat="server" Width="30" /></td>    	 
                      <td><asp:DropDownList ID="ddHAlign" runat="server" Width="60px"></asp:DropDownList></td> 
                      <td><asp:DropDownList ID="ddWrap" runat="server" Width="65px"></asp:DropDownList></td> 
	                  <td><asp:DropDownList ID="ddIndex" runat="server" Width="50px" onchange="SN.ColumnSelector.rearrangeSelects(this);"></asp:DropDownList></td> 
                    </tr>
                </ItemTemplate>
                <EmptyDataTemplate>
                    <asp:Literal ID="LiteralNo2" runat="server" Text="<%$ Resources: ManageFields, NoFields %>" />
                </EmptyDataTemplate>
            </asp:ListView>   
        </asp:Panel>