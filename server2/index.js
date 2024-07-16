'use strict';

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { body, validationResult } = require("express-validator");
const { expressjwt: jwt } = require('express-jwt');

const jwtSecret = 'af9deb6ec190b44a318ae12c6c19384fd6ce33b678703c6d9d838d98def3a04c'

// init express
const app = new express();
const port = 3002;

const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
};
app.use(cors(corsOptions));

app.use(morgan('dev'));
app.use(express.json());

app.use(jwt({
    secret: jwtSecret,
    algorithms: ["HS256"],
}));

app.use( function (err, req, res, next) {
    console.log(err);
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({ errors: [{ 'param': 'Server', 'msg': 'Authorization error', 'path': err.code }] });
    } else {
        next();
    }
});

/** Estimation API **/

app.post('/api/estimate',
    [
        body('accessories').isArray(),
        body('accessories.*').isString()
    ],
    (req, res) => {
        const err = validationResult(req);
        const errList = [];
        if (!err.isEmpty()) {
            errList.push(...err.errors.map(e => e.msg));
            return res.status(400).json({errors: errList});
        }

        const isGoodClient = req.auth.isGoodClient;

        const accessories = req.body.accessories;
        const nChars = Array.from(accessories).filter(c => c !== ' ').length;
        let estimate = (nChars * 3) + Math.floor(Math.random() * 90) + 1;

        if (isGoodClient === 1) {
            const divisor = Math.floor(Math.random() * 3) + 2;
            estimate = Math.round(estimate / divisor);
            res.json({ days: estimate });
        } else {
            res.json({ days: estimate });
        }
    }
);

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
