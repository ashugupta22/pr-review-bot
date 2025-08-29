import 'dotenv/config';
import { ReviewEngine } from './reviewEngine.js';

async function main() {
  try {
    const { GITHUB_TOKEN, OPENAI_API_KEY, GITHUB_REPOSITORY } = process.env;
    if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN not set');
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
    if (!GITHUB_REPOSITORY) throw new Error('GITHUB_REPOSITORY not set');

    // Get PR number from GitHub Actions context
    const pullNumber = Number(process.env.INPUT_PR_NUMBER);
    if (!pullNumber) throw new Error('PR number not found in context');

    const [owner, repo] = GITHUB_REPOSITORY.split('/');
    const engine = new ReviewEngine({ owner, repo, pullNumber });
    await engine.run();
  } catch (err) {
    console.error('[FATAL]', err.stack || err);
    process.exitCode = 1;
    throw err; // Re-throw to ensure workflow fails
  }
}

main();


