import mongoose from 'mongoose'



const subscriptionSchema = new mongoose.Schema(
    {
        subscriber:{
            type:mongoose.Schema.Types.ObjectId, // subscriber is a user ( one who subscribes)
            ref:'User',
        },
        channel:{
            type:mongoose.Schema.Types.ObjectId, // Channel is also a user to whom users subscribe
            ref:'User',
        }

    },{timeseries:true}
)





export const Subscription = mongoose.model('Subscription', subscriptionSchema)