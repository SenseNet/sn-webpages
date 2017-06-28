using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Web.UI.WebControls.WebParts;
using System.Xml.Xsl;
using SenseNet.ContentRepository.Storage;
using SenseNet.ContentRepository.Storage.Security;
using SenseNet.Diagnostics;
using SenseNet.Portal.Virtualization;
using System.Web;
using System.ComponentModel;
using SenseNet.Portal;

using SenseNet.ContentRepository;
using System.Web.UI;
using SenseNet.ContentRepository.Storage.Caching.Dependency;
using SenseNet.Portal.Search;
using SenseNet.Search.Parser;

namespace SenseNet.Portal.UI.PortletFramework
{
    public enum PortletMode { Default, Custom }
    public enum BindTarget { Unselected = -1, CurrentContent, CurrentSite, CurrentPage, CurrentUser, CurrentStartPage, CustomRoot, CurrentWorkspace, Breadcrumb, CurrentList }

    public abstract class ContextBoundPortlet : CacheablePortlet
    {
        private const string ContextBoundPortletClass = "ContextBoundPortlet";

        [Obsolete("Inherit from ContextBoundPortletTemplateReplacer instead.", true)]
        public static readonly string PORTLETCONTEXT_TEMPLATENAME = "PortletContext";

        [WebBrowsable(true)]
        [Personalizable(true)]
        [WebCategory(EditorCategory.ContextBinding, EditorCategory.ContextBinding_Order)]
        [LocalizedWebDisplayName(ContextBoundPortletClass, "Prop_BindTarget_DisplayName")] 
        [LocalizedWebDescription(ContextBoundPortletClass, "Prop_BindTarget_Description")]
        [WebOrder(10)]
        public BindTarget BindTarget { get; set; }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(ContextBoundPortletClass, "Prop_CustomRootPath_DisplayName")]
        [LocalizedWebDescription(ContextBoundPortletClass, "Prop_CustomRootPath_Description")]
        [WebCategory(EditorCategory.ContextBinding, EditorCategory.ContextBinding_Order)]
        [WebOrder(20)]
        [Editor(typeof(ContentPickerEditorPartField), typeof(IEditorPartField))]
        [ContentPickerEditorPartOptions()]
        public string CustomRootPath { get; set; }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(ContextBoundPortletClass, "Prop_AncestorIndex_DisplayName")]
        [LocalizedWebDescription(ContextBoundPortletClass, "Prop_AncestorIndex_Description")]
        [DefaultValue(0)]
        [WebCategory(EditorCategory.ContextBinding, EditorCategory.ContextBinding_Order)]
        [WebOrder(30)]
        [Editor(typeof(TextEditorPartField), typeof(IEditorPartField))]
        [TextEditorPartOptions(TextEditorCommonType.Small)]
        public int AncestorIndex { get; set; }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(ContextBoundPortletClass, "Prop_RelativeContentPath_DisplayName")]
        [LocalizedWebDescription(ContextBoundPortletClass, "Prop_RelativeContentPath_Description")]
        [DefaultValue(0)]
        [WebCategory(EditorCategory.ContextBinding, EditorCategory.ContextBinding_Order)]
        [WebOrder(40)]
        public string RelativeContentPath { get; set; }

        [WebBrowsable(true)]
        [Personalizable(true)]
        [LocalizedWebDisplayName(ContextBoundPortletClass, "Prop_ReferenceFieldName_DisplayName")]
        [LocalizedWebDescription(ContextBoundPortletClass, "Prop_ReferenceFieldName_Description")]
        [DefaultValue(0)]
        [WebCategory(EditorCategory.ContextBinding, EditorCategory.ContextBinding_Order)]
        [WebOrder(50)]
        public string ReferenceFieldName { get; set; }

        private bool _cacheByContext = true;
        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ContextBoundPortletClass, "Prop_CacheByContext_DisplayName")]
        [LocalizedWebDescription(ContextBoundPortletClass, "Prop_CacheByContext_Description")]
        [WebCategory(EditorCategory.Cache, EditorCategory.Cache_Order)]
        [WebOrder(12)]
        public bool CacheByContext
        {
            get { return _cacheByContext; }
            set { _cacheByContext = value; }
        }

        protected override string GetCacheKey()
        {
            if (!CacheByContext)
                return base.GetCacheKey();

            // inside GetCacheKey you should use GetContextNodeInternal instead of GetContextNode beacause
            // GetContextNode is virtual and its override may cause circular reference if it contains a call
            // to GetCacheKey   
            Node contextNode;

            using (new SystemAccount())
            {
                contextNode = GetContextNodeInternalSafe();
            }

            return base.GetCacheKey() + (contextNode == null ? string.Empty : contextNode.Path.GetHashCode().ToString());
        }

        public override void AddPortletDependency()
        {
            base.AddPortletDependency();

            if (!CacheByContext)
                return;

            // this works similarly to GetCacheKey, use GetContextNodeInternal instead of GetContextNode
            Node contextNode;

            using (new SystemAccount())
            {
                contextNode = GetContextNodeInternalSafe();
            }

            if (contextNode == null) 
                return;

            var nodeDependency = CacheDependencyFactory.CreateNodeDependency(contextNode);
            Dependencies.Add(nodeDependency);
        }

        private Node _contextNode;
        private bool _contextEvaluated;
        /// <summary>
        /// Gets the portal Node the portlet is bound to. The value of the ContextNode is set by the combined values
        /// of the BindTarget and AncestorIndex properties.
        /// </summary>
        public Node ContextNode
        {
            get
            {
                // if the context node is not found, we must not evaluate it 
                // more than once to avoid multiple error messages in the log
                if (_contextNode == null && !_contextEvaluated)
                {
                    _contextNode = GetContextNode();
                    _contextEvaluated = true;
                }

                return _contextNode;
            }
        }

        /// <summary>
        /// Loads the context content without throwing and exception even if the content 
        /// or the binding root does not exist or the parameters are incorrect. Use this
        /// method in scenarios when a context is needed for infrastructural purposes,
        /// e.g. caching.
        /// </summary>
        /// <returns></returns>
        private Node GetContextNodeInternalSafe()
        {
            Node contextNode = null;

            try
            {
                contextNode = this.GetContextNodeInternal();
            }
            catch (InvalidOperationException)
            {
                // most likely there is an error with the context node (e.g. reference field not found)
            }
            catch (ContentNotFoundException)
            {
                // most likely binding root was not found
            }

            return contextNode;
        }

        private Node GetContextNodeInternal()
        {
            var l2state = StorageContext.L2Cache.Enabled;
            StorageContext.L2Cache.Enabled = false;

            try
            {
                var node = GetBindingRoot();
                if (node == null)
                {
                    var errorMessage = new StringBuilder("BindingRoot cannot be null.");
                    errorMessage.AppendLine();

                    if (BindTarget == BindTarget.CustomRoot && !string.IsNullOrEmpty(CustomRootPath))
                        errorMessage.AppendFormat("Custom root: {0}.", CustomRootPath).AppendLine();
                    else
                        errorMessage.AppendFormat("BindTarget: {0}.", BindTarget).AppendLine();
                    if (!string.IsNullOrEmpty(RelativeContentPath))
                        errorMessage.AppendFormat("Relative path: {0}.", RelativeContentPath).AppendLine();

                    // we will render this exception message to the UI later
                    this.RenderException = new InvalidOperationException(errorMessage.ToString());
                    this.HasError = true;

                    // add more information for the administrator
                    if (PortalContext.Current.ContextNodePath != null)
                        errorMessage.AppendFormat("Context: {0}", PortalContext.Current.ContextNodePath).AppendLine();

                    if (Portal.Page.Current != null)
                        errorMessage.AppendFormat("Application: {0}", Portal.Page.Current.Path).AppendLine();

                    errorMessage.AppendFormat("Portlet: {0}", this.ID).AppendLine();

                    // we need to log a more detailed message here
                    SnLog.WriteException(new InvalidOperationException(errorMessage.ToString()));

                    return null;
                }

                node = AncestorIndex == 0 ? node : node.GetAncestor(AncestorIndex);
                if (!string.IsNullOrEmpty(RelativeContentPath))
                    node = Node.LoadNode(RepositoryPath.Combine(node.Path, RelativeContentPath));

                // select referenced node if needed
                if (!string.IsNullOrEmpty(ReferenceFieldName) && node != null)
                {
                    // need to create the content here for its fields
                    var content = Content.Create(node);
                    if (content.Fields.ContainsKey(ReferenceFieldName))
                    {
                        var refValue = content[ReferenceFieldName];
                        var list = refValue as IEnumerable<Node>;
                        var single = refValue as Node;

                        if (list != null)
                            node = list.FirstOrDefault();
                        else if (single != null)
                            node = single;
                        else
                            node = null;

                        if (node == null)
                        {
                            SnTrace.Repository.Write("Reference field is empty for ContextBoundPortlet: {0}", this.ReferenceFieldName);
                        }
                    }
                    else
                    {
                        throw new InvalidOperationException(
                            $"Content of type {node.NodeType.Name} does not have a field named {ReferenceFieldName}");
                    }
                }

                return node;
            }
            finally
            {
                StorageContext.L2Cache.Enabled = l2state;
            }
        }

        protected virtual Node GetContextNode()
        {
            return GetContextNodeInternal();
        }

        protected virtual Node GetBindingRoot()
        {
            // returns with a fresh instance to aviod a children definition problem
            var bindingRoot = GetBindingRootPrivate();
            if (bindingRoot == null)
            {
                var message = $"Binding root was not found. Bind target: {BindTarget}.";
                if (BindTarget == BindTarget.CustomRoot)
                    message += $" Path: {this.CustomRootPath}";

                throw new ContentNotFoundException(message);
            }

            // load the exact version
            return Node.LoadNode(bindingRoot.Id, bindingRoot.Version);
        }
        protected Node GetBindingRootPrivate()
        {
            switch (BindTarget)
            {
                case BindTarget.Unselected:
                    return Content.CreateNew("Folder", Repository.Root, "DummyNode").ContentHandler;
                case BindTarget.CurrentSite:
                    return SenseNet.Portal.Site.GetSiteByNode(PortalContext.Current.ContextNode);
                case BindTarget.CurrentPage:
                    return PortalContext.Current.Page;
                case BindTarget.CurrentUser:
                    return HttpContext.Current.User.Identity as User;
                case BindTarget.CustomRoot:
                    return Node.LoadNode(this.CustomRootPath);
                case BindTarget.CurrentStartPage:
                    return PortalContext.Current.Site?.StartPage ?? PortalContext.Current.Site;
                case BindTarget.Breadcrumb:
                case BindTarget.CurrentContent:
                    return PortalContext.Current.ContextNode ?? Repository.Root;
                case BindTarget.CurrentWorkspace:
                    return (Node)PortalContext.Current.ContextWorkspace ?? PortalContext.Current.Site;
                case BindTarget.CurrentList:
                    return PortalContext.Current.ContentList;
                default:
                    throw new SnNotSupportedException(BindTarget.ToString());
            }
        }

        protected override XsltArgumentList GetXsltArgumentList()
        {
            var arguments = base.GetXsltArgumentList() ?? new XsltArgumentList();
            arguments.AddExtensionObject("sn://SenseNet.Portal.UI.ContentTools", new ContentTools());
            arguments.AddExtensionObject("sn://SenseNet.Portal.UI.XmlFormatTools", new XmlFormatTools());
            arguments.AddParam("CurrentPortletId",string.Empty,ID);
            return arguments;
        }

        // ==================================================================================================================== Static members

        public static ContextBoundPortlet GetContainingContextBoundPortlet(Control child)
        {
            ContextBoundPortlet ancestor = null;

            while ((child != null) && ((ancestor = child as ContextBoundPortlet) == null))
            {
                child = child.Parent;
            }

            return ancestor;
        }

        public static Node GetContextNodeForControl(Control c)
        {
            var ancestor = GetContainingContextBoundPortlet(c);

            return ancestor != null ? ancestor.ContextNode : null;
        }

        // ==================================================================================================================== Template replacer

        public string ReplaceTemplates(string queryText)
        {
            if (string.IsNullOrEmpty(queryText))
                return queryText;

            return TemplateManager.Replace(typeof (ContextBoundPortletTemplateReplacer), queryText, ContextNode);
        }

        [Obsolete("Inherit from ContextBoundPortletTemplateReplacer instead.", true)]
        protected virtual IEnumerable<string> GetPortletTemplateNames()
        {
            return new List<string>(new[] { PORTLETCONTEXT_TEMPLATENAME });
        }

        [Obsolete("Inherit from ContextBoundPortletTemplateReplacer instead.", true)]
        protected virtual string EvaluateObjectProperty(string objectName, string propertyName)
        {
            return string.Empty;
        }

        [Obsolete("Inherit from ContextBoundPortletTemplateReplacer instead.", true)]
        protected string GetProperty(GenericContent content, string propertyName)
        {
            if (content == null)
                return string.Empty;
            if (string.IsNullOrEmpty(propertyName))
                return content.Id.ToString();

            var value = content.GetProperty(propertyName);
            return value == null ? string.Empty : value.ToString();
        }
        [Obsolete("Inherit from ContextBoundPortletTemplateReplacer instead.", true)]
        protected string GetProperty(Node node, string propertyName)
        {
            if (node == null)
                return string.Empty;
            if (string.IsNullOrEmpty(propertyName))
                return node.Id.ToString();

            var value = node[propertyName];
            return value == null ? string.Empty : value.ToString();
        }
    }

}
