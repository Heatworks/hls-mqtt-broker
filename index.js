var mosca = require('mosca')

console.log(process.env.REDIS_URL)

// redis://h:pclqdi7k1c4mnu7us5jqs2619sj@ec2-184-72-246-90.compute-1.amazonaws.com:11359
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
      if (elements == 2) {
        const [ timestamp, value ] = elements
      }
    }
  }
  
});

// Accepts the connection if the username and password are valid
var authenticate = function(client, username, password, callback) {
  console.log(`authenticate... ${client} ${username} ${password}`)
  if (username == "Auth:JWT") {
    client.organization = "heatworks";
    callback(null, true);
    return;
  }
  var authorized = (username === 'wcatron' && password.toString() === 'secret');
  if (authorized) {
    client.user = username;
    client.organization = "heatworks";
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