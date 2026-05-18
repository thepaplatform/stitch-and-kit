import { Link } from 'react-router-dom';
import { encodePhrasePattern } from '../lib/shareLink.js';

// Hardcoded prototype patterns. Each card has the phrase config that
// renderPhraseToGrid will reproduce when "Open in Maker" is clicked.
// Real version will pull from Supabase once we wire that up.
const SAMPLE_PATTERNS = [
  {
    title: '"I Love That For You"',
    creator: 'Stitch & Kit',
    category: 'Sassy Pillow',
    swatch: ['#1e3a8a', '#ffffff', '#7ba428', '#ff6ec4'],
    config: {
      projectKey: 'phrase_pillow_md', widthIn: 12, heightIn: 8, mesh: 13, shape: 'rectangle',
      phraseText: 'I LOVE\nTHAT FOR\nYOU', phraseFont: 'chunky_10x14',
      phraseTextColor: '#1e3a8a', phraseBgColor: '#ffffff',
      phraseBorderStyle: 'floral_vine', phraseBorderColor: '#7ba428', phraseBorderAccentColor: '#ff6ec4',
      phraseTextScale: 100,
    },
  },
  {
    title: '"Expensive To Be Me"',
    creator: 'Stitch & Kit',
    category: 'Sassy Pillow',
    swatch: ['#c1121f', '#fff5e6', '#c1121f', '#1e3a8a'],
    config: {
      projectKey: 'phrase_pillow_md', widthIn: 12, heightIn: 8, mesh: 13, shape: 'rectangle',
      phraseText: 'expensive\nto be me', phraseFont: 'playfair_i',
      phraseTextColor: '#c1121f', phraseBgColor: '#fff5e6',
      phraseBorderStyle: 'solid', phraseBorderColor: '#c1121f', phraseBorderAccentColor: '#ff6ec4',
      phraseTextScale: 100,
    },
  },
  {
    title: '"Leave Well Enough Alone"',
    creator: 'Stitch & Kit',
    category: 'Cursive',
    swatch: ['#A855F7', '#ffffff', '#c1121f', '#FCD34D'],
    config: {
      projectKey: 'phrase_pillow_md', widthIn: 12, heightIn: 8, mesh: 13, shape: 'rectangle',
      phraseText: 'Leave well\nenough\nalone', phraseFont: 'pacifico',
      phraseTextColor: '#A855F7', phraseBgColor: '#ffffff',
      phraseBorderStyle: 'gingham', phraseBorderColor: '#c1121f', phraseBorderAccentColor: '#FCD34D',
      phraseTextScale: 100,
    },
  },
  {
    title: '"Hold On, Let Me Overthink This"',
    creator: 'Stitch & Kit',
    category: 'Cursive',
    swatch: ['#ffffff', '#1e6091', '#1e6091', '#ff6b9d'],
    config: {
      projectKey: 'pillow_sm', widthIn: 12, heightIn: 12, mesh: 13, shape: 'square',
      phraseText: 'Hold on,\nlet me\noverthink\nthis', phraseFont: 'lobster',
      phraseTextColor: '#ffffff', phraseBgColor: '#1e6091',
      phraseBorderStyle: 'floral_vine', phraseBorderColor: '#c1121f', phraseBorderAccentColor: '#ff6b9d',
      phraseTextScale: 90,
    },
  },
  {
    title: '"Am I The Drama?"',
    creator: 'Stitch & Kit',
    category: 'Sassy Pillow',
    swatch: ['#A855F7', '#ffffff', '#A855F7', '#FCD34D'],
    config: {
      projectKey: 'pillow_sm', widthIn: 12, heightIn: 12, mesh: 13, shape: 'square',
      phraseText: 'AM I\nTHE\nDRAMA?', phraseFont: 'marker',
      phraseTextColor: '#A855F7', phraseBgColor: '#ffffff',
      phraseBorderStyle: 'flower_row', phraseBorderColor: '#A855F7', phraseBorderAccentColor: '#FCD34D',
      phraseTextScale: 100,
    },
  },
  {
    title: '"Thou Shall Not Try Me"',
    creator: 'Stitch & Kit',
    category: 'Pillow',
    swatch: ['#ffffff', '#88BBD8', '#1B3A8C', '#ffffff'],
    config: {
      projectKey: 'phrase_pillow_md', widthIn: 12, heightIn: 8, mesh: 13, shape: 'rectangle',
      phraseText: 'Thou shall\nnot try me', phraseFont: 'playfair',
      phraseTextColor: '#ffffff', phraseBgColor: '#88BBD8',
      phraseBorderStyle: 'floral_vine', phraseBorderColor: '#1B3A8C', phraseBorderAccentColor: '#ffffff',
      phraseTextScale: 100,
    },
  },
  {
    title: 'Cinzel Monogram',
    creator: 'Stitch & Kit',
    category: 'Belt Logo',
    swatch: ['#1e3a8a', '#ffffff', '#7ba428', '#ff6ec4'],
    config: {
      projectKey: 'belt', widthIn: 2.5, heightIn: 1.22, mesh: 18, shape: 'rectangle',
      phraseText: 'S K', phraseFont: 'cinzel',
      phraseTextColor: '#1e3a8a', phraseBgColor: '#ffffff',
      phraseBorderStyle: 'none', phraseBorderColor: '#7ba428', phraseBorderAccentColor: '#ff6ec4',
      phraseTextScale: 100,
    },
  },
  {
    title: 'Christmas Ornament — Initial',
    creator: 'Stitch & Kit',
    category: 'Ornament',
    swatch: ['#c1121f', '#ffffff', '#2d5016', '#FCD34D'],
    config: {
      projectKey: 'ornament_round', widthIn: 3.5, heightIn: 3.5, mesh: 13, shape: 'circle',
      phraseText: 'M', phraseFont: 'cinzel',
      phraseTextColor: '#c1121f', phraseBgColor: '#ffffff',
      phraseBorderStyle: 'floral_vine', phraseBorderColor: '#2d5016', phraseBorderAccentColor: '#FCD34D',
      phraseTextScale: 100,
    },
  },
];

const cardStyle = {
  background: 'rgba(255,255,255,0.95)',
  border: '3px solid #5B1735',
  borderRadius: 20,
  padding: 18,
  boxShadow: '4px 4px 0 #5B1735',
  display: 'flex', flexDirection: 'column', gap: 10,
};

export default function MarketplacePage() {
  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 24px 80px', color: '#5B1735', fontFamily: '"Nunito", sans-serif' }}>
      <h1 style={{
        fontFamily: "'Pacifico', cursive", fontSize: 'clamp(48px, 7vw, 88px)',
        color: '#fff', textAlign: 'center', margin: '24px 0 12px',
        textShadow: '0 4px 16px rgba(91,23,53,0.45)',
      }}>
        Marketplace
      </h1>
      <p style={{
        textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: 700,
        maxWidth: 660, margin: '0 auto 28px', textShadow: '0 2px 8px rgba(91,23,53,0.35)',
      }}>
        Sample patterns to remix in the Maker. <em>Coming soon:</em> upload &amp; sell your own.
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18,
      }}>
        {SAMPLE_PATTERNS.map((pat, i) => {
          const encoded = encodePhrasePattern(pat.config);
          const link = encoded ? `/maker?d=${encoded}` : '/maker';
          return (
            <div key={i} style={cardStyle}>
              {/* Color swatches preview row */}
              <div style={{ display: 'flex', gap: 4, height: 60, borderRadius: 12, overflow: 'hidden', border: '2px solid #5B1735' }}>
                {pat.swatch.map((c, j) => (
                  <div key={j} style={{ flex: 1, background: c }} />
                ))}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: '#A855F7', textTransform: 'uppercase' }}>
                  {pat.category}
                </div>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#5B1735', lineHeight: 1.2, marginTop: 4 }}>
                  {pat.title}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#831843', marginTop: 4 }}>
                  by {pat.creator}
                </div>
              </div>
              <Link to={link} style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 14px', borderRadius: 999, textDecoration: 'none',
                fontFamily: '"Nunito", sans-serif', fontSize: 13, fontWeight: 800,
                background: 'linear-gradient(135deg, #EC4899, #A855F7)', color: '#fff',
                border: '2px solid #5B1735', boxShadow: '2px 2px 0 #5B1735',
              }}>
                🪡 Open in Maker
              </Link>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 48, padding: 24, background: 'rgba(255,255,255,0.9)', border: '3px dashed #5B1735', borderRadius: 20, textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Pacifico', cursive", fontSize: 28, color: '#831843', margin: '0 0 8px' }}>
          🌸 Upload your own — coming soon
        </h2>
        <p style={{ fontSize: 14, color: '#5B1735', maxWidth: 520, margin: '0 auto', lineHeight: 1.55 }}>
          We're building a way for stitchers to submit, browse, and (eventually) sell patterns to the
          community. Email <a href="mailto:hello@stitchandkit.com" style={{ color: '#EC4899', fontWeight: 700 }}>hello@stitchandkit.com</a> if
          you're interested in being a launch creator.
        </p>
      </div>
    </div>
  );
}
