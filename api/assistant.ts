/* Vercel serverless route: POST /api/assistant.

   This is the ONLY place in production that touches GROQ_API_KEY — it is
   read from the server environment and handed to the shared core, which
   calls Groq. The browser calls this endpoint, never Groq. Types are kept
   structural so the function builds without installing @vercel/node. */

import { handleAssistant } from './assistant-core';

interface VercelRequest {
  method?: string;
  body?: unknown;
}

interface VercelResponse {
  status: (code: number) => { json: (body: unknown) => void };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST.' });
    return;
  }
  const result = await handleAssistant(req.body ?? {}, {
    apiKey: process.env.GROQ_API_KEY ?? '',
    model: process.env.GROQ_MODEL,
  });
  res.status(result.status).json(result.body);
}
