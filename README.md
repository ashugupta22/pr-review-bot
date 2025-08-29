# GitHub PR Review Bot (Node.js + OpenAI)

Automated PR reviewer that analyzes diffs and posts inline suggestions using the OpenAI API.

## Features
- Triggers on PR opened, synchronize, ready_for_review
- Fetches PR diffs and chunks for LLM processing
- Reviews for readability, maintainability, security, performance
- Returns structured JSON and posts inline review comments
- Filters trivial/duplicate comments
- Runs as a GitHub Action

## Setup (GitHub Actions)

### Prerequisites
- GitHub repository with Actions enabled
- OpenAI API key with access to `gpt-4o-mini` (or set `OPENAI_MODEL`)

### Steps (use locally in this repo)
1. Add repo secret `OPENAI_API_KEY` (Repository Settings → Secrets and variables → Actions → New repository secret).
2. Ensure the workflow has `pull-requests: write` permissions (already configured).
3. Commit the workflow at `.github/workflows/pr-review.yml`.

The Action runs on PR events (opened, synchronize, ready_for_review) and posts a single batched review with inline comments.

### Use as a reusable Action in multiple repos
1. Push/tag this repository (the action source) to GitHub.
2. In each target repository, create a workflow like:
```yaml
name: PR AI Review
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
      - name: Run PR AI Review Action
        uses: owner/repo@v1   # replace with your action repo and tag
        with:
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          openai_model: gpt-4o-mini
          diff_chunk_size: "12000"
          review_prompt: ''
```
3. Add `OPENAI_API_KEY` secret in each target repository.

## Configuration
- `OPENAI_API_KEY`: OpenAI key (required)
- `OPENAI_MODEL`: Model name (default: `gpt-4o-mini`)
- `DIFF_CHUNK_SIZE`: Max characters per diff chunk sent to OpenAI (default: 12000)
- `REVIEW_PROMPT`: Override the default review instruction

## How it Works
- Lists PR files and unified patches via GitHub API
- Builds a map from file+line to diff position for inline comments
- Concatenates and chunks patches, sends to OpenAI with a strict JSON-only instruction
- Parses `{ issues: [{ file, line, comment, suggestion }] }`
- Filters trivial feedback and duplicates from existing PR review comments
- Posts batched review comments using the Review API

## Error Handling
- Workflow fails if OpenAI API key is invalid or expired
- Workflow fails if all OpenAI API calls fail
- Workflow fails if GitHub API calls fail
- Individual chunk failures are logged but don't fail the entire workflow unless all chunks fail

## Prompt Template
See `prompt.md` for the base prompt used when `REVIEW_PROMPT` is not provided.

## Notes and Limitations
- Only comments on lines present in the new revision (no deleted-line comments)
- Binary/large files with no `patch` are skipped
- Duplicate detection uses path+line+body; adjust in `reviewEngine.js` if needed

## License
MIT
