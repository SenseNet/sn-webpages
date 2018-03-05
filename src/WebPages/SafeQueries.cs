using SenseNet.Search;

namespace SenseNet.Portal
{
    /// <summary>Holds safe queries in public static readonly string properties.</summary>
    public class SafeQueries : ISafeQueryHolder
    {
        /// <summary>Returns with the following query: "+Name:'*.xslt' +TypeIs:File .SORT:Path .AUTOFILTERS:OFF"</summary>
        public static string PreloadXslt { get; } = "+Name:'*.xslt' +TypeIs:File .SORT:Path .AUTOFILTERS:OFF";

        /// <summary>Returns with the following query: "+InTree:@0 +Depth:@1 .AUTOFILTERS:OFF"</summary>
        public static string PreloadContentTemplates { get; } = "+InTree:@0 +Depth:@1 .AUTOFILTERS:OFF";

        public static string PreloadControls { get; } = "+Name:\"*.ascx\" -Path:'/Root/Global/renderers/MyDataboundView.ascx' -Path:*/celltemplates* .SORT:Path .AUTOFILTERS:OFF";

        /// <summary>Returns with the following query: ""</summary>
        public static string Resources { get; } = "+TypeIs:Resource";

        /// <summary>Returns with the following query: "+TypeIs:Resource +ModificationDate:>@0"</summary>
        public static string ResourcesAfterADate { get; } = "+TypeIs:Resource +ModificationDate:>@0";

        /// <summary>Returns with the following query: "+TypeIs:@0 +SmartUrl:@1 -Path:@2"</summary>
        public static string SmartUrlCollision { get; } = "+TypeIs:@0 +SmartUrl:@1 -Path:@2";
    }
}
