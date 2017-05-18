using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Storage;
using SenseNet.Portal.UI;

namespace SenseNet.ApplicationModel
{
    public class UploadResumeAction : ClientAction
    {
        public override string MethodName
        {
            get
            {
                return "SN.Upload.openResumeDialog";
            }
            set
            {
                base.MethodName = value;
            }
        }

        public override string ParameterList
        {
            get
            {
                return this.Content == null ? string.Empty : string.Format(@"{0}, '{1}'", this.Content.Id, User.Current.Name);
            }
            set
            {
                base.ParameterList = value;
            }
        }

        public override void Initialize(Content context, string backUri, Application application, object parameters)
        {
            base.Initialize(context, backUri, application, parameters);

            // Display this action only if the content is in the middle of a
            // multiple upload operation and is locked by the current user.
            if (context.ContentHandler.SavingState == ContentSavingState.Finalized || context.ContentHandler.LockedById != User.Current.Id)
                this.Visible = false;
        }
    }
}
