const express = require("express");
const router = express.Router();
const User = require("../model/user");
const Message = require("../model/message");
const { registerUser, loginUser } = require("../controller/userController");
const auth = require("../middleware/auth");
const Group = require("../model/group");
const Archieve = require("../model/archieve");
const multer = require("multer");
const cloudinary = require("../routes/cloud");
const upload = multer({ dest: "uploads/" });

router.get("/", auth, async (req, res) => {
  // console.log(req.user)
  if (!req.user) {
    return res.render("login");
  }
  const Users = await User.find({ _id: { $ne: req.user._id } });
  const group = await Group.find();
  res.render("index", {
    userId: req.user._id,
    users: Users,
    group,
    messages: [],
    user: req.user,
    selectedUser: null,
    isGroup: false,
  });
});
router.get("/logout", auth, (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

router.post("/createGroup", auth, async (req, res) => {
  try {
    const { name } = req.body;

    const group = await Group.create({
      name,
      members: [req.user._id],
    });

    res.json({
      message: "Successfully created group",
      group,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/login", (req, res) => {
  res.render("login");
});
router.get("/chat/:otherId", auth, async (req, res) => {
  let userId = req.user._id;
  const user = await User.findOne({ _id: userId });
  let otherId = req.params.otherId;

  let selectedUser = await User.findOne({ _id: otherId });
  let isGroup = false;

  if (!selectedUser) {
    selectedUser = await Group.findById(otherId);
    if (selectedUser) {
      isGroup = true;
    }
  }

  let liveMessages = [],
    archivedMessages = [];

  if (isGroup) {
    const isMember = await Group.findOne({ _id: otherId, members: userId });

    if (isMember) {
      liveMessages = await Message.find({ groupId: otherId })
        .populate("sender", "username")
        .sort({ createdAt: -1 });
      archivedMessages = await Archieve.find({ groupId: otherId })
        .populate("sender", "username")
        .sort({ createdAt: -1 });
    }
  } else {
    liveMessages = await Message.find({
      $or: [
        { sender: userId, receiver: otherId },
        { sender: otherId, receiver: userId },
      ],
    })
      .populate("sender", "username")
      .sort({ createdAt: -1 });

    archivedMessages = await Archieve.find({
      $or: [
        { sender: userId, receiver: otherId },
        { sender: otherId, receiver: userId },
      ],
    })
      .populate("sender", "username")
      .sort({ createdAt: -1 });
  }

  let messages = [...liveMessages, ...archivedMessages];
  const group = await Group.find();

  messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const Users = await User.find({ _id: { $ne: userId } });

  res.render("index", {
    messages,
    userId: req.user._id,
    users: Users,
    user,
    group,
    selectedUser,
    isGroup,
  });
});

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});
router.get("/forgot", (req, res) => {
  res.render("forgot");
});

router.get("/messages", auth, async (req, res) => {
  try {
    const messages = await Message.find()
      .populate("sender", "username")
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.get("/group", auth, async (req, res) => {
  res.render("group");
});
router.post("/groups/create", auth, async (req, res) => {
  try {
    const { name, members } = req.body;
    console.log(members);
    const userId = req.user._id;
    let memId = [];
    for (let ele = 0; ele < members.length; ele++) {
      console.log(members[ele].toString());
      let usrid = await User.findOne({ phone: members[ele].toString() });
      console.log(usrid);
      memId.push(usrid);
    }

    const group = await Group.create({
      username: name,
      members: [userId, ...(memId || [])],
      createdBy: userId,
    });
    console.log(group);

    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/addMemberToGroup", auth, async (req, res) => {
  try {
    const { groupId, members } = req.body;
    console.log(groupId);
    const group = await Group.findById(groupId);
    console.log(group);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    let memId = [];
    for (i in members) {
      let usrid = await User.findOne({ phone: members[i].toString() });
      memId.push(usrid);
    }
    memId.forEach((mem) => {
      if (!group.members.includes(mem)) {
        group.members.push(mem);
      }
      console.log("done");
    });
    await group.save();

    res
      .status(200)
      .json({ success: true, message: "Member added successfully", group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
