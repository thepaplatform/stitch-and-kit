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

  try {
    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      // Parse OpenAI's error JSON for a clean message if possible.
      let openaiMessage = text;
      try {
        const parsed = JSON.parse(text);
        openaiMessage = parsed?.error?.message || text;
      } catch {}
      return res.status(r.status).json({
        error: 'OpenAI rejected the request',
        details: openaiMessage,
        prompt,
        visionDescription,
      });
    }
    const data = await r.json();
    const imageUrl = data?.data?.[0]?.url;
    if (!imageUrl) {
      return res.status(502).json({ error: 'No image URL in OpenAI response', raw: data });
    }
    return res.status(200).json({ imageUrl, prompt, visionDescription });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}
