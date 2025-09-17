const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { createServer } = require('node:http');
const userRoutes = require('./routes/userRoutes');
const db = require('./src/db/db');
const app = express();
const ejs = require('ejs');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const server = createServer(app);

const io = new Server(server);
const Message = require('./model/message')
const Archieve = require('./model/archieve');
const { CronJob } = require('cron');
const User = require('./model/user');
const Group = require('./model/group');

const job = new CronJob(
    '0 0 23 * * *', // every day at 11 PM
    async function () {
        try {

            const messages = await Message.find();

            if (messages.length === 0) return;

            await Promise.all(messages.map(mes =>
                Archieve.create({
                    sender: mes.sender,
                    receiver: mes.receiver,
                    groupId: mes?.groupId,
                    message: mes.message,
                    type: mes.type,
                    createdAt: mes.createdAt
                })
            ));


            await Archieve.deleteMany({
                createdAt: { $lt: new Date(new Date().setDate(new Date().getDate() - 1)) }
            });


            await Message.deleteMany();

            console.log("Archived and cleared messages successfully");
        } catch (err) {
            console.error("Cron job failed:", err);
        }
    },
    null, // onComplete
    true, // start immediately
    'America/Los_Angeles'
);
// io.on('connection', (socket) => {
//     console.log('a user connected');
// });


// io.use((socket, next) => {
//     const token = socket.handshake.auth.token;
//     if (token) {
//         socket.userId = token;
//         next();
//     } else {
//         next(new Error('Authentication error'));
//     }
// });

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

        await Message.create({
            message: msg.message,
            sender: msg.sender,
            receiver: msg.receiver,
            type: "private"
        });
        const sender = await User.findById(msg.sender).select('_id username');
        const newMessage = {
            message: msg.message,
            sender,           // now sender is { _id, username }
            receiver: msg.receiver
        };
        io.to(roomId).emit('chatMessage', newMessage);


    });

    // Group Chat
    socket.on("joinGroup", (data) => {
        const { userId, groupId } = data;
        socket.join(groupId);
        console.log(`User ${userId} joined group ${groupId}`);
    });
    socket.on("groupMessage", async ({ sender, groupId, message }) => {
        const senderUser = await User.findById(sender).select("_id username");


        // Security: ensure sender is a member
        const group = await Group.findById(groupId);
        if (!group || !group.members.includes(sender)) {
            return; // ignore invalid senders
        }

        let mes = await Message.create({ message, sender, groupId, type: "group" });
        console.log(mes);
        // Emit to everyone in that group room
        io.to(groupId).emit("groupMessage", {
            message,
            sender: senderUser,
            groupId
        });
    });

});
io.on("connection_error", (err) => {
    console.error("Socket connection error:", err.message);
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
