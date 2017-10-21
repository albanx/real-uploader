using System;
using System.Data;
using System.Configuration;
using System.Collections;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using System.Web.UI.HtmlControls;
using System.IO;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Security.Cryptography;
using System.Web.Script.Serialization;

public class RealUploader
{
    private string fileName;
    private string tempFileName;
    private int fileSize = 0;
    private string uploadPath;
    private string tempPath;
    private string[] allowExtensions = new string[0];
    private string[] denyExtensions;
    private int maxFileSize = 10485760; //10M
    private bool overrideFile = false;
    private string allowCrossOrigin = "";
    private string clientMd5 = "";
    private bool checkMd5 = false;
    private IDictionary checkSumMsg = new Dictionary<string, string>();

    HttpRequest Request = HttpContext.Current.Request;
    HttpResponse Response = HttpContext.Current.Response;

    public RealUploader()
    {
        checkSumMsg.Add("success", "1");
        checkSumMsg.Add("message", "disabled");
        checkSumMsg.Add("serverMd5", "");
        checkSumMsg.Add("clientMd5", "");
        setUploadPath("d:/uploads");

        if (!string.IsNullOrEmpty(Request.Params["ax-file-name"])) {
            fileName = Request.Params["ax-file-name"];
        }

        if (!string.IsNullOrEmpty(Request.Params["ax-temp-name"])) {
            tempFileName = Request.Params["ax-temp-name"];
        }

        if (!string.IsNullOrEmpty(Request.Params["ax-file-size"])) {
            fileSize = Convert.ToInt32(Request.Params["ax-file-size"]);
        }

        if (!string.IsNullOrEmpty(Request.Params["ax-max-file-size"])) {
            maxFileSize = Convert.ToInt32(Request.Params["ax-max-file-size"]);
        }

        //get the file path where to upload the file
        //Hint: avoid from settings this path from JS unless in protected environment
        if (!string.IsNullOrEmpty(Request.Params["ax-file-path"])) {
            setUploadPath(Request.Params["ax-file-path"]);
        }

        if (!string.IsNullOrEmpty(Request.Params["ax-allow-ext"])) {
            string allowExtString = Request.Params["ax-allow-ext"];
            allowExtensions = (allowExtString.Length > 0) ? allowExtString.Split('|') : new string[0];
        }

        if (!string.IsNullOrEmpty(Request.Params["ax-file-md5"])) {
            clientMd5 = Request.Params["ax-file-md5"];
        }

        overrideFile = !string.IsNullOrEmpty(Request.Params["ax-override"]);
        checkMd5 = !string.IsNullOrEmpty(Request.Params["ax-md5checksum"]);
        tempPath = System.IO.Path.GetTempPath();
        denyExtensions = new string[] {"php", "php3", "php4", "php5", "phtml", "exe", "pl", "cgi", "html", "htm", "js", "asp", "aspx", "bat", "sh", "cmd" };
    }

        /**
     * Set and create the upload path
     *
     * @param $uploadPath
     */
    public void setUploadPath(string uploadPath)
    {
        this.uploadPath = uploadPath;
        try {
            if(!Directory.Exists(uploadPath)) {
                DirectoryInfo di = Directory.CreateDirectory(uploadPath);
            }
        } catch(Exception e) {
            Console.WriteLine("The process failed: {0}", e.ToString());
        }

    }

    /**
     * 
     * Check if file size is allowed
     * @param unknown_type $size
     * @param unknown_type $max_file_size
     */
    public bool checkSize()
    {
        if (fileSize > maxFileSize)
        {
            return false;
        }
        return true;
    }

    public bool checkName()
    {
        string[] windowsReserved = new string[] { "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9" };
        string[] badWinChars = new string[] { "<", ">", ":", @"\", "/", "|", "?", "*" };

        for (int i = 0; i < badWinChars.Length; i++)
        {
            fileName.Replace(badWinChars[i], "");
        }
        //check if legal windows file name
        if (Array.IndexOf(windowsReserved, fileName) >= 0)
        {
            return false;
        }
        return true;
    }

    public void checkFileExists()
    {
        string fileExt     = System.IO.Path.GetExtension(fileName).Replace(".", "");
        string fileBase    = System.IO.Path.GetFileNameWithoutExtension(fileName);
        string fullPath    = uploadPath + fileName;

        //avoid file override, check if file exists and generate another name
        //to override file with same name just disable this while
        int c = 0;
        while (System.IO.File.Exists(fullPath))
        {
            c++;
            fileName = fileBase + "(" + c.ToString() + ")." + fileExt;
            fullPath = uploadPath + fileName;
        }
    }

    public void finish()
    {

    }

    public void doFileExists()
    {
        string msg = System.IO.File.Exists(uploadPath + fileName) ? "yes" : "no";
        message(1, msg);
    }

    public void sendHeaders()
    {
        Response.AppendHeader("Cache-Control", "no-cache, must-revalidate"); // HTTP/1.1
        Response.AppendHeader("Expires", "Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past
        Response.AppendHeader("X-Content-Type-Options", "nosniff");
        Response.AppendHeader("Content-Type", "application/json");

        //if we need to upload files across domains then enable allow origin variable with the domain value
        if (allowCrossOrigin.Length > 0) {
            Response.AppendHeader("Access-Control-Allow-Origin", allowCrossOrigin);
            Response.AppendHeader("Access-Control-Allow-Credentials", "false");
            Response.AppendHeader("Access-Control-Allow-Methods", "OPTIONS, HEAD, GET, POST, PUT, PATCH, DELETE");
            Response.AppendHeader("Access-Control-Allow-Headers", "Content-Type, Content-Range, Content-Disposition");
        }
    }


    public bool checkExt()
    {
        string fileExt = System.IO.Path.GetExtension(fileName).Replace(".", "");
        fileExt = fileExt.ToLower();

        if (Array.IndexOf(denyExtensions, fileExt) >= 0)
        {
            return false;
        }

        if (Array.IndexOf(allowExtensions, fileExt) < 0 && allowExtensions.Length > 0)
        {
            return false;
        }

        return true;
    }

    public bool checkFile()
    {
        if(!checkExt()) {
            message(-1, "File extension is not allowed");
        }

        if (!checkName()) {
            message(-1, "File name is not allowed");
        }

        if (!checkSize()) {
            message(-1, "File size not allowed: " + maxFileSize);
        }

        return true;
    }

    public void uploadFile()
    {
        if(checkFile()) {
            uploadAjax();
        }
    }

    /**
     * Main Upload method. Handle file uploads and checks
     */
    private void uploadAjax()
    {
        int currByte = string.IsNullOrEmpty(Request.Params["ax-start-byte"]) ? 0 : Convert.ToInt32(Request.Params["ax-start-byte"]);
        HttpPostedFile fileChunk = Request.Files[0];
        byte[] bytesInStream = new byte[fileChunk.ContentLength];
        fileChunk.InputStream.Read(bytesInStream, 0, (int)bytesInStream.Length);

        if (currByte == 0) {
            tempFileName = Path.GetFileName(Path.GetTempFileName());
        }

        string tempFile = tempPath + Path.DirectorySeparatorChar + tempFileName;
        string finalFile = uploadPath + Path.DirectorySeparatorChar + fileName;
        try
        {
            FileStream fileStream = new FileStream(tempFile, FileMode.Append, System.IO.FileAccess.Write, System.IO.FileShare.None);
            fileStream.Write(bytesInStream, 0, bytesInStream.Length);
            fileStream.Close();
        } catch(Exception e) {
            message(-1, "Cannot write on file, please check permissions: " + tempFile);
        }

        long currentFileSize = new FileInfo(tempFile).Length;

        if (fileSize > currentFileSize) { 
            message(1, "Chunk uploaded");
        } else {
            try {
                checkFileExists();
                File.Move(tempFile, finalFile);
                verifyMd5(finalFile);
                finish();
                message(1, "File uploaded");
            } catch(IOException e) {
                message(-1, "File move error: " + finalFile);
            }
        }
    }

    private void verifyMd5(string filePath)
    {
        if (checkMd5 && clientMd5.Length > 0) {
            var stream = File.OpenRead(filePath);
            MD5 md5Hash = MD5.Create();
            string serverMd5 = BitConverter.ToString(md5Hash.ComputeHash(stream)).Replace("-","‌​").ToLower();
            if (serverMd5.Equals(clientMd5)) {
                checkSumMsg.Add("success", "1");
                checkSumMsg.Add("message", "MD5 check correctly");
                checkSumMsg.Add("serverMd5", serverMd5);
                checkSumMsg.Add("clientMd5", clientMd5);
            } else {
                checkSumMsg.Add("success", "-1");
                checkSumMsg.Add("message", "MD5 check failed");
                checkSumMsg.Add("serverMd5", serverMd5);
                checkSumMsg.Add("clientMd5", clientMd5);
            }
        }
    }

    private void message(int status, string msg)
    {
        sendHeaders();
        IDictionary response = new Dictionary<string, string>();
        string checkSumString = new JavaScriptSerializer().Serialize(checkSumMsg);

        response.Add("name", fileName);
        response.Add("temp_name", tempFileName);
        response.Add("size", fileSize.ToString());
        response.Add("status", status.ToString());
        response.Add("checkSum", checkSumString);
        response.Add("info", msg);
        response.Add("path", uploadPath);
        string responseJson = new JavaScriptSerializer().Serialize(response);

        Response.Write(responseJson);
    }
}


public partial class upload : System.Web.UI.Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
       RealUploader uploader = new RealUploader();
       if (!string.IsNullOrEmpty(Request.Params["ax-check-file"])) {
           uploader.doFileExists();
       } else {
           uploader.uploadFile();
       }
    }
}