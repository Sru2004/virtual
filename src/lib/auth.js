import { api } from './api.js';

export const signup = async (data) => {
  return api.register(data);
};

export const login = async (credentials) => {
  return api.login(credentials);
};

export const logout = async () => {
  return api.logout();
};

export const getCurrentUser = async () => {
  try {
    return await api.getCurrentUser();
  } catch (error) {
    return null;
  }
};

export const getCurrentProfile = async () => {
  console.log('Auth: Getting current profile');
  return getCurrentUser();
};

export const getArtistProfile = async (artistId) => {
  try {
    return await api.getArtistProfile(artistId);
  } catch (error) {
    return null;
  }
};

export const updateProfile = async (id, updates) => {
  return api.updateProfile(id, updates);
};

export const updateArtistProfile = async (id, updates) => {
  return api.updateArtistProfile(id, updates);
};
