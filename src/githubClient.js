import { Octokit } from '@octokit/rest';

export class GitHubClient {
  constructor({ token, owner, repo, pullNumber }) {
    console.log("test to check token",token);
    console.log("test to check owner",owner);
    console.log("test to check repo",repo);
    console.log("test to check pullNumber",pullNumber);
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
    this.pullNumber = pullNumber;
  }

  async getPullRequest() {
    const { data } = await this.octokit.pulls.get({
      owner: this.owner,
      repo: this.repo,
      pull_number: this.pullNumber,
    });
    return data;
  }

  async listFiles() {
    const files = [];
    let page = 1;
    for (;;) {
      const { data } = await this.octokit.pulls.listFiles({
        owner: this.owner,
        repo: this.repo,
        pull_number: this.pullNumber,
        per_page: 100,
        page,
      });
      files.push(...data);
      if (data.length < 100) break;
      page += 1;
    }
    return files;
  }

  async getExistingReviewComments() {
    const comments = [];
    let page = 1;
    for (;;) {
      const { data } = await this.octokit.pulls.listReviewComments({
        owner: this.owner,
        repo: this.repo,
        pull_number: this.pullNumber,
        per_page: 100,
        page,
      });
      comments.push(...data);
      if (data.length < 100) break;
      page += 1;
    }
    return comments;
  }

  async createReview(comments, body = 'Automated review suggestions') {
    if (!comments || comments.length === 0) return null;
    const { data } = await this.octokit.pulls.createReview({
      owner: this.owner,
      repo: this.repo,
      pull_number: this.pullNumber,
      event: 'COMMENT',
      body,
      comments,
    });
    return data;
  }
}


