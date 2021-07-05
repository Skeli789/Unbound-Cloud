/*
    Various configuration details for the server.
*/

var os = require("os");

const config = {
    secretKey: "secretKey",
    hostType: os.type(),
    dev_client : "http://localhost:3000",
    dev_email: "pokemonunboundteam@gmail.com",
    dev_epass: "pokemonunboundteam"
}

module.exports = config;
