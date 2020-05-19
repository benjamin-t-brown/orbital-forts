const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const exec = require('child_process').exec;

const PORT = 9999;
const MAPS_DIR = `${__dirname}/../../saved-maps`;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(`${__dirname}/../../public`));

const execAsync = cmd => {
  return new Promise((resolve, reject) => {
    console.log('[MapMaker SRV]', cmd);
    exec(cmd, (err, result) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

app.get('/maps', (req, res) => {
  console.log(`[MapMaker SRV] GET/maps`, req.body);
  const resp = {
    files: [],
    err: null,
  };

  fs.readdir(MAPS_DIR, (err, files) => {
    if (err) {
      resp.err = err;
    } else {
      resp.files = files
        .filter(fileName => fileName.indexOf('.json') > -1)
        .sort()
        .map(fileName => {
          return JSON.parse(
            fs.readFileSync(MAPS_DIR + '/' + fileName).toString()
          );
        });
    }
    res.send(JSON.stringify(resp));
  });
});

app.post('/map', (req, res) => {
  console.log(`[MapMaker SRV] POST/map`, req.body);
  const resp = {
    success: false,
    err: null,
  };
  let valid = false;

  console.log('BODY', req.body);

  if (!req.body.map) {
    resp.err = 'No map json provided.';
  } else {
    valid = true;
  }

  if (valid) {
    fs.writeFile(
      `${MAPS_DIR}/${req.body.map.name}.json`,
      JSON.stringify(req.body.map, null, 2),
      async err => {
        if (err) {
          resp.err = err;
        } else {
          resp.success = true;
        }
        res.send(JSON.stringify(resp));
      }
    );
  } else {
    res.send(JSON.stringify(resp));
  }
});

app.delete('/map/:mapName', (req, res) => {
  console.log(`[MapMaker SRV] DELETE/map`, req.body);
  const mapName = req.params.mapName;
  const resp = {
    success: false,
    err: null,
  };
  let valid = false;

  console.log('MAP NAME', mapName);

  if (!mapName) {
    resp.err = 'No map name provided.';
  } else {
    valid = true;
  }

  if (valid) {
    fs.unlink(`${MAPS_DIR}/${mapName}.json`, async err => {
      if (err) {
        resp.err = err;
      } else {
        resp.success = true;
      }
      res.send(JSON.stringify(resp));
    });
  } else {
    res.send(JSON.stringify(resp));
  }
});

app.listen(PORT, () => {
  console.log(`[MapMaker SRV] Listening on port ${PORT}`);
});
