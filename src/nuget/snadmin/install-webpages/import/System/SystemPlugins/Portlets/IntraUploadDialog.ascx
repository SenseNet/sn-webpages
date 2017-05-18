<%@ Control Language="C#" AutoEventWireup="true" %>

<%@ Import Namespace="SenseNet.Portal.Virtualization" %>
<%@ Import Namespace="SenseNet.ContentRepository" %>
<%@ Import Namespace="SenseNet.ContentRepository.Storage" %>
<%@ Import Namespace="SenseNet.ContentRepository.Storage.Data" %>
<%@ Import Namespace="SenseNet.ContentRepository.i18n" %>

<sn:ScriptRequest ID="script1" runat="server" Path="$skin/scripts/jquery/jquery.js" />
<sn:ScriptRequest ID="script2" runat="server" Path="$skin/scripts/jquery/plugins/fileupload/jquery.ui.widget.js" />
<sn:ScriptRequest ID="script3" runat="server" Path="$skin/scripts/jquery/plugins/fileupload/jquery.iframe-transport.js" />
<sn:ScriptRequest ID="script4" runat="server" Path="$skin/scripts/jquery/plugins/fileupload/jquery.fileupload.js" />
<sn:ScriptRequest ID="script5" runat="server" Path="$skin/scripts/sn/SN.Upload.js" />



<% var allowedchildtypes = (PortalContext.Current.ContextNode as GenericContent).GetAllowedChildTypes().ToArray();
   var allowedfiletypes = allowedchildtypes.Where(ct => ct.IsInstaceOfOrDerivedFrom("File")).Select(ct => SenseNet.ContentRepository.Content.Create(ct)).OrderBy(ct => ct.DisplayName).ToArray();
   if (allowedchildtypes.Length == 0)
       allowedfiletypes = SenseNet.ContentRepository.Schema.ContentType.GetContentTypes().Where(ct => ct.IsInstaceOfOrDerivedFrom("File")).Select(ct => SenseNet.ContentRepository.Content.Create(ct)).OrderBy(ct => ct.DisplayName).ToArray();
   string alltypesStr = string.Empty;
   string typename = string.Empty;
   if (allowedfiletypes.Length > 0)
   {
       typename = allowedfiletypes.First().DisplayName;
       var allowedtypesMarkup = allowedfiletypes.Select(ct => "<option value=\"" + ct.Name + "\">" + ct.DisplayName + "</option>");
       alltypesStr = allowedfiletypes.Length > 1 ? "<option value=\"Auto\">" + SenseNetResourceManager.Current.GetString("Action", "UploadAutoType") + "</option>" : "";
       alltypesStr += string.Join("", allowedtypesMarkup);
   }
%>

<% if (!SenseNet.ApplicationModel.UploadAction.AllowCreationForEmptyAllowedContentTypes(PortalContext.Current.ContextNode))
   { %>
<%= SenseNetResourceManager.Current.GetString("Action", "UploadExceptionEmptyAllowedChildTypes")%>
<% }
   else if (allowedfiletypes.Length == 0 && allowedchildtypes.Length != 0)
   { %>
<%= SenseNetResourceManager.Current.GetString("Action", "UploadNoAllowedTypeError")%>
<% }
   else
   { %>
<div class="sn-upload-area">
    <div class="sn-upload-buttonbar">
        <div id="sn-upload-fileuploadbutton" class="sn-submit sn-notdisabled sn-upload-button">
            <span><%= SenseNetResourceManager.Current.GetString("Action", "UploadAddFiles")%></span>
            <input id="sn-upload-fileupload" type="file" name="files[]" data-url="/OData.svc<%= PortalContext.Current.ContextNode.ParentPath %>('<%= PortalContext.Current.ContextNode.Name %>')/Upload" multiple />
        </div>

        <div class="sn-upload-type">
            <%= SenseNetResourceManager.Current.GetString("Action", "UploadUploadAs")%>

            <% if (allowedfiletypes.Length == 1)
               { %>
            <%= typename%>.
            <% } %>

            <select id="sn-upload-contenttype" <%=(allowedfiletypes.Length > 1) ? "" : "style=\"display:none;\"" %>><%= alltypesStr%></select>
        </div>

        <div style="clear: both;"></div>
    </div>

    <div id="progress">
    </div>

    <span id="sn-upload-othererror" style="display: none;"><%= SenseNetResourceManager.Current.GetString("Action", "UploadOtherError")%></span>
    <% } %>
    <div class="sn-upload-draganddrop">
        <%= SenseNetResourceManager.Current.GetString("Action", "UploadDragAndDrop")%>
    </div>
    <div class="sn-panel sn-buttons sn-upload-buttons">
        <div id="sn-upload-startbutton" class="sn-submit sn-notdisabled sn-upload-button sn-submit-disabled">
            <span><%= SenseNetResourceManager.Current.GetString("Action", "UploadStartUpload")%></span>
        </div>
        <input type="button" value='<%= SenseNetResourceManager.Current.GetString("Action", "Close")%>' class="sn-submit sn-closebutton">
    </div>
</div>
<script>
    var uploaddata = [];
    var maxChunkSize = <%= BlobStorageConfiguration.BinaryChunkSize %>;
    var currentUser = '<%= SenseNet.ContentRepository.User.Current.Name %>';
    // 1 MB: 1048576
    //10 MB: 10485760
    //50 MB: 52428800

    // ios will always use 'image.jpg' filename, that would cause problems with simultaneous multiple file uploads.
    // therefore from ios we always create new files in the repository. otherwise we always overwrite
    var iosregex = "^(?:(?:(?:Mozilla/\\d\\.\\d\\s*\\()+|Mobile\\s*Safari\\s*\\d+\\.\\d+(\\.\\d+)?\\s*)(?:iPhone(?:\\s+Simulator)?|iPad|iPod);\\s*(?:U;\\s*)?(?:[a-z]+(?:-[a-z]+)?;\\s*)?CPU\\s*(?:iPhone\\s*)?(?:OS\\s*\\d+_\\d+(?:_\\d+)?\\s*)?(?:like|comme)\\s*Mac\\s*O?S?\\s*X(?:;\\s*[a-z]+(?:-[a-z]+)?)?\\)\\s*)?(?:AppleWebKit/\\d+(?:\\.\\d+(?:\\.\\d+)?|\\s*\\+)?\\s*)?(?:\\(KHTML,\\s*(?:like|comme)\\s*Gecko\\s*\\)\\s*)?(?:Version/\\d+\\.\\d+(?:\\.\\d+)?\\s*)?(?:Mobile/\\w+\\s*)?(?:Safari/\\d+\\.\\d+(\\.\\d+)?.*)?$";
    var isios = new RegExp(iosregex).test(navigator.userAgent);
    var overwrite = !isios;
    var backUrl = '<%= string.IsNullOrEmpty(PortalContext.Current.BackUrl) ? PortalContext.Current.ContextNodePath : PortalContext.Current.BackUrl %>';
    var folderPath = '<%= PortalContext.Current.ContextNodePath %>';
    var folderId = <%= PortalContext.Current.ContextNodeHead.Id %>;

    function isUniqueFileName(filename, idx) {
        for (var i = 0; i < uploaddata.length; i++) {
            if (i == idx)
                continue;
            if (uploaddata[i].files[0].name == filename)
                return false;
        }
        return true;
    }

    function cancelFile(data) {
        // abort requests
        if (data.jqXHR)
            data.jqXHR.abort();

        // remove from uploaddata
        var idx = uploaddata.indexOf(data);
        if (idx != -1)
            uploaddata.splice(idx, 1);

        // remove from dom
        data.context.remove();

        if (uploaddata.length == 0)
            $('#sn-upload-startbutton').addClass('sn-submit-disabled');
    }

    $(document).on('click', '#sn-upload-startbutton', function (e) {
        var url = $('#sn-upload-fileupload').attr('data-url');

        var contentType = $('#sn-upload-contenttype').val();
        if (contentType == 'Auto')
            contentType = '';

        for (var i = 0; i < uploaddata.length; i++) {
            (function () {
                var idx = i;
                var currentData = uploaddata[idx];

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
                var currentOverwrite = overwrite;

                // if two or more files of the same name have been selected to upload at once, we switch off overwrite for these files
                if (!isUniqueFileName(filename, idx))
                    currentOverwrite = false;







                $.ajax({
                    url: url + '?create=1',
                    type: 'POST',

                    data: {
                        "ContentType": contentType,
                        "FileName": filename,
                        "Overwrite": currentOverwrite,
                        "UseChunk": filelength > maxChunkSize,
                        "PropertyName": "Binary",
                        "FileLength": filelength
                    },
                    success: function (data) {
                        // set formdata and submit upload request
                        currentData.formData = {
                            "FileName": filename,
                            "Overwrite": currentOverwrite,
                            "ContentType": contentType,
                            "ChunkToken": data,
                            "PropertyName": "Binary",
                            "FileLength": filelength
                        };
                        currentData.submit();
                    },
                    error: function (data) {
                        var $error = $('.sn-upload-error', currentData.context);
                        if (typeof (data) == 'undefined') {
                            $error.text($('#sn-upload-othererror').text());
                        } else {
                            var result = jQuery.parseJSON(data.responseText);
                            $error.text(result.error.message.value);
                        }
                        $error.show();
                    }
                });
            })();
        }
        uploaddata = [];
        $('#sn-upload-startbutton').addClass('sn-submit-disabled');
    });
    var count = 0;
    var inProgress = false;
    $(function () {


        $('.sn-closebutton').on('click', function () {
            if(!inProgress){
                window.location = backUrl;
            }
        });

        $('#sn-upload-fileupload').fileupload({
            maxChunkSize: maxChunkSize,
            dataType: 'json',
            progress: function (e, data) {
               
                inProgress = true;
                var progress = parseInt(data.loaded / data.total * 100, 10);
                progress = progress > 100 ? 100 : progress;
                $('.sn-upload-bar', data.context).css('width', progress + '%');


                // this check is needed because the last 'loaded' value may exceed 'total' for some reason
                if (data.loaded <= data.total){
                    SN.Upload.setResumeProgress(data.formData, folderPath, folderId, data.loaded, data.total, data.fileName, maxChunkSize, currentUser);
                }
            },
            add: function (e, data) {
                
                checkLocalstorage(data);

                count += 1;
                var filename, filetype;
                if (data.files[0].name && data.files[0].name.length > 0) {
                    if ($.browser.msie && parseInt($.browser.version, 10) > 6 && parseInt($.browser.version, 10) < 10) {
                        var inputValue = data.fileInput[0].value.split('\\');
                        filename = inputValue[inputValue.length - 1];
                    }
                    else {
                        filetype = data.files[0].type.split('/')[1];
                        filename = data.files[0].name;
                    }
                }
                else {
                    filetype = data.files[0].type.split('/')[1];
                    filename = 'image' + count + '.' + filetype;
                }
                var title = '<div class="sn-upload-header"><div class="sn-upload-filetitle">' + filename + '</div><div class="sn-upload-cancelfile"><img src="/Root/Global/images/icons/16/delete.png"></div><div class="sn-upload-clear"></div></div>';
                var error = '<div class="sn-upload-error"></div>';
                var progress = '<div class="sn-upload-progressbar"><div class="sn-upload-bar" style="width: 0%;"></div></div>';
                data.context = $('<div class="sn-upload-fileprogress">' + title + error + '<div class="sn-upload-progress">' + progress + '</div></div>').appendTo($('#progress'));
                uploaddata.push(data);

                $('#sn-upload-startbutton').removeClass('sn-submit-disabled');

                $('.sn-upload-cancelfile', data.context).on('click', function () { 
                    cancelFile(data); 
                });

                $('.sn-closebutton').on('click', function () {
                    if(inProgress){
                        if($('.overlay').length === 0){
                            overlayManager.showOverlay({
                                text: '<%= SenseNetResourceManager.Current.GetString("Controls", "AboortUploadFull")%>'
                            }); 
                        }
                        $popup = $('.overlay');

                        $popup.find('.buttonRow').css({'text-align':'right','margin-top':'20px'});
                        $popup.find('.sn-abortbutton').css('margin-right','10px');

                        $popup.find('.sn-abortbutton').on('click', function(){
                            cancelFile(data); 
                            overlayManager.hideOverlay();
                            window.location = backUrl;
                        });
                        $popup.find('.sn-cancel').on('click', function(){
                            overlayManager.hideOverlay();
                        });
                    }
                    else {
                        window.location = backUrl;
                    }
                });

                //data.submit();
            },
            fail: function (e, data) {
                var $error = $('.sn-upload-error', data.context);
                var json = (data.jqXHR.responseText) ? jQuery.parseJSON(data.jqXHR.responseText) : data.result;
                if (typeof (json) == 'undefined') {
                    $error.text($('#sn-upload-othererror').text());
                } else {
                    $error.text(json.error.message.value);
                }
                $error.show();
                inProgress = false;
            },
            done: function (e, data) {
                inProgress = false;
                var json = (data.jqXHR.responseText) ? jQuery.parseJSON(data.jqXHR.responseText) : data.result;
                $('.sn-upload-bar', data.context).addClass('sn-upload-uploadedbar');

                var filename = json.Name;
                var url = json.Url;
                $('.sn-upload-filetitle', data.context).html('<a href="' + url + '">' + filename + '</a>');

                SN.Upload.uploadFinished(data.formData.ChunkToken);
            }
        });

        function checkLocalstorage(d){
            var fileName = d.files[0].name;
            SN.Upload.removeItemByKey(SN.Upload.getItemByName(fileName));
        }
    });
        $('.sn-upload-area').on('dragover', function () {
            $(this).addClass('active');
        });
        $('.sn-upload-area').on('dragleave', function () {
            $(this).removeClass('active');
        });
        $('.sn-upload-area').on('drop', function () {
            $(this).removeClass('active');
        });
</script>
