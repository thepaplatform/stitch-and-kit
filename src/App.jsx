import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NeedlepointDesigner from './needlepoint.jsx';
import LandingPage from './pages/LandingPage.jsx';
import GuidePage from './pages/GuidePage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import MarketplacePage from './pages/MarketplacePage.jsx';
import SiteHeader from './pages/SiteHeader.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Page><LandingPage /></Page>} />
        <Route path="/maker" element={<NeedlepointDesigner />} />
        <Route path="/guide" element={<Page><GuidePage /></Page>} />
        <Route path="/about" element={<Page><AboutPage /></Page>} />
        <Route path="/marketplace" element={<Page><MarketplacePage /></Page>} />
      </Routes>
    </BrowserRouter>
  );
}

// Wrap non-maker pages with the persistent header. Maker keeps its own
// full-screen layout untouched so nothing in the existing component changes.
function Page({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(circle at 10% 20%, #FF1A8C 0%, transparent 42%),
        radial-gradient(circle at 90% 10%, #A855F7 0%, transparent 42%),
        radial-gradient(circle at 50% 85%, #FCD34D 0%, transparent 35%),
        linear-gradient(135deg, #EC4899 0%, #C56BE0 50%, #A855F7 100%)
      `,
      backgroundAttachment: 'fixed',
      fontFamily: '"Nunito", system-ui, sans-serif',
      color: '#5B1735',
    }}>
      <SiteHeader />
      {children}
    </div>
  );
}
