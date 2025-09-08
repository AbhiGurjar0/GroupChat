const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const User = require('../model/user');


const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const User = await User.findOne({ email });
    if (!User) {
        return res.status(400).json({ error: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(req.body.password, User.password);
    if (!isMatch) {
        return res.status(400).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: User._id }, 'your_jwt_secret', { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true });
    res.status(200).json({ message: 'Login successful' });
};
const registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Server error' });
    }


};

module.exports = { loginUser, registerUser };
