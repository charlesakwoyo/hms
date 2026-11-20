import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, LogIn, Shield, Check, AlertCircle } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { UserRole } from '../types';

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  phone?: string;
  mustChangePassword: boolean;
}

interface LoginPageProps {
  onLogin: (user: SessionUser) => void;

  pendingUser?: SessionUser | null;
  notice?: string;
}

async function authCall(action: 'login' | 'change-password', body: Record<string, string>): Promise<any> {
  try {
    if (action === 'login') return await apiClient.login(body.username, body.password);
    return await apiClient.changePassword(body.currentPassword, body.newPassword);
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, pendingUser, notice }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [mustChange, setMustChange] = useState<SessionUser | null>(pendingUser || null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await authCall('login', { username: username.trim(), password });
      if (!data.success) {
        setErrorMessage(data.error || 'Invalid username or password.');
      } else if (data.user.mustChangePassword) {
        setMustChange(data.user);
      } else {
        setPassword('');
        onLogin(data.user);
      }
    } catch {
      setErrorMessage('Cannot reach the WiseCare server. Check the network connection, or tell the System Administrator.');
    }
    setIsLoading(false);
  };

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMessage('The two new passwords are not the same.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await authCall('change-password', { currentPassword: password, newPassword });
      if (!data.success) setErrorMessage(data.error || 'The password was not changed.');
      else {
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onLogin(data.user);
      }
    } catch {
      setErrorMessage('Cannot reach the WiseCare server. Check the network connection, or tell the System Administrator.');
    }
    setIsLoading(false);
  };

  return (
    <div
      id="login-page-container"
      className="min-h-screen bg-[#edf0f5] dark:bg-[oklch(9%_0_0)] relative flex items-center justify-center p-3 sm:p-6 font-sans text-gray-800 selection:bg-blue-500 selection:text-white"
    >
      <div className="w-full max-w-4xl bg-white rounded-[26px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row relative">
        <div className="w-full md:w-1/2 bg-[#0052a3] text-white p-7 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden select-none">
          <div className="absolute -bottom-16 -right-16 w-72 h-72 pointer-events-none z-0">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <circle cx="100" cy="100" r="70" fill="none" stroke="#93c5fd" strokeWidth="24" className="opacity-30" />
              <circle cx="100" cy="100" r="95" fill="none" stroke="#6ee7b7" strokeWidth="8" className="opacity-20" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 flex items-center justify-center">
                  <svg viewBox="0 0 32 32" className="w-9 h-9 text-[#ffffff]" fill="currentColor">
                    <path d="M16 28.5l-2.2-2C6 19.3 1 14.8 1 9.2 1 4.6 4.6 1 9.2 1c2.6 0 5.1 1.2 6.8 3.1C17.7 2.2 20.2 1 22.8 1 27.4 1 31 4.6 31 9.2c0 5.6-5 10.1-12.8 17.3l-2.2 2z" />
                    <path
                      d="M4 16h6l2-4 4 9 3-6 2 2h7"
                      fill="none"
                      stroke="#0052a3"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-extrabold tracking-tight text-white leading-none">
                    Wise<span className="font-bold">care</span>
                  </span>
                  <span className="text-[10px] font-bold tracking-[0.32em] text-white/90 mt-1 uppercase">HMIS</span>
                </div>
              </div>

              <div className="bg-white rounded-lg px-2.5 py-1.5 shadow-sm flex items-center shrink-0" title="Mwavuli 360">
                <img src="./images/mwavuli360-logo.png" alt="Mwavuli 360" className="h-9 sm:h-10 w-auto object-contain" />
              </div>
            </div>

            <div className="mt-9 space-y-2.5">
              <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-white leading-tight tracking-tight">
                Welcome to
                <br />
                WiseCare HMIS
              </h1>
              <p className="text-xs sm:text-[13px] text-blue-100/90 leading-relaxed font-normal max-w-sm pt-1">
                Integrated Hospital Management System designed to streamline healthcare operations and improve patient care.
              </p>
            </div>

            <div className="mt-7 bg-white rounded-xl p-4 sm:p-5 shadow-md flex items-center justify-center max-w-sm border border-white/90">
              <img src="./images/sha-logo.png" alt="Social Health Authority (SHA)" className="w-full max-w-[330px] h-auto object-contain" />
            </div>

            <div className="mt-6 space-y-2.5">
              <div className="flex items-center space-x-2.5">
                <span className="w-4 h-4 rounded-full bg-white text-blue-700 flex items-center justify-center shrink-0 shadow-sm">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span className="text-xs sm:text-[13px] font-medium text-white">SHA intergrated Through</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <span className="w-4 h-4 rounded-full bg-white text-blue-700 flex items-center justify-center shrink-0 shadow-sm">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span className="text-xs sm:text-[13px] font-medium text-white">Mwavuli360.</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <span className="w-4 h-4 rounded-full bg-white text-blue-700 flex items-center justify-center shrink-0 shadow-sm">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span className="text-xs sm:text-[13px] font-medium text-white">Digital Health Authority.</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4" />
        </div>

        <div className="w-full md:w-1/2 bg-white p-7 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div>
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 text-[#005bb5] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-11 h-11" fill="currentColor">
                  <path d="M12 1L3.5 4.8v6.7c0 5.4 3.6 10.5 8.5 11.5 4.9-1 8.5-6.1 8.5-11.5V4.8L12 1z" />

                  <circle cx="12" cy="9.5" r="2.2" fill="#ffffff" />
                  <polygon points="10.8,10.5 13.2,10.5 13.8,14.5 10.2,14.5" fill="#ffffff" />
                </svg>
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-[#0f294a] tracking-tight">Sign In</h2>
              <p className="text-xs sm:text-[13px] text-gray-500 mt-1 font-normal">Access your WiseCare HMIS account</p>
            </div>

            {notice && !errorMessage && (
              <div className="mb-4 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs">{notice}</div>
            )}
            {errorMessage && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {mustChange ? (
              <form onSubmit={handleChange} className="space-y-4 text-left">
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  Welcome, <b>{mustChange.name}</b>. Choose your own password before continuing: at least 4 characters (4 digits are
                  enough), not containing your name or username.
                </div>
                {!password && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Current password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#005bb5]"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">New password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#005bb5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Repeat the new password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#005bb5]"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} /> Show passwords
                </label>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-2.5 px-4 bg-[#005bb5] hover:bg-[#004e9c] text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm cursor-pointer disabled:opacity-75"
                >
                  {isLoading ? 'Saving…' : 'Save new password and continue'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <User className="w-4 h-4 text-blue-400/80" />
                    </div>
                    <input
                      id="login-username-input"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#005bb5] transition shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4 text-blue-400/80" />
                    </div>
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#005bb5] transition shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="login-submit-button"
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-2.5 px-4 bg-[#005bb5] hover:bg-[#004e9c] active:bg-[#004080] text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-75"
                >
                  {isLoading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-1" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-4 py-2 px-3 bg-[#f3f6fa] dark:bg-[oklch(19%_0_0)] rounded-lg flex items-center justify-center space-x-1.5 text-gray-500 text-[11px]">
              <Shield className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>Your session is protected by secure authentication.</span>
            </div>

            <div className="mt-5 flex flex-col items-center justify-center">
              <div className="flex items-center space-x-1.5">
                <svg viewBox="0 0 160 50" className="h-10 w-auto">
                  <path
                    d="M10 5 L35 5 C48 5 56 14 56 25 C56 36 48 45 35 45 L10 45 Z M24 16 L24 34 L33 34 C40 34 44 30 44 25 C44 20 40 16 33 16 Z"
                    fill="#0ea5e9"
                  />

                  <path d="M20 21 C28 21 38 23 46 29 C42 35 34 38 26 38 Z" fill="#0284c7" />

                  <path d="M60 5 L74 5 L74 20 L94 20 L94 5 L108 5 L108 45 L94 45 L94 30 L74 30 L74 45 L60 45 Z" fill="#0f172a" />

                  <path d="M125 5 L143 5 L158 45 L144 45 L140 33 L128 33 L124 45 L110 45 Z M130 23 L138 23 L134 11 Z" fill="#0f172a" />
                </svg>
              </div>
              <span className="text-[10px] font-black tracking-widest text-[#0f172a] mt-0.5">DIGITAL HEALTH AGENCY</span>
            </div>
          </div>

          <div className="mt-6 pt-3 text-center">
            <p className="text-[11px] font-medium text-gray-400">WiseCare HMIS | Mwavuli360</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Smart Healthcare. Connected Systems. Better Patient Care.</p>

            <div className="mt-3 pt-2 border-t border-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
};
