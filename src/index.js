import 'dotenv/config';
import fs from 'fs';
import { ReviewEngine } from './reviewEngine.js';

async function main() {
  try {
    // Get GitHub Actions inputs and environment variables
    const {
      GITHUB_TOKEN,
      GITHUB_REPOSITORY,
      GITHUB_EVENT_PATH
    } = process.env;

    // Get action inputs (GitHub Actions passes these as environment variables)
    const openaiApiKey = process.env.INPUT_OPENAI_API_KEY;
    const openaiModel = process.env.INPUT_OPENAI_MODEL || 'gpt-4o-mini';
    const diffChunkSize = process.env.INPUT_DIFF_CHUNK_SIZE || '12000';
    const reviewPrompt = process.env.INPUT_REVIEW_PROMPT || '';

    // Validate required inputs
    if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN not set');
    if (!openaiApiKey) throw new Error('INPUT_OPENAI_API_KEY not set');
    if (!GITHUB_REPOSITORY) throw new Error('GITHUB_REPOSITORY not set');

    // Get PR number from GitHub Actions context
    let pullNumber;
    if (GITHUB_EVENT_PATH) {
      try {
        const eventData = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH, 'utf8'));
        pullNumber = eventData.pull_request?.number;
      } catch (error) {
        console.warn('Could not parse GITHUB_EVENT_PATH, trying fallback method');
      }
    }
    
    // Fallback: try to get from environment variable
    if (!pullNumber) {
      pullNumber = Number(process.env.INPUT_PR_NUMBER);
    }

    if (!pullNumber) {
      throw new Error('PR number not found in context. Make sure this action is triggered on pull_request events.');
    }

    console.log(`Starting PR review for PR #${pullNumber} in ${GITHUB_REPOSITORY}`);
    console.log(`Using OpenAI model: ${openaiModel}`);
    console.log(`Diff chunk size: ${diffChunkSize}`);

    const [owner, repo] = GITHUB_REPOSITORY.split('/');
    
    // Set environment variables for the ReviewEngine
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


