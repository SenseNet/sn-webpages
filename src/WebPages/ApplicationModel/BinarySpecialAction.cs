using SenseNet.ContentRepository;
using System.Linq;
using SenseNet.Configuration;

namespace SenseNet.ApplicationModel
{
    public class BinarySpecialAction : UrlAction
    {
        public override void Initialize(Content context, string backUri, Application application, object parameters)
        {
            base.Initialize(context, backUri, application, parameters);

            if (context == null)
                return;

            var extension = System.IO.Path.GetExtension(context.Name);
            if (!WebApplication.EditSourceExtensions.Contains(extension))
            {
                this.Visible = false;
                this.Forbidden = true;
            }
        }
    }
}
