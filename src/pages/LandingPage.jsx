import { Link } from 'react-router-dom';

const card = {
  background: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(10px)',
  border: '3px solid #5B1735',
  borderRadius: 24,
  padding: 28,
  boxShadow: '5px 5px 0 #5B1735',
};

const featureItems = [
  { icon: '🖼️', title: 'Image → Pattern', body: 'Upload any photo or logo. Stitch & Kit picks the closest DMC threads and produces a printable chart.' },
  { icon: '💬', title: 'Phrase Pillows', body: 'Type a phrase, pick a font and floral border. Get a Furbish-style printable in seconds.' },
  { icon: '🪡', title: 'Real DMC matching', body: '213 popular needlepoint threads, with sports-team aliases like UGA, Bama, Auburn baked in.' },
  { icon: '🧼', title: 'Auto cleanup', body: 'One-click "remove scattered stitches" so your finished piece reads clean, not noisy.' },
  { icon: '🎨', title: 'Edit by hand', body: 'Paint or erase individual stitches. Swap any color for any of 213 DMC threads.' },
  { icon: '💾', title: 'Printable bundle', body: 'Color chart with symbols + thread list + stitched preview. All on white pages so you don\'t waste ink.' },
];

export default function LandingPage() {
  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 24px 80px', color: '#5B1735' }}>
      {/* HERO */}
      <section style={{ textAlign: 'center', marginTop: 32, marginBottom: 64 }}>
        <div style={{
          display: 'inline-block', padding: '8px 22px', background: '#fff',
          borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: '#EC4899',
          boxShadow: '0 12px 30px rgba(91,23,53,0.18)', marginBottom: 24,
        }}>
          ✨ Printable needlepoint pattern maker ✨
        </div>
        <h1 style={{
          fontFamily: "'Pacifico', cursive",
          fontSize: 'clamp(56px, 10vw, 128px)',
          margin: '12px 0 16px',
          lineHeight: 1.05,
          background: 'linear-gradient(90deg, #FFFFFF 0%, #FCD34D 25%, #FFFFFF 50%, #A7F3D0 75%, #FFFFFF 100%)',
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 6px 18px rgba(91,23,53,0.35))',
        }}>
          Stitch &amp; Kit
        </h1>
        <p style={{
          fontSize: 'clamp(16px, 2vw, 22px)', fontWeight: 700,
          color: '#fff', letterSpacing: '0.02em', maxWidth: 720, margin: '0 auto 32px',
          lineHeight: 1.45, textShadow: '0 2px 12px rgba(91,23,53,0.4)',
        }}>
          Turn any image or phrase into a printable needlepoint pattern — with real DMC thread matching,
          editable stitches, and a finished-piece preview.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/maker" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '16px 32px', borderRadius: 999, textDecoration: 'none',
            fontFamily: '"Nunito", sans-serif', fontSize: 16, fontWeight: 800,
            background: 'linear-gradient(135deg, #EC4899, #FCD34D)', color: '#fff',
            border: '3px solid #5B1735', boxShadow: '4px 4px 0 #5B1735',
            letterSpacing: '0.04em',
          }}>
            🪡 Make a Pattern →
          </Link>
          <Link to="/marketplace" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '16px 32px', borderRadius: 999, textDecoration: 'none',
            fontFamily: '"Nunito", sans-serif', fontSize: 16, fontWeight: 800,
            background: '#fff', color: '#5B1735',
            border: '3px solid #5B1735', boxShadow: '4px 4px 0 #5B1735',
            letterSpacing: '0.04em',
          }}>
            🌸 Browse Examples
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ marginBottom: 64 }}>
        <h2 style={{
          fontFamily: "'Pacifico', cursive", fontSize: 'clamp(40px, 5vw, 64px)',
          color: '#fff', textAlign: 'center', margin: '0 0 32px',
          textShadow: '0 4px 16px rgba(91,23,53,0.45)',
        }}>
          What it does
        </h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18,
        }}>
          {featureItems.map((f, i) => (
            <div key={i} style={card}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>{f.icon}</div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 900, color: '#831843' }}>{f.title}</h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#5B1735' }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ marginBottom: 64 }}>
        <h2 style={{
          fontFamily: "'Pacifico', cursive", fontSize: 'clamp(40px, 5vw, 64px)',
          color: '#fff', textAlign: 'center', margin: '0 0 32px',
          textShadow: '0 4px 16px rgba(91,23,53,0.45)',
        }}>
          How it works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
          {[
            { n: 1, title: 'Pick a project', body: 'Belt logo, ornament, pillow, stocking, or custom dimensions. Sets the mesh and size automatically.' },
            { n: 2, title: 'Add your design', body: 'Upload an image or type a phrase. Pick from 5 fonts (cursive, serif, chunky block) and 10 borders.' },
            { n: 3, title: 'Export &amp; stitch', body: 'Download a 3-page printable PDF: cover, color chart with thread list, and finished-piece preview.' },
          ].map((s) => (
            <div key={s.n} style={{ ...card, textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 52, height: 52, borderRadius: '50%',
                background: 'linear-gradient(135deg, #EC4899, #A855F7)', color: '#fff',
                fontSize: 24, fontWeight: 900, fontFamily: '"Pacifico", cursive',
                marginBottom: 14, boxShadow: '0 6px 18px rgba(236,72,153,0.35)',
              }}>
                {s.n}
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 900, color: '#831843' }}>{s.title}</h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA REPEAT */}
      <section style={{ textAlign: 'center', padding: '32px 0' }}>
        <Link to="/maker" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '18px 40px', borderRadius: 999, textDecoration: 'none',
          fontFamily: '"Nunito", sans-serif', fontSize: 18, fontWeight: 800,
          background: '#fff', color: '#5B1735',
          border: '3px solid #5B1735', boxShadow: '5px 5px 0 #5B1735',
          letterSpacing: '0.04em',
        }}>
          🎀 Start your pattern →
        </Link>
      </section>

      <footer style={{ textAlign: 'center', color: '#fff', padding: '40px 0 0', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em' }}>
        💖 Made with sparkles · stitchandkit.com 💖
      </footer>
    </div>
  );
}
