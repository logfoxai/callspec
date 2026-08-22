import {test} from 'kizu';
import {file, type UploadedFile} from './file';

function uploaded(overrides: Partial<UploadedFile> = {}): UploadedFile {

    return {
        filename: 'avatar.png',
        mimeType: 'image/png',
        size: 4,
        buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
        ...overrides,
    };

}

test('file(): accepts an uploaded file object', (assert) => {

    const result = file()(uploaded());

    assert.equal(result.isValid, true);

    if (result.isValid) {

        assert.equal(result.value.filename, 'avatar.png');
        assert.equal(result.value.mimeType, 'image/png');
        assert.equal(result.value.size, 4);

    }

});

test('file(): rejects missing file and wrong shapes', (assert) => {

    assert.equal(file()(undefined).isValid, false);
    assert.equal(file()(null).isValid, false);
    assert.equal(file()('avatar.png').isValid, false);
    assert.equal(file()({filename: 'x'}).isValid, false);

});

test('file(): rejects mime types outside the allow-list', (assert) => {

    const pred = file({mime: ['image/jpeg', 'image/png']});
    const result = pred(uploaded({mimeType: 'application/pdf', filename: 'doc.pdf'}));

    assert.equal(result.isValid, false);

    if (!result.isValid) {

        assert.equal(Object.values(result.errors).some((msg) => msg.includes('image/jpeg')), true);

    }

});

test('file(): rejects files over maxBytes', (assert) => {

    const pred = file({maxBytes: 8});
    const buffer = Buffer.alloc(16);
    const result = pred(uploaded({buffer, size: buffer.length}));

    assert.equal(result.isValid, false);

    if (!result.isValid) {

        assert.equal(Object.values(result.errors).some((msg) => msg.includes('8')), true);

    }

});
