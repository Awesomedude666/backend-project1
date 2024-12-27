import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs' // default library in nodejs (file system) (no need to install)

cloudinary.config({ 
    cloud_name: 'process.env.CLOUDINARY_CLOUD_NAME', 
    api_key: 'process.env.CLOUDINARY_API_KEY', 
    api_secret: 'process.env.CLOUDINARY_API_SECRET',
});



const uploadOnCloudinary = async(localFilePath)=>{
    try{
        if(!localFilePath) return null;
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: 'auto',
        })
        // file has been uploaded
        fs.unlinkSync(localFilePath);// done synchronously because after completion of this only we need to proceed furthur.
        return response;
    }catch{ // if file is not uploaded successfully , then we need to remove it form our server
        fs.unlinkSync(localFilePath);
        return null;
    }
}

export default uploadOnCloudinary;


// we do uploading process in 2 steps . first we collect user file and put in on our server and then 
// upload it to cloudinary so that if there is any issue we can handle it on our server side