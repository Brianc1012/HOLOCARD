const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = express();

// Serve static files (adjust if your HTML/CSS/JS are in different folders)
app.use(express.static(path.join(__dirname)));

// SSL cert and key
const options = {
  key: fs.readFileSync('./cert/key.pem'),
  cert: fs.readFileSync('./cert/cert.pem')
};

// Start HTTPS server
https.createServer(options, app).listen(443, () => {
  console.log('HTTPS Server running at https://localhost');
});

const userRouter = require('./routes/user');

app.use('/users', userRouter);

function logger(req, res, next) {
    console.log('Request URL:', req.originalUrl);
    next();
}

