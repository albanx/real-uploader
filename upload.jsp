<%@ page language="java" contentType="application/json; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.util.List,
java.util.Arrays,
java.io.*,
java.util.Map,
java.util.HashMap,
javax.servlet.*,
javax.servlet.http.*,
javax.servlet.annotation.*,
javax.servlet.annotation.WebServlet,
javax.servlet.ServletException,
javax.servlet.http.HttpServlet,
javax.imageio.*,
java.awt.image.*,
java.awt.*,
java.lang.Math.*,
java.nio.file.Files,
java.nio.file.Paths,
java.security.MessageDigest" %>
<%!
/**
 *
 * PHP Real Uploader 4.0
 * @author Alban Xhaferllari
 * albanx@gmail.com
 * http://www.albanx.com/ajaxuploader
 * This JSP script handles AJAX file upload
 * Class RealAjaxUploader
 * @package RealUploader
 * remember to add allowCasualMultipartParsing="true" in tomcat/conf/context.xml:
 * <Context allowCasualMultipartParsing="true">
 */
@MultipartConfig
class RealUploader extends HttpServlet
{
    private String fileName     		= "";
    private String tempFileName       	= "";
    private int fileSize           		= 0;
    private String uploadPath         	= "";
    private String tempPath           	= "";
    private String[] allowExtensions    = null;
    private List<String> denyExtensions     = null;
    private int maxFileSize             = 10485760; //10M
    private boolean overrideFile        = false;
    private boolean allowCrossOrigin    = false;
    private String clientMd5            = "";
    private boolean checkMd5            = false;
    Map<String, String> checkSumMsg     = new HashMap<String, String>();

    private String relPath              = "";
    //store a reference to the out object and requests
    private PrintWriter out;
    private HttpServletRequest request;
    private HttpServletResponse response;

    private boolean errors = false;

    public RealUploader(HttpServletRequest request, HttpServletResponse response, String relPath)  throws ServletException, IOException
    {
        //get the printer object
        this.request    = request;
        this.response   = response;
        this.out        = response.getWriter();
        this.relPath    = relPath;

        //load the post/get parameters
        if (request.getParameterMap().containsKey("ax-file-name")) {
            this.fileName = request.getParameter("ax-file-name");
        }

        if (request.getParameterMap().containsKey("ax-temp-name")) {
            this.tempFileName = request.getParameter("ax-temp-name");
        }

        if (request.getParameterMap().containsKey("ax-file-size")) {
            this.fileSize =  Integer.parseInt(request.getParameter("ax-file-size"));
        }

        if (request.getParameterMap().containsKey("ax-file-path")) {
            String uploadPath = request.getParameter("ax-file-path");
            //clean path from the final slash if present, to avoid double separators
            if (uploadPath.length() > 0 && (uploadPath.endsWith( "/" ) || uploadPath.endsWith( "\\" ) ) ) {
                uploadPath = uploadPath.substring(0, uploadPath.length()-1);
            }

            this.setUploadPath(uploadPath);
        }

        if (request.getParameterMap().containsKey("ax-allow-ext")) {
            String allowExts        = request.getParameter("ax-allow-ext");
            if(allowExts != null && allowExts.length() != 0){
                this.setAllowExt( allowExts.split("\\|", -1) );
            }
        }

        if (request.getParameterMap().containsKey("ax-override")) {
            this.overrideFile = true;
        }

        //if this option is set then check the md5 by comparing the value calculated client side with the one
        //calculated server side. This verifies files consistency
        if ( request.getParameterMap().containsKey("ax-md5checksum") ) {
            this.checkMd5 = true;
        }

        //get the md5 calculated on client side
        if ( request.getParameterMap().containsKey("ax-file-md5") ) {
            this.clientMd5 = request.getParameter("ax-file-md5");
        }

        //get the temporary directory for the file upload
        this.tempPath = System.getProperty("java.io.tmpdir");

        //default deny extensions to upload
        this.denyExtensions = Arrays.asList("php", "php3", "php4", "php5", "phtml", "exe", "pl", "cgi", "html", "htm", "js", "asp",
        "aspx", "bat", "sh", "cmd", "jsp");

        //default values for
        this.checkSumMsg.put("success", "1");
        this.checkSumMsg.put("message","disabled");
        this.checkSumMsg.put("serverMd5","");
        this.checkSumMsg.put("clientMd5","");
    }

    public boolean hasErrors() {
        return this.errors;
    }
    /**
     * Set the maximum file size allowed
     */
    public void setMaxFileSize(Integer val) {
        this.maxFileSize = val;
    }

    /**
     * Set the allowed extensions parameters
     */
    public void setAllowExt(String[] val) {
        this.allowExtensions = val;
    }

     /**
     * Set and create the upload path
     */
    public void setUploadPath(String uploadPath)
    {
        this.uploadPath = this.relPath + File.separator + uploadPath;
        this.errors     = !this.makeDir(this.uploadPath);
    }

    /**
     * Create a directory and handles errors
     */
    private boolean makeDir(String dir) {
        File dirF       = new File(dir);
        if ( !dirF.exists() || !dirF.isDirectory() ) {
            if( !dirF.mkdirs() ) {
                return this.message(-1, "Cannot create upload folder: " + dir);
            }
        }

        return true;
    }

    private boolean createThumb() throws IOException {
        int maxHeight       = 0;
        int maxWidth        = 0;
        String postfix      = "_thumb";
        String thumbPath    = "";
        String format       = "";
        HttpServletRequest request = this.request;
        if (request.getParameterMap().containsKey("ax-thumbHeight")) {
            maxHeight = Integer.parseInt(request.getParameter("ax-thumbHeight"));
        }

        if (request.getParameterMap().containsKey("ax-thumbWidth")) {
            maxWidth = Integer.parseInt(request.getParameter("ax-thumbWidth"));
        }

        if (request.getParameterMap().containsKey("ax-thumbPostfix")) {
            postfix = request.getParameter("ax-thumbPostfix");
        }

        if (request.getParameterMap().containsKey("ax-thumbPath")) {
            thumbPath = request.getParameter("ax-thumbPath");
            //clean path from the final slash if present, to avoid double separators
            if (thumbPath.length() > 0 && (thumbPath.endsWith( "/" ) || thumbPath.endsWith( "\\" ) ) ) {
                thumbPath = thumbPath.substring(0, uploadPath.length()-1);
            }
        }

        if (request.getParameterMap().containsKey("ax-thumbFormat")) {
            format = request.getParameter("ax-thumbFormat");
        }

        if ( maxHeight<=0 && maxWidth<=0 ) {
            return false;
        }

        String fileExt  = this.getFileExt(this.fileName);
        String baseName = this.getBaseName(this.fileName);

        if(format==null || format.length() == 0) {
            format = fileExt;
        }

        if(thumbPath==null || thumbPath.length() == 0) {
            thumbPath = this.uploadPath;
        }
        this.makeDir(thumbPath);

        //supported image types
        if(!format.equals("jpg") && format.equals("png") && format.equals("gif") ) {

            return false;
        }

        //set thumb destination name
        String thumbName = baseName + postfix + "." +format;
        String finalPath = this.uploadPath + File.separator + this.fileName;
        String thumbFinalPath = thumbPath + File.separator + thumbName;
        BufferedImage bimg = ImageIO.read(new File(finalPath));
        int width          = bimg.getWidth();
        int height         = bimg.getHeight();

        if (width > 0 && height > 0) {

            float ratioX     = (float)maxWidth/width;
            float ratioY     = (float)maxHeight/height;
            float ratio      = Math.min(ratioX, ratioY);
            ratio            = (ratio==0) ? Math.max(ratioX, ratioY):ratio;
            int newWidth   = Math.round(width*ratio);
            int newHeight  = Math.round(height*ratio);

            BufferedImage thumb = new BufferedImage(Math.round(newWidth), Math.round(newHeight), BufferedImage.TYPE_INT_RGB);
            // Now scale the image using Java 2D API to the desired thumb size.
            Graphics2D graphics2D = thumb.createGraphics();
            //graphics2D.setBackground(Color.WHITE);
            //graphics2D.setPaint(Color.WHITE);
            graphics2D.fillRect(0, 0, newWidth, newHeight);
            graphics2D.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics2D.drawImage(bimg, 0, 0, newWidth, newHeight, null);

            if ( format.equals("png") ) {
                ImageIO.write(thumb, "PNG", new File(thumbFinalPath));
            } else if ( format.equals("jpg") ) {
                ImageIO.write(thumb, "JPG", new File(thumbFinalPath));
            } else if ( format.equals("gif") ) {
                ImageIO.write(thumb, "GIF", new File(thumbFinalPath));
            }
            return false;
        }
        return true;
    }


    /**
     * Check the maximum allowed file size
     * @return bool true if file size is in the current set limit
     */
    private boolean checkSize()
    {
        if (this.maxFileSize > 0 && this.fileSize > this.maxFileSize) {
            return false;
        }
        return true;
    }

    /**
     * Check if file name is allowed and remove illegal windows chars
     * @return bool
     */
    private boolean checkName()
    {
        String[] windowsReserved = new String[]{"CON", "PRN", "AUX", "NUL","COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8",
            "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"};

        //replace bad chars
        for(int i=0; i <= 31; i++){
            this.fileName = this.fileName.replace(Character.toString((char) i), "");
        }
        this.fileName = this.fileName.replaceAll("[<>:\"\\/\\|\\?*]", "");

        //check if legal windows file name
        if ( Arrays.asList(windowsReserved).contains(this.fileName) ) {
            return false;
        }
        return true;
    }

    /**
     * Check if a file exits or not and calculates a new name for not overriding other files
     */
    private void checkFileExists()
    {
        if (!this.overrideFile) {
            String fileExt = this.getFileExt(this.fileName);

            String fileName = this.fileName.substring(0, this.fileName.lastIndexOf("."));
            //Disable this lines of code to allow file override
            int fileNum = 0;
            while ( new File(this.uploadPath + File.separator + this.fileName).isFile() ) {
                fileNum++;
                this.fileName = fileName + "(" + fileNum + ")." + fileExt;
            }
        }
    }

    /**
     * Simple check if the current file exists in the server
     * @return bool true if file exists, false otherwise
     */
    public void doFileExists()
    {
        String msg = new File(this.uploadPath + File.separator + this.fileName).isFile() ? "yes" : "no";
        this.message(1, msg);
    }

     /**
     * Delete a just uploaded file
     * @return bool true if the file is deleted, false otherwise
     */
    public void deleteFile()
    {
        File file = new File(this.uploadPath + File.separator + this.fileName);
        String msg = file.delete() ? "yes" : "no";
        this.message(1, msg);
    }

    /**
    * Get File extension
    */
    private String getFileExt(String fileName) {
        int i = fileName.lastIndexOf(".");
        String fileExt = "";
        if (i > 0) {
            fileExt = fileName.substring(i+1).toLowerCase();
        }

        return fileExt;
    }

    /**
    * Get File name without extension
    */
    private String getBaseName(String fileName) {
        return fileName.substring(0, fileName.lastIndexOf("."));
    }

    /**
     * Check if file type is allowed for upload
     * @return bool
     */
    private boolean checkExt()
    {
        //get the file extension
        String fileExt = this.getFileExt(this.fileName);

        //check the deny extensions
        if ( Arrays.asList(this.denyExtensions).contains(fileExt) ) {
            return false;
        }

        //if the allowed extension list is set then, check , if it is not set then allow all extensions
        if (this.allowExtensions != null && this.allowExtensions.length > 0 && !Arrays.asList(this.allowExtensions).contains(fileExt) ) {
            return false;
        }
        return true;
    }

    /**
     * Calculates the file MD5 and compares it with the value calculated with Javascript
     * Allow to check the file consistency and verify correctness of the upload
     */
    private void verifyMd5(String filePath) {
        if (this.checkMd5 && this.clientMd5.length() > 0) {
            String serverMd5 = this.fileMd5(filePath);
            if( !serverMd5.equals(this.clientMd5) ) {
                this.checkSumMsg.put("success", "0");
                this.checkSumMsg.put("message", "MD5 check sum failed. Client MD5 is different from server MD5. File maybe have been corrupted during upload.");
                this.checkSumMsg.put("serverMd5", serverMd5);
                this.checkSumMsg.put("clientMd5", this.clientMd5);
            } else {
                this.checkSumMsg.put("success", "1");
                this.checkSumMsg.put("message", "MD5 check sum success");
                this.checkSumMsg.put("serverMd5", serverMd5);
                this.checkSumMsg.put("clientMd5", this.clientMd5);
            }
        }
    }

    private String fileMd5(String filepath) {
        try{
            MessageDigest md = MessageDigest.getInstance("MD5");
            md.update(Files.readAllBytes(Paths.get(filepath)));
            byte[] b = md.digest();
            String result = "";
            for (int i=0; i < b.length; i++) {
               result += Integer.toString( ( b[i] & 0xff ) + 0x100, 16).substring( 1 );
            }
            return result;
        } catch(Exception e) {
        }
        return "";
    }
     /**
     * Makes the check on the file, extension, size, name
     * @return bool true if file is correct, die() if there are errors
     */
    private boolean checkFile() throws ServletException, IOException
    {
        //check ext
        if ( !this.checkExt() ) {
            return this.message(-1, "File extension is not allowed");
        }

        //check name
        if (!this.checkName()) {
            return this.message(-1, "File name is not allowed. System reserved.");
        }

        //check size
        if (!this.checkSize()) {
            return this.message(-1, "File size exceeded maximum allowed: " + this.maxFileSize);
        }

        return true;
    }

    private void uploadAjax() throws IOException, ServletException
    {
        int currByte = 0;
        if (this.request.getParameterMap().containsKey("ax-start-byte")) {
            currByte = Integer.parseInt(request.getParameter("ax-start-byte"));
        }
        Part file               = this.request.getPart("ax_file_input");
        InputStream fileChunk   = file.getInputStream();
        String tempFilePath     = "";
        File tempFile            = null;

        if (currByte == 0) {
            tempFile            = File.createTempFile("axupload", ".tmp", null);
            this.tempFileName   = tempFile.getName();
            tempFilePath        = this.tempPath + File.separator + this.tempFileName;
        } else {
            tempFilePath        = this.tempPath + File.separator + this.tempFileName;
            tempFile            = new File(tempFilePath);
        }

        //write to file
        FileOutputStream fileStream = new FileOutputStream(tempFile, true);

        try {
            int read = 0;
            final byte[] bytes = new byte[1024];
            while ((read = fileChunk.read(bytes)) != -1) {
                fileStream.write(bytes, 0, read);
            }

            //if it is not the last chunk just return success chunk upload
            if (this.fileSize > tempFile.length()) {
                this.message(1, "Chunk uploaded");
            } else {
                this.checkFileExists();
                fileStream.close();
                fileChunk.close();
                String finalPath = this.uploadPath + File.separator + this.fileName;
                boolean ret = tempFile.renameTo(new File(finalPath) );

                //check file md5 if present
                this.verifyMd5(finalPath);

                if (ret) {
                    this.finish();
                    this.message(1, "File uploaded");
                } else {
                    this.message(-1, "File move error: from " + tempFilePath + " to " + finalPath);
                }
            }
        } catch(Exception e) {
            e.printStackTrace();
        } finally {
            if (fileStream != null) {
                fileStream.close();
            }
            if (fileChunk != null) {
                fileChunk.close();
            }
        }
    }

     /**
     * Public function file upload, checks every chunk of the file during upload for avoiding
     * js hackers
     */
    public void uploadFile() throws IOException, ServletException
    {
        if (this.checkFile()) {
            this.uploadAjax();
        }
    }

    /**
     * Finish function that runs only when all file chunks are uploaded
     * Any post file action should be inserted here, DB, file move or others
     * @return string eventually errors return on user functions
     */
    public void finish()
    {
        try{
            //create a thumb if data is set
            this.createThumb();
            //this.out.flush();
        } catch (Exception e) {
        }
    }

    /**
     * Simple headers for JSON validation and others
     */
    public void sendHeaders()
    {
        this.response.addHeader("Cache-Control", "no-cache, must-revalidate");
        this.response.addHeader("Expires", "Sat, 26 Jul 1997 05:00:00 GMT");
        this.response.addHeader("X-Content-Type-Options", "nosniff");
        this.response.addHeader("Content-Type",  "application/json");
    }

    private boolean message(Integer status, String msg) {
        this.sendHeaders();

        String checkSum = "{\"success\": \""+this.checkSumMsg.get("success")+"\",";
        checkSum += "\"message\": \""+this.checkSumMsg.get("message")+"\",";
        checkSum += "\"serverMd5\": \""+this.checkSumMsg.get("serverMd5")+"\",";
        checkSum += "\"clientMd5\": \""+this.checkSumMsg.get("clientMd5")+"\"}";

        String objectToReturn = "{\"name\":\""+this.fileName+"\",\"temp_name\":\""+this.tempFileName+"\",\"size\":\""+this.fileSize+"\",\"status\":"+status+", \"info\": \""+ msg.replace(File.separator, "\\" + File.separator) +"\", \"checkSum\": "+checkSum+"}";
        this.out.print(objectToReturn);
        return status > 0;
    }
}
%>
<%
    // Use the Hello class in JSP
    RealUploader uploader = new RealUploader(request, response, getServletContext().getRealPath("/"));

    /**
     * Start the upload process here with some basic settings
     */
    boolean allowDelete = false;

    if ( request.getParameterMap().containsKey("ax-check-file") ) {
        //check file request
        uploader.doFileExists();
    } else if (request.getParameterMap().containsKey("ax-delete-file") && allowDelete) {
        //delete request
        uploader.deleteFile();
    } else {
        //normal upload request
        if( !uploader.hasErrors() )
            uploader.uploadFile();
    }
%>