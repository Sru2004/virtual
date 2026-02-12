

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    console.log('API: Setting token:', token ? '***' : 'null');
    this.token = token;
  }

  clearToken() {
    console.log('API: Clearing token');
    this.token = null;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      cache: 'no-cache',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register(data) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(response.token);
    return response;
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(response.token);
    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Profile endpoints
  async getProfiles() {
    return this.request('/profiles');
  }

  async getAllUsers() {
    return this.request('/profiles');
  }

  async getProfile(id) {
    return this.request(`/profiles/${id}`);
  }

  async updateProfile(id, updates) {
    return this.request(`/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProfile(id) {
    return this.request(`/profiles/${id}`, {
      method: 'DELETE',
    });
  }

  // Artist profile endpoints
  async getArtistProfiles() {
    return this.request('/artist-profiles');
  }

  async getArtistProfile(id) {
    return this.request(`/artist-profiles/${id}`);
  }

  async getArtistProfileByUserId(userId) {
    return this.request(`/artist-profiles/user/${userId}`);
  }

  async createArtistProfile(data) {
    return this.request('/artist-profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateArtistProfile(id, updates) {
    return this.request(`/artist-profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteArtistProfile(id) {
    return this.request(`/artist-profiles/${id}`, {
      method: 'DELETE',
    });
  }

  // Artwork endpoints
  async getArtworks(params) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/artworks${query}`);
  }

  async getArtwork(id) {
    return this.request(`/artworks/${id}`);
  }

  async getMyArtworks() {
    return this.request('/artworks/my-artworks');
  }

  async getAllArtworks() {
    return this.request('/artworks');
  }

  async createArtwork(data) {
    return this.request('/artworks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadArtwork(formData) {
    const url = `${API_BASE_URL}/artworks/upload`;
    const headers = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async updateArtwork(id, updates) {
    return this.request(`/artworks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteArtwork(id) {
    return this.request(`/artworks/${id}`, {
      method: 'DELETE',
    });
  }

  // Order endpoints
  async getOrders() {
    const response = await this.request('/orders');
    return response;
  }

  async getAllOrders() {
    return this.request('/orders');
  }

  async createOrder(data) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Review endpoints
  async getReviewsForArtwork(artworkId) {
    return this.request(`/reviews/artwork/${artworkId}`);
  }

  async getAllReviews() {
    return this.request('/reviews');
  }

  async createReview(data) {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Wishlist endpoints
  async getWishlist() {
    return this.request('/wishlist');
  }

  async addToWishlist(artworkId) {
    return this.request('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ artwork_id: artworkId }),
    });
  }

  async removeFromWishlist(artworkId) {
    return this.request(`/wishlist/${artworkId}`, {
      method: 'DELETE',
    });
  }

  async checkWishlist(artworkId) {
    return this.request(`/wishlist/check/${artworkId}`);
  }

  // Address endpoints
  async createAddress(addressData) {
    return this.request('/address/add', {
      method: 'POST',
      body: JSON.stringify(addressData),
    });
  }

  async getAddresses() {
    return this.request('/address/get');
  }

  // Admin endpoints
  async getAllUsersAdmin() {
    return this.request('/admin/users');
  }

  async getAllArtworksAdmin() {
    return this.request('/admin/artworks');
  }

  async getAllOrdersAdmin() {
    return this.request('/admin/orders');
  }

  async getAllReviewsAdmin() {
    return this.request('/admin/reviews');
  }
}

export const api = new ApiClient();

// Type definitions for TypeScript support
export class User {
  constructor(data = {}) {
    this.id = data.id || '';
    this.email = data.email || '';
    this.full_name = data.full_name || '';
    this.phone = data.phone || '';
    this.address = data.address || '';
    this.user_type = data.user_type || 'user';
    this.created_at = data.created_at || '';
    this.updated_at = data.updated_at || '';
  }
}

export class ArtistProfile {
  constructor(data = {}) {
    this.id = data.id || '';
    this.user_id = data.user_id || '';
    this.bio = data.bio || '';
    this.specialization = data.specialization || '';
    this.portfolio_url = data.portfolio_url || '';
    this.social_links = data.social_links || {};
    this.profile_picture = data.profile_picture || '';
    this.created_at = data.created_at || '';
    this.updated_at = data.updated_at || '';
  }
}

export class Artwork {
  constructor(data = {}) {
    this.id = data.id || '';
    this.title = data.title || '';
    this.description = data.description || '';
    this.category = data.category || '';
    this.price = data.price || 0;
    this.image_url = data.image_url || '';
    this.artist_id = data.artist_id || '';
    this.status = data.status || 'available';
    this.created_at = data.created_at || '';
    this.updated_at = data.updated_at || '';
  }
}

export class Order {
  constructor(data = {}) {
    this.id = data.id || '';
    this.user_id = data.user_id || '';
    this.artwork_id = data.artwork_id || '';
    this.quantity = data.quantity || 1;
    this.total_amount = data.total_amount || 0;
    this.status = data.status || 'pending';
    this.shipping_address = data.shipping_address || '';
    this.created_at = data.created_at || '';
    this.updated_at = data.updated_at || '';
  }
}

export class Review {
  constructor(data = {}) {
    this.id = data.id || '';
    this.user_id = data.user_id || '';
    this.artwork_id = data.artwork_id || '';
    this.rating = data.rating || 5;
    this.comment = data.comment || '';
    this.created_at = data.created_at || '';
    this.updated_at = data.updated_at || '';
  }
}

export class WishlistItem {
  constructor(data = {}) {
    this.id = data.id || '';
    this.user_id = data.user_id || '';
    this.artwork_id = data.artwork_id || '';
    this.created_at = data.created_at || '';
  }
}
