using System.Collections.Generic;
using SenseNet.ApplicationModel;
using SenseNet.ContentRepository;
using SenseNet.Portal.UI;
using SenseNet.Portal.UI.Controls;

namespace SenseNet.Portal.ApplicationModel
{
    public class ActionTemplateReplacer : TemplateReplacerBase
    {
        public override string TemplatePatternFormat
        {
            get { return @"#=[\s]*{0}[\s]*#"; }
        }

        public override IEnumerable<string> TemplateNames
        {
            get { return new[] { "url", "name", "overlay", "overlayclass", "text", "title", "onclick", "class", "disabled", "iconname", "iconurl", "iconsize", "iconsizeclass" }; }
        }

        protected readonly string OnClickFormat = "onclick=\"{0}\"";

        public override string EvaluateTemplate(string templateName, string templateExpression, object templatingContext)
        {
            // fill values using properties from the ASP.NET control
            var actionLinkButton = templatingContext as ActionLinkButton;
            if (actionLinkButton != null)
                return EvaluateActionLinkButton(templateName, templateExpression, actionLinkButton);

            // fill values from the action
            var action = templatingContext as ActionBase;
            if (action != null)
                return EvaluateAction(templateName, templateExpression, action);

            return base.EvaluateTemplate(templateName, templateExpression, templatingContext);
        }

        protected string EvaluateActionLinkButton(string templateName, string templateExpression, ActionLinkButton alButton)
        {
            var action = alButton.Action;

            var clientAction = action as ClientAction;
            if (clientAction != null)
            {
                switch (templateName)
                {
                    case "onclick":
                        return string.Format(OnClickFormat, clientAction.Callback);
                    case "url":
                        return "javascript:";
                }
            }

            switch (templateName)
            {
                case "name":
                    return action.Name;
                case "url":
                    return action.Forbidden ? string.Empty : action.Uri;
                case "text":
                    return string.IsNullOrEmpty(alButton.Text) ? action.Text : alButton.Text;
                case "title":
                    return alButton.ToolTip;
                case "class":
                    return alButton.CssClass;
                case "disabled":
                    return alButton.Enabled ? string.Empty : "disabled";
                case "iconname":
                    return alButton.IconName.ToLowerInvariant();
                case "iconurl":
                    return alButton.IconUrl;
                case "iconsize":
                    return alButton.IconSize.ToString();
                case "iconsizeclass":
                    return "sn-icon" + alButton.IconSize;
                case "overlay":
                    return alButton.Overlay;
                case "overlayclass":
                    return string.IsNullOrEmpty(alButton.Overlay) ? string.Empty : "sn-overlay-" + alButton.Overlay;
            }

            return string.Empty;
        }

        protected string EvaluateAction(string templateName, string templateExpression, ActionBase action)
        {
            var clientAction = action as ClientAction;
            if (clientAction != null)
            {
                switch (templateName)
                {
                    case "onclick":
                        return string.Format(OnClickFormat, clientAction.Callback);
                    case "url":
                        return "javascript:";
                }
            }

            switch (templateName)
            {
                case "name":
                    return action.Name;
                case "url":
                    return action.Forbidden ? string.Empty : action.Uri;
                case "text":
                    return action.Text;
                case "title":
                    return action.Text;
                case "class":
                    return action.CssClass;
                case "disabled":
                    return action.Forbidden ? "disabled" : string.Empty;
                case "iconname":
                    return action.Icon;
                case "overlay":
                    string title1;
                    return IconHelper.GetOverlay(action.GetContent(), out title1);
                case "overlayclass":
                    string title2;
                    var overlay = IconHelper.GetOverlay(action.GetContent(), out title2);
                    return string.IsNullOrEmpty(overlay) ? string.Empty : "sn-overlay-" + overlay;
            }

            return string.Empty;
        }
    }
}
