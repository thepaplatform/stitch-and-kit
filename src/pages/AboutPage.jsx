import { Link } from 'react-router-dom';

const card = {
  background: 'rgba(255,255,255,0.95)',
  backdropFilter: 'blur(10px)',
  border: '3px solid #5B1735',
  borderRadius: 24,
  padding: 36,
  boxShadow: '5px 5px 0 #5B1735',
  marginBottom: 20,
};

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 80px', color: '#5B1735', fontFamily: '"Nunito", sans-serif' }}>
      <h1 style={{
        fontFamily: "'Pacifico', cursive", fontSize: 'clamp(48px, 7vw, 88px)',
        color: '#fff', textAlign: 'center', margin: '24px 0',
        textShadow: '0 4px 16px rgba(91,23,53,0.45)',
      }}>
        About Stitch &amp; Kit
      </h1>

      <div style={card}>
        <p style={{ fontSize: 17, lineHeight: 1.7, margin: '0 0 14px' }}>
          <strong>Stitch &amp; Kit</strong> is a printable needlepoint pattern maker.
          Upload an image or type a phrase — get a real DMC-matched chart you can stitch
          this weekend.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.7, margin: '0 0 14px' }}>
          It's built for the way modern stitchers actually work: Furbish-style pillows,
          monogrammed belt logos, sports team ornaments, and the occasional "expensive to be me"
          ironic pillow. No bloated software, no $50 chart from Etsy — just type and stitch.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.7, margin: 0 }}>
          The tool runs entirely in your browser. Your designs never leave your device unless
          you choose to share them.
        </p>
      </div>

      <div style={card}>
        <h2 style={{ fontFamily: "'Pacifico', cursive", fontSize: 28, margin: '0 0 14px', color: '#831843' }}>
          🪡 Who made this
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.7 }}>
          Built by <strong>Savanna Perry, PA-C</strong> — a dermatology PA, founder of The PA Platform,
          and avid needlepointer. The tool started as a personal weekend project to skip the
          tedium of charting designs by hand, then turned into something worth sharing.
        </p>
      </div>

      <div style={card}>
        <h2 style={{ fontFamily: "'Pacifico', cursive", fontSize: 28, margin: '0 0 14px', color: '#831843' }}>
          💌 Get in touch
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, margin: '0 0 10px' }}>
          Found a bug? Have a feature idea? Want to commission a pattern?
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.7 }}>
          Email: <a href="mailto:hello@stitchandkit.com" style={{ color: '#EC4899', fontWeight: 700 }}>hello@stitchandkit.com</a>
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
          🪡 Make a Pattern →
        </Link>
      </div>
    </div>
  );
}
