import express, { urlencoded } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'


const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,  //from where we need to allow data
    credentials:true
}))

app.use(express.json({limit:"16kb"})) // we are accepting json data here with this eg:data from form
app.use(urlencoded({extended : true,limit:"16kb"}))       // to take data from the url eg: in b|w we have %20 or + etc...(extended) makes us to use objects inside objects (nested objects);

app.use(express.static("public"))
// when we want to store images or pdfs in a public folder like public assets we use static


// for accessing and setting the cookies in the user's browser we use cookie-parser
app.use(cookieParser())


export default app
