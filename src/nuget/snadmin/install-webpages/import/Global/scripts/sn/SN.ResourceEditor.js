// using $skin/scripts/sn/SN.js
// using $skin/scripts/jquery/jquery.js
// using $skin/scripts/jqueryui/minified/jquery-ui.min.js
// using $skin/scripts/sn/SN.Util.js
// resource Picker

SN.ResourceEditor = {
    contentviewparams: null,
    langs: [],
    init: function () {
        // check if resource editor has already been added (updatepanel postback could add it twice)
        var existingdialog = $('#sn-resourceDialog');
        if (existingdialog.length > 0)
            return;

        SN.ResourceEditor.langs = arguments[0];

        var header1 = "<div class='sn-redit-headerline'><div class='sn-redit-hleft'>" + SN.Resources.Picker["ClassName"] + "</div><div class='sn-redit-hright'><span id='sn-redit-classname'></span></div><div class='sn-redit-clear'></div></div>";
        var header2 = "<div class='sn-redit-headerline'><div class='sn-redit-hleft'>" + SN.Resources.Picker["Name"] + "</div><div class='sn-redit-hright'><span id='sn-redit-name'></span></div><div class='sn-redit-clear'></div></div>";
        var header = "<div id='sn-redit-headerline-common'>" + header1 + header2 + "</div>";

        var fieldvalueline = "<div class='sn-redit-headerline'><div class='sn-redit-left'>" + SN.Resources.Picker["FieldValue"] + "</div><div class='sn-redit-right'><input class='sn-redit-input' id='sn-redit-fieldvalue-edit'></input></div><div class='sn-redit-clear'></div></div>";
        fieldvalue = "<div id='sn-redit-headerline-fieldvalue'>" + fieldvalueline + "</div>";

        var editors = "";
        for (var i = 0; i < SN.ResourceEditor.langs.length; i++) {
            editors += "<div><div class='sn-redit-left'>" + SN.ResourceEditor.langs[i].Value + "</div><div class='sn-redit-right'><input class='sn-redit-input' id='sn-redit-" + SN.ResourceEditor.langs[i].Key + "' type='text' /></div><div class='sn-redit-clear'></div></div>";
        }
        var editor = editors;

        var content = "<div class='sn-redit-content'>" + header + editor + fieldvalue + "</div>";
        var buttons = "<div class='sn-redit-footer'><div class='sn-redit-buttons'><input id='sn-redit-save' type='button' class='sn-submit sn-button sn-notdisabled' value='" + SN.Resources.Picker["Save"] + "' onclick='SN.ResourceEditor.save();return false;' /><input type='button' class='sn-submit sn-button sn-notdisabled' value='" + SN.Resources.Picker["Cancel"] + "' onclick='SN.ResourceEditor.cancel();return false;' /></div></div>";
        var dialogMarkup = "<div id='sn-resourceDialog'>" + content + buttons + "</div>";
        $('body').append(dialogMarkup);
        var dialogOptions = { title: SN.Resources.Picker["EditStringResource"], modal: true, zIndex: 10000, width: 420, height: 'auto', minHeight: 0, maxHeight: 500, minWidth: 320, resizable: false, autoOpen: false };
        SN.Util.CreateUIDialog($('#sn-resourceDialog'), dialogOptions);
        SN.Util.CreateUIButton($('.sn-button', $('#sn-resourceDialog')));
    },
    save: function () {
        var resources = [];
        for (var i = 0; i < SN.ResourceEditor.langs.length; i++) {
            var resource = { Lang: SN.ResourceEditor.langs[i].Key, Value: $('#sn-redit-' + SN.ResourceEditor.langs[i].Key).val() };
            resources.push(resource);
        }
        if (!SN.ResourceEditor.contentviewparams) {

            $.post("/OData.svc/('root')/ResourceSaveResource",
                "models=[" + JSON.stringify({
                    classname: SN.ResourceEditor.classname,
                    name: SN.ResourceEditor.name,
                    resources: JSON.stringify(resources),
                }) + "]",
                SN.ResourceEditor.saveCallback);
        } else {
            // save all resources as JSON to hidden textbox
            var link = SN.ResourceEditor.contentviewparams.link;
            var box = $('.sn-resbox', link.closest('.sn-resdiv'));
            var fieldvalue = $('#sn-redit-fieldvalue-edit').val();
            var resjson = { 'Name': fieldvalue, 'Datas': resources };
            box.val(JSON.stringify(resjson));

            // update current link text
            if (fieldvalue.indexOf('$') != 0) {
                // if field value is not a resource any more, then simply update the link text to the field value
                link.text(fieldvalue);
            } else {
                var lang = SN.ResourceEditor.contentviewparams.currentlang;
                var langp = SN.ResourceEditor.contentviewparams.currentlangp;
                var found = false;
                for (var i = 0; i < resources.length; i++) {
                    if (resources[i].Lang == lang) {
                        link.text(resources[i].Value);
                        found = true;
                        break;
                    }
                }
                // try parent culture name
                if (!found) {
                    for (var i = 0; i < resources.length; i++) {
                        if (resources[i].Lang == langp) {
                            link.text(resources[i].Value);
                            found = true;
                            break;
                        }
                    }
                }
            }
            $('#sn-resourceDialog').dialog('close');
        }
    },
    saveCallback: function () {
        location = location;
    },
    editResource: function (classname, name, contentviewparams) {
        if (contentviewparams) {

            // parse field value and resources from hidden textbox
            var link = contentviewparams.link;
            var box = $('.sn-resbox', link.closest('.sn-resdiv'));
            var resObj = JSON.parse(box.val());

            SN.ResourceEditor.contentviewparams = {
                link: contentviewparams.link,
                currentlang: contentviewparams.currentlang,
                currentlangp: contentviewparams.currentlangp,
                value: resObj.Name,
                resources: resObj.Datas
            };

            $('#sn-resourceDialog').dialog("option", "title", contentviewparams.title);
        }
        else {
            SN.ResourceEditor.contentviewparams = null;
            $('#sn-resourceDialog').dialog("option", "title", SN.Resources.Picker["EditStringResource"]);
        }

        // in contentviewmode button text is 'ok', otherwise 'save'
        var oktitle = SN.ResourceEditor.contentviewparams ? SN.Resources.Picker["Ok"] : SN.Resources.Picker["Save"];
        $('#sn-redit-save').val(oktitle);
        if (SN.ResourceEditor.contentviewparams) {
            $('#sn-redit-headerline-fieldvalue').show();
            $('#sn-redit-headerline-common').hide();
            $('#sn-redit-fieldvalue-edit').val(SN.ResourceEditor.contentviewparams.value);
        } else {
            $('#sn-redit-headerline-fieldvalue').hide();
            $('#sn-redit-headerline-common').show();
        }

        SN.ResourceEditor.classname = classname;
        SN.ResourceEditor.name = name;
        $('#sn-redit-classname').text(classname);
        $('#sn-redit-classname').text(classname);
        $('#sn-redit-name').text(name);
        $('#sn-redit-name-edit').val(name);
        $('#sn-resourceDialog').dialog('open');

        // in contentview mode the resource values are already rendered to client
        if (SN.ResourceEditor.contentviewparams) {
            var resources = SN.ResourceEditor.contentviewparams.resources;
            for (var i = 0; i < resources.length; i++) {
                $('#sn-redit-' + resources[i].Lang).val(resources[i].Value);
            }
        } else {
            // request resources

            $.getJSON(
                "/OData.svc/('root')/ResourceGetStringResources",
                {
                    classname: classname,
                    name: name,
                    rnd: Math.random()
                },
                SN.ResourceEditor.getResourcesCallback);
        }
    },
    getResourcesCallback: function (resources) {
        for (var i = 0; i < resources.length; i++) {
            $('#sn-redit-' + resources[i].Key).val(resources[i].Value);
        }
    },
    cancel: function () {
        $('#sn-resourceDialog').dialog('close');
    }
}
