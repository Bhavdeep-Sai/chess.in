'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { authApi } from '../services/api';
import showToast from '../utils/toast';

interface ProfileManagementProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  isGuest: boolean;
}

interface ProfileData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  country: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ShowPassword {
  current: boolean;
  new: boolean;
  confirm: boolean;
}

const ProfileManagement: React.FC<ProfileManagementProps> = ({ isOpen, onClose, onLogout, isGuest }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const { themeMode, setTheme } = theme;
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    country: '',
    rating: 1200,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState<ShowPassword>({
    current: false,
    new: false,
    confirm: false
  });

  const loadUserStats = useCallback(async () => {
    if (isGuest) return;
    
    try {
      setLoading(true);
      setError('');
      
      const [profileResponse, statsResponse] = await Promise.all([
        authApi.getProfile(),
        authApi.getStats()
      ]);

      if (profileResponse.data?.user) {
        const userData = profileResponse.data.user;
        setProfileData({
          username: userData.username || '',
          email: userData.email || '',
          firstName: userData.profile?.firstName || '',
          lastName: userData.profile?.lastName || '',
          country: userData.profile?.country || '',
          rating: userData.stats?.rating || 1200,
          gamesPlayed: userData.stats?.gamesPlayed || 0,
          wins: userData.stats?.gamesWon || 0,
          losses: userData.stats?.gamesLost || 0,
          draws: userData.stats?.gamesDrawn || 0
        });
      }

      if (statsResponse.data?.stats) {
        setProfileData(prev => ({
          ...prev,
          rating: statsResponse.data.stats.rating || prev.rating,
          gamesPlayed: statsResponse.data.stats.gamesPlayed || prev.gamesPlayed,
          wins: statsResponse.data.stats.gamesWon || prev.wins,
          losses: statsResponse.data.stats.gamesLost || prev.losses,
          draws: statsResponse.data.stats.gamesDrawn || prev.draws
        }));
      }
    } catch (err) {
      showToast.error('Failed to load user stats');
      setError('Failed to load user data from server');
    } finally {
      setLoading(false);
    }
  }, [isGuest]);

  useEffect(() => {
    const loadData = async () => {
      if (!isGuest && isOpen && user) {
        await loadUserStats();
      } else if (isGuest && isOpen) {
        setProfileData({
          username: 'Guest User',
          email: 'guest@temporary.com',
          firstName: '',
          lastName: '',
          country: '',
          rating: 1200,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0
        });
      }
    };
    
    loadData();
  }, [isGuest, isOpen, user, loadUserStats]);

  const handleSaveProfile = async () => {
    if (isGuest) {
      setError('Guests cannot save profile changes. Please register to save your information.');
      return;
    }
    
    if (!user) {
      setError('You must be logged in to save profile changes');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      await authApi.updateProfile({
        profile: {
          firstName: profileData.firstName.trim(),
          lastName: profileData.lastName.trim(),
          country: profileData.country.trim()
        }
      });

      setSuccessMessage('Profile updated successfully!');
      setEditMode(false);
      
      setTimeout(() => setSuccessMessage(''), 3000);
      
      await loadUserStats();
    } catch (err: any) {
      showToast.error(err.response?.data?.error || 'Failed to update profile');
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (isGuest) {
      setError('Guests cannot change password. Please register first.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setSuccessMessage('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to change password';
      showToast.error(errorMessage);
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  if (!isOpen) return null;

  const totalGames = profileData.gamesPlayed || 0;
  const winRate = totalGames > 0 ? Math.round((profileData.wins / totalGames) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-auto animate-fadeIn">
      <div className={`min-h-screen ${theme.colors.bg.primary}`}>
        
        {/* Header */}
        <div className={`sticky top-0 z-10 ${theme.colors.bg.secondary} border-b ${theme.colors.border.primary} shadow-lg`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg ${theme.colors.bg.tertiary} hover:${theme.colors.bg.quaternary} 
                    ${theme.colors.text.primary} transition-colors`}
                  aria-label="Go back"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className={`text-2xl font-bold ${theme.colors.text.primary}`}>
                  Profile & Settings
                </h1>
              </div>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 
                  rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Guest Warning */}
          {isGuest && (
            <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <svg className="w-6 h-6 text-yellow-400 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.964-1.333-3.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-yellow-400 font-semibold text-lg">Guest Mode - Limited Access</p>
                  <p className="text-yellow-300/80 mt-2">
                    Your game statistics and profile data are temporary and will not be saved permanently. 
                    Register for a free account to unlock full features and track your progress!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <p className="text-green-400 text-center">{successMessage}</p>
            </div>
          )}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <p className="text-red-400 text-center">{error}</p>
            </div>
          )}

          {/* Stats Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className={`${theme.colors.bg.secondary} border ${theme.colors.border.primary} rounded-xl p-6 text-center`}>
              <div className="text-3xl font-bold text-yellow-400 mb-2">{profileData.rating}</div>
              <div className={`text-sm ${theme.colors.text.secondary}`}>Rating</div>
            </div>
            <div className={`${theme.colors.bg.secondary} border ${theme.colors.border.primary} rounded-xl p-6 text-center`}>
              <div className="text-3xl font-bold text-blue-400 mb-2">{totalGames}</div>
              <div className={`text-sm ${theme.colors.text.secondary}`}>Games Played</div>
            </div>
            <div className={`${theme.colors.bg.secondary} border ${theme.colors.border.primary} rounded-xl p-6 text-center`}>
              <div className="text-3xl font-bold text-green-400 mb-2">{profileData.wins}</div>
              <div className={`text-sm ${theme.colors.text.secondary}`}>Wins</div>
            </div>
            <div className={`${theme.colors.bg.secondary} border ${theme.colors.border.primary} rounded-xl p-6 text-center`}>
              <div className="text-3xl font-bold text-gray-400 mb-2">{profileData.draws}</div>
              <div className={`text-sm ${theme.colors.text.secondary}`}>Draws</div>
            </div>
            <div className={`${theme.colors.bg.secondary} border ${theme.colors.border.primary} rounded-xl p-6 text-center`}>
              <div className="text-3xl font-bold text-red-400 mb-2">{profileData.losses}</div>
              <div className={`text-sm ${theme.colors.text.secondary}`}>Losses</div>
            </div>
            <div className={`${theme.colors.bg.secondary} border ${theme.colors.border.primary} rounded-xl p-6 text-center`}>
              <div className="text-3xl font-bold text-purple-400 mb-2">{winRate}%</div>
              <div className={`text-sm ${theme.colors.text.secondary}`}>Win Rate</div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column - Profile Information */}
            <div className={`${theme.colors.bg.secondary} border ${theme.colors.border.primary} rounded-xl p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${theme.colors.text.primary}`}>Profile Information</h2>
                {!isGuest && (
                  <button
                    onClick={() => {
                      setEditMode(!editMode);
                      setError('');
                      setSuccessMessage('');
                    }}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm
                      ${editMode 
                        ? 'bg-gray-600/20 hover:bg-gray-600/30 text-gray-400' 
                        : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {editMode ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      )}
                    </svg>
                    {editMode ? 'Cancel' : 'Edit Profile'}
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme.colors.text.secondary}`}>Username</label>
                  <input
                    type="text"
                    value={profileData.username}
                    disabled
                    className={`w-full px-4 py-3 rounded-lg border ${theme.colors.border.primary} ${theme.colors.bg.tertiary} 
                      ${theme.colors.text.primary} opacity-60 cursor-not-allowed`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme.colors.text.secondary}`}>Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className={`w-full px-4 py-3 rounded-lg border ${theme.colors.border.primary} ${theme.colors.bg.tertiary} 
                      ${theme.colors.text.primary} opacity-60 cursor-not-allowed`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme.colors.text.secondary}`}>First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                      disabled={!editMode || isGuest}
                      className={`w-full px-4 py-3 rounded-lg border ${theme.colors.border.primary} ${theme.colors.bg.tertiary} 
                        ${theme.colors.text.primary} transition-all duration-200
                        ${(!editMode || isGuest) ? 'opacity-60 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme.colors.text.secondary}`}>Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                      disabled={!editMode || isGuest}
                      className={`w-full px-4 py-3 rounded-lg border ${theme.colors.border.primary} ${theme.colors.bg.tertiary} 
                        ${theme.colors.text.primary} transition-all duration-200
                        ${(!editMode || isGuest) ? 'opacity-60 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme.colors.text.secondary}`}>Country</label>
                  <select
                    value={profileData.country || ''}
                    onChange={(e) => setProfileData(prev => ({ ...prev, country: e.target.value }))}
                    disabled={!editMode || isGuest}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.colors.border.primary} ${theme.colors.bg.tertiary} 
                      ${theme.colors.text.primary} transition-all duration-200
                      ${(!editMode || isGuest) ? 'opacity-60 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`}
                  >
                    <option value="">Select a country</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Spain">Spain</option>
                    <option value="Italy">Italy</option>
                    <option value="Netherlands">Netherlands</option>
                    <option value="Belgium">Belgium</option>
                    <option value="Switzerland">Switzerland</option>
                    <option value="Austria">Austria</option>
                    <option value="Sweden">Sweden</option>
                    <option value="Norway">Norway</option>
                    <option value="Denmark">Denmark</option>
                    <option value="Finland">Finland</option>
                    <option value="Poland">Poland</option>
                    <option value="Czech Republic">Czech Republic</option>
                    <option value="Portugal">Portugal</option>
                    <option value="Greece">Greece</option>
                    <option value="Ireland">Ireland</option>
                    <option value="Russia">Russia</option>
                    <option value="Ukraine">Ukraine</option>
                    <option value="Turkey">Turkey</option>
                    <option value="India">India</option>
                    <option value="China">China</option>
                    <option value="Japan">Japan</option>
                    <option value="South Korea">South Korea</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Malaysia">Malaysia</option>
                    <option value="Indonesia">Indonesia</option>
                    <option value="Thailand">Thailand</option>
                    <option value="Philippines">Philippines</option>
                    <option value="Vietnam">Vietnam</option>
                    <option value="Pakistan">Pakistan</option>
                    <option value="Bangladesh">Bangladesh</option>
                    <option value="Brazil">Brazil</option>
                    <option value="Mexico">Mexico</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Chile">Chile</option>
                    <option value="Colombia">Colombia</option>
                    <option value="Peru">Peru</option>
                    <option value="South Africa">South Africa</option>
                    <option value="Egypt">Egypt</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Kenya">Kenya</option>
                    <option value="New Zealand">New Zealand</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {editMode && !isGuest && (
                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg 
                      transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Right Column - Settings & Security */}
            <div className="space-y-8">
              
              {/* Theme Settings */}
              <div className={`${theme.colors.bg.secondary} border ${theme.colors.border.primary} rounded-xl p-6`}>
                <h2 className={`text-xl font-bold ${theme.colors.text.primary} mb-6`}>Appearance</h2>
                <div className="space-y-4">
                  <label className={`block text-sm font-medium ${theme.colors.text.secondary}`}>Theme Mode</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: 'Light' },
                      { value: 'dark', label: 'Dark' },
                      { value: 'auto', label: 'Device' }
                    ].map((mode) => (
                      <button
                        key={mode.value}
                        onClick={() => setTheme(mode.value as 'light' | 'dark' | 'auto')}
                        className={`px-4 py-3 rounded-lg border-2 transition-all duration-200
                          ${themeMode === mode.value 
                            ? 'border-blue-500 bg-blue-500/20 text-blue-400' 
                            : `border-transparent ${theme.colors.bg.tertiary} ${theme.colors.text.secondary} hover:${theme.colors.bg.quaternary}`
                          }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Password Change */}
              {!isGuest && (
                <div className={`${theme.colors.bg.secondary} border ${theme.colors.border.primary} rounded-xl p-6`}>
                  <h2 className={`text-xl font-bold ${theme.colors.text.primary} mb-6`}>Change Password</h2>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${theme.colors.text.secondary}`}>Current Password</label>
                      <div className="relative">
                        <input
                          type={showPassword.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className={`w-full px-4 py-3 pr-12 rounded-lg border ${theme.colors.border.primary} ${theme.colors.bg.tertiary} 
                            ${theme.colors.text.primary} focus:ring-2 focus:ring-blue-500`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.colors.text.secondary} hover:${theme.colors.text.primary} transition-colors`}
                        >
                          {showPassword.current ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${theme.colors.text.secondary}`}>New Password</label>
                      <div className="relative">
                        <input
                          type={showPassword.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className={`w-full px-4 py-3 pr-12 rounded-lg border ${theme.colors.border.primary} ${theme.colors.bg.tertiary} 
                            ${theme.colors.text.primary} focus:ring-2 focus:ring-blue-500`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.colors.text.secondary} hover:${theme.colors.text.primary} transition-colors`}
                        >
                          {showPassword.new ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${theme.colors.text.secondary}`}>Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showPassword.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className={`w-full px-4 py-3 pr-12 rounded-lg border ${theme.colors.border.primary} ${theme.colors.bg.tertiary} 
                            ${theme.colors.text.primary} focus:ring-2 focus:ring-blue-500`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.colors.text.secondary} hover:${theme.colors.text.primary} transition-colors`}
                        >
                          {showPassword.confirm ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleChangePassword}
                      disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg 
                        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Changing...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Update Password
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Account Info */}
              <div className={`${theme.colors.bg.secondary} border ${theme.colors.border.primary} rounded-xl p-6`}>
                <h2 className={`text-xl font-bold ${theme.colors.text.primary} mb-6`}>Account Status</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={theme.colors.text.secondary}>Account Type</span>
                    <span className={`font-semibold ${isGuest ? 'text-yellow-400' : 'text-green-400'}`}>
                      {isGuest ? 'Guest' : 'Registered'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={theme.colors.text.secondary}>Status</span>
                    <span className="flex items-center gap-2 text-green-400">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Online
                    </span>
                  </div>
                  {!isGuest && (
                    <div className="flex justify-between items-center">
                      <span className={theme.colors.text.secondary}>Logged in as</span>
                      <span className={theme.colors.text.primary}>{profileData.username}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;
