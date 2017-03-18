/**
 * Real Uploader 
 * http://www.realuploader.com/ajaxuploader
 * Build date Sat Mar 18 2017 19:20:18 GMT+0100 (W. Europe Standard Time)
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