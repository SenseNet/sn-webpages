using SenseNet.Diagnostics;
using SenseNet.Portal.UI.PortletFramework;
using SenseNet.Portal.Virtualization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.UI;

namespace SenseNet.Portal.Portlets
{
    public class ClientContextPortlet : ContextBoundPortlet
    {
        public ClientContextPortlet()
        {
            this.Name = "$ClientContextPortlet:PortletDisplayName";
            this.Description = "$ClientContextPortlet:PortletDescription";
            this.Category = new PortletCategory(PortletCategoryType.Application);
        }

        protected override void CreateChildControls()
        {
            if (Cacheable && CanCache && IsInCache)
                return;

            // TODO: later this portlet should only generate a script request 
            // instead of pouring everything into the html directly.

            var scriptText = string.Empty;

            try
            {
                scriptText = ClientContext.GenerateScript();
            }
            catch (Exception ex)
            {
                scriptText = "//// context error: " + SenseNet.ContentRepository.Security.Sanitizer.Sanitize(ex.Message);

                SnLog.WriteWarning("Error during client context generation: " + ex, EventId.ClientEvent);
            }

            this.Controls.Clear();
            this.Controls.Add(new LiteralControl($"<script>SN.Context = {scriptText}</script>"));
        }
    }
}
