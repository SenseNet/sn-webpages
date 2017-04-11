<%@ Control Language="C#" AutoEventWireup="false" Inherits="System.Web.UI.UserControl" %>

<asp:UpdatePanel id="updGridEditor" UpdateMode="Conditional" runat="server">
   <ContentTemplate>
        
        <asp:LinkButton ID="ButtonAddRow" runat="server">
            <img src="/Root/Global/images/icons/16/add.png" alt='[add]' class="sn-icon sn-icon16"/><asp:Literal runat="server" ID="LiteralAdd" Text='<%$ Resources:FieldControlTemplates,ChoiceOptionEditor_AddOption %>' />
        </asp:LinkButton>
        
        <br />

        <asp:ListView ID="InnerListView" runat="server" EnableViewState="false" >
            <LayoutTemplate>      
                <table >
                  <tr style="background-color:#F5F5F5">  
                      <th><asp:Literal runat="server" ID="Literal1" Text='<%$ Resources:FieldControlTemplates,ChoiceOptionEditor_Value %>' /></th>	   
                      <th><asp:Literal runat="server" ID="Literal2" Text='<%$ Resources:FieldControlTemplates,ChoiceOptionEditor_Text %>' /></th>    
                      <th> </th>
                  </tr>
                  <tr runat="server" id="itemPlaceHolder" />
                </table>
            </LayoutTemplate>
            <ItemTemplate>
                <tr>      		
                  <td><asp:TextBox ID="tbOptionValue" runat="server" /></td> 	              
	              <td><asp:TextBox ID="tbOptionText" runat="server" /></td>
                  <td><asp:Button ID="ButtonRemoveRow" runat="server" CommandName="Remove" BorderStyle="None" 
                        style="background-image: url('/Root/Global/images/icons/16/delete.png'); background-color:Transparent;" /></td>
                </tr>
            </ItemTemplate>
            <EmptyDataTemplate>
            </EmptyDataTemplate>
        </asp:ListView>   
        
    </ContentTemplate>
</asp:UpdatePanel>