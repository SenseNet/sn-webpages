// using $skin/scripts/jquery/jquery.js
// using $skin/scripts/sn/SN.js
// using $skin/scripts/kendoui/kendo.web.min.js
// using $skin/styles/sn.urllist.css
// resource FieldControlTemplates
//TODO: scriptrequest cleanup

(function ($) {

    "use strict";
    $.UrlList = function (el, options) {

        var urlList = this;
        urlList.$el = $(el);
        urlList.el = el;

        if (urlList.$el.data('AllowedChildTypes'))
            return;

        var data = options.data || '[]';
        data = JSON.parse(data);
        var $textarea = options.textarea || null;
        var callback = function () { };

        var replacedData = formatData(data);

        urlList.$el.data('UrlList', urlList);
        var $list, dataSource;

        urlList.init = function () {
            $list = $('<div class="urlListView"></div>').appendTo(urlList.$el);
            var $addNewButton = $('<a class="button btn btn-primary" href="#"><span class="k-icon k-add"></span>' + SN.Resources.FieldControlTemplates["AddNewUrl"] + '</a>').appendTo(urlList.$el);



            dataSource = new kendo.data.DataSource({
                data: replacedData,
                schema: {
                    model: {
                        id: "id",
                        fields: {
                            id: { editable: false, nullable: false },
                            SiteName: { editable: true, nullable: false },
                            AuthenticationType: { editable: true, nullable: false }
                        }
                    }
                },
                change: function (e) {
                    var d = this.data();
                    d = d.toJSON();
                    updateTextarea(d);
                }
            });

            $list.kendoListView({
                dataSource: dataSource,
                template: kendo.template(templateHtml),
                editTemplate: kendo.template(editTemplateHtml)
            });


            $addNewButton.click(function (e) {
                e.preventDefault();
                if ($('.url-view.k-edit-item').length === 0) {
                    dataSource.add(new url(createGuid(), '', 'Forms'));
                    $('.url-view').last().find('.k-edit-button').trigger('click');
                } else {
                    $('.url-view.k-edit-item input').focus();
                }
            });
        }

        urlList.initBrowse = function () {
            $list = $('<div class="urlListView"></div>').appendTo(urlList.$el);

            dataSource = new kendo.data.DataSource({
                data: replacedData,
                schema: {
                    model: {
                        id: "id",
                        fields: {
                            id: { editable: false, nullable: false },
                            SiteName: { editable: true, nullable: false },
                            AuthenticationType: { editable: true, nullable: false }
                        }
                    }
                }
            });

            $list.kendoListView({
                dataSource: dataSource,
                template: kendo.template(browseTemplateHtml)
            });
        }

        function url(id, sitename, authenticatontype) {
            this.id = id;
            this.SiteName = sitename;
            this.AuthenticationType = authenticatontype;
        }

        function createGuid() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                  .toString(16)
                  .substring(1);
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
              s4() + '-' + s4() + s4() + s4();
        }

        function updateTextarea(data) {
            if ($textarea) {
                var d = parseDataBack(data);
                $textarea.val(d);
            }
            else
                $.error('Hidden textarea is missing!');
        }

        function formatData(d) {
            var formattedData = [];
            for (var i = 0; i < d.length; i++) {
                for (var key in d[i]) {
                    var value = d[i][key];
                    formattedData.push(new url(createGuid(), key, SN.Resources.FieldControlTemplates[value]));
                }
            }
            return formattedData.sort(compare);
        }

        function compare(a, b) {
            if (a.SiteName < b.SiteName)
                return -1;
            else if (a.SiteName > b.SiteName)
                return 1;
            else
                return 0;
        }

        function parseDataBack(d) {
            var formattedData = '[';
            for (var i = 0; i < d.length; i++) {
                var authenticationType = d[i].AuthenticationType;
                if (authenticationType !== 'Windows' && authenticationType !== 'Forms')
                    authenticationType = 'None';
                var siteUrl = d[i].SiteName;
                formattedData += '{"' + siteUrl + '":"' + authenticationType + '"}';
                if (i !== d.length - 1)
                    formattedData += ',';
            }
            formattedData += ']';
            return formattedData;
        }

        //Templates

        var templateHtml = '<div class="url-view k-widget">\
            <dl id="#:id#">\
                <dt>' + SN.Resources.FieldControlTemplates["SiteName"] + '</dt>\
                <dd class="sitename">#:SiteName#</dd>\
                <dt>' + SN.Resources.FieldControlTemplates["AuthenticationType"] + '</dt>\
                <dd class="type">#:AuthenticationType#</dd>\
            </dl>\
            <div class="edit-buttons">\
                <a class="k-button k-edit-button" href="\\#"><span class="fa fa-pencil k-edit"></span></a>\
                <a class="k-button k-delete-button" href="\\#"><span class="fa fa-remove k-delete"></span></a>\
            </div>\
        </div>';

        var browseTemplateHtml = '<div class="url-view k-widget">\
            <dl id="#:id#">\
                <dt>' + SN.Resources.FieldControlTemplates["SiteName"] + '</dt>\
                <dd class="sitename">#:SiteName#</dd>\
                <dt>' + SN.Resources.FieldControlTemplates["AuthenticationType"] + '</dt>\
                <dd class="type">#:AuthenticationType#</dd>\
            </dl>\
        </div>';

        var editTemplateHtml = '<div class="url-view k-widget">\
            <dl id="#:id#">\
                <dt>' + SN.Resources.FieldControlTemplates["SiteName"] + '</dt>\
                <dd>\
                    <input type="text" class="k-textbox" data-bind="value:SiteName" name="SiteName" required="required" validationMessage="required" />\
                    <span data-for="SiteName" class="k-invalid-msg"></span>\
                </dd>\
                <dt>' + SN.Resources.FieldControlTemplates["AuthenticationType"] + '</dt>\
                <dd>\
                    <select data-bind="value: AuthenticationType">\
                        <option data-option="Forms" value="Forms">Forms</option>\
                        <option data-option="Windows" value="Windows">Windows</option>\
                        <option data-option="None" value="' + SN.Resources.FieldControlTemplates["None"] + '">' + SN.Resources.FieldControlTemplates["None"] + '</option>\
                    </select>\
                </dd>\
            </dl>\
            <div class="edit-buttons">\
                <a class="k-button k-update-button" href="\\#"><span class="k-update fa fa-check"></span></a>\
                <a class="k-button k-cancel-button" href="\\#"><span class="k-cancel fa fa-ban "></span></a>\
            </div>\
        </div>';

    }
    $.UrlList.defaultOptions = {

    };

    $.fn.UrlList = function (options) {
        return this.each(function () {
            var urlList = new $.UrlList(this, options);
            if (typeof options.mode === 'undefined' || options.mode === 'edit')
                urlList.init();
            else
                urlList.initBrowse();
        });
    };
})(jQuery);