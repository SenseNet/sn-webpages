// ReSharper disable once CheckNamespace
// ReSharper disable RedundantTypeArgumentsOfMethod
namespace SenseNet.Configuration
{
    public class Skin : SnConfig
    {
        private const string SectionName = "sensenet/skin";

        public static string DefaultSkinName { get; internal set; } = GetString(SectionName, "DefaultSkinName", "sensenet");
        public static string RelativeIconPath { get; internal set; } = GetString(SectionName, "RelativeIconPath", "$skin/images/icons");
        public static string OverlayPrefix { get; internal set; } = GetString(SectionName, "OverlayPrefix", "overlay-");
        public static string DefaultIcon { get; internal set; } = GetString(SectionName, "DefaultIcon", "_default");

        public static bool UseScriptDependencyCache { get; internal set; } = GetValue<bool>(SectionName, "UseScriptDependencyCache", true);

        public static string MSAjaxPath { get; internal set; } = GetString(SectionName, "MSAjaxPath", "$skin/scripts/msajax/Start.debug.js");
        
        public static string SnWebdavPath { get; internal set; } = GetString(SectionName, "SNWebdavPath", "$skin/scripts/sn/SN.WebDav.js");
        public static string SnReferenceGridPath { get; internal set; } = GetString(SectionName, "SNReferenceGridPath", "$skin/scripts/sn/SN.ReferenceGrid.js");
        public static string SnBinaryFieldControlPath { get; internal set; } = GetString(SectionName, "SNBinaryFieldControlPath", "$skin/scripts/sn/SN.BinaryFieldControl.js");
        public static string SnUtilsPath { get; internal set; } = GetString(SectionName, "SNUtilsPath", "$skin/scripts/sn/SN.Util.js");
        public static string SnPickerPath { get; internal set; } = GetString(SectionName, "SNPickerPath", "$skin/scripts/sn/SN.Picker.js");
        public static string SnPortalRemoteControlPath { get; internal set; } = GetString(SectionName, "SNPortalRemoteControlPath", "$skin/scripts/sn/SN.PortalRemoteControl.Application.js");
        public static string SnListGridPath { get; internal set; } = GetString(SectionName, "SNListGridPath", "$skin/scripts/sn/SN.ListGrid.js");
        public static string TinyMcePath { get; internal set; } = GetString(SectionName, "TinyMCEPath", "$skin/scripts/tinymce/tiny_mce.js");
        public static string JQueryPath { get; internal set; } = GetString(SectionName, "jQueryPath", "$skin/scripts/jquery/jquery.js");
        public static string JQueryUiPath { get; internal set; } = GetString(SectionName, "jQueryUIPath", "$skin/scripts/jqueryui/minified/jquery-ui.min.js");
        public static string JQueryTreePath { get; internal set; } = GetString(SectionName, "jQueryTreePath", "$skin/scripts/jquery/plugins/tree/jquery.tree.js");
        public static string JQueryTreeCheckboxPluginPath { get; internal set; } = GetString(SectionName, "jQueryTreeCheckboxPluginPath", "$skin/scripts/jquery/plugins/jquery.tree.checkbox.js");
        public static string JQueryGridPath { get; internal set; } = GetString(SectionName, "jQueryGridPath", "$skin/scripts/jquery/plugins/grid/jquery.jqGrid.min.js");


        public static string IconsCssPath { get; internal set; } = GetString(SectionName, "IconsCssPath", "$skin/styles/icons.css");
        public static string JQueryCustomUiCssPath { get; internal set; } = GetString(SectionName, "jQueryCustomUICssPath", "$skin/styles/jqueryui/jquery-ui.css");
        public static string JQueryTreeThemePath { get; internal set; } = GetString(SectionName, "jQueryTreeThemePath", "$skin/scripts/jquery/plugins/tree/themes/default/style.css");
        public static string JQueryGridCssPath { get; internal set; } = GetString(SectionName, "jQueryGridCSSPath", "$skin/scripts/jquery/plugins/grid/themes/ui.jqgrid.css");
        public static string JQueryUiWidgetCssPath { get; internal set; } = GetString(SectionName, "jQueryUIWidgetCSSPath", "$skin/styles/widgets/jqueryui/jquery-ui.css");
        public static string SnWidgetsCss { get; internal set; } = GetString(SectionName, "SNWidgetsCss", "$skin/styles/widgets.css");
    }
}
