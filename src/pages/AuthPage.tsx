import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { BorrowBoxUserProfile, IndianCity } from '../types/marketplace';
import { ALL_CITIES, validateAuthInput } from '../utils/rentalLogic';
import {
  INDIA_STATES_AND_UTS,
  getStateForCity,
  getLocalitiesForCity,
} from '../data/indiaLocations';
import {
  ConfirmationResult,
  FIREBASE_PROJECT_ID,
  registerWithEmailAndProfile,
  sendPasswordReset,
  sendPhoneOtp,
  setupPhoneRecaptcha,
  signInWithEmail,
  verifyPhoneOtpAndLogin,
} from '../services/firebase';
import {
  supabase,
  signInWithGoogleOAuth,
  signUpWithSupabase,
  signInWithSupabase,
} from '../services/supabase';
import { PageRoute } from '../components/Navbar';
import { BorrowBoxLogo } from '../components/BorrowBoxLogo';

interface AuthPageProps {
  mode: 'login' | 'signup';
  onSwitchMode: (newMode: 'login' | 'signup') => void;
  onAuthenticated: (profile: BorrowBoxUserProfile) => void;
  onNavigate: (route: PageRoute) => void;
  redirectReason?: string | null;
}

function formatFirebaseAuthError(error: unknown): {
  message: string;
  needsEmailProviderEnable: boolean;
  needsDomainAuthGuide: boolean;
} {
  const raw = error instanceof Error ? error.message : String(error);
  if (
    raw.includes('invalid_client') ||
    raw.includes('OAuth client was not found')
  ) {
    return {
      message:
        'Google OAuth Setup: In your Supabase Dashboard under Authentication -> Providers -> Google, check your Client ID. Remove the extra ".com" at the end if it has duplicate ".com.com".',
      needsEmailProviderEnable: false,
      needsDomainAuthGuide: false,
    };
  }
  if (raw.includes('auth/operation-not-allowed')) {
    return {
      message:
        'This sign-in method is not yet enabled in your Firebase Console for this project.',
      needsEmailProviderEnable: true,
      needsDomainAuthGuide: false,
    };
  }
  if (
    raw.includes('auth/invalid-credential') ||
    raw.includes('auth/wrong-password')
  ) {
    return {
      message:
        'Incorrect email or password. Please verify your credentials or reset your password.',
      needsEmailProviderEnable: false,
      needsDomainAuthGuide: false,
    };
  }
  if (raw.includes('auth/user-not-found')) {
    return {
      message:
        'No account found with this email. Please switch to "Create an account" below.',
      needsEmailProviderEnable: false,
      needsDomainAuthGuide: false,
    };
  }
  if (raw.includes('auth/email-already-in-use')) {
    return {
      message:
        'An account with this email already exists. Please log in with your password.',
      needsEmailProviderEnable: false,
      needsDomainAuthGuide: false,
    };
  }
  if (raw.includes('auth/popup-closed-by-user')) {
    return {
      message:
        'Google Sign-In popup was closed before completing authentication.',
      needsEmailProviderEnable: false,
      needsDomainAuthGuide: false,
    };
  }
  if (raw.includes('auth/too-many-requests')) {
    return {
      message:
        'Too many attempts. Please wait a moment before trying again.',
      needsEmailProviderEnable: false,
      needsDomainAuthGuide: false,
    };
  }
  if (raw.includes('auth/invalid-phone-number')) {
    return {
      message:
        'Invalid phone number format. Please enter a valid 10-digit mobile number with country code.',
      needsEmailProviderEnable: false,
      needsDomainAuthGuide: false,
    };
  }
  if (raw.includes('auth/quota-exceeded')) {
    return {
      message:
        'SMS quota exceeded for today. Please sign in with Google or Email & Password.',
      needsEmailProviderEnable: false,
      needsDomainAuthGuide: false,
    };
  }
  if (raw.includes('auth/code-expired')) {
    return {
      message:
        'The SMS verification code has expired. Please request a new code.',
      needsEmailProviderEnable: false,
      needsDomainAuthGuide: false,
    };
  }
  if (
    raw.includes('auth/invalid-verification-code') ||
    raw.includes('auth/session-expired')
  ) {
    return {
      message:
        'Invalid verification code. Please check the 6-digit OTP code received on your phone.',
      needsEmailProviderEnable: false,
      needsDomainAuthGuide: false,
    };
  }
  if (raw.includes('auth/captcha-check-failed')) {
    return {
      message:
        'reCAPTCHA verification failed or was cancelled. Please try again.',
      needsEmailProviderEnable: false,
      needsDomainAuthGuide: false,
    };
  }
  return {
    message: raw.replace(/^Firebase:\s*Error\s*\((.*?)\)\.?$/, '$1'),
    needsEmailProviderEnable: false,
    needsDomainAuthGuide: false,
  };
}

const COUNTRY_CODES = [
  { code: '+91', label: 'India (+91)' },
  { code: '+1', label: 'United States (+1)' },
  { code: '+44', label: 'United Kingdom (+44)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+1-CA', label: 'Canada (+1)' },
];

export const AuthPage: React.FC<AuthPageProps> = ({
  mode,
  onSwitchMode,
  onAuthenticated,
  onNavigate,
  redirectReason,
}) => {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [viewMode, setViewMode] = useState<'login' | 'signup' | 'reset'>(mode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedState, setSelectedState] = useState<string>('Karnataka');
  const [city, setCity] = useState<IndianCity | ''>('Bengaluru');
  const [neighborhood, setNeighborhood] = useState('Indiranagar');
  const [photoURL, setPhotoURL] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Phone OTP specific state
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneOtpNumber, setPhoneOtpNumber] = useState('');
  const [phoneOtpName, setPhoneOtpName] = useState('');
  const [phoneOtpStep, setPhoneOtpStep] = useState<'request' | 'verify'>('request');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const availableCities = useMemo(() => {
    if (!selectedState) return ALL_CITIES;
    const st = INDIA_STATES_AND_UTS.find((s) => s.name === selectedState);
    return st ? st.cities : ALL_CITIES;
  }, [selectedState]);

  const localitySuggestions = useMemo(() => {
    return city ? getLocalitiesForCity(city) : [];
  }, [city]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showEmailProviderGuide, setShowEmailProviderGuide] = useState(false);
  const [showDomainAuthGuide, setShowDomainAuthGuide] = useState(false);

  useEffect(() => {
    setViewMode(mode);
    setErrors({});
    setAuthError(null);
    setStatusMessage(null);
    setShowDomainAuthGuide(false);
    setShowEmailProviderGuide(false);
  }, [mode]);

  // Resend OTP countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setStatusMessage(null);
    setShowEmailProviderGuide(false);
    setShowDomainAuthGuide(false);

    if (viewMode === 'reset') {
      const emailTrimmed = email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
        setErrors({ email: 'Enter your registered email address.' });
        return;
      }
      setErrors({});
      setIsLoading(true);
      try {
        await sendPasswordReset(emailTrimmed);
        setStatusMessage(
          `Password reset instructions have been sent to ${emailTrimmed} if an account exists.`
        );
      } catch (err) {
        const formatted = formatFirebaseAuthError(err);
        setAuthError(formatted.message);
        setShowEmailProviderGuide(formatted.needsEmailProviderEnable);
        setShowDomainAuthGuide(formatted.needsDomainAuthGuide);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const validation = validateAuthInput(viewMode, {
      fullName,
      email,
      phone,
      city,
      neighborhood,
      photoURL,
      password,
    });

    const formErrors: Record<string, string> = { ...validation.errors };

    if (viewMode === 'signup') {
      if (!confirmPassword) {
        formErrors.confirmPassword = 'Confirm your password.';
      } else if (password !== confirmPassword) {
        formErrors.confirmPassword = 'Passwords do not match.';
      }
      if (!acceptedTerms) {
        formErrors.terms = 'You must agree to the Terms of Service & Privacy Policy.';
      }
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);
    try {
      if (viewMode === 'signup') {
        const profile = await signUpWithSupabase({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          city,
          neighborhood: neighborhood.trim() || 'Indiranagar',
          photoURL: photoURL.trim(),
        });
        setStatusMessage('Account registered successfully! Redirecting...');
        onAuthenticated(profile);
      } else {
        const profile = await signInWithSupabase(email.trim(), password);
        setStatusMessage('Signed in successfully! Redirecting...');
        onAuthenticated(profile);
      }
    } catch (err) {
      const formatted = formatFirebaseAuthError(err);
      setAuthError(formatted.message);
      setShowEmailProviderGuide(formatted.needsEmailProviderEnable);
      setShowDomainAuthGuide(formatted.needsDomainAuthGuide);
    } finally {
      setIsLoading(false);
    }
  };

  // Detect returning OAuth hash errors or callbacks on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash || '';
    const search = window.location.search || '';

    const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
    const searchParams = new URLSearchParams(search);

    const errorDesc =
      hashParams.get('error_description') ||
      searchParams.get('error_description') ||
      hashParams.get('error') ||
      searchParams.get('error');

    if (errorDesc) {
      const decoded = decodeURIComponent(errorDesc.replace(/\+/g, ' '));
      if (
        decoded.includes('invalid_client') ||
        decoded.includes('OAuth client was not found')
      ) {
        setAuthError(
          'Google OAuth Setup: In your Supabase Dashboard under Authentication -> Providers -> Google, check your Client ID. Remove the extra ".com" at the end if it has duplicate ".com.com".'
        );
      } else {
        setAuthError(decoded);
      }
    } else if (hashParams.get('access_token')) {
      setStatusMessage('Signed in with Google! Preparing your BorrowBox dashboard...');
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setStatusMessage(null);
    setShowEmailProviderGuide(false);
    setShowDomainAuthGuide(false);
    setIsGoogleLoading(true);
    try {
      const redirectUri =
        typeof window !== 'undefined' ? window.location.origin : undefined;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      const formatted = formatFirebaseAuthError(err);
      setAuthError(formatted.message);
      setShowDomainAuthGuide(formatted.needsDomainAuthGuide);
      setShowEmailProviderGuide(formatted.needsEmailProviderEnable);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setStatusMessage(null);
    setShowDomainAuthGuide(false);
    const cleaned = phoneOtpNumber.replace(/[\s-]/g, '');
    if (!/^[5-9]\d{9}$/.test(cleaned)) {
      setErrors({ phoneOtp: 'Please enter a valid 10-digit mobile number.' });
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      const fullPhone = `${countryCode.replace('-CA', '')}${cleaned}`;
      const appVerifier = setupPhoneRecaptcha('phone-recaptcha-container');
      const confirmation = await sendPhoneOtp(fullPhone, appVerifier);
      setConfirmationResult(confirmation);
      setPhoneOtpStep('verify');
      setResendCooldown(60);
      setStatusMessage(`Verification code sent via SMS to ${countryCode} ${cleaned}.`);
    } catch (err) {
      const formatted = formatFirebaseAuthError(err);
      setAuthError(formatted.message);
      setShowDomainAuthGuide(formatted.needsDomainAuthGuide);
      setShowEmailProviderGuide(formatted.needsEmailProviderEnable);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setStatusMessage(null);
    setShowDomainAuthGuide(false);
    const trimmedOtp = otpCode.trim();
    if (!trimmedOtp || trimmedOtp.length < 6) {
      setErrors({ otp: 'Please enter the 6-digit OTP code sent to your phone.' });
      return;
    }
    if (!confirmationResult) {
      setAuthError('Verification session expired. Please request a new OTP.');
      setPhoneOtpStep('request');
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      const profile = await verifyPhoneOtpAndLogin(confirmationResult, trimmedOtp, {
        fullName: phoneOtpName.trim() || undefined,
        city: city || 'Bengaluru',
        neighborhood: neighborhood.trim() || 'Indiranagar',
      });
      setStatusMessage('Phone verified successfully! Redirecting...');
      onAuthenticated(profile);
    } catch (err) {
      const formatted = formatFirebaseAuthError(err);
      setAuthError(formatted.message);
      setShowDomainAuthGuide(formatted.needsDomainAuthGuide);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-transparent min-h-screen py-12 lg:py-16 text-[#F8FAFC]">
      <div className="max-w-[480px] mx-auto px-4 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate({ page: 'home' })}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8] hover:text-[#8B5CF6] mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to BorrowBox Home
        </button>

        {redirectReason && (
          <div
            role="status"
            className="mb-4 p-3.5 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-xs text-[#F8FAFC] font-medium"
          >
            {redirectReason}
          </div>
        )}

        <div className="border border-white/[0.08] rounded-2xl p-6 sm:p-8 bg-[#161E2E] space-y-6 shadow-2xl">
          {/* Brand Logo & Header */}
          <div className="border-b border-white/[0.08] pb-5 flex flex-col items-center text-center">
            <div className="mb-3 hover:scale-105 transition-transform duration-200">
              <BorrowBoxLogo
                symbolSize="3.25rem"
                textSize="text-2xl font-bold tracking-tight"
                showTagline
                idPrefix="auth-modal-logo"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F8FAFC] tracking-tight">
              {viewMode === 'reset'
                ? 'Reset Your Password'
                : authMethod === 'phone'
                ? 'Sign In with Mobile OTP'
                : viewMode === 'login'
                ? 'Log In to BorrowBox'
                : 'Create Your BorrowBox Account'}
            </h1>
            <p className="text-xs text-[#94A3B8] mt-1 max-w-sm">
              {viewMode === 'reset'
                ? 'Enter your email address to receive password reset instructions.'
                : authMethod === 'phone'
                ? 'Enter your mobile number to receive a secure one-time verification code.'
                : viewMode === 'login'
                ? 'Sign in to access your Renter and Owner gear rental dashboard.'
                : 'Register a single account to both rent nearby gear and earn by listing your equipment.'}
            </p>
          </div>

          {/* Google Sign-In Button */}
          {viewMode !== 'reset' && (
            <div className="space-y-3">
              <button
                type="button"
                disabled={isGoogleLoading || isLoading}
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 bg-[#1D293B] hover:bg-[#334155] text-[#F8FAFC] border border-white/[0.12] text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#8B5CF6]" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-white/[0.08]" />
                <span className="shrink mx-3 text-xs text-[#94A3B8]">
                  or choose authentication method
                </span>
                <div className="grow border-t border-white/[0.08]" />
              </div>

              {/* Authentication Method Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#111827] rounded-xl border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('email');
                    setErrors({});
                    setAuthError(null);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    authMethod === 'email'
                      ? 'bg-[#8B5CF6] text-white shadow-md'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email & Password</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('phone');
                    setErrors({});
                    setAuthError(null);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    authMethod === 'phone'
                      ? 'bg-[#8B5CF6] text-white shadow-md'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile OTP</span>
                </button>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {statusMessage && (
            <div
              role="status"
              className="p-3.5 rounded-lg bg-[#22C55E]/15 border border-[#22C55E]/30 text-xs text-[#22C55E] flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {authError && (
            <div
              role="alert"
              className="p-3.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444] space-y-2"
            >
              <div className="flex items-start gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>

              {/* Authorized Domain Guide */}
              {showDomainAuthGuide && (
                <div className="pt-2 border-t border-[#EF4444]/20 text-[#94A3B8] bg-[#111827] p-3 rounded-xl border border-white/[0.08] space-y-2 text-xs">
                  <p className="font-semibold text-[#F8FAFC] flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-[#8B5CF6]" />
                    Note for Custom Firebase Projects:
                  </p>
                  <p>
                    If you are connecting your personal Firebase project, open{' '}
                    <a
                      href="https://console.firebase.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8B5CF6] underline font-medium hover:text-[#A78BFA]"
                    >
                      Firebase Console
                    </a>
                    , select your project &rarr; Authentication &rarr; Settings &rarr; Authorized domains, and add <strong className="text-[#F8FAFC] font-mono">borrow-box-src.vercel.app</strong>.
                  </p>
                </div>
              )}

              {/* Email Provider Enable Guide */}
              {showEmailProviderGuide && (
                <div className="pt-2 border-t border-[#EF4444]/20 text-[#94A3B8] bg-[#111827] p-3 rounded-xl border border-white/[0.08] space-y-1.5">
                  <p className="font-semibold text-[#F8FAFC]">
                    How to enable Email/Password in Firebase Console (1 minute):
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>
                      Open{' '}
                      <a
                        href="https://console.firebase.google.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#8B5CF6] underline font-medium hover:text-[#A78BFA]"
                      >
                        Firebase Console &rarr; Your Project &rarr; Authentication &rarr; Sign-in method
                      </a>
                    </li>
                    <li>
                      Click <strong className="text-[#F8FAFC]">Email/Password</strong> in the provider list.
                    </li>
                    <li>
                      Toggle <strong className="text-[#F8FAFC]">Enable</strong> on and click{' '}
                      <strong className="text-[#F8FAFC]">Save</strong>.
                    </li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Hidden Recaptcha Anchor */}
          <div id="phone-recaptcha-container" />

          {/* PHONE OTP AUTHENTICATION FLOW */}
          {authMethod === 'phone' && viewMode !== 'reset' ? (
            phoneOtpStep === 'request' ? (
              <form onSubmit={handleSendPhoneOtp} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="auth-phone-country"
                    className="block text-xs font-semibold text-[#F8FAFC] mb-1"
                  >
                    Country / Region Code
                  </label>
                  <select
                    id="auth-phone-country"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#111827] border border-white/[0.08] rounded-xl text-sm text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6]"
                  >
                    {COUNTRY_CODES.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="auth-phone-number"
                    className="block text-xs font-semibold text-[#F8FAFC] mb-1"
                  >
                    Mobile Phone Number *
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-white/[0.08] focus-within:border-[#8B5CF6]">
                    <span className="px-3.5 py-2.5 bg-[#1D293B] text-xs font-mono text-[#94A3B8] border-r border-white/[0.08] flex items-center">
                      {countryCode}
                    </span>
                    <input
                      id="auth-phone-number"
                      type="tel"
                      value={phoneOtpNumber}
                      onChange={(e) => setPhoneOtpNumber(e.target.value)}
                      placeholder="9876543210"
                      className="grow px-3.5 py-2.5 bg-[#111827] text-sm font-mono text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none"
                    />
                  </div>
                  {errors.phoneOtp && (
                    <p className="text-xs text-[#EF4444] mt-1">{errors.phoneOtp}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="auth-phone-name"
                    className="block text-xs font-semibold text-[#F8FAFC] mb-1"
                  >
                    Your Display Name (Optional)
                  </label>
                  <input
                    id="auth-phone-name"
                    type="text"
                    value={phoneOtpName}
                    onChange={(e) => setPhoneOtpName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3.5 py-2.5 bg-[#111827] border border-white/[0.08] rounded-xl text-sm text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-sm font-semibold rounded-xl transition-all bb-glow-button flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4" />
                      <span>Send OTP via SMS</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOtp} noValidate className="space-y-4">
                <div className="p-3 rounded-xl bg-[#111827] border border-white/[0.08] text-xs text-[#94A3B8] flex items-center justify-between">
                  <div>
                    <span>Code sent to </span>
                    <strong className="text-[#F8FAFC] font-mono">
                      {countryCode} {phoneOtpNumber}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneOtpStep('request');
                      setOtpCode('');
                      setErrors({});
                    }}
                    className="text-[#8B5CF6] hover:underline font-semibold"
                  >
                    Edit
                  </button>
                </div>

                <div>
                  <label
                    htmlFor="auth-otp-input"
                    className="block text-xs font-semibold text-[#F8FAFC] mb-1"
                  >
                    6-Digit Verification Code *
                  </label>
                  <input
                    id="auth-otp-input"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-3 bg-[#111827] border border-white/[0.08] rounded-xl text-center text-lg font-mono tracking-widest text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#8B5CF6]"
                    autoFocus
                  />
                  {errors.otp && (
                    <p className="text-xs text-[#EF4444] mt-1">{errors.otp}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                  <span>Didn&apos;t receive code?</span>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isLoading}
                    onClick={handleSendPhoneOtp}
                    className="font-semibold text-[#8B5CF6] hover:text-[#A78BFA] disabled:opacity-50 cursor-pointer"
                  >
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : 'Resend OTP'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-sm font-semibold rounded-xl transition-all bb-glow-button flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Sign In</span>
                    </>
                  )}
                </button>
              </form>
            )
          ) : (
            /* EMAIL / PASSWORD / RESET FORM */
            <form onSubmit={handleEmailAuthSubmit} noValidate className="space-y-4">
              {viewMode === 'signup' && (
                <div>
                  <label
                    htmlFor="auth-fullname"
                    className="block text-xs font-semibold text-[#F8FAFC] mb-1"
                  >
                    Full Name *
                  </label>
                  <input
                    id="auth-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3.5 py-2.5 bg-[#111827] border border-white/[0.08] rounded-xl text-sm text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#8B5CF6]"
                  />
                  {errors.fullName && (
                    <p className="text-xs text-[#EF4444] mt-1">{errors.fullName}</p>
                  )}
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-semibold text-[#F8FAFC] mb-1"
                >
                  Email Address *
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.in"
                  className="w-full px-3.5 py-2.5 bg-[#111827] border border-white/[0.08] rounded-xl text-sm text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#8B5CF6]"
                />
                {errors.email && (
                  <p className="text-xs text-[#EF4444] mt-1">{errors.email}</p>
                )}
              </div>

              {viewMode === 'signup' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="auth-phone"
                        className="block text-xs font-semibold text-[#F8FAFC] mb-1"
                      >
                        Mobile Number (+91) *
                      </label>
                      <input
                        id="auth-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="9876543210"
                        className="w-full px-3.5 py-2.5 bg-[#111827] border border-white/[0.08] rounded-xl text-sm font-mono-tabular text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#8B5CF6]"
                      />
                      {errors.phone && (
                        <p className="text-xs text-[#EF4444] mt-1">
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="auth-state"
                        className="block text-xs font-semibold text-[#F8FAFC] mb-1"
                      >
                        State / Union Territory
                      </label>
                      <select
                        id="auth-state"
                        value={selectedState}
                        onChange={(e) => {
                          const nextState = e.target.value;
                          setSelectedState(nextState);
                          if (nextState) {
                            const stateObj = INDIA_STATES_AND_UTS.find(
                              (s) => s.name === nextState
                            );
                            if (stateObj && !stateObj.cities.includes(city as IndianCity)) {
                              setCity('');
                            }
                          }
                        }}
                        className="w-full px-3.5 py-2.5 bg-[#111827] border border-white/[0.08] rounded-xl text-sm text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6]"
                      >
                        <option value="">All States & UTs (or select State)</option>
                        {INDIA_STATES_AND_UTS.map((st) => (
                          <option key={st.name} value={st.name}>
                            {st.name} ({st.type === 'ut' ? 'UT' : 'State'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="auth-city"
                        className="block text-xs font-semibold text-[#F8FAFC] mb-1"
                      >
                        Primary City *
                      </label>
                      <select
                        id="auth-city"
                        value={city}
                        onChange={(e) => {
                          const nextCity = e.target.value as IndianCity | '';
                          setCity(nextCity);
                          if (nextCity) {
                            const parentState = getStateForCity(nextCity);
                            if (parentState) setSelectedState(parentState);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 bg-[#111827] border border-white/[0.08] rounded-xl text-sm text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6]"
                      >
                        <option value="">Select your city</option>
                        {availableCities.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {errors.city && (
                        <p className="text-xs text-[#EF4444] mt-1">{errors.city}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="auth-neighborhood"
                        className="block text-xs font-semibold text-[#F8FAFC] mb-1"
                      >
                        Neighborhood / Locality
                      </label>
                      <input
                        id="auth-neighborhood"
                        list="auth-locality-options"
                        type="text"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder={
                          city
                            ? `e.g. Locality in ${city}`
                            : 'e.g., Koramangala, Bandra West'
                        }
                        className="w-full px-3.5 py-2.5 bg-[#111827] border border-white/[0.08] rounded-xl text-sm text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#8B5CF6]"
                      />
                      <datalist id="auth-locality-options">
                        {localitySuggestions.map((loc) => (
                          <option key={loc} value={loc} />
                        ))}
                      </datalist>
                      {errors.neighborhood && (
                        <p className="text-xs text-[#EF4444] mt-1">
                          {errors.neighborhood}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {viewMode !== 'reset' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="auth-password"
                      className="block text-xs font-semibold text-[#F8FAFC]"
                    >
                      Password *
                    </label>
                    {viewMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setErrors({});
                          setAuthError(null);
                          setStatusMessage(null);
                          setViewMode('reset');
                        }}
                        className="text-xs font-semibold text-[#8B5CF6] hover:text-[#A78BFA] cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3.5 py-2.5 pr-10 bg-[#111827] border border-white/[0.08] rounded-xl text-sm text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#8B5CF6]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-[#EF4444] mt-1">{errors.password}</p>
                  )}
                </div>
              )}

              {/* Confirm Password (Signup only) */}
              {viewMode === 'signup' && (
                <div>
                  <label
                    htmlFor="auth-confirm-password"
                    className="block text-xs font-semibold text-[#F8FAFC] mb-1"
                  >
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      id="auth-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full px-3.5 py-2.5 pr-10 bg-[#111827] border border-white/[0.08] rounded-xl text-sm text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#8B5CF6]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-[#EF4444] mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              {/* Terms and Privacy Agreement (Signup only) */}
              {viewMode === 'signup' && (
                <div>
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#94A3B8] select-none">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 rounded border-white/[0.12] bg-[#111827] text-[#8B5CF6] focus:ring-[#8B5CF6] cursor-pointer"
                    />
                    <span>
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate({ page: 'terms' });
                        }}
                        className="text-[#8B5CF6] hover:underline font-medium"
                      >
                        Terms of Service
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate({ page: 'privacy' });
                        }}
                        className="text-[#8B5CF6] hover:underline font-medium"
                      >
                        Privacy Policy
                      </button>
                      .
                    </span>
                  </label>
                  {errors.terms && (
                    <p className="text-xs text-[#EF4444] mt-1">{errors.terms}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full py-2.5 px-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-sm font-semibold rounded-xl transition-all bb-glow-button flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {viewMode === 'login'
                        ? 'Signing In...'
                        : viewMode === 'signup'
                        ? 'Creating Account...'
                        : 'Sending Reset Email...'}
                    </span>
                  </>
                ) : viewMode === 'login' ? (
                  'Log In'
                ) : viewMode === 'signup' ? (
                  'Create Account'
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Send Password Reset Link</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Mode Switch */}
          <div className="pt-4 border-t border-white/[0.08] text-center text-xs text-[#94A3B8] space-y-2">
            {viewMode === 'login' ? (
              <p>
                New to BorrowBox?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrors({});
                    setAuthError(null);
                    setStatusMessage(null);
                    onSwitchMode('signup');
                  }}
                  className="font-semibold text-[#8B5CF6] hover:text-[#A78BFA] cursor-pointer"
                >
                  Create an account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrors({});
                    setAuthError(null);
                    setStatusMessage(null);
                    onSwitchMode('login');
                  }}
                  className="font-semibold text-[#8B5CF6] hover:text-[#A78BFA] cursor-pointer"
                >
                  Back to Login
                </button>
              </p>
            )}

            <p className="text-[11px] text-[#94A3B8] flex items-center justify-center gap-1 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>
                Secured by Firebase Authentication & Cloud Firestore Rules
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};