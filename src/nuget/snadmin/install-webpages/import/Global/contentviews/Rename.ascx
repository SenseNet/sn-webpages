<%@ Control Language="C#" AutoEventWireup="true" Inherits="SenseNet.Portal.UI.SingleContentView" %>

<div>
    <asp:PlaceHolder ID="DisplayNamePlaceHolder" runat="server">
        <sn:DisplayName ID="Name" runat="server" FieldName="DisplayName" ControlMode="Edit" FrameMode="ShowFrame" AlwaysUpdateName="true" />
    </asp:PlaceHolder>

    <asp:PlaceHolder ID="NamePlaceHolder" runat="server">
        <sn:Name ID="UrlName" runat="server" FieldName="Name" ControlMode="Edit" FrameMode="ShowFrame" />
    </asp:PlaceHolder>
</div>
