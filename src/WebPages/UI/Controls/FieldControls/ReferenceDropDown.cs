using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.UI.WebControls;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Fields;
using SenseNet.ContentRepository.Schema;
using SenseNet.ContentRepository.Storage;
using SenseNet.Search;

namespace SenseNet.Portal.UI.Controls
{
    public class ReferenceDropDown : DropDown
    {
        private List<ChoiceOption> _options;
        protected virtual List<ChoiceOption> Options
        {
            get
            {
                if (_options == null)
                {
                    var referenceField = this.Field as ReferenceField;
                    if (referenceField == null)
                        throw new InvalidCastException("ReferenceDropDown has to be used with a reference field.");

                    var setting = (ReferenceFieldSetting)this.Field.FieldSetting;
                    var queryParams = new List<object>();
                    var typeCount = 0;
                    var pathCount = 0;
                    if (setting.AllowedTypes != null)
                        typeCount = Math.Max(setting.AllowedTypes.Count, 1);
                    if(setting.SelectionRoots != null)
                        pathCount = Math.Max(setting.SelectionRoots.Count, 1);
                    
                    // add possible type parameters
                    if (typeCount == 0){
                        queryParams.Add("GenericContent");
                        typeCount = 1;
                    }
                    else
                        queryParams.AddRange(setting.AllowedTypes);


                    // add possible subtree parameters
                    if (setting.SelectionRoots == null || setting.SelectionRoots.Count == 0)
                    {
                        queryParams.Add(Repository.RootPath);
                        pathCount = 1;
                    }
                    else
                        queryParams.AddRange(setting.SelectionRoots);


                    var queryText = string.Format("+TypeIs:({0}) +InTree:({1}) .AUTOFILTERS:OFF .TOP:300 .SORT:DisplayName", 
                        string.Join(" ", Enumerable.Range(0, typeCount).Select(i1 => "@" + i1.ToString())),
                        string.Join(" ", Enumerable.Range(typeCount, pathCount).Select(i2 => "@" + i2.ToString())));

                    var optionNodes = ContentQuery.Query(queryText, null, queryParams.ToArray()).Nodes;

                    _options = optionNodes.Select(n => new ChoiceOption(n.Id.ToString(), n["DisplayName"].ToString())).ToList();
                }

                return _options;
            }
        }

        public override object GetData()
        {
            var selectedOptions = base.GetData() as IList<string> ?? new List<string>();
            var selectedNodes = Node.LoadNodes(selectedOptions.Select(o => int.Parse(o)));

            //TODO: return only nodes that were actually available in the dropdown, to prevent hacking
            return selectedNodes.Where(n => n != null).ToList();
        }

        public override void SetData(object data)
        {
            // synchronize data with controls that are given in the template
            SetTitleAndDescription();
            
            if (data == null) 
                return;
            
            var selectedItems = new List<string>();

            var dataNode = data as Node;
            if (dataNode != null)
                selectedItems.Add(dataNode.Id.ToString());

            var nodes = data as IEnumerable<Node>;
            if (nodes != null)
                selectedItems.AddRange(nodes.Select(n => n.Id.ToString()).ToArray());

            BuildOptions(InnerListItemCollection, this.Options, selectedItems);

            if (!IsTemplated)
                return;

            var innerControl = GetInnerControl() as DropDownList;
            if (innerControl != null)
            {
                innerControl.Items.Clear();
                BuildOptions(innerControl.Items, this.Options, selectedItems);
            }
        }

        public override void DoAutoConfigure(FieldSetting setting)
        {
            var referenceFieldSetting = setting as ReferenceFieldSetting;
            if (referenceFieldSetting == null)
                throw new ApplicationException("A reference dropdown field control can only be used in conjunction with a reference field.");
        }

        protected override void FillBrowseControls()
        {
            var ic = GetBrowseControl() as Label;
            if (ic == null)
                return;

            var data = this.GetData() as IList<Node>;
            if (data == null)
                return;

            ic.Text = data.Count == 0 ? string.Empty : data.First()["DisplayName"].ToString();
        }

    }
}
