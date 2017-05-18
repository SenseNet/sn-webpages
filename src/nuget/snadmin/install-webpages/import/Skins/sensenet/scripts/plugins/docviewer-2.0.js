(function ($) {
    var lastDocViewerId = 0;
    var resizeFlags = {
        fromTop: 1,
        fromRight: 2,
        fromBottom: 4,
        fromLeft: 8
    };

    $.fn.extend({
        documentViewer: function (options) {
            // Prevent the plugin from running twice
            if (this.data('snDocViewer'))
                return;

            // Save an identifier for this document viewer
            var docViewerId = ++lastDocViewerId;
            var $pluginSubject = $(this[0]);
            var $container = $('<div class="sn-docpreview-container"></div>').appendTo($pluginSubject);

            // Read options and fill in with defaults where necessary

            // Localization
            var SR = $.extend({
                toolbarNotes: 'Edit annotations',
                toolbarHighlight: 'Edit highlight',
                toolbarRedaction: 'Edit redaction',
                toolbarFirstPage: 'Go to first page',
                toolbarPreviousPage: 'Go to previous page',
                toolbarNextPage: 'Go to next page',
                toolbarLastPage: 'Go to last page',
                toolbarFitWindow: 'Fit document to viewer',
                toolbarFitHeight: 'Fit document to viewer height',
                toolbarFitWidth: 'Fit document to viewer width',
                toolbarZoomOut: 'Zoom out',
                toolbarZoomIn: 'Zoom in',
                toolbarPrint: 'Print the document',
                toolbarRubberBandZoom: 'Rubberband zoom',
                toolbarFullscreen: 'Switch to full screen mode',
                toolbarExitFullscreen: 'Exit full screen mode',
                toolbarShowShapes: 'Show document with shapes',
                toolbarHideShapes: 'Hide shapes',
                toolbarShowWatermark: 'Show document with watermark',
                toolbarHideWatermark: 'Hide watermark',
                toolbarBurn: 'Burn shapes',
                toolbarRotatePageLeft: 'Rotate current page left',
                toolbarRotatePageRight: 'Rotate current page right',
                toolbarRotateDocLeft: 'Rotate document left',
                toolbarRotateDocRight: 'Rotate document right',
                annotationDefaultText: 'Double click to edit text',
                page: 'Page',
                showThumbnails: 'Show thumbnails',
                deleteText: 'Delete',
                saveText: 'Save',
                cancelText: 'Cancel',
                originalSizeText: 'Original size',
                downloadText: 'Download',
                errorWithDrawingOnSelectedPage: 'Please click on the page where you want to draw!',
                otherPageIsSelected: 'Page is selected! Now you can draw on it!',
                otherPageIsSelectedRubberband: 'Page is selected! Now you can use the rubberband zoom on it!'
            }, options.SR);

            // Callbacks for various events
            var callbacks = $.extend({
                // Called when the document was opened,
                // ie. when this plugin was initialized
                documentOpened: null,

                // Called when the document is closed,
                // ie. when either the plugin is destroyed or the window is unloaded
                documentClosed: null,

                // Called after going to a different page of the document (parameter: page number)
                // NOTE: this is called when the user scrolls to a different page, or clicks a thumbnail, or when the viewer otherwise goes to a different page
                pageChanged: null,

                // Called after a context menu is shown
                contextMenuShown: null,

                // Called when the zoom level is changed
                zoomLevelChanged: null,

                //Called when an error occured
                viewerError: null,

                //Called when an error occured
                viewerWarning: null,

                //Called when an error occured
                viewerInfo: null,

                //Called when the document is modified
                documentChanged: null,

                //Called when rotation is started
                rotationStarted: null,

                //Called when rotation is ended
                rotationEnded: null,

                //Called when image loading is started
                loadingStarted: null,

                //Called when image loading is ended
                loadingEnded: null


            }, options.callbacks);

            // Other options
            var metadataHtml = options.metadataHtml || null;
            var showtoolbar = options.showtoolbar || false;
            var edittoolbar = options.edittoolbar || false;
            var showthumbnails = options.showthumbnails || false;
            var metadata = options.metadata || false;
            var isAdmin = options.isAdmin || false;
            var showShapes = options.showShapes || true;
            var title = options.title || "";
            var containerWidth = (typeof (options.containerWidth) === "function" ? options.containerWidth() : options.containerWidth) || $pluginSubject.width();
            var containerHeight = (typeof (options.containerHeight) === "function" ? options.containerHeight() : options.containerHeight) || $pluginSubject.height();
            var reactToResize = options.reactToResize === true ? true : false;
            var redrawInterval = options.redrawInterval || 20;
            var minZoomLevel = options.minZoomLevel || 0.5;
            var maxZoomLevel = options.maxZoomLevel || 2.5;
            var annotationDefaultText = options.annotationDefaultText || SR.annotationDefaultText;
            var pageMargin = options.pageMargin || 50;
            var filePath = options.filePath || null;
            var scale = options.defaultScale || 1;
            var imgWidth = options.imgWidth || 1240;
            var imgHeight = options.imgHeight || 1754;
            var customFunctions = options.functions || null;
            var maxpreview = parseInt(options.previewCount) || 0;
            var pageNum = options.pageNum || 1;
            var previewNumInTheSameTime = options.previewNumInTheSameTime || 3;
            var placeholderImgPath = options.placeholderImgPath || '/Root/Global/images/ajax-loader.gif';
            var fitContainer = options.fitContainer || false;
            var shapes = options.shapes || [];
            var pageAttributes = options.pageAttributes || [];
            var noWatermark = options.noWatermark || false;
            var iHeight = null;
            var addNoCachePostfix = options.addNoCachePostfix || false;
            var origWidth = imgWidth;
            var pageAttributesObj = [];
            var thumbnailWidth, thumbnailHeight;
            var firstLoad = false;
            var documentDegree = 0;
            var $ul, $thumbnailList;
            var ulWidth = containerWidth;
            var numberOfPagesForRotation = 0;
            var multipleRotation = false;


            // Get some values
            var currentpreview = maxpreview > 0 ? pageNum : 0;
            var currentpreviewWidth = 0;
            var editbuttons = {
                annotations: '<span title="' + SR.toolbarNotes + '"><span class="sn-icon sn-icon-notes" data-canvastype="annotation"></span></span>',
                highlights: '<span title="' + SR.toolbarHighlight + '"><span class="sn-icon sn-icon-highlight" data-canvastype="highlight"></span></span>',
                redaction: '<span title="' + SR.toolbarRedaction + '"><span class="sn-icon sn-icon-redaction" data-canvastype="redaction"></span></span>',
                pager: '<div class="sn-pager">\
                            <span title="' + SR.toolbarFirstPage + '"><span class="sn-icon sn-icon-firstpage"></span></span>\
                            <span title="' + SR.toolbarPreviousPage + '"><span class="sn-icon sn-icon-prev"></span></span>\
                            <input class="sn-input-jumptopage" value="' + currentpreview + '" />\
                            <span class="pagenumber"><span id="docpreviewpage"> / ' + maxpreview + '</span></span>\
                            <span title="' + SR.toolbarNextPage + '" ><span class="sn-icon sn-icon-next"></span></span>\
                            <span title="' + SR.toolbarLastPage + '"><span class="sn-icon sn-icon-lastpage"></span></span>\
                        </div>',
                rotation: '<div class=sn-viewer-rotate>\
                             <span title="' + SR.toolbarRotatePageLeft + '"><span class="sn-icon sn-icon-rotateleft"></span></span>\
                            <span title="' + SR.toolbarRotatePageRight + '"><span class="sn-icon sn-icon-rotateright"></span></span>\
                            <span title="' + SR.toolbarRotateDocLeft + '"><span class="sn-icon sn-icon-rotatedocleft"><span class="sn-icon-overlay"></span></span></span>\
                            <span title="' + SR.toolbarRotateDocRight + '"><span class="sn-icon sn-icon-rotatedocright"><span class="sn-icon-overlay"></span></span></span>\
                            </div>',
                fittowindow: '<span title="' + SR.toolbarFitWindow + '"><span class="sn-icon sn-icon-fittowindow"></span></span>',
                fittowidth: '<span title="' + SR.toolbarFitWidth + '"><span class="sn-icon sn-icon-fittowidth"></span></span>',
                fittoheight: '<span title="' + SR.toolbarFitHeight + '"><span class="sn-icon sn-icon-fittoheight"></span></span>',
                fullscreen: '<span title="' + SR.toolbarFullscreen + '"><span class="sn-icon sn-icon-fullscreen"></span></span>',
                rubberbandzoom: '<span title="' + SR.toolbarRubberBandZoom + '"><span class="sn-icon sn-icon-rubberband" id="sn-rubberband"></span></span>',
                zoomout: '<span title="' + SR.toolbarZoomOut + '"><span class="sn-icon sn-icon-zoomout" ></span></span>',
                zoomin: '<span title="' + SR.toolbarZoomIn + '"><span class="sn-icon sn-icon-zoomin" ></span></span>',
                originaldocument: '<span title="' + SR.toolbarHideShapes + '"><span class="sn-icon sn-icon-original"></span></span>',
                editeddocument: '<span title="' + SR.toolbarShowShapes + '"><span class="sn-icon sn-icon-edited"></span></span>',
                originalsize: '<span title="' + SR.originalSizeText + '"><span class="sn-icon sn-icon-originalsize"></span></span>'
            };

            // Variables for the plugin
            var allshapes = {
                redaction: [],
                highlight: [],
                annotation: []
            };
            var saveableshapes = {
                redaction: [],
                highlight: [],
                annotation: []
            };
            var mouseover = false; var touched = false;
            var msie8 = false;
            var agentStr = navigator.userAgent;
            if (agentStr.indexOf("Trident/4.0") > -1) { msie8 = true; }
            var touch = false;
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|BB10/i.test(navigator.userAgent))
                touch = true;
            if (touch)
                $('body').addClass('touch');
            var mySel = null;
            var mySelColor = '#007dc6';
            var mySelWidth = 2;
            var mySelBoxColor = '007dc6';
            var mySelBoxSize = 6;
            var isDrag = false;
            var isResizeDrag = false;
            var selectionHandles = [];
            var canvasValid = false;
            var shapeIndex = null;
            var contexts = {};
            var expectResize = 0;
            var rmx, rmy, rmstart;
            var canvasType;
            var editmode = false;
            var shapesAreShowing = showShapes;
            var $imagecontainer, $metadatacontainer, $docpreview, $toolbarContainer;
            var started = false;
            var x0, y0;
            var unsaved = false;
            var pages = []; var hpages = []; var thumbnails = []; var hthumbnails = []; var existingPages = [];
            var lastPosition = 0;
            var timer;
            var firstInit = true;
            var jumpDistance = 1;

            // Initializes the plugin - constructs the basic elements
            function initializeDocViewerPlugin() {

                parseShapesJson(shapes);

                parsePageAttributesJson(pageAttributes);

                if (pageAttributesObj.allValuesSame() && typeof pageAttributesObj[0] !== 'undefined') {
                    documentDegree = pageAttributesObj[0].options.degree;
                }

                $container.html("");
                if (maxpreview !== 0)
                    $imagecontainer = $('<div class="image-container"></div>');
                else {
                    $imagecontainer = $('<div class="image-container"><div class="no-preview">' + options.SR.noPreview + '</div></div>');
                    $('.sn-docpreview-container').addClass('empty');
                }

                $metadatacontainer = $();
                $docpreview = $('<div class="sn-docpreview-desktop docpreview" id="docpreview"><div class="zoomer" id="zoomr"><ul></ul></div></div>');
                $toolbarContainer = $();
                $imagecontainer.appendTo($container);

                if (!metadata && !showthumbnails) {
                    $imagecontainer.width('100%');
                }
                if (showtoolbar) {
                    $toolbarContainer = $('<div class="sn-docviewer-tools"></div>');
                    $toolbarContainer.appendTo($imagecontainer);
                    createToolbar();
                }
                if (metadata || showthumbnails) {
                    $metadatacontainer = $('<div class="metadatas"></div>');
                    $metadatacontainer.appendTo($container);
                }
                if (showthumbnails) {
                    if (maxpreview !== '0')
                        $metadatacontainer.append('<div class="sn-doc-thumbnails"></div></div>');
                    else
                        $metadatacontainer.append('<div class="sn-doc-thumbnails"><div class="no-thumbnail">No thumbnail!</div></div>');
                }
                if (metadata) {
                    $metadatacontainer.append(metadataHtml);
                }

                $container.append('<div style="clear:both;height:1px;">&nbsp;</div>');
                var wi = containerWidth;
                if (window.innerWidth < 800)
                    wi = $docpreview.parent().width;
                else if (!showthumbnails && !metadata)
                    wi = $container.width();
                $docpreview.width(wi).height(containerHeight).on('contextmenu.snDocViewer', function () { return false; }).appendTo($imagecontainer);
                var $imageList = $('ul', $docpreview);

                if (typeof (options.getExistingPreviewImages) === "function") {
                    options.getExistingPreviewImages().done(function (data) {

                        existingPages = data;
                        if (showthumbnails) {
                            $('.sn-doc-thumbnails').append('<ul></ul>');
                            $thumbnailList = $('ul', $('.sn-doc-thumbnails'));


                            createThumbnailContainersOnInterval(data, $thumbnailList);
                        }


                        //if (pageNum <= maxpreview && pageNum > 0) {

                        createImageContainersOnInterval(data, $imageList);
                        getDeletableAndLoadableCanvases(1, data);
                        if ((ulWidth - 240) < data[0].Width)
                            ulWidth = data[0].Width + 240;

                        $docpreview.find('ul').width(ulWidth);
                        firstLoad = 0;
                        //getDeletableAndLoadableImages(pageNum);
                        //    if (showthumbnails)
                        //        createThumbnailContainersOnInterval(data, $thumbnailList);
                        //}

                        $(window).on("unload.snDocViewer_" + docViewerId, function (e) {
                            // Call document closed callback
                            callbacks.documentClosed && callbacks.documentClosed();
                        });

                        $docpreview.hover(function () {
                            mouseover = true;
                        }, function () {
                            mouseover = false;
                        });

                        $docpreview.on('touchstart', function (e) {
                            touched = true;
                        });

                        if (reactToResize) {
                            var onResized = function () {
                                var isFullscreen = dataObj.isFullscreen();

                                //window resize delay
                                setTimeout(function () {
                                    if (isFullscreen) {
                                        // In fullscreen mode
                                        containerHeight = $(window).height() - $docpreview.offset().top;
                                        containerWidth = $(window).width();
                                    }
                                    else {
                                        // In normal (non-fullscreen) mode
                                        containerHeight = (typeof (options.containerHeight) === "function" ? options.containerHeight() : options.containerHeight) || $pluginSubject.height();
                                        containerWidth = (typeof (options.containerWidth) === "function" ? options.containerWidth() : options.containerWidth) || $pluginSubject.width();
                                    }
                                    $docpreview.width(containerWidth).height(containerHeight);
                                }, 300);
                            };
                            $(window).on("resize.snDocViewer_" + docViewerId, onResized);
                            // Resize on tablets
                            $(window).on("orientationchange.snDocViewer_" + docViewerId, onResized);
                        }
                        // Call document opened callback
                        callbacks.documentOpened && callbacks.documentOpened();

                        if (scale !== 1 && scale <= maxZoomLevel && scale >= minZoomLevel && !touch) {
                            setZoomLevel(scale);
                        }



                        if (touch) {

                            var rate = containerWidth / imgWidth;
                            if (!fitContainer)
                                rate = scale;

                            scale = rate;

                            $('.docpreview').ready(function () {

                                var rate = $('body').width() / imgWidth;

                                var myScroll = new IScroll('#docpreview', {
                                    zoom: true,
                                    scrollX: true,
                                    scrollY: true,
                                    mouseWheel: true,
                                    zoomMin: minZoomLevel,
                                    zoomMax: maxZoomLevel,
                                    startZoom: rate
                                });

                                enterFullscreenMode(currentpreview);

                                myScroll.on('scrollEnd', updatePosition);

                                $('.sn-icon-originalsize').on('click', function () {
                                    myScroll.zoom(1);
                                });

                                $('.sn-icon-fittowindow').on('click', function () {
                                    var containerWidth, fitToWidthScale;
                                    containerWidth = myScroll.wrapperWidth;
                                    fitToWidthScale = (containerWidth / imgWidth).toFixed(2);
                                    myScroll.zoom(fitToWidthScale);
                                });


                            });

                        }

                        $docpreview.scrollTop(0);

                        unsaved = false;

                        $docpreview.scroll($.debounce(500, function () {
                            if ($('.sn-docpreview-desktop:hover').length !== 0) {
                                setPageAccordingToScroll(true);
                            }
                        }));

                        $('.sn-doc-thumbnails').scroll($.debounce(250, function () {
                            scrollThumbnails();
                        }));

                        $('.sn-docviewer-page').on('click.snDocViewer', myClick);

                        $thumbnailList.on('click.snDocViewer', '.sn-thumbnail-page', function () {
                            if ($(this).children('img').attr('data-loaded') === "true") {
                                var thumbnailNum = parseInt($(this).attr('data-page'));
                                removeAllContextMenu();

                                if (newPage(thumbnailNum)) {
                                    demandNewPage(thumbnailNum);
                                    setDataTops(thumbnailNum);
                                }

                                getDeletableAndLoadableCanvases(thumbnailNum);
                                SetPreviewControls(thumbnailNum);
                            }
                        });
                        fitToWidth(data[0].Width);
                    });
                }
            }

            function wholeDocumentRotated() {
                var wholeDocRotationDegrees = 0;
                var degrees = [0, 90, -90, 180];
                for (var i = 0; i < degrees.length; i++) {
                    if ($('.sn-docviewer-page').length === $('.sn-docviewer-page.rotated').length && $('.sn-docviewer-page[data-degree="' + degrees[i] + '"]').length === $('.sn-docviewer-page').length) {
                        wholeDocRotationDegrees = degrees[i];
                    }
                }

                return wholeDocRotationDegrees;
            }

            function createImageContainersOnInterval(data, $imageList) {
                var orientation = 'portrait';

                displayImage(data[0], $imageList, orientation);
                callbacks.loadingStarted && callbacks.loadingStarted();

                $('#imageContainer1 img').imageLoad(function () {
                    if (!multipleRotation) {
                        callbacks.loadingEnded && callbacks.loadingEnded();
                        if ($('.sn-docviewer-page[data-page="2"]').length === 0) {
                            $.each(data, function (i, item) {
                                if (i > 0 && i < 10) {
                                    displayImage(item, $imageList, orientation);
                                }
                            });
                        }
                    }
                });

            }

            function displayImage(item, $imageList, orientation) {
                if (item.Width > item.Height)
                    orientation = 'landscape';

                var path = item.PreviewAvailable;

                path = appendPreviewPostfix(path, !noWatermark, addNoCachePostfix);

                var $li = $('<li class="sn-docviewer-page ' + orientation + '" id="imageContainer' + item.Index + '" data-page="' + item.Index + '" data-width="' + item.Width + '" data-height="' + item.Height + '"><img src="' + path + '" data-loaded="true" /></li>');
                // $li.insertIndex(ind, $imageList);

                $imageList.append($li);

                $li.css({
                    'width': item.Width + 240,
                    'height': item.Height
                });

                var ind = pageIsRotated(item.Index);
                if (ind > -1) {
                    var newDegree = parseInt(pageAttributesObj[ind].options.degree);
                    multipleRotation = false;
                    rotate(newDegree, item.Index, false, true);
                    rotateThumbnail(newDegree, item.Index);
                    saveRotation(item.Index, newDegree);
                }

                resizeListItemContainers();
                //fitToWidth();

                $('#imageContainer' + item.Index + ' img').imageLoad(function () {
                    setPageMargins(item.Index);
                    setDataTops(item.Index);
                });
            }

            function setPageMargins(p) {
                var $that = $('#imageContainer' + p);
                var leftMargin = Math.abs(ulWidth - $that.width()) / 2;
                $that.css({ 'margin': '0px auto 50px' });
            }

            function createThumbnailContainersOnInterval(data) {
                $.each(data, function (i, item) {
                    if (i < 10)
                        displayThumbnail(item.Index, item.PreviewAvailable, item.Width, item.Height);
                });
            }

            function updatePosition() {
                var scale = myScroll.scale;
                var itemHeight = $('.sn-docviewer-page').height() * scale;
                var outer = myScroll.y;
                var pNum;
                if (outer !== 0 && itemHeight !== 0)
                    pNum = -1 * (parseInt(Math.round(outer / itemHeight)));
                else
                    pNum = 0;

                if (pNum > -1 && pNum < maxpreview) {
                    pNum = pNum + 1;
                }
                if (pNum > maxpreview)
                    pNum = maxpreview;

                getDeletableAndLoadableCanvases(pNum);

                if (pNum) {
                    $('#docpreviewpage').text(pNum);
                    currentpreview = pNum;
                    currentpreviewWidth = $('#imageContainer' + pNum).attr('data-width');
                }
                else { $('#docpreviewpage').text(0); }

                $thumbnailList.children('li').removeClass('active');
                $thumbnailList.children('li[data-page="' + currentpreview + '"]').addClass('active');
            }

            function scrollThumbnails() {

                var containerWidth = $('.sn-doc-thumbnails').width();
                var containerHeight = $('.sn-doc-thumbnails').height();
                var orientation, scrollPosition, thumbnailNum;
                if (containerWidth > containerHeight) {
                    var itemWidth = 115; // 90 + 20 img width + its margin
                    scrollPosition = $('.sn-doc-thumbnails ul').position().left - 17;
                    thumbnailNum = parseInt(Math.abs(scrollPosition / itemWidth)) + 1;
                    orientation = 'h';
                }
                else {
                    var itemHeight = 160;
                    scrollPosition = $('.sn-doc-thumbnails ul').position().top;
                    thumbnailNum = parseInt(Math.abs(scrollPosition / itemHeight)) + 1;
                    orientation = 'v';
                }

                var lastThumbnail = parseInt($('.sn-thumbnail-page').last().attr('data-page'));

                if (newPage(lastThumbnail + 1)) {
                    if ((lastThumbnail + 1) === maxpreview) {
                        demandNewPage((lastThumbnail + 1), false);
                        setDataTops(lastThumbnail + 1);
                    }
                    else {
                        demandNewPage((lastThumbnail + 1), false);
                        setDataTops(lastThumbnail + 1);
                    }
                }

                lastPosition = scrollPosition;
            }

            function createToolbar() {
                if (showtoolbar && edittoolbar && isAdmin && !touch) {
                    $toolbarContainer.append('<div class="sn-additional-tools">' + editbuttons.annotations + editbuttons.highlights + editbuttons.redaction + '</div>');
                }
                $toolbarContainer.append('<div class="sn-paging-tools"><div class="sn-doc-title" title="' + title + '"><h1>' + title + '</h1></div><div class="sn-pager">' + editbuttons.pager + '</div></div>');

                if (showShapes) {
                    $toolbarContainer.append('<div class="sn-zooming-tools">' + editbuttons.rotation + editbuttons.originalsize + editbuttons.fittowindow + editbuttons.fittoheight + editbuttons.fittowidth + editbuttons.zoomout + editbuttons.zoomin + editbuttons.rubberbandzoom + editbuttons.fullscreen + editbuttons.originaldocument + '</div>');
                }
                else {
                    $toolbarContainer.append('<div class="sn-zooming-tools">' + editbuttons.rotation + editbuttons.originalsize + editbuttons.fittowindow + editbuttons.fittoheight + editbuttons.fittowidth + editbuttons.zoomout + editbuttons.zoomin + editbuttons.rubberbandzoom + editbuttons.fullscreen + editbuttons.editeddocument + '</div>');
                }

                function adminbutton(name, disabled) {
                    this.name = name;
                    this.disable = disabled;
                }

                var admintoolbar = [];
                var $admintoolbar = $('.sn-additional-tools');
                $admintoolbar.find('span.sn-icon').each(function (i) {
                    var that = $(this);
                    var name = that.attr('data-canvastype');
                    var disabled = false;
                    var attr = that.attr('disabled');
                    if (typeof attr !== typeof undefined && attr !== false)
                        disabled = true;
                    admintoolbar[i] = new adminbutton(name, disabled);
                });

                if (customFunctions) {
                    $.each(customFunctions, function (i, item) {
                        if (touch && item.touch === true || !touch) {
                            var $button = $('<span title="' + item.title + '">' + item.icon + '</span>');
                            if (item.type === 'dataRelated') {
                                if (typeof item.permission !== 'undefined' && item.permission)
                                    $('.sn-zooming-tools').append($button);
                                if (typeof item.permission === 'undefined')
                                    $('.sn-zooming-tools').append($button);
                            }
                            if (item.type === 'drawingRelated') {
                                if (typeof item.permission !== 'undefined' && item.permission)
                                    $('.sn-additional-tools').append($button);
                                if (typeof item.permission === 'undefined')
                                    $('.sn-additional-tools').append($button);
                            }
                            $button.on('click', item.action);
                        }
                    });
                }

                $toolbarContainer.on('click.snDocViewer', '.sn-icon-notes', function () {
                    var attr = $(this).attr('disabled');
                    if (!(typeof attr !== typeof undefined && attr !== false)) {
                        clearMenuSelection($(this));
                        initializeCanvasFeature("annotation");
                    }
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-highlight', function () {
                    var attr = $(this).attr('disabled');
                    if (!(typeof attr !== typeof undefined && attr !== false)) {
                        clearMenuSelection($(this));
                        initializeCanvasFeature("highlight");
                    }
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-redaction', function () {
                    var attr = $(this).attr('disabled');
                    if (!(typeof attr !== typeof undefined && attr !== false)) {
                        clearMenuSelection($(this));
                        initializeCanvasFeature("redaction");
                    }
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-firstpage', function () {
                    removeAllContextMenu();
                    getDeletableAndLoadableCanvases(1);
                    SetPreviewControls(1);
                    scrollToThumbnail(1);
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-prev', function () {
                    removeAllContextMenu();
                    if (currentpreview !== 1) {
                        getDeletableAndLoadableCanvases(currentpreview - 1);
                        SetPreviewControls(currentpreview - 1);
                        scrollToThumbnail(currentpreview);
                        if (newPage(currentpreview)) {
                            demandNewPage(currentpreview);
                            setDataTops(currentpreview);
                        }
                    }
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-next', function () {
                    removeAllContextMenu();
                    if (currentpreview !== maxpreview && $('.sn-docviewer-page[data-page="' + (currentpreview + 1) + '"] img').attr('data-loaded') === "true") {
                        getDeletableAndLoadableCanvases(currentpreview + 1);
                        SetPreviewControls(currentpreview + 1);
                        scrollToThumbnail(currentpreview);
                        if (newPage(currentpreview + 2) && (currentpreview + 2) <= maxpreview) {
                            demandNewPage(currentpreview + 2);
                            setDataTops(currentpreview + 2);
                        }
                    }
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-lastpage', function () {
                    removeAllContextMenu();
                    if (newPage(maxpreview)) {
                        for (var i = (currentpreview + 1) ; i < (maxpreview + 1) ; i++) {
                            if (newPage(i)) {
                                if (i === maxpreview) {
                                    demandNewPage(i, true);
                                    setDataTops(i);
                                }
                                else {
                                    demandNewPage(i, false);
                                    setDataTops(i);
                                }
                            }
                        }
                        $('.sn-doc-thumbnails li').removeClass('active');
                        $('.sn-doc-thumbnails li[data-page="' + maxpreview + '"]', $container).addClass('active');
                        $docpreview.scrollTop(1000000);
                        scrollToThumbnail(maxpreview);
                    }
                    else {
                        getDeletableAndLoadableCanvases(maxpreview);
                        SetPreviewControls(maxpreview, false);
                        scrollToThumbnail(maxpreview);
                    }
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-originalsize', function () {
                    clearMenuSelection();
                    if (!touch) {
                        setZoomLevel(1);
                        fitPreviewsToLeftEdge(false, false, currentpreviewWidth);
                    }
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-fittowidth', function () {
                    removeAllContextMenu();
                    if (!touch)
                        fitToWidth(currentpreviewWidth);
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-fittoheight', function () {
                    removeAllContextMenu();
                    fitToHeight();
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-fittowindow', function () {
                    removeAllContextMenu();
                    if (!touch)
                        fitToWindow();
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-rubberband', function () {
                    var $this = $(this);

                    if ($this.hasClass('active')) {
                        clearMenuSelection();
                        setZoomLevel(1);
                        return;
                    }

                    clearMenuSelection($this);
                    editmode = false;
                    isDrag = false;

                    var $technicalcanvas = $('canvas.technical-canvas');
                    $technicalcanvas.off('mousedown.snDocViewer').off('mousemove.snDocViewer').off('mouseup.snDocViewer');
                    $technicalcanvas.on('mousedown.snDocViewer', drawRectangle).on('mousemove.snDocViewer', drawRectangleMove).on('mouseup.snDocViewer', function (e) {
                        if (parseInt($(this).closest('.sn-docviewer-page').attr('data-page')) === currentpreview) {
                            rubberBandZoom.call(this, e);
                            $technicalcanvas.off('mousedown.snDocViewer');
                            $technicalcanvas.off('mousemove.snDocViewer');
                            $technicalcanvas.css({ 'cursor': 'default' });
                        }
                        else {
                            callbacks.viewerInfo && callbacks.viewerInfo(SR.otherPageIsSelectedRubberBand);
                            var $currentPage = $('.sn-docviewer-page[data-page="' + currentpreview + '"]');
                            var technicalctx = $currentPage.find('.technical-canvas')[0].getContext('2d');
                            clear(technicalctx);
                            $('.sn-icon-rubberband', $toolbarContainer).removeClass('active');
                            started = false;
                            $technicalcanvas.off('mousedown.snDocViewer');
                            $technicalcanvas.off('mousemove.snDocViewer');
                            $technicalcanvas.css({ 'cursor': 'default' });
                        }
                    });
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-zoomout', function () {
                    removeAllContextMenu();
                    $('.sn-icon-rubberband', $toolbarContainer).removeClass('active');
                    if (scale >= minZoomLevel) {
                        setZoomLevel(scale - 0.1);
                    }
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-zoomin', function () {
                    removeAllContextMenu();
                    $('.sn-icon-rubberband', $toolbarContainer).removeClass('active');
                    if ((scale + 0.1) <= maxZoomLevel) {
                        setZoomLevel(scale + 0.1);
                    }
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-fullscreen', function () {

                    removeAllContextMenu();
                    var $this = $(this);
                    if ($this.hasClass('normalscreen')) {
                        exitFullscreenMode(currentpreview);
                    }
                    else {
                        enterFullscreenMode(currentpreview);
                    }
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-original', function () {
                    var $this = $(this);
                    clearMenuSelection($this);
                    removeAllContextMenu();
                    $('.sn-additional-tools', $toolbarContainer).hide();
                    $this.removeClass('sn-icon-original').addClass('sn-icon-edited').attr('title', SR.toolbarShowShapes);
                    $('canvas', $container).hide();
                    editmode = false;
                    shapesAreShowing = false;

                    clearInterval(mainDraw);
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-edited', function () {
                    clearMenuSelection();
                    removeAllContextMenu();
                    var $this = $(this);
                    if (!msie8) {
                        $('.sn-additional-tools', $toolbarContainer).show();
                    }
                    $this.removeClass('sn-icon-edited').addClass('sn-icon-original').attr('title', SR.toolbarHideShapes);

                    $container.find("canvas").show();
                    if (!isAdmin) {
                        $container.find("canvas.redaction-canvas").hide();
                    }

                    shapesAreShowing = true;
                    clearInterval(mainDraw);
                    setInterval(mainDraw, redrawInterval);
                });

                $toolbarContainer.on('keyup.snDocViewer', '.sn-input-jumptopage', function (e) {
                    if (e.keyCode === 13) {
                        var pageNum = parseInt($(this).val());
                        if (pageNum < (maxpreview + 1) && pageNum > 0) {
                            removeAllContextMenu();
                            if (newPage(pageNum)) {
                                for (var i = (currentpreview + 1) ; i < (pageNum + 1) ; i++) {
                                    if (newPage(i)) {
                                        if (i === pageNum) {
                                            demandNewPage(i, true);
                                            setDataTops(i);
                                        }
                                        else {
                                            demandNewPage(i, false);
                                            setDataTops(i);
                                        }
                                    }
                                }
                                $('.sn-doc-thumbnails li').removeClass('active');
                                $('.sn-doc-thumbnails li[data-page="' + pageNum + '"]', $container).addClass('active');
                                scrollToThumbnail(pageNum);
                            }
                            else {
                                getDeletableAndLoadableCanvases(pageNum);
                                SetPreviewControls(pageNum, false);
                                scrollToThumbnail(pageNum);
                            }
                        }
                        else if (pageNum > maxpreview) {
                            removeAllContextMenu();
                            if (newPage(maxpreview)) {
                                for (var i = (currentpreview + 1) ; i < (maxpreview + 1) ; i++) {
                                    if (newPage(i)) {
                                        demandNewPage(i, true);
                                        setDataTops(i);
                                    }
                                }
                                $('.sn-doc-thumbnails li').removeClass('active');
                                $('.sn-doc-thumbnails li[data-page="' + maxpreview + '"]', $container).addClass('active');
                                scrollToThumbnail(maxpreview);
                            }
                            else {
                                getDeletableAndLoadableCanvases(maxpreview);
                                SetPreviewControls(maxpreview, false);
                                scrollToThumbnail(maxpreview);
                            }
                        }
                        else if (pageNum < 1) {
                            removeAllContextMenu();
                            jumpDistance = Math.abs(1 - currentpreview);
                            getDeletableAndLoadableCanvases(1);
                            SetPreviewControls(1);
                        }
                        e.preventDefault();
                    }
                });
                $toolbarContainer.on('keypress.snDocViewer', '.sn-input-jumptopage', function (e) {
                    var theEvent = e || window.event;
                    var key = theEvent.keyCode || theEvent.which;
                    key = String.fromCharCode(key);
                    var regex = /[0-9]|\./;
                    if (!regex.test(key)) {
                        theEvent.returnValue = false;
                        if (theEvent.preventDefault) theEvent.preventDefault();
                    }
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-rotateleft', function () {
                    var $button = $(this);
                    callbacks.rotationStarted && callbacks.rotationStarted($button);
                    var currentDegree = 0;
                    if (typeof $('.sn-docviewer-page[data-page="' + currentpreview + '"]').attr('data-degree') !== 'undefined')
                        currentDegree = parseInt($('.sn-docviewer-page[data-page="' + currentpreview + '"]').attr('data-degree'));
                    var newDegree = computeDegree(currentDegree, -90);
                    multipleRotation = false;
                    rotate(newDegree, currentpreview, false);
                    rotateThumbnail(newDegree, currentpreview);
                    saveRotation(currentpreview, newDegree);
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-rotateright', function () {
                    var $button = $(this);
                    callbacks.rotationStarted && callbacks.rotationStarted($button);
                    var currentDegree = 0;
                    if (typeof $('.sn-docviewer-page[data-page="' + currentpreview + '"]').attr('data-degree') !== 'undefined')
                        currentDegree = parseInt($('.sn-docviewer-page[data-page="' + currentpreview + '"]').attr('data-degree'));
                    var newDegree = computeDegree(currentDegree, 90);
                    multipleRotation = false;
                    rotate(newDegree, currentpreview, false);
                    rotateThumbnail(newDegree, currentpreview, false);
                    saveRotation(currentpreview, newDegree);
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-rotatedocleft', function () {
                    var $button = $(this);
                    callbacks.rotationStarted && callbacks.rotationStarted($button);
                    documentDegree = computeDegree(documentDegree, -90);
                    $('.sn-docviewer-page').each(function () {
                        numberOfPagesForRotation += 1;
                        var currentPageNum = parseInt($(this).attr('data-page'));
                        var currentDegree = documentDegree;
                        if (typeof $('.sn-docviewer-page[data-page="' + currentPageNum + '"]').attr('data-degree') !== 'undefined')
                            currentDegree = computeDegree(parseInt($('.sn-docviewer-page[data-page="' + currentPageNum + '"]').attr('data-degree')), -90);
                        multipleRotation = true;
                        rotate(currentDegree, currentPageNum, true);
                        rotateThumbnail(currentDegree, currentPageNum);
                    });
                    for (var i = 1; i < maxpreview + 1; i++) {
                        saveRotation(i, documentDegree);
                    }
                    //fitToWidth();
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-rotatedocright', function () {
                    var $button = $(this);
                    callbacks.rotationStarted && callbacks.rotationStarted($button);
                    documentDegree = computeDegree(documentDegree, 90);
                    $('.sn-docviewer-page').each(function () {
                        numberOfPagesForRotation += 1;
                        var currentPageNum = parseInt($(this).attr('data-page'));
                        var currentDegree = documentDegree;
                        if (typeof $('.sn-docviewer-page[data-page="' + currentPageNum + '"]').attr('data-degree') !== 'undefined')
                            currentDegree = computeDegree(parseInt($('.sn-docviewer-page[data-page="' + currentPageNum + '"]').attr('data-degree')), 90);
                        multipleRotation = true;
                        rotate(currentDegree, currentPageNum, true);
                        rotateThumbnail(currentDegree, currentPageNum);
                    });
                    for (var i = 1; i < maxpreview + 1; i++) {
                        saveRotation(i, documentDegree);
                    }
                    //fitToWidth();
                });
            }

            function newPage(ind) {
                return $('li.sn-docviewer-page[data-page="' + ind + '"]').length === 0;
            }

            function demandNewPage(ind, jump) {
                if (ind <= maxpreview) {
                    var $li = $('<li class="sn-docviewer-page" id="imageContainer' + ind + '" data-page="' + ind + '" data-top="0"><img src="' + placeholderImgPath + '" data-loaded="false" data-top="0" /></li>').appendTo($ul);
                    var $thumbnail = $('<li class="sn-thumbnail-page" data-page="' + ind + '"><img src="' + placeholderImgPath + '" data-loaded="false" /><span>Page ' + ind + '</span></li>').appendTo($thumbnailList);
                    displayNewPage(ind, $li, $thumbnail, jump);
                }
            }

            function displayNewPage(ind, $li, $thumbnail, jump) {

                if (typeof (options.getImage) === "function") {
                    var $img = $li.children('img');
                    options.getImage(ind).done(function (data) {
                        if (typeof data !== 'undefined') {
                            var page = data;
                            page.Index = ind;
                            existingPages.push(page);

                            var path = appendPreviewPostfix(page.PreviewAvailable, dataObj.isWatermarked(), addNoCachePostfix);
                            $img.attr('src', path);
                            $img.attr('data-loaded', true);

                            var thumbnailPath = data.PreviewAvailable.substring(0, data.PreviewAvailable.lastIndexOf("/") + 1) + 'thumbnail' + ind + '.png';

                            var that = $('.sn-thumbnail-page[data-page="' + ind + '"] img');
                            thumbnailPath = appendPreviewPostfix(thumbnailPath, dataObj.isWatermarked(), addNoCachePostfix);
                            that.attr('data-loaded', true);
                            that.attr('src', thumbnailPath);

                            $li.css({
                                'width': data.Width + 240,
                                'height': data.Height,
                                'margin': '0 auto ' + pageMargin + 'px auto'
                            });

                            $li.attr('data-top', getTopOfThePage(ind));
                            $li.attr('data-width', data.Width);
                            $li.attr('data-height', data.Height);

                            var twidth = '105px'; var theight = '150px';

                            if (data.Width > data.Height) {
                                twidth = '120px';
                                theight = '100px';
                            }
                            $thumbnail.css({
                                'margin-right': '20px',
                                'width': twidth,
                                'height': theight
                            });

                            $thumbnail.find('img').css({ 'margin': '0px auto;width:90%' })

                            var cwidth = 95;
                            var cheight = 130;

                            

                            $thumbnail.attr('data-width', cwidth).attr('data-height', cheight)
                            if (data.Width > data.Height)
                                $thumbnail.attr('data-width', cheight).attr('data-height', cwidth)

                            if (jump)
                                SetPreviewControls(ind, false);

                            var index = pageIsRotated(ind);
                            if (index > -1) {
                                var newDegree = parseInt(pageAttributesObj[index].options.degree);
                                multipleRotation = false;
                                rotate(newDegree, ind, false);
                                rotateThumbnail(newDegree, ind);
                                saveRotation(ind, newDegree);
                            }


                            if ((ulWidth - 240) < data.Width) {
                                ulWidth = data.Width + 240;
                                $ul.width(ulWidth).css('width', ulWidth);
                                fitPreviewsToLeftEdge(dataObj.isFullscreen(), false, currentpreviewWidth);
                            }

                            $docpreview.on('click.snDocViewer', '.sn-docviewer-page', function () {
                                if ($(this).children('img').attr('data-loaded') === 'true' && parseInt($(this).attr('data-page')) !== currentpreview) {
                                    var pNum = parseInt($(this).attr('data-page'));
                                    removeAllContextMenu();

                                    getDeletableAndLoadableCanvases(pNum);
                                    SetPreviewControls(pNum, true);
                                }
                            });

                            $thumbnail.on('click.snDocViewer', function () {
                                if ($(this).attr('data-loaded') === 'true') {
                                    var thumbnailNum = parseInt($(this).attr('data-page'));
                                    removeAllContextMenu();

                                    if (newPage(pageNum)) {
                                        demandNewPage(pageNum);
                                        setDataTops(pageNum);
                                    }

                                    getDeletableAndLoadableCanvases(thumbnailNum);
                                    SetPreviewControls(thumbnailNum);
                                }
                            });


                            if (documentDegree !== 0) {
                                multipleRotation = false;
                                rotate(documentDegree, page.Index, false);
                                rotateThumbnail(documentDegree, page.Index, false);
                            }

                            //getDeletableAndLoadableCanvases(pageNum);
                        }
                    });

                }
            }

            function pageIsRotated(p) {
                var ind = -1;
                for (var i = 0; i < pageAttributesObj.length; i++) {
                    if (parseInt(pageAttributesObj[i].pageNum) === p)
                        ind = i;
                }
                return ind;
            }

            function getTopOfThePage(ind) {
                var $prev = $('.sn-docviewer-page[data-page="' + (ind - 1) + '"]').first();
                return parseInt($prev.attr('data-top')) + $prev.height() + 50;
            }

            function scrollToThumbnail(p) {
                var thumbnailContainerOrientation, position;
                if ($('.sn-doc-thumbnails').width() > $('.sn-doc-thumbnails').height()) { thumbnailContainerOrientation = 'landscape'; }
                else { thumbnailContainerOrientation = 'portrait'; }

                if (thumbnailContainerOrientation === 'portrait') {
                    var pos = 1;
                    if (p !== 1)
                        pos = p - 1;

                    position = $('.sn-thumbnail-page[data-page="' + pos + '"]').position().top - $('.sn-doc-thumbnails ul').position().top;

                    if (dataObj.isFullscreen())
                        $('.sn-doc-thumbnails ul').scrollTop($('.sn-thumbnail-page[data-page="' + pos + '"]').offset().top - $('.sn-doc-thumbnails ul').offset().top + $('.sn-doc-thumbnails ul').scrollTop());
                    else
                        $('.sn-doc-thumbnails').animate({ scrollTop: position });
                }
                else {
                    position = $('.sn-thumbnail-page[data-page="' + p + '"]').position().left - $('.sn-doc-thumbnails ul').position().left;
                    if (dataObj.isFullscreen())
                        $('.sn-doc-thumbnails').animate({ scrollLeft: position });
                    else
                        $('.sn-doc-thumbnails').animate({ scrollLeft: position });
                }
            }

            function setPageAccordingToScroll(scrolling) {
                var pageNum = parseInt(getCurrentPage());

                if (!isNaN(parseInt(pageNum)) && parseInt(pageNum) <= maxpreview && scrolling) {
                    // if (pageMustBeRequested(pageNum)) {

                    if ((pageNum + 1) <= maxpreview && pageNum === parseInt($('.sn-docviewer-page').last().attr('data-page')) || $docpreview.scrollTop() + $docpreview.innerHeight() >= $docpreview[0].scrollHeight) {
                        pageNum = parseInt($('.sn-docviewer-page').last().attr('data-page'));
                        if (newPage(pageNum + 1)) {
                            var pNum = pageNum + 1;
                            demandNewPage(pNum);
                            setDataTops(pNum);
                            SetPreviewControls(pageNum, true);
                            $('.sn-doc-thumbnails li').removeClass('active');
                            $('.sn-doc-thumbnails li[data-page="' + pageNum + '"]', $container).addClass('active');
                            scrollToThumbnail(pageNum);
                        }
                    }
                    else if (scrolling) {

                        getDeletableAndLoadableCanvases(pageNum);
                        SetPreviewControls(pageNum, true);
                        $('.sn-doc-thumbnails li').removeClass('active');
                        $('.sn-doc-thumbnails li[data-page="' + pageNum + '"]', $container).addClass('active');

                        scrollToThumbnail(pageNum);
                    }
                    //}
                }
            }

            function addNewThumbnailPlaceHolder($imageList, orientation, ind, placeholderImgPath, dataLoaded, w, h) {
                var twidth = 95;
                var theight = 130;
                if (w > h) {
                    var a = twidth;
                    twidth = theight;
                    theight = a;
                }

                if (ind <= maxpreview) {
                    var $thumbnail = $('<li class="sn-thumbnail-page" data-page="' + ind + '" data-width="' + twidth + '" data-height="' + theight + '"><img src="' + placeholderImgPath + '" data-loaded="' + dataLoaded + '" /><span>Page ' + ind + '</span></li>');

                    $thumbnail.insertIndex(ind, $('ul', $('.sn-doc-thumbnails')));

                    var twidth = '100px'; var theight = '150px';
                    if (w > h) {
                        twidth = '120px';
                        theight = '100px';
                    }

                    $thumbnail.css({
                        'margin-right': '20px',
                        'width': twidth,
                        'height': theight
                    });

                    $('.sn-thumbnail-page').on('click.snDocViewer', function () {
                        if ($(this).attr('data-loaded') === 'true') {
                            var thumbnailNum = parseInt($(this).attr('data-page'));
                            removeAllContextMenu();

                            if (newPage(pageNum)) {
                                demandNewPage(pageNum);
                                setDataTops(pageNum);
                            }

                            getDeletableAndLoadableCanvases(thumbnailNum);
                            SetPreviewControls(thumbnailNum);
                        }
                    });
                }
            }

            function getCurrentPage() {
                var pageNum = currentpreview + 1;

                $docpreview.find('li').each(function () {
                    var $that = this;
                    $that = $($that);
                    var top = $that.offset().top - (($that.height() * scale) / 2);

                    if ($that.attr('data-page') === $docpreview.children().last('li').attr('data-page'))
                        top = $that.offset().top;

                    var height = $that.height() * scale;
                    if (top > -(height) && top < height && ($that.attr('data-page') !== NaN)) {
                        pageNum = parseInt($that.attr('data-page'));
                        if (pageNum === 'NaN')
                            pageNum = currentpreview + 1;
                        return false;
                    }
                });
                return pageNum;
            }

            var showable = [];
            function getDeletableAndLoadableCanvases(num) {
                num = parseInt(num);
                showable = [];
                var pages = [];
                var hpages = [];
                var deletable = [];
                if (num === 1) {

                    if (previewNumInTheSameTime > maxpreview) { previewNumInTheSameTime = maxpreview; }
                    for (var i = num; i < (num + previewNumInTheSameTime) ; i++) {
                        pages.push(i);
                    }
                }
                else if (num === parseInt(maxpreview)) {
                    for (var j = num; j > (num - (previewNumInTheSameTime + 1)) ; j--) {
                        pages.push(j);
                    }
                }
                else if (num < parseInt(maxpreview)) {  //count number of pages need to be add before and after the called page
                    var n = (previewNumInTheSameTime - 1) % 2;  //check if the number of additional page is even or odd
                    var m, start, end;
                    if (n === 0) {  //the number of additional page is even
                        m = Math.round((previewNumInTheSameTime - 1) / 2);

                        start = (num - m);
                        end = (num + (m + 1));

                        if ((num - m) < 1) { //first additional pages pagenumber must be 1 or bigger
                            start = 1;
                        }

                        if ((num + (m + 1)) > maxpreview) {//last additional pages pagenumber must be the count of the pages or less
                            end = maxpreview;
                        }

                        else if (lastEixistingPage() - (num + (previewNumInTheSameTime - 1)) <= 0 && (num + (m + 1)) <= maxpreview)
                            end = lastEixistingPage();

                        for (i = start; i < (end + 1) ; i++) {
                            pages.push(i);
                        }
                    }
                    else { //the number of additional page is odd (one more page will be added before the called page)
                        m = Math.round((previewNumInTheSameTime - 1) / 2) - 1;

                        start = (num - (m + 1));
                        end = (num + (m + 1));

                        if ((num - m) < 1) { //first additional pages pagenumber must be 1 or bigger
                            start = 1;
                        }

                        if ((num + (m + 1)) > maxpreview) { //last additional pages pagenumber must be the count of the pages or less
                            end = maxpreview;
                        }

                        if (lastEixistingPage() - (num + (previewNumInTheSameTime - 1)) <= 0 && (num + (m + 1)) <= maxpreview)
                            end = lastEixistingPage();

                        for (i = start; i < (end + 1) ; i++) {
                            pages.push(i);
                        }
                    }
                }

                $.grep(pages, function (el) {
                    if ($.inArray(el, hpages) === -1) {
                        showable.push(el);
                    }
                });

                $.grep(hpages, function (el) {
                    if ($.inArray(el, pages) === -1) {
                        deletable.push(el);
                    }
                });

                hpages = pages;
                //remove unnecessary canvases from th DOM
                deleteUnnecessaryCanvases(deletable);
                //push the pagenumber list of the canvases must be loaded

                $.each(showable, function (i, item) {

                    var preview = getPreviewInfoByIndex(item, existingPages);

                    if (typeof preview !== 'undefined') {
                        var $current = $('.sn-docviewer-page[data-page="' + item + '"]');
                        displayCanvases(item, parseInt($current.attr('data-width')), parseInt($current.attr('data-height')));
                        $currentPage = $('.sn-docviewer-page[data-page="' + item + '"]');

                        if ($currentPage.hasClass('rotated')) {
                            rotateCanvases($('.sn-docviewer-page[data-page="' + item + '"]'));
                        }

                        if (isShapeOnThisPage(item)) {
                            setTimeout(function () {
                                showShapesOnPages(item);
                            }, 300);
                        }

                        var wholeDocRotation = wholeDocumentRotated();
                        if (wholeDocRotation > 0)
                            documentDegree = wholeDocRotation;
                    }
                });


            }

            function getPreviewInfoByIndex(ind, data) {
                var preview;
                $.each(data, function (i, item) {
                    if (item.Index === ind)
                        preview = item;
                });
                return preview;
            }

            function lastEixistingPage() {
                return parseInt($('.sn-docviewer-page').last().attr('data-page'));
            }

            function deleteUnnecessaryCanvases(deletable) {
                $.each(deletable, function (i, item) {
                    $('.sn-docviewer-page[data-page="' + item + '"]').children('canvas').remove();
                });
            }

            function deleteUnnecessaryThumbnails(deletable) {
                $.each(deletable, function (i, item) {
                    var that = $('.sn-thumbnail-page[data-page="' + item + '"] img');
                    that.attr('src', placeholderImgPath);
                    that.attr('data-loaded', false);
                    that.parent().removeClass('active');
                });
            }

            function appendPreviewPostfix(url, addWatermark, addNoCache, rotation) {
                if (url.indexOf('?') === -1) {
                    url += '?';
                    if (addWatermark) {
                        url += 'watermark=true';
                    }
                }
                else if (addWatermark && url.indexOf('?') > -1) {
                    url += '&watermark=true';
                }
                if (addNoCache) {
                    url += '&nocache=' + new Date().getTime();
                }
                if (typeof rotation !== 'undefined' && rotation !== "") {
                    url += rotation;
                }
                return url;
            }

            function displayCanvases(i, w, h) {

                var that = $('li[data-page="' + i + '"]', $docpreview);

                contexts = {};
                if (that.children('canvas').length === 0)
                    contexts[i] = createCanvases(i, w, h);
                if (typeof canvasType !== 'undefined' && canvasType !== 'undefined') {
                    setTimeout(function () { initializeCanvasFeature(canvasType); }, 500);
                }

                // Start the redraw interval
                clearInterval(mainDraw);
                setInterval(mainDraw, redrawInterval);

            }

            function displayThumbnail(i, path, w, h) {
                var orientation = 'portrait';
                if (w > h)
                    orientation = 'landscape';
                var $imageList = $('ul', $('.sn-doc-thumbnails'));

                if ($('.sn-thumbnail-page[data-page="' + i + '"]').length === 0)
                    addNewThumbnailPlaceHolder($imageList, orientation, i, placeholderImgPath, false, w, h);

                var thumbnailPath = path.substring(0, path.lastIndexOf("/") + 1) + 'thumbnail' + i + '.png';

                var that = $('.sn-thumbnail-page[data-page="' + i + '"] img');
                thumbnailPath = appendPreviewPostfix(thumbnailPath, !noWatermark, addNoCachePostfix);
                that.attr('data-loaded', true);
                that.attr('src', thumbnailPath);

                


                var twidth;
                if (w < h){
                    twidth = 95;
                }
                else
                    twidth = 125;

                var imgRateBase = 95 / 125;
                var imgRate = w / h;
                var rate = imgRate / imgRateBase;

                if (imgRate < imgRateBase)
                    twidth = twidth * rate;

                that.attr('width', twidth);
                if (typeof w !== 'undefined' && typeof h !== 'undefined' && w !== null && h !== null) {
                    if (w > h)
                        that.addClass('landscape');
                }

                if (currentpreview === i)
                    that.parent().addClass('active');

            }

            function isShapeOnThisPage(num) {
                var shapeExistsOnThisPage = false;
                $.each(allshapes, function (a, item) {
                    $.each(item, function (c, d) {
                        if (d.imageIndex === num) {
                            shapeExistsOnThisPage = true;
                        }
                    });
                });

                return shapeExistsOnThisPage;
            }

            function fitToWidth(w) {
                $('.sn-icon-rubberband', $toolbarContainer).removeClass('active');
                // Fit the document to the width of the viewer
                if (typeof w !== 'undefined')
                    imgWidth = w;

                var rate = containerWidth / imgWidth;
                setZoomLevel(rate);
                if (rate < minZoomLevel)
                    minZoomLevel = rate;
                fitPreviewsToLeftEdge(dataObj.isFullscreen(), true, w);
            }

            function fitToHeight() {
                $('.sn-icon-rubberband', $toolbarContainer).removeClass('active');
                // Fit the document to the height of the viewer
                var rate = containerHeight / $('li.sn-docviewer-page[data-page="' + currentpreview + '"] img', $docpreview).height();
                setZoomLevel(rate);
                if (rate < minZoomLevel)
                    minZoomLevel = rate;
            }

            function fitToWindow() {
                $('.sn-icon-rubberband', $toolbarContainer).removeClass('active');
                // Fit the document to the height or the width of the viewer, depending on which ratio is lower
                var rate1 = containerWidth / $('li.sn-docviewer-page[data-page="' + currentpreview + '"] img', $docpreview).width();
                var rate2 = containerHeight / $('li.sn-docviewer-page[data-page="' + currentpreview + '"] img', $docpreview).height();
                if (!touch) {
                    setZoomLevel(Math.min(rate1, rate2));
                    if (Math.min(rate1, rate2) < minZoomLevel)
                        minZoomLevel = Math.min(rate1, rate2);
                }
                else {
                    var rate = $('body').width() / imgWidth;
                    setZoomLevel(rate);
                    if (rate < minZoomLevel)
                        minZoomLevel = rate;
                }
            }

            function fitPreviewsToLeftEdge(full, fit, w) {

                //var scrollLeft = 120 * scale;
                var currentDegree = parseInt($('.sn-docviewer-page[data-page="' + currentpreview + '"]').attr('data-degree'));
                if (currentDegree === 90 || currentDegree === -90)
                    scrollLeft = 0;

                $docpreview.scrollLeft(((ulWidth - w) / 2) * scale);

                //if ((!touch && !full) || (full && fit)) {
                //    var $first = $('.sn-docviewer-page').first().find('img');
                //    var firstPos = (($docpreview.find('ul').innerWidth() - $first.width()) / 2) * scale;
                //    if (($first.width() * scale + 1) < containerWidth)
                //        firstPos = (($docpreview.find('ul').innerWidth() - containerWidth) / 2) * scale;
                //    $docpreview.scrollLeft(firstPos);
                //}
                //else if (full && !touch) {
                //    var $first = $('.sn-docviewer-page').first();
                //    var firstPos = (window.innerWidth - $first.width()) / 2;
                //    $docpreview.scrollLeft(firstPos);
                //}
                //else {
                //    $docpreview.scrollLeft(scrollLeft);
                //}
            }

            function resizeListItemContainers() {
                $('.sn-docviewer-page img[data-loaded="true"]').each(function () {
                    var that = $(this);
                    var w = parseInt(that.parent().attr('data-width'));
                    var h = parseInt(that.parent().attr('data-height'));
                    if (that.parent().hasClass('rotated') && (that.parent().attr('data-degree') === '90' || that.parent().attr('data-degree') === '-90')) {
                        if (w > h) {
                            that.parent('li').css({
                                'width': h + 240,
                                'height': w
                            });
                        }
                        else {
                            that.parent('li').css({
                                'width': h,
                                'height': w + 240
                            });
                        }
                    }
                    else if (that.parent().hasClass('rotated') && that.parent().attr('data-degree') === '180') {
                        if (that.width() > that.height()) {
                            that.parent('li').css({
                                'width': w + 240,
                                'height': h
                            });
                        }
                        else {
                            that.parent('li').css({
                                'width': w + 240,
                                'height': h
                            });
                        }
                    }
                    else {
                        that.parent('li').css({
                            'width': w + 240,
                            'height': h
                        });
                    }
                });
            }

            function createCanvases(page, w, h) {

                // Create all the new canvases
                var $redactioncanvas = $('<canvas/>', { 'class': 'redaction-canvas' });
                var $highlightcanvas = $('<canvas/>', { 'class': 'highlight-canvas' });
                var $annotationcanvas = $('<canvas/>', { 'class': 'annotation-canvas' });
                var $technicalcanvas = $('<canvas/>', { 'class': 'technical-canvas' });
                var $allCanvases = $().add($redactioncanvas).add($highlightcanvas).add($annotationcanvas).add($technicalcanvas);

                var $li = $($('.sn-docpreview-desktop ul li[data-page="' + page + '"]', $container));
                var $img = $('img', $li);
                var canvasWidth = w;
                var wideCanvasWidth = w + 240;

                // Initialize redaction canvas
                var redactioncanvas = $redactioncanvas[0];
                redactioncanvas.width = canvasWidth;
                redactioncanvas.height = h;

                // Initialize highlight canvas
                var highlightcanvas = $highlightcanvas[0];
                highlightcanvas.width = canvasWidth;
                highlightcanvas.height = h;

                // Initialize annotation canvas
                var annotationcanvas = $annotationcanvas[0];
                annotationcanvas.width = wideCanvasWidth;
                annotationcanvas.height = h;

                // Initialize technical canvas
                var technicalcanvas = $technicalcanvas[0];
                technicalcanvas.width = wideCanvasWidth;
                technicalcanvas.height = h;

                // Disable selection for all canvases
                $allCanvases.on('selectstart.snDocViewer', function () { return false; });
                // Set the position for all canvases and the image as well
                $allCanvases.add($img).css({
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    'user-select': 'none',
                    '-moz-user-select': 'none',
                    '-webkit-user-select': 'none'
                }).on('selectstart.snDocViewer', function (e) { e.preventDefault(); return false; });
                if (!$li.hasClass('rotated') || $li.attr('data-degree') === 180) {
                    $img.css('margin-left', 120);
                }
                $redactioncanvas.add($highlightcanvas).css('margin-left', 120);
                $annotationcanvas.add($technicalcanvas).css('margin-left', 0);

                // Append these to the li element representing the current page
                $('.sn-docpreview-desktop ul li[data-page="' + page + '"]').append($allCanvases);

                if (!showShapes) {
                    $allCanvases.hide();
                }

                else if (!shapesAreShowing) {
                    $allCanvases.hide();
                }
                else {
                    editmode = false;
                    shapesAreShowing = true;

                }
                if (!isAdmin) {
                    $redactioncanvas.hide();
                }
                // Initialize the contexts
                if (agentStr.indexOf("Trident/4.0") > -1) { // ie IE
                    $('.sn-additional-tools').hide();
                    redactioncanvas = G_vmlCanvasManager.initElement(redactioncanvas);
                    highlightcanvas = G_vmlCanvasManager.initElement(highlightcanvas);
                    annotationcanvas = G_vmlCanvasManager.initElement(annotationcanvas);
                    technicalcanvas = G_vmlCanvasManager.initElement(technicalcanvas);
                }
                if (redactioncanvas.getContext) {

                    return {
                        "redaction": redactioncanvas.getContext('2d'),
                        "highlight": highlightcanvas.getContext('2d'),
                        "annotation": annotationcanvas.getContext('2d'),
                        "technical": technicalcanvas.getContext('2d')
                    };
                }
            }

            function parseShapesJson(shapes) {
                if (shapes && shapes.length > 0) {
                    var shapeObj = shapes;
                    if (typeof (shapes) === "string")
                        shapeObj = $.parseJSON(shapes);
                    if (typeof (shapeObj) !== "object")
                        $.error("The shapes option is invalid");
                    var drawShapes = function (shapeObj, i, p, canvasType) {
                        $.each(shapeObj[i][p], function (index, value) {
                            addRect(value.x, value.y, value.w, value.h, value.imageIndex, canvasType, value.fontSize, value.fontFamily, value.fontColor, value.fontBold, value.fontItalic, value.text, value.lineHeight);
                        });
                    };
                    drawShapes(shapeObj, 0, "redactions", "redaction");
                    drawShapes(shapeObj, 1, "highlights", "highlight");
                    drawShapes(shapeObj, 2, "annotations", "annotation");
                }
                else if (shapes.length === 0) {
                    allshapes = {
                        redaction: [],
                        highlight: [],
                        annotation: []
                    };
                }
            }

            function parsePageAttributesJson() {
                if (pageAttributes && pageAttributes.length > 0) {
                    pageAttributesObj = pageAttributes;
                    if (typeof (pageAttributes) === "string")
                        pageAttributesObj = $.parseJSON(pageAttributes);
                    if (typeof (pageAttributesObj) !== "object")
                        $.error("The shapes option is invalid");

                }
            }

            function SetPreviewControls(page, dontScroll, fullScreen) {
                if (currentpreview === page && !fullScreen) {
                    if (page === maxpreview)
                        $('.sn-input-jumptopage').val(maxpreview);
                    else {
                        $('.sn-doc-thumbnails li').removeClass('active');
                        $('.sn-doc-thumbnails li[data-page="' + currentpreview + '"]').addClass('active');
                    }
                }
                if (maxpreview === 0) {
                    //console.log("The are no preview images, can't set page.");
                    currentpreview = 0;
                    return;
                }
                if (page < 1 || page > maxpreview) {
                    //console.log("The page parameter is outside the range of possible pages: ", page, " NOTE: you can use pageCount() to get the number of pages.");
                    return;
                }

                currentpreview = page;
                currentpreviewWidth = $('#imageContainer' + page).attr('data-width');


                if (!dontScroll) {
                    var currentimageId = "imageContainer" + currentpreview;
                    var currentImageObj = $('#' + currentimageId, $container);
                    var position;
                    if (iHeight === null)
                        iHeight = currentImageObj.height();
                    if (!touch) {
                        //if (!dataObj.isFullscreen()) {
                        //position = parseInt($('.sn-docviewer-page[data-page="' + currentpreview + '"]').first().attr('data-top')) * scale;
                        position = $('#imageContainer' + currentpreview).position().top + $docpreview.position().top;

                        $($('.sn-docviewer-page[data-page="' + currentpreview + '"]').first()[0].attributes).each(function () {
                            if (this.name === 'data-top' && this.value !== 'NaN') {
                                position = parseInt(this.nodeValue) * scale;
                            }
                        });
                        //}
                        //    //position = ((currentpreview - 1) * (iHeight + pageMargin) * scale) - pageMargin * 0.2;
                        //else
                        //    position = parseInt($('.sn-docviewer-page[data-page="' + currentpreview + '"]').first().attr('data-top')) * scale;

                        $docpreview.animate({ scrollTop: position }, function () {
                            $('.sn-input-jumptopage', $container).val(currentpreview);
                            jumpDistance = 1;

                            if (currentpreview === 1) {
                                setTimeout(function () { showShapesOnPages(currentpreview); }, 200);
                            }
                        });
                        $('.sn-doc-thumbnails li').removeClass('active');
                        $('.sn-doc-thumbnails li[data-page="' + currentpreview + '"]').addClass('active');
                    }
                    else {
                        var currentItemOffsetTop = $('#docpreview').offset().top - (currentImageObj.position().top + 120);
                        var currentItemOffsetLeft = myScroll.x;
                        myScroll.scrollTo(currentItemOffsetLeft, currentItemOffsetTop, 100);
                        $('.sn-input-jumptopage', $container).val(currentpreview);
                        if (currentpreview === 1) {
                            setTimeout(function () { showShapesOnPages(currentpreview); }, 200);
                        }
                    }

                    scrollToThumbnail(currentpreview);
                }
                if (dontScroll) {
                    $('.sn-input-jumptopage', $container).val(currentpreview);
                    if (currentpreview === 1) {
                        setTimeout(function () { showShapesOnPages(currentpreview); touched = false; }, 200);
                    }
                }


                if (currentpreview === 1 && currentpreview !== maxpreview) {
                    $('.sn-icon-prev, .sn-icon-firstpage').addClass('disabled');
                    $('.sn-icon-next, .sn-icon-lastpage').removeClass('disabled');
                }
                else if (currentpreview === maxpreview && currentpreview !== 1) {
                    $('.sn-icon-next, .sn-icon-lastpage').addClass('disabled');
                    $('.sn-icon-prev, .sn-icon-firstpage').removeClass('disabled');
                }
                else {
                    $('.sn-icon-next, .sn-icon-lastpage').removeClass('disabled');
                    $('.sn-icon-prev, .sn-icon-firstpage').removeClass('disabled');
                }

                if ($('.sn-docviewer-page[data-page="' + page + '"]').hasClass('rotated')) {
                    disableEditorButtons();
                }
                else if (!$('.sn-docviewer-page[data-page="' + page + '"]').hasClass('rotated') && !$('.sn-additional-tools .sn-icon').hasClass('active'))
                    enableEditorButtons();

                callbacks.pageChanged && callbacks.pageChanged(currentpreview);
            }

            // Sets the zoom level of the document
            function setZoomLevel(newLevel, x0, y0, $rel, rb) {
                var $zoo = $('.zoomer', $docpreview);
                $ul = $('ul', $docpreview);
                var $li = $('li', $ul);
                var $img = $('img', $li);
                var $rel = $rel || $('.sn-docviewer-page:first').children('technicalcanvas');
                var $currentLi = $rel.closest('li.sn-docviewer-page');
                if (!$currentLi.length)
                    $currentLi = $('.sn-docviewer-page[data-page="' + currentpreview + '"]');

                if (!x0) {
                    x0 = x0 || $img.width() * 0.25;
                    y0 = y0 || ($docpreview.scrollTop() / scale);
                }

                var oldWidth = imgWidth * scale + (240 * scale);
                var newWidth = imgWidth * newLevel + (240 * scale);

                var origScale = scale;
                scale = newLevel;

                $ul.css({
                    'transform': 'scale(' + scale + ')',
                    '-moz-transform': 'scale(' + scale + ')',
                    '-ms-transform': 'scale(' + scale + ')',
                    '-webkit-transform': 'scale(' + scale + ')',
                    '-o-transform': 'scale(' + scale + ')',
                    'transform-origin': scale > 1 ? '0 0' : '0 0',
                    '-moz-transform-origin': scale > 1 ? '0 0' : '0 0',
                    '-ms-transform-origin': scale > 1 ? '0 0' : '0 0',
                    '-webkit-transform-origin': scale > 1 ? '0 0' : '0 0',
                    '-o-transform-origin': scale > 1 ? '0 0' : '0 0',
                    'width': ulWidth,
                    'text-align': 'center'
                });

                $zoo.css({
                    'width': ulWidth * scale,
                    'height': $ul.height() * scale,
                    'margin': '0px auto'
                });

                if (rb) {
                    var diff = $rel ? ($li.offset().left - $rel.offset().left - $li.position().left) : 0;
                    $docpreview.scrollLeft(Math.max(0, x0 * scale - diff));
                    $docpreview.scrollTop(Math.max(0, $currentLi.position().top + y0 * scale));
                }
                else {

                    var relScale = scale / origScale;

                    var y = containerHeight / 2;

                    y = y + $('#docpreview').position().top - $docpreview.scrollTop();

                    y = y - y * relScale + $docpreview.scrollTop();


                    $docpreview.scrollTop(y);
                    $docpreview.scrollLeft($docpreview.scrollLeft() + (newWidth - oldWidth) / 2);

                }

                if (newLevel === 1 && $container.parent().hasClass("sn-docpreview-fullscreen-wrapper")) {
                    fitPreviewsToLeftEdge(true, false, currentpreviewWidth);
                }

                setDataTops();
                setPageAccordingToScroll(false);
                callbacks.zoomLevelChanged && callbacks.zoomLevelChanged(scale);
            }

            function widestPageWidth() {
                var widestWidth = imgWidth;
                $('.sn-docviewer-page').each(function () {
                    $element = $(this);
                    if ($element.width() > widestWidth) {
                        widestWidth = $element.width();
                    }
                });
                return widestWidth;
            }

            function setDataTops(i) {
                if (typeof i !== 'undefined' || i !== undefined) {
                    var $that = $('#imageContainer' + i);
                    var prev = $that.prev('li');
                    var prevTop = parseInt(prev.attr('data-top'));
                    var prevHeight = prev.height();
                    if ($that.attr('data-page') !== '1')
                        $that.attr('data-top', prevTop + prevHeight + 50);
                    else
                        $that.attr('data-top', 0);
                }
                else {
                    $('.sn-docviewer-page').each(function () {
                        var prev = $(this).prev('li');
                        var prevTop = parseInt(prev.attr('data-top'));
                        var prevHeight = prev.height();
                        var $that = $(this);
                        if ($that.attr('data-page') !== '1')
                            $that.attr('data-top', prevTop + prevHeight + 50);
                        else
                            $that.attr('data-top', 0);
                    });
                }
            }

            function ShowThumbnails() {

                var $this = $(this);

                if (!$this.hasClass('active')) {
                    $this.addClass('active');
                    $metadatacontainer.addClass('fulscreen-metadata').fadeIn();
                    //getDeletableAndLoadableThumbnails(pageNum);
                }
                else {
                    $this.removeClass('active');
                    $metadatacontainer.fadeOut(200, function () { $metadatacontainer.removeClass('fulscreen-metadata'); });
                }

                if (currentpreview > 1)
                    scrollToThumbnail(currentpreview);

            }

            function enterFullscreenMode(pnum) {
                if (dataObj.isFullscreen())
                    return;
                var width = $(window).width();
                var height = $(window).height();
                var $fullscreenWrapper = $(".sn-docpreview-fullscreen-wrapper");
                if ($fullscreenWrapper.length)
                    $.error("Another document viewer is already in fullscreen mode, can't switch this one to fullscreen mode too.");

                var heightDiff = $pluginSubject.height() - containerHeight;
                // Create a wrapper for fullscreen mode
                $fullscreenWrapper = $('<div class="sn-docpreview-fullscreen-wrapper"></div>').css({
                    left: 0,
                    top: 0,
                    position: "absolute",
                    width: width,
                    height: height,
                    'z-index': 1000
                }).appendTo($("body"));
                $(window).off('resize.snDocViewerFullscreen').on('resize.snDocViewerFullscreen', function () {
                    $fullscreenWrapper.css({
                        width: width,
                        height: height
                    });
                });
                // Move the container element into the new wrapper
                $container.appendTo($fullscreenWrapper);
                // Adjust the user interface
                $docpreview.height(height - heightDiff);
                $metadatacontainer.hide();
                $imagecontainer.width('100%');
                $toolbarContainer.find('.sn-icon-fullscreen').addClass('normalscreen').parent().attr('title', SR.toolbarExitFullscreen);
                $('<div class="seeThumbnails" title="' + SR.showThumbnails + '"><span class="sn-icon sn-icon-thumbnails"></span></div>').on('click.snDocViewer', ShowThumbnails).appendTo($docpreview.parent());

                hpages = [];
                var $thumbnails = $('.sn-doc-thumbnails');
                if ($thumbnails.width() < $thumbnails.height()) {
                    var thumbnailListHeight = height;
                    $thumbnails.height(thumbnailListHeight);
                }



                if (touch) {
                    myScroll.scrollTo((-130 * scale), 0);
                }

                // Trigger resize to make the items sized correctly
                $(window).trigger("resize");

                setTimeout(function () {
                    SetPreviewControls(pnum, false, true);
                    fitPreviewsToLeftEdge(true, false, currentpreviewWidth);
                }, 1000);

                //if ($('.sn-paging-tools .sn-doc-title').length === 0) {
                //    var $doctitle = $('.sn-doc-title');
                //    $('.sn-docpreview-fullscreen-wrapper .image-container').prepend($doctitle);
                //    var docTitleWidth = $('.sn-docviewer-tools').offset().left;
                //    $doctitle.children('h1').width(docTitleWidth - 20);
                //}
            }

            function exitFullscreenMode() {
                if (!dataObj.isFullscreen())
                    return;

                $(window).off('resize.snDocViewerFullscreen');
                var $fullscreenWrapper = $(".sn-docpreview-fullscreen-wrapper");
                // Move the container to the old place
                $container.appendTo($pluginSubject);
                // Delete the fullscreen wrapper from the DOM
                $fullscreenWrapper.remove();
                // Adjust the user interface
                $docpreview.height(containerHeight);
                $metadatacontainer.show();
                $imagecontainer.width('76%');
                $toolbarContainer.find('.sn-icon-fullscreen').removeClass('normalscreen').parent().attr('title', 'Fullscreen');
                $docpreview.find('.seeThumbnails').remove();
                $docpreview.parent().find('.seeThumbnails').remove();
                $metadatacontainer.removeClass('fulscreen-metadata');
                // Trigger resize to make the items sized correctly
                $(window).trigger("resize");

                SetPreviewControls(currentpreview, false, true);
                var $thumbnails = $('.sn-doc-thumbnails');
                var left = $('.sn-thumbnail-page[data-page="' + currentpreview + '"]').position().left;
                if (left === 0) {
                    //getDeletableAndLoadableThumbnails(1);
                }
                else {
                    if ($thumbnails.width() > $thumbnails.height()) {
                        $thumbnails.scrollLeft(left);
                    }
                    else {
                        $thumbnails.animate({ scrollTop: (left) }, 100);
                    }
                }

                setTimeout(function () {
                    fitPreviewsToLeftEdge(false, false, currentpreviewWidth);
                    if ($thumbnails.width() < $thumbnails.height()) {
                        var thumbnailListHeight = containerHeight;
                        $('.sn-doc-thumbnails').height(thumbnailListHeight);
                        }
                }, 500);
            }

            function Shape() {
                this.x = 0;
                this.y = 0;
                this.w = mySelBoxSize;
                this.h = mySelBoxSize;
            }

            function Redaction() {
                Shape.call(this);
            }

            function Highlight() {
                Shape.call(this);
            }

            function Annotation() {
                Shape.call(this);
            }

            Shape.prototype = {
                fill: 'rgba(0,0,0,1)',
                drawSelectionHandles: function (context) {
                    // Calculate position of selection handles
                    var half = mySelBoxSize / 2;

                    selectionHandles[0].x = this.x - half;
                    selectionHandles[0].y = this.y - half;

                    selectionHandles[1].x = this.x + this.w / 2 - half;
                    selectionHandles[1].y = this.y - half;

                    selectionHandles[2].x = this.x + this.w - half;
                    selectionHandles[2].y = this.y - half;

                    selectionHandles[3].x = this.x - half;
                    selectionHandles[3].y = this.y + this.h / 2 - half;

                    selectionHandles[4].x = this.x + this.w - half;
                    selectionHandles[4].y = this.y + this.h / 2 - half;

                    selectionHandles[6].x = this.x + this.w / 2 - half;
                    selectionHandles[6].y = this.y + this.h - half;

                    selectionHandles[5].x = this.x - half;
                    selectionHandles[5].y = this.y + this.h - half;

                    selectionHandles[7].x = this.x + this.w - half;
                    selectionHandles[7].y = this.y + this.h - half;

                    // Stroke the current shape
                    context.strokeStyle = mySelColor;
                    context.lineWidth = mySelWidth;
                    context.strokeRect(this.x, this.y, this.w, this.h);

                    // Draw the selection handles
                    for (var i = 0; i < 8; i++) {
                        selectionHandles[i].draw(context);
                    }
                },
                draw: function (context, optionalColor) {
                    var d = 0;
                    if (typeof $(context.canvas).closest('li').attr('data-degree') !== 'undefined')
                        d = parseInt($(context.canvas).closest('li').attr('data-degree'));

                    // Check position
                    if (!context || !context.canvas)
                        return;
                    if (this.x > context.canvas.width || this.y > context.canvas.height || this.x + this.w < 0 || this.y + this.h < 0)
                        return;

                    // Draw the shape
                    context.fillStyle = this.fill;
                    context.fillRect(this.x, this.y, this.w, this.h);

                    // If the current shape is selected, draw selection handles
                    if (mySel === this)
                        this.drawSelectionHandles(context);
                }
            };

            Redaction.prototype = {
                fill: 'rgba(0,0,0,1)',
                drawSelectionHandles: Shape.prototype.drawSelectionHandles,
                draw: Shape.prototype.draw
            };

            Highlight.prototype = {
                fill: 'rgba(255,255,0,0.4)',
                drawSelectionHandles: Shape.prototype.drawSelectionHandles,
                draw: Shape.prototype.draw
            };

            Annotation.prototype = {
                minWidth: 120,
                minHeight: 140,
                fill: 'rgba(248,236,194,1)',
                drawSelectionHandles: Redaction.prototype.drawSelectionHandles,
                draw: function (context, optionalColor) {
                    if (this.x > context.canvas.width || this.y > context.canvas.height || this.x + this.w < 0 || this.y + this.h < 0)
                        return;

                    context.fillStyle = this.fill;
                    context.shadowColor = '#999';
                    context.shadowBlur = 20;
                    context.shadowOffsetX = 5;
                    context.shadowOffsetY = 5;
                    context.fillRect(this.x, this.y, this.w, this.h);

                    context.shadowColor = 'transparent';
                    context.font = this.fontBold + ' ' + this.fontItalic + ' ' + this.fontSize + ' ' + this.fontFamily;
                    context.fillStyle = this.fontColor;

                    wrapText(context, this.text, this.x + 10, this.y + 30, this.w - 10, this.h, this.lineHeight + 5);

                    if (mySel === this)
                        this.drawSelectionHandles(context);
                }
            };

            function wrapText(context, text, x, y, maxWidth, maxHeight, lineHeight) {
                var cars = text.split("\n");
                var lines = [];
                var totalHeight = 0;

                // This will break long words into multiple lines
                var addLineBreakLongWords = function (line) {
                    if (!line || !(line = line.trim()))
                        return;

                    var line1 = line;
                    var line2 = "";

                    var testWidth = context.measureText(line1).width;
                    while (testWidth > maxWidth) {
                        line2 = line1.substr(line1.length - 1, 1) + line2;
                        line1 = line1.substr(0, line1.length - 1);
                        testWidth = context.measureText(line1).width;
                    }

                    if (line1)
                        lines.push(line1);
                    if (line2)
                        addLineBreakLongWords(line2);
                };

                // This will break lines into multiple lines by spaces
                var addLineBreakOnSpaces = function (car) {
                    var line = "";
                    var words = car.split(" ");

                    for (var n = 0; n < words.length; n++) {
                        var testLine = line + words[n] + " ";
                        var metrics = context.measureText(testLine);
                        var testWidth = metrics.width;

                        if (testWidth > maxWidth) {
                            addLineBreakLongWords(line);
                            line = words[n] + " ";
                        }
                        else {
                            line = testLine;
                        }
                    }

                    addLineBreakLongWords(line);
                };

                // Go through each line and break into multiple lines if necessary     
                for (var ii = 0; ii < cars.length; ii++) {
                    addLineBreakOnSpaces(cars[ii]);
                }

                // Go through all the resulting lines and draw them as needed
                for (var yy = 0; yy < lines.length; yy++) {
                    var line = lines[yy];
                    context.fillText(line, x, y);
                    y += lineHeight;
                    totalHeight += lineHeight;

                    if (totalHeight + lineHeight * 2.3 > maxHeight && yy < lines.length - 2) {
                        context.fillText("...", x, y);
                        break;
                    }
                }
            }

            function addRect(x, y, w, h, imageIndex, type, fontSize, fontFamily, fontColor, fontBold, fontItalic, text, lineHeight) {
                var degree = 0;
                if (typeof $('.sn-docviewer-page[data-page="' + currentpreview + '"]').attr('data-degree') !== 'undefined')
                    degree = parseInt($('.sn-docviewer-page[data-page="' + currentpreview + '"]').attr('data-degree'));

                var rect;
                if (type === "redaction") {
                    rect = new Redaction();
                }
                else if (type === "highlight") {
                    rect = new Highlight();
                }
                else if (type === "annotation") {
                    rect = new Annotation();
                    rect.fontSize = fontSize || '24pt';
                    rect.fontFamily = fontFamily || 'Arial';
                    rect.fontColor = fontColor || '#333';
                    rect.fontBold = fontBold || 'Normal';
                    rect.fontItalic = fontItalic || 'Normal';
                    rect.text = text || 'Double click to edit text';
                    rect.lineHeight = lineHeight || 20;
                }
                rect.x = x;
                rect.y = y;
                rect.w = w;
                rect.h = h;

                rect.imageIndex = parseInt(imageIndex);
                var rRect = rotateShape(rect, degree, imageIndex, type);

                allshapes[type].push(rRect);
                saveableshapes[type].push(rect);
                invalidate();
            }

            function rotateShape(r, d, img, t) {
                var $context = $('.sn-docviewer-page[data-page="' + img + '"]').find('canvas.' + t + '-canvas');
                if (d === 0) {
                    var x = r.x,
                        y = r.y,
                        w = r.w,
                        h = r.h;
                }
                else if (d === -90) {
                    var x = ($context.width() - (r.y + r.h) + (120 * scale)),
                        y = r.x,
                        w = r.h,
                        h = r.w;
                }
                else if (d === 90) {
                    var x = r.y - 120,
                        y = ($context.height() - (r.x + r.w)),
                        w = r.h,
                        h = r.w;
                }
                else {
                    var x = $context.width() - (r.x + r.w),
                       y = $context.height() - (r.y + r.h),
                       w = r.w,
                       h = r.h;
                }

                r.x = x,
                r.y = y,
                r.w = w,
                r.h = h;

                return r;
            }

            function rotateCoordinates(s, d, page, t) {
                var $context = page.find('canvas.' + t + '-canvas');
                if (d === 0) {
                    var x = s.x,
                        y = s.y;
                }
                else if (d === -90) {
                    var x = ($context.width() - s.y + (120 * scale)),
                        y = s.x;
                }
                else if (d === 90) {
                    var x = s.y - 120,
                        y = ($context.height() - s.x + s.w);
                }
                else {
                    var x = $context.width() - s.x,
                       y = $context.height() - s.y;
                }

                s.x = x,
                s.y = y;
                return s;
            }

            function removeRect(index) {
                allshapes[canvasType].splice(index, 1);
                saveableshapes[canvasType].splice(index, 1);
                removeAllContextMenu();
                invalidate();
            }

            function initializeCanvasFeature(newType) {
                setTimeout(function () { clearShapeSelections(); }, 200);
                canvasType = newType || canvasType;
                editmode = true;

                var $canvas = $('.sn-docviewer-page[data-page="' + currentpreview + '"] .' + newType + '-canvas');
                var $technicalcanvas = $container.find('canvas.technical-canvas'); $('.sn-docviewer-page[data-page="' + currentpreview + '"] canvas.technical-canvas');

                // Set z-indexes
                resetCanvasZIndexes();
                $canvas.css('z-index', 100);
                // Remove all previous event handlers
                $technicalcanvas.off('mousedown.snDocViewer').off('mouseup.snDocViewer').off('mousemove.snDocViewer').off('dblclick.snDocViewer');
                // Add new event handlers
                $technicalcanvas.on('mousedown.snDocViewer', myDown).on('mouseup.snDocViewer', myUp).on('mousemove.snDocViewer', myMove).on('dblclick.snDocViewer', myDblClick).on('click.snDocViewer', myClick);

                // Initialize selection handles
                selectionHandles = [];
                for (var i = 0; i < 8; i++) {
                    selectionHandles.push(new Shape());
                }
            }

            function destroyCanvasFeature() {
                if (typeof $('.sn-docviewer-page[data-page="' + currentpreview + '"] .technical-canvas') !== 'undefined' && $('.sn-docviewer-page[data-page="' + currentpreview + '"] .technical-canvas').length > 0) {
                    setTimeout(function () { clearShapeSelections(); }, 200);
                }
                editmode = false;
                resetCanvasZIndexes();
                var $technicalcanvas = $('canvas.technical-canvas');
                $technicalcanvas.off('mousedown.snDocViewer').off('mouseup.snDocViewer').off('mousemove.snDocViewer').off('dblclick.snDocViewer');
            }

            function resetCanvasZIndexes() {
                // reset
                $container.find("canvas.annotation-canvas").css('z-index', 40);
                $container.find("canvas.redaction-canvas").css('z-index', 30);
                $container.find("canvas.highlight-canvas").css('z-index', 20);
                $container.find("canvas.technical-canvas").css('z-index', 101);
            }

            function clear(ctx) {
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            }
            var currentshapes;
            function mainDraw(ignoreValid) {
                if ((!ignoreValid && canvasValid) || !canvasType)
                    return;

                var p = currentpreview;
                var ctx = $('.sn-docviewer-page[data-page="' + p + '"] .' + canvasType + '-canvas')[0].getContext('2d');
                currentshapes = allshapes[canvasType];
                clear(ctx);
                canvasValid = true;

                for (var i = currentshapes.length; i--;) {
                    if (parseInt(currentshapes[i].imageIndex) === p) {
                        currentshapes[i].draw(ctx);
                    }
                }
            }

            function myMove(e) {


                var $currentPage = $('.sn-docviewer-page[data-page="' + currentpreview + '"]');

                var d = 0;
                if (typeof $currentPage.attr('data-degree') !== 'undefined')
                    d = parseInt($currentPage.attr('data-degree'));

                var $canvas = $currentPage.find('.' + canvasType + '-canvas');
                var $technicalcanvas = $currentPage.find('.technical-canvas');
                var diff = ($canvas.offset().left - $technicalcanvas.offset().left) / scale;
                var p = calculateMousePos(e, $technicalcanvas, d);

                var rm = {};
                rm.x = p.x;
                rm.y = p.y;
                if (d !== 0)
                    rm = rotateCoordinates(rm);

                rmx = rm.x;
                rmy = rm.y;

                if (rmstart === this) {
                    if (isDrag && mySel) {
                        started = false;
                        mySel.x = rmx - x0;
                        mySel.y = rmy - y0;

                        $technicalcanvas.css({ 'cursor': 'move' });
                        invalidate();
                    }
                    else if (isResizeDrag) {
                        var oldx = mySel.x;
                        var oldy = mySel.y;
                        started = false;

                        if (expectResize & resizeFlags.fromTop) {
                            if (!mySel.minHeight || mySel.h + oldy - rmy >= mySel.minHeight) {
                                mySel.y = rmy;
                                mySel.h += oldy - rmy;
                            }
                        }
                        if (expectResize & resizeFlags.fromRight) {
                            mySel.w = mySel.minWidth ? Math.max(rmx - diff - oldx, mySel.minWidth) : rmx - diff - oldx;
                        }
                        if (expectResize & resizeFlags.fromBottom) {
                            mySel.h = mySel.minHeight ? Math.max(rmy - oldy, mySel.minHeight) : rmy - oldy;
                        }
                        if (expectResize & resizeFlags.fromLeft) {
                            if (!mySel.minWidth || mySel.w + oldx - rmx + diff >= mySel.minWidth) {
                                mySel.x = rmx - diff;
                                mySel.w += oldx - rmx + diff;
                            }
                        }

                        invalidate();
                    }
                    else {
                        drawRectangleMove.call($technicalcanvas, e);
                    }
                }

                if (mySel && !isResizeDrag) {
                    for (var i = 0; i < 8; i++) {
                        var cur = selectionHandles[i];
                        if (rmx - diff >= cur.x && rmx - diff <= cur.x + mySelBoxSize + 15 && rmy >= cur.y && rmy <= cur.y + mySelBoxSize + 15) {
                            switch (i) {
                                case 0:
                                    expectResize = resizeFlags.fromTop | resizeFlags.fromLeft;
                                    this.style.cursor = 'nw-resize';
                                    break;
                                case 1:
                                    expectResize = resizeFlags.fromTop;
                                    this.style.cursor = 'n-resize';
                                    break;
                                case 2:
                                    expectResize = resizeFlags.fromTop | resizeFlags.fromRight;
                                    this.style.cursor = 'ne-resize';
                                    break;
                                case 3:
                                    expectResize = resizeFlags.fromLeft;
                                    this.style.cursor = 'w-resize';
                                    break;
                                case 4:
                                    expectResize = resizeFlags.fromRight;
                                    this.style.cursor = 'e-resize';
                                    break;
                                case 5:
                                    expectResize = resizeFlags.fromBottom | resizeFlags.fromLeft;
                                    this.style.cursor = 'sw-resize';
                                    break;
                                case 6:
                                    expectResize = resizeFlags.fromBottom;
                                    this.style.cursor = 's-resize';
                                    break;
                                case 7:
                                    expectResize = resizeFlags.fromBottom | resizeFlags.fromRight;
                                    this.style.cursor = 'se-resize';
                                    break;
                            }
                            invalidate();
                            return;
                        }
                        else if (!isDrag) { $technicalcanvas.css({ 'cursor': 'default' }); }
                    }
                    isResizeDrag = false;
                    expectResize = 0;
                }
            }

            function myDown(e) {
                if (parseInt($(e.target).closest('li').attr('data-page')) === currentpreview) {
                    var $technicalcanvas = $(this);
                    // Reset variables which maintain drag state
                    rmstart = this;
                    rmx = undefined;
                    rmy = undefined;

                    // Keydown for delete button
                    $technicalcanvas.off('keydown.snDocViewer');
                    $technicalcanvas.attr('tabindex', '0').on('keydown.snDocViewer', function (e) {
                        if (mySel && e.which === 46) {
                            index = mySel.index;
                            removeRect(index);
                        }
                    });

                    // Clear technical canvas in case the user doesn't release the mouse over the current canvas
                    $(window).on("mouseup.snDocViewer_" + docViewerId, function (e) {
                        $(window).off("mouseup.snDocViewer_" + docViewerId);
                        isDrag = false;
                        isResizeDrag = false;
                        expectResize = 0;
                        rmstart = null;

                        var technicalctx = $('.sn-docviewer-page[data-page="' + currentpreview + '"] .technical-canvas')[0].getContext('2d');

                        clear(technicalctx);
                        $technicalcanvas.css({ 'cursor': 'auto' });
                    });

                    if (expectResize !== 0) {
                        isResizeDrag = true;
                        return;
                    }
                    if (e.which == 1 || e.which == 3) {
                        removeAllContextMenu();
                    }

                    findSelectedRect.call($technicalcanvas, e);

                    if (!mySel) {
                        drawRectangle.call($technicalcanvas, e);
                        invalidate();
                    }
                    else if (mySel && e.which == 3) {
                        showContextMenuForSelectedRect();
                        e.preventDefault();
                        return false;
                    }
                    else if (mySel) {
                        isDrag = true;
                    }
                }
            }

            function myUp(e) {

                var $currentPage = $('.sn-docviewer-page[data-page="' + currentpreview + '"]');

                var d = 0;
                if (typeof $currentPage.attr('data-degree') !== 'undefined')
                    d = parseInt($currentPage.attr('data-degree'));

                var $canvas = $currentPage.find('.' + canvasType + '-canvas');
                var $technicalcanvas = $currentPage.find('.technical-canvas');
                var diff = ($canvas.offset().left - $technicalcanvas.offset().left) / scale;
                var p = calculateMousePos(e, $technicalcanvas, d);

                var rm = {};
                rm.x = p.x;
                rm.y = p.y;

                if (d !== 0)
                    rm = rotateCoordinates(rm, d, $currentPage, canvasType);

                rmx = rm.x;
                rmy = rm.y;

                if (parseInt($(e.target).closest('li').attr('data-page')) === currentpreview) {
                    isDrag = false;
                    isResizeDrag = false;
                    expectResize = 0;
                    if (started && rmstart === this) {
                        drawRectangleUp.call(this, x0, y0, rmx, rmy, rmx, rmy, rmx, rmy);
                        started = false;
                    }

                    rmstart = null;
                }
                else if (parseInt($(e.target).closest('li').attr('data-page')) !== currentpreview && started) {
                    callbacks.viewerError && callbacks.viewerError(SR.errorWithDrawingOnSelectedPage);
                    started = false;
                }
                else {
                    callbacks.viewerInfo && callbacks.viewerInfo(SR.otherPageIsSelected);
                }
                started = false;
            }

            function myClick(e) {
                var clickedPageNum = parseInt($(e.currentTarget).closest('li').attr('data-page'));

                var oldaPageNum = currentpreview;

                var $admintoolbar = $('.sn-additional-tools');
                var selectedButton = $admintoolbar.find('.active').attr('data-canvastype');
                //if (typeof selectedButton !== 'undefined' && clickedPageNum !== currentpreview) {
                if (clickedPageNum !== currentpreview) {
                    currentpreview = clickedPageNum;
                    currentpreviewWidth = $('#imageContainer' + clickedPageNum).attr('data-width');
                    clearTimeout(setPageAccordingToScroll);


                    if (!$('.sn-doc-thumbnails li[data-page="' + currentpreview + '"]', $container).hasClass('active')) {
                        if (typeof selectedButton !== 'undefined')
                            canvasType = selectedButton;
                        getDeletableAndLoadableCanvases(currentpreview);
                        SetPreviewControls(currentpreview, true);
                        $('.sn-doc-thumbnails li').removeClass('active');
                        $('.sn-doc-thumbnails li[data-page="' + currentpreview + '"]', $container).addClass('active');
                        scrollToThumbnail(currentpreview);
                    }
                }
            }

            function myDblClick(e) {
                var $technicalcanvas = $(this);

                var $currentPage = $('.sn-docviewer-page[data-page="' + currentpreview + '"]');

                var d = 0;
                if (typeof $currentPage.attr('data-degree') !== 'undefined')
                    d = parseInt($currentPage.attr('data-degree'));

                var p = calculateMousePos(e, $technicalcanvas, d);

                rmx = p.x;
                rmy = p.y;

                findSelectedRect.call($technicalcanvas, e);

                if (mySel) {
                    showContextMenuForSelectedRect();
                }
                else {
                    var width = 200;
                    var height = 50;
                    var $canvas = $('.sn-docviewer-page[data-page="' + currentpreview + '"] .' + canvasType + '-canvas');

                    rmx -= ($canvas.offset().left - $technicalcanvas.offset().left);

                    if (canvasType === "redaction" || canvasType == "highlight" && $('.sn-additional-tools .active').length > 0) {
                        addRect(rmx - (width / 2), rmy - (height / 2), width + 10, height + 10, currentpreview, canvasType);
                    }
                    else if (canvasType === "annotation" || canvasType == "Annotation") {
                        addRect(rmx, rmy, 200, 250, currentpreview, canvasType, '14pt', 'Arial', '#333', 'Normal', 'Normal', annotationDefaultText, 20);
                    }
                }
            }

            function findSelectedRect(e) {
                var $technicalcanvas = $(this);

                var $currentPage = $('.sn-docviewer-page[data-page="' + currentpreview + '"]');

                var d = 0;
                if (typeof $currentPage.attr('data-degree') !== 'undefined')
                    d = parseInt($currentPage.attr('data-degree'));

                var $canvas = $currentPage.find('.' + canvasType + '-canvas');
                var technicalctx = $currentPage.find('.technical-canvas')[0].getContext('2d');

                var p = calculateMousePos(e, $technicalcanvas, d);

                var degree = 0;
                if (typeof $currentPage.attr('data-degree') !== 'undefined')
                    degree = parseInt($currentPage.attr('data-degree'));

                if (degree !== 0)
                    p = rotateCoordinates(p, degree, $currentPage, canvasType);

                clear(technicalctx);
                mySel = null;

                for (var i = saveableshapes[canvasType].length; i--;) {
                    if (parseInt(saveableshapes[canvasType][i].imageIndex) === currentpreview) {
                        saveableshapes[canvasType][i].draw(technicalctx, 'black');

                        var diff = ($canvas.offset().left - $technicalcanvas.offset().left) / scale;
                        var imageData = technicalctx.getImageData(p.x - diff, p.y, 1, 1);
                        var index = (p.x - diff + p.y * imageData.width) * 4;
                        clear(technicalctx);

                        if (imageData.data[3] > 0) {
                            mySel = saveableshapes[canvasType][i];
                            x0 = p.x - mySel.x;
                            y0 = p.y - mySel.y;
                            mySel.index = i;
                            invalidate();
                            break;
                        }
                    }
                }
            }

            function showContextMenuForSelectedRect() {
                shapeIndex = mySel.index;
                var height = mySel.h;
                var width = mySel.w;
                var $canvas = $('.sn-docviewer-page[data-page="' + currentpreview + '"] canvas');
                var contextMenuX = mySel.x + ($canvas.offset().left - $canvas.parent().offset().left) / scale;
                var contextMenuY = mySel.y;

                if (canvasType === "redaction" || canvasType === "highlight") {
                    contextMenuX += width;
                    buildContextMenu(canvasType, contextMenuX, contextMenuY, shapeIndex);
                }
                else if (canvasType === "annotation") {
                    contextMenuX -= 130;
                    contextMenuY -= 10;
                    buildContextMenu(canvasType, contextMenuX, contextMenuY, shapeIndex, height, width + 20);
                }
            }

            function invalidate() {
                canvasValid = false;
                if (saveableshapes.annotation.length > 0 || saveableshapes.redaction.length > 0 || saveableshapes.highlight.length > 0) {
                    unsaved = true;
                    callbacks.documentChanged && callbacks.documentChanged();
                }
            }

            function calculateMousePos(e, $this, d) {

                var x = e.pageX,
                y = e.pageY;

                return {
                    x: ((x - $this.offset().left + $this.scrollLeft()) / scale),
                    y: ((y - $this.offset().top + $this.scrollTop()) / scale)
                };
            }

            function calculateRectDimensions(x, y, x0, y0) {
                return {
                    x: Math.min(x, x0),
                    y: Math.min(y, y0),
                    w: Math.abs(x - x0),
                    h: Math.abs(y - y0)
                };
            }

            function drawRectangle(e) {
                started = true;
                var d = 0;
                if (typeof $currentPage.attr('data-degree') !== 'undefined')
                    d = parseInt($currentPage.attr('data-degree'));

                var p = calculateMousePos(e, $(this), d);
                x0 = p.x;
                y0 = p.y;
            }

            function drawRectangleMove(e) {
                if (!started)
                    return;

                var $technicalcanvas = $(this);

                var $currentPage = $('.sn-docviewer-page[data-page="' + currentpreview + '"]');

                var technicalctx = $currentPage.find('.technical-canvas')[0].getContext('2d');

                var d = 0;
                if (typeof $currentPage.attr('data-degree') !== 'undefined')
                    d = parseInt($currentPage.attr('data-degree'));

                var p = calculateMousePos(e, $technicalcanvas, d);
                var r = calculateRectDimensions(p.x, p.y, x0, y0);

                if (p.x > x0 && p.y > y0) { $technicalcanvas.css({ 'cursor': 'nw-resize' }); }
                else if (p.x > x0 && p.y < y0) { $technicalcanvas.css({ 'cursor': 'ne-resize' }); }
                else if (p.x < x0 && p.y > y0) { $technicalcanvas.css({ 'cursor': 'sw-resize' }); }
                else if (p.x < x0 && p.y < y0) { $technicalcanvas.css({ 'cursor': 'se-resize' }); }


                clear(technicalctx);
                technicalctx.fillStyle = '#76C9F5';
                technicalctx.strokeStyle = '#007dc6';
                technicalctx.globalAlpha = 0.5;
                technicalctx.fillRect(r.x, r.y, r.w, r.h);
                technicalctx.strokeRect(r.x, r.y, r.w, r.h);
            }

            function drawRectangleUp(x0, y0, rmx, rmy) {
                var $technicalcanvas = $(this);
                var $canvas = $('.sn-docviewer-page[data-page="' + currentpreview + '"] .' + canvasType + '-canvas');
                var technicalctx = $('.sn-docviewer-page[data-page="' + currentpreview + '"] .technical-canvas')[0].getContext('2d');

                var ctype = getCanvasTypeByToolbar(); //[<?] ctype isn't 'undefined' if one of the annotation, highlight or redaction toolbar button is pushed

                //if (editmode) {
                if (ctype !== undefined) {
                    var r = calculateRectDimensions(rmx, rmy, x0, y0);

                    if (r.w >= 10 || r.h >= 10) {
                        // Account for the difference between widths of different canvases
                        var diff = ($canvas.offset().left - $technicalcanvas.offset().left) / scale;
                        r.x -= diff;
                        // Apply minimal width/height for annotations
                        r.w = canvasType === "annotation" ? Math.max(r.w, 200) : r.w;
                        r.h = canvasType === "annotation" ? Math.max(r.h, 250) : r.h;
                        // Add the new shape
                        if (canvasType === "annotation")
                            addRect(r.x, r.y, r.w, r.h, currentpreview, canvasType, '14pt', 'Arial', '#333', 'Normal', 'Normal', annotationDefaultText, 20);
                        else
                            addRect(r.x, r.y, r.w, r.h, currentpreview, canvasType);
                    }
                }

                started = false;
                clear(technicalctx);
                $technicalcanvas.css({ 'cursor': 'default' });
            }

            function getCanvasTypeByToolbar() {
                return $('.sn-additional-tools').find('span.active').attr('data-canvastype');
            }

            function rubberBandZoom(e) {
                if (!started)
                    return;

                var $technicalcanvas = $(this);

                var $currentPage = $('.sn-docviewer-page[data-page="' + currentpreview + '"]');

                var technicalctx = $currentPage.find('.technical-canvas')[0].getContext('2d');

                var d = 0;
                if (typeof $currentPage.attr('data-degree') !== 'undefined')
                    d = parseInt($currentPage.attr('data-degree'));

                var p = calculateMousePos(e, $technicalcanvas, d);
                var r = calculateRectDimensions(p.x, p.y, x0, y0);
                setZoomLevel(Math.min(maxZoomLevel, containerWidth / r.w), r.x, r.y, $technicalcanvas, true);

                clear(technicalctx);
                $('.sn-icon-rubberband', $toolbarContainer).removeClass('active');
                started = false;
            }

            function buildContextMenu(type, xScreen, yScreen, shapeIndex, height, width) {

                var $technicalcanvas = $('.sn-docviewer-page[data-page="' + currentpreview + '"] .technical-canvas');

                if (parseInt(height) < 250)
                    height = 250 * scale;
                if (parseInt(width) < 300)
                    width = 220 * scale;

                var $contextMenu = $('<div class="sn-contextmenu"></div>').css({
                    'position': 'absolute',
                    'top': yScreen,
                    'left': xScreen,
                    'z-index': 110,
                    'height': height || 'auto',
                    'width': width || 'auto'
                }).on('click.snDocViewer', '.sn-annotation-delete,.sn-icon-delete', function () {
                    removeRect(shapeIndex);
                }).on('click.snDocViewer', '.sn-annotation-save', function () {
                    saveText(shapeIndex);
                }).on('click.snDocViewer', '.sn-annotation-cancel,.sn-icon-delete', removeAllContextMenu);

                if (type === 'redaction' || type === 'highlight') {
                    $contextMenu.html('<span title="' + SR.deleteText + '" class="sn-icon sn-icon-delete">' + SR.deleteText + '</span>').on('click.snDocViewer', '.sn-icon-delete', removeAllContextMenu);
                }
                else {
                    $contextMenu.addClass('sn-annotation-contextmenu');

                    var currentText = allshapes.annotation[shapeIndex].text;
                    var fontFamily = allshapes.annotation[shapeIndex].fontFamily;
                    var fontSize = allshapes.annotation[shapeIndex].fontSize;
                    var fontColor = allshapes.annotation[shapeIndex].fontColor;
                    var fontBold = allshapes.annotation[shapeIndex].fontBold;
                    var fontItalic = allshapes.annotation[shapeIndex].fontItalic;
                    var lineHeight = allshapes.annotation[shapeIndex].lineHeight;

                    $contextMenu.append('\
                                        <div class="sn-edit-annotation-txtcolorcontainer">\
                                            <div data-color="#007dc6" class="sn-edit-annotation-txtcolor sn-edit-annotation-txtcolorblue"></div>\
                                            <div data-color="#ed1c24" class="sn-edit-annotation-txtcolor sn-edit-annotation-txtcolorred"></div>\
                                            <div data-color="#39b54a" class="sn-edit-annotation-txtcolor sn-edit-annotation-txtcolorgreen"></div>\
                                            <div data-color="#f15a24" class="sn-edit-annotation-txtcolor sn-edit-annotation-txtcolororange"></div>\
                                            <div data-color="#333333" class="sn-edit-annotation-txtcolor sn-edit-annotation-txtcolorblack"></div>\
                                        </div>\
                                        <div class="machinator"><select class="sn-edit-annotation-txtfont-select">\
                                            <option value="Arial">Arial</option>\
                                            <option value="Calibri">Calibri</option>\
                                            <option value="Tahoma">Tahoma</option>\
                                        </select></div>\
                                        <div class="machinator"><select class="sn-edit-annotation-txtfontsize-select">\
                                            <option value="8pt">8pt</option>\
                                            <option value="9pt">9pt</option>\
                                            <option value="10pt">10pt</option>\
                                            <option value="12pt">12pt</option>\
                                            <option value="14pt">14pt</option>\
                                            <option value="18pt">18pt</option>\
                                            <option value="24pt">24pt</option>\
                                            <option value="36pt">36pt</option>\
                                        </select></div>\
                                        <div class="sn-edit-annotation-txtfontstylerow">\
                                            <div class="machinator"><input type="checkbox" id="annotation-italic" class="sn-edit-annotation-italic" />\
                                            <label for="annotation-italic"><i>italic</i></label></div>\
                                            <div class="machinator"><input type="checkbox" class="sn-edit-annotation-bold" id="annotation-bold" />\
                                            <label for="annotation-bold"><b>bold</b></label></div>\
                                        </div>');

                    $('select.sn-edit-annotation-txtfont-select option[value="' + fontFamily + '"]', $contextMenu).attr('selected', 'selected');
                    $('select.sn-edit-annotation-txtfontsize-select option[value="' + fontSize + '"]', $contextMenu).attr('selected', 'selected');
                    $('.sn-edit-annotation-txtcolorcontainer div[data-color="' + colorToHex(fontColor) + '"]', $contextMenu).addClass('selected');
                    $('.sn-edit-annotation-bold', $contextMenu).prop('checked', fontBold > 400);
                    $('.sn-edit-annotation-italic', $contextMenu).prop('checked', fontItalic === 'italic');

                    var $buttonContainer = $("<div class='buttonContainer'></div>");
                    var $editTextarea = $('<textarea>' + currentText + '</textarea>').appendTo($buttonContainer).attr('class', 'sn-edit-annotation-txtarea').css({ 'font-family': fontFamily, 'font-size': fontSize, 'color': fontColor, 'font-weight': fontBold, 'font-style': fontItalic, 'line-heigt': lineHeight, 'height': (height - 140), 'width': '100%' });
                    var $deleteButton = $('<span><span title="' + SR.deleteText + '" class="sn-icon sn-icon-delete"></span>' + SR.deleteText + '</span>').appendTo($buttonContainer).attr('class', 'okButton sn-annotation-delete');
                    var $saveButton = $('<span><span title="' + SR.saveText + '" class="sn-icon sn-icon-save"></span>' + SR.saveText + '</span>').appendTo($buttonContainer).attr('class', 'okButton sn-annotation-save');
                    var $cancelButton = $('<span><span title="' + SR.cancelText + '" class="sn-icon sn-icon-cancel"></span>' + SR.cancelText + '</span>').appendTo($buttonContainer).attr('class', 'cancelButton sn-annotation-cancel');
                    $buttonContainer.appendTo($contextMenu);

                    $contextMenu.on('click.snDocViewer', '.sn-edit-annotation-txtcolor', function () {
                        $('.sn-edit-annotation-txtcolor', $contextMenu).removeClass('selected');
                        $editTextarea.css('color', $(this).addClass('selected').attr('data-color'));
                    }).on('change.snDocViewer', 'select.sn-edit-annotation-txtfont-select', function () {
                        $editTextarea.css('font-family', $(this).val());
                    }).on('change.snDocViewer', 'select.sn-edit-annotation-txtfontsize-select', function () {
                        $editTextarea.css('font-size', $(this).val());
                    }).on('change.snDocViewer', 'input.sn-edit-annotation-italic', function () {
                        $editTextarea.css('font-style', $(this).prop('checked') ? 'italic' : 'normal');
                    }).on('change.snDocViewer', 'input.sn-edit-annotation-bold', function () {
                        $editTextarea.css('font-weight', $(this).prop('checked') ? 'bold' : 'normal');
                    });
                }

                $container.find("li.sn-docviewer-page").css("z-index", 0);
                $technicalcanvas.parent().css("z-index", 1);
                $contextMenu.appendTo($technicalcanvas.parent());
                callbacks.contextMenuShown && callbacks.contextMenuShown($contextMenu);
                $contextMenu.find("textarea").focus();
            }

            function colorToHex(color) {
                if (color.substr(0, 1) === '#') {
                    return color;
                }
                var digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color);

                var red = parseInt(digits[2]);
                var green = parseInt(digits[3]);
                var blue = parseInt(digits[4]);

                var rgb = blue || (green << 8) || (red << 16);
                return digits[1] + '#' + rgb.toString(16);
            }

            function showShapesOnPages() {
                var savedType = canvasType;
                $.each(allshapes, function (t) {
                    canvasType = t;
                    mainDraw(true);
                });
                canvasType = savedType;
                // Start the redraw interval

                clearInterval(mainDraw);
                setInterval(mainDraw, redrawInterval);
            }

            function saveText(shapeIndex) {
                var fontFamily = $('.sn-edit-annotation-txtarea').css('font-family');
                var fontSize = parseInt(parseInt($('.sn-edit-annotation-txtarea').css('font-size')) * 0.75) + 'pt';

                var fontColor = $('.sn-edit-annotation-txtarea').css('color');
                var fontItalic = $('.sn-edit-annotation-txtarea').css('font-style');
                var fontBold = $('.sn-edit-annotation-txtarea').css('font-weight');
                var text = $('.sn-edit-annotation-txtarea').val();
                var lineHeight = parseInt(fontSize);
                allshapes.annotation[shapeIndex].fontColor = fontColor;
                allshapes.annotation[shapeIndex].fontSize = fontSize;
                allshapes.annotation[shapeIndex].fontFamily = fontFamily;
                allshapes.annotation[shapeIndex].fontItalic = fontItalic;

                allshapes.annotation[shapeIndex].fontBold = fontBold;
                allshapes.annotation[shapeIndex].text = text;
                allshapes.annotation[shapeIndex].lineHeight = lineHeight;

                removeAllContextMenu();
                invalidate();
            }

            function removeAllContextMenu() {
                $('.sn-contextmenu', $container).remove();
            }

            function clearShapeSelections() {
                mySel = null;
                removeAllContextMenu();
                var technicalctx = $('.sn-docviewer-page[data-page="' + currentpreview + '"] .technical-canvas')[0].getContext('2d');
                clear(technicalctx);
                mainDraw(true);
            }

            function clearMenuSelection($setActive) {
                removeAllContextMenu();
                $('.sn-docviewer-tools .sn-icon', $container).removeClass('active');
                if ($setActive) {
                    $setActive.addClass('active');
                }
            }

            function saveShapes() {
                var savable = {
                    "Shapes": JSON.stringify([
                         { 'redactions': saveableshapes.redaction },
                         { 'highlights': saveableshapes.highlight },
                         { 'annotations': saveableshapes.annotation }
                    ]),
                    "PageAttributes": JSON.stringify(pageAttributesObj)
                };
                return savable;
            }

            function isLoaded(i) {
                var that = $('.sn-docviewer-page[data-page="' + i + '"] img');
                that = $('.sn-thumbnail-page[data-page="' + i + '"] img');
                return that.attr('data-loaded');
            }

            function isCanvasesLoaded(i) {
                var that = $('.sn-docviewer-page[data-page="' + i + '"]');
                return (that.children('canvas').length > 0);
            }

            function checkContainerHeight(w, h) {
                $('.docpreview ul li').each(function () {
                    $(this).css({ 'width': w, 'height': h });
                });
                $('.docpreview ul,.docpreview .zoomer').height(maxpreview * (h + 50));
            }

            function destroyPlugin() {
                // Fire document closed handler
                callbacks.documentClosed && callbacks.documentClosed();
                $docpreview.children().remove();
                // Unsubscribe from all events and remove all elements
                // NOTE: jQuery's empty() and remove() will take care of unsubscribing from events, etc. so we don't need to bother with those
                if (dataObj.isFullscreen()) {
                    $(window).off('resize.snDocViewerFullscreen');
                    // NOTE: empty() and remove() will take care of unsubscribing from events, etc.
                    $(".sn-docpreview-fullscreen-wrapper").remove();
                }
                $("#sn-docpreview-print-iframe").remove();
                $pluginSubject.empty();
                $(window).off(".snDocViewer_" + docViewerId);

                // Remove main draw interval
                clearInterval(mainDraw);

                // Delete things from the API so that users can no longer mess with it
                for (var prop in dataObj) {
                    delete dataObj[prop];
                }
                // Forget the plugin subject
                $pluginSubject.removeData('snDocViewer');
                $pluginSubject = null;
            }

            function refreshViewer(pager, previews, thumbnails) {
                refreshPageCount(pager, previews, thumbnails);
            }

            function refreshPageCount(pager, previews, thumbnails) {
                var previewCount = 0;
                if (typeof (options.getPC) === "function") {
                    options.getPC(filePath).done(function (data) {
                        var pc = data.d.PageCount;
                        if (pc !== maxpreview)
                            maxpreview = pc;
                        if (pager)
                            refreshPager();
                        if (previews)
                            refreshPreviews();
                        if (thumbnails)
                            refreshThumbnails();
                    });
                }
            }

            function refreshPager() {
                $('#docpreviewpage').text(' / ' + maxpreview);
                if (maxpreview < parseInt($('.sn-input-jumptopage').val())) {
                    removeAllContextMenu();
                    jumpDistance = Math.abs(maxpreview);
                    getDeletableAndLoadableCanvases(maxpreview);
                    SetPreviewControls(maxpreview);
                }
            }

            function refreshPreviews() {

                var $imageList = $('ul', $docpreview);
                $imageList.html('');



                if (typeof (options.getExistingPreviewImages) === "function") {
                    options.getExistingPreviewImages().done(function (data) {

                        existingPages = data;
                        if (showthumbnails) {
                            $thumbnailList.html('');
                            createThumbnailContainersOnInterval(data, $thumbnailList);
                        }

                        createImageContainersOnInterval(data, $imageList);
                        getDeletableAndLoadableCanvases(1, data);
                        fitToWidth(data[0].Width);
                        firstLoad = 0;

                        $(window).on("unload.snDocViewer_" + docViewerId, function () {
                            callbacks.documentClosed && callbacks.documentClosed();
                        });

                        $docpreview.on('touchstart', function () {
                            touched = true;
                        });

                        if (reactToResize) {
                            var onResized = function () {
                                var isFullscreen = dataObj.isFullscreen();

                                //window resize delay
                                setTimeout(function () {
                                    if (isFullscreen) {
                                        // In fullscreen mode
                                        containerHeight = $(window).height() - $docpreview.offset().top;
                                        containerWidth = $(window).width();
                                    }
                                    else {
                                        // In normal (non-fullscreen) mode
                                        containerHeight = (typeof (options.containerHeight) === "function" ? options.containerHeight() : options.containerHeight) || $pluginSubject.height();
                                        containerWidth = (typeof (options.containerWidth) === "function" ? options.containerWidth() : options.containerWidth) || $pluginSubject.width();
                                    }
                                    $docpreview.width(containerWidth).height(containerHeight);
                                }, 300);
                            };
                            $(window).on("resize.snDocViewer_" + docViewerId, onResized);
                            // Resize on tablets
                            $(window).on("orientationchange.snDocViewer_" + docViewerId, onResized);
                        }
                        // Call document opened callback
                        callbacks.documentOpened && callbacks.documentOpened();

                        if (scale !== 1 && scale <= maxZoomLevel && scale >= minZoomLevel && !touch) {
                            setZoomLevel(scale);
                        }



                        if (touch) {

                            var rate = containerWidth / imgWidth;
                            if (!fitContainer)
                                rate = scale;

                            scale = rate;

                            $('.docpreview').ready(function () {

                                var rate = $('body').width() / imgWidth;

                                var myScroll = new IScroll('#docpreview', {
                                    zoom: true,
                                    scrollX: true,
                                    scrollY: true,
                                    mouseWheel: true,
                                    zoomMin: minZoomLevel,
                                    zoomMax: maxZoomLevel,
                                    startZoom: rate
                                });

                                enterFullscreenMode();

                                myScroll.on('scrollEnd', updatePosition);

                                $('.sn-icon-originalsize').on('click', function () {
                                    myScroll.zoom(1);
                                });

                                $('.sn-icon-fittowindow').on('click', function () {
                                    var containerWidth, fitToWidthScale;
                                    containerWidth = myScroll.wrapperWidth;
                                    fitToWidthScale = (containerWidth / imgWidth).toFixed(2);
                                    myScroll.zoom(fitToWidthScale);
                                });


                            });

                        }

                        $docpreview.scrollTop(0);

                        unsaved = false;

                        $docpreview.scroll($.debounce(500, function () {
                            if ($('.sn-docpreview-desktop:hover').length !== 0) {
                                setPageAccordingToScroll(true);
                            }
                        }));

                        $('.sn-doc-thumbnails').scroll($.debounce(250, function () {
                            scrollThumbnails();
                        }));

                        $thumbnailList.on('click.snDocViewer', '.sn-thumbnail-page', function () {
                            if ($(this).children('img').attr('data-loaded') === "true") {
                                var thumbnailNum = parseInt($(this).attr('data-page'));
                                removeAllContextMenu();

                                if (newPage(pageNum)) {
                                    demandNewPage(pageNum);
                                    setDataTops(pageNum);
                                }

                                getDeletableAndLoadableCanvases(thumbnailNum);
                                SetPreviewControls(thumbnailNum);
                            }
                        });

                    });
                }

            }

            function refreshThumbnails() {
                if (showthumbnails) {
                    $('.sn-doc-thumbnails').html('');
                    $('.sn-doc-thumbnails').append('<ul></ul>');
                    $thumbnailList = $('ul', $('.sn-doc-thumbnails'));
                    for (var i = 0; i < parseInt(maxpreview) ; i++) {
                        $thumbnailList.append('<li class="sn-thumbnail-page" data-page="' + (i + 1) + '" style="max-width: 95px;max-height: 150px;margin-right: 20px;"><img src="' + placeholderImgPath + '" width="32" data-loaded="false" /><span>Page ' + (i + 1) + '</span></li>');
                    }
                    deleteUnnecessaryThumbnails(showable);
                    if (typeof (options.getThumbnail) === "function") {
                        $.each(showable, function (i, item) {
                            options.getThumbnail(item).done(function (data) {
                                displayThumbnail(item, data.PreviewAvailable);
                            });
                        });
                    }

                    hthumbnails = thumbnails;
                }


                $docpreview.on('click.snDocViewer', '.sn-docviewer-page', function () {
                    if ($(this).children('img').attr('data-loaded') === 'true') {
                        var pNum = parseInt($(this).attr('data-page'));
                        removeAllContextMenu();

                        getDeletableAndLoadableCanvases(pNum);
                        SetPreviewControls(pNum);
                    }
                });

                $thumbnailList.on('click.snDocViewer', '.sn-thumbnail-page', function () {
                    if ($(this).children('img').attr('data-loaded') === "true") {
                        var thumbnailNum = parseInt($(this).attr('data-page'));
                        removeAllContextMenu();

                        if (newPage(pageNum)) {
                            demandNewPage(pageNum);
                            setDataTops(pageNum);
                        }

                        getDeletableAndLoadableCanvases(thumbnailNum);
                        SetPreviewControls(thumbnailNum);
                    }
                });
            }

            function refreshEditorButtons(buttonArray) {
                var $editortools = $('.sn-additional-tools');
                $.each(buttonArray, function (i, item) {
                    $('.sn-additional-tools').find('span.sn-icon').each(function () {
                        var that = $(this);
                        if (that.attr('data-canvastype') === item.name) {
                            $.each(item.additionalProps, function (pi, pitem) {
                                that.attr(pi, pitem);
                            });
                            that.removeClass('active');
                            destroyCanvasFeature();
                        }
                    });
                });
            }

            function adminbutton(name, buttonAdditonalProperties) {
                this.name = name;
                this.additionalProps = buttonAdditonalProperties;
            }

            function disableEditorButtons() {
                var buttonArray = [];
                buttonArray[0] = new adminbutton('annotation', { disabled: true });
                buttonArray[1] = new adminbutton('highlight', { disabled: true });
                buttonArray[2] = new adminbutton('redaction', { disabled: true });
                refreshEditorButtons(buttonArray);
            }

            function enableEditorButtons() {
                var buttonArray = [];
                buttonArray[0] = new adminbutton('annotation', { disabled: false });
                buttonArray[1] = new adminbutton('highlight', { disabled: false });
                buttonArray[2] = new adminbutton('redaction', { disabled: false });
                refreshEditorButtons(buttonArray);
            }

            function saveablePage(pageNum, options) {
                this.pageNum = pageNum;
                this.options = options;
            }

            //rotation

            function rotate(degree, pageNumber, isMultiple, notClicked) {

                var $currentPage = $('.sn-docviewer-page[data-page=' + pageNumber + ']');
                var currentDegree = parseInt($currentPage.attr('data-degree'));
                if (currentDegree === null || typeof $currentPage.attr('data-degree') === 'undefined')
                    currentDegree = 0;


                if ($currentPage.hasClass('rotated')) {
                    if (degree !== 0) {
                        $currentPage.attr('data-degree', degree);
                        disableEditorButtons();
                    }
                    else {
                        $currentPage.removeClass('rotated');
                        $currentPage.removeAttr('data-degree');
                        enableEditorButtons();
                    }
                }
                else {
                    $currentPage.addClass('rotated');
                    $currentPage.attr('data-degree', degree);
                    newDegree = degree;
                    disableEditorButtons();
                }
                rotateImage($currentPage, isMultiple);
                if (!notClicked)
                    rotateCanvases($currentPage);

                recalculatePageTops(pageNumber);

                //if (isFirstLoad)
                //    rotateThumbnail(pageNumber, computeDegree(currentDegree, degree));
            }

            function computeDegree(currentDegree, degree) {
                var rotationDegree = currentDegree + degree;
                if (rotationDegree > 180) {
                    rotationDegree -= 360;
                }
                else if (rotationDegree < -91) {
                    rotationDegree += 360;
                }
                return rotationDegree;
            }

            function rotateImage(p, isMultiple, lastPageNumber) {
                if (isMultiple || parseInt(p.attr('data-page')) === currentpreview) {
                    callbacks.loadingStarted && callbacks.loadingStarted();
                }
                var d = p.attr('data-degree');
                if (typeof d === 'undefined' || d === null)
                    d = 0;
                else
                    d = parseInt(d);

                var $img = p.find('img');
                $img.attr('src', modifyPageImgHref($img.attr('src'), d));

                $img.imageLoad(function () {
                    if (d === 90 || d === -90 || d === 270) {
                        $img.css({ 'margin': '120px 0' });
                    }
                    else {
                        $img.css({ 'margin': '0 120px' });
                    }

                    resizeContainer(p);
                    if (!isMultiple || (isMultiple && numberOfPagesForRotation === 1))
                        callbacks.loadingEnded && callbacks.loadingEnded();
                    else if (numberOfPagesForRotation !== 0)
                        numberOfPagesForRotation -= 1;
                });
            }

            function resizeContainer(p) {
                var d = p.attr('data-degree');
                if (typeof d === 'undefined' || d === null)
                    d = 0;
                else
                    d = parseInt(d);
                var $img = p.find('img');
                var width = $img.width();
                var height = $img.height();
                var leftMargin;

                if (d === 90 || d === -90 || d === 270) {
                    leftMargin = Math.abs(p.closest('ul').width() - height) / 2;
                    if (height > width)
                        leftMargin = Math.abs(p.closest('ul').width() - width) / 2;
                    p.removeAttr('style');
                    p.css({
                        'margin': '0px auto 50px',
                        'width': parseInt(p.attr('data-height')),
                        'height': parseInt(p.attr('data-width')) + 240
                    });
                    if (width < height)
                        p.closest('ul').width(height);
                    else
                        p.closest('ul').width(parseInt(p.attr('data-height')) + 240);
                }
                else {
                    leftMargin = (p.closest('ul').width() - p.width()) / 2;
                    if (height > width)
                        leftMargin = Math.abs(p.closest('ul').width() - height) / 2;
                    p.removeAttr('style');
                    if (height < width) {
                        p.css({
                            'margin': '0px auto 50px',
                            'width': height + 240,
                            'height': width
                        });
                    }
                    else {
                        p.css({
                            'margin': '0px auto 50px',
                            'width': width + 240,
                            'height': height
                        });
                    }

                    if (width < height)
                        p.closest('ul').width(height);
                    else
                        p.closest('ul').width(width + 240);
                }

            }

            function rotateCanvases(p) {
                var d = p.attr('data-degree');
                if (typeof d === 'undefined' || d === null)
                    d = 0;
                else
                    d = parseInt(d);

                var translation = 'rotate(' + d + 'deg)';

                var $img = p.find('img');
                var imgWidth = parseInt(p.attr('data-width'));
                var imgHeight = parseInt(p.attr('data-height'));
                var top, left;

                switch (d) {
                    case 0:
                        if (imgHeight < imgWidth) { //rotation 0 landscape

                        }
                        else {                      //rotation 0 portrait

                        }
                        break;
                    case -90:
                        if (imgHeight < imgWidth) { //rotation -90 landscape
                            left = -Math.abs(imgHeight - imgWidth) / 2;
                            top = -Math.abs(imgHeight - imgWidth) / 2;
                            translation = 'rotate(' + d + 'deg) translate(' + (top - 120) + 'px, ' + (left - 120) + 'px)';
                        }
                        else {                      //rotation -90 portrait
                            top = Math.abs(imgHeight - imgWidth) / 2;
                            left = Math.abs(imgWidth - imgHeight) / 2;
                            translation = 'rotate(' + d + 'deg) translate(' + (top - 120) + 'px, ' + (left - 120) + 'px)';
                        }
                        break;
                    case 180:
                        if (imgHeight < imgWidth) { //rotation 180 landscape
                            left = (imgHeight - (imgWidth) / 2) - 35;
                            translation = 'rotate(' + d + 'deg)';
                        }
                        else {                      //rotation 180 portrait
                            left = -(imgHeight - (imgWidth + 200)) / 2 - 120;
                            translation = 'rotate(' + d + 'deg)';
                        }
                        break;
                    case 90:
                        if (imgHeight < imgWidth) {  //rotation 90 landscape
                            left = Math.abs(imgHeight - imgWidth) / 2;
                            top = Math.abs(imgHeight - imgWidth) / 2;
                            translation = 'rotate(' + d + 'deg) translate(' + (top + 120) + 'px, ' + (left + 120) + 'px)';
                        }
                        else {                      //rotation 90 portrait

                            top = -Math.abs(imgHeight - imgWidth) / 2;
                            left = -Math.abs(imgWidth - imgHeight) / 2;
                            translation = 'rotate(' + d + 'deg) translate(' + (top + 120) + 'px, ' + (left + 120) + 'px)';
                        }
                        break;
                }


                p.children('canvas:not(".technical-canvas")').css({
                    '-ms-transform': translation,
                    '-webkit-transform': translation,
                    'transform': translation,
                    '-moz-transform': translation,
                    '-o-transform': translation
                });
                var twidth = p.children('canvas.technical-canvas').width(),
                    theight = p.children('canvas.technical-canvas').height();
                p.children('canvas.technical-canvas').css({
                    width: theight,
                    height: twidth
                });

            }

            function modifyPageImgHref(href, degree) {
                var newHref = href;
                if (href.indexOf('?') > -1) {
                    if (href.indexOf('rotation') > -1) {
                        var rotationDegreeIndex = href.indexOf('rotation') + 9;
                        newHref = newHref.substr(0, rotationDegreeIndex) + degree;
                    }
                    else {
                        newHref += '&rotation=' + degree;
                    }
                }
                else {
                    newHref += '?rotation=' + degree;
                }

                return newHref;
            }

            function rotateThumbnail(d, p) {
                var that = $('.sn-thumbnail-page[data-page="' + p + '"]');
                that.attr('data-degree', d);
                var height;

                var $img = that.children('img');

                var w = $img.width();
                var h = $img.height();

                var thumbnailPath = $img.attr('src');

                var a = w;
                w = h;
                h = a;


                thumbnailPath = appendPreviewPostfix(thumbnailPath, !noWatermark, addNoCachePostfix);
                thumbnailPath = modifyPageImgHref(thumbnailPath, d);
                $img.attr('src', thumbnailPath);
                $img.attr('data-loaded', true);

                if (d === 90 || d === -90) {
                    $img.width(parseInt(that.attr('data-height'))).height(parseInt(that.attr('data-width')));
                    that.width(parseInt(that.attr('data-height')) + 2);
                    that.height(parseInt(that.attr('data-width')) + 40);
                }
                else {
                    $img.width(parseInt(that.attr('data-width'))).height(parseInt(that.attr('data-height')));
                    that.width(parseInt(that.attr('data-width')) + 2);
                    that.height(parseInt(that.attr('data-height')) + 40);
                }
            }

            function setRotation($img, d, l) {
                $img.css({
                    '-ms-transform': 'rotate(' + d + 'deg) translate(' + l + ')',
                    '-webkit-transform': 'rotate(' + d + 'deg) translate(' + l + ')',
                    'transform': 'rotate(' + d + 'deg) translate(' + l + ')',
                    '-moz-transform': 'rotate(' + d + 'deg) translate(' + l + ')',
                    '-o-transform': 'rotate(' + d + 'deg) translate(' + l + ')'
                });
            }

            function saveRotation(p, d) {
                var savedIndex = checkIfItsSavedAlreeady(p);
                if (savedIndex > -1) {
                    pageAttributesObj[savedIndex].options.degree = d;
                }
                else {
                    pageAttributesObj.push(new saveablePage(p, { 'degree': d }));
                }
            }

            function checkIfItsSavedAlreeady(p) {
                for (var i = 0; i < pageAttributesObj.length; i++) {
                    if (parseInt(pageAttributesObj[i].pageNum) === parseInt(p)) {
                        return i;
                    }
                    else if (parseInt(pageAttributesObj[i].pageNum) === parseInt(p) && i === pageAttributesObj.length - 1) {
                        return -1;
                    }
                }

            }

            function recalculatePageTops(p) {
                for (var i = p; i < $('.sn-docviewer-page').length + 1; i++) {
                    var $li = $('.sn-docviewer-page').eq(i);
                    $li.attr('data-top', getTopOfThePage(i + 1));
                }
                callbacks.rotationEnded && callbacks.rotationEnded($('.sn-viewer-rotate span.saveActive'));
            }

            Array.prototype.allValuesSame = function () {

                for (var i = 1; i < this.length; i++) {
                    if (this[i].options.degree !== this[0].options.degree)
                        return false;
                }

                return true;
            }

            $.fn.imageLoad = function (fn) {
                this.load(fn);
                this.each(function () {
                    if (this.complete && this.naturalWidth !== 0) {
                        $(this).trigger('load');
                    }
                });
            }

            $.fn.insertIndex = function (i, $el) {
                // The element we want to swap with
                var $target = $el.children().eq(i);

                if ($target.length === 0)
                    $el.append(this);

                    // Determine the direction of the appended index so we know what side to place it on
                else if (this.index() > i) {
                    $target.before(this);
                } else {
                    $target.after(this);
                }

                return this;
            };


            // Store an object with methods, attached to the element so that users of the plugin can manipulate it from the outside
            var dataObj = {
                // Sets the current zoom level of the viewer.
                // Parameters: newLevel, x0, y0, $rel
                setZoomLevel: setZoomLevel,

                // Removes all context menu related to this plugin from the DOM
                removeContextMenu: removeAllContextMenu,

                // Enters fullscreen mode
                enterFullscreenMode: enterFullscreenMode,

                // Exits fullscreen mode
                exitFullscreenMode: exitFullscreenMode,

                // Saves shapes for the current document
                //TODO: saveShapes: saveShapes,

                // Destroys the current plugin instance
                destroy: destroyPlugin,

                // Tries to bring up the browser's print dialog for the current document
                //TODO: printDocument: printDocument,

                // Gets all shapes for the current document
                getAllShapes: function () { return allshapes; },

                // Scrolls the viewport horizontally
                scrollViewportLeft: function (val) { $docpreview.scrollLeft(val); },

                // Scrolls the viewport vertically
                scrollViewportTop: function (val) { $docpreview.scrollTop(val); },

                // Tells if there are unsaved changes for the current document
                isUnsaved: function () { return unsaved; },

                // Sets unsaved property
                setUnsaved: function (isUnsaved) { unsaved = isUnsaved; },

                // Tells if the viewer is in fullscreen mode
                isFullscreen: function () { return $container.parent().hasClass("sn-docpreview-fullscreen-wrapper"); },

                // Tells if watermarking is switched on
                isWatermarked: function () { return $('.sn-icon-nowatermark').length > 0 },

                // Gets the current zoom level of the viewer
                zoomLevel: function () { return scale; },

                // Gets the container DOM element of the viewer
                getContainer: function () { return $container; },

                // Gets the viewport element of the viewer
                getViewport: function () { return $docpreview; },

                // Gets the identifier of this viewer
                getViewerId: function () { return docViewerId; },

                // Schedules a redraw for the viewer
                scheduleRedraw: function () { invalidate(); },

                // Changes the currently displayed page in the viewer
                changePage: SetPreviewControls,

                // Gets the current page the viewer is on
                currentPage: function () { return currentpreview; },

                // Gets number of the called page
                calledPage: function () { return pageNum; },

                // Gets the number of pages the current document has
                pageCount: function () { return maxpreview; },

                //Gets the number of the loaded preview pages (array)
                loadedImages: function () { return hpages; },

                // Tells when a preview page image is loaded
                pageIsLoaded: isLoaded,

                // Tells when all canvases of a preview page are loaded
                canvasesAreLoaded: isCanvasesLoaded,

                saveShapes: saveShapes,

                setPageAccordingToScroll: setPageAccordingToScroll,

                appendPreviewPostfix: appendPreviewPostfix,

                refreshViewer: refreshViewer,

                refreshEditorButtons: refreshEditorButtons

            };



            // Initialize the plugin when the document is ready
            $(initializeDocViewerPlugin);
            // Set the data object (this will serve as the public API)
            $pluginSubject.data('snDocViewer', dataObj);
            // Maintain jQuery chainability
            return $pluginSubject;
        }
    });
})(jQuery);
