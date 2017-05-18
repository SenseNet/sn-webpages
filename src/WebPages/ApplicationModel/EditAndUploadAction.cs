using System.Linq;
using SenseNet.ContentRepository;

namespace SenseNet.ApplicationModel
{
    public class EditAndUploadAction : UploadAction
    {
        public override void Initialize(Content context, string backUri, Application application, object parameters)
        {
            base.Initialize(context, backUri, application, parameters);

            var gc = context?.ContentHandler as GenericContent;
            if (gc == null)
                return;

            // display this action only if it is allowed to upload images to this folder
            if (!gc.GetAllowedChildTypes().Any(ct => ct.IsInstaceOfOrDerivedFrom("Image")))
                this.Visible = false;
        }
    }
}
