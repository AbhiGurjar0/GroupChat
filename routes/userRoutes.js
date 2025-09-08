const express = require('express');
const router = express.Router();
const User = require('../model/user');
const Message = require('../model/message');
const loginUser = require('../controllers/userController').loginUser;

router.get('/', (req, res) => {
    
    res.render('index');
})
router.get('/login', loginUser);
router.get('/forgot', (req, res) => {
    res.render('forgot');
})
router.post('/message',auht, async (req, res) => {
    const { message } = req.body;
    await Message.create({ message, sender: req.user._id })
        .then(msg => res.status(201).json(msg))
        .catch(err => res.status(500).json({ error: 'Failed to send message' }));

    res.json({ message: 'Message sent successfully' });
});

module.exports = router;