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
const Message = require('./model/message')
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
    console.log('a user connected');

    // Private Chat 
    socket.on('joinRoom', (data) => {
        const roomId = [data.userId, data.otherId].sort().join('_');
        socket.join(roomId);
        console.log(`User ${data.userId} joined private room ${roomId}`);
    });

    socket.on('chatMessage', async (msg) => {
        const roomId = [msg.sender, msg.receiver].sort().join('_');
        console.log("private")
        await Message.create({
            message: msg.message,
            sender: msg.sender,
            receiver: msg.receiver,
            type: "private"
        });
        io.to(roomId).emit('chatMessage', msg);
    });

    // Group Chat
    socket.on("joinGroup", (data) => {
        const { userId, groupId } = data;
        socket.join(groupId);
        console.log(`User ${userId} joined group ${groupId}`);
    });

    socket.on('groupMessage', async (msg) => {
       
        const { sender, groupId, message } = msg;
        await Message.create({
            message,
            sender,
            groupId,
            type: "group"
        });
        io.to(groupId).emit('chatMessage', msg);
    });
});

app.use(cookieParser());
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use('/', userRoutes);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
