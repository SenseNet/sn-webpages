using System;
using SenseNet.ApplicationModel;
using SenseNet.Configuration;
using SenseNet.ContentRepository;
using SenseNet.ContentRepository.Storage;

namespace SenseNet.Portal.UI
{
    public static class IconHelper
    {
        private const string SimpleFormat = @"<img src='{1}' alt='[{0}]' title='{3}' class='{2}' />";
        private const string SpanFormat = @"<span class='{0}' title='{1}'></span>";
        private const string OverlayFormat = @"<div class='iconoverlay'><img src='{1}' alt='[{0}]' title='{5}' class='{4}' /><div class='overlay'><img src='{3}' alt='[{2}-{0}]' class='{2}' title='{5}' /></div></div>";

        [Obsolete("After V6.5 PATCH 9: Use Skin.RelativeIconPath instead.")]
        public static string RelativeIconPath => Skin.RelativeIconPath;
        [Obsolete("After V6.5 PATCH 9: Use Skin.OverlayPrefix instead.")]
        public static string OverlayPrefix => Skin.OverlayPrefix;

        public static string ResolveIconPath(string icon, int size)
        {
            if (string.IsNullOrEmpty(icon))
                icon = Skin.DefaultIcon;

            var iconroot = Skin.RelativeIconPath + "/" + size;
            var iconpath = SkinManager.Resolve(iconroot + "/" + icon + ".png");

            return iconpath;
        }
        
        public static string RenderIconTag(string icon)
        {
            return RenderIconTag(icon, null);
        }

        public static string RenderIconTag(string icon, string overlay)
        {
            return RenderIconTag(icon, overlay, 16);
        }

        public static string RenderIconTag(string icon, string overlay, int size)
        {
            return RenderIconTag(icon, overlay, size, string.Empty);
        }

        public static string RenderIconTag(string icon, string overlay, int size, string title)
        {
            var iconclasses = "sn-icon sn-icon" + size;

            var iconpath = ResolveIconPath(icon, size);

            if (string.IsNullOrEmpty(overlay))
            {
                return string.Format(SimpleFormat, icon, iconpath, iconclasses, title);
            }
            else
            {
                var overlaypath = ResolveIconPath(Skin.OverlayPrefix + overlay, size);
                return string.Format(OverlayFormat, icon, iconpath, overlay, overlaypath, iconclasses, title);
            }
        }

        public static string RenderIconTagFromPath(string path, int size)
        {
            return RenderIconTagFromPath(path, size, string.Empty);
        }

        public static string RenderIconTagFromPath(string path, string overlay, int size)
        {
            return RenderIconTagFromPath(path, overlay, size, string.Empty);
        }

        public static string RenderIconTagFromPath(string path, int size, string title)
        {
            return RenderIconTagFromPath(path, null, size, title);
        }

        public static string RenderIconTagFromPath(string path, string overlay, int size, string title)
        {
            var iconclasses = "sn-icon sn-icon" + size;

            if (string.IsNullOrEmpty(overlay))
            {
                return string.Format(SimpleFormat, string.Empty, path, iconclasses, title);
            }
            else
            {
                var overlaypath = ResolveIconPath(Skin.OverlayPrefix + overlay, size);
                return string.Format(OverlayFormat, RepositoryPath.GetFileName(path), path, overlay, overlaypath, iconclasses, title);
            }
        }

        public static string RenderIconTagWithSpan(string classname, string title)
        {
            return string.Format(SpanFormat, classname, title);
        }

        public static string GetOverlay(Content content, out string title)
        {
            title = string.Empty;

            if (content == null || content.ContentHandler == null)
                return string.Empty;

            var overlay = string.Empty;
            var contentLink = content.ContentHandler as ContentLink;

            if (contentLink != null)
            {
                overlay = "contentlink";
                title = Content.Create(contentLink.ContentType).DisplayName;
            } 
            else if (content.ContentHandler.Locked)
            {
                if (content.ContentHandler is File && content.ContentHandler.SavingState != ContentSavingState.Finalized)
                {
                    overlay = content.ContentHandler.LockedById == User.Current.Id
                       ? "multistepsave"
                       : "checkedout";
                }
                else
                {
                    overlay = content.ContentHandler.LockedById == User.Current.Id
                        ? "checkedoutbyme"
                        : "checkedout";
                }

                title = content.ContentHandler.LockedBy.Username;
            }
            else if (content.Approvable)
            {
                overlay = "approvable";
            }

            return overlay;
        }

        /// <summary>
        /// Fills the icon tag property if it is available but not filled by the action.
        /// </summary>
        /// <param name="action">A generic action that may be a PortalAction that has an IconTag property.</param>
        /// <returns>The same action, extended with an icon tag.</returns>
        public static ActionBase AddIconTag(this ActionBase action)
        {
            // Fills the icon tag property if it is not provided by the action. This is 
            // a workaround for the fact that the PortalAction type is in a lower layer 
            // where the icon rendering functionality is not available.

            var pa = action as PortalAction;
            if (pa == null || !string.IsNullOrEmpty(pa.IconTag))
                return action;

            pa.IconTag = RenderIconTag(pa.Icon, null);

            return pa;
        }
    }
}
