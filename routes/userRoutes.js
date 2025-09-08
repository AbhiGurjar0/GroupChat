const express = require('express');
const router = express.Router();
const User = require('../model/user');
const Message = require('../model/message');
const { registerUser, loginUser } = require('../controller/userController');
const auth = require('../middleware/auth')


router.get('/', auth, async (req, res) => {
    const messages = await Message.find().populate('sender', 'username').sort({ createdAt: -1 });
    const Users = await User.find({_id: { $ne: req.user._id }});

    res.render('index', { messages, userId: req.user._id, users: Users });
})
router.get('/login', (req, res) => {
    res.render('login');
});
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/forgot', (req, res) => {
    res.render('forgot');
})
router.post('/message', auth, async (req, res) => {
    try {
        const { message } = req.body;
        const msg = await Message.create({ message, sender: req.user._id });

        return res.status(201).json({
            success: true,
            msg
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to send message' });
    }
});

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