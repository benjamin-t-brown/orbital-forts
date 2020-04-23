'use strict';

const fs = require('fs');
const archiver = require('archiver');
const express = require('express');
const session = require('express-session');
const parser = require('body-parser');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const shared = fs.existsSync('./public-dev/shared.js')
  ? fs.readFileSync('./public-dev/shared.js', 'utf8')
  : '';

const serverFiles = fs
  .readdirSync('./public-dev')
  .filter(fileName => fileName.includes('server.'))
  .sort((a, b) => (a.length < b.length ? -1 : 1));

const serverFilesConcat = serverFiles.reduce((prev, curr) => {
  return '\n' + prev + fs.readFileSync('./public-dev/' + curr).toString();
}, '');
console.log('Aux Server Files:', serverFiles);

const storage = require('./lib/storage');

let packageSize = 0;

function createSandbox() {
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Buffer,
    storage: storage.interface,
    io: io,
  };

  Object.defineProperty(sandbox, 'module', {
    enumerable: true,
    configurable: false,
    writable: false,
    value: Object.create(null),
  });
  sandbox.module.exports = Object.create(null);
  sandbox.exports = sandbox.module.exports;
  return sandbox;
}

function createZip() {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const output = fs.createWriteStream('dist.zip');
  output.on('close', () => {
    packageSize = archive.pointer();
  });
  archive.pipe(output);
  archive.directory('public-dev/', '');
  archive.finalize();
}

app
  .set('port', process.env.PORT || 3000)
  .set('storage', process.env.DATABASE_URL || 'sqlite:storage.sqlite')
  .get('/server-info', (req, res) => {
    let limit = 13312,
      storageSize = storage.interface.size();
    res
      .set('Content-Type', 'text/plain')
      .send(
        [
          `Package: ${packageSize} byte / ${(packageSize
            ? (packageSize / limit) * 100
            : 0
          ).toFixed(2)}%`,
          `Storage: ${storageSize} byte / ${(storageSize
            ? (storageSize / limit) * 100
            : 0
          ).toFixed(2)}%`,
        ].join('\n')
      );
  })
  .use(express.static('public-dev'))
  .use(
    session({ secret: 'js13kserver', saveUninitialized: false, resave: false })
  );

storage
  .init(app.get('storage'))
  .then(() => {
    const sandbox = createSandbox();
    require('vm').runInNewContext(shared + '\n' + serverFilesConcat, sandbox);
    if (typeof sandbox.module.exports == 'function') {
      io.on('connection', sandbox.module.exports);
    } else if (typeof sandbox.module.exports == 'object') {
      app.use(parser.urlencoded({ extended: true })).use(parser.json());
      for (let route in sandbox.module.exports) {
        if (route == 'io') {
          io.on('connection', sandbox.module.exports[route]);
        } else {
          app.all('/' + route, sandbox.module.exports[route]);
        }
      }
    }
    server.listen(app.get('port'), () => {
      console.log('Server started at port: ' + app.get('port'));
      createZip();
    });
  })
  .catch(err => {
    console.error(err);
  });
