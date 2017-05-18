using System;
using System.ComponentModel;
using System.Web.UI;
using System.Web.UI.WebControls.WebParts;
using SenseNet.ContentRepository;
using SenseNet.Portal.UI;
using SenseNet.Portal.UI.PortletFramework;
using SenseNet.Portal.PortletFramework;
using SenseNet.Diagnostics;

namespace SenseNet.Portal.Portlets
{
    public class ContentPortlet : ContextBoundPortlet
    {
        [WebBrowsable(false)]
        [Personalizable(true)]
        [Obsolete("Use Renderer property instead.")]
        public string ViewPath { get; set; }

        // portlet uses custom ascx, hide renderer property
        [WebBrowsable(true), Personalizable(true)]
        [LocalizedWebDisplayName(PORTLETFRAMEWORK_CLASSNAME, RENDERER_DISPLAYNAME)]
        [LocalizedWebDescription(PORTLETFRAMEWORK_CLASSNAME, RENDERER_DESCRIPTION)]
        [WebCategory(EditorCategory.UI, EditorCategory.UI_Order)]
        [Editor(typeof(ViewPickerEditorPartField), typeof(IEditorPartField))]
        [ContentPickerEditorPartOptions(ContentPickerCommonType.ContentView, PortletViewType.All)]
        [WebOrder(100)]
        public override string Renderer
        {
            get
            {
#pragma warning disable 618
                // the obsolete property is used here as a fallback
                return base.Renderer ?? ViewPath;
#pragma warning restore 618
            }
            set
            {
                base.Renderer = value;
            }
        }

        public override RenderMode RenderingMode
        {
            get
            {
                if (string.IsNullOrEmpty(this.Renderer))
                    return RenderMode.Native;

                return this.Renderer.ToLower().EndsWith("xslt") ? RenderMode.Xslt : RenderMode.Ascx;
            }
            set
            {
                base.RenderingMode = value;
            }
        }

        public ContentPortlet()
        {
            this.Name = "$ContentPortlet:PortletDisplayName";
            this.Description = "$ContentPortlet:PortletDescription";
            this.Category = new PortletCategory(PortletCategoryType.Content);

            Cacheable = true;   // by default, any contentportlet is cached
        }

        protected override void RenderWithAscx(HtmlTextWriter writer)
        {
            this.RenderContents(writer);
        }

        protected override void CreateChildControls()
        {
            if (Cacheable && CanCache && IsInCache)
                return;

            if (ShowExecutionTime)
                Timer.Start();

            if (this.RenderingMode == RenderMode.Ascx || this.RenderingMode == RenderMode.Native)
            {
                Controls.Clear();

                try
                {
                    var node = GetContextNode();

                    if (node != null)
                    {
                        var content = Content.Create(node);
                        ContentView contentView = null;
                        if (!string.IsNullOrEmpty(Renderer))
                        {
                            contentView = ContentView.Create(content, Page, ViewMode.Browse, Renderer);
                        }
                        if (contentView == null)
                            contentView = ContentView.Create(content, Page, ViewMode.Browse);

                        if (contentView != null)
                        {
                            Controls.Add(contentView);
                        }
                        else
                        {
                            Controls.Clear();
                            Controls.Add(new System.Web.UI.WebControls.Label() { Text = SR.GetString(SR.Exceptions.ContentView.NotFound) });
                        }
                    }
                    else if (this.RenderException != null)
                    {
                        Controls.Clear();
                        Controls.Add(new System.Web.UI.WebControls.Label() { Text = string.Format("Error loading content view: {0}", this.RenderException.Message) });
                    }
                }
                catch (Exception e)
                {
                    SnLog.WriteException(e);
                    Controls.Clear();
                    Controls.Add(new System.Web.UI.WebControls.Label() { Text = string.Format("Error loading content view: {0}", e.Message) });
                }

                ChildControlsCreated = true;
            }

            if (ShowExecutionTime)
                Timer.Stop();
        }

        protected override object GetModel()
        {
            var node = GetContextNode();
            return node == null ? null : Content.Create(node).GetXml();
        }
    }
}
