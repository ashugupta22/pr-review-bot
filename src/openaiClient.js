import fetch from 'node-fetch';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export class OpenAIClient {
  constructor({ apiKey, model = 'gpt-4o-mini' }) {
    this.apiKey = apiKey;
    this.model = model;
  }

  buildMessages(prompt, chunk) {
    return [
      {
        role: 'system',
        content:
          'You are a senior software engineer reviewing a GitHub Pull Request. Analyze diffs for readability, maintainability, security, and performance. Return ONLY JSON array of issues with fields {file, line, comment, suggestion}. The suggestion must be a full corrected code snippet wrapped in Markdown code fences with a language tag. Only include meaningful feedback. Do not include markdown outside JSON.'
      },
      { role: 'user', content: `${prompt}\n\nDIFF CHUNK START\n${chunk}\nDIFF CHUNK END` },
    ];
  }

  async reviewChunk({ prompt, chunk, temperature = 0.1, maxTokens = 1200 }) {
    const body = {
      model: this.model,
      temperature,
      max_tokens: maxTokens,
      messages: this.buildMessages(prompt, chunk),
      response_format: { type: 'json_object' },
    };

    const res = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${t}`);
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      parsed = { issues: [] };
    }
    const issues = Array.isArray(parsed) ? parsed : parsed.issues || [];
    return issues;
  }
}


