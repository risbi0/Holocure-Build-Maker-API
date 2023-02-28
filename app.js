const express = require('express');
const redis = require('redis');

// middleware
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require("express-rate-limit");

// load .env file
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// connect to Redis database
let redisClient;

(async () => {
    redisClient = redis.createClient({
        url: process.env.URL,
        password: process.env.PASSWORD
    });

    redisClient.on('error', (error) => console.error(`Error : ${error}`));

    await redisClient.connect();
})();

const corsOptions = process.env.NODE_ENV === 'development' ? cors() : cors({origin: 'https://risbi0.github.io'});

const logger = morgan('[:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":user-agent"');

const limiter = rateLimit({
    windowMs: 1000,
    max: 10
});

app.use(corsOptions);
app.use(logger);
app.use(limiter);

app.get('/get', async (req, res) => {
    const param = req.query.id;
    
    try {
        const response = await redisClient.get(param);
        if (!response) throw 'ID not found.'
        res.status(200).send({id: response});
    } catch (error) {
        res.status(404).send(error);
    }
});

app.get('/set', async (req, res) => {
    const arg = req.query;
    const id = Object.keys(arg)[0];
    const longId = arg[id];
  
    await redisClient.set(id, longId);
    res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});