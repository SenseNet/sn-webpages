// using $skin/scripts/sn/SN.js
// using $skin/scripts/jquery/jquery.js
// using $skin/scripts/codemirror-5.11/lib/codemirror.js
// using $skin/scripts/codemirror-5.11/mode/xml/xml.js
// using $skin/scripts/codemirror-5.11/addon/dialog/dialog.js
// using $skin/scripts/codemirror-5.11/addon/search/searchcursor.js
// using $skin/scripts/codemirror-5.11/addon/search/search.js
// using $skin/scripts/codemirror-5.11/addon/scroll/annotatescrollbar.js
// using $skin/scripts/codemirror-5.11/addon/search/matchesonscrollbar.js
// using $skin/scripts/codemirror-5.11/addon/search/jump-to-line.js
// using $skin/scripts/codemirror-5.11/lib/codemirror.css
// using $skin/scripts/codemirror-5.11/addon/dialog/dialog.css
// using $skin/scripts/codemirror-5.11/addon/search/matchesonscrollbar.css
// resource Picker

SN.BinaryFieldControl = {
    initHighlightTextbox: function (extension) {
        var parserfile = "parsexml.js";
        var editor, $textfield;
        var $textfield = $('.sn-highlighteditor');
        if (extension == ".js" || extension == ".settings") {
            $.getScript("/Root/Global/scripts/codemirror-5.11/mode/javascript/javascript.js", function () {
            editor = CodeMirror.fromTextArea($textfield[0], {
                height: "600px",
                lineNumbers: true,
                matchBrackets: true,
                continueComments: "Enter",
                extraKeys: { "Ctrl-Q": "toggleComment" }
            });
        });
        }
        else if (extension == ".css") {
            $.getScript("/Root/Global/scripts/codemirror-5.11/mode/css/css.js", function () {
            editor = CodeMirror.fromTextArea($textfield[0], {
                height: "600px",
                lineNumbers: true,
                matchBrackets: true,
            });
        });
        }
        else if (extension == ".html" || extension == ".htm" || extension == ".xml" || extension == ".xslt") {
            $.getScript("/Root/Global/scripts/codemirror-5.11/mode/xml/xml.js", function () {
                editor = CodeMirror.fromTextArea($textfield[0], {
                    mode: {name: "xml", alignCDATA: true},
                    lineNumbers: true
                });
            });
        }
        else {
            $(".sn-highlighteditor").each(function () {
                $.getScript("/Root/Global/scripts/codemirror-5.11/mode/xml/xml.js", function () {
                editor = CodeMirror.fromTextArea($textfield[0], {
                    mode: {name: "xml", alignCDATA: true},
                    lineNumbers: true
                });
            });
            });
        }
    },
    initZoomWindow: function () {
        $(".sn-zoomtext").each(function () {
            var $zoombtn = $(this).after("<button class='sn-zoomtext-btn' style='vertical-align:top'>" + SN.Resources.Picker["OpenInDialog"] + "</button>").next();
            $zoombtn.button({
                icons: { primary: 'ui-icon-newwin' },
                text: false
            });

            $zoombtn.click(function () {
                var $zoombtn = $(this);
                var $textfield = $zoombtn.prev();
                var $textfieldDialog = $textfield.after("<div><textarea id='" + $textfield.attr("id") + "_clone' style='width:100%; height:100%; padding:0; margin:0; border:0;'>" + $textfield.val() + "</textarea></div>").next();

                var dlgtitle = $textfield.parent().prev().children(".sn-iu-title").text();
                if (dlgtitle == "") dlgtitle = SN.Resources.Picker["EditText"];

                $textfieldDialog.dialog({
                    title: dlgtitle,
                    minWidth: 400,
                    minHeight: 300,
                    width: 700,
                    height: 500,
                    modal: true,
                    close: function () {
                        var newtext = $("textarea", $textfieldDialog).val();
                        $textfield.val(newtext);
                        $textfieldDialog.dialog("destroy");
                    }
                });
                return false; //prevent submit
            });
        });
    }
}

var mixedMode = {
        name: "htmlmixed",
        scriptTypes: [{matches: /\/x-handlebars-template|\/x-mustache/i,
                       mode: null},
                      {matches: /(text|application)\/(x-)?vb(a|script)/i,
                       mode: "vbscript"}]
      };