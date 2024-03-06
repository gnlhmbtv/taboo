const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

require('dotenv').config();

// Load env vars
dotenv.config({ path: './config/config.env' });

const app = express();

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 5000;

app.listen(
    PORT,
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);
