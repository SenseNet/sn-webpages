using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Web.UI;
using System.Web.Script.Serialization;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Schema;
using System.Web.UI.WebControls;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;

namespace SenseNet.Portal.UI.Controls
{
    public class AllowedChildTypes : FieldControl
    {

        [DataContract]
        private class ContentTypeItem
        {
            [DataMember]
            public string label { get; set; }
            [DataMember]
            public string value { get; set; }
            [DataMember]
            public string path { get; set; }
            [DataMember]
            public string icon { get; set; }
        }


        /* ========================================================================================= Members */
        private IEnumerable<ContentType> _contentTypes;


        /* ========================================================================================= Properties */
        private const string INNERDATAID = "InnerData";
        private const string INHERITPLACEHOLDER = "InheritFromContentType";
        private TextBox InnerControl
        {
            get
            {
                return this.FindControlRecursive(INNERDATAID) as TextBox;
            }
        }

        private Label InheritingPlaceHolder
        {
            get
            {
                return this.FindControlRecursive(INHERITPLACEHOLDER) as Label;
            }
        }

        private const string CONTAINERID = "AutoCompleteData";
        private TextBox AutoCompleteData
        {
            get
            {
                return this.FindControlRecursive(CONTAINERID) as TextBox;
            }
        }

        private List<string> CTDContentTypeNames
        {
            get
            {
                return this.Content.ContentType.AllowedChildTypeNames.ToList();
            }
        }

        private List<ContentType> CTDContentTypes
        {
            get
            {
                return this.Content.ContentType.AllowedChildTypes.ToList();
            }
        }

        public bool ReadOnlyMode
        {
            get
            {
                return this.ReadOnly || this.Field.ReadOnly || this.ControlMode == FieldControlControlMode.Browse;
            }
        }

        private bool? _isNewSkin;
        protected bool IsNewSkin
        {
            get
            {
                if (!_isNewSkin.HasValue)
                    _isNewSkin = SkinManager.IsNewSkin();

                return _isNewSkin.Value;
            }
        }

        /* ========================================================================================= Methods */
        protected override void OnInit(EventArgs e)
        {
            base.OnInit(e);
            if (!IsNewSkin)
            {
                UITools.AddScript("$skin/scripts/sn/SN.AllowedChildTypes.js");
                UITools.AddStyleSheetToHeader(UITools.GetHeader(), "$skin/styles/icons.css");
            }
        }
        protected override void OnPreRender(EventArgs e)
        {

            if (!this.ReadOnlyMode && !UseBrowseTemplate)
            {
                string jsonData;

                using (var s = new MemoryStream())
                {
                    var workData = ContentType.GetContentTypes()
                        .Select(n => ContentRepository.Content.Create(n))
                        .Select(n => new ContentTypeItem { value = n.Name, label = n.DisplayName, path = n.Path, icon = n.Icon })
                        .OrderBy(n => n.label);

                    var serializer = new DataContractJsonSerializer(typeof(ContentTypeItem[]));
                    serializer.WriteObject(s, workData.ToArray());
                    s.Flush();
                    s.Position = 0;
                    using (var sr = new StreamReader(s))
                    {
                        jsonData = sr.ReadToEnd();
                    }
                }

                // init control happens in prerender to handle postbacks (eg. pressing 'inherit from ctd' button)
                var contentTypes = _contentTypes ?? GetContentTypesFromControl();
                if (!IsNewSkin)
                {
                    InitControl(contentTypes);
                    var inherit = contentTypes == null || contentTypes.Count() == 0 ? 0 : 1;
                    UITools.RegisterStartupScript("initdropboxautocomplete", string.Format("SN.ACT.init({0},{1})", jsonData, inherit), this.Page);
                }
                else
                {
                    var inheritingPlaceholder = this.InheritingPlaceHolder;
                    if (inheritingPlaceholder != null)
                    {
                        var inherit = contentTypes == null || contentTypes.Count() == 0 ? true : false;
                        inheritingPlaceholder.Text = inherit.ToString().ToLower();
                    }
                }
            }

            base.OnPreRender(e);
        }
        public override object GetData()
        {
            _contentTypes = GetContentTypesFromControl();
            return _contentTypes;
        }
        public override void SetData(object data)
        {
            var contentTypes = data as IEnumerable<ContentType>;
            InitControl(contentTypes);
        }
        private void InitControl(IEnumerable<ContentType> contentTypes)
        {

            var editControl = this.InnerControl;
            var browseControl = GetInnerControl() as Label;


            // if empty, set types defined on CTD
            string contentTypeNames;
            if (!IsNewSkin)
            {
                if (contentTypes == null || contentTypes.Count() == 0)
                {
                    contentTypeNames = string.Join(" ", CTDContentTypeNames.OrderBy(t => t));
                }
                else
                {
                    contentTypeNames = string.Join(" ", contentTypes.Select(t => t.Name).OrderBy(t => t));
                }

                if (editControl != null)
                    editControl.Text = contentTypeNames;


                if (browseControl != null)
                    browseControl.Text = contentTypeNames;
            }
            else
            {
                var js = new JavaScriptSerializer();
                string contentTypeList;

                if (contentTypes == null || contentTypes.Count() == 0)
                {
                    var list = CTDContentTypes
                         .Select(c => SenseNet.ContentRepository.Content.Create(c))
                             .Select(i => new { i.DisplayName, i.Icon, i.Path, i.Name })
                         .Distinct()
                         .OrderByDescending(i => i.Name);

                    contentTypeList = js.Serialize(list);
                }
                else {
                    var list = contentTypes
                       .Select(c => SenseNet.ContentRepository.Content.Create(c))
                            .Select(i => new { i.DisplayName, i.Icon, i.Path, i.Name })
                       .Distinct()
                       .OrderByDescending(i => i.Name);
                    contentTypeList = js.Serialize(list);
                }


                if (editControl != null)
                    editControl.Text = contentTypeList.ToString();


                if (browseControl != null)
                    browseControl.Text = contentTypeList;


            }

        }

        private IEnumerable<ContentType> GetContentTypesFromControl()
        {
            var control = this.InnerControl;
            if (control == null)
                return null;

            string[] contentTypeNames = null;

            if (!IsNewSkin)
            {
                contentTypeNames = control.Text.Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries).ToArray();
            }
            else
            {
                var jsonArray = JsonConvert.DeserializeObject(control.Text) as JArray;

                if (jsonArray != null)
                {
                    contentTypeNames = jsonArray.Select(ct => ct["Name"].Value<string>()).ToArray();
                }
            }
            // check if list is the same as defined in CTD
            var ctdContentTypeNames = this.CTDContentTypeNames;

            if (contentTypeNames.Length == ctdContentTypeNames.Count)
            {
                var equal = string.Join(" ", contentTypeNames.OrderBy(t => t)) == string.Join(" ", ctdContentTypeNames.OrderBy(t => t));
                if (equal)
                {
                    return null;
                }
            }

            var contentTypes = contentTypeNames.Select(name => ContentType.GetByName(name));
            return contentTypes;
        }

        public Control GetInnerControl() { return this.FindControlRecursive(InnerControlID); }
    }
}
