const express = require('express');
const router = express.Router();
const User = require('../model/user');
const Message = require('../model/message');
const { registerUser, loginUser } = require('../controller/userController');
const auth = require('../middleware/auth')


router.get('/', auth, async (req, res) => {
    const messages = await Message.find().populate('sender', 'username').sort({ createdAt: -1 });


    res.render('index', { messages , userId: req.user._id });
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
    const { message } = req.body;
    await Message.create({ message, sender: req.user._id })
        .then(msg => res.status(201).json(msg))
        .catch(err => res.status(500).json({ error: 'Failed to send message' }));

    res.json({ message: 'Message sent successfully' });
});
router.get('/messages', auth, async (req, res) => {
    try {
        const messages = await Message.find().populate('sender', 'username').sort({ createdAt: -1 }).limit(50);
        res.json(messages);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

module.exports = router;