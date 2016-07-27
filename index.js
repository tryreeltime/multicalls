'use strict';

var os = require('os');
var http = require('http');
var socketIO = require('socket.io');
var express = require('express');

var server = require('http').createServer();

var app = express();

app.use(express.static(__dirname + '/client'));

app.get('/', function(req, res) {
	res.render('index');
});

// var app = http.createServer(function(req, res) {
// 	fileServer.serve(req, res);
// }).listen(8080);

console.log('listening to port', 8080);

var io = socketIO.listen(server);
io.sockets.on('connection', function(socket) {
	// Convenience function t log server messages on the client
	function log() {
		var array = ['Message from server: '];
		array.push.apply(array, arguments);
		socket.emit('log', array);
	}

	socket.on('message', function(message) {
		log('Client said: ', message);
		// for a real app, would be room-only (not broadcast)
		socket.broadcast.emit('message', message);
	});

	socket.on('create or join', function(room) {
		log('Received request to create or join room ' + room);

		var numClients = io.sockets.sockets.length;
		log('Room ' + room + ' now has ' + numClients + ' clients(s)');

		if (numClients === 1) {
			socket.join(room);
			log('Client ID ' + socket.id + ' created room ' + room);
			socket.emit('created', room, socket.id);
		} else if (numClients >= 2) {
			log('Client ID ' + socket.id + ' joined room ' + room);
			io.sockets.in(room).emit('join', room);
			socket.join(room);
			socket.emit('joined', room, socket.id);
			io.sockets.in(room).emit('ready');
		} else { // max two clients
			socket.emit('full', room);
		}
	});

	socket.on('ipaddr', function() {
		var ifaces = os.networkInterfaces();
		for (var dev in ifaces) {
			ifaces[dev].forEach(function(details) {
				if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
					socket.emit('ipaddr', details.address);
				}
			});
		}
	});
});

server.on('request', app);

server.listen(8000, function() {
	console.log('server listening to port 8000');
})







