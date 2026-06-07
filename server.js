const express = require('express');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, 'public')));

app.use('/run-3-space', express.static(path.join(__dirname, 'husting-repo', 'run-3-space')));

function proxyRequest(targetUrl, res) {
  const makeRequest = (url, redirectCount) => {
    if (redirectCount > 10) { res.status(500).send('Too many redirects'); return; }
    const u = new URL(url);
    https.get({ hostname: u.hostname, path: u.pathname + u.search, headers: { 'User-Agent': 'GamePortal/1.0' } }, (upstream) => {
      if ([301, 302, 307, 308].includes(upstream.statusCode)) {
        makeRequest(upstream.headers.location, redirectCount + 1);
        upstream.resume();
        return;
      }
      if (upstream.statusCode !== 200) {
        res.status(upstream.statusCode).send('Upstream error: ' + upstream.statusCode);
        upstream.resume();
        return;
      }
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Content-Type', upstream.headers['content-type'] || 'application/octet-stream');
      if (upstream.headers['content-length']) res.set('Content-Length', upstream.headers['content-length']);
      res.set('Cache-Control', 'public, max-age=3600');
      upstream.pipe(res);
    }).on('error', (err) => {
      if (!res.headersSent) res.status(500).send('Proxy error: ' + err.message);
    });
  };
  makeRequest(targetUrl, 0);
}

app.get(/^\/gh-proxy\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/, (req, res) => {
  const owner = req.params[0];
  const repo  = req.params[1];
  const ref   = req.params[2];
  const file  = req.params[3];
  proxyRequest(`https://github.com/${owner}/${repo}/raw/${ref}/${file}`, res);
});

app.options(/^\/gh-proxy\/(.+)$/, (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Range');
  res.sendStatus(204);
});

app.get(/^\/lfs-proxy\/(.+)$/, (req, res) => {
  const mediaUrl = 'https://media.githubusercontent.com/media/' + req.params[0];

  const makeRequest = (url, redirectCount) => {
    if (redirectCount > 5) { res.status(500).send('Too many redirects'); return; }
    const u = new URL(url);
    https.get({ hostname: u.hostname, path: u.pathname + u.search, headers: { 'User-Agent': 'GamePortal/1.0' } }, (upstream) => {
      if ([301, 302, 307].includes(upstream.statusCode)) {
        makeRequest(upstream.headers.location, redirectCount + 1);
        upstream.resume();
        return;
      }
      if (upstream.statusCode !== 200) {
        res.status(upstream.statusCode).send('Upstream error: ' + upstream.statusCode);
        upstream.resume();
        return;
      }
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Content-Type', upstream.headers['content-type'] || 'application/octet-stream');
      if (upstream.headers['content-length']) res.set('Content-Length', upstream.headers['content-length']);
      res.set('Cache-Control', 'public, max-age=3600');
      upstream.pipe(res);
    }).on('error', (err) => {
      if (!res.headersSent) res.status(500).send('Proxy error: ' + err.message);
    });
  };

  makeRequest(mediaUrl, 0);
});

app.options(/^\/lfs-proxy\/(.+)$/, (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Range');
  res.sendStatus(204);
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Game Portal running on port ${PORT}`);
});
