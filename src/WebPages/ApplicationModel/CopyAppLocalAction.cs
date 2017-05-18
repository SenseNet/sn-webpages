using System;
using System.Web;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Storage;
using SenseNet.Diagnostics;
using SenseNet.Portal.Virtualization;

namespace SenseNet.ApplicationModel
{
    public class CopyAppLocalAction : ODataActionBase
    {
        public override string MethodName
        {
            get
            {
                return "CopyAppLocal";
            }
            set
            {
                base.MethodName = value;
            }
        }
        public override bool CausesStateChange { get; } = true;
        public sealed override ActionParameter[] ActionParameters { get; } = { new ActionParameter("nodepath", typeof(string), true) };

        public override void Initialize(Content context, string backUri, Application application, object parameters)
        {
            base.Initialize(context, backUri, application, parameters);

            if (context.Path.Contains("/(apps)/This/"))
                this.Forbidden = true;
        }

        public override object Execute(Content content, params object[] parameters)
        {
            if (parameters.Length < 1)
                throw new ArgumentException("Target path is missing.");

            var nodePath = parameters[0] as string;
            var back = PortalContext.Current.BackUrl ?? "/";
            var targetAppPath = RepositoryPath.Combine(nodePath, "(apps)");
            var targetThisPath = RepositoryPath.Combine(targetAppPath, "This");

            // we don't use the system account here, the user must have create rights here
            if (!Node.Exists(targetAppPath))
            {
                var apps = new SystemFolder(Node.LoadNode(nodePath)) { Name = "(apps)" };
                apps.Save();
            }
            if (!Node.Exists(targetThisPath))
            {
                var thisFolder = new Folder(Node.LoadNode(targetAppPath)) { Name = "This" };
                thisFolder.Save();
            }

            try
            {
                Node.Copy(content.Path, targetThisPath);
            }
            catch (Exception ex)
            {
                SnLog.WriteException(ex);
            }

            HttpContext.Current.Response.Redirect(back, true);
            return null;
        }
    }
}
