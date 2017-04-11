// using $skin/scripts/plugins/excanvas.compiled.js

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
                annotationDefaultText: 'Select note and right click to edit text',
                page: 'Page',
                showThumbnails: 'Show thumbnails',
                deleteText: 'Delete',
                saveText: 'Save',
                cancelText: 'Cancel',
                originalSizeText: 'Original size',
                downloadText: 'Download'
            }, options.SR);

            // Callbacks for various events
            var callbacks = $.extend({
                // Called when the document was opened,
                // ie. when this plugin was initialized
                documentOpened: null,

                // Called when the document is closed,
                // ie. when either the plugin is destroyed or the window is unloaded
                documentClosed: null,

                // Called when the print dialog is popped up
                // IMPORTANT: there is no way to tell if the document was actually printed or not
                documentBeforePrint: null,

                // Called when the print dialog is closed
                // IMPORTANT: there is no way to tell if the document was actually printed or not
                documentAfterPrint: null,

                // Called when the user tries to print the document but it is not possible in the current browser
                // NOTE: this is possible in old or inferior browsers
                documentCantPrint: null,

                // Called when the user clicks on the download button
                // NOTE: The download button will be hidden if this is null
                documentDownload: null,

                // Called after going to a different page of the document (parameter: page number)
                // NOTE: this is called when the user scrolls to a different page, or clicks a thumbnail, or when the viewer otherwise goes to a different page
                pageChanged: null,

                // Called after a context menu is shown
                contextMenuShown: null,

                // Called when the zoom level is changed
                zoomLevelChanged: null
            }, options.callbacks);

            // Other options
            var metadataHtml = options.metadataHtml || null;
            var items = options.items || [];
            var showtoolbar = options.showtoolbar || false;
            var edittoolbar = options.edittoolbar || false;
            var showthumbnails = options.showthumbnails || false;
            var metadata = options.metadata || false;
            var isAdmin = options.isAdmin || false;
            var noWatermark = options.noWatermark || false;
            var noRedaction = options.noRedaction || false;
            var showShapes = options.showShapes || true;
            var shapes = options.shapes || "";
            var title = options.title || "";
            var containerWidth = (typeof (options.containerWidth) === "function" ? options.containerWidth() : options.containerWidth) || $pluginSubject.width();
            var containerHeight = (typeof (options.containerHeight) === "function" ? options.containerHeight() : options.containerHeight) || $pluginSubject.height();
            var reactToResize = options.reactToResize === true ? true : false;
            var waterMarkString = options.waterMarkString;
            var redrawInterval = options.redrawInterval || 20;
            var minZoomLevel = options.minZoomLevel || 0.6
            var maxZoomLevel = options.maxZoomLevel || 4;
            var annotationDefaultText = options.annotationDefaultText || SR.annotationDefaultText;
            var pageMargin = options.pageMargin || 50;
            var filePath = options.filePath || null;
            var imgWidth = options.imgWidth || 724;
            var imgHeight = options.imgHeight || 1024;
            var msie8 = false;
            var agentStr = navigator.userAgent;
            if (agentStr.indexOf("Trident/4.0") > -1) { msie8 = true; }
            // Get some values
            var maxpreview = options.previewCount || 0;
            var currentpreview = maxpreview > 0 ? 1 : 0;

            var editbuttons = {
                annotations: '<span title="' + SR.toolbarNotes + '"><span class="sn-icon sn-icon-notes" data-canvastype="annotation"></span></span>',
                highlights: '<span title="' + SR.toolbarHighlight + '"><span class="sn-icon sn-icon-highlight" data-canvastype="highlight"></span></span>',
                redaction: '<span title="' + SR.toolbarRedaction + '"><span class="sn-icon sn-icon-redaction" data-canvastype="redaction"></span></span>',
                pager: '<div class="sn-pager">\
                            <span title="' + SR.toolbarFirstPage + '"><span class="sn-icon sn-icon-firstpage"></span></span>\
                            <span title="' + SR.toolbarPreviousPage + '"><span class="sn-icon sn-icon-prev"></span></span>\
                            <span class="pagenumber"><span id="docpreviewpage">' + currentpreview + '</span> / ' + maxpreview + '</span>\
                            <span title="' + SR.toolbarNextPage + '" ><span class="sn-icon sn-icon-next"></span></span>\
                            <span title="' + SR.toolbarLastPage + '"><span class="sn-icon sn-icon-lastpage"></span></span>\
                        </div>',
                fittowindow: '<span title="' + SR.toolbarFitWindow + '"><span class="sn-icon sn-icon-fittowindow"></span></span>',
                fittowidth: '<span title="' + SR.toolbarFitWidth + '"><span class="sn-icon sn-icon-fittowidth"></span></span>',
                fittoheight: '<span title="' + SR.toolbarFitHeight + '"><span class="sn-icon sn-icon-fittoheight"></span></span>',
                fullscreen: '<span title="' + SR.toolbarFullscreen + '"><span class="sn-icon sn-icon-fullscreen"></span></span>',
                rubberbandzoom: '<span title="' + SR.toolbarRubberBandZoom + '"><span class="sn-icon sn-icon-rubberband" id="sn-rubberband"></span></span>',
                zoomout: '<span title="' + SR.toolbarZoomOut + '"><span class="sn-icon sn-icon-zoomout" ></span></span>',
                zoomin: '<span title="' + SR.toolbarZoomIn + '"><span class="sn-icon sn-icon-zoomin" ></span></span>',
                print: '<span title="' + SR.toolbarPrint + '"><span class="sn-icon sn-icon-print" ></span></span>',
                originaldocument: '<span title="' + SR.toolbarHideShapes + '"><span class="sn-icon sn-icon-original"></span></span>',
                editeddocument: '<span title="' + SR.toolbarShowShapes + '"><span class="sn-icon sn-icon-edited"></span></span>',
                watermark: '<span title="' + SR.toolbarShowWatermark + '"><span class="sn-icon sn-icon-watermark"></span></span>',
                nowatermark: '<span title="' + SR.toolbarHideWatermark + '"><span class="sn-icon sn-icon-nowatermark"></span></span>',
                save: '<span title="' + SR.toolbarBurn + '"><span class="sn-icon sn-icon-save"></span></span>',
                originalsize: '<span title="' + SR.originalSizeText + '"><span class="sn-icon sn-icon-originalsize"></span></span>',
                download: '<span title="' + SR.downloadText + '"><span class="sn-icon sn-icon-download"></span></span>'
            };

            // Variables for the plugin
            var scale = 1;
            var allshapes = {
                redaction: [],
                highlight: [],
                annotation: []
            };
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
            var type;
            var editmode = false;
            var shapesAreShowing = false;
            var $imagecontainer, $metadatacontainer, $docpreview, $toolbarContainer;
            var started = false;
            var x0, y0;
            var unsaved = false;
            var pages = []; var hpages = []; var thumbnails = []; var hthumbnails = [];


            // Gets the canvas context on the current page for the current type
            var getCanvasContextForType = function (t, p) { //[<?] mod
                var ctx = contexts[p || currentpreview];
                if (ctx)
                    return ctx[t || type];
                return null;
            };
            // Gets the technical canvas context on the current page
            var getTechnicalCanvasContext = function (p) { //[<?] mod
                var ctx = contexts[p || currentpreview];
                if (ctx)
                    return ctx.technical;
                return null;
            };
            // Gets the canvas on the current page for the current type
            var $getCanvasForType = function (t, p) { //[<?] mod
                var ctx = contexts[p || currentpreview];
                if (ctx)
                    return $(ctx[t || type].canvas);
                return null;
            };
            // Gets the technical canvas on the current page
            var $getTechnicalCanvas = function (p) { //[<?] mod
                var ctx = contexts[p || currentpreview];
                if (ctx)
                    return $(ctx[t || type].technical.canvas);
                return null;
            };

            // Initializes the plugin - constructs the basic elements
            function initializeDocViewerPlugin() {
                $container.html("");
                $imagecontainer = $('<div class="image-container"><div class="loading"></div></div>');
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
                    $metadatacontainer.append('<div class="sn-doc-thumbnails"></div><div class="loading"></div>');
                }
                if (metadata) {
                    $metadatacontainer.append(metadataHtml);
                }

                $container.append('<div style="clear:both;height:1px;">&nbsp;</div>');
                $docpreview.width(containerWidth).height(containerHeight).on('contextmenu.snDocViewer', function () { return false; }).appendTo($imagecontainer);
                var $imageList = $('ul', $docpreview);
                var placeholderImgPath = '/Root/Global/images/blank.gif';
                $('.sn-doc-thumbnails').append('<ul></ul>');
                var $thumbnailList = $('ul', $('.sn-doc-thumbnails'));
                for (i = 0; i < parseInt(maxpreview); i++) {
                    $imageList.append('<li class="sn-docviewer-page empty" id="imageContainer' + (i + 1) + '" data-page="' + (i + 1) + '"><img src="/Root/Global/images/ajax-loader.gif" /></li>');
                    $thumbnailList.append('<li class="sn-thumbnail-page empty" data-page="' + (i + 1) + '" style="width: 90px;height: 150px;margin-right: 20px;"><img src="/Root/Global/images/ajax-loader.gif" width="32" /><span>Page ' + (i + 1) + '</span></li>');
                }
                $('li', $imageList).each(function (i, item) {
                    var $li = $(item);
                    var $img = $('img', $li);
                    $li.css({
                        'height': imgHeight,
                        'width': (imgWidth + 120),
                        'margin': '0 auto ' + pageMargin + 'px auto'
                    });
                });
                loadImages(1, true);
                loadThumbnails(1);
                parseShapesJson(shapes);
                //                parseShapesJson(shapes);
                //                if (showShapes) {
                //                    showShapesOnAllPages();
                //                }

                $(window).on("unload.snDocViewer_" + docViewerId, function (e) {
                    // Call document closed callback
                    callbacks.documentClosed && callbacks.documentClosed();
                });

                var mouseover = false;
                $docpreview.hover(function () {
                    mouseover = true;
                }, function () {
                    mouseover = false;
                });

                $docpreview.on('scroll.snDocViewer', function () {
                    // Don't bother the DOM on every scroll event, just once when scrolling is finished
                    if (mouseover) {
                        clearTimeout(setPageAccordingToScroll);
                        setTimeout(setPageAccordingToScroll, 100);
                    }
                });


                $('.sn-doc-thumbnails').on('scroll.snDocViewer', function () {
                    var containerLeft = $('.sn-doc-thumbnails').offset().left;
                    var containerWidth = $('.sn-doc-thumbnails').width();
                    var itemWidth = 110; // 90 + 20 img width + its margin
                    var scrollPosition = $('.sn-doc-thumbnails ul').position().left - 17; // it nust be prime but i dont know why
                    var pageNum = parseInt(Math.abs(scrollPosition / itemWidth)) + 2;
                    if (pageNum <= maxpreview)
                        loadThumbnails(pageNum);
                });

                if (reactToResize) {
                    var onResized = function (e) {
                        var isFullscreen = dataObj.isFullscreen();

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
                    }
                    $(window).on("resize.snDocViewer_" + docViewerId, onResized);
                    // Resize on tablets
                    $(window).on("orientationchange.snDocViewer_" + docViewerId, onResized);
                }
                // Call document opened callback
                callbacks.documentOpened && callbacks.documentOpened();
                $docpreview.scrollTop(0);

                unsaved = false;
            };

            // Creates image elements according to its parameters and appends them to the right place
            function loadImages(number, initializing) {
                var type;
                pages = [];
                var deletable = []; var showable = [];
                if (number === 1)
                    pages.push(number, (number + 1), (number + 2));
                else if (number === parseInt(maxpreview)) {
                    pages.push(number, (number - 2), (number - 1));
                }
                else
                    pages.push(number, (number - 1), (number + 1));

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

                for (var i = 0; i < deletable.length; i++) //[<?] deleted pages are not drawn
                    pagesDrawn[deletable[i]] = false;
                drawPageImmediately(number); //[<?] draw page without conditions (if it wasn't drawn)

                if (maxpreview > 0) {
                    //first image loading
                    if (deletable.length === 0) {
                        loadAdditionalImgsAndCanvases(showable, initializing);
                    }
                    //rest image loading
                    else {
                        if (number !== currentpreview) {
                            clearUnnecessaryImagesAndCanvases(deletable);
                            loadAdditionalImgsAndCanvases(showable, initializing);
                        }
                        else {
                            return false;
                        }
                    }
                    hpages = pages;

                }
                else {
                    $docpreview.append('No previews!');
                }
                shapesAreShowing = showShapes;
                $('.loading', $imagecontainer).hide();
            }
            var pagesDrawn = []; //[<?]
            function drawPageImmediately(page) { //[<?]
                if (pagesDrawn[page]) {
                    console.log("[<?] drawPageImmediately " + page + " SKIPPED");
                    return;
                }
                console.log("[<?] drawPageImmediately " + page);
                pagesDrawn[page] = true;

                var savedType = type;
                types = ["redaction", "highlight", "annotation"]
                for (var j = 0; j < types.length; j++) {
                    type = types[j];
                    var ctx = getCanvasContextForType(type, page);
                    var currentshapes = allshapes[type];
                    canvasValid = true;
                    for (var i = currentshapes.length; i--; ) {
                        if (parseInt(currentshapes[i].imageIndex) === page) {
                            currentshapes[i].draw(ctx);
                        }
                    }
                }
                type = savedType;

                if (typeof type !== "undefined") {
                    //console.log("type by toolbar: " + getCanvasTypeByToolbar() + ", type variable: " + type);
                    initializeCanvasFeature(getCanvasTypeByToolbar())
                }
            }

            function getCanvasTypeByToolbar() {
                return $('.sn-additional-tools').find('span.active').attr('data-canvastype');
            }


            function clearUnnecessaryImagesAndCanvases(deletable) {
                $.each(deletable, function (i, item) {
                    $('.sn-docviewer-page[data-page="' + item + '"] img').attr('src', '/Root/Global/images/ajax-loader.gif');
                    $('.sn-docviewer-page[data-page="' + item + '"]').children('canvas').remove();
                });
            }

            function loadAdditionalImgsAndCanvases(showable, initializing) {
                var $imageList = $('ul', $docpreview);
                $.each(showable, function (i, item) {
                    previewExists(item);
                });

                if (initializing) {
                    fitToWidth();
                    SetPreviewControls(1);
                }
            }

            function previewExists(item) {
                var path = 'Odata.svc' + odata.getItemUrl(filePath) + '/PreviewAvailable?page=' + item;
                var promise = new $.Deferred();

                odata.customAction({
                    path: odata.getItemUrl(filePath),
                    action: 'PreviewAvailable',
                    params: {
                        page: item
                    }

                }).done(function (data) {
                    if (data === true) {
                        $('.sn-docviewer-page[data-page="' + item + '"] img').attr('src', (filePath + '/Previews/preview' + item + '.png'));

                        $('.sn-docviewer-page').children('img').fadeIn(500);
                        $('.sn-docviewer-page').children('img').promise().done(function () {
                            if (showShapes) {
                                showShapesOnPages(item);
                            }
                        });
                    }
                    else {
                        setTimeout(function () {
                            previewExists(item);
                        }, 2000);
                    }
                    promise.resolve(data);
                });

                return promise;
            }


            function loadThumbnails(number) {
                thumbnails = [];
                var deletable = []; var showable = [];
                if (number === 1)
                    thumbnails.push(number, (number + 1), (number + 2));
                else if (number === parseInt(maxpreview)) {
                    thumbnails.push(number, (number - 2), (number - 1));
                }
                else
                    thumbnails.push(number, (number - 1), (number + 1));

                $.grep(thumbnails, function (el) {
                    if ($.inArray(el, hthumbnails) === -1) {
                        showable.push(el);
                    }
                });
                $.grep(hthumbnails, function (el) {
                    if ($.inArray(el, thumbnails) === -1) {
                        deletable.push(el);
                    }
                });
                if (maxpreview > 0) {
                    //first image loading
                    if (deletable.length === 0) {
                        loadAdditionalThumbnails(showable);
                    }
                    //rest image loading
                    else {
                        if (number !== currentpreview) {
                            clearUnnecessaryThumbnails(deletable);
                            loadAdditionalThumbnails(showable);
                        }
                        else {
                            return false;
                        }
                    }
                    hthumbnails = thumbnails;

                }

                var hasActive = $('.sn-thumbnail-page.active').length;
                $('.loading', $metadatacontainer).hide();
                if (hasActive)
                    $('.sn-doc-thumbnails li', $container).on('click.snDocViewer', clickOnThumbnail);
                else
                    $('.sn-doc-thumbnails li', $container).on('click.snDocViewer', clickOnThumbnail).first().addClass('active');

                hthumbnails = thumbnails;
            }



            function clearUnnecessaryThumbnails(deletable) {
                $.each(deletable, function (i, item) {
                    $('.sn-thumbnail-page[data-page="' + item + '"] img').attr('src', '/Root/Global/images/ajax-loader.gif').css({ 'width': 'auto', 'margin-top': '45px' });
                });
            }

            function loadAdditionalThumbnails(showable) {
                $.each(showable, function (i, item) {
                    thumbnailExists(item);
                });
            }


            function thumbnailExists(item) {

                var promise = new $.Deferred();

                odata.customAction({
                    path: odata.getItemUrl(filePath),
                    action: 'PreviewAvailable',
                    params: {
                        page: item
                    }

                }).done(function (data) {
                    if (data === true) {
                        $('.sn-doc-thumbnails li[data-page="' + item + '"] img').attr('src', (filePath + '/Previews/thumbnail' + item + '.png')).css({ 'width': '90px', 'margin-top': '0px' });
                    }
                    else {
                        setTimeout(function () {
                            thumbnailExists(item);
                        }, 2000);
                    }
                    promise.resolve(data);
                });

                return promise;
            }


            function clickOnThumbnail(e) {
                var $this = $(this);
                if (!$this.hasClass('active')) {
                    $('.sn-doc-thumbnails li').removeClass('active');
                    $this.addClass('active');
                    loadImages(parseInt($this.attr('data-page')));
                    SetPreviewControls(parseInt($this.attr('data-page')));
                }
            }

            function createToolbar() {
                if (showtoolbar && edittoolbar && isAdmin) {
                    $toolbarContainer.append('<div class="sn-additional-tools">' + editbuttons.annotations + editbuttons.highlights + editbuttons.redaction + '</div>');
                }
                $toolbarContainer.append('<div class="sn-paging-tools"><div class="sn-doc-title" title="' + title + '"><h1>' + title + '</h1></div><div class="sn-pager">' + editbuttons.pager + '</div></div>');
                if (showShapes) {
                    $toolbarContainer.append('<div class="sn-zooming-tools">' + editbuttons.originalsize + editbuttons.fittowindow + editbuttons.fittoheight + editbuttons.fittowidth + editbuttons.zoomout + editbuttons.zoomin + editbuttons.rubberbandzoom + editbuttons.fullscreen + editbuttons.print + editbuttons.originaldocument + '</div>');
                }
                else {
                    $toolbarContainer.append('<div class="sn-zooming-tools">' + editbuttons.originalsize + editbuttons.fittowindow + editbuttons.fittoheight + editbuttons.fittowidth + editbuttons.zoomout + editbuttons.zoomin + editbuttons.rubberbandzoom + editbuttons.fullscreen + editbuttons.editeddocument + '</div>');
                }

                if (noWatermark && waterMarkString !== '') {
                    $('.sn-zooming-tools', $toolbarContainer).append(editbuttons.watermark);
                }
                if (isAdmin) {
                    $('.sn-zooming-tools', $toolbarContainer).append(editbuttons.save);
                }
                $('.sn-zooming-tools', $toolbarContainer).append(editbuttons.download);

                $toolbarContainer.on('click.snDocViewer', '.sn-icon-notes', function (e) {
                    clearMenuSelection($(this));
                    initializeCanvasFeature("annotation");
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-highlight', function (e) {
                    clearMenuSelection($(this));
                    initializeCanvasFeature("highlight");
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-redaction', function (e) {
                    clearMenuSelection($(this));
                    initializeCanvasFeature("redaction");
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-firstpage', function (e) {
                    removeAllContextMenu();
                    loadImages(1);
                    SetPreviewControls(1);
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-prev', function (e) {
                    removeAllContextMenu();
                    loadImages(currentpreview - 1);
                    SetPreviewControls(currentpreview - 1);
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-next', function (e) {
                    removeAllContextMenu();
                    loadImages(currentpreview + 1);
                    SetPreviewControls(currentpreview + 1);
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-lastpage', function (e) {
                    removeAllContextMenu();
                    loadImages(maxpreview);
                    SetPreviewControls(maxpreview);
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-originalsize', function (e) {
                    clearMenuSelection();
                    setZoomLevel(1);
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-fittowidth', function (e) {
                    removeAllContextMenu();
                    fitToWidth();
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-fittoheight', function (e) {
                    removeAllContextMenu();
                    fitToHeight();
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-fittowindow', function (e) {
                    removeAllContextMenu();
                    fitToWindow();
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-rubberband', function (e) {
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
                        rubberBandZoom.call(this, e);
                        $technicalcanvas.off('mousedown.snDocViewer');
                        $technicalcanvas.off('mousemove.snDocViewer');
                        $technicalcanvas.css({ 'cursor': 'default' });
                    });
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-zoomout', function (e) {
                    removeAllContextMenu();
                    $('.sn-icon-rubberband', $toolbarContainer).removeClass('active');
                    if (scale >= minZoomLevel - 0.2) {
                        setZoomLevel(scale - 0.2);
                    }
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-zoomin', function (e) {
                    removeAllContextMenu();
                    $('.sn-icon-rubberband', $toolbarContainer).removeClass('active');
                    if (scale <= maxZoomLevel + 0.2) {
                        setZoomLevel(scale + 0.2);
                    }
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-fullscreen', function (e) {
                    removeAllContextMenu();
                    var $this = $(this);
                    if ($this.hasClass('normalscreen')) {
                        exitFullscreenMode();
                    }
                    else {
                        enterFullscreenMode();
                    }
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-print', function (e) {
                    removeAllContextMenu();
                    printDocument();
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-original', function (e) {
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
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-edited', function (e) {
                    $docpreview.off('scroll.snDocViewer');
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

                    currentpreview = parseInt($('#docpreviewpage', $container).text());
                    shapesAreShowing = true;
                    clearInterval(mainDraw);
                    setInterval(mainDraw, redrawInterval);
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-watermark', function (e) {
                    removeAllContextMenu();
                    var $this = $(this);
                    $this.removeClass('sn-icon-watermark').addClass('sn-icon-nowatermark').attr('title', SR.toolbarHideWatermark);
                    switchWatermark(true);
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-nowatermark', function (e) {
                    removeAllContextMenu();
                    var $this = $(this);
                    $this.removeClass('sn-icon-nowatermark').addClass('sn-icon-watermark').attr('title', SR.toolbarShowWatermark);
                    switchWatermark(false);
                });
                $toolbarContainer.on('click.snDocViewer', '.sn-icon-save', function (e) {
                    removeAllContextMenu();
                    saveShapes();
                });

                if (!callbacks.documentDownload) {
                    // Remove download button if a download callback is not specified
                    $container.find(".sn-icon-download").parent().remove();
                }
            }

            function saveShapes(cb) {
                var savable = {
                    "Shapes": JSON.stringify([
                        { 'redactions': allshapes.redaction },
                        { 'highlights': allshapes.highlight },
                        { 'annotations': allshapes.annotation }
                    ])
                };
                if (typeof (options.saveFunc) === "function") {
                    var p = options.saveFunc(savable);
                    p.done(function () {
                        unsaved = false;
                        cb && cb();
                    });
                }
            }

            function fitToWidth() {
                $('.sn-icon-rubberband', $toolbarContainer).removeClass('active');
                // Fit the document to the width of the viewer
                var rate = $docpreview.width() / imgWidth;
                setZoomLevel(rate);
                fitPreviewsToLeftEdge(rate);
            }

            function fitToHeight() {
                $('.sn-icon-rubberband', $toolbarContainer).removeClass('active');
                // Fit the document to the height of the viewer
                var rate = $docpreview.height() / $('li img', $docpreview).height();
                setZoomLevel(rate);
            }

            function fitToWindow() {
                $('.sn-icon-rubberband', $toolbarContainer).removeClass('active');
                // Fit the document to the height or the width of the viewer, depending on which ratio is lower
                var rate1 = $docpreview.width() / $('li img', $docpreview).width();
                var rate2 = $docpreview.height() / $('li img', $docpreview).height();
                setZoomLevel(Math.min(rate1, rate2));
            }

            function fitPreviewsToLeftEdge(rate) {
                $docpreview.scrollLeft(240 * (rate * 0.65));
            }

            function createCanvas(page) {
                // Create all the new canvases
                var $redactioncanvas = $('<canvas/>', { 'class': 'redaction-canvas' });
                var $highlightcanvas = $('<canvas/>', { 'class': 'highlight-canvas' });
                var $annotationcanvas = $('<canvas/>', { 'class': 'annotation-canvas' });
                var $technicalcanvas = $('<canvas/>', { 'class': 'technical-canvas' });
                var $allCanvases = $().add($redactioncanvas).add($highlightcanvas).add($annotationcanvas).add($technicalcanvas);

                var $li = $($('.sn-docpreview-desktop ul li[data-page="' + page + '"]', $container));
                var $img = $('img', $li);
                var canvasWidth = imgWidth;
                var wideCanvasWidth = imgWidth + 240;

                // Initialize redaction canvas
                var redactioncanvas = $redactioncanvas[0];
                redactioncanvas.width = canvasWidth;
                redactioncanvas.height = imgHeight;

                // Initialize highlight canvas
                var highlightcanvas = $highlightcanvas[0];
                highlightcanvas.width = canvasWidth;
                highlightcanvas.height = imgHeight;

                // Initialize annotation canvas
                var annotationcanvas = $annotationcanvas[0];
                annotationcanvas.width = wideCanvasWidth;
                annotationcanvas.height = imgHeight;

                // Initialize technical canvas
                var technicalcanvas = $technicalcanvas[0];
                technicalcanvas.width = wideCanvasWidth;
                technicalcanvas.height = imgHeight;

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
                $img.css('margin-left', '120px');
                $redactioncanvas.add($highlightcanvas).css('margin-left', 120);
                $annotationcanvas.add($technicalcanvas).css('margin-left', 0);

                // Append these to the li element representing the current page
                $('.sn-docpreview-desktop ul li[data-page="' + page + '"]').append($allCanvases);

                if (!showShapes) {
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
                if (msie8) { // ie IE
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
                if (shapes) {
                    var shapeObj = shapes;
                    if (typeof (shapes) === "string")
                        shapeObj = $.parseJSON(shapes);
                    if (typeof (shapeObj) !== "object")
                        $.error("The shapes option is invalid");

                    var drawShapes = function (shapeObj, i, p, type) {
                        $.each(shapeObj[i][p], function (index, value) {
                            addRect(value.x, value.y, value.w, value.h, value.imageIndex, type, value.fontSize, value.fontFamily, value.fontColor, value.fontBold, value.fontItalic, value.text, value.lineHeight);
                        });
                    }
                    drawShapes(shapeObj, 0, "redactions", "redaction");
                    drawShapes(shapeObj, 1, "highlights", "highlight");
                    drawShapes(shapeObj, 2, "annotations", "annotation");
                }
            }

            function SetPreviewControls(page, dontScroll) {
                if (currentpreview === page)
                    return;
                if (maxpreview === 0) {
                    console.log("The are no preview images, can't set page.");
                    currentpreview = 0;
                    return;
                }
                if (page < 1 || page > maxpreview) {
                    console.log("The page parameter is outside the range of possible pages: ", page, " NOTE: you can use pageCount() to get the number of pages.");
                    return;
                }

                currentpreview = page;
                //$('#docpreviewpage', $container).text(currentpreview);
                //markCurrentThumbnail(currentpreview);
                if (!dontScroll) {
                    var currentimageId = "imageContainer" + currentpreview;
                    var currentImageObj = $('#' + currentimageId, $container);
                    var position = (currentpreview - 1) * (currentImageObj.height() + pageMargin) * scale - pageMargin * 0.2;
                    $docpreview.animate({ scrollTop: position }, function () {
                        $('#docpreviewpage', $container).text(currentpreview);
                    });
                }
                if (dontScroll) {
                    $('#docpreviewpage', $container).text(currentpreview);
                }
                $('.sn-doc-thumbnails li').removeClass('active');
                $('.sn-doc-thumbnails li[data-page="' + currentpreview + '"]').addClass('active');
                callbacks.pageChanged && callbacks.pageChanged(currentpreview);
            }

            function setPageAccordingToScroll() {
                var containerTop = $imagecontainer.offset().top;
                var containerHeight = $imagecontainer.height();
                var itemHeight = $('li', $docpreview).height() * scale;
                var scrollPosition = $('ul', $docpreview).position().top - containerTop;
                var outer = (scrollPosition - containerTop) * scale;
                var pageNum = parseInt(Math.abs(outer / itemHeight) / scale) + 1;
                if (pageNum <= maxpreview)
                    loadImages(pageNum);
                SetPreviewControls(pageNum, true);
                $('.sn-doc-thumbnails li').removeClass('active');
                $('.sn-doc-thumbnails li[data-page="' + pageNum + '"]', $container).addClass('active');
            }

            function setThumbnailAccordingToScroll() {
                var containerLeft = $('.sn-doc-thumbnails').offset().left;
                var containerWidth = $('.sn-doc-thumbnails').width();
                var itemWidth = $('li', $('.sn-doc-thumbnails')).width();
                var scrollPosition = $('ul', $('.sn-doc-thumbnails')).offset().left - containerLeft;
                var pageNum = parseInt(Math.abs(scrollPosition / itemWidth)) + 1;

            }

            function clearMenuSelection($setActive) {
                removeAllContextMenu();
                $('.sn-docviewer-tools .sn-icon', $container).removeClass('active');
                if ($setActive) {
                    $setActive.addClass('active');
                }
            }

            // Sets the zoom level of the document
            function setZoomLevel(newLevel, x0, y0, $rel, rb) {
                //                if (!items.length) {
                //                    console.log("There are no previews, can't set zoom level.");
                //                    return;
                //                }
                var $zoo = $('.zoomer', $docpreview);
                var $ul = $('ul', $docpreview);
                var $li = $('li', $ul);
                var $img = $('img', $li);

                var $rel = $rel || $('.sn-docviewer-page:first').children('technicalcanvas');
                var $currentLi = $rel.closest('li.sn-docviewer-page');
                if (!$currentLi.length)
                    $currentLi = $($li[0]);

                if (!x0) {
                    x0 = x0 || $img.width() * 0.25;
                    y0 = y0 || ($docpreview.scrollTop() / scale);
                }
                var oldWidth = imgWidth * scale + (240 * scale);
                var newWidth = imgWidth * newLevel + (240 * scale);
                var oldHeight = (imgHeight * scale + pageMargin) * maxpreview;
                var newHeight = (imgHeight * newLevel + pageMargin) * maxpreview;

                var osw = $docpreview[0].scrollWidth;
                var osh = $docpreview[0].scrollHeight;

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
                    'width': $li.width()
                });

                $zoo.css({
                    'width': $ul.width() * scale,
                    'height': $ul.height() * scale,
                    'margin': '0px auto'
                });

                var nsw = $docpreview[0].scrollWidth;
                var nsh = $docpreview[0].scrollHeight;

                if (rb) {
                    var diff = $rel ? ($li.offset().left - $rel.offset().left - $li.position().left) : 0;
                    $docpreview.scrollLeft(Math.max(0, x0 * scale - diff));
                    $docpreview.scrollTop(Math.max(0, $currentLi.position().top + y0 * scale));
                }
                else {
                    $docpreview.scrollLeft($docpreview.scrollLeft() + (newWidth - oldWidth) / (2 * scale));
                    $docpreview.scrollTop($docpreview.scrollTop() + (newHeight - oldHeight) / (2 * scale));
                }

                callbacks.zoomLevelChanged && callbacks.zoomLevelChanged(scale);
            }

            function markCurrentThumbnail(current) {
                $('.sn-doc-thumbnails li', $container).removeClass('active');
                $('.sn-doc-thumbnails li[data-page="' + current + '"]', $container).addClass('active');
            }

            function ShowThumbnails() {
                var $this = $(this);

                if (!$this.hasClass('active')) {
                    $this.addClass('active');
                    $metadatacontainer.addClass('fulscreen-metadata').fadeIn(200);
                }
                else {
                    $this.removeClass('active');
                    $metadatacontainer.fadeOut(200, function () { $metadatacontainer.removeClass('fulscreen-metadata') });
                }
            }

            function enterFullscreenMode() {
                if (dataObj.isFullscreen())
                    return;

                var $fullscreenWrapper = $(".sn-docpreview-fullscreen-wrapper");
                if ($fullscreenWrapper.length)
                    $.error("Another document viewer is already in fullscreen mode, can't switch this one to fullscreen mode too.");

                var heightDiff = $pluginSubject.height() - $docpreview.height();
                // Create a wrapper for fullscreen mode
                $fullscreenWrapper = $('<div class="sn-docpreview-fullscreen-wrapper"></div>').css({
                    left: 0,
                    top: 0,
                    position: "absolute",
                    width: $(window).width(),
                    height: $(window).height(),
                    'z-index': 1000
                }).appendTo($("body"));
                $(window).off('resize.snDocViewerFullscreen').on('resize.snDocViewerFullscreen', function () {
                    $fullscreenWrapper.css({
                        width: $(window).width(),
                        height: $(window).height()
                    });
                });
                // Move the container element into the new wrapper
                $container.appendTo($fullscreenWrapper);
                // Adjust the user interface
                $docpreview.height($(window).height() - heightDiff);
                $metadatacontainer.hide();
                $imagecontainer.width('100%');
                $toolbarContainer.find('.sn-icon-fullscreen').addClass('normalscreen').parent().attr('title', SR.toolbarExitFullscreen);
                $('<div class="seeThumbnails" title="' + SR.showThumbnails + '"><span class="sn-icon sn-icon-thumbnails"></span></div>').on('click.snDocViewer', ShowThumbnails).appendTo($docpreview.parent());
                // Trigger resize to make the items sized correctly
                $(window).trigger("resize");
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
                $imagecontainer.width('75%');
                $toolbarContainer.find('.sn-icon-fullscreen').removeClass('normalscreen').parent().attr('title', 'Fullscreen');
                $docpreview.find('.seeThumbnails').remove();
                $docpreview.parent().find('.seeThumbnails').remove();
                $metadatacontainer.removeClass('fulscreen-metadata');
                // Trigger resize to make the items sized correctly
                $(window).trigger("resize");
            }

            function Shape() {
                this.x = 0;
                this.y = 0;
                this.w = mySelBoxSize;
                this.h = mySelBoxSize;
            };

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
                for (var ii = 0; ii < lines.length; ii++) {
                    var line = lines[ii];
                    context.fillText(line, x, y);
                    y += lineHeight;
                    totalHeight += lineHeight

                    if (totalHeight + lineHeight * 2.3 > maxHeight && ii < lines.length - 2) {
                        context.fillText("...", x, y);
                        break;
                    }
                }
            }

            function addRect(x, y, w, h, imageIndex, type, fontSize, fontFamily, fontColor, fontBold, fontItalic, text, lineHeight) {
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
                    rect.text = text || 'Select note and right click to edit text';
                    rect.lineHeight = lineHeight || 20;
                }
                rect.x = x;
                rect.y = y;
                rect.w = w;
                rect.h = h;
                rect.imageIndex = parseInt(imageIndex);
                allshapes[type].push(rect);
                invalidate();
            }

            function removeRect(index) {
                allshapes[type].splice(index, 1);
                invalidate();
            }

            function initializeCanvasFeature(newType) {
                console.log("[<?] initializeCanvasFeature(" + newType + ")");
                clearShapeSelections();
                type = newType || type;
                editmode = true;

                var $canvas = $getCanvasForType();
                var $technicalcanvas = $container.find('canvas.technical-canvas');

                // Set z-indexes
                resetCanvasZIndexes();
                $canvas.css('z-index', 100);

                // Remove all previous event handlers
                $technicalcanvas.off('mousedown.snDocViewer').off('mouseup.snDocViewer').off('mousemove.snDocViewer').off('dblclick.snDocViewer');
                // Add new event handlers
                $technicalcanvas.on('mousedown.snDocViewer', myDown).on('mouseup.snDocViewer', myUp).on('mousemove.snDocViewer', myMove).on('dblclick.snDocViewer', myDblClick);

                // Initialize selection handles
                selectionHandles = [];
                for (var i = 0; i < 8; i++) {
                    selectionHandles.push(new Shape());
                }
            }

            function resetCanvasZIndexes() {
                // reset
                $container.find("canvas.annotation-canvas").css('z-index', 40);
                $container.find("canvas.redaction-canvas").css('z-index', 30);
                $container.find("canvas.highlight-canvas").css('z-index', 20);
                $container.find("canvas.technical-canvas").css('z-index', 101);

                console.log("[<?] resetCanvasZIndexes(" + type + ")");

                switch (type) {
                    case "redaction":
                        $container.find("canvas.redaction-canvas").css('z-index', 100); break;
                    case "highlight":
                        $container.find("canvas.v-canvas").css('z-index', 100); break;
                    case "annotation":
                        $container.find("canvas.annotation-canvas").css('z-index', 100); break;
                }

            }

            function clear() {
                for (var i = arguments.length; i--; ) {
                    var ctx = arguments[i];
                    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                }
            }

            function mainDraw(ignoreValid) {
                if ((!ignoreValid && canvasValid) || !type)
                    return;

                var p = currentpreview;
                var ctx = getCanvasContextForType(type, p);
console.log("[<?] mainDraw("+p+")");
                var currentshapes = allshapes[type];
                //clear(ctx);
                canvasValid = true;

                for (var i = currentshapes.length; i--; ) {
                    if (parseInt(currentshapes[i].imageIndex) === p) {
                        currentshapes[i].draw(ctx);
                    }
                }
            }

            function getPageForElement($element) {
                var page = $element.closest("li.sn-docviewer-page").index() + 1;
                return page;
            }

            function myMove(e) {
                var $technicalcanvas = $(this);
                var page = getPageForElement($technicalcanvas);
                var $canvas = $getCanvasForType(type, page);
                var diff = ($canvas.offset().left - $technicalcanvas.offset().left) / scale;
                var p = calculateMousePos(e, $technicalcanvas);

                rmx = p.x;
                rmy = p.y;

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
                var $technicalcanvas = $(this);

                // Reset variables which maintain drag state
                rmstart = this;
                rmx = undefined;
                rmy = undefined;

                // Keydown for delete button
                $technicalcanvas.off('keydown.snDocViewer');
                $technicalcanvas.attr('tabindex', '0').focus().on('keydown.snDocViewer', function (e) {
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

                    var page = getPageForElement($technicalcanvas);
                    var technicalctx = getTechnicalCanvasContext(page);
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

            function myUp(e) {
                isDrag = false;
                isResizeDrag = false;
                expectResize = 0;

                if (started && rmstart === this) {
                    drawRectangleUp.call(this, x0, y0, rmx, rmy, rmx, rmy, rmx, rmy);
                    started = false;
                }

                rmstart = null;
            }

            function myDblClick(e) {
                var $technicalcanvas = $(this);
                var page = getPageForElement($technicalcanvas);
                var p = calculateMousePos(e, $technicalcanvas);

                rmx = p.x;
                rmy = p.y;

                findSelectedRect.call($technicalcanvas, e);

                if (mySel) {
                    showContextMenuForSelectedRect();
                }
                else {
                    var width = 200;
                    var height = 50;
                    var $canvas = $getCanvasForType(type, page);

                    rmx -= ($canvas.offset().left - $technicalcanvas.offset().left);

                    if (type === "redaction" || type == "highlight") {
                        addRect(rmx - (width / 2), rmy - (height / 2), width + 10, height + 10, page, type);
                    }
                    else if (type === "annotation" || type == "Annotation") {
                        addRect(rmx, rmy, 200, 250, page, type, '14pt', 'Arial', '#333', 'Normal', 'Normal', annotationDefaultText, 20);
                    }
                }
            }

            function findSelectedRect(e) {
                var $technicalcanvas = $(this);
                var page = getPageForElement($technicalcanvas);
                var $canvas = $getCanvasForType(type, page);
                var technicalctx = getTechnicalCanvasContext(page);

                var p = calculateMousePos(e, $technicalcanvas);

                clear(technicalctx);
                mySel = null;

                for (var i = allshapes[type].length; i--; ) {
                    if (parseInt(allshapes[type][i].imageIndex) === page) {
                        allshapes[type][i].draw(technicalctx, 'black');

                        var diff = ($canvas.offset().left - $technicalcanvas.offset().left) / scale;
                        var imageData = technicalctx.getImageData(p.x - diff, p.y, 1, 1);
                        var index = (p.x - diff + p.y * imageData.width) * 4;
                        clear(technicalctx);

                        if (imageData.data[3] > 0) {
                            mySel = allshapes[type][i];
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
                var $canvas = $getCanvasForType();
                var contextMenuX = mySel.x + ($canvas.offset().left - $canvas.parent().offset().left) / scale;
                var contextMenuY = mySel.y;

                if (type === "redaction" || type === "highlight") {
                    contextMenuX += width;
                    buildContextMenu(type, contextMenuX, contextMenuY, shapeIndex);
                }
                else if (type === "annotation") {
                    contextMenuX -= 10;
                    contextMenuY -= 10;
                    buildContextMenu(type, contextMenuX, contextMenuY, shapeIndex, height, width + 20);
                }
            }

            function invalidate() {
                canvasValid = false;
                unsaved = true;
            }

            function calculateMousePos(e, $this) {
                return {
                    x: ((e.pageX - $this.offset().left + $this.scrollLeft()) / scale),
                    y: ((e.pageY - $this.offset().top + $this.scrollTop()) / scale)
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
                var p = calculateMousePos(e, $(this));
                x0 = p.x;
                y0 = p.y;
            }

            function drawRectangleMove(e) {
                if (!started)
                    return;

                var $technicalcanvas = $(this);
                var page = getPageForElement($technicalcanvas);
                var technicalctx = getTechnicalCanvasContext(page);

                var p = calculateMousePos(e, $technicalcanvas);
                var r = calculateRectDimensions(p.x, p.y, x0, y0);

                if (p.x > x0 && p.y > y0) { $technicalcanvas.css({ 'cursor': 'nw-resize' }); }
                else if (p.x > x0 && p.y < y0) { $technicalcanvas.css({ 'cursor': 'ne-resize' }); }
                else if (p.x < x0 && p.y > y0) { $technicalcanvas.css({ 'cursor': 'sw-resize' }); }
                else if (p.x < x0 && p.y < y0) { $technicalcanvas.css({ 'cursor': 'se-resize' }); }

                clear(technicalctx);
                technicalctx.fillStyle = '#76C9F5';
                technicalctx.strokeStyle = '#007dc6'
                technicalctx.globalAlpha = 0.5;
                technicalctx.fillRect(r.x, r.y, r.w, r.h);
                technicalctx.strokeRect(r.x, r.y, r.w, r.h);
            }

            function drawRectangleUp(x0, y0, rmx, rmy) {
                var $technicalcanvas = $(this);
                var page = getPageForElement($technicalcanvas);
                var $canvas = $getCanvasForType(type, page);
                var technicalctx = getTechnicalCanvasContext(page);

                var ctype = getCanvasTypeByToolbar(); //[<?] ctype isn't 'undefined' if one of the annotation, highlight or redaction toolbar button is pushed
                console.log("drawRectangleUp: " + ctype);

                //if (editmode) {
                if (ctype !== undefined) {
                    var r = calculateRectDimensions(rmx, rmy, x0, y0);

                    if (r.w >= 10 || r.h >= 10) {
                        // Account for the difference between widths of different canvases
                        var diff = ($canvas.offset().left - $technicalcanvas.offset().left) / scale;
                        r.x -= diff;
                        // Apply minimal width/height for annotations
                        r.w = type === "annotation" ? Math.max(r.w, 200) : r.w;
                        r.h = type === "annotation" ? Math.max(r.h, 250) : r.h;
                        // Add the new shape
                        if (type === "annotation")
                            addRect(r.x, r.y, r.w, r.h, page, type, '14pt', 'Arial', '#333', 'Normal', 'Normal', annotationDefaultText, 20);
                        else
                            addRect(r.x, r.y, r.w, r.h, page, type);
                    }
                }

                started = false;
                clear(technicalctx);
                $technicalcanvas.css({ 'cursor': 'default' });
            }

            function rubberBandZoom(e) {
                if (!started)
                    return;

                var $technicalcanvas = $(this);
                var page = getPageForElement($technicalcanvas);
                var technicalctx = getTechnicalCanvasContext(page);
                var p = calculateMousePos(e, $technicalcanvas);
                var r = calculateRectDimensions(p.x, p.y, x0, y0);
                setZoomLevel(Math.min(maxZoomLevel, $docpreview.width() / r.w), r.x, r.y, $technicalcanvas, true);

                clear(technicalctx);
                started = false;
            }

            function buildContextMenu(type, xScreen, yScreen, shapeIndex, height, width) {
                var page = allshapes[type][shapeIndex].imageIndex;
                var $canvas = $getCanvasForType(type, page);
                var $technicalcanvas = $getTechnicalCanvas(page);
                var diff = ($canvas.offset().left - $technicalcanvas.offset().left) / scale;
                var $contextMenu = $('<div class="sn-contextmenu"></div>').css({
                    'position': 'absolute',
                    'top': yScreen,
                    'left': xScreen,
                    'z-index': 110,
                    'height': height || 'auto',
                    'width': width || 'auto'
                }).on('click.snDocViewer', '.sn-icon-delete', function () {
                    removeRect(shapeIndex);
                }).on('click.snDocViewer', '.sn-icon-save', function () {
                    saveText(shapeIndex);
                }).on('click.snDocViewer', '.sn-icon-cancel,.sn-icon-delete', removeAllContextMenu);

                if (type === 'redaction' || type === 'highlight') {
                    $contextMenu.html('<span title="' + SR.deleteText + '" class="sn-icon sn-icon-delete">' + SR.deleteText + '</span>').on('click.snDocViewer', '.sn-icon-delete', removeAllContextMenu);
                }
                else {
                    $contextMenu.addClass('sn-annotation-contextmenu');

                    var currentText = allshapes.annotation[shapeIndex].text;
                    var fontFamily = allshapes.annotation[shapeIndex].fontFamily;
                    var fontSize = allshapes.annotation[shapeIndex].fontSize;
                    var fontFamily = allshapes.annotation[shapeIndex].fontFamily;
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
                    var $deleteButton = $('<span title="' + SR.deleteText + '">' + SR.deleteText + '</div>').appendTo($buttonContainer).attr('class', 'sn-icon sn-icon-delete okButton');
                    var $saveButton = $('<span title="' + SR.saveText + '">' + SR.saveText + '</div>').appendTo($buttonContainer).attr('class', 'sn-icon sn-icon-save okButton');
                    var $cancelButton = $('<span title="' + SR.cancelText + '">' + SR.cancelText + '</div>').appendTo($buttonContainer).attr('class', 'sn-icon sn-icon-cancel cancelButton');
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

                var rgb = blue | (green << 8) | (red << 16);
                return digits[1] + '#' + rgb.toString(16);
            }

            function showShapesOnPages(number) {
                contexts[number] = createCanvas(number);
                resetCanvasZIndexes();
                setZoomLevel(scale);
                $.each(allshapes, function (t) {
                    var savedType = type;
                    type = t;
                    mainDraw(true);
                    type = savedType;
                });

                // Start the redraw interval

                clearInterval(mainDraw);
                setInterval(mainDraw, redrawInterval);
            }

            function saveText(shapeIndex) {
                var textarea = $('.sn-edit-annotation-txtarea');
                fontFamily = $('.sn-edit-annotation-txtarea').css('font-family');
                fontSize = parseInt(parseInt($('.sn-edit-annotation-txtarea').css('font-size')) * 0.75) + 'pt';

                fontColor = $('.sn-edit-annotation-txtarea').css('color');
                fontItalic = $('.sn-edit-annotation-txtarea').css('font-style');
                fontBold = $('.sn-edit-annotation-txtarea').css('font-weight');
                text = $('.sn-edit-annotation-txtarea').val();
                lineHeight = parseInt(fontSize);
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
                clear(getTechnicalCanvasContext());
                mainDraw(true);
            }

            function switchWatermark(enabled) {
                var $images = $("img", $docpreview);
                var wmParam = '?watermark=true';

                // Iterate through all images
                $images.each(function (i) {
                    var $img = $($images[i]);
                    var oldsrc = $img.attr('src');

                    // Set the src parameter according to the watermark URL parameter
                    if (enabled && oldsrc.indexOf(wmParam) + wmParam.length != oldsrc.length) {
                        $img.attr('src', oldsrc + wmParam);
                    }
                    else if (!enabled && oldsrc.indexOf(wmParam) + wmParam.length == oldsrc.length) {
                        $img.attr('src', oldsrc.substring(0, oldsrc.indexOf(wmParam)));
                    }
                });
            }

            function printDocument() {
                // NOTE:
                // This feature works by creating a hidden iframe and calling the print method on its window object.
                // It might not work reliably accross all browsers and the viewer attempts to remedy that by firing a callback if it won't work.
                // ----------
                // Useful reading about the topic:
                // http://stackoverflow.com/questions/7570496/getting-the-document-object-of-an-iframe - getting document and window objects of an iframe
                // https://developer.mozilla.org/en-US/docs/Printing - explains printing and event handling in IE and Firefox
                // http://tjvantoll.com/2012/06/15/detecting-print-requests-with-javascript/ - explains a method for detecting printing in WebKit
                // ----------

                // Remove previous print iframes
                $("#sn-docpreview-print-iframe").remove();

                // Create HTML for the pictures
                var pics = '<style type="text/css">img{display:block;}</style>';
                $.each(items, function (i, item) {
                    pics += '<img width="' + item.Width + '" height="' + item.Height + '" " src="' + item.Path + '" />';
                });

                // Create iframe element
                var $iframe = $('<iframe id="sn-docpreview-print-iframe"></iframe>').css({
                    width: 0,
                    height: 0
                });
                // NOTE: browsers will not print() the contents of the iframe if it's not appended to the document
                $iframe.appendTo($("body"));

                // Find the DOM document inside the iframe
                var doc = ($iframe[0].contentWindow) ? ($iframe[0].contentWindow.document) : (($iframe[0].contentDocument) ? (($iframe[0].contentDocument.document) ? $iframe[0].contentDocument.document : $iframe[0].contentDocument) : null);
                doc.open();
                doc.write(pics);
                doc.close();

                // Find the content window
                var win, $win;
                if ($iframe[0].contentWindow && typeof ($iframe[0].contentWindow.print) === "function") {
                    win = $iframe[0].contentWindow;
                }
                else if ($iframe[0].contentDocument && typeof ($iframe[0].contentDocument.print) === "function") {
                    win = $iframe[0].contentDocument;
                }
                else {
                    // There is no content window on the iframe or it doesn't support printing
                    $iframe.remove();
                    callbacks.documentCantPrint && callbacks.documentCantPrint();
                    return;
                }
                $win = $(win);

                // Print event handlers
                var beforePrint = function (e) {
                    callbacks.documentBeforePrint && callbacks.documentBeforePrint();
                };
                var afterPrint = function (e) {
                    callbacks.documentAfterPrint && callbacks.documentAfterPrint();
                };

                // This works in WebKit, but the events are fired multiple times
                if (win.matchMedia) {
                    var mediaQueryList = win.matchMedia('print');
                    mediaQueryList.addListener(function (mql) {
                        if (mql.matches) {
                            beforePrint();
                        }
                        else {
                            afterPrint();
                        }
                    });
                }

                // This works in IE and Firefox
                $win.on("beforeprint.snDocViewer", beforePrint);
                $win.on("afterprint.snDocViewer", function () {
                    afterPrint();
                    $iframe.remove(); // Can't remove the element in Chrome in afterPrint() because then it crashes
                });

                // Call print
                win.print();
            }



            function destroyPlugin() {
                // Fire document closed handler
                callbacks.documentClosed && callbacks.documentClosed();

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

            // Store an object with methods, attached to the element so that users of the plugin can manipulate it from the outside
            var dataObj = {
                // Sets the current zoom level of the viewer.
                // Parameters: newLevel, x0, y0, $rel
                setZoomLevel: setZoomLevel,

                // Switches watermarking on or off (NOTE: won't work if the current user doesn't have permissions to view the document without watermark)
                // Parameters: enabled
                switchWatermark: switchWatermark,

                // Removes all context menu related to this plugin from the DOM
                removeContextMenu: removeAllContextMenu,

                // Enters fullscreen mode
                enterFullscreenMode: enterFullscreenMode,

                // Exits fullscreen mode
                exitFullscreenMode: exitFullscreenMode,

                // Saves shapes for the current document
                saveShapes: saveShapes,

                // Destroys the current plugin instance
                destroy: destroyPlugin,

                // Tries to bring up the browser's print dialog for the current document
                printDocument: printDocument,

                // Gets all shapes for the current document
                getAllShapes: function () { return allshapes; },

                // Scrolls the viewport horizontally
                scrollViewportLeft: function (val) { $docpreview.scrollLeft(val); },

                // Scrolls the viewport vertically
                scrollViewportTop: function (val) { $docpreview.scrollTop(val); },

                // Tells if there are unsaved changes for the current document
                isUnsaved: function () { return unsaved; },

                // Tells if the viewer is in fullscreen mode
                isFullscreen: function () { return $container.parent().hasClass("sn-docpreview-fullscreen-wrapper"); },

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

                // Gets the number of pages the current document has
                pageCount: function () { return maxpreview; },

                // Gets the page number that the given element belongs to
                getPageForElement: getPageForElement
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
