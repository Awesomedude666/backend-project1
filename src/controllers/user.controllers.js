import asyncHandler from '../utils/asynchandler.js';

const registerUser = asyncHandler( async (req,res) =>{
    res.status(200).json({
        message:"ok"
    })
})


export default registerUser;

// we used async here, so it returns a promise . 
//and async handler resolves or rejects the promise.
// we dont need to do that every time here .Thats the use of asyncHandler
//here async(req,res) is the function that is passed into asyncHandler
// the next parameter is included in asyncHandlers inner function.
//it is not explicitly used here
//when requestHandler is called, it passes req,res,next to registerUser
//even though next is not used in register user , it is still available for error handling


