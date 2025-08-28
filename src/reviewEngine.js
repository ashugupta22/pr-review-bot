import { GitHubClient } from './githubClient.js';
import { OpenAIClient } from './openaiClient.js';
import { buildLinePositionMap, prepareDiffPrompt, chunkDiffForModel } from './diffProcessor.js';

function isMeaningfulComment(issue) {
  if (!issue) return false;
  if (!issue.comment || !issue.suggestion) return false;
  const text = (issue.comment + ' ' + issue.suggestion).toLowerCase();
  const trivial = ['looks good', 'great', 'nit', 'minor', 'no change'];
  return !trivial.some(t => text.includes(t));
}

function dedupeNewComments(issues, existingComments) {
  const existingSet = new Set(
    existingComments.map(c => `${c.path}::${c.line || c.original_line || ''}::${(c.body || '').trim()}`)
  );
  return issues.filter(i => {
    const key = `${i.file}::${i.line}::${(i.comment || '').trim()}`;
    return !existingSet.has(key);
  });
}

export class ReviewEngine {
  constructor({ owner, repo, pullNumber }) {
    this.owner = owner;
    this.repo = repo;
    this.pullNumber = pullNumber;
    this.github = new GitHubClient({ token: process.env.GITHUB_TOKEN, owner, repo, pullNumber });
    this.openai = new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' });
  }

  async run() {
    console.log(`[info] Running review for ${this.owner}/${this.repo}#${this.pullNumber}`);
    const pr = await this.github.getPullRequest();
    if (pr.state !== 'open') {
      console.log('[info] PR is not open, skipping');
      return;
    }
    const files = await this.github.listFiles();
    const filesWithPatches = files.filter(f => !!f.patch);
    if (filesWithPatches.length === 0) {
      console.log('[info] No text patches to review');
      return;
    }

    const diffText = prepareDiffPrompt(filesWithPatches);
    const chunks = chunkDiffForModel(diffText, Number(process.env.DIFF_CHUNK_SIZE || 12000));
    const basePrompt = process.env.REVIEW_PROMPT || `Review the following unified diffs. Report issues as JSON {issues:[{file, line, comment, suggestion}]}. Line refers to the new line number in the file.`;

    const issues = [];
    for (const chunk of chunks) {
      try {
        const resIssues = await this.openai.reviewChunk({ prompt: basePrompt, chunk });
        if (Array.isArray(resIssues)) issues.push(...resIssues);
      } catch (e) {
        console.error('[warn] OpenAI reviewChunk failed:', e.message);
      }
    }

    // Filter and map to PR review comments
    const linePositionMap = buildLinePositionMap(filesWithPatches);
    const existing = await this.github.getExistingReviewComments();
    const filtered = dedupeNewComments(issues.filter(isMeaningfulComment), existing);

    const reviewComments = [];
    for (const i of filtered) {
      const fileMap = linePositionMap.get(i.file);
      if (!fileMap) continue;
      const position = fileMap.get(Number(i.line));
      if (!position) continue;
      const body = `${i.comment}\n\n${i.suggestion}`;
      reviewComments.push({ path: i.file, position, body });
    }

    // Batch comments into one review to reduce API calls
    if (reviewComments.length === 0) {
      console.log('[info] No new meaningful comments to post');
      return;
    }
    // GitHub limits comments per review; safe batch to 50 per review
    const batchSize = 50;
    for (let i = 0; i < reviewComments.length; i += batchSize) {
      const batch = reviewComments.slice(i, i + batchSize);
      try {
        await this.github.createReview(batch);
        console.log(`[info] Posted review with ${batch.length} comments`);
      } catch (e) {
        console.error('[error] Failed to post review batch:', e.message);
      }
    }
  }
}


