const express = require('express')
const router = express.Router();
const zod = require('../zod')
const {User,Account} = require('../db')
const jwt = require('jsonwebtoken');
const {JWT_SECRET} = require("../config");
const { authMiddleware } = require('../middleware');

router.post('/signup',async (req,res)=>{
  console.log("reached signup")
//    try{
    const validate = zod.object({
        username: zod.string().email(),
        firstName: zod.string(),
        lastName: zod.string(),
        password: zod.string(),
        
    })
    
   const {username,firstName,lastName,password} = req.body;

    const userValidate = validate.safeParse(req.body);
    const {success} = userValidate;
    
    if(!success){
        return res.status(411).json({
            message:"Invalid inputs"
        })
    }
    console.log("zodDone")

       const userExist=await User.findOne({
            username:username
        })

        if(userExist){
            return res.status(411).send({
                message:"Email already taken / Incorrect inputs"
            })
        }
            const user = await User.create({
                username:username,
                firstName:firstName,
                lastName:lastName,
                password:password,
                
            });

            const userId = user._id;
            
            await Account.create({
                userId: userId,
                balance: 1+ Math.random()*10000
            }).then(()=>{
                console.log("balance successful")
            })


            const jwtToken = jwt.sign({
                userId: user._id
            },JWT_SECRET); 

        res.status(200).json({
            message:"User created Successfully",
            token: jwtToken
         })

    // }
    // catch(e)
    // {
    //     console.log("user signup error")
    // }
})


const signInBody = zod.object({
    username:zod.string().email(),
    password: zod.string()
})

router.post('/signin',async (req,res)=>{
    const {username,password} = req.body;
    const {success} = signInBody.safeParse(req.body);
    
    if(!success){
        return res.status(411).json({
            message: "Incorrect inputs"
        })
    }

    const signIn =await User.findOne({
        username,
        password
    })

    if(!signIn){
        return res.status(411).json({
            message:"Error while logging in"
        })
    }

    const jwtToken = jwt.sign({
        username
    },JWT_SECRET)

    res.status(200).json({
        token:jwtToken
    })
})

const updateBody = zod.object({
    username: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional()
})

router.put('/',authMiddleware,async (req,res)=>{
    const {success} = updateBody.safeParse(req.body);

   if(!success) {
        res.status(200).json({
            message:"Updated successfully"
        });
   }
    await User.updateOne({_id: req.userId}, req.body)
    res.status(411).json({
        message:"Error while updating information"
    })


})

router.get('/bulk',async (req,res)=>{
    const filter = req.query.filter || "";

    const users = await User.find({
        $or:[{
            firstName: {
                "$regex":filter
            }
        }, {
            lastName: {
                "$regex":filter
            }
        }]
    })

    res.status(200).json({
        user:users.map(user=>({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id

        }))
    })
})

router.get("/balance",authMiddleware,async (req,res)=>{
    console.log("balance")
    const account = await Account.findOne({
        userId: req.userId
    });

    res.json({
        balance: account.balance
    })

})



module.exports = router;