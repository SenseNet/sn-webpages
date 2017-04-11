using System.Collections.Generic;
using System.Reflection;
using System.Web.UI;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Storage;
using SenseNet.Portal.UI.PortletFramework;
using SenseNet.Tools;

namespace SenseNet.Portal
{
    public class PortletTemplateReplacer : TemplateReplacerBase
    {
        public override string TemplatePatternFormat
        {
            get
            {
                // We had to override the original pattern here because the @@ characters
                // in the original pattern cannot be used in this environment.
                return @"\{{{0}\}}";
            }
        }

        public override IEnumerable<string> TemplateNames
        {
            get { return new[] { "PortletID", "DefaultView" }; }
        }

        public override string EvaluateTemplate(string templateName, string templateExpression, object templatingContext)
        {
            var control = templatingContext as Control;
            var cbp = ContextBoundPortlet.GetContainingContextBoundPortlet(control);

            switch (templateName)
            {
                case "PortletID":
                    return cbp != null ? cbp.ID : string.Empty;
                case "DefaultView":
                    if (cbp != null)
                    {
                        var clpType = TypeResolver.GetType("SenseNet.Portal.Portlets.ContentListPortlet");
                        if (clpType != null)
                        {
                            var defProp = clpType.GetProperty("DefaultView", BindingFlags.Instance | BindingFlags.Public);
                            if (defProp != null)
                            {
                                var defView = defProp.GetValue(cbp, null) as string;
                                return defView ?? string.Empty;
                            }
                        }
                    }
                    break;
            }

            return string.Empty;
        }
    }
}
