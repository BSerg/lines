const {createClient} = require('redis');
const {
    getFileKey,
    getFilesKey,
    getLineKey,
    getFileLinesKey,
    getLineLettersKey,
    getLinesKey,
    getFileProcessKey,
} = require('./utils');

const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';

const client = createClient({url: redisUrl});

const hmSet = async (key, ...args) => {
    const promises = [];
    for (let i = 0; i < args.length - 1; i = i + 2) {
        promises.push(client.hSet(key, args[i], args[i + 1]));
    }
    return Promise.all(promises);
};

module.exports = {
    client,
    getProcess: async (id) => {
        return client.hGetAll(getFileProcessKey(id));
    },
    addProcess: async (id, fileId) => {
        await hmSet(
            getFileProcessKey(id),
            'id',
            id,
            'fileId',
            fileId,
            'count',
            0,
            'status',
            'started',
            'startedAt',
            Date.now()
        );
    },
    updateProcess: async (id, lineNum) => {
        await hmSet(
            getFileProcessKey(id),
            'count',
            lineNum,
            'status',
            'processing'
        );
    },
    finishProcess: async (id) => {
        await hmSet(
            getFileProcessKey(id),
            'status',
            'finished',
            'finishedAt',
            Date.now()
        );
    },
    getFiles: async () => {
        return client.zRange(getFilesKey(), '+inf', '-inf', {
            BY: 'SCORE',
            REV: true,
        });
    },
    getFile: async (id) => {
        return client.hGetAll(getFileKey(id));
    },
    getRandomFile: async () => {
        const fileKey = await client.zRandMember(getFilesKey());
        return client.hGetAll(fileKey);
    },
    addFile: async (id, name, originalName) => {
        await hmSet(
            getFileKey(id),
            'id',
            id,
            'name',
            name,
            'originalName',
            originalName
        );
    },
    addFileToFiles: async (id) => {
        await client.zAdd(getFilesKey(), {
            score: Date.now(),
            value: getFileKey(id),
        });
    },
    addFileLine: async (id, lineNum, lineLength) => {
        await client.zAdd(getFileLinesKey(id), {
            score: lineLength,
            value: getLineKey(id, lineNum),
        });
    },
    getLine: async (fileId, lineNum) => {
        return client.hGetAll(getLineKey(fileId, lineNum));
    },
    getLineMostFrequentLetter: async (fileId, lineNum) => {
        const letters = await client.zRange(
            getLineLettersKey(fileId, lineNum),
            '+inf',
            '-inf',
            {BY: 'SCORE', REV: true, LIMIT: {offset: 0, count: 1}}
        );
        return letters.length ? letters[0] : null;
    },
    getRandomLine: async () => {
        return client.zRandMember(getLinesKey());
    },
    getLineByKey: async (key) => {
        return client.hGetAll(key);
    },
    getLongestLines: async (limit = 100) => {
        const keys = await client.zRange(getLinesKey(), '+inf', '-inf', {
            BY: 'SCORE',
            REV: true,
            LIMIT: {offset: 0, count: limit},
        });
        return Promise.all(keys.map((key) => client.hGetAll(key)));
    },
    getLongestLinesFromFile: async (fileId, limit = 20) => {
        const keys = await client.zRange(getFileLinesKey(fileId), '+inf', '-inf', {
            BY: 'SCORE',
            REV: true,
            LIMIT: {offset: 0, count: limit},
        });
        return Promise.all(keys.map((key) => client.hGetAll(key)));
    },
    addLine: async (fileId, lineNum, value, length) => {
        await hmSet(
            getLineKey(fileId, lineNum),
            'fileId',
            fileId,
            'lineNum',
            lineNum,
            'value',
            value,
            'length',
            length
        );
    },
    addLineToLines: async (fileId, lineNum, length) => {
        await client.zAdd(getLinesKey(), {
            score: length,
            value: getLineKey(fileId, lineNum),
        });
    },
    addLineLetter: async (fileId, lineNum, letter) => {
        await client.zIncrBy(
            getLineLettersKey(fileId, lineNum),
            1,
            letter.toLowerCase()
        );
    },
};
