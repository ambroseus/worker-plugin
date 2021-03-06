/**
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import WorkerPlugin from '../src';
import { runWebpack } from './_util';

describe('worker-plugin', () => {
  test('exports a class', () => {
    expect(WorkerPlugin).toBeInstanceOf(Function);
    const inst = new WorkerPlugin();
    expect(inst).toBeInstanceOf(WorkerPlugin);
    expect(inst).toHaveProperty('apply', expect.any(Function));
  });

  test('it replaces Worker constructor with require(worker-loader)', async () => {
    const stats = await runWebpack('basic', {
      plugins: [
        new WorkerPlugin()
      ]
    });

    const assetNames = Object.keys(stats.assets);
    expect(assetNames).toHaveLength(2);
    expect(assetNames).toContainEqual('0.worker.js');

    expect(stats.assets['main.js']).toMatch(/new\s+Worker\s*\(\s*__webpack__worker__\d\s*(,\s*\{[\s\n]*type\s*:\s*"module"[\s\n]*\}\s*)?\)/g);

    expect(stats.assets['main.js']).toMatch(/__webpack_require__\.p\s*\+\s*"0\.worker\.js"/g);
  });

  test('it uses the Worker constructor\'s name option and chunkFilename to generate asset filenames', async () => {
    const stats = await runWebpack('named', {
      output: {
        chunkFilename: '[name].[hash:5].js'
      },
      plugins: [
        new WorkerPlugin()
      ]
    });

    const assetNames = Object.keys(stats.assets);
    expect(assetNames).toHaveLength(2);
    expect(assetNames).toContainEqual(expect.stringMatching(/^foo\.[a-zA-Z0-9]+\.worker\.js$/));
    expect(stats.assets['main.js']).toMatch(/__webpack_require__\.p\s*\+\s*"foo\.[a-zA-Z0-9]+\.worker\.js"/g);
  });

  test('it skips Worker constructor with non-string 1st argument', async () => {
    const stats = await runWebpack('skip-blobs', {
      plugins: [
        new WorkerPlugin()
      ]
    });

    const assetNames = Object.keys(stats.assets);
    expect(assetNames).toHaveLength(1);

    expect(stats.assets['main.js']).not.toMatch(/new\s+Worker\s*\(\s*__webpack__worker__\d\s*(,\s*\{[\s\n]*type\s*:\s*"module"[\s\n]*\}\s*)?\)/g);

    expect(stats.assets['main.js']).toMatch(/new\s+Worker\s*\(\s*new\s+Blob\s*\(\s*\[\s*'onmessage=\(\)=>\{postMessage\("right back at ya"\)\}'\s*\]\s*\)\s*\)/g);
  });
});
