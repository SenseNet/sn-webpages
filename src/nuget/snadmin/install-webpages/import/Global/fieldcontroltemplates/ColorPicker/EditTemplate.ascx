<%@  Language="C#" %>
<%@ Import Namespace="SNControls=SenseNet.Portal.UI.Controls" %>
<%@ Import Namespace="SenseNet.Portal.UI" %>

<%@ Import Namespace="SNFields=SenseNet.ContentRepository.Fields" %>
<sn:ScriptRequest runat="server" Path="/Root/Global/scripts/kendoui/kendo.web.min.js" />
<sn:CssRequest runat="server" CSSPath="/Root/Global/styles/kendoui/kendo.common.min.css" />
<sn:CssRequest runat="server" CSSPath="/Root/Global/styles/kendoui/kendo.metro.min.css" />
<asp:TextBox ID="InnerShortText" CssClass='<%# "form-control sn-ctrl sn-ctrl-text sn-ctrl-colorpicker sn-colorpicker-innerdata-" + UITools.GetFieldNameClass(Container) %>' runat="server"></asp:TextBox>
<asp:HiddenField ID="paletteField" Value='<%# ((SNFields.ColorFieldSetting)((SNControls.ColorPicker)Container).Field.FieldSetting).Palette %>' runat="server" />
<div id='<%# "colorPalette-" + UITools.GetFieldNameClass(Container) %>'></div>

<sn:ScriptRequest runat="server" Path="$skin/scripts/sn/sn.colorpicker.js" />

<script>
    $(function () {
        var colors = $('<%# ".sn-colorpicker-innerdata-" + UITools.GetFieldNameClass(Container) %>').next('input').val().split(';');
        $colorPicker = $('<%# ".sn-colorpicker-innerdata-" + UITools.GetFieldNameClass(Container) %>');
        var p = [];
        if (colors.length > 1) {
            $.each(colors, function (i, item) {
                p.push(item);
            });
            $('<%# "#colorPalette-" + UITools.GetFieldNameClass(Container) %>').kendoColorPalette({
                columns: 12,
                palette: p,
                change: select
            });
        }
        else {
            $colorPicker.kendoColorPicker({
                buttons: false
            });
        }
        function select(e) {
            $colorPicker.val(e.value);
        }
    });
</script>
