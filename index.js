var mosca = require('mosca')
var pg = require('pg')
require('dotenv').config()

var client = new pg.Client({
    host     : process.env.SQL_HOST,
    user     : process.env.SQL_USERNAME,
    password : process.env.SQL_PASSWORD,
    database : process.env.SQL_DB,
    port     : process.env.SQL_PORT
});

var parts = process.env.REDIS_URL.split(":")
var port = parseInt(parts[3])
var parts2 = process.env.REDIS_URL.split("@")
var host = parts2[1].split(":")[0]
var password = parts2[0].split(":")[2]

console.log(` port: ${port} host: ${host} password: ${password}`)

var pubsubsettings = {
  type: 'redis',
  redis: require('redis'),
  db: 12,
  port,
  return_buffers: true, // to handle binary payloads
  host,
  password
};

var moscaSettings = {
  port: 1883,           //mosca (mqtt) port
  backend: pubsubsettings,   //pubsubsettings is the object we created above 
  http: {
    port: 1884,
    bundle: true,
    static: './'
  }
};

client.connect(function (err) {
  console.log('PG: Connected!')
})

var server = new mosca.Server(moscaSettings);   //here we start mosca
server.on('ready', setup);  //on init it fires up setup()

server.on('clientConnected', function(client) {
    console.log('client connected', client.id);
    return true;
});

// fired when a client disconnects
server.on('clientDisconnected', function(client) {
  console.log('Client Disconnected:', client.id);
});

// fired when a message is received
server.on('published', function(packet, client) {
  //console.log(`published ${JSON.stringify(packet)}`);
  if (client) {
    if ('organization' in client) {
      elements = packet.payload.toString().split(",");
      console.log(`${client.organization}: topic: ${packet.topic} ${elements.join(", ")}`);
      if (elements.length == 2) {
        const [ timestamp, value ] = elements
        var elements = packet.topic.split("/devices/")[1].split("/")
        var channel = elements.pop();
        var timestampDate = new Date(0);
        timestampDate.setUTCMilliseconds(timestamp * 1000)
        insertRecord(client.organization_id, timestampDate, channel, elements.join("/"), parseFloat(value), parseInt(value));
      }
    }
  }
});

function insertRecord(organization_id, timestamp, channel, device, floatValue, integerValue) {
  var params = [organization_id, timestamp, channel, device, floatValue, integerValue];
  query = "INSERT INTO lab_messages VALUES ($1, $2, $3, $4, $5, $6);"
  client.query(query, params, function (err, result) {
    if (err) {
      console.warn(err)
    }
});
}

// Accepts the connection if the username and password are valid
var authenticate = function(client, username, password, callback) {
  console.log(`authenticate... ${client} ${username} ${password}`)
  if (username == "Auth:JWT") {
    client.organization = "heatworks";
    client.organization_id = 0;
    callback(null, true);
    return;
  }
  var authorized = (username === 'wcatron' && password.toString() === 'secret');
  if (authorized) {
    client.user = username;
    client.organization = "heatworks";
    client.organization_id = 0;
  }
  callback(null, authorized);
}

// In this case the client authorized as alice can publish to /users/alice taking
// the username from the topic and verifing it is the same of the authorized user
var authorizePublish = function(client, topic, payload, callback) {
  var authorized = client.organization == topic.split('/')[2];
  // console.log(`${authorized ? 'Authorized!' : 'Not Authorized'}`);
  if (!authorized) {
      console.log('Could not authenticate: '+topic);
        //console.log(client);
  }
  if (topic == "connected") {
      callback(null, true);
  }
  callback(null, authorized);
}

// In this case the client authorized as alice can subscribe to /users/alice taking
// the username from the topic and verifing it is the same of the authorized user
var authorizeSubscribe = function(client, topic, callback) {
  var authorized = client.organization == topic.split('/')[2];
  console.log(`${authorized ? 'Authorized!' : 'Not Authorized'}`);
  if (!authorized) {
      console.log('Could not authenticate: '+topic);
        //console.log(client);
  }
  if (topic == "connected") {
      callback(null, true);
  }
  callback(null, authorized);
}

// fired when the mqtt server is ready
function setup() {
  console.log('Mosca server is up and running')
  server.authenticate = authenticate;
  server.authorizePublish = authorizePublish;
  server.authorizeSubscribe = authorizeSubscribe;
}