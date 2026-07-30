import {test} from 'kizu';
import type {Request} from 'express';
import {extractBearerToken} from './extractBearerToken';

test('extractBearerToken returns token from Bearer header', (assert) => {

    const req = {headers: {authorization: 'Bearer abc-123'}} as Request;

    assert.equal(extractBearerToken(req), 'abc-123');

});

test('extractBearerToken is case-insensitive on scheme', (assert) => {

    const req = {headers: {authorization: 'bearer token-x'}} as Request;

    assert.equal(extractBearerToken(req), 'token-x');

});

test('extractBearerToken returns undefined when header missing', (assert) => {

    const req = {headers: {}} as Request;

    assert.equal(extractBearerToken(req), undefined);

});

test('extractBearerToken returns undefined for non-Bearer auth', (assert) => {

    const req = {headers: {authorization: 'Basic dXNlcjpwYXNz'}} as Request;

    assert.equal(extractBearerToken(req), undefined);

});
