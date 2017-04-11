using System.Collections.Generic;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Storage;

namespace SenseNet.Portal.Search
{
    public class ContextBoundPortletTemplateReplacer : TemplateReplacerBase
    {
        public override IEnumerable<string> TemplateNames
        {
            get { return new[] { "portletcontext" }; }
        }

        public override string EvaluateTemplate(string templateName, string templateExpression, object templatingContext)
        {
            var context = templatingContext as Node;

            switch (templateName)
            {
                case "portletcontext":
                    return EvaluateExpression(context, templateExpression, templatingContext);
                default:
                    return base.EvaluateTemplate(templateName, templateExpression, templatingContext);
            }
        }
    }
}
