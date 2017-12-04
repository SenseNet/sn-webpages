using System;
using System.Security.Principal;
using Microsoft.AspNet.SignalR;
using SenseNet.ContentRepository.Security;
using SenseNet.ContentRepository.Storage;
using SenseNet.ContentRepository.Storage.Security;

namespace SenseNet.Portal.Hubs
{
    /// <summary>
    /// Responsible for authorizing access for hub clients. You have to provide the hub type you want to authorize
    /// so that we can check for permissions. The user has to have RunApplication permission for the appropriate
    /// permission placeholder content, e.g. /Root/System/PermissionPlaceholders/Signalr/MyHubType.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, Inherited = false)]
    internal class SenseNetAuthorizeHubAttribute : AuthorizeAttribute
    {
        private static readonly string PermissionPlaceholderPath = "/Root/System/PermissionPlaceholders/Signalr/";

        protected Type HubType { get; }

        public SenseNetAuthorizeHubAttribute(Type hubType)
        {
            if (hubType == null || !typeof(Hub).IsAssignableFrom(hubType))
                throw new ArgumentNullException(nameof(hubType), "Please provide the type of the SignalR hub you are using this attribute on.");

            HubType = hubType;
        }

        protected override bool UserAuthorized(IPrincipal user)
        {
            var princ = user as PortalPrincipal;
            if (princ?.Identity == null)
                return false;

            if (!princ.Identity.IsAuthenticated)
                return false;

            var permissionHead = NodeHead.Get(PermissionPlaceholderPath + HubType.Name);

            return permissionHead != null && SecurityHandler.HasPermission(permissionHead, PermissionType.RunApplication);
        }
    }
}
