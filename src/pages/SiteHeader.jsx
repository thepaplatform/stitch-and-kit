import { Link, useLocation } from 'react-router-dom';

const navLink = (active) => ({
  padding: '8px 16px',
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: '0.04em',
  textDecoration: 'none',
  color: active ? '#5B1735' : '#fff',
  background: active ? '#fff' : 'rgba(255,255,255,0.15)',
  border: active ? '2px solid #5B1735' : '2px solid rgba(255,255,255,0.3)',
  transition: 'all 0.15s',
});

export default function SiteHeader() {
  const { pathname } = useLocation();
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 32px', maxWidth: 1240, margin: '0 auto',
      flexWrap: 'wrap', gap: 16,
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
        <span style={{
          fontFamily: "'Pacifico', cursive",
          fontSize: 'clamp(28px, 4vw, 44px)',
          background: 'linear-gradient(90deg, #FFFFFF 0%, #FCD34D 50%, #FFFFFF 100%)',
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 3px 10px rgba(91,23,53,0.35))',
        }}>
          Stitch &amp; Kit
        </span>
      </Link>
      <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link to="/maker" style={navLink(pathname === '/maker')}>🪡 Maker</Link>
        <Link to="/marketplace" style={navLink(pathname === '/marketplace')}>🌸 Marketplace</Link>
        <Link to="/guide" style={navLink(pathname === '/guide')}>📖 Guide</Link>
        <Link to="/about" style={navLink(pathname === '/about')}>💖 About</Link>
      </nav>
    </header>
  );
}
