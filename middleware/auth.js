
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const User = require('../model/user');

const auth = async (req, res, next) => {
    const token = req.cookies.token;;
    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        req.user = await User.findById(decoded.id);
        next();
    } catch (error) {
        console.error('Invalid token');
        return res.status(401).json({ error: 'Access denied. Invalid token.' });
    }
};

module.exports = auth;
