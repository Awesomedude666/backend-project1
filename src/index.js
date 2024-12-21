import dotenv from 'dotenv'
import connectDB from './db/index.js'
import {app} from './app.js'

dotenv.config();

connectDB()
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log("MongoDb connection failed",error);
})





/*
const app = express()
(async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("Error",error);
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log("Server is running on port",process.env.PORT);
        })
    }catch(error){
        console.log("Error : ",error);
        throw error
    }

})()
    */
