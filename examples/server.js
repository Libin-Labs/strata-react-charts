import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const siteMode = process.argv.includes('--site');
const serveRoot = siteMode ? resolve(root, 'site') : root;
const baseArgument = process.argv.find(argument => argument.startsWith('--base='))?.slice(7) ?? '';
const baseSegments = baseArgument.split('/').filter(Boolean);
const base = baseSegments.length ? `/${baseSegments.join('/')}` : '';
const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.md': 'text/plain', '.txt': 'text/plain' };
const vendorFiles = {
    '/examples/vendor/react.js': '/node_modules/react/umd/react.production.min.js',
    '/examples/vendor/react-dom.js': '/node_modules/react-dom/umd/react-dom.production.min.js'
};
const server = createServer(async (request, response) => {
    try {
        const url = new URL(request.url, 'http://localhost');
        const requested = decodeURIComponent(url.pathname);
        if (base && requested !== base && !requested.startsWith(`${base}/`)) {
            response.writeHead(404); response.end('Not found'); return;
        }
        let pathname = requested.slice(base.length) || '/';
        if (pathname === '/') {
            response.writeHead(302, { Location: `${base}/examples/` }); response.end(); return;
        }
        if (pathname.endsWith('/')) pathname += 'index.html';
        if (!siteMode) pathname = vendorFiles[pathname] ?? pathname;
        const path = resolve(serveRoot, `.${pathname}`);
        const sourceAllowed = pathname.startsWith('/src/') || pathname.startsWith('/docs/') || pathname.startsWith('/examples/') || pathname.startsWith('/node_modules/react/') || pathname.startsWith('/node_modules/react-dom/') || pathname === '/README.md';
        if (!path.startsWith(serveRoot + sep) || (!siteMode && !sourceAllowed)) {
            response.writeHead(403);
            response.end('Forbidden');
            return;
        }
        const body = await readFile(path);
        response.writeHead(200, { 'Content-Type': `${mimeTypes[extname(path)] ?? 'application/octet-stream'}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
        response.end(body);
    }
    catch {
        response.writeHead(404);
        response.end('Not found');
    }
});
let port = Number(process.env.PORT ?? 5173);
server.on('error', error => {
    if (error.code === 'EADDRINUSE') {
        port++;
        server.listen(port, '127.0.0.1');
    }
    else {
        console.error(error);
        process.exitCode = 1;
    }
});
server.on('listening', () => console.log(`Strata examples and documentation: http://127.0.0.1:${server.address().port}${base}/`));
server.listen(port, '127.0.0.1');
