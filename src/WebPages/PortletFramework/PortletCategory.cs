using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace SenseNet.Portal.UI.PortletFramework
{
    public enum PortletCategoryType
    {
        None = 0,
        Navigation,
        Portal,
        Content,
        Collection,
        Search,
        Application,
        System,
        Custom,
        ContentOperation,
        KPI,
        Other,
        Workflow,
        Enterprise20
    }
    public class PortletCategory
    {
        public string Title { get; set; }
        public string Description { get; set; }

        public PortletCategory(PortletCategoryType type)
        {
            switch (type)
            {
                case PortletCategoryType.Navigation:
                    this.Title = "$PortletFramework:Category_Navigation";
                    this.Description = "$PortletFramework:Category_Navigation_Description"; 
                    break;
                case PortletCategoryType.Portal:
                    this.Title = "$PortletFramework:Category_Portal";
                    this.Description = "$PortletFramework:Category_Portal_Description"; 
                    break;
                case PortletCategoryType.Content:
                    this.Title = "$PortletFramework:Category_Content";
                    this.Description = "$PortletFramework:Category_Content_Description";
                    break;
                case PortletCategoryType.ContentOperation:
                    this.Title = "$PortletFramework:Category_ContentOperation";
                    this.Description = "$PortletFramework:Category_ContentOperation_Description"; 
                    break;
                case PortletCategoryType.Collection:
                    this.Title = "$PortletFramework:Category_Collection";
                    this.Description = "$PortletFramework:Category_Collection_Description"; 
                    break;
                case PortletCategoryType.Application:
                    this.Title = "$PortletFramework:Category_Application";
                    this.Description = "$PortletFramework:Category_Application_Description";
                    break;
                case PortletCategoryType.System:
                    this.Title = "$PortletFramework:Category_System";
                    this.Description = "$PortletFramework:Category_System_Description";
                    break;
                case PortletCategoryType.Search:
                    this.Title = "$PortletFramework:Category_Search";
                    this.Description = "$PortletFramework:Category_Search_Description"; 
                    break;
                case PortletCategoryType.Custom:
                    this.Title = "$PortletFramework:Category_Custom";
                    this.Description = "$PortletFramework:Category_Custom_Description";
                    break;
                case PortletCategoryType.KPI:
                    this.Title = "$PortletFramework:Category_KPI";
                    this.Description = "$PortletFramework:Category_KPI_Description";
                    break;
                case PortletCategoryType.Other:
                    this.Title = "$PortletFramework:Category_Other";
                    this.Description = "$PortletFramework:Category_Other_Description"; 
                    break;
                case PortletCategoryType.Workflow:
                    this.Title = "$PortletFramework:Category_Workflow";
                    this.Description = "$PortletFramework:Category_Workflow_Description"; 
                    break;
                case PortletCategoryType.Enterprise20:
                    this.Title = "$PortletFramework:Category_Enterprise20";
                    this.Description = "$PortletFramework:Category_Enterprise20_Description"; 
                    break;
            }
        }
        public PortletCategory(string title, string description)
        {
            this.Title = title;
            this.Description = description;
        }
    }
}
