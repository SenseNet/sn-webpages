/// <reference path="../jquery/jquery.vsdoc.js"/>

SN.ExploreTree = {

    _currentConfig: null,
    _commands: [],

    // PUBLIC FUNCTIONS ///////////////////////////////////////////////////////////////////
    open: function (config) {
        this._currentConfig = config || {};
        this._currentConfig.treeContainerId = "sn-exploretree-tree";
        this._currentConfig.showSystemFiles = $("#sn-exploretree-treeshowall").is(":checked");

        SN.ExploreTree.initLayout();
    },
    NavigateTreeToPath: function (path) {
        var parentPath = path.substring(0, path.lastIndexOf('/'));
        SN.ExploreTree.NavigateTreeToParentPath(parentPath);
    },
    NavigateTreeToParentPath: function (parentPath) {
        if (parentPath.substring(parentPath.length - 1) == "/")
            parentPath = parentPath.substring(0, parentPath.length - 1);

        this._currentConfig.InNavigation = true;
        this._currentConfig.openedNodes = this.GetOpenedNodesArray(parentPath);
        this._currentConfig.selectedNode = this.GenerateTreeNodeId(parentPath);

        // find out which treeroot does it correspond
        var treeRoots = this._currentConfig["TreeRoots"];
        if (treeRoots) {
            if (treeRoots.length == 1) {
                SN.ExploreTree.setTreeRoot(treeRoots[0]);
            } else {
                var correspondingTreeRoot = "/Root";
                var index = 0;
                for (i = 0; i < treeRoots.length; i++) {
                    if (parentPath.indexOf(treeRoots[i]) == 0) {
                        correspondingTreeRoot = treeRoots[i];
                        index = i;
                        break;
                    }
                }
                $('#sn-exploretree-treeroot').val(index);
                SN.ExploreTree.setTreeRoot(correspondingTreeRoot);
            }
        } else {
            SN.ExploreTree.setTreeRoot('/Root');
        }
    },
    TrimPath: function (path) {
        if (path.substring(path.length - 1) == "/")
            path = path.substring(0, path.length - 1);
        return path;
    },
    CloseNode: function (nodeid) {
        var tree = SN.ExploreTree._currentConfig.tree;
        var node = $("#" + nodeid);
        if (node.length != 0) {
            if (node.parent().hasClass('closed')) {
                SN.ExploreTree.NextCommand();
                return;
            }
            tree.close_branch("#" + nodeid, true);
            return;
        }
        SN.ExploreTree.NextCommand();
    },
    SelectNode: function (nodeid) {
        var tree = SN.ExploreTree._currentConfig.tree;
        var node = $("#" + nodeid);
        if (node.length != 0) {
            tree.select_branch("#" + nodeid, false);
            return;
        }
        SN.ExploreTree.NextCommand();
    },
    OpenNode: function (nodeid) {
        var tree = SN.ExploreTree._currentConfig.tree;
        var node = $("#" + nodeid);
        if (node.length != 0) {
            if (node.parent().hasClass('open')) {
                SN.ExploreTree.NextCommand();
                return;
            }
            if (node.parent().hasClass('leaf')) {
                // if node was loaded originally as a leaf, it will not open, jump to next command
                if (node.attr('isleaf') == 'true') {
                    SN.ExploreTree.NextCommand();
                    return;
                }
                // otherwise try to open it
                node.parent().removeClass('leaf');
                node.parent().addClass('closed');
            }
            tree.open_branch("#" + nodeid, true, null);
            return;
        }
        SN.ExploreTree.NextCommand();
    },
    NextCommand: function () {
        if (this._commands.length == 0) {
            SN.ExploreTree.runningCommands = false;
            return;
        }

        SN.ExploreTree.runningCommands = true;

        var command = this._commands.shift();
        SN.ExploreTree._currentCommand = command.command;

        if (command.command == 'close') {
            SN.ExploreTree.CloseNode(command.path);
        }
        if (command.command == 'open') {
            SN.ExploreTree.OpenNode(command.path);
        }
        if (command.command == 'select') {
            SN.ExploreTree.SelectNode(command.path);
        }
    },
    RefreshPaths: function (paths) {
        this._commands = [];

        // first close everything - this ensures that if paths contain each other all will be open at the end (they don't close one another in the meantime)
        for (var i = 0; i < paths.length; i++) {
            var path = SN.ExploreTree.TrimPath(paths[i]);
            this._commands.push({ command: 'close', path: this.GenerateTreeNodeId(path) });
        }

        // now open everything
        for (var i = 0; i < paths.length; i++) {
            var path = SN.ExploreTree.TrimPath(paths[i]);
            var openedNodes = this.GetOpenedNodesArray(path);
            for (var j = 0; j < openedNodes.length; j++) {
                this._commands.push({ command: 'open', path: openedNodes[j] });
            }
        }

        SN.ExploreTree.NextCommand();
    },
    NavigateOpenTreeToParentPath: function (parentPath) {
        var parentPath = SN.ExploreTree.TrimPath(parentPath);

        this._commands = [];
        var openedNodes = this.GetOpenedNodesArray(parentPath);

        if (
            (SN.ExploreTree._currentConfig.currentAction != 'Add' && SN.ExploreTree._currentConfig.previousAction == 'Add') ||
            (SN.ExploreTree._currentConfig.currentAction != 'Upload' && SN.ExploreTree._currentConfig.previousAction == 'Upload')
            ) {
            this._commands.push({ command: 'close', path: openedNodes[openedNodes.length - 1] });
        }
        if (
            (SN.ExploreTree._currentConfig.currentAction != 'Edit' && SN.ExploreTree._currentConfig.previousAction == 'Edit') ||
            (SN.ExploreTree._currentConfig.currentAction != 'Rename' && SN.ExploreTree._currentConfig.previousAction == 'Rename')
            ) {
            this._commands.push({ command: 'close', path: openedNodes[openedNodes.length - 2] });
        }

        for (var i = 0; i < openedNodes.length; i++) {
            this._commands.push({ command: 'open', path: openedNodes[i] });
        }

        this._commands.push({ command: 'select', path: this.GenerateTreeNodeId(parentPath) });
        SN.ExploreTree.NextCommand();
    },
    WindowNavigated: function () {
        // explore frame navigated
        $urlbox = $('#sn-exploretree-urlbox');
        $urlbox.val("unknown url");
        $contentbox = $("#sn-exploretree-contentname");
        $contentbox.val("none");
        $actionbox = $("#sn-exploretree-actionname");
        $actionbox.text("none");

        try {
            var exploreFrame = parent.frames["ExploreFrame"];

            // set url info
            var loc = parent.frames["ExploreFrame"].location;
            var href = loc.href;
            if (href.indexOf("ExploreFrame.html") != -1)
                return;

            // make sure js and css files are not cached
            var newhref = SN.ExploreTree.GetNoCachePath(href);
            if (newhref != href) {
                parent.frames["ExploreFrame"].location = newhref;
                return;
            }

            var pathname = loc.pathname;
            $urlbox.val(href);

            // check if pathname starts with Root. if not, current site path should be added
            if (pathname.toLowerCase().indexOf("/root") != 0) {
                pathname = $("#sn-exploretree-currentsite").text() + pathname;
            }

            // set content
            var contentLastIdx = pathname.indexOf("?");
            var content = "none";
            if (contentLastIdx == -1)
                content = pathname;
            else
                content = href.substring(0, contentLastIdx);
            $contentbox.val(content);

            this._currentConfig.previousContent = this._currentConfig.currentContent;
            this._currentConfig.currentContent = content;

            // set action
            var actionIdx = href.indexOf("action=");
            var action = "none";
            if (actionIdx != -1) {
                var actionLastIdx = href.indexOf('&', actionIdx);
                if (actionLastIdx == -1)
                    action = href.substring(actionIdx + 7);
                else
                    action = href.substring(actionIdx + 7, actionLastIdx);
            }
            $actionbox.text(action);

            this._currentConfig.previousAction = this._currentConfig.currentAction;
            this._currentConfig.currentAction = action;

            // when explore frame is navigated because we clicked on the tree, ignore this event
            if (this._currentConfig.TreeNavigatesExplore == true) {
                this._currentConfig.TreeNavigatesExplore = false;
                return;
            }

            // otherwise navigate tree to the explore frame's location
            var path = decodeURIComponent(pathname);
            SN.ExploreTree.NavigateOpenTreeToParentPath(path);

            // navigate parent frame to create handy urls
            if (SN.ExploreTree.UrlUpdateSupported())
                parent.location = parent.location.pathname + "#" + path;
        } catch (e) {
            console.log(e);
        };
    },
    ToggleHidden: function (show) {
        this._currentConfig.showSystemFiles = show;
        SN.ExploreTree.ToggleHiddenNodes(show);
    },
    ToggleHiddenNodes: function (show) {
        var systemNodes = $("a[issystem=true]");
        $.each(systemNodes, function () {
            if (show)
                $(this).parent().show();
            else
                $(this).parent().hide();
        });
    },

    // TREE FUNCTIONS ///////////////////////////////////////////////////////////////////
    UrlUpdateSupported: function () {
        return ($.browser.msie || $.browser.mozilla);
    },
    initLayout: function () {
        // default path
        var defaultPath = this._currentConfig["DefaultPath"];
        this._currentConfig.openedNodes = SN.ExploreTree.GetOpenedNodesArray(defaultPath);
        this._currentConfig.selectedNode = SN.ExploreTree.GenerateTreeNodeId(defaultPath);

        // available tree roots
        SN.ExploreTree.InitTreeRoots();

    },
    InitTreeRoots: function () {
        // check if tree root is given in config
        var treeRoots = this._currentConfig["TreeRoots"];
        if (treeRoots) {
            $('#sn-exploretree-treerootdiv').show();
            if (treeRoots.length == 1) {
                $('#sn-exploretree-treeroottextdiv').show();
                $('#sn-exploretree-treerootselectdiv').hide();
                $('#sn-exploretree-treeroottextdiv').html(treeRoots[0]);
            }
            else {
                $('#sn-exploretree-treeroottextdiv').hide();
                $('#sn-exploretree-treerootselectdiv').show();
                var i = 0;
                $.each(treeRoots, function () {
                    var newOption = '<option value=' + i + '>' + this + '</option>';
                    $("#sn-exploretree-treeroot").append(newOption);
                    i++;
                });
            }

            // set tree position depends on the treeRoots panel's visibility
            $('#sn-exploretree-treecontainer').css("top", $('#sn-exploretree-treerootdiv').outerHeight());

            // init tree
            // if no default path is given, init tree with first treeroot, otherwise navigatetree to corresponding treeroot and path
            if (this._currentConfig.DefaultPath == null) {
                SN.ExploreTree.setTreeRoot(treeRoots[0]);
            } else {
                SN.ExploreTree.NavigateTreeToParentPath(this._currentConfig.DefaultPath);
            }
        } else {
            // init tree
            SN.ExploreTree.setTreeRoot('/Root');
        }
    },
    setTreeRoot: function (rootPath) {
        if (this._currentConfig) {
            this._currentConfig.searchRootPath = rootPath;

            // if tree is initialized (and not through NavigateTreeToPath) 
            if (this._currentConfig.openedNodes.length == 0) {
                this._currentConfig.openedNodes = this.GetOpenedNodesArray(rootPath);
                this._currentConfig.selectedNode = this.GenerateTreeNodeId(rootPath);
            }
        }

        this.initTree();

    },
    GenerateTreeNodeId: function (path) {
        if ((path == null) || (path.length == 0))
            return false;

        return 'ExploreTreeNode_' + path.replace(/\W/g, "_");
    },
    GetOpenedNodesArray: function (path) {
        if ((path == null) || (path.length == 0))
            return [];

        var path2 = path.substring(1); // leading / should be trimmed
        var paths = path2.split('/');
        var openedNodes = [];
        var currentPath = "";
        for (i = 0; i < paths.length; i++) {
            currentPath = currentPath + "/" + paths[i];
            openedNodes[i] = SN.ExploreTree.GenerateTreeNodeId(currentPath);
        }
        return openedNodes;

    },
    getTree: function () {
        return $.tree.reference($('#' + SN.ExploreTree._currentConfig.treeContainerId));
    },
    destroyTree: function () {
        var tree = SN.ExploreTree.getTree();
        if (tree)
            tree.destroy();
        $("#sn-exploretree-treecontainer").html('<div id="sn-exploretree-tree"></div>');
    },
    initTree: function () {
        // destroy if already initialized
        this.destroyTree();

        var treeConfig = {
            callback: {
                beforedata: function (NODE, TREE_OBJ) {
                    var rp = SN.ExploreTree._currentConfig.searchRootPath;
                    if ((typeof rp === "undefined") || (rp == null)) {
                        return { path: $(NODE).find("a:first").attr("path"), rootonly: "0", rnd: Math.random() };
                    } else {
                        SN.ExploreTree._currentConfig.searchRootPath = null;
                        return { path: rp, rootonly: "1", rnd: Math.random() };
                    }
                },
                onselect: function (NODE, TREE_OBJ) {
                    var path = $(NODE).find("a:first").attr("path");

                    if (!SN.ExploreTree.runningCommands)
                        SN.ExploreTree.NavigateExploreFrame(path);

                    if (SN.ExploreTree.runningCommands && SN.ExploreTree._currentCommand == 'select')
                        SN.ExploreTree.NextCommand();
                },
                onclose: function (NODE, TREE_OBJ) {
                    var childNodes = $(NODE).find("ul:first");
                    childNodes.remove();

                    SN.ExploreTree.NextCommand();
                },
                onopen: function (NODE, TREE_OBJ) {
                    SN.ExploreTree.NextCommand();
                    SN.ExploreTree.ToggleHiddenNodes(SN.ExploreTree._currentConfig.showSystemFiles);
                    $('#sn-exploretree-tree .overlay').remove();
                    $('.iconoverlay').each(function () {
                        $(this).append('<div class="overlay"><img src="/Root/Global/images/icons/16/overlay-contentlink.png" alt="Content link" class="contentlink" title="Content link"></div>');
                    });
                },
                ondata: function (DATA, TREE_OBJ) {
                    // check if folder is empty: open will not get called
                    if (SN.ExploreTree.runningCommands && SN.ExploreTree._currentCommand == 'open' && DATA.length == 0) {
                        SN.ExploreTree.NextCommand();
                        return [];
                    }

                    var newResult = [];
                    $.each(DATA, function (i, d) {
                        var item = {};
                        item.data = {};
                        item.data.title = d.Name;
                        item.data.icon = d.IconPath;
                        item.data.children = {};
                        item.data.attributes = {
                            href: "javascript:void(0);",
                            onclick: "SN.ExploreTree.TreeNodeClicked();",
                            //id: d.Id,
                            id: SN.ExploreTree.GenerateTreeNodeId(d.Path),
                            path: d.Path,   // TODO: encode special chars
                            issystem: d.IsSystemContent,
                            isleaf: d.Leaf,
                            snclass: d.ContentTypeName == "ContentLink" ? "iconoverlay" : "",
                            style: d.IsSystemContent ? "color: Gray;" : "",
                            title: d.DisplayName
                        };
                        item.data.leaf = d.Leaf;
                        if (d.Leaf != true)
                            item.state = "closed";
                        newResult.push(item);
                    });

                    newResult.sort(SN.ExploreTree.SortChildren);
                    return newResult; //return DATA;
                },
                onparse: function (STR, TREE_OBJ) {
                    return STR;
                },
                onload: function (TREE_OBJ) {
                    SN.ExploreTree._currentConfig.InNavigation = false;
                }
            },
            data: {
                async: true,
                type: "json",
                opts: {
                    async: true,
                    method: "GET",
                    url: "/OData.svc/('root')/ContentStoreGetTreeNodeAllChildren"
                }
            },
            ui: {
                theme_name: "sn"
            },
            types: {
                "default": {
                    clickable: true, // can be function
                    renameable: false, // can be function
                    deletable: false, // can be function
                    creatable: false, // can be function
                    draggable: false, // can be function
                    max_children: -1, // -1 - not set, 0 - no children, 1 - one child, etc // can be function
                    max_depth: -1, // -1 - not set, 0 - no children, 1 - one level of children, etc // can be function
                    valid_children: "all", // all, none, array of values // can be function
                    icon: {
                        image: false,
                        position: false
                    }
                }
            },
            opened: SN.ExploreTree._currentConfig.openedNodes,
            selected: SN.ExploreTree._currentConfig.selectedNode

        };

        var treeContainer = $('#' + SN.ExploreTree._currentConfig.treeContainerId);
        treeContainer.tree(treeConfig);

        var tree = SN.ExploreTree.getTree();
        this._currentConfig.tree = tree;

        // clear openednodes before next init
        SN.ExploreTree._currentConfig.openedNodes = [];

    },
    SortChildren: function (a, b) {
        if (a.data.title == null)
            return -1;
        if (b.data.title == null)
            return 1;
        if (a.data.leaf == null)
            return -1;
        if (b.data.leaf == null)
            return 1;
        if (a.data.leaf == b.data.leaf)
            return a.data.title.toLowerCase() > b.data.title.toLowerCase() ? 1 : -1;
        return a.data.leaf ? 1 : -1;
    },
    TreeNodeClicked: function () {
        // user clicked, it overrides everything
        this._commands = [];
        SN.ExploreTree.runningCommands = false;

        // onselect will be executed here
    },
    NavigateExploreFrame: function (path) {
        // navigate explore frame
        var action = $("#sn-exploretree-treeactions input:checked").val();
        var href = path + (action == "Browse" ? "" : "?action=" + action);
        href = SN.ExploreTree.GetNoCachePath(href);

        parent.frames["ExploreFrame"].location = href;

        // navigate parent frame to create handy urls
        if (this.UrlUpdateSupported())
            parent.location = parent.location.pathname + "#" + path;

        this._currentConfig.TreeNavigatesExplore = true;
    },
    GetUrlParam: function (url, key) {
        var idx = url.indexOf(key);
        var value = "";
        if (idx != -1) {
            var lastIdx = url.indexOf('&', idx);
            if (lastIdx == -1)
                value = url.substring(idx + key.length);
            else
                value = url.substring(idx + key.length, lastIdx);
        }
        return value;
    },
    GetNoCachePath: function (path) {
        // remove nocache param from backurl
        var backurl = SN.ExploreTree.GetUrlParam(path, "back=");
        var oldbackurl = backurl;
        var newbackurl = backurl;
        if (backurl != '') {
            backurl = decodeURIComponent(backurl);
            var nocacheval = SN.ExploreTree.GetUrlParam(backurl, "nocache=");
            if (nocacheval != '') {
                var repl = 'nocache=' + nocacheval;
                backurl = backurl.split(repl).join('');

                // replace ?& to ? and && to &
                backurl = backurl.split('?&').join('?');
                backurl = backurl.split('&&').join('&');

                // remove trailing & or ?
                if (backurl.substring(backurl.length - 1) == "?")
                    backurl = backurl.substring(0, backurl.length - 1);
                if (backurl.substring(backurl.length - 1) == "&")
                    backurl = backurl.substring(0, backurl.length - 1);

                newbackurl = encodeURIComponent(backurl);
            }
        }
        if (newbackurl != oldbackurl)
            path = path.split(oldbackurl).join(newbackurl);

        // check if we are browsing js/css/png...
        var pathCacheable = (path.indexOf('.js') != -1) || (path.indexOf('.css') != -1) || (path.indexOf('.jpg') != -1) || (path.indexOf('.jpeg') != -1) || (path.indexOf('.png') != -1) || (path.indexOf('.gif') != -1) || (path.indexOf('.swf') != -1);
        if (!pathCacheable)
            return path;

        // if nocache param is already given, we don't have to do anything
        if (path.indexOf('nocache=') != -1)
            return path;

        // add the nocache param to the url
        return path + (path.indexOf('?') == -1 ? '?nocache=' : '&nocache=') + Math.random();
    }
}

$(document).ready(function () {
    var targetPath = parent.location.hash.substring(1);
    targetPath = decodeURIComponent(targetPath);
    SN.ExploreTree.open({ DefaultPath: targetPath });

    // init JQuery UI elements
    $(".sn-button").button();
    $("#sn-exploretree-treeactions").buttonset().change(function () { SN.ExploreTree.TreeNodeClicked(); SN.ExploreTree.NavigateExploreFrame($("#sn-exploretree-contentname").val()); });
    $(window).resize(function () {
        var $controls = $("#sn-exploretree-controls");
        var newTop = $controls.offset().top + $controls.outerHeight();
        $("#sn-exploretree-treediv").css("top", newTop + "px");
    });
});


