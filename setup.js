#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workflowContent = `name: PR AI Review

on:
  pull_request:
    types: [opened, synchronize, ready_for_review]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run PR AI Review Action
        uses: ashugupta22/pr-review-bot@v1.0.0
        with:
          openai_api_key: \${{ secrets.OPENAI_API_KEY }}
          openai_model: gpt-4o-mini
          diff_chunk_size: "12000"
          review_prompt: ''
`;

const setupInstructions = `
🎉 PR Review Bot Setup Complete!

Next steps:
1. Add your OpenAI API key as a repository secret:
   - Go to your repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: OPENAI_API_KEY
   - Value: Your OpenAI API key (get it from https://platform.openai.com/api-keys)

2. The workflow will automatically run on:
   - New pull requests
   - Updated pull requests
   - When PRs are marked as ready for review

3. Optional: Customize the review behavior by editing .github/workflows/pr-review.yml:
   - Change openai_model (default: gpt-4o-mini)
   - Adjust diff_chunk_size (default: 12000)
   - Add custom review_prompt

The bot will now automatically review your pull requests and post inline comments with suggestions!
`;

function getTargetCwd() {
  // Prefer npm's INIT_CWD to write into the caller project during install
  // Fallback to process.cwd()
  return process.env.INIT_CWD || process.cwd();
}

function createWorkflowFile() {
  const targetCwd = getTargetCwd();
  const workflowDir = path.join(targetCwd, '.github', 'workflows');
  const workflowPath = path.join(workflowDir, 'pr-review.yml');
  
  // Create .github/workflows directory if it doesn't exist
  if (!fs.existsSync(workflowDir)) {
    fs.mkdirSync(workflowDir, { recursive: true });
    console.log('✅ Created .github/workflows directory');
  }
  
  // If file exists, do not overwrite silently
  if (fs.existsSync(workflowPath)) {
    console.log('ℹ️  .github/workflows/pr-review.yml already exists. Skipping creation.');
  } else {
    fs.writeFileSync(workflowPath, workflowContent);
    console.log('✅ Created .github/workflows/pr-review.yml');
  }
  
  console.log(setupInstructions);
}

function main() {
  console.log('🚀 Setting up PR Review Bot...\n');
  
  try {
    createWorkflowFile();
  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    process.exit(1);
  }
}

main();
