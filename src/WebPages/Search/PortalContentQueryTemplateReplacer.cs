using System.Collections.Generic;
using System.Web;
using SenseNet.Portal.Virtualization;
using SenseNet.Search;
using SenseNet.Search.Parser;

namespace SenseNet.Portal.Search
{
    public class PortalContentQueryTemplateReplacer : ContentQueryTemplateReplacer
    {
        public override IEnumerable<string> TemplateNames
        {
            get { return new[] { "currentsite", "currentworkspace", "currentpage", "currentcontent" }; }
        }

        public override string EvaluateTemplate(string templateName, string templateExpression, object templatingContext)
        {
            if (HttpContext.Current == null || PortalContext.Current == null)
                return base.EvaluateTemplate(templateName, templateExpression, templatingContext);

            switch (templateName.ToLowerInvariant())
            {
                case "currentsite":
                    return EvaluateExpression(PortalContext.Current.Site, templateExpression, templatingContext);
                case "currentworkspace":
                    return EvaluateExpression(PortalContext.Current.ContextWorkspace, templateExpression, templatingContext);
                case "currentpage":
                    return EvaluateExpression(PortalContext.Current.Page, templateExpression, templatingContext);
                case "currentcontent":
                    return EvaluateExpression(PortalContext.Current.ContextNode, templateExpression, templatingContext);
                default:
                    return base.EvaluateTemplate(templateName, templateExpression, templatingContext);
            }
        }
    }
}
