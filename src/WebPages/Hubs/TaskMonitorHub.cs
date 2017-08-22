using System;
using System.Collections.Generic;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Client;
using SenseNet.BackgroundOperations;
using SenseNet.ContentRepository;
using SenseNet.Diagnostics;
using SenseNet.TaskManagement.Core;
using Task = System.Threading.Tasks.Task;

namespace SenseNet.Portal.Hubs
{
    /// <summary>
    /// A proxy class that routes every Sense/Net web client connection to the Task Management web app.
    /// </summary>
    [SenseNetAuthorizeHubAttribute(typeof(TaskMonitorHub))]
    public class TaskMonitorHub : Hub
    {
        // a connection that we use to access the central Task Management web application
        private static HubConnection _hubConnection;
        private HubConnection TaskManagerHubConnection
        {
            get
            {
                if (_hubConnection == null)
                {
                    // build a connection to the TaskManagement web
                    var appId = Settings.GetValue<string>(SnTaskManager.Settings.SETTINGSNAME, SnTaskManager.Settings.TASKMANAGEMENTAPPID);
                    var querystringData = new Dictionary<string, string> { { "appid", appId } };
                    var hubConnection = new HubConnection(Settings.GetValue<string>(SnTaskManager.Settings.SETTINGSNAME, SnTaskManager.Settings.TASKMANAGEMENTURL), querystringData);
                    var taskManagerProxy = hubConnection.CreateHubProxy("TaskMonitorHub");

                    // register client methods called by the TaskManagement web
                    taskManagerProxy.On<string, SnHealthRecord>("Heartbeat", Heartbeat);
                    taskManagerProxy.On<SnTaskEvent>("OnTaskEvent", OnTaskEvent);
                    taskManagerProxy.On<SnProgressRecord>("WriteProgress", WriteProgress);

                    StartConnection(hubConnection);

                    hubConnection.Closed += () =>
                    {
                        SnTrace.System.Write("SNTaskMonitorHub connection to the task manager web app closed.");

                        // reset static variables to let the system re-open the connection
                        _hubConnection = null;
                        _taskManagerProxy = null;
                    };

                    // store the connection objects
                    _hubConnection = hubConnection;
                    _taskManagerProxy = taskManagerProxy;
                }

                return _hubConnection;
            }
        }
        
        private static IHubProxy _taskManagerProxy;
        private IHubProxy TaskManagerProxy
        {
            get
            {
                if (_taskManagerProxy == null)
                {
                    // create the connection and the proxy
                    var hc = TaskManagerHubConnection;
                }

                return _taskManagerProxy;
            }
        }

        // ===================================================================== Task Management Web Hub API (called by clients)

        /// <summary>
        /// Loads all tasks from the database that are registered, but not finished or failed. The real status of
        /// currently in progress tasks will be set with the next progress or event call.
        /// </summary>
        /// <param name="appId">Application id to identify the client application.</param>
        /// <param name="tag">If a tag is provided, events will be filtered by it.</param>
        /// <returns></returns>
        public SnTaskEvent[] GetUnfinishedTasks(string appId, string tag)
        {
            SnTrace.System.Write("SNTaskMonitorHub GetUnfinishedTasks. AppId: {0}", appId);

            // make sure that the connection is alive
            if (!CheckConnection())
                return new SnTaskEvent[0];

            // redirect the call to the task management web
            return TaskManagerProxy.Invoke<SnTaskEvent[]>("GetUnfinishedTasks", appId, tag ?? string.Empty).Result;
        }

        /// <summary>
        /// Loads all task and subtask events for a single task.
        /// </summary>
        /// <param name="appId">Application id to identify the client application.</param>
        /// <param name="tag">If a tag is provided, events will be filtered by it.</param>
        /// <param name="taskId">Id of the task to load events for.</param>
        /// <returns></returns>
        public SnTaskEvent[] GetDetailedTaskEvents(string appId, string tag, int taskId)
        {
            SnTrace.System.Write("SNTaskMonitorHub GetDetailedTaskEvents. AppId: {0}, TaskId: {1}", appId, taskId);

            // make sure that the connection is alive
            if (!CheckConnection())
                return new SnTaskEvent[0];

            // redirect the call to the task management web
            return TaskManagerProxy.Invoke<SnTaskEvent[]>("GetDetailedTaskEvents", appId, tag ?? string.Empty, taskId).Result;
        }

        // ===================================================================== Client Hub API (called by the server)

        /// <summary>
        /// Periodically calles the Heartbeat client method for providing state information about task agents. The message is sent to all clients.
        /// </summary>
        public void Heartbeat(string agentName, SnHealthRecord healthRecord)
        {
            SnTrace.System.Write("SNTaskMonitorHub Heartbeat. AgentName: {0}, healthRecord: {1}", agentName, healthRecord);

            Clients.All.Heartbeat(agentName, healthRecord);
        }

        /// <summary>
        /// Calls the OnTaskEvent client method when a task state event occurs (e.g. started, finished, etc.). 
        /// Only clients with the appropriate app id are called.
        /// </summary>
        public void OnTaskEvent(SnTaskEvent e)
        {
            SnTrace.System.Write("SNTaskMonitorHub OnTaskEvent: {0}, taskId: {1}, agent: {2}", e.EventType, e.TaskId, e.Agent);

            Clients.Group(e.AppId).OnTaskEvent(e);
        }

        /// <summary>
        /// Calls the WriteProgress client method when a subtask progress event occurs.
        /// </summary>
        public void WriteProgress(SnProgressRecord progressRecord)
        {
            SnTrace.System.Write("SNTaskMonitorHub WriteProgress: {0}, taskId: {1}", progressRecord.Progress.OverallProgress, progressRecord.TaskId);

            Clients.Group(progressRecord.AppId).WriteProgress(progressRecord);
        }

        // ===================================================================== Overrides

        public override async Task OnConnected()
        {
            // Make sure that the connection toward the server exists. If it doesn't,
            // we have to throw an exception here otherwise clients of this hub 
            // would remain connected and may think that everything is all right.
            if (!CheckConnection())
                throw new ApplicationException("TaskManager is unreachable.");

            var expectedAppId = Settings.GetValue<string>(SnTaskManager.Settings.SETTINGSNAME, SnTaskManager.Settings.TASKMANAGEMENTAPPID);
            var appid = Context.QueryString["appid"];
            if (string.IsNullOrEmpty(appid) || string.Compare(appid, expectedAppId, StringComparison.InvariantCulture) != 0)
            {
                // unknown app
                SnTrace.System.Write("SNTaskMonitorHub Client connected WITHOUT a correct app id.");
                return;
            }

            // The appid is the same for every client, but we have to make sure that
            // we call client methods only if they provided the same app id.
            await Groups.Add(Context.ConnectionId, appid);

            await base.OnConnected();

            SnTrace.System.Write("SNTaskMonitorHub Client connected. ConnectionId: " + Context.ConnectionId);
        }

        // ===================================================================== Helpers

        private static void StartConnection(HubConnection hubConnection)
        {
            try
            {
                hubConnection.Start().Wait();
            }
            catch (Exception ex)
            {
                SnTrace.System.Write("SNTaskMonitorHub connection error. " + ex);
            }
        }

        private bool CheckConnection()
        {
            // reconnect if needed
            if (TaskManagerHubConnection.State != ConnectionState.Connected)
                StartConnection(TaskManagerHubConnection);

            return TaskManagerHubConnection.State == ConnectionState.Connected;
        }
    }
}
