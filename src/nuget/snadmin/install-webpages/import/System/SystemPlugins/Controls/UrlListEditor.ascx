<%@ Control Language="C#" AutoEventWireup="false" Inherits="System.Web.UI.UserControl" %>

<asp:UpdatePanel id="updGridEditor" UpdateMode="Conditional" runat="server">
   <ContentTemplate>
        
        <asp:Panel ID="pnlConfigInfo" runat="server" Visible="false">
            <%=GetGlobalResourceObject("FieldControlTemplates", "Note")%>
            <br />        
        </asp:Panel>
        
        <asp:LinkButton ID="ButtonAddRow" runat="server">
            <img src="/Root/Global/images/icons/16/add.png" alt='[add]' class="sn-icon sn-icon16"/><%=GetGlobalResourceObject("FieldControlTemplates", "AddNewUrl")%>
        </asp:LinkButton>
        
        <br/><br/>

        <asp:ListView ID="InnerListView" runat="server" EnableViewState="false"  >
            <LayoutTemplate>      
                <table>
                  <tr style="background-color:#F5F5F5">  
                      <th><asp:Label runat="server" Text="<%$ Resources:FieldControlTemplates,SiteName %>" /></th>
                      <th><asp:Label runat="server" Text="<%$ Resources:FieldControlTemplates,AuthenticationType %>" /></th>
                      <th> </th>
                  </tr>
                  <tr runat="server" id="itemPlaceHolder" />
                </table>
            </LayoutTemplate>
            <ItemTemplate>
                <tr>      		
                  <td><asp:TextBox ID="TextBoxSiteName" runat="server" /></td>
	              <td><asp:DropDownList ID="ListAuthenticationType" runat="server" Width="120px" >
	                    <asp:ListItem Value="Windows" Text="<%$ Resources:FieldControlTemplates,Windows %>" />
	                    <asp:ListItem Value="Forms" Text="<%$ Resources:FieldControlTemplates,Forms %>" />
	                    <asp:ListItem Value="None" Text="<%$ Resources:FieldControlTemplates,None %>" />
	                  </asp:DropDownList></td>
                  <td><asp:Button ID="ButtonRemoveRow" runat="server" CommandName="Remove" BorderStyle="None"
                                style="background-image: url('/Root/Global/images/icons/16/delete.png'); background-color:Transparent; width:17px; height:17px"/>
                                </td>
                </tr>
            </ItemTemplate>
            <EmptyDataTemplate>
            </EmptyDataTemplate>
        </asp:ListView>       
                
    </ContentTemplate>
</asp:UpdatePanel>