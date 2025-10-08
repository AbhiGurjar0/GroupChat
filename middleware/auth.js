
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const User = require('../model/user');

const auth = async (req, res, next) => {
    const token = req.cookies.token;
    



    try {
        if (!token) {
            console.log('No token provided');
            return res.redirect('/login');

        }
        const decoded = jwt.verify(token, 'Abhi');
       
        req.user = await User.findById(decoded.id);
        // console.log(req.user);
        next();
    } catch (error) {
        console.error('Invalid token');
        return res.redirect('/login');

    }
};

module.exports = auth;
