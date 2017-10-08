/**
 * @file File md5 calculation in javascript
 * @author Alban Xhaferllari <albanx@gmail.com>
 * @version 1.0
 * @copyleft
 */
define(['Utils'], /** @lends FileMd5 */ function (Utils) {

    /**
     * File md5 calculation in javascript, uses webworker
     * @param {File} file The file object
     * @constructor
     * @example:
     * var md5Calc = new FileMd5(file);
     * md5Calc.done(function(result){
     *     console.log(result);
     * });
     * md5Calc.start();
     */
    var FileMd5 = function (file) {
        var me = this;

        //event listener of onMessage
        var onMessage = function (event) {
            var a = event.data;
            if (a.status === 'progress') {
                me._runStack(me._progress, [a.progress]);
            } else if (a.status === "end") {
                me._runStack(me._done, [a.result])._runStack(me._always, [event]);
                me.md5Worker.terminate();
            }
        };

        var onError = function (event) {
            me._runStack(me._error, [event])._runStack(me._always, [event]);
            me.md5Worker.terminate();
        };
        //end private functions

        //create the queue stacks callbacks
        this._done = [];
        this._error = [];
        this._always = [];
        this._progress = [];

        try {
            //create a html5 WebWorker
            this.md5Worker = Utils.runInBackground(md5Function);//TODO integrate here
            this.md5Worker.onmessage = onMessage;
            this.md5Worker.onerror = onError;
            this.file = file;
        } catch (exp) {
            me._runStack(me._error, [exp])._runStack(me._always, [exp]);
        }
    };

    //public functions
    FileMd5.prototype = {
        done: function (callback, ctx) {
            return this._addCallback(callback, ctx, 'done');
        },
        progress: function (callback, ctx) {
            return this._addCallback(callback, ctx, 'progress');
        },
        error: function (callback, ctx) {
            return this._addCallback(callback, ctx, 'error');
        },
        always: function (callback, ctx) {
            return this._addCallback(callback, ctx, 'always');
        },
        _addCallback: function (callback, ctx, queue) {
            if (typeof callback === 'function') this['_' + queue].push({callback: callback, ctx: ctx});
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
            this._startTime = new Date();
            this.md5Worker.postMessage({file: this.file});
            return this;
        },
        stop: function () {
            this.md5Worker.terminate();
        }
    };

    /**
     * this function is executed in a WebWorker
     * @param data
     */
    function md5Function(data) {
        self.percent = 1;
        var e = self.Crypto = {}, g = e.util = {
            rotl: function (a, b) {
                return a << b | a >>> 32 - b
            },
            rotr: function (a, b) {
                return a << 32 - b | a >>> b
            },
            endian: function (a) {
                if (a.constructor == Number) return g.rotl(a, 8) & 16711935 | g.rotl(a, 24) & 4278255360;
                for (var b = 0; b < a.length; b++) a[b] = g.endian(a[b]);
                return a
            },
            randomBytes: function (a) {
                for (var b = []; a > 0; a--) b.push(Math.floor(Math.random() * 256));
                return b
            },
            bytesToWords: function (a) {
                for (var b = [], c = 0, d = 0; c < a.length; c++, d += 8) b[d >>> 5] |= (a[c] & 255) <<
                    24 - d % 32;
                return b
            },
            wordsToBytes: function (a) {
                for (var b = [], c = 0; c < a.length * 32; c += 8) b.push(a[c >>> 5] >>> 24 - c % 32 & 255);
                return b
            },
            bytesToHex: function (a) {
                for (var b = [], c = 0; c < a.length; c++) b.push((a[c] >>> 4).toString(16)), b.push((a[c] & 15).toString(16));
                return b.join("")
            },
            hexToBytes: function (a) {
                for (var b = [], c = 0; c < a.length; c += 2) b.push(parseInt(a.substr(c, 2), 16));
                return b
            },
            bytesToBase64: function (a) {
                if (typeof btoa == "function") return btoa(f.bytesToString(a));
                for (var b = [], c = 0; c < a.length; c += 3)
                    for (var d = a[c] << 16 | a[c + 1] <<
                        8 | a[c + 2], e = 0; e < 4; e++) c * 8 + e * 6 <= a.length * 8 ? b.push("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(d >>> 6 * (3 - e) & 63)) : b.push("=");
                return b.join("")
            },
            base64ToBytes: function (a) {
                if (typeof atob == "function") return f.stringToBytes(atob(a));
                for (var a = a.replace(/[^A-Z0-9+\/]/ig, ""), b = [], c = 0, d = 0; c < a.length; d = ++c % 4) d != 0 && b.push(("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(a.charAt(c - 1)) & Math.pow(2, -2 * d + 8) - 1) << d * 2 | "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(a.charAt(c)) >>>
                    6 - d * 2);
                return b
            }
        }, e = e.charenc = {};
        e.UTF8 = {
            stringToBytes: function (a) {
                return f.stringToBytes(a)
            },
            bytesToString: function (a) {
                return decodeURIComponent(f.bytesToString(a))
            }
        };
        var f = e.Binary = {
            stringToBytes: function (a) {
                for (var b = [], c = 0; c < a.length; c++) b.push(a.charCodeAt(c) & 255);
                return b
            },
            bytesToString: function (a) {
                for (var b = [], c = 0; c < a.length; c++) b.push(String.fromCharCode(a[c]));
                return b.join("")
            }
        }

        function FF(b, g, c, a, d, e, f) {
            b = b + (g & c | ~g & a) + (d >>> 0) + f;
            return (b << e | b >>> 32 - e) + g
        }

        function GG(b, g, c, a, d, e, f) {
            b = b + (g & a | c & ~a) + (d >>> 0) + f;
            return (b << e | b >>> 32 - e) + g
        }

        function HH(b, g, c, a, d, e, f) {
            b = b + (g ^ c ^ a) + (d >>> 0) + f;
            return (b << e | b >>> 32 - e) + g
        }

        function II(b, g, c, a, d, e, f) {
            b = b + (c ^ (g | ~a)) + (d >>> 0) + f;
            return (b << e | b >>> 32 - e) + g
        }

        function md5(b, g) {
            for (var c = g[0], a = g[1], d = g[2], e = g[3], f = 0; f < b.length; f += 16) var h = c,
                k = a, m = d, n = e, c = FF(c, a, d, e, b[f + 0], 7, -680876936), e = FF(e, c, a, d, b[f + 1], 12, -389564586), d = FF(d, e, c, a, b[f + 2], 17, 606105819), a = FF(a, d, e, c, b[f + 3], 22, -1044525330), c = FF(c, a, d, e, b[f + 4], 7, -176418897), e = FF(e, c, a, d, b[f + 5], 12, 1200080426), d = FF(d, e, c, a, b[f + 6], 17, -1473231341), a = FF(a, d, e, c, b[f + 7], 22, -45705983), c = FF(c, a, d, e, b[f + 8], 7, 1770035416), e = FF(e, c, a, d, b[f + 9], 12, -1958414417), d = FF(d, e, c, a, b[f + 10], 17, -42063), a = FF(a, d, e, c, b[f + 11], 22, -1990404162),
                c = FF(c, a, d, e, b[f + 12], 7, 1804603682), e = FF(e, c, a, d, b[f + 13], 12, -40341101), d = FF(d, e, c, a, b[f + 14], 17, -1502002290), a = FF(a, d, e, c, b[f + 15], 22, 1236535329), c = GG(c, a, d, e, b[f + 1], 5, -165796510), e = GG(e, c, a, d, b[f + 6], 9, -1069501632), d = GG(d, e, c, a, b[f + 11], 14, 643717713), a = GG(a, d, e, c, b[f + 0], 20, -373897302), c = GG(c, a, d, e, b[f + 5], 5, -701558691), e = GG(e, c, a, d, b[f + 10], 9, 38016083), d = GG(d, e, c, a, b[f + 15], 14, -660478335), a = GG(a, d, e, c, b[f + 4], 20, -405537848), c = GG(c, a, d, e, b[f + 9], 5, 568446438), e = GG(e, c, a, d, b[f + 14], 9, -1019803690), d = GG(d, e, c, a,
                    b[f + 3], 14, -187363961), a = GG(a, d, e, c, b[f + 8], 20, 1163531501), c = GG(c, a, d, e, b[f + 13], 5, -1444681467), e = GG(e, c, a, d, b[f + 2], 9, -51403784), d = GG(d, e, c, a, b[f + 7], 14, 1735328473), a = GG(a, d, e, c, b[f + 12], 20, -1926607734), c = HH(c, a, d, e, b[f + 5], 4, -378558), e = HH(e, c, a, d, b[f + 8], 11, -2022574463), d = HH(d, e, c, a, b[f + 11], 16, 1839030562), a = HH(a, d, e, c, b[f + 14], 23, -35309556), c = HH(c, a, d, e, b[f + 1], 4, -1530992060), e = HH(e, c, a, d, b[f + 4], 11, 1272893353), d = HH(d, e, c, a, b[f + 7], 16, -155497632), a = HH(a, d, e, c, b[f + 10], 23, -1094730640), c = HH(c, a, d, e, b[f + 13], 4,
                    681279174), e = HH(e, c, a, d, b[f + 0], 11, -358537222), d = HH(d, e, c, a, b[f + 3], 16, -722521979), a = HH(a, d, e, c, b[f + 6], 23, 76029189), c = HH(c, a, d, e, b[f + 9], 4, -640364487), e = HH(e, c, a, d, b[f + 12], 11, -421815835), d = HH(d, e, c, a, b[f + 15], 16, 530742520), a = HH(a, d, e, c, b[f + 2], 23, -995338651), c = II(c, a, d, e, b[f + 0], 6, -198630844), e = II(e, c, a, d, b[f + 7], 10, 1126891415), d = II(d, e, c, a, b[f + 14], 15, -1416354905), a = II(a, d, e, c, b[f + 5], 21, -57434055), c = II(c, a, d, e, b[f + 12], 6, 1700485571), e = II(e, c, a, d, b[f + 3], 10, -1894986606), d = II(d, e, c, a, b[f + 10], 15, -1051523), a =
                    II(a, d, e, c, b[f + 1], 21, -2054922799), c = II(c, a, d, e, b[f + 8], 6, 1873313359), e = II(e, c, a, d, b[f + 15], 10, -30611744), d = II(d, e, c, a, b[f + 6], 15, -1560198380), a = II(a, d, e, c, b[f + 13], 21, 1309151649), c = II(c, a, d, e, b[f + 4], 6, -145523070), e = II(e, c, a, d, b[f + 11], 10, -1120210379), d = II(d, e, c, a, b[f + 2], 15, 718787259), a = II(a, d, e, c, b[f + 9], 21, -343485551), c = c + h >>> 0, a = a + k >>> 0, d = d + m >>> 0, e = e + n >>> 0;
            return [c, a, d, e]
        }

        self.md5hash = [1732584193, -271733879, -1732584194, 271733878];

        function updateMd5(b, g, c, a) {
            b = new Uint8Array(b);
            b = Crypto.util.endian(Crypto.util.bytesToWords(b));
            c === a && (g = 8 * (c - g), a *= 8, b[g >>> 5] |= 128 << a % 32, b[(g + 64 >>> 9 << 4) + 14] = a);
            self.md5hash = md5(b, self.md5hash);
        }


        function readBlob(b) {
            var g = b.file;
            var fileSync = new FileReaderSync;
            g.slice = g.webkitSlice || g.mozSlice || g.slice;
            for (var fileSize = g.size, e = 0, f = 1048576 > fileSize ? fileSize : 1048576; e < fileSize;) {
                var h = fileSync.readAsArrayBuffer(g.slice(e, f));
                updateMd5(h, e, f, fileSize);

                e = f;
                f += 1048576;
                if (f > fileSize)  f = fileSize;

                //monitor progress in percent, with performance wise, only on full percent 1 2 3 ...
                if (Math.ceil(100 * f / fileSize) === self.percent) {
                    postMessage({status: "progress", progress: self.percent});
                    self.percent++;
                }
            }

            var md5 = Crypto.util.bytesToHex(Crypto.util.wordsToBytes(Crypto.util.endian(self.md5hash)));

            //destroy variables
            g = null;
            fileSync = null;

            postMessage({status: "end", result: md5});
        }

        readBlob(data);
    }


    return FileMd5;
});


