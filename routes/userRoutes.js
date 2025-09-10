const express = require('express');
const router = express.Router();
const User = require('../model/user');
const Message = require('../model/message');
const { registerUser, loginUser } = require('../controller/userController');
const auth = require('../middleware/auth');
const Group = require('../model/group');
const Archieve = require('../model/archieve');


router.get('/', auth, async (req, res) => {

    const Users = await User.find({ _id: { $ne: req.user._id } });
    const group = await Group.find();

    res.render('index', { userId: req.user._id, users: Users, group });
})

router.post('/createGroup', auth, async (req, res) => {
    try {
        const { name } = req.body;

        const group = await Group.create({
            name,
            members: [req.user._id]
        });

        res.json({
            message: "Successfully created group",
            group
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
    }
})

router.get('/:otherId', auth, async (req, res) => {
    let userId = req.user._id;
    const user = await User.findOne({ _id: userId });
    let otherId = req.params.otherId;
    const liveMessages = await Message.find({
        $or: [
            { sender: userId, receiver: otherId },
            { sender: otherId, receiver: userId }
        ]
    })
        .populate('sender', 'username')
        .sort({ createdAt: -1 });

    const archivedMessages = await Archieve.find({
        $or: [
            { sender: userId, receiver: otherId },
            { sender: otherId, receiver: userId }
        ]
    })
        .populate('sender', 'username')
        .sort({ createdAt: -1 });

   
    let messages = [...liveMessages, ...archivedMessages];


    messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const Users = await User.find({ _id: { $ne: req.user._id } });

    res.render('chat', { messages, userId: req.user._id, users: Users, user });



})
router.get('/login', (req, res) => {
    res.render('login');
});
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/forgot', (req, res) => {
    res.render('forgot');
})


router.get('/messages', auth, async (req, res) => {
    try {
        const messages = await Message.find().populate('sender', 'username').sort({ createdAt: -1 }).limit(50);
        return res.json(messages);
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

module.exports = router;