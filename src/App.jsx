import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './components/HomePage.jsx';
import LoginSelect from './components/LoginSelect.jsx';
import ArtistAuth from './components/ArtistAuth.jsx';
import UserAuth from './components/UserAuth.jsx';
import ArtistProfileDashboard from './components/ArtistProfileDashboard.jsx';
import EditArtistProfile from './components/EditArtistProfile.jsx';
import UserProfile from './components/UserProfile.jsx';
import UserDashboard from './components/UserDashboard.jsx';
import AdminLogin from './components/AdminLogin.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import ProtectedAdminRoute from './components/ProtectedAdminRoute.jsx';
import ProtectedUserRoute from './components/ProtectedUserRoute.jsx';
import ProtectedArtistRoute from './components/ProtectedArtistRoute.jsx';
import Artists from './components/Artists.jsx';
import Artworks from './components/Artworks.jsx';
import Settings from './components/Settings.jsx';
import ArtworkDetails from './components/ArtworkDetails.jsx';
import ARView from './components/ARView.jsx';
import Cart from './components/Cart.jsx';
import AddAddress from './components/AddAddress.jsx';
import SearchPage from './components/SearchPage.jsx';
import MyOrders from './components/MyOrders.jsx';
import { AboutPage, ContactPage, HelpPage, TermsPage, PrivacyPage } from './components/StaticPages.jsx';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* User Side Routes */}
          <Route path="/" element={
            <>
              <Navbar />
              <HomePage />
              <Footer onNavigate={(page) => window.location.href = `/${page}`} />
            </>
          } />
          <Route path="/about" element={
            <>
              <Navbar />
              <AboutPage />
              <Footer onNavigate={(page) => window.location.href = `/${page}`} />
            </>
          } />
          <Route path="/contact" element={
            <>
              <Navbar />
              <ContactPage />
              <Footer onNavigate={(page) => window.location.href = `/${page}`} />
            </>
          } />
          <Route path="/help" element={
            <>
              <Navbar />
              <HelpPage />
              <Footer onNavigate={(page) => window.location.href = `/${page}`} />
            </>
          } />
          <Route path="/user/dashboard" element={
            <ProtectedUserRoute>
              <>
                <Navbar />
                <UserDashboard />
                <Footer onNavigate={(page) => window.location.href = `/${page}`} />
              </>
            </ProtectedUserRoute>
          } />
          <Route path="/artist/profile" element={
            <ProtectedArtistRoute>
              <ArtistProfileDashboard />
            </ProtectedArtistRoute>
          } />
          <Route path="/artist/dashboard" element={
            <ProtectedArtistRoute>
              <ArtistProfileDashboard />
            </ProtectedArtistRoute>
          } />
          <Route path="/artwork-details/:id" element={
            <>
              <Navbar />
              <ArtworkDetails />
              <Footer onNavigate={(page) => window.location.href = `/${page}`} />
            </>
          } />
          <Route path="/ar-preview/:id" element={<ARView />} />
          <Route path="/search" element={
            <>
              <Navbar />
              <SearchPage />
              <Footer />
            </>
          } />

          {/* Login Routes */}
          <Route path="/login" element={<LoginSelect />} />
          <Route path="/login/artist" element={<ArtistAuth />} />
          <Route path="/login/user" element={<UserAuth />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/*" element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          } />

          {/* Protected User Routes */}
          <Route path="/user/profile" element={
            <ProtectedUserRoute>
              <>
                <Navbar />
                <UserProfile />
                <Footer />
              </>
            </ProtectedUserRoute>
          } />
          <Route path="/cart" element={
            <ProtectedUserRoute>
              <>
                <Navbar />
                <Cart />
                <Footer onNavigate={(page) => window.location.href = `/${page}`} />
              </>
            </ProtectedUserRoute>
          } />
          <Route path="/add-address" element={
            <ProtectedUserRoute>
              <>
                <Navbar />
                <AddAddress />
                <Footer onNavigate={(page) => window.location.href = `/${page}`} />
              </>
            </ProtectedUserRoute>
          } />
          <Route path="/my-orders" element={
            <ProtectedUserRoute>
              <>
                <Navbar />
                <MyOrders />
                <Footer onNavigate={(page) => window.location.href = `/${page}`} />
              </>
            </ProtectedUserRoute>
          } />

          {/* Protected Artist Routes */}
          <Route path="/artist/profile/edit" element={
            <ProtectedArtistRoute>
              <>
                <Navbar />
                <EditArtistProfile />
                <Footer onNavigate={(page) => window.location.href = `/${page}`} />
              </>
            </ProtectedArtistRoute>
          } />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
