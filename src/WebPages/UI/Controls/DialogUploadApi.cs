using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SenseNet.ApplicationModel;
using SenseNet.Portal.Virtualization;
using SenseNet.Services.ContentStore;
using SenseNet.Search;
using Newtonsoft.Json;
using cr = SenseNet.ContentRepository;
using SenseNet.ContentRepository.Storage;
using SenseNet.ContentRepository.Storage.Security;

namespace SenseNet.Portal.UI.Controls
{
    public class DialogUploadApi: GenericApi
    {
        [ODataFunction]
        public static string GetUserUploads(cr.Content content, string startUploadDate, string path, string rnd)
        {
            if (!HasPermission())
                return null;

            var query = ContentQuery.CreateQuery("+CreatedById:" + ContentRepository.User.Current.Id);
            if (!string.IsNullOrEmpty(startUploadDate))
                query.AddClause("ModificationDate:>='" + startUploadDate + "'");
            if (!string.IsNullOrEmpty(path) && path.StartsWith("/Root/"))
                query.AddClause("InFolder:'" + path + "'");

            return JsonConvert.SerializeObject((from n in query.Execute().Nodes
                         where n != null
                         select new Content(n, true, false, false, false, 0, 0)).ToArray());
        }

        // ===================================================================== Helper methods
        private static readonly string PlaceholderPath = "/Root/System/PermissionPlaceholders/DialogUpload-mvc";
        private static bool HasPermission()
        {
            var permissionContent = Node.LoadNode(PlaceholderPath);
            return !(permissionContent == null || !permissionContent.Security.HasPermission(PermissionType.RunApplication));
        }
    }
}
