import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/apiError.js';
import { User } from '../models/user.models.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import ApiResponse from '../utils/ApiResponse.js';

const registerUser = asyncHandler( async (req,res) =>{
    // get user details from frontend
    // validate details (not empty)
    // check if user already exists : username,email
    // check for images,check for avatar
    // upload them to cloudinary,avatar check
    // create user object - create entry in db
    // remove password(encrypted) and refresh token from the response
    // check for user creation
    // return response

    const {fullName,email,username,password} = req.body     //req.body has all the information from the frontend in this way 
    // but if we handle it directly we cannot handle files. so for that we go to routes and directly use the multer middleware.

   if(
    [fullName,email,username,password].some((field)=>field?.trim() === "") // if any of the fields are empty
   ){
    throw new ApiError(400,"Please fill all the fields");
   }

   //now for checking whether user already exists or not ,
   // we will use the findOne (similar to find) method of the model
   const existedUser =  User.findOne({
    $or: [{email},{username}]  //this find the user with the email or username
   })

   if(existedUser){
    throw new ApiError(409,"User with email or username already exists");
   }

   //as we have added the middleware in the user.routes, for images , multer gives access to req.files
   const avatarLocalPath = req.files?.avatar[0]?.path
   const coverImageLocalPath = req.files?.coverImage[0]?.path

   //in the first object , avatar[0] we can have path in which multer has stored in our server.

   if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required");
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   if(!avatar){
    throw new ApiError(400,"Avatar file is required");
   }

   //to create user object , we will use the create method of the model

   const user = await User.create(
    {
        fullName,
        avatar :avatar.url,
        coverImage:coverImage?.url || "",
        email,
        username:username.toLowercase(),
        password,
    }
   )

   //as we are interacting with the database, we may get errors and also it takes time.
   //we dont worry about error because we have asyncHandler function which deals with promises.
   //as time taking process we use await.
   //stored in db with object named user.
   //if this user is cerated successfully , mongodb creates an _id for every entry
   // to check that : 
   //select , by default selects all the fields of the collection. we need to specify which fields are not required,by - sign.

   const createdUser = User.findById(user._id).select(
    "-password -refreshToken"
   )

   if(!createdUser){
    throw new ApiError(404,"Something went wrong while registering the user");
   }

   return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered Successfully")
   )

   //createdUser is the data.


})


export default registerUser;

// we used async here in the registerUSer function , so it returns a promise . 
//and async handler resolves or rejects the promise.
// we dont need to do that every time here .Thats the use of asyncHandler
//here async(req,res) is the function that is passed into asyncHandler
// the next parameter is included in asyncHandlers inner function.
//it is not explicitly used here
//when requestHandler is called, it passes req,res,next to registerUser
//even though next is not used in register user , it is still available for error handling


