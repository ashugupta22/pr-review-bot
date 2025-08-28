import 'dotenv/config';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { ReviewEngine } from './reviewEngine.js';

async function main() {
  try {
    const { GITHUB_TOKEN, OPENAI_API_KEY, GITHUB_REPOSITORY, GITHUB_EVENT_PATH } = process.env;
    if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN not set');
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');

    // Inputs from GitHub Actions or env
    const repoFull = process.env.INPUT_REPOSITORY || GITHUB_REPOSITORY; // owner/repo
    const pullNumber = Number(process.env.INPUT_PR_NUMBER || process.env.PR_NUMBER);
    if (!repoFull) throw new Error('Repository not resolved');

    const [owner, repo] = repoFull.split('/');
    const engine = new ReviewEngine({ owner, repo, pullNumber });
    await engine.run();
  } catch (err) {
    console.error('[FATAL]', err.stack || err);
    process.exitCode = 1;
  }
}

main();


