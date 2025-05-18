import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const AuthContext = createContext();

// Create an axios instance with interceptors for token refresh
const api = axios.create({
  baseURL: API_URL
});

// Add response interceptor for handling token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const res = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken
        });
        
        // Save the new access token
        const { accessToken } = res.data;
        localStorage.setItem('token', accessToken);
        
        // Update axios headers
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log out the user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if (token && userId) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await api.get(`/users/me`);
          setUser(res.data);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        // Only clear token if it's an auth error
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
          delete api.defaults.headers.common['Authorization'];
        }
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      const { accessToken, refreshToken, user } = res.data;
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', user.id);
      
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      setUser(user);
      return user;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const res = await axios.post(`${API_URL}/users`, userData);
      return res.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  
  const logout = async () => {
    try {
      // Call logout endpoint if your API has one
      const token = localStorage.getItem('token');
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear local storage and state regardless of API call success
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setError(null);
      const res = await axios.post(`${API_URL}/users/forgot-password`, { email });
      return res.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to process password reset';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      setError(null);
      const res = await axios.post(`${API_URL}/users/reset-password`, { 
        token, 
        newPassword 
      });
      return res.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to reset password';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateProfile = async (userData) => {
    try {
      setError(null);
      const res = await api.put(`/users/${user.id}`, userData);
      setUser({...user, ...res.data});
      return res.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      register, 
      logout,
      forgotPassword,
      resetPassword,
      updateProfile,
      setError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Export the API instance for use in other parts of the app
export const useApi = () => {
  const token = localStorage.getItem('token');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  return api;
};
