/**
 * @file The main queue manager of the files
 * @author Alban Xhaferllari
 * @date
 * @version 4.0
 */
define(['FileObject', 'Constants', 'Utils', 'i18n'], /** @lends RealUploader */ function (FileObject, Constants, Utils, _) {
    'use strict';
    /**
     * Main uploader class. Manages the queue of upload and the template
     * @class RealUploader
     * @param querySelector {String|HTMLElement} The element where to start the uploader, can be either a DOM element or a
     * querySelector CSS
     * @example <caption>As query selector</caption>
     * new RealUploader('#some_id');//create a ajax uploader to the element with ID some_id
     * @example <caption>HTMLElement</caption>
     * var div = document.createElement('div');
     * document.body.appendChild(div);
     * new RealUploader(div);
     * @param config {Object} Configuration of the RealUploader set by the user
     * @param {String} [config.accept=null] Accept attribute to set on the the file input, will be used in combination
     * with the allowExtension setting
     * @example <caption>Accept example</caption>
     * {
     *      accept: 'image/*'; //will accept every image
     * }
     * @param {Array} [config.allowedExtensions=[]] Array of allowed upload extension, can be set also in php script
     * @example <caption>allowedExtensions</caption>
     * {
     *      allowedExtensions: ['jpg', 'pdf']; //only files with this extensions will be selected and the input
     *      //will be filtered
     * }
     * @param {boolean} [config.allowDelete=false] Allow user to delete file after upload. NOTE: should also be enabled
     * from server side for security reason
     * @param {boolean} [config.autoStart=false] If true upload will start immediately after drop of files or select
     * of files
     * @param {boolean} [config.async=true] Set the XMlHttpRequest async for the upload
     * @param {number} [config.bandwidthUpdateInterval=500] Set the interval that refresh the bandwidth calculation,
     * 0 to disable
     * @param {boolean} [config.checkFileExists=false] Do not ask user for file exits if false, if true ask user to
     * override or not the file
     * @param {number} [config.chunkSize = 1048576] Default 1Mb, if supported send file to server by chunks, not at once
     * @param {Object} [config.data={}] User data to send to the server with the file upload
     * @param {String|Object|Function}[config.dropClass='ax-drop'] Set the class of dom element when the files
     * are drag over
     * @param {String|HTMLElement} [config.dropArea='self'] Set the DOM element where to bind the drag event. If it
     * is provided the self string then the dropArea will be bind to the uploader container
     * @param {boolean} [config.enable=true] Start the uploader state. If set to false, it will not be possible to
     * upload files until an external call to the enable method will be called
     * @param {boolean} [config.editFilename=false] Enabled file name edit before upload with double click
     * @param {boolean} [config.exifRead=false] Enables exif read from JPEG file, it will attach the information to
     * the file object
     * @param {String} [config.fileTemplate=null] Customize the html for the file template, to be used by keeping the
     * class names. This will allow the users to change easy the html and preview.
     * The default value is hardcoded inside the code for more see the file documentation
     * @param {boolean} [config.hideUploadButton=false] Hides the main upload button, to be used on autoStart to true
     * or when the upload is trigger by external function
     * @param {String} [config.language='auto'] Set the language of the string for button, labels... By default
     * it is detected the browser language. The format should be en_UK, it_IT, sq_AL ...
     * @param {String} [config.mainTemplate=null] Set the main template html for the base buttons: Add Files, Upload All,
     * Remove All. This will allow the users to change easy the html. The default value is hardcoded for more see
     * the documentation
     * @param {number} [config.maxFiles=9999] Set the maximum file of number allow to upload at the same session.
     * Recommended to keep this settings low when uploading big files
     * @param {number} [config.maxConnections=3] Set the maximum number of parallel uploads. By default most of browser
     * will allow 6 parallel connections. Limit to three will allow a faster file upload.
     * @param {number|String} [config.maxFileSize=10485760] Set the maximum file size for file upload.
     * Can be set as String with format 10M, 200K, 4G to set the unit or as number 1123123 for indicating bytes.
     * @param {number|String} [config.minFileSize=0] Set the minimum file size for file upload. Can be set as String
     * with format 10M, 200K, 4G to set the unit or as number 1123123 for indicating bytes.
     * @param {boolean} [config.md5Calculate=false] Calculate the MD5 hash of the file using WebWorkers,
     * can slow down or hang the browser on big files, use with care.
     * @param {boolean} [config.md5Check=false] Verify the correct file upload by comparing the server md5 with the md5
     * calculated on client side. Works only of md5Calculate is enabled.
     * @param {boolean} [config.overrideFile=false] If set to false the files on the server will not be override.
     * The file will be renamed if already exits. If set to true the file user will be prompt to override the file.
     * @param {number} [config.thumbHeight=0] Set the maximum height of the image thumbnail to generate on server
     * @param {number} [config.thumbWidth=0] Set the maximum height of the image to thumbnail on server
     * @param {String} [config.thumbPostfix='_thumb'] Set the postfix of the generated re-sized image, Filename_thumb.ext
     * @param {String} [config.thumbPath=''] Set the path where to upload the re-sized image
     * @param {String} [config.thumbFormat=''] Set the thumbnail export format, by default same as original image.
     * Possible values jpg, png, gif.
     * @param {URL} [config.url='upload.php'] Set the server side script that handles the upload
     * @param {boolean} [config.uploadDir=false] Experimental feature for uploading an entire folder.
     * Works only on Google Chrome
     * @param {boolean} [config.removeOnSuccess=false] If true the file will be removed from the list when the upload is successful
     * @param {boolean} [config.removeOnError=false] If true the file will be removed from the list when the upload fails
     * @param {String|function} [config.remotePath=''] Set the remote path where to upload the file on server. If this path
     * is set on the server script then this value will be ignored. The folder will be created automatically if does not exists
     * @param {Object} [config.resizeImage] Resize the image settings before uploading on server. This will create a new file
     * and can work both with the server size. Uses WebWorkers and Canvas.
     * @param {number} [config.resizeImage.maxWidth=0] Maximum  width for the resize
     * @param {number} [config.resizeImage.maxHeight=0] Maximum  height for the resize
     * @param {number} [config.resizeImage.outputQuality=1] Set the output quality. Possible values from 0 to 1
     * @param {number} [config.resizeImage.scaleMethod=3] Select the scale method to use for the image resize. Current
     * available values 0 for nearest neighbour, 1 for haming 2 for lancoz 2, 3 for lancoz 3
     * @param {number} [config.resizeImage.keepExif=false] Set if either to keep exif during resize, works only if
     * exif reader is enabled
     * @param {number} [config.resizeImage.unsharpAmount=0] 0-500 set the sharpness level
     * @param {number} [config.resizeImage.unsharpThreshold=0] 0-100 set the sharpness threshold
     * @param {number} [config.resizeImage.alpha=true]
     * @param {String} [config.resizeImage.outputFormat='auto'] Select the output format can be png/jpg
     * @param {boolean} [config.resizeImage.removeExif=false] Remove the exif info on re-sized if true. false will copy
     * @param {boolean} [config.resizeImage.allowOverResize=false] If the maxWidth/maxHeight is over the real image
     * @param {boolean} [config.resizeImage.keepExif=false] If true will copy the exif during resize
     * size then the image will not be reside if set to true then this will allow to stretch the image on resize
     * the exif info on the new image
     * @param {boolean} [config.previews=true] If true the system will make the preview of the image and a light box
     * Set to false to avoid memory problems on multiple image selection
     * @param {number} [config.previewFileSize=10485760] Set a limit to the image preview, for big images the browser
     * can cause memory problems and slowness
     * @param {Function} [config.listeners] Main listeners handles. This is an object containing all listeners events
     * @param {Function} [config.listeners.start] Runs on upload start of the upload
     * @param {Function} [config.listeners.startFile] Runs on upload start for the single file
     * @param {Function} [config.listeners.finish] Runs when all files finish uploading
     * @param {Function} [config.listeners.finishFile] Runs on upload finish success for the single file
     * @param {Function} [config.listeners.error] Runs on error for any file
     * @param {Function} [config.listeners.errorFile] Runs on error upload for single file
     * @param {Function} [config.listeners.beforeUpload] Runs before upload all, if return false then upload is stopped
     * @param {Function} [config.listeners.beforeUploadFile] Runs before the upload of the single if returns false upload is stopped for the single file
     * @param {Function} [config.listeners.init] Runs on plugin initialization
     * @param {Function} [config.listeners.progress] Runs on progress action of upload all
     * @param {Function} [config.listeners.progressFile] Runs on file elaboration progress, upload/md5 calc/resize
     * @param {Function} [config.listeners.beforePreview] Runs before preview, if return false stops preview
     * @param {Function} [config.listeners.preview] Runs after preview has been done
     * @param {Function} [config.listeners.select] Runs after file select, returns selected file as parameter of callback
     * @param {Function} [config.listeners.chunkUpload] Runs on a chunk upload
     * @param {Function} [config.listeners.exifDone] Runs once the exifDone has been calculated
     * @param {Function} [config.listeners.md5Done] Runs once the md5 has been calculated
     * @param {Function} [config.listeners.beforeImageResize] Runs before the resize takes place
     * @param {Function} [config.listeners.imageResize] Runs on image resize done
     * @param {Function} [config.validateFile=null] User defined callback to run on file validation, with custom
     * condition. If this function return false then the file will not be added to the list
     * @constructor
     */
    var RealUploader = function (querySelector, userConfig) {
        this.fileList = {};
        this.fileIndex = 0;
        this.uploadQueue = [];
        this.globalStatus = Constants.AX_IDLE;
        this.dom = {};
        this.totalUploadedBytes = 0;
        this.checkInterval = false;

        //OPTIONS A-Z
        this.config = {
            _data: {
                accept: null,
                allowedExtensions: [],
                allowDelete: false,
                autoStart: false,
                async: true,
                bandwidthUpdateInterval: 500,
                checkFileExists: false,
                chunkSize: 1048576,
                data: {},
                dropClass: 'ax-drop',
                dropArea: 'self',
                enable: true,
                editFilename: false,
                exifRead: false,
                fileTemplate: null,
                hideUploadButton: false,
                language: 'auto',
                mainTemplate: null,
                maxFiles: 9999,
                maxConnections: 3,
                maxFileSize: 10485760,
                minFileSize: 0,
                md5Calculate: false,
                md5Check: true,
                overrideFile: false,

                /**
                 * This settings are used create a re-sized copy (copy) of images on server side
                 * Currently this is supported only if any processing image extension is enabled on sever
                 * For PHP it uses the GD library
                 */
                thumbHeight: 0,
                thumbWidth: 0,
                thumbPostfix: '_thumb',
                thumbPath: '',
                thumbFormat: '',

                url: 'upload.php',
                uploadDir: false,
                removeOnSuccess: false,
                removeOnError: false,
                remotePath: '',

                /**
                 * Client side resize
                 */
                resizeImage: {
                    maxWidth: 0,
                    maxHeight: 0,
                    outputQuality: 1,
                    scaleMethod: 3,
                    outputFormat: null,
                    allowOverResize: false,
                    keepExif: false,
                    keepAspectRatio: true,
                    unsharpAmount: 0,
                    unsharpThreshold: 0,
                    alpha: true
                },
                previews: true,
                previewFileSize: 10 * 1024 * 1024,
                listeners: null,
                validateFile: null
            }
        };

        //The total list of events. Each array will contain eventually user bind callbacks for the events
        this.events = {
            init: [], //runs on plugin initialization
            start: [], //runs on upload start global
            startFile: [], //runs on upload start for the single file
            finish: [], //runs on upload finish success for all files
            finishFile: [], //runs on upload finish success for the single file
            error: [], //runs on error for any file
            errorFile: [], //runs on error upload for single file
            beforeUpload: [], //runs before upload all, if return false then upload is stopped
            beforeUploadFile: [], //runs before the upload of the single if returns false upload is stopped for the single file
            progress: [], //runs on progress action of upload all
            progressFile: [], //runs on file elaboration progress, upload/md5 calc/resize
            beforePreview: [], //runs before preview, if return false stops preview
            preview: [], //runs after preview has been done
            select: [], //runs after file select, returns selected files as parameter of callback
            chunkUpload: [], //runs on a chunk upload
            exifDone: [], //runs once the exifDone has been calculated
            md5Start: [], //runs before starting the md5 calculation
            md5Done: [], //runs once the md5 has been calculated
            beforeImageResize: [], //runs before the resize takes place
            imageResize: [], //runs on image resize done
            dragEnter: [], //runs on drag enter
            dragLeave: [], //run on drag leave
            dragOver: [], //run on drag over
            drop: [],  //run on drop files
            afterRenderFile: [], //run after the file DOM element is attached to the dom
            beforeRenderFile: [] //runs before the file element is beeing rendered to the dom
        };

        var container = this._getMainContainer(querySelector);
        if (container) {
            this._setMainContainer(container);
            this._defineCheckersAndSetters(userConfig);
            this.slots = this.config.maxConnections;
            new _(this.config.language);

            if (this.checkUploadSupport()) {
                this.renderHtml();
                this._bindEvents();
                this.triggerEvent('init', []);
            }
        }
    };

    RealUploader.prototype = {
        /**
         * Pre-check settings function, sanitize settings and adds getters and setters for future validations
         * @param userSettings settings  define by the user
         * @returns {Object} settings to be used
         */
        _defineCheckersAndSetters: function (userSettings) {

            var me = this;
            //define some getters and setters for validating settings
            Object.defineProperty(me.config, 'accept', {
                get: function () {
                    return this._data.accept ? this._data.accept : '';
                },
                set: function (val) {
                    this._data.accept = val;
                    me._setAcceptAttribute();
                }
            });

            Object.defineProperty(me.config, 'allowedExtensions', {
                get: function () {
                    return this._data.allowedExtensions;
                },
                set: function (exts) {
                    this._data.allowedExtensions = exts.map(function (item) {
                        return item.toLowerCase();
                    });
                    me._setAcceptAttribute();
                }
            });

            Object.defineProperty(me.config, 'language', {
                get: function () {
                    if (this._data.language == 'auto') {
                        var language = window.navigator.userLanguage || window.navigator.language;
                        return language.replace('-', '_');
                    }
                    return this._data.language;
                },
                set: function (val) {
                    this._data.language = val;
                }
            });

            Object.defineProperty(me.config, 'maxFileSize', {
                get: function () {
                    return this._data.maxFileSize;
                },
                set: function (size) {
                    this._data.maxFileSize = Utils.parseSize(size);
                }
            });

            Object.defineProperty(me.config, 'minFileSize', {
                get: function () {
                    return this._data.minFileSize;
                },
                set: function (size) {
                    this._data.minFileSize = Utils.parseSize(size);
                }
            });

            Object.defineProperty(me.config, 'listeners', {
                get: function () {
                    return this._data.listeners;
                },
                set: function (listeners) {
                    if (typeof listeners == 'object') {
                        for (var event in listeners) {
                            if (listeners.hasOwnProperty(event)) {
                                var callback = listeners[event];
                                me.on(event, callback.fn || callback, callback.scope || me);
                            }
                        }
                        this._data.listeners = listeners;
                    }
                }
            });

            Object.defineProperty(me.config, 'enable', {
                get: function () {
                    return this._data.enable;
                },
                set: function (val) {
                    this._data.enable = !!val;//convert to boolean
                    if (this._data.enable) {
                        me.dom.container.classList.remove('ax-disabled');
                    } else {
                        me.dom.container.classList.add('ax-disabled');
                    }
                }
            });

            Utils.extend(this.config, this.config._data, false);
            Utils.extend(this.config, userSettings, false);
            Utils.log('Final config', this.config.remotePath);
            return this.config;
        },

        /**
         * Check if the browser supports the HTML5 upload
         * @returns {boolean} true if browser support HTML5
         */
        checkUploadSupport: function () {
            // safari<5.1.7 is bugged in file api force to basic html4 upload
            var isBuggedSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor) && /Version\/5\./.test(navigator.userAgent) && /Win/.test(navigator.platform);
            if (isBuggedSafari || window.FormData === undefined) {
                console.error(_('RealUploader: This browser is not supported'));
                return false;
            }

            //safari on IOS cannot upload multiple files, buggy
            var isBuggedIOS7 = navigator.userAgent.indexOf(" OS 7_") !== -1;
            if (isBuggedIOS7) {
                this.config.maxFiles = 1;
            }
            return true;
        },
        _getMainContainer: function (querySelector) {
            var container = null;
            if (querySelector instanceof HTMLElement) {
                container = querySelector;
            } else if (typeof querySelector === 'string') {
                container = Utils.getEl(querySelector);
            }
            if(!container) {
                console.warn(querySelector + _(' not found on the DOM'));
            }

            return container;
        },
        _setMainContainer: function (container) {
            //check if the plugin has already been applied to this element
            if (container.classList.contains('ax-uploader')) {
                console.warn(_('Real Uploader is already bind to this element'));
            } else {
                this.dom.container = container;
            }
        },
        _addRemoveButton: function () {
            var me = this;
            me.dom.removeButton = Utils.getEl(me.dom.container, '.ax-clear');
            if (me.dom.removeButton) {
                me.dom.removeButton.setAttribute('title', _('Remove all'));
                me.dom.removeButtonText = Utils.getEl(me.dom.removeButton, '.ax-text');
                if (me.dom.removeButtonText) {
                    me.dom.removeButtonText.innerHTML = _('Remove all');
                }
            }
            return  me;
        },
        _addUploadButton: function () {
            var me = this;
            me.dom.uploadButton = Utils.getEl(me.dom.container, '.ax-upload-all');
            if (me.dom.uploadButton) {
                me.dom.uploadButton.setAttribute('title', _('Upload all files'));
                me.dom.uploadButtonText = Utils.getEl(me.dom.uploadButton, '.ax-text');
                if (me.dom.uploadButtonText) {
                    me.dom.uploadButtonText.innerHTML = _('Start upload');
                }
            }
            return me;
        },
        _addBrowseButton: function () {
            var me = this;
            me.dom.browseButton = Utils.getEl(me.dom.container, '.ax-browse-c');
            if (me.dom.browseButton) {
                me.dom.browseButton.setAttribute('title', _('Add files'));
                me.dom.browseButtonText = Utils.getEl(me.dom.browseButton, '.ax-text');
                if (me.dom.browseButtonText) {
                    me.dom.browseButtonText.innerHTML = _('Add files');
                }
            }
            return me;
        },
        _setDragAndDropTitle: function () {
            var me = this;
            me.dom.title = Utils.getEl(me.dom.container, '.ax-main-title');
            if (me.dom.title) {
                me.dom.title.innerHTML = _('Select Files or Drag&Drop Files');
            }
            return me;
        },
        _addBrowseInput: function () {
            var me = this;
            me.dom.browseInput = Utils.getEl(me.dom.container, '.ax-browse');
            if (me.dom.browseInput) {
                if (me.config.maxFiles != 1) {
                    me.dom.browseInput.setAttribute('multiple', 'multiple');
                }

                me._setAcceptAttribute();
                me._enableUploadDir();
            }
            return me;
        },
        _enableUploadDir: function () {
            var me = this;
            //experimental feature, works only on google chrome, has some performances issue, upload directory
            if (me.config.uploadDir) {
                me.dom.browseInput.setAttribute('webkitdirectory', 'webkitdirectory');
                me.dom.browseInput.setAttribute('mozdirectory', 'mozdirectory');
                me.dom.browseInput.setAttribute('directory', 'directory');
            }
            return me;
        },
        renderHtml: function () {
            var me = this;
            me.dom.container.innerHTML = me.config.mainTemplate ? me.config.mainTemplate : Constants.TEMPLATE;

            //create dom elements and get references
            me.dom.container.classList.add('ax-uploader');
            me.dom.fileList = Utils.getEl(me.dom.container, '.ax-file-list');

            me._setDragAndDropTitle();
            me._addBrowseButton();
            me._addUploadButton();
            me._addRemoveButton();
            me._addBrowseInput();
            return me;
        },
        /**
         * Set the accept attribute for the input selector, uses allow extensions and accept prop to set it
         * @private
         */
        _setAcceptAttribute: function () {
            var accept = (this.config.accept ? this.config.accept + ',' : '');
            if (this.config.allowedExtensions.length > 0) {
                accept += '.' + this.config.allowedExtensions.join(',.');
            }
            if (this.dom.browseInput && accept) {
                this.dom.browseInput.setAttribute('accept', accept);
            }
        },
        _findDropArea: function () {
            var dropArea = null, me = this;
            if (me.config.dropArea instanceof HTMLElement) {
                dropArea = me.config.dropArea;
            } else if (me.config.dropArea === 'self') {
                dropArea = this.dom.container;
            } else if (typeof me.config.dropArea === 'string') {
                dropArea = Utils.getEl(dropArea);
            } else if (typeof me.config.dropArea === 'function') {
                dropArea = me.config.dropArea.call(this);
            }
            return dropArea;
        },
        _bindBrowseInputOnChange: function () {
            var me = this;
            if (me.dom.browseInput) {
                me.dom.browseInput.addEventListener('change', function () {
                    if (me.config.enable) {
                        me.addFiles(this.files);
                        //chrome change fix event
                        me.value = '';
                    }
                });
            }
            return me;
        },
        _bindUploadButtonClick: function () {
            var me = this;
            if (me.dom.uploadButton) {
                me.dom.uploadButton.addEventListener('click', function () {
                    if (me.config.enable) me.enqueueAll();
                    return false;
                });
            }
            return me;
        },
        _bindRemoveButtonClick: function () {
            var me = this;
            if (me.dom.removeButton) {
                me.dom.removeButton.addEventListener('click', function () {
                    if (me.config.enable) me.clearQueue();
                    return false;
                });
            }
            return me;
        },
        /**
         * Bind the javascript events on the DOM objects
         * @private
         */
        _bindEvents: function () {
            var me = this;
            me._bindBrowseInputOnChange();
            me._bindUploadButtonClick();
            me._bindRemoveButtonClick();
            me.setDropArea();
            me.enable(me.config.enable);
        },
        /**
         * Function that bind on drop event for the files
         * @param dropArea the dom element where to bind the event
         */
        setDropArea: function () {
            var dropArea = this._findDropArea();
            if (dropArea && dropArea instanceof HTMLElement) {
                var me = this;
                me.dom.dropMask = Utils.doEl('div');
                me.dom.dropMask.classList.add('ax-mask');
                me.dom.dropMask.innerHTML = '<div class="ax-mask-icon"></div>';
                me.dom.container.appendChild(me.dom.dropMask);

                var dragEnterRun = false;
                var dragLeaveRun = false;
                var config = this.config;

                var eventStop = function (e) {
                    e.stopPropagation();//Prevent default and stop propagation on dragEnter
                    e.preventDefault();
                };

                /**
                 * Drag Enter can run from all elements so we use the dragEnterRun to avoid multiple run
                 * @param e
                 */
                var dragEnter = function (e) {
                    eventStop(e);
                    if (config.enable && !dragEnterRun) {
                        me.triggerEvent('dragEnter', [e, dropArea]);
                        dragEnterRun = true;
                        dragLeaveRun = false;
                        me.dom.dropMask.style.display = 'table-cell';
                    }
                };

                /**
                 * Event run on drag leave. This Event runs only from the dropMask
                 * @param e event
                 */
                var dragLeave = function (e) {
                    eventStop(e);
                    if (config.enable && !dragLeaveRun) {
                        if (config.dropClass) {
                            dropArea.classList.remove(config.dropClass);
                        }
                        me.triggerEvent('dragLeave', [e, dropArea]);
                        dragEnterRun = false;
                        dragLeaveRun = true;
                        me.dom.dropMask.style.display = 'none';
                    }
                };

                /**
                 * Event run on drag over files
                 * @param e
                 */
                var dragOver = function (e) {
                    eventStop(e);
                    if (config.enable) {
                        if (config.dropClass) {
                            dropArea.classList.add(config.dropClass);
                        }
                        me.triggerEvent('dragOver', [e, dropArea]);
                    }
                };

                /**
                 * Event run on drop files
                 * @param {Event} e
                 */
                var onDrop = function (e) {
                    eventStop(e);
                    if (config.enable) {
                        me.addFiles(e.dataTransfer.files);//add files
                        if (config.dropClass) {
                            dropArea.classList.remove(config.dropClass);
                        }
                        me.triggerEvent('drop', [e, this]);
                        me.dom.dropMask.style.display = 'none';
                        dragEnterRun = false;
                    }
                };

                //add event listener for the drop area
                dropArea.addEventListener('dragenter', dragEnter);
                me.dom.dropMask.addEventListener('dragleave', dragLeave);
                me.dom.dropMask.addEventListener('dragover', dragOver);
                me.dom.dropMask.addEventListener('drop', onDrop);
                return me;
            }
        },

        /**
         * Internal function that runs when a file status has been completed, failed or success
         *
         * @param fileId the file ID calling the function
         * @param msg any error message
         * @private
         */
        fileCompleted: function (fileId, msg) {
            //if all files had been uploaded then exec finish event
            var runFinish = true;
            var me = this;
            var fileObj = this.fileList[fileId];
            for (var fid in this.fileList) {
                if (this.fileList.hasOwnProperty(fid)) {
                    var f = this.fileList[fid];
                    //so if we have any file still not uploaded do not run finish event
                    if (f.status !== Constants.AX_DONE && f.status !== Constants.AX_ERROR) runFinish = false;
                }
            }

            switch (fileObj.status) {
                case Constants.AX_DONE :
                    me.triggerEvent('finishFile', [fileObj, msg]);
                    break;
                case Constants.AX_ERROR :
                    me.triggerEvent('errorFile', [fileObj, fileObj.getInfo(), fileObj.name]);
                    break;
            }

            //all uploaded files then run final finish event
            if (runFinish) {
                me.finish();
            }

            me.slots++; //free slot
        },

        /**
         * Finish function runs when all files are uploaded, trigger events and returns uploaded file names
         */
        finish: function () {
            var me = this;
            me.globalStatus = Constants.AX_DONE;
            var fileNames = []; //collect file names in a array

            for (var fileId in me.fileList) {
                if (me.fileList.hasOwnProperty(fileId)) {
                    fileNames.push(me.fileList[fileId].name);
                }
            }
            this.triggerEvent('finish', [fileNames, me.fileList]);
        },

        /**
         * Generate a file id for tracking the files in the list
         * @returns {string}
         */
        generateFileId: function () {
            this.fileIndex++;
            return 'file_' + this.fileIndex;
        },

        /**
         * Add files to the list from select or from drop
         * @param files {Array} DOM object list element
         */
        addFiles: function (files) {
            var selectedFiles = [];
            var me = this;
            for (var i = 0; i < files.length; i++) {
                var file = files[i];

                file.extension = file.name.split('.').pop().toLowerCase();

                //check if extension is allowed to be uploaded
                //if we have reach the max number of files allowed
                //if file size is allowed
                var err = me.checkFile(file.name, file.size, file.extension);

                //if no errors add file to list
                if (err.length == 0) {
                    var fileId = this.generateFileId();
                    me.fileList[fileId] = new FileObject(file, fileId, this); //create the file object

                    //store a reference to the current selected files for the onSelect callback
                    selectedFiles.push(this.fileList[fileId]);
                } else {
                    //if there are errors call the error event (if defined from the user)
                    me.triggerEvent('errorFile', [err, file.name]);
                }
            }

            //call the onSelect event, on the selected files
            me.triggerEvent('select', [selectedFiles]);

            //if AutoStart is enabled then start upload MOVE ON FILES READY
            if (me.config.autoStart) {
                me.enqueueAll();
            }
        },

        /**
         * Checking file if extension is allowed or if this file is exceeding the maximum file number
         * @param name name of the file
         * @param size file size (0 on old browser)
         * @param ext file extension
         * @returns {Array} array of error, no errors empty array
         */
        checkFile: function (name, size, ext) {

            var allowedExtensions = this.config.allowedExtensions;
            var fileNumber = Object.keys(this.fileList).length;
            var errors = [];
            var hasUserError = false;

            var maxFileNumber = fileNumber < this.config.maxFiles;
            var isAllowedExt = allowedExtensions.indexOf(ext) >= 0 || allowedExtensions.length == 0;
            var isSizeAllowed = size <= this.config.maxFileSize;

            if (typeof(this.config.validateFile) === 'function') {
                hasUserError = this.config.validateFile.call(this, name, ext, size);
            }

            if (!maxFileNumber) {
                console.warn('Error :Maximum files number reached', maxFileNumber);
                errors.push({
                    message: _('Maximum files number reached'),
                    error: 'MAX_FILES',
                    param: fileNumber
                });
            }

            if (!isAllowedExt) {
                console.warn('Error :Extension not allowed', ext);
                errors.push({
                    message: _('Extension not allowed'),
                    error: 'ALLOW_EXTENSION',
                    param: ext
                });
            }

            if (!isSizeAllowed) {
                console.warn('Error :File size now allowed', size);
                errors.push({message: _('File size now allowed'), error: 'FILE_SIZE', param: size});
            }
            if (hasUserError) {
                errors.push({message: hasUserError, error: 'USER_ERROR', param: ''});
            }

            return errors;
        },
        /**
         * Function for uploading a single file
         * @param fileId {String}
         */
        enqueueFile: function (fileId) {
            this.uploadQueue.push(this.fileList[fileId]);
            this.processQueue();//trigger a process queue if it is not running already
        },

        /**
         * Enqueue all files ready to upload
         */
        enqueueAll: function () {
            var me = this;
            var pending = me.getPendingFiles();

            if (pending.length == 0) {
                me.triggerEvent('error', ['NO_FILES', Constants.AX_NO_FILES]);
            } else if (me.triggerEvent('beforeUpload', [me.fileList]) !== false) {
                this.triggerEvent('start', [pending]);

                for (var i = 0, len = pending.length; i < len; i++) {
                    me.uploadQueue.push(pending[i]);
                }

                me.processQueue();
            } else {
                me.triggerEvent('error', ['beforeUpload']);
            }
        },

        /**
         * Public alias function for starting upload
         * @public
         */
        startUpload: function () {
            this.enqueueAll();
        },
        /**
         * Internal private function for processing the upload queue, uses quotas
         */
        processQueue: function () {
            var me = this;
            if (!me.checkInterval) {
                Utils.log('Process queue');
                me.checkInterval = setInterval(function () {
                    Utils.log('Start interval');
                    if (me.uploadQueue.length == 0) {
                        clearInterval(me.checkInterval);
                        me.checkInterval = null;
                        Utils.log('No more files. Stop timer.');
                    } else {
                        me.globalStatus = Constants.AX_UPLOADING;
                        for (var i = 0; i < me.uploadQueue.length; i++) {
                            var file = me.uploadQueue[i];
                            if (me.slots > 0 && file.status == Constants.AX_READY && !file.disabled) {
                                var fo = me.uploadQueue.shift();
                                fo.startUpload();//start file upload
                                me.slots--;
                            } else {
                                Utils.log('processQueue:::', file.status, !file.disabled, me.slots);
                            }
                        }
                    }
                }, 500);
            }
        },
        /**
         * Get the pending files ready for upload
         * @returns {Array}
         */
        getPendingFiles: function () {
            var arr = [];
            for (var fileId in this.fileList) {
                if (this.fileList.hasOwnProperty(fileId)) {
                    var f = this.fileList[fileId];
                    if (f.status == Constants.AX_READY || f.status == Constants.AX_IDLE || f.status == Constants.AX_CHECK) {
                        arr.push(f);
                    }
                }
            }

            return arr;
        },
        /**
         * Returns true if the uploading process is still running
         * @returns {boolean}
         */
        isUploading: function () {
            return this.globalStatus == Constants.AX_UPLOADING;
        },
        /**
         * Return true if the uploader status is IDLE
         * @returns {boolean}
         */
        isIdle: function () {
            return this.globalStatus == Constants.AX_IDLE;
        },
        /**
         * Helper function for external use for getting the number of the files
         * @returns {boolean}
         */
        hasFiles: function () {
            return Object.keys(this.fileList).length != 0;
        },
        /**
         * Internal function called by the file object
         * @param file the calling file object
         * @param bytes bytes sent to the server
         */
        progress: function (file, bytes) {
            this.totalUploadedBytes = +bytes;
            this.triggerEvent('progress', [this.totalUploadedBytes]);
        },
        /**
         * Removes and stops all the file from the list and destroys them
         */
        clearQueue: function () {
            for (var fileId in this.fileList) {
                if (this.fileList.hasOwnProperty(fileId)) {
                    this.fileList[fileId].destroy();
                }
            }
        },
        /**
         * Get the parameter to pass in POST
         * Returns a formData element
         * @returns {FormData}
         */
        getBaseParams: function (file) {
            Utils.log('getBaseParams:::called');
            //NOTE: all internal params of Real Ajax Uploader starts with ax-
            var config = this.config;
            var data = new FormData();

            //eval file path
            var remotePath = config.remotePath;
            if (typeof remotePath == 'function') {
                remotePath = remotePath.call(this, file);
            }


            //file data
            data.append('ax-file-path', remotePath);
            data.append('ax-allow-ext', config.allowedExtensions.join('|'));
            data.append('ax-max-file-size', config.maxFileSize);

            //thumb data, for generation of thumbs in the server side
            data.append('ax-thumbPostfix', config.thumbPostfix);
            data.append('ax-thumbPath', config.thumbPath);
            data.append('ax-thumbFormat', config.thumbFormat);
            data.append('ax-thumbHeight', config.thumbHeight);
            data.append('ax-thumbWidth', config.thumbWidth);

            //override or not
            if (config.checkFileExists || config.overrideFile) {
                data.append('ax-override', 1);
            }

            //check md5 on server side
            if (config.md5Check && config.md5Calculate) {
                data.append('ax-md5checksum', 1);
            }

            //send and eval user data
            var userData = this.getUserData(config.data, file);

            for (var param in userData) {
                if (userData.hasOwnProperty(param)) {
                    data.append(param, userData[param]);
                }
            }
            return data;
        },
        /**
         *
         * @param userData {Object}
         * @param file
         * @returns {*}
         */
        getUserData: function (userData, file) {
            //send and eval user data
            if (typeof userData === 'function') {
                userData = userData.call(this, file);
            }

            if (typeof userData === 'string') {
                var decode = userData.split('&');
                userData = {};
                for (var i = 0; i < decode.length; i++) {
                    var param = decode[i].split('=');
                    if (param[0] !== undefined && param[1] !== undefined) {
                        userData[param[0]] = param[1];
                    }
                }
            }

            //set a default type
            if (typeof userData !== 'object') {
                userData = {};
            }

            return userData;
        },
        /**
         * This function removes a files from the list
         * Private method to be called only on {FileObject} destroy
         * @param {String} fileId the id of the file in the list to be removed
         * @private
         */
        _removeFile: function (fileId) {
            delete this.fileList[fileId]; //remove the file from the list
        },

        /**
         * Stop all upload
         * @return {RealUploader} return the current object for chain
         * @public
         */
        stopUpload: function () {
            for (var fileId in this.fileList) {
                if (this.fileList.hasOwnProperty(fileId)) {
                    var f = this.fileList[fileId];
                    if (f.status == Constants.AX_UPLOADING) {
                        f.stopUpload();
                    }
                }
            }
            return this;
        },
        /**
         * Enable/Disable the uploader
         * @param bool {Boolean} true enables the uploader/ false disables
         * @return {RealUploader} Returns this for chain purpose
         */
        enable: function (bool) {
            this.config.enable = bool;
            return this;
        },

        /**
         * Bind event function. Use this function to bind one or more listener for any event.
         * Listeners are stored in an array for each type of event
         * @param eventSpace name of the event to trigger: can be namespaced: md5Done.myevent
         * @param callback the function to call
         * @param scope the event scope, by default to this
         * @return {RealUploader} Returns this for chain purpose
         */
        on: function (eventSpace, callback, scope) {
            var splitEvent = eventSpace.split('.');
            var event = splitEvent[0];
            var namespace = splitEvent[1] !== undefined ? splitEvent[1] : '';

            if (this.events[event]) {
                if (!scope) scope = this;
                this.events[event].push([callback, scope, namespace]);
            }
            return this;
        },

        /**
         * Remove specific event from the listeners
         * @param eventSpace {Event}
         */
        off: function (eventSpace) {
            var splitEvent = eventSpace.split('.');
            var event = splitEvent[0];
            var namespace = splitEvent[1] !== undefined ? splitEvent[1] : '';
            if (this.events[event]) {
                var newEvents = [];

                for (var i = 0; i < this.events[event].length; i++) {

                    //if the namespace of this event is different from the passed one
                    //then this event should not be removed so store it in the new list
                    //NOTE: that in case name space is not set will be in both cases an empty string
                    if (namespace !== this.events[event][i][2]) {
                        newEvents.push(this.events[event][i]);
                    }
                }

                //this action will remove all the other events
                this.events[event] = newEvents;
            }
        },
        /**
         * Trigger a given event, run all callbacks bind on that event by the "on" function or
         * by the "listeners" property
         * @param event
         * @param params
         * @returns will return the return of the last bind callback return
         */
        triggerEvent: function (event, params) {
            var ret = null;
            if (this.events[event]) {
                Utils.log('triggerEvent', event, params);
                var list = this.events[event];
                for (var i = 0, len = list.length; i < len; i++) {
                    var callback = list[i];
                    ret = callback[0].apply(callback[1], params);
                }
            }
            return ret;
        },
        debugMode: function (env) {
            Constants.ENV = env;
        }
    };

    return RealUploader;
});