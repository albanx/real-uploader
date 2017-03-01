/**
 * @author Created by Alban on 12/07/2015.
 * @file ImageScale for Javascript with different quality
 * Derived from Pica Library, the fastest js library for image resize
 * https://github.com/nodeca/pica
 * Use of WebWorkers for performance
 * @version 1.0
 */
define(['Utils', 'ExifRestorer'], /** @lends ImageScale */ function (Utils, ExifRestorer) {
    /**
     * Pollyfill based on toDataURL
     * https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
     */
    if (!HTMLCanvasElement.prototype.toBlob) {
        Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
            value: function (callback, type, quality) {

                var binStr = atob(this.toDataURL(type, quality).split(',')[1]),
                    len = binStr.length,
                    arr = new Uint8Array(len);

                for (var i = 0; i < len; i++) {
                    arr[i] = binStr.charCodeAt(i);
                }

                callback(new Blob([arr], {type: type || 'image/jpeg'}));
            }
        });
    }

    /**
     * Image Scale class
     * @param {File} file The DOM file selected from a input or a drag and drop
     * @param {Object} options Options defining the scale properties
     * @param {Object} [options.maxWidth=0] Maximum  width for the resize, it will be scaled propotionally keeping aspect
     * ratio
     * @param {Object} [options.maxHeight=0] Maximum height for the resize, combined with the maxWidth the image will
     * keep aspect ratio
     * @param {Object} [options.allowOverResize=false] If true the scale will be scaled over it's original sizes
     * @param {Object} [options.outputFormat=false] Output format of the scaled image, can be either jpg or png
     * @param {Object} [options.outputQuality=1] Output quality of the resized image
     * @constructor
     * @example <caption>Example usage of the class.</caption>
     *  var scale = new ImageScale(file, options);
     *  scale.done(function (result) {
     *      console.log('resized image', result);
     *  }).progress(function (percent) {
     *       console.log('resizing image', percent);
     *  });
     *  scale.start(); //start the scale
     */
    var ImageScale = function (file, options) {
        var me = this;

        //default options
        me.options = {
            maxWidth: 0,
            maxHeight: 0,
            allowOverResize: false,
            outputFormat: false,
            outputQuality: 1,
            scaleMethod: 3,
            keepExif: false,
            keepAspectRatio: true,
            unsharpAmount: 0,
            unsharpThreshold: 0,
            alpha: true
        };

        //extend default options
        if (options !== null && typeof options === 'object') {
            for (var prop in options) {
                if (options.hasOwnProperty(prop)) {
                    me.options[prop] = options[prop];
                }
            }
        }

        //create a html5 WebWorker
        me.file = file;
        me.fileExt = file.name.split('.').pop().toLowerCase();

        //create the queue stacks callbacks
        //this is a standard way to make some plugins
        me._done = [];
        me._error = [];
        me._always = [];
        me._progress = [];
    };

    /**
     * Public functions
     * @type {{done: Function, progress: Function, error: Function, always: Function, _addCallback: Function, _runStack: Function, start: Function, stop: Function, _validateOptions: Function, _readImage: Function, _onProgressRead: Function, _onDoneRead: Function, _scale: Function, _createCanvas: Function, _startScale: Function, _onMessageScale: Function, _onErrorRead: Function, _onErrorImageLoad: Function, _onErrorScale: Function, _onError: Function}}
     */
    ImageScale.prototype = {
        /**
         * Adds callbacks function that will be run on the end of the resize
         * @param {Function} callback The callback function
         * @param {Object} ctx Scope under which to run the callback function
         * @returns {*}
         */
        done: function (callback, ctx) {
            return this._addCallback(callback, ctx, 'done');
        },
        /**
         * Adds callbacks function that will be run during the resize
         * The progress function will run 100 times, 1 for each percent
         * @param {Function} callback The callback function
         * @param {Object} ctx Scope under which to run the callback function
         * @returns {*}
         */
        progress: function (callback, ctx) {
            return this._addCallback(callback, ctx, 'progress');
        },
        /**
         * Adds callbacks function that will be run if there is any error
         * @param {Function} callback The callback function
         * @param {Context} ctx Scope under which to run the callback function
         * @returns {*}
         */
        error: function (callback, ctx) {
            return this._addCallback(callback, ctx, 'error');
        },
        /**
         * Callbacks added to this queue will be run always at the end of the resize even it returns error
         * @param {Function} callback The callback function
         * @param {Context} ctx Scope under which to run the callback function
         * @returns {*}
         */
        always: function (callback, ctx) {
            return this._addCallback(callback, ctx, 'always');
        },
        /**
         * Private function that adds the callback function to the queue
         * @param {Function} callback The callback function
         * @param {Context} ctx scope under which to run the callback function
         * @param {String} queue Queue containing the callback
         * @returns {ImageScale}
         * @private
         */
        _addCallback: function (callback, ctx, queue) {
            if (typeof callback == 'function') this['_' + queue].push({callback: callback, ctx: ctx});
            return this;
        },
        _runStack: function (stack, params) {
            var i = 0, max = stack.length;
            for (i = 0; i < max; i++) {
                stack[i].callback.apply(stack[i].ctx, params);
            }
            return this;
        },
        start: function () {
            if (this._validateOptions()) {
                return this._readImageFile();
            }
            return this._onError('Settings not valid', null);
        },
        stop: function () {
            if (this.worker) {
                this.worker.terminate();
            }
        },
        //private methods
        _validateOptions: function () {
            var options = this.options;
            //has valid size number && has at least one of the dimensions set && is a valid blob or file
            return ( !isNaN(options.maxWidth) || !isNaN(options.maxHeight) ) &&
                (options.maxWidth > 0 || options.maxHeight > 0) &&
                ( this.file.toString() === '[object File]' || this.file.toString() === '[object Blob]');
        },
        /**
         * Read the file to a binary or base64 string for canvas
         * @returns {ImageScale}
         * @private
         */
        _readImageFile: function () {
            var URL = window.URL || window.webkitURL;
            if (URL && URL.createObjectURL) {
                this._onDoneRead({
                    target: {
                        result: URL.createObjectURL(this.file)
                    },
                    callback: function () {
                        URL.revokeObjectURL(this.file) //this will free some memory
                    }
                });
            } else {
                var reader = new FileReader();
                reader.onprogress = this._onProgressRead.bind(this);
                reader.onerror = this._onErrorRead.bind(this);
                reader.onload = this._onDoneRead.bind(this);
                reader.readAsDataURL(this.file);
            }
            return this;
        },
        /**
         * Function handler for the progress event for the read function
         * @param e Event read file event
         * @private
         */
        _onProgressRead: function (e) {
            var progress = Math.round(e.loaded * 100 / e.total);
            this._runStack(this._progress, [progress, 'Reading file', e]);
        },
        /**
         * Called when file has been read
         * @param event
         * @private
         */
        _onDoneRead: function (event) {
            var img = new Image();
            var me = this;
            img.onload = function () {
                me._scale(this);
                if (event.callback) {
                    event.callback();
                }
            };
            img.onerror = me._onErrorImageLoad.bind(me);
            img.src = event.target.result;
        },
        /**
         * Helper function to create a canvas element
         * @param width
         * @param height
         * @returns {Element}
         * @private
         */
        _createCanvas: function (width, height) {
            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.setAttribute('width', width);
            canvas.setAttribute('height', height);
            return canvas;
        },
        _scale: function (img) {
            //calculate the correct ratio for resize
            var me = this;
            var width = img.width;
            var height = img.height;
            var maxWidth = me.options.maxWidth;
            var maxHeight = me.options.maxHeight;
            var overResize = me.options.overResize;
            var newWidth = 0;
            var newHeight = 0;

            if (me.options.keepAspectRatio) {
                //calculate the correct fit ratio
                var r1 = maxWidth / width;
                var r2 = maxHeight / height;
                var ratio = 0;
                if (r1 > 0 && r2 > 0) {
                    ratio = Math.min(r1, r2);
                } else if (r1 > 0) {
                    ratio = r1;
                } else if (r2 > 0) {
                    ratio = r2;
                }

                //calculate scale to fit in the given sizes
                newWidth = Math.round(width * ratio);
                newHeight = Math.round(height * ratio);
            } else {
                newWidth = maxWidth;
                newHeight = maxHeight;
            }

            //avoid resizing image over the real size
            if (!overResize && (newWidth > img.width || newHeight > img.height)) {
                Utils.log('This image will not be resized');
                this._onError('Resize image is bigger than original. AllowResize option disabled.', null);
            } else {
                Utils.log('New image sizes: ', newWidth, newHeight);
                var srcCanvas = me._createCanvas(width, height);
                var srcCtx = srcCanvas.getContext('2d');
                srcCtx.drawImage(img, 0, 0, width, height);
                var srcData = srcCtx.getImageData(0, 0, width, height).data;
                var opts = {
                    width: width,
                    height: height,
                    newWidth: newWidth,
                    newHeight: newHeight,
                    ratio: ratio,
                    quality: 3,
                    srcData: srcData,
                    scaleMethod: me.options.scaleMethod,
                    unsharpThreshold: me.options.unsharpThreshold,
                    unsharpAmount: me.options.unsharpAmount,
                    alpha: me.options.alpha
                };
                this.worker = this._startScale(img, opts);
            }

            img = null;
            return this;
        },

        _startScale: function (img, opts) {
            //get the worker
            var worker = Utils.runInBackground(resize);
            if (worker) {
                worker.onmessage = this._onMessageScale.bind(this);
                worker.onerror = this._onErrorScale.bind(this);
                worker.postMessage(opts);
                img = null;
                return worker;
            }
            return null;
        },
        _onMessageScale: function (event) {
            var a = event.data;
            var me = this;
            if (a.status == 'progress') {
                me._runStack(me._progress, [a.progress, 'Scale progress']);
            } else if (a.status == 'end') {
                me._runStack(me._progress, [a.progress, 'Saving...']);

                //setting format and quality
                var format = me.options.outputFormat;
                var quality = me.options.outputQuality;
                var output = me.fileExt == 'png' ? 'image/png' : 'image/jpeg';
                //if format is forced by the user then change the file name
                if (format) {
                    output = format == 'png' ? 'image/png' : 'image/jpeg';
                }

                //saving to file/blob
                var dstCanvas = me._createCanvas(a.newWidth, a.newHeight);
                var dstCtx = dstCanvas.getContext('2d');
                var dstImageData = dstCtx.getImageData(0, 0, a.newWidth, a.newHeight);
                var dstData = dstImageData.data;
                // IE ImageData can return old-style CanvasPixelArray
                // without .set() method. Copy manually for such case.
                if (dstData.set) {
                    dstData.set(a.imageData);
                } else {
                    var i, l;
                    for (i = 0, l = a.imageData.length; i < l; i++) {
                        dstData[i] = a.imageData[i];
                    }
                }
                dstCanvas.getContext('2d').putImageData(dstImageData, 0, 0);

                //convert to blob and call the callbacks
                dstCanvas.toBlob(function (blob) {

                    //check if we want to keep the Exif
                    if (me.options.keepExif) {
                        var exifCopy = new ExifRestorer();
                        exifCopy.onComplete = function (blobWithExif) {
                            //run the callbacks binding
                            me._runStack(me._done, [blobWithExif, event])._runStack(me._always, [blobWithExif, event]);
                        };
                        exifCopy.restore(me.file, blob);
                    } else {
                        me._runStack(me._done, [blob, event])._runStack(me._always, [blob, event]);
                    }

                    //remove reference
                    me._dstCanvas = null;
                }, output, quality);
            }
        },
        _onErrorRead: function (e) {
            return this._onError('File read error', e);
        },
        _onErrorImageLoad: function (e) {
            return this._onError('Image scale error', e);
        },
        _onErrorScale: function (event) {
            return this._onError('Scale error', event);
        },
        _onError: function (msg, event) {
            return this._runStack(this._error, [msg, event])._runStack(this._always, [event]);
        }
    };


    /**
     * Resize function that is handle by a webworker
     * @param options
     */
    function resize(options) {

        function clampTo8(i) {
            return i < 0 ? 0 : (i > 255 ? 255 : i);
        }

        // Convert image to greyscale, 16bits FP result (8.8)
        //
        function greyscale(src, srcW, srcH) {
            var size = srcW * srcH;
            var result = new Uint16Array(size); // We don't use sign, but that helps to JIT
            var i, srcPtr;

            for (i = 0, srcPtr = 0; i < size; i++) {
                result[i] = (src[srcPtr + 2] * 7471       // blue
                    + src[srcPtr + 1] * 38470      // green
                    + src[srcPtr] * 19595) >>> 8;  // red
                srcPtr = (srcPtr + 4) | 0;
            }

            return result;
        }


        // Apply unsharp mask to src
        //
        // NOTE: radius is ignored to simplify gaussian blur calculation
        // on practice we need radius 0.3..2.0. Use 1.0 now.
        //
        function unsharp(src, srcW, srcH, amount, radius, threshold) {
            var x, y, c, diff = 0, corr, srcPtr;

            // Normalized delta multiplier. Expect that:
            var AMOUNT_NORM = Math.floor(amount * 256 / 50);

            // Convert to grayscale:
            //
            // - prevent color drift
            // - speedup blur calc
            //
            var gs = greyscale(src, srcW, srcH);
            var blured = blur(gs, srcW, srcH, 1);
            var fpThreshold = threshold << 8;
            var gsPtr = 0;

            for (y = 0; y < srcH; y++) {
                for (x = 0; x < srcW; x++) {

                    // calculate brightness blur, difference & update source buffer

                    diff = gs[gsPtr] - blured[gsPtr];

                    // Update source image if thresold exceeded
                    if (Math.abs(diff) > fpThreshold) {
                        // Calculate correction multiplier
                        corr = 65536 + ((diff * AMOUNT_NORM) >> 8);
                        srcPtr = gsPtr * 4;

                        c = src[srcPtr];
                        src[srcPtr++] = clampTo8((c * corr) >> 16);
                        c = src[srcPtr];
                        src[srcPtr++] = clampTo8((c * corr) >> 16);
                        c = src[srcPtr];
                        src[srcPtr] = clampTo8((c * corr) >> 16);
                    }

                    gsPtr++;

                } // end row
            } // end column
        }


        /***
         * Blur Functions
         * @type {Uint8Array}
         * @private
         */
        var _blurKernel = new Uint8Array([
            1, 2, 1,
            2, 4, 2,
            1, 2, 1
        ]);
        var _bkHalf = Math.floor(Math.floor(Math.sqrt(_blurKernel.length)) / 2);
        var _bkWsum = 0;
        for (var wc = 0; wc < _blurKernel.length; wc++) {
            _bkWsum += _blurKernel[wc];
        }

        function blurPoint(gs, x, y, srcW, srcH) {
            var bx, by, sx, sy, w, wsum, br;
            var bPtr = 0;
            var blurKernel = _blurKernel;
            var bkHalf = _bkHalf;

            wsum = 0; // weight sum to normalize result
            br = 0;

            if (x >= bkHalf && y >= bkHalf && x + bkHalf < srcW && y + bkHalf < srcH) {
                for (by = 0; by < 3; by++) {
                    for (bx = 0; bx < 3; bx++) {
                        sx = x + bx - bkHalf;
                        sy = y + by - bkHalf;

                        br += gs[sx + sy * srcW] * blurKernel[bPtr++];
                    }
                }
                return (br - (br % _bkWsum)) / _bkWsum;
            }

            for (by = 0; by < 3; by++) {
                for (bx = 0; bx < 3; bx++) {
                    sx = x + bx - bkHalf;
                    sy = y + by - bkHalf;

                    if (sx >= 0 && sx < srcW && sy >= 0 && sy < srcH) {
                        w = blurKernel[bPtr];
                        wsum += w;
                        br += gs[sx + sy * srcW] * w;
                    }
                    bPtr++;
                }
            }
            return ((br - (br % wsum)) / wsum) | 0;
        }

        function blur(src, srcW, srcH/*, radius*/) {
            var x, y,
                output = new Uint16Array(src.length);

            for (x = 0; x < srcW; x++) {
                for (y = 0; y < srcH; y++) {
                    output[y * srcW + x] = blurPoint(src, x, y, srcW, srcH);
                }
            }

            return output;
        }

        // Precision of fixed FP values
        var FIXED_FRAC_BITS = 14;
        var FIXED_FRAC_VAL = 1 << FIXED_FRAC_BITS;

        function toFixedPoint(num) {
            return Math.floor(num * FIXED_FRAC_VAL);
        }


        // Calculate convolution filters for each destination point,
        // and pack data to Int16Array:
        //
        // [ shift, length, data..., shift2, length2, data..., ... ]
        //
        // - shift - offset in src image
        // - length - filter length (in src points)
        // - data - filter values sequence
        //
        //
        // Presets for quality 0..3. Filter functions + window size
        //
        var FILTER_INFO = [
            { // Nearest neibor (Box)
                win: 0.5,
                filter: function (x) {
                    return (x >= -0.5 && x < 0.5) ? 1.0 : 0.0;
                }
            },
            { // Hamming
                win: 1.0,
                filter: function (x) {
                    if (x <= -1.0 || x >= 1.0) {
                        return 0.0;
                    }
                    if (x > -1.19209290E-07 && x < 1.19209290E-07) {
                        return 1.0;
                    }
                    var xpi = x * Math.PI;
                    return ((Math.sin(xpi) / xpi) * (0.54 + 0.46 * Math.cos(xpi / 1.0)));
                }
            },
            { // Lanczos, win = 2
                win: 2.0,
                filter: function (x) {
                    if (x <= -2.0 || x >= 2.0) {
                        return 0.0;
                    }
                    if (x > -1.19209290E-07 && x < 1.19209290E-07) {
                        return 1.0;
                    }
                    var xpi = x * Math.PI;
                    return (Math.sin(xpi) / xpi) * Math.sin(xpi / 2.0) / (xpi / 2.0);
                }
            },
            { // Lanczos, win = 3
                win: 3.0,
                filter: function (x) {
                    if (x <= -3.0 || x >= 3.0) {
                        return 0.0;
                    }
                    if (x > -1.19209290E-07 && x < 1.19209290E-07) {
                        return 1.0;
                    }
                    var xpi = x * Math.PI;
                    return (Math.sin(xpi) / xpi) * Math.sin(xpi / 3.0) / (xpi / 3.0);
                }
            }
        ];

        function createFilters(quality, srcSize, destSize) {

            if (isNaN(quality)) quality = 3;
            var filterFunction = FILTER_INFO[quality].filter;

            var scale = destSize / srcSize;
            var scaleInverted = 1.0 / scale;
            var scaleClamped = Math.min(1.0, scale); // For upscale

            // Filter window (averaging interval), scaled to src image
            var srcWindow = FILTER_INFO[quality].win / scaleClamped;

            var destPixel, srcPixel, srcFirst, srcLast, filterElementSize,
                floatFilter, fxpFilter, total, fixedTotal, pxl, idx, floatVal, fixedVal;
            var leftNotEmpty, rightNotEmpty, filterShift, filterSize;

            var maxFilterElementSize = Math.floor((srcWindow + 1) * 2);
            var packedFilter = new Int16Array((maxFilterElementSize + 2) * destSize);
            var packedFilterPtr = 0;


            // For each destination pixel calculate source range and built filter values
            for (destPixel = 0; destPixel < destSize; destPixel++) {

                // Scaling should be done relative to central pixel point
                srcPixel = (destPixel + 0.5) * scaleInverted;

                srcFirst = Math.max(0, Math.floor(srcPixel - srcWindow));
                srcLast = Math.min(srcSize - 1, Math.ceil(srcPixel + srcWindow));

                filterElementSize = srcLast - srcFirst + 1;
                floatFilter = new Float32Array(filterElementSize);
                fxpFilter = new Int16Array(filterElementSize);

                total = 0.0;

                // Fill filter values for calculated range
                for (pxl = srcFirst, idx = 0; pxl <= srcLast; pxl++, idx++) {
                    floatVal = filterFunction(((pxl + 0.5) - srcPixel) * scaleClamped);
                    total += floatVal;
                    floatFilter[idx] = floatVal;
                }

                // Normalize filter, convert to fixed point and accumulate conversion error
                fixedTotal = 0;

                for (idx = 0; idx < floatFilter.length; idx++) {
                    fixedVal = toFixedPoint(floatFilter[idx] / total);
                    fixedTotal += fixedVal;
                    fxpFilter[idx] = fixedVal;
                }

                // Compensate normalization error, to minimize brightness drift
                fxpFilter[destSize >> 1] += toFixedPoint(1.0) - fixedTotal;

                //
                // Now pack filter to useable form
                //
                // 1. Trim heading and tailing zero values, and compensate shitf/length
                // 2. Put all to single array in this format:
                //
                //    [ pos shift, data length, value1, value2, value3, ... ]
                //

                leftNotEmpty = 0;
                while (leftNotEmpty < fxpFilter.length && fxpFilter[leftNotEmpty] === 0) {
                    leftNotEmpty++;
                }

                if (leftNotEmpty < fxpFilter.length) {
                    rightNotEmpty = fxpFilter.length - 1;
                    while (rightNotEmpty > 0 && fxpFilter[rightNotEmpty] === 0) {
                        rightNotEmpty--;
                    }

                    filterShift = srcFirst + leftNotEmpty;
                    filterSize = rightNotEmpty - leftNotEmpty + 1;

                    packedFilter[packedFilterPtr++] = filterShift; // shift
                    packedFilter[packedFilterPtr++] = filterSize; // size

                    packedFilter.set(fxpFilter.subarray(leftNotEmpty, rightNotEmpty + 1), packedFilterPtr);
                    packedFilterPtr += filterSize;
                } else {
                    // zero data, write header only
                    packedFilter[packedFilterPtr++] = 0; // shift
                    packedFilter[packedFilterPtr++] = 0; // size
                }
            }
            return packedFilter;
        }

        // Convolve image in horizontal directions and transpose output. In theory,
        // transpose allow:
        //
        // - use the same convolver for both passes (this fails due different
        //   types of input array and temporary buffer)
        // - making vertical pass by horisonltal lines inprove CPU cache use.
        //
        // But in real life this doesn't work :)
        //
        function convolveHorizontally(src, dest, srcW, srcH, destW, filters) {

            var r, g, b, a;
            var filterPtr, filterShift, filterSize;
            var srcPtr, srcY, destX, filterVal;
            var srcOffset = 0, destOffset = 0;

            // For each row
            for (srcY = 0; srcY < srcH; srcY++) {
                filterPtr = 0;

                // Apply precomputed filters to each destination row point
                for (destX = 0; destX < destW; destX++) {
                    // Get the filter that determines the current output pixel.
                    filterShift = filters[filterPtr++];
                    filterSize = filters[filterPtr++];

                    srcPtr = (srcOffset + (filterShift * 4)) | 0;

                    r = g = b = a = 0;

                    // Apply the filter to the row to get the destination pixel r, g, b, a
                    for (; filterSize > 0; filterSize--) {
                        filterVal = filters[filterPtr++];

                        // Use reverse order to workaround deopts in old v8 (node v.10)
                        // Big thanks to @mraleph (Vyacheslav Egorov) for the tip.
                        a = (a + filterVal * src[srcPtr + 3]) | 0;
                        b = (b + filterVal * src[srcPtr + 2]) | 0;
                        g = (g + filterVal * src[srcPtr + 1]) | 0;
                        r = (r + filterVal * src[srcPtr]) | 0;
                        srcPtr = (srcPtr + 4) | 0;
                    }

                    // Bring this value back in range. All of the filter scaling factors
                    // are in fixed point with FIXED_FRAC_BITS bits of fractional part.
                    dest[destOffset + 3] = clampTo8(a >> FIXED_FRAC_BITS);
                    dest[destOffset + 2] = clampTo8(b >> FIXED_FRAC_BITS);
                    dest[destOffset + 1] = clampTo8(g >> FIXED_FRAC_BITS);
                    dest[destOffset] = clampTo8(r >> FIXED_FRAC_BITS);
                    destOffset = (destOffset + srcH * 4) | 0;
                }

                destOffset = ((srcY + 1) * 4) | 0;
                srcOffset = ((srcY + 1) * srcW * 4) | 0;
            }
        }

        // Technically, convolvers are the same. But input array and temporary
        // buffer can be of different type (especially, in old browsers). So,
        // keep code in separate functions to avoid deoptimizations & speed loss.

        function convolveVertically(src, dest, srcW, srcH, destW, filters) {

            var r, g, b, a;
            var filterPtr, filterShift, filterSize;
            var srcPtr, srcY, destX, filterVal;
            var srcOffset = 0, destOffset = 0;

            // For each row
            for (srcY = 0; srcY < srcH; srcY++) {
                filterPtr = 0;

                // Apply precomputed filters to each destination row point
                for (destX = 0; destX < destW; destX++) {
                    // Get the filter that determines the current output pixel.
                    filterShift = filters[filterPtr++];
                    filterSize = filters[filterPtr++];

                    srcPtr = (srcOffset + (filterShift * 4)) | 0;

                    r = g = b = a = 0;

                    // Apply the filter to the row to get the destination pixel r, g, b, a
                    for (; filterSize > 0; filterSize--) {
                        filterVal = filters[filterPtr++];

                        // Use reverse order to workaround deopts in old v8 (node v.10)
                        // Big thanks to @mraleph (Vyacheslav Egorov) for the tip.
                        a = (a + filterVal * src[srcPtr + 3]) | 0;
                        b = (b + filterVal * src[srcPtr + 2]) | 0;
                        g = (g + filterVal * src[srcPtr + 1]) | 0;
                        r = (r + filterVal * src[srcPtr]) | 0;
                        srcPtr = (srcPtr + 4) | 0;
                    }

                    // Bring this value back in range. All of the filter scaling factors
                    // are in fixed point with FIXED_FRAC_BITS bits of fractional part.
                    dest[destOffset + 3] = clampTo8(a >> FIXED_FRAC_BITS);
                    dest[destOffset + 2] = clampTo8(b >> FIXED_FRAC_BITS);
                    dest[destOffset + 1] = clampTo8(g >> FIXED_FRAC_BITS);
                    dest[destOffset] = clampTo8(r >> FIXED_FRAC_BITS);
                    destOffset = (destOffset + srcH * 4) | 0;
                }

                destOffset = ((srcY + 1) * 4) | 0;
                srcOffset = ((srcY + 1) * srcW * 4) | 0;
            }
        }


        function resetAlpha(dst, width, height) {
            var ptr = 3, len = (width * height * 4) | 0;
            while (ptr < len) {
                dst[ptr] = 0xFF;
                ptr = (ptr + 4) | 0;
            }
        }

        function doScale(options) {
            postMessage({status: "progress", progress: 0});
            var src = options.srcData;
            var srcW = options.width;
            var srcH = options.height;
            var destW = Math.round(options.newWidth);
            var destH = Math.round(options.newHeight);
            var dest = new Uint8Array(destW * destH * 4);
            var quality = !options.scaleMethod ? 3 : options.scaleMethod;
            var alpha = options.alpha || false;
            var unsharpAmount = options.unsharpAmount === undefined ? 0 : (options.unsharpAmount | 0);
            var unsharpThreshold = options.unsharpThreshold === undefined ? 0 : (options.unsharpThreshold | 0);

            if (srcW < 1 || srcH < 1 || destW < 1 || destH < 1) {
                return false;
            }
            postMessage({status: "progress", progress: 10});

            var filtersX = createFilters(quality, srcW, destW);
            postMessage({status: "progress", progress: 20});

            var filtersY = createFilters(quality, srcH, destH);
            postMessage({status: "progress", progress: 30});

            var tmp = new Uint8Array(destW * srcH * 4);
            // To use single function we need src & tmp of the same type.
            // But src can be CanvasPixelArray, and tmp - Uint8Array. So, keep
            // vertical and horizontal passes separately to avoid deoptimization.


            convolveHorizontally(src, tmp, srcW, srcH, destW, filtersX);
            postMessage({status: "progress", progress: 50});

            convolveVertically(tmp, dest, srcH, destW, destH, filtersY);
            postMessage({status: "progress", progress: 70});
            // That's faster than doing checks in convolver.
            // !!! Note, canvas data is not premultipled. We don't need other
            // alpha corrections.

            if (!alpha) {
                resetAlpha(dest, destW, destH);
                postMessage({status: "progress", progress: 80});
            }

            if (unsharpAmount) {
                unsharp(dest, destW, destH, unsharpAmount, 1.0, unsharpThreshold);
                postMessage({status: "progress", progress: 90});
            }

            postMessage({status: "progress", progress: 100});
            return dest;
        }


        //start the scale
        var result = doScale(options);
        postMessage({
            status: "end",
            imageData: result,
            progress: 0,
            newWidth: options.newWidth,
            newHeight: options.newHeight
        });
    }

    return ImageScale;
});