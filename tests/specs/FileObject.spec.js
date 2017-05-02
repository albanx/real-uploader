
define(['FileObject', 'Constants', 'RealUploader'], function(FileObject, Constants, RealUploader) {

    describe('FileObject', function() {
        var uploader;
        var fileObject;

        var file = {
            name: 'file.jpg',
            size: '1024',
            extension: 'jpg',
            type: {
                match: String.prototype.match
            }
        };
        var fileId = 1234;


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

            fileObject = new FileObject(file, fileId, uploader);
        });

        it('is defined', function() {
            expect(uploader instanceof RealUploader).toBe(true);
            expect(fileObject instanceof FileObject).toBe(true);
        });

    });
});