// using $skin/scripts/sn/SN.Picker.js
// using $skin/scripts/sn/SN.js
// using $skin/scripts/ODataManager.js
// resource Portal

SN.PermissionEditor = {
    changeOwner: function () {
        SN.PickerApplication.open({
            MultiSelectMode: 'none',
            TreeRoots: ['/Root/IMS'],
            AllowedContentTypes: ['User'],
            callBack: function (resultData) { SN.PermissionEditor.takeOwnership(resultData[0].Id, resultData[0].DisplayName); }
        });
        return false;
    },
    takeOwnership: function (ownerId, ownerName) {
        $.ajax({
            url: odata.dataRoot + odata.getItemUrl(SN.Context.currentContent.path) + "/TakeOwnership",
            dataType: "json",
            type: "POST",
            data: JSON.stringify({ 'userOrGroup': ownerId }),
            success: function (d) {
                $('#owner').html(String.format(SN.Resources.Portal["PermEditor_TakeOwnership"], SN.Context.currentContent.displayName, ownerName));
                SN.PermissionEditor.setVisibilityOfMakeMeTheOwnerButton(ownerId);
                overlayManager.showMessage({
                    type: "success",
                    title: String.format(SN.Resources.Portal["PermEditor_TakeOwnershipSuccess"], SN.Context.currentContent.displayName, ownerName)
                });
            },
            error: function (xhr, ajaxOptions, thrownError) {
                overlayManager.showMessage({
                    type: "error",
                    title: String.format(SN.Resources.Portal["PermEditor_TakeOwnershipError"], SN.Context.currentContent.displayName, ownerName)
                });
            }
        });
    },
    setVisibilityOfMakeMeTheOwnerButton: function (newOwnerId) {
        var $makeMeOwnerButton = $('#makeMeTheOwner');
        if (SN.Context.currentUser.id == newOwnerId) {
            $makeMeOwnerButton.hide();
        }
        else {
            $makeMeOwnerButton.show();
        }
    }
}

$(document).ready(function () {
    $.ajax({
        url: odata.dataRoot + odata.getItemUrl(SN.Context.currentContent.path) + "/OwnerId/$value",
        dataType: "json",
        type: "GET",
        success: function (d) {
            SN.PermissionEditor.setVisibilityOfMakeMeTheOwnerButton(d);
        }
    });

    $('#changeOwner').on('click', function () {
        SN.PermissionEditor.changeOwner();
    });
    $('#makeMeTheOwner').on('click', function () {
        SN.PermissionEditor.takeOwnership(SN.Context.currentUser.id, SN.Context.currentUser.fullName);
    })
})