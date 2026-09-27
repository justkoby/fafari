/* Fafari Assistant — server core tests.

   Bundles api/assistant-core.ts with esbuild and drives it through an
   injected mock transport, so every branch (valid picks, id validation,
   the 3-cap, follow-ups, custom order, rate limit, server error, network
   failure, malformed JSON, input limits, history + context handling and
   the exact Groq request shape) is verified without touching the network. */
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdirSync, rmSync } from 'node:fs';

const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });

const SECRET = 'SECRET_TEST_KEY_123';
const tmpDir = 'scripts/.tmp';
const outfile = `${tmpDir}/assistant-core.mjs`;

mkdirSync(tmpDir, { recursive: true });
await build({
  entryPoints: ['api/assistant-core.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node18',
  outfile,
  logLevel: 'silent',
});
const { handleAssistant } = await import(pathToFileURL(outfile).href);

/* Groq-shaped mock transports. */
const groqOk = (obj) => async () => ({
  ok: true,
  status: 200,
  json: async () => ({ choices: [{ message: { content: JSON.stringify(obj) } }] }),
});
const groqRaw = (content) => async () => ({
  ok: true,
  status: 200,
  json: async () => ({ choices: [{ message: { content } }] }),
});
const groqStatus = (status) => async () => ({ ok: false, status, json: async () => ({}) });
const groqThrow = () => async () => {
  throw new Error('network down');
};

let lastCall;
const capture = (impl) => async (url, init) => {
  lastCall = { url, init, sent: JSON.parse(init.body) };
  return impl(url, init);
};

const VALID = [
  'blush-and-bloom-bouquet',
  'vlisco-celebration-hamper',
  'heartfelt-gift-box',
  'snake-plant-geometric-pot',
  'lush-palm-wooden-planter',
];

try {
  /* 1. Valid recommendation + exact request shape + no key leakage. */
  {
    const impl = capture(
      groqOk({
        reply: 'Two ideas for your mum.',
        productIds: ['crimson-wine-gift', 'blush-and-bloom-bouquet'],
        needsFollowUp: false,
        customOrder: false,
      }),
    );
    const res = await handleAssistant(
      { message: 'a birthday gift for my mum under 500 cedis', history: [], context: '' },
      { apiKey: SECRET, fetchImpl: impl },
    );
    check('valid: status 200', res.status === 200, String(res.status));
    check(
      'valid: ids preserved in order',
      JSON.stringify(res.body.productIds) === JSON.stringify(['crimson-wine-gift', 'blush-and-bloom-bouquet']),
      JSON.stringify(res.body.productIds),
    );
    check('valid: reply passed through', res.body.reply === 'Two ideas for your mum.');
    check('valid: not a custom order', res.body.customOrder === false);
    check('valid: not degraded', !res.body.degraded);

    const { url, init, sent } = lastCall;
    check('req: Groq chat completions URL', url === 'https://api.groq.com/openai/v1/chat/completions', url);
    check('req: POST', init.method === 'POST');
    check('req: key only in Authorization header', init.headers.Authorization === `Bearer ${SECRET}`);
    check('req: JSON object mode', sent.response_format?.type === 'json_object');
    check('req: model set', typeof sent.model === 'string' && sent.model.length > 0, sent.model);
    check('req: bounded tokens', sent.max_completion_tokens > 0 && sent.max_completion_tokens <= 800);
    check('req: system prompt embeds real catalogue', sent.messages[0].content.includes('crimson-wine-gift'));
    check('req: prompt demands JSON', sent.messages[0].content.includes('JSON'));
    check('req: prompt forbids inventing', /never invent/i.test(sent.messages[0].content));
    check('req: user message last', sent.messages.at(-1).content === 'a birthday gift for my mum under 500 cedis');
    check('res: secret key never returned', !JSON.stringify(res.body).includes(SECRET));
  }

  /* 2. Unknown ids are dropped. */
  {
    const res = await handleAssistant(
      { message: 'gift' },
      { apiKey: SECRET, fetchImpl: groqOk({ reply: 'x', productIds: ['crimson-wine-gift', 'not-a-real-id'], needsFollowUp: false, customOrder: false }) },
    );
    check('validate: unknown id dropped', JSON.stringify(res.body.productIds) === JSON.stringify(['crimson-wine-gift']));
  }

  /* 3. Capped at three, order preserved. */
  {
    const res = await handleAssistant(
      { message: 'gift' },
      { apiKey: SECRET, fetchImpl: groqOk({ reply: 'x', productIds: VALID, needsFollowUp: false, customOrder: false }) },
    );
    check('validate: capped at 3', res.body.productIds.length === 3, JSON.stringify(res.body.productIds));
    check('validate: first three kept', JSON.stringify(res.body.productIds) === JSON.stringify(VALID.slice(0, 3)));
  }

  /* 4. Follow-up suppresses products. */
  {
    const res = await handleAssistant(
      { message: 'something nice' },
      { apiKey: SECRET, fetchImpl: groqOk({ reply: 'Who is it for?', productIds: ['crimson-wine-gift'], needsFollowUp: true, customOrder: false }) },
    );
    check('follow-up: flag set', res.body.needsFollowUp === true);
    check('follow-up: products suppressed', res.body.productIds.length === 0);
    check('follow-up: not a custom order', res.body.customOrder === false);
  }

  /* 5. No match -> custom order; also derived when model forgets the flag. */
  {
    const a = await handleAssistant(
      { message: 'a live penguin' },
      { apiKey: SECRET, fetchImpl: groqOk({ reply: 'Nothing fits.', productIds: [], needsFollowUp: false, customOrder: true }) },
    );
    check('no-match: custom order true', a.body.customOrder === true);
    check('no-match: no products', a.body.productIds.length === 0);

    const b = await handleAssistant(
      { message: 'a live penguin' },
      { apiKey: SECRET, fetchImpl: groqOk({ reply: 'Hmm.', productIds: [], needsFollowUp: false, customOrder: false }) },
    );
    check('no-match: custom order derived when empty + no follow-up', b.body.customOrder === true);
  }

  /* 6. Rate limit, server error, network failure -> graceful degrade. */
  {
    const rl = await handleAssistant({ message: 'gift' }, { apiKey: SECRET, fetchImpl: groqStatus(429) });
    check('429: status 200', rl.status === 200);
    check('429: degraded', rl.body.degraded === true);
    check('429: offers custom order', rl.body.customOrder === true);
    check('429: busy message', /busy/i.test(rl.body.reply), rl.body.reply);

    const se = await handleAssistant({ message: 'gift' }, { apiKey: SECRET, fetchImpl: groqStatus(500) });
    check('500: degraded', se.body.degraded === true && se.status === 200);

    const net = await handleAssistant({ message: 'gift' }, { apiKey: SECRET, fetchImpl: groqThrow() });
    check('network throw: degraded', net.body.degraded === true && net.body.customOrder === true);
  }

  /* 7. Malformed JSON degrades; JSON wrapped in prose is recovered. */
  {
    const bad = await handleAssistant({ message: 'gift' }, { apiKey: SECRET, fetchImpl: groqRaw('totally not json') });
    check('malformed: degraded', bad.body.degraded === true);

    const wrapped = await handleAssistant(
      { message: 'gift' },
      { apiKey: SECRET, fetchImpl: groqRaw('Sure! {"reply":"Hi there","productIds":["crimson-wine-gift"],"needsFollowUp":false,"customOrder":false} hope it helps') },
    );
    check('wrapped json: recovered reply', wrapped.body.reply === 'Hi there', wrapped.body.reply);
    check('wrapped json: recovered id', JSON.stringify(wrapped.body.productIds) === JSON.stringify(['crimson-wine-gift']));
    check('wrapped json: not degraded', !wrapped.body.degraded);
  }

  /* 8. Input validation. */
  {
    const empty = await handleAssistant({ message: '   ' }, { apiKey: SECRET, fetchImpl: groqOk({}) });
    check('input: empty message -> 400', empty.status === 400 && !!empty.body.error);

    const missing = await handleAssistant({}, { apiKey: SECRET, fetchImpl: groqOk({}) });
    check('input: missing message -> 400', missing.status === 400);

    const long = await handleAssistant({ message: 'a'.repeat(601) }, { apiKey: SECRET, fetchImpl: groqOk({}) });
    check('input: over-long message -> 400', long.status === 400);

    const badMethodBody = await handleAssistant(null, { apiKey: SECRET, fetchImpl: groqOk({}) });
    check('input: null body -> 400', badMethodBody.status === 400);
  }

  /* 9. Missing key degrades with a config message (never a crash). */
  {
    const res = await handleAssistant({ message: 'gift' }, { apiKey: '', fetchImpl: groqOk({ reply: 'x', productIds: [], needsFollowUp: false, customOrder: false }) });
    check('no-key: status 200 degraded', res.status === 200 && res.body.degraded === true);
    check('no-key: config message', /configured/i.test(res.body.reply), res.body.reply);
  }

  /* 10. History sanitisation + cap + context injection. */
  {
    const impl = capture(groqOk({ reply: 'ok', productIds: [], needsFollowUp: false, customOrder: false }));
    await handleAssistant(
      {
        message: 'hi',
        history: [
          { role: 'user', content: 'a' },
          { role: 'bogus', content: 'b' },
          { role: 'assistant', content: 'c' },
          'junk',
          null,
        ],
        context: 'search text "roses"; price filter Under GH₵500',
      },
      { apiKey: SECRET, fetchImpl: impl },
    );
    const { sent } = lastCall;
    const turns = sent.messages.filter((m) => m.role === 'user' || m.role === 'assistant');
    check('history: invalid roles/junk dropped', turns.length === 3, String(turns.length)); // a, c, hi
    check('history: bogus content absent', !sent.messages.some((m) => m.content === 'b'));
    check('context: injected as a system note', sent.messages.some((m) => m.role === 'system' && m.content.includes('roses')));

    const impl2 = capture(groqOk({ reply: 'ok', productIds: [], needsFollowUp: false, customOrder: false }));
    const many = Array.from({ length: 10 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` }));
    await handleAssistant({ message: 'now', history: many }, { apiKey: SECRET, fetchImpl: impl2 });
    const turns2 = lastCall.sent.messages.filter((m) => m.role === 'user' || m.role === 'assistant');
    check('history: capped to 6 + current', turns2.length === 7, String(turns2.length));
    check('history: current message is last', turns2.at(-1).content === 'now');
  }
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}

const passed = results.filter((r) => r.ok).length;
for (const r of results) {
  if (!r.ok) console.log(`  FAIL  ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
}
console.log(`\n${passed}/${results.length} core checks passed`);
process.exit(passed === results.length ? 0 : 1);
