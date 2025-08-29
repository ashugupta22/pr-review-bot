// Utilities to chunk diffs and map AI-suggested lines to PR review positions

function chunkText(text, maxChars) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks;
}

// Build mapping of file -> newLine -> position (diff hunk position)
export function buildLinePositionMap(files) {
  const map = new Map();
  for (const file of files) {
    const { filename, patch } = file;
    if (!patch) continue; // binary or too large
    const fileMap = new Map();

    const lines = patch.split('\n');
    let newLineNum = 0;
    let position = 0;
    for (const line of lines) {
      position += 1;
      if (line.startsWith('@@')) {
        // @@ -a,b +c,d @@
        const m = /\+([0-9]+)(?:,([0-9]+))?/.exec(line);
        if (m) {
          newLineNum = parseInt(m[1], 10) - 1; // will ++ at additions/context
        }
        continue;
      }
      if (line.startsWith('+')) {
        newLineNum += 1;
        fileMap.set(newLineNum, position);
      } else if (line.startsWith('-')) {
        // deletion: does not advance new line number
      } else {
        // context line
        newLineNum += 1;
        fileMap.set(newLineNum, position);
      }
    }
    map.set(filename, fileMap);
  }
  return map;
}

export function prepareDiffPrompt(files) {
  // Concatenate filename and patch for AI context
  const parts = [];
  for (const f of files) {
    if (!f.patch) continue;
    parts.push(`FILE: ${f.filename}\n${f.patch}`);
  }
  return parts.join('\n\n');
}

export function chunkDiffForModel(text, maxChars = 12000) {
  return chunkText(text, maxChars);
}


