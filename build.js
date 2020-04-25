const { exec } = require('child_process');
const fs = require('fs');
const archiver = require('archiver');

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
    'node_modules/.bin/terser --compress toplevel,drop_console --mangle -o public/client.js -- .build/client.tmp.js'
  );
  await execAsync(
    'node_modules/.bin/terser --compress toplevel,drop_console --mangle -o public/server.js -- .build/server.tmp.js'
  );
  await execAsync(
    'node_modules/.bin/terser --compress drop_console,unsafe_comps --mangle -o public/shared.js -- .build/shared.tmp.js'
  );
  await execAsync('uglifycss --output public/style.css public-dev/style.css');

  console.log('\nZip (command line)...');
  await execAsync('cd public && zip -9 ../public.zip *');
  console.log(await execAsync(`stat -c '%n %s' public.zip`));
  await execAsync('advzip -z -4 public.zip');
  console.log(await execAsync(`stat -c '%n %s' public.zip`));

  console.log('done (advzip = public.zip)');

  console.log('\nZip (js archiver)...');
  const size = await createZip();
  let limit = 13312;
  console.log(
    `\nPackage: ${size} byte / ${(size ? (size / limit) * 100 : 0).toFixed(2)}%`
  );

  console.log('\ndone (archiver = dist.zip)\n');
};

build();
