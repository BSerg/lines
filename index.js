const express = require('express');
const multer = require('multer');

const {
    uploadHandler,
    randomLineHandler,
    longestLinesHandler,
    longestLinesInFileHandler,
    processHandler,
    homePageHandler,
} = require('./handlers');
const {client} = require('./repository');

const uploadDest = process.env.UPLOAD_DESTINATION ?? 'uploads';
const port = process.env.PORT ?? 3000;

const app = express();
app.use(express.text());
app.use(express.json());

const upload = multer({dest: uploadDest});

const checkContentTypeMiddleware = (req, res, next) => {
    switch (req.headers['content-type']) {
        case 'text/plain':
        case 'application/json':
        case 'application/xml':
            next();
            break;
        default:
            res.status(400);
            res.send('Invalid Content-Type');
    }
};

app.get('/', homePageHandler);
app.post('/upload', upload.array('file'), uploadHandler);
app.get('/upload/process/:id', processHandler);
app.get('/line/random', checkContentTypeMiddleware, randomLineHandler);
app.get('/line/longest', checkContentTypeMiddleware, longestLinesHandler);
app.get(
    '/line/longest/file',
    checkContentTypeMiddleware,
    longestLinesInFileHandler
);

app.use((err, req, res, next) => {
    res.status(500);
    res.send('Oops, something went wrong.');
});

(async () => {
    await client.connect();
    app.listen(port);
})();
