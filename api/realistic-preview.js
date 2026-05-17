// Vercel serverless function: POST /api/realistic-preview
// Takes a brief description + the user's pattern metadata, builds a needlepoint-
// flavored prompt, calls OpenAI DALL-E 3, and returns the generated image URL.
//
// Required env var on Vercel: OPENAI_API_KEY

const PROJECT_DESCRIPTIONS = {
  belt: 'a needlepoint belt logo',
  belt_full: 'a long needlepoint belt',
  keyfob: 'a small needlepoint key fob',
  ornament_round: 'a round needlepoint ornament',
  ornament_oval: 'an oval needlepoint ornament',
  coaster: 'a square needlepoint coaster',
  phrase_pillow_sm: 'a small needlepoint phrase pillow',
  phrase_pillow_md: 'a medium needlepoint phrase pillow',
  phrase_pillow_lg: 'a large landscape needlepoint phrase pillow',
  pillow_sm: 'a square needlepoint pillow',
  pillow_lg: 'a large square needlepoint pillow',
  stocking: 'a needlepoint Christmas stocking',
  custom: 'a custom needlepoint piece',
};

const buildPrompt = ({ description, projectKey, widthIn, heightIn, colors }) => {
  const itemPhrase = PROJECT_DESCRIPTIONS[projectKey] || 'a needlepoint piece';
  const sizePhrase = `${widthIn?.toFixed(1) || '?'}" × ${heightIn?.toFixed(1) || '?'}"`;
  // Pull the most-used 4-6 colors and use the human-friendly names.
  const topColors = (colors || []).slice(0, 6)
    .map(c => (c.name || c.hex || '').toLowerCase().trim())
    .filter(Boolean)
    .join(', ');
  const userDesc = (description || '').trim();
  const designLine = userDesc
    ? `The design shows: ${userDesc}.`
    : '';

  return [
    `Photograph of a finished, hand-stitched ${itemPhrase}, approximately ${sizePhrase}.`,
    designLine,
    topColors ? `Stitched with ${topColors} thread on cream needlepoint canvas.` : '',
    'Realistic textile texture with visible individual tent stitches.',
    'Soft natural daylight, professional product photography.',
    'Styled on a velvet armchair or rustic wooden side table with soft background blur.',
    'In the aesthetic of Furbish Studio or NeedlepointAfterDark heirloom needlepoint.',
  ].filter(Boolean).join(' ');
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'OPENAI_API_KEY env var is not set on Vercel.',
      help: 'Vercel project → Settings → Environment Variables → add OPENAI_API_KEY',
    });
  }

  const body = req.body || {};
  const prompt = buildPrompt(body);

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
      return res.status(r.status).json({ error: 'OpenAI request failed', details: text, prompt });
    }
    const data = await r.json();
    const imageUrl = data?.data?.[0]?.url;
    if (!imageUrl) {
      return res.status(502).json({ error: 'No image URL in OpenAI response', raw: data });
    }
    return res.status(200).json({ imageUrl, prompt });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}
