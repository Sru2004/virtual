import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const PublicArtistProfile = () => {
  const { id } = useParams();
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchArtistData();
    }
  }, [id]);

  const fetchArtistData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch artist profile
      const profile = await api.getArtistProfile(id);
      setArtistProfile(profile);

      // Fetch user data
      const userData = await api.getProfile(id);
      setUser(userData);

      // Fetch artist's artworks
      const artworksData = await api.getArtworks({ artist_id: id });
      setArtworks(artworksData || []);

    } catch (err) {
      console.error('Error fetching artist data:', err);
      setError('Failed to load artist profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading artist profile...</p>
        </div>
      </div>
    );
  }

  if (error || !artistProfile || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Artist Not Found</h1>
          <p className="text-gray-600">{error || 'The artist profile you are looking for does not exist.'}</p>
        </div>
      </div>
    );
  }

  // Prepare data for template
  const BG_IMAGE_URL = '/src/assets/img4.png';
  const ARTIST_PROFILE_IMAGE = user.profile_picture || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
  const ARTIST_NAME = artistProfile.artist_name;
  const ARTIST_TITLE = artistProfile.art_style || 'Artist';
  const ARTIST_LOCATION = artistProfile.location || 'Location not specified';
  const YEARS_EXPERIENCE = artistProfile.years_experience;
  const EXHIBITIONS = artistProfile.exhibitions;
  const AWARDS_WON = artistProfile.awards_won;
  const ARTWORKS_SOLD = artistProfile.artworks_sold;
  const ABOUT_ARTIST_TEXT = artistProfile.bio;

  // Social links mapping
  const socialLinks = artistProfile.social_links || {};
  const INSTAGRAM_LINK = socialLinks.instagram || '#';
  const FACEBOOK_LINK = socialLinks.facebook || '#';
  const WEBSITE_LINK = artistProfile.portfolio_link || '#';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* HERO SECTION */}
      <header className="relative h-72 w-full flex items-end justify-center">
        {/* Background Image */}
        <img
          src={BG_IMAGE_URL}
          alt="Artist background"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Content */}
        <div className="relative text-center text-white pb-4">
          <img
            src={ARTIST_PROFILE_IMAGE}
            alt={ARTIST_NAME}
            className="w-28 h-28 rounded-full border-4 border-white mx-auto mb-2 object-cover"
          />

          <h1 className="text-3xl font-bold">{ARTIST_NAME}</h1>
          <p className="text-sm opacity-90 mt-1">{ARTIST_TITLE}</p>

          <p className="text-sm mt-1 flex justify-center items-center gap-1">
            <i className="fa-solid fa-location-dot"></i> {ARTIST_LOCATION}
          </p>
        </div>
      </header>

      {/* STATS SECTION */}
      <section className="max-w-6xl mx-auto px-4 mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card */}
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <div className="text-purple-600 text-3xl mb-2">
            <i className="fa-solid fa-clock"></i>
          </div>
          <h2 className="text-xl font-semibold">{YEARS_EXPERIENCE}</h2>
          <p className="text-sm text-gray-500">Years Experience</p>
        </div>

        {/* Card */}
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <div className="text-purple-600 text-3xl mb-2">
            <i className="fa-solid fa-image"></i>
          </div>
          <h2 className="text-xl font-semibold">{EXHIBITIONS}</h2>
          <p className="text-sm text-gray-500">Exhibitions</p>
        </div>

        {/* Card */}
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <div className="text-purple-600 text-3xl mb-2">
            <i className="fa-solid fa-award"></i>
          </div>
          <h2 className="text-xl font-semibold">{AWARDS_WON}</h2>
          <p className="text-sm text-gray-500">Awards Won</p>
        </div>

        {/* Card */}
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <div className="text-purple-600 text-3xl mb-2">
            <i className="fa-solid fa-bag-shopping"></i>
          </div>
          <h2 className="text-xl font-semibold">{ARTWORKS_SOLD}</h2>
          <p className="text-sm text-gray-500">Artworks Sold</p>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="max-w-5xl mx-auto bg-white mt-10 p-8 rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-4">About the Artist</h2>

        <p className="text-gray-700 leading-relaxed">
          {ABOUT_ARTIST_TEXT}
        </p>

        {/* Social Buttons */}
        <div className="flex gap-4 mt-6 flex-wrap">
          {INSTAGRAM_LINK !== '#' && (
            <a href={INSTAGRAM_LINK} className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm" target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          )}

          {FACEBOOK_LINK !== '#' && (
            <a href={FACEBOOK_LINK} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm" target="_blank" rel="noopener noreferrer">
              Facebook
            </a>
          )}

          {WEBSITE_LINK !== '#' && (
            <a href={WEBSITE_LINK} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm" target="_blank" rel="noopener noreferrer">
              Visit Website
            </a>
          )}
        </div>
      </section>

      {/* ARTWORKS SECTION */}
      {artworks.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mt-10 mb-10">
          <h2 className="text-2xl font-bold mb-6 text-center">Featured Artworks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artworks.slice(0, 6).map((artwork) => (
              <div key={artwork.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="h-48 bg-gray-200">
                  <img
                    src={artwork.image_url}
                    alt={artwork.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg';
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 mb-1">{artwork.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{artwork.category}</p>
                  <p className="text-lg font-bold text-purple-600">₹{artwork.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/js/all.min.js"></script>
    </div>
  );
};

export default PublicArtistProfile;
