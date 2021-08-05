const express = require('express');
const cookieParser = require('cookie-parser')
const exphbs = require('express-handlebars');
const cors = require('cors')
const session = require('express-session');
const {
    v4: uuidv4
} = require('uuid');

const DB = require('./db');
const app = express();

var corsOptions = {
    origin: 'https://xr.realitymedia.digital',
    credentials: true
}

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

app.use(cors(corsOptions))

app.options('*', cors(corsOptions))

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

app.delete('/user/:id', async (req, res) => {
    if (!req.session.loggedIn) {
        return res.sendStatus(401)
    }
    const {
        id
    } = req.params;
    const {
        email,
    } = req.body;

    if (!(id && id.length) || isNaN(parseInt(id))) {
        return res.status(400).json({
            message: "Invalid input",
            id,
            email,
        })

    }

    try {
        const isValid = await DB.query("User", {
            email,
            id
        });
        if (!(isValid && isValid.length)) {
            return res.sendStatus(204);

        }
        await API.models.User.destroy({
            where: {
                id
            }
        });
    } catch (e) {
        console.log(e);
        return res.sendStatus(500);
    }
})

app.get('/user', async (req, res) => {

    if (!req.session.loggedIn) {
        return res.sendStatus(401)
    }

    const {
        email
    } = req.query;

    if (!(email && email.length)) {
        return res.status(400).json({
            message: "Invalid input",
            email,
        })
    }
    try {
        const users = await DB.query("User", {
            email
        });
        if (!users.length) {
            return res.sendStatus(204)
            // .json({
            //     message: "Hello world",
            // })
        }
        return res.status(200).json({
            users
        });
    } catch (e) {
        console.log(e);
        return res.sendStatus(500);
    }
});

app.post('/user', async (req, res) => {

    if (!req.session.loggedIn) {
        return res.sendStatus(401);
    }

    const {
        token,
        email,
        name
    } = req.body;

    if (!(token && email && name)) {
        return res.status(400).json({
            message: "Invalid input",
            token,
            email,
            name
        })
    }

    try {
        const exists = await DB.query("User", {
            email,
            name
        });

        if (exists && exists.length) {
            console.log("User already exists", {
                email,
                name,
                exists
            })
            return res.status(200).json({
                error: "User already exists " + email
            });
        }

        const newUser = await DB.models.User.create({
            token,
            email,
            name,
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
        return res.sendStatus(500);

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