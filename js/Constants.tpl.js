'use strict';
define(/** @lends Constants */ function(){
    /**
     * @constants Constants
     * Real Ajax Uploader constants and events for internal use
     */
    var Constants = {
        AX_ERROR:       -1,
        AX_IDLE:        0,
        AX_DONE:        1,
        AX_UPLOADING:   2,
        AX_CHECK:       3,
        AX_READY:       4,
        AX_NO_FILES:    5,
        events: {
            finish:             'upload_finish',
            finishFile:         'upload_finish_file',
            start:              'start_upload',
            startFile:          'start_upload_file',
            progress:           'progress',
            progressFile:       'progress_file',
            beforeUpload:       'before_upload',
            beforeUploadFile:   'before_upload_file',
            md5Done:            'md5_calculated',
            exifDone:           'exif_decoded',
            beforePreview:      'before_preview',
            preview:            'preview_done'
        },
        ENV: '<%=ENV%>', //dev/production: useful if need to enable log on windows console
        VERSION: '<%=version%>'
    }

    return Constants;
});