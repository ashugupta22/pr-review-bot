# 🤖 GitHub PR Review Bot

Automated PR reviewer that analyzes diffs and posts inline suggestions using OpenAI. Get AI-powered code reviews on every pull request!

## 📋 Table of Contents

- [✨ Features](#-features)
- [🚀 Quick Setup](#-quick-setup-choose-one)
- [📋 Prerequisites](#-prerequisites)
- [🔧 Configuration](#configuration)
- [⚙️ How it Works](#how-it-works)
- [🛠️ Error Handling](#error-handling)
- [📝 Prompt Template](#prompt-template)
- [📚 Notes and Limitations](#notes-and-limitations)
- [📄 License](#license)

## ✨ Features

- 🤖 **AI-Powered Reviews**: Uses OpenAI to analyze code quality, security, and performance
- 📝 **Inline Comments**: Posts specific suggestions directly on code lines
- 🔄 **Auto-Triggered**: Runs on PR open, sync, and ready-for-review events
- 🛡️ **Smart Filtering**: Avoids duplicate and trivial comments
- 🌍 **Language Agnostic**: Works with any programming language
- ⚡ **Fast & Efficient**: Chunks large diffs for optimal processing

## 🚀 Quick Setup (Choose One)

### Option 1: One-Click Setup (Recommended)
```bash
npx pr-review-ai-bot@v1.0.0 setup
```
Then add your OpenAI API key as a repository secret named `OPENAI_API_KEY`.

### Option 2: Manual Setup
1. Create `.github/workflows/pr-review.yml` in your repository:
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
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run PR AI Review Action
        uses: ashugupta22/pr-review-bot@v1.0.0
        with:
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          openai_model: gpt-4o-mini
          diff_chunk_size: "12000"
          review_prompt: ''
```

2. Add your OpenAI API key as a repository secret named `OPENAI_API_KEY`

## 📋 Prerequisites

- GitHub repository with Actions enabled
- OpenAI API key (get one from [OpenAI Platform](https://platform.openai.com/api-keys))

The Action runs on PR events (opened, synchronize, ready_for_review) and posts a single batched review with inline comments.

### Use as a reusable Action in multiple repos

#### Quick Setup (Recommended)
```bash
npx pr-review-ai-bot@v1.0.0 setup
```

#### Manual Setup
1. In each target repository, create a workflow like:
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
        uses: ashugupta22/pr-review-bot@v1.0.0
        with:
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          openai_model: gpt-4o-mini
          diff_chunk_size: "12000"
          review_prompt: ''
```
2. Add `OPENAI_API_KEY` secret in each target repository.

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
