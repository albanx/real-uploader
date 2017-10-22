/**
 * Real Uploader 
 * http://www.realuploader.com/ajaxuploader
 * Build date Sun Oct 22 2017 13:29:18 GMT+0200 (W. Europe Daylight Time)
 * Copyright Xscripts, http://www.albanx.com
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