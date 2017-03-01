'use strict';
define(/** @lends Constants */ function () {
    /**
     * @constants Constants
     * Real Ajax Uploader constants and events for internal use
     */
    var Constants = {
        AX_ERROR: -1,
        AX_IDLE: 0,
        AX_DONE: 1,
        AX_UPLOADING: 2,
        AX_CHECK: 3,
        AX_READY: 4,
        AX_NO_FILES: 5,
        events: {
            finish: 'upload_finish',
            finishFile: 'upload_finish_file',
            start: 'start_upload',
            startFile: 'start_upload_file',
            progress: 'progress',
            progressFile: 'progress_file',
            beforeUpload: 'before_upload',
            beforeUploadFile: 'before_upload_file',
            md5Done: 'md5_calculated',
            exifDone: 'exif_decoded',
            beforePreview: 'before_preview',
            preview: 'preview_done'
        },
        ENV: 'PROD', //dev/production: useful if need to enable log on windows console
        MD5_ON: true,
        EXIF_ON: true,
        VERSION: '',
        TEMPLATE: '<div class="ax-main-container">' +
        '<h5 class="ax-main-title">Select Files or Drag&amp;Drop Files</h5>' +
        '<div class="ax-main-buttons">' +
        '<a title="Add files" class="ax-browse-c ax-button">' +
        '<span class="ax-browse-icon ax-icon"></span> <span class="ax-browse-text ax-text"></span>' +
        '<input type="file" class="ax-browse" multiple />' +
        '</a>' +
        '<a title="Upload all files" class="ax-upload-all ax-button">' +
        '<span class="ax-upload-icon ax-icon"></span> <span class="ax-upload-text ax-text"></span>' +
        '</a>' +
        '<a title="Remove all" class="ax-clear ax-button">' +
        '<span class="ax-clear-icon ax-icon"></span> <span class="ax-clear-text ax-text"></span>' +
        '</a>' +
        '</div>' +
        '<div class="ax-file-list"></div>' +
        '</div>',
        FILE_TEMPLATE: [
            '<a class="ax-prev-container">',
            '<img style="cursor: pointer;" class="ax-preview" src="" alt="">',
            '</a>',
            '<div class="ax-details">',
            '<div class="ax-file-name"></div>',
            '<div class="ax-file-size"></div>',
            '</div>',
            '<div class="ax-progress-data">',
            '<div class="ax-progress">',
            '<div class="loader ax-progress-bar"></div>',
            '<div class="ax-progress-info"></div>',
            '</div>',
            '<div class="ax-progress-stat"></div>',
            '</div>',
            '<div class="ax-toolbar">',
            '<a class="ax-upload ax-button">',
            '<span class="ax-upload-icon ax-icon"></span>',
            '<span class="ax-btn-text"></span>',
            '</a>',
            '<a class="ax-remove ax-button">',
            '<span class="ax-clear-icon ax-icon"></span>',
            '<span class="ax-btn-text"></span>',
            '</a>',
            '<a class="ax-delete ax-button ax-disabled">',
            '<span class="ax-delete-icon ax-icon"></span>',
            '<span class="ax-btn-text"></span>',
            '</a>',
            '<a class="ax-info ax-button">',
            '<span class="ax-info-icon ax-icon"></span>',
            '<span class="ax-btn-text"></span>',
            '</a>',
            '</div>'].join('')
    }

    return Constants;
});