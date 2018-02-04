<%@ Control Language="C#" AutoEventWireup="true" Inherits="SenseNet.Portal.UI.SingleContentView" EnableViewState="false" %>

<sn:ScriptRequest ID="toolbar" runat="server" Path="/Root/Global/scripts/sn/SN.Toolbar.js" />
<sn:ScriptRequest ID="grid" runat="server" Path="/Root/Global/scripts/sn/SN.Grid.js" />

<input type="hidden" class="language" value='<%= SenseNet.Portal.Virtualization.PortalContext.Current?.Site?.Language ?? "en-us" %>' />
<div class="fullWidth title">
    <h3><%= HttpUtility.HtmlEncode(GetValue("DisplayName")) %></h3>
</div>
<div class="fullWidth">
    <div id="toolbar"></div>
    <div id='userGrid' style="width: 100%;"></div>
</div>

<script>
    $(function () {
        var lang = $('.language').val();
        var toolbar = $('#toolbar').Toolbar({
            scenario: 'GridToolbar'
        });
        var grid = $('#userGrid').Grid({
            lang: lang,
            scenario: 'ListItem',
            select: ['FullName', 'Icon', 'Id', 'DisplayName', 'Avatar', 'Path', 'ModifiedBy/FullName', 'ModificationDate'],
            expand: ['ModifiedBy'],
            fields: {
                FullName: { type: "string" },
                ModifiedBy: { type: "object" },
                ModificationDate: { type: "date" },
                DisplayName: { type: "string" }
            },
            columns: [
                    {
                        template: '<input type="checkbox" value="#=Id#" path="#= Path#" />',
                        headerTemplate: '<input type="checkbox" />',
                        width: 20
                    },
                    {
                        template: function (e) {
                            var actionParam = location.href.split('?')[1].toLocaleLowerCase();
                            
                            if ((typeof actionParam !== 'undefined' && actionParam.indexOf('explore') > -1) || $('data-uid="' + e.uid + '"').closest('frame[name="ExploreFrame"]').length !== 0)
                                return '<img src="/Root/Global/images/icons/16/' + e.Icon + '.png" alt="' + e.Icon + '" title="" class="sn-icon sn-icon16" /><span data-url="' + e.Path + '" class="title"><a href="' + e.Path + '?action=Explore">' + e.DisplayName + '</a></span> <span class="actionmenu-open fa fa-caret-down"></span>';
                            else
                                return '<img src="/Root/Global/images/icons/16/' + e.Icon + '.png" alt="' + e.Icon + '" title="" class="sn-icon sn-icon16" /><span data-url="' + e.Path + '" class="title"><a href="' + e.Path + '">' + e.DisplayName + '</a></span> <span class="actionmenu-open fa fa-caret-down"></span>';
                        },
                        field: "FullName",
                        title: SN.Resources["Ctd-GenericContent"]["DisplayName-DisplayName"]
                    }, {
                        field: "ModifiedBy.FullName",
                        title: SN.Resources["Ctd-GenericContent"]["ModifiedBy-DisplayName"]
                    }, {
                        field: "ModificationDate",
                        template: "#= SN.Util.setFriendlyLocalDateFromValue(ModificationDate,lang) #",
                        title: SN.Resources["Ctd-GenericContent"]["ModificationDate-DisplayName"]
                    }]
        });
    });
</script>