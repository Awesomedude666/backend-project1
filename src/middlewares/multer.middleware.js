import multer from 'multer'


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    //   cb(null, file.fieldname + '-' + uniqueSuffix)
         cb(null,file.originalname) // this is not a good practice to use original name bcoz there can be many files of same name 
         // and we are saving them with that same name they can be overriddden. (changed afterwards).
    }
  })
  
  export const upload = multer({ storage: storage })




// we use multer because we get access to file also.
// we use disk storage not memory storage (as it gets overloaded with large files)