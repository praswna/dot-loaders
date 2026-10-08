#!/usr/bin/env node
// 갤러리용 정적 서버 (의존성 없음). python http.server 대신 쓴다.
//   node tools/serve.mjs [port=5173]
// - ES 모듈이 돌도록 .js/.mjs 를 text/javascript 로 보낸다 (Windows 의 python 은 레지스트리 때문에 text/plain 이 되기도 한다)
// - Cache-Control: no-store 라서 고친 파일이 바로 반영된다
// - 저장소 바깥 경로는 막는다
// - 갤러리의 보관함용 API (localhost 에서만): 파일을 실제로 옮긴다 (tools/archive.mjs)
//     GET  /api/status            → { archive: true, archived: [...] }
//     POST /api/archive  {id}     → src/variants/<id>.js 를 src/variants/archive/ 로
//     POST /api/restore  {id}     → 반대로

import { createServer } from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import { join, normalize, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { archiveVariant, restoreVariant, archivedIds } from './archive.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.argv[2]) || 5173;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.woff2': 'font/woff2',
};

const json = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
};
const readBody = (req) => new Promise((ok, fail) => {
  let data = '';
  req.on('data', (c) => { data += c; if (data.length > 4096) { req.destroy(); fail(new Error('요청이 너무 큽니다')); } });
  req.on('end', () => { try { ok(JSON.parse(data || '{}')); } catch { fail(new Error('JSON 이 아닙니다')); } });
});

async function api(req, res, path) {
  if (path === '/api/status' && req.method === 'GET') return json(res, 200, { archive: true, archived: await archivedIds(ROOT) });
  const act = { '/api/archive': archiveVariant, '/api/restore': restoreVariant }[path];
  if (!act || req.method !== 'POST') return json(res, 404, { error: '없는 API' });
  // 다른 사이트가 브라우저를 시켜 파일을 옮기지 못하게: 같은 출처의 JSON 요청만 받는다
  const origin = req.headers.origin;
  if (origin && new URL(origin).host !== req.headers.host) return json(res, 403, { error: '다른 출처' });
  if (!String(req.headers['content-type']).startsWith('application/json')) return json(res, 415, { error: 'JSON 만' });
  try {
    const { id } = await readBody(req);
    const r = await act(String(id), ROOT);
    console.log(`${path.slice(5)}: ${id} → ${r.file}`);
    return json(res, 200, r);
  } catch (e) {
    return json(res, 400, { error: String(e.message ?? e) });
  }
}

createServer(async (req, res) => {
  try {
    const apiPath = new URL(req.url, 'http://x').pathname;
    if (apiPath.startsWith('/api/')) return await api(req, res, apiPath);
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT + sep) && file !== ROOT) { res.writeHead(403).end(); return; }
    let st = await stat(file).catch(() => null);
    if (st?.isDirectory()) { file = join(file, 'index.html'); st = await stat(file).catch(() => null); }
    if (!st?.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end(`404 ${path}`); return; }
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }).end(String(e));
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`dot-loaders 갤러리: http://localhost:${PORT}  (Ctrl+C 로 종료)`);
});
