using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Web.UI;
using System.Web.UI.WebControls;
using SenseNet.Portal.UI.PortletFramework;
using System.Web.UI.WebControls.WebParts;
using SenseNet.Configuration;
using SenseNet.Search;
using SenseNet.ContentRepository.Storage;


namespace SenseNet.Portal.Portlets
{
    public class UserGourpManagerPortlet : ContextBoundPortlet
    {
        private const string UserGourpManagerPortletClass = "UserGourpManagerPortlet";

        /// <summary>
        /// Initializes a new instance of the <see cref="UserGourpManagerPortlet"/> class.
        /// </summary>
        public UserGourpManagerPortlet()
        {
            Name = "$UserGourpManagerPortlet:PortletDisplayName";
            Description = "$UserGourpManagerPortlet:PortletDescription";
            Category = new PortletCategory(PortletCategoryType.Portal);

            this.HiddenProperties.Add("Renderer");
        }

        /// <summary>
        /// Gets or sets the group query.
        /// </summary>
        /// <value>The group query.</value>
        [LocalizedWebDisplayName(UserGourpManagerPortletClass, "Prop_GroupQuery_DisplayName")]
        [LocalizedWebDescription(UserGourpManagerPortletClass, "Prop_GroupQuery_Description")]
        [WebBrowsable(true), Personalizable(true)]
        [WebCategory(EditorCategory.Collection, EditorCategory.Collection_Order), WebOrder(50)]
        [Editor(typeof(TextEditorPartField), typeof(IEditorPartField))]
        [TextEditorPartOptions(TextEditorCommonType.MiddleSize)]
        public string GroupQuery { get; set; }


        /// <summary>
        /// Gets the groups.
        /// </summary>
        /// <returns>List of group nodes.</returns>
        private List<Node> GetGroups()
        {
            var groups = new List<Node>();
            if (!String.IsNullOrEmpty(GroupQuery))
            {
                var sort = new[] {new SortInfo("Name")};
                var settings = new QuerySettings { EnableAutofilters = FilterStatus.Disabled, EnableLifespanFilter = FilterStatus.Disabled, Sort = sort };
                var query = new ContentQuery { Text = GroupQuery, Settings  = settings};
                query.AddClause(string.Format("-Path:({0})", string.Join(" ", Identifiers.SpecialGroupPaths)));
                var results = query.Execute();
                groups.AddRange(results.Nodes);
            }
            return groups;
        }

        /// <summary>
        /// Renders the with ascx.
        /// </summary>
        /// <param name="writer">The writer.</param>
        protected override void RenderWithAscx(HtmlTextWriter writer)
        {
            base.RenderContents(writer);
        }


        /// <summary>
        /// Creates the child controls.
        /// </summary>
        protected override void CreateChildControls()
        {
            base.CreateChildControls();
            Controls.Clear();

            var groups = GetGroups();

            var renderer = Page.LoadControl("/Root/System/SystemPlugins/Portlets/UserGroupManager/GroupManager.ascx");
            GetContextNodeForControl(renderer);

            var contextNodeTextBox = renderer.FindControl("ContextNodePath") as TextBox;
            var listView = renderer.FindControl("GroupList") as ListView;

            if (contextNodeTextBox != null && listView != null)
            {
                contextNodeTextBox.Text = ContextNode.Path;
                listView.DataSource = groups;
                listView.DataBind();
                
                Controls.Add(renderer);
                ChildControlsCreated = true;
            }
            else
            {
                var errorMsg = new LiteralControl("Placeholder for contextnode or listview for results is missing.");
                Controls.Add(errorMsg);
                ChildControlsCreated = false;
            }
        }


    }
}
