'use strict';

/** Importing modules **/
const express = require('express');
const morgan = require('morgan');
const { check, validationResult } = require('express-validator');
const cors = require('cors');
const jsonwebtoken = require('jsonwebtoken');

const jwtSecret = 'af9deb6ec190b44a318ae12c6c19384fd6ce33b678703c6d9d838d98def3a04c';
const expireTime = 60; /* seconds */

const userDao = require('./dao-users'); /* module for accessing the user table in the DB */
const carDao = require('./dao-cars'); /* module for accessing the car configurator table in the DB */

/** Init express and set up the middlewares **/
const app = new express();
const port = 3001;
app.use(morgan('dev'));
app.use(express.json());


/** Set up and enable CORS **/
const corsOption = {
    origin: 'http://localhost:5173',
    credentials: true,
};
app.use(cors(corsOption));


/** Passport **/
const passport = require('passport');
const LocalStrategy = require('passport-local');

/* Set up authentication strategy to search in the DB a user with a matching password */
passport.use(new LocalStrategy(async function verify(username, password, callback) {
    const user = await userDao.getUser(username, password);
    if (!user) {
        return callback(null, false, 'Incorrect email or password')
    }

    /* returning user info in the session */
    return callback(null, user);
}));

/* Serialize in the session the user object given from the LocalStrategy */
passport.serializeUser(function (user, callback) {
    callback(null, user);
});

/* Extract the current logged-in user in the session */
passport.deserializeUser(function (user, callback) {
    return callback(null, user);
});


/** Session **/
const session = require('express-session');

app.use(session({
    secret: "25bc9efe9f3be38258f2a04d93542fa6",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: app.get('env') === 'production' }
}));

app.use(passport.authenticate('session'));

/* Authentication verification middleware */
const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ error: 'Not authorized' });
};


/** Utility Functions **/
const errorFormatter =  ({ location, msg, param }) => {
    return `${location}[${param}]: ${msg}`;
};


/** Cars APIs **/

/* API for retrieving the car models offered */
app.get('/api/carModels', (req, res) => {
    carDao.listCarModels()
        .then(models => res.json(models))
        .catch((err) => res.status(500).json(err));
});

/* API for retrieving all the car accessories */
app.get('/api/accessories', (req, res) => {
    carDao.listAccessories()
        .then(accessories => res.json(accessories))
        .catch((err) => res.status(500).json(err));
});

/* API for retrieving a user car configuration */
app.get('/api/user/configuration', isLoggedIn,
    async (req, res) => {
        try {
            const result = await carDao.getCarConfigByUserId(req.user.id);
            if (result.error) {
                res.status(404).json(result);
            } else {
                res.status(200).json({
                    "carModelId": result.carModelId,
                    "accessoryIds": result.accessoryIds
                });
            }
        } catch (err) {
            res.status(500).end();
        }
    }
);

/* API for saving a new car configuration */
app.post('/api/user/configuration', isLoggedIn,
    [
        check('carModelId').isInt({ min: 1 }),
        check('accessories').isArray(),
        check('accessories.*').isInt({ min: 1 })
    ],
    async (req, res) => {
        const errors = validationResult(req).formatWith(errorFormatter);
        if (!errors.isEmpty()) {
            return res.status(422).json(errors.errors);
        }

        const carConfig = {
            userId: req.user.id,
            carModelId: req.body.carModelId,
            accessories: req.body.accessories,
        };

        try {
            const result = await carDao.createCarConfig(carConfig);
            res.json(result);
        } catch (err) {
            res.status(503).json({ error: `Database error during the save of a new car configuration: ${err.message}` });
        }
    }
);

/* API for updating a user car configuration */
app.put('/api/user/configuration/edit', isLoggedIn,
    [
        check('carModelId').isInt({ min: 1 }),
        check('accessories').isArray(),
        check('accessories.*').isInt({ min: 1 })
    ],
    async (req, res) => {
        const errors = validationResult(req).formatWith(errorFormatter);
        if (!errors.isEmpty()) {
            return res.status(422).json(errors.errors);
        }

        const carConfig = {
            userId: req.user.id,
            carModelId: req.body.carModelId,
            accessories: req.body.accessories,
        };

        try {
            const result = await carDao.updateCarConfig(carConfig);
            res.json(result);
        } catch (err) {
            res.status(503).json({ error: `Database error during the update of the car configuration: ${err.message}` });
        }
    }
);

/* API for deleting a user car configuration */
app.delete('/api/user/configuration', isLoggedIn,
    async (req, res) => {
        try {
            const numChanges = await carDao.deleteCarConfig(req.user.id);
            res.status(200).json(numChanges);
        } catch (err) {
            res.status(503).json({ error: `Database error during the deletion of the configuration of the user ${req.user.id}: ${err.message}` });
        }
    }
);


/** Users APIs **/

/* API for performing login */
app.post('/api/sessions', function (req, res, next) {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        } else if (!user) {
            return res.status(401).json({ error: info });
        }

        /* Establish a login session */
        req.login(user, (err) => {
            if (err) {
                return next(err);
            }

            return res.json({
                email: user.email,
                name: user.name,
                isGoodClient: user.isGoodClient,
                hasCarConfiguration: user.hasCarConfiguration
            });
        });
    })(req, res, next);
});

/* API for checking if the user is logged in or not */
app.get('/api/sessions/current', (req, res) => {
    if(req.isAuthenticated()) {
        res.status(200).json(req.user);
    } else {
        res.status(401).json({error: 'Not authenticated'});
    }
});

/* API for logging out the current user */
app.delete('/api/sessions/current', (req, res) => {
    req.logout(() => {
        res.status(200).json({});
    });
});

/** Token APIs **/

/* API to get the authentication token */
app.get('/api/auth-token', isLoggedIn, (req, res) => {
    let userStatus = req.user.isGoodClient;

    const payloadToSign = { isGoodClient: userStatus, userId: req.user.id };
    const jwtToken = jsonwebtoken.sign(payloadToSign, jwtSecret, {expiresIn: expireTime});

    res.json({ token: jwtToken, isGoodClient: userStatus });
});

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
