using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using SenseNet.ContentRepository.i18n;

namespace SenseNet.Portal
{
    /// <summary>
    /// Helper class for providing shortcut methods for getting string resources in content views.
    /// </summary>
    public class SNSR
    {
        public static string GetString(string fullResourceKey)
        {
            return SR.GetString(fullResourceKey);
        }
        public static string GetString(string className, string name)
        {
            return SR.GetString(className, name);
        }
        public static string GetString(string fullResourceKey, params object[] args)
        {
            return SR.GetString(fullResourceKey, args);
        }
    }

    internal class SR
    {
        public class Exceptions
        {
            public class ContentView
            {
                public static string InvalidDataHead = "$Error_Portal:ContentView_InvalidDataHead";
                public static string NotFound = "$Error_Portlets:ContentView_NotFound";
            }
        }

        public class FieldControls
        {
            public static string Number_ValidFormatIs = "$Field:Number_ValidFormatIs";

            public static string HyperLink_TextLabel = "$Field:HyperLink_TextLabel";
            public static string HyperLink_HrefLabel = "$Field:HyperLink_HrefLabel";
            public static string HyperLink_HrefImageLabel = "$Field:HyperLink_HrefImageLabel";
            public static string HyperLink_TargetLabel = "$Field:HyperLink_TargetLabel";
            public static string HyperLink_TitleLabel = "$Field:HyperLink_TitleLabel";

            public static string TagList_AddTag = "$Field:TagList_AddTag";
            public static string TagList_BlacklistedTag = "$Field:TagList_BlacklistedTag";
            public static string TagList_BlacklistedTags = "$Field:TagList_BlacklistedTags";
        }

        internal class PRC
        {
            public static string EditMode = "$PortalRemoteControl:EditMode";
            public static string BrowseMode = "$PortalRemoteControl:PreviewMode";
        }

        public class Portlets
        {
            public class ContentCollection
            {
                public static string ErrorLoadingContentView = "$ContentCollectionPortlet:ErrorContentView";
                public static string ErrorInvalidContentQuery = "$ContentCollectionPortlet:InvalidContentQuery";
            }
            internal class ContextSearch
            {
                public static string SearchUnder = "$ContextSearch:SearchUnder_";
            }
        }

        public static string GetString(string fullResourceKey)
        {
            return SenseNetResourceManager.Current.GetString(fullResourceKey);
        }
        public static string GetString(string className, string name)
        {
            return SenseNetResourceManager.Current.GetString(className, name);
        }
        public static string GetString(string fullResourceKey, params object[] args)
        {
            return string.Format(SenseNetResourceManager.Current.GetString(fullResourceKey), args);
        }
    }
}
