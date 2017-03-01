/**
 * @author Alban Xhaferllari
 * XScripts
 * Used in Real Ajax Uploader
 * Common utilities function
 */


define(['i18n', 'Constants'], function(_, Constants) {
    var Utils = {
        /**
         * Run a function in background using WebWorkers
         * @param job the function to run
         * @returns {Worker}
         */
        runInBackground: function (job) {
            // Build a worker from an anonymous function body
            var blobURL = URL.createObjectURL(new Blob(['(',

                function (job) {
                    function startJob(passeddata) {
                        job(passeddata);
                    }

                    self.addEventListener("message", function (e) {
                        startJob(e.data);
                    }, !1);

                }.toString(),

                ')(', job.toString(), ')'], {type: 'application/javascript'}));

            var worker = new Worker(blobURL);
            return worker;
        },
        /**
         * Standard function to splice a file
         * @param blob Blob or File
         * @param start start index
         * @param end end index
         * @returns blob
         */
        sliceFile: function (blob, start, end) {
            try {
                blob.slice();	// deprecated version will throw WRONG_ARGUMENTS_ERR exception
                var slice = window.File.prototype.slice || window.File.prototype.webkitSlice || window.File.prototype.mozSlice;
                return blob.slice(start, end);
            } catch (e) {
                return blob.slice(start, end - start);// deprecated old slice method
            }
            return null;
        },
        /**
         * Short hand method for creating a dom element
         * @param type {String} type of element
         * @param cls {String} class
         * @param style {Object} style to apply
         * @returns {HTMLElement}
         */
        doEl: function (type, cls, attrs, style) {
            var el = document.createElement(type);
            //add class to element
            this.addCls(el, cls);
            if (attrs) {
                for (var prop in attrs) {
                    el.setAttribute(prop, attrs[prop]);
                }
            }

            this.setStyle(el, style);
            return el;
        },
        /**
         * Set the style of dom element
         * @param {HTMLElement} el
         * @param {Object} style
         * @returns {HTMLElement}
         */
        setStyle: function (el, style) {
            if (style) {
                for (var prop in style) {
                    el.style[prop] = style[prop];
                }
            }
            return el;
        },
        /**
         * Add a class to a dom element
         * @param {HTMLElement} el
         * @param {String} cls
         * @returns {*}
         */
        addCls: function (el, cls) {
            if (cls && "classList" in el) {
                el.classList.add(cls);
            } else if (cls) { //this is only for supporting old browser IE9 (?!)
                el.className + ' ' + cls;
            }
            return el;
        },
        /**
         * Short name helper function for finding an element by class name
         * @param parent parent element
         * @param cls class to find
         * @param first if true returns only the first matched element
         * @returns {NodeList} list of found elements
         */
        byCls: function (cls, parent, first) {
            if (!parent) parent = document;
            var els = parent.getElementsByClassName(cls)
            return parent.getElementsByClassName(cls);
        },
        /**
         * Get the first element match the selector
         * @param el dynamic element if defined is the parent container, if not define is the document
         * @param selector if defined as second parameter is the selector,
         * @returns {HTMLElement}
         */
        getEl: function() {
            if(arguments.length == 1) {
                return document.querySelector(arguments[0]);
            }
            try{
                if(arguments[0] && arguments[0].querySelector)
                    return arguments[0].querySelector(arguments[1]);
            }catch(e){
                return null;
            }
            return null;
        },
        /**
         * Get all the elements matching the selector
         * @param el dynamic element if defined is the parent container, if not define is the document
         * @param selector if defined as second parameter is the selector
         * @returns {NodeList}
         */
        getEls: function() {
            if(arguments.length == 1) {
                return document.querySelectorAll(arguments[0]);
            }
            return arguments[0].querySelectorAll(arguments[1]);
        },
        /**
         * Helper function for formatting a size from number to human readable
         * @param {number} size
         * @returns {string} the formatted string
         */
        formatSize: function (size) {
            var suffix = [_('b'), _('KB'), _('MB'), _('GB')];
            var i = 0;

            while (size >= 1024 && (i < (suffix.length - 1))) {
                size /= 1024;
                i++;
            }
            var intVal      = Math.round(size);
            var multiFactor = Math.pow(10, 2); //set a default precision decimal of 2
            var floor       = Math.round((size * multiFactor ) % multiFactor);
            return intVal + '.' + floor + ' ' + suffix[i];
        },

        /**
         * Fast extend deep function. Faster than jQuery and other methods
         * @param target The target object to override the new properties
         * @param source Source object with new values
         * @param shallow internal parameter use for the recursive
         * @returns Object {*}
         */
        extend: function (target, source, shallow) {
            var array = '[object Array]', object = '[object Object]', targetMeta, sourceMeta;
            var setMeta = function (value) {
                if (value === undefined) return 0;
                if (typeof value !== 'object') return false;
                var jClass = {}.toString.call(value);
                if (jClass === array) return 1;
                if (jClass === object) return 2;
            };
            for (var key in source) {
                if (source.hasOwnProperty(key)) {
                    targetMeta = setMeta(target[key]), sourceMeta = setMeta(source[key]);

                    if (!shallow && sourceMeta && targetMeta && targetMeta === sourceMeta) {
                        target[key] = this.extend(target[key], source[key], true);
                    } else if (sourceMeta !== 0) {
                        target[key] = source[key];
                    }
                } // ownProperties are always first
            }
            return target;
        },
        /**
         * Show the current image in a lightBox preview
         * Related to light-box.css
         * @param image Image to show or file to preview
         * @param title Name of the image or a title
         * @param info Other info to show near the name
         * @param cssClass Classes to add to the image container
         * @return {DOM} returns the main dom object
         */
        lightBoxPreview: function (image, title, info, cssClass) {

            //create the box for the preview
            var mainBox     = this.doEl('div', 'ax-lightbox-target', {});
            var imageBox    = this.doEl('div', 'ax-image-box', {});
            var imageEl     = this.doEl('img', 'ax-image-prev', {src: image.src});
            var infoBox     = this.doEl('div', 'ax-info-box', {});
            var fnBox       = this.doEl('div', 'ax-name-box', {});
            var sizeBox     = this.doEl('div', 'ax-size-box', {});
            var closeBox    = this.doEl('a', 'ax-lightbox-close', {});

            //append elements to dom
            mainBox.appendChild(imageBox);
            mainBox.appendChild(closeBox);
            mainBox.appendChild(infoBox);
            imageBox.appendChild(imageEl);
            infoBox.appendChild(fnBox);
            infoBox.appendChild(sizeBox);
            document.body.appendChild(mainBox);

            //set the information
            fnBox.innerHTML = title;
            sizeBox.innerHTML = info;

            if(cssClass) {
                imageEl.className +=' ' + cssClass;
            }
            //apply a small timeout to allow dom render
            setTimeout(function () {
                mainBox.classList.add('show');
            }, 100);

            //the close box function
            //remove some references for memory performance use
            var killBox = function (e) {
                if(mainBox)
                    document.body.removeChild(mainBox);

                mainBox     = null;
                imageBox    = null;
                infoBox     = null;
                fnBox       = null;
                sizeBox     = null;
                closeBox    = null;
                imageEl     = null;
                killBox     = null;
                window.removeEventListener('keyup', closeEsc);
            };

            var closeEsc = function (e) {
                if (e.keyCode === 27) {
                    killBox();
                }
            };

            closeBox.addEventListener('click', killBox);
            window.addEventListener('keyup', closeEsc);
            //mainBox.addEventListener('touchstart', killBox);
            //mainBox.addEventListener('click', killBox);

            return mainBox;
        },
        /**
         * Test if the value is a integer number
         * @param value value to test
         * @returns {boolean}
         */
        isInt: function (value) {
            var x;
            if (isNaN(value)) {
                return false;
            }
            x = parseFloat(value);
            return (x | 0) === x;
        },
        /**
         * A small function for parsing file unit size of the form 10M, 2G, 100K
         * @param {String} size the string size
         * @returns {number}
         */
        parseSize: function (size) {
            if (!Utils.isInt(size)) {
                var unit = size.slice(-1);
                if (isNaN(unit)) {
                    size = parseInt(size.replace(unit, ''));//remove the last char
                    switch (unit) {
                        case 'P':
                            size = size * 1024;//1024 or 1000??
                        case 'T':
                            size = size * 1024;
                        case 'G':
                            size = size * 1024;
                        case 'M':
                            size = size * 1024;
                        case 'K':
                            size = size * 1024;
                    }
                }
            }
            return size;
        },
        /**
         * Simple Ajax Post function, will automatically parse JSON if the return string is a valid JSON
         * @param {URL}  url  post URL
         * @param {FormData} data  parameters to post
         * @param {function} cb  function to call on request done
         */
        ajaxPost: function (url, data, cb) {
            var xhr = new XMLHttpRequest();
            if (typeof cb == 'function') {
                this.onreadystatechange = function () {
                    if (this.readyState == 4 && this.status == 200) {
                        var results = this.responseText;
                        try {
                            results = JSON.parse(this.responseText);
                        } catch (e) {
                            return false;
                        }
                        cb(results);
                        xhr = null;//remove reference
                    }
                };
            }
            xhr.open('POST', url);
            //xhr.setRequestHeader('Cache-Control', 'no-cache');
            //xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');//header
            //xhr.setRequestHeader('Content-Type', 'application/octet-stream');//generic stream header
            xhr.send(data);
        },
        //better log function
        log: function() {
            if(Constants.ENV === 'DEV') {
                var args = Array.prototype.slice.call(arguments, 0);
                var date = new Date();
                var now = ((date.getHours() < 10) ? "0" : "") + date.getHours() + ":" + ((date.getMinutes() < 10) ? "0" : "") + date.getMinutes() + ":" + ((date.getSeconds() < 10) ? "0" : "") + date.getSeconds();
                args.unshift(now);
                console.log.apply(console, args);
            }
        }
    };

    return Utils;
});
