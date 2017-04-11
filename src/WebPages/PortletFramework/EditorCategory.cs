using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace SenseNet.Portal.UI.PortletFramework
{
    public class EditorCategory
    {
        public const string UI = "$PortletFramework:EditorCategory_UI";
        public const int UI_Order = 50;

        /* ====================================================================== Custom portlet editor categories */
        public const string ContentList = "$PortletFramework:EditorCategory_ContentList";
        public const int ContentList_Order = 100;

        public const string Query = "$PortletFramework:EditorCategory_Query";
        public const int Query_Order = 110;

        public const string AddNewPortlet = "$PortletFramework:EditorCategory_AddNewPortlet";
        public const int AddNewPortlet_Order = 120;

        public const string GoogleSearch = "$PortletFramework:EditorCategory_GoogleSearch";
        public const int GoogleSearch_Order = 130;

        public const string SiteMenu = "$PortletFramework:EditorCategory_SiteMenu";
        public const int SiteMenu_Order = 140;

        public const string TagAdmin = "$PortletFramework:EditorCategory_TagAdmin";
        public const int TagAdmin_Order = 150;

        public const string Login = "$PortletFramework:EditorCategory_Login";
        public const int Login_Order = 160;

        public const string ImageLibrary = "$PortletFramework:EditorCategory_ImageLibrary";
        public const int ImageLibrary_Order = 170;

        public const string ImportExport = "$PortletFramework:EditorCategory_ImportExport";
        public const int ImportExport_Order = 180;

        public const string PublicRegistration = "$PortletFramework:EditorCategory_PublicRegistration";
        public const int PublicRegistration_Order = 190;

        public const string QuickSearch = "$PortletFramework:EditorCategory_QuickSearch";
        public const int QuickSearch_Order = 200;

        public const string Search = "$PortletFramework:EditorCategory_Search";
        public const int Search_Order = 210;

        public const string SingleContentPortlet = "$PortletFramework:EditorCategory_SingleContentPortlet";
        public const int SingleContentPortlet_Order = 220;

        public const string Workflow = "$PortletFramework:EditorCategory_Workflow";
        public const int Workflow_Order = 230;

        public const string ADSync = "$PortletFramework:EditorCategory_ADSync";
        public const int ADSync_Order = 240;


        /* ====================================================================== Common portlet editor categories */
        public const string ContextBinding = "$PortletFramework:EditorCategory_ContextBinding";
        public const int ContextBinding_Order = 300;

        public const string Collection = "$PortletFramework:EditorCategory_Collection";
        public const int Collection_Order = 400;

        public const string Cache = "$PortletFramework:EditorCategory_Cache";
        public const int Cache_Order = 500;

        public const string Other = "$PortletFramework:EditorCategory_Other";
        public const int Other_Order = 600;
    }
}
