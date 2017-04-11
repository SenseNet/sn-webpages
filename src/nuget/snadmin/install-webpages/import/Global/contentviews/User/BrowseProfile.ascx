<%@ Control Language="C#" AutoEventWireup="true" Inherits="SenseNet.Portal.UI.SingleContentView" EnableViewState="false" %>
<%@ Import Namespace="SenseNet.ContentRepository" %>
<%@ Import Namespace="SenseNet.ContentRepository.Storage" %>
<%@ Import Namespace="SenseNet.Portal.Helpers" %>
<%@ Import Namespace="SenseNet.ContentRepository.i18n" %>

<% 
    var email = this.Content["Email"] as string;
    var phone = this.Content["Phone"] as string;
    var managerRefList = this.Content["Manager"] as IEnumerable<Node>;
    var manager = managerRefList == null ? null : managerRefList.FirstOrDefault() as User;
    var department = this.Content["Department"] as string;
    var languages = this.Content["Languages"] as string;
    var education = this.Content["Education"] as string;
    
    var username = User.Current.Username;
    var profileUsername = ((User) this.Content.ContentHandler).Username;
%>

<div class="sn-user-properties">
    <sn:Image ID="Image" CssClass="sn-avatar" runat="server" FieldName="Avatar" RenderMode="Browse">
        <browsetemplate>
            <asp:Image CssClass="sn-avatar" ImageUrl="/Root/Global/images/default_avatar.png" ID="ImageControl" runat="server" alt="<%$ Resources: Content, Missing %>" title="" />
        </browsetemplate>
    </sn:Image>
    
    <h1 class="sn-content-title"><%= GetValue("FullName") %></h1>

    <% if((username == profileUsername)) { %>
    <sn:ActionLinkButton ID="BtnEdit"   runat="server" ActionName="EditProfile" Text="<%$ Resources:Content, EditProfile%>" /><br />
    <sn:ActionLinkButton ID="alButton1" runat="server" ActionName="Notifications" Text="<%$ Resources:Content, Notifications%>"/><br />
    <sn:ActionLinkButton ID="alButton2" runat="server" ActionName="SetPermissions" Text="<%$ Resources:Content, Permissions%>" />
    <% } %>

    <dl>
        <dt><%=GetGlobalResourceObject("Content", "UserName")%></dt><dd><%= profileUsername %></dd>
    <% if (!string.IsNullOrEmpty(email)) { %><dt>E-mail:</dt><dd><a href='mailto:<%= GetValue("Email")%>'><%= email %></a></dd>  <% } %>
    <% if (!string.IsNullOrEmpty(phone)) { %><dt><%= SenseNetResourceManager.Current.GetString("UserBrowse", "PhoneLabel") %>:</dt><dd><%= phone %></dd>  <% } %>
    <% if (manager != null) { %>
        <dt><%= SenseNetResourceManager.Current.GetString("UserBrowse", "ManagerLabel")%>:</dt>
        <dd><a href='<%= Actions.ActionUrl(SenseNet.ContentRepository.Content.Create(manager), "Profile") %>' title="[manager]"><%= manager.FullName %></a></dd>
    <% } %>
    <% if (!string.IsNullOrEmpty(department)) { %>
        <dt><%= SenseNetResourceManager.Current.GetString("UserBrowse", "DepartmentLabel") %>:</dt><dd><%= department%></dd>
    <% } %>
    <% if (!string.IsNullOrEmpty(languages)) { %>
        <dt><%= SenseNetResourceManager.Current.GetString("UserBrowse", "LanguagesLabel")%>:</dt><dd><%= languages%></dd>
    <% } %>
    <% if (!UserProfiles.IsEducationEmpty(education)) { %>
        <dt><%=GetGlobalResourceObject("Content", "Education")%></dt>
        <dd>
            <sn:EducationEditor ID="Edutor" FieldName="Education" runat="server" FrameMode="NoFrame">
                <browsetemplate>
                <asp:ListView ID="InnerListView" runat="server" EnableViewState="false">
                    <LayoutTemplate>
                            <asp:placeholder runat="server" id="itemPlaceHolder" />
                    </LayoutTemplate>
                    <ItemTemplate>
                        <span><%# DataBinder.Eval(Container.DataItem, "SchoolName")%></span>
                    </ItemTemplate>
                    <ItemSeparatorTemplate>,</ItemSeparatorTemplate>
                    <EmptyDataTemplate>
                    </EmptyDataTemplate>
                </asp:ListView>
                </browsetemplate>
            </sn:EducationEditor>
        </dd>
    <% } %>

    </dl>

</div>
