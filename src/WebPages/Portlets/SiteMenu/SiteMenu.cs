
using SenseNet.Portal.UI.PortletFramework;
namespace SenseNet.Portal.Portlets
{
    public class SiteMenu : SiteMenuBase
    {
        public SiteMenu()
        {
            this.Name = "$SiteMenu:PortletDisplayName";
            this.Description = "$SiteMenu:PortletDescription";
            this.Category = new PortletCategory(PortletCategoryType.Navigation);
        }
    }
}
