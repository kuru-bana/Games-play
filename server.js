const express = require('express');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, 'public')));
app.use('/games', express.static(path.join(__dirname, 'games')));

app.use('/snow-rider', express.static(path.join(__dirname, 'husting-repo', 'snow-rider')));
app.use('/snow-rider-3d', express.static(path.join(__dirname, 'husting-repo', 'snow-rider-3d')));
app.use('/super-mario-bros', express.static(path.join(__dirname, 'husting-repo', 'super-mario-bros')));
app.use('/run-1', express.static(path.join(__dirname, 'husting-repo', 'run-1')));
app.use('/run-3', express.static(path.join(__dirname, 'husting-repo', 'run-3')));
app.use('/run-3-space', express.static(path.join(__dirname, 'husting-repo', 'run-3-space')));
app.use('/blocky-puzzle', express.static(path.join(__dirname, 'husting-repo', 'blocky-puzzle')));
app.use('/super-mario-64', express.static(path.join(__dirname, 'husting-repo', 'super-mario-64')));
app.use('/the-backrooms', express.static(path.join(__dirname, 'husting-repo', 'the-backrooms')));
app.use('/nso_fix', express.static(path.join(__dirname, 'husting-repo', 'nso_fix')));

app.get(/^\/lfs-proxy\/(.+)$/, (req, res) => {
  const filePath = req.params[0];
  const mediaUrl = 'https://media.githubusercontent.com/media/' + filePath;

  const makeRequest = (url, redirectCount) => {
    if (redirectCount > 5) {
      res.status(500).send('Too many redirects');
      return;
    }
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: { 'User-Agent': 'GamePortal/1.0' }
    };
    https.get(options, (upstream) => {
      if (upstream.statusCode === 301 || upstream.statusCode === 302 || upstream.statusCode === 307) {
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
      res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.set('Content-Type', upstream.headers['content-type'] || 'application/octet-stream');
      if (upstream.headers['content-length']) {
        res.set('Content-Length', upstream.headers['content-length']);
      }
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
