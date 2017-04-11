using SenseNet.ContentRepository.Storage;
using SenseNet.ContentRepository.Storage.Security;
using SenseNet.ContentRepository;

namespace SenseNet.ApplicationModel
{
    /// <summary>
    /// Generates a URL for the given content in Content Explorer
    /// </summary>
    public class ExploreAction : PortalAction
    {
        private const string EXPLORECONTENTPATH = "/Root/System/WebRoot/Explore.html";
        private const string EXPLOREURL = "/Explore.html";

        public override string Uri => string.Concat(EXPLOREURL, "#", this.Content.Path);

        public override void Initialize(Content context, string backUri, Application application, object parameters)
        {
            base.Initialize(context, backUri, application, parameters);

            if (!SecurityHandler.HasPermission(NodeHead.Get(EXPLORECONTENTPATH), PermissionType.Open))
                this.Forbidden = true;
        }
    }
}
