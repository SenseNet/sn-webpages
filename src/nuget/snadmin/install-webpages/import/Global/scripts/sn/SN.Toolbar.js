// using $skin/scripts/sn/SN.js
// using $skin/scripts/sn/SN.Util.js
// using $skin/scripts/sn/SN.ListGrid.js
// using $skin/styles/fontawesome/font-awesome.min.css
// using $skin/styles/sn-grid.css
// resource Action

var lang;
(function ($) {
    "use strict";
    $.Toolbar = function (el, options) {
        var toolbar = this;
        toolbar.$el = $(el);
        toolbar.el = el;
        if (toolbar.$el.data('Toolbar'))
            return;

        toolbar.$el.data('Toolbar', toolbar);

        if (typeof odata === 'undefined')
            var odata = new SN.ODataManager({
                timezoneDifferenceInMinutes: null
            });

        toolbar.init = function () {
            var path = SN.Context.currentContent.path;
            if (typeof options.path !== 'undefined')
                path = options.path;
            var userSource = new kendo.data.DataSource({
                type: 'odata',
                transport: {
                    read: {
                        url: odata.dataRoot + path + '?$select=FullName,DisplayName,Avatar,Path,ModifiedBy/FullName,ModificationDate&$expand=ModifiedBy&metadata=no',
                        dataType: "json"
                    }
                },
                pageSize: 20,
                schema: {
                    model: {
                        fields: {
                            FullName: { type: "string" },
                            ModifiedBy: { type: "object" },
                            ModificationDate: { type: "date" },
                            DisplayName: { type: "string" }
                        }
                    }
                }
            });
            var o = {
                path: odata.getItemUrl(path) + '/Actions',
                scenario: options.scenario,
                success: function (data) {
                    toolbar.build(data.d.Actions);
                }
            };

            odata.fetchContent(o);
        }

        toolbar.build = function(actions){
            for (var i = 0; i < actions.length; i++) {
                var item = actions[i];
                if (item.Name === 'Add')
                    buildAddDropdown();
                else if (item.ClientAction)
                    var $button = $('<span class="sn-actionlinkbutton"><a href="javascript:void(0)" onclick="' + item.Url + '"><img src="/Root/Global/images/icons/16/' + item.Icon + '.png">' + item.DisplayName + '</a></span>').appendTo(toolbar.$el);
                else
                    var $button = $('<span class="sn-actionlinkbutton"><a href="' + item.Url + '"><img src="/Root/Global/images/icons/16/' + item.Icon + '.png">' + item.DisplayName + '</a></span>').appendTo(toolbar.$el);
                if (item.Name.indexOf('Batch') > -1)
                    $button.attr('disabled', 'disabled');
            }
        }

        function buildAddDropdown() {
            var $button = $('<span class="sn-actionlinkbutton"><img src="/Root/Global/images/icons/16/newfile.png">' + SN.Resources.Action["Add"] + '<span class="addnew-open fa fa-caret-down"></span></span>').appendTo(toolbar.$el);
            var position = $button.offset();

            var $dropdown = $('<ul style="display: none" class="sn-addnew-dropdown"></ul>').appendTo(toolbar.$el);
            var o = {
                path: odata.getItemUrl(SN.Context.currentContent.path) + '/Actions',
                scenario: 'New',
                $select: 'Name,DisplayName,Icon,Url,ClientAction,Forbidden',
                success: function (d) {
                    for (var i = 0; i < d.d.Actions.length; i++) {
                        var item = d.d.Actions[i];
                        var option = $('<li value="' + item.Name + '"><a href="' + item.Url + '"><img src="/Root/Global/images/icons/16/' + item.Icon + '.png">' + item.DisplayName + '</a></li>').appendTo($dropdown);
                    }
                }
            };
            odata.fetchContent(o);

            $button.on('click', function () {
                var $this = $(this).find('span');
                if (!$this.hasClass('addnew-open')) {
                    toolbar.closeAddNewDropDown($('.sn-addnew-dropdown'));
                    $this.removeClass('addnew-close fa-caret-up').addClass('addnew-open fa-caret-down');
                }
                else {
                    toolbar.openAddNewDropDown($('.sn-addnew-dropdown'));
                    $this.removeClass('addnew-open fa-caret-down').addClass('addnew-close fa-caret-up');
                }
            });

            $('html').click(function (e) {
                if ($(e.target).hasClass("sn-addnew-dropdown, addnew-open, addnew-close, sn-actionlinkbutton"))
                    return;
                if ($(e.target).closest('.sn-addnew-dropdown, .addnew-open, .addnew-close, .sn-actionlinkbutton').length)
                    return;

                toolbar.closeAddNewDropDown($('.sn-addnew-dropdown'));
            });
        }

        toolbar.openAddNewDropDown = function ($dropdown) {
            $dropdown.slideDown(200);
        }

        toolbar.closeAddNewDropDown = function ($dropdown) {
            $dropdown.slideUp(200);
            $('.addnew-close').removeClass('addnew-close fa-caret-up').addClass('addnew-open fa-caret-down');
        }
    }
    $.Toolbar.defaultOptions = {
    };
    $.fn.Toolbar = function (options) {
        return this.each(function () {
            var toolbar = new $.Toolbar(this, options);
            toolbar.init();
        });
    };
})(jQuery);