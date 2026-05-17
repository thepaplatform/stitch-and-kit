// Vercel serverless function: POST /api/realistic-preview
// Two-step pipeline:
//   1. If client sent a PNG of the actual pattern (base64), ask GPT-4o-mini
//      to describe what the design shows in 1-2 sentences. This sidesteps
//      DALL-E's brand-name content filter — "UGA logo" → blocked, but "a
//      black serifed G inside a red oval" → fine.
//   2. Build a detailed needlepoint prompt around that description and call
//      DALL-E 3 to render a photorealistic finished-piece mockup.
//
// Required env var: OPENAI_API_KEY

const PROJECT_DESCRIPTIONS = {
  belt: 'a needlepoint belt logo (a small ~2.5" stitched logo centered on a thin belt blank)',
  belt_full: 'a needlepoint belt with a centered logo',
  keyfob: 'a small needlepoint key fob (small stitched panel attached to a leather strap)',
  ornament_round: 'a round needlepoint Christmas ornament with cord trim',
  ornament_oval: 'an oval needlepoint Christmas ornament with cord trim',
  coaster: 'a square needlepoint coaster',
  phrase_pillow_sm: 'a small landscape needlepoint phrase pillow with piped edge, like Furbish Studio',
  phrase_pillow_md: 'a medium landscape needlepoint phrase pillow with piped edge, like Furbish Studio',
  phrase_pillow_lg: 'a large landscape needlepoint phrase pillow with piped edge, like Furbish Studio',
  pillow_sm: 'a square needlepoint accent pillow with piped edge',
  pillow_lg: 'a large square needlepoint accent pillow with piped edge',
  stocking: 'a needlepoint Christmas stocking hung from a mantel',
  custom: 'a finished hand-stitched needlepoint piece',
};

// Step 1: ask GPT-4o-mini to describe the user's actual pattern image.
async function describeDesign({ apiKey, designImageBase64 }) {
  if (!designImageBase64) return null;
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'This is a pixelated needlepoint pattern chart. Describe what the design shows in 1-2 short sentences for an AI image generator. Focus on the visual elements (shapes, letters, colors, layout) — NOT on brand names, logos, or trademarks. Example: "a black uppercase G letter inside a dark red oval ring, on white background". Keep it factual and visual.',
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${designImageBase64}` },
          },
        ],
      }],
    }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Vision step failed: ${text}`);
  }
  const data = await r.json();
  return data?.choices?.[0]?.message?.content?.trim() || null;
}

function buildPrompt({ visionDescription, fallbackDescription, projectKey, widthIn, heightIn, colors }) {
  const itemPhrase = PROJECT_DESCRIPTIONS[projectKey] || 'a finished needlepoint piece';
  const sizePhrase = (widthIn && heightIn) ? `approximately ${widthIn.toFixed(1)}" by ${heightIn.toFixed(1)}"` : '';
  const topColors = (colors || []).slice(0, 6)
    .map(c => (c.name || c.hex || '').toLowerCase().trim())
    .filter(Boolean)
    .join(', ');
  const designLine = visionDescription || fallbackDescription || '';

  return [
    `A high-quality product photograph of ${itemPhrase}, ${sizePhrase}.`,
    designLine ? `The needlepoint design depicts: ${designLine}` : '',
    topColors ? `Stitched with ${topColors} thread on cream needlepoint canvas.` : '',
    'Visible individual tent stitches with realistic textile texture and slight thread variations.',
    'Professional product photography with soft natural daylight and shallow depth of field.',
    'Displayed on a velvet armchair, wooden side table, or cozy bed with neutral background.',
    'Aesthetic: heirloom needlepoint in the style of Furbish Studio or NeedlepointAfterDark.',
  ].filter(Boolean).join(' ');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'OPENAI_API_KEY env var is not set on Vercel.',
      details: 'Vercel project → Settings → Environment Variables → add OPENAI_API_KEY, then Redeploy.',
    });
  }

  const body = req.body || {};
  const { designImageBase64, description: fallbackDescription, projectKey, widthIn, heightIn, colors } = body;

  let visionDescription = null;
  try {
    visionDescription = await describeDesign({ apiKey, designImageBase64 });
  } catch (err) {
    // Don't fail outright — fall back to the user's text description if vision failed.
    console.error('Vision step error:', err);
  }

  const prompt = buildPrompt({ visionDescription, fallbackDescription, projectKey, widthIn, heightIn, colors });

  // Try newer model first (gpt-image-1, widely-rolled-out 2025), then fall
  // back to dall-e-3, then dall-e-2. Different accounts have different model
  // access, so the fallback chain maximizes the chance one of them works.
  const MODELS = ['gpt-image-1', 'dall-e-3', 'dall-e-2'];
  let lastError = null;
  let lastErrorStatus = 500;
  let lastModel = null;

  for (const model of MODELS) {
    lastModel = model;
    // dall-e-3 requires explicit "quality" param; gpt-image-1 uses defaults.
    const requestBody = model === 'dall-e-3'
      ? { model, prompt, n: 1, size: '1024x1024', quality: 'standard' }
      : { model, prompt, n: 1, size: '1024x1024' };
    try {
      const r = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!r.ok) {
        const text = await r.text();
        let openaiMessage = text;
        try { openaiMessage = JSON.parse(text)?.error?.message || text; } catch {}
        lastError = openaiMessage;
        lastErrorStatus = r.status;
        // If it's a "model not found" error, try the next one. Other errors
        // (rate limit, billing) won't be fixed by switching models — bail.
        const modelNotFound = /does not exist|not found|do not have access/i.test(openaiMessage);
        if (modelNotFound) continue;
        break;
      }
      const data = await r.json();
      // dall-e returns url, gpt-image-1 returns b64_json.
      let imageUrl = data?.data?.[0]?.url;
      if (!imageUrl && data?.data?.[0]?.b64_json) {
        imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
      }
      if (!imageUrl) {
        return res.status(502).json({ error: 'No image in OpenAI response', raw: data, model });
      }
      return res.status(200).json({ imageUrl, prompt, visionDescription, model });
    } catch (err) {
      lastError = String(err);
    }
  }

  return res.status(lastErrorStatus).json({
    error: `All image models failed (last tried: ${lastModel})`,
    details: lastError,
    prompt,
    visionDescription,
  });
}
