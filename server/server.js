/*
    Boilerplate code for starting the server.
*/

require('dotenv').config({path: __dirname + '/.env'});
const app = require('./app');

// Server to run app.js
app.listen(process.env.PORT || 3001, () => {
    console.log("server running on 3001");
});
