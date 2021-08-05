const express = require('express');
const cookieParser = require('cookie-parser')
const exphbs = require('express-handlebars');
const cors = require('cors')
const session = require('express-session');
var serveStatic = require('serve-static')

const {
    v4: uuidv4
} = require('uuid');

const DB = require('./db');
const app = express();

var corsOptions = {
    origin: 'https://xr.realitymedia.digital',
    credentials: true
}
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

// for the iframe that wants the index file and script
app.use(serveStatic("public", {fallthrough: true}));

const PROTOCOL = process.env.SSO_IFRAME_PROTOCOL || "https:";

// setup route middleware
app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: process.env.SESSION_SECRET || "SuperSecretValue",
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV ? true : false
    }
}))

// parse application/json
app.use(express.json());
// parse cookies for token
app.use(cookieParser())
// enable handlebars templating engine
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// GET /sso/
app.get('/', async (req, res) => {
    const env = process.env.NODE_ENV || "development";
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

app.delete('/user/:token', async (req, res) => {
    if (!req.session.loggedIn) {
        return res.sendStatus(401)
    }
    const {
        token
    } = req.params;

    if (!(token && token.length)) {
        return res.status(400).json({
            message: "Invalid input",
            token
        })

    }

    try {
        const isValid = await DB.query("User", {
            token
        });
        if (!(isValid && isValid.length)) {
            return res.sendStatus(204);
        }
        await API.models.User.destroy({
            where: {
                token
            }
        });
    } catch (e) {
        console.error(e, req.body);
        return res.status(500).json(e);
    }
})

app.get('/user', async (req, res) => {
    if (!req.session.loggedIn) {
        return res.sendStatus(401)
    }

    const {
        emailEnc, 
        tokenEnc
    } = req.query;

    let email = decodeURIComponent(emailEnc)
    let token = decodeURIComponent(tokenEnc)
    if (!(email && email.length) && !(token && token.length)) {
        return res.status(400).json({
            message: "Invalid input",
            email,
            token
        })
    }

    try {
        const users = await DB.query("User", {
            token
        });
        if (!users.length) {
            return res.sendStatus(204)
        }

        if (users.length > 1) {
            console.warn("multiple users with same token!")
            for (i = 1; i < users.length; i++) {
                API.models.User.destroy({where: { token: users[i].token}})
            }
        }

        return res.status(200).json({
            user: users[0]
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

    if (!(token && email)) {
        return res.status(400).json({
            message: "Invalid input",
            token,
            email
        })
    }

    try {
        const exists = await DB.query("User", {
            token
        });

        if (exists && exists.length) {
            console.log("User already exists", {
                email,
                exists
            })
            if (!(exists.email === email)) {
                // update email
                console.log("user email differs (new " + email + ", old " + exists.email + "), updating")
                exists.email = email
                await exists.save();
            }

            return res.status(200).json({
                error: "User already exists " + email
            });
        }

        const newUser = await DB.models.User.create({
            token,
            email,
            name: "",
            createdAt: Date.now(),
        });

        // https://sequelize.org/master/manual/model-instances.html#updating-an-instance
        newUser.userData = {
            message: "hello world"
        };

        await newUser.save();

        return res.status(201).json(newUser);
    } catch (e) {
        console.error(e, req.body);
        return res.status(500).json(e);
    }
});

app.get("/bundle.js", (req, res) => {
    if (req.session && !req.session.loggedIn) {
        req.session.loggedIn = uuidv4()
    }
    res.header('Content-Type', 'application/javascript');

    res.render('bundle.hbs', {
        PROTOCOL,
        LOCAL_STORAGE_KEY: "ael_hubs_sso",
        TOKEN: req.session.loggedIn,
        BASE_URL: req.headers.host
    });
})

module.exports = app;