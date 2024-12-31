import {Router} from 'express'
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
} from '../controllers/user.controllers.js';
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
router.route("/refresh-token").post(refreshAccessToken) // here we dont need to inject any middleware becoz we already checked if user is logged in the process of checking the refreshtoken.
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
// we can also use post here but we are not sending any data so we use get.
router.route("/update-account").patch(verifyJWT,updateAccountDetails) // here we use patch because we are updating the existing data.(a part only) if we use post here then it will create a new data.
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar) // as for uploading avatar we use another middleware upload also.
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)

router.route("/c/:username").get(verifyJWT,getUserChannelProfile) // here we are using username as a parameter.
router.route("/history").get(verifyJWT,getWatchHistory)









// upload.fields() - returns middleware that processes multiple files associated with the given form fields
// in this we need to accept 2 files , avatar and cover image 
//so we create an array of 2 objects.
// in frontend also the name should be avatar only ** imp.
//maxCount - how many max files can be uploaded at a time.




export default router;

// this router is imported in app

