import 'dotenv/config';
import fs from 'fs';
import { ReviewEngine } from './reviewEngine.js';

async function main() {
  try {
    // Get GitHub Actions environment variables
    const {
      GITHUB_TOKEN,
      GITHUB_REPOSITORY,
      GITHUB_EVENT_PATH
    } = process.env;

    // Read inputs from standard env names (no INPUT_* usage)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const diffChunkSize = process.env.DIFF_CHUNK_SIZE || '12000';
    const reviewPrompt = process.env.REVIEW_PROMPT || '';

    // Validate required inputs
    if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN not set');
    if (!openaiApiKey) throw new Error('OPENAI_API_KEY not set');
    if (!GITHUB_REPOSITORY) throw new Error('GITHUB_REPOSITORY not set');

    // Determine PR number from event payload first
    let pullNumber;
    if (GITHUB_EVENT_PATH) {
      try {
        const eventData = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH, 'utf8'));
        pullNumber = eventData.pull_request?.number;
      } catch (error) {
        console.warn('Could not parse GITHUB_EVENT_PATH for PR number');
      }
    }

    // Fallback: specific env var if provided by workflow
    if (!pullNumber && process.env.INPUT_PR_NUMBER) {
      pullNumber = Number(process.env.INPUT_PR_NUMBER);
    }

    if (!pullNumber) {
      throw new Error('PR number not found in context. Ensure this runs on pull_request events.');
    }

    console.log(`Starting PR review for PR #${pullNumber} in ${GITHUB_REPOSITORY}`);
    console.log(`Using OpenAI model: ${openaiModel}`);
    console.log(`Diff chunk size: ${diffChunkSize}`);

    const [owner, repo] = GITHUB_REPOSITORY.split('/');

    // Ensure downstream modules see the configured values
    process.env.OPENAI_API_KEY = openaiApiKey;
    process.env.OPENAI_MODEL = openaiModel;
    process.env.DIFF_CHUNK_SIZE = diffChunkSize;
    process.env.REVIEW_PROMPT = reviewPrompt;

    const engine = new ReviewEngine({ owner, repo, pullNumber });
    await engine.run();

    console.log('PR review completed successfully');
  } catch (err) {
    console.error('[FATAL]', err.stack || err);
    process.exitCode = 1;
    throw err; // Re-throw to ensure workflow fails
  }
}

main();


