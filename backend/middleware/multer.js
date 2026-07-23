 import multer from "multer";
 import path from "path";
 import fs from "fs";

  const uploadDir =  "upload";
  if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
  }


  const storage = multer.diskStorage({
    destination: function(req,file,cb) {
        cb(null, uploadDir)
    },
    filename: function(req, file, cb){
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + path.extname(file.originalname))
    },

  });

  const fileFilter = (req, file, cb) => {
 if(
    file.mimetype === "image/png" || 
     file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg" ||
       file.mimetype === "image/webp" 
 )
 {
    cb(null, true);
 }else{
    cb(new Error("only images files are allowed"), false);
 }
  };
  const upload = multer({
    storage,
    fileFilter,
    limits: {
        fieldSize: 5 * 1024 *1024 //5 mb
    },
  });

  export default upload;