<%@ Control Language="C#" AutoEventWireup="true" Inherits="System.Web.UI.UserControl" %>
<%@ Import Namespace="SenseNet.Portal.UI.Controls" %>

<input type="submit" value="Reject" onclick="<%= ClientDialogButton.GetOpenDialogScript("#RejectReasonDialog", "Reject content") %>" id="OpenRejectReasonDialog" title="Reject" class="sn-submit sn-notdisabled" role="button" aria-disabled="false" />

<div id="RejectReasonDialog" class="sn-panel sn-hide">

    <h3><%=GetGlobalResourceObject("Controls", "Provide")%></h3> 

    <asp:TextBox ID="CommentsTextBox" runat="server" Width="97%" CssClass="sn-ctrl sn-ctrl-text sn-ctrl-textarea sn-clientdialogcomments" TextMode="MultiLine"></asp:TextBox>

    <div class="sn-panel sn-buttons">
        <asp:Button CssClass="sn-submit sn-rejectbutton sn-disabled" Text="<%$ Resources:Controls,Reject %>" ID="RejectDialogButton" runat="server" CommandName="Reject" disabled="disabled"/>
        <input type="button" value='<%=GetGlobalResourceObject("Controls", "Cancel")%>' class="sn-submit sn-notdisabled" onclick="<%= ClientDialogButton.GetCloseDialogScript("#RejectReasonDialog") %>" />
    </div>
</div>

<script type="text/javascript">
    $(".sn-clientdialogcomments").bind('change keyup', function () {
        if ($(this).val().length == 0) {
            $('.sn-rejectbutton').addClass('sn-disabled');
            $('.sn-rejectbutton').attr('disabled', 'disabled');
        } else {
            $('.sn-rejectbutton').removeClass('sn-disabled');
            $('.sn-rejectbutton').removeAttr('disabled');
        }
    });
</script>