using Newtonsoft.Json;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Storage.Security;
using SenseNet.ContentRepository.Workspaces;
using SenseNet.Portal.Virtualization;
using System;
using System.Text;

namespace SenseNet.Portal
{
    public static class ClientContext
    {
        /// <summary>
        /// Generates a JSON object containing context information (e.g. current content, current workspace, etc.).
        /// </summary>
        /// <returns>A string containing context information in the form of a JSON object.</returns>
        public static string GenerateScript()
        {
            // default behavior: use the global portal context and the related items
            var pc = PortalContext.Current;
            if (pc == null)
                throw new InvalidOperationException("Not possible to generate a context script without a portal context.");

            return GenerateScript(Content.Create(pc.ContextNode), Site.Current, pc.ContextWorkspace, pc.ContentList, Page.Current, User.Current as User);
        }

        /// <summary>
        /// Generates a JSON object containing context information (e.g. current content, current workspace, etc.).
        /// </summary>
        /// <param name="path">Path of the content that should be used as a starting point.</param>
        /// <returns>A string containing context information in the form of a JSON object.</returns>
        public static string GenerateScript(string path)
        {
            return GenerateScript(Content.Load(path));
        }

        /// <summary>
        /// Generates a JSON object containing context information (e.g. current content, current workspace, etc.).
        /// </summary>
        /// <param name="content">The content that should be used as a starting point.</param>
        /// <returns>A string containing context information in the form of a JSON object.</returns>
        public static string GenerateScript(Content content)
        {
            // We cannot ignore this silently, because the developer explicitly invoked
            // the method with an argument. If the portal context is to be used, please
            // invoke the parameterless overload which employs a different algorithm.
            if (content == null)
                throw new ArgumentNullException(nameof(content));

            return GenerateScript(content,
                PortalContext.GetSiteByNodePath(content.Path),
                Workspace.GetWorkspaceForNode(content.ContentHandler),
                content.ContentHandler.LoadContentList() as ContentList, 
                Page.Current, 
                AccessProvider.Current.GetOriginalUser() as User); // do not use User.Current, because it may contain the system user in elevated cases
        }

        private static string GenerateScript(Content content, Site site, Workspace workspace, ContentList contentList, Page page, User user)
        {
            var sb = new StringBuilder();            

            var contextString = JsonConvert.SerializeObject(new
            {
                currentContent = GetContentProperties(content.ContentHandler as GenericContent),                
                currentSite = GetContentProperties(site),
                currentWorkspace = GetContentProperties(workspace),
                currentList = GetContentProperties(contentList),
                currentPage = GetContentProperties(page),
                currentUser = new
                {
                    id = user.Id,
                    path = user.Path,
                    userName = user.Username,
                    name = user.Name,
                    domain = user.Domain,
                    fullName = user.FullName,
                    avatarUrl = user.AvatarUrl                    
                }
            },
            Formatting.Indented);

            sb.Append(contextString);

            return sb.ToString();
        }

        private static dynamic GetContentProperties(GenericContent gc)
        {
            if (gc == null)
                return null;

            // Use the corresponding content (mainly because of evaluated 
            // string resources, for example in the display name).
            var content = gc.Content;

            return new
            {
                id = content.Id,
                path = content.Path,
                name = content.Name,
                displayName = content.DisplayName
            };
        }
    }
}
