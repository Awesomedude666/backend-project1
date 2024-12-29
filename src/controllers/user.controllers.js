import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import { User } from '../models/user.models.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import ApiResponse from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';




const generateAccessandRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken() // as these methods are in user schema we can use them with instance user but not with class User.
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken //added to user
        await user.save({validateBeforeSave:false})  //method to save to db but it needs all the required fields to save any data so we disabled the validation
        //as we dont want to validate again with refresh token.
        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500, "Internal Server Error while generating access and refresh tokens");
    }
}

//access token is given to the user but refresh token is also saved in our database becoz we dont want user to login again and again

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
   const existedUser =  await User.findOne({
    $or: [{email},{username}]  //this find the user with the email or username (mongodB operators (or) (and) etc...)
   })

   if(existedUser){
    throw new ApiError(409,"User with email or username already exists");
   }

   //as we have added the middleware in the user.routes, for images , multer gives access to req.files
   

   console.log('req.files:', req.files);
//    let avatarLocalPath;
   const avatarLocalPath = req.files?.avatar[0]?.path // we have checked for avatar below whether present or not and if not we threw error
//    const coverImageLocalPath = req.files?.coverImage[0]?.path // but we did not give any check for cover Image and we user coverImage variable 
   // so it may give error. so we comment this and use another method.

   let coverImageLocalPath;

   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path;  //checking if req.files exist and if it is an array and of length > 0;
   }

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

// we used async here in the registerUSer function , so it returns a promise . 
//and async handler resolves or rejects the promise.
// we dont need to do that every time here .Thats the use of asyncHandler
//here async(req,res) is the function that is passed into asyncHandler
// the next parameter is included in asyncHandlers inner function.
//it is not explicitly used here
//when requestHandler is called, it passes req,res,next to registerUser
//even though next is not used in register user , it is still available for error handling

const loginUser = asyncHandler(async (req,res) =>{
    // we take data form request body (req.body)
    // username or email
    // find the user
    // check the password
    // generate accesstoken and refreshtoken
    // send cookie
    //send response (logged in successful or not)

    const {email,username,password} = req.body

    if(!username  && !email){                   // or we can use if !(username || email)
        throw new ApiError(400,"username or email is required !");
    }

     const user = await User.findOne({
        $or : [{username},{email}] //array of objects (await as server is in another continent)
    })

    if(!user){
        throw new ApiError(404,"User doesnt exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password) //as bcrypt takes time.

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials");
    }

    const {accessToken,refreshToken} = await generateAccessandRefreshTokens(user._id)

    // we need to send cookies to the client and for that we need to send the properties of user and we dont want to send cartain fields like
    // password , refresh token etc...
    // so for that we once again find the user from the database and remove those fields and send the user to the client.

    const loggedInUser = User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,
    }

    // by default cookies have the property that they can be modified by anyone from the frontend.
    // but by using httpOnly and secure , we can prevent that. they can only be modified by the server.
    // they are seen from frontend but cannot be modified.

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
       new ApiResponse(
        200,
       {
        user: loggedInUser,accessToken,refreshToken
       },
       "User loggedIn successfully"
       )
    )

    // we are sending accessToken,refreshToken again in json even after setting in cookies bcoz if user wants to save the cookies in browser then he can save them.
    // it is a good practice.

})

const logoutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(      // another method . we can also find the userby id first and then update the refresh token.here it is done in a single go.
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true                // when returned we get the new modified field value.(undefined refresh token).
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    // we have to clear the cookies.

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(
            200,
            {},
            "user logged out"
        )
    )



})


const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken    // if refresh token is not in cookies then it is in body.(ex : mobile app)
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorised request"); 
    }

    // the token which is with the user is encrypted one. but we need the same token which is stored in our database to verify.
    // this work is done by jwt here.

    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    // this decoded refresh token is the refresh token generated by us in the start . so in that we have access to _id as we have stored it in the token.
    // so we can find the user with the _id.

    const user = await User.findById(decodedToken?._id)

    if(!user){
        throw new ApiError(401,'INVALID REFRESH TOKEN');
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401,'refresh token is expired or used')
    }

    // if both are matching . then we need to generate new tokens and send it to user through cookies.

    const options ={
        httpOnly: true,
        secure: true,
    }

    const {accessToken,newRefreshToken}  = await generateAccessandRefreshTokens(user._id)

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
        200,
        {
            accessToken,refreshToken:newRefreshToken
        },
        "Access Token refreshed"
    )

})

// access token has an expiry . so whenever it reaches the expiry time we refresh it . so that user dont need to login every time.
// we do this by using the refresh token , which can be accessed from the cookies.


const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body;

    // to change the password user should be logged in first and we check that using the middleware.
    // if auth.middleware is executed then we get req.user = user.

    // so we can access user here.

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword) // as this method is defined in user model.

    if(!isPasswordCorrect){
        throw new ApiError(400,'Invalid old password');
    }

    user.password = newPassword;
    // wew set the password but we did not save it 
    // if we save it then the pre hook is called and it will encrypt the password.
    // so we need to save it manually using save method.
    await user.save(
        {validateBeforeSave: false}   // we dont want validations again
    );

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed successfully")); 

 })

 const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"current user fetched successfully"))
 })

 const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email} = req.body;

    if(!fullName || !email){
        throw new ApiError(400,'Please provide both full name and email');
    }

    // as we do middleware before this , we have req.user

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email,
            }
        },
        {new: true} // (new:true) will return the updated user so that we can save it 
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"));

 })

 const updateUserAvatar = asyncHandler(async(req,res)=>{
    // avatar cannot be taken form body like {avatar} = req.body 
    // we need to use req.file as we injected a middleware while uploading avatar.
    const avatarLocalPath = req.file?.path // as we are talking about only one file we use file here . but previously we used upload.fields in middleware so we used req.files there.

    if(!avatarLocalPath){
        throw new ApiError(400,'Please upload an avatar');
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, 'Failed to upload avatar');
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true,
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"avatar updated successfully")
    )

 })

 const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,'Please upload a cover image');
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage.url) {
        throw new ApiError(400, 'Failed to upload cover image');
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url,
            }
        },
        { new: true }
    ).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"cover image updated successfully")
    )

 })



export{
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
}
