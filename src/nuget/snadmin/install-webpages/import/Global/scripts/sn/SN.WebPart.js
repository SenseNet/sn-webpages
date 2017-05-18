// using $skin/scripts/sn/SN.js
// using $skin/scripts/sn/SN.Picker.js
// using $skin/scripts/jquery/jquery.js
// using $skin/scripts/jqueryui/minified/jquery-ui.min.js
// resource Picker

SN.WebPart = {
    originalZone: null,
    originalIndex: null,
    getItemIndex: function (item) {
        return item.parents(".sn-zone").find(".sn-portlet").index(item);
    },
    getWebPartZoneId: function (item) {
        return item.parents(".sn-zone").attr("ID").replace(/_/g, "$");
    }
}

$(function () {

    $(".sn-verbs-openbtn").each(function () {
        var $this = $(this);
        var $verbs = $this.parent();
        var $verbsPanel = $verbs.next(".sn-verbs-panel");
        var $closebtn = $verbsPanel.children().children(".sn-verbs-closebtn");
        $verbsPanel.appendTo($("body > form"));

        // show verbs
        $this.click(function () {
            // redefine pos in click since layout could have changed
            var pos = $verbs.offset();
            var rightcoords = $("body").outerWidth() - (pos.left + $verbs.outerWidth());
            $verbsPanel.css({ right: rightcoords, top: pos.top });

            $verbsPanel.show(100);
            return false;
        });
        // hide verbs
        $closebtn.click(function () {
            $verbsPanel.hide(100);
            return false;
        });

    });

    $(".sn-addportlet").click(function () {
        var zoneID = $(this).data("zone");
        SN.PickerApplication.openPortletPicker({
            callBack: function (resultData) {
                if (!resultData) return;
                // put the chosen portlet id to the textbox
                $('.sn-prc-hiddenaddportlettb').val(resultData[0].Id + ';' + zoneID);
                // this custom postback is handled by the PortalRemoteControl class on the server
                __doPostBack('', 'SnAddPortlet');
            }
        });
        return false;
    });

    $(".sn-zone-body").sortable({
        connectWith: ".sn-zone-body",
        items: ".sn-portlet",
        //handle: ".sn-pt-header",
        placeholder: 'sn-drop-cue',
        appendTo: 'body',
        opacity: 0.6,
        cursor: 'move',
        zIndex: 999999,
        forcePlaceholderSize: true,
        tolerance: 'pointer',
        delay: 200,
        revert: 200,
        scrollSensitivity: 40,
        scrollSpeed: 40,
        start: function (event, ui) {
            // save original position
            SN.WebPart.originalZone = SN.WebPart.getWebPartZoneId(ui.item);
            SN.WebPart.originalIndex = SN.WebPart.getItemIndex(ui.item);
        },
        change: function (event, ui) {
            var $zone = ui.item.parents(".sn-zone");
            var portletnum = $zone.find(".sn-portlet").length;
            if (portletnum < 2) {
                $zone.addClass("sn-zone-empty")
            } else {
                $zone.removeClass("sn-zone-empty");
            }
            //console.log("change / " + $zone.attr("id"));
        },
        over: function (event, ui) {
            ui.placeholder.parents(".sn-zone").removeClass("sn-zone-empty");
            //console.log("over");
        },
        out: function (event, ui) {
            var $zone = ui.placeholder.parents(".sn-zone");
            var portletnum = $zone.find(".sn-portlet").length;
            if (portletnum < 1) {
                $zone.addClass("sn-zone-empty")
            } else {
                $zone.removeClass("sn-zone-empty");
            }
            //console.log("out / " + portletnum);
        },
        update: function (event, ui) {
            // this event is fired twice when portlet's zone is changed, and double postback causes problems in IE. Only first postback is handled, when ui.sender is null.
            if (ui.sender != null)
                return;
            var webPartZoneId = SN.WebPart.getWebPartZoneId(ui.item);
            var index = SN.WebPart.getItemIndex(ui.item);

            // portlet is moved in the same zone, to a higher index -> .net should receive index according to original list, and not new absolute index
            if (webPartZoneId == SN.WebPart.originalZone && index > SN.WebPart.originalIndex)
                index++;

            var webPartId = ui.item.attr("id");
            __doPostBack(webPartZoneId, 'Drag:' + webPartId + ':' + index);
        }
    }).disableSelection();

    // set contenteditable fields to skip sortable (singlecontentportlet can display editable fields)
    $(".sn-zone-body [contenteditable=true]").css('cursor', 'auto').bind('mousedown.ui-disableSelection selectstart.ui-disableSelection', function (e) {
        e.stopImmediatePropagation();
    });
});