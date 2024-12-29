import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asynchandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";



// this is to verify whether a user is logged in or not . inorder to logout it is necessary that he should be logged in first.
// it is a middleware we need to check.

export const verifyJWT = asyncHandler(async(req,res,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
        if(!token) {
            throw new ApiError(401, "Unauthorized request");
        }
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken._id).select("-password -refreshToken") // as we made an id (_id) while generating tokens
        if(!user) {
            throw new ApiError(401, "Invalid Access Token");
        }
        req.user = user; // adding user to req so that next method that runs can have access to req.user
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }


})

// if it is a mobile app then there will be no access token so we have to check that.
// so it not from the cookies, then user may send a custom header also 
// we will get "Authorization", Bearer <token> from the user so we need to take only the access token from it.