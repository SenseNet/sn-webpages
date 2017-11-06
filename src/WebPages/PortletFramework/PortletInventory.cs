using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using SenseNet.ContentRepository.i18n;
using SenseNet.ContentRepository.Storage;
using SenseNet.Portal.UI.PortletFramework;
using System.Reflection;
using SenseNet.Diagnostics;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Storage.Search;
using SenseNet.ContentRepository.Storage.Schema;
using System.Text.RegularExpressions;
using SenseNet.Configuration;
using SenseNet.Search;
using SenseNet.Tools;

namespace SenseNet.Portal.UI.PortletFramework
{
    public class PortletInventory
    {
        /* ====================================================================== Public methods */
        public static readonly string PortletsFolderPath = "/Root/Portlets";
        public static SystemFolder GetPortletFolder()
        {
            var parent = Node.LoadNode(PortletsFolderPath);
            if (parent == null)
            {
                // new portletsDir
                parent = new SystemFolder(Node.LoadNode("/Root"));
                parent.Name = "Portlets";
                parent.Save();
            }
            return parent as SystemFolder;
        }
        public static List<PortletInventoryItem> GetPortletsFromDll()
        {
            var portlets = new List<PortletInventoryItem>();
            foreach (Assembly privateAssembly in TypeResolver.GetAssemblies())
            {
                if (privateAssembly.IsDynamic)
                    continue;

                foreach (Type privateType in privateAssembly.GetTypes())
                {
                    PortletBase wp = null;
                    if (privateType.BaseType != null)
                    {
                        if (privateType.IsSubclassOf(typeof(PortletBase)) && !privateType.IsAbstract && !privateType.IsNotPublic)
                        {
                            object instance = null;
                            try
                            {
                                instance = Activator.CreateInstance(privateType);
                            }
                            catch (Exception e) // logged
                            {
                                SnLog.WriteException(e);
                                continue;
                            }
                            wp = (PortletBase)instance;
                        }
                    }
                    if (wp != null)
                        portlets.Add(PortletInventoryItem.Create(wp, privateAssembly));
                }
            }
            return portlets;
        }
        public static List<PortletCategory> GetCategories(List<PortletInventoryItem> portlets)
        {
            var categories = new List<PortletCategory>();
            foreach (var portlet in portlets)
            {
                if (!categories.Any(c => c.Title == portlet.Portlet.Category.Title))
                    categories.Add(portlet.Portlet.Category);
            }
            return categories;
        }
        public static IEnumerable<Node> GetPortletsFromRepo()
        {
            var cql = $"+TypeIs:{NodeType.GetByName("Portlet").Name} +InTree:{PortletsFolderPath}";
            return ContentQuery.Query(cql, QuerySettings.AdminSettings).Nodes;
        }
        public static IEnumerable<Node> GetCategoriesFromRepo()
        {
            var parent = GetPortletFolder();
            return parent.Children;
        }
        public static void ImportCategory(PortletCategory category, IEnumerable<Node> repoCategories)
        {
            var categoryName = GetValidName(category.Title);
            var parent = GetPortletFolder();
            if (parent == null)
                throw new InvalidOperationException("Portlets folder does not exist.");

            // check if already exists
            if (repoCategories.Any(c => c.Name == categoryName))
                return;

            // create category node
            var categoryNode = Content.CreateNew("PortletCategory", parent, categoryName);
            categoryNode["DisplayName"] = category.Title;
            categoryNode["Description"] = category.Description;
            categoryNode.Save();
        }
        public static void ImportPortlet(PortletInventoryItem portlet, IEnumerable<Node> repoPortlets)
        {
            var nameText = SenseNetResourceManager.Current.GetString(portlet.Portlet.Name);
            var portletName = GetValidName(nameText, false);
            
            // check if already exists
            if (repoPortlets.Any(c => c.Name == portletName))
                return;

            // create portlet node
            var categoryNode = Node.LoadNode(RepositoryPath.Combine(PortletsFolderPath, GetValidName(portlet.Portlet.Category.Title)));
            if (categoryNode == null)
                return;

            var portletNode = Content.CreateNew("Portlet", categoryNode, portlet.Portlet.GetType().Name);
            portletNode["DisplayName"] = portlet.Portlet.Name;
            portletNode["Description"] = portlet.Portlet.Description;
            portletNode["TypeName"] = GetPortletTypeName(portlet.Portlet.GetType());
            var imageData = portlet.GetImageFieldData(portletNode.Fields["PortletImage"]);
            if (imageData != null)
                portletNode["PortletImage"] = imageData;
            portletNode.Save();
        }


        /* ====================================================================== Private methods */
        private static string GetPortletTypeName(Type portletType)
        {
            var fragments = portletType.AssemblyQualifiedName.Split(',');
            // first two fragment: portlet name with namespace and assemblyname without version info
            var portletTypeName = string.Concat(fragments[0], ",", fragments[1]);
            return portletTypeName;
        }
        private static string GetValidName(string title, bool removeResourceClass = true)
        {
            // check for resource key
            string className, key;
            if (removeResourceClass && SenseNetResourceManager.ParseResourceKey(title, out className, out key))
            {
                if (key.StartsWith("Category_"))
                    key = key.Remove(0, 9);

                title = key;
            }

            var name = title;
            name = new Regex(ContentNaming.InvalidNameCharsPattern).Replace(name, string.Empty);
            name = name.Replace(" ", string.Empty);
            return name;
        }
    }
}
