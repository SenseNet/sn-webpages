<%@  Language="C#" %>

<asp:TextBox ID="InnerData" runat="server" style="display:none" CssClass="sn-button-innerdata" />
<div id='sn-button-list'></div>

<table class="innner-link-table">
    <tr>
        <td>URL</td>
        <td>
            <input type="text" class="sn-button-url" />
        </td>
        <td>
            <input type="button" class="sn-button sn-savepath" onclick="SN.PickerApplication.open({
    MultiSelectMode: 'none', TreeRoots: ['/Root/Sites/Default_Site', '/Root'],
    callBack: function (resultData) {
        if (!resultData)
            return;
        $('.sn-button-contentId').val(resultData[0].Id);
        $('.sn-button-url').val(resultData[0].Path);
        $('.sn-button-linktext').val(resultData[0].DisplayName);
    }
}); return false;"
                value="..." />

        </td>
    </tr>

    <tr>
        <td>Link text</td>
        <td>
            <input type="text" class="sn-button-linktext" /></td>
        <td>
            <input type="text" class="sn-button-contentId" style="display: none;" />
        </td>
    </tr>

    <tr>
        <td>Link title (tooltip)</td>
        <td>
            <input type="text" class="sn-button-linktitle" />
        </td>
    </tr>
    <tr>
        <td>Target window</td>
        <td>
            <input type="text" class="sn-button-targetwindow" />
        </td>
    </tr>
    <tr>
        <td></td>
        <td>
            <span class="target-type-link" title='<%=HttpContext.GetGlobalResourceObject("FieldControlTemplates", "BlankTitle")%>'>_blank</span>, 
            <span class="target-type-link" title='<%=HttpContext.GetGlobalResourceObject("FieldControlTemplates", "SelfTitle")%>'>_self</span>, 
            <span class="target-type-link" title='<%=HttpContext.GetGlobalResourceObject("FieldControlTemplates", "ParentTitle")%>'>_parent</span>, 
            <span class="target-type-link" title='<%=HttpContext.GetGlobalResourceObject("FieldControlTemplates", "TopTitle")%>'>_top</span>
        </td>
    </tr>
</table>

<span class="addInnerLink sn-button" style="cursor: pointer; float:right;">Add</span>


<script>
    $(function () {
        $('.target-type-link').on('click', function (e) {
            $(e.target).closest('tr').siblings('tr').find('.sn-button-targetwindow').val($(this).text());
        })

        $('.addInnerLink').on('click', function () {
            Button.Add();
            $('.innner-link-table input[type=text]').removeAttr('value');
        })
        if ($('.sn-button-innerdata').val() !== '' || $('.sn-button-innerdata').val() !== null)
            Button.Load();
    });

</script>

