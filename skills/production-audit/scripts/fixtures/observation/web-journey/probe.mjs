// Copyright 2026 LagunaForge
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Web journey probe: serve the snapshot on loopback, drive a browser, record
// one step per user action. The browser library comes from the controller's
// environment (pass NODE_PATH and PLAYWRIGHT_BROWSERS_PATH through spec.env).
import { createServer } from 'node:http';
import { readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const step = (action, expected, observed) => appendFileSync(process.env.SEATRIAL_STEPS, JSON.stringify({ action, expected, observed }) + '\n');
const page404 = (res) => { res.writeHead(404); res.end(); };
const server = createServer((req, res) => {
  if (req.url !== '/') return page404(res);
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(readFileSync(join(process.env.SEATRIAL_SNAPSHOT, 'site/index.html')));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  step('open / at 390x844 and read the page heading', 'Order a sample', await page.textContent('h1'));
  await page.fill('#email', 'buyer@example.invalid');
  await page.dblclick('#place');
  await page.waitForTimeout(600);
  step('enter an email, then double-click "Place order"', '1 order(s) placed', await page.textContent('#status'));
  await page.screenshot({ path: join(process.env.SEATRIAL_ARTEFACTS, 'after-double-click.png') });
} finally {
  await browser.close();
  server.close();
}
