// using $skin/scripts/sn/SN.js
// using $skin/scripts/jquery/jquery.js
// using /Root/Global/scripts/ODataManager.js
// using  $skin/scripts/jquery/plugins/fileupload/jquery.iframe-transport.js
// using  $skin/scripts/jquery/plugins/fileupload/jquery.fileupload.js


SN = typeof (SN) === "undefined" ? {} : SN;

var inProgress = false;

SN.Upload = {

    setResumeProgress: function (formData, parentPath, parentId, offset, size, fname, maxChunk, user) {
        var key = SN.Upload.getResumeKeyFromToken(formData.ChunkToken);
        var itemData = formData;

        // workaround: we extract the content id from the token (first number)
        var chunkToken = formData.ChunkToken;
        if (typeof chunkToken !== 'undefined' && chunkToken !== null) {
            var delimiterIndex = chunkToken.indexOf('*');
            var contentId = delimiterIndex > 0 ? parseInt(chunkToken.substring(0, delimiterIndex)) : 0;
        }

        // get the original creation date if the item already exists
        var creationTime = new Date();
        var existingItem = SN.Upload.getItemByKey(key);
        if (existingItem !== null && typeof existingItem !== 'undefined')
            creationTime = existingItem.creationTime;

        // add some properties to upload data
        $.extend(itemData, {
            parentPath: parentPath,
            parentId: parentId,
            contentId: contentId,
            offset: offset,
            creationTime: creationTime,
            modificationTime: new Date(),
            size: size,
            maxChunk: maxChunk,
            user: user
        });

        // add or update item
        window.localStorage.setItem(key, JSON.stringify(itemData));
    },

    getResumableFiles: function () {
        // return all items
        return SN.Upload.getResumableFilesBySubtree(null);
    },

    getResumableFilesBySubtree: function (p) {
        var items = [];

        // if parent filter is undefined, all items will satisfy the "startswith '/'" filter
        p = (p || '') + '/';
        for (var i = 0; i < localStorage.length; i++) {
            var item = SN.Upload.getItemByIndex(i);
            if (typeof item === "undefined" || item === null)
                continue;

            // if the item is in the provided _subtree_: collect it
            if (item.parentPath.indexOf(p) === 0)
                items.push(item);
        }
        return items;
    },

    getResumableFilesByParentId: function (parentId) {
        var items = [];

        if (typeof parentId === "undefined" || parentId === null)
            return items;

        for (var i = 0; i < localStorage.length; i++) {
            var item = SN.Upload.getItemByIndex(i);
            if (typeof item === "undefined" || item === null)
                continue;

            // if the item is in the provided folder: collect it
            if (item.parentId === parentId)
                items.push(item);
        }

        return items;
    },

    getResumableFile: function (contentId) {
        var resumeItem;
        $.each(SN.Upload.getResumableFiles(), function (i, item) {
            if (item.contentId === contentId) {
                resumeItem = item;
                return false;
            }
            return true;
        });

        return resumeItem;
    },

    uploadFinished: function (token) {
        var items = [];
        var keyFromToken = SN.Upload.getResumeKeyFromToken(token);

        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);

            if (keyFromToken === key) {
                localStorage.removeItem(key);
                break;
            }
        }

        return items;
    },

    openResumeDialog: function (contentId, userName) {
        var currentUser = userName;
        var resumeItem = SN.Upload.getResumableFile(contentId);

        var uploaddata = {};
        var text;

        if (typeof resumeItem === 'undefined') {
            text = SN.Resources.Picker["UploadResume-Error"];
            SN.Util.CreateErrorDialog(text, title, function () { return false });
        }
        else {
            text = resumeItem.FileName;

            var title = SN.Resources.Picker["ContinueUpload"];

            if (resumeItem)
                text = odata.getItemUrl(resumeItem.parentPath);
            else
                text = $('<span class="error">' + SN.Resources.Picker["UploadResume-Error"] + '</span>');

            $uploadArea = $('<div class="sn-upload-area"></div>');

            $infoRow = $('<div class="info">' + SN.Resources.Picker["ResumeInfo"] + '</div>');

            $buttonBar = $('<div class="sn-upload-buttonbar"></div>');
            $fileUploadButton = $('<div id="sn-upload-fileuploadbutton" class="sn-submit sn-notdisabled sn-upload-button"><span>' + SN.Resources.Picker["SelectFile"] + '</span><input id="sn-upload-fileupload" type="file" name="files[]" /></div>');
            $buttonBar.append($fileUploadButton);
            $fileUploadButton.find('input').attr('data-url', "/OData.svc" + text + "/Upload");

            $uploadProgress = $('<div id="progress" style="margin-top: 20px;"></div>');
            var progress = '<div class="sn-upload-progressbar"><div class="sn-upload-bar" style="width: 0%;"></div></div>';
            $uploadProgress.append('<div class="sn-upload-fileprogress">' + resumeItem.FileName + '<div class="sn-upload-progress">' + progress + '</div></div>');
            var percent = (resumeItem.offset / resumeItem.size) * 100;

            $error = $('<span id="sn-upload-othererror" style="display: none;">error</span>');

            $dragAndDropContainer = $('<div class="sn-upload-draganddrop">' + SN.Resources.Picker["DropTheFileHere"] + '</div>');

            $buttons = $('<div class="sn-panel sn-buttons sn-upload-buttons"></div>');
            $startButton = $('<div id="sn-upload-startbutton" class="sn-submit sn-notdisabled sn-upload-button sn-submit-disabled"><span>' + SN.Resources.Picker["ContinueUpload"] + '</span></div>');
            $cancelButton = $('<input type="button" value="' + SN.Resources.Picker["Ok"] + '" class="sn-submit sn-closebutton sn-submit-disabled">');
            $abortButton = $('<input type="button" value="' + SN.Resources.Picker["Cancel"] + '" class="sn-submit sn-abortUploadButton">');

            $buttons.append($startButton, $cancelButton, $abortButton);

            $uploadArea.append($infoRow, $buttonBar, $error, $uploadProgress, $dragAndDropContainer, $buttons);

            text = $uploadArea;

            SN.Util.CreateUploadDialog(text, title);

            var udata;

            $('#sn-upload-fileupload').fileupload({
                maxChunkSize: resumeItem.maxChunk,
                dataType: 'json',
                progress: function (e, data) {
                    inProgress = true;
                    var progress = parseInt(data.loaded / data.total * 100, 10);
                    progress = progress > 100 ? 100 : progress;
                    $('.sn-upload-bar', data.context).css('width', progress + '%');

                    // this check is needed because the last 'loaded' value may exceed 'total' for some reason
                    if (data.loaded <= data.total)
                        SN.Upload.setResumeProgress(data.formData, resumeItem.parentPath, resumeItem.parentId, data.loaded, data.total, resumeItem.FileName, data.maxChunkSize, resumeItem.user);
                },
                add: function (e, data) {
                    udata = data;
                    if (resumeItem.FileName !== data.files[0].name) { //&& resumeItem.user !== currentUser
                        $error.html(SN.Resources.Picker["UploadResume-NotTheSameFile"]);
                        $error.show();
                    }
                    else if (resumeItem.user !== currentUser) {
                        $error.text(SN.Resources.Picker["UploadResume-NotTheSameUser"]);
                        $error.show();
                    }
                    else {
                        $error.hide();
                        data.uploadedBytes = resumeItem.offset;
                        data.context = $uploadProgress;
                        $('#sn-upload-startbutton').removeClass('sn-submit-disabled');
                    }

                    uploaddata = data;

                    $('.sn-upload-cancelfile', data.context).on('click', function () {
                        cancelFile(data);
                    });

                    $('.sn-closebutton').on('click', function () {
                        if (inProgress) {
                            if ($('.overlay').length === 0) {
                                overlayManager.showOverlay({
                                    text: '<%= SenseNetResourceManager.Current.GetString("Controls", "AboortUploadFull")%>'
                                });
                            }
                            $popup = $('.overlay');

                            $popup.find('.buttonRow').css({ 'text-align': 'right', 'margin-top': '20px' });
                            $popup.find('.sn-abortbutton').css('margin-right', '10px');

                            $popup.find('.sn-abortbutton').on('click', function () {
                                cancelFile(data);
                                overlayManager.hideOverlay();
                                location.reload();
                            });
                            $popup.find('.sn-cancel').on('click', function () {
                                overlayManager.hideOverlay();
                            });
                        }
                        else {
                            location.reload();
                        }
                    });
                },
                fail: function (e, data) {

                    var $error = $('#sn-upload-othererror');
                    var json = (data.jqXHR.responseText) ? jQuery.parseJSON(data.jqXHR.responseText) : data.result;
                    //if (typeof (json) == 'undefined') {
                    //    $error.text(json.error.message.value);
                    //} else {
                    //    $error.text(json.error.message.value);
                    //}
                    $error.html(SN.Resources.Picker["UploadAgain"])
                    $error.show();
                    inProgress = false;



                },
                done: function (e, data) {
                    inProgress = false;
                    $('.sn-upload-bar', data.context).addClass('sn-upload-uploadedbar');
                    SN.Upload.uploadFinished(data.formData.ChunkToken);
                    $('.sn-upload-button').hide();
                    $('.sn-closebutton').removeClass('sn-submit-disabled').css({'cursor': 'pointer'}).show();
                }
            });


            $('.sn-upload-bar').css('width', percent + '%');
        }



        function cancelFile(data) {
            // abort requests
            if (data.jqXHR)
                data.jqXHR.abort();


            SN.Upload.removeItemByKey(SN.Upload.getItemByName(data.FileName));

            // remove from dom
            data.context.remove();
        }

        $(document).on('click', '#sn-upload-startbutton', function (e) {
            var url = $('#sn-upload-fileupload').attr('data-url');

            var contentType = '';

            var currentData = uploaddata;

            // first request creates the file
            var filename, filetype;
            if ($.browser.msie && parseInt($.browser.version, 10) > 6 && parseInt($.browser.version, 10) < 10) {
                filetype = currentData.files[0].name.split('\\')
                filetype = filetype[filetype.length - 1];
            }
            else
                filetype = currentData.files[0].type.split('/')[1];
            if (filetype === 'jpeg')
                filetype === 'jpg';
            if (currentData.files[0].name && currentData.files[0].name.length > 0) {
                filename = currentData.files[0].name;
            }
            else {
                filename = 'image' + (i + 1) + '.' + filetype;
            }

            var filelength = currentData.files[0].size;
            var currentOverwrite = true;

            var chunkToken = resumeItem.ChunkToken;

            currentData.formData = {
                "FileName": filename,
                "Overwrite": currentOverwrite,
                "ContentType": contentType,
                "ChunkToken": chunkToken,
                "PropertyName": "Binary"
            };
            currentData.submit();

            uploaddata = {};
            $('#sn-upload-startbutton').addClass('sn-submit-disabled');
        });

        $(document).on('click', '.sn-closebutton', function (e) {
            $('#sn-statusdialog').remove();
            $(event.target).remove();
            $('#sn-statusdialog').dialog("destroy");
            callback();
        });

        $(document).on('click', '.sn-abortUploadButton', function (e) {
            if (SN.Upload.isInProgress()) {
                $popup = $('.overlay');

                if (typeof $popup !== 'undefined' && $popup.length === 1) {
                    overlayManager.showOverlay({
                        text: SN.Resources.Controls["AboortUploadFull"],
                        zIndex: 2000
                    });
                    $('.sn-popup .sn-abortbutton').on('click', function () {
                        cancelFile(udata);
                        overlayManager.hideOverlay();
                        $('#sn-uploaddialog').dialog("close");
                    });
                    $('.sn-popup  .sn-cancel').on('click', function () {
                        overlayManager.hideOverlay();
                    });
                }
            }
            else {
                $('#sn-statusdialog').remove();
                $(event.target).remove();
                $('#sn-statusdialog').dialog("destroy");
                overlayManager.hideOverlay();
                location.reload();
            }
        });

    },

    // HELPER METHODS ==============================================================================================================

    getItemByIndex: function (index) {
        var key = localStorage.key(index);

        // skip items with unknown key
        if (key.indexOf(SN.Upload.resumeKeyPrefix) !== 0)
            return null;
        return JSON.parse(localStorage.getItem(key));
    },

    getItemByKey: function (key) {
        var item = localStorage.getItem(key);
        if (item === null)
            return null;
        return JSON.parse(item);
    },

    getItemByName: function (fileName) {
        $.each(localStorage, function (i, item) {
            if (i.indexOf(SN.Upload.resumeKeyPrefix) !== 0)
                return null;
            var sitem = JSON.parse(item);
            if (sitem.FileName === fileName) {
                var key = SN.Upload.getResumeKeyFromToken(sitem.ChunkToken);
                SN.Upload.removeItemByKey(key);
            }
        });
    },

    removeItemByKey: function (key) {
        localStorage.removeItem(key);
    },

    resumeKeyPrefix: "UploadResume-",
    getResumeKeyFromToken: function (token) {
        // Internal technical method for converting a token to a valid
        // key for localStorage. This is needed to make sure that we do
        // not interfere with other values stored in the local storage.
        return SN.Upload.resumeKeyPrefix + token;
    },

    isInProgress: function(){
    return inProgress;
    },
    getData: function () {
        return data;
    }


}
