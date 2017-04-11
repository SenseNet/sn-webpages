// using $skin/scripts/sn/SN.js
// using $skin/scripts/ODataManager.js
// using $skin/scripts/jquery/jquery.js

SN.ContentName = {
    invalidChars: '',
    placeHolderSymbol: '',
    invalidCharsAdditionalAlphabet: { '%': '25', '*': '2a', '\'': '27', '~': '7e', '_': '5f' },
    contentPath: '',
    InitUrlNameControl: function (textboxId, extensionTextId, labelId, editbuttonId, cancelbuttonId, displayNameAvailableControlId, editable, isNewContent, contentPath)
    {
        SN.ContentName.contentPath = contentPath;

        var $textbox = $('#' + textboxId);
        var $label = $('#' + labelId);
        var $editbutton = $('#' + editbuttonId);
        var $cancelbutton = $('#' + cancelbuttonId);
        var $extensionText = extensionTextId == '' ? null : $('#' + extensionTextId);
        var $displayNameAvailableControl = $('#' + displayNameAvailableControlId);

        var fullWidth = $('.sn-iu-control').width();
        var pathWidth = $('.sn-urlname').width();
        var nameWidth = $('.sn-iu-control span').width();

        var mustHaveWidth = nameWidth + 50;
        var restPathWidth = fullWidth - mustHaveWidth;


        var typedWidth = $('.sn-urlname-label').width() + 20;



        if (typedWidth > restPathWidth)
        {
            $('.sn-urlname').width(fullWidth);
            $('.sn-urlname-label-and-button').css({ 'clear': 'both', 'display': 'block', 'float': 'left', 'margin-top': '-30px' });
        }
        else if ($('.sn-urlname').width() < restPathWidth)
        {
            $('.sn-urlname').css('width', 'auto');
        }
        else if ($('.sn-iu-control input').hasClass('sn-urlname-extensionlabel'))
        {
            $('.sn-urlname').css({ 'width': restPathWidth - 160, 'overflow': 'hidden', 'white-space': 'nowrap', 'text-overflow': 'ellipsis' });
        }
        else if ($('.sn-urlname-label-and-button').width() > 500)
        {
            $('.sn-urlname').css('width', fullWidth);
        }

        else
        {
            if (pathWidth > restPathWidth)
            {
                $('.sn-urlname').css({ 'width': restPathWidth, 'overflow': 'hidden', 'white-space': 'nowrap', 'text-overflow': 'ellipsis' });
            }
        }

        var $container = SN.ContentName.GetCommonContainer($textbox);
        var $titleBox = $('.sn-urlname-name', $container);

        // set state of displayNameAvailableControl indicating the presence of displayname field
        if ($displayNameAvailableControl.length > 0)
        {
            $displayNameAvailableControl.val($titleBox.length);
        }

        // new content: editable if no displayname field present
        // old content: editable if 'editable' is true
        if (($titleBox.length == 0 && isNewContent == 'true') || (editable == 'true'))
        {
            // this control is automatically editable
            if ($textbox.length > 0 && $label.length > 0 && $editbutton.length > 0 && $cancelbutton.length > 0)
            {
                $textbox.show();
                if ($extensionText && $extensionText.length > 0)
                    $extensionText.show();
                $label.hide();
                $editbutton.hide();
                $cancelbutton.hide();
            }
        }
    },
    InitNameControl: function (nameAvailableControlId, invalidChars, placeHolderSymbol)
    {
        SN.ContentName.invalidChars = invalidChars;
        SN.ContentName.placeHolderSymbol = placeHolderSymbol;

        var $nameAvailableControl = $('#' + nameAvailableControlId);

        var $container = SN.ContentName.GetCommonContainer($nameAvailableControl);
        var $titleBox = $('.sn-urlname-control', $container);

        // set state of nameAvailableControl indicating the presence of name field
        if ($nameAvailableControl.length > 0)
        {
            $nameAvailableControl.val($titleBox.length);
        }
    },
    EditUrlName: function (textboxId, extensionTextId, labelId, editbuttonId, cancelbuttonId)
    {
        var $textbox = $('#' + textboxId);
        var $label = $('#' + labelId);
        var $editbutton = $('#' + editbuttonId);
        var $cancelbutton = $('#' + cancelbuttonId);
        var $extensionText = extensionTextId == '' ? null : $('#' + extensionTextId);
        if ($textbox.length > 0 && $label.length > 0 && $editbutton.length > 0 && $cancelbutton.length > 0)
        {

            $textbox.show();
            if ($extensionText && $extensionText.length > 0)
                $extensionText.show();
            $label.hide();
            $editbutton.hide();
            $cancelbutton.show();


            var controlWidth = $('.sn-iu-control').width();
            var inputWidth = $('.sn-urlname-control').width();
            var inputWidth2 = $('.sn-urlname-extensionlabel').width();
            var buttonWidth = $('.CancelButtonControl').width();
            var urlNameMaxLength = controlWidth - (inputWidth + inputWidth2 + buttonWidth);

            var fullPath = $('.sn-urlname').text();
            var splitPath = fullPath.split('/');
            var lastFolder = splitPath[splitPath.length - 2];
            var newFullPath = fullPath.replace(lastFolder, '');
            newFullPath = newFullPath.slice(0, -1);

            $('.sn-path-lastfolder').text('/' + lastFolder + '/');


            $('.sn-urlname').html(newFullPath);

            var lastFolderWidth = $('.sn-path-lastfolder').width();

            if (lastFolderWidth > 150)
            {
                lastFolderWidth = 150;
            }
            else
            {
                lastFolderWidth = lastFolderWidth;
            }

            var restPathWidth = urlNameMaxLength - lastFolderWidth - 36;

            if ($('.sn-urlname').width() > restPathWidth)
            {
                $('.sn-urlname').css({ 'width': restPathWidth, 'text-overflow': 'ellipsis', 'white-space': 'nowrap', 'overflow': 'hidden', 'float': 'left', 'line-height': '24px' });
                $('.sn-urlname').next('div').show().css({ 'text-overflow': 'ellipsis', 'white-space': 'nowrap', 'overflow': 'hidden', 'max-width': '150px' });
            }
            return false;
        }
    },
    CancelEditingUrlName: function (textboxId, extensionTextId, labelId, editbuttonId, cancelbuttonId)
    {
        var $textbox = $('#' + textboxId);
        var $label = $('#' + labelId);
        var $editbutton = $('#' + editbuttonId);
        var $cancelbutton = $('#' + cancelbuttonId);
        var $extensionText = extensionTextId == '' ? null : $('#' + extensionTextId);


        if ($textbox.length > 0 && $label.length > 0 && $editbutton.length > 0 && $cancelbutton.length > 0)
        {
            var urlname = $label.text();
            var path = $('.sn-urlname').html().slice(0, -1);
            var parentPath = $('.sn-urlname').next('div').html();

            var newFullPath = path + parentPath;

            // extensiontext is present $textbox should only contain filename
            if ($extensionText && $extensionText.length > 0)
            {
                var fileNameAndExtension = SN.ContentName.GetFileAndExtension(urlname);
                $textbox.val(fileNameAndExtension.fileName);
                $extensionText.val(fileNameAndExtension.extension);
                $label.text(urlname);
                $('.sn-urlname').css('width', 'auto').html(newFullPath);
                $('.sn-urlname').next('div').hide();

                var fullWidth = $('.sn-iu-control').width();
                var pathWidth = $('.sn-urlname').width();
                var nameWidth = $('.sn-iu-control span').width();

                var mustHaveWidth = nameWidth + 30;
                var restPathWidth = fullWidth - mustHaveWidth;

                $('.sn-urlname').css('width', restPathWidth);



            } else
            {
                $textbox.val(urlname);
                $label.text(urlname);
                var fullWidth = $('.sn-iu-control').width();
                var pathWidth = $('.sn-urlname').width();
                var nameWidth = $('.sn-urlname-label').width() + 20;
                var mustHaveWidth = nameWidth + 30;
                var restPathWidth = fullWidth - mustHaveWidth;
                $('.sn-urlname').css('width', (fullWidth - nameWidth)).html(newFullPath);
                $('.sn-urlname').next('div').hide();

                if (pathWidth < restPathWidth)
                {
                    $('.sn-urlname').css('width', 'auto');
                }

                if ($('.sn-urlname-label-and-button').width() > 500)
                {
                    $('.sn-urlname').css('width', fullWidth);
                }

            }
            $textbox.hide();
            if ($extensionText && $extensionText.length > 0)
                $extensionText.hide();
            $label.show();
            $editbutton.show();
            $cancelbutton.hide();

        }
    },
    GetCommonContainer: function ($control)
    {
        return $control.closest('.sn-portlet');
    },
    GetTitleForUrlTextbox: function ($textbox)
    {
        var $container = SN.ContentName.GetCommonContainer($textbox);
        var $titleBox = $('.sn-urlname-name', $container);
        if ($titleBox.length > 0)
            return $titleBox.val();
        return "";
    },
    GetNameFromServerTimer: null,
    GetNameFromServer: function (contentPath, title, textboxId, originalName) {
        odata.customAction({
            path: odata.getItemUrl(contentPath),
            action: 'GetNameFromDisplayName',
            params: {
                displayName: title
            }
        }).done(function (data) {
            SN.ContentName.SetContentName(textboxId, originalName, data);
        });
    },
    TextEnter: function (textboxId, originalName)
    {
        var $titleBox = $('#' + textboxId);
        if ($titleBox)
        {
            var $container = SN.ContentName.GetCommonContainer($titleBox);
            var $nameBox = $('.sn-urlname-control', $container);
            var $nameLabel = $('.sn-urlname-label', $container);
            var $nameExtensionLabel = $('.sn-urlname-extensionlabel', $container);
            if ($container.length > 0 && $nameBox.length > 0 && $nameLabel.length > 0 && $nameExtensionLabel.length > 0)
            {
                var title = $titleBox.val();

                // check if title ends with extension
                var extension = $nameExtensionLabel.val();
                var nameLength = title.length - extension.length;
                if (nameLength >= 0 && title.indexOf(extension, nameLength) == nameLength && extension.length > 0) {
                    title = title.substring(0, nameLength - 1);
                }

                // transform display name to url name with the current server's algorithm.
                clearTimeout(SN.ContentName.GetNameFromServerTimer);
                SN.ContentName.GetNameFromServerTimer =
                    setTimeout(SN.ContentName.GetNameFromServer, 511, SN.ContentName.contentPath, title, textboxId, originalName);
            }
        }
    },
    SetContentName: function (textboxId, originalName, newName) {
        var $titleBox = $('#' + textboxId);
        if ($titleBox) {
            var $container = SN.ContentName.GetCommonContainer($titleBox);
            var $nameBox = $('.sn-urlname-control', $container);
            var $nameLabel = $('.sn-urlname-label', $container);
            var $nameExtensionLabel = $('.sn-urlname-extensionlabel', $container);
            if ($container.length > 0 && $nameBox.length > 0 && $nameLabel.length > 0 && $nameExtensionLabel.length > 0) {
                var extension = $nameExtensionLabel.val();

                var validName = newName;
                if (validName.length == 0)
                    validName = originalName;

                // name may not end neither with '.' nor with '-'
                while (validName.charAt(validName.length - 1) == '.' || validName.charAt(validName.length - 1) == SN.ContentName.placeHolderSymbol)
                    validName = validName.substring(0, validName.length - 1);

                // add extension
                fullName = validName;
                var ext = $nameExtensionLabel.val();
                if (ext.length > 0)
                    fullName = validName + '.' + ext;

                $nameLabel.text(fullName);

                var fullWidth = $('.sn-iu-control').width();
                var pathWidth = $('.sn-urlname').width();
                var restWidth = fullWidth - pathWidth;
                var typedWidth = $('.sn-urlname-label').width() + 20;

                if (typedWidth > restWidth) {
                    $('.sn-urlname-label-and-button').css({ 'clear': 'both', 'display': 'block', 'float': 'left', 'margin-top': '-30px' });
                }
                if ($nameBox.is(':visible'))
                    return;
                $nameBox.val(validName);
            }
        }
    },
    RemoveInvalidCharacters: function (s)
    {
        //TODO: The system does not use this method anymore.

        // replace the escape character with its escaped form
        var validName = s.replace(new RegExp("[" + SN.ContentName.placeHolderSymbol + "]", 'g'),
            SN.ContentName.placeHolderSymbol + SN.ContentName.invalidCharsAdditionalAlphabet[SN.ContentName.placeHolderSymbol]);

        validName = validName.replace(new RegExp(SN.ContentName.invalidChars, 'g'), function (match) {
            // we encode special characters and replace the escape character ('%') with an underscore
            return encodeURIComponent(match).replace('%', SN.ContentName.placeHolderSymbol).toLowerCase();
        }).replace(new RegExp('[%\\*\'~]', 'g'), function (match) {
            // This is needed because encodeURIComponent above does not encode all 
            // the characters that the server-side .Net method UrlEncode method does.
            return SN.ContentName.placeHolderSymbol + SN.ContentName.invalidCharsAdditionalAlphabet[match]
        });

        return validName;
    },
    GetNoAccents: function (r)
    {
        //TODO: The system does not use this method anymore.
        r = r.replace(new RegExp("[àáâãäå]", 'g'), "a");
        r = r.replace(new RegExp("[ÀÁÂÃÄÅ]", 'g'), "A");
        r = r.replace(new RegExp("æ", 'g'), "ae");
        r = r.replace(new RegExp("Æ", 'g'), "AE");
        r = r.replace(new RegExp("ç", 'g'), "c");
        r = r.replace(new RegExp("Ç", 'g'), "C");
        r = r.replace(new RegExp("[èéêë]", 'g'), "e");
        r = r.replace(new RegExp("[ÈÉÊË]", 'g'), "E");
        r = r.replace(new RegExp("[ìíîï]", 'g'), "i");
        r = r.replace(new RegExp("[ÌÍÎÏ]", 'g'), "I");
        r = r.replace(new RegExp("ñ", 'g'), "n");
        r = r.replace(new RegExp("Ñ", 'g'), "N");
        r = r.replace(new RegExp("[òóôõöőø]", 'g'), "o");
        r = r.replace(new RegExp("[ÒÓÔÕÖŐØ]", 'g'), "O");
        r = r.replace(new RegExp("œ", 'g'), "oe");
        r = r.replace(new RegExp("Œ", 'g'), "OE");
        r = r.replace(new RegExp("ð", 'g'), "d");
        r = r.replace(new RegExp("Ð", 'g'), "D");
        r = r.replace(new RegExp("ß", 'g'), "s");
        r = r.replace(new RegExp("[ùúûüű]", 'g'), "u");
        r = r.replace(new RegExp("[ÙÚÛÜŰ]", 'g'), "U");
        r = r.replace(new RegExp("[ýÿ]", 'g'), "y");
        r = r.replace(new RegExp("[ÝŸ]", 'g'), "Y");
        return r;
    },
    GetFileAndExtension: function (fullName)
    {
        var extension = '';
        var index = fullName.lastIndexOf('.');
        if (index != -1 && fullName.length > index + 1)
            extension = fullName.substring(index + 1);
        var filename = fullName.substring(0, fullName.length - extension.length - 1);
        return { fileName: filename, extension: extension };
    }
}
