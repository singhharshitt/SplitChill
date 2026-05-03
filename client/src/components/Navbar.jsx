import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { isLoggedIn, logout } = useAuth();

  const navLinkClass = ({ isActive }) =>
    `relative text-sm tracking-wide transition-all duration-300
     ${isActive ? 'text-black' : 'text-gray-500'}
     hover:text-black`;

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
              <NavLink to="/profile" className={navLinkClass}>Profile</NavLink>
            </>
          ) : (
            <>
              <span className="text-gray-500 hover:text-black cursor-pointer">Features</span>
              <span className="text-gray-500 hover:text-black cursor-pointer">How it Works</span>
              <span className="text-gray-500 hover:text-black cursor-pointer">Pricing</span>
            </>
          )}

        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">

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

      </div>
    </div>
  );
}