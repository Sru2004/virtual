import React, { useState, useEffect } from 'react';
import {
  User,
  Edit,
  Upload,
  Save,
  X,
  Award,
  Calendar,
  Image,
  Trophy,
  Link as LinkIcon,
  Instagram,
  Facebook,
  Globe,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

const EditArtistProfile = () => {
  const { profile, artistProfile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    artist_name: '',
    bio: '',
    portfolio_link: '',
    art_style: '',
    location: '',
    social_links: {
      instagram: '',
      facebook: '',
      website: '',
    },
    years_experience: 0,
    exhibitions: 0,
    awards_won: 0,
    artworks_sold: 0,
  });

  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: '',
    medium: '',
    price: '',
    image_file: null,
    image_url: '',
    tags: '',
    size: 'medium',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (artistProfile) {
      setFormData({
        artist_name: artistProfile.artist_name || '',
        bio: artistProfile.bio || '[Artist Name] is a contemporary visual artist known for blending bold colors, emotional storytelling, and expressive forms into powerful artworks. Inspired by everyday life, culture, and human connections, their creations explore identity, movement, and imagination. With a unique style that merges traditional techniques with modern perspectives, they continue to push the boundaries of artistic expression.',
        portfolio_link: artistProfile.portfolio_link || '',
        art_style: artistProfile.art_style || '',
        location: artistProfile.location || '',
        social_links: {
          instagram: artistProfile.social_links?.instagram || '',
          facebook: artistProfile.social_links?.facebook || '',
          website: artistProfile.social_links?.website || '',
        },
        years_experience: artistProfile.years_experience || 0,
        exhibitions: artistProfile.exhibitions || 0,
        awards_won: artistProfile.awards_won || 0,
        artworks_sold: artistProfile.artworks_sold || 0,
      });
    }
  }, [artistProfile]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSocialLinkChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value,
      },
    }));
  };

  const handleUploadArtwork = async (e) => {
    e.preventDefault();

    // Ensure we have a valid artist id before calling the API
    if (!profile?.id) {
      console.error('Cannot upload artwork: missing artist id');
      return;
    }

    // Validate required fields
    if (!uploadForm.title || !uploadForm.category || !uploadForm.price) {
      alert('Please fill in all required fields (Title, Category, Price)');
      return;
    }

    if (!uploadForm.image_file && !uploadForm.image_url) {
      alert('Please provide either an image file or image URL');
      return;
    }

    setUploading(true);

    try {
      if (uploadForm.image_file) {
        // File upload
        const formData = new FormData();
        formData.append('title', uploadForm.title);
        formData.append('description', uploadForm.description || '');
        formData.append('category', uploadForm.category);
        formData.append('medium', uploadForm.medium || '');
        formData.append('price', parseFloat(uploadForm.price));
        formData.append('image', uploadForm.image_file);
        formData.append('tags', uploadForm.tags || '');
        formData.append('size', uploadForm.size);

        await api.uploadArtwork(formData);
      } else {
        // URL upload
        await api.createArtwork({
          title: uploadForm.title,
          description: uploadForm.description || '',
          category: uploadForm.category,
          medium: uploadForm.medium || '',
          price: parseFloat(uploadForm.price),
          image_url: uploadForm.image_url,
          tags: uploadForm.tags ? uploadForm.tags.split(',').map(tag => tag.trim()) : [],
          size: uploadForm.size,
        });
      }

      setShowUploadForm(false);
      setUploadForm({
        title: '',
        description: '',
        category: '',
        medium: '',
        price: '',
        image_file: null,
        image_url: '',
        tags: '',
        size: 'medium',
      });
      await refreshProfile();
      // Dispatch event to refresh dashboard
      window.dispatchEvent(new CustomEvent('artworkUploaded'));
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Error uploading artwork:', error);
      alert('Failed to upload artwork. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile?.id) {
      alert('Profile not loaded. Please try again.');
      return;
    }
    setLoading(true);
    setSuccess(false);

    try {
      await api.updateArtistProfile(profile.id, formData);
      await refreshProfile();
      setSuccess(true);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigate', { detail: 'artist-dashboard' }));
      }, 2000);
    } catch (error) {
      console.error('Error updating artist profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <Edit className="h-8 w-8 text-amber-600" />
            <h1 className="text-3xl font-bold text-gray-800">Edit Artist Profile</h1>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">Profile updated successfully!</p>
            </div>
          )}

          {uploadSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">Artwork uploaded successfully!</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Artist Name *
                  </label>
                  <input
                    type="text"
                    value={formData.artist_name}
                    onChange={(e) => handleInputChange('artist_name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Art Style
                  </label>
                  <select
                    value={formData.art_style}
                    onChange={(e) => handleInputChange('art_style', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Select Art Style</option>
                    <option value="Abstract">Abstract</option>
                    <option value="Realism">Realism</option>
                    <option value="Contemporary">Contemporary</option>
                    <option value="Impressionism">Impressionism</option>
                    <option value="Surrealism">Surrealism</option>
                    <option value="Pop Art">Pop Art</option>
                    <option value="Minimalism">Minimalism</option>
                    <option value="Expressionism">Expressionism</option>
                    <option value="Cubism">Cubism</option>
                    <option value="Street Art">Street Art</option>
                    <option value="Digital Art">Digital Art</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="City, Country"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Portfolio Link
                  </label>
                  <input
                    type="url"
                    value={formData.portfolio_link}
                    onChange={(e) => handleInputChange('portfolio_link', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="https://yourportfolio.com"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio *
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Tell us about yourself, your artistic journey, and what inspires you..."
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.bio.length}/300 characters (minimum 200)
                </p>
              </div>
            </div>

            {/* Professional Stats */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Award className="h-5 w-5" />
                Professional Statistics
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.years_experience}
                    onChange={(e) => handleInputChange('years_experience', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Exhibitions
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.exhibitions}
                    onChange={(e) => handleInputChange('exhibitions', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Awards Won
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.awards_won}
                    onChange={(e) => handleInputChange('awards_won', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Artworks Sold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.artworks_sold}
                    onChange={(e) => handleInputChange('artworks_sold', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Social Links
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={formData.social_links.instagram}
                    onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="https://instagram.com/yourusername"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={formData.social_links.facebook}
                    onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.social_links.website}
                    onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>



            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditArtistProfile;
