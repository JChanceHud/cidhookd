require('events').defaultMaxListeners = 20;

const fs = require('fs');
const express = require('express');
const app = express();

const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient({
  host: process.env.IPFS_HOST || 'localhost',
  port: process.env.IPFS_PORT || '5001',
  protocol: process.env.IPFS_PROTOCOL || 'http'
});

const { CIDHOOK_SECRET_PATH } = process.env;
if (CIDHOOK_SECRET_PATH && !fs.existsSync(CIDHOOK_SECRET_PATH)) {
  console.log(`Invalid CIDHOOK_SECRET_PATH supplied: ${CIDHOOK_SECRET_PATH}`);
  process.exit(1);
}
if (CIDHOOK_SECRET_PATH && !process.env.CIDHOOK_SECRET) {
  const secret = fs.readFileSync(CIDHOOK_SECRET_PATH, 'utf8');
  process.env.CIDHOOK_SECRET = secret.trim();
}
const { CIDHOOK_SECRET } = process.env;

app.use((req, res, next) => {
  if (!CIDHOOK_SECRET) return next();
  if (req.get('Authorization') !== CIDHOOK_SECRET) {
    next(new Error('Invalid Authorization supplied'));
  } else {
    next();
  }
});

app.post('/:cid', async (req, res) => {
  try {
    console.log(`Pinning cid ${req.params.cid}`);
    await ipfs.pin.add(req.params.cid, {
      recursive: true
    });
    res.status(204).end();
  } catch (err) {
    res.status(500).send(err.toString());
  }
});

app.delete('/:cid', async (req, res) => {
  try {
    console.log(`Unpinning cid ${req.params.cid}`);
    await ipfs.pin.rm(req.params.cid, {
      recursive: true
    });
  } catch (_) {
  } finally {
    res.status(204).end();
  }
});

app.listen(3000, () => console.log(`cidhookd listening on port 3000!`));
