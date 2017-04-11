var SnContentHelper = {
    getGeneratedHtml: function (contentPath, displayPath, selectedNode) {
        // get html response of portlet
        var response = $.ajax({
            url: '/portlet-preview.aspx?portlettype=contentcollectionportlet&customrootpath=' +
                contentPath + '&renderer=' + displayPath,
            dataType: "html",
            async: false
        });

        // get original alignment and size
        var originalAlignStr = '';
        var originalHeightStr = '';
        var originalWidthStr = '';
        var originalStyleStr = '';
        if (selectedNode && $(selectedNode).attr("sncontentintext")) {
            originalAlignStr = 'align="' + $(selectedNode).attr("align") + '"';
            originalHeightStr = 'height="' + $(selectedNode).attr("height") + '"';
            originalWidthStr = 'width="' + $(selectedNode).attr("width") + '"';
            originalStyleStr = 'style="' + $(selectedNode).attr("style") + '"';
        }

        var markerStartString = '<!-- rendered content start -->';
        var markerEndString = '<!-- rendered content end -->';
        var markerStartIndex = response.responseText.indexOf(markerStartString);
        var markerEndIndex = response.responseText.indexOf(markerEndString);
        var markerStartLength = markerStartString.length;
        var portletOutput =
            response.responseText.substring(markerStartIndex + markerStartLength, markerEndIndex);
        var nonEditableClass =
            tinymce.activeEditor.getParam("noneditable_noneditable_class", "mceNonEditable");
        var generatedHtml = '<table sncontentintext="' + contentPath + ';' +
            displayPath + '" border="0" ' + originalAlignStr + originalHeightStr +
            originalWidthStr + originalStyleStr +
            '><tbody><tr><td><div class="' + nonEditableClass + '">' +
            portletOutput + '</div></td></tr></tbody></table>';
        return generatedHtml;
    }
};

tinymce.PluginManager.add('sncontent', function (editor, url) {

    function importScript(url) {
        var tag = document.createElement("script");
        tag.type = "text/javascript";
        tag.src = url;
        document.body.appendChild(tag);
    }

    function open() {
        tinymce.activeEditor.windowManager.open({
            file: url + '/sncontent.htm',
            width: 540,
            height: 200,
            inline: 1,
            resizable: 0,
            title: 'Insert Content from Content Repository'
        }, {
        });
    }

    editor.addCommand('mceSnContent', function () {
        open();
    });

    editor.addCommand('onNodeChange', function (ed, cm, n) {
        var se = ed.selection;
        var closestContent = $(se.getNode()).closest("table[sncontentintext]");
        if (closestContent.length !== 0) {
            cm.setActive('sncontent', true);
        } else {
            cm.setActive('sncontent', false);
        }
    });

    editor.addButton('sncontent', {
        title: 'Insert content from Content Repository',
        cmd: 'mceSnContent'
    });

    editor.on('init', function (url) {


        $.each($("table[sncontentintext]", editor.dom.getRoot()), function () {
            var selectedNode = $(this).get();
            var contentAttr = $(this).attr("sncontentintext");

            var props = contentAttr.split(';');
            var contentPath = props[0];
            var displayPath = props[1];

            var generatedHtml =
                SnContentHelper.getGeneratedHtml(contentPath, displayPath, selectedNode);

            $(this).replaceWith(generatedHtml);
        });
    });
});

