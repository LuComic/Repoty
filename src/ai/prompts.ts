export function buildFileSummaryPrompt(input: {
  path: string;
  language: string;
  imports: string[];
  exports: string[];
  functions: string[];
  classes: string[];
  safeContent: string;
}): string {
  return `You generate compact repository metadata for AI coding agents.

Your goal is not to explain the whole file.
Your goal is to help another model decide whether this file is relevant to a future coding task.

Return only JSON matching this exact shape:
{
  "purpose": string,
  "domain": string,
  "tags": string[],
  "usedFor": string[],
  "warnings": string[],
  "summaryConfidence": number
}

Constraints:
- purpose max 240 chars
- domain max 40 chars
- tags max 12 items, each max 32 chars
- usedFor max 8 items, each max 120 chars
- warnings max 5 items, each max 120 chars
- summaryConfidence must be between 0 and 1

Rules:
- Be compact.
- Focus on purpose, role, domain, and task relevance.
- Do not invent exports, imports, or function names.
- Do not include implementation details unless they affect navigation.
- Do not include secrets or copied code.

Input:

Path:
${input.path}

Language:
${input.language}

Static metadata:
imports: ${JSON.stringify(input.imports)}
exports: ${JSON.stringify(input.exports)}
functions: ${JSON.stringify(input.functions)}
classes: ${JSON.stringify(input.classes)}

File content:
${input.safeContent}`;
}

export function buildRouteSummaryPrompt(input: {
  name: string;
  files: string[];
  filePurposes: string[];
}): string {
  return `You summarize one repository route/domain for AI coding agents.
Return only JSON matching this exact shape:
{
  "title": string,
  "purpose": string,
  "tags": string[],
  "relatedRoutes": string[]
}

Constraints:
- title max 80 chars
- purpose max 240 chars
- tags max 12 items
- relatedRoutes max 8 items

Keep it compact and navigational.

Route: ${input.name}
Files: ${JSON.stringify(input.files)}
File purposes: ${JSON.stringify(input.filePurposes)}`;
}
