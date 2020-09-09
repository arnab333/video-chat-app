const express = require('express');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const socket = require('socket.io');
const { ExpressPeerServer } = require('peer');

const app = express();
const server = http.Server(app);
const io = socket(server);

const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res, next) {
  res.redirect(`/${uuidv4()}`);
});

app.get('/:roomId', function (req, res, next) {
  res.render('room', { roomId: req.params.roomId });
});

app.use('/peerjs', peerServer);

io.on('connection', function (socketObj) {
  socketObj.on('join-room', function (roomId, userId) {
    socketObj.join(roomId);
    socketObj.to(roomId).broadcast.emit('user-connected', userId);

    // messages
    socketObj.on('message', function (message) {
      //send message to the same room
      io.to(roomId).emit('createMessage', message);
    });
  });
});

server.listen(process.env.PORT || 3000);
