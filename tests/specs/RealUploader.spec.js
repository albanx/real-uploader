
define(['RealUploader', 'Constants'], function(RealUploader, Constants) {

    describe('RealUploader', function() {
        var uploader;

        beforeEach(function() {
            if(document.getElementById('uploader')) {
                document.body.removeChild(document.getElementById('uploader'));
            }
            var div = document.createElement('div');
            div.id = 'uploader';
            document.body.appendChild(div);
            uploader = new RealUploader('#uploader', {
                allowedExtensions: ['Jpg', 'png']
            });
        });

        it('is defined', function() {
            expect(uploader instanceof RealUploader).toBe(true);
        });

        it('default config is ok', function() {
            expect(uploader.fileList).toEqual({});
            expect(uploader.fileIndex).toEqual(0);
            expect(uploader.uploadQueue).toEqual([]);
            expect(uploader.dom.container).toBeDefined();
            expect(uploader.totalUploadedBytes).toEqual(0);
            expect(uploader.checkInterval).toEqual(false);
            expect(uploader.globalStatus).toEqual(Constants.AX_IDLE);
        });

        it('_getMainContainer', function() {
            expect(uploader._getMainContainer('#uploader2')).toBe(null);
            expect(uploader._getMainContainer('#uploader')).not.toBe(null);
        });

        it('_defineCheckersAndSetters', function() {
            expect(uploader.config.accept).toBe('');
            expect(uploader.config.allowedExtensions).toEqual(['jpg', 'png']);
            // expect(uploader.config.language).toEqual('en_US');
            expect(uploader.config.maxFileSize).toEqual(10485760);
            expect(uploader.config.minFileSize).toEqual(0);
            expect(uploader.config.listeners).toBe(null);
            expect(uploader.config.enable).toBe(true);
        });

        it('checkUploadSupport', function() {
            expect(uploader.checkUploadSupport()).toBe(true);
        });

        it('_addRemoveButton', function() {
            expect(uploader.dom.removeButton).toBeDefined();
            expect(uploader.dom.removeButton.classList.contains('ax-clear')).toBe(true);
            expect(uploader.dom.removeButton.title).toBe('Remove all');
            expect(uploader.dom.removeButtonText).toBeDefined();
            expect(uploader.dom.removeButtonText.classList.contains('ax-text')).toBe(true);
            expect(uploader.dom.removeButtonText.innerHTML).toBe('Remove all');
        });

        it('_addUploadButton', function() {
            expect(uploader.dom.uploadButton).toBeDefined();
            expect(uploader.dom.uploadButton.classList.contains('ax-upload-all')).toBe(true);
            expect(uploader.dom.uploadButton.title).toBe('Upload all files');
            expect(uploader.dom.uploadButtonText).toBeDefined();
            expect(uploader.dom.uploadButtonText.classList.contains('ax-text')).toBe(true);
            expect(uploader.dom.uploadButtonText.innerHTML).toBe('Start upload');
        });

        it('_addBrowseButton', function() {
            expect(uploader.dom.browseButton).toBeDefined();
            expect(uploader.dom.browseButton.classList.contains('ax-browse-c')).toBe(true);
            expect(uploader.dom.browseButton.title).toBe('Add files');
            expect(uploader.dom.browseButtonText).toBeDefined();
            expect(uploader.dom.browseButtonText.classList.contains('ax-text')).toBe(true);
            expect(uploader.dom.browseButtonText.innerHTML).toBe('Add files');
        });

        it('_setDragAndDropTitle', function() {
            expect(uploader.dom.title).toBeDefined();
            expect(uploader.dom.title.classList.contains('ax-main-title')).toBe(true);
            expect(uploader.dom.title.innerHTML).toBe('Select Files or Drag&amp;Drop Files');
        });

        it('_addBrowseInput', function() {
            expect(uploader.dom.browseInput).toBeDefined();
            expect(uploader.dom.browseInput.classList.contains('ax-browse')).toBe(true);
        });

        it('renderHtml', function() {
            expect(uploader.dom.fileList).toBeDefined();
            expect(uploader.dom.container).toBeDefined();
            expect(uploader.dom.fileList.classList.contains('ax-file-list')).toBe(true);
            expect(uploader.dom.container.classList.contains('ax-uploader')).toBe(true);
        });

        it('_findDropArea', function() {
            expect(uploader._findDropArea()).toBeDefined(uploader.dom.container);
        });

        it('on binding works', function() {
            uploader.on('finish.myEvent', function () {
                return false;
            });

            uploader.on('finish', function () {
                return 'something else';
            });

            uploader.on('start', function () {
                return 'something else';
            });
            expect(uploader.events['start'].length).toEqual(1);
            expect(uploader.events['finish'].length).toEqual(2);
            expect(uploader.events['finish'][0][2]).toEqual('myEvent');
        });

        it('off binding works', function() {
            uploader.on('finish.myEvent', function () {
                return false;
            });

            expect(uploader.events['finish'].length).toEqual(1);

            uploader.off('finish.myEvent');

            expect(uploader.events['finish'].length).toEqual(0);

        });
    });
});

