using SenseNet.ContentRepository.Storage;
using SenseNet.Portal.Virtualization;
using SenseNet.Configuration;
using SenseNet.ContentRepository;

namespace SenseNet.Portal
{
    public class SkinManager : SkinManagerBase
    {
        // ================================================================== Overrides

        public override Node GetCurrentSkin()
        {
            if (PortalContext.Current != null)
            {
                if (Page.Current != null && Page.Current.PageSkin != null)
                    return Page.Current.PageSkin;
                if (PortalContext.Current.ContextWorkspace != null && PortalContext.Current.ContextWorkspace.WorkspaceSkin != null)
                    return PortalContext.Current.ContextWorkspace.WorkspaceSkin;
                if (PortalContext.Current.Site != null && PortalContext.Current.Site.SiteSkin != null)
                    return PortalContext.Current.Site.SiteSkin;
            }

            var path = RepositoryPath.Combine(RepositoryStructure.SkinRootFolderPath, Skin.DefaultSkinName);
            return Node.LoadNode(path);
        }

        // ================================================================== Static API

        /// <summary>
        /// Determines if the current skin is a new type of skin. Returns false in case of
        /// legacy skins or there is no current or default skin available.
        /// </summary>
        internal static bool IsNewSkin()
        {
            var currentSkin = Instance.GetCurrentSkin();
            if (currentSkin == null)
                return false;

            var skinContent = Content.Create(currentSkin);

            return (bool)skinContent["NewSkin"];
        }
    }
}
