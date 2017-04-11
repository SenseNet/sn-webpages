using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web.UI;
using SenseNet.Services.ContentStore;

namespace SenseNet.Portal.Portlets
{

    public class ContentCollectionView : ContentViewBase
    {
        public new ContentCollectionViewModel Model
        {
            get { return base.Model as ContentCollectionViewModel; }
            set { base.Model = value; }
        }
    }
}
