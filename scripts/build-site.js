import { copyFile, cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export async function buildSite(destination = join(root, 'site')) {
    await rm(destination, { recursive: true, force: true });
    await mkdir(join(destination, 'examples', 'vendor'), { recursive: true });
    await cp(join(root, 'src'), join(destination, 'src'), { recursive: true });
    await cp(join(root, 'docs'), join(destination, 'docs'), { recursive: true });
    const exampleFiles = (await readdir(join(root, 'examples')))
        .filter(name => name !== 'server.js')
        .filter(name => ['.js', '.css', '.html'].some(extension => name.endsWith(extension)));
    await Promise.all(exampleFiles.map(name => copyFile(join(root, 'examples', name), join(destination, 'examples', name))));
    await copyFile(join(root, 'node_modules/react/umd/react.production.min.js'), join(destination, 'examples/vendor/react.js'));
    await copyFile(join(root, 'node_modules/react-dom/umd/react-dom.production.min.js'), join(destination, 'examples/vendor/react-dom.js'));
    await copyFile(join(root, 'node_modules/react/LICENSE'), join(destination, 'examples/vendor/react.LICENSE.txt'));
    await copyFile(join(root, 'node_modules/react-dom/LICENSE'), join(destination, 'examples/vendor/react-dom.LICENSE.txt'));
    await copyFile(join(root, 'README.md'), join(destination, 'README.md'));
    await copyFile(join(root, 'LICENSE'), join(destination, 'LICENSE'));
    await writeFile(join(destination, '.nojekyll'), '');
    await writeFile(join(destination, 'index.html'), '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="refresh" content="0;url=./examples/"><title>Strata React Charts</title></head><body><a href="./examples/">Open Strata examples and documentation</a></body></html>\n');
    return destination;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    const destination = await buildSite();
    console.log(`GitHub Pages site built: ${destination}`);
}