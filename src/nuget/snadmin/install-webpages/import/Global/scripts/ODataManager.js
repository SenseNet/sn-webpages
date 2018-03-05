// using $skin/scripts/jquery/jquery.js
// using $skin/scripts/moment/moment.min.js

// This file is part of Sense/Net, the open source sharepoint alternative.
// License of this file is whatever license exists between you and Sense/Net Inc.

SN = typeof (SN) === "undefined" ? {} : SN;

// Class:
// Manages OData requests towards the Sense/Net Content Repository
SN.ODataManager = (function ($, undefined) {
    return function (constructorOptions) {
        // Options
        constructorOptions = $.extend({
            // The timezone difference between the local timezone of the client and the desired displayed timezone
            timezoneDifferenceInMinutes: 0
        }, constructorOptions);

        var that = this;

        /* #region private members */

        var isItemPath = function (path) {
            if (typeof path === 'undefined' || path.indexOf("/") < 0 || path.length <= 1)
                $.error("This is not a valid path.");

            return path.indexOf("('") >= 0 && path.indexOf("')") === path.length - 2;
        };

        var isCollectionPath = function (path) {
            if (typeof path === 'undefined' || path.indexOf("/") < 0 || path.length <= 1)
                $.error("This is not a valid path.");

            return !isItemPath(path);
        };

        var flattenParams = function (params, allowOnlyOdata) {
            var url = "";
            var first = true;

            for (var ii in params) {
                // Ignore non-odata properties
                if (allowOnlyOdata && ii[0] != "$" && ii != "query" && ii != "metadata" && ii != "enableautofilters" && ii != "enablelifespanfilter" && ii != "version" && ii != "scenario")
                    continue;

                if (!first)
                    url += "&";
                if (first)
                    first = false;

                url += ii + "=";

                // we should url encode parameters (for eg. #CustomField in $select, etc.)
                if (typeof (params[ii].join) === "function")
                    url += encodeURIComponent(params[ii].join(','));
                else
                    url += encodeURIComponent(params[ii]);
            }

            return url;
        };

        var verifyOptionsContentItemAndPath = function (options) {
            if (!options.contentItem || typeof (options.contentItem) !== "object")
                $.error("options.contentItem is invalid.");

            if (!options.path || typeof (options.path) !== "string")
                options.path = options.contentItem.Path;

            if (!options.path || typeof (options.path) !== "string")
                $.error("Can't save a content item without a path.");
        };

        var createCustomAction = function (creationOptions) {

            creationOptions = $.extend({
                action: "",
                mandatoryParams: [],
                params: [],
                beforeRequest: null,
                defaultPath: "",
                isODataFunction: false
            }, creationOptions || {});

            // The custom action call
            return function (options) {
                options = options || {};
                options.action = creationOptions.action;
                options.path = options.path || creationOptions.defaultPath;
                options.params = {};
                options.isODataFunction = creationOptions.isODataFunction;

                // Copying parameters to options.params
                if (creationOptions.params) {
                    for (var i = 0; i < creationOptions.params.length; i++) {
                        options.params[creationOptions.params[i]] = options[creationOptions.params[i]];
                    }
                }

                // Copying mandatory parameters to options.params and check if they are specified
                if (creationOptions.mandatoryParams) {
                    for (var i = 0; i < creationOptions.mandatoryParams.length; i++) {
                        options.params[creationOptions.mandatoryParams[i]] = options[creationOptions.mandatoryParams[i]];

                        if (typeof (options[creationOptions.mandatoryParams[i]]) === "undefined")
                            $.error('Error when initializing "' + creationOptions.action + '" action call: options.' + creationOptions.mandatoryParams[i] + ' is invalid');
                    }
                }

                // Call beforeRequest callback
                if (creationOptions.beforeRequest) {
                    var r = creationOptions.beforeRequest(options);
                    if (typeof (r) !== "undefined") {
                        // beforeRequest can short-circuit execution if it returns something
                        return r;
                    }
                }

                // Trust the rest of the doing to customAction()
                return that.customAction(options);
            };
        };

        /* #endregion private members */

        /* #region utility functions, properties */

        // Property:
        // The data root of the Sense/Net OData service
        that.dataRoot = "/OData.svc";

        // Method:
        // Parses an OData date/time string into JavaScript Date object
        that.parseODataDate = function (value) {
            // Seems that in the new format, 1753 jan 1 is null.
            if (!value || value === "1753-01-01T00:00:00") {
                return null;
            }

            // Handle the timezone difference
            var m = moment(value).add("m", constructorOptions.timezoneDifferenceInMinutes);
            var d = m.toDate();

            // If this is 0001.01.01 00:00:00 UTC then that means null in Sense/Net
            if ((+d) === -62135596800000) {
                return null;
            }

            return d;
        };

        // Method:
        // Converts a JavaScript Date object into an OData date string
        that.createODataDate = function (date) {
            if (!date) {
                return null;
            }
            var ticks = -62135596800000;
            var timezone = "+0000";

            // Handle the case when date is null
            if ((date instanceof Date) && !isNaN(+date)) {
                var m = moment(date).subtract("m", constructorOptions.timezoneDifferenceInMinutes);
                date = m.toDate();
                ticks = +date;

                // Handle the timezone difference
                timezone = m.format("ZZ");
            }

            // Create the return value with the right format
            return "/Date(" + String(ticks) + timezone + ")/";
        };

        // Method:
        // Gets the URL that refers to a single item in the Sense/Net Content Repository
        that.getItemUrl = function (path) {
            if (typeof path === 'undefined' || path.indexOf("/") < 0 || path.length <= 1)
                $.error("This is not a valid path.");
            if (isItemPath(path))
                return path;

            var lastSlashPosition = path.lastIndexOf("/");
            var name = path.substring(lastSlashPosition + 1);
            var parentPath = path.substring(0, lastSlashPosition);
            if (parentPath === '')
                parentPath = '/';

            return parentPath + "('" + name + "')";
        };

        // Method:
        // Gets the URL that refers to a single item in the Sense/Net Content Repository with data root (OData.svc)
        that.getContentUrl = function (path) {
            if (typeof path === 'undefined' || path.indexOf("/") < 0 || path.length <= 1)
                $.error("This is not a valid path.");
            if (isItemPath(path))
                return path;

            var lastSlashPosition = path.lastIndexOf("/");
            var name = path.substring(lastSlashPosition + 1);
            var parentPath = path.substring(0, lastSlashPosition);

            return that.dataRoot + parentPath + "('" + name + "')";
        };

        // Method:
        // Gets the URL that refers to a collection of items in the Sense/Net Content Repository
        that.getCollectionUrl = function (path) {
            if (typeof path === 'undefined' || path.indexOf("/") < 0 || path.length <= 1)
                $.error("This is not a valid path.");
            if (isItemPath(path)) {
                path = path.replace(/'/g, '').replace(/\)/g, "").replace(/\(/g, "/");
            }

            return that.dataRoot + path;
        }

        // Method:
        // Gets the URL that refers to a single item in the Sense/Net Content Repository by its Id
        that.getContentUrlbyId = function (id) {
            if (typeof id === 'undefined' || typeof id !== 'number' || id.length < 1 || id < 0)
                $.error("This is not a valid id.");
            return that.dataRoot + '/content(' + id + ')';
        }

        // Method:
        // Gets the parent path of the given path
        that.getParentPath = function (path) {
            if (typeof path === 'undefined' || path.indexOf("/") < 0 || path.length <= 1)
                $.error("This is not a valid path.");

            var lastSlashPosition = path.lastIndexOf("/");
            var parentPath = path.substring(0, lastSlashPosition);

            return parentPath;
        };

        that.getNameFromPath = function (path) {
            if (typeof path === 'undefined' || path.indexOf("/") < 0 || path.length <= 1)
                $.error("This is not a valid path.");
            if (isItemPath(path)) {
                path = path.substr(path.lastIndexOf('(') + 1).replace(/\)/g, "").replace(/\'/g, "");
            }
            else
                path = path.substr(path.lastIndexOf('/') + 1);

            return path;
        };

        // Method:
        // Tells if a path is an item path.
        that.isItemPath = isItemPath;

        // Method:
        // Tells if a path is a collection path.
        that.isCollectionPath = isCollectionPath;

        // Method:
        // Creates a wrapper function for a callable custom OData action
        that.createCustomAction = createCustomAction;

        /* #endregion utility functions, properties */

        /* #region basic odata features */

        // Method:
        // Gets content from the Sense/Net Content Repository via OData using the specified options.
        that.fetchContent = function (options) {
            // Options
            options = $.extend({
                path: "",
                async: true
            }, options);

            // Verify validity of path
            if (!options.path || typeof (options.path) !== "string")
                $.error("options.path is invalid");

            // Perform the AJAX request
            return $.ajax({
                type: options.type,
                url: that.dataRoot + options.path + "?" + flattenParams(options, true),
                async: options.async,
                success: options.success,
                error: options.error,
                complete: options.complete,
                skipGlobalHandlers: options.skipGlobalHandlers
            });
        };

        // Method:
        // Calls a custom action on the given content item in the Sense/Net Content Repository
        that.customAction = function (options) {
            // Options
            options = $.extend({
                path: "",
                action: "",
                async: true,
                nocache: true
            }, options);

            // Verify validity of path
            if (!options.path || typeof (options.path) !== "string")
                $.error("options.path is invalid");

            var cacheparam = '';
            if (options.nocache)
                cacheparam = '&nocache=' + new Date().getTime();

            // Perform the AJAX request
            return $.ajax({
                type: "POST",
                url: that.dataRoot + that.getItemUrl(options.path) + "/" + options.action + "?" + flattenParams(options, true) + cacheparam,
                data: options.params ? JSON.stringify(options.params) : '',
                async: options.async,
                success: options.success,
                error: options.error,
                complete: options.complete,
                skipGlobalHandlers: options.skipGlobalHandlers
            });
        };

        // Method:
        // Save the given content item to the Sense/Net Content Repository
        that.saveContent = function (options) {
            // Options
            options = $.extend({
                contentItem: null, // Object containing the properties to save
                path: null,        // Where to save the content item; if null, contentItem.Path is used instead
                async: true
            }, options);

            // Verify validity of parameters
            verifyOptionsContentItemAndPath(options);

            // Perform the AJAX request
            return $.ajax({
                url: that.dataRoot + options.path,
                dataType: "json",
                type: "PATCH",
                //data: encodeURIComponent("models=[" + JSON.stringify(options.contentItem) + "]"),
                data: "models=[" + JSON.stringify(options.contentItem) + "]",
                async: options.async,
                success: options.success,
                error: options.error,
                complete: options.complete,
                skipGlobalHandlers: options.skipGlobalHandlers
            });
        };

        // Method:
        // Creates a content item in the Content Repository (without binary properties).
        that.createContent = function (options) {
            // Options
            options = $.extend({
                contentItem: null, // Object containing the properties to save
                path: null,        // Where to save the content item; if null, contentItem.Path is used instead
                async: true
            }, options);

            // Verify validity of parameters
            verifyOptionsContentItemAndPath(options);

            // Perform the AJAX request
            return $.ajax({
                url: that.dataRoot + options.path,
                dataType: "json",
                type: "POST",
                //data: encodeURIComponent("models=[" + JSON.stringify(options.contentItem) + "]"),
                data: "models=[" + JSON.stringify(options.contentItem) + "]",
                async: options.async,
                success: options.success,
                error: options.error,
                complete: options.complete,
                skipGlobalHandlers: options.skipGlobalHandlers
            });
        };

        /* #endregion basic odata features */

        /* #region custom odata actions that are built into the Sense/Net core product */

        // Method:
        // Gets the permission entries of a content item from the Sense/Net Content Repository via OData using the specified options.
        that.getPermissions = createCustomAction({
            action: "GetPermissions",
            params: ["identity"]
        });

        // Method:
        // Gets the permission entries of a content item from the Sense/Net Content Repository via OData using the specified options.
        that.hasPermission = createCustomAction({
            action: "HasPermission",
            mandatoryParams: ["permissions"],
            params: ["user"]
        });

        // Method:
        // Deletes a content item from the Content Repository.
        that.deleteContent = createCustomAction({
            action: "Delete",
            params: ["permanent"]
        });

        //Method:
        //Deletes batch of content items from Content Repository
        that.deleteBatchContent = createCustomAction({
            action: "DeleteBatch",
            mandatory: ["paths"],
            params: ["permanent"]
        });

        // Method:
        // Moves a content item in the Content Repository to the specified target path.
        that.moveTo = createCustomAction({
            action: 'MoveTo',
            mandatoryParams: ["targetPath"]
        });

        //Method:
        //Moves batch of content items in the Content Repository to the specified target path.
        that.moveBatch = createCustomAction({
            action: 'MoveBatch',
            mandatoryParams: ["targetPath", "paths"]
        });

        //Method:
        //Copies a content item in the Content Repository to the specified target path.
        that.copyTo = createCustomAction({
            action: 'CopyTo',
            mandatoryParams: ["targetPath"]
        });

        //Method:
        //Copies batch of content items in the Content Repository to the specified target path.
        that.copyBatch = createCustomAction({
            action: 'CopyBatch',
            mandatoryParams: ["targetPath", "paths"]
        });

        //Method:
        //Adds the given content types to the Allowed content Type list.
        that.addAllowedChildTypes = createCustomAction({
            action: 'AddAllowedChildTypes',
            mandatoryParams: ["contentTypes"]
        });

        //Method:
        //Removes the given content types from the Allowed content Type list.
        that.removeAllowedChildTypes = createCustomAction({
            action: 'RemoveAllowedChildTypes',
            mandatoryParams: ["contentTypes"]
        });

        //Method:
        //Checks all IFolder objects in the Content Repository and returns all paths where AllowedChildTypes is empty.
        that.checkAllowedChildTypesOfFolders = createCustomAction({
            action: 'CheckAllowedChildTypesOfFolders'
        });

        //Method:
        //Performs an approve operation on a content.
        that.approve = createCustomAction({
            action: 'Approve'
        });

        //Method:
        //Performs a reject operation on a content.
        that.reject = createCustomAction({
            action: 'Reject',
            params: ['rejectReason']
        });

        //Method:
        //Performs a publish operation on a content.
        that.publish = createCustomAction({
            action: 'Publish'
        });

        //Method:
        //Performs a checkin operation on a content.
        that.checkIn = createCustomAction({
            action: 'Checkin',
            params: ['checkInComments']
        });

        //Method:
        //Performs a checkout operation on a content.
        that.checkOut = createCustomAction({
            action: 'CheckOut'
        });

        //Method:
        //Performs an undo check out operation on a content.
        that.undoCheckOut = createCustomAction({
            action: 'UndoCheckOut'
        });

        //Method:
        //Performs a force undo check out operation on a content.
        that.forceUndoCheckOut = createCustomAction({
            action: 'ForceUndoCheckOut'
        });

        //Method:
        //Restores an old version of the content.
        that.restoreVersion = createCustomAction({
            action: 'RestoreVersion',
            mandatoryParams: ['version']
        });

        //Method:
        //Restores a deleted content from the Trash.
        that.restore = createCustomAction({
            action: 'Restore',
            params: ['destination', 'newname']
        });

        //Method:
        //Creates or modifies a Query content.
        that.saveQuery = createCustomAction({
            action: 'SaveQuery',
            mandatoryParams: ['query', 'displayName'],
            params: ['queryType']
        });

        //Method:
        //Creates or modifies a Query content.
        that.getQueries = createCustomAction({
            action: 'GetQueries',
            mandatoryParams: ['onlyPublic']
        });

        //Method:
        //Closes a Multistep saving operation and sets the saving state of a content to Finalized.
        that.finalizeContent = createCustomAction({
            action: 'FinalizeContent'
        });

        //Method:
        //Lets administrators take over the lock of a checked out document from another user.
        that.takeLockOver = createCustomAction({
            action: 'TakeLockOver',
            params: ['user']
        });

        //Method:
        //Rebuilds or just refreshes the index document of a content and optionally of all documents in the whole subtree.
        that.rebuildIndex = createCustomAction({
            action: 'RebuildIndex',
            params: ['recursive', 'rebuildLevel']
        });

        //Method:
        //Performs a full reindex operation on the content and the whole subtree.
        that.rebuildIndexSubtree = createCustomAction({
            action: 'RebuildIndexSubtree'
        });

        //Method:
        //Refreshes the index document of the content and the whole subtree using the already existing index data stored in the database.
        that.refreshIndexSubtree = createCustomAction({
            action: 'RefreshIndexSubtree'
        });

        //Method:
        //Administrators can add new members to a group using this action.
        that.addMembers = createCustomAction({
            action: 'AddMembers',
            mandatoryParams: ["contentIds"]
        });

        //Method:
        //Administrators can remove members from a group using this action.
        that.removeMembers = createCustomAction({
            action: 'RemoveMembers',
            mandatoryParams: ["contentIds"]
        });

        //Method:
        //Users who have TakeOwnership permission for the current content can modify the Owner of this content.
        that.takeOwnership = createCustomAction({
            action: 'TakeOwnership',
            mandatoryParams: ["userOrGroup"]
        });

        //Method:
        //Identity list that contains every users/groups/organizational units that have any permission setting (according to permission level) in the subtree of the context content.
        that.getRelatedIdentities = createCustomAction({
            action: 'GetRelatedIdentities',
            mandatoryParams: ["level", "kind"]
        });

        //Method:
        //Permission list of the selected identity with the count of related content.
        that.getRelatedPermissions = createCustomAction({
            action: 'GetRelatedPermissions',
            mandatoryParams: ["level", "explicitOnly", "member"],
            params: ["includedTypes"]
        });

        //Method:
        //Content list that have explicite/effective permission setting for the selected user in the current subtree.
        that.getRelatedItems = createCustomAction({
            action: 'GetRelatedItems',
            mandatoryParams: ["level", "explicitOnly", "member", "permissions"]
        });

        //Method:
        //This structure is designed for getting tree of content that are permitted or denied for groups/organizational units in the selected subtree.
        that.getRelatedIdentitiesByPermissions = createCustomAction({
            action: 'GetRelatedIdentitiesByPermissions',
            mandatoryParams: ["level", "kind", "permissions"]
        });

        //Method:
        //This structure is designed for getting tree of content that are permitted or denied for groups/organizational units in the selected subtree.
        that.getRelatedItemsOneLevel = createCustomAction({
            action: 'GetRelatedItemsOneLevel',
            mandatoryParams: ["level", "kind", "permissions"]
        });

        //Method:
        //Returns a content collection that represents users who have enough permissions to a requested resource.
        that.getAllowedUsers = createCustomAction({
            action: 'GetAllowedUsers',
            mandatoryParams: ["permissions"]
        });

        //Method:
        //Returns a content collection that represents groups where the given user or group is member directly or indirectly.
        that.getParentGroups = createCustomAction({
            action: 'GetParentGroups',
            params: ["directOnly"]
        });

        //Method:
        //OData function for collecting all fields of all types in the system.
        that.getMetadata = createCustomAction({
            action: 'GetMetadata'
        });

        //Method:
        //Gets the complete version information about the core product and the installed applications.
        that.getVersionInfo = createCustomAction({
            action: 'GetVersionInfo'
        });

        //Method:
        //Returns the number of currently existing preview images.
        that.checkPreviews = createCustomAction({
            action: 'CheckPreviews',
            params: ['generateMissing']
        });

        //Method:
        //It clears all existing preview images for a document and starts a task for generating new ones.
        that.regeneratePreviews = createCustomAction({
            action: 'RegeneratePreviews'
        });

        //Method:
        //Returns the number of pages in a document.
        that.getPageCount = createCustomAction({
            action: 'GetPageCount'
        });

        //Method:
        //Gets information about a preview image generated for a specific page in a document. It returns with the path and the dimensions (width/height) of the image.
        that.previewAvailable = createCustomAction({
            action: 'PreviewAvailable',
            params: ["page"]
        });

        //Method:
        //Returns the full list of preview images as content items.This methods synchronously generates all missing preview images.
        that.getPreviewImagesForOData = createCustomAction({
            action: 'GetPreviewImagesForOData',
            params: ["page"]
        });

        //Method:
        //Returns the list of existing preview images (only the first consecutive batch) as objects with a few information (image path, dimensions). It does not generate any new images.
        that.getExistingPreviewImagesForOData = createCustomAction({
            action: 'GetExistingPreviewImagesForOData',
            params: ["page"]
        });


        //Method:
        //Returns the list of all ContentTypes in the system.
        that.getAllContentTypes = createCustomAction({
            action: 'GetAllContentTypes'
        });

        //Method:
        //Returns the list of the AllowedChildTypes which are set on the current Content.
        that.getAllowedChildTypesFromCTD = createCustomAction({
            action: 'GetAllowedChildTypesFromCTD'
        });

        // Method:
        // Deletes field from lists.
        that.deleteField = function (options) {
            // Options
            options = $.extend({
                path: null,        // Where to save the content item; if null, contentItem.Path is used instead
                async: true
            }, options);

            // Perform the AJAX request
            return $.ajax({
                url: that.dataRoot + that.getItemUrl(options.path),
                dataType: "json",
                type: "DELETE",
                async: options.async,
                success: options.success,
                error: options.error,
                complete: options.complete,
                skipGlobalHandlers: options.skipGlobalHandlers
            });
        };

        // Method:
        // Edits  field in lists.

        that.editField = function (options) {
            // Options
            options = $.extend({
                contentItem: null, // Object containing the properties to save
                path: null,        // Where to save the content item; if null, contentItem.Path is used instead
                async: true
            }, options);

            // Verify validity of parameters
            verifyOptionsContentItemAndPath(options);

            // Perform the AJAX request
            return $.ajax({
                url: that.dataRoot + that.getItemUrl(options.path),
                dataType: "json",
                type: options.type || -"PATCH",
                //data: encodeURIComponent("models=[" + JSON.stringify(options.contentItem) + "]"),
                data: "models=[" + JSON.stringify(options.contentItem) + "]",
                async: options.async,
                success: options.success,
                error: options.error,
                complete: options.complete,
                skipGlobalHandlers: options.skipGlobalHandlers
            });
        };

        // Method:
        // Adds new field to lists.
        that.addField = createCustomAction({
            action: "AddField"
        });

        //Method:
        // Returns whether the given form is filled by the current user or not

        that.isFilled = createCustomAction({
            action: "IsFilled"
        });

        /* #endregion custom odata actions */
    };
})(jQuery);
