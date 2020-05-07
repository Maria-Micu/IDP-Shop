const express = require('express')
var bodyParser = require('body-parser')
const axios = require("axios");
const mysql = require('mysql2')

const app = express()
const port = 5004

// Custom helpers
//const query = require('./query');

const SERVICE_NAME = "Shop";

// Endpoints
const GET_FAV_URL = "http://favorites:5002/fav/";
const MONITORING_URL = "http://monitoring:5005/log";

var promisePool;

var jsonParser = bodyParser.json()

// POST /login gets urlencoded bodies
app.post('/shop/:guid', jsonParser, async function (req, res) {
    postAsyncLog("Endpoint create shop called")

    const favResponse = await fetchFavoritesForGuid(req.params.guid) //favorites
    const favDetailsRows = favResponse.data.favDetails

    postAsyncLog(`Shopped Results to be bought fetched: ${favDetailsRows}`)

    favDetailsRows.forEach(async element => {
        const queryString = `INSERT INTO shop (guid, item, state) VALUES (${element.guid}, '${element.item}',
        'ready')`;

        await promisePool.query(queryString)
    });
    postAsyncLog(`Shopped Results were added for guid: ${req.params.guid}`)

    await promisePool.query(`DELETE FROM fav WHERE guid = '${req.params.guid}'`)

    postAsyncLog(`Emptyed the favorites and shopped the items for guid: ${req.params.guid}`)

    res.send("")
})

app.get('/shop/:guid', jsonParser, async function (req, res) {
    postAsyncLog("Endpoint fetch shop called")

    const queryString = `select * from shop where guid = ${req.params.guid}`;

    const shopDetailsRows = await promisePool.query(queryString)

    shopDetailsRows.forEach(element => {
        res.json({ shopDetailsRows })
    });
    postAsyncLog(`Fetched shop details for guid: ${req.params.guid}`)
})

app.get('/', (req, res) => res.send('It is working!'))

// Define http Method For generic use
const postAsyncLog = async message => {
    try {
        params = {
            service: SERVICE_NAME,
            timestamp: Date.now(),
            message: message,
        }

        const response = await axios.post(MONITORING_URL, params);
        if(response.status == 200) {
            console.log("Successfully sent to monitoring");
        }   
    } catch (error) {
        console.log(error);
    }
};

const fetchFavoritesForGuid = async guid => {
    try {
        const response = await axios.get(GET_FAV_URL + guid);
        return response;
    } catch (error) {
        console.log(error);
    }
};

// Start server and establish connection to db
app.listen(port, () => {

    console.log(`Example app listening at http://localhost:${port}`)
    console.log(`Establish connection to db...`)

    const pool = mysql.createPool({
        host: 'database',
        user: 'root',
        database: 'mycompanydb',
        password: 'admin',
        port: 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    // now get a Promise wrapped instance of that pool
    promisePool = pool.promise();
   
})