const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { createServer } = require('node:http');
const userRoutes = require('./routes/userRoutes');
const db = require('./src/db/db');
const app = express();
const ejs = require('ejs');
const cookieParser = require('cookie-parser');
const server = createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
        socket.userId = token;
        next();
    } else {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {

    socket.on('joinRoom', (Id) => {
        let roomId = [Id.userId, Id.otherId].sort().join('_');
        socket.join(roomId);
        console.log(`User ${Id.userId} joined room ${roomId}`);
    });
    socket.on('chat message', (msg) => {
        const roomId = [msg.sender, msg.receiver].sort().join('_');
        io.to(roomId).emit('chat message', msg);
    });
    console.log('a user connected');
});

app.use(cookieParser());

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use('/', userRoutes);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
