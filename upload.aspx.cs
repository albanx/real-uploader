using System;
using System.Data;
using System.Configuration;
using System.Collections;
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

public partial class upload : System.Web.UI.Page
{
    protected void Page_Load(object sender, EventArgs e)
    {   
        /************************************************************************
         * Email configuration
         * **********************************************************************/
        bool send_email         = false;                //enable email notification
        string main_receiver    = "albanx@gmail.com";   //who receive the email
        string cc               = "";                   //other receivers in cc
        string from             = "from@ajaxupload.com";//who appear in the from field
        /*****************************************************************************/


        /***********************************************************************************************************
         * RECOMMENDED CONFIGURATION HERE
         * The following parameters can be changed, and is reccomended to change them from here for security reason
         ***********************************************************************************************************/
        string upload_path      = Server.MapPath(string.IsNullOrEmpty(Request.Params["ax-file-path"]) ? "" : Request.Params["ax-file-path"]);
        string max_file_size    = string.IsNullOrEmpty(Request.Params["ax-max-file-size"]) ? "10M" : Request.Params["ax-max-file-size"];
        string allow_ext_req    = string.IsNullOrEmpty(Request.Params["ax-allow-ext"]) ? "" : Request.Params["ax-allow-ext"];
        string[] allow_ext      = (allow_ext_req.Length > 0) ? allow_ext_req.Split('|') : new string[0];
		bool allow_delete 		= true;
        /**********************************************************************************************************/


        /************************************************************************************************************
        * Settings for thumbnail generation, can be changed here or from js
        ************************************************************************************************************/
        int thumb_height        = string.IsNullOrEmpty(Request.Params["ax-thumbHeight"]) ? 0 : Convert.ToInt32(Request.Params["ax-thumbHeight"]);
        int thumb_width         = string.IsNullOrEmpty(Request.Params["ax-thumbWidth"]) ? 0 : Convert.ToInt32(Request.Params["ax-thumbWidth"]);
        string thumb_post_fix   = string.IsNullOrEmpty(Request.Params["ax-thumbPostfix"]) ? "_thumb" : Request.Params["ax-thumbPostfix"];
        string thumb_path       = string.IsNullOrEmpty(Request.Params["ax-thumbPath"]) ? "" : Request.Params["ax-thumbPath"];
        string thumb_format     = string.IsNullOrEmpty(Request.Params["ax-thumbFormat"]) ? "png" : Request.Params["ax-thumbFormat"];
        /**********************************************************************************************************/

        /********************************************************************************************************
        * HTML5 UPLOAD PARAMETERS, NOT TO CHANGE 
        ********************************************************************************************************/
        string file_name    = string.IsNullOrEmpty(Request.Params["ax-file-name"]) ? "" : Request.Params["ax-file-name"];
        int curr_byte       = string.IsNullOrEmpty(Request.Params["ax-start-byte"]) ? 0 : Convert.ToInt32(Request.Params["ax-start-byte"]);
        int full_size       = string.IsNullOrEmpty(Request.Params["ax-file-size"]) ? 0 : Convert.ToInt32(Request.Params["ax-file-size"]);
        string is_last      = string.IsNullOrEmpty(Request.Params["ax-last-chunk"]) ? "true" : Request.Params["ax-last-chunk"];
        bool is_ajax        = (!string.IsNullOrEmpty(Request.Params["ax-last-chunk"]) && !string.IsNullOrEmpty(Request.Params["ax-start-byte"]));
        /**********************************************************************************************************/

        /*
        * Create upload path if do not exits
        */
        if (!System.IO.File.Exists(upload_path))
        {
            System.IO.Directory.CreateDirectory(upload_path);
        }

        /*
        * Create thumb path if do not exits
        */
        if (!System.IO.File.Exists(thumb_path) && thumb_path.Length > 0)
        {
            System.IO.Directory.CreateDirectory(thumb_path);
        }
        else
        {
            thumb_path = upload_path;
        }

        //Start upload controls
        file_name = string.IsNullOrEmpty(file_name) ? Request.Files[0].FileName : file_name;


		if( !string.IsNullOrEmpty(Request.Params["ax-check-file"]) )
		{
			if(System.IO.File.Exists(upload_path + file_name))
			{
				Response.Write("yes");
			}
			else
			{
				Response.Write("no");
			}
			return;
		}
		
		if(!string.IsNullOrEmpty(Request.Params["ax-delete-file"]) && allow_delete)
		{
			System.IO.File.Delete(upload_path + file_name);
			Response.Write("1");
			return;
		}
		
        full_size = (full_size > 0) ? full_size : Request.Files[0].ContentLength;
        //check file size
        if (!checkSize(full_size, max_file_size))
        {
            Response.Write(@"{""name"":""" + file_name + @""",""size"":""" + full_size.ToString() + @""",""status"":""-1"",""info"":""Max file size execced""}");
            return;
        }


        //check file name
        string tmp_fn = file_name;
        file_name = checkName(file_name);
        if (file_name.Length == 0)
        {
            Response.Write(@"{""name"":""" + tmp_fn + @""",""size"":""" + full_size.ToString() + @""",""status"":""-1"",""info"":""File name not allowed""}");
            return;
        }

        //check file ext
        if (!checkExt(file_name, allow_ext))
        {
            Response.Write(@"{""name"":""" + file_name + @""",""size"":""" + full_size.ToString() + @""", ""status"":""-1"", ""info"":""File extension not allowed"", ""byte"":"""+curr_byte.ToString()+@"""}");
            return;
        }

        string full_path = "";
        if (is_ajax)
        {
            //calculate path and file exists only on the first chunk
            full_path = (curr_byte==0)? checkFileExists(file_name, upload_path) : upload_path+file_name;

            //append data flag
            FileMode flag = (curr_byte==0) ? FileMode.Create : System.IO.FileMode.Append;
            FileStream fileStream = new FileStream(full_path, flag, System.IO.FileAccess.Write, System.IO.FileShare.None);
            byte[] bytesInStream;
            if (Request.Files.Count > 0)
            {
                HttpPostedFile file = Request.Files[0];
                bytesInStream = new byte[file.ContentLength];
                file.InputStream.Read(bytesInStream, 0, (int)bytesInStream.Length);
            }
            else
            {
                bytesInStream = new byte[Request.InputStream.Length];
                Request.InputStream.Read(bytesInStream, 0, (int)bytesInStream.Length);
            }

            fileStream.Write(bytesInStream, 0, bytesInStream.Length);
            fileStream.Close();
            if (!is_last.Equals("true"))
                Response.Write(@"{""name"":""" + System.IO.Path.GetFileName(full_path) + @""",""size"":""" + full_size.ToString() + @""",""status"":""1"",""info"":""File chunk uploaded"", ""byte"":"""+curr_byte.ToString()+@"""} ");
        }
        else
        {
            is_last = "true";
            full_path = checkFileExists(file_name, upload_path);
            try
            {
                HttpPostedFile file = Request.Files[0];
                file.SaveAs(full_path);
            }
            catch (Exception ex)
            {
                Response.Write(@"{""name"":""" + System.IO.Path.GetFileName(full_path) + @""",""size"":""" + full_size.ToString() + @""",""status"":""-1"",""info"":""Generi error:"+ex.Message+@"""}");
                return;
            }
        }

        if (is_last.Equals("true"))
        {
            createThumb(full_path, thumb_path, thumb_post_fix, thumb_width, thumb_height, thumb_format);
            Response.Write(@"{""name"":""" + System.IO.Path.GetFileName(full_path) + @""",""size"":""" + full_size.ToString() + @""",""status"":""1"",""info"":""File uploaded""}");
        }
    }

    public string createThumb(string filepath, string thumbPath, string postfix, int maxw, int maxh, string format)
    {
        if (maxw <= 0 && maxh <= 0)
	    {
		    return "No valid width or height given";
	    }

        string[] web_formats = new string[] {"jpg", "png", "jpeg", "gif"};


        //get file extension to check if can do the preview
        string file_ext	    = Path.GetExtension(filepath).Replace(".", "");
        string file_name    = Path.GetFileNameWithoutExtension(filepath);

        //if format is not set then set thumbnail format as file extension
        if (format.Length == 0) format = file_ext;


        if (Array.IndexOf(web_formats, format.ToLower())<0)
        {
            return "No valid supported image file";
        }

        //and create thumbnail name
        string thumb_name = file_name + postfix + "." + format;

        
        //if I have not set any path for thumbnail generation then save same as file path
		if(thumbPath.Length==0)
	    {
		    thumbPath=Path.GetDirectoryName(filepath);	
	    }
        
        //add final slash to thumb path
        if(!thumbPath[thumbPath.Length-1].Equals(@"\") || !thumbPath[thumbPath.Length-1].Equals("/"))
        {
            thumbPath+=Path.DirectorySeparatorChar;
        }

        //create the preview propotionally respecting maxw and maxh
	    System.Drawing.Image img = System.Drawing.Image.FromFile(filepath);

        double ratioX     = (double)maxw/img.Width;
        double ratioY     = (double)maxh/img.Height;
        double ratio      = (double)Math.Min(ratioX, ratioY);
        ratio           = (ratio==0)? (double) Math.Max(ratioX,ratioY):ratio;

        int newW        = (int)(img.Width*ratio);
        int newH        = (int)(img.Height*ratio);

		/*Response.Write(img.Width );
		 Response.Write(newW );
		 Response.Write(newH );*/
		Bitmap newImg = new Bitmap(newW, newH);
		Graphics graphic = Graphics.FromImage(newImg);
		graphic.InterpolationMode = InterpolationMode.HighQualityBicubic;
		graphic.SmoothingMode = SmoothingMode.HighQuality;
		graphic.PixelOffsetMode = PixelOffsetMode.HighQuality;
		graphic.CompositingQuality = CompositingQuality.HighQuality;
		graphic.DrawImage(img, 0, 0, newW, newH);

        //System.Drawing.Image newImg = img.GetThumbnailImage(newW, newH, null, new System.IntPtr());
        switch(format)
        {
            case "png":
                newImg.Save(thumbPath+thumb_name, System.Drawing.Imaging.ImageFormat.Png);
            break;
            case "gif":
                newImg.Save(thumbPath+thumb_name, System.Drawing.Imaging.ImageFormat.Gif);
            break;
            default:
                newImg.Save(thumbPath+thumb_name, System.Drawing.Imaging.ImageFormat.Jpeg);
            break;
        }
        img.Dispose();
        newImg.Dispose();
        return "ok";
    }

    /**
     * 
     * Check if file size is allowed
     * @param unknown_type $size
     * @param unknown_type $max_file_size
     */
    public bool checkSize(int file_size, string max_file_size)
    {
        string mult = max_file_size.Substring(Math.Max(0, max_file_size.Length - 1));
        Int64 msize = Convert.ToInt32(max_file_size.Replace(mult, ""));
        Int64 max_size;

        switch (mult)
        {
            case "T":
                max_size = msize * 1024*1024*1024*1024;break;
            case "G":
                max_size = msize * 1024*1024*1024;break;
            case "M":
                max_size = msize * 1024*1024;break;
            case "K":
                max_size = msize * 1024;break;
            default:
                max_size = 4 * 1024 * 1024;break;
        }

        if (file_size > max_size)
        {
            return false;
        }
        return true;
    }

    /**
     * Check if filename is allowed
     */
    public string checkName(string filename)
    {
        string[] windowsReserved = new string[] { "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9" };
        string[] badWinChars = new string[] { "<", ">", ":", @"\", "/", "|", "?", "*" };

        for (int i = 0; i < badWinChars.Length; i++)
        {
            filename.Replace(badWinChars[i], "");
        }
        //check if legal windows file name
        if (Array.IndexOf(windowsReserved, filename) >= 0)
        {
            return "";
        }
        return filename;
    }

    public bool checkExt(string filename, string[] allow_ext)
    {
        string file_ext = System.IO.Path.GetExtension(filename).Replace(".", "");
        file_ext = file_ext.ToLower();

        string[] deny_ext = new string[] {"php", "php3", "php4", "php5", "phtml", "exe", "pl", "cgi", "html", "htm", "js", "asp", "aspx", "bat", "sh", "cmd" };

        if (Array.IndexOf(deny_ext, file_ext) >= 0)
        {
            return false;
        }

        if (Array.IndexOf(allow_ext, file_ext) < 0 && allow_ext.Length > 0)
        {
            return false;
        }

        return true;
    }

    public string checkFileExists(string filename, string upload_path)
    {
        string file_ext     = System.IO.Path.GetExtension(filename).Replace(".", "");
        string file_base    = System.IO.Path.GetFileNameWithoutExtension(filename);
        string full_path    = upload_path + filename;

        //avoid file override, check if file exists and generate another name
        //to override file with same name just disable this while
        int c = 0;
        while (System.IO.File.Exists(full_path))
        {
            c++;
            filename = file_base + "(" + c.ToString() + ")." + file_ext;
            full_path = upload_path + filename;
        }
        return full_path;
    }
}