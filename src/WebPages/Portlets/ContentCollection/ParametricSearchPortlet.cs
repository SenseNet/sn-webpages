using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Search;
using SenseNet.Diagnostics;
using SenseNet.Portal.UI.PortletFramework;
using System.Linq;
using System.Text.RegularExpressions;
using Content = SenseNet.ContentRepository.Content;
using SenseNet.Portal.Virtualization;
using SenseNet.Portal.UI.Controls;

namespace SenseNet.Portal.Portlets.ContentCollection
{
    /// <summary>
    /// Class for representing Parametric Search Portlet. It inherits from ContentCollectionPortlet.
    /// </summary>
    public class ParametricSearchPortlet : ContentCollectionPortlet
    {
        private const string ParametricSearchPortletClass = "ParametricSearchPortlet";

        // ============================================================================================================ Consts
        private const string DefaultInputRenderer = @"/Root/System/SystemPlugins/Portlets/ParametricSearch/DefaultSearchForm.ascx";
        private const string EmptyQueryErrorPanelID = "EmptyQueryErrorPanel";

        
        // ============================================================================================================ Members
        private string inputRendererPath;
        private UserControl _inputRenderer;
        private Dictionary<string, string> _searchParams { get; set; }
        private string _queryFilter;
        private bool _invalidQuery;
        private bool _hasUrlInput = false;
        private bool _hasFormInput = false;

        
        // ============================================================================================================ Properties
        /// <summary>
        /// Gets or sets the input renderer.
        /// </summary>
        /// <value>The input renderer. It must be an ascx containing search boxes and a search button.</value>
        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ParametricSearchPortletClass, "Prop_InputRenderer_DisplayName")]
        [LocalizedWebDescription(ParametricSearchPortletClass, "Prop_InputRenderer_Description")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(1005)]
        [Editor(typeof(ViewPickerEditorPartField), typeof(IEditorPartField)), ContentPickerEditorPartOptions(ContentPickerCommonType.Ascx)]
        public string InputRenderer
        {
            get { return string.IsNullOrEmpty(inputRendererPath) ? DefaultInputRenderer : inputRendererPath; }
            set { inputRendererPath = value; }
        }

        private string queryTemplate;
        /// <summary>
        /// Gets or sets the query template.
        /// </summary>
        /// <value>The query template. It contains wildcards according to IDs of textboxes on input renderer.</value>
        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ParametricSearchPortletClass, "Prop_QueryTemplate_DisplayName")]
        [LocalizedWebDescription(ParametricSearchPortletClass, "Prop_QueryTemplate_Description")]
        [WebCategory(EditorCategory.Search, EditorCategory.Search_Order)]
        [WebOrder(10)]
        public string QueryTemplate
        {
            get
            {
                if (queryTemplate == null)
                {
                    return String.Empty;
                }
                return queryTemplate;
            }
            set
            {
                queryTemplate = value;
            }
        }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ParametricSearchPortletClass, "Prop_ExactSearch_DisplayName")]
        [LocalizedWebDescription(ParametricSearchPortletClass, "Prop_ExactSearch_Description")]
        [WebCategory(EditorCategory.Search, EditorCategory.Search_Order)]
        [WebOrder(20)]
        public bool ExactSearch { get; set; }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ParametricSearchPortletClass, "Prop_AllowEmptySearch_DisplayName")]
        [LocalizedWebDescription(ParametricSearchPortletClass, "Prop_AllowEmptySearch_Description")]
        [WebCategory(EditorCategory.Search, EditorCategory.Search_Order)]
        [WebOrder(30)]
        public bool AllowEmptySearch { get; set; }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ParametricSearchPortletClass, "Prop_QueryTemplateDebug_DisplayName")]
        [LocalizedWebDescription(ParametricSearchPortletClass, "Prop_QueryTemplateDebug_Description")]
        [WebCategory(EditorCategory.Search, EditorCategory.Search_Order)]
        [WebOrder(100)]
        public bool QueryTemplateDebug { get; set; }


        // ============================================================================================================ Constructor
        public ParametricSearchPortlet()
        {
            Name = "$ParametricSearchPortlet:PortletDisplayName";
            Description = "$ParametricSearchPortlet:PortletDescription";
            Category = new PortletCategory(PortletCategoryType.Search);

            Cacheable = false;   // by default, caching is switched off

            _searchParams = new Dictionary<string, string>();
        }


        // ============================================================================================================ Methods
        protected override void RenderWithXslt(HtmlTextWriter writer)
        {
            if (_hasFormInput || HttpContext.Current.Request.QueryString.ToString().Contains(Math.Abs((PortalContext.Current.ContextNodePath + this.ID).GetHashCode()).ToString()) || _hasUrlInput)
            {
                try
                {
                    base.RenderWithXslt(writer);
                }
                catch (Exception ex)
                {
                    SnLog.WriteException(ex);
                    BuildErrorMessage(ex);
                }
            }
        }
        /// <summary>
        /// Renders the specified writer. It renders input renderer in case of Xslt rendering.
        /// </summary>
        /// <param name="writer">The writer.</param>
        protected override void Render(HtmlTextWriter writer)
        {
            if (RenderingMode == RenderMode.Xslt)
            {
                _inputRenderer.RenderControl(writer);
            }
            base.Render(writer);

            if (QueryTemplateDebug)
            {
                try
                {
                    writer.Write(string.Concat("Resolved query template: ", GetQueryFilter()));
                }
                catch (Exception ex)
                {
                    SnLog.WriteException(ex);
                    BuildErrorMessage(ex);
                }
            }
        }
        /// <summary>
        /// Raises the <see cref="E:System.Web.UI.Control.PreRender"/> event. Parents CreateChildControls() logic moved here for processing 
        /// data of input renderer.
        /// </summary>
        /// <param name="e">An <see cref="T:System.EventArgs"/> object that contains the event data.</param>
        protected override void OnPreRender(EventArgs e)
        {
            base.OnPreRender(e);

            if (!string.IsNullOrEmpty(QueryTemplate))
            {
                foreach (var param in HttpContext.Current.Request.Params.AllKeys)
                {
                    if (this.QueryTemplate.Contains("%" + param + "%"))
                    {
                        _hasUrlInput = true;
                        break;
                    }
                }

                foreach (var key in HttpContext.Current.Request.Form.AllKeys)
                {
                    var controlName = string.Empty;
                    if (key.Contains('$'))
                    {
                        controlName = key.Remove(0, key.LastIndexOf('$') + 1); 
                    }
                    if (QueryTemplate.Contains("%" + controlName + "%"))
                    {
                        _hasFormInput = true;
                        break;
                    }
                } 
            }

            Exception controlException = null;

            if (_hasFormInput || HttpContext.Current.Request.QueryString.ToString().Contains(Math.Abs((PortalContext.Current.ContextNodePath + this.ID).GetHashCode()).ToString()) || _hasUrlInput)
            {
                try
                {
                    this.GetQueryFilter();  // initialize query filter to see if query is invalid for empty search
                }
                catch (Exception ex)
                {
                    SnLog.WriteException(ex);
                    controlException = new InvalidContentQueryException(this.QueryTemplate, innerException: ex);
                }

                var errorPanel = this.FindControlRecursive(EmptyQueryErrorPanelID);
                if (errorPanel != null)
                    errorPanel.Visible = _invalidQuery;
                if (_invalidQuery)
                    return;

                Content rootContent = null;

                try
                {
                    rootContent = GetModel() as Content;
                    if (rootContent != null)
                        rootContent.ChildrenDefinition.AllChildren = AllChildren;
                }
                catch (Exception ex)
                {
                    SnLog.WriteException(ex);
                    if (controlException == null)
                        controlException = ex;
                }

                var model = new ParametricSearchViewModel
                                {
                                    State = State,
                                    SearchParameters = _searchParams.Select(searchParam => new SearchParameter {Name = searchParam.Key, Value = searchParam.Value}).
                                        ToArray()
                                };

                try
                {
                    var childCount = 0;
                    if (rootContent != null)
                    {
                        try
                        {
                            childCount = rootContent.Children.Count();
                        }
                        catch (Exception ex)
                        {
                            SnLog.WriteException(ex);
                            if (controlException == null)
                                controlException = ex;
                        }
                    }

                    try
                    {
                        model.Pager = GetPagerModel(childCount, State, string.Empty);
                    }
                    catch (Exception ex)
                    {
                        SnLog.WriteException(ex);
                        if (controlException == null)
                            controlException = ex;

                        // in case of error, set dummy pager model
                        model.Pager = new PagerModel(0, State, string.Empty);
                    }

                    model.Content = rootContent;

                    if (RenderingMode == RenderMode.Xslt)
                    {
                        XmlModelData = model.ToXPathNavigator();
                    }
                    else if (RenderingMode == RenderMode.Ascx || RenderingMode == RenderMode.Native)
                    {
                        if (CanCache && Cacheable && IsInCache)
                            return;

                        var viewPath = RenderingMode == RenderMode.Native
                                           ? "/root/Global/Renderers/ContentCollectionView.ascx"
                                           : SkinManager.Resolve(Renderer);

                        Control presenter = null;

                        try
                        {
                            presenter = Page.LoadControl(viewPath);
                        }
                        catch (Exception ex)
                        {
                            SnLog.WriteException(ex);
                            if (controlException == null)
                                controlException = ex;
                        }

                        if (presenter != null)
                        {
                            var ccView = presenter as ContentCollectionView;
                            if (ccView != null)
                                ccView.Model = model;

                            if (rootContent != null)
                            {
                                var itemlist = presenter.FindControl(ContentListID);
                                if (itemlist != null)
                                {
                                    try
                                    {
                                        ContentQueryPresenterPortlet.DataBindingHelper.SetDataSourceAndBind(itemlist,
                                                                                                                                        rootContent.Children);
                                    }
                                    catch (Exception ex)
                                    {
                                        SnLog.WriteException(ex);
                                        if (controlException == null)
                                            controlException = ex;
                                    }
                                }
                            }

                            var itemPager = presenter.FindControl("ContentListPager");
                            if (itemPager != null)
                            {
                                try
                                {
                                    ContentQueryPresenterPortlet.DataBindingHelper.SetDataSourceAndBind(itemPager,
                                                                                                                                model.Pager.PagerActions);
                                }
                                catch (Exception ex)
                                {
                                    SnLog.WriteException(ex);
                                    if (controlException == null)
                                        controlException = ex;
                                }
                            }

                            Controls.Add(presenter); 
                        }
                    }
                }
                catch (Exception ex)
                {
                    SnLog.WriteException(ex); 
                    if (controlException == null)
                        controlException = ex;
                }
            }

            try
            {
                if (controlException != null)
                    BuildErrorMessage(controlException);
            }
            catch (Exception ex)
            {
                var errorText = SR.GetString(SR.Portlets.ContentCollection.ErrorLoadingContentView, HttpUtility.HtmlEncode(ex.Message));

                this.Controls.Clear();
                this.Controls.Add(new LiteralControl(errorText));
            }

            ChildControlsCreated = true;
        }
        protected override string GetQueryFilter()
        {
            if (_queryFilter == null)
            {
                var templateQuery = ReplaceTemplateWildCards(@"%\w+%", @"%user\.(\w+)%", QueryTemplate);
                
                // if template query is resolved to empty search, and empty search is not allowed, this is an invalid query
                if (string.IsNullOrEmpty(templateQuery) && !this.AllowEmptySearch)
                    _invalidQuery = true;

                var res = String.Format("+({0}) +({1})", QueryFilter, templateQuery);
                _queryFilter = res.Replace("+()", "").Trim();
            }

            return _queryFilter;
        }
        /// <summary>
        /// Replaces the template wild cards.
        /// For example: If template contains %wildcard% and input renderer contains a textbox with 'wildcard' ID then %wildcard%
        /// will changed to Text property of corresponding textbox.
        /// </summary>
        /// <param name="pattern">The pattern which determines changing logic.</param>
        /// <param name="template">The template.</param>
        /// <returns></returns>
        protected virtual string ReplaceTemplateWildCards(string pattern, string userPattern, string template)
        {
            var query = String.Empty;
            _searchParams.Clear();

            if (template != null && pattern != null)
            {
                query = template;

                // Replacing user specific query patterns
                var userInputPattern = new Regex(userPattern);
                User user = null;
                if (userInputPattern.IsMatch(template))
                {
                    user = Context.User.Identity as User;
                }
                if (user != null)
                {
                    foreach (var field in userInputPattern.Matches(template))
                    {
                        var fieldName = field.ToString().Trim('%').Replace("user.", string.Empty);
                        var userFieldValue = user[fieldName].ToString();
                        if (string.IsNullOrEmpty(userFieldValue))
                        {
                            userFieldValue = "*";
                        }
                        query = query.Replace(field.ToString(), userFieldValue.ToLower());
                        // Adding to search parameters list
                        if (!_searchParams.ContainsKey(fieldName))
                        {
                            _searchParams.Add(fieldName, userFieldValue);
                        }
                    }
                }

                // Replacing query patterns
                var inputPattern = new Regex(pattern);
                foreach (var inputParam in inputPattern.Matches(template))
                {
                    var inputParamString = inputParam.ToString();
                    var paramName = inputParamString.Trim('%');
                    var inputValue = HttpContext.Current.Request.Params[paramName];
                    string controlId = (_inputRenderer.ClientID + "_" + paramName).Replace('_', '$');

                    // get field name (search in the query text that is modified during this
                    // loop instead of the original template to avoid finding parameters that
                    // are already replaced)
                    var paramIndex = query.IndexOf(inputParamString);
                    // if not found, skip this parameter
                    if (paramIndex < 0)
                        continue;

                    var colonIndex = query.Substring(0, paramIndex).LastIndexOf(':');
                    var fieldName = String.Empty;
                    // check if the serach param is a field or a text
                    if(colonIndex != -1)
                    {
                        var spaceIndex = query.Substring(0, colonIndex).LastIndexOf(' ');
                        var fieldStartIndex = spaceIndex == -1 ? 0 : spaceIndex + 1;
                        fieldName = query.Substring(fieldStartIndex, colonIndex - fieldStartIndex).Trim('+', '-', '(', ')');
                    }                    

                    // check if param is surrounded with quotation marks
                    var startQuoteIndex = paramIndex - 1;
                    var endQuoteIndex = paramIndex + inputParamString.Length;
                    var surroundingQuotes = query.Length > startQuoteIndex && query.Length > endQuoteIndex && query[startQuoteIndex] == '"' && query[endQuoteIndex] == '"';

                    // if postback occurred or no url parameter is given, then values must come from the controls
                    if (string.IsNullOrEmpty(inputValue) || Page.IsPostBack)
                    {
                        inputValue = Page.Request.Form[controlId];
                    }
                    else
                    {
                        var tbInput = _inputRenderer.FindControl(paramName) as TextBox;
                        if (tbInput != null && !Page.IsPostBack)
                        {
                            tbInput.Text = inputValue;
                        }
                    }

                    // empty query: input value is empty, or consists of '*'-s
                    var emptyQuery = string.IsNullOrEmpty(inputValue) || string.IsNullOrEmpty(inputValue.TrimEnd('*'));
                    if (!emptyQuery)
                    {
                        // substitute input value to parameter if value is not empty

                        // %param% is surrounded with quotes?
                        if (surroundingQuotes)
                        {
                            // _Text:"%param%" -> strip input from qoutes but otherwise leave it as given
                            var vals = inputValue.Replace("\"", "");
                            query = query.Replace(inputParamString, vals);
                        }
                        else
                        {
                            // %param% is not surrounded with quotes
                            if (inputValue.StartsWith("\"") && inputValue.EndsWith("\""))
                            {
                                // if value is between quotes : leave it as given.
                                query = query.Replace(inputParamString, inputValue);
                            }
                            else
                            {
                                // if value is not between quotes : strip quotes, and split input along spaces, add each value as a separate term
                                var vals = inputValue.Replace("\"", "").Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                                var wildcard = ExactSearch ? String.Empty : "*";
                                if (vals.Length > 1)
                                {
                                    // create an expression like: Field:(value1 value2)
                                    var val = "(";
                                    foreach (var s in vals)
                                        val = string.Concat(val, string.Format("{0}{1} ", s, wildcard));
                                    
                                    val = val.Trim() + ")";
                                    if (!string.IsNullOrEmpty(fieldName))
                                        val = string.Format("{0}:{1}", fieldName, val);

                                    var replacePattern = String.Empty;
                                    if (!String.IsNullOrEmpty(fieldName))
                                    {
                                        replacePattern = string.Format("{0}:{1}", fieldName, inputParamString);
                                    }
                                    else
                                    {
                                        replacePattern = string.Format("{0}", inputParamString);
                                    }
                                    query = query.Replace(replacePattern, val);
                                }
                                else
                                {
                                    // only one word: substitue it to inputparam
                                    var val = string.Format("{0}{1}{2}", wildcard, inputValue, wildcard);
                                    query = query.Replace(inputParamString, val);
                                }
                            }
                        }
                    }
                    else
                    {
                        // remove whole expressions from query if input value for this parameter is empty
                        var emptySearchPattern = String.Empty;
                        if (!String.IsNullOrEmpty(fieldName))
                        {
                            emptySearchPattern = String.Format("[^\\s\\(]*:\\S*{0}[^\\s\\)]*", inputParamString);
                        }
                        else
                        {
                            emptySearchPattern = String.Format("[^\\s\\(]*{0}[^\\s\\)]*", inputParamString);
                        }
                        query = new Regex(emptySearchPattern).Replace(query, String.Empty).Replace("  ", " ").Trim();
                    }

                    // Adding to search parameters list
                    if (!_searchParams.ContainsKey(paramName))
                    {
                        if (!string.IsNullOrEmpty(inputValue))
                            _searchParams.Add(paramName, inputValue);
                    }
                }
            }

            return query.Trim();
        }
        /// <summary>
        /// Creates the child controls. Parents logic moved to OnPreRender(). It renders input renderer.
        /// </summary>
        protected override void CreateChildControls()
        {
            if (string.IsNullOrEmpty(InputRenderer)) 
                return;

            try
            {
                _inputRenderer = Page.LoadControl(InputRenderer) as UserControl;
                if (_inputRenderer == null)
                    return;

                _inputRenderer.ID = "inputRenderer";
                Controls.Add(_inputRenderer);
            }
            catch (Exception ex)
            {
                SnLog.WriteException(ex);
                BuildErrorMessage(ex);
            }
        }
    }
}
