const express = require('express');
const cookieParser = require('cookie-parser')
const cors = require('cors')
const session = require('express-session');
const serveStatic = require('serve-static')
const jwtDecode = require( "jwt-decode");

const {
    v4: uuidv4
} = require('uuid');

const DB = require('./db');

const {
    SESSION_SECRET,
    NODE_ENV,
    BEARER,
    SSO_IFRAME_PROTOCOL
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


const toSqlDatetime = (inputDate) => {
    const date = new Date(inputDate)
    const dateWithOffest = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
    return dateWithOffest
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ') + '.' + dateWithOffest.getMilliseconds()
}

// toSqlDatetime(new Date()) // 2019-08-07 11:58:57
// toSqlDatetime(new Date('2016-6-23 1:54:16')) // 2016-06-23 01:54:16

let accountId = function(token) {
    try {
        return jwtDecode(token).sub
    } catch (e) {
        return -1
    }
}

let getId = function(req, res) {
    let {
        token
    } = req.query;

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

    if (!(token && token.length) && cookieData.token && cookieData.token.length) {
        token = cookieData.token
    }

    if (!(token && token.length)) {
        return {id: -1, val: res.status(400).json({
            message: "Invalid input"
        })}
    }
    let id = accountId(token)
    if (!id) {
        return {id: -1, val: res.status(400).json({
            message: "invalid token and/or cookie"
        })}
    }
    return {id: id, val: res}
}
app.get('/log', async (req, res) => {
    let { id, val } = getId(req, res)
    if (id == -1) {
        return val;
    }

    let {
        timestamp,
        location,
        room,
        event,
        param1,
        param2
    } = req.query;

    if (!(timestamp && timestamp.length)) {
        return res.status(400).json({
            message: "Invalid input: no timestamp",
        })
    }
    if (!(event && event.length)) {
        return res.status(400).json({
            message: "Invalid input: no event",
        })
    }

    let ts = toSqlDatetime(timestamp);
    if (!(ts.toString() === 'Invalid Date')) {
        return res.status(400).json({
            message: "Invalid input: Invalid timestamp",
        })
    }

    try {
        console.log("logging: '" + event, {
            id,
            createdAt: Date.now(),
            timestamp: ts,
            event: event,
            location: location ? location : null,
            room: room ? room : null,
            param1: param1 ? param1 : null,
            param2: param2 ? param2 : null
        });
        // const msg = await DB.models.User.create({
        //     id,
        //     createdAt: Date.now(),
        //     timestamp: ts,
        //     event: event,
        //     location: location ? location : null,
        //     room: room ? room : null,
        //     param1: param1 ? param1 : null,
        //     param2: param2 ? param2 : null
        // });

        return res.status(200).json({
            message: "success"
        });
    } catch (e) {
        console.error(e, req.body);
        return res.status(500).json(e);
    }
})

module.exports = app;