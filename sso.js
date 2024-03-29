const express = require('express');
const cookieParser = require('cookie-parser')
const exphbs = require('express-handlebars');
const cors = require('cors')
const session = require('express-session');
const serveStatic = require('serve-static')
const jwtDecode = require( "jwt-decode");
const fetch = require('node-fetch');

const jwt = require('jsonwebtoken');

const {
    v4: uuidv4
} = require('uuid');
const DB = require('./db');
const { start } = require('pm2');

const {
    SSO_IFRAME_PROTOCOL,
    SESSION_SECRET,
    NODE_ENV,
    BEARER
  } = process.env;
  
let t = jwtDecode(BEARER);
console.log("BEARER = " + JSON.stringify(t))
console.log("Time = ", Date.now());
console.log("Days till expired: ", (t.exp - Date.now() / 1000) / (60 * 60 * 24))

const app = express();
var corsOptions = {
    origin: 'https://xr.realitymedia.digital',
    credentials: true
}
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

// for the iframe that wants the index file and script
app.use(serveStatic("public", {fallthrough: true}));

const PROTOCOL = SSO_IFRAME_PROTOCOL || "https:";

// setup route middleware
app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: SESSION_SECRET || "SuperSecretValue",
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: NODE_ENV ? true : false
    }
}))

// parse application/json
app.use(express.json());
// parse cookies for token
app.use(cookieParser())
// enable handlebars templating engine
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

let accountId = function(token) {
    try {
        return jwtDecode(token).sub
    } catch (e) {
        return -1
    }
}

let accountInfo = async function(email) {
    let json = await fetch('https://xr.realitymedia.digital/api/v1/accounts/search', {
        method: 'post',
        body: JSON.stringify({ email: email }),
        headers: { 'Content-Type': 'application/json', "Authorization" : "bearer " + BEARER },
    })
    .then(res => res.json());

    //console.log("account id for " + email + ": " + json)
    if (json.data) {
        return json.data[0]    
    } else {
        return null
    }
}

let validateId = async function(email, token) {
    let id = accountId(token)
    let info = await accountInfo(email)

    if (id > 0 && info && id == info.id) {
        return id
    }
    return 0
}

var userWork = [];
let startUserWork = async function (id) {
    console.log("starting user work for " + id)
    if (!userWork[id]) {
        console.log("no need to wait, can do work for " + id)
        userWork[id] = true;
        return true;
    }

    console.log("waiting for user work to finish for " + id)
    while (userWork[id]) {
        await sleep(100);
    }
    console.log("done waiting, can do work for " + id)
    userWork[id] = true;
    return true;
}

let endUserWork = function (id) {
    console.log("ending user work for " + id)
    userWork[id] = false;
}

let roomProtos = [
    {
        name: "Onboarding and Rotunda",
        scene_id: "HJKfYJk",
        description: "Entrance room and Central Hub",
        room_size: 30,
        user_data: { 
            script_url: "https://resources.realitymedia.digital/core-components/index.min.js"
        }
    },
    {
        name: "History",
        scene_id: "zDncjsX",
        description: "The History of Reality Media",
        room_size: 30,
        user_data: { 
            script_url: "https://resources.realitymedia.digital/core-components/index.min.js"
        }
    },
    {
        name: "3D Graphics and Sensing",
        scene_id: "BMwKB9V",
        description: "Computer Graphics and Sensing for Reality Media",
        room_size: 30,
        user_data: { 
            script_url: "https://resources.realitymedia.digital/core-components/index.min.js"
        }
    },
    {
        name: "Presence and Aura",
        scene_id: "DY4gSzC",
        description: "Presence and Aura and Reality Media",
        room_size: 30,
        user_data: { 
            script_url: "https://resources.realitymedia.digital/core-components/index.min.js"
        }
    },
    {
        name: "The Pit",
        scene_id: "Jnop2M4",
        description: "Testing Presence effects in the UNC Pit",
        room_size: 30,
        user_data: { 
            script_url: "https://resources.realitymedia.digital/core-components/index.min.js"
        }
    },
    {
        name: "The Acropolis",
        scene_id: "A6MXLQn",
        description: "Leveraging Aura in the Acropolis room with the Parthenon",
        room_size: 30,
        user_data: { 
            script_url: "https://resources.realitymedia.digital/core-components/index.min.js"
        }
    },
    {
        name: "Privacy and the Future",
        scene_id: "GLvFfFb",
        description: "Privacy, Public Spaces, and the Future of Reality Media",
        room_size: 30,
        user_data: { 
            script_url: "https://resources.realitymedia.digital/core-components/index.min.js"
        }
    },
    {
        name: "Genres of Reality Media",
        scene_id: "kNSUBeB",
        description: "Genres of Reality Media",
        room_size: 30,
        user_data: { 
            script_url: "https://resources.realitymedia.digital/core-components/index.min.js"
        }
    },
    {
        name: "What are Reality Media",
        scene_id: "Go3FTHC",
        description: "What are Reality Media and What are AR and VR",
        room_size: 30,
        user_data: { 
            script_url: "https://resources.realitymedia.digital/core-components/index.min.js"
        }
    },
    {
        name: "Public Space",
        scene_id: "6etpG95",
        description: "Public Space",
        room_size: 30,
        user_data: { 
            script_url: "https://resources.realitymedia.digital/core-components/index.min.js"
        }
    },
    {
        name: "Private Space",
        scene_id: "U5RCYmp",
        description: "Public Space",
        room_size: 30,
        user_data: { 
            script_url: "https://resources.realitymedia.digital/core-components/index.min.js"
        }
    }
]

let createRoom = async function (i) {
    console.log("creating room " + i)
    if (i < 0 || i >= roomProtos.length) {
        console.warn("tried to create room " + i + " when max is " + (roomProtos.length - 1))
    }
    let body = {
        "hub": roomProtos[i]
    }

    //console.log("creating room on server:")
    //console.log(body)
    // console.log(BEARER)
    try {
        let result = await fetch('https://xr.realitymedia.digital/api/v1/hubs', {
            method: 'post',
            body:    JSON.stringify(body),
            headers: { 'Content-Type': 'application/json', "Authorization" : "bearer " + BEARER }
        })
        .then(res => {
            try {
                return res.json()
            } catch (e) {
                console.error("could not decode res as JSON: " + res.text())
                console.error(e, JSON.stringify(body));
            }
        })
        
        //console.log("return from hubs server: " + result)
        return {scene: roomProtos[i].scene_id, room: result.hub_id}
    } catch (e) {
        console.error("failure to create room: " + roomProtos[i].scene_id)
        //console.error(e);
        return null;
    }

}

// // GET /sso/
// app.get('/dumpData', async (req, res) => {
//     const env = NODE_ENV || "development";
//     if (env === "development") {
//         // return all models in dev
//         const data = await Promise.all(Object.keys(DB.models).map(model => DB.models[model].findAll())).catch(e => {
//             console.log(e);
//         });
//         return res.json({
//             data,
//             loggedIn: req.session
//         });
//     }
//     return res.status(200).json({
//         message: "sso get login token",
//         loggedIn: req.session.loggedIn
//     })
// });

app.get('/resetUserRooms', async (req, res) => {
    // if (!req.session.loggedIn) {
    //     return res.sendStatus(401)
    // }

    let {
        email, 
        token
    } = req.query;

    if (email) {
        email = decodeURIComponent(email)
    }
    if (token) {
        token = decodeURIComponent(token)
    }

    let tokenCookie = req.cookies.__ael_hubs_token;
    var cookieData = {}
    if (tokenCookie) {
        try {
            cookieData = jwt.verify(tokenCookie, SESSION_SECRET);
        } catch(err) {
            console.error(err, req.body);
        }   
    }

    if (!(email && email.length) && cookieData.email && cookieData.email.length) {
        email = cookieData.email
    }
    if (!(token && token.length) && cookieData.token && cookieData.token.length) {
        token = cookieData.token
    }

    if (!(email && email.length) && !(token && token.length)) {
        return res.status(400).json({
            message: "Invalid input",
            email,
          //  token
        })
    }
    let id = await validateId(email, token)
    if (!id) {
        return res.status(400).json({
            message: "email and credentials don't match or account doesn't exist in hubs",
            email,
         //   token
        })
    }
    console.log("reseting for id ", id)
    await startUserWork(id);

    try {
        // delete all records associated with this ID

        // first any Rooms
        await DB.models.Room.destroy({
            where: {
                ownerId: id
            }
        });

        endUserWork(id);
        return res.status(200).json({
            user: {id:id, email: email}
        });
    } catch (e) {
        console.error(e, req.body);
        endUserWork(id);
        return res.status(500).json(e);
    }
})

app.get('/user', async (req, res) => {
    // if (!req.session.loggedIn) {
    //     return res.sendStatus(401)
    // }

    let {
        email, 
        token
    } = req.query;

    if (email) {
        email = decodeURIComponent(email)
    }
    if (token) {
        token = decodeURIComponent(token)
    }

    let tokenCookie = req.cookies.__ael_hubs_token;
    var cookieData = {}
    if (tokenCookie) {
        try {
            cookieData = jwt.verify(tokenCookie, SESSION_SECRET);
        } catch(err) {
            console.error(err, req.body);
        }   
    }

    if (!(email && email.length) && cookieData.email && cookieData.email.length) {
        email = cookieData.email
    }
    if (!(token && token.length) && cookieData.token && cookieData.token.length) {
        token = cookieData.token
    }

    if (!(email && email.length) && !(token && token.length)) {
        return res.status(400).json({
            message: "Invalid input",
            email,
          //  token
        })
    }
    let id = await validateId(email, token)
    if (!id) {
        return res.status(400).json({
            message: "email and credentials don't match or account doesn't exist in hubs",
            email,
         //   token
        })
    }

    if (!tokenCookie || cookieData.email != email || cookieData.token != token) {
        createCookie(req, res, email, token)
    }

    console.log("get user info for id ", id)
    startUserWork(id);
    try {
        const users = await DB.query("User", { id });
        if (!users.length) {
            //return res.sendStatus(204)
            // create the user and return it
            let cuRet = await createUser(req, res, id, email, token)
            endUserWork(id);
            return cuRet;
        }

        if (users.length > 1) {
            console.error("Shouldn't happen: multiple record with same id!")
            // for (i = 1; i < users.length; i++) {
            //     API.models.User.destroy({where: { id: id, email: users[i].email, token: users[i].token}})
            // }
        }

        let user = {id: id}

        // need to start sending these back because they might be in the cookie
        user.email = email;
        //user.token = token;

        const rooms = await DB.query("Room", { ownerId: id } );
        let roomIds = await createOrUpdateRooms(req, id, rooms)

        endUserWork(id);

        return res.status(200).json({
            user: user,
            rooms: roomIds
        });
    } catch (e) {
        console.error(e, req.body);
        endUserWork(id);
        return res.status(500).json(e);
    }
});

let createCookie = function(req, res, email, token) {
    res.cookie(
        '__ael_hubs_token',
        jwt.sign(
            { email: email, token: token },
            SESSION_SECRET
        ),
        {
            // NOTICE the . behind the domain. This is necessary to ensure
            // that the cookies are shared between subdomains
            domain: '.' + req.headers.host,

            httpOnly: true,
            secure: true,
            maxAge: 1000 * 60 * 60 * 24 * 30  // one month-ish
        }
    );
}

app.get('/userRooms', async (req, res) => {
    // if (!req.session.loggedIn) {
    //     return res.sendStatus(401)
    // }
    console.log("user rooms request")
    let {
        email, 
        token,
        hubId
    } = req.query;

    if (email) {
        email = decodeURIComponent(email)
    }
    if (token) {
        token = decodeURIComponent(token)
    }

    let tokenCookie = req.cookies.__ael_hubs_token;
    var cookieData = {}
    if (tokenCookie) {
        try {
            cookieData = jwt.verify(tokenCookie, SESSION_SECRET);
        } catch(err) {
            console.error(err, req.body);
        }   
    }

    if (!(email && email.length) && cookieData.email && cookieData.email.length) {
        email = cookieData.email
    }
    if (!(token && token.length) && cookieData.token && cookieData.token.length) {
        token = cookieData.token
    }

    if (!(email && email.length) && !(token && token.length)) {
        return res.status(400).json({
            message: "Invalid input",
            email,
          //  token
        })
    }
    let id = await validateId(email, token)
    if (!id) {
        return res.status(400).json({
            message: "email and credentials don't match or account doesn't exist in hubs",
            email,
         //   token
        })
    }

    if (!tokenCookie || cookieData.email != email || cookieData.token != token) {
        createCookie(req, res, email, token)
    }

    startUserWork(id);
    try {
        // first see if this is my room
        const room = await DB.query("Room", { id, roomUri: hubId });
        endUserWork(id);
        if (room.length) {
            // my room so just signal that.  Send roomId and [] for the room list
            return res.status(200).json({
                localRooms: [],
                roomId: room[0].roomId
            });
        }
    } catch (e) {
        console.error(e, req.body);
        endUserWork(id);
        return res.status(500).json(e);
    }

    console.log("get user rooms info for hubId ", hubId)

    let localRooms = []
    let roomId = -1;
    if (hubId) {
        const room = await DB.query("Room", { roomUri: hubId } );
        if (room.length) {
            roomId = room[0].roomId
            let ownerId = room[0].ownerId
            startUserWork(ownerId);
            try {
                const rooms = await DB.query("Room", { ownerId: ownerId } );
                localRooms = await createOrUpdateRooms(req, ownerId, rooms)

                endUserWork(ownerId);
            } catch (e) {
                console.error(e, req.body);
                endUserWork(ownerId);
            }
        }
    }
    console.log("roomID = " + roomId + ", localRooms = ", localRooms)
    return res.status(200).json({
        localRooms: localRooms,
        roomId: roomId
    });
});

app.get('/signout', async (req, res) => { 
    const d = new Date();
    d.setTime(d.getTime() - (24*60*60*1000));   // 1 day in the past
  
    res.cookie(
        '__ael_hubs_token',
        "gobbledygook",
        {
            // NOTICE the . behind the domain. This is necessary to ensure
            // that the cookies are shared between subdomains
            domain: '.' + req.headers.host,
            httpOnly: true,
            secure: true,
            expires: d
        }
    );
    return res.status(200).json({user: null});
});

app.post('/user', async (req, res) => {
    if (!req.session.loggedIn) {
        return res.sendStatus(401);
    }

    const {
        token,
        email
    } = req.body;

    if (!(email && email.length) && !(token && token.length)) {
        return res.status(400).json({
            message: "Invalid input",
            email,
           // token
        })
    }
    let id = accountId(token)
    let info = await accountInfo(email)

    if (!id || !info || id != info.id) {
        return res.status(400).json({
            message: "email and credentials don't match or account doesn't exist in hubs",
            email,
     //       token
        })
    }

    createCookie(req, res, email, token)

    try {
        const exists = await DB.count("User", {
            id
        });

        if (exists) {
            console.log("User already exists", email);
            return res.status(200).json({
                error: "User already exists for token and " + email
            });
        }
    } catch (e) {
        console.error(e, req.body);
        return res.status(500).json(e);
    }

    startUserWork(id);
    let cuRet = await createUser(req, res, id, email, token)   
    endUserWork(id);
    return cuRet;
});

let createUser = async function(req, res, id, email, token) {
    try {
        const newUser = await DB.models.User.create({
            id,
            createdAt: Date.now(),
        });

        let roomIds = await createOrUpdateRooms(req, id, [])

        let user = {id: id}

        // need to start sending these back because they might be in the cookie
        user.email = email;
        //user.token = token;
        
        return res.status(201).json({
            user: user,
            rooms: roomIds
        });
    } catch (e) {
        console.error(e, req.body);
        return res.status(500).json(e);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let createOrUpdateRooms = async function(req, id, rooms) {
    // if we have the right number of rooms, assume it's ok
    // if (rooms.length == 2) {
    //     // should really check if the rooms point at the right URI's ... 
    //     // ... loop through array checking the URi against the scene list above,
    //     // based on the roomId
    //     return rooms  xLUtdAD', 'yCigoPG', 'ZL9zbdt', 'Lt8zjo6', 'ANoZHrM', 'PyLJTQk', 'Nj9THor
    // }
    console.log("createOrUpdate " + id + " starting with " + rooms.length + " rooms")
    try {
        let ret = []
        //   for (let i = 0; i < fakeRooms.length; i++) {
          for (let i = 0; i < roomProtos.length; i++) {
            let r  = null;
            for (let j = 0; j < rooms.length; j++) {
                if (rooms[j].roomId == i) {
                    if (!r) {
                        r = rooms[j];
                    } else {
                        console.log("delete duplicate room " + i + " " + r.id + " " + r.roomId)
                        try {
                            await DB.models.Room.destroy({
                                where: {
                                    id: rooms[j].id 
                                }
                            });
                        } catch (e) {
                            console.error(e, req.body);
                        }
                    }
                }
            }
            // if (rooms.length <= i || rooms[i].sceneUri != fakeScenes[i]) {
            if (!r || r.sceneUri != roomProtos[i].scene_id) {
                // room exists with wrong URI, so delete
                if (r) {
                    try {
                        await DB.models.Room.destroy({
                            where: {
                                ownerId: id,
                                id: r.id
                            }
                        });
                    } catch (e) {
                        console.error(e, req.body);
                    }
                }

                var room = null;
                while (!room) {
                    room = await createRoom(i)     
                    if (room) {
                        // create room with right URI
                        console.log("creating room " + room.room + " with scene " + room.scene + " for user " + id)
                        try {
                            r = await DB.models.Room.create({
                                ownerId: id,
                                roomId: i,
                                roomUri: room.room,
                                sceneUri: room.scene
                            })
                        } catch (e) {
                            console.error(e, req.body);
                            r = {roomId : i, roomUri: "ERROR"}
                        }
                    
                        // console.log("creating room " + fakeRooms[i] + " with scene " + fakeScenes[i] + " for user " + id)
                        // r = await DB.models.Room.create({
                        //     ownerId: id,
                        //     roomId: i,
                        //     roomUri: fakeRooms[i],
                        //     sceneUri: fakeScenes[i]
                        // })
                    } else {
                        console.log("FAILED to create room with scene " + roomProtos[i].scene_id + " for user " + id)
                    }
                    await sleep(1100);
                }

            }
            ret[i] = r
            
            // // create rooms for the user
            // const r1 = await DB.models.Room.create({
            //     ownerId: id,
            //     roomId: 0,
            //     roomUri: fakeRooms[0]
            // })
            // const r2 = await DB.models.Room.create({
            //     ownerId: id,
            //     roomId: 1,
            //     roomUri: fakeRooms[1]
            // })
        }

        const roomIds = []
        ret.forEach(r => roomIds[r.roomId] = r.roomUri );

        return roomIds //[r1.roomUri, r2.roomUri]
    } catch (e) {
        console.error(e, req.body);
        return [];
    }
}

app.get("/bundle.js", (req, res) => {
    if (req.session && !req.session.loggedIn) {
        req.session.loggedIn = uuidv4()
    }
    res.header('Content-Type', 'application/javascript');

    res.render('bundle.hbs', {
        PROTOCOL,
        LOCAL_STORAGE_KEY: "__ael_hubs_sso",
        TOKEN: req.session.loggedIn,
        BASE_URL: req.headers.host
    });
})

module.exports = app;