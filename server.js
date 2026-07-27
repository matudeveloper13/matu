const express = require("express");
const bcrypt = require("bcrypt");
const fs = require("fs");

const app = express();

app.use(express.static(__dirname));
app.use(express.json());


const USERS_FILE = "users.json";


// Create users file
if(!fs.existsSync(USERS_FILE)){
    fs.writeFileSync(USERS_FILE,"[]");
}



function getUsers(){

    return JSON.parse(
        fs.readFileSync(USERS_FILE)
    );

}



function saveUsers(users){

    fs.writeFileSync(
        USERS_FILE,
        JSON.stringify(users,null,2)
    );

}





// =====================
// REGISTER
// =====================

app.post("/register", async(req,res)=>{


    const {username,password}=req.body;



    if(!/^[A-Za-z0-9]{3,15}$/.test(username)){

        return res.json({
            success:false,
            message:"Username must be 3-15 letters and numbers only"
        });

    }



    if(password.length < 8){

        return res.json({
            success:false,
            message:"Password must be at least 8 characters"
        });

    }



    const users=getUsers();



    if(users.find(u=>u.username===username)){

        return res.json({
            success:false,
            message:"Username already exists"
        });

    }



    const hashedPassword =
    await bcrypt.hash(password,10);



    users.push({

        username,

        password:hashedPassword,

        avatar:username[0].toUpperCase(),

        friends:[],

        requests:[],

        chats:{}

    });



    saveUsers(users);



    res.json({

        success:true,

        message:"Account created!"

    });


});








// =====================
// LOGIN
// =====================

app.post("/login",async(req,res)=>{


    const {username,password}=req.body;


    const users=getUsers();



    const user =
    users.find(
        u=>u.username===username
    );



    if(!user){

        return res.json({

            success:false,

            message:"Account not found"

        });

    }



    const correct =
    await bcrypt.compare(
        password,
        user.password
    );



    if(!correct){

        return res.json({

            success:false,

            message:"Wrong password"

        });

    }



    // Fix old accounts

    if(!user.avatar)
        user.avatar=username[0].toUpperCase();


    if(!user.friends)
        user.friends=[];


    if(!user.requests)
        user.requests=[];


    if(!user.chats)
        user.chats={};


    saveUsers(users);



    res.json({

        success:true,

        user:{

            username:user.username,

            avatar:user.avatar

        }

    });



});








// =====================
// SEND FRIEND REQUEST
// =====================

app.post("/send-request",(req,res)=>{


    const {from,to}=req.body;


    const users=getUsers();



    const receiver =
    users.find(
        u=>u.username===to
    );



    if(!receiver){

        return res.json({

            success:false,

            message:"User not found"

        });

    }



    if(receiver.requests.includes(from)){

        return res.json({

            success:false,

            message:"Request already sent"

        });

    }



    receiver.requests.push(from);



    saveUsers(users);



    res.json({

        success:true,

        message:"Friend request sent!"

    });


});








// =====================
// GET FRIEND REQUESTS
// =====================

app.post("/get-requests",(req,res)=>{


    const {username}=req.body;


    const users=getUsers();


    const user =
    users.find(
        u=>u.username===username
    );



    let requests=[];



    user.requests.forEach(name=>{


        const person =
        users.find(
            u=>u.username===name
        );


        if(person){

            requests.push({

                username:person.username,

                avatar:person.avatar

            });

        }


    });



    res.json({

        success:true,

        requests

    });


});








// =====================
// ACCEPT REQUEST
// =====================

app.post("/accept-request",(req,res)=>{


    const {username,requester}=req.body;


    const users=getUsers();



    const user =
    users.find(
        u=>u.username===username
    );


    const other =
    users.find(
        u=>u.username===requester
    );



    if(!user || !other){

        return res.json({

            success:false

        });

    }



    user.requests =
    user.requests.filter(
        x=>x!==requester
    );



    if(!user.friends.includes(requester))
        user.friends.push(requester);



    if(!other.friends.includes(username))
        other.friends.push(username);



    saveUsers(users);



    res.json({

        success:true

    });


});








// =====================
// DECLINE REQUEST
// =====================

app.post("/decline-request",(req,res)=>{


    const {username,requester}=req.body;


    const users=getUsers();


    const user =
    users.find(
        u=>u.username===username
    );



    user.requests =
    user.requests.filter(
        x=>x!==requester
    );



    saveUsers(users);



    res.json({

        success:true

    });


});








// =====================
// GET FRIENDS
// =====================

app.post("/get-friends",(req,res)=>{


    const {username}=req.body;


    const users=getUsers();


    const user =
    users.find(
        u=>u.username===username
    );



    let friends=[];



    user.friends.forEach(name=>{


        const friend =
        users.find(
            u=>u.username===name
        );



        if(friend){

            friends.push({

                username:friend.username,

                avatar:friend.avatar

            });

        }


    });



    res.json({

        success:true,

        friends

    });



});









// =====================
// SEND MESSAGE
// =====================

app.post("/send-message",(req,res)=>{


    const {from,to,message}=req.body;


    const users=getUsers();



    const sender =
    users.find(
        u=>u.username===from
    );


    const receiver =
    users.find(
        u=>u.username===to
    );



    if(!sender || !receiver){

        return res.json({

            success:false,

            message:"User not found"

        });

    }



    if(!sender.chats)
        sender.chats={};



    if(!sender.chats[to])
        sender.chats[to]=[];




    sender.chats[to].push({

        sender:from,

        message:message,

        time:Date.now()

    });





    if(!receiver.chats)
        receiver.chats={};



    if(!receiver.chats[from])
        receiver.chats[from]=[];





    receiver.chats[from].push({

        sender:from,

        message:message,

        time:Date.now()

    });



    saveUsers(users);



    res.json({

        success:true

    });


});








// =====================
// GET MESSAGES
// =====================

app.post("/get-messages",(req,res)=>{


    const {user,friend}=req.body;


    const users=getUsers();


    const account =
    users.find(
        u=>u.username===user
    );



    if(!account){

        return res.json({

            success:false,

            messages:[]

        });

    }



    res.json({

        success:true,

        messages:
        account.chats?.[friend] || []

    });


});








app.get("/",(req,res)=>{

    res.sendFile(__dirname+"/index.html");

});





app.listen(3000,()=>{

    console.log(
        "Server running on http://localhost:3000"
    );

});