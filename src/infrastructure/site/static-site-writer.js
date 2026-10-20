import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { SITE_DATA_FILES } from './published-site.js';

const STATIC_API_ENTRY = "export { api } from './static-api.js';\n";

export async function writeStaticSite({ sourceDir, outputDir, state, runs }) {
  await rm(outputDir, { recursive: true, force: true });
  await cp(sourceDir, outputDir, { recursive: true });
  await mkdir(path.join(outputDir, 'data'), { recursive: true });
  await Promise.all([
    writeFile(path.join(outputDir, 'js', 'api.js'), STATIC_API_ENTRY),
    writeJson(path.join(outputDir, SITE_DATA_FILES.state), state),
    writeJson(path.join(outputDir, SITE_DATA_FILES.runs), { runs }),
  ]);
}

function writeJson(filePath, value) {
  return writeFile(filePath, JSON.stringify(value));
}
