using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Web.UI;
using System.Web.UI.WebControls;
using SenseNet.ContentRepository;
using System.Drawing;
using System.Web;
using SenseNet.Portal.UI.Controls;
using SenseNet.Search;

[assembly: WebResource(TagList.ClientResourceName, "application/x-javascript")]
namespace SenseNet.Portal.UI.Controls
{
    /// <summary>
    /// <c>TagList</c> is a class responsible for displaying tags of a <see cref="SenseNet.ContentRepository.Content ">Content</see> in various ways.
    /// - In browse mode the tags are displayed as simple links to she search page.
    /// - In Edit mode, there are three options:
    ///     - Content is not taggable, normal user or guest: like browse mode, because no more tags can be added.
    ///     - Content is taggable, normal user or guest: the links above, plus an input box for adding new tags to the content.
    ///     - Administrator: normal multiline textbox for input and displaying tags. No links are generated in this mode.
    /// - Only in admin mode, tags can be removed from contents.
    /// </summary>

    [DefaultProperty("Text")]
    [ToolboxData("<{0}:TagList runat=server></{0}:TagList>")]
    public class TagList : FieldControl, IScriptControl
    {
        public const string ClientResourceName = "SenseNet.WebPages.UI.Controls.TagList.js";

        private readonly TagCollection _taglist;
        private readonly TextBox _tbTagList;
        private readonly Label _errorLabel;
        private readonly Button _btnAddTag;
        private string _searchPath;
        private string _searchFilterName;
        private readonly bool _adminMode;
        private bool _taggable;
        private char[] _notAllowedChars = { '&', '\\', '/', '?' };
        private char[] _splitChars = { ',' };
        private readonly List<string> _bannedTagsList = new List<string>();
        private string _tagListString;

        [PersistenceMode(PersistenceMode.Attribute)]
        public string ListId { get; set; }

        [PersistenceMode(PersistenceMode.Attribute)]
        public string BtnId { get; set; }

        [PersistenceMode(PersistenceMode.Attribute)]
        public string ContentId { get; set; }


        #region Properties
        /// <summary>
        /// Gets or sets path for the search application
        /// </summary>
        public string SearchPath
        {
            get { return _searchPath; }

            set
            {
                if (!string.IsNullOrEmpty(value))
                {
                    _searchPath = value;
                }
            }
        }
        /// <summary>
        /// Gets or sets the filter parameter name in the generated request url
        /// </summary>
        public string SearchFilterName
        {
            get { return _searchFilterName; }

            set
            {
                if (!string.IsNullOrEmpty(value))
                {
                    _searchFilterName = value;
                }
            }
        }
        /// <summary>
        /// Gets or sets the separator chacarters in the tag list field when parsing
        /// </summary>
        public string TagSplitChars
        {
            set
            {
                if (!string.IsNullOrEmpty(value))
                {
                    _splitChars = value.ToCharArray();
                }
            }
        }
        /// <summary>
        /// The list of not allowed characters. These will be removed from newly added tags.
        /// </summary>
        public string NotAllowedChars
        {
            set
            {
                if (!string.IsNullOrEmpty(value))
                {
                    _notAllowedChars = value.ToCharArray();
                }
            }
        }

        public string SearchFilter { get; set; }


        #endregion

        /// <summary>
        /// Constructor of taglist.
        /// </summary>
        public TagList()
        {
            InnerControlID = "InnerTagListBox";

            _adminMode = User.Current.IsInGroup(Group.Administrators);

            _tbTagList = new TextBox { ID = InnerControlID };
            _errorLabel = new Label { ID = "InnerErrorLabel" };
            _btnAddTag = new Button { ID = "btnAddTag", Text = SNSR.GetString(SR.FieldControls.TagList_AddTag), OnClientClick = "return false;" };
            _taglist = new TagCollection();
            _searchPath = "";
            _searchFilterName = "TagFilter";
        }

        #region FieldControl overrides
        /// <summary>
        /// Overrided for proper saving method:
        /// - Blacklist checking + error indication
        /// - New and old tag population and merging
        /// - Handling admin and normal user mode
        /// </summary>
        /// <returns>String for a longtext field (Tags) wich can be stored in the usual way on the content.</returns>
        public override object GetData()
        {
            _bannedTagsList.Clear();
            ClearWarning();
            _tagListString = string.Empty;
            var newTags = _tbTagList.Text.Trim(_splitChars).Split(_splitChars).ToList();
            newTags.RemoveAll(i=>string.IsNullOrEmpty(i));

            var oldTags = new List<string>();
            if (!_adminMode)
            {
                foreach (var tag in _taglist)
                {
                    if (!IsBlacklisted(tag.Name))
                    {
                        _tagListString += tag.Name + _splitChars[0];
                        if (!oldTags.Contains(tag.Name))
                        {
                            oldTags.Add(tag.Name);
                        }
                    }
                    else
                    {
                        _bannedTagsList.Add(tag.Name);
                    }
                }
            }
            foreach (var tag in newTags)
            {
                if (!oldTags.Contains(tag) && !IsBlacklisted(tag))
                {
                    _tagListString += tag + _splitChars[0];
                }
                else if (IsBlacklisted(tag))
                {
                    _bannedTagsList.Add(tag);
                }
            }

            _taglist.Clear();
            _tbTagList.Text = string.Empty;
            if (_bannedTagsList.Count > 0)
            {
                var msgbody = "\n";
                var msgEnd = SNSR.GetString(SR.FieldControls.TagList_BlacklistedTag);
                if (_bannedTagsList.Count > 1)
                {
                    msgEnd = SNSR.GetString(SR.FieldControls.TagList_BlacklistedTags);
                }
                foreach (var tag in _bannedTagsList)
                {
                    msgbody += tag + ", ";
                }
                DisplayWarning(msgbody.TrimEnd(' ', ',') + msgEnd);
                _bannedTagsList.Clear();
            }
            SetTagList(_tagListString.Split(_splitChars));
            return _tagListString.ToLower();
        }
        /// <summary>
        /// Overrided for proper load method:
        /// - The stored data (string) from the longtext field (Tags) is converted to list of tags.
        /// - Extracts the value of IsTaggable field from the content to determine proper way display.
        /// </summary>
        /// <param name="data"></param>
        public override void SetData(object data)
        {
            var rawData = data as string;

            _taggable = Convert.ToBoolean(Content["IsTaggable"]);

            _taglist.Clear();

            if (!string.IsNullOrEmpty(rawData))
            {
                string[] tagsList = rawData.Split(_splitChars);

                SetTagList(tagsList);
            }
        }
        /// <summary>
        /// Overrided for rendering custom web controls inside the field control.
        /// </summary>
        /// <param name="output">HtmlTextWriter</param>
        protected override void RenderContents(HtmlTextWriter output)
        {
            if (ControlMode == FieldControlControlMode.Browse)
            {
                RenderBrowse(output);
            }
            else
            {
                if (!_adminMode)
                {
                    RenderBrowse(output);

                    // puts the editable textbox control into a DIV
                    if (_taggable)
                    {
                        output.RenderBeginTag("div class=\"sn-tags-container\"");
                        _tbTagList.RenderControl(output);
                        _btnAddTag.RenderControl(output);
                        _errorLabel.RenderControl(output);
                        output.RenderEndTag();
                    }
                }
                else
                {
                    output.RenderBeginTag("div class=\"sn-tags-container\"");
                    _tbTagList.TextMode = TextBoxMode.MultiLine;
                    foreach (var tag in _taglist)
                    {
                        _tbTagList.Text += tag.Name + _splitChars[0];
                    }
                    _tbTagList.Text = _tbTagList.Text.Trim(_splitChars);
                    _tbTagList.RenderControl(output);
                    _errorLabel.RenderControl(output);
                    output.RenderEndTag();
                }
            }
        }

        protected override void OnPreRender(EventArgs e)
        {
            if (!this.DesignMode)
                ScriptManager.GetCurrent(Page)?.RegisterScriptControl(this);

            base.OnPreRender(e);
        }

        protected override void Render(HtmlTextWriter writer)
        {
            if (!this.DesignMode)
                ScriptManager.GetCurrent(Page)?.RegisterScriptDescriptors(this);

            base.Render(writer);
        }

        /// <summary>
        /// Overrided for basic settings on initialization.
        /// - textbox width, etc.
        /// </summary>
        /// <param name="e">EventArgs</param>
        protected override void OnInit(EventArgs e)
        {
            base.OnInit(e);

            // include jQuery for javascript
            UITools.AddScript(UITools.ClientScriptConfigurations.jQueryPath);
            UITools.AddStyleSheetToHeader(UITools.GetHeader(), "$skin/styles/SN.Tagging.css");

            if (ControlMode == FieldControlControlMode.Browse)
            {
                _tbTagList.Width = 200;
                _tbTagList.Visible = true;
                _tbTagList.Text = string.Empty;

                _tbTagList.CssClass = string.IsNullOrEmpty(CssClass) ?
                    "sn-tags-input sn-ctrl IUTagList" : CssClass;
            }

            Controls.Add(_tbTagList);
            Controls.Add(_errorLabel);
            Controls.Add(_btnAddTag);
        }

        #endregion

        #region private functions
        /// <summary>
        /// Creates a link from the given TagElement.
        /// </summary>
        /// <param name="tag">TagElement</param>
        /// <returns>The generated link</returns>
        private string CreateHyperlink(TagElement tag)
        {
            string hyperlink;
            if (string.IsNullOrEmpty(SearchPath))
            {
                hyperlink = string.Format("<a href=?Action=SearchTag&amp;TagFilter={1}>{0}</a>", tag.Name, HttpUtility.UrlEncode(tag.Name));
            }
            else
            {
                hyperlink = string.Format("<a href={0}?TagFilter={1}>{1}</a>", SearchPath, HttpUtility.UrlEncode(tag.Name));    
            }
            
            return hyperlink;
        }

        /// <summary>
        /// Displays the list of tags as HyperLinks without a textbox for adding new tags.
        /// </summary>
        /// <param name="output">HtmlTextWriter</param>
        private void RenderBrowse(HtmlTextWriter output)
        {
            output.RenderBeginTag("div class=\"sn-tags-container\"");

            output.RenderBeginTag("ul class=\"sn-tags-list\"");
            foreach (var tag in _taglist)
            {
                output.Write("<li>{0}", CreateHyperlink(tag));
            }
            output.RenderEndTag();
            output.RenderEndTag();
        }
        /// <summary>
        /// Determines if the given tag is blacklisted or not.
        /// - Uses ContentQuery for fast searching
        /// </summary>
        /// <param name="tag">Tag to check</param>
        /// <returns>True if the tag is on blacklist, false if it isn't.</returns>
        private static bool IsBlacklisted(string tag)
        {
            var result = ContentQuery.Query("+TypePath:genericcontent/tag +IsBlacklisted:true +DisplayName:" + tag.ToLower());
            return result.Count > 0;
        }
        /// <summary>
        /// Initializes the TagElement list from the given string array
        /// </summary>
        /// <param name="tagsList">Array of parsed tags (words)</param>
        private void SetTagList(string[] tagsList)
        {
            for (int i = 0; i < tagsList.Length; i++)
            {
                tagsList[i] = tagsList[i].Trim(_notAllowedChars);

                if (!string.IsNullOrEmpty(tagsList[i]))
                {
                    var newTagElement = new TagElement(tagsList[i], _searchPath);

                    if (!_bannedTagsList.Contains(tagsList[i]) && !_taglist.Contains(newTagElement))
                    {
                        _taglist.Add(newTagElement);
                    }
                }
            }
        }
        /// <summary>
        /// Displays a warning stripe with the given text. Used when the user wants to use a blacklisted tag on the content.
        /// </summary>
        /// <param name="message">Warning text to display</param>
        private void DisplayWarning(string message)
        {
            _errorLabel.BackColor = Color.Red;
            _errorLabel.ForeColor = Color.White;
            _errorLabel.Font.Bold = true;
            _errorLabel.Text = message;
            _errorLabel.Visible = true;
        }
        /// <summary>
        /// Clears the warning if displayed any.
        /// </summary>
        private void ClearWarning()
        {
            _errorLabel.Visible = false;
            _errorLabel.Text = string.Empty;
        }
        #endregion
        
        #region IScriptControl Members

        public IEnumerable<ScriptReference> GetScriptReferences()
        {
            var reference = new ScriptReference
            {
                Path = this.Page.ClientScript.GetWebResourceUrl(this.GetType(), ClientResourceName)
            };

            return new[] { reference };
        }

        public IEnumerable<ScriptDescriptor> GetScriptDescriptors()
        {
            if (string.IsNullOrEmpty(_tbTagList.ClientID))
                return null;

            var scriptDescriptor = new ScriptControlDescriptor(typeof (TagList).FullName, _tbTagList.ClientID);

            scriptDescriptor.AddProperty("ContentId", this.Content.Id);
            scriptDescriptor.AddProperty("ListId", this._tbTagList.ID);
            scriptDescriptor.AddProperty("BtnId", this._btnAddTag.ID);

            return new ScriptDescriptor[] {scriptDescriptor};
        }

        #endregion
    }

    /// <summary>
    /// <c>TagElement</c> is a class for storing a single tag to be displayed by the control. It stores the search link url-s as well.
    /// </summary>
    public class TagElement
    {
        public TagElement()
        {
            Name = "";
            URL = "";
        }

        public TagElement(string name, string url)
        {
            Name = name;
            URL = url;
        }

        public string Name { get; }

        public string URL { get; }
    }
    /// <summary>
    /// List for Tags
    /// </summary>
    public class TagCollection : List<TagElement>
    {
    }
}
