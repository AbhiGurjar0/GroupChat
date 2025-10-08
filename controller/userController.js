const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const User = require('../model/user');
const bcrypt = require('bcrypt');


const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ error: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user._id }, 'Abhi', { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/');
};
const registerUser = async (req, res) => {
    const { userName, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username: userName, email, password: hashedPassword });
        await newUser.save();
        res.redirect('/login');
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }


};
const logoutUser = (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
}

module.exports = { loginUser, registerUser, logoutUser };
