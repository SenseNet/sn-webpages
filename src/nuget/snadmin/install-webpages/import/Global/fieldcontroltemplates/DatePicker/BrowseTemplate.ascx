<%@  Language="C#" EnableViewState="false" %>
<%@ Import Namespace="SNControls=SenseNet.Portal.UI.Controls" %>
<%@ Import Namespace="SNFields=SenseNet.ContentRepository.Fields" %>
<%@ Import Namespace="System.Globalization" %>
<%@ Import Namespace="SenseNet.Portal.UI" %>

<span class='<%# "sn-date-" + UITools.GetFieldNameClass(Container) %>'><%# DataBinder.Eval(Container, "Data") %></span>
<script>
    $(function () {
        SN.Util.setFriendlyLocalDate('<%# "span.sn-date-" + UITools.GetFieldNameClass(Container) %>'
            ,'<%= CultureInfo.CurrentUICulture %>'
            ,'<%# ((DateTime)((SNControls.FieldControl)Container).GetData()).ToString(CultureInfo.GetCultureInfo("en-US")) %>'
            ,'<%= CultureInfo.CurrentUICulture.DateTimeFormat.ShortDatePattern.ToUpper() %>'
            ,'<%# (((SNControls.DatePicker)Container).Mode != SNFields.DateTimeMode.Date).ToString().ToLower() %>');
    });
</script>
