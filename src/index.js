var mosca = require('mosca')
var fetch = require('node-fetch');

var pubsubsettings = {
	type: 'redis',
	redis: require('redis'),
	db: process.env.REDIS_DB,
	port: process.env.REDIS_PORT,
	return_buffers: true,
	host: process.env.REDIS_HOST
};

if (process.env.REDIS_PASSWORD) {
	pubsubsettings.password = process.env.REDIS_PASSWORD;
}

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
	console.log(`published ${JSON.stringify(packet)}`);
	if (client) {
		if ('organization' in client) {
			var data = {
				payload: packet.payload.toString(),
				topic: packet.topic,
				organizationId: client.organizationId
			};
			fetch(process.env.HLS_HOST + '/dac/Data', { 
                method: 'POST', 
                body: JSON.stringify( data ),
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
            }).then((response) => {
				return response.json()
			}).catch((error) => {
				console.warn(error);
			})
		}
	}
});

// Accepts the connection if the username and password are valid
var authenticate = function(client, username, password, callback) {
	console.log(`authenticate... ${client.id}`)
	if (username == "HLS:AccessToken") {
		fetchAccessToken(password).then((response) => {
			client.organization = response.organization;
			client.organizationId = response.organizationId;
			client.username = response.username;
			client.policy = response.policy;
			callback(null, true);
		}).catch((error) => {
			console.error(error);
			callback(null, false);
		});
	} else {
		callback(null, false);
	}
}

function fetchAccessToken(token) {
	return fetch(process.env.HLS_HOST + '/iam/AccessToken?accessToken='+token).then((response) => {
		return response.json()
	})
}

var checkPolicy = require("./iam_policy").checkPolicy

// In this case the client authorized as alice can publish to /users/alice taking
// the username from the topic and verifing it is the same of the authorized user
var authorizePublish = function(client, topic, payload, callback) {
	var authorized = checkPolicy(client.policy, "hls:dac:Publish", topic)
	callback(null, authorized);
}

// In this case the client authorized as alice can subscribe to /users/alice taking
// the username from the topic and verifing it is the same of the authorized user
var authorizeSubscribe = function(client, topic, callback) {
	var authorized = checkPolicy(client.policy, "hls:dac:Subscribe", topic)
	callback(null, authorized);
}

// fired when the mqtt server is ready
function setup() {
	console.log('Mosca server is up and running')
	server.authenticate = authenticate;
	server.authorizePublish = authorizePublish;
	server.authorizeSubscribe = authorizeSubscribe;
}