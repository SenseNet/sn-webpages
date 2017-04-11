/// <depends path="$skin/scripts/sn/SN.Util.js" />
// using $skin/scripts/jquery/jquery.js
$(function () {

    // Init Theme switcher
    /*
    $("body").append("<div id='themeswitcher' style='position:fixed; left: 10px; top: 10px;'></div>");
    $("#themeswitcher").themeswitcher({
    height: 400
    });
    */

    // Init UI Interface
    SN.Util.CreateUIInterface($(".sn-layout-container"));

    // Custom menu
    // first level
    $(".custommenu1 > li").hover(
    // over
        function () { $(this).children("ul:first").slideDown(200); },
    // out
        function () { $(this).children("ul:first").stop(true, true).slideUp(200); });
    // second level
    $(".custommenu1 > li > ul > li").hover(
    // over
        function () { $(this).children("ul:first").fadeIn(200); },
    // out
        function () { $(this).children("ul:first").stop(true, true).fadeOut(200); });



    $(".sn-demo-features .desc").each(function () {
        $(this).hover(function () {
            $(this).stop().animate({ opacity: 1.0 }, 250);
        },
           function () {
               $(this).stop().animate({ opacity: 0.0 }, 250);
           });
    });

    var agentStr = navigator.userAgent;
    var mode;
    if ($.browser.msie) {
        if (agentStr.indexOf("Trident/5.0") > -1) {
            if (agentStr.indexOf("MSIE 7.0") > -1)
                mode = "ie9comp";
            else
                mode = "ie9";
        }
        else if (agentStr.indexOf("Trident/4.0") > -1) {
            if (agentStr.indexOf("MSIE 7.0") > -1)
                mode = "ie8comp";
            else {
                mode = "ie8";
            }
        }

        else
            mode = "ie7";
    }
    if ($.browser.opera) {
        $('body').addClass('opera');
    }
    $('.sn-body').addClass(mode);

    if (((1280 >= screen.width) && (mode = "ie8")), (($.browser.msie) && (mode = "ie9comp") && (1280 >= screen.width))) {
        $(".sn-body").addClass("ie81024");
    }

    if (($.browser.msie) && (1280 >= document.documentElement.clientWidth)) {
        $(".sn-body").addClass("ie81024");
    }

    if ($('body').hasClass('.ie9comp')) {
        $('.sn-column-half').last().addClass('secondcolumn');
    }

    $(".sn-index-header-button").mouseover(
        function () {
            $(this).addClass('hover');
        });

    $(".sn-index-header-button").mouseout(
        function () {
            $(this).removeClass('hover');
        });

    var header1 = $('.sn-index-header1');
    var header2 = $('.sn-index-header2');
    var leftButton = $(".sn-head-pager-left");
    var rightButton = $(".sn-head-pager-left");

    var x = 0;
    var wwidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    $('.sn-index-header').each(function () {
        if (x === 0) {
            $(this).show();
            $(this).css('left', 0);
            x += 1;
        }
        else {
            $(this).css('left', wwidth);
        }

    });
    var isClicked = false;
    $(".sn-head-pager-right").click(
        function () {
            var that = $(this);
            if (!isClicked) {
                isClicked = true;
                var $actualHeader = that.parent().siblings(".active");
                $actualHeader.siblings().css('left', wwidth);
                var $nextHeader = $actualHeader.next('.sn-index-header');
                if ($nextHeader.length === 0) {
                    $nextHeader = $('.sn-index-header').first();
                    $nextHeader.css('left', wwidth);
                }
                $actualHeader.animate({
                    left: -$actualHeader.outerWidth()
                }, 500, function () {
                    $actualHeader.removeClass('active').css('left', wwidth);
                });
                $nextHeader.show();
                $nextHeader.animate({
                    left: 0
                }, 500, function () {
                    $nextHeader.addClass('active').siblings('.sn-index-header').hide();
                    isClicked = false;
                });
            }
        });

    $(".sn-head-pager-left").click(
        function () {
            var that = $(this);
            if (!isClicked) {
                isClicked = true;
                var $actualHeader = that.parent().siblings(".active");
                $actualHeader.siblings().css('left', -wwidth);
                var $prevHeader = $actualHeader.prev('.sn-index-header');
                if ($prevHeader.length === 0) {
                    $prevHeader = $('.sn-index-header').last();
                    $prevHeader.show();
                    $prevHeader.css('left', -wwidth);
                }
                $actualHeader.animate({
                    left: $actualHeader.outerWidth()
                }, 500, function () {
                    $actualHeader.removeClass('active').css('left', -wwidth);
                });
                $prevHeader.show();
                $prevHeader.animate({
                    left: 0
                }, 500, function () {
                    $prevHeader.addClass('active').siblings('.sn-index-header').hide();
                    isClicked = false;
                });
            }
        });


    function onResized(e) {
            var wwidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        $('.sn-index-header').not('.active').css('left', wwidth);
    }
    $(window).on("resize", onResized);
    $(window).on("orientationchange", onResized);

   

    // init sn-submit button's special submit behavior
    SN.Util.InitSubmitButtonDisable();
});

