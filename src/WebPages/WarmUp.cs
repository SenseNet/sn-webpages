using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Threading;
using System.Web.Compilation;
using SenseNet.Configuration;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Storage;
using SenseNet.ContentRepository.Storage.Search;
using SenseNet.ContentRepository.Storage.Security;
using SenseNet.Diagnostics;
using SenseNet.Search;
using SenseNet.Tools;

namespace SenseNet.Portal
{
    public class WarmUp // : IProcessHostPreloadClient
    {
        // ============================================================ Properties

        #region Type names for preload
        private static readonly string[] _typesToPreloadByName = {
                                                               "SenseNet.ContentRepository.Storage.Events.NodeObserver",
"SenseNet.ContentRepository.Field",
"SenseNet.ContentRepository.Schema.FieldSetting",
"SenseNet.ContentRepository.TemplateReplacerBase",
"SenseNet.Portal.PortletTemplateReplacer",
"SenseNet.Portal.UI.Controls.FieldControl",
"SenseNet.ContentRepository.Storage.ISnService",
"SenseNet.ContentRepository.Storage.Scripting.IEvaluator",
"SenseNet.ContentRepository.Security.UserAccessProvider",
"SenseNet.ContentRepository.Schema.ContentType",
"SenseNet.Search.Indexing.ExclusiveTypeIndexHandler",
"SenseNet.Search.Indexing.TypeTreeIndexHandler",
"SenseNet.Search.Indexing.InTreeIndexHandler",
"SenseNet.Search.Indexing.InFolderIndexHandler",
"SenseNet.Search.Indexing.SystemContentIndexHandler",
"SenseNet.Search.Indexing.TagIndexHandler",
"SenseNet.ContentRepository.GenericContent",
"SenseNet.ApplicationModel.IncludeBackUrlMode",
"SenseNet.ApplicationModel.Application",
"SenseNet.Services.ExportToCsvApplication",
"SenseNet.ContentRepository.HttpEndpointDemoContent",
"SenseNet.Portal.AppModel.HttpStatusApplication",
"SenseNet.Portal.ApplicationModel.ImgResizeApplication",
"SenseNet.Services.RssApplication",
"SenseNet.Portal.Page",
"SenseNet.ContentRepository.ContentLink",
"SenseNet.ContentRepository.Schema.FieldSettingContent",
"SenseNet.ContentRepository.File",
"SenseNet.ContentRepository.Image",
"SenseNet.ContentRepository.ApplicationCacheFile",
"SenseNet.Portal.MasterPage",
"SenseNet.Portal.PageTemplate",
"SenseNet.ContentRepository.i18n.Resource",
"SenseNet.Portal.UI.ContentListViews.Handlers.ViewBase",
"SenseNet.Portal.UI.ContentListViews.Handlers.ListView",
"SenseNet.ContentRepository.Folder",
"SenseNet.ContentRepository.ContentList",
"SenseNet.ContentRepository.Survey",
"SenseNet.ContentRepository.Voting",
"SenseNet.ApplicationModel.Device",
"SenseNet.ContentRepository.Domain",
"SenseNet.ContentRepository.OrganizationalUnit",
"SenseNet.ContentRepository.PortalRoot",
"SenseNet.ContentRepository.RuntimeContentContainer",
"SenseNet.ContentRepository.SmartFolder",
"SenseNet.ContentRepository.SystemFolder",
"SenseNet.ContentRepository.TrashBag",
"SenseNet.ContentRepository.Workspaces.Workspace",
"SenseNet.Portal.Site",
"SenseNet.ContentRepository.TrashBin",
"SenseNet.ContentRepository.UserProfile",
"SenseNet.ContentRepository.Group",
"SenseNet.ContentRepository.CalendarEvent",
"SenseNet.ContentRepository.Task",
"SenseNet.ContentRepository.User",
"SenseNet.Portal.UI.PathTools",
"SenseNet.Portal.Portlets.ContentListPortlet",
"SenseNet.Portal.UI.Controls.DisplayName",
"SenseNet.Portal.UI.Controls.Name",
"SenseNet.Portal.UI.Controls.RichText",
"SenseNet.ContentRepository.Schema.OutputMethod",
"SenseNet.ContentRepository.Schema.FieldVisibility",
"SenseNet.ContentRepository.Fields.TextType",
"SenseNet.ContentRepository.Fields.DateTimeMode",
"SenseNet.Portal.UI.Controls.ShortText",
"SenseNet.ContentRepository.Fields.UrlFormat",
"SenseNet.Portal.UI.Controls.HyperLink",
"SenseNet.ContentRepository.Fields.DisplayChoice",
"SenseNet.Portal.UI.ContentListViews.FieldControls.ColumnSelector",
"SenseNet.Portal.UI.ContentListViews.FieldControls.SortingEditor",
"SenseNet.Portal.UI.ContentListViews.FieldControls.GroupingEditor",
"SenseNet.Portal.UI.Controls.VersioningModeChoice",
"SenseNet.Portal.UI.Controls.ApprovingModeChoice",
"SenseNet.Portal.UI.Controls.SiteRelativeUrl",
"SenseNet.Portal.Portlets.SingleContentPortlet",
"SenseNet.Portal.UI.ContentListViews.ListHelper"
                                                            };

        private static readonly string[] _typesToPreloadByBase = {
"SenseNet.ContentRepository.Storage.Events.NodeObserver",
"SenseNet.ContentRepository.Field",
"SenseNet.ContentRepository.Schema.FieldSetting",
"SenseNet.ContentRepository.TemplateReplacerBase",
"SenseNet.Portal.PortletTemplateReplacer",
"SenseNet.Portal.UI.Controls.FieldControl" 
                                                            };

        private static readonly string[] _typesToPreloadByInterface = {
"SenseNet.ContentRepository.Storage.ISnService",
"SenseNet.ContentRepository.Storage.Scripting.IEvaluator"
                                                            };

        #endregion

        private static IEnumerable<string> TypesToPreloadByName => _typesToPreloadByName;

        private static IEnumerable<string> TypesToPreloadByBase => _typesToPreloadByBase;

        private static IEnumerable<string> TypesToPreloadByInterface => _typesToPreloadByInterface;

        // ============================================================ Interface

        public static void Preload()
        {
            if (!SystemStart.WarmupEnabled)
            {
                SnLog.WriteInformation("***** Warmup is not enabled, skipped.");
                return;
            }

            // types
            ThreadPool.QueueUserWorkItem(delegate { PreloadTypes(); });
            
            // template replacers and resolvers
            ThreadPool.QueueUserWorkItem(delegate { TemplateManager.Init(); });

            // jscript evaluator
            ThreadPool.QueueUserWorkItem(delegate { JscriptEvaluator.Init(); });

            // xslt
            ThreadPool.QueueUserWorkItem(delegate { PreloadXslt(); });

            // content templates
            ThreadPool.QueueUserWorkItem(delegate { PreloadContentTemplates(); });

            // preload controls
            ThreadPool.QueueUserWorkItem(delegate { PreloadControls(); });

            // preload security items
            ThreadPool.QueueUserWorkItem(delegate { PreloadSecurity(); });
        }

        // ============================================================ Helper methods

        private static void PreloadTypes()
        {
            try
            {
                var missingTypes = new List<string>();

                // preload types by name
                foreach (var typeName in TypesToPreloadByName)
                {
                    try
                    {
                        TypeResolver.GetType(typeName);
                    }
                    catch (TypeNotFoundException)
                    {
                        missingTypes.Add(typeName);
                    }
                }

                // preload types by base
                foreach (var typeName in TypesToPreloadByBase)
                {
                    try
                    {
                        TypeResolver.GetTypesByBaseType(TypeResolver.GetType(typeName));
                    }
                    catch (TypeNotFoundException)
                    {
                        missingTypes.Add(typeName);
                    }
                }

                // preload types by interface
                foreach (var typeName in TypesToPreloadByInterface)
                {
                    try
                    {
                        TypeResolver.GetTypesByInterface(TypeResolver.GetType(typeName));
                    }
                    catch (TypeNotFoundException)
                    {
                        missingTypes.Add(typeName);
                    }
                }

                if (missingTypes.Any())
                    SnLog.WriteWarning("Types not found during warmup: " + string.Join(", ", missingTypes));
            }
            catch (Exception ex)
            {
                SnLog.WriteException(ex);
            }
        }

        private static void PreloadControls()
        {
            try
            {
                QueryResult controlResult;
                var cc = 0;

                var timer = new Stopwatch();
                timer.Start();

                using (new SystemAccount())
                {
                    var query = ContentQuery.CreateQuery(SafeQueries.PreloadControls);
                    if (!string.IsNullOrEmpty(SystemStart.WarmupControlQueryFilter))
                        query.AddClause(SystemStart.WarmupControlQueryFilter);

                    controlResult = query.Execute();

                    foreach (var controlId in controlResult.Identifiers)
                    {
                        var head = NodeHead.Get(controlId);
                        try
                        {
                            if (head != null)
                                BuildManager.GetCompiledType(head.Path);
                        }
                        catch (Exception ex)
                        {
                            SnLog.WriteException(ex, "Error during control load: " + (head == null ? controlId.ToString() : head.Path));
                        }

                        cc++;
                    }
                }

                timer.Stop();

                SnLog.WriteInformation($"***** Control preload time: {timer.Elapsed} ******* Count: {cc} ({controlResult.Count})");
            }
            catch (Exception ex)
            {
                SnLog.WriteException(ex);
            }
        }

        private static void PreloadXslt()
        {
            try
            {
                QueryResult queryResult;
                var cc = 0;

                var timer = new Stopwatch();
                timer.Start();

                using (new SystemAccount())
                {
                    queryResult = ContentQuery.Query(SafeQueries.PreloadXslt);

                    foreach (var nodeId in queryResult.Identifiers)
                    {
                        var head = NodeHead.Get(nodeId);
                        try
                        {
                            if (head != null)
                                UI.PortletFramework.Xslt.GetXslt(head.Path, true);
                        }
                        catch (Exception ex)
                        {
                            SnLog.WriteException(ex, "Error during xlst load: " + (head == null ? nodeId.ToString() : head.Path));
                        }

                        cc++;
                    }
                }

                timer.Stop();

                SnLog.WriteInformation(string.Format("***** XSLT preload time: {0} ******* Count: {1} ({2})", timer.Elapsed, cc, queryResult.Count));
            }
            catch (Exception ex)
            {
                SnLog.WriteException(ex);
            }
        }

        private static void PreloadContentTemplates()
        {
            try
            {
                QueryResult queryResult;

                var timer = new Stopwatch();
                timer.Start();

                using (new SystemAccount())
                {
                    queryResult = ContentQuery.Query(SafeQueries.PreloadContentTemplates, null,
                        RepositoryStructure.ContentTemplateFolderPath, RepositoryPath.GetDepth(RepositoryStructure.ContentTemplateFolderPath) + 2);

                    // ReSharper disable once UnusedVariable
                    // this is a preload operation, we do not want to use the result
                    var templates = queryResult.Nodes.ToList();
                }

                timer.Stop();

                SnLog.WriteInformation($"***** Content template preload time: {timer.Elapsed} ******* Count: {queryResult.Count}");
            }
            catch (Exception ex)
            {
                SnLog.WriteException(ex);
            }
        }

        [SuppressMessage("ReSharper", "UnusedVariable")]
        private static void PreloadSecurity()
        {
            try
            {
                var timer = new Stopwatch();
                timer.Start();

                // preload special groups
                var g1 = Group.Everyone;
                var g2 = Group.Administrators;
                var g3 = Group.Owners;

                timer.Stop();

                SnLog.WriteInformation($"***** Security preload time: {timer.Elapsed} *******");
            }
            catch (Exception ex)
            {
                SnLog.WriteException(ex);
            }
        }
    }
}
