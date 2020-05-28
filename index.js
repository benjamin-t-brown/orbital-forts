'use strict';

const fs = require('fs');
const archiver = require('archiver');
const express = require('express');
const session = require('express-session');
const parser = require('body-parser');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const code = fs.readFileSync('./public/server.js', 'utf8');
const shared = fs.existsSync('./public/shared.js')
  ? fs.readFileSync('./public/shared.js', 'utf8')
  : '';
const storage = require('./lib/storage');
const terser = require('terser');

const isMaps = process.argv[2] === 'maps';

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
  archive.directory('public/', '');
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
  .use(express.static('public'))
  .use(
    session({ secret: 'js13kserver', saveUninitialized: false, resave: false })
  );

storage
  .init(app.get('storage'))
  .then(() => {
    if (isMaps) {
      console.log('Transferring production maps to db...');
      const MAPS_DIR = 'map-maker/saved-maps';
      fs.readdir(MAPS_DIR, async (err, files) => {
        if (err) {
          console.error(err);
        } else {
          console.log('Reading files from ', MAPS_DIR);
          const maps = files
            .filter(
              fileName =>
                fileName.indexOf('.json') > -1 &&
                fileName.indexOf('.dev') === -1
            )
            .sort()
            .map(fileName => {
              console.log('-', fileName);
              return JSON.parse(
                fs.readFileSync(MAPS_DIR + '/' + fileName).toString()
              );
            });
          console.log('Storing in db...');
          const { code } = eval(terser.minify('a=' + JSON.stringify(maps)));
          const obj = eval(code.slice(2));
          await storage.interface.set('maps', obj);
          const mSize = await storage.interface.size();
          const mapsStorage = await storage.interface.get('maps');
          console.log(
            'Done!',
            mSize + 'b,',
            mapsStorage.length,
            'maps',
            maps.length
          );
        }
      });
      return;
    }

    const sandbox = createSandbox();
    require('vm').runInNewContext(shared + '\n' + code, sandbox);
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
