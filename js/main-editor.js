requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: 'js/image-editor'
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
define(['AreaSelector', 'Toolbar'], function(AreaSelector, Toolbar) {
    var imageEditor = new AreaSelector();
    var toolBar = new Toolbar(document.body);
});