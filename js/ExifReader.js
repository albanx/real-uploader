/**
 * @file Exif Reader file for JPEGs base on same online library
 * @author Alban Xhaferllari
 * @version 1.0
 */
define(['Utils'], /** @lends ExifReader */ function(Utils){
    /**
     * Exif Reader class
     * @class ExifReader
     * @param {File} file
     * @param {Object} options
     * @returns {ExifReader}
     * @constructor
     */
    var ExifReader = function(file, options) {
        var me = this;
        //default options
        me.options = {
            maxBufferSize: 262144//exif data are stored in the first 256k of the file
        };

        //extend default options
        if( options !== null && typeof options === 'object' ) {
            for( var prop in options ){
                if( options.hasOwnProperty(prop) ) {
                    me.options[prop] = options[prop];
                }
            }
        }

        //create the queue stacks callbacks
        me._done      = [];
        me._error     = [];
        me._always    = [];
        me._progress  = [];
        me.file = Utils.sliceFile( file, 0, me.options.maxBufferSize);
        return this;
    };

    ExifReader.prototype = {
        start: function() {
            var me = this;
            me._runStack(me._progress, ['File reading']);
            var fileReader = new FileReader();
            fileReader.onload = frLoad;
            fileReader.onerror = frError;
            fileReader.onprogress = frProgress;
            fileReader.readAsArrayBuffer( this.file );

            function frLoad(e) {
                var dataView    = new DataView(e.target.result);

                //check if is a valid jpeg
                if ( dataView.getUint8(0) == 0xFF && dataView.getUint8(1) == 0xD8 && dataView.getUint8(2) == 0xFF ) {
                    me._runStack(me._progress, ['jpegData']);
                    var jpegData    = me.readExifJpeg(dataView);

                    me._runStack(me._progress, ['readIPTCJpeg']);
                    var iptcData    = me.readIPTCJpeg(dataView);

                    //run the success callbacks functions
                    me._runStack(me._done, [jpegData, iptcData]);
                }

                me._runStack(me._always, [e]);
            }

            function frError(e) {
                me._runStack(me._error, [e]);
            }

            function frProgress(e) {
                me._runStack(me._progress, [e, 'File reading']);
            }
        },
        stop: function() {
        },
        done: function(callback, ctx){
            return this._addCallback(callback, ctx, 'done');
        },
        progress: function(callback, ctx){
            return this._addCallback(callback, ctx, 'progress');
        },
        error: function(callback, ctx){
            return this._addCallback(callback, ctx, 'error');
        },
        always: function(callback, ctx){
            return this._addCallback(callback, ctx, 'always');
        },
        _addCallback: function(callback, ctx, queue) {
            if( typeof callback == 'function') this['_'+queue].push({callback: callback, ctx: ctx });
            return this;
        },
        _runStack: function(stack, params) {
            var i = 0,  max = stack.length;
            for (i = 0; i < max; i++) {
                stack[i].callback.apply( stack[i].ctx, params );
            }
            return this;
        },

        tags: {
            exif: {
                // version tags
                0x9000: "ExifVersion",             // EXIF version
                0xA000: "FlashpixVersion",         // Flashpix format version

                // colorspace tags
                0xA001: "ColorSpace",              // Color space information tag

                // image configuration
                0xA002: "PixelXDimension",         // Valid width of meaningful image
                0xA003: "PixelYDimension",         // Valid height of meaningful image
                0x9101: "ComponentsConfiguration", // Information about channels
                0x9102: "CompressedBitsPerPixel",  // Compressed bits per pixel

                // user information
                0x927C: "MakerNote",               // Any desired information written by the manufacturer
                0x9286: "UserComment",             // Comments by user

                // related file
                0xA004: "RelatedSoundFile",        // Name of related sound file

                // date and time
                0x9003: "DateTimeOriginal",        // Date and time when the original image was generated
                0x9004: "DateTimeDigitized",       // Date and time when the image was stored digitally
                0x9290: "SubsecTime",              // Fractions of seconds for DateTime
                0x9291: "SubsecTimeOriginal",      // Fractions of seconds for DateTimeOriginal
                0x9292: "SubsecTimeDigitized",     // Fractions of seconds for DateTimeDigitized

                // picture-taking conditions
                0x829A: "ExposureTime",            // Exposure time (in seconds)
                0x829D: "FNumber",                 // F number
                0x8822: "ExposureProgram",         // Exposure program
                0x8824: "SpectralSensitivity",     // Spectral sensitivity
                0x8827: "ISOSpeedRatings",         // ISO speed rating
                0x8828: "OECF",                    // Optoelectric conversion factor
                0x9201: "ShutterSpeedValue",       // Shutter speed
                0x9202: "ApertureValue",           // Lens aperture
                0x9203: "BrightnessValue",         // Value of brightness
                0x9204: "ExposureBias",            // Exposure bias
                0x9205: "MaxApertureValue",        // Smallest F number of lens
                0x9206: "SubjectDistance",         // Distance to subject in meters
                0x9207: "MeteringMode",            // Metering mode
                0x9208: "LightSource",             // Kind of light source
                0x9209: "Flash",                   // Flash status
                0x9214: "SubjectArea",             // Location and area of main subject
                0x920A: "FocalLength",             // Focal length of the lens in mm
                0xA20B: "FlashEnergy",             // Strobe energy in BCPS
                0xA20C: "SpatialFrequencyResponse",    //
                0xA20E: "FocalPlaneXResolution",   // Number of pixels in width direction per FocalPlaneResolutionUnit
                0xA20F: "FocalPlaneYResolution",   // Number of pixels in height direction per FocalPlaneResolutionUnit
                0xA210: "FocalPlaneResolutionUnit",    // Unit for measuring FocalPlaneXResolution and FocalPlaneYResolution
                0xA214: "SubjectLocation",         // Location of subject in image
                0xA215: "ExposureIndex",           // Exposure index selected on camera
                0xA217: "SensingMethod",           // Image sensor type
                0xA300: "FileSource",              // Image source (3 == DSC)
                0xA301: "SceneType",               // Scene type (1 == directly photographed)
                0xA302: "CFAPattern",              // Color filter array geometric pattern
                0xA401: "CustomRendered",          // Special processing
                0xA402: "ExposureMode",            // Exposure mode
                0xA403: "WhiteBalance",            // 1 = auto white balance, 2 = manual
                0xA404: "DigitalZoomRation",       // Digital zoom ratio
                0xA405: "FocalLengthIn35mmFilm",   // Equivalent foacl length assuming 35mm film camera (in mm)
                0xA406: "SceneCaptureType",        // Type of scene
                0xA407: "GainControl",             // Degree of overall image gain adjustment
                0xA408: "Contrast",                // Direction of contrast processing applied by camera
                0xA409: "Saturation",              // Direction of saturation processing applied by camera
                0xA40A: "Sharpness",               // Direction of sharpness processing applied by camera
                0xA40B: "DeviceSettingDescription",    //
                0xA40C: "SubjectDistanceRange",    // Distance to subject

                // other tags
                0xA005: "InteroperabilityIFDPointer",
                0xA420: "ImageUniqueID"            // Identifier assigned uniquely to each image
            },
            tiff: {
                0x0100: "ImageWidth",
                0x0101: "ImageHeight",
                0x8769: "ExifIFDPointer",
                0x8825: "GPSInfoIFDPointer",
                0xA005: "InteroperabilityIFDPointer",
                0x0102: "BitsPerSample",
                0x0103: "Compression",
                0x0106: "PhotometricInterpretation",
                0x0112: "Orientation",
                0x0115: "SamplesPerPixel",
                0x011C: "PlanarConfiguration",
                0x0212: "YCbCrSubSampling",
                0x0213: "YCbCrPositioning",
                0x011A: "XResolution",
                0x011B: "YResolution",
                0x0128: "ResolutionUnit",
                0x0111: "StripOffsets",
                0x0116: "RowsPerStrip",
                0x0117: "StripByteCounts",
                0x0201: "JPEGInterchangeFormat",
                0x0202: "JPEGInterchangeFormatLength",
                0x012D: "TransferFunction",
                0x013E: "WhitePoint",
                0x013F: "PrimaryChromaticities",
                0x0211: "YCbCrCoefficients",
                0x0214: "ReferenceBlackWhite",
                0x0132: "DateTime",
                0x010E: "ImageDescription",
                0x010F: "Make",
                0x0110: "Model",
                0x0131: "Software",
                0x013B: "Artist",
                0x8298: "Copyright"
            },

            GPS: {
                0x0000: "GPSVersionID",
                0x0001: "GPSLatitudeRef",
                0x0002: "GPSLatitude",
                0x0003: "GPSLongitudeRef",
                0x0004: "GPSLongitude",
                0x0005: "GPSAltitudeRef",
                0x0006: "GPSAltitude",
                0x0007: "GPSTimeStamp",
                0x0008: "GPSSatellites",
                0x0009: "GPSStatus",
                0x000A: "GPSMeasureMode",
                0x000B: "GPSDOP",
                0x000C: "GPSSpeedRef",
                0x000D: "GPSSpeed",
                0x000E: "GPSTrackRef",
                0x000F: "GPSTrack",
                0x0010: "GPSImgDirectionRef",
                0x0011: "GPSImgDirection",
                0x0012: "GPSMapDatum",
                0x0013: "GPSDestLatitudeRef",
                0x0014: "GPSDestLatitude",
                0x0015: "GPSDestLongitudeRef",
                0x0016: "GPSDestLongitude",
                0x0017: "GPSDestBearingRef",
                0x0018: "GPSDestBearing",
                0x0019: "GPSDestDistanceRef",
                0x001A: "GPSDestDistance",
                0x001B: "GPSProcessingMethod",
                0x001C: "GPSAreaInformation",
                0x001D: "GPSDateStamp",
                0x001E: "GPSDifferential"
            },
            StringValues: {
                ExposureProgram: {
                    0: "Not defined",
                    1: "Manual",
                    2: "Normal program",
                    3: "Aperture priority",
                    4: "Shutter priority",
                    5: "Creative program",
                    6: "Action program",
                    7: "Portrait mode",
                    8: "Landscape mode"
                },
                MeteringMode: {
                    0: "Unknown",
                    1: "Average",
                    2: "CenterWeightedAverage",
                    3: "Spot",
                    4: "MultiSpot",
                    5: "Pattern",
                    6: "Partial",
                    255: "Other"
                },
                LightSource: {
                    0: "Unknown",
                    1: "Daylight",
                    2: "Fluorescent",
                    3: "Tungsten (incandescent light)",
                    4: "Flash",
                    9: "Fine weather",
                    10: "Cloudy weather",
                    11: "Shade",
                    12: "Daylight fluorescent (D 5700 - 7100K)",
                    13: "Day white fluorescent (N 4600 - 5400K)",
                    14: "Cool white fluorescent (W 3900 - 4500K)",
                    15: "White fluorescent (WW 3200 - 3700K)",
                    17: "Standard light A",
                    18: "Standard light B",
                    19: "Standard light C",
                    20: "D55",
                    21: "D65",
                    22: "D75",
                    23: "D50",
                    24: "ISO studio tungsten",
                    255: "Other"
                },
                Flash: {
                    0x0000: "Flash did not fire",
                    0x0001: "Flash fired",
                    0x0005: "Strobe return light not detected",
                    0x0007: "Strobe return light detected",
                    0x0009: "Flash fired, compulsory flash mode",
                    0x000D: "Flash fired, compulsory flash mode, return light not detected",
                    0x000F: "Flash fired, compulsory flash mode, return light detected",
                    0x0010: "Flash did not fire, compulsory flash mode",
                    0x0018: "Flash did not fire, auto mode",
                    0x0019: "Flash fired, auto mode",
                    0x001D: "Flash fired, auto mode, return light not detected",
                    0x001F: "Flash fired, auto mode, return light detected",
                    0x0020: "No flash function",
                    0x0041: "Flash fired, red-eye reduction mode",
                    0x0045: "Flash fired, red-eye reduction mode, return light not detected",
                    0x0047: "Flash fired, red-eye reduction mode, return light detected",
                    0x0049: "Flash fired, compulsory flash mode, red-eye reduction mode",
                    0x004D: "Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected",
                    0x004F: "Flash fired, compulsory flash mode, red-eye reduction mode, return light detected",
                    0x0059: "Flash fired, auto mode, red-eye reduction mode",
                    0x005D: "Flash fired, auto mode, return light not detected, red-eye reduction mode",
                    0x005F: "Flash fired, auto mode, return light detected, red-eye reduction mode"
                },
                SensingMethod: {
                    1: "Not defined",
                    2: "One-chip color area sensor",
                    3: "Two-chip color area sensor",
                    4: "Three-chip color area sensor",
                    5: "Color sequential area sensor",
                    7: "Trilinear sensor",
                    8: "Color sequential linear sensor"
                },
                SceneCaptureType: {
                    0: "Standard",
                    1: "Landscape",
                    2: "Portrait",
                    3: "Night scene"
                },
                SceneType: {
                    1: "Directly photographed"
                },
                CustomRendered: {
                    0: "Normal process",
                    1: "Custom process"
                },
                WhiteBalance: {
                    0: "Auto white balance",
                    1: "Manual white balance"
                },
                GainControl: {
                    0: "None",
                    1: "Low gain up",
                    2: "High gain up",
                    3: "Low gain down",
                    4: "High gain down"
                },
                Contrast: {
                    0: "Normal",
                    1: "Soft",
                    2: "Hard"
                },
                Saturation: {
                    0: "Normal",
                    1: "Low saturation",
                    2: "High saturation"
                },
                Sharpness: {
                    0: "Normal",
                    1: "Soft",
                    2: "Hard"
                },
                SubjectDistanceRange: {
                    0: "Unknown",
                    1: "Macro",
                    2: "Close view",
                    3: "Distant view"
                },
                FileSource: {
                    3: "DSC"
                },

                Components: {
                    0: "",
                    1: "Y",
                    2: "Cb",
                    3: "Cr",
                    4: "R",
                    5: "G",
                    6: "B"
                }
            }

        },

        /**
         * Read Exif from a array buffer file
         * @param DataView File
         * @returns {*}
         */
        readExifJpeg: function(dataView) {
            var offset = 2;

            while (offset < dataView.byteLength) {
                // we could implement handling for other markers here,
                // but we're only looking for 0xFFE1 for EXIF data
                if (dataView.getUint8(offset + 1) == 225) {
                    return this.readExif(dataView, offset + 4);
                } else {
                    offset += 2 + dataView.getUint16(offset + 2);
                }
            }
            return false;
        },
        readIPTCJpeg: function(dataView) {

            var offset = 2;
            var isFieldSegmentStart = function (dataView, offset) {
                return (
                    dataView.getUint8(offset) === 0x38 &&
                    dataView.getUint8(offset + 1) === 0x42 &&
                    dataView.getUint8(offset + 2) === 0x49 &&
                    dataView.getUint8(offset + 3) === 0x4D &&
                    dataView.getUint8(offset + 4) === 0x04 &&
                    dataView.getUint8(offset + 5) === 0x04
                );
            };

            while (offset < dataView.byteLength) {
                if (isFieldSegmentStart(dataView, offset)) {
                    // Get the length of the name header (which is padded to an even number of bytes)
                    var nameHeaderLength = dataView.getUint8(offset + 7);
                    if (nameHeaderLength % 2 !== 0) nameHeaderLength += 1;
                    // Check for pre photoshop 6 format
                    if (nameHeaderLength === 0) {
                        // Always 4
                        nameHeaderLength = 4;
                    }

                    var startOffset = offset + 8 + nameHeaderLength;
                    var sectionLength = dataView.getUint16(offset + 6 + nameHeaderLength);

                    return this.readIPTCData(dataView, startOffset, sectionLength);
                }

                // Not the marker, continue searching
                offset++;
            }
        },
        readExif: function(dataView, start) {
            //getStringFromDB integrate in object
            if (this.getStringFromDB(dataView, start, 4) != "Exif") {
                return false;
            }

            var bigEnd, tag, gpsData, tiffOffset = start + 6;

            // test for TIFF validity and endianness
            if (dataView.getUint16(tiffOffset) == 0x4949) {
                bigEnd = false;
            } else if (dataView.getUint16(tiffOffset) == 0x4D4D) {
                bigEnd = true;
            } else {
                return false;
            }

            if (dataView.getUint16(tiffOffset + 2, !bigEnd) != 0x002A) {
                return false;
            }

            var firstIFDOffset = dataView.getUint32(tiffOffset + 4, !bigEnd);

            if (firstIFDOffset < 0x00000008) {
                return false;
            }

            var tags = this.readTags(dataView, tiffOffset, tiffOffset + firstIFDOffset, this.tags.tiff, bigEnd);

            if ( tags.ExifIFDPointer ) {
                var exifData = this.readTags(dataView, tiffOffset, tiffOffset + tags.ExifIFDPointer, this.tags.exif, bigEnd);
                for (tag in exifData) {
                    if ( exifData.hasOwnProperty(tag) ) {
                        switch (tag) {
                            case "LightSource" :
                            case "Flash" :
                            case "MeteringMode" :
                            case "ExposureProgram" :
                            case "SensingMethod" :
                            case "SceneCaptureType" :
                            case "SceneType" :
                            case "CustomRendered" :
                            case "WhiteBalance" :
                            case "GainControl" :
                            case "Contrast" :
                            case "Saturation" :
                            case "Sharpness" :
                            case "SubjectDistanceRange" :
                            case "FileSource" :
                                exifData[tag] = this.tags.StringValues[tag][exifData[tag]];
                                break;

                            case "ExifVersion" :
                            case "FlashpixVersion" :
                                exifData[tag] = String.fromCharCode(exifData[tag][0], exifData[tag][1], exifData[tag][2], exifData[tag][3]);
                                break;

                            case "ComponentsConfiguration" :
                                exifData[tag] =
                                    this.tags.StringValues.Components[exifData[tag][0]] +
                                    this.tags.StringValues.Components[exifData[tag][1]] +
                                    this.tags.StringValues.Components[exifData[tag][2]] +
                                    this.tags.StringValues.Components[exifData[tag][3]];
                                break;
                        }
                        tags[tag] = exifData[tag];
                    }
                }
            }

            if (tags.GPSInfoIFDPointer) {
                gpsData = this.readTags(dataView, tiffOffset, tiffOffset + tags.GPSInfoIFDPointer, this.tags.GPS, bigEnd);
                for (tag in gpsData) {
                    switch (tag) {
                        case "GPSVersionID" :
                            gpsData[tag] = gpsData[tag][0] + "." + gpsData[tag][1] + "." + gpsData[tag][2] + "." + gpsData[tag][3];
                            break;
                    }
                    tags[tag] = gpsData[tag];
                }
            }

            return tags;
        },

        readIPTCData: function(dataView, startOffset, sectionLength) {
            var IptcFieldMap = {
                0x78: 'caption',
                0x6E: 'credit',
                0x19: 'keywords',
                0x37: 'dateCreated',
                0x50: 'byline',
                0x55: 'bylineTitle',
                0x7A: 'captionWriter',
                0x69: 'headline',
                0x74: 'copyright',
                0x0F: 'category'
            };

            var data = {};
            var fieldValue, fieldName, dataSize, segmentType, segmentSize;
            var segmentStartPos = startOffset;
            while (segmentStartPos < startOffset + sectionLength) {
                if (dataView.getUint8(segmentStartPos) === 0x1C && dataView.getUint8(segmentStartPos + 1) === 0x02) {
                    segmentType = dataView.getUint8(segmentStartPos + 2);
                    if (segmentType in IptcFieldMap) {
                        dataSize = dataView.getInt16(segmentStartPos + 3);
                        segmentSize = dataSize + 5;
                        fieldName = IptcFieldMap[segmentType];
                        fieldValue = this.getStringFromDB(dataView, segmentStartPos + 5, dataSize);
                        // Check if we already stored a value with this name
                        if (data.hasOwnProperty(fieldName)) {
                            // Value already stored with this name, create multivalue field
                            if (data[fieldName] instanceof Array) {
                                data[fieldName].push(fieldValue);
                            }
                            else {
                                data[fieldName] = [data[fieldName], fieldValue];
                            }
                        }
                        else {
                            data[fieldName] = fieldValue;
                        }
                    }
                }
                segmentStartPos++;
            }
            return data;
        },

        readTags: function(dataView, tiffStart, dirStart, strings, bigEnd) {
            var entries = dataView.getUint16(dirStart, !bigEnd),
                tags = {},
                entryOffset, tag,
                i;

            for (i = 0; i < entries; i++) {
                entryOffset = dirStart + i * 12 + 2;
                tag = strings[dataView.getUint16(entryOffset, !bigEnd)];
                if (!tag) console.log("Unknown tag: " + dataView.getUint16(entryOffset, !bigEnd));
                tags[tag] = this.readTagValue(dataView, entryOffset, tiffStart, dirStart, bigEnd);
            }
            return tags;
        },
        readTagValue: function(file, entryOffset, tiffStart, dirStart, bigEnd) {
            var type = file.getUint16(entryOffset + 2, !bigEnd),
                numValues = file.getUint32(entryOffset + 4, !bigEnd),
                valueOffset = file.getUint32(entryOffset + 8, !bigEnd) + tiffStart,
                offset,
                vals, val, n,
                numerator, denominator;

            switch (type) {
                case 1: // byte, 8-bit unsigned int
                case 7: // undefined, 8-bit byte, value depending on field
                    if (numValues == 1) {
                        return file.getUint8(entryOffset + 8, !bigEnd);
                    } else {
                        offset = numValues > 4 ? valueOffset : (entryOffset + 8);
                        vals = [];
                        for (n = 0; n < numValues; n++) {
                            vals[n] = file.getUint8(offset + n);
                        }
                        return vals;
                    }

                case 2: // ascii, 8-bit byte
                    offset = numValues > 4 ? valueOffset : (entryOffset + 8);
                    return this.getStringFromDB(file, offset, numValues - 1);

                case 3: // short, 16 bit int
                    if (numValues == 1) {
                        return file.getUint16(entryOffset + 8, !bigEnd);
                    } else {
                        offset = numValues > 2 ? valueOffset : (entryOffset + 8);
                        vals = [];
                        for (n = 0; n < numValues; n++) {
                            vals[n] = file.getUint16(offset + 2 * n, !bigEnd);
                        }
                        return vals;
                    }

                case 4: // long, 32 bit int
                    if (numValues == 1) {
                        return file.getUint32(entryOffset + 8, !bigEnd);
                    } else {
                        vals = [];
                        for (n = 0; n < numValues; n++) {
                            vals[n] = file.getUint32(valueOffset + 4 * n, !bigEnd);
                        }
                        return vals;
                    }

                case 5:    // rational = two long values, first is numerator, second is denominator
                    if (numValues == 1) {
                        numerator = file.getUint32(valueOffset, !bigEnd);
                        denominator = file.getUint32(valueOffset + 4, !bigEnd);
                        val = new Number(numerator / denominator);
                        val.numerator = numerator;
                        val.denominator = denominator;
                        return val;
                    } else {
                        vals = [];
                        for (n = 0; n < numValues; n++) {
                            numerator = file.getUint32(valueOffset + 8 * n, !bigEnd);
                            denominator = file.getUint32(valueOffset + 4 + 8 * n, !bigEnd);
                            vals[n] = new Number(numerator / denominator);
                            vals[n].numerator = numerator;
                            vals[n].denominator = denominator;
                        }
                        return vals;
                    }

                case 9: // slong, 32 bit signed int
                    if (numValues == 1) {
                        return file.getInt32(entryOffset + 8, !bigEnd);
                    } else {
                        vals = [];
                        for (n = 0; n < numValues; n++) {
                            vals[n] = file.getInt32(valueOffset + 4 * n, !bigEnd);
                        }
                        return vals;
                    }

                case 10: // signed rational, two slongs, first is numerator, second is denominator
                    if (numValues == 1) {
                        return file.getInt32(valueOffset, !bigEnd) / file.getInt32(valueOffset + 4, !bigEnd);
                    } else {
                        vals = [];
                        for (n = 0; n < numValues; n++) {
                            vals[n] = file.getInt32(valueOffset + 8 * n, !bigEnd) / file.getInt32(valueOffset + 4 + 8 * n, !bigEnd);
                        }
                        return vals;
                    }
            }
        },

        getStringFromDB: function(buffer, start, length) {
            var outstr = "";
            for (var n = start; n < start + length; n++) {
                outstr += String.fromCharCode(buffer.getUint8(n));
            }
            return outstr;
        },
        pretty: function (data) {
            var a,
                strPretty = "";
            for (a in data) {
                if (data.hasOwnProperty(a)) {
                    if (typeof data[a] == "object") {
                        if (data[a] instanceof Number) {
                            strPretty += a + " : " + data[a] + " [" + data[a].numerator + "/" + data[a].denominator + "]\r\n";
                        } else {
                            strPretty += a + " : [" + data[a].length + " values]\r\n";
                        }
                    } else {
                        strPretty += a + " : " + data[a] + "\r\n";
                    }
                }
            }
            return strPretty;
        }
    };
    return ExifReader;
});