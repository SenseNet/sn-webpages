// using $skin/scripts/sn/SN.js
// using $skin/scripts/sn/SN.Util.js
// using $skin/scripts/sn/SN.ListGrid.js
// using $skin/scripts/kendoui/kendo.web.min.js
// using $skin/styles/kendoui/kendo.common.min.css
// using $skin/styles/kendoui/kendo.metro.min.css
// using $skin/styles/fontawesome/font-awesome.min.css
// using $skin/styles/sn-grid.css
// resource Ctd-GenericContent
// resource List

var lang;
(function ($) {
    "use strict";
    $.Grid = function (el, options) {
        var grid = this;
        grid.$el = $(el);
        grid.el = el;
        if (grid.$el.data('Grid'))
            return;

        grid.$el.data('Grid', grid);

        if (typeof odata === 'undefined')
            var odata = new SN.ODataManager({
                timezoneDifferenceInMinutes: null
            });

        lang = options.lang || 'en';
        var userSource;
        grid.init = function () {
            var urlParams = getParams();
            userSource = createDatasource(urlParams);
            grid.$el.kendoGrid({
                dataSource: userSource,
                scrollable: false,
                sortable: true,
                filterable: options.filterable || false,
                pageable: options.pageable || {
                    refresh: true,
                    pageSizes: true,
                    buttonCount: 5
                },
                columns: options.columns,
                dataBound: function (e) {
                    if (this.dataSource.totalPages() <= 1) {
                        this.pager.element.hide();
                    }
                    if (this.dataSource.total() == 0) {
                        var colCount = this.columns.length;
                        $(e.sender.wrapper)
                            .find('tbody')
                            .append('<tr class="kendo-data-row"><td colspan="' + colCount + '" class="no-data">' + SN.Resources.List["EmptyList"] + '</td></tr>');
                    }
                    grid.$el.find('td .actionmenu-open').on('click', function () {
                        var $this = $(this);
                        if (!$this.hasClass('actionmenu-open')) {
                            grid.closeContextMenu();
                            $this.removeClass('actionmenu-close fa-caret-up').addClass('actionmenu-open fa-caret-down');
                        }
                        else {
                            $('.actionmenu-close').removeClass('actionmenu-close fa-caret-up').addClass('actionmenu-open fa-caret-down');
                            var $td = $(this).closest('td');
                            $this.removeClass('actionmenu-open fa-caret-down').addClass('actionmenu-close fa-caret-up');
                            grid.closeContextMenu($td);
                        }
                    });

                    // mark the first cell in every row with a checkbox class to aid the row selector algorithm
                    e.sender.tbody.find('tr').each(function (index, element) {
                        var cell = $(element).find('td').eq(0);
                        cell.addClass('sn-lg-cbcol');
                    });

                    grid.$el.find('input[type="checkbox"]').on('click', function () {
                        var headerCheckbox = $(this).closest('th').length > 0;
                        var $toolbar = $('#toolbar');
                        if (!headerCheckbox) {
                            if ($toolbar.length > 0) {
                                var selInputNum = grid.$el.find('input:checked').length;
                                if (selInputNum === 0)
                                    $toolbar.find('.sn-actionlinkbutton:gt(0)').attr('disabled', 'disabled');
                                else
                                    $toolbar.find('.sn-actionlinkbutton[disabled]').attr('disabled', false);
                            }
                        }
                        else {
                            var gridCheckboxes = grid.$el.find('.sn-lg-cbcol input[type="checkbox"]');
                            if ($('th.k-header input:checked').length > 0) {
                                gridCheckboxes.prop("checked", true);
                            } else {
                                gridCheckboxes.prop("checked", false);
                            }
                        }
                    });

                    var timeoutId;
                    $('#searchInGrid').on('input', function () {
                        var $this = $(this);
                        clearTimeout(timeoutId);
                        timeoutId = setTimeout(function () {
                            var value = $this.val();
                            var urlParams = getParams(value);
                            userSource = createDatasource(urlParams);

                            grid.$el.data("kendoGrid").setDataSource(userSource);
                            grid.$el.data("kendoGrid").dataSource.read();
                            grid.$el.data("kendoGrid").refresh();

                        }, 500);
                    });
                },
                toolbar: options.toolbar || null
            });
            grid.initContextMenu();

        }

        grid.initContextMenu = function () {
            var contextMenu = $('<ul style="display:none" class="sn-usergrid-actionmenu"></ul>').appendTo('body');
            $('html').click(function (e) {
                if ($(e.target).hasClass("sn-usergrid-actionmenu"))
                    return;
                if ($(e.target).closest('.sn-usergrid-actionmenu').length)
                    return;

                grid.closeContextMenu();
            });
        }

        grid.openContextMenu = function ($td) {
            var path = $td.find('.title').attr('data-url');
            var position = $td.offset();
            var width = $td.outerWidth() - 2;
            var height = $td.outerHeight();
            var $contextMenu = $('.sn-usergrid-actionmenu');
            $contextMenu.css({
                'top': position.top + height,
                'left': position.left + 1,
                'width': width
            });
            var o = {
                path: odata.getItemUrl(path) + '/Actions',
                scenario: options.scenario,
                success: function (data) {
                    for (var i = 0; i < data.d.Actions.length; i++) {
                        var item = data.d.Actions[i];
                        if (item.ClientAction)
                            var $li = $('<li><a href="javascript:void(0)" onclick="' + item.Url + '"><img src="/Root/Global/images/icons/16/' + item.Icon + '.png"></span>' + item.DisplayName + '</a></li>').appendTo($contextMenu);
                        else
                            var $li = $('<li><a href="' + item.Url + '"><img src="/Root/Global/images/icons/16/' + item.Icon + '.png"></span>' + item.DisplayName + '</a></li>').appendTo($contextMenu);
                    }
                    $contextMenu.slideDown(200);
                }
            };
            odata.fetchContent(o);
        }

        grid.closeContextMenu = function ($td) {
            var $contextMenu = $('.sn-usergrid-actionmenu');

            $contextMenu.slideUp(200, function () {
                $contextMenu.html('');
                if (typeof $td !== 'undefined')
                    grid.openContextMenu($td);
            });
        }

        function createDatasource(urlParams) {
            var path = SN.Context.currentContent.path;
            if (typeof options.path !== 'undefined')
                path = options.path;
            return new kendo.data.DataSource({
                type: 'odata',
                transport: {
                    read: {
                        url: odata.dataRoot + path + urlParams + '&metadata=no',
                        dataType: "json"
                    }
                },
                pageSize: options.pageSize || 20,
                schema: {
                    model: {
                        fields: options.fields
                    }
                }
            });
        }

        function getParams(query) {
            var params = '';
            if (typeof options.select !== 'undefined' && options.select.length > 0) {
                params += '?$select='
                for (var i = 0; i < options.select.length; i++) {
                    if (i !== options.select.length - 1)
                        params += options.select[i] + ',';
                    else
                        params += options.select[i];
                }
                if (typeof options.expand !== 'undefined' && options.expand.length > 0) {
                    params += '&$expand='
                    for (var j = 0; j < options.expand.length; j++) {
                        if (j !== options.expand.length - 1)
                            params += options.expand[j] + ',';
                        else
                            params += options.expand[j];
                    }
                }
            }
            if (typeof options.query !== 'undefined' && options.query.length > 0 && typeof query === 'undefined')
                params += '&query=' + options.query;
            else if (typeof options.query !== 'undefined' && options.query.length > 0 && typeof query !== 'undefined')
                params += '&query=' + options.query + ' AND DisplayName:*' + query + '*';
            if (typeof options.orderby !== 'undefined')
                params += '&$orderby=' + options.orderby;
            return params;
        }
    }
    $.Grid.defaultOptions = {
    };
    $.fn.Grid = function (options) {
        return this.each(function () {
            var grid = new $.Grid(this, options);
            grid.init();
        });
    };
})(jQuery);