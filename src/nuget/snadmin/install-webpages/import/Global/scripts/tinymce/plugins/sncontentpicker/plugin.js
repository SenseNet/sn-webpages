tinymce.PluginManager.add('sncontentpicker', function (editor) {
    var cursorPosition = -1;
    var selectedNode, selectedLength;

    function insert(resultData) {
        if (!resultData)
            return;

        var ed = tinymce.EditorManager.activeEditor;

        // Fixes crash in Safari  
        if (tinymce.isWebKit)
            ed.getWin().focus();

        var args = {};

        // use later
        tinymce.extend(args, {
            src: resultData[0].Path
        });

        var el = ed.selection.getNode();

        // this expression will be always false, 
        //because the clicking in the contentpicker changes the focus.
        if (selectedNode && selectedNode.nodeName === 'IMG' && el && el.nodeName === 'IMG') {
            ed.dom.setAttribs(el, args);
        }
        else {
            if (cursorPosition !== -1) {
                var EditorFulltext = ed.getContent();
                var subText = EditorFulltext.substring(0, cursorPosition);
                var subText2 = EditorFulltext.substring(cursorPosition + selectedLength);
                ed.setContent(
                    subText + '<img id="__mce_tmp" src="' + resultData[0].Path + '" />' + subText2);
            } else {
                ed.execCommand('mceInsertContent', false, '<img id="__mce_tmp" />', {
                    skipUndo: 1
                });
                ed.dom.setAttribs('__mce_tmp', args);
                ed.dom.setAttrib('__mce_tmp', 'id', '');
                ed.undoManager.add();
            }
        }
    }

    editor.addCommand('insert', insert);
    editor.addCommand('mceContentPicker', function () {
        var selectedPath = null;
        selectedNode = editor.selection.getNode();
        if (selectedNode.nodeName === 'IMG') {
            selectedPath = $(selectedNode).attr("_mce_src");
        }

        var se = editor.selection;
        var selected = se.getContent();
        selectedLength = selected.length;

        // get cursor position (hack: this method should work in all browsers)
        var saveFulltext = editor.getContent();
        editor.execCommand('mceInsertContent', false, "#cc#", {
            skiUndo: 1
        });
        cursorPosition = editor.getContent().indexOf("#cc#");
        var editorFullText = editor.getContent().replace("#cc#", selected);
        editor.setContent(editorFullText);

        var treeRoots = SN.tinymceimagepickerparams === null ?
            null : SN.tinymceimagepickerparams.TreeRoots;
        var defaultPath = SN.tinymceimagepickerparams === null ?
            null : SN.tinymceimagepickerparams.DefaultPath;
        SN.PickerApplication.open({
            MultiSelectMode: 'none',
            TreeRoots: treeRoots,
            DefaultPath: defaultPath,
            SelectedNodePath: selectedPath,
            callBack: insert,
            AllowedContentTypes: ['Image', 'File']
        });
    });

    editor.addButton('snimage', { //image2
        title: 'insert image from Portal File Sytem',
        cmd: 'mceContentPicker'
    });
});