<?php

namespace RealUploader;

/**
 *
 * PHP Real Uploader 4.0
 * @author   Alban Xhaferllari
 * albanx@gmail.com
 * http://www.realuploader.com/
 * This PHP script handles AJAX file upload
 * It expect 1 file/chunk per time in the $_FILES
 * Class RealAjaxUploader
 * @package  RealUploader
 * @requires PHP 5.5 , supports PHP 5.4 if replace the array notation [] with  array()
 */
class RealUploader
{
    private $fileName         = '';
    private $tempFileName     = '';
    private $fileSize         = 0;
    private $uploadPath       = '';
    private $tempPath         = '';
    private $allowExtensions  = [];
    private $denyExtensions   = [];
    private $maxFileSize      = 10485760; //10M
    private $overrideFile     = false;
    private $allowCrossOrigin = false;
    private $clientMd5        = '';
    private $checkMd5         = false;
    private $checkSumMsg      = ['success' => true, 'message' => 'disabled'];

    public $uploadErrors = [
        UPLOAD_ERR_OK => "No errors.",
        UPLOAD_ERR_INI_SIZE => "The uploaded file exceeds the upload_max_filesize directive in php.ini",
        UPLOAD_ERR_FORM_SIZE => "Larger than form maxFileSize.",
        UPLOAD_ERR_PARTIAL => "Partial upload.",
        UPLOAD_ERR_NO_FILE => "No file.",
        UPLOAD_ERR_NO_TMP_DIR => "No temporary directory.",
        UPLOAD_ERR_CANT_WRITE => "Can't write to disk.",
        UPLOAD_ERR_EXTENSION => "File upload stopped by extension."
    ];

    /**
     * RealUploader constructor.
     * Get the input information from GET/POST and filters them
     */
    public function __construct()
    {
        //make a sanitize to the file names to avoid any path scale ../../
        if (isset($_REQUEST['ax-file-name'])) {
            $this->fileName = basename($_REQUEST['ax-file-name']);
        }

        if (isset($_REQUEST['ax-temp-name'])) {
            $this->tempFileName = basename($_REQUEST['ax-temp-name']);
        }

        if (isset($_REQUEST['ax-file-size'])) {
            $this->fileSize = $_REQUEST['ax-file-size'];
        }

        //check if is set a maximum file size from client
        if (isset($_REQUEST['ax-max-file-size'])) {
            $this->setMaxFileSize($_REQUEST['ax-max-file-size']);
        }

        //get the file path where to upload the file
        //Hint: avoid from settings this path from JS unless in protected environment
        if (isset($_REQUEST['ax-file-path'])) {
            $this->setUploadPath($_REQUEST['ax-file-path']);
        }

        //get the list of the allowed extensions
        if (isset($_REQUEST['ax-allow-ext'])) {
            $extensions = !empty($_REQUEST['ax-allow-ext']) ? explode('|', $_REQUEST['ax-allow-ext']) : [];
            $this->setAllowExt($extensions);
        }

        //if this parameter is set and file exists on server then we
        //can override it
        if (isset($_REQUEST['ax-override'])) {
            $this->setOverride(true);
        }

        //if this option is set then check the md5 by comparing the value calculated client side with the one
        //calculated server side. This verifies files consistency
        if (isset($_REQUEST['ax-md5checksum'])) {
            $this->checkMd5 = true;
        }

        //get the md5 calculated on client side
        if (isset($_REQUEST['ax-file-md5'])) {
            $this->clientMd5 = $_REQUEST['ax-file-md5'];
        }

        //get the temporary file system directory from ini configuration
        //if not set in ini file then get it with system function
        $iniTmpDir      = ini_get('upload_tmp_dir');
        $this->tempPath = ($iniTmpDir ? $iniTmpDir : sys_get_temp_dir()) . '/';

        //set deny extensions by default
        $this->denyExtensions = [
            'php',
            'php3',
            'php4',
            'php5',
            'phtml',
            'exe',
            'pl',
            'cgi',
            'html',
            'htm',
            'js',
            'asp',
            'aspx',
            'bat',
            'sh',
            'cmd',
            'jsp'
        ];
    }

    /**
     * Set the maximum file size allowed
     *
     * @param int $maxFileSize
     */
    public function setMaxFileSize($maxFileSize = 10000000)
    {
        $this->maxFileSize = $maxFileSize;
    }


    /**
     * Set the allowed extensions parameters
     *
     * @param array $allow_ext
     */
    public function setAllowExt($allow_ext = [])
    {
        $this->allowExtensions = $allow_ext;
    }

    /**
     * Set and create the upload path
     *
     * @param $uploadPath
     */
    public function setUploadPath($uploadPath)
    {
        $this->uploadPath = rtrim($uploadPath, '\\/');
        $this->makeDir($this->uploadPath);
    }

    /**
     * Set the override
     *
     * @param $bool
     */
    public function setOverride($bool)
    {
        $this->overrideFile = $bool;
    }

    /**
     * Create a directory and handles errors
     *
     * @param $dir
     */
    private function makeDir($dir)
    {
        // Create thumb path if do not exits
        if (!file_exists($dir) && !empty($dir)) {
            $done = @mkdir($dir, 0777, true);
            if (!$done) {
                $this->message(-1, 'Cannot create upload folder: ' . $dir);
            }
        }
    }

    /**
     * Server side thumbnail create with PHP
     *
     * @param int $quality quality of thumbnail range 0-100
     *
     * @return bool =false if image is not supported, true if is ok
     */
    private function createThumbGD($quality = 75)
    {
        $maxHeight  = isset($_REQUEST['ax-thumbHeight']) ? $_REQUEST['ax-thumbHeight'] : 0;
        $maxWidth   = isset($_REQUEST['ax-thumbWidth']) ? $_REQUEST['ax-thumbWidth'] : 0;
        $postfix    = isset($_REQUEST['ax-thumbPostfix']) ? $_REQUEST['ax-thumbPostfix'] : '_thumb';
        $thumbPath  = isset($_REQUEST['ax-thumbPath']) ? $_REQUEST['ax-thumbPath'] : '';
        $format     = isset($_REQUEST['ax-thumbFormat']) ? $_REQUEST['ax-thumbFormat'] : 'png';
        $filePath   = $this->uploadPath . '/' . $this->fileName;
        $webFormats = ['jpg', 'jpeg', 'png', 'gif'];//file formats that can create preview with GD library
        $fileInfo   = pathinfo($filePath);

        if (($maxHeight <= 0 && $maxWidth <= 0) || !is_numeric($maxHeight) || !is_numeric($maxWidth)) {
            return false;
        }

        if (empty($format)) {
            $format = $fileInfo['extension'];
        }

        if (!in_array(strtolower($fileInfo['extension']), $webFormats)) {
            return false;
        }

        $thumbName = $fileInfo['filename'] . $postfix . '.' . $format;

        if (empty($thumbPath)) {
            $thumbPath = $fileInfo['dirname'];
        }

        $thumbFullPath = $thumbPath . '/' . $thumbName;

        if (!file_exists($thumbPath) && !empty($thumbPath)) {
            mkdir($thumbPath, 0777, true);
        }

        // Get new dimensions
        list($width, $height) = getimagesize($filePath);
        if ($width > 0 && $height > 0) {
            $ratioX    = $maxWidth / $width;
            $ratioY    = $maxHeight / $height;
            $ratio     = min($ratioX, $ratioY);
            $ratio     = ($ratio == 0) ? max($ratioX, $ratioY) : $ratio;
            $newWidth  = $width * $ratio;
            $newHeight = $height * $ratio;

            $thumb = imagecreatetruecolor($newWidth, $newHeight);
            $image = imagecreatefromstring(file_get_contents($filePath));
            imagecopyresampled($thumb, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

            switch (strtolower($format)) {
                case 'png':
                    imagepng($thumb, $thumbFullPath, 9);
                    break;
                case 'gif':
                    imagegif($thumb, $thumbFullPath);
                    break;
                default:
                    imagejpeg($thumb, $thumbFullPath, $quality);
                    break;
            }
            imagedestroy($image);
            imagedestroy($thumb);
            return true;
        }
        return false;
    }

    /**
     * Check the maximum allowed file size
     * @return bool true if file size is in the current set limit
     */
    private function checkSize()
    {
        if (!empty($maxFileSize) && $this->fileSize > $this->maxFileSize) {
            return false;
        }
        return true;
    }


    /**
     * Check if file name is allowed and remove illegal windows chars
     * @return bool
     */
    private function checkName()
    {
        $windowsReserved = [
            'CON',
            'PRN',
            'AUX',
            'NUL',
            'COM1',
            'COM2',
            'COM3',
            'COM4',
            'COM5',
            'COM6',
            'COM7',
            'COM8',
            'COM9',
            'LPT1',
            'LPT2',
            'LPT3',
            'LPT4',
            'LPT5',
            'LPT6',
            'LPT7',
            'LPT8',
            'LPT9'
        ];
        $badWinChars     = array_merge(array_map('chr', range(0, 31)), ["<", ">", ":", '"', "/", "\\", "|", "?", "*"]);

        $this->fileName = str_replace($badWinChars, '', $this->fileName);

        //check if legal windows file name
        if (in_array($this->fileName, $windowsReserved)) {
            return false;
        }
        return true;
    }

    /**
     * Check if a file exits or not and calculates a new name for not overriding other files
     */
    private function checkFileExists()
    {
        if (!$this->overrideFile) {
            //set a random stop to allow the file system to read any new file on parallel upload
            usleep(rand(100, 900));
            $fileInfo = pathinfo($this->fileName);
            $fileName = $fileInfo['filename'];
            $fileExt  = $fileInfo['extension'];

            //tries to rename file to avoid override:
            //file.ext to file(1).ext file(2).ext ....
            while (file_exists($this->uploadPath . '/' . $this->fileName)) {
                $find = preg_match('/\(([0-9]+)\)/', $this->fileName, $match);
                if (!$find) {
                    $match[1] = 0;
                } else {
                    $fileName = str_replace("(" . $match[1] . ")", "", $fileName);
                }

                $match[1]++;
                $this->fileName = $fileName . "(" . $match[1] . ")." . $fileExt;
            }
        }
    }

    /**
     * Calculates the file MD5 and compares it with the value calculated with Javascript
     * Allow to check the file consistency and verify correctness of the upload
     *
     * @param $filePath final uploaded file
     */
    private function verifyMd5($filePath)
    {
        if ($this->checkMd5 && $this->clientMd5) {
            usleep(rand(100, 900));
            $serverMd5 = md5_file($filePath);
            if ($serverMd5 !== $this->clientMd5) {
                $this->checkSumMsg = array(
                    'success' => false,
                    'message' => 'MD5 check sum failed. Client MD5 is different from server MD5.
                                    File maybe have been corrupted during upload.',
                    'serverMd5' => $serverMd5,
                    'clientMd5' => $this->clientMd5
                );
            } else {
                $this->checkSumMsg = array(
                    'success' => true,
                    'message' => 'MD5 check correctly.',
                    'serverMd5' => $serverMd5,
                    'clientMd5' => $this->clientMd5
                );
            }
        }
    }

    /**
     * Simple check if the current file exists in the server
     * @return bool true if file exists, false otherwise
     */
    public function doFileExists()
    {
        $msg = file_exists($this->uploadPath . '/' . $this->fileName) ? 'yes' : 'no';
        $this->message(1, $msg);
    }

    /**
     * Delete a just uploaded file
     * @safe check 1: base name will not allow ../../ to scale in system a path
     * @return bool true if the file is deleted, false otherwise
     */
    public function deleteFile()
    {
        $msg = @unlink($this->uploadPath . '/' . $this->fileName) ? 'yes' : 'no';
        $this->message(1, $msg ? 'File deleted' : 'Cannot delete file');
    }

    /**
     * Check if file type is allowed for upload
     * @return bool
     */
    private function checkExt()
    {
        //get the file extension
        $extension = strtolower(pathinfo($this->fileName, PATHINFO_EXTENSION));

        //check the deny extensions
        if (in_array($extension, $this->denyExtensions)) {
            return false;
        }

        //if the allowed extension list is set then, check , if it is not set then allow all extensions
        if (count($this->allowExtensions) && !in_array($extension, $this->allowExtensions)) {
            return false;
        }
        return true;
    }

    /**
     * Makes the check on the file, extension, size, name
     * @return bool true if file is correct, die() if there are errors
     */
    private function checkFile()
    {
        //check uploads error
        if (isset($_FILES['ax_file_input'])) {
            if ($_FILES['ax_file_input']['error'] !== UPLOAD_ERR_OK) {
                $this->message(-1, $this->uploadErrors[$_FILES['ax_file_input']['error']]);
            }
        }

        //check ext
        if (!$this->checkExt()) {
            $this->message(-1, 'File extension is not allowed');
        }

        //check name
        if (!$this->checkName()) {
            $this->message(-1, 'File name is not allowed. System reserved.');
        }

        //check size
        if (!$this->checkSize()) {
            $this->message(-1, 'File size exceeded maximum allowed: ' . $this->maxFileSize);
        }
        return true;
    }

    /**
     * Main Upload method. Handle file uploads and checks
     */
    private function uploadAjax()
    {
        $currByte  = isset($_REQUEST['ax-start-byte']) ? $_REQUEST['ax-start-byte'] : 0;
        $fileChunk = file_get_contents($_FILES['ax_file_input']['tmp_name']);

        //start of the file upload, first chunk
        if ($currByte == 0) {
            $tempFile           = tempnam($this->tempPath, 'axupload');
            $this->tempFileName = basename($tempFile);
        }

        $tempFile  = $this->tempPath . '/' . $this->tempFileName;

        // some rare times (on very very fast connection), file_put_contents will be unable to write on the file,
        // so we try until it writes for a max of 5 times
        $try = 5;
        while (file_put_contents($tempFile, $fileChunk, FILE_APPEND) === false && $try > 0) {
            usleep(50);
            $try--;
        }

        //if the above fails then user cannot write file due to permission or other problems
        if (!$try) {
            $this->message(-1, 'Cannot write on file, please check permissions: ' . $tempFile);
        }

        //delete the temp chunk
        if (isset($_FILES['ax_file_input'])) {
            unlink($_FILES['ax_file_input']['tmp_name']);
        }

        //if it is not the last chunk just return success chunk upload
        if ($this->fileSize > filesize($tempFile)) {
            $this->message(1, 'Chunk uploaded');
        } else {
            $this->checkFileExists();

            //move the uploaded file from temp folder to the final destination
            $ret = @rename($tempFile, $this->uploadPath . '/' . $this->fileName);


            if ($ret) {
                //check file md5 if present
                $this->verifyMd5($this->uploadPath . '/' . $this->fileName);
                $extra_info = $this->finish();
                $this->message(1, 'File uploaded', $extra_info);
            } else {
                $this->message(-1,
                    'File move error: ' . $tempFile . ' to ' . $this->uploadPath . '/' . $this->fileName);
            }
        }
    }

    /**
     * Public function file upload, checks every chunk of the file during upload for avoiding
     * js hackers
     */
    public function uploadFile()
    {
        if ($this->checkFile()) {
            $this->uploadAjax();
        }
    }

    /**
     * Finish function that runs only when all file chunks are uploaded
     * Any post file action should be inserted here, DB, file move or others
     * @return string eventually errors return on user functions
     */
    public function finish()
    {
        ob_start();

        //create a thumb if data is set
        $this->createThumbGD(100);
        $value = ob_get_contents();
        ob_end_clean();
        return $value;
    }

    /**
     * Simple headers for JSON validation and others
     */
    public function sendHeaders()
    {
        header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
        header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past
        header('X-Content-Type-Options: nosniff');
        header('Content-Type: application/json');

        //if we need to upload files across domains then enable allow origin variable with the domain value
        if ($this->allowCrossOrigin) {
            header('Access-Control-Allow-Origin: ' . $this->allowCrossOrigin);
            header('Access-Control-Allow-Credentials: false');
            header('Access-Control-Allow-Methods: OPTIONS, HEAD, GET, POST, PUT, PATCH, DELETE');
            header('Access-Control-Allow-Headers: Content-Type, Content-Range, Content-Disposition');
        }
    }

    /**
     * Main function that interacts with javascript, returns a JSON string containing errors information
     * file status and other information
     *
     * @param Int    $status    the status of the file
     * @param String $msg       error  message or success message
     * @param string $extraInfo more info returned by the user functions
     */
    private function message($status, $msg, $extraInfo = '')
    {
        $this->sendHeaders();
        echo json_encode([
            'name' => $this->fileName,
            'temp_name' => $this->tempFileName,
            'size' => $this->fileSize,
            'status' => $status,
            'info' => $msg,
            'more' => $extraInfo,
            'checkSum' => $this->checkSumMsg
        ]);
        die();
    }
}

/**
 * Start the upload process here with some basic settings
 */
$allowDelete = true;
$uploader    = new RealUploader();  //create uploader object

if (isset($_POST['ax-check-file'])) {
    //check file request
    $uploader->doFileExists();
} elseif (isset($_POST['ax-delete-file']) && $allowDelete) {
    //delete request
    $uploader->deleteFile();
} else {
    //normal upload request
    $uploader->uploadFile();
}
