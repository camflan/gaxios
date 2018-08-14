/**
 * Copyright 2018 Google LLC
 *
 * Distributed under MIT license.
 * See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
 */

'use strict';

import {getch, GetchError} from '../src';
import * as nock from 'nock';
import * as assert from 'assert';
import * as stream from 'stream';
const assertRejects = require('assert-rejects');
// tslint:disable-next-line variable-name
const HttpsProxyAgent = require('https-proxy-agent');

nock.disableNetConnect();

const url = 'https://example.com';

it('should throw an error if a url is not provided', () => {
  assertRejects(getch({}), /URL is required/);
});

it.skip('should throw on non-2xx responses by default', async () => {
  const scope = nock(url).get('/').reply(500);
  await assertRejects(getch({url}), (err: GetchError) => {
    scope.done();
    assert(err);
    assert.strictEqual(err.code, '500');
  });
});

it('should allow overriding valid status', async () => {
  const scope = nock(url).get('/').reply(304);
  const res = await getch({
    url,
    validateStatus: () => {
      return true;
    }
  });
  scope.done();
  assert.strictEqual(res.status, 304);
});

it('should encode query string parameters', async () => {
  const opts = {url, params: {james: 'kirk', montgomery: 'scott'}};
  const path = '/?james=kirk&montgomery=scott';
  const scope = nock(url).get(path).reply(200, {});
  const res = await getch(opts);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.config.url, url + path);
  scope.done();
});

it('should return json by default', async () => {
  const body = {hello: '🌎'};
  const scope = nock(url).get('/').reply(200, body);
  const res = await getch({url});
  scope.done();
  assert.deepStrictEqual(body, res.data);
});

it('should return stream if asked nicely', async () => {
  const body = {hello: '🌎'};
  const scope = nock(url).get('/').reply(200, body);
  const res = await getch<stream.Readable>({url, responseType: 'stream'});
  scope.done();
  assert(res.data instanceof stream.Readable);
});

it('should return text if asked nicely', async () => {
  const body = 'hello 🌎';
  const scope = nock(url).get('/').reply(200, body);
  const res = await getch<string>({url, responseType: 'text'});
  scope.done();
  assert.strictEqual(res.data, body);
});
