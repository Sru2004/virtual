import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Palette, Info, Mail, HelpCircle, LogIn, User, LogOut, ChevronDown, Edit, BarChart3, ShoppingCart, Home, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../lib/auth';

const Navbar = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      const savedCart = localStorage.getItem('cartItems');
      if (savedCart) {
        const cartItems = JSON.parse(savedCart);
        const count = Object.values(cartItems).reduce((total, qty) => total + qty, 0);
        setCartCount(count);
      } else {
        setCartCount(0);
      }
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);

    return () => {
      window.removeEventListener('storage', updateCartCount);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      setDropdownOpen(false);
      // Force page reload to clear all state
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state and reload
      localStorage.removeItem('token');
      window.location.reload();
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-amber-50 via-white to-rose-50 shadow-md border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            to="/"
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Palette className="h-8 w-8 text-amber-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
              Virtual Art
            </span>
          </Link>



          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-1 text-gray-700 hover:text-amber-600 transition-colors"
            >
              <Home className="h-5 w-5" />
              <span className="hidden sm:inline">Home</span>
            </Link>

            {location.pathname === "/" && (
              <Link
                to="/about"
                className="flex items-center gap-1 text-gray-700 hover:text-amber-600 transition-colors"
              >
                <Info className="h-5 w-5" />
                <span className="hidden sm:inline">About</span>
              </Link>
            )}

            {profile?.user_type === 'user' && location.pathname !== "/" && (
              <>
                <Link
                  to="/user/dashboard"
                  className="flex items-center gap-1 text-gray-700 hover:text-amber-600 transition-colors"
                >
                  <Palette className="h-5 w-5" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>

                <Link
                  to="/search"
                  className="flex items-center gap-1 text-gray-700 hover:text-amber-600 transition-colors"
                >
                  <Search className="h-5 w-5" />
                  <span className="hidden sm:inline">Search</span>
                </Link>
              </>
            )}

            <Link
              to="/contact"
              className="flex items-center gap-1 text-gray-700 hover:text-amber-600 transition-colors"
            >
              <Mail className="h-5 w-5" />
              <span className="hidden sm:inline">Contact</span>
            </Link>

            {user ? (
              <div className="flex items-center gap-4">
                {profile?.user_type === 'user' && (
                  <Link
                    to="/cart"
                    className="relative flex items-center gap-2 p-2 text-gray-700 hover:text-amber-600 transition-colors"
                  >
                    <ShoppingCart className="h-6 w-6" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}

                <Link
                  to={profile?.user_type === 'artist' ? '/artist/profile' : '/user/profile'}
                  className="flex items-center gap-2 p-2 text-gray-700 hover:text-amber-600 transition-colors"
                >
                  <User className="h-6 w-6" />
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-full hover:shadow-lg transition-shadow"
                  >
                    {profile?.profile_picture ? (
                      <img
                        src={profile.profile_picture}
                        alt="Avatar"
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                    <span>{profile?.full_name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      to={
                        profile?.user_type === 'artist' ? '/artist/dashboard' :
                        profile?.user_type === 'admin' ? '/admin/dashboard' :
                        '/user/dashboard'
                      }
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <BarChart3 className="h-4 w-4" />
                      Dashboard
                    </Link>
                    {profile?.user_type === 'user' && (
                      <Link
                        to="/my-orders"
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        My Orders
                      </Link>
                    )}
                    <Link
                      to={profile?.user_type === 'artist' ? '/artist/profile' : '/user/profile'}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      View Profile
                    </Link>
                    <Link
                      to={profile?.user_type === 'artist' ? '/artist/profile/edit' : '/user/profile'}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </Link>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-full hover:shadow-lg transition-shadow"
              >
                <LogIn className="h-5 w-5" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
