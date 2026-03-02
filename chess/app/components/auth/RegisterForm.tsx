'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  FaEye,
  FaEyeSlash,
  FaChessKnight,
  FaUser,
  FaEnvelope,
  FaLock,
  FaGlobe,
} from 'react-icons/fa';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  country: string;
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    country: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState<string[]>([]);

  const { register, isLoading, error, clearError } = useAuth();

  // List of countries for autocomplete
  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
    'Bahrain', 'Bangladesh', 'Belarus', 'Belgium', 'Bolivia', 'Bosnia and Herzegovina', 'Brazil', 'Bulgaria',
    'Cambodia', 'Cameroon', 'Canada', 'Chile', 'China', 'Colombia', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
    'Denmark', 'Dominican Republic', 'Ecuador', 'Egypt', 'Estonia', 'Ethiopia', 'Finland', 'France',
    'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala', 'Hungary', 'Iceland', 'India', 'Indonesia', 
    'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya',
    'Kuwait', 'Latvia', 'Lebanon', 'Libya', 'Lithuania', 'Luxembourg', 'Malaysia', 'Mexico', 'Morocco',
    'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Pakistan', 'Peru', 'Philippines', 'Poland', 'Portugal',
    'Qatar', 'Romania', 'Russia', 'Saudi Arabia', 'Serbia', 'Singapore', 'Slovakia', 'Slovenia', 'South Africa', 
    'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Thailand', 'Tunisia', 
    'Turkey', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Venezuela', 'Vietnam'
  ];

  // Clear any existing errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Handle country autocomplete
    if (name === 'country') {
      if (value.length >= 2) {
        const filtered = countries.filter(country =>
          country.toLowerCase().startsWith(value.toLowerCase())
        );
        setFilteredCountries(filtered.slice(0, 5)); // Show max 5 suggestions
        setShowCountryDropdown(filtered.length > 0);
      } else {
        setShowCountryDropdown(false);
        setFilteredCountries([]);
      }
    }
    
    if (error) clearError();
  };

  // Handle country selection from dropdown
  const handleCountrySelect = (countryName: string) => {
    setFormData((prev) => ({
      ...prev,
      country: countryName,
    }));
    setShowCountryDropdown(false);
    setFilteredCountries([]);
    // Remove focus from input to prevent reopening dropdown
    const countryInput = document.getElementById('country') as HTMLInputElement;
    countryInput?.blur();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return;
    }

    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      profile: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        country: formData.country,
      },
    };

    const result = await register(userData);
    if (result.success) {
      onSuccess?.();
    }
  };

  const passwordsMatch = formData.password === formData.confirmPassword;
  const isFormValid =
    formData.username.trim() &&
    formData.email.trim() &&
    formData.password &&
    formData.confirmPassword &&
    passwordsMatch;

  return (
    <div className="flex w-full items-center gap-10 justify-center min-h-screen bg-gray-900 px-4">
      {/* Professional Header */}
      <div className="text-center w-full max-w-md mb-8">
        <div className="inline-flex items-center justify-center mb-6">
          <FaChessKnight className="w-20 h-20 text-white" />
        </div>
        <h1 className="text-6xl font-bold text-white mb-4">
          Join Chess
        </h1>
        <p className="text-gray-300 text-lg">
          Create your account to start playing
        </p>
        {error && (
          <div className="mb-6 p-4 bg-red-950/50 border-l-4 border-red-500 rounded-lg shadow-lg backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-center space-x-3">
              <div className="shrink-0">
                <div className="w-6 h-6 bg-red-900/50 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    fill="yellow"
                    className="bi bi-exclamation-triangle-fill"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-red-200 mb-1">
                  Registration Failed
                </h4>
                <p className="text-sm text-red-300 leading-relaxed">
                  {error}
                </p>
              </div>
              <button
                onClick={clearError}
                className="shrink-0 absolute top-2 right-2 cursor-pointer ml-2 text-red-400 hover:text-red-200 transition-colors duration-200"
                aria-label="Dismiss error"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Card */}
      <div className="bg-gray-800 w-1/2 px-8 py-6 rounded-xl shadow-lg border border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-300"
              >
                First Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full pl-10 pr-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-300"
              >
                Last Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full pl-10 pr-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-300"
            >
              Username *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a unique username"
                className="w-full pl-10 pr-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300"
            >
              Email *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Country */}
          <div className="space-y-2">
            <label
              htmlFor="country"
              className="block text-sm font-medium text-gray-300"
            >
              Country
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaGlobe className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                onFocus={() => {
                  if (formData.country.length >= 2) {
                    const filtered = countries.filter(country =>
                      country.toLowerCase().startsWith(formData.country.toLowerCase())
                    );
                    setFilteredCountries(filtered.slice(0, 5));
                    setShowCountryDropdown(filtered.length > 0);
                  }
                }}
                onBlur={() => {
                  // Delay hiding to allow for clicking on dropdown items
                  setTimeout(() => setShowCountryDropdown(false), 150);
                }}
                placeholder="Type your country name"
                className="w-full pl-10 pr-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
                autoComplete="country"
              />
              
              {/* Country Dropdown */}
              {showCountryDropdown && filteredCountries.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredCountries.map((country, index) => (
                    <button
                      key={index}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent input blur
                        handleCountrySelect(country);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 focus:bg-gray-700 focus:outline-none first:rounded-t-lg last:rounded-b-lg transition-colors"
                    >
                      {country}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300"
              >
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create password"
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:outline-none transition-all duration-200 ${
                    formData.confirmPassword && !passwordsMatch
                      ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                      : 'border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  required
                />
                <div
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute cursor-pointer inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-4 w-4" />
                  ) : (
                    <FaEye className="h-4 w-4" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300"
              >
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:outline-none transition-all duration-200 ${
                    formData.confirmPassword && !passwordsMatch
                      ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                      : 'border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  required
                />
                <div
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute cursor-pointer inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash className="h-4 w-4" />
                  ) : (
                    <FaEye className="h-4 w-4" />
                  )}
                </div>
              </div>
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-red-500 text-xs font-medium mt-1">
                  Passwords do not match
                </p>
              )}
            </div>
          </div>

          {/* Create Account Button */}
          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Creating account...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span className="mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="currentColor"
                    className="bi bi-person-add"
                    viewBox="0 0 16 16"
                  >
                    <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m.5-5v1h1a.5.5 0 0 1 0 1h-1v1a.5.5 0 0 1-1 0v-1h-1a.5.5 0 0 1 0-1h1v-1a.5.5 0 0 1 1 0m-2-6a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4" />
                    <path d="M8.256 14a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1z" />
                  </svg>
                </span>
                Create Account
              </div>
            )}
          </button>
        </form>
        {/* Sign In Link */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-400 cursor-pointer hover:text-blue-300 font-medium hover:underline transition-colors"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
}
