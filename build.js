const { exec } = require('child_process');
const fs = require('fs');
const archiver = require('archiver');
const minifyHtml = require('html-minifier').minify;

const useZip = process.argv[2] === 'zip';

// pulled this from index.js in the template
async function createZip() {
  return new Promise(resolve => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const output = fs.createWriteStream('dist.zip');
    output.on('close', () => {
      resolve(archive.pointer());
    });
    archive.pipe(output);
    archive.directory('public/', '');
    archive.finalize();
  });
}

const CLIENT_FILES = fs
  .readdirSync('./public-dev')
  .filter(fileName => fileName.includes('client.'))
  .sort((a, b) => (a.length < b.length ? -1 : 1));
const SERVER_FILES = fs
  .readdirSync('./public-dev')
  .filter(fileName => fileName.includes('server.'))
  .sort((a, b) => (a.length < b.length ? -1 : 1));

const execAsync = async command => {
  return new Promise(resolve => {
    console.log(command);
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(err, stdout, stderr);
        return;
      }
      resolve(stdout);
    });
  });
};

const build = async () => {
  console.log('Concat files...');
  console.log('client files =', CLIENT_FILES.join(','));
  const clientFileConcat =
    CLIENT_FILES.reduce((prev, curr) => {
      return prev + '\n' + fs.readFileSync('public-dev/' + curr).toString();
    }, '(() => {\n') + '\n})()';
  console.log('server files =', SERVER_FILES.join(','));
  const serverFileConcat =
    SERVER_FILES.reduce((prev, curr) => {
      return prev + '\n' + fs.readFileSync('public-dev/' + curr).toString();
    }, '(() => {\n') + '\n})()';
  const sharedFile = fs.readFileSync('public-dev/shared.js').toString();
  const htmlFile = fs
    .readFileSync('public-dev/index.html')
    .toString()
    .replace(/\n/g, '')
    .replace(
      /<footer>(.*)/,
      `<footer><script src="/socket.io/socket.io.js"></script>
    <script src="/shared.js"></script>
    <script src="/client.js"></script>`
    );

  await execAsync(
    'rm -rf .build public.zip public/*.js public/*.css public/*.wav'
  );

  await execAsync('mkdir -p .build');

  console.log('\nWrite tmp files...');
  fs.writeFileSync('./.build/client.tmp.js', clientFileConcat);
  fs.writeFileSync('./.build/server.tmp.js', serverFileConcat);
  fs.writeFileSync('./.build/shared.tmp.js', sharedFile);

  console.log('\nMinify code...');
  await execAsync(
    'node_modules/.bin/terser --compress passes=3,booleans_as_integers,pure_getters,unsafe,unsafe_math,hoist_funs,toplevel,drop_console,ecma=9 --mangle -o public/client.js -- .build/client.tmp.js'
  );
  await execAsync(
    'node_modules/.bin/terser --compress passes=3,booleans_as_integers,pure_getters,unsafe,unsafe_math,hoist_funs,toplevel,drop_console,ecma=9 --mangle -o public/server.js -- .build/server.tmp.js'
  );
  await execAsync(
    'node_modules/.bin/terser --compress passes=3,booleans_as_integers,pure_getters,unsafe,unsafe_math,drop_console,ecma=9 --mangle -o public/shared.js -- .build/shared.tmp.js'
  );
  await execAsync('uglifycss --output public/style.css public-dev/style.css');
  console.log('minify html: public/index.html');
  fs.writeFileSync(
    'public/index.html',
    minifyHtml(htmlFile, {
      removeAttributeQuotes: true,
      collapseWhitespace: true,
      html5: true,
      minifyCSS: true,
      minifyJS: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeTagWhitespace: true,
      removeComments: true,
      useShortDoctype: true,
    })
  );

  if (useZip) {
    console.log('\nZip (command line)...');
    await execAsync('cd public && zip -9 ../public.zip *');
    console.log(await execAsync(`stat -c '%n %s' public.zip`));
    await execAsync('advzip -z -4 public.zip');
    console.log(await execAsync(`stat -c '%n %s' public.zip`));
    console.log('done (advzip = public.zip)');
  }

  console.log('\nZip (js archiver)...');
  const size = await createZip();
  let limit = 13312;
  console.log(
    `\nPackage: ${size} byte / ${(size ? (size / limit) * 100 : 0).toFixed(2)}%`
  );

  console.log('\ndone (archiver = dist.zip)\n');
};

build();
