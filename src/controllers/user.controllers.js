import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/apiError.js';
import { User } from '../models/user.models.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import ApiResponse from '../utils/ApiResponse.js';




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

    if(!username || !email){
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


export{
    registerUser,
    loginUser,
    logoutUser,
}
