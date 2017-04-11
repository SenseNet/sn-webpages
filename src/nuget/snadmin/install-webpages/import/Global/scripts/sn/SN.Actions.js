// using $skin/scripts/sn/SN.js
// using $skin/scripts/sn/SN.Util.js
// using $skin/scripts/jquery/jquery.js
// using $skin/scripts/jqueryui/minified/jquery-ui.min.js

SN.Actions = {
    getActionLinkMarkup: function (content, options) {

        // OPTIONS:
        //  ActionName: 'Edit', // name of the action, we will look for it in the content json
        //  Action: {}, // full action JSON object
        //  Icon: "MyIcon",
        //  IconUrl: "/Root/global/images/myicon.png",
        //  UseContentIcon: false,
        //  ParameterString: "ContentTypeName=User",
        //  IconVisible: true,
        //  IconSize: 16,
        //  IncludeBackurl: true,
        //  OverlayVisible: false, // NOT USED YET
        //  CssClass: "myclass", //will be added to the <a> tag
        //  Style: "button" //determines the css class of the <a> tag

        var jsonContent = content.json;
        var currentOptions = options || {};

        //set default options
        if (currentOptions.IconVisible == null)
            currentOptions.IconVisible = true;
        if (currentOptions.IconSize == null)
            currentOptions.IconSize = 16;

        //one and only one of the following options MUST be provided by the caller
        var actionName = currentOptions.ActionName;
        var action = currentOptions.Action;

        if (!action && !actionName) {
            console.warn('ActionName or Action option must be provided. Content: ' + jsonContent.Path);
            return '';
        }

        if (!action) {
            //get the required action from the given JSON object        
            if (jsonContent.Actions.__deferred) {
                //TODO later: if Actions property is deferred, get it automatically using a new request
                console.warn('Actions property is deferred. Please provide content data that contains all action data. Content: ' + jsonContent.Path + ', action: ' + actionName);
            } else {
                var actionArray = jQuery.grep(jsonContent.Actions, function (a, i) { return (a.Name == actionName); });
                if (actionArray.length < 1) {
                    //action does not exist or it is not accessible because of permission issues
                    return '';
                } else {
                    action = actionArray[0];
                }
            }
        }

        //action not found
        if (!action)
            return '';

        //re-set the action name to avoid parameter collision (Action is stronger than ActionName)
        actionName = action.Name;

        var url = action.ClientAction ? '' : action.Url;
        var separator = url.indexOf("?") === -1 ? "?" : "&";

        //Set 'Include back url' value only if there was no given parameter.
        //If the setting coming from the server is 0 (meaning 'Default'), than
        //include back url only if this is not a Browse action. Otherwise
        //use server setting (1 or 2, meaning 'True' or 'False')
        if (currentOptions.IncludeBackUrl == null) {
            if (action.IncludeBackUrl === 0)
                currentOptions.IncludeBackUrl = actionName !== 'Browse';
            else
                currentOptions.IncludeBackUrl = action.IncludeBackUrl === 1;
        }

        //In case of the caller wants to add a 'backtarget', than it should
        //set the IncludeBackurl to false and provide the back target in
        //the options parameter (ParameterString).
        if (currentOptions.IncludeBackUrl && !action.ClientAction && !action.Forbidden) {
            url = url + separator + 'back=' + encodeURIComponent(document.URL);
            separator = "&";
        }

        //add custom parameters to the url
        if (currentOptions.ParameterString && !action.ClientAction && !action.Forbidden) {
            url = url + separator + currentOptions.ParameterString;
            separator = "&";
        }

        //build the icon part if needed
        var img = '';
        if (currentOptions.IconVisible) {
            if (currentOptions.UseContentIcon)
                img = SN.Actions.getIconMarkupByName(jsonContent.Icon, currentOptions.IconSize);
            else if (currentOptions.IconUrl)
                img = SN.Actions.getIconMarkupByUrl(currentOptions.IconUrl, currentOptions.IconSize, actionName);
            else if (currentOptions.Icon)
                img = SN.Actions.getIconMarkupByName(currentOptions.Icon, currentOptions.IconSize);            
            else
                img = SN.Actions.getIconMarkupByName(action.Icon, currentOptions.IconSize);
        }

        //set link text
        var text = action.DisplayName;
        if (currentOptions.Text)
            text = currentOptions.Text;

        //determine the basic classes for the <a> tag
        //#1: icon style (link in a menu or a standalone button)
        var linkClass = currentOptions.Style === "button" ? "sn-actionlinkbutton" : "sn-actionlink";

        //#2: forbidden (gray, not clickable) link
        if (action.Forbidden)
            linkClass += ' sn-disabled';

        //add custom css class if needed
        var customCssClass = '';
        if (currentOptions.CssClass)
            customCssClass = ' ' + currentOptions.CssClass;

        //Determine where to put the clickable part: href of onclick? 
        //In case of a forbidden action leave the whole thing empty.
        var actionExecutor = action.ClientAction
            ? (action.Forbidden ? '' : 'href="javascript:void(0);" onclick="' + action.Url + '"')
            : (action.Forbidden ? '' : 'href="' + url + '"');

        //does the link should be disabled?
        var disabledAttr = action.Forbidden ? ' disabled="disabled"' : '';

        return '<a ' + actionExecutor + ' class="' + linkClass + ' ui-state-default ui-corner-all' + customCssClass + '" alt="[' + actionName + ']"' + disabledAttr + '>' + img + text + '</a>';
    },

    getIconMarkupByName: function (iconName, iconSize) {
        return '<span class="sn-icon sn-icon-' + iconName + ' sn-icon' + iconSize + '"></span>';
    },

    getIconMarkupByUrl: function (iconUrl, iconSize, actionName) {
        return '<span class="sn-icon"><img src="' + iconUrl + '" alt="[' + actionName + ']" title="" class="sn-icon sn-icon' + iconSize + '"/></span>';
    }
};