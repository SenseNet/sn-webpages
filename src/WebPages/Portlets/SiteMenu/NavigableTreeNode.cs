﻿using System;
using System.Web.UI;
using System.Xml.Serialization;
using SenseNet.ContentRepository.Storage;
using SenseNet.ContentRepository.Storage.Security;
using SNP = SenseNet.Portal;
using SenseNet.ContentRepository;

namespace SenseNet.Portal.Portlets
{
    public class NavigableTreeNode
    {
        [XmlArrayItem(ElementName = "Node")]
        public NavigableTreeNode[] Nodes { get; set; }
        public String Name { get; set; }
        public string Url { get; set; }
        public bool IsExternal { get; set; }
        public bool IsCurrent { get; set; }
        public bool IsTraversal { get; set; }
        public int PhysicalIndex { get; set; }
        public int Index { get; set; }
        public int Level { get; set; }
        public bool IsFirst { get; set; }
        public bool IsLast { get; set; }
        public object IsHidden { get; set; }
        public string NodeType { get; set; }

        public NavigableTreeNode()
        {
        }

        public NavigableTreeNode(Node node, string referenceParentPath, string currentPath)
        {
            NodeType = node.NodeType.Name;
            Content content;

            // elevation: we need to access the Hidden field here, which
            // is not accessible for users with only See permission
            using (new SystemAccount())
            {
                content = Content.Load(node.Id);
            }

            this.Name = content.DisplayName;

            var genericContent = content.ContentHandler as GenericContent;
            if (genericContent != null)
                this.IsHidden = genericContent.Hidden;

            var page = content.ContentHandler as Page;
            var contentLink = content.ContentHandler as ContentLink;
            var isOuterLink = content.ContentType.IsInstaceOfOrDerivedFrom("Link");
            if (page != null)
            {
                this.IsExternal = page.GetProperty<int>("IsExternal") != 0;
                this.Url = IsExternal ? Convert.ToString(page["OuterUrl"]) : page.Path.Replace(referenceParentPath, string.Empty);
            }
            else if (contentLink != null)
            {
                if (contentLink.GetReference<Node>("Link") != null)
                {
                    this.Url = contentLink.GetReference<Node>("Link").Path;
                }
                else
                {
                    this.Url = node.Path.Replace(referenceParentPath, string.Empty);
                }
            }
            else if (isOuterLink)
            {
                this.Url = content["Url"] as String;
            }
            else
            {
                this.Url = node.Path.Replace(referenceParentPath, string.Empty);
            }

            this.Index = node.Index;
            this.IsCurrent = node.Path == currentPath;
            this.IsTraversal = RepositoryPath.IsInTree(currentPath, node.Path) && !IsCurrent;
        }

        private string ItemCssClass
        {
            get
            {
                return string.Format("sn-menu-{0} sn-index-{1} {2} {3} {4}",
                    this.PhysicalIndex,
                    this.Index,
                    IsLast ? "sn-menu-last" : string.Empty,
                    IsCurrent ? "sn-menu-active" : string.Empty,
                    IsTraversal ? "sn-menu-traversal" : string.Empty);
            }

        }
        private string AnchorCssClass
        {
            get
            {
                return "sn-menu-link";
            }
        }

        public void Render(HtmlTextWriter writer)
        {

            writer.AddAttribute(HtmlTextWriterAttribute.Class, ItemCssClass);
            writer.RenderBeginTag(HtmlTextWriterTag.Li);
            writer.AddAttribute(HtmlTextWriterAttribute.Class, AnchorCssClass);
            writer.AddAttribute(HtmlTextWriterAttribute.Href, Url);
            writer.RenderBeginTag(HtmlTextWriterTag.A);
            writer.RenderBeginTag(HtmlTextWriterTag.Span);
            writer.WriteEncodedText(Name);
            writer.RenderEndTag(); // </Span>
            writer.RenderEndTag(); // </A>
            RenderChildren(writer);
            writer.RenderEndTag(); // </Li>
        }

        private void RenderChildren(HtmlTextWriter writer)
        {
            if (Nodes != null && Nodes.Length > 0)
            {
                writer.RenderBeginTag(HtmlTextWriterTag.Ul);
                foreach (NavigableTreeNode node in Nodes)
                {
                    node.Render(writer);
                }
                writer.RenderEndTag();
            }
        }
    }
}
