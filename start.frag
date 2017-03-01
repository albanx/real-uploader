/**
 * Real Uploader 
 * http://www.realuploader.com/ajaxuploader
 * Build date Thu May 26 2016 20:14:18 GMT+0100 (IST)
 * Copyright 2010-2015, Xscripts, http://www.albanx.com
 */
(function (root, factory) {
    var myLibrary = factory();
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.realuploader = root.RealUploader = myLibrary;
    }

    //export as jquery plugin if jquery is present
    if (root.jQuery) {
        root.jQuery.fn.realuploader = function ( options ) {
            return this.each(function () {
                if ( !root.jQuery.data(this, "RealUploader") ) {
                    root.jQuery.data(this, "RealUploader", new myLibrary( this, options ));
                }
            });
        };
    }
}(this, function () {