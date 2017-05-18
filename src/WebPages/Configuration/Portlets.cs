// ReSharper disable once CheckNamespace
namespace SenseNet.Configuration
{
    public class Portlets : SnConfig
    {
        private const string SectionName = "sensenet/portlets";

        public static string ContentAddNewPortletTemplate { get; internal set; } =
            GetString(SectionName, "ContentAddNewPortletTemplate", "/Root/System/SystemPlugins/Portlets/ContentAddNew/ContentAddNewUserControl.ascx");
    }
}
