<%@  Language="C#" %>
<%@ Import Namespace="System.Globalization" %>
<%@ Import Namespace="SenseNet.Portal.UI" %>
<%@ Import Namespace="SNControls=SenseNet.Portal.UI.Controls" %>
<%@ Import Namespace="SNFields=SenseNet.ContentRepository.Fields" %>
<%@ Import Namespace="SenseNet.ContentRepository.Storage" %>
<%@ Import Namespace="SenseNet.Portal.UI" %>

<sn:ScriptRequest ID="ScriptRequest1" runat="server" Path='<%# ((SNControls.DatePicker)Container).Mode == SNFields.DateTimeMode.None ? string.Empty : "$skin/scripts/jqueryui/minified/jquery-ui.min.js" %>' />
<sn:ScriptRequest ID="ScriptRequest2" runat="server" Path='<%# ((SNControls.DatePicker)Container).GetjqueryLanguageScriptPath() %>' />
<sn:ScriptRequest ID="ScriptRequest3" runat="server" Path='$skin/scripts/sn/SN.Util.js' />
<sn:ScriptRequest ID="ScriptRequest5" runat="server" Path='$skin/scripts/moment/moment.min.js' />
<sn:ScriptRequest ID="ScriptRequest4" runat="server" Path='$skin/scripts/ODataManager.js' />

<sn:CssRequest ID="CssRequest1" runat="server" CSSPath='<%# ((SNControls.DatePicker)Container).Mode == SNFields.DateTimeMode.None ? string.Empty : "$skin/styles/jqueryui/jquery-ui.css" %>' />

<asp:PlaceHolder ID="InnerDateHolder" runat="server">
    <%=GetGlobalResourceObject("FieldControlTemplates", "Date")%><asp:TextBox ID="InnerControl" runat="server" CssClass='<%# "sn-ctrl sn-ctrl-text sn-ctrl-date sn-datepicker-" + UITools.GetFieldNameClass(Container) %>' Style="width: 100px;"></asp:TextBox>
</asp:PlaceHolder>
<asp:PlaceHolder ID="InnerTimeHolder" runat="server">
    <%=GetGlobalResourceObject("FieldControlTemplates", "Time")%>
</asp:PlaceHolder>
<asp:TextBox ID="InnerTimeTextBox" runat="server" CssClass='<%# "sn-ctrl sn-ctrl-text sn-ctrl-time-" + UITools.GetFieldNameClass(Container) %>' Style="width: 100px;"></asp:TextBox>
<span class='<%# "sn-iu-desc sn-ctrl-time-" + UITools.GetFieldNameClass(Container) %>'></span>
<asp:PlaceHolder ID="InnerTimZoneOffsetHolder" runat="server">
    <asp:TextBox ID="InnerTimeZoneOffsetTextBox" runat="server" CssClass='<%# "sn-ctrl sn-ctrl-text sn-ctrl-timezoneoffset-" + UITools.GetFieldNameClass(Container) %>' Style="display: none;"></asp:TextBox>
</asp:PlaceHolder>
<asp:Label ID="DateFormatLabel" runat="server" CssClass="sn-iu-desc" /><br />
<asp:Label ID="TimeFormatLabel" runat="server" CssClass="sn-iu-desc" />

<script type="text/javascript" language="javascript">
    $(function () {
        if (<%# ((SNControls.DatePicker)Container).Mode != SNFields.DateTimeMode.None ? "true" : "false" %>) {
            var datePickerConfig = <%# ((SNControls.DatePicker)Container).Configuration %>;
            SN.Util.configureDatePicker('<%# UITools.GetFieldNameClass(Container) %>', datePickerConfig, <%# ((SNControls.DatePicker)Container).Mode == SNFields.DateTimeMode.DateAndTime ? "true" : "false" %>);           
        }
    }); 
</script>
