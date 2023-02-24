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

const publicDevDir = fs.readdirSync('./public-dev');

const CLIENT_FILES = publicDevDir
  .filter(fileName => fileName.includes('client.'))
  .sort((a, b) => (a.length < b.length ? -1 : 1));
const SERVER_FILES = publicDevDir
  .filter(fileName => fileName.includes('server.'))
  .sort((a, b) => (a.length < b.length ? -1 : 1));
const SHARED_FILES = publicDevDir
  .filter(fileName => fileName.includes('shared.'))
  .sort((a, b) => (a.length < b.length ? -1 : 1));
const CSS_FILES = publicDevDir
  .filter(fileName => fileName.includes('style.css'))
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
  console.log('shared files =', SHARED_FILES.join(','));
  const sharedFilesConcat =
    SHARED_FILES.reduce((prev, curr) => {
      return prev + '\n' + fs.readFileSync('public-dev/' + curr).toString();
    }, '') + '\n';
  const cssFileConcat = CSS_FILES.reduce((prev, curr) => {
    return prev + '\n' + fs.readFileSync('public-dev/' + curr).toString();
  }, '');
  let htmlFile = fs
    .readFileSync('public-dev/index.html')
    .toString()
    .replace(/<link rel="stylesheet" type="text\/css" href="(.*)" \/>/g, '')
    .replace(
      /<\/head>/,
      '<link rel="stylesheet" type="text/css" href="/style.css" /></head>'
    )
    .replace(/<script src="(.*)"><\/script>/g, '')
    .replace(
      '</footer>',
      `<script src="/socket.io/socket.io.js"></script>
    <script src="/client+shared.js"></script>
    </footer>`
    );

  await execAsync('rm -rf .build public.zip public/*.js public/*.css');
  await execAsync('mkdir -p .build');

  console.log('\nWrite tmp files...');
  fs.writeFileSync('./.build/client.tmp.js', clientFileConcat);
  fs.writeFileSync('./.build/server.tmp.js', serverFileConcat);
  fs.writeFileSync('./.build/shared.tmp.js', sharedFilesConcat);
  fs.writeFileSync('./.build/style.tmp.css', cssFileConcat);
  fs.writeFileSync('./.build/index.tmp.html', htmlFile);

  const terserArgs = [
    'passes=3',
    'pure_getters',
    'unsafe',
    'unsafe_math',
    'hoist_funs',
    'toplevel',
    // 'drop_console',
    'pure_funcs=[console.info,console.log,console.debug,console.warn]',
    'ecma=9',
  ];
  const terserArgsShared = [
    'passes=3',
    'pure_getters',
    'unsafe',
    'unsafe_math',
    // 'drop_console',
    'pure_funcs=[console.info,console.log,console.debug,console.warn]',
    'ecma=9',
  ];

  console.log('\nBabel client side code...');
  await execAsync('npm run babel');

  console.log('\nMinify code...');
  await execAsync(
    `node_modules/.bin/terser --compress ${terserArgs.join(
      ','
    )} --mangle -o public/client+shared.js -- .build/client+shared.babel.js`
  );
  await execAsync(
    `node_modules/.bin/terser --compress ${terserArgs.join(
      ','
    )} --mangle -o public/server.js -- .build/server.tmp.js`
  );
  await execAsync(
    `node_modules/.bin/terser --compress ${terserArgsShared.join(
      ','
    )} --mangle -o public/shared.js -- .build/shared.tmp.js`
  );
  await execAsync('uglifycss --output public/style.css .build/style.tmp.css');
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

  console.log('\nExport maps to sqlite...');
  console.log(await execAsync('npm run maps:prod'));

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
