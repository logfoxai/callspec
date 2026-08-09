import {test} from 'kizu';
import {execSync} from 'node:child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {route} from './route';
import {emitCallspec} from './emitCallspec';
import {predicates as p} from 'runtyp';

test('cli --help exits zero', (assert) => {

    const output = execSync('node dist/cli/generate-client.js --help', {encoding: 'utf8'});

    assert.equal(output.includes('--output'), true);
    assert.equal(output.includes('export-docs-ui'), true);
    assert.equal(output.includes('--validators'), false);
    assert.equal(output.includes('schemas'), true);
    assert.equal(output.includes('callspec.json'), true);

});

test('cli export-docs-ui writes static dist', (assert) => {

    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'callspec-cli-export-ui-'));

    const output = execSync(
        `node dist/cli/generate-client.js export-docs-ui --out ${outDir} `
        + '--spec-url https://api.example.com/v1/callspec.json '
        + '--rpc-base https://api.example.com/v1 '
        + '--title "Export API"',
        {encoding: 'utf8'},
    );

    assert.equal(output.includes('Wrote Docs UI'), true);
    assert.equal(fs.existsSync(path.join(outDir, 'index.html')), true);
    assert.equal(fs.existsSync(path.join(outDir, 'assets')), true);

    const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');

    assert.equal(html.includes('"specUrl":"https://api.example.com/v1/callspec.json"'), true);

    fs.rmSync(outDir, {recursive: true, force: true});

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
        ping: route({
            input: p.object({}),
            output: p.string(),
            meta: {summary: 'Ping', description: 'Ping', tags: ['health']},
            auth: 'none',
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
