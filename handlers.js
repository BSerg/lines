const fs = require('fs');
const readline = require('readline');
const {v4: uuid} = require('uuid');
const {
    addFile,
    addLine,
    addFileLine,
    addLineLetter,
    addFileToFiles,
    addLineToLines,
    addProcess,
    updateProcess,
    finishProcess,
    getProcess,
    getFile,
    getLineByKey,
    getLineMostFrequentLetter,
    getRandomLine,
    getLongestLines,
    getRandomFile,
    getLongestLinesFromFile,
} = require('./repository');
const {createSimpleXml} = require('./utils');

const handleFile = async (file, processId) => {
    const fileId = uuid();

    await addProcess(processId, fileId);

    await addFile(fileId, file.filename, file.originalname);
    await addFileToFiles(fileId);

    const fileStream = fs.createReadStream(file.path);
    const lines = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });
    let lineNum = 0;
    for await (const line of lines) {
        if (line.length) {
            await Promise.all([
                addLine(fileId, lineNum, line, line.length),
                addLineToLines(fileId, lineNum, line.length),
                addFileLine(fileId, lineNum, line.length),
                Promise.all(
                    Array.from(line).map((letter) =>
                        addLineLetter(fileId, lineNum, letter)
                    )
                ),
            ]);
            await updateProcess(processId, lineNum + 1);
        }
        lineNum++;
    }
    await finishProcess(processId);
};

const homePageHandler = (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
        <body>
            <h1>Upload text files</h1>
            <form action="/upload" method="post" enctype="multipart/form-data" >
                <input type="file" name="file" accept=".txt" multiple="multiple" />
                <input type="submit" value="Upload" />
            </form>
        </body>
    </html>
    `);
};

const processHandler = async (req, res, next) => {
    const processId = req.params.id;
    const processData = await getProcess(processId);
    const fileData = await getFile(processData.fileId);
    return res.send(`
    <!DOCTYPE html>
    <html>
        <body>
            <h1>File process</h1>
            <div>ID: ${processData.id}</div>
            <div>File name: ${fileData.originalName}</div>
            <div>Lines processed: ${processData.count}</div>
            <div>Status: ${processData.status}</div>
            <div>Started at: ${processData.startedAt}</div>
            ${
                processData.finishedAt
                    ? `<div>Finished at: ${processData.finishedAt}</div>`
                    : ''
            }
        </body>
    </html>
    `);
};

const uploadHandler = async (req, res, next) => {
    try {
        const processIds = [];
        req.files.map((file) => {
            const processId = uuid();
            processIds.push(processId);
            setImmediate(() => handleFile(file, processId));
        });
        res.send(`
        <!DOCTYPE html>
        <html>
            <body>
                <h1>Files uploaded</h1>
                <div>Files: ${req.files.length}</div>
                <div>Processes: ${processIds
                    .map((id) => `<a href="/upload/process/${id}">${id}</a>`)
                    .join(', ')}</div>
            </body>
        </html>
        `);
    } catch (err) {
        console.error(err);
        next(err);
    }
};

const randomLineHandler = async (req, res, next) => {
    try {
        const isReversed = req.query.reversed === '1';
        const lineKey = await getRandomLine();
        const lineData = await getLineByKey(lineKey);
        const fileData = await getFile(lineData.fileId);
        const letter = await getLineMostFrequentLetter(
            lineData.fileId,
            lineData.lineNum
        );

        const value = isReversed
            ? lineData.value.split('').reverse().join('')
            : lineData.value;

        switch (req.headers['content-type']) {
            case 'text/plain':
                return res.send(value);
            case 'application/json':
                res.type('json');
                return res.send({
                    line: value,
                    file: fileData.originalName,
                    number: lineData.lineNum,
                    letter,
                });
            case 'application/xml':
                res.type('xml');
                return res.send(
                    createSimpleXml(
                        {
                            line: value,
                            file: fileData.originalName,
                            number: lineData.lineNum,
                            letter,
                        },
                        'randomLine'
                    )
                );
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
};

const longestLinesHandler = async (req, res, next) => {
    try {
        const limit = req.query.limit ?? 100;
        const lines = await getLongestLines(limit);
        switch (req.headers['content-type']) {
            case 'text/plain':
                return res.send(lines.map((line) => line.value).join('\n'));
            case 'application/json':
                res.type('json');
                return res.send(lines.map((line) => line.value));
            case 'application/xml':
                res.type('xml');
                return res.send(
                    createSimpleXml(
                        lines.map((line) => ({line: line.value})),
                        'longestLines'
                    )
                );
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
};

const longestLinesInFileHandler = async (req, res, next) => {
    try {
        const limit = req.query.limit ?? 20;
        const file = await getRandomFile();
        const lines = await getLongestLinesFromFile(file.id, limit);
        switch (req.headers['content-type']) {
            case 'text/plain':
                return res.send(lines.map((line) => line.value).join('\n'));
            case 'application/json':
                res.type('json');
                return res.send({
                    file: file.originalName,
                    lines: lines.map((line) => line.value),
                });
            case 'application/xml':
                res.type('xml');
                return res.send(
                    createSimpleXml(
                        {
                            file: file.originalName,
                            lines: lines.map((line) => ({line: line.value})),
                        },
                        'longestLinesInFile'
                    )
                );
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
};

module.exports = {
    homePageHandler,
    processHandler,
    uploadHandler,
    randomLineHandler,
    longestLinesHandler,
    longestLinesInFileHandler,
};
