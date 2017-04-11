﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Web;
using SenseNet.ContentRepository.Workspaces;
using SenseNet.Portal.Virtualization;
using SenseNet.ContentRepository.Storage;
using SenseNet.Portal.UI.PortletFramework;
using SenseNet.ContentRepository;
using System.Web.UI;
using SenseNet.Diagnostics;
using SenseNet.ContentRepository.Storage.Security;
using SenseNet.Tools;

namespace SenseNet.Portal.UI.Controls
{
    public class ContextInfo : Control
    {
        private string _path;
        public string Path
        {
            get { return _path ?? (_path = ContextNode == null ? string.Empty : ContextNode.Path); }
        }

        public string Selector { get; set; }

        public string ReferenceFieldName { get; set; }

        public bool UsePortletContext { get; set; }

        public bool ReplaceNullWithContext { get; set; }

        private Node _contextNode;
        public Node ContextNode
        {
            get { return _contextNode ?? (_contextNode = GetContextNode()); }
        }

        private Node GetContextNode()
        {
            if (PortalContext.Current == null)
                return null;

            var contextNode = PortalContext.Current.ContextNode;

            if (UsePortletContext)
            {
                var portletcontext = ContextBoundPortlet.GetContextNodeForControl(this);
                if (portletcontext != null)
                {
                    contextNode = portletcontext;
                }
                else
                {
                    // workaround: we can't reach the obsolete singlecontent 
                    // portlet here, unless we use reflection...
                    try
                    {
                        var scp = TypeResolver.GetType("SenseNet.Portal.Portlets.SingleContentPortlet");
                        if (scp != null)
                        {
                            var mm = scp.GetMethod("GetContextNodeForControl");
                            if (mm != null)
                            {
                                var singleNode = mm.Invoke(null, new[] { this }) as Node;
                                if (singleNode != null)
                                    contextNode = singleNode;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        // error loading single content portlet
                        SnLog.WriteException(ex);
                    }
                }
            }

            var selector = this.Selector == null ? string.Empty : this.Selector.ToLower();

            switch (selector)
            {
                case "currentuser":
                    contextNode = User.Current as Node;
                    break;
                case "currentpage":
                    contextNode = PortalContext.Current.Page;
                    break;
                case "currentsite":
                    contextNode = Portal.Site.GetSiteByNode(contextNode);
                    break;
                case "currentlist":
                    contextNode = ContentList.GetContentListForNode(contextNode);
                    break;
                case "currentworkspace":
                    contextNode = PortalContext.Current.ContextWorkspace;
                    break;
                case "parentworkspace":
                    {
                        var portalContext = PortalContext.Current;
                        Workspace ws = null;
                        using (new SystemAccount())
                            ws = portalContext.ContextWorkspace != null ? Workspace.GetWorkspaceForNode(portalContext.ContextWorkspace.Parent) : null;
                        if (ws != null && !ws.Security.HasPermission(PermissionType.See))
                            ws = null;
                        contextNode = ws;
                        break;
                    }
                case "currentapplicationcontext":
                    var app = PortalContext.Current.GetApplicationContext();
                    if (app != null)
                        contextNode = app;
                    else if (!ReplaceNullWithContext)
                        contextNode = null;
                    break;
                case "currenturlcontent":
                    var urlNodePath = HttpContext.Current.Request.Params[PortalContext.ContextNodeParamName];
                    contextNode = !string.IsNullOrEmpty(urlNodePath) ? Node.LoadNode(urlNodePath) : null;
                    break;
            }

            if (!string.IsNullOrEmpty(ReferenceFieldName) && contextNode != null)
            {
                // need to create the content here for its fields
                var content = Content.Create(contextNode);
                if (content.Fields.ContainsKey(ReferenceFieldName))
                {
                    var refValue = content[ReferenceFieldName];
                    var list = refValue as IEnumerable<Node>;
                    var single = refValue as Node;

                    if (list != null)
                        contextNode = list.FirstOrDefault();
                    else if (single != null)
                        contextNode = single;
                    else
                        contextNode = null;
                }
                else
                {
                    throw new InvalidOperationException(string.Format("Content of type {0} does not have a field named {1}", contextNode.NodeType.Name, ReferenceFieldName));
                }
            }

            return contextNode;
        }
    }
}
