﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.UI;
using System.Web.UI.WebControls;
using SenseNet.ContentRepository.i18n;
using SenseNet.ContentRepository.Storage.Search;
using SenseNet.ContentRepository.Storage;
using System.Configuration;
using SenseNet.Configuration;
using SenseNet.ContentRepository;
using SenseNet.Search;
using Content = SenseNet.ContentRepository.Content;

namespace SenseNet.Portal.UI.PortletFramework
{
    public class DropDownPartField : DropDownList, IEditorPartField
    {
        /* ====================================================================================================== Constants */

        private static readonly string DefaultContentTypeName = "WebContent";

        /* ====================================================================================================== IEditorPartField */
        private EditorOptions _options;
        public EditorOptions Options
        {
            get
            {
                return _options;
            }
            set
            {
                _options = value;
                BuildList();
            }
        }
        public string EditorPartCssClass { get; set; }
        public string TitleContainerCssClass { get; set; }
        public string TitleCssClass { get; set; }
        public string DescriptionCssClass { get; set; }
        public string ControlWrapperCssClass { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string PropertyName { get; set; }
        public void RenderTitle(HtmlTextWriter writer)
        {
            writer.Write(String.Format(@"<div class=""{0}""><span class=""{1}"" title=""{5}{6}"">{2}</span><br/><span class=""{3}"">{4}</span></div>", TitleContainerCssClass, TitleCssClass, Title, DescriptionCssClass, Description, SenseNetResourceManager.Current.GetString("PortletFramework", "PortletProperty"), PropertyName));
        }
        public void RenderDescription(HtmlTextWriter writer)
        {
        }


        /* ====================================================================================================== Properties */
        private DropDownPartOptions _dropdownOptions;
        public DropDownPartOptions DropdownOptions
        {
            get
            {
                if (_dropdownOptions == null)
                {
                    _dropdownOptions = this.Options as DropDownPartOptions;
                    if (_dropdownOptions == null)
                        _dropdownOptions = new DropDownPartOptions();
                }
                return _dropdownOptions;
            }
        }


        /* ====================================================================================================== Methods */
        private void BuildList()
        {
            // store the selected value for using it after the list is repopulated
            // (storing the index is not correct, we have to use the value)
            var selVal = this.SelectedIndex > 0 ? this.SelectedValue : null;

            // we have to clear the itemlist here to
            // refresh the item collection if changed
            this.Items.Clear();

            if (this.DropdownOptions.CommonType == DropDownCommonType.ContentTypeDropdown)
            {
                // special use-case, content type list is defined in webconfig
                var contentTypeNodes = GetWebContentTypeList();
                foreach (var ctContent in contentTypeNodes.Select(Content.Create))
                    this.Items.Add(new ListItem(ctContent.DisplayName, ctContent.Name));
            }

            if (!string.IsNullOrEmpty(this.DropdownOptions.Query))
            {
                // the list is built up from a query
                var sortinfo = new List<SortInfo> {new SortInfo("Name")};
                var settings = new QuerySettings { EnableAutofilters = FilterStatus.Disabled, Sort = sortinfo };
                var query = ContentQuery.CreateQuery(this.DropdownOptions.Query, settings);
                var result = query.Execute();
                if (result.Count == 0)
                {
                    this.Items.Add(new ListItem(SenseNetResourceManager.Current.GetString("PortletFramework", "DropDown-NoItems"), string.Empty));
                    return;                    
                }
                this.Items.Add(new ListItem(SenseNetResourceManager.Current.GetString("PortletFramework", "DropDown-SelectOne"), string.Empty));
                foreach (var content in result.Nodes.Select(Content.Create))
                {
                    this.Items.Add(new ListItem(content.DisplayName, content.Name));
                }
            }

            // re-select the original selected value if needed
            if (selVal != null)
            {
                var index = 0;
                foreach (ListItem item in this.Items)
                {
                    if (selVal.CompareTo(item.Value) == 0)
                    {
                        this.SelectedIndex = index;
                        break;
                    }

                    index++;
                }
            }
        }
        protected override void Render(HtmlTextWriter writer)
        {
            var clientId = String.Concat(ClientID, "Div");
            string htmlPart = @"<div class=""{0}"" id=""{1}"">";
            writer.Write(String.Format(htmlPart, EditorPartCssClass, clientId));
            RenderTitle(writer);

            var controlCss = ControlWrapperCssClass;
            if (!string.IsNullOrEmpty(this.DropdownOptions.CustomControlCss))
                controlCss = string.Concat(controlCss, " ", this.DropdownOptions.CustomControlCss);

            writer.Write(String.Format(@"<div class=""{0}"">", controlCss));
            base.Render(writer);
            writer.Write("</div>");

            writer.Write("</div>");
        }
        private static bool IsValidContentType(string ctdName)
        {
            return ActiveSchema.NodeTypes.ToNameArray().Contains(ctdName);
        }
        public static IEnumerable<Node> GetWebContentTypeList()
        {
            var contentTypeNames = WebApplication.WebContentNameList;
            if (string.IsNullOrEmpty(contentTypeNames))
                contentTypeNames = DefaultContentTypeName;

            var validCtdNames = contentTypeNames.Split(',').Select(c => c.Trim()).Where(IsValidContentType).ToArray();
            if (validCtdNames.Length == 0)
                return new Node[0];

            var namesClause = string.Join(" ", validCtdNames);
            var cql = $"+TypeIs:ContentType +Name:({namesClause})";
            return ContentQuery.Query(cql, QuerySettings.AdminSettings).Nodes;
        }
    }
}
