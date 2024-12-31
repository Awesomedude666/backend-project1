import mongoose from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

// mongoose-aggregate-paginate makes all the videos in the database visible to the client page by page as all the videos cannot be displayed at once.
// same process is used for comments etc...

const videoSchema = new mongoose.Schema(
    {
        videoFile:{
            type:String, //cloudinary url
            required:true,
        },
        thumbnail:{
            type:String, //cloudinary url
            required:true,
        },
        title:{
            type:String,
            required:true,

        },
        description:{
            type:String,
            required:true,
        },
        duration:{
            type:Number, //from cloudinary
            required:true,
        },
        views:{
            type:Number,
            default:0,
        },
        isPublished:{
            type:Boolean,
            default:true, //after published so true
        },
        owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User',
        },



    },
    {
        timestamps:true,
    }
)

videoSchema.plugin(mongooseAggregatePaginate);





export const Video = mongoose.model('Video', videoSchema)