const express = require('express');
const fs = require('fs');
const multer = require('multer');
const upload = multer();
const { promisify } = require('util');
const { v4 } = require('uuid');
const cors = require('cors')

const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);

const app = express();

app.use(cors({
    origin: '*'
  }));
  app.use(cors({
    methods: '*'
  }));
// make sure messages folder exists
const messageFolder = './public/messages/';
if (!fs.existsSync(messageFolder)) {
  fs.mkdirSync(messageFolder);
}


app.use(express.static('public'));
app.use(express.json());

app.get('/messages', (req, res) => {
  readdir(messageFolder)
    .then(messageFilenames => {
      res.status(200).json({ messageFilenames });
    })
    .catch(err => {
      console.log('Error reading message directory', err);
      res.sendStatus(500);
    });
});

app.post('/messages', (req, res) => {
  if (!req.body.message) {
    return res.status(400).json({ error: 'No req.body.message' });
  }
  const messageId = v4();
  writeFile(messageFolder + messageId, req.body.message, 'base64')
    .then(() => {
      res.status(201).json({ message: 'Saved message' });
    })
    .catch(err => {
      console.log('Error writing message to file', err);
      res.sendStatus(500);
    });
});

app.use(express.static(__dirname));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});