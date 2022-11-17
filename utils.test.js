const {createSimpleXml} = require('./utils');

describe('createSimpleXml', () => {
    it('should return correct xml', () => {
        const data = {hello: 'world', someArray: [{element: 1}, {element: 'two'}]};
        const xml = createSimpleXml(data, 'root');
        expect(xml).toBe(
            '<?xml version="1.0" encoding="UTF-8"?><root><hello>world</hello><someArray><element>1</element><element>two</element></someArray></root>'
        );
    });
});
