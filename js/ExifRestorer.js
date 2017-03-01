/**
 * @file ExifRestorer
 * @author Alban Xhaferllari
 * @version 1.0
 * @date 29/09/2015 00:04
 * A small utility to preserve the exif during image resize with HTML5 javascript
 * @example <caption>Example usage of the class.</caption>
 *  var exifCopy = new ExifRestorer();
 *  exifCopy.onComplete = function (blobWithExif) {
 *      //some action on complete
 * };
 * exifCopy.restore(originalFile, destinationBlob);
 */
define([], /** @lends ExifRestorer */ function () {
    var ExifRestorer = function () {

        /**
         * Function to bind and call on complete of exif restore
         * @type {null}
         */
        this.onComplete = null;
    };

    ExifRestorer.prototype = {
        /**
         * Main method, the only used as public method
         * Read exif information from a Blob (file) and copy it in the destination Blob (toBlob of any canvas)
         * @param {Blob} fileBlob Source  original file with all information
         * @param {Blob} resizeBlob Resized destination file or any other blob of type image
         */
        restore: function (fileBlob, resizeBlob) {
            var me = this;
            me.readExifData(fileBlob, function (exifData) {
                if (exifData) {
                    var readResized = new FileReader();
                    readResized.onload = function (e) {
                        //read the blob in a DataView
                        var dataFile = new DataView(e.target.result);

                        //find the point where to insert the exif
                        var exifPoint = me.findExifIndex(dataFile);
                        var part1 = dataFile.buffer.slice(0, exifPoint);
                        var part2 = dataFile.buffer.slice(exifPoint);
                        if (typeof me.onComplete == 'function') {
                            me.onComplete(new Blob([part1, exifData, part2], {type: resizeBlob.type}));
                        }
                    };
                    readResized.readAsArrayBuffer(resizeBlob);
                } else {
                    me.onComplete(resizeBlob);
                }
            });
        },
        /**
         * Read exif data from the image File and on success calls the second parameter function
         * @param {Blob} file The source image file
         * @param {Function} callback function
         * @returns {FileReader}
         */
        readExifData: function (file, callback) {
            var me = this;
            var fileR = new FileReader();
            fileR.onload = function (e) {
                var fileData = new DataView(e.target.result);
                var arrayExif = me.findExifData(fileData);
                callback(arrayExif);
            };
            fileR.readAsArrayBuffer(file);
            return fileR;
        },
        /**
         * Find the index in the binary data file of the exif
         * @param {ArrayBuffer} arrayBuffer
         * @returns {number}
         */
        findExifIndex: function (arrayBuffer) {
            var head = 3;
            //scan the array buffer for the correct byte
            while (head < arrayBuffer.byteLength) {
                if (arrayBuffer.getUint8(head) == 255) {
                    return head;
                }
                head++;
            }
            return 0;
        },
        /**
         * Find the exif block of data from a arrayBuffer
         * @param {DataView} rawImageArray
         * @returns {ArrayBuffer}
         */
        findExifData: function (rawImageArray) {
            var head = 0;

            while (head < rawImageArray.byteLength) {
                if (rawImageArray.getUint8(head) == 255 && rawImageArray.getUint8(head + 1) == 218) {
                    break;
                }

                if (rawImageArray.getUint8(head) == 255 && rawImageArray.getUint8(head + 1) == 216) {
                    head += 2;
                } else {
                    var endPoint = head + rawImageArray.getUint8(head + 2) * 256 + rawImageArray.getUint8(head + 3) + 2;
                    if (rawImageArray.getUint8(head) == 255 && rawImageArray.getUint8(head + 1) == 225) //(ff e1)
                    {
                        return rawImageArray.buffer.slice(head, endPoint);
                    }

                    head = endPoint;
                }
            }
            return false;
        }
    };
    return ExifRestorer;
});