using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using SenseNet.ApplicationModel;
using SenseNet.ContentRepository.Schema;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Security;
using SenseNet.ContentRepository.Storage;
using SenseNet.ContentRepository.Storage.Security;
using SenseNet.Diagnostics;
using SenseNet.Search;
using SenseNet.Configuration;
using SenseNet.ContentRepository.i18n;
using SenseNet.ContentRepository.Search;
using SenseNet.Preview;

namespace SenseNet.Portal.UI.ContentListViews
{
    public class ListHelper
    {
        public static string RenderCell(string fieldFullName, string contentListPath)
        {
            if (string.IsNullOrEmpty(fieldFullName))
                return string.Empty;

            try
            {
                var bindingName = FieldSetting.GetBindingNameFromFullName(fieldFullName);
                FieldSetting fieldSetting;
                var pathList = GetCellTemplatePaths(fieldFullName, contentListPath, out fieldSetting);
                if (pathList.Count > 0)
                {
                    // get the template with the system account
                    using (new SystemAccount())
                    {
                        foreach (var templatePath in pathList)
                        {
                            var actualPath = SkinManagerBase.Resolve(templatePath);
                            if (!Node.Exists(actualPath))
                                continue;

                            var template = Node.Load<File>(actualPath);
                            if (template == null) 
                                continue;

                            // replace the template parameters
                            var templateString = RepositoryTools.GetStreamString(template.Binary.GetStream())
                                .Replace("@@bindingName@@", bindingName)
                                .Replace("@@fullName@@", fieldFullName);

                            if (fieldSetting != null)
                                templateString = templateString.Replace("@@fieldName@@", fieldSetting.Name);

                            return templateString;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                SnLog.WriteException(ex);
            }

            // default behavior: simple text rendering
            return string.Format("<%# Eval(\"{0}\") %>", FieldSetting.GetBindingNameFromFullName(fieldFullName));
        }

        public static string GetRunningWorkflowsText(Node relatedContent)
        {
            if (!SearchManager.ContentQueryIsAllowed)
                return string.Empty;

            var cl = ContentList.GetContentListForNode(relatedContent);
            if (cl == null)
                return string.Empty;

            var result = ContentQuery.Query("+InTree:@0 +TypeIs:Workflow +WorkflowStatus:1 +RelatedContent:@1 .AUTOFILTERS:OFF .LIFESPAN:OFF", null,
                cl.Path + "/Workflows", relatedContent.Id);

            var sb = new StringBuilder();
            foreach (var wfInstance in result.Nodes)
            {
                if (sb.Length > 0)
                    sb.Append(", ");

                sb.Append(wfInstance.DisplayName);
            }

            return sb.ToString();
        }

        public static string GetFormattedValueOrEmpty(object contentItem, string fieldName)
        {
            var content = contentItem as Content;
            if (content == null || string.IsNullOrEmpty(fieldName) || !content.Fields.ContainsKey(fieldName))
                return string.Empty;

            return content.Fields[fieldName].GetFormattedValue();
        }

        public static bool HasField(object contentItem, string fieldName)
        {
            var content = contentItem as Content;

            return (content != null && !string.IsNullOrEmpty(fieldName)) && content.Fields.ContainsKey(fieldName);
        }

        public static string GetColumnTitle(string fieldFullName, Node contextNode)
        {
            ContentList cl = null;

            if (contextNode != null)
            {
                cl = ContentList.GetContentListForNode(contextNode) ??
                     ContentList.GetContentListByParentWalk(contextNode);
            }

            return GetColumnTitle(fieldFullName, cl != null ? cl.Path : string.Empty);
        }

        public static string GetColumnTitle(string fieldFullName, string listPath)
        {
            if (string.IsNullOrEmpty(fieldFullName))
                return string.Empty;

            string fieldName;
            var fs = FieldSetting.GetFieldSettingFromFullName(fieldFullName, out fieldName);

            // content list field
            if (fs == null && !string.IsNullOrEmpty(fieldName) && fieldName.StartsWith("#") && !string.IsNullOrEmpty(listPath))
            {
                var cl = Node.Load<ContentList>(listPath);
                if (cl != null)
                {
                    var fsNode = cl.FieldSettingContents.FirstOrDefault(f => f.Name == fieldName) as FieldSettingContent;
                    if (fsNode != null)
                        fs = fsNode.FieldSetting;
                }
            }
            else if (fs == null && fieldFullName.IndexOf(".", StringComparison.Ordinal) < 0)
            {
                // Workaround: field name does not contain a type prefix (it is not a real full name), fallback
                // to generic content. This works incorrectly in case of content types: we will display a title 
                // for the generic content field instead of a content type field - but at this point we have 
                // no way of knowing what kind of content will be displayed in the grid.
                fs = FieldSetting.GetFieldSettingFromFullName(typeof(GenericContent).Name + "." + fieldFullName, out fieldName);
            }

            return fs != null ? UITools.GetSafeText(fs.DisplayName) : string.Empty;
        }

        public static string GetPathList(Content content, string fieldName)
        {
            return GetPathList(content, fieldName, ';');
        }

        public static string GetPathList(Content content, string fieldName, char separator)
        {
            var sb = new StringBuilder();
            if (content == null || string.IsNullOrEmpty(fieldName) || !content.Fields.ContainsKey(fieldName))
                return string.Empty;

            var refData = content[fieldName];
            var references = refData as IEnumerable<Node>;
            if (references == null)
            {
                var node = refData as Node;
                if (node != null)
                    references = new List<Node>(new[] {node});
                else
                    return string.Empty;
            }

            foreach (var refNode in references)
            {
                sb.AppendFormat("{0}{1}", refNode.Path, separator);
            }

            return sb.ToString().TrimEnd(separator);
        }

        private static List<string> GetCellTemplatePaths(string fieldFullName, string contentListPath, out FieldSetting fieldSetting)
        {
            // Path list examples:
            // Normal field:
            // "/Root/Sites/Default_Site/workspaces/Sales/chicagosalesworkspace/Document_Library/CellTemplates/DisplayName.ascx"
            // "/Root/Sites/Default_Site/workspaces/Sales/chicagosalesworkspace/Document_Library/CellTemplates/ShortTextField.ascx"
            // "$skin/celltemplates/DisplayName.ascx"
            // "$skin/celltemplates/ShortTextField.ascx"
            // "$skin/celltemplates/Generic.ascx"

            // Content List field
            // "/Root/Sites/Default_Site/workspaces/Sales/chicagosalesworkspace/Document_Library/CellTemplates/MyField1.ascx"
            // "/Root/Sites/Default_Site/workspaces/Sales/chicagosalesworkspace/Document_Library/CellTemplates/ShortTextField.ascx"
            // "$skin/celltemplates/ShortTextField.ascx"
            // "$skin/celltemplates/Generic.ascx"

            fieldSetting = null;
            var pathList = new List<string>();

            if (!string.IsNullOrEmpty(fieldFullName))
            {
                var listTemplateFolderPath = !string.IsNullOrEmpty(contentListPath)
                                                 ? RepositoryPath.Combine(contentListPath, "CellTemplates")
                                                 : string.Empty;

                string fieldName;
                fieldSetting = FieldSetting.GetFieldSettingFromFullName(fieldFullName, out fieldName);

                if (!string.IsNullOrEmpty(fieldName))
                {   
                    // field name template path
                    if (!string.IsNullOrEmpty(listTemplateFolderPath))
                    {
                        pathList.Add(fieldName.StartsWith("#")
                                         ? RepositoryPath.Combine(listTemplateFolderPath, fieldName.Remove(0, 1) + ".ascx")
                                         : RepositoryPath.Combine(listTemplateFolderPath, fieldName + ".ascx"));
                    }
                }

                // list field
                if (fieldSetting == null && !string.IsNullOrEmpty(fieldName) && fieldName.StartsWith("#") && !string.IsNullOrEmpty(contentListPath))
                {
                    var cl = Node.Load<ContentList>(contentListPath);
                    if (cl != null)
                    {
                        var fsNode = cl.FieldSettingContents.FirstOrDefault(f => f.Name == fieldName) as FieldSettingContent;
                        if (fsNode != null)
                            fieldSetting = fsNode.FieldSetting;
                    }
                }

                // field type template path
                if (fieldSetting != null)
                {
                    var fieldTypeName = fieldSetting.FieldClassName;
                    if (!string.IsNullOrEmpty(fieldTypeName))
                    {
                        var pointIndex = fieldTypeName.LastIndexOf('.');
                        if (pointIndex >= 0)
                            fieldTypeName = fieldTypeName.Substring(pointIndex + 1);

                        if (fieldName != null)
                        {
                            if (!string.IsNullOrEmpty(listTemplateFolderPath))
                            {
                                // try with field type name in the cell template folder under the content list
                                pathList.Add(RepositoryPath.Combine(listTemplateFolderPath, fieldTypeName + ".ascx"));
                            }

                            if (!fieldName.StartsWith("#"))
                            {
                                // normal field: add the skin-relative 'field name path'
                                pathList.Add(RepositoryPath.Combine(RepositoryStructure.CellTemplatesPath, fieldName + ".ascx"));
                            }
                        }

                        // add the skin-relative 'type path' 
                        pathList.Add(RepositoryPath.Combine(RepositoryStructure.CellTemplatesPath, fieldTypeName + ".ascx"));
                    }
                }
            }

            // add the generic cell template path
            pathList.Add(RepositoryPath.Combine(RepositoryStructure.CellTemplatesPath, "Generic.ascx"));

            return pathList;
        }

        public static string GetMainActionName(Content content)
        {
            if (content == null)
                return string.Empty;

            if (content.ContentHandler.NodeType.IsInstaceOfOrDerivedFrom("ViewBase"))
                return "Edit";

            // Check whether the Preview feature is present and the preview 
            // provider supports preview generation for this content.
            if (ApplicationStorage.Instance.Exists("Preview") &&
                DocumentPreviewProvider.Current.IsContentSupported(content.ContentHandler))
                return "Preview";

            return "Browse";
        }

        public static string GetValueByOutputMethod(object contentItem, string fieldName)
        {
            var content = contentItem as Content;
            if (content == null || string.IsNullOrEmpty(fieldName) || !content.Fields.ContainsKey(fieldName))
                return string.Empty;

            var fieldValue = content[fieldName] as string;
            if (string.IsNullOrEmpty(fieldValue))
                return string.Empty;

            switch (content.Fields[fieldName].FieldSetting.OutputMethod)
            {
                case OutputMethod.Default:
                case OutputMethod.Text:
                    return UITools.GetSafeText(fieldValue);
                case OutputMethod.Html:
                    return Sanitizer.Sanitize(fieldValue);
                default:
                    return fieldValue;
            }
        }

        // ===================================================================================== Helper methods

        public static User GetModifierSafely(object dataitem)
        {
            var content = dataitem as Content;
            if (content == null)
                return null;

            User modifier = null;

            try
            {
                modifier = content.ContentHandler.ModifiedBy as User;
            }
            catch(Exception ex)
            {
                SnLog.WriteException(ex);
            }

            return modifier;
        }

        public static User GetCreatorSafely(object dataitem)
        {
            var content = dataitem as Content;
            if (content == null)
                return null;

            User creator = null;

            try
            {
                creator = content.ContentHandler.CreatedBy as User;
            }
            catch (Exception ex)
            {
                SnLog.WriteException(ex);
            }

            return creator;
        }

        public static string GetFieldTypeDisplayName(string typeShortName)
        {
            return string.IsNullOrEmpty(typeShortName) 
                ? string.Empty 
                : SenseNetResourceManager.Current.GetString("ManageFields", typeShortName);
        }
    }
}
