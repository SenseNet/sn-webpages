// using $skin/scripts/sn/SN.Picker.js
// using $skin/styles/sn-permission-tree.css
// resource PermissionOverview

(function ($) {
    "use strict";
    $.PermissionOverviewTree = function (el, options) {
        var permissionOverviewTree = this;
        permissionOverviewTree.$el = $(el);
        permissionOverviewTree.el = el;
        if (permissionOverviewTree.$el.data('PermissionOverviewTree'))
            return;

        permissionOverviewTree.$el.data('PermissionOverviewTree', permissionOverviewTree);

        if (typeof odata === 'undefined')
            var odata = new SN.ODataManager({
                timezoneDifferenceInMinutes: null
            });

        var userPath = SN.Context.currentUser.path;
        var currentUser = {};
        var path = '/Root';
        var $treeContainer, treeDataSource, treeView, $topPane, $bottomPane, $middlePane, $matrix, $userContainer;
        var mode = 'currentLevel';
        permissionOverviewTree.init = function () {

            permissionOverviewTree.$el.append('<div id="topPane"></div><div id="middlePane"></div><div id="bottomPane"></div>');

            var panelHeight = $(window).height() - $('.sn-layout-head').height();
            permissionOverviewTree.$el.css({ height: panelHeight });

            permissionOverviewTree.$el.kendoSplitter({
                orientation: "vertical",
                panes: [
                            { collapsible: false, resizable: false, size: "130px", scrollable: false },
                            { collapsible: false, resizable: false },
                            { collapsible: true, resizable: false, size: "0px", scrollable: false }
                ],
                collapse: function (e) {
                    $('.k-in').removeClass('k-state-selected');
                }
            });

            $topPane = $("#topPane");
            $middlePane = $("#middlePane");
            $bottomPane = $("#bottomPane");

            var getUser = $.ajax({
                url: odata.dataRoot + odata.getItemUrl(userPath) + '?$select=FullName,Avatar,Path&metadata=no',
                dataType: "json",
                type: "GET",
                success: function (d) {
                    user = new user(d.d);
                }
            });

            $.when(getUser).done(function () {
                var template = kendo.template(userTemplate);
                var templatedUser = template(currentUser);
                permissionOverviewTree.buildTopPane(template, templatedUser);

                permissionOverviewTree.buildTree(path, userPath);
            });
        }

        permissionOverviewTree.buildTopPane = function (template, user) {
            buildUserPicker(user);
            var $userPickerButton = $('<span class="button picker-button user-picker-button">' + SN.Resources.PermissionOverview["userSelector"] + '</span>').appendTo('.user-container');

            buildRootSelector();
            var $rootSelectorButton = $('<span class="button picker-button root-picker-button">' + SN.Resources.PermissionOverview["rootSelector"] + '</span>').appendTo('.root-container');

            buildModeSwitch();

            var $parentGroupContainer = $('<div class="group-container"></div>').appendTo($middlePane);
            $treeContainer = $('<div class="sn-premission-tree"></div>').appendTo($middlePane);

            var $infoContainer = $('<div class="info-container">' + SN.Resources.PermissionOverview["infoTitle"] + '<i class="fa fa-info-circle" aria-hidden="true"></i>' + SN.Resources.PermissionOverview["infoLegend"] + '</div>').appendTo($topPane);

            $userPickerButton.on('click', function () {
                permissionOverviewTree.openPicker(
                    ['/Root/IMS'],
                    ['User'],
                    function (resultData) {
                        if (!resultData)
                            return;
                        $.ajax({
                            url: odata.dataRoot + odata.getItemUrl(resultData[0].Path) + '?$select=Avatar,FullName&metadata=no',
                            type: 'GET',
                            success: function (d) {
                                currentUser.FullName = d.d.FullName,
                                currentUser.Avatar = d.d.Avatar._deferred;
                                currentUser.Path = resultData[0].Path;
                                userPath = resultData[0].Path;
                                $userContainer.find('.user').html(template(currentUser));
                            },
                        });
                        var treeview = $treeContainer.data("kendoTreeView");
                        treeview.destroy();
                        $treeContainer.html('');
                        permissionOverviewTree.buildTree(path, resultData[0].Path);
                        closePermissionMatrix();
                    });
            });
            $rootSelectorButton.on('click', function () {
                permissionOverviewTree.openPicker(
                   ['/Root'],
                   ['Folder'],
                   function (resultData) {
                       if (!resultData)
                           return;

                       path = resultData[0].Path;
                       var treeview = $treeContainer.data("kendoTreeView");
                       treeview.destroy();
                       $treeContainer.html('');
                       permissionOverviewTree.buildTree(resultData[0].Path, currentUser.Path);
                       $('.root-container').children().first().text(path);
                   });
            });
        }

        permissionOverviewTree.buildTree = function (contentPath, userPath) {

            treeDataSource = new kendo.data.HierarchicalDataSource({
                type: "odata",
                transport: {
                    read: {
                        url: function (item) {
                            if (item.path) {
                                return odata.dataRoot + odata.getItemUrl(item.path) + '/GetChildrenPermissionInfo?identity=' + userPath;
                            }
                            else {
                                return odata.dataRoot + odata.getItemUrl(contentPath) + '/GetPermissionInfo?identity=' + userPath;
                            }
                        },
                        dataType: "json",
                        data: {
                            $select: 'path,displayName,name,isFolder,permissions,subPermissions,permissionInfo',
                            metadata: "no"
                        }
                    }
                },
                schema: {
                    parse: function (data) {
                        if (data.d.results === undefined) {
                            var item = data.d;
                            item.isFolder = item.permissionInfo.isFolder;
                            item.path = item.permissionInfo.path;
                            item.localOnly = false;
                            item.break = item.permissionInfo.break;
                            if (item.permissionInfo.permissions.length > 0) {
                                for (var i = 0; i < item.permissionInfo.permissions.length; i++)
                                    if (item.permissionInfo.permissions[i].localOnly) {
                                        item.localOnly = true;
                                    }
                            }
                            else {
                                item.break = false;
                            }

                        }
                        else {
                            for (var i = 0; i < data.d.results.length; i++) {
                                data.d.results[i].localOnly = false;
                                if (data.d.results[i].permissions.length > 0) {
                                    for (var j = 0; j < data.d.results[i].permissions.length; j++) {
                                        if (data.d.results[i].permissions[j].localOnly) {
                                            data.d.results[i].localOnly = true;
                                        }
                                    }
                                }
                                else {
                                    data.d.results[i].break = false;
                                }
                            }
                        }
                        return data;
                    },
                    model: {
                        id: 'path',
                        hasChildren: 'isFolder'
                    }
                },
                serverSorting: true,
                sort: [
                    { field: "isFolder", dir: "desc" },
                    { field: "displayName", dir: "asc" }
                ]
            });
            treeView = $treeContainer.kendoTreeView({
                dataSource: treeDataSource,
                dataTextField: "Name",
                dragAndDrop: false,
                template: treeItemTemplate,
                //dragAndDrop: true,
                select: onSelectTreeView,
                //dragend: onDragend
                dataBound: onDatabound
            }).data("kendoTreeView");
        }

        permissionOverviewTree.getPermissionMatrix = function (selectedPath, item) {
            $.ajax({
                url: odata.dataRoot + odata.getItemUrl(selectedPath) + '/GetPermissionOverview?identity=' + userPath,
                type: 'GET',
                success: function (data) {
                    permissionOverviewTree.buildPermissionMatrix(data, selectedPath);
                    permissionOverviewTree.fillPermissionMatrix(getRelevantPermissions(data[0].permissions), selectedPath);
                    resizesPanes(item);
                }
            })
        }

        permissionOverviewTree.buildPermissionMatrix = function (data, selectedPath, callback) {
            $bottomPane.html('');
            $matrix = $('<table class="permissionMatrix"></table>').appendTo($bottomPane);
            var sPath = selectedPath.replace('/', '');
            var pathArray = sPath.split('/');

            var permissions = getRelevantPermissions(data[0].permissions);
            var relatedGroupList = getGroups(data[0].permissions, selectedPath);

            var head = '<tr><td class="title"></td>';
            for (var i = 0; i < pathArray.length; i++) {
                var path = getPathForLevel(pathArray, i);
                var tr = '<tr data-url="' + path + '"><td style="padding-left: ' + (16 * i) + 'px"  class="title"><span class="k-icon k-minus noclick" role="presentation"></span>' + pathArray[i] + '</td>';
                for (var j = 0; j < permissions.length; j++) {
                    var groups = getGroupsByPermission(permissions[j]);
                    tr += '<td data-type="' + permissions[j].name + '"><i class="fa sn-icon-' + permissions[j].name + '" data-parent="' + permissions[j].type + '"  data-parentname="' + groups + '"></i></td>';
                }
                var currentLevelGroups = getGroupsOnCurrentLevel(path, relatedGroupList);
                tr += '<td class="memberships"><div title="' + currentLevelGroups + '">' + currentLevelGroups + '</div></td></tr>';
                $matrix.append(tr);
            }
            for (var x = 0; x < permissions.length; x++) {
                head += '<td title="' + permissions[x].name + '"><i class="fa sn-icon-' + permissions[x].name + '"></i></td>';
            }
            head += '</tr>';
            //$matrix.append(head);

            matrixPositioning();

            if (typeof callback !== 'undefined')
                callback();
        }

        permissionOverviewTree.fillPermissionMatrix = function (data, selectedPath) {
            for (var i = 0; i < data.length; i++) {
                var name = data[i].name;
                var allowed = data[i].allowedFrom;
                var denied = data[i].deniedFrom;

                if (allowed.length > 0) {
                    for (var x = 0; x < allowed.length; x++) {
                        var path = allowed[x].path;
                        if (path === null)
                            path = selectedPath;
                        $matrix.find('tr[data-url="' + path + '"]').find('td[data-type="' + data[i].name + '"]').removeClass('allowedimplicit  deniedexplicit deniedimplicit').addClass('allowedexplicit');
                        var index = $matrix.find('tr[data-url="' + path + '"]').index();
                        $matrix.find('tr').each(function () {
                            var $this = $(this);
                            if ($this.index() > index)
                                $this.find('td[data-type="' + data[i].name + '"]').addClass('allowedimplicit');
                        });
                    }
                }
                if (denied.length > 0) {
                    for (var y = 0; y < denied.length; y++) {
                        var path = denied[y].path;
                        if (path === null) {
                            path = selectedPath;
                        }
                        $matrix.find('tr[data-url="' + path + '"]').find('td[data-type="' + data[i].name + '"]').removeClass('allowedimplicit allowedexplicit deniedimplicit').addClass('deniedexplicit');
                        var index = $matrix.find('tr[data-url="' + path + '"]').index();
                        $matrix.find('tr').each(function () {
                            var $this = $(this);
                            if ($this.index() > index)
                                $this.find('td[data-type="' + data[i].name + '"]').addClass('deniedimplicit');
                        });
                    }
                }
            }
            //TODO: tooltip
            $matrix.kendoTooltip({
                filter: "td.allowedexplicit i, td.allowedimplicit i, td.deniedexplicit i, td.deniedimplicit i",
                content: kendo.template(tooltipTemplate),
                position: "right"
            });
        }

        function user(u) {
            currentUser.FullName = u.FullName || '';
            currentUser.Avatar = u.Avatar._deferred || '';
            currentUser.Path = u.Path || '';
        }

        function onSelectTreeView(e) {
            var path = $(e.node).find('.tree-item').attr('data-url');
            var allowed = $(e.node).find('.tree-item').attr('data-allowed');
            if (allowed !== 'false')
                permissionOverviewTree.getPermissionMatrix(path, $(e.node));
        }
        function onDatabound(e) {
            var treeview = $treeContainer.data("kendoTreeView");
            treeview.expand("li:first");
            if (mode === 'currentLevel') {
                $('.permissions').removeClass('narrow');
                $('.subpermissions').addClass('narrow');
            }
            else {
                $('.subpermissions').removeClass('narrow');
                $('.permissions').addClass('narrow');
            }
        }

        function getRelevantPermissions(permissions) {
            var array = [];
            for (var i = 0; i < permissions.length; i++) {
                if (permissions[i].name.indexOf('Custom') === -1 && permissions[i].name.indexOf('Unused') === -1)
                    array.push(permissions[i]);
            }
            return array;
        }

        function getPathForLevel(array, index) {
            var currentPath = '';
            for (var i = 0; i < index + 1; i++)
                currentPath += '/' + array[i];
            return currentPath;
        }

        function getGroups(data, selectedPath) {
            var groupList = [];
            for (var i = 0; i < data.length; i++) {
                for (var x = 0; x < data[i].allowedFrom.length; x++) {
                    var group = data[i].allowedFrom[x].identity.displayName;
                    var path = data[i].allowedFrom[x].path;
                    if (path === null)
                        path = selectedPath;
                    var groupObj = { displayName: group, path: path };
                    if (!containsObject(groupObj, groupList))
                        groupList.push(groupObj);
                }
                for (var y = 0; y < data[i].deniedFrom.length; y++) {
                    var group = data[i].deniedFrom[y].identity.displayName;
                    var path = data[i].deniedFrom[y].path;
                    if (path === null)
                        path = selectedPath;
                    var groupObj = { displayName: group, path: path };
                    if (!containsObject(groupObj, groupList))
                        groupList.push(groupObj);
                }
            }
            return groupList;
        }
        function getGroupsOnCurrentLevel(path, relatedGroupList) {
            var groupList = [];
            for (var i = 0; i < relatedGroupList.length; i++)
                if (relatedGroupList[i].path && relatedGroupList[i].path === path)
                    groupList.push(relatedGroupList[i].displayName);
            return groupList.join().replace(',', ', ');
        }

        function buildUserPicker(user) {
            $userContainer = $('<div class="user-container"></div>').appendTo($topPane);
            var $u = $('<div class="user"></div>').appendTo($userContainer);
            var $user = $(user).appendTo($u);
        }
        function buildRootSelector() {
            var $rootContainer = $('<div class="root-container"></div>').appendTo($topPane);
            var $root = $('<span>Root</span>').appendTo($rootContainer);
        }
        function buildModeSwitch() {
            var $modeContainer = $('<div class="mode-container"></div>').appendTo($topPane);
            var $switch = $('<div class="before">' + SN.Resources.PermissionOverview["OwnPermission"] + '</div><div class="mode-switch"><input type="checkbox" class="mode-switch-checkbox" id="mode-switch-checkbox"><label for="mode-switch-checkbox" class="mode-switch-label"></label></div><div class="after">' + SN.Resources.PermissionOverview["SubtreePermission"] + '</div>').appendTo($modeContainer);

            $switch.on('change', function () {
                var $permissionRow = $treeContainer.find('.permissions');
                var $subPermissionRow = $treeContainer.find('.subpermissions');
                if ($permissionRow.hasClass('narrow')) {
                    $permissionRow.removeClass('narrow');
                    $subPermissionRow.addClass('narrow');
                    mode = 'currentLevel';
                }
                else {
                    $subPermissionRow.removeClass('narrow');
                    $permissionRow.addClass('narrow');
                    mode = 'subTree';
                }
            });
        }

        function resizesPanes($item) {
            var matrixHeight = $('#bottomPane').find('table').height() + 60;
            var remainingHeight = permissionOverviewTree.$el.height() - 137 - matrixHeight;
            var splitter = permissionOverviewTree.$el.data("kendoSplitter");
            splitter.expand("#bottomPane");
            splitter.size("#bottomPane", matrixHeight + 7);
            splitter.size("#middlePane", remainingHeight);
        }
        function matrixPositioning() {
            var leftMargin = $treeContainer.offset().left;
            $bottomPane.find('table').css('margin-left', leftMargin);
            //calc(80% - 500px)
        }
        function closePermissionMatrix() {
            var matrixHeight = $('#bottomPane').find('table').height();
            var remainingHeight = permissionOverviewTree.$el.height() - 137 + matrixHeight;
            var splitter = permissionOverviewTree.$el.data("kendoSplitter");
            splitter.collapse("#bottomPane");
            splitter.size("#middlePane", remainingHeight);
        }

        function containsObject(obj, list) {

            for (var i = 0; i < list.length; i++) {
                if (list[i].displayName === obj.displayName && list[i].path === obj.path)
                    return true;
            }

            return false;
        }

        function getGroupsByPermission(permission) {
            var groupList = [];
            for (var i = 0; i < permission.allowedFrom.length; i++)
                if (groupList.indexOf(permission.allowedFrom[i].identity.displayName) === -1)
                    groupList.push(permission.allowedFrom[i].identity.displayName);
            for (var i = 0; i < permission.deniedFrom.length; i++)
                if (groupList.indexOf(permission.deniedFrom[i].identity.displayName) === -1)
                    groupList.push(permission.deniedFrom[i].identity.displayName);
            return groupList.join().replace(',', ', ');
        }

        permissionOverviewTree.openPicker = function (treeRoot, allowedContentTypes, callback) {
            SN.PickerApplication.open({
                MultiSelectMode: 'none', TreeRoots: treeRoot, AllowedContentTypes: allowedContentTypes,
                callBack: callback
            }); return false;
        }

        //user template
        var userTemplate = '<img src="#=Avatar#" /><span>#=FullName#</span>';

        var treeItemTemplate = "#if(typeof item.displayName !== 'undefined'){#\
                                <span data-allowed='${item.permissions.length > 0}' class='tree-item' data-url='#=item.path#' data-folder='#=item.isFolder#'><span class='title'>#= item.displayName #</span>\
                                # } else {#\
                                <span data-allowed='${item.permissionInfo.permissions.length > 0}' class='tree-item' data-url='#=item.permissionInfo.path#' data-folder='#=item.permissionInfo.isFolder#'><span class='title'>#= item.permissionInfo.displayName #</span># } #\
                                <span>\
                                    #if(typeof item.permissions !== 'undefined'){#\
                                    <div class='permissions'><ul>\
                                        #if(item.permissions.length > 0){#\
                                            #for (var i=0,len=item.permissions.length; i<len; i++){#\
                                            <li title='${ item.permissions[i].name }' class='${ item.permissions[i].type }'><i class='fa sn-icon-${ item.permissions[i].name }' /></li>\
                                            # }  } else { #\
                                                <li title='${ SN.Resources.PermissionOverview.NoPermissionToSeeCurrentContentPermissions }' class='nopermission'>${ SN.Resources.PermissionOverview.NoPermissionToSeeCurrentContentPermissions }</li>\
                                            # }   #\
                                    </ul></div>\
                                    <div class='subpermissions'><ul>\
                                    #if(item.subPermissions.length > 0){#\
                                        #for (var i=0,len=item.subPermissions.length; i<len; i++){#\
                                            <li title='${ item.permissions[i].name } from subtree' class='${ item.subPermissions[i].type }'><i class='fa sn-icon-${ item.subPermissions[i].name }' /></li>\
                                        # }  } else { #\
                                                <li title='${ SN.Resources.PermissionOverview.NoPermissionToSeeSubPermissions }' class='nopermission'>${ SN.Resources.PermissionOverview.NoPermissionToSeeSubPermissions }</li>\
                                            # }   #\
                                    </ul></div>\
                                    # } else{#\
                                    <div class='permissions'><ul>\
                                        #if(item.permissionInfo.permissions.length > 0){#\
                                        #for (var i=0,len=item.permissionInfo.permissions.length; i<len; i++){#\
                                            <li title='${ item.permissionInfo.permissions[i].name }' class='${ item.permissionInfo.permissions[i].type }'><i class='fa sn-icon-${ item.permissionInfo.permissions[i].name }' /></li>\
                                        # }  } else { #\
                                                <li title='${ SN.Resources.PermissionOverview.NoPermissionToSeeCurrentContentPermissions }' class='nopermission'>${ SN.Resources.PermissionOverview.NoPermissionToSeeCurrentContentPermissions }</li>\
                                            # }   #\
                                    </ul></div>\
                                    <div class='subpermissions'><ul>\
                                    #if(item.permissionInfo.subPermissions.length > 0){#\
                                        #for (var i=0,len=item.permissionInfo.subPermissions.length; i<len; i++){#\
                                            <li title='${ item.permissionInfo.permissions[i].name } from subtree' class='${ item.permissionInfo.subPermissions[i].type }'><i class='fa sn-icon-${ item.permissionInfo.subPermissions[i].name }' /></li>\
                                       # }  } else { #\
                                                <li title='${ SN.Resources.PermissionOverview.NoPermissionToSeeSubPermissions }' class='nopermission'>${ SN.Resources.PermissionOverview.NoPermissionToSeeSubPermissions }</li>\
                                            # }   #\
                                    </ul></div>\
                                    # } #\
                                </span>\
                                <span data-localOnly='#=item.localOnly#' title='${SN.Resources.PermissionOverview['LocalOnly']}'></span>\
                                <span data-break='#=item.break#' title='${SN.Resources.PermissionOverview['Break']}'></span>\
                                </span>";
        var tooltipTemplate = "<i class='fa sn-icon-#=target.data('parent')#'></i><span>#=target.data('parentname')#</span>";

    }
    $.PermissionOverviewTree.defaultOptions = {
    };
    $.fn.PermissionOverviewTree = function (options) {
        return this.each(function () {
            var permissionOverviewTree = new $.PermissionOverviewTree(this, options);
            permissionOverviewTree.init();
        });
    };

})(jQuery);
