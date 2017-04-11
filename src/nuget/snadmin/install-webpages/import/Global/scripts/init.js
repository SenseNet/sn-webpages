// using $skin/scripts/sn/SN.Util.js

$(function() {

    // Init Theme switcher
    /*
    $("body").append("<div id='themeswitcher' style='position:fixed; left: 10px; top: 10px;'></div>");
    $("#themeswitcher").themeswitcher({
    height: 400
    });
    */

    // Init UI Interface
    SN.Util.CreateUIInterface($(".sn-layout-container"));

    // init sn-submit button's special submit behavior
    SN.Util.InitSubmitButtonDisable();
});
