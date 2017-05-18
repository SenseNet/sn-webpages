// using $skin/scripts/sn/SN.js
// using $skin/scripts/ODataManager.js
// using $skin/scripts/OverlayManager.js
// using $skin/scripts/imagefilters.js
// resource ImageEditor

(function ($) {
    $.fn.extend({
        imageEditor: function (options) {

            if (this.data('snImageEditor'))
                return;

            var $element = this;
            var $container = $('<div class="sn-imageeditor-container"></div>').appendTo('body');
            $container.css('display', 'none');
            $element.appendTo($container);
            var $pluginSubject = $(this[0]);
            $uploadArea = $(options.uploadArea);
            $fileInput = $uploadArea.find('input[type="file"]');
            var width = options.width || $element.innerWidth;
            var height = options.height || $element.innerHeight;
            var event = options.event || null;
            var tools = options.command;
            var menu = options.menuitems;
            var cropRatioX = options.cropRatioX || null;
            var cropRatioY = options.cropRatioY || null;
            var maxChunkSize = options.maxChunkSize;
            var fileType = options.fileType || 'auto';
            var fileName = options.fileName || 'auto';
            var contentType = options.contentType || 'Image';
            var defaultFileName = options.defaultFileName || 'image.png';
            var maxStepCount = options.maxStepCount || 20;
            var targetPath = options.targetPath;
            var imgMaxWidth = options.maxImageWidth || 1024;
            var imgMaxHeight = options.maxImageHeight || 768;
            var uploadPermissionAllowed = options.uploadPermissionAllowed || false;
            var backToLibraryLink = options.backToLibraryLink || false;
            var uploadFunction = options.uploadFunction || null;
            $uploadInput = options.uploadInput || $fileInput;
            var canvasValid = false;
            var canvas, ctx, $canvas, tempCanvas, tempCtx, resCanvas, resCtx;
            var cropMode = 0;
            var commands = [];
            var jcrop_api;
            var selectedArea = {};
            var img;
            var cw, ch, myImage, rotating = false;
            var degrees = 0;
            var mode, cropX = 0, cropY = 0, cropWidth, cropHeight, resize;
            var commandIndex = -1;
            var uploaddata = [];
            var horizontaliFlipped = false;
            var verticaliFlipped = false;
            var scaleH = 1, scaleV = 1;
            var constrained = false;
            var fullWidth, fullHeight, actualStepNum = -1;
            var imageeditor, imgName;
            var filter = {
                grayscale: {
                    isSet: false,
                    g: 0
                },
                sepia: {
                    isSet: false,
                    s: 0
                },
                color: {
                    isSet: false,
                    r: null,
                    g: null,
                    b: null
                },
                brighten: {
                    isSet: false,
                    b: null,
                    c: null
                },
                threshold: false,
                boxBlur: false,
                //gaussianBlur: false,
                sharpen: false,
                invert: false,
                detectEdges: false,
                emboss: false,
                sobel: false
            }
            var imageData, toolbarDockLeft = false, toolbarDockRight = false;
            var colorpicker, textColor, foreColor, backColor, brightness = 0, contrast = 100;
            var sizeObj = {};
            var fWidth, fHeight, executionsNum;
            //templates
            if (cropRatioX !== null && cropRatioY !== null) {
                $cropSubToolbarTemplate = $('<div class="machinator"><select id="cropMode"><option value="0" selected>unconstrained</option><option value="1">fixed ratio ' + cropRatioX + 'x' + cropRatioY + '</option><option value="2">custom ratio</option></select></div><span class="crop">' + SN.Resources.ImageEditor['crop'] + '</span>');
            }
            else {
                $cropSubToolbarTemplate = $('<div class="machinator"><select id="cropMode"><option value="0" selected>unconstrained</option><option value="2">custom ratio</option></select></div><span class="crop">' + SN.Resources.ImageEditor['crop'] + '</span>');
            }

            var fontFamilyOptionList = '<options>\
                <option class="sample-arial">Arial</option>\
                <option class="sample-arialBlack">Arial Black</option>\
                <option class="sample-comicSans">Comic Sans MS</option>\
                <option class="sample-courier">Courier New</option>\
                <option class="sample-georgia">Georgia</option>\
                <option class="sample-impact">Impact</option>\
                <option class="sample-lucida">Lucida Console</option>\
                <option class="sample-palatino">Palatino Linotype</option>\
                <option class="sample-tahoma">Tahoma</option>\
                <option class="sample-trebuchet">Trebuchet MS</option>\
                </options>';
            var styleButtons =
                '<span class="fontSytleButton boldButton" title="' + SN.Resources.ImageEditor['bold'] + '"></span>\
                <span class="fontSytleButton italicButton" title="' + SN.Resources.ImageEditor['italic'] + '"></span>\
                <span class="fontSytleButton underlineButton" title="' + SN.Resources.ImageEditor['underline'] + '"></span>\
                <span class="fontSytleButton superscriptButton" title="' + SN.Resources.ImageEditor['superscript'] + '"></span>\
                <span class="fontSytleButton subscriptButton" title="' + SN.Resources.ImageEditor['subscript'] + '"></span>\
                <span class="fontSytleButton striketroughButton" title="' + SN.Resources.ImageEditor['striketrough'] + '"></span>';
            var fontSizeOptionList = '<options>\
                <option>6 pt</option>\
                <option>8 pt</option>\
                <option>9 pt</option>\
                <option>10 pt</option>\
                <option>11 pt</option>\
                <option>12 pt</option>\
                <option>14 pt</option>\
                <option>18 pt</option>\
                <option>24 pt</option>\
                <option>30 pt</option>\
                <option>36 pt</option>\
                <option>48 pt</option>\
                <option>60 pt</option>\
                <option>72 pt</option>\
                </options>';

            $textSubToolbarTemplate = $('<div class="fontFamily"><select id="fontFamily">' + fontFamilyOptionList + '</select></div><div class="styleButtons">' + styleButtons + '</div><div class="fontSize"><select id="fontSize">' + fontSizeOptionList + '</select></div><input class="fontColor" type="color" id="hsv" value="#000000" />');

            var brightessContrastWindowTemplate = '<div class="windowRow"><label>' + SN.Resources.ImageEditor['brightness'] + '</label>\
                    <input id="sliderBrightness" class="sliderBrightness" value="0" /></div>\
                    <div class="windowRow"><label>' + SN.Resources.ImageEditor['contrast'] + '</label>\
                    <input id="sliderContrast" class="sliderContrast" value="0" /></div>\
                    <div class="buttonRow"><span class="sn-button sn-saveButton">' + SN.Resources.ImageEditor['Save'] + '</span><span class="sn-button sn-cancelButton">' + SN.Resources.ImageEditor['Cancel'] + '</span></div>';

            var sepiaWindowTemplate = '<div class="windowRow">\
                    <input id="sliderSepia" class="sliderSepia" value="0" /></div>\
                    <div class="buttonRow"><span class="sn-button sn-saveButton">' + SN.Resources.ImageEditor['Save'] + '</span><span class="sn-button sn-cancelButton">' + SN.Resources.ImageEditor['Cancel'] + '</span></div>';

            var grayscaleWindowTemplate = '<div class="windowRow">\
                    <input id="sliderGrayscale" class="sliderGrayscale" value="0" /></div>\
                    <div class="buttonRow"><span class="sn-button sn-saveButton">' + SN.Resources.ImageEditor['Save'] + '</span><span class="sn-button sn-cancelButton">' + SN.Resources.ImageEditor['Cancel'] + '</span></div>';

            var colorWindowTemplate = '<div class="windowRow"><label>' + SN.Resources.ImageEditor['red'] + '</label>\
                    <input id="sliderRed" class="sliderRed" value="0" /></div>\
                    <div class="windowRow"><label>' + SN.Resources.ImageEditor['green'] + '</label>\
                    <input id="sliderGreen" class="sliderGreen" value="0" /></div>\
                    <div class="windowRow"><label>' + SN.Resources.ImageEditor['blue'] + '</label>\
                    <input id="sliderBlue" class="sliderBlue" value="0" /></div>\
                    <div class="buttonRow"><span class="sn-button sn-saveButton">' + SN.Resources.ImageEditor['Save'] + '</span><span class="sn-button sn-cancelButton">' + SN.Resources.ImageEditor['Cancel'] + '</span></div>';

            $pleaseCropWindowTemplate = '<div>' + SN.Resources.ImageEditor['pleaseCropMessage'] + '</div><div class="buttonRow"><span class="sn-button sn-saveButton doCrop">' + SN.Resources.ImageEditor['crop'] + '</span><span class="sn-button sn-cancelButton">' + SN.Resources.ImageEditor['Cancel'] + '</span><span class="sn-button sn-saveButton dontCrop">' + SN.Resources.ImageEditor['DontCrop'] + '</span></div>';

            var resizeWindowTemplate = '<div class="resizeWidth"><label>width:</label><input type="number" max="' + sizeObj.w + '" value="' + sizeObj.w + '" min="0"/> px</div><div class="resizeHeight"><label>height:</label><input type="number" value="' + sizeObj.h + '" max="' + sizeObj.h + '" min="0"/> px</div><div class="constrain active" title="' + SN.Resources.ImageEditor['constrainProportions'] + '"><span></span></div><div class="buttonRow"><span class="sn-button sn-saveButton">' + SN.Resources.ImageEditor['resize'] + '</span><span class="sn-button sn-cancelButton">' + SN.Resources.ImageEditor['Cancel'] + '</span></div>';

            // Localization
            var SR = $.extend({

            }, options.SR);

            $loader = $('<div class="sn-image-editor-loader"></div>');

            $element.append($loader);

            var Command = function (index, deg, cx, cy, w, h, w2, h2, ox, oy, hflip, vflip, rot, constr, filtah) {
                this.index = index;
                this.deg = deg; //rotation degree
                this.cx = cx; //starting point x coordinate
                this.cy = cy; //starting point y coordinate
                this.w = w; //cropwidth
                this.h = h; //cropheight
                this.w2 = w2; //image width
                this.h2 = h2; //image height
                this.ox = ox; //origin x
                this.oy = oy; //origin y
                this.hflip = hflip; //is flipped horizontaly
                this.vflip = vflip; //is flipped vertically
                this.rot = rot;
                this.constr = constr;
                this.filtah = filtah;
            }

            var Tool = function (name, title, icon, execute, template) {
                this.execute = execute;
                this.name = name;
                this.title = title;
                this.icon = icon;
                this.template = template;
            }

            $element.on('click', function () {
                if ($('.sn-icon-filter').hasClass('open')) {
                    $('.filterSubmenuList').slideUp();
                    $('.sn-icon-filter').removeClass('open');
                }
            })

            //crop
            function Crop() {
                if (mode != 'crop') {
                    mode = 'crop'
                }
                closeSubToolbar();
                createSubToolbar($cropSubToolbarTemplate, 'crop');
                $canvas = $('#imageEditorCanvas');
                var leftPos = $canvas.offset().left;
                var topPos = $canvas.position().top;
                clearselectedArea();
                $canvas.Jcrop({
                    onRelease: releaseCheck,
                    onChange: changeSelection,
                    onSelect: selectSelection
                }, function () {
                    jcrop_api = this;
                });
                $jcropHolder = $('.jcrop-holder').css({ 'position': 'absolute', 'left': leftPos, 'top': topPos });

            }

            $(document).on('keyup.Crop', function (e) {
                if (e.keyCode == 46) {
                    jcrop_api.release();
                }
                else if (e.keyCode == 13) {
                    if (selectedArea.x != null && selectedArea.w != null && selectedArea.h != null && $('.jcrop-holder').length > 0) {
                        cropImage();
                        closeSubToolbar();
                        $('.sn-icon-crop').removeClass('active');
                    }
                }
            });


            $(window).on('resize', function () {
                setTimeout(function () {
                    var containerHeight = $pluginSubject.height();
                    var containerWidth = $pluginSubject.width();
                    setImagePosition(canvas.width, canvas.height);
                    if (window.innerWidth > canvas.width) {
                        $('.sn-imageeditor-container').width(window.innerWidth).height(window.innerHeight);
                        $('#imageEditor').width(window.innerWidth);
                        //$element.width(window.innerWidth);
                    }
                    else {
                        $('.sn-imageeditor-container').width(window.innerWidth).height(window.innerHeight);
                        $('#imageEditor').width(window.innerWidth).height(window.innerHeight - 50);
                        //$element.width(containerWidth);
                    }

                }, 300);

            });

            function clearselectedArea() {
                selectedArea.x = null;
                selectedArea.y = null;
                selectedArea.x2 = null;
                selectedArea.y2 = null;
                selectedArea.w = null;
                selectedArea.h = null;
            }

            function changeSelection(c) {
                var x, y, x2, y2, w, h;
                x = c.x;
                x2 = c.x2;
                y = c.y;
                y2 = c.y2;
                w = c.w;
                h = c.h;
                $canvas = $('#imageEditorCanvas');
                if (!$('.cropInfo').length > 0) {
                    $cropInfo = $('<div class="cropInfo"></div>').appendTo($element);
                }
                $cropInfo.html('<span>W: ' + parseInt(w) + 'px</span><span>H: ' + parseInt(h) + 'px</span>');
                $cropInfo.css({ 'position': 'absolute', 'top': (y2 + $canvas.offset().top) - 100, 'left': (x2 + $canvas.offset().left) + 10 });
            }

            function selectSelection(c) {
                $('.cropInfo').remove();
                selectedArea.x = c.x;
                selectedArea.y = c.y;
                selectedArea.x2 = c.x2;
                selectedArea.y2 = c.y2;
                selectedArea.w = c.w;
                selectedArea.h = c.h;
            }

            function cropImage() {
                var w, h, resize, origW, origH;
                w = selectedArea.w;
                h = selectedArea.h;
                destroyJCrop();
                origW = cropRatioX;
                origH = cropRatioY;

                if (degrees === -90 || degrees === 270) {
                    cropX += canvas.height - (h + selectedArea.y);
                    cropY += selectedArea.x;
                    w = h;
                    h = selectedArea.w;
                    origW = cropRatioY;
                    origH = cropRatioX;
                }
                else if (degrees === 90 || degrees === -270) {

                    cropX += selectedArea.y;
                    cropY += canvas.width - (selectedArea.x + w);
                    w = h;
                    h = selectedArea.w;
                    origW = cropRatioY;
                    origH = cropRatioX;
                }
                else if (degrees === -180 || degrees === 180) {
                    cropX += canvas.width - (selectedArea.x + w);
                    cropY += canvas.height - (selectedArea.y + h);
                }
                else {
                    cropX += selectedArea.x;
                    cropY += selectedArea.y;
                }

                if (cropX < 0) {
                    cropX = 0;
                }
                if (cropY < 0) {
                    cropY = 0;
                }
                var filt = {};
                filt = filter;
                var rot = false;
                if (commands.length > 0 && commandIndex > -1) {
                    filt = commands[commandIndex].filtah;
                    rot = commands[commandIndex].rot;
                }
                else {
                    rot = false;
                }
                if (cropMode == 1) {
                    cropWidth = origW;
                    cropHeight = origH;
                    constrained = true;
                    addCommand(degrees, cropX, cropY, cropWidth, cropHeight, w, h, 0, 0, horizontaliFlipped, verticaliFlipped, rot, true, filt, resCanvas.width, resCanvas.height, resize, true);
                }
                else if (cropMode == 2) {
                    origW = parseInt($('#ratioX').val());
                    origH = parseInt($('#ratioY').val());
                    cropWidth = origW;
                    cropHeight = origH;
                    addCommand(degrees, cropX, cropY, cropWidth, cropHeight, w, h, 0, 0, horizontaliFlipped, verticaliFlipped, rot, true, filt, resCanvas.width, resCanvas.height, resize, true);
                }
                else if (cropMode == 0) {
                    addCommand(degrees, cropX, cropY, w, h, sizeObj.w, sizeObj.h, 0, 0, horizontaliFlipped, verticaliFlipped, rot, false, filt, resCanvas.width, resCanvas.height, resize, true);
                }
                reDraw();
                setImagePosition(w, h);
            }

            function setImagePosition(w, h) {
                $canvas = $('#imageEditorCanvas');
                $tempCanvas = $('#tempCanvas');
                imgTop = (window.innerHeight - 51 - h) / 2;
                if (imgTop < 33)
                    imgTop = 33;
                imgLeft = (window.innerWidth - w) / 2;
                if (imgLeft < 0)
                    imgLeft = 33;
                $canvas.css({ 'position': 'absolute', 'left': imgLeft, 'top': imgTop, 'margin-bottom': 33, 'margin-right': 33 });
                $tempCanvas.css({ 'position': 'absolute', 'left': imgLeft, 'top': imgTop, 'margin-bottom': 33, 'margin-right': 33 });
                $element.css({ 'height': window.innerHeight - $('.topToolbar').height() });
                if ($('.subtoolbar').height() > 0) {
                    $element.css({ 'height': window.innerHeight - ($('.topToolbar').height() + $('.subtoolbar').height() + 10) });
                }
                if (window.innerWidth < canvas.width) {
                    $('#imageEditor').height($('#imageEditor').height() - 50);
                }
            }

            function addCommand(d, cx, cy, w, h, w2, h2, ox, oy, hf, vf, rot, constr, f, resw, resh, res, cr) {
                prepareCommandList();
                if (commandIndex < maxStepCount - 1)
                    commandIndex += 1;
                else
                    commandIndex = 9;
                var command = new Command();
                commands.push(command);
                commands[commandIndex].index = commandIndex;
                commands[commandIndex].deg = d; //rotation degree
                commands[commandIndex].cx = cx; //starting point x coordinate
                commands[commandIndex].cy = cy; //starting point y coordinate
                commands[commandIndex].w = parseInt(w); //cropwidth
                commands[commandIndex].h = parseInt(h); //cropheight
                commands[commandIndex].w2 = w2; //image width
                commands[commandIndex].h2 = h2; //image height
                commands[commandIndex].ox = ox; //origin x
                commands[commandIndex].oy = oy; //origin y
                commands[commandIndex].hflip = hf; //is flipped horizontaly
                commands[commandIndex].vflip = vf; //is flipped vertically
                commands[commandIndex].rot = rot;
                commands[commandIndex].constr = constr;
                commands[commandIndex].filtah = f;
                commands[commandIndex].resw = parseInt(resw);
                commands[commandIndex].resh = parseInt(resh);
                commands[commandIndex].res = res;
                commands[commandIndex].cr = cr;
            }


            function reDraw(c) {
                img.width = sizeObj.w;
                img.height = sizeObj.h;
                executionsNum = 0;
                var currentCommand;
                if (typeof c !== 'undefined') {
                    if (c === -1) {
                        canvas.width = sizeObj.w;
                        canvas.height = sizeObj.h;
                        $canvas.css({ 'width': sizeObj.w, 'height': sizeObj.h });
                        cropWidth = sizeObj.w;
                        cropHeight = sizeObj.h;
                        origWidth = cropWidth;
                        origHeight = cropHeight;
                        horizontaliFlipped = false;
                        verticaliFlipped = false;
                        degrees = 0;
                        actualStepNum = -1;
                        cropX = 0;
                        cropY = 0;
                        resCanvas.width = sizeObj.w;
                        resCanvas.height = sizeObj.h;
                        resCtx.drawImage(img, 0, 0, sizeObj.w, sizeObj.h);
                        filter = {
                            grayscale: {
                                isSet: false,
                                g: 0
                            },
                            sepia: {
                                isSet: false,
                                s: 0
                            },
                            color: {
                                isSet: false,
                                r: null,
                                g: null,
                                b: null
                            },
                            brighten: {
                                isSet: false,
                                b: null,
                                c: null
                            },
                            threshold: false,
                            boxBlur: false,
                            //gaussianBlur: false,
                            sharpen: false,
                            invert: false,
                            detectEdges: false,
                            emboss: false,
                            sobel: false
                        }
                        ctx.drawImage(resCanvas, 0, 0, sizeObj.w, sizeObj.h);
                    }
                    else {
                        actualStepNum = c;
                        currentCommand = commands[c];
                    }

                }
                else {
                    actualStepNum = commands.length - 1;
                    currentCommand = commands[commands.length - 1];
                }
                if (typeof currentCommand !== 'undefined') {
                    resCanvas.width = currentCommand.resw;
                    resCanvas.height = currentCommand.resh;
                    resCtx.drawImage(img, 0, 0, currentCommand.resw, currentCommand.resh);
                    ctx.save();
                    if ((currentCommand.deg / 90) % 2 === 0) {
                        canvas.width = currentCommand.w;
                        canvas.height = currentCommand.h;
                        $canvas.css({ 'width': currentCommand.w, 'height': currentCommand.h });
                        if (currentCommand.deg === -180 || currentCommand.deg === 180) {
                            if ((currentCommand.index - 1) > -1 && currentCommand.deg !== commands[currentCommand.index - 1].deg) {
                                canvas.width = currentCommand.h;
                                canvas.height = currentCommand.w;
                                $canvas.css({ 'width': currentCommand.h, 'height': currentCommand.w });
                            }
                            ctx.translate(canvas.width, canvas.height);
                            ctx.rotate(currentCommand.deg * Math.PI / 180);
                        }
                        else if ((currentCommand.deg === 0 && currentCommand.rot) || currentCommand.deg === -360 || currentCommand.deg === 360) {
                            if ((currentCommand.index - 1) > -1 && currentCommand.deg !== commands[currentCommand.index - 1].deg) {
                                canvas.width = currentCommand.h;
                                canvas.height = currentCommand.w;
                                $canvas.css({ 'width': currentCommand.h, 'height': currentCommand.w });
                            }
                            ctx.translate(0, 0);
                            ctx.rotate(currentCommand.deg * Math.PI / 180);
                        }
                        if (currentCommand.constr) {
                            if (currentCommand.rot) {
                                w = currentCommand.h;
                                h = currentCommand.w;
                            }
                            else {
                                w = currentCommand.w;
                                h = currentCommand.h;
                            }
                            ctx.drawImage(resCanvas, currentCommand.cx, currentCommand.cy, currentCommand.w2, currentCommand.h2, currentCommand.ox, currentCommand.oy, w, h);
                        }
                        else {
                            if (currentCommand.res && currentCommand.cx !== 0) {

                                if (currentCommand.w2 > currentCommand.resw) currentCommand.w2 = currentCommand.resw;
                                if (currentCommand.h2 > currentCommand.resh) currentCommand.h2 = currentCommand.resh;
                                ctx.drawImage(resCanvas, currentCommand.cx, currentCommand.cy, currentCommand.w2, currentCommand.h2, currentCommand.ox, currentCommand.oy, currentCommand.w2, currentCommand.h2);
                            }
                            else if (currentCommand.res && (currentCommand.resw > currentCommand.w2 || currentCommand.resh > currentCommand.h2)) {
                                ctx.drawImage(resCanvas, currentCommand.cx, currentCommand.cy, currentCommand.resw, currentCommand.resh, currentCommand.ox, currentCommand.oy, currentCommand.resw, currentCommand.resh);
                            }
                            else {
                                if (currentCommand.w2 > currentCommand.resw) currentCommand.w2 = currentCommand.resw;
                                if (currentCommand.h2 > currentCommand.resh) currentCommand.h2 = currentCommand.resh;
                                ctx.drawImage(resCanvas, currentCommand.cx, currentCommand.cy, currentCommand.w2, currentCommand.h2, currentCommand.ox, currentCommand.oy, currentCommand.resw, currentCommand.resh);
                            }
                        }
                    }
                    else {

                        canvas.width = currentCommand.resw;
                        canvas.height = currentCommand.resh;
                        $canvas.css({ 'width': currentCommand.w, 'height': currentCommand.h });
                        if (currentCommand.deg !== 0) {
                            canvas.width = currentCommand.h;
                            canvas.height = currentCommand.w;
                            $canvas.css({ 'width': currentCommand.h, 'height': currentCommand.w });
                            if (currentCommand.deg === -90 || currentCommand.deg === 270) {
                                ctx.translate(0, canvas.height);
                            }
                            else {
                                ctx.translate(canvas.width, 0);
                            }
                            ctx.rotate(currentCommand.deg * Math.PI / 180);
                        }
                        if (currentCommand.constr) {
                            ctx.drawImage(resCanvas, currentCommand.cx, currentCommand.cy, currentCommand.w2, currentCommand.h2, currentCommand.ox, currentCommand.oy, currentCommand.w, currentCommand.h);
                        }
                        else {
                            if (currentCommand.w > sizeObj.w && currentCommand.res) {
                                ctx.drawImage(resCanvas, currentCommand.cx, currentCommand.cy, currentCommand.w, currentCommand.h, currentCommand.ox, currentCommand.oy, currentCommand.w, currentCommand.h);
                            }
                            else {

                                if (currentCommand.w2 > currentCommand.resw) currentCommand.w2 = currentCommand.resw;
                                if (currentCommand.h2 > currentCommand.resh) currentCommand.h2 = currentCommand.resh;
                                if (currentCommand.res && currentCommand.cx !== 0) {
                                    ctx.drawImage(resCanvas, currentCommand.cx, currentCommand.cy, currentCommand.w2, currentCommand.h2, currentCommand.ox, currentCommand.oy, currentCommand.resw, currentCommand.resh);
                                }
                                else {
                                    ctx.drawImage(resCanvas, currentCommand.cx, currentCommand.cy, currentCommand.resw, currentCommand.resh, currentCommand.ox, currentCommand.oy, currentCommand.resw, currentCommand.resh);
                                }
                            }
                        }
                    }
                    ctx.restore();
                    degrees = currentCommand.deg;
                    //flipCanvas(currentCommand);
                    if (typeof c !== 'undefined' && commands.length > 0 && filterEnabled(commands[c].filtah)) {
                        executeFilter(commands[c].filtah, commands[c].deg, commands[c].res);
                    }
                    else {
                        executeFilter(commands[commands.length - 1].filtah, commands[commands.length - 1].deg, commands[commands.length - 1].res);
                    }
                }

                hideLoader();
                setImagePosition(canvas.width, canvas.height);
                if (commandIndex === -1) {
                    $('.sn-icon-undo').addClass('disabled');
                }
                else {
                    $('.sn-icon-undo').removeClass('disabled');
                }
                if (commandIndex === commands.length - 1) {
                    $('.sn-icon-redo').addClass('disabled');
                }
                else {
                    $('.sn-icon-redo').removeClass('disabled');
                }
            }

            function executeFilter(f, d, r) {
                executionsNum += 1;
                //var tCanvas = document.getElementById('temp');
                //console.log(tCanvas.width+', '+tCanvas.height);
                imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);


                ////imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                if (r) {
                    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                }
                var data = imageData.data;
                //var data2 = imageData2.data;
                var height = imageData.height;
                //var width2 = imageData2.width;
                //var height2 = imageData2.height;
                var width = imageData.width;
                if (f.grayscale.isSet) {
                    grayscaleFilter(imageData, data, height, width, f.grayscale.g);
                }
                if (f.sepia.isSet) {
                    sepiaFilter(imageData, data, height, width, f.sepia.s);
                }
                if (f.color.isSet) {
                    colorFilter(imageData, data, height, width, f.color.r, f.color.g, f.color.b);
                }
                if (f.brighten.isSet) {
                    brightenFilter(imageData, data, height, width, f.brighten.b, f.brighten.c);
                }
                if (f.threshold) {
                    thresholdFilter(imageData, data, height, width);
                }
                if (f.boxBlur) {
                    runFilter('blurC', Filters.convolute,
                  [1 / 9, 1 / 9, 1 / 9,
                    1 / 9, 1 / 9, 1 / 9,
                    1 / 9, 1 / 9, 1 / 9]);
                }
                if (f.detectEdges) {
                    runFilter('detectEdges', Filters.convolute,
                  [-1, -1, -1,
                   -1, 8, -1,
                    -1, -1, -1], true);
                }
                if (f.emboss) {
                    runFilter('emboss', Filters.convolute,
                  [-2, -1, 0,
                   -1, 1, 1,
                    0, 1, 2]);
                }
                if (f.sobel) {
                    runFilter('sobel', function (px) {
                        px = Filters.grayscale(px);
                        var vertical = Filters.convoluteFloat32(px,
                          [-1, -2, -1,
                            0, 0, 0,
                            1, 2, 1]);
                        var horizontal = Filters.convoluteFloat32(px,
                          [-1, 0, 1,
                           -2, 0, 2,
                           -1, 0, 1]);
                        var id = Filters.createImageData(vertical.width, vertical.height);
                        for (var i = 0; i < id.data.length; i += 4) {
                            var v = Math.abs(vertical.data[i]);
                            id.data[i] = v;
                            var h = Math.abs(horizontal.data[i]);
                            id.data[i + 1] = h
                            id.data[i + 2] = (v + h) / 4;
                            id.data[i + 3] = 255;
                        }
                        return id;
                    });
                }
                if (f.invert) {
                    invertFilter(imageData, data, height, width);
                }
                if (f.sharpen) {
                    runFilter('sharpen', Filters.convolute,
                  [0, -1, 0,
                   -1, 5, -1,
                    0, -1, 0]);
                }

            }

            //filters

            function invertFilter(imageData, data, h, w) {

                var length = data.length;
                for (var idx = 0; idx < length; idx += 4) {
                    data[idx] = 255 - data[idx];
                    data[idx + 1] = 255 - data[idx + 1];
                    data[idx + 2] = 255 - data[idx + 2];
                }
                ctx.putImageData(imageData, 0, 0, 0, 0, w, h);
            }

            function grayscaleFilter(imageData, data, h, w, g) {
                var length = data.length;
                var t = g / 100;
                var i = data;
                var n = i.length / 4;
                var r = 1 - t;
                for (var o = 0; o < i.length; o += 4) {
                    var a = i[o];
                    var s = i[o + 1];
                    var l = i[o + 2];
                    var u = .3 * a + .59 * s + .11 * l;
                    i[o] = i[o + 1] = i[o + 2] = u;
                    i[o] = t * i[o] + r * a;
                    i[o + 1] = t * i[o + 1] + r * s;
                    i[o + 2] = t * i[o + 2] + r * l;
                }
                ctx.putImageData(imageData, 0, 0, 0, 0, w, h);
            }

            function sepiaFilter(imageData, data, h, w, s) {
                var length = data.length;
                var t = s / 100;
                var i = imageData.data;
                var n = 1 - t;
                for (var r = 0; r < length; r += 4) {
                    var o = i[r];
                    var a = i[r + 1];
                    var s = i[r + 2];
                    i[r] = o * .393 + a * .769 + s * .189;
                    i[r + 1] = o * .349 + a * .686 + s * .168;
                    i[r + 2] = o * .272 + a * .534 + s * .131;
                    i[r + 3] = i[r + 3];
                    i[r] = t * i[r] + n * o;
                    i[r + 1] = t * i[r + 1] + n * a;
                    i[r + 2] = t * i[r + 2] + n * s;
                }
                ctx.putImageData(imageData, 0, 0, 0, 0, w, h);
            }

            function colorFilter(imageData, data, h, w, r, g, b) {
                var h = imageData.height;
                var w = imageData.width;
                var length = data.length;


                for (var idx = 0; idx < length; idx += 4) {
                    if (r < 0) {
                        r1 = data[idx] / (r / 10);
                    }
                    else {

                        r1 = data[idx] * (r / 10);
                    }
                    if (g < 0) {
                        g1 = data[idx + 1] / (g / 10);
                    }
                    else {
                        g1 = data[idx + 1] * (g / 10);
                    }

                    if (b < 0) {
                        b1 = data[idx + 2] * (b / 10);
                    }
                    else {
                        b1 = data[idx + 2] / (b / 10);
                    }

                    if (r !== 0) {
                        data[idx] = r1;
                    }
                    if (g !== 0) {
                        data[idx + 1] = g1;
                    }
                    if (b !== 0) {
                        data[idx + 2] = b1;
                    }
                }
                ctx.putImageData(imageData, 0, 0, 0, 0, w, h);
            }

            function brightenFilter(imageData, data, h, w, b, c) {
                var h = imageData.height;
                var w = imageData.width;
                var length = data.length;
                for (var idx = 0; idx < length; idx += 4) {
                    data[idx] += b;
                    data[idx + 1] += b;
                    data[idx + 2] += b;
                    // data[idx + 3] stores the alpha channel
                }
                for (var i = 0; i < length; i += 4) {
                    var average = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
                    if (average > 127) {
                        data[i] += (data[i] / average) * c;
                        data[i + 1] += (data[i + 1] / average) * c;
                        data[i + 2] += (data[i + 2] / average) * c;
                    } else {
                        data[i] -= (data[i] / average) * c;
                        data[i + 1] -= (data[i + 1] / average) * c;
                        data[i + 2] -= (data[i + 2] / average) * c;
                    }
                    // data[idx + 3] stores the alpha channel
                }
                ctx.putImageData(imageData, 0, 0, 0, 0, w, h);
            }

            function thresholdFilter(imageData, data, h, w) {
                var length = data.length;
                for (var idx = 0; idx < length; idx += 4) {
                    var r = data[idx];
                    var g = data[idx + 1];
                    var b = data[idx + 2];
                    var v = (0.2126 * r + 0.7152 * g + 0.0722 * b >= 128) ? 255 : 0;
                    data[idx] = data[idx + 1] = data[idx + 2] = v
                }
                ctx.putImageData(imageData, 0, 0, 0, 0, w, h);
            }

            function flipCanvas(c) {
                var scaleX = c.hflip ? -1 : 1;
                var scaleY = c.vflip ? -1 : 1;
                $canvas.css({
                    '-moz-transform': 'scale(' + scaleX + ',' + scaleY + ')',
                    '-o-transform': 'scale(' + scaleX + ',' + scaleY + ')',
                    '-webkit-transform': 'scale(' + scaleX + ',' + scaleY + ')',
                    'transform': 'scale(' + scaleX + ',' + scaleY + ')',
                    'filter': 'FlipH',
                    '-ms-filter': 'FlipH'
                });
            }

            function rotate(o) {
                if (!rotating) {
                    rotating = true;
                    if (o === 'ccw') {
                        degrees -= 90;
                        degrees = optimizeDegree(degrees);
                    }
                    else {
                        degrees += 90;
                        degrees = optimizeDegree(degrees);
                    }


                    if (constrainedCrop()) {
                        addCommand(degrees, cropX, cropY, canvas.width, canvas.height, cropWidth, cropHeight, 0, 0, horizontaliFlipped, verticaliFlipped, true, true, filter, resCanvas.width, resCanvas.height, resize, true);
                    }
                    else {
                        addCommand(degrees, cropX, cropY, canvas.width, canvas.height, resCanvas.width, resCanvas.height, 0, 0, horizontaliFlipped, verticaliFlipped, true, false, filter, resCanvas.width, resCanvas.height, resize, cropped());
                    }
                    reDraw();

                    rotating = false;
                }
            }

            function constrainedCrop() {
                var constrainedCrop = false;
                for (var i = actualStepNum; i > -1; i--) {
                    if (commands[i].constr) {
                        constrainedCrop = true;
                        cropWidth = commands[i].w2;
                        cropHeight = commands[i].h2;
                        break;
                    }
                }
                return constrainedCrop;
            }

            function cropped() {
                var cropped = false;
                for (var i = actualStepNum; i > -1; i--) {
                    if (commands[i].cr) {
                        cropped = true;
                        break;
                    }
                }
                return cropped;
            }

            function flip(o) {
                var cw = canvas.width;
                var ch = canvas.height;
                var h, w;


                if (o === 'h' && horizontaliFlipped) {
                    horizontaliFlipped = false;
                }
                else if (o === 'h' && !horizontaliFlipped) {
                    horizontaliFlipped = true;
                }

                if (o === 'v' && verticaliFlipped) {
                    verticaliFlipped = false;
                }
                else if (o === 'v' && !verticaliFlipped) {
                    verticaliFlipped = true;
                }



                addCommand(degrees, cropX, cropY, canvas.width, canvas.height, sizeObj.w, sizeObj.h, 0, 0, horizontaliFlipped, verticaliFlipped, false, resCanvas.width, resCanvas.height, resize, cropped());

                reDraw();
            }

            function optimizeDegree(degrees) {
                if (degrees > 360) {
                    degrees -= 360;
                }
                else if (degrees < -360) {
                    degrees += 360;
                }
                return degrees;
            }

            var cropCommand = function (value) {
                return new Command(Crop, sub, value);
            };

            var imageEditor = function () {
                var current = 0
                commands = [];

                function action(command) {
                    var name = command.execute.toString();
                    return name;
                }

                return {
                    execute: function (command) {
                        current = command.execute(current, command.value);
                        commands.push(command);
                    },
                    undo: function () {
                        var command = commands.pop();
                        current = command.undo(current, command.value);
                    },
                    getCurrentValue: function () {
                        return current;
                    }
                }
            }

            function initializeImageEditorPlugin() {
                imageeditor = new imageEditor();
                createCanvas();
                createTopToolbar();
                createToolbar();
                $fileInput.fileupload({
                    maxChunkSize: maxChunkSize,
                    dataType: 'json',
                    add: function (e, data) {
                        if (data.files[0].type.indexOf('image') > -1) {
                            imageLoad(e, data);
                            var filename = defaultFileName, filetype = fileType;
                            if (fileName === 'auto')
                                imgName = data.files[data.files.length - 1].name;
                            else
                                imgName = fileName;
                            
                            if (fileType === 'auto') {
                                var typeArray = data.files[data.files.length - 1].name.split('.');
                                fileType = typeArray[typeArray.length - 1];
                            }
                            else {
                                var typeArray = fileType.split('/');
                                fileType = typeArray[typeArray.length - 1];
                            }
                            uploaddata.push(data);
                        }
                        else {
                            overlayManager.showOverlay({
                                text: SN.Resources.ImageEditor['onlyImage'],
                                appendCloseButton: true
                            });
                        }
                    },
                    fail: function (e, data) {
                        var $error = $('.sn-upload-error', data.context);
                        console.log(data.jqXHR.responseText);
                        //var json = (data.jqXHR.responseText) ? jQuery.parseJSON(data.jqXHR.responseText) : data.result;
                        //if (typeof (json) == 'undefined') {
                        //    $error.text($('#sn-upload-othererror').text());
                        //} else {
                        //    $error.text(json.error.message.value);
                        //}
                        //$error.show();
                    },
                    done: function (e, data) {
                        overlayManager.showMessage({
                            type: "success",
                            title: SN.Resources.ImageEditor['successTitle'],
                            text: SN.Resources.ImageEditor['successMessage']
                        });
                    }
                });
            }

            function imageLoad(e, d) {
                var reader = new FileReader();
                var imgLeft, imgTop;
                reader.onload = function (event) {
                    img = new Image();
                    img.onload = function () {
                        reSizeImageAtOnload(img.width, img.height);
                        createResCanvas('temp');
                        img.width = sizeObj.w;
                        img.height = sizeObj.h;
                        canvas.width = sizeObj.w;
                        canvas.height = sizeObj.h;
                        resCanvas.width = sizeObj.w;
                        resCanvas.height = sizeObj.h;
                        resCtx.drawImage(img, 0, 0, sizeObj.w, sizeObj.h);
                        ctx.drawImage(resCanvas, 0, 0);
                        cropWidth = sizeObj.w;
                        cropHeight = sizeObj.h;
                        origWidth = cropWidth;
                        origHeight = cropHeight;
                        fullWidth = sizeObj.w;
                        fullHeight = sizeObj.h;
                        setImagePosition(cropWidth, cropHeight);
                    }
                    img.src = event.target.result;
                }

                if (typeof e.delegateTarget.files !== 'undefined')
                    reader.readAsDataURL(e.delegateTarget.files[0]);
                else {
                    reader.readAsDataURL(d.files[0]);
                }

                $container.css({ 'width': window.innerWidth, 'height': window.innerHeight, 'z-index': 100, 'position': 'absolute', 'top': 0, 'left': 0 });
                $element.css({ 'width': window.innerWidth, 'height': window.innerHeight - 30, 'position': 'absolute', 'top': '51px' });

                setTimeout(function () {
                    $container.fadeIn(200);
                }, 300);
            }

            function createCanvas() {
                canvas = document.createElement('canvas');
                ctx = canvas.getContext("2d");
                $element.append(canvas);
                $element.children('canvas').attr('id', 'imageEditorCanvas');

            }

            function createResCanvas(id) {
                var imageEditorContainer = document.getElementById('imageEditor');
                resCanvas = document.createElement('canvas');
                resCanvas.id = id;
                resCanvas.width = canvas.width;
                resCanvas.height = canvas.height;
                imageEditorContainer.appendChild(resCanvas);
                resCtx = resCanvas.getContext("2d");
                $(resCanvas).hide();
                resCtx.drawImage(canvas, 0, 0);
            }

            function createTopToolbar() {
                var topToolbar = $('<div class="topToolbar"></div>').prependTo($container);
                $container.prepend(topToolbar);
                $topToolbar = $('.topToolbar');
                $.each(menu, function (i, item) {
                    if (!$.isPlainObject(item)) {
                        addDefaultMenuItem(item);
                    }
                    else {
                        var tool;
                        tool.name = item.name;
                        tool.title = item.title;
                        tool.icon = item.icon;
                        tool.template = item.template;
                        tool.click = item.click;
                        addMenuitem(tool);
                    }
                });
                $closeButton = $('<span class="close-button" title="' + SN.Resources.ImageEditor["backtoUpload"] + '"></span>');
                $backtoLibraryButton = $('<span class="back-button" title="' + SN.Resources.ImageEditor["backtoLibrary"] + '"></span>');

                $topToolbar.append($closeButton);
                if (backToLibraryLink)
                    $topToolbar.append($backtoLibraryButton);
                $closeButton.on('click', function () {
                    if (typeof jcrop_api != 'undefined')
                        destroyJCrop();
                    
                    destroyPlugin();
                });

                $backtoLibraryButton.on('click', function () {
                    window.location = targetPath;
                });
            }

            function createToolbar() {
                $('.sn-portalremotecontrol span').css('z-index', '0');
                var toolbar = $('<div class="imageEditorToolbar ui-widget-content"><span class="close"></span><div class="toolbarInner open"></div></div>').appendTo($container);
                $element.prepend(toolbar);
                $toolbar = $('.imageEditorToolbar');
                $toolbarInner = $('.toolbarInner');
                $toolbarClose = $toolbar.children('.close');
                $dockMark = $('<span class="dockmark"></span>');
                $editor.append($dockMark);
                $toolbar.draggable({
                    start: function (event, ui) {
                        $(this).addClass('noclick');
                        $(this).removeClass('dockLeft');
                        $(this).removeClass('dockRight');
                    },
                    drag: function (event, ui) {
                        var Startpos = $(this).position();
                        var left = Startpos.left;
                        var right = Startpos.left + $toolbar.width();
                        if (left < $toolbar.width()) {
                            //ui.draggable.draggable("disable", 1);
                            $dockMark.css('left', '0px').fadeIn();
                            toolbarDockLeft = true;
                            toolbarDockRight = false;
                        }
                        else if (right >= window.innerWidth - $toolbar.width()) {
                            //ui.draggable.draggable("disable", 1);
                            var dockMarkLeft = $editor.width() - 3;
                            if (hasScrollBar($editor)) {
                                dockMarkLeft -= scrollbarWidth();
                            }
                            $dockMark.css('left', dockMarkLeft + 'px').fadeIn();
                            toolbarDockRight = true;
                            toolbarDockLeft = false;
                        }
                        else {
                            toolbarDockRight = false;
                            toolbarDockLeft = false;
                            $dockMark.fadeOut();
                        }
                    },
                    stop: function (event, ui) {
                        if (toolbarDockLeft) {
                            $dockMark.fadeOut();
                            $(this).addClass('dockLeft');
                        }
                        else if (toolbarDockRight) {
                            $dockMark.fadeOut();
                            $(this).addClass('dockRight');
                        }
                    }
                });
                $toolbarClose.on('click', function () {
                    if (!$(this).parent().hasClass('noclick')) {
                        if (!$toolbarInner.hasClass('open')) {
                            $toolbarInner.slideDown(200, function () {
                                $toolbarInner.addClass('open');
                            });
                        }
                        else {
                            $toolbarInner.slideUp(200, function () {
                                $toolbarInner.removeClass('open');
                            });
                        }
                    }
                    else {
                        $(this).parent().removeClass('noclick');
                    }
                });
                $.each(tools, function (i, item) {
                    if (!$.isPlainObject(item)) {
                        var tool = new Tool();
                        tool.name = item;
                        tool.title = SN.Resources.ImageEditor[item];
                        if (item === 'forecolor') {
                            tool.title = '#000000';
                        }
                        tool.icon = item;
                        tool.template = null;
                        if (item === 'crop') {
                            tool.click = function () {
                                $canvas.off('click.colorPicker');
                                if (typeof jcrop_api !== 'undefined') {
                                    destroyJCrop();
                                }
                                if ($('.sn-icon-crop').hasClass('active')) {
                                    $('.sn-icon-crop').removeClass('active');
                                    destroyJCrop();
                                    closeSubToolbar();
                                }
                                else {
                                    $('.sn-icon-crop').addClass('active');
                                    Crop();
                                }
                            }
                        }
                        else if (item === 'rotate-left') {
                            tool.click = function () {

                                if ($('.jcrop-tracker').length > 0) {
                                    overlayManager.showOverlay({
                                        text: $pleaseCropWindowTemplate
                                    });

                                    $('.overlay').find('.sn-button').on('click', function () {
                                        var that = $(this);
                                        if (that.hasClass('dontCrop')) {
                                            doNotCrop();

                                        }
                                        else if (that.hasClass('doCrop')) {
                                            doCrop();
                                        }
                                        else {
                                            cancelCrop();
                                        }
                                    });
                                }
                                else {
                                    showLoader();
                                    setTimeout(function () {
                                        $canvas.off('click.colorPicker');
                                        if (typeof jcrop_api !== 'undefined') {
                                            destroyJCrop();
                                            closeSubToolbar();
                                        }
                                        $('.sn-icon').removeClass('active');
                                        rotate('ccw');
                                    }, 500);
                                }
                            }
                        }
                        else if (item === 'rotate-right') {
                            tool.click = function () {
                                if ($('.jcrop-tracker').length > 0) {
                                    overlayManager.showOverlay({
                                        text: $pleaseCropWindowTemplate
                                    });

                                    $('.overlay').find('.sn-button').on('click', function () {
                                        var that = $(this);
                                        if (that.hasClass('dontCrop')) {
                                            doNotCrop();

                                        }
                                        else if (that.hasClass('doCrop')) {
                                            doCrop();
                                        }
                                        else {
                                            cancelCrop();
                                        }
                                    });
                                }
                                else {
                                    showLoader();
                                    setTimeout(function () {
                                        $canvas.off('click.colorPicker');
                                        if (typeof jcrop_api !== 'undefined') {
                                            destroyJCrop();
                                            closeSubToolbar();
                                        }
                                        $('.sn-icon').removeClass('active');
                                        rotate('cw');
                                    }, 500);
                                }
                            }
                        }
                        else if (item === 'flip-horizontal') {
                            tool.click = function () {
                                $canvas.off('click.colorPicker');
                                if (typeof jcrop_api !== 'undefined') {
                                    destroyJCrop();
                                    closeSubToolbar();
                                }
                                $('.sn-icon').removeClass('active');
                                flip('h');
                            }
                        }
                        else if (item === 'flip-vertical') {
                            tool.click = function () {
                                $canvas.off('click.colorPicker');
                                if (typeof jcrop_api !== 'undefined') {
                                    destroyJCrop();
                                    closeSubToolbar();
                                }
                                $('.sn-icon').removeClass('active');
                                flip('v');
                            }
                        }
                        else if (item === 'text') {
                            tool.click = function () {
                                $canvas.off('click.colorPicker');
                                $('.sn-icon-text').siblings().removeClass('active');
                                if ($('.sn-icon-text').hasClass('active')) {
                                    $('.sn-icon-text').removeClass('active');
                                    closeSubToolbar();
                                }
                                else {
                                    $('.sn-icon-text').addClass('active');
                                    createSubToolbar($textSubToolbarTemplate, 'text');
                                    colorpicker = $("#hsv").kendoColorPicker({
                                        value: "#ffffff",
                                        buttons: false,
                                        select: colorIsChosen
                                    }).data("kendoColorPicker");
                                    if (!$('.tempCanvas').length > 0) {
                                        createTempCanvas();
                                    }
                                }
                            }
                        }
                        else if (item === 'color-picker') {
                            tool.click = function () {
                                if ($('.jcrop-tracker').length > 0) {
                                    overlayManager.showOverlay({
                                        text: $pleaseCropWindowTemplate
                                    });

                                    $('.overlay').find('.sn-button').on('click', function () {
                                        var that = $(this);
                                        if (that.hasClass('dontCrop')) {
                                            doNotCrop();

                                        }
                                        else if (that.hasClass('doCrop')) {
                                            doCrop();
                                        }
                                        else {
                                            cancelCrop();
                                        }
                                    });
                                }
                                else {
                                    $('.sn-icon-color-picker').siblings().removeClass('active');
                                    if ($('.sn-icon-color-picker').hasClass('active')) {
                                        $('.sn-icon-color-picker').removeClass('active');
                                    }
                                    else {
                                        $('.sn-icon-color-picker').addClass('active');
                                        $canvas.on('click.colorPicker', function (e) {
                                            var color;
                                            var mousePos = getMousePos(canvas, e);
                                            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                                            var data = imageData.data;
                                            var x = mousePos.x;
                                            var y = mousePos.y;
                                            var red = data[((canvas.width * y) + x) * 4];
                                            var green = data[((canvas.width * y) + x) * 4 + 1];
                                            var blue = data[((canvas.width * y) + x) * 4 + 2];
                                            color = rgbToHex(red, green, blue)
                                            $('.sn-icon-forecolor').attr('title', color).css('background', color);
                                        });
                                    }
                                }
                            }
                        }
                        else if (item === 'forecolor') {
                            tool.click = function () {

                                if ($('.jcrop-tracker').length > 0) {
                                    overlayManager.showOverlay({
                                        text: $pleaseCropWindowTemplate
                                    });

                                    $('.overlay').find('.sn-button').on('click', function () {
                                        var that = $(this);
                                        if (that.hasClass('dontCrop')) {
                                            doNotCrop();

                                        }
                                        else if (that.hasClass('doCrop')) {
                                            doCrop();
                                        }
                                        else {
                                            cancelCrop();
                                        }
                                    });
                                }
                                else {
                                    var color = $('.sn-icon-forecolor').attr('title');

                                    function changeForeColor(e) {
                                        color = e.value;
                                    }
                                    overlayManager.showOverlay({
                                        text: '<div id="foreColor"></div><div class="buttonRow"><span class="sn-button sn-saveButton">' + SN.Resources.ImageEditor['Save'] + '</span><span class="sn-button sn-cancelButton">' + SN.Resources.ImageEditor['Cancel'] + '</span></div>',
                                        appendCloseButton: true
                                    });

                                    $("#foreColor").kendoFlatColorPicker({
                                        value: color,
                                        buttons: false,
                                        change: changeForeColor
                                    });

                                    $('.sn-saveButton').on('click', function () {
                                        overlayManager.hideOverlay();
                                        $('.sn-icon-forecolor').attr('title', color).css('background', color);
                                    });
                                    $('.sn-cancelButton').on('click', function () {
                                        overlayManager.hideOverlay();
                                    });
                                }
                            }
                        }
                        addTool(tool);
                    }
                    else {
                        var tool = new Tool();
                        tool.name = item.name;
                        tool.title = item.title || '';
                        tool.icon = item.icon || null;
                        tool.template = item.template || null;
                        tool.click = item.click || null;
                        addTool(tool);
                    }
                });
            }

            function colorIsChosen(e) {
                colorpicker.close();
                textColor = e.value;
            }

            function addTool(t) {
                if (t.template == 'undefined' || t.template == null || typeof t.template == 'undefined') {
                    $toolbarButton = $('<span class="sn-icon sn-icon-' + t.name + '" title="' + t.title + '"></span>');
                    $toolbarInner.append($toolbarButton);
                    $toolbarButton.on('click', t.click);
                }
                else {
                    $toolbarButton = $(t.template);
                    $toolbarInner.append($toolbarButton);
                    $toolbarButton.on('click', t.click);
                }
            }

            function addDefaultMenuItem(t) {
                $toolbarButton = $('<span class="sn-icon sn-icon-' + t + '" title="' + SN.Resources.ImageEditor[t] + '">' + SN.Resources.ImageEditor[t] + '</span>');
                
                var tool = new Tool();
                if (t === 'download' && window.navigator.userAgent.indexOf('MSIE ') === -1 && window.navigator.userAgent.indexOf('Edge') === -1) {

                    $topToolbar.append($toolbarButton);
                    tool.name = t;
                    tool.click = function () {
                        if ($('.jcrop-tracker').length > 0) {
                            overlayManager.showOverlay({
                                text: $pleaseCropWindowTemplate
                            });

                            $('.overlay').find('.sn-button').on('click', function () {
                                var that = $(this);
                                if (that.hasClass('dontCrop')) {
                                    doNotCrop();

                                }
                                else if (that.hasClass('doCrop')) {
                                    doCrop();
                                }
                                else {
                                    cancelCrop();
                                }
                            });
                        }
                        else {
                            downloadCanvas();
                            if ($('.sn-icon-filter').hasClass('open')) {
                                $('.filterSubmenuList').slideUp();
                                $('.sn-icon-filter').removeClass('open');
                            }
                        }
                    };
                }
                else if (t === 'upload') {

                    $topToolbar.append($toolbarButton);
                    tool.click = function () {
                        if ($('.jcrop-tracker').length > 0) {
                            overlayManager.showOverlay({
                                text: $pleaseCropWindowTemplate
                            });

                            $('.overlay').find('.sn-button').on('click', function () {
                                var that = $(this);
                                if (that.hasClass('dontCrop')) {
                                    doNotCrop();

                                }
                                else if (that.hasClass('doCrop')) {
                                    doCrop();
                                }
                                else {
                                    cancelCrop();
                                }
                            });
                        }
                        else {
                            if (uploadPermissionAllowed)
                                uploadCanvas();
                            else {
                                overlayManager.showOverlay({
                                    text: '<div>' + SN.Resources.ImageEditor['LogInMessage'] + '</div>',
                                    appendCloseButton: true
                                });
                            }
                            if ($('.sn-icon-filter').hasClass('open')) {
                                $('.filterSubmenuList').slideUp();
                                $('.sn-icon-filter').removeClass('open');
                            }
                        }
                    };
                }
                else if (t === 'undo') {

                    $topToolbar.append($toolbarButton);
                    $toolbarButton.addClass('disabled');
                    tool.click = function () {
                        if ($('.jcrop-tracker').length > 0) {
                            overlayManager.showOverlay({
                                text: $pleaseCropWindowTemplate
                            });

                            $('.overlay').find('.sn-button').on('click', function () {
                                var that = $(this);
                                if (that.hasClass('dontCrop')) {
                                    doNotCrop();

                                }
                                else if (that.hasClass('doCrop')) {
                                    doCrop();
                                }
                                else {
                                    cancelCrop();
                                }
                            });
                        }
                        else {
                            undo();
                            if ($('.sn-icon-filter').hasClass('open')) {
                                $('.filterSubmenuList').slideUp();
                                $('.sn-icon-filter').removeClass('open');
                            }
                        }
                    }
                }
                else if (t === 'redo') {

                    $topToolbar.append($toolbarButton);
                    $toolbarButton.addClass('disabled');
                    tool.click = function () {
                        if ($('.jcrop-tracker').length > 0) {
                            overlayManager.showOverlay({
                                text: $pleaseCropWindowTemplate
                            });

                            $('.overlay').find('.sn-button').on('click', function () {
                                var that = $(this);
                                if (that.hasClass('dontCrop')) {
                                    doNotCrop();

                                }
                                else if (that.hasClass('doCrop')) {
                                    doCrop();
                                }
                                else {
                                    cancelCrop();
                                }
                            });
                        }
                        else {
                            setTimeout(function () {
                                redo();
                                if ($('.sn-icon-filter').hasClass('open')) {
                                    $('.filterSubmenuList').slideUp();
                                    $('.sn-icon-filter').removeClass('open');
                                }
                            }, 500);
                        }
                    }
                }
                else if (t === 'filter') {

                    $topToolbar.append($toolbarButton);
                    tool.click = function () {
                        if ($('.jcrop-tracker').length > 0) {
                            overlayManager.showOverlay({
                                text: $pleaseCropWindowTemplate
                            });

                            $('.overlay').find('.sn-button').on('click', function () {
                                var that = $(this);
                                if (that.hasClass('dontCrop')) {
                                    doNotCrop();

                                }
                                else if (that.hasClass('doCrop')) {
                                    doCrop();
                                }
                                else {
                                    cancelCrop();
                                }
                            });
                        }
                        else {
                            openFilterSubmenu(tool);
                        }
                    }
                }
                else if (t === 'resize') {

                    $topToolbar.append($toolbarButton);
                    tool.click = function () {
                        if ($('.jcrop-tracker').length > 0) {
                            overlayManager.showOverlay({
                                text: $pleaseCropWindowTemplate
                            });

                            $('.overlay').find('.sn-button').on('click', function () {
                                var that = $(this);
                                if (that.hasClass('dontCrop')) {
                                    doNotCrop();

                                }
                                else if (that.hasClass('doCrop')) {
                                    doCrop();
                                }
                                else {
                                    cancelCrop();
                                }
                            });
                        }
                        else {
                            overlayManager.showOverlay({
                                title: SN.Resources.ImageEditor['resize'],
                                text: resizeWindowTemplate,
                                appendCloseButton: true,
                                cssClass: 'resizeWindow'
                            });

                            $popup = $('.sn-popup');
                            if (window.navigator.userAgent.indexOf('MSIE ') === -1 && window.navigator.userAgent.indexOf('Edge') === -1)
                                $popup.draggable();

                            $('.resizeWindow .resizeWidth input').val(canvas.width);
                            $('.resizeWindow .resizeHeight input').val(canvas.height);
                            var ratio = canvas.height / canvas.width;
                            if (canvas.width < canvas.height)
                                ratio = canvas.width / canvas.height;

                            $('.resizeWindow input').on('keypress', function (e) {
                                var theEvent = e || window.event;
                                var key = theEvent.keyCode || theEvent.which;
                                key = String.fromCharCode(key);
                                var regex = /[0-9]|\./;
                                if (!regex.test(key)) {
                                    theEvent.returnValue = false;
                                    if (theEvent.preventDefault) theEvent.preventDefault();
                                }
                            });

                            var w = canvas.width;
                            var h = canvas.height;
                            $('.resizeWindow input').on('keyup', function () {
                                var that = $(this);
                                if ($('.constrain').hasClass('active')) {
                                    if (w > h) {
                                        if (that.parent().hasClass('resizeWidth')) {
                                            $('.resizeHeight').find('input').val(that.val() * ratio);
                                        }
                                        else {
                                            $('.resizeWidth').find('input').val(that.val() / ratio);
                                        }
                                    }
                                    else {
                                        if (that.parent().hasClass('resizeWidth')) {
                                            $('.resizeHeight').find('input').val(that.val() / ratio);
                                        }
                                        else {
                                            $('.resizeWidth').find('input').val(that.val() * ratio);
                                        }
                                    }
                                }
                            });
                            $('.resizeWindow .constrain').on('click', function () {
                                var that = $(this);
                                if (that.hasClass('active')) {
                                    that.removeClass('active');
                                }
                                else {
                                    that.addClass('active');
                                    $('.resizeHeight').find('input').val($('.resizeWidth').find('input').val() * ratio);
                                }
                            });
                            $('.resizeWindow .sn-cancelButton').on('click', function () {
                                overlayManager.hideOverlay();
                            });
                            $('.resizeWindow .sn-saveButton').on('click', function () {
                                var newWidth = $('.resizeWindow .resizeWidth input').val();
                                var newHeight = $('.resizeWindow .resizeHeight input').val();

                                if (Math.abs(degrees) === 90 || Math.abs(degrees) === 270) {
                                    var a = newWidth;
                                    newWidth = newHeight;
                                    newHeight = a;
                                }

                                resize = true;
                                if (cropX === 0 && cropY === 0) {
                                    addCommand(degrees, cropX, cropY, newWidth, newHeight, cropWidth, cropHeight, 0, 0, horizontaliFlipped, verticaliFlipped, false, false, filter, newWidth, newHeight, true, cropped());
                                }
                                else {
                                    var ratioW = newWidth / canvas.width;
                                    var ratioH = newHeight / canvas.height;
                                    cropX = cropX * ratioW;
                                    cropY = cropY * ratioH;
                                    cropWidth = cropWidth * ratioW;
                                    cropHeight = cropHeight * ratioH;
                                    addCommand(degrees, cropX, cropY, newWidth, newHeight, cropWidth, cropHeight, 0, 0, horizontaliFlipped, verticaliFlipped, false, false, filter, resCanvas.width * ratioW, resCanvas.height * ratioH, true, cropped());
                                }
                                reDraw();
                                overlayManager.hideOverlay();
                            });
                        }
                    }
                }
                $toolbarButton.on('click', tool.click);
            }

            function addMenuItem(t) {
                if (t.template !== 'undefined' || t.template !== null) {
                    $topToolbar.append(t.template);
                }
                else {
                    $topToolbar.append('<span class="sn-icon sn-icon-' + t.name + '" title="' + t.title + '">' + t.title + '</span>');
                }
            }

            function createSubToolbar(temp, m) {
                $subToolbar = $('<div class="subtoolbar ' + m + '-subtoolbar"></div>').appendTo($container);
                $subToolbar.append(temp);
                $subToolbar.find('select').kendoDropDownList();
                if (m === 'crop') {
                    $subToolbar.find('select').on('change', function () {
                        var selected = $('#cropMode :selected').val();
                        cropMode = selected;
                        if (selected === '2') {
                            if (typeof $customRatioTools !== 'undefined') {
                                $customRatioTools.remove();
                            }
                            $customRatioTools = $('<div class="customRatioTools"><input type="number" id="ratioX" />x<input type="number" id="ratioY" /></div>').appendTo($subToolbar);
                            $('#ratioX, #ratioY').on('keypress', function (e) {
                                var theEvent = e || window.event;
                                var key = theEvent.keyCode || theEvent.which;
                                key = String.fromCharCode(key);
                                var regex = /[0-9]|\./;
                                if (!regex.test(key)) {
                                    theEvent.returnValue = false;
                                    if (theEvent.preventDefault) theEvent.preventDefault();
                                }
                            });
                            $('#ratioX, #ratioY').on('keyup', function (e) {
                                var ratio = parseInt($('#ratioX').val()) / parseInt($('#ratioY').val());
                                setRatio(ratio);
                            });
                        }
                        else if (selected === '1') {
                            if (typeof $customRatioTools !== 'undefined') {
                                $customRatioTools.remove();
                            }
                            var ratio = cropRatioX / cropRatioY;
                            setRatio(ratio);
                        }
                        else if (selected === '0') {
                            if (typeof $customRatioTools !== 'undefined') {
                                $customRatioTools.remove();
                            }
                            setRatio(0);
                        }
                    });
                    $subToolbar.find('.crop').on('click', function () {
                        if ($('.jcrop-tracker').length > 0) {
                            cropImage();
                            closeSubToolbar();
                            $('.sn-icon-crop').removeClass('active');
                        }
                    });
                    var toptool = $('.topToolbar').height() + $('.subtoolbar').height() + 10;
                }
                else {
                    var toptool = $('.topToolbar').height() + $('.subtoolbar').height() + 5;
                }
                $element.css({ 'top': toptool, 'height': $element.height() - 33 });
                setImagePosition(canvas.width, canvas.height);
            }

            function closeSubToolbar() {
                $subToolbar = $('.subtoolbar');
                $subToolbar.html('');
                $subToolbar.remove();
                $element.css({ 'top': $('.topToolbar').height(), 'height': $element.height() + 33 });
                setImagePosition(canvas.width, canvas.height);
            }

            function setRatio(r) {
                jcrop_api.setOptions({ aspectRatio: r });
            }

            function isLoaded(i) {

            }

            function saveImage() { }

            function isCanvasLoaded(i) {
                return ($('#imageEditorCanvas').length > 0);
            }

            function destroyPlugin() {
                closeSubToolbar();
                //$pluginSubject.empty();

                //for (var prop in dataObj) {
                //    delete dataObj[prop];
                //}
                //imageeditor = {};
                $(resCanvas).remove();
                $canvas.removeAttr('style');
                cropMode = 0;
                commands = [];
                selectedArea = {};
                rotating = false;
                degrees = 0;
                cropX = 0, cropY = 0;
                resize = false;
                commandIndex = -1;
                uploaddata = [];
                horizontaliFlipped = false;
                verticaliFlipped = false;
                scaleH = 1, scaleV = 1;
                constrained = false;
                actualStepNum = -1;
                filter = {
                    grayscale: {
                        isSet: false,
                        g: 0
                    },
                    sepia: {
                        isSet: false,
                        s: 0
                    },
                    color: {
                        isSet: false,
                        r: null,
                        g: null,
                        b: null
                    },
                    brighten: {
                        isSet: false,
                        b: null,
                        c: null
                    },
                    threshold: false,
                    boxBlur: false,
                    //gaussianBlur: false,
                    sharpen: false,
                    invert: false,
                    detectEdges: false,
                    emboss: false,
                    sobel: false
                }
                toolbarDockLeft = false, toolbarDockRight = false;
                brightness = 0, contrast = 100;
                sizeObj = {};
                //TODO: nullázni a nullázandókat
                $container.hide();
                //$pluginSubject.removeData('snImageEditor');
                //$pluginSubject = null;
            }

            function invalidate() {
                canvasValid = false;
            }

            function releaseCheck() {
                jcrop_api.setOptions({ allowSelect: true });
            };

            function destroyJCrop() {
                $canvas.appendTo($element);
                jcrop_api.destroy();
            }



            function isCanvasSupported() {
                var elem = document.createElement('canvas');
                return !!(elem.getContext && elem.getContext('2d'));
            }

            // Store an object with methods, attached to the element so that users of the plugin can manipulate it from the outside
            var dataObj = {
                // Sets the current zoom level of the editor.
                // Parameters: newLevel, x0, y0, $rel
                //setZoomLevel: setZoomLevel,

                // Destroys the current plugin instance
                destroy: destroyPlugin,

                // Scrolls the viewport horizontally
                //scrollViewportLeft: function (val) { $docpreview.scrollLeft(val); },

                // Scrolls the viewport vertically
                //scrollViewportTop: function (val) { $docpreview.scrollTop(val); },

                // Tells if there are unsaved changes for the current image
                //isUnsaved: function () { return unsaved; },

                // Sets unsaved property
                //setUnsaved: function (isUnsaved) { unsaved = isUnsaved; },

                // Tells if the editor is in fullscreen mode
                //isFullscreen: function () { return $container.parent().hasClass("sn-docpreview-fullscreen-wrapper"); },

                // Gets the current zoom level of the editor
                //zoomLevel: function () { return scale; },

                // Gets the container DOM element of the editor
                getContainer: function () { return $element.parent(); },

                // Gets the viewport element of the editor
                getCanvas: function () { return $canvas; },

                // Schedules a redraw for the editor
                scheduleRedraw: function () { invalidate(); },

                // Tells when all canvases of a preview page are loaded
                canvasIsLoaded: isCanvasLoaded,

                saveImage: saveImage

            };

            // Initialize the plugin when the document is ready
            $(initializeImageEditorPlugin);
            // Set the data object (this will serve as the public API)
            $pluginSubject.data('snImageEditor', dataObj);
            // Maintain jQuery chainability
            return $pluginSubject;

            //TODO: flip
            //TODO: gradient
            //TODO: text
            //TODO: shapes
            //TODO: color picker in to the color picker popup
            //TODO: merge filterTempCanvas and real canvas + filter stuff
            //TODO: resize, rotate, color check

            function getCanvasContext() {
                var mycanvas = document.getElementById("mycanvas");
                var canvas_context = null;
                var x, y = 0;

                if (mycanvas && mycanvas.getContext) {
                    canvas_context = mycanvas.getContext("2d");
                }
                else {
                    return false;
                }
                return canvas_context;
            }

            function downloadCanvas() {
                var link = document.createElement('a');
                link.href = canvas.toDataURL();
                link.download = 'image.' + fileType;
                //link.click();

                //var clickEvent = new MouseEvent("click", {
                //    "view": window,
                //    "bubbles": true,
                //    "cancelable": false
                //});

                //link.dispatchEvent(clickEvent)

                if (document.createEvent) {
                    var evt = document.createEvent('MouseEvents');
                    evt.initEvent('click', true, false);
                    link.dispatchEvent(evt);
                } else if (document.createEventObject) {
                    link.fireEvent('onclick');
                } else if (typeof link.onclick == 'function') {
                    link.onclick();
                }

            }

            function uploadCanvas() {
                var url = odata.dataRoot + odata.getItemUrl(targetPath) + '/Upload';
                var img_b64 = canvas.toDataURL("image/" + fileType);
                    var png = img_b64.split(',')[1];

                    var the_file = b64toBlob(png, "image/" + fileType);
                    the_file.name = imgName;
                    uploaddata[uploaddata.length - 1].files[0] = the_file;
                    if ((typeof uploadFunction) === "function") {
                        uploadFunction && uploadFunction(url, uploaddata, img_b64, imgName, fileType);
                    }
            }

            function b64toBlob(b64Data, contentType, sliceSize) {
                contentType = contentType || '';
                sliceSize = sliceSize || 512;

                var byteCharacters = atob(b64Data);
                var byteArrays = [];

                for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                    var slice = byteCharacters.slice(offset, offset + sliceSize);

                    var byteNumbers = new Array(slice.length);
                    for (var i = 0; i < slice.length; i++) {
                        byteNumbers[i] = slice.charCodeAt(i);
                    }

                    var byteArray = new Uint8Array(byteNumbers);

                    byteArrays.push(byteArray);
                }

                var blob = new Blob(byteArrays, { type: contentType });
                return blob;
            }

            function undo() {
                if (commandIndex > -1) {
                    commandIndex -= 1;
                    if (commandIndex > -1)
                        filter = commands[commandIndex].filtah;
                }
                if (!$('.sn-icon-undo').hasClass('disabled')) {
                    showLoader();
                    reDraw(commandIndex);
                    setImagePosition(canvas.width, canvas.height);
                }
            }

            function redo() {
                if (commandIndex < commands.length - 1 && !$('.sn-icon-redo').hasClass('disabled')) {
                    showLoader();
                    commandIndex += 1;
                    reDraw(commandIndex);
                    setImagePosition(canvas.width, canvas.height);
                }
            }

            function prepareCommandList() {
                if (commands.length === maxStepCount) {
                    var tempCommands = [];
                    for (var i = 0; i < commands.length; i++) {
                        if (i !== 0) {
                            tempCommands.push(commands[i]);
                        }
                    }
                    commands = [];
                    for (var j = 0; j < tempCommands.length; j++) {
                        commands.push(tempCommands[j]);
                    }
                }
                if (commandIndex < commands.length - 1 && commandIndex > -1) {
                    for (var j = commandIndex; j < commands.length; j++) {
                        commands.pop(commands[j]);
                    }
                }
                else if (commandIndex < commands.length && commandIndex === -1) {
                    commands = [];
                }
            }


            function openFilterSubmenu(t) {
                var filters = ['grayscale', 'sepia', 'color', 'brighten', 'threshold', 'boxBlur', /*'gaussianBlur'*/ 'sharpen', 'invert', 'detectEdges', 'emboss', 'sobel'];
                $filterSubmenu = $('<ul class="filterSubmenuList"></ul>');
                $tool = $('.sn-icon-filter');
                if (!$('.sn-icon-filter').hasClass('open')) {
                    $tool.append($filterSubmenu);
                    $.each(filters, function (i, item) {
                        $tool = $('<li class="sn-icon-tool-' + item + '" title="' + SN.Resources.ImageEditor[item] + '">' + SN.Resources.ImageEditor[item] + '</li>');
                        $filterSubmenu.append($tool);
                        $tool.click(function () {
                            $('.sn-icon').removeClass('active');
                            if (item === 'brighten') {
                                brightenPopup(item);
                            }
                            else if (item === 'sepia') {
                                sepiaPopup(item);
                            }
                            else if (item === 'grayscale') {
                                grayscalePopup(item);
                            }
                            else if (item === 'color') {
                                colorPopup(item);
                            }
                            else {
                                showLoader();
                                setTimeout(function () {
                                    addFilterStep(item);
                                }, 500);
                            }
                        });
                    });
                    $filterSubmenu.slideDown();
                    $('.sn-icon-filter').addClass('open');
                }
                else {
                    $filterSubmenu = $('.filterSubmenuList');
                    $filterSubmenu.slideUp(function () {
                        $filterSubmenu.remove();
                    });
                    $('.sn-icon-filter').removeClass('open');
                }
            }

            function brightenPopup(item) {
                createTempCanvas('filterCanvas');
                overlayManager.showOverlay({
                    title: SN.Resources.ImageEditor['brighten'],
                    text: brightessContrastWindowTemplate,
                    appendCloseButton: true,
                    overlayBg: false,
                    cssClass: 'brightnessContrastWindow'
                });

                $popup = $('.sn-popup');
                if (window.navigator.userAgent.indexOf('MSIE ') === -1 && window.navigator.userAgent.indexOf('Edge') === -1)
                    $popup.draggable();

                $("#sliderBrightness").kendoSlider({
                    orientation: "horizontal",
                    min: -100,
                    max: 100,
                    showButtons: false,
                    value: 0,
                    change: function (e) {
                        var contrastSlider = $("#sliderContrast").data("kendoSlider");
                        var sliderValue = contrastSlider.value();
                        brightnessAndContrast(e.value, sliderValue);
                    },
                    tickPlacement: "none"
                });

                $("#sliderContrast").kendoSlider({
                    orientation: "horizontal",
                    min: -100,
                    max: 500,
                    showButtons: false,
                    value: 0,
                    change: function (e) {
                        var brightnessSlider = $("#sliderBrightness").data("kendoSlider");
                        var sliderValue = brightnessSlider.value();
                        brightnessAndContrast(sliderValue, e.value);
                    },
                    tickPlacement: "none"
                });

                $popup.find('.sn-saveButton').on('click', function () {
                    var contrastSlider = $("#sliderContrast").data("kendoSlider");
                    var brightnessSlider = $("#sliderBrightness").data("kendoSlider");

                    filterObj = {};
                    filterObj.b = brightnessSlider.value();
                    filterObj.c = contrastSlider.value();


                    addFilterStep(item, filterObj);

                    removeTempCanvas('filterCanvas');
                    overlayManager.hideOverlay();
                });
                $popup.find('.sn-cancelButton, .close-overlay').on('click', function () {
                    if (typeof commands !== 'undefined' && commandIndex > -1)
                        reDraw(commands.length - 1);
                    else {
                        reDraw(-1);
                    }

                    removeTempCanvas('filterCanvas');
                    overlayManager.hideOverlay();
                });
            }

            function sepiaPopup(item) {
                createTempCanvas('filterCanvas');
                overlayManager.showOverlay({
                    title: SN.Resources.ImageEditor['sepia'],
                    text: sepiaWindowTemplate,
                    appendCloseButton: true,
                    overlayBg: false,
                    cssClass: 'sepiaWindow'
                });

                $popup = $('.sn-popup');
                if (window.navigator.userAgent.indexOf('MSIE ') === -1 && window.navigator.userAgent.indexOf('Edge') === -1)
                    $popup.draggable();

                $("#sliderSepia").kendoSlider({
                    orientation: "horizontal",
                    min: 0,
                    max: 100,
                    showButtons: false,
                    value: 0,
                    change: sepia,
                    tickPlacement: "none"
                });

                $popup.find('.sn-saveButton').on('click', function () {
                    var sepiaSlider = $("#sliderSepia").data("kendoSlider");

                    filterObj = {};
                    filterObj.s = sepiaSlider.value();


                    addFilterStep(item, filterObj);

                    removeTempCanvas('filterCanvas');
                    overlayManager.hideOverlay();
                });
                $popup.find('.sn-cancelButton, .close-overlay').on('click', function () {
                    if (typeof commands !== 'undefined' && commandIndex > -1)
                        reDraw(commands.length - 1);
                    else {
                        reDraw(-1);
                    }

                    removeTempCanvas('filterCanvas');
                    overlayManager.hideOverlay();
                });

            }

            function colorPopup(item) {
                createTempCanvas('filterCanvas');
                overlayManager.showOverlay({
                    title: SN.Resources.ImageEditor['color'],
                    text: colorWindowTemplate,
                    appendCloseButton: true,
                    overlayBg: false,
                    cssClass: 'colorWindow'
                });


                $popup = $('.sn-popup');

                if (window.navigator.userAgent.indexOf('MSIE ') === -1 && window.navigator.userAgent.indexOf('Edge') === -1)
                    $popup.draggable();

                $("#sliderRed").kendoSlider({
                    orientation: "horizontal",
                    min: -100,
                    max: 100,
                    showButtons: false,
                    value: 0,
                    change: function (e) {
                        var greenSlider = $("#sliderGreen").data("kendoSlider");
                        var greenValue = greenSlider.value();
                        var blueSlider = $("#sliderBlue").data("kendoSlider");
                        var blueValue = blueSlider.value();
                        colorChannels(e.value, greenValue, blueValue);
                    },
                    tickPlacement: "none"
                });

                $("#sliderGreen").kendoSlider({
                    orientation: "horizontal",
                    min: -100,
                    max: 100,
                    showButtons: false,
                    value: 0,
                    change: function (e) {
                        var redSlider = $("#sliderRed").data("kendoSlider");
                        var redValue = redSlider.value();
                        var blueSlider = $("#sliderBlue").data("kendoSlider");
                        var blueValue = blueSlider.value();
                        colorChannels(redValue, e.value, blueValue);
                    },
                    tickPlacement: "none"
                });

                $("#sliderBlue").kendoSlider({
                    orientation: "horizontal",
                    min: -100,
                    max: 100,
                    showButtons: false,
                    value: 0,
                    change: function (e) {
                        var redSlider = $("#sliderRed").data("kendoSlider");
                        var redValue = redSlider.value();
                        var greenSlider = $("#sliderGreen").data("kendoSlider");
                        var greenValue = greenSlider.value();
                        colorChannels(redValue, greenValue, e.value);
                    },
                    tickPlacement: "none"
                });

                $popup.find('.sn-saveButton').on('click', function () {
                    var redSlider = $("#sliderRed").data("kendoSlider");
                    var greenSlider = $("#sliderGreen").data("kendoSlider");
                    var blueSlider = $("#sliderBlue").data("kendoSlider");

                    filterObj = {};
                    filterObj.r = redSlider.value();
                    filterObj.g = greenSlider.value();
                    filterObj.b = blueSlider.value();


                    addFilterStep(item, filterObj);

                    removeTempCanvas('filterCanvas');
                    overlayManager.hideOverlay();
                });
                $popup.find('.sn-cancelButton, .close-overlay').on('click', function () {
                    if (typeof commands !== 'undefined' && commandIndex > -1)
                        reDraw(commands.length - 1);
                    else {
                        reDraw(-1);
                    }

                    removeTempCanvas('filterCanvas');
                    overlayManager.hideOverlay();
                });
            }

            function grayscalePopup(item) {
                createTempCanvas('filterCanvas');
                overlayManager.showOverlay({
                    title: SN.Resources.ImageEditor['grayscale'],
                    text: grayscaleWindowTemplate,
                    appendCloseButton: true,
                    overlayBg: false,
                    cssClass: 'grayscaleWindow'
                });

                $popup = $('.sn-popup');
                if (window.navigator.userAgent.indexOf('MSIE ') === -1 && window.navigator.userAgent.indexOf('Edge') === -1)
                    $popup.draggable();

                $("#sliderGrayscale").kendoSlider({
                    orientation: "horizontal",
                    min: 0,
                    max: 100,
                    showButtons: false,
                    value: 0,
                    change: grayscale,
                    tickPlacement: "none"
                });

                $popup.find('.sn-saveButton').on('click', function () {
                    var grayscaleSlider = $("#sliderGrayscale").data("kendoSlider");

                    filterObj = {};
                    filterObj.g = grayscaleSlider.value();
                    addFilterStep(item, filterObj);

                    removeTempCanvas('filterCanvas');
                    overlayManager.hideOverlay();
                });
                $popup.find('.sn-cancelButton, .close-overlay').on('click', function () {
                    if (typeof commands !== 'undefined' && commandIndex > -1)
                        reDraw(commands.length - 1);
                    else {
                        reDraw(-1);
                    }

                    removeTempCanvas('filterCanvas');
                    overlayManager.hideOverlay();
                });

            }

            function brightnessAndContrast(b, c) {
                imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
                var data = imageData.data;
                var h = imageData.height;
                var w = imageData.width;
                var length = data.length;
                for (var idx = 0; idx < length; idx += 4) {
                    data[idx] += b;
                    data[idx + 1] += b;
                    data[idx + 2] += b;
                    // data[idx + 3] stores the alpha channel
                }
                for (var i = 0; i < length; i += 4) {
                    var average = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
                    if (average > 127) {
                        data[i] += (data[i] / average) * c;
                        data[i + 1] += (data[i + 1] / average) * c;
                        data[i + 2] += (data[i + 2] / average) * c;
                    } else {
                        data[i] -= (data[i] / average) * c;
                        data[i + 1] -= (data[i + 1] / average) * c;
                        data[i + 2] -= (data[i + 2] / average) * c;
                    }
                    // data[idx + 3] stores the alpha channel
                }
                ctx.putImageData(imageData, 0, 0, 0, 0, w, h);
            }

            function sepia(e) {
                imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
                var data = imageData.data;
                var h = imageData.height;
                var w = imageData.width;
                var length = data.length;
                var t = e.value / 100;
                var i = imageData.data;
                var n = 1 - t;
                for (var r = 0; r < length; r += 4) {
                    var o = i[r];
                    var a = i[r + 1];
                    var s = i[r + 2];
                    i[r] = o * .393 + a * .769 + s * .189;
                    i[r + 1] = o * .349 + a * .686 + s * .168;
                    i[r + 2] = o * .272 + a * .534 + s * .131;
                    i[r + 3] = i[r + 3];
                    i[r] = t * i[r] + n * o;
                    i[r + 1] = t * i[r + 1] + n * a;
                    i[r + 2] = t * i[r + 2] + n * s;
                }
                ctx.putImageData(imageData, 0, 0, 0, 0, w, h);
            }

            function grayscale(e) {
                imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
                var data = imageData.data;
                var h = imageData.height;
                var w = imageData.width;
                var length = data.length;
                var t = e.value / 100;
                var i = data;
                var n = i.length / 4;
                var r = 1 - t;
                for (var o = 0; o < i.length; o += 4) {
                    var a = i[o];
                    var s = i[o + 1];
                    var l = i[o + 2];
                    var u = .3 * a + .59 * s + .11 * l;
                    i[o] = i[o + 1] = i[o + 2] = u;
                    i[o] = t * i[o] + r * a;
                    i[o + 1] = t * i[o + 1] + r * s;
                    i[o + 2] = t * i[o + 2] + r * l;
                }
                ctx.putImageData(imageData, 0, 0, 0, 0, w, h);
            }

            function colorChannels(r, g, b) {
                imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
                var data = imageData.data;
                var h = imageData.height;
                var w = imageData.width;
                var length = data.length;
                for (var idx = 0; idx < length; idx += 4) {
                    if (r < 0) {
                        r1 = data[idx] / (r / 10);
                    }
                    else {

                        r1 = data[idx] * (r / 10);
                    }
                    if (g < 0) {
                        g1 = data[idx + 1] / (g / 10);
                    }
                    else {
                        g1 = data[idx + 1] * (g / 10);
                    }

                    if (b < 0) {
                        b1 = data[idx + 2] * (b / 10);
                    }
                    else {
                        b1 = data[idx + 2] / (b / 10);
                    }

                    if (r !== 0) {
                        data[idx] = r1;
                    }
                    if (g !== 0) {
                        data[idx + 1] = g1;
                    }
                    if (b !== 0) {
                        data[idx + 2] = b1;
                    }
                }
                ctx.putImageData(imageData, 0, 0, 0, 0, w, h);

            }

            function addFilterStep(item, fObj) {

                var currentFilter = {};

                currentFilter.grayscale = {};
                currentFilter.grayscale.isSet = (item === 'grayscale' || filter.grayscale.isSet) ? true : false;
                if (filter.grayscale.g !== null) {
                    currentFilter.grayscale.g = filter.grayscale.g;
                }
                if (item === 'grayscale') {
                    currentFilter.grayscale.g = fObj.g;
                }

                currentFilter.sepia = {};
                currentFilter.sepia.isSet = (item === 'sepia' || filter.sepia.isSet) ? true : false;
                if (filter.sepia.s !== null) {
                    currentFilter.sepia.s = filter.sepia.s;
                }
                if (item === 'sepia') {
                    currentFilter.sepia.s = fObj.s;
                }

                currentFilter.brighten = {};
                currentFilter.brighten.isSet = (item === 'brighten' || filter.brighten.isSet) ? true : false;
                if (filter.brighten.b !== null) {
                    currentFilter.brighten.b = filter.brighten.b;
                }
                if (filter.brighten.c !== null) {
                    currentFilter.brighten.c = filter.brighten.c;
                }
                if (item === 'brighten') {
                    currentFilter.brighten.b = fObj.b;
                    currentFilter.brighten.c = fObj.c;
                }

                currentFilter.color = {};
                currentFilter.color.isSet = (item === 'color' || filter.color.isSet) ? true : false;
                if (filter.color.r !== null) {
                    currentFilter.color.r = filter.color.r;
                }
                if (filter.color.g !== null) {
                    currentFilter.color.g = filter.color.g;
                }
                if (filter.color.b !== null) {
                    currentFilter.color.b = filter.color.b;
                }
                if (item === 'color') {
                    currentFilter.color.r = fObj.r;
                    currentFilter.color.g = fObj.g;
                    currentFilter.color.b = fObj.b;
                }

                currentFilter.threshold = (item === 'threshold' || filter.threshold) ? true : false;
                currentFilter.boxBlur = (item === 'boxBlur' || filter.boxBlur) ? true : false;
                //currentFilter.gaussianBlur = (item === 'gaussianBlur' || filter.gaussianBlur) ? true : false;
                currentFilter.sharpen = (item === 'sharpen' || filter.sharpen) ? true : false;
                currentFilter.invert = (item === 'invert' || filter.invert) ? true : false;
                currentFilter.detectEdges = (item === 'detectEdges' || filter.detectEdges) ? true : false;
                currentFilter.emboss = (item === 'emboss' || filter.emboss) ? true : false;
                currentFilter.sobel = (item === 'sobel' || filter.sobel) ? true : false;

                filter = currentFilter;
                var width, height, reswidth, resheight;
                if (degrees === 90 || degrees === -90 || degrees === 270 || degrees === -270) {
                    width = canvas.height;
                    height = canvas.width;
                    //reswidth = resCanvas.height;
                    //resheight = resCanvas.width;
                }
                else {
                    width = canvas.width;
                    height = canvas.height;
                }

                reswidth = resCanvas.width;
                resheight = resCanvas.height;
                var rot = false, constr = false;
                if (commandIndex > -1 && commands[commandIndex].rot) {
                    rot = true;
                }
                if (commandIndex > -1 && commands[commandIndex].constr) {
                    constr = true;
                }
                addCommand(degrees, cropX, cropY, width, height, cropWidth, cropHeight, 0, 0, horizontaliFlipped, verticaliFlipped, rot, constr, currentFilter, reswidth, resheight, resize, cropped());
                reDraw();
            }

            function filterEnabled(f) {
                var isFilterable = false;
                $.each(f, function (key, value) {
                    if (value) {
                        isFilterable = true;
                        return;
                    }
                });
                return isFilterable;
            }

            function runFilter(id, filter, arg1, arg2, arg3) {
                var c = canvas;
                var idata = Filters.filterImage(filter, c, arg1, arg2, arg3);
                c.width = idata.width;
                c.height = idata.height;
                ctx.putImageData(idata, 0, 0);
            }

            function hasScrollBar(t) {
                return t.get(0).scrollHeight > t.height();
            }

            function scrollbarWidth() {
                var $inner = jQuery('<div style="width: 100%; height:200px;">test</div>'),
                    $outer = jQuery('<div style="width:200px;height:150px; position: absolute; top: 0; left: 0; visibility: hidden; overflow:hidden;"></div>').append($inner),
                    inner = $inner[0],
                    outer = $outer[0];

                jQuery('body').append(outer);
                var width1 = inner.offsetWidth;
                $outer.css('overflow', 'scroll');
                var width2 = outer.clientWidth;
                $outer.remove();

                return (width1 - width2);
            }

            function combineCanvases() {

            }

            function getMousePos(canvas, event) {
                var rect = canvas.getBoundingClientRect();
                return {
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top
                };
            }

            function componentToHex(c) {
                var hex = c.toString(16);
                return hex.length == 1 ? "0" + hex : hex;
            }

            function rgbToHex(r, g, b) {
                return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
            }

            function createTempCanvas(id) {
                var imageEditorContainer = document.getElementById('imageEditor');
                tempCanvas = document.createElement('canvas');
                tempCanvas.id = id;
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                imageEditorContainer.appendChild(tempCanvas);
                tempCtx = tempCanvas.getContext("2d");
                $(tempCanvas).hide();
                tempCtx.drawImage(canvas, 0, 0);
            }

            function removeTempCanvas(id) {
                var tempCanvas = document.getElementById(id);
                tempCanvas.parentNode.removeChild(tempCanvas);
            }

            function showLoader() {
                $loader.fadeIn();
            }

            function hideLoader() {
                $loader.fadeOut();
            }

            function doNotCrop() {
                destroyJCrop();
                closeSubToolbar();
                $('.sn-icon-crop').removeClass('active');
                overlayManager.hideOverlay();
            }

            function doCrop() {
                cropImage();
                closeSubToolbar();
                $('.sn-icon-crop').removeClass('active');
                overlayManager.hideOverlay();
            }

            function cancelCrop() {
                overlayManager.hideOverlay();
            }

            function reSizeImageAtOnload(w, h) {
                if (w > imgMaxWidth) {
                    h = (imgMaxWidth / w) * h;
                    w = imgMaxWidth;
                }
                if (h > imgMaxHeight) {
                    w = (imgMaxHeight / h) * w;
                    h = imgMaxHeight;
                }
                sizeObj.w = w;
                sizeObj.h = h;
                fWidth = w;
                fHeight = h;
            }

            $(document).on('keydown.Crop', function (e) {
                var evtobj = window.event ? event : e
                if (evtobj.keyCode == 90 && evtobj.ctrlKey && !$('.sn-icon-undo').hasClass('disabled')) {
                    if ($('.jcrop-tracker').length > 0) {
                        overlayManager.showOverlay({
                            text: $pleaseCropWindowTemplate
                        });

                        $('.overlay').find('.sn-button').on('click', function () {
                            var that = $(this);
                            if (that.hasClass('dontCrop')) {
                                doNotCrop();

                            }
                            else if (that.hasClass('doCrop')) {
                                doCrop();
                            }
                            else {
                                cancelCrop();
                            }
                        });
                    }
                    else {
                        undo();
                        if ($('.sn-icon-filter').hasClass('open')) {
                            $('.filterSubmenuList').slideUp();
                            $('.sn-icon-filter').removeClass('open');
                        }
                    }
                }

                if (evtobj.keyCode == 89 && evtobj.ctrlKey && !$('.sn-icon-redo').hasClass('disabled')) {
                    if ($('.jcrop-tracker').length > 0) {
                        overlayManager.showOverlay({
                            text: $pleaseCropWindowTemplate
                        });

                        $('.overlay').find('.sn-button').on('click', function () {
                            var that = $(this);
                            if (that.hasClass('dontCrop')) {
                                doNotCrop();

                            }
                            else if (that.hasClass('doCrop')) {
                                doCrop();
                            }
                            else {
                                cancelCrop();
                            }
                        });
                    }
                    else {
                        setTimeout(function () {
                            redo();
                            if ($('.sn-icon-filter').hasClass('open')) {
                                $('.filterSubmenuList').slideUp();
                                $('.sn-icon-filter').removeClass('open');
                            }
                        }, 500);
                    }
                }
            });
        }
    });
})(jQuery);