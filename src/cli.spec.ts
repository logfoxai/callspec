import {test} from 'kizu';
import {execSync} from 'node:child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {defineRoute} from './defineRoute';
import {emitCallspec} from './emitCallspec';
import {predicates as p} from 'runtyp';

test('cli --help exits zero', (assert) => {

    const output = execSync('node dist/cli/generate-client.js --help', {encoding: 'utf8'});

    assert.equal(output.includes('--output'), true);
    assert.equal(output.includes('--validators'), true);
    assert.equal(output.includes('callspec.json'), true);

});

test('cli rejects invalid documents', (assert) => {

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'callspec-cli-invalid-'));
    const sourcePath = path.join(dir, 'bad.json');
    const outputPath = path.join(dir, 'api.ts');

    fs.writeFileSync(sourcePath, JSON.stringify({callspec: '2.0', info: {}, routes: {}}));

    let status = 0;

    try {

        execSync(`node dist/cli/generate-client.js ${sourcePath} --output ${outputPath}`, {
            encoding: 'utf8',
            stdio: 'pipe',
        });

    } catch (err) {

        status = (err as {status?: number}).status ?? 1;

    }

    assert.equal(status !== 0, true);

    fs.rmSync(dir, {recursive: true, force: true});

});

test('cli writes output from valid document', (assert) => {

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'callspec-cli-valid-'));
    const sourcePath = path.join(dir, 'callspec.json');
    const outputPath = path.join(dir, 'api.ts');

    const doc = emitCallspec({
        ping: defineRoute({
            input: p.object({}),
            output: p.string(),
            meta: {summary: 'Ping', description: 'Ping', tags: ['health']},
            access: 'public',
            handler: async (_input, _ctx) => 'pong',
        }),
    }, {title: 'CLI API', version: '1.0.0'});

    fs.writeFileSync(sourcePath, JSON.stringify(doc));

    execSync(`node dist/cli/generate-client.js ${sourcePath} --output ${outputPath}`, {
        encoding: 'utf8',
        stdio: 'pipe',
    });

    assert.equal(fs.existsSync(outputPath), true);

    fs.rmSync(dir, {recursive: true, force: true});

});
