using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using System.Xml;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Fields;
using SenseNet.ContentRepository.i18n;
using SenseNet.ContentRepository.Storage;
using SenseNet.ContentRepository.Storage.Security;
using SenseNet.Diagnostics;
using SenseNet.Portal.UI;
using SenseNet.Portal.UI.PortletFramework;
using SenseNet.Search;
using SenseNet.Tools;
using Content = SenseNet.ContentRepository.Content;

namespace SenseNet.Portal.Portlets.ContentCollection
{
    public interface IContentSearchView
    {
        event EventHandler Search;
    }

    public class ContentSearchView : ContentView, IContentSearchView
    {
        #region IContentSearchView Members

#pragma warning disable 0067
        // suppressed because it is not used but the interface declares.
        public event EventHandler Search;
#pragma warning restore 0067

        #endregion
    }

    public class ContentSearchPortlet : ContentCollectionPortlet
    {
        public string PresenterClientId
        { get; private set; }
        public enum EmptyQueryTermHandler
        {
            Nothing,
            ReplaceToWildcard,
            RemoveEmpty
        }
        private const string ResourceClassName = "ContentSearchPortlet";
        private const string SearchBtnId = "SearchBtn";
        protected ContentView SearchForm;

        private ContentSearchPortletState _state;

        public ContentSearchPortlet()
        {
            Name = string.Format("${0}:PortletTitle", ResourceClassName);
            Description = string.Format("${0}:PortletDescription", ResourceClassName);
            Category = new PortletCategory(PortletCategoryType.Search);
        }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ResourceClassName, "SearchFormCtdTitle"),
         LocalizedWebDescription(ResourceClassName, "SearchFormCtdDescription")]
        [WebCategory(EditorCategory.Search, EditorCategory.Search_Order), WebOrder(1000)]
        [Editor(typeof (ContentPickerEditorPartField), typeof (IEditorPartField)),
         ContentPickerEditorPartOptions(DefaultPath = "/Root/System/Schema/ContentTypes/GenericContent/ContentSearch", TreeRoots = "/Root/System/Schema/ContentTypes", AllowedContentTypes = "ContentType")]
        public virtual string SearchFormCtd { get; set; }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ResourceClassName, "SearchFormRendererTitle"),
         LocalizedWebDescription(ResourceClassName, "SearchFormRendererDescription")]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [WebOrder(1100)]
        [Editor(typeof (ViewPickerEditorPartField), typeof (IEditorPartField)),
         ContentPickerEditorPartOptions(ContentPickerCommonType.Ascx)]
        public virtual string SearchFormRenderer { get; set; }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ResourceClassName, "PluginFullPathTitle"),
         LocalizedWebDescription(ResourceClassName, "PluginFullPathDescription")]
        [WebCategory(EditorCategory.Search, EditorCategory.Search_Order), WebOrder(3000)]
        public virtual string PluginFullPath { get; set; }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ResourceClassName, "EmptyQueryTermHandlerTitle"),
         LocalizedWebDescription(ResourceClassName, "EmptyQueryTermHandlerDescription")]
        [WebCategory(EditorCategory.Search, EditorCategory.Search_Order), WebOrder(4000)]
        public virtual EmptyQueryTermHandler EmptyQueryTerm { get; set; }

        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(ResourceClassName, "RunSearchWithDefaultContentTitle"),
         LocalizedWebDescription(ResourceClassName, "RunSearchWithDefaultContentDescription")]
        [WebCategory(EditorCategory.Search, EditorCategory.Search_Order), WebOrder(5000)]
        public virtual bool RunWithDefault { get; set; }

        private bool EnableResultRendering
        {
            get { return RunWithDefault || HttpContext.Current.Request.Params.AllKeys.Any(k => k.StartsWith(State.PortletHash)); }
        }

        public override ContentCollectionPortletState State
        {
            get
            {
                if (_state == null)
                {
                    PortletState state;
                    if (StateRestoreIsNeeded() && PortletState.Restore(this, out state))
                    {
                        _state = state as ContentSearchPortletState;
                    }
                    else
                    {
                        _state = new ContentSearchPortletState(this) {Portlet = this};
                    }
                    _state.CollectValues();
                    HttpContext.Current.Session[_state.Portlet.ID] = _state;
                }
                return _state;
            }
        }

        protected virtual string GetValueFromRequest(string paramName)
        {
            if (!HttpContext.Current.Request.Params.AllKeys.Contains(paramName, new CaseInsensitiveEqualityComparer()))
                return string.Empty;
            var svalue = HttpContext.Current.Request.Params[paramName];

            return svalue;
        }

        protected virtual void BuildSearchForm()
        {
            if (string.IsNullOrEmpty(SearchFormCtd))
                return;
            var nt = (from t in ActiveSchema.NodeTypes
                      where t.NodeTypePath.Equals(SearchFormCtd.Remove(0, 33))
                      select t).FirstOrDefault();
            if (nt == null) return;

            var parent = SystemAccount.Execute(() => Repository.SystemFolder);
            var c = Content.CreateNew(nt.Name, parent, null);
                
            var s = State;

            if (_state != null && !string.IsNullOrWhiteSpace(_state.ExportQueryFields))
            {
                var xmlDoc = new XmlDocument();
                xmlDoc.LoadXml(_state.ExportQueryFields);
                XmlNodeList allFields = xmlDoc.SelectNodes("/ContentMetaData/Fields/*");

                // do this in elevated mode to avoid errors related to non-writable fields, like CreationDate
                using (new SystemAccount())
                {
                    var transferringContext = new ImportContext(allFields, "", c.Id == 0, true, false);
                    // import flat properties
                    c.ImportFieldData(transferringContext, false);
                    // update references
                    transferringContext.UpdateReferences = true;
                    c.ImportFieldData(transferringContext, false); 
                }
            }

            // override content filed from url parameters
            foreach (KeyValuePair<string, Field> keyValuePair in c.Fields)
            {
                var portletSpecKey = GetPortletSpecificParamName(keyValuePair.Key);
                var requestValue = GetValueFromRequest(portletSpecKey);
                
                if (!string.IsNullOrEmpty(requestValue) && c.Fields.ContainsKey(keyValuePair.Key))
                        c.Fields[keyValuePair.Key].Parse(requestValue);
            }

            var cv = string.IsNullOrEmpty(SearchFormRenderer)
                         ? ContentView.Create(c, this.Page, ViewMode.InlineNew)
                         : ContentView.Create(c, this.Page, ViewMode.InlineNew, SearchFormRenderer);

            // Attach search event
            var iCsView = cv as IContentSearchView;
            if (iCsView != null)
            {
                iCsView.Search += new EventHandler(ContentSearchView_Search_OnClick);
            }
            else
            {
                var btn = cv.FindControl(SearchBtnId) as Button;
                if (btn == null)
                {
                    btn = new Button {ID = SearchBtnId, Text = SenseNetResourceManager.Current.GetString(ResourceClassName, "SearchBtnText"), CssClass = "sn-submit"};
                    cv.Controls.Add(btn);
                }
                btn.Click += new EventHandler(ContentSearchView_Search_OnClick);
            }
            SearchForm = cv;
        }

        protected virtual void ContentSearchView_Search_OnClick(object sender, EventArgs e)
        {
            // Set pager to 1st page
            _state.Skip = _state.SkipFirst;
            PortletState.Persist(_state);
        }

        protected override string GetQueryFilter()
        {
            var originalQueryFilter = base.GetQueryFilter();
            if (SearchForm == null)
                return originalQueryFilter;

            SearchForm.UpdateContent();

            DefaultQueryBuilder qBuilder;
            if (string.IsNullOrEmpty(PluginFullPath))
                qBuilder = new DefaultQueryBuilder(originalQueryFilter, SearchForm.Content, EmptyQueryTerm);
            else
                qBuilder = TypeResolver.CreateInstance(PluginFullPath, new object[] {originalQueryFilter, SearchForm.Content}) as DefaultQueryBuilder;

            var filter = qBuilder.BuildQuery(/*kv*/);

            var sb = new StringBuilder();
            var writer = XmlWriter.Create(sb);

            writer.WriteStartDocument();
            writer.WriteStartElement("ContentMetaData");
            writer.WriteElementString("ContentType", SearchForm.Content.ContentType.Name);
            writer.WriteElementString("ContentName", SearchForm.Content.Name);
            writer.WriteStartElement("Fields");

            SearchForm.Content.ExportFieldData(writer, new ExportContext("/Root", ""));

            writer.WriteEndElement();
            writer.WriteEndElement();
            writer.Flush();
            writer.Close();

            _state.ExportQueryFields = sb.ToString();
            PortletState.Persist(_state);

            return filter;
        }

        protected override void OnLoad(EventArgs e)
        {
            try
            {
                BuildSearchForm();

                if (SearchForm != null)
                    this.Controls.Add(SearchForm);
            }
            catch (Exception ex)
            {
                SnLog.WriteException(ex);
                BuildErrorMessage(ex);
            }

            base.OnLoad(e);
        }

        protected virtual void BuildResultView()
        {
            Content rootContent = null;
            Exception controlException = null;

            try
            {
                // Elevation: it should be possible to search for content
                // under a folder where the user does not have explicit
                // permissions but on one of the child content may have.
                using (new SystemAccount())
                {
                    rootContent = GetModel() as Content; 
                }

                if (rootContent != null) 
                    rootContent.ChildrenDefinition.AllChildren = AllChildren;
            }
            catch (Exception ex)
            {
                SnLog.WriteException(ex);
                controlException = ex;
            }

            var model = new ContentCollectionViewModel {State = this.State};

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
                model.Content = rootContent;
            }
            catch (Exception ex)
            {
                SnLog.WriteException(ex);
                if (controlException == null)
                    controlException = ex;

                // in case of error, set dummy pager model
                model.Pager = new PagerModel(0, State, string.Empty);
            }
            
            try
            {
                if (RenderingMode == RenderMode.Xslt)
                {
                    XmlModelData = model.ToXPathNavigator();
                }
                else
                {
                    // the Renderer property may contain a skin-relative path
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
                        Controls.Add(presenter);
                        PresenterClientId = presenter.ClientID;

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
                                                                                                        rootContent.
                                                                                                            Children);
                                }
                                catch (Exception ex)
                                {
                                    SnLog.WriteException(ex);
                                    if (controlException == null)
                                        controlException = ex;
                                }
                            }
                            itemlist = presenter.FindControl("ViewDatasource");
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
                    }
                }
            }
            catch(Exception ex)
            {
                SnLog.WriteException(ex);
                if (controlException == null)
                    controlException = ex;
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
        }

        protected override void RenderWithXslt(HtmlTextWriter writer)
        {
            try
            {
                RenderContents(writer);

                if (this.Page.IsPostBack || EnableResultRendering)
                    base.RenderWithXslt(writer);
            }
            catch (Exception ex)
            {
                SnLog.WriteException(ex);
                BuildErrorMessage(ex);
            }
        }

        protected override void OnPreRender(EventArgs e)
        {
            try
            {
                if (this.Page.IsPostBack || EnableResultRendering)
                    BuildResultView();
            }
            catch (Exception ex)
            {
                SnLog.WriteException(ex);
                BuildErrorMessage(ex);
            }

            base.OnPreRender(e);
        }

        protected override void CreateChildControls()
        {
            ChildControlsCreated = true;
        }

        protected virtual bool StateRestoreIsNeeded()
        {
            // Restoring the state is not always needed. For example we do not
            // want to fill the search controls if we left the page before and returned.
            var skipParamName = GetPortletSpecificParamName("Skip");
            var sortParamName = GetPortletSpecificParamName("SortColumn");

            // we need to restore the state from the session if this is a postback or these 
            // parameters exist (because the user pressed one of the paging or sorting links)
            return HttpContext.Current.Request.Params.AllKeys.Contains(skipParamName) ||
                   HttpContext.Current.Request.Params.AllKeys.Contains(sortParamName) ||
                   Page.IsPostBack;
        }
    }

    public class DefaultQueryBuilder
    {
        protected string _originalQuery;
        protected Content _searchForm;
        protected ContentSearchPortlet.EmptyQueryTermHandler _emptyTermHandler;
        
        public DefaultQueryBuilder(string originalQuery, Content searchForm,ContentSearchPortlet.EmptyQueryTermHandler emptyTerm)
        {
            _originalQuery = originalQuery;
            _searchForm = searchForm;
            _emptyTermHandler = emptyTerm;
        }

        public virtual string BuildQuery(/*Dictionary<string, object> fieldValues*/)
        {
            var qf = _originalQuery;
            var matches = Regex.Matches(qf, @"%\w+%");
            
            foreach (Match match in matches)
            {
                string fieldValue;
                var fieldName = GetFieldValue(match, out fieldValue);
                qf = Replace(qf, match, fieldValue);
            }
           

            return qf;
        }

        protected virtual string Replace(string queryFilter, Match actualMatch, string fieldValue)
        {
            return queryFilter.Replace(actualMatch.Value, fieldValue);
        }

        protected virtual string GetFieldValue(Match match, out string fieldValue)
        {
            var fieldName = match.Value.Trim('%');
            fieldValue = string.Empty;
            var values = _searchForm.Fields[fieldName].FieldSetting.GetValueForQuery(_searchForm.Fields[fieldName]);

            if (values != null)
            {
                if (values.Count() == 1)
                    fieldValue = values.First();
                if (values.Count() > 1)
                    fieldValue = ConvertFieldValuesToTerm(fieldName, values);
            }
            if (string.IsNullOrEmpty(fieldValue))
                fieldValue = SetEmptyFieldValue(_emptyTermHandler, _searchForm.Fields[fieldName]);
            
            return fieldName;
        }

        protected virtual string ConvertFieldValuesToTerm(string filedName, IEnumerable<string> values)
        {
            var defaultOperators = "OR";
            var operatorFieldName = string.Format("{0}ValueOperatorType", filedName);
            var operatorFiled = _searchForm.Fields.Where(f => f.Key.Equals(operatorFieldName, StringComparison.InvariantCultureIgnoreCase)).Select(f=>f.Value).FirstOrDefault();
            if(operatorFiled != null)
            {
                var value = operatorFiled.GetData();
                var list = value as List<string>;
                if(list!=null && list.Count>0)
                    defaultOperators = list[0];
                else
                    defaultOperators = value.ToString();
            }

            var sb = new StringBuilder();
            sb.Append("(");

            foreach (string s in values)
            {
                if (sb.Length>1)
                    sb.Append(" ").Append(defaultOperators).Append(" ");
                sb.Append(s);
                
            }
            sb.Append(")");
            return sb.ToString();
        }

        protected virtual string SetEmptyFieldValue(ContentSearchPortlet.EmptyQueryTermHandler mode, Field field)
        {
            if (mode == ContentSearchPortlet.EmptyQueryTermHandler.ReplaceToWildcard)
            {
                if(field is DateTimeField)
                    return string.Format("{{{0} TO {1}}}", DateTime.MinValue, DateTime.MaxValue);
                if(field is IntegerField)
                    return string.Format("{{{0} TO {1}}}", int.MinValue, int.MaxValue);
                return "*";
            }

            if (mode == ContentSearchPortlet.EmptyQueryTermHandler.RemoveEmpty)
                return ContentQuery.EmptyText;

            return string.Empty;
        }
    }
}
