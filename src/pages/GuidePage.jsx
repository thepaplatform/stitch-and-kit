import { Link } from 'react-router-dom';

const card = {
  background: 'rgba(255,255,255,0.95)',
  backdropFilter: 'blur(10px)',
  border: '3px solid #5B1735',
  borderRadius: 24,
  padding: 32,
  boxShadow: '5px 5px 0 #5B1735',
  marginBottom: 20,
};

const sectionTitle = {
  fontFamily: "'Pacifico', cursive",
  fontSize: 32, margin: '0 0 12px', color: '#831843',
};

const h3 = { fontSize: 16, fontWeight: 900, color: '#5B1735', margin: '20px 0 8px', letterSpacing: '0.04em', textTransform: 'uppercase' };

export default function GuidePage() {
  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 24px 80px', color: '#5B1735', fontFamily: '"Nunito", sans-serif' }}>
      <h1 style={{
        fontFamily: "'Pacifico', cursive", fontSize: 'clamp(48px, 7vw, 88px)',
        color: '#fff', textAlign: 'center', margin: '24px 0',
        textShadow: '0 4px 16px rgba(91,23,53,0.45)',
      }}>
        How to use Stitch &amp; Kit
      </h1>

      <div style={card}>
        <h2 style={sectionTitle}>🚀 Three-step workflow</h2>
        <ol style={{ fontSize: 15, lineHeight: 1.7, paddingLeft: 22 }}>
          <li><strong>Pick a project.</strong> Belt logo, ornament, pillow, stocking, or custom. This sets the mesh count and dimensions automatically.</li>
          <li><strong>Add your design.</strong> Upload an image <em>or</em> type a phrase.</li>
          <li><strong>Tweak &amp; export.</strong> Swap colors, edit individual stitches, then download the 3-page printable bundle.</li>
        </ol>
      </div>

      <div style={card}>
        <h2 style={sectionTitle}>🖼️ Image mode</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7 }}>Upload a PNG or JPG. Every pixel snaps to the nearest DMC thread color.</p>
        <h3 style={h3}>Controls</h3>
        <ul style={{ fontSize: 15, lineHeight: 1.7, paddingLeft: 22 }}>
          <li><strong>Color Reference</strong> — pull a palette from a second image instead of using image colors directly.</li>
          <li><strong>Snap to DMC threads</strong> — when on, every color maps to a real DMC thread number you can buy. Leave on for printable patterns.</li>
          <li><strong>Colors</strong> — how many DMC threads to use. Fewer = simpler. More = closer match.</li>
          <li><strong>Edges</strong> — Sharp for logos, Soft for photos.</li>
          <li><strong>Smoothing</strong> — cleans scattered single stitches. Higher = neater shapes but loses fine detail.</li>
        </ul>
        <h3 style={h3}>Cleanup pill</h3>
        <p style={{ fontSize: 14, lineHeight: 1.6 }}>If your pattern has more than 5 isolated "loner" stitches, a pink <strong>✨ N scattered — clean up</strong> pill appears under the design. Click it to merge those stitches into their dominant neighbor's color. Use <strong>Undo</strong> in Edit mode if you don't like the result.</p>
      </div>

      <div style={card}>
        <h2 style={sectionTitle}>💬 Phrase mode</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7 }}>Type your text, pick a font + border + colors. Works on any project shape.</p>
        <h3 style={h3}>Fonts</h3>
        <ul style={{ fontSize: 15, lineHeight: 1.7, paddingLeft: 22 }}>
          <li><strong>Chunky Block</strong> — big bold pixel blocks (Furbish style). Default.</li>
          <li><strong>Classic Block</strong> — small crisp 5×7 cross-stitch standard.</li>
          <li><strong>Bold Serif</strong> — medium serifed pixel font.</li>
          <li><strong>Cinzel, Playfair (italic), Pacifico, Dancing Script, Lobster, Bebas Neue, Marker</strong> — real web fonts rendered into stitches.</li>
        </ul>
        <h3 style={h3}>Borders</h3>
        <p style={{ fontSize: 14, lineHeight: 1.6 }}>10 styles: floral vine, hearts, scallop, gingham, dot grid, flower row, rope twist, solid, double, dashed. Use the <strong>Accent</strong> color for the flower petals / scallop bumps on decorative borders.</p>
        <h3 style={h3}>Text size</h3>
        <p style={{ fontSize: 14, lineHeight: 1.6 }}>Default 100% = auto-fit. Drag below for breathing room or above to fill more space.</p>
      </div>

      <div style={card}>
        <h2 style={sectionTitle}>🎨 Editing &amp; viewing</h2>
        <h3 style={h3}>View modes</h3>
        <ul style={{ fontSize: 15, lineHeight: 1.7, paddingLeft: 22 }}>
          <li><strong>Grid</strong> — flat colored squares with grid lines.</li>
          <li><strong>Numbered</strong> — same, with the DMC symbol inside each cell.</li>
          <li><strong>3D</strong> — preview as raised needlepoint beads on canvas.</li>
          <li><strong>Stitch</strong> — flat diagonal stitches on canvas.</li>
          <li><strong>Edit</strong> — paint/erase mode. Pick a color from the palette, drag across cells to fill.</li>
        </ul>
        <h3 style={h3}>Swap a color</h3>
        <p style={{ fontSize: 14, lineHeight: 1.6 }}>Tap any palette swatch to open the DMC picker. Search by number ("321") or name ("UGA", "Bama", "navy"). Pick a new thread — pattern updates instantly.</p>
      </div>

      <div style={card}>
        <h2 style={sectionTitle}>💾 Exporting</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7 }}>The full bundle gives you 3 letter-sized PNG pages at 150 dpi:</p>
        <ol style={{ fontSize: 15, lineHeight: 1.7, paddingLeft: 22 }}>
          <li><strong>Cover</strong> — project details + preview thumbnail.</li>
          <li><strong>Color chart + Thread list</strong> — chart with symbols inside each cell, plus a compact legend below.</li>
          <li><strong>Stitched preview</strong> — what the finished piece will look like.</li>
        </ol>
        <p style={{ fontSize: 14, lineHeight: 1.6 }}>Backgrounds are white to save printer ink. Combine into one PDF using Canva, Pages, or Acrobat.</p>
        <p style={{ fontSize: 14, lineHeight: 1.6 }}><strong>iPhone tip:</strong> after generating, scroll down to see each page as an image — long-press to save to Photos or Files. That always works even if direct download is blocked.</p>
      </div>

      <div style={card}>
        <h2 style={sectionTitle}>📚 Needlepoint glossary</h2>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          <strong>Mesh</strong> — stitches per inch on the canvas. <strong>13 mesh</strong> = chunkier, faster to stitch. <strong>18 mesh</strong> = finer detail.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          <strong>DMC</strong> — the most common embroidery floss brand. Every color has a number (e.g. <em>DMC 321 = Christmas Red</em>).
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          <strong>Stretcher Bars</strong> — wooden frames you stretch your canvas on so it doesn't warp. Sold in pairs by the inch.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          <strong>Tent stitch</strong> — the standard needlepoint stitch (one diagonal thread per mesh hole). What our 3D and Stitch previews show.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          <strong>Belt blanks</strong> — pre-cut, pre-finished canvases shaped for belts. You only stitch the small logo area; the rest stays blank.
        </p>
      </div>

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Link to="/maker" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '14px 28px', borderRadius: 999, textDecoration: 'none',
          fontFamily: '"Nunito", sans-serif', fontSize: 15, fontWeight: 800,
          background: '#fff', color: '#5B1735',
          border: '3px solid #5B1735', boxShadow: '4px 4px 0 #5B1735',
        }}>
          🪡 Try the Maker →
        </Link>
      </div>
    </div>
  );
}
