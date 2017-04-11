
// Class:
// Manages overlays on the user interface
var OverlayManager = (function ($, undefined) {
    return function (startLoadIndicatorLevel, defaultPopupClass) {
        var that = this;
        if (typeof (startLoadIndicatorLevel) !== "number") {
            startLoadIndicatorLevel = 200;
        }
        if (typeof (defaultPopupClass) !== "string") {
            defaultPopupClass = "overlaymanager-popup";
        }
        var currentLoadIndicatorLevel = startLoadIndicatorLevel;
        var overlays = [], loaderOverlays = [];

        // Method:
        // Shows the overlay with an optional loading indicator and text
        this.showOverlay = function (options) {
            if (typeof (options) == "string") {
                var text = options;
                options = { text: text };
            }
            else if (typeof (options) != "object") {
                options = new Object();
            }

            options = $.extend({
                text: "",
                title: "",
                cssClass: "",
                load: false,
                appendCloseButton: false,
                zIndex:'',
                overlayBg: true,
                onclose: null
            }, options);
            options.text = "<div class='" + defaultPopupClass + " " + options.cssClass + "'><div class='header'>" + options.title + "</div>" + options.text
            if (options.load)
                options.text += "<span class='load'>&nbsp;</span>";
            if (options.appendCloseButton)
                options.text += '<a class="modalClose close-overlay" href="javascript:void(0)">&nbsp;</a>';
            options.text += "</div>";

            if (options.zIndex !== '')
                currentLoadIndicatorLevel = options.zIndex;
            currentLoadIndicatorLevel++;
            var overlay = $('<div class="overlay">' + options.text + '</div>');
            overlay.attr('data-level', currentLoadIndicatorLevel);
            overlay.css({ "z-index": currentLoadIndicatorLevel });

            if (options.load)
                overlay.addClass('load-indicator');

            overlay.on("click.overlaymanager", ".close-overlay", function (event) {
                event.preventDefault();
                that.hideOverlay();
                if (options.onclose && typeof options.onclose === 'function')
                    options.onclose();
                return false;
            });

            
            overlay.appendTo($("body"));
            if (!options.overlayBg) {
                overlay.css('background','transparent')
            }
            that.resizeOverlay(overlay);

            overlays.push(overlay);
            return overlay;
        };

        // Method
        // Adjusts the given overlay to position it to the center of the screen
        this.resizeOverlay = function ($overlay) {
            var $popup = $("." + defaultPopupClass, $overlay);
            setTimeout(function () {
                $popup.css({
                    "margin-top": (-$popup.outerHeight() / 2),
                    "margin-left": (-$popup.outerWidth() / 2)
                });
            }, 1);
            // console.log(-$popup.outerHeight() / 2);
            // console.log(-$popup.outerWidth() / 2);
        };

        // Method
        // Hides the last shown overlay
        this.hideOverlay = function () {
            if (overlays.length === 0)
                return;

            var $lastOverlay = overlays[overlays.length - 1];
            overlays.pop();
            $lastOverlay.remove();
            currentLoadIndicatorLevel--;
        };

        this.showMessage = function (options) {
            options = $.extend({
                disappear: options.type === "error" ? false : 2000,
                title: options.title || 'Information',
                text: options.text || '',
                type: options.tyoe || 'info' // info, success, error, warning
            }, options);

            var addTop = $(".message").toArray().reduce(function (previousValue, currentValue, index, array) { return previousValue + $(currentValue).outerHeight() + 5; }, 0);

            var $overlay = $(".overlay");
            var $parent = $overlay.length ? $overlay.last().find(".sn-popup") : $("body");
            var $message = $('<div class="message ' + options.type + '">\
                            <h3>' + options.title + '</h3>\
                            <p>' + options.text + '</p>\
                          </div>').appendTo($parent);

            $message.animate({ top: (($overlay.length ? 5 : 0) + addTop), opacity: 1 }, 500, 'linear', function () {
                var disappearFunc = function () {
                    $message.animate({ top: -$message.outerHeight() - 50, opacity: 0 }, 500, 'linear', function () {
                        $message.remove();
                    });
                };
                if (typeof (options.disappear) === "number") {
                    var timeout = setTimeout(disappearFunc, options.disappear);

                    $message.on("mouseenter.sn", function () { clearTimeout(timeout); });
                    $message.on("mouseleave.sn", function () { timeout = setTimeout(disappearFunc, options.disappear); });
                }

                $message.on("click.sn", disappearFunc);

            });

            return $message;
        };

        this.hideMessage = function () {
            var $message = $('.message');
            if ($message.length === 0)
                return;

            $message.animate({ top: -$message.outerHeight() - 50, opacity: 0 }, 500, 'linear', function () {
                $message.remove();
            });
        };

        this.showLoader = function (options) {
            options = $.extend({
                img: options.img || '/Root/Global/images/loading-spinning-bubbles.svg',
                element: options.element || $("body")
            }, options);

            currentLoadIndicatorLevel++;
            var overlay = $('<div class="overlay"><img src="' + options.img + '" /></div>');
            overlay.attr('data-level', currentLoadIndicatorLevel);
            overlay.css({ "z-index": currentLoadIndicatorLevel, "text-align": 'center' });

            overlay.find('img').css({ "margin-top": $(options.element).height() / 2 - 30 + "px" });
            if (options.load)
                overlay.addClass('load-indicator');

            overlay.appendTo(options.element);

            loaderOverlays.push(overlay);
            return overlay;
        };

        this.hideLoader = function () {
            if (loaderOverlays.length === 0)
                return;

            var $lastLoaderOverlay = loaderOverlays[loaderOverlays.length - 1];
            loaderOverlays.pop();
            $lastLoaderOverlay.remove();
            currentLoadIndicatorLevel--;
        }
    };
})(jQuery);
