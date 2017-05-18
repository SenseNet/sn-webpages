<%@ Control Language="C#" AutoEventWireup="false" Inherits="System.Web.UI.UserControl" %>
<div class="sn-pt-body-border ui-widget-content">
    <div class="sn-pt-body">
        <div class="sn-error-msg">
            <%=GetGlobalResourceObject("ContentPublish", "ErrorMessage")%>
        </div>
    </div>
</div>
<div class="sn-pt-body-border ui-widget-content sn-dialog-buttons">
    <div class="sn-pt-body">
        <sn:backbutton text="<%$ Resources:ContentPublish,Done %>" id="DoneButton" runat="server" cssclass="sn-submit"/>
    </div>
</div>
