var mosca = require('mosca')

console.log(process.env.REDIS_URL)

// redis://h:pclqdi7k1c4mnu7us5jqs2619sj@ec2-184-72-246-90.compute-1.amazonaws.com:11359
var parts = process.env.REDIS_URL.split(":")
var port = parts[3]
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
  backend: pubsubsettings   //pubsubsettings is the object we created above 

};

var server = new mosca.Server(moscaSettings);   //here we start mosca
server.on('ready', setup);  //on init it fires up setup()

// fired when the mqtt server is ready
function setup() {
  console.log('Mosca server is up and running')
}

server.on('clientConnected', function(client) {
    console.log('client connected', client.id);
});

// fired when a message is received
server.on('published', function(packet, client) {
  console.log('Published', packet.payload);
});