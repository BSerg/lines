const keyPrefix = 'fileServiceApp';

const getFileProcessKey = (id) => `${keyPrefix}:process:${id}`;

const getFilesKey = () => `${keyPrefix}:files`;

const getFileKey = (id) => `${keyPrefix}:file:${id}`;

const getFileLinesKey = (id) => `${getFileKey(id)}:lines`;

const getLinesKey = () => `${keyPrefix}:lines`;

const getLineKey = (fileId, lineNum) =>
    `${keyPrefix}:line:${fileId}:${lineNum}`;

const getLineLettersKey = (fileId, lineNum) =>
    `${getLineKey(fileId, lineNum)}:letters`;

const createSimpleXml = (data, tag = null, isRoot = true) => {
    let xml = ''
    if (isRoot) {
        xml += `<?xml version="1.0" encoding="UTF-8"?>`
    }
    if (tag) {
        xml += `<${tag}>`
    }
    if (Array.isArray(data)) {
        for (const index in data) {
            xml += createSimpleXml(data[index], null, false)
        }
    } else if (typeof data === 'object') {
        for (const property in data) {
            xml += createSimpleXml(data[property], property, false)
        }
    } else {
        xml += data
    }
    if (tag) {
        xml += `</${tag}>`
    }
    return xml
}

module.exports = {
    getFileProcessKey,
    getFilesKey,
    getFileKey,
    getLineKey,
    getLineLettersKey,
    getFileLinesKey,
    getLinesKey,
    createSimpleXml,
};
