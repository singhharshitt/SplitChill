import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { isLoggedIn, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }) =>
    `relative text-sm tracking-wide transition-all duration-300
     ${isActive ? 'text-black' : 'text-gray-500'}
     hover:text-black`;

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-white/60 border-b border-black/5">

      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">

        {/* LOGO */}
        <Link to="/" className="font-serif text-2xl tracking-tight">
          SplitChill
        </Link>

        {/* NAV LINKS */}
        <div className="hidden md:flex items-center gap-10">

          {isLoggedIn ? (
            <>
              <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
              <NavLink to="/split" className={navLinkClass}>Split</NavLink>
              <NavLink to="/analytics" className={navLinkClass}>Analytics</NavLink>
              <NavLink to="/transactions" className={navLinkClass}>Transactions</NavLink>
              <NavLink to="/chat" className={navLinkClass}>Chat</NavLink>
              <NavLink to="/blog" className={navLinkClass}>Blog</NavLink>
              <NavLink to="/profile" className={navLinkClass}>Profile</NavLink>
            </>
          ) : (
            <>
              <span className="text-gray-500 hover:text-black cursor-pointer">Features</span>
              <span className="text-gray-500 hover:text-black cursor-pointer">How it Works</span>
              <NavLink to="/blog" className={navLinkClass}>Blog</NavLink>
            </>
          )}

        </div>

        {/* RIGHT SIDE */}
        <div className="hidden md:flex items-center gap-4">

          {isLoggedIn ? (
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-black transition"
            >
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-gray-500 hover:text-black transition"
              >
                Login
              </Link>

              <Link
                to="/signUp"
                className="px-5 py-2 rounded-full text-sm font-medium 
                bg-[#A3FDA7] text-black shadow-sm 
                hover:scale-105 hover:shadow-md transition-all duration-300"
              >
                Get Started
              </Link>
            </>
          )}

        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 border border-black/5 text-black"
          aria-label="Toggle navigation"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-black/5 bg-white/95 px-6 py-4">
          <div className="flex flex-col gap-4">
            {isLoggedIn ? (
              <>
                <NavLink to="/dashboard" onClick={closeMenu} className={navLinkClass}>Dashboard</NavLink>
                <NavLink to="/split" onClick={closeMenu} className={navLinkClass}>Split</NavLink>
                <NavLink to="/analytics" onClick={closeMenu} className={navLinkClass}>Analytics</NavLink>
                <NavLink to="/transactions" onClick={closeMenu} className={navLinkClass}>Transactions</NavLink>
                <NavLink to="/chat" onClick={closeMenu} className={navLinkClass}>Chat</NavLink>
                <NavLink to="/blog" onClick={closeMenu} className={navLinkClass}>Blog</NavLink>
                <NavLink to="/profile" onClick={closeMenu} className={navLinkClass}>Profile</NavLink>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="w-fit text-sm text-gray-500 hover:text-black transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/blog" onClick={closeMenu} className={navLinkClass}>Blog</NavLink>
                <Link to="/login" onClick={closeMenu} className="text-sm text-gray-500 hover:text-black transition">Login</Link>
                <Link to="/signUp" onClick={closeMenu} className="w-fit px-5 py-2 rounded-full text-sm font-medium bg-[#A3FDA7] text-black shadow-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
