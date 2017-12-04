// resource BackgroundOperations

$(function () {

    var taskKendoGrid = null;
    var $taskGrid = null;
    var expandedRows = [];

    var init = function (options) {
        //Public, overrideable parameters
        options = $.extend({
            dateFormat: "{0:MM/dd/yyyy HH:mm tt}",   //Default Date format
            parseDateFromUTC: function (date) {         //DateTime parser
                return date;
            },
            localization: {
                gridHeader_Name: "Name",
                gridHeader_relatedContentDisplayName: "Related content",
                gridHeader_Status: "Status",
                gridHeader_Machine: "Machine",
                gridHeader_Agent: "Agent",
                gridHeader_StartTime: "Created",

                machineDetails_CPU: "CPU usage: {0}%",          //{0}=CPU usage in percents
                machineDetails_totalRam: "Total RAM: {0} MB",   //{0}=Total RAM in MB-s
                machineDetails_usedRam: "Used RAM: {0} MB",     //{0}=Used RAM in MB-s

                agentNameTemplate: "Agent-{1}",                  //"{0}-Agent-{1}"                    //{0}=Machine name, {1}=Agent index

                connected: "Connected",
                showAll: "Show all",

                eventTypes: {
                    Registered: "Pending",
                    Started: "In Progress",
                    Done: "Done",
                    Failed: "Failed"
                }
            },
            defaultFilters: []                                  //Default filters on the Kendo DataSource
        }, options);

        var eventTypesArray = [
            {
                value: "Registered",
                text: "Pending"
            }, {
                value: "Started",
                text: "In Progress"
            }, {
                value: "Done",
                text: "Done"
            }, {
                value: "Failed",
                text: "Failed"
            }
        ];


        function sortResults(array, prop, asc) {
            return array.sort(function (a, b) {
                if (asc) return (a[prop] > b[prop]) ? 1 : ((a[prop] < b[prop]) ? -1 : 0);
                else return (b[prop] > a[prop]) ? 1 : ((b[prop] < a[prop]) ? -1 : 0);
            });
        }

        function getAgentNameByGuid(machineName, agentGuid) {
            if (machineName === undefined || machineName === null || agentGuid === undefined || agentGuid === null)
                return "";

            var agents = machinesDataSource.get(machineName).get("Agents");
            var selectedAgent = $.grep(agents, function (agent) {
                return agent.Agent === agentGuid;
            });
            if (selectedAgent.length)
                return options.localization.agentNameTemplate.replace("{0}", machineName).replace("{1}", selectedAgent[0].Index);
            else return "";
        }

        function updateSearchFiltersOnTaskGrid(field, operator, value) {
            var newFilter = { field: field, operator: operator, value: value };
            var filters = taskDataSource.filter() && taskDataSource.filter().filters;

            if (!filters) {
                filters = [newFilter];
            }
            else {
                for (var i = 0; i < filters.length; i++) {
                    if (filters[i].field == field) {
                        filters[i] = newFilter;
                        taskDataSource.filter(filters);
                        return;
                    }
                }
                filters.push(newFilter);
            }
            taskDataSource.filter(filters);
        }

        function removeSearchFilterFromTaskGrid(field) {
            var filters = taskDataSource.filter() && taskDataSource.filter().filters;
            if (!filters)
                return;
            var newFilters = $.grep(filters, function (filter) {
                return filter.field != field;
            });
            if (filters.length != newFilters.length)
                taskDataSource.filter(newFilters);

        }

        function resizeGrid() {
            $taskGrid.find(".k-grid-content").css({ "height": "auto" });
        }

        // ReSharper disable once InconsistentNaming
        var TaskEventTypes = {
            Registered: "Registered",
            Updated: "Updated",
            Started: "Started",
            Done: "Done",
            Failed: "Failed",
            SubtaskStarted: "SubtaskStarted",
            SubtaskFinished: "SubtaskFinished",
            Progress: "Progress",
            Idle: "Idle"
        }

        // ReSharper disable once InconsistentNaming
        var SubtaskStates = {
            Pending: "Pending",
            Started: "Started",
            Done: "Done",
            Failed: "Failed"
        }

        /*End constants*/

        var subtasksCache = {};

        var taskDataSource = new kendo.data.DataSource({
            pageSize: 10,
            schema: {
                model: {
                    id: "TaskId",
                    fields: {
                        TaskId: {},
                        StartTime: { type: "date" },
                        EventTime: {},
                        EventType: { type: "string" },
                        EventTypeDisplayName: {},
                        Machine: {},
                        Agent: {},
                        AgentName: {},
                        Title: {},
                        Details: {},
                        Tag: {},
                        Subtasks: {},
                        dataDisplayName: {},
                        AppId: {},
                        TaskData: {},
                        TaskOrder: {},
                        TaskType: {},
                        Progress: {}
                    },
                }
            },
            serverPaging: false,
            serverSorting: false,
            serverFiltering: false
        });

        var machinesDataSource = new kendo.data.DataSource({
            schema: {
                model: {
                    id: "Machine",
                    fields: {
                        Machine: {},
                        TotalRam: {},
                        UsedRam: {},
                        CPUUsage: {},
                        Selected: {},
                        Agents: {}
                    }
                }
            }
        });

        var machinesObservable = kendo.observable({
            machinesSource: machinesDataSource,
            CPUPercent: function (ev) {
                return ev.get("CPUUsage") + "%";
            },
            TotalRamText: function (ev) {
                return ev.get("TotalRam") + " MB";
            },
            UsedRamText: function (ev) {
                return ev.get("UsedRam") + " MB";
            },
            RAMPercent: function (ev) {
                return Math.round(ev.get("UsedRam") / ev.get("TotalRam") * 100) + "%";
            },
            hideDetailsTimer: null,
            selectedMachine: null,
            selectedAgent: null,
            selectMachine: function (ev) {
                $('.agent-selected').removeClass('selected');
                if (this.selectedMachine !== ev.data.Machine) {

                    updateSearchFiltersOnTaskGrid("Machine", "eq", ev.data.Machine);
                    removeSearchFilterFromTaskGrid("Agent");
                    this.set("selectedMachine", ev.data.Machine);
                    this.set("selectedAgent", null);
                }
                $(ev.target).find(".machineDetails").fadeIn(500);
            },
            setClass: function (ev) {
                if (ev.Machine && this.get("selectedMachine") === ev.Machine || ev.Agent && this.get("selectedAgent") === ev.Agent) {
                    return "fa fa-laptop selected machine";
                } else {
                    return "fa fa-laptop machine";
                }
            },


            isDetailsVisible: function (ev) {
                return (this.get("selectedMachine") === ev.Machine);
            },
            deselectMachines: function (setClass) {
                this.set("selectedMachine", "");
                taskDataSource.filter(options.defaultFilters);
            },
            selectAgent: function (ev) {
                $target = $(ev.target);
                if (this.selectedAgent !== ev.data.Agent) {
                    updateSearchFiltersOnTaskGrid("Agent", "eq", ev.data.Agent);
                    this.set("selectedAgent", ev.data.Agent);
                    $target.addClass('selected').siblings().removeClass('selected');
                }
            },

            deselectClass: function (ev) {
                $('.agent.selected').removeClass('selected');
                if (this.get("selectedMachine")) {
                    return "fa fa-toggle-off deselectAllMachines";
                } else {
                    return "fa fa-toggle-on deselectAllMachines";
                }
            },
            hideDetails: function (ev) {
                $(ev.sender.element).closest(".machineDetails").fadeOut(300);
            },
            getAgentName: function (ev) {
                return options.localization.agentNameTemplate.replace("{0}", ev.MachineName).replace("{1}", ev.Index);
            },
            getAgentId: function (ev) {
                var agentName = ev.Agent;
                return agentName.split('#')[1];

            }

        });

        var machinesContainer = kendo.template($("#machinesContainerTemplate").html());
        $taskGrid.before(machinesContainer({}));

        kendo.bind($("#machinesWrapper"), machinesObservable);

        $("#resetFilters").kendoButton({
            icon: "funnel-clear"
        });


        $("#showFailedOnly").kendoButton({
            icon: "note"
        });

        var connection = $.hubConnection();
        connection.qs = { 'appid': options.appId };

        var taskMonitorHubProxy = connection.createHubProxy('taskMonitorHub');

        connection.disconnected(function () {

            $('#connectionState').removeClass('connected').addClass('disconnected');
            $('#connectionState').attr('title', options.localization.disconnected);

            // in case the connection was closed: restart the connection after a few seconds.
            setTimeout(function () {
                startHubConnection();
            }, 5000);
        });

        var agentTimerId = '';

        var startHubConnection = function () {
            connection.start()
                .done(function () {
                    startup();
                })
                .fail(function () {
                });
        }

        var addTask = function (taskEvent) {
            var agentName = getAgentNameByGuid(taskEvent.Machine, taskEvent.Agent);
            taskDataSource.add({
                TaskId: taskEvent.TaskId,
                StartTime: moment(options.parseDateFromUTC(taskEvent.EventTime)).toDate(),//.format(options.dateFormat),
                EventTime: taskEvent.EventTime,
                EventType: taskEvent.EventType,
                EventTypeDisplayName: options.localization.eventTypes[taskEvent.EventType],
                Machine: taskEvent.Machine,
                Agent: taskEvent.Agent,
                AgentName: agentName,
                Title: taskEvent.Title,
                Details: taskEvent.Details,
                Tag: taskEvent.Tag,
                dataDisplayName: taskEvent.dataDisplayName,
                AppId: taskEvent.AppId,
                TaskData: taskEvent.TaskData,
                TaskOrder: taskEvent.TaskOrder,
                TaskType: taskEvent.TaskType,
                Progress: 0
            });
        }

        var updateTaskProgress = function (taskId, subtaskId, taskProgress, subtaskProgress) {

            if (!taskId)
                return;

            var taskDataItem = taskDataSource.get(taskId);
            if (taskDataItem.EventType !== TaskEventTypes.Done || taskDataItem.EventType !== TaskEventTypes.Failed) {
                taskDataItem.set("EventType", TaskEventTypes.Started);
                taskDataItem.set("EventTypeDisplayName", options.localization.eventTypes[TaskEventTypes.Started]);
            }

            taskDataItem.set("Progress", taskProgress);
            var allSubtasks = taskDataItem.get("Subtasks");
            if (allSubtasks !== undefined) {
                var currentSubtask = $.grep(allSubtasks, function (e) {
                    return (e.SubtaskId == subtaskId);
                })[0];
                currentSubtask.Progress = subtaskProgress;
                taskDataItem.set("Subtasks", allSubtasks);
            }
        }

        var updateTask = function (dataItem, taskEvent) {

            if (dataItem.EventType === TaskEventTypes.Failed || dataItem.EventType === TaskEventTypes.Done) {
                return;
            }

            dataItem = $.extend(dataItem, {
                EventTime: taskEvent.EventTime,
                Machine: taskEvent.Machine,
                Agent: taskEvent.Agent,
                AgentName: getAgentNameByGuid(taskEvent.Machine, taskEvent.Agent),
                Title: taskEvent.Title,
                Details: taskEvent.Details,
                Tag: taskEvent.Tag,
                dataDisplayName: taskEvent.dataDisplayName
            });
            if (taskEvent.EventType === TaskEventTypes.Done && dataItem.Subtasks) {
                dataItem.Subtasks.forEach(function (e) {
                    e.Progress = 100;
                    e.State = SubtaskStates.Done;
                });
            }
            if (taskEvent.EventType === TaskEventTypes.Failed && dataItem.Subtasks) {
                dataItem.Subtasks.forEach(function (e) {
                    if (e.State != SubtaskStates.Done)
                        e.State = SubtaskStates.Failed;
                });
            }
            dataItem.set("EventType", taskEvent.EventType);
            dataItem.set("EventTypeDisplayName", options.localization.eventTypes[taskEvent.EventType]);

        }

        var addSubtask = function (dataItem, taskEvent) {

            subtasksCache[taskEvent.SubtaskId] = dataItem.TaskId;

            var getSubtaskState = function (subtaskState, dataItem) {
                if (dataItem.EventType === TaskEventTypes.Failed)
                    return SubtaskStates.Failed;
                else if (dataItem.EventType === TaskEventTypes.Done)
                    return SubtaskStates.Done;
                return subtaskState;
            }


            var currentSubtasks = dataItem.get("Subtasks");
            if (!currentSubtasks) {
                currentSubtasks = [];
            }

            currentSubtasks.push({
                SubtaskId: taskEvent.SubtaskId,
                Title: taskEvent.Title,
                Details: taskEvent.Details,
                Progress: 0,
                State: getSubtaskState(SubtaskStates.Started, dataItem)
            });
            dataItem.set("Subtasks", currentSubtasks);
        }

        var updateSubtask = function (dataItem, taskEvent) {
            if (!taskEvent.SubtaskId) {
                return;
            }
            var currentSubtasks = dataItem.get("Subtasks");
            dataItem.set("Subtasks", currentSubtasks);
        }

        var finishSubtask = function (dataItem, subtaskId) {
            if (dataItem.Subtasks && dataItem.Subtasks.length) {
                var subTask = $.grep(dataItem.Subtasks, function (e) {
                    return (e.SubtaskId == subtaskId);
                });
                subTask[0].set("Progress", 100);
                subTask[0].set("State", SubtaskStates.Done);
            }
        }

        var updateMachine = function (machine) {
            if (!machine)
                return;
            var dataItem = machinesDataSource.get(machine);

            if (!dataItem) {
                machinesDataSource.pushUpdate({
                    Machine: machine,
                    TotalRam: 0,
                    UsedRam: 0,
                    CPUUsage: 0,
                    Agents: []
                });
            }
        }

        var updateMachineFromHealthRecord = function (machine, totalRam, usedRam, cpuUsage) {
            var dataItem = machinesDataSource.get(machine);

            if (!dataItem) {
                machinesDataSource.pushUpdate({
                    Machine: machine,
                    Agents: []
                });
                dataItem = machinesDataSource.get(machine);
            }

            if (!dataItem.get("Agents"))
                dataItem.set("Agents", []);

            dataItem.set("TotalRam", totalRam);
            dataItem.set("UsedRam", usedRam);
            dataItem.set("CPUUsage", Math.round(cpuUsage));
        }

        var updateAgent = function (machine, agent) {
            var dataItem = machinesDataSource.get(machine);

            if (!dataItem || !agent)
                return;

            var agents = dataItem.get("Agents");
            if (!agents)
                agents = [];

            var foundIndex = 0;
            var exists = $.grep(agents, function (ev, i) {
                var match = (ev.Agent === agent);
                if (match) {
                    // store index for updating update time property below
                    foundIndex = i;
                }
                return match;
            }).length;

            if (exists === 0) {
                agents.push({ Agent: agent, Index: agents.length + 1, MachineName: machine, LastHeartbeat: new Date() });
                dataItem.set("Agents", agents);
            } else {
                agents[foundIndex].LastHeartbeat = new Date();
            }
        }

        var checkAgents = function (agents) {
            //iterate through machines and its agents to check if any of them has not been responding for a long time
            $.each(machinesDataSource.data(), function (mIndex, machine) {
                $.each(machine.Agents, function (aIndex, agent) {
                    //TODO: if the last heartbeat is too old, mark the agent and the corresponding rows on the GUI

                    var t1 = agent.LastHeartbeat;
                    var t2 = new Date();
                    var dif = t1.getTime() - t2.getTime();
                    var Seconds_from_T1_to_T2 = dif / 1000;
                    var agentName = agent.Agent.split('#')[1];

                    if (Seconds_from_T1_to_T2 < -30) {
                        $('[data-agentid="' + agentName + '"]').addClass('disabled');
                    }
                    else {
                        $('[data-agentid="' + agentName + '"]').removeClass('disabled');
                    }

                });
            });
        }

        var processTaskEvent = function (taskEvent) {
            console.log(taskEvent.Tag);
            try {
                taskEvent.parsedTaskData = JSON.parse(taskEvent.TaskData);
                taskEvent.dataDisplayName = taskEvent.parsedTaskData.DisplayName;
                taskEvent.dataId = taskEvent.parsedTaskData.Id;
            } catch (e) {
            }

            updateMachine(taskEvent.Machine);
            updateAgent(taskEvent.Machine, taskEvent.Agent);

            var dataItem = taskDataSource.get(taskEvent.TaskId);

            if (!dataItem || !dataItem.set) {
                if (taskEvent.EventType === TaskEventTypes.Registered || taskEvent.EventType === TaskEventTypes.Failed) {
                    addTask(taskEvent);
                }
                return;
            }

            switch (taskEvent.EventType) {
                case TaskEventTypes.Registered:
                    //Already added
                    break;
                case TaskEventTypes.Updated:
                case TaskEventTypes.Started:
                case TaskEventTypes.Failed:
                case TaskEventTypes.Done:
                    updateTask(dataItem, taskEvent);
                    break;
                case TaskEventTypes.SubtaskStarted:
                    addSubtask(dataItem, taskEvent);
                    break;
                case TaskEventTypes.Progress:
                    //ToDo: process calculation for entire task
                    updateSubtask(dataItem, taskEvent.Progress.SubtaskId);
                    break;
                case TaskEventTypes.SubtaskFinished:
                    finishSubtask(dataItem, taskEvent.SubtaskId);
                    break;
                default:
            }
        }

        var processHeartbeat = function (agentName, healthRecord) {
            updateMachineFromHealthRecord(healthRecord.Machine, healthRecord.TotalRAM, healthRecord.RAM, healthRecord.CPU);
            updateAgent(healthRecord.Machine, healthRecord.Agent);
        }

        var processProgress = function (progressRecord) {
            var progress = progressRecord.Progress;
            var subtaskProgress = parseInt(progress.p * 100 / progress.pm);
            var taskProgress = parseInt(progress.op * 100 / progress.opm);
            var subtaskId = progress.subtaskId;
            var taskId = progressRecord.TaskId || null;

            updateTaskProgress(taskId, subtaskId, taskProgress, subtaskProgress);
        }

        taskMonitorHubProxy.on('onTaskEvent', function (taskEvent) {
            processTaskEvent(taskEvent);

        });

        taskMonitorHubProxy.on('heartbeat', function (agentName, healthRecord) {
            processHeartbeat(agentName, healthRecord);
        });

        taskMonitorHubProxy.on('writeProgress', function (progressRecord) {
            processProgress(progressRecord);
        });

        // start the connection for the first time
        startHubConnection();

        function startup() {

            // stop previous timer
            clearTimeout(agentTimerId);

            // start new agent timer
            agentTimerId = setInterval(checkAgents, 35000);

            $('#connectionState').removeClass('disconnected').addClass('connected');
            $('#connectionState').attr('title', options.localization.connected);

            taskMonitorHubProxy.invoke("GetUnfinishedTasks", options.appId, null)
            .done(function (result) {
                for (var i = 0; i < result.length; i++) {
                    processTaskEvent(result[i]);
                }
            })
            .fail(function (error) {

            });
        }

        function initSubtasks(ev) {
            if (!ev.data.Subtasks) {

                // initialize Subtasks array to prevent subsequent requests for the same event list
                ev.data.set("Subtasks", []);

                taskMonitorHubProxy.invoke("GetDetailedTaskEvents", ev.data.AppId, ev.data.Tag, ev.data.TaskId)
                .done(function (result) {
                    result = sortResults(result, "EventTime", true);
                    for (var i = 0; i < result.length; i++) {
                        switch (result[i].EventType) {
                            case TaskEventTypes.SubtaskStarted:
                                addSubtask(ev.data, result[i]);
                                break;
                            case TaskEventTypes.SubtaskFinished:
                                finishSubtask(ev.data, result[i].SubtaskId);
                                break;
                            case TaskEventTypes.Registered:
                            case TaskEventTypes.Failed:
                                break;
                            default:
                                processTaskEvent(result[i]);
                                break;
                        }
                    }
                    createSubGrid(ev);
                }).fail(function (error) {
                });
            } else {
                createSubGrid(ev);
            }
        }

        function statusFilter(element) {
            element.kendoDropDownList({
                dataSource:
                    [
                    { "Name": options.localization.eventTypes.Registered, "Value": TaskEventTypes.Registered },
                    { "Name": options.localization.eventTypes.Started, "Value": TaskEventTypes.Started },
                    { "Name": options.localization.eventTypes.Done, "Value": TaskEventTypes.Done },
                    { "Name": options.localization.eventTypes.Failed, "Value": TaskEventTypes.Failed },
                    ],
                dataTextField: "Name",
                dataValueField: "Value"
            });
        }

        function createSubGrid(ev) {

            if (!ev.data.Subtasks) {
                return;
            }

            var $tGrid = $("<div/>").appendTo(ev.detailCell).addClass("innerGrid");
            $tGrid.kendoGrid({
                dataSource: ev.data.Subtasks,
                scrollable: false,
                sortable: false,
                pageable: false,
                columns: [
                    {
                        field: "Title",
                        template: "<span class='subGridTitle' title='${ Details||'' }'> <span class='status-icon ${ State }'> </span> ${ Title }</span>"
                    },
                    {
                        field: "Progress",
                        template: "<div class='progressBar ${ State }' ><div class='percentage' style='width: ${ Progress }%'></div> </div>"
                    },
                    {},
                    {},
                    {},
                    {}
                ]
            });
        }

        var currentTop = 0;

        var $mainTaskGrid = $taskGrid.kendoGrid({
            dataSource: taskDataSource,
            toolbar: kendo.template($("#template").html()),
            groupable: true,
            sortable: true,
            pageable: true,
            //height: "620px",
            detailInit: initSubtasks,
            detailExpand: function (e) {
                var uid = e.masterRow.data('uid');
                if (expandedRows.indexOf(uid) === -1)
                    expandedRows.push(uid);
                resizeGrid();
            },
            detailCollapse: function (e) {
                var uid = e.masterRow.data('uid');
                var index = expandedRows.indexOf(uid);
                if (index > -1) {
                    expandedRows.splice(index, 1);
                }
                resizeGrid();
            },
            dataBinding: function (e) {
                currentTop = $(document).scrollTop();
            },
            dataBound: function () {
                var grid = this;
                var colCount = grid.columns.length;

                var gridContent = this.element.find('.k-grid-content');
                if (grid.dataSource.total() == 0) {
                    gridContent.css('height', gridContent.height() + this.pager.element.innerHeight());
                    this.pager.element.hide();
                    $('tbody').append('<tr class="kendo-data-row"><td colspan="' + (colCount + 1) + '" class="no-data">' + SN.Resources.BackgroundOperations["NoData"] + '</td></tr>');
                    $('.k-grid-content').css('overflow-y', 'hidden');
                }
                else {
                    this.pager.element.show();
                    gridContent.css('height', gridContent.height() - this.pager.element.innerHeight());
                }
                if (grid.dataSource.total() < 11) {
                    $('.k-grid-pager').children('a, ul').hide();
                } else {
                    $('.k-grid-pager').children('a, ul').show();
                }

                expandedRows.forEach(function (expandedRowUid) {
                    grid.expandRow($('tr[data-uid=' + expandedRowUid + ']'));
                });
                resizeGrid();
                $(document).scrollTop(currentTop);
            },
            filterable: false,
            columns: [
                {
                    field: "Title",
                    title: options.localization.gridHeader_Name,
                    template: "<span class='status-icon ${ EventType }'> </span> ${ Title }",
                    filterable: false
                },
                {
                    field: "EventType",
                    title: options.localization.gridHeader_Status,
                    template: "<div class='statusContainer'> ${ EventTypeDisplayName } </div> <div class='progressBar ${ EventType }' ><div class='percentage' style='width: ${ Progress }%'></div> </div>",
                    filterable: {
                        ui: statusFilter,
                        operators: {
                            string: {
                                contains: "Is",
                                doesnotcontain: "Is not"
                            }
                        }
                    }
                },
                {
                    field: "dataDisplayName",
                    title: options.localization.gridHeader_relatedContentDisplayName,
                    template: "<a href='${ Tag }' target='_blank'> ${ dataDisplayName }</a>"

                },
                {
                    field: "Machine",
                    title: options.localization.gridHeader_Machine
                },
                {
                    field: "AgentName",
                    title: options.localization.gridHeader_Agent,
                    template: "${AgentName}"
                },
                {
                    field: "StartTime",
                    title: options.localization.gridHeader_StartTime,
                    format: "{0:MM/dd/yyyy HH:mm tt}",
                    filterable: {
                        ui: "datetimepicker",
                    }
                }
            ]
        });

        var dropDown = $mainTaskGrid.find("#statusFilter").kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            autoBind: false,
            optionLabel: "All",
            dataSource: eventTypesArray,
            change: function () {
                var value = this.value();
                if (value) {
                    $mainTaskGrid.data("kendoGrid").dataSource.filter({ field: "EventType", operator: "eq", value: value });
                } else {
                    $mainTaskGrid.data("kendoGrid").dataSource.filter({});
                }
            }
        });

        taskKendoGrid = $taskGrid.data("kendoGrid");
    }
    $.fn.SenseNetTaskGrid = function (options) {
        $taskGrid = $(this);
        init(options);
    }



});