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
          'You are a senior software engineer reviewing a GitHub Pull Request. Analyze diffs for readability, maintainability, security, and performance. Return ONLY JSON array of issues with fields {file, line, comment, suggestion}.'

          'You are a senior software engineer reviewing a GitHub Pull Request. Analyze diffs for readability, maintainability, security, and performance. Return ONLY JSON array of issues with fields {file, line, comment, suggestion}. The suggestion MUST be a minimal replacement snippet (no surrounding, unrelated context) that replaces the lines at the indicated location, wrapped in a single Markdown code fence with an appropriate language tag. Only include meaningful feedback. Do not include markdown outside JSON.'
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

    try {
      const res = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = `OpenAI API error ${res.status}: ${errorText}`;
        
        // Provide more specific error messages
        if (res.status === 401) {
          errorMessage = 'OpenAI API key is invalid or expired';
        } else if (res.status === 429) {
          errorMessage = 'OpenAI API rate limit exceeded';
        } else if (res.status === 500) {
          errorMessage = 'OpenAI API server error';
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        console.warn('[warn] Failed to parse OpenAI response as JSON:', content.substring(0, 200));
        parsed = { issues: [] };
      }
      
      const issues = Array.isArray(parsed) ? parsed : parsed.issues || [];
      return issues;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Network error connecting to OpenAI API');
      }
      throw err;
    }
  }
}


