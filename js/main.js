requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: 'js'
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    //paths: {
    //    app: '../app'
    //}
});
//
//start our app here
define(['RealUploader'], function(RealUploader) {
    var uploader = new RealUploader("#uploader_div", {
        autoStart: false,
        hideUploadButton: false,
        removeOnSuccess: true,
        overrideFile: true,
        allowDelete:true,
        //remotePath: '/Users/axhaferllari/uploads/',
        //remotePath: '/home/work2fly/lamp/wingbeat/public_html/upload-test/test-path/',
        accept: "image/*",
        editFilename: true,
        data: {
            var1 : 1,
            var2 : 'string'
        },
        listeners: {
            beforeUploadFile: function(file, name) {
                file.old_name = file.name;

            },
            finishFile: function(file){
                //access the dom object of the file html
                //file.dom.previewImage
                //file.dom.previewContainer
                //file.dom.progressBar
                //file.dom.progressInfo
                //file.dom.progressStat
                file.dom.progressInfo.innerHTML = '100%';
                this.dom.nameContainer.innerHTML = file.old_name;
            },
            beforeRenderFile: function(file, template) {
                var title = "Title: <input type=text name=file_title ><br>";
                var description = "Description: <input type=text name=file_desc ><br>";
                return template + title + description;
            },
            afterRenderFile: function(file, elements) {
                //we can attach even here custom inputs to the

                //elements.container.appendChild(input)
                //input = document.createElement('input')
            }
        },
        //fileTemplate: '<a class="ax-prev-container"><img style="cursor: pointer;" class="ax-preview" src="" alt=""></a><div class="ax-details"><div class="ax-file-name"></div><div class="ax-file-size"></div></div><div class="ax-progress-data"><div class="ax-progress"><div class="loader ax-progress-bar"></div><div class="ax-progress-info"></div></div></div><div class="ax-toolbar"><a class="ax-remove ax-button"><span class="ax-clear-icon ax-icon"></span><span class="ax-btn-text"></span></a><a class="ax-delete ax-button ax-disabled"><span class="ax-delete-icon ax-icon"></span><span class="ax-btn-text"></span></a><a class="ax-info ax-button"><span class="ax-info-icon ax-icon"></span><span class="ax-btn-text"></span></a></div>',
        //mainTemplate: "<div class='ax-main-container'> <h5 class='ax-main-title'>Select Files or Drag&amp;Drop Files</h5> <div class='ax-main-buttons'> <a title='Add files' class='ax-browse-c ax-button'> <span class='ax-browse-icon ax-icon'></span> <span class='ax-browse-text ax-text'>Add files</span> <input type='file' class='ax-browse' multiple /> </a>  <a title='Remove all' class='ax-clear ax-button'> <span class='ax-clear-icon ax-icon'></span> <span class='ax-clear-text ax-text'>Remove all</span> </a> </div> <div class='ax-file-list'></div> </div>",//
        resizeImage: {
            maxWidth: 1280,
            maxHeight: 800,
            scaleMethod: "bicubic",
            allowOverResize: false
        }
    });
    //var uploader = new RealUploader('#uploader_div', {
    //    url:'upload.jsp',
    //    remotePath:'example6/',
    //    allowDelete: true,
    //    language: 'en_EN',
    //    md5Calculate: true,
    //    exifRead:true,
    //    maxFileSize: '4G',
    //    allowedExtensions: ['jpg', 'avi', 'zip', 'png'],
    //    listeners: {
    //        init: function() {
    //
    //        },
    //        dragEnter: function(e, element) {
    //
    //        },
    //        dragLeave: function(e, element) {
    //
    //        }
    //    }
        mainTemplate:   ['<div class="ax-main-container"  style="border: 2px solid orangered; width: 25em; height: 15em; border-radius: 34px;">',
                            '<h5 class="ax-main-title">Drag &amp; Drop file here</h5>',
                            '<div class="ax-file-list"></div>',
                        '</div>'].join("");
    //    //resizeImage: {
    //    //    maxWidth: 200,
    //    //    maxHeight: 600,
    //    //    keepExif: false,
    //    //    keepAspectRatio: false
    //    //}
    //});

    return RealUploader;
});