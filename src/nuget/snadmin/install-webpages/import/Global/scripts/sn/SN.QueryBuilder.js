// using $skin/scripts/kendoui/kendo.web.min.js
// using $skin/scripts/jquery/plugins/InputMachinator.js
// using $skin/scripts/sn/SN.Picker.js
// resource QueryBuilder


(function ($) {
    $.fn.extend({
        queryBuilder: function (options) {
            var $element = this;
            var storage = []; //<?
            var showQueryEditor = options.showQueryEditor || true;
            var showQueryBuilder = options.showQueryBuilder || true;
            var metadata = options.metadata || '';
            var builderState = parseBuilderState($element.val()); //<?
            var content = options.content || "";
            var commandButtons = options.commandButtons || false;
            if (commandButtons) {
                var saveButton = options.commandButtons.saveButton || false;
                var saveAsButton = options.commandButtons.saveAsButton || false;
                var clearButton = options.commandButtons.clearButton || false;
                var executeButton = options.commandButtons.executeButton || false;
            }
            var postProcess = options.postProcess || null;
            var actionbuttonPosition = options.actionbuttonPosition || 'bottom';
            var fieldArray = [];
            var optionArray = [];
            var typesAndFields = [];
            var queryArray = [];


            var resources = $.extend({
                placeholder: SN.Resources.QueryBuilder["AddTerm"],
                queryeditor: SN.Resources.QueryBuilder["QueryEditor"],
                querybuilder: SN.Resources.QueryBuilder["QueryBuilder"],
                moverowup: SN.Resources.QueryBuilder["MoveRowUp"],
                moverowdown: SN.Resources.QueryBuilder["MoveRowDown"],
                deleterow: SN.Resources.QueryBuilder["DeleteRow"],
                warningtitle: SN.Resources.QueryBuilder["WarningTitle"],
                editorwarningmessage: SN.Resources.QueryBuilder["EditorWarningMessage"],
                builderwarningmessage: SN.Resources.QueryBuilder["BuilderWarningMessage"],
                typeboxplaceholder: SN.Resources.QueryBuilder["SelectType"],
                querytemplateboxplaceholder: SN.Resources.QueryBuilder["SelectQuery"],
                fieldboxplaceholder: SN.Resources.QueryBuilder["SelectField"],
                insert: SN.Resources.QueryBuilder["Insert"],
                EqualTooltip: SN.Resources.QueryBuilder["Equal"],
                GreaterEqualTooltip: SN.Resources.QueryBuilder["GreaterEqual"],
                LowerEqualTooltip: SN.Resources.QueryBuilder["LowerEqual"],
                GreaterTooltip: SN.Resources.QueryBuilder["Greater"],
                LowerTooltip: SN.Resources.QueryBuilder["Lower"],
                AndTooltip: SN.Resources.QueryBuilder["And"],
                OrTooltip: SN.Resources.QueryBuilder["Or"],
                NotTooltip: SN.Resources.QueryBuilder["Not"],
                LikeTooltip: SN.Resources.QueryBuilder["Like"],
                InTooltip: SN.Resources.QueryBuilder["In"],
                OpenTooltip: SN.Resources.QueryBuilder["Open"],
                CloseTooltip: SN.Resources.QueryBuilder["Close"],
                SortTooltip: SN.Resources.QueryBuilder["Sort"],
                ReversesortTooltip: SN.Resources.QueryBuilder["Reversesort"],
                TopTooltip: SN.Resources.QueryBuilder["Top"],
                SkipTooltip: SN.Resources.QueryBuilder["Skip"],
                InsertNewExpression: SN.Resources.QueryBuilder["InsertNewExpression"],
                Run: SN.Resources.QueryBuilder["Run"],
                SaveAs: SN.Resources.QueryBuilder["SaveAs"],
                Save: SN.Resources.QueryBuilder["Save"],
                Clear: SN.Resources.QueryBuilder["Clear"],
                SaveSuccess: SN.Resources.QueryBuilder["SaveSuccess"],
                DeleteSuccessfulMessage: SN.Resources.QueryBuilder["DeleteSuccessfulMessage"],
                SaveQueryTitle: SN.Resources.QueryBuilder["SaveQueryTitle"],
                SavedQueryDelete: SN.Resources.QueryBuilder["SavedQueryDelete"],
                SaveQueryNameLabel: SN.Resources.QueryBuilder["SaveQueryNameLabel"],
                SaveQueryPlaceholder: SN.Resources.QueryBuilder["SaveQueryPlaceholder"],
                SaveQueryShareLabel: SN.Resources.QueryBuilder["SaveQueryShareLabel"],
                SaveQuerySaveButton: SN.Resources.QueryBuilder["SaveQuerySaveButton"],
                SaveQueryCancelButton: SN.Resources.QueryBuilder["SaveQueryCancelButton"],
                Contains: SN.Resources.QueryBuilder["Contains"],
                BeginsWith: SN.Resources.QueryBuilder["BeginsWith"],
                EndsWith: SN.Resources.QueryBuilder["EndsWith"],
                Type: SN.Resources.QueryBuilder["Type"],
                TypeIs: SN.Resources.QueryBuilder["TypeIs"],
                InTree: SN.Resources.QueryBuilder["InTree"],
                InFolder: SN.Resources.QueryBuilder["InFolder"],
                ChooseAnExactDate: SN.Resources.QueryBuilder["ChooseAnExactDate"],
                ChooseFromTemplates: SN.Resources.QueryBuilder["ChooseFromTemplates"],
                ChooseDateType: SN.Resources.QueryBuilder["ChooseDateType"],
                ChooseQueryTemplate: SN.Resources.QueryBuilder["ChooseQueryTemplate"],
                CurrentUsersName: SN.Resources.QueryBuilder["CurrentUsersName"],
                CurrentUsersFullName: SN.Resources.QueryBuilder["CurrentUsersFullName"],
                CurrentWorkspacesPath: SN.Resources.QueryBuilder["CurrentWorkspacesPath"],
                CurrentWorkspacesDeadlinePlusSeven: SN.Resources.QueryBuilder["CurrentWorkspacesDeadlinePlusSeven"],
                CurrentSite: SN.Resources.QueryBuilder["CurrentSite"],
                CurrentList: SN.Resources.QueryBuilder["CurrentList"],
                CurrentPage: SN.Resources.QueryBuilder["CurrentPage"],
                Today: SN.Resources.QueryBuilder["Today"],
                Yesterday: SN.Resources.QueryBuilder["Yesterday"],
                Tomorrow: SN.Resources.QueryBuilder["Tomorrow"],
                PreviousWeek: SN.Resources.QueryBuilder["PreviousWeek"],
                ThisWeek: SN.Resources.QueryBuilder["ThisWeek"],
                NextWeek: SN.Resources.QueryBuilder["NextWeek"],
                PreviousMonth: SN.Resources.QueryBuilder["PreviousMonth"],
                ThisMonth: SN.Resources.QueryBuilder["ThisMonth"],
                NextMonth: SN.Resources.QueryBuilder["NextMonth"],
                PreviousYear: SN.Resources.QueryBuilder["PreviousYear"],
                ThisYear: SN.Resources.QueryBuilder["ThisYear"],
                NextYear: SN.Resources.QueryBuilder["NextYear"],
                QueryTemplate: SN.Resources.QueryBuilder["QueryTemplate"]
            }, options.SR);

            var textPosition = "0";
            var toolbarbuttons = {
                equal: '<span title="' + resources.EqualTooltip + '"><span class="sn-icon sn-icon-equal" title="' + resources.EqualTooltip + '">=</span></span>',
                gtorequal: '<span title="' + resources.GreaterEqualTooltip + '"><span class="sn-icon sn-icon-gtorequal" title="' + resources.GreaterEqualTooltip + '">> =</span></span>',
                ltorequal: '<span title="' + resources.LowerEqualTooltip + '"><span class="sn-icon sn-icon-ltorequal" title="' + resources.LowerEqualTooltip + '">< =</span></span>',
                lt: '<span title="' + resources.LowerTooltip + '"><span class="sn-icon sn-icon-lt" title="' + resources.LowerTooltip + '"><</span></span>',
                gt: '<span title="' + resources.GreaterTooltip + '"><span class="sn-icon sn-icon-gt" title="' + resources.GreaterTooltip + '">></span></span>',
                and: '<span title="' + resources.AndTooltip + '"><span class="sn-icon sn-icon-and" title="' + resources.AndTooltip + '">AND</span></span>',
                or: '<span title="' + resources.OrTooltip + '"><span class="sn-icon sn-icon-or" title="' + resources.OrTooltip + '">OR</span></span>',
                not: '<span title="' + resources.NotTooltip + '"><span class="sn-icon sn-icon-not" title="' + resources.NotTooltip + '">NOT</span></span>',
                like: '<span title="' + resources.LikeTooltip + '"><span class="sn-icon sn-icon-like" title="' + resources.LikeTooltip + '">*</span></span>',
                IN: '<span title="' + resources.InTooltip + '"><span class="sn-icon sn-icon-in" title="' + resources.InTooltip + '">IN</span></span>',
                open: '<span title="' + resources.OpenTooltip + '"><span class="sn-icon sn-icon-open" title="' + resources.OpenTooltip + '">(</span></span>',
                close: '<span title="' + resources.CloseTooltip + '"><span class="sn-icon sn-icon-close" title="' + resources.CloseTooltip + '">)</span></span>',
                sort: '<span title="' + resources.SortTooltip + '"><span class="sn-icon sn-icon-sort" title="' + resources.SortTooltip + '">SORT</span></span>',
                reversesort: '<span title="' + resources.ReversesortTooltip + '"><span class="sn-icon sn-icon-reversesort" title="' + resources.ReversesortTooltip + '">REVERSESORT</span></span>',
                top: '<span title="' + resources.TopTooltip + '"><span class="sn-icon sn-icon-top" title="' + resources.TopTooltip + '">TOP</span></span>',
                skip: '<span title="' + resources.SkipTooltip + '"><span class="sn-icon sn-icon-skip" title="' + resources.SkipTooltip + '">SKIP</span></span>',
                type: '<span title="' + resources.Type + '"><span class="sn-icon sn-icon-type" title="' + resources.Type + '">Type</span></span>',
                typeis: '<span title="' + resources.TypeIs + '"><span class="sn-icon sn-icon-typeis" title="' + resources.TypeIs + '">TypeIs</span></span>',
                intree: '<span title="' + resources.InTree + '"><span class="sn-icon sn-icon-intree" title="' + resources.InTree + '">InTree</span></span>',
                infolder: '<span title="' + resources.InFolder + '"><span class="sn-icon sn-icon-infolder" title="' + resources.InFolder + '">InFolder</span></span>',
                add: '<span title="' + resources.InsertNewExpression + '"><span class="sn-icon sn-insert-row">' + resources.InsertNewExpression + '</span></span>'
            }
            var commandbuttons = {
                run: '<span class="okButton runButton">' + resources.Run + '</span>',
                saveas: '<span class="okButton saveAsButton hidden">' + resources.SaveAs + '</span>',
                save: '<span class="okButton saveButton">' + resources.Save + '</span>',
                clear: '<span class="cancelButton clearButton">' + resources.Clear + '</span>'
            }
            var cboxValue = '';
            var lastChar = null;
            var comboBoxElementTemplate = '<span title="${ data.d}">${ data.d}</span>';
            var queryTemplateComboBoxElementTemplate = '<span title="${ data.text}">${ data.text}</span>';
            var rownum = 0;
            var warningMessage = '';

            $element.hide();
            $element.addClass('sn-querybuilder-textbox');
            $element.before('<div class="sn-query-container"></div>');
            $container = $('.sn-query-container');
            if (commandButtons) {
                if (actionbuttonPosition === 'right') {
                    $container.after('<div class="sn-querybuilder-buttons buttonContainer right"></div>'); handleCommandButtons();
                }
                else if (actionbuttonPosition === 'top') {
                    $container.before('<div class="sn-querybuilder-buttons buttonContainer top"></div>'); handleCommandButtons();
                    $container.addClass('fullWidth');
                }
                else if (actionbuttonPosition === 'bottom') {
                    $container.after('<div class="sn-querybuilder-buttons buttonContainer bottom"></div>'); handleCommandButtons();
                    $container.addClass('fullWidth');
                }
            }
            var $buttonContainer = $('.sn-querybuilder-buttons');
            if (executeButton) { $buttonContainer.append(commandbuttons.run); }
            if (saveAsButton) { $buttonContainer.append(commandbuttons.saveas); }
            if (saveButton) { $buttonContainer.append(commandbuttons.save); }
            if (clearButton) { $buttonContainer.append(commandbuttons.clear); handleCommandButtons(); }
            //$container.parent().before('<h4 class="sn-savedquery-title"></h4>');
            $container.parent().before('<h4 class="sn-savedquery-title"></h4>');
            $queryHeadTitle = $('.sn-savedquery-title');
            $container.hide();
            var $queryContainerLoader = $('<div id="loading"></div>');
            $container.parent().after($queryContainerLoader);
            var $loader = $('#loading');
            $loader.show();
            var $currentItemIndex = 0;
            var selectedTypeValue = '';
            var tabs;
            if ($element.val() !== '') {

                if (builderState && showQueryBuilder) {
                    tabs = {
                        editor: '<li value="0">' + resources.queryeditor + '</li>',
                        builder: '<li class="k-state-active" value="1">' + resources.querybuilder + '</li>'
                    }
                    queryArray[0] = '';
                    queryArray[1] = $element.val();
                }
                else {
                    tabs = {
                        editor: '<li class="k-state-active" value="0">' + resources.queryeditor + '</li>',
                        builder: '<li  value="1">' + resources.querybuilder + '</li>'
                    }
                    queryArray[0] = $element.val();
                    queryArray[1] = '';
                }
            }
            else {
                tabs = {
                    editor: '<li value="0">' + resources.queryeditor + '</li>',
                    builder: '<li  class="k-state-active" value="1">' + resources.querybuilder + '</li>'
                }
                queryArray[0] = $element.val();
                queryArray[1] = '';
            }
            //templates
            //var windowTemplate = kendo.template('<div class="sn-window" id="sn-warning-window"><div class="sn-icon sn-warning"></div><div class="sn-warning-message">#= message #</div><div class="sn-warning-buttonrow"><input type="button" text="#= buttontext #" value="#= buttontext #" class="sn-submit" /></div></div>');

            var andTemplate = '<div class="and-row">AND</div>';
            var orTemplate = '<div class="or-row">OR</div>';
            var notTemplate = '<div class="not-row">NOT</div>';
            var openTemplate = '<div class="open-row">(</div>';
            var closeTemplate = '<div class="close-row">)</div>';
            var inTreeTemplate = '<div class="close-row">InTree:</div>';
            var inFolderTemplate = '<div class="close-row">InFolder:</div>';
            var expressionTemplate = '<div class="expression-row"><div class="sn-querybuilder-comboboxes"><input class="types" /><input class="fields" /></div><div class="sn-query-operation-ddown"><select class="sn-operation-ddown" style="width: 100%"><option>=</option><option>>=</option><option><=</option><option>></option><option><</option><option value="*">' + resources.Contains + '</option><option value="bw">' + resources.BeginsWith + '</option><option value="ew">' + resources.EndsWith + '</option></select></div><div class="sn-querybuilder-txt"><input type="text"/></div></div>';
            var expressionWithoutTypeTemplate = '<div class="expression-row"><div class="sn-querybuilder-comboboxes"><input class="fields" /></div><div class="sn-query-operation-ddown"><select class="sn-operation-ddown" style="width: 100%"><option>=</option><option>>=</option><option><=</option><option>></option><option><</option><option value="*">' + resources.Contains + '</option><option value="bw">' + resources.BeginsWith + '</option><option value="ew">' + resources.EndsWith + '</option></select></div><div class="sn-querybuilder-txt"><input type="text"/></div></div>';
            var sortTemplate = '<div class="sort-row">Sort: </div>';
            var reversesortTemplate = '<div class="reversesort-row">Reversesort: </div>';
            var topTemplate = '<div class="top-row">Top: <input type="number" /></div>';
            var skipTemplate = '<div class="skip-row">Skip: <input type="number" /></div>';
            var templates = [andTemplate, orTemplate, notTemplate, openTemplate, closeTemplate, inTreeTemplate, inFolderTemplate, expressionTemplate]
            //templates end

            if (options.metadata) {

                $.each(metadata, function (i, item) {
                    typesAndFields.push({ n: item.Name, d: item.DisplayName, t: item.Type, q: item.Choices });
                });
            }
            else {
                var getTypesAndFields = $.ajax({
                    url: "/OData.svc" + content + "/GetQueryBuilderMetadata",
                    dataType: "json",
                    type: "POST"
                }).done(function (d) {
                    JSON.stringify(d);
                    $.each(d, function (key) {
                        $.each(d[key], function (i, item) {
                            typesAndFields.push(item);
                        });
                    });
                });
            }

            var $cboxContainer = $('<div class="sn-query-builder-comboboxes"></div>');

            //$builderbottomtoolbarcontainer = $('<div class="sn-querybuilder-buildertools-bottom"></div>');
            //$builderbottomtoolbarcontainer.appendto($buildercontainer);
            //            $querycontainertextarea = $('<textarea class="sn-querybuilder-textarea"></textarea>');
            //            $querycontainertextarea.appendto($container);
            //            queryarray.push($querycontainertextarea.val());
            //            $querycontainerloader = $('<div id="loading"></div>');
            //            $querycontainerloader.appendto($buildercontainer);

            $.when(getTypesAndFields).done(function () {
                initQueryBuilder();
            });

            var $toolbarContainer;
            var $editorContainer;
            var $builderContainer;
            var $builderContainerInner;
            var $builderToolbarContainer;
            var $tabContainer;

            function initQueryBuilder() {
                if (showQueryEditor) {
                    $element.before('<div class="sn-queryeditor-container"></div>');
                    $editorContainer = $('.sn-queryeditor-container');
                    $editorContainer.append($element);
                    $container.append($editorContainer);
                    $toolbarContainer = $('<div class="sn-querybuilder-tools"></div>');
                    $toolbarContainer.prependTo($editorContainer);
                    if (showQueryBuilder) {
                        $editorContainer.after('<div class="sn-querybuilder-container"></div>');
                        $builderContainer = $('.sn-querybuilder-container');
                        $builderContainer.append('<div class="sn-querybuilder-builderinner"><div class="sn-placeholder">' + resources.placeholder + '</div></div>');
                        $builderContainerInner = $('.sn-querybuilder-builderinner');
                        $container.append($builderContainer);
                        $builderToolbarContainer = $('<div class="sn-querybuilder-buildertools"></div>');
                        $builderToolbarContainer.prependTo($builderContainer);
                        createToolbar($toolbarContainer, toolbarbuttons, $builderToolbarContainer);
                        $editorContainer.before('<ul class="sn-querybuilder-tab-container"></ul>');
                        $tabContainer = $('.sn-querybuilder-tab-container');
                        $container.prepend($tabContainer);
                        createTabs();
                        if (builderState)
                            buildBuilder(); //<?
                    }
                    else {
                        createToolbar($toolbarContainer, toolbarbuttons);
                    }
                }
                else {
                    $container.append('<div class="sn-querybuilder-container"></div>');
                    $builderContainer = $('.sn-querybuilder-container');
                    $builderContainer.append('<div class="sn-querybuilder-builderinner"><div class="sn-placeholder">' + resources.placeholder + '</div></div>');
                    $builderContainerInner = $('.sn-querybuilder-builderinner');
                    $container.append($builderContainer);
                    $builderToolbarContainer = $('<div class="sn-querybuilder-buildertools"></div>');
                    $builderToolbarContainer.prependTo($builderContainer);
                    createToolbar($toolbarContainer, toolbarbuttons, $builderToolbarContainer);
                    $editorContainer.before('<ul class="sn-querybuilder-tab-container"></ul>');
                    $tabContainer = $('.sn-querybuilder-tab-container');
                    $container.prepend($tabContainer);
                    createTabs();
                    if (builderState)
                        buildBuilder(); //<?
                }
                $element.on('blur', function () { getCaretPosition(this); });
                $loader.hide();
                $container.show();
                $element.show();
                
            }

            function createToolbar() {
                if (showQueryEditor) {
                    createComboBoxes();
                    $toolbarContainer.append(toolbarbuttons.equal + toolbarbuttons.gtorequal + toolbarbuttons.ltorequal + toolbarbuttons.gt + toolbarbuttons.lt + toolbarbuttons.and + toolbarbuttons.or + toolbarbuttons.not + toolbarbuttons.like + toolbarbuttons.IN + toolbarbuttons.open + toolbarbuttons.close + toolbarbuttons.type + toolbarbuttons.typeis + toolbarbuttons.intree + toolbarbuttons.infolder + toolbarbuttons.sort + toolbarbuttons.reversesort + toolbarbuttons.top + toolbarbuttons.skip);
                    if (showQueryBuilder) {
                        $builderToolbarContainer.append(toolbarbuttons.add + toolbarbuttons.and + toolbarbuttons.or + toolbarbuttons.not + toolbarbuttons.open + toolbarbuttons.close + toolbarbuttons.intree + toolbarbuttons.infolder);
                    }
                }
                else {
                    $builderToolbarContainer.append(toolbarbuttons.add + toolbarbuttons.and + toolbarbuttons.or + toolbarbuttons.not + toolbarbuttons.open + toolbarbuttons.close + toolbarbuttons.intree + toolbarbuttons.infolder);
                }
                //$builderBottomToolbarContainer.append(toolbarbuttons.sort + toolbarbuttons.reversesort + toolbarbuttons.top + toolbarbuttons.skip)

                if (showQueryEditor) {
                    $toolbarContainer.on('click.snQueryEditor', '.sn-icon', function () {
                        if (!$('.queryBuilderChange').length > 0) {
                            $container.append('<input type="hidden" class="queryBuilderChange" value="true" />');
                        }
                        else {
                            $('.queryBuilderChange').val('true');
                        }
                    });
                    $toolbarContainer.on('click.snQueryEditor', '.sn-icon-equal', function () {
                        var value = ":";
                        pasteValue(value, true);
                    });
                    $toolbarContainer.on('click.snQueryEditor', '.sn-icon-gtorequal', function () {
                        var value = ":>=";
                        pasteValue(value, true);
                    });
                    $toolbarContainer.on('click.snQueryEditor', '.sn-icon-ltorequal', function () {
                        var value = ":<=";
                        pasteValue(value, true);
                    });
                    $toolbarContainer.on('click.snQueryEditor', '.sn-icon-gt', function () {
                        var value = ":>";
                        pasteValue(value, true);
                    });
                    $toolbarContainer.on('click.snQueryEditor', '.sn-icon-lt', function () {
                        var value = ":<";
                        pasteValue(value, true);
                    });
                    $toolbarContainer.on('click.snQueryEditor', '.sn-icon-and', function () {
                        var value = "AND";
                        pasteValue(value, false);

                    });
                    $toolbarContainer.on('click.snQueryEditor', '.sn-icon-or', function () {
                        var value = "OR";
                        pasteValue(value, false);

                    });
                    $toolbarContainer.on('click.snQueryEditor', '.sn-icon-not', function () {
                        var value = "NOT";
                        pasteValue(value, false);
                    });
                    $toolbarContainer.on('click.snQueryEditor', '.sn-icon-like', function () {
                        var value = "*";
                        pasteValue(value, false);
                    });
                    $toolbarContainer.on('click.snQueryEditor', '.sn-icon-in', function () {
                        if (cboxValue) {
                            var value = ':()';
                            pasteValue(value, true, true);
                        }
                    });
                    $toolbarContainer.on('click.snQueryEditor', '.sn-icon-open', function () {
                        var value = "(";
                        pasteValue(value, false);
                    });
                    $toolbarContainer.on('click.snQueryEditor', '.sn-icon-close', function () {
                        var value = ")";
                        pasteValue(value, true);
                    });
                    $toolbarContainer.on('click.snQueryEditor', '.sn-icon-sort', function () {
                        var value = ".SORT:";
                        pasteValue(value, false);
                    });
                    $toolbarContainer.on('click.snQueryEditor', '.sn-icon-reversesort', function () {
                        var value = ".REVERSESORT:";
                        pasteValue(value, false);
                    });
                    $toolbarContainer.on('click.snQueryEditor', '.sn-icon-top', function () {
                        var value = ".TOP:";
                        pasteValue(value, false);
                    });
                    $toolbarContainer.on('click.snQueryEditor', '.sn-icon-skip', function () {
                        var value = ".SKIP:";
                        pasteValue(value, false);
                    });
                    $toolbarContainer.on('click.snQueryEditor', '.sn-icon-type', function () {
                        var value = "Type:";
                        pasteValue(value, false);
                    });
                    $toolbarContainer.on('click.snQueryEditor', '.sn-icon-typeis', function () {
                        var value = "TypeIs:";
                        pasteValue(value, false);
                    });
                    $toolbarContainer.on('click.snQueryEditor', '.sn-icon-intree', function () {
                        var value = "InTree:";
                        SN.PickerApplication.open({
                            MultiSelectMode: 'none', TreeRoots: ['/Root/Sites/Default_Site'], callBack: function (resultData) {
                                if (!resultData) return; $('.path.text').val(resultData[0].Path);
                                pasteValue(value + resultData[0].Path, false);
                            }
                        });
                    });
                    $toolbarContainer.on('click.snQueryEditor', '.sn-icon-infolder', function () {
                        var value = "InFolder:";
                        SN.PickerApplication.open({
                            MultiSelectMode: 'none', TreeRoots: ['/Root/Sites/Default_Site'], callBack: function (resultData) {
                                if (!resultData) return; $('.path.text').val(resultData[0].Path);
                                pasteValue(value + resultData[0].Path, false);
                            }
                        });
                    });

                }
                if (showQueryBuilder) {
                    $builderToolbarContainer.on('click.snQueryBuilder', '.sn-icon', function () {
                        if (!$('.queryBuilderChange').length > 0) {
                            $container.append('<input type="hidden" class="queryBuilderChange" value="true" />');
                        }
                        else {
                            $('.queryBuilderChange').val('true');
                        }
                    });
                    $builderToolbarContainer.on('click.snQueryBuilder', '.sn-icon-and', function () {
                        var $this = $(this);
                        var value = andTemplate;
                        var text = 'AND';
                        createNewRow(value, text);
                    });
                    $builderToolbarContainer.on('click.snQueryBuilder', '.sn-icon-or', function () {
                        var $this = $(this);
                        var value = orTemplate;
                        var text = 'OR';
                        createNewRow(value, text);
                    });
                    $builderToolbarContainer.on('click.snQueryBuilder', '.sn-icon-not', function () {
                        var $this = $(this);
                        var value = notTemplate;
                        var text = 'NOT';
                        createNewRow(value, text);
                    });
                    $builderToolbarContainer.on('click.snQueryBuilder', '.sn-icon-open', function () {
                        var $this = $(this);
                        var value = openTemplate;
                        var text = '(';
                        createNewRow(value, text);
                    });
                    $builderToolbarContainer.on('click.snQueryBuilder', '.sn-icon-close', function () {
                        var $this = $(this);
                        var value = closeTemplate;
                        var text = ')';
                        createNewRow(value, text);
                    });
                    $builderToolbarContainer.on('click.snQueryBuilder', '.sn-icon-intree', function () {
                        var $this = $(this);
                        var value = inTreeTemplate;
                        var val = value.split(':');
                        var text = 'InTree:';
                        SN.PickerApplication.open({
                            MultiSelectMode: 'none', TreeRoots: ['/Root/Sites/Default_Site'], callBack: function (resultData) {
                                if (!resultData) return; $('.path.text').val(resultData[0].Path);

                                val[0] += ':<input type="text" class="inRowInput" value="' + resultData[0].Path + '" />';
                                createNewRow(val[0] + val[1]);
                            }
                        });
                    });
                    $builderToolbarContainer.on('click.snQueryBuilder', '.sn-icon-infolder', function () {
                        var $this = $(this);
                        var value = inFolderTemplate;
                        var val = value.split(':');
                        var text = 'InFolder:';
                        SN.PickerApplication.open({
                            MultiSelectMode: 'none', TreeRoots: ['/Root/Sites/Default_Site'], callBack: function (resultData) {
                                if (!resultData) return; $('.path.text').val(resultData[0].Path);

                                val[0] += ':<input type="text" class="inRowInput" value="' + resultData[0].Path + '" />';
                                createNewRow(val[0] + val[1]);
                            }
                        });
                    });
                    $builderToolbarContainer.on('click.snQueryBuilder', '.sn-insert-row', function () {
                        var $this = $(this);
                        var value = expressionTemplate;
                        var typealso = false;
                        if (typesAndFields[0].f) {
                            typealso = true;
                        }
                        createNewRow(value, null, rownum, null, null, null, null, false, '', typealso);
                    });
                }
            }

            $element.on('blur keypress click', function () {
                if (!$('.queryBuilderChange').length > 0) {
                    $container.append('<input type="hidden" class="queryBuilderChange" value="true" />');
                }
                else {
                    $('.queryBuilderChange').val('true');
                }
            });

            function createComboBoxes() {
                $cboxContainer.prependTo($editorContainer);
                var $combocontainer = $('.sn-query-builder-comboboxes');
                var $buildercombos = $('.sn-querybuilder-comboboxes');
                if (typesAndFields[0].f) {
                    createFieldList();
                    $combocontainer.append('<input id="types" /><input id="fields" /><span class="sn-icon sn-icon-add" title="' + resources.insert + '"></span>');
                    $buildercombos.append('<input id="types" /><input id="fields" />');
                    setTypeBox();
                }
                else {
                    createFieldListWithoutTypes();
                    $combocontainer.append('<input id="fields" /><span class="sn-icon sn-icon-add" title="' + resources.insert + '"></span>');
                    $buildercombos.append('<input id="types" /><input id="fields" />');
                    setFieldWithoutTypesBox(fieldArray);
                }

                $cboxContainer.on('click.snQueryEditor', '.sn-icon-add', function () {
                    if (cboxValue) {
                        pasteValue(cboxValue, false);
                    }
                });



                createQueryTemplateList($combocontainer);

            }

            function createQueryTemplateList($combocontainer) {
                $combocontainer.append('<input id="queryTemplate" />');

                $("#queryTemplate").after('<span id="queryTemplate-label">' + resources.QueryTemplate + ': </span>').css('float', 'right');
              
                $("#queryTemplate").kendoComboBox({
                    placeholder: resources.querytemplateboxplaceholder,
                    autoBind: false,
                    dataTextField: "text",
                    dataValueField: "value",
                    template: queryTemplateComboBoxElementTemplate,
                    dataSource: queryTemplateOptions,
                    suggest: true,
                    change: selectQueryTemplate
                });

                function selectQueryTemplate() {
                    var selectedQueryTemplate = this._selectedValue;
                    if (selectedQueryTemplate) {
                        pasteValue(selectedQueryTemplate, false);
                    }
                }
                
            };

            function createTabs() {
                $tabContainer.append(tabs.editor + tabs.builder);
                $(".sn-query-container").kendoTabStrip({
                    select: selectTab,
                    animation: {
                        open: {
                            effects: "fade"
                        }
                    }
                });
                queryBuilderOpenClose();
            }

            function selectTab(e) {
                $currentItemIndex = e.item.value;
                if ($currentItemIndex === 1) {
                    warningMessage = resources.builderwarningmessage;
                    queryArray[0] = $element.val();
                    $element.val(queryArray[1]);
                }
                else {
                    warningMessage = resources.editorwarningmessage;
                    //var editorValue = queryArray[0];
                    var editorValue = queryArray[1].split('/*')[0];
                    if (editorValue.length === 0)
                        editorValue = queryArray[0];
                    $element.val(editorValue);
                }
            }

            function getCaretPosition($el) {

                var caretPos = 0;

                if (document.selection) {

                    $el.focus();

                    var sel = document.selection.createRange();

                    sel.moveStart('character', -$el.value.length);

                    caretPos = sel.text.length;
                }

                else if ($el.selectionStart || $el.selectionStart == '0')
                    caretPos = $el.selectionStart;

                textPosition = caretPos;
            }

            function pasteValue(value, hasColon, incorporate) {

                getLastCharacter();

                var text = $element.val();
                var valueFirstChar = value.charAt(0);

                if (text.length > '0' && lastChar !== ' ' && hasColon === false) {
                    value = ' ' + value;
                }

                if (lastChar === ':' && valueFirstChar === ':') {
                    text = text.slice(0, textPosition - 1) + text.slice(textPosition);
                    var newvalue = text.substr(0, textPosition) + value + text.substr(textPosition);
                }
                else {
                    newvalue = text.substr(0, textPosition) + value + text.substr(textPosition);
                }

                $element.focus();
                $element.val('');
                $element.val(newvalue);
                if (!$('.queryBuilderChange').length > 0) {
                    $container.append('<input type="hidden" class="queryBuilderChange" value="true" />');
                }
                else {
                    $('.queryBuilderChange').val('true');
                }
                setCursorPositionAfterPaste(value, incorporate);
            }

            function setCursorPositionAfterPaste(value, incorporate) {

                var l = value.length,
                newPosition = parseInt(textPosition) + l;
                if (incorporate) { newPosition = newPosition - 1; }
                $element[0].setSelectionRange(newPosition, newPosition);
            }

            function getLastCharacter() {
                var text = $element.val();
                lastChar = text.charAt(textPosition - 1);
                return lastChar;
            }
            function setTypeBox() {
                types = $("#types").kendoComboBox({
                    placeholder: resources.typeboxplaceholder,
                    autoBind: false,
                    dataTextField: "d",
                    dataValueField: "c",
                    template: comboBoxElementTemplate,
                    dataSource: typesAndFields,
                    suggest: true,
                    filter: "contains",
                    change: selectTypeText
                });
            }

            function createFieldList(c) {
                fieldArray = [];
                $.each(typesAndFields, function (i, item) {
                    $.each(item.f, function (k, it) {
                        if (it.c === c) {
                            fieldArray.push(it);
                        }
                    });
                });

            }

            function createFieldListWithoutTypes() {
                $.each(typesAndFields, function (i, item) {
                    fieldArray.push(item);
                });
                fieldArray = new kendo.data.DataSource({ data: fieldArray });
            }

            function setFieldBox(fieldArr) {
                var fields = $("#fields").kendoComboBox({
                    placeholder: resources.fieldboxplaceholder,
                    autoBind: false,
                    dataTextField: "d",
                    dataValueField: "n",
                    template: comboBoxElementTemplate,
                    dataSource: fieldArr,
                    suggest: true,
                    change: selectField
                });
                fields.focus();
            }

            function setFieldWithoutTypesBox(fieldArr) {
                var fields = $("#fields").kendoComboBox({
                    placeholder: resources.fieldboxplaceholder,
                    autoBind: false,
                    dataTextField: "d",
                    dataValueField: "n",
                    template: comboBoxElementTemplate,
                    dataSource: fieldArr,
                    suggest: true,
                    change: selectField
                });
                fields.focus();
            }

            function selectType() {
                var rowNumber = this.wrapper.closest('.sn-querybuilder-row').attr('data-rownumber');
                var c = this._selectedValue;
                createFieldList(c);
                $('div[data-rownumber=' + rowNumber + ']').find('.k-combobox.fields').replaceWith('<input class="fields" />');
                var currenttextboxparent = $('div[data-rownumber=' + rowNumber + ']').children('.sn-querybuilder-txt');
                var isTextObject = {};
                isTextObject.c = null,
                isTextObject.d = "Text",
                isTextObject.n = "_Text",
                isTextObject.t = "ShortText";
                clearcurrentTextBox(currenttextboxparent);
                fieldArray.push(isTextObject);
                setRowFieldBox(fieldArray, rowNumber);

                for (var i = 0; i < typesAndFields.length; i++) {
                    if (typesAndFields[i].d === this._prev) {
                        storageSetType(rowNumber - 1, typesAndFields[i].n);
                    }
                }

            }

            function selectTypeText() {
                var c = this._selectedValue;
                createFieldList(c);
                setFieldBox(fieldArray);
            }

            function selectField(e) {
                if ($('.sn-querybuilder-tab-container li[value="1"]').hasClass('k-state-active')) {
                    var rowNumber = this.wrapper.closest('.sn-querybuilder-row').attr('data-rownumber') || 0;
                    var type;
                    var fieldName = this.dataItem(e.item).n;
                    if (typeof this.dataItem(e.item) !== 'undefined') {
                        storageSetField(rowNumber - 1, this.dataItem(e.item).n, this.dataItem(e.item).d, this.dataItem(e.item).t); //<?
                        cboxValue = this.dataItem(e.item).d;
                        type = this.dataItem(e.item).t;
                    }
                    else {
                        storageSetField(rowNumber - 1, this._selectedValue, this._selectedValue, this.dataItem(e.item).t); //<?
                        cboxValue = this._selectedValue;
                        type = null;
                    }
                    var currenttextboxparent = $('[data-rownumber=' + rowNumber + ']').find('.sn-querybuilder-txt');

                    clearcurrentTextBox(currenttextboxparent);


                    var currenttextbox = $('[data-rownumber=' + rowNumber + ']').find('.sn-querybuilder-txt input');
                    var value;
                    if (typeof value !== 'undefined') {
                        currenttextbox.val(value);
                    }


                    if (type === 'int' || type === 'Number' || type === 'Integer' || type === 'Currency') {
                        value = 0;
                        blurTextbox(value, rowNumber);
                        currenttextbox.kendoNumericTextBox({
                            value: value,
                            format: "#",
                            decimals: 0
                        });
                        currenttextbox.on('blur', function () {
                            if ($(this).val() !== '') {
                                value = $(this).val();
                            }
                            else {
                                value = 0;
                            }
                            blurTextbox(value, rowNumber);
                        });
                    }
                    else if (type === 'decimal') {
                        value = 0;
                        blurTextbox(value, rowNumber);
                        currenttextbox.kendoNumericTextBox();
                        currenttextbox.on('blur', function () {
                            if ($(this).val() !== '') {
                                value = $(this).val();
                            }
                            else {
                                value = 0;
                            }
                            blurTextbox(value, rowNumber);
                        });
                    }
                    else if (type === 'bool' || type === 'Boolean') {
                        value = 'no';
                        blurTextbox(value, rowNumber);
                        currenttextbox.replaceWith('<input type="checkbox" class="sn-checkbox" />');
                        currenttextbox = $('.sn-checkbox');
                        currenttextboxparent.inputMachinator();
                        currenttextbox.siblings('span').on('click', function () {
                            if (currenttextbox.prop("checked") || currenttextbox.is(":checked") || currenttextbox.attr("checked")) {
                                value = 'yes';
                            }
                            else { value = 'no' }
                            blurTextbox(value, rowNumber);
                        });
                    }
                    else if (type === 'datetime' || type === 'DateTime') {
                        //TODO: localize stuff
                        var dateTypeChooserCombo = [
                            {
                                "text": resources.ChooseAnExactDate,
                                "value": "exactdate"
                            },
                            {
                                "text": resources.ChooseFromTemplates,
                                "value": "querytemplates"
                            }
                        ];

                        currenttextbox.kendoComboBox({
                            placeholder: resources.ChooseDateType,
                            dataTextField: "text",
                            dataValueField: "value",
                            dataSource: dateTypeChooserCombo,
                            template: queryTemplateComboBoxElementTemplate,
                            change: function () {
                                var selected = this._selectedValue;
                                var combobox = currenttextbox.data("kendoComboBox");
                                combobox.destroy();
                                currenttextbox.closest('.k-combobox').remove();
                                currenttextbox = $('<input type="text"/>').appendTo(currenttextboxparent);
                                if (selected === 'exactdate') {
                                    currenttextbox.kendoDatePicker({
                                        value: new Date()
                                    });
                                    value = currenttextbox.val();
                                    blurTextbox(value, rowNumber);
                                    currenttextbox.on('change.textBox', function () {
                                        if ($(this).val() !== '') {
                                            value = $(this).val();
                                        }
                                        else {
                                            value = new Date();
                                        }
                                        blurTextbox(value, rowNumber);
                                    });
                                }
                                else {
                                    currenttextbox.kendoComboBox({
                                        placeholder: resources.ChooseQueryTemplate,
                                        dataTextField: "text",
                                        dataValueField: "value",
                                        dataSource: queryTemplateDateOptions,
                                        template: queryTemplateComboBoxElementTemplate,
                                        change: function () {
                                            value = this._selectedValue;
                                            blurTextbox(value, rowNumber);
                                        }
                                    });
                                    
                                }
                            }
                        });
                    }
                    else if (type === 'choice' || type === 'Choice') {

                        optionArray = [];
                        var selectOptions;
                        if (typeof dataItem !== 'undefined') {
                            selectOptions = dataItem.q;
                        }
                        else {
                            selectOptions = this.dataItem(e.item).q;
                        }

                        currenttextbox.replaceWith('<select class="optionSelect"></select>');

                        $('.optionSelect').on('change.OptionSelect', function () {
                            value = $(this).val();
                            text = $(this).closest('select').find(':selected').html();
                            blurTextbox(text, rowNumber);

                        });
                        $.each(selectOptions, function (i, item) {
                            if (item.n) {
                                $('.optionSelect').append(new Option(item.n, item.v, item.e, item.s));
                            }
                            else {
                                $('.optionSelect').append(new Option(item, item, false, false));
                            }
                            if (item.s === true) {
                                value = item.n;
                            }
                            else if (value === '') {
                                value = selectOptions[0].n;
                            }
                        });
                        blurTextbox(value, rowNumber);
                        $('.optionSelect').kendoDropDownList({
                            select: selectOption,
                            value: value = selectOptions[0].n
                        });
                    }
                    else if (type === 'reference' || type === 'Reference') {
                        currenttextboxparent.html('');
                        currenttextboxparent.append('<input type="text">');
                        value = ' ';
                        blurTextbox(value, rowNumber);
                        $('.sn-querybuilder-txt input').on('blur keypress click', function () {
                            value = '{{Name:' + $(this).val() + ' OR FullName:' + $(this).val() + '}}';
                            blurTextbox(value, rowNumber, true);
                        });
                    }
                    else {
                        currenttextboxparent.html('');
                        currenttextboxparent.append('<input type="text">');
                        value = ' ';
                        blurTextbox(value, rowNumber);
                        $('.sn-querybuilder-txt input').on('blur keypress click', function () {
                            value = $(this).val();
                            blurTextbox(value, rowNumber);
                        });
                    }
                    if (type === 'bool' || type === 'Boolean') {
                        currenttextboxparent.siblings('.sn-query-operation-ddown').html('<span style="display: block;padding-top: 5px;width: 100%;margin-left: 5px;">=<span>');
                        $('.sn-query-operation-ddown select').kendoDropDownList({
                            select: selectOperator
                        });
                        storageSetOperator(rowNumber - 1, '=');
                    }
                    else {
                        currenttextboxparent.siblings('.sn-query-operation-ddown').html('<select class="sn-operation-ddown" style="width: 100%"><option>=</option><option>>=</option><option><=</option><option>></option><option><</option><option value="*">' + resources.Contains + '</option><option value="bw">' + resources.BeginsWith + '</option><option value="ew">' + resources.EndsWith + '</option></select>');
                        $('.sn-query-operation-ddown select').kendoDropDownList({
                            select: selectOperator
                        });
                        storageSetOperator(rowNumber - 1, '=');
                    }

                    $('#queryBuilder input').keypress(function (e) {
                        var key = e.which;
                        if (key == 13) {
                            $('.runButton').click();
                            return false;
                        }
                    });


                }
                else {
                    var cb = $("#types").data("kendoComboBox");

                    cboxValue = 'TypeIs:' + cb.text() + ' AND ' + this.dataItem(e.item).n;
                }
            }


            function selectOperator(e) {
                var rowNumber = this.wrapper.closest('.sn-querybuilder-row').attr('data-rownumber');
                storageSetOperator(rowNumber - 1, this.dataItem(e.item.index()).value); //<?
            }

            function selectOption(e) {
                rowNumber = this.wrapper.closest('.sn-querybuilder-row').attr('data-rownumber');
                storageSetValue(rowNumber - 1, this.dataItem(e.item.index()).value); //<?
            }

            function setValueBox(rowNumber, field, value) {
                var selectedFieldType = '';
                var $currenttextbox = $('[data-rownumber=' + rowNumber + ']').find('.sn-querybuilder-txt input');
                var $currenttextboxparent = $('[data-rownumber=' + rowNumber + ']').children('.sn-querybuilder-txt');

                if (typeof fieldArray === 'array') {
                    $.each(fieldArray, function (i, item) {
                        if (item.n === field) {
                            selectedFieldType = item.t;
                        }
                    });
                }
                else {
                    $.each(typesAndFields, function (i, item) {
                        if (item.n === field) {
                            selectedFieldType = item.t;
                        }
                    });
                }


                if (selectedFieldType === 'int') {
                    value = value || 0;
                    $currenttextbox.kendoNumericTextBox({
                        value: value,
                        format: "#",
                        decimals: 0
                    });
                    $currenttextbox.on('blur', function () {
                        value = $(this).val();
                        blurTextbox(value, rowNumber);
                    });
                }
                else if (selectedFieldType === 'decimal') {
                    value = value || 0;
                    $currenttextbox.kendoNumericTextBox({
                        value: value
                    });
                    $currenttextbox.on('blur', function () {
                        value = value;
                        blurTextbox(value, rowNumber);
                    });
                }
                else if (selectedFieldType === 'bool' || selectedFieldType === 'boolean') {
                    $('[data-rownumber=' + rowNumber + '] .sn-query-operation-ddown').html('<span style="display: block;padding-top: 5px;width: 100%;margin-left: 5px;">=<span>');
                    $('[data-rownumber=' + rowNumber + '] .sn-query-operation-ddown select').kendoDropDownList({
                        select: selectOperator
                    });
                    value = value || 'off';
                    $currenttextbox.replaceWith('<input type="checkbox" class="sn-checkbox" />');
                    $currenttextbox = $('.sn-checkbox');
                    if (value === 'yes') {
                        $currenttextbox.attr("checked", "checked");
                        $currenttextbox.prop("checked", true);
                    }
                    $('[data-rownumber=' + rowNumber + '] .sn-querybuilder-txt').inputMachinator();
                    $currenttextbox.siblings('span').on('click', function () {
                        value = 'no';
                        if ($currenttextbox.prop("checked") || $currenttextbox.is(":checked") || $currenttextbox.attr("checked")) {

                            value = 'yes';
                        }
                        else { value = 'no' }
                        blurTextbox(value, rowNumber);
                    });
                }
                else if (selectedFieldType === 'datetime') {
                    value = value || new Date();
                    $currenttextbox.kendoDatePicker({
                        value: value,
                        format: "yyyy-MM-dd"
                    });
                    $currenttextbox.on('change.TextBox', function () {
                        value = $(this).val();
                        blurTextbox(value, rowNumber);
                    });
                }
                else if (selectedFieldType === 'choice') {
                    var selectOptions;
                    if (typeof fieldArray === 'array') {
                        $.each(fieldArray, function (i, item) {
                            if (item.n === field) {
                                selectOptions = item.q;
                            }
                        });
                    }
                    else {
                        $.each(typesAndFields, function (i, item) {
                            if (item.n === field) {
                                selectOptions = item.q;
                            }
                        });
                    }

                    optionArray = [];
                    $currenttextbox.replaceWith('<select class="optionSelect"></select>');
                    $('.optionSelect').on('blur', function () {
                        value = $(this).val();
                        blurTextbox(value, rowNumber);
                    });

                    $.each(selectOptions, function (i, item) {
                        if (item.n) {
                            $('.optionSelect').append(new Option(item.n, item.v, item.e, item.s));
                        }
                        else {
                            $('.optionSelect').append(new Option(item, item, false, false));
                        }
                    });
                    value = value || $(this).val();
                    $('.optionSelect').kendoDropDownList({
                        value: value,
                        select: selectOption
                    });


                }
                else {
                    $currenttextboxparent.html('');
                    $currenttextboxparent.append('<input type="text">');

                    $currenttextbox.val(value);
                    $currenttextbox.on('blur keyup', function () {
                        value = $(this).val();
                        blurTextbox(value, rowNumber);
                    });

                }
            }

            function blurTextbox(value, rowNumber, ref) {
                if (!$('.queryBuilderChange').length > 0) {
                    $container.append('<input type="hidden" class="queryBuilderChange" value="true" />');
                }
                else {
                    $('.queryBuilderChange').val('true');
                }

                storageSetValue(rowNumber - 1, value, ref); //<?
            }

            //------------------------------------------------------- storage

            function storageAddRow(templateIndex, path) {
                if (typeof path === 'undefined')
                    path = null;
                if (builderInitializing)
                    return;
                storage.push({ t: templateIndex, ct: null, f: null, op: null, v: null, p: path });
                refreshResult();

                $('#queryBuilder input').keypress(function (e) {
                    var key = e.which;
                    if (key == 13) {
                        $('.runButton').click();
                        return false;
                    }
                });


            }
            function storageMoveUpRow(rowNumber) {
                if (builderInitializing)
                    return;
                swap(rowNumber - 2, rowNumber - 1);
                refreshResult();
            }
            function storageMoveDownRow(rowNumber) {
                if (builderInitializing)
                    return;
                swap(rowNumber, rowNumber - 1);
                refreshResult();
            }
            function swap(i0, i1) {
                var temp = storage[i0];
                storage[i0] = storage[i1];
                storage[i1] = temp;
            }
            function storageDeleteRow(rowNumber) {
                if (builderInitializing)
                    return;
                storage.splice(rowNumber - 1, 1)
                refreshResult();
            }
            function storageSetType(rowIndex, value) {
                if (builderInitializing)
                    return;
                storage[rowIndex].ct = value;
                storage[rowIndex].f = null;
                storage[rowIndex].v = null;
                refreshResult();
            }
            function storageSetField(rowIndex, value, title, type) {
                if (builderInitializing)
                    return;

                storage[rowIndex].f = value;
                storage[rowIndex].v = null;
                storage[rowIndex].d = title;

                if (type === 'Reference' || type === 'reference') {
                    storage[rowIndex].e = true;
                }

                refreshResult();
            }
            function storageSetOperator(rowIndex, value) {
                if (builderInitializing)
                    return;

                if (value === "=")
                    storage[rowIndex].op = "";
                else
                    storage[rowIndex].op = value;

                refreshResult();
            }
            function storageSetValue(rowIndex, value, ref) {
                if (builderInitializing)
                    return;
                storage[rowIndex].v = value;
                refreshResult();
            }
            function refreshResult() {
                var q = "";

                for (var i = 0; i < storage.length; i++) {
                    var row = storage[i];
                    q += builders[row.t].call(this, row);
                }

                var c = JSON.stringify(storage);
                var r = q + "/*" + c + "*/";
                queryArray[1] = r;
                $element.val(r);
            }
            var builders = [
                function () { return " AND "; },
                function () { return " OR "; },
                function () { return " NOT "; },
                function () { return " ( "; },
                function () { return " ) "; },
                function (row) {
                    return "InTree:" + row.p;
                },
                function (row) {
                    return "InFolder:" + row.p;
                },
                function (row) {
                    var s;
                    if (!typesAndFields[0].f) {
                        if (row.op === "ew")
                            s = row.f + ":*";
                        else if (row.op === "bw")
                            s = row.f + ":";
                        else
                            s = row.f + ":" + row.op;
                    }
                    else {
                        if (row.op === "ew")
                            s = 'TypeIs:' + (row.ct) + ' AND ' + (row.f) + ":*";
                        else if (row.op === "bw")
                            s = 'TypeIs:' + (row.ct) + ' AND ' + (row.f) + ":";
                        else
                            s = 'TypeIs:' + (row.ct) + ' AND ' + (row.f) + ":" + (row.op);
                    }
                    var needQuot = (!row.v || row.v.indexOf(" ") >= 0) && !row.e;

                    if (needQuot) s += "\"";
                    if (row.v === null) s += ""; else s += row.v;
                    if (row.op === "*" || row.op === "bw") s += "*";
                    if (needQuot) s += "\"";
                    //if (row.op !== "ew") -- query result in query-wizard cannot be saved in case of EndsWith
                        s += " ";

                    return s.replace(/!/g, '%21');
                }
            ];

            function parseBuilderState(s) {
                var p0, p1;
                storage = [];

                if ((p0 = s.indexOf("/*")) < 0)
                    return null;
                if ((p1 = s.indexOf("*/", p0)) < 0)
                    s = s.substr(p0 + 2);
                else
                    s = s.substr(p0 + 2, p1 - p0 - 2);
                var result;
                try {
                    eval("result = " + s);
                } catch (e) {
                    return null;
                }
                if (!$.isArray(result))
                    return null;
                for (var i = 0; i < result.length; i++) {
                    var row = result[i];
                    if (typeof row.t != "number" ||
                        typeof row.ct == "undefined" ||
                        typeof row.f == "undefined" ||
                        typeof row.op == "undefined" ||
                        typeof row.v == "undefined"
                    )
                        return null;
                }
                storage = result;
                return result;
            }

            var builderInitializing = false;
            function buildBuilder() {
                builderInitializing = true;
                for (var i = 0; i < storage.length; i++) {
                    createNewRowAndSet(storage[i], i);
                }
                builderInitializing = false;
            }

            //------------------------------------------------------- storage end

            function clearcurrentTextBox(currenttextboxparent) {
                currenttextboxparent.html('<input type="text" />');
            }

            function setCursorOneCharLeft() {
                caretPos = $element.val().length
            }

            function createNewRow(template, text, rowNumber, type, field, op, value, recreate, title, typealso) {
                if ($('.sn-placeholder')) { $('.sn-placeholder').remove(); }

                rownum += 1;

                if (recreate) {
                    addRow(template, rownum, type, field, op, value, title, typealso);

                }

                else {
                    addRow(template, rownum, type, field, op, value, title, typealso);
                }

            }

            function createNewRowAndSet(r, i) { //<?
                var recreate = true;
                var recreate = true;
                var typealso = false;
                if (typesAndFields[0].f) {
                    typealso = true;
                }
                createNewRow(templates[r.t], null, i, r.ct, r.f, r.op, r.v, true, r.d, typealso);
                //TODO: controls of new row must be setted by r. (will be huge development :)
                // r properties: t: template, ct: contentType, f: field, op: whether?, v: value
            }

            function addRow(template, rowNumber, type, field, op, value, title, typealso) {

                var $new = $('<div class="sn-querybuilder-row" data-rownumber="' + rownum + '">' + template + '<div class="sn-querybuilder-row-tools"><span class="sn-icon sn-moveup disable" title="' + resources.moverowup + '"></span><span class="sn-icon sn-movedown disable" title="' + resources.moverowdown + '"></span><span class="sn-icon sn-deleterow" title="' + resources.deleterow + '"></span></div></div>').hide();

                $('#queryEditortxtarea').focus();
              

                $builderContainerInner.append($new);

                var $rowid = $new.attr('data-rownumber');
                if (templates.indexOf(template) === 7) {
                    $new.find('input').first().attr('data-rownumber', $rowid);
                    if (typealso) {
                        type = type || '';
                        setRowTypeBox($rowid, type);
                        createFieldList(selectedTypeValue);
                        setRowFieldBox(fieldArray, rowNumber, field, title);
                        setValueBox(rowNumber, field, value);
                    }
                    else {
                        $('.sn-querybuilder-row[data-rownumber=' + $rowid + '] .sn-querybuilder-comboboxes .types').remove();
                        setRowFieldBox(fieldArray, rowNumber, field, title);
                        setValueBox(rowNumber, field, value);
                    }
                }


                $new.show('normal', function () {
                    $builderContainerInner.children().children('div').show();
                    initRowFunctions();
                });

                checkQueryBuilderHeight();

                var $queryBuilderRowTools = $('.sn-querybuilder-row').last().children('.sn-querybuilder-row-tools');

                $queryBuilderRowTools.on('click', '.sn-moveup:not(disable)', function () {
                    var $this = $(this);
                    var $currentRow = $this.closest('div.sn-querybuilder-row');
                    var $currentIdNum = parseInt($currentRow.attr('data-rownumber'));
                    var $beforeIdNum = $currentIdNum - 1;
                    moveRowUp($currentIdNum, $beforeIdNum);
                });
                $queryBuilderRowTools.on('click', '.sn-movedown:not(disable)', function () {
                    var $this = $(this);
                    var $currentRow = $this.closest('div.sn-querybuilder-row');
                    var $currentIdNum = parseInt($currentRow.attr('data-rownumber'));
                    var $nextIdNum = $currentIdNum + 1;
                    moveRowDown($currentIdNum, $nextIdNum);
                });
                $queryBuilderRowTools.on('click', '.sn-deleterow', function () {
                    var $this = $(this);
                    var $currentRow = $this.closest('div.sn-querybuilder-row');
                    deleteRow($currentRow);
                });

                initSelectBoxes(rowNumber, op);
                var templateindex = templates.indexOf(template);
                var path = '';
                if (templateindex === -1) {
                    if (template.indexOf('InTree') > -1) {
                        templateindex = 5;
                        path = $(template).children('input').val();
                    }
                    else if (template.indexOf('InFolder') > -1) {
                        templateindex = 6;
                        path = $(template).children('input').val();
                    }
                    else
                        templateindex = 7;
                }
                storageAddRow(templateindex, path);
            }

            function checkQueryBuilderHeight() {
                var builderHeight = $builderContainerInner.height();
                var windowHeight = $(window).height();
                if ((builderHeight + 250) > windowHeight) {
                    $builderContainerInner.height(windowHeight - 250).css('overflow', 'auto');
                }
                else {
                    $builderContainerInner.css('height', 'auto');
                }
            }

            function deleteAllRows() {
                $('.sn-querybuilder-builderinner .sn-querybuilder-row').each(function () {
                    var $this = $(this);
                    var $currentRow = $this.closest('div.sn-querybuilder-row');
                    deleteRow($currentRow, true);
                });

                storage = [];
            }

            function initSelectBoxes(rowNumber, op) {
                var option = op || '=';
                $('[data-rownumber=' + rowNumber + '] .sn-query-operation-ddown select').kendoDropDownList({
                    value: option,
                    select: selectOperator
                });
            }

            //function onChangeOperationSelect() {
            //    $(this).next().removeAttr('disabled');
            //}

            function initRowFunctions() {
                $builderContainerInner = $('.sn-querybuilder-builderinner');
                $builderContainerInner.children('div').removeClass('even');
                $builderContainerInner.children('div').filter(':even').addClass('even');
                $builderContainerInner.find('.sn-querybuilder-row-tools').children('.sn-moveup,.sn-movedown').removeClass('disable');
                $builderContainerInner.children('div').first().children('.sn-querybuilder-row-tools').children('.sn-moveup').addClass('disable');
                $builderContainerInner.children('div').last().children('.sn-querybuilder-row-tools').children('.sn-movedown').addClass('disable');
                $.each($builderContainerInner.children('div'), function (i) {
                    $(this).attr('data-rownumber', (i + 1));
                });
            }

            function moveRowUp($currentIdNum, $beforeIdNum) {
                $('div[data-rownumber=' + $currentIdNum + ']').insertBefore('div[data-rownumber=' + $beforeIdNum + ']');
                initRowFunctions();
                storageMoveUpRow($currentIdNum);
            }

            function moveRowDown($currentIdNum, $nextIdNum) {
                $('div[data-rownumber=' + $currentIdNum + ']').insertAfter('div[data-rownumber=' + $nextIdNum + ']');
                initRowFunctions();
                storageMoveDownRow($currentIdNum);
            }

            function deleteRow($currentRow, isAll) {

                var $currentIdNum = $currentRow.attr('data-rownumber');
                $currentRow.children().hide();
                $currentRow.hide('slow', function () {
                    $currentRow.remove();
                    initRowFunctions();
                });
                if (!isAll)
                    storageDeleteRow($currentIdNum);
            }

            function setRowTypeBox($rowid, type) {
                var defaulttype = type || '';
                $('[data-rownumber=' + $rowid + ']').find('.types').kendoComboBox({
                    placeholder: resources.typeboxplaceholder,
                    autoBind: false,
                    dataTextField: "d",
                    dataValueField: "c",
                    value: defaulttype,
                    template: comboBoxElementTemplate,
                    dataSource: new kendo.data.DataSource({ data: typesAndFields }),
                    change: selectType
                });

                if (type) {
                    searchForTypeNum(type);
                }
            }

            function searchForTypeNum(type) {
                $.each(typesAndFields, function (i, item) {
                    if (item.n === type) {
                        selectedTypeValue = item.c;
                    }
                });
            }

            function setRowFieldBox(fieldArr, rowNumber, field, title) {

                var defaultfield = title || '';
                $('[data-rownumber=' + rowNumber + ']').find(".fields").kendoComboBox({
                    placeholder: resources.fieldboxplaceholder,
                    autoBind: false,
                    dataTextField: "d",
                    dataValueField: "c",
                    value: defaultfield,
                    template: comboBoxElementTemplate,
                    dataSource: fieldArr,
                    change: selectField
                });
            }

            //buttonhandling

            function handleCommandButtons() {

                $buttonContainer = $('.sn-query-container').siblings('.buttonContainer');

                $buttonContainer.unbind('click.snQueryCommandButtons');

                $buttonContainer.on('click.snQueryCommandButtons', '.runButton', function () {

                    var query = $element.val();

                    var querySplit = query.split('/*');
                    query = querySplit[0];

                    if (querySplit[1]) {
                        var queryend = querySplit[1].split('*/')[1];

                        if (queryend) {
                            query += querySplit[0] + queryend;
                        }
                    }

                    if ((typeof postProcess) === "function") {
                        query = postProcess(query);
                    }

                    var path = content;
					query = query.replace(/#/g, '%23');
                    path += "?query=" + query;
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
                    results = JSON.parse(JSON.stringify(results));
                    if ((typeof options.events.execute) === "function") {
                        options.events.execute && options.events.execute(query, path, results);
                    }

                });

                $buttonContainer.on('click.snQueryCommandButtons', '.saveAsButton', function () {

                    var title = '';
                    if ($('.querytitle')) { title = $('.querytitle').val(); }
                    var type = 'Private';
                    if ($('.querytype')) { type = $('.querytype').val(); }

                    var query = $element.val();
                    if ((typeof options.events.saveas) === "function") {
                        options.events.saveas && options.events.saveas(query, title, type, null, content);

                    }
                });

                $buttonContainer.on('click.snQueryCommandButtons', '.saveButton', function () {

                    var query = $element.val();
                    var type = '';
                    var title = '';
                    var pathka = '';
                    if ($('.querypath').length > 0) { pathka = $('#queryBuilder').find('input[type="hidden"].querypath').val(); }

                    query = query.replace(/\\-/g, '-');
                    query = query.replace(/\-/g, '-');
                    query = query.replace(/-/g, '\\-');
                    if ((typeof options.events.save) === "function") {
                        options.events.save && options.events.save(query, title, type, pathka, content);
                    }
                });

                $buttonContainer.on('click.snQueryCommandButtons', '.clearButton', function () {
                    eventClear();
                    options.events.clear && options.events.clear();
                });

            }

            function queryBuilderOpenClose() {

                $builderContainer.on('click.queryBuilderOpenClose', '.querybuilder-open', function () {
                    openQueryBuilder();
                });
                $builderContainer.on('click.queryBuilderOpenClose', '.querybuilder-close', function () {
                    closeQueryBuilder();
                });
                $builderToolbarContainer.on('click.snQueryBuilder', '.sn-insert-row', function () {
                    if ($('.querybuilder-open:visible')) {
                        openQueryBuilder();
                    }
                });
                $editorContainer.on('click.queryBuilderOpenClose', '.queryeditor-open', function () {
                    openQueryEditor();
                });
                $editorContainer.on('click.queryBuilderOpenClose', '.queryeditor-close', function () {
                    closeQueryEditor();
                });
            }

            function closeQueryBuilder() {
                $('.querybuilder-close').hide();
                $('.sn-querybuilder-container').css({ '-webkit-box-shadow': 'none', '-moz-box-shadow': 'none', 'box-shadow': 'none' });
                $('.sn-querybuilder-builderinner').slideUp(function () {
                    $('.sn-querybuilder-container').css({ '-webkit-box-shadow': '3px 3px 5px rgba(50, 50, 50, 0.37)', '-moz-box-shadow': '3px 3px 5px rgba(50, 50, 50, 0.37)', 'box-shadow': '3px 3px 5px rgba(50, 50, 50, 0.37)' });
                });
                $('.querybuilder-open').show();
            }

            function openQueryBuilder() {
                $('.querybuilder-open').hide();
                $('.sn-querybuilder-builderinner').slideDown('slow');
                $('.querybuilder-close').show();
            }

            function closeQueryEditor() {
                $('.queryeditor-close').hide();
                $('.sn-queryeditor-container').css({ '-webkit-box-shadow': 'none', '-moz-box-shadow': 'none', 'box-shadow': 'none' });
                $('.sn-querybuilder-textbox').slideUp(function () {
                    $('.sn-querybuilder-container').css({ '-webkit-box-shadow': '3px 3px 5px rgba(50, 50, 50, 0.37)', '-moz-box-shadow': '3px 3px 5px rgba(50, 50, 50, 0.37)', 'box-shadow': '3px 3px 5px rgba(50, 50, 50, 0.37)' });
                });
                $('.queryeditor-open').show();
            }

            function openQueryEditor(done) {
                $('.queryeditor-open').hide();
                $('.sn-querybuilder-textbox').slideDown('slow');
                $('.queryeditor-close').show(done);
            }

            //querybuilder events

            function eventClear() {
                $element.val(''); deleteAllRows(); queryArray[0] = ''; queryArray[1] = '';
                closeQueryBuilder();
                $('.querybuilder-open').hide();
            }

            var queryTemplateOptions = [
                    {
                        "text": resources.CurrentUsersName,
                        "value": "@@CurrentUser.Name@@"
                    }, {
                        "text": resources.CurrentUsersFullName,
                        "value": "@@CurrentUser.FullName@@"
                    }, {
                        "text": resources.CurrentWorkspacesPath,
                        "value": "@@CurrentWorkspace.Path@@"
                    }, {
                        "text": resources.CurrentWorkspacesDeadlinePlusSeven,
                        "value": "@@CurrentWorkspace.Deadline.AddDays(7)@@"
                    }, {
                        "text": resources.CurrentSite,
                        "value": "@@CurrentSite.Path@@"
                    }, {
                        "text": resources.CurrentList,
                        "value": "@@CurrentList.Path@@"
                    }, {
                        "text": resources.CurrentPage,
                        "value": "@@CurrentPage.DisplayName@@"
                    }, {
                        "text": resources.Yesterday,
                        "value": "@@CurrentDate.MinusDay(1)@@"
                    }, {
                        "text": resources.Today,
                        "value": "@@CurrentDate@@"
                    }, {
                        "text": resources.Tomorrow,
                        "value": "@@CurrentDate.AddDay(1)@@"
                    }, {
                        "text": resources.PreviousWeek,
                        "value": "@@CurrentWeek.Minus(1)@@"
                    }, {
                        "text": resources.ThisWeek,
                        "value": "@@CurrentWeek@@"
                    }, {
                        "text": resources.NextWeek,
                        "value": "@@CurrentWeek.Add(1)@@"
                    }, {
                        "text": resources.PreviousMonth,
                        "value": "@@CurrentMonth.Minus(1)@@"
                    }, {
                        "text": resources.ThisMonth,
                        "value": "@@CurrentMonth@@"
                    }, {
                        "text": resources.NextMonth,
                        "value": "@@CurrentMonth.Add(1)@@"
                    }, {
                        "text": resources.PreviousYear,
                        "value": "@@CurrentYear.Minus(1)@@"
                    }, {
                        "text": resources.ThisYear,
                        "value": "@@CurrentYear@@"
                    }, {
                        "text": resources.NextYear,
                        "value": "@@CurrentYear.Add(1)@@"
                    }];

            var queryTemplateDateOptions = [
                    {
                        "text": resources.CurrentWorkspacesDeadlinePlusSeven,
                        "value": "@@CurrentWorkspace.Deadline.AddDays(7)@@"
                    }, {
                        "text": resources.Yesterday,
                        "value": "@@CurrentDate.MinusDay(1)@@"
                    }, {
                        "text": resources.Today,
                        "value": "@@CurrentDate@@"
                    }, {
                        "text": resources.Tomorrow,
                        "value": "@@CurrentDate.AddDay(1)@@"
                    }, {
                        "text": resources.PreviousWeek,
                        "value": "@@CurrentWeek.Minus(1)@@"
                    }, {
                        "text": resources.ThisWeek,
                        "value": "@@CurrentWeek@@"
                    }, {
                        "text": resources.NextWeek,
                        "value": "@@CurrentWeek.Add(1)@@"
                    }, {
                        "text": resources.PreviousMonth,
                        "value": "@@CurrentMonth.Minus(1)@@"
                    }, {
                        "text": resources.ThisMonth,
                        "value": "@@CurrentMonth@@"
                    }, {
                        "text": resources.NextMonth,
                        "value": "@@CurrentMonth.Add(1)@@"
                    }, {
                        "text": resources.PreviousYear,
                        "value": "@@CurrentYear.Minus(1)@@"
                    }, {
                        "text": resources.ThisYear,
                        "value": "@@CurrentYear@@"
                    }, {
                        "text": resources.NextYear,
                        "value": "@@CurrentYear.Add(1)@@"
                    }];
        }
    });
})(jQuery);

