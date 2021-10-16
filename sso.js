const express = require('express');
const cookieParser = require('cookie-parser')
const exphbs = require('express-handlebars');
const cors = require('cors')
const session = require('express-session');
const serveStatic = require('serve-static')
const jwtDecode = require( "jwt-decode");
const fetch = require('node-fetch');
const {
    v4: uuidv4
} = require('uuid');
const DB = require('./db');

const {
    SSO_IFRAME_PROTOCOL,
    SESSION_SECRET,
    NODE_ENV,
    BEARER,
  } = process.env;
  
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

    console.log("account id for " + email + ": " + json)
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

let roomProtos = [
    {
        name: "Rotunda",
        sceneId: "HJKfYJk",
        description: "Entrance room and Central Hub",
        room_size: 30,
        user_data: { 
            script_url: "https://resources.realitymedia.digital/core-components/build/main.js"
        }
    },
    {
        name: "History",
        sceneId: "zDncjsX",
        description: "The History of Reality Media",
        room_size: 30,
        user_data: { 
            script_url: "https://resources.realitymedia.digital/core-components/build/main.js"
        }
    },
    {
        name: "3D Graphics and Sensing",
        sceneId: "BMwKB9V",
        description: "Computer Graphics and Sensing for Reality Media",
        room_size: 30,
        user_data: { 
            script_url: "https://resources.realitymedia.digital/core-components/build/main.js"
        }
    },
    {
        name: "Presence and Aura",
        sceneId: "DY4gSzC",
        description: "Presence and Aura and Reality Media",
        room_size: 30,
        user_data: { 
            script_url: "https://resources.realitymedia.digital/core-components/build/main.js"
        }
    },
    {
        name: "The Pit",
        sceneId: "Jnop2M4",
        description: "Testing Presence effects in the UNC Pit",
        room_size: 30,
        user_data: { 
            script_url: "https://resources.realitymedia.digital/core-components/build/main.js"
        }
    },
    {
        name: "The Acropolis",
        sceneId: "rPuqgP4",
        description: "Leveraging Aura in the Acropolis room with the Parthenon",
        room_size: 30,
        user_data: { 
            script_url: "https://resources.realitymedia.digital/core-components/build/main.js"
        }
    },
    {
        name: "Privacy and the Future",
        sceneId: "GLvFfFb",
        description: "Privacy, Public Spaces, and the Future of Reality Media",
        room_size: 30,
        user_data: { 
            script_url: "https://resources.realitymedia.digital/core-components/build/main.js"
        }
    }
]
let createRoom = async function (i) {
    if (i < 0 || i >= roomProtos.length) {
        console.warn("tried to create room " + i + " when max is " + (roomProtos.length - 1))
    }
    let body = {
        "hub": roomProtos[i]
    }

    let result = await fetch('https://xr.realitymedia.digital/api/v1/hubs', {
        method: 'post',
        body:    JSON.stringify(body),
        headers: { 'Content-Type': 'application/json', "Authorization" : BEARER },
    })
    .then(res => res.json())
    
    return {scene: roomProtos[i].sceneId, room: result.hub_id}
}

// GET /sso/
app.get('/dumpData', async (req, res) => {
    const env = NODE_ENV || "development";
    if (env === "development") {
        // return all models in dev
        const data = await Promise.all(Object.keys(DB.models).map(model => DB.models[model].findAll())).catch(e => {
            console.log(e);
        });
        return res.json({
            data,
            loggedIn: req.session
        });
    }
    return res.status(200).json({
        message: "sso get login token",
        loggedIn: req.session.loggedIn
    })
});

app.delete('/user/:email', async (req, res) => {
    if (!req.session.loggedIn) {
        return res.sendStatus(401)
    }
    let {
        email,
        token
    } = req.params;

    email = decodeURIComponent(email)
    token = decodeURIComponent(token)

    if (!(email && email.length) && !(token && token.length)) {
        return res.status(400).json({
            message: "Invalid input",
            email,
            token
        })
    }
    let id = await validateId(email, token)
    if (!id) {
        return res.status(400).json({
            message: "email and Credentials don't match",
            email,
            token
        })
    }

    try {
        // delete all records associated with this ID

        // first any Rooms
        await API.models.Room.destroy({
            where: {
                ownerId: id
            }
        });

        // then the User records
        const userRecords = await DB.query("User", {
            id
        });
        if (!(userRecords && userRecords.length)) {
            return res.sendStatus(204);
        }
        await API.models.User.destroy({
            where: {
                id
            }
        });
    } catch (e) {
        console.error(e, req.body);
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

    email = decodeURIComponent(email)
    token = decodeURIComponent(token)
    if (!(email && email.length) && !(token && token.length)) {
        return res.status(400).json({
            message: "Invalid input",
            email,
            token
        })
    }
    let id = await validateId(email, token)
    if (!id) {
        return res.status(400).json({
            message: "email and credentials don't match or account doesn't exist in hubs",
            email,
            token
        })
    }

    try {
        const users = await DB.query("User", { id });
        if (!users.length) {
            //return res.sendStatus(204)
            // create the user and return it
            return await createUser(req, res, id)
        }

        if (users.length > 1) {
            console.error("Shouldn't happen: multiple record with same id!")
            // for (i = 1; i < users.length; i++) {
            //     API.models.User.destroy({where: { id: id, email: users[i].email, token: users[i].token}})
            // }
        }

        let user = users[0]
        const rooms = await DB.query("Room", { ownerId: id } );
        let roomIds = await createOrUpdateRooms(req, id, rooms)

        return res.status(200).json({
            user: user,
            rooms: roomIds
        });
    } catch (e) {
        console.error(e, req.body);
        return res.status(500).json(e);
    }
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
            token
        })
    }
    let id = accountId(token)
    let info = await accountInfo(email)

    if (!id || !info || id != info.id) {
        return res.status(400).json({
            message: "email and credentials don't match or account doesn't exist in hubs",
            email,
            token
        })
    }

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

    return await createUser(req, res, id)   
});

let createUser = async function(req, res, id) {
    try {
        const newUser = await DB.models.User.create({
            id,
            createdAt: Date.now(),
        });

        let roomIds = await createOrUpdateRooms(req, id, [])

        return res.status(201).json({
            user: newUser,
            rooms: roomIds
        });
    } catch (e) {
        console.error(e, req.body);
        return res.status(500).json(e);
    }
}

// scene list
let fakeRooms = ["7QmbqNj","aSCkfag"]
let fakeScenes = ["ZUX4NsX", "rPuqgP4"]

let createOrUpdateRooms = async function(req, id, rooms) {
    // if we have the right number of rooms, assume it's ok
    // if (rooms.length == 2) {
    //     // should really check if the rooms point at the right URI's ... 
    //     // ... loop through array checking the URi against the scene list above,
    //     // based on the roomId
    //     return rooms
    // }
    try {
        let ret = []
        //   for (let i = 0; i < fakeRooms.length; i++) {
          for (let i = 0; i < roomProtos.length; i++) {
            let r = rooms[i]
            // if (rooms.length <= i || rooms[i].sceneUri != fakeScenes[i]) {
            if (rooms.length <= i || rooms[i].sceneUri != roomProtos[i].sceneId) {
                // room exists with wrong URI, so delete
                if (rooms.length > i) {
                    await DB.models.Room.destroy({
                        where: {
                            ownerId: id,
                            roomId: i
                        }
                    });
                }

                let room = createRoom(i)                
                // create room with right URI
                console.log("creating room " + room.room + " with scene " + room.scene + " for user " + id)
                r = await DB.models.Room.create({
                    ownerId: id,
                    roomId: i,
                    roomUri: room.room,
                    sceneUri: room.scene
                })

                // console.log("creating room " + fakeRooms[i] + " with scene " + fakeScenes[i] + " for user " + id)
                // r = await DB.models.Room.create({
                //     ownerId: id,
                //     roomId: i,
                //     roomUri: fakeRooms[i],
                //     sceneUri: fakeScenes[i]
                // })
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