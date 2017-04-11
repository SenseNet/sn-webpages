<%@ Control Language="C#" AutoEventWireup="true" Inherits="SenseNet.Portal.UI.SingleContentView" %>
<div class='sn-savedquery-list'>
    <ul id="savedSearchList">
    </ul>
</div>
<sn:ScriptRequest ID="utils" runat="server" Path="/Root/Global/scripts/sn/SN.Util.js" />
<input type="hidden" class="currentusername" value='<%= ((SenseNet.ContentRepository.User)SenseNet.ContentRepository.User.Current).Name %>' />
<input type="hidden" class="currentworkspaceparent" value='<%= SenseNet.Portal.Virtualization.PortalContext.Current.Workspace.ParentPath %>' />
<input type="hidden" class="currentworkspace" value='<%= SenseNet.Portal.Virtualization.PortalContext.Current.Workspace.Name %>' />
<script>
    var currentWorkspaceParentPath = $('.currentworkspaceparent').val();
    var currentWorkspace = $('.currentworkspace').val();
    var currentUsersName = $('.currentusername').val();
    var workspace = odata.getItemUrl('/Root/Sites/Default_Site');
    var savedQueries = {};
    savedQueries.public = [];
    savedQueries.private = [];
    var userDomain = '/Root/Profiles/BuiltIn';

    var getSavedQueries = odata.customAction({
        path: workspace,
        action: "GetQueries",
        params: { onlyPublic: false },
        $select: ['Query', 'Path', 'DisplayName', 'Actions', 'QueryType'],
        $expand: 'Actions',
        $orderby: "DisplayName",
        metadata: 'no'
    }).done(function (data) {
        $.each(data.d.results, function (i, item) {
            if (item.QueryType.join() === 'Public') {
                savedQueries.public.push(item);
            }
            else {
                savedQueries.private.push(item);
            }
        });
    });

    $.when(getSavedQueries).done(function () {

        $savedSearchList = $('#savedSearchList');
        var queryList = '';
        var func = function (i, query) {
            var queryType = query.QueryType;

            var hasDeletePermission = false;
            $.each(query.Actions, function (k, action) {
                if (action.Name === 'Delete') {
                    if (this.Forbidden === false) {

                        hasDeletePermission = true;
                    }
                }
            });



            if (hasDeletePermission) {
                savedQuery = '<div class="savedQuery" data-querypath="' + this.Path + '" data-querytype="' + queryType + '"><span class="saved-search-delete" title="' + SN.Resources.QueryBuilder["Delete"] + '"></span><span class="title" title="' + SN.Util.Sanitize(query.DisplayName) + '">' + SN.Util.Sanitize(query.DisplayName) + '</span><span class="data-query hidden">' + query.Query + '</span></div>'
            }
            else {
                savedQuery = '<div class="savedQuery" data-querypath="' + this.Path + '" data-querytype="' + queryType + '"><span class="title" title="' + SN.Util.Sanitize(query.DisplayName) + '">' + SN.Util.Sanitize(query.DisplayName) + '</span><span class="data-query hidden">' + query.Query + '</span></div>'
            }
            queryList += savedQuery;

            $savedSearchList.html(queryList);
        };

        queryList += "<h2>" + SN.Resources.QueryBuilder["Private"] + "</h2>";
        if (typeof savedQueries.private !== 'undefined') {
            $.each(savedQueries.private, func);
        }
        queryList += "<h2>" + SN.Resources.QueryBuilder["Public"] + "</h2>";
        if (typeof savedQueries.public !== 'undefined') {
            $.each(savedQueries.public, func);
        }

        $('#savedSearchList div.savedQuery').on('click', ' .title', function () {
            $this = $(this);
            var thisQuery = $this.siblings('span.data-query').text();
            var thisName = $this.text();
            var thisType = $this.parent().attr('data-querytype');
            var thisPath = $this.parent().attr('data-querypath');

            loadSearch(thisQuery, thisName, thisPath, thisType);
            $('.sn-savedquery-title').remove();
            $('#queryBuilder').prepend('<h2 class="sn-savedquery-title">' + thisName + '</h2>');
        });
        $('#savedSearchList div.savedQuery').on('click', '.saved-search-delete', function () {
            overlayManager.showOverlay({
                text: templates.savedQueryDelete({}),
                appendCloseButton: true
            });
            var queryPath = $(this).parent().attr('data-querypath');
            queryPath = odata.getItemUrl(queryPath);
            $('.deleteQueryButton').on('click', function () {
                odata.deleteContent({
                    path: queryPath,
                    permanent: true
                }).done(function () {
                    overlayManager.hideOverlay();
                    overlayManager.showOverlay({
                        text: resources.DeleteSuccessfulMessage,
                        appendCloseButton: true
                    });
                    location.reload(true);
                });

            });

        });

        function loadSearch(thisQuery, thisName, thisPath, thisType, resultLink, newSearch, inDocuments, searchBoxQuery) {

            if (thisQuery.indexOf('"') !== -1) {
                thisQuery = thisQuery;
            }
            else {
                if (thisQuery.indexOf(' ') !== -1 || thisQuery.indexOf('-') !== -1) {
                    thisQuery = thisQuery;
                }
                else if (thisQuery.indexOf(':') !== -1) {
                    thisQuery = thisQuery;
                }
                else {
                    thisQuery = thisQuery.replace('"*', '');
                    thisQuery = thisQuery.replace('*"', '');

                    if (thisQuery.charAt(0) === '*') {
                        thisQuery = thisQuery + '*';
                    }
                    else if (thisQuery.substr(thisQuery.length - 1) === '*') {
                        thisQuery = thisQuery;
                    }
                    else {
                        thisQuery = thisQuery + '*';
                    }
                }
            }

            clearQueryBuilder();

            $('.sn-querybuilder textarea').val(thisQuery);

            setQueryBuilder(thisQuery, thisPath, thisName, thisType, resultLink, newSearch, inDocuments, searchBoxQuery);

            var query = thisQuery.split('/*');
            var path = '/Root/Sites/Default_site';
            path += "?query=" + query[0];
            refreshList(path);
        }

        //initizale the querybuilder
        function setQueryBuilder(query, path, title, type, resultLink, newSearch, inDocuments, searchBoxQuery) {

            if (query && !searchBoxQuery) {
                query = query.replace(/\\-/g, '-');
                query = query.replace(/\-/g, '-');
                query = query.replace(/-/g, '\\-');
            }

            $('textarea#queryEditortxtarea').val(query);

            $querybuilder = $('.sn-querybuilder');

            $contentPath = odata.getItemUrl('/Root/Sites/Default_Site');

            if (query) {
                if ($('.sn-querybuilder span.query').length > 0) {
                    $('.sn-querybuilder span.query').text(query);
                }
                else {
                    $('.sn-querybuilder').append('<span style="display:none" class="query">' + query + '</span>');
                }
            }
            if (path) {
                if ($('.sn-querybuilder input.querypath').length > 0) {
                    $('.sn-querybuilder input.querypath').val(path);
                }
                else {
                    $('.sn-querybuilder').append('<input type="hidden" class="querypath" value="' + path + '" />');
                }
                $('.saveAsButton').removeClass('hidden');
            }
            if (title) {
                if ($('.sn-querybuilder input.querytitle').length > 0) {
                    $('.sn-querybuilder input.querytitle').val(title);
                }
                else {
                    $('.sn-querybuilder').append('<input type="hidden" class="querytitle" value="' + title + '" />');
                }
            }
            if (type) {
                if ($('.sn-querybuilder input.querytype').length > 0) {
                    $('.sn-querybuilder input.querytype').val(type);
                }
                else {
                    $('.sn-querybuilder').append('<input type="hidden" class="querytype" value="' + type + '" />');
                }
            }


            $('.sn-querybuilder textarea').queryBuilder({
                showQueryEditor: true,
                showQueryBuilder: true,
                content: $contentPath,
                withCommandButtons: true,
                postProcess: function (q) {
                    q = q.replace(/\\-/g, '-');
                    q = q.replace(/\-/g, '-');
                    q = q.replace(/-/g, '\\-');
                    return q + '&$expand=ModifiedBy&$select=DisplayName,Path,Icon,ModifiedBy/FullName,ModificationDate,ModifiedBy/Path&metadata=no';
                },
                commandButtons: {
                    saveButton: " + ShowSaveButton.ToString().ToLower() + @",
                    saveAsButton: " + ShowSaveAsButton.ToString().ToLower() + @",
                    clearButton: " + ShowClearButton.ToString().ToLower() + @",
                    executeButton: " + ShowExecuteButton.ToString().ToLower() + @"
                },
                events: {
                    execute: refreshResultList,
                    save: querySave,
                    saveas: querySaveAs,
                    clear: clearResultList
                },
                SR: resources,
                templates: templates,
                actionbuttonPosition: 'bottom'
            });
            $('.saveAsButton').removeClass('hidden');

        };

        //clear
        function clearQueryBuilder() {
            $('.sn-query-container, #loading, .query-result-title,.closequeryBuilder,.sn-querybuilder-buttons').remove();
            $('.sn-querybuilder').unbind('queryBuilder');
            $('.saveAsButton').addClass('hidden');
            $('.sn-querybuilder').prepend('<textarea id="queryEditortxtarea"></textarea>');
        };

        function refreshList(path) {
            path += '&$expand=ModifiedBy&$select=DisplayName,Path,Icon,ModifiedBy/FullName,ModificationDate,ModifiedBy/Path&metadata=no';
            var results = [];
            $.ajax({
                url: "/OData.svc" + path,
                dataType: "json",
                async: false,
                success: function (d) {
                    $.each(d.d.results, function (i, item) {
                        results.push(item);
                    });
                }
            });
            var results = JSON.parse(JSON.stringify(results));

            refreshResultListFromPath(query, path, results);
            $('.sn-queryresult-grid').show();
        }

        function refreshResultListFromPath(query, path, results) {
            $(".sn-queryresult-grid").kendoGrid({
                dataSource: {
                    data: results,
                    pageSize: 15
                },
                scrollable: false,
                sortable: true,
                filterable: false,
                pageable: {
                    input: true,
                    numeric: true
                },
                columns: [
                            { field: "DisplayName", title: "Title", template: "<div class='title' title='#=DisplayName#'><img src='/Root/Global/images/icons/16/#: Icon #.png' alt='#: Icon #' title='#: Icon #' class='sn-icon sn-icon16'><a href=\"#=Path#\">#=DisplayName#</a></div>" },
                            { field: "ModifiedBy", title: "Modified by", width: "200px", template: "<a title='#=ModifiedBy.FullName#' href=#=ModifiedBy.Path#''>#=ModifiedBy.FullName#</a>" },
                            { field: "ModificationDate", title: "Modification date", width: "200px", format: "{0: yyyy-MM-dd HH:mm:ss}", type: "date" }
                ]
            });
            $(".sn-queryresult-grid .sn-pt-header").remove();
            $(".sn-queryresult-grid").prepend('<div class="sn-pt-header ui-widget-header ui-corner-all ui-helper-clearfix"><div class="sn-pt-header-tl"></div><div class="sn-pt-header-center"><div class="sn-pt-icon"></div><div class="sn-pt-title">Results</div></div><div class="sn-pt-header-tr"></div></div>');
            $(".sn-queryresult-grid").slideDown('slow');


        }
    });
</script>
