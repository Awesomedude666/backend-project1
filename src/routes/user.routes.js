import {Router} from 'express'
import {registerUser,loginUser,logoutUser,refreshAccessToken, } from '../controllers/user.controllers.js';
import {upload} from '../middlewares/multer.middleware.js'
import {verifyJWT} from '../middlewares/auth.middleware.js'

const router = Router();

// router.route("/register").post(registerUser);
// by this code above,
// whenever user enters /register registerUser method is executed. but we want to add a middleware before it gets executed.
//so we change it to:

router.route("/register").post(
    upload.fields(
        [
            {
                name:"avatar",
                maxCount:1,
            },
            {
                name:"coverImage",
                maxCount:1,
            }
        ]
                 ),
    registerUser
);

router.route("/login").post(loginUser)

//secured routes

router.route("/logout").post(verifyJWT,logoutUser)   // and before logout method , we inject the middleware verifyJwt.
router.route("refresh-token").post(refreshAccessToken) // here we dont need to inject any middleware becoz we already checked if user is logged in the process of checking the refreshtoken.


// upload.fields() - returns middleware that processes multiple files associated with the given form fields
// in this we need to accept 2 files , avatar and cover image 
//so we create an array of 2 objects.
// in frontend also the name should be avatar only ** imp.
//maxCount - how many max files can be uploaded at a time.




export default router;

// this router is imported in app

