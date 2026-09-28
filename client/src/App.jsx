import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home.jsx';
import RecipeDetail from './pages/RecipeDetail.jsx';
import History from './pages/History.jsx';

function Navbar() {
  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="container navbar-inner">
        <NavLink to="/" className="navbar-logo" aria-label="RecipeSub home">
          🍴 RecipeSub
        </NavLink>
        <ul className="navbar-links">
          <li>
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
              Search
            </NavLink>
          </li>
          <li>
            <NavLink to="/history" className={({ isActive }) => isActive ? 'active' : ''}>
              History
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recipe/:sourceId" element={<RecipeDetail />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
