const asyncHandler = (requestHandler)=>{
    (req,res,next) =>{
        Promise.resolve(requestHandler(req,res,next))
        .catch((error)=>next(error))
    }
}


// next is a function . by calling next the error is passed to 
//next error handling middleware in express.

export default asyncHandler;









// by try catch block
// const asyncHandler = (fun) => async (req,res,next) =>{
//     try{
//         await fun(req,res,next);

//     }catch(error){
//         res.status(error.code || 500).json({
//             success:false,
//             message:error.message
//         })
//     }
// }