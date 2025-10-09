const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { createServer } = require("node:http");
const userRoutes = require("./routes/userRoutes");
const db = require("./src/db/db");
const app = express();
const ejs = require("ejs");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const server = createServer(app);

const io = new Server(server);
const Message = require("./model/message");
const Archieve = require("./model/archieve");
const { CronJob } = require("cron");
const User = require("./model/user");
const Group = require("./model/group");

const multer = require("multer");
const cloudinary = require("./routes/cloud");
const upload = multer({ dest: "uploads/" });

const job = new CronJob(
  "0 0 23 * * *", // every day at 11 PM
  async function () {
    try {
      const messages = await Message.find();

      if (messages.length === 0) return;

      await Promise.all(
        messages.map((mes) =>
          Archieve.create({
            sender: mes.sender,
            receiver: mes.receiver,
            groupId: mes?.groupId,
            message: mes.message,
            type: mes.type,
            createdAt: mes.createdAt,
          })
        )
      );

      await Archieve.deleteMany({
        createdAt: {
          $lt: new Date(new Date().setDate(new Date().getDate() - 1)),
        },
      });

      await Message.deleteMany();

      console.log("Archived and cleared messages successfully");
    } catch (err) {
      console.error("Cron job failed:", err);
    }
  },
  null, // onComplete
  true, // start immediately
  "America/Los_Angeles"
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

io.on("connection", (socket) => {
  console.log("a user connected");

  // Private Chat
  socket.on("joinRoom", (data) => {
    const roomId = [data.userId, data.otherId].sort().join("_");
    socket.join(roomId);
    console.log(`User ${data.userId} joined private room ${roomId}`);
  });

  socket.on("chatMessage", async (msg) => {
    console.log("Received:", msg);
    const roomId = [msg.sender, msg.receiver].sort().join("_");
    let fileUrl = null;
    let mediaType = null;
    if (msg.file) {
      const result = await cloudinary.uploader.upload(msg.file, {
        folder: "chat_media", // optional folder in Cloudinary
        resource_type: "auto", // auto-detect image/video/etc
      });
      fileUrl = result.secure_url;
      mediaType = result.resource_type;
    }

    // Save message to DB
    // console.log(msg.file)
    const savedMsg = await Message.create({
      message: msg.message || null,
      mediaUrl: fileUrl,
      mediaType: mediaType,
      sender: msg.sender,
      receiver: msg.receiver,
      type: msg.type || "private",
    });

    const sender = await User.findById(msg.sender).select("_id username");

    const newMessage = {
      _id: savedMsg._id,
      message: savedMsg.message,
      file: savedMsg.mediaUrl,
      mediaType: mediaType,
      type: savedMsg.type,
      sender,
      receiver: msg.receiver,
      createdAt: savedMsg.createdAt,
    };

    io.to(roomId).emit("chatMessage", newMessage);
  });

  // Group Chat
  socket.on("joinGroup", (data) => {
    const { userId, groupId } = data;
    socket.join(groupId);
    console.log(`User ${userId} joined group ${groupId}`);
  });
  socket.on("groupMessage", async (msg) => {
    const { sender, groupId, message, file, fileName, type } = msg;

    const senderUser = await User.findById(sender).select("_id username");

    // Security check: sender must be in group
    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(sender)) {
      return; // ignore invalid senders
    }
    let fileUrl = null;
    let mediaType = null;
    if (msg.file) {
      const result = await cloudinary.uploader.upload(msg.file, {
        folder: "chat_media", // optional folder in Cloudinary
        resource_type: "auto", // auto-detect image/video/etc
      });
      fileUrl = result.secure_url;
      mediaType = result.resource_type;
    }

    // Save to DB
    const savedMsg = await Message.create({
      message: msg.message || null,
      mediaUrl: fileUrl,
      mediaType: mediaType,
      sender,
      groupId,
      type: msg.type || "group",
    });

    // Emit to everyone in group
    io.to(groupId).emit("groupMessage", {
      _id: savedMsg._id,
      message: savedMsg.message,
      file: savedMsg.mediaUrl,
      mediaType: mediaType,
      type: savedMsg.type,
      sender: senderUser,
      groupId,
      createdAt: savedMsg.createdAt,
    });
  });
});
io.on("connection_error", (err) => {
  console.error("Socket connection error:", err.message);
});

app.use(cookieParser());
app.get("/favicon.ico", (req, res) => res.status(204).end());

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use("/", userRoutes);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
