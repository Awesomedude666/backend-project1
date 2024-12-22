import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'


const userSchema = new mongoose.Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            trim:true, // remove spaces from the string
            lowercase:true,
            index:true,// it will be easy for searching for the database(optimised way)
        },
        email:{
            type:String,
            required:true,
            unique:true,
            trim:true,
            lowercase:true,
        },
        fullName:{
            type:String,
            required:true,
            trim:true,
            index:true,
        },
        avatar:{
            type:String, //cloudinary url
            required:true,
        },
        coverImage:{
            type:String, //cloudinary url
        },
        watchHistory:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'Video',
        }
        ],
        password:{
            type:String,
            required:[true,'password is required'],
        },
        refreshToken:{
            type:String,
        },

    },{timestamps:true})

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next(); //if password is not modified then we don't need to hash it everytime.
    // isModified is a default function to check if modified
    this.password = await bcrypt.hash(this.password,10)// 10 is no of rounds in the algorothm of bcrypt( can be changed)
    next()
})

// we can also add methods to the schema by using mongoose just like middleware (custom methods can also be added)
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password) //user password and encrypted password which we have are compared
}


userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {                                                    // .sign generates the token
        _id:this.id,
        email:this.email,
        username:this.username,
        fullName:this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY, //expiry goes in an object
        }
)                                      
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {                                                    // .sign generates the token
        _id:this.id,                                        //takes less inputs in payload than access token (as refreshed everytime);
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY, //expiry goes in an object (expiry time of refresh token is more than access token)
        }
)    

}







export const User = mongoose.model("User",userSchema)