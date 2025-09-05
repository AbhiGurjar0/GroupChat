const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const db = require('./src/db/db');
const app = express();
const ejs = require('ejs');
app.set('view engine', 'ejs');
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use('/', userRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
