const asyncHandler = (requestHandler)=>{
    return (req,res,next) =>{
        Promise.resolve(requestHandler(req,res,next))
        .catch((error)=>next(error))
    }
}

// async handler is a higher order function which a function as an argument;
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