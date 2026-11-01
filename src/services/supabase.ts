import { createClient, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { BorrowBoxUserProfile } from '../types/marketplace';
import { isSuperAdminEmail } from '../utils/adminRbac';
import {
  registerWithEmailAndProfile,
  signInWithEmail,
} from './firebase';

// Fallback Supabase credentials for BorrowBox
const FALLBACK_SUPABASE_URL = 'https://zgbjpizznlhouaiuvada.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnYmpwaXp6bmxob3VhaXV2YWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjA1MDAwMDAwMH0.anon_key';

export const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) || FALLBACK_SUPABASE_URL;

export const supabaseKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  FALLBACK_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Convert a Supabase user entity into the BorrowBox unified user profile.
 */
export function supabaseUserToProfile(
  user: SupabaseUser,
  extra?: Partial<BorrowBoxUserProfile>
): BorrowBoxUserProfile {
  const cleanEmail = (user.email || '').trim().toLowerCase();
  const isAdmin = isSuperAdminEmail(cleanEmail);
  const now = new Date().toISOString();
  const meta = user.user_metadata || {};

  const fullName =
    extra?.name ||
    meta.full_name ||
    meta.name ||
    (user.email ? user.email.split('@')[0] : 'BorrowBox Member');

  const profile: BorrowBoxUserProfile = {
    uid: user.id,
    name: fullName,
    email: user.email || '',
    phone: extra?.phone || meta.phone || user.phone || '',
    photoURL: extra?.photoURL || meta.avatar_url || meta.picture || '',
    city: extra?.city || meta.city || 'Bengaluru',
    neighborhood: extra?.neighborhood || meta.neighborhood || '',
    canRent: true,
    canList: true,
    activeMode: extra?.activeMode || 'renter',
    createdAtISO: user.created_at || now,
    updatedAtISO: now,
    isAdmin,
    role: isAdmin ? 'super_admin' : 'user',
  };

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('borrowbox_active_session_v1', JSON.stringify(profile));
    }
  } catch {}

  return profile;
}

/**
 * Initiate Google OAuth sign in flow via Supabase.
 */
export async function signInWithGoogleOAuth(options?: { redirectTo?: string }) {
  const redirectUri =
    options?.redirectTo ||
    (typeof window !== 'undefined' ? window.location.origin : undefined);

  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUri,
    },
  });
}

/**
 * Sign up with Email and Password using Supabase Auth with automatic profile sync.
 */
export async function signUpWithSupabase(params: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  city?: any;
  neighborhood?: string;
  photoURL?: string;
}): Promise<BorrowBoxUserProfile> {
  const cleanEmail = params.email.trim();
  const isAdmin = isSuperAdminEmail(cleanEmail);

  // 1. Supabase auth registration
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: params.password,
    options: {
      data: {
        full_name: params.fullName.trim(),
        phone: params.phone?.trim() || '',
        city: params.city || 'Bengaluru',
        neighborhood: params.neighborhood?.trim() || '',
        avatar_url: params.photoURL?.trim() || '',
        is_admin: isAdmin,
        role: isAdmin ? 'super_admin' : 'user',
      },
    },
  });

  if (error) {
    throw error;
  }

  // 2. Also sync to local / Firestore profiles to ensure uninterrupted listing & booking support
  const localProfile = await registerWithEmailAndProfile({
    fullName: params.fullName,
    email: cleanEmail,
    password: params.password,
    phone: params.phone || '',
    city: params.city || 'Bengaluru',
    neighborhood: params.neighborhood || '',
    photoURL: params.photoURL || '',
  }).catch(() => null);

  const fallbackNow = new Date().toISOString();
  const profile: BorrowBoxUserProfile = localProfile || {
    uid: data.user?.id || `sb_${Date.now()}`,
    name: params.fullName.trim(),
    email: cleanEmail,
    phone: params.phone?.trim() || '',
    photoURL: params.photoURL?.trim() || '',
    city: params.city || 'Bengaluru',
    neighborhood: params.neighborhood?.trim() || '',
    canRent: true,
    canList: true,
    activeMode: 'renter',
    createdAtISO: fallbackNow,
    updatedAtISO: fallbackNow,
    isAdmin,
    role: isAdmin ? 'super_admin' : 'user',
  };

  if (isAdmin) {
    profile.isAdmin = true;
    profile.role = 'super_admin';
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('borrowbox_active_session_v1', JSON.stringify(profile));
    }
  } catch {}

  return profile;
}

/**
 * Sign in with Email and Password using Supabase Auth with fallback to existing profiles.
 */
export async function signInWithSupabase(
  emailInput: string,
  passwordInput: string
): Promise<BorrowBoxUserProfile> {
  const cleanEmail = emailInput.trim();
  const isAdmin = isSuperAdminEmail(cleanEmail);

  let sbUser: SupabaseUser | null = null;
  let sbError: unknown = null;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: passwordInput,
    });
    if (error) {
      sbError = error;
    } else {
      sbUser = data.user;
    }
  } catch (err) {
    sbError = err;
  }

  if (sbUser) {
    const profile = supabaseUserToProfile(sbUser);
    if (isAdmin) {
      profile.isAdmin = true;
      profile.role = 'super_admin';
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('borrowbox_active_session_v1', JSON.stringify(profile));
      }
    } catch {}
    return profile;
  }

  // Graceful fallback to existing local / Firebase registered account
  try {
    const fallbackProfile = await signInWithEmail(cleanEmail, passwordInput);
    if (isAdmin) {
      fallbackProfile.isAdmin = true;
      fallbackProfile.role = 'super_admin';
    }
    return fallbackProfile;
  } catch (fallbackErr) {
    throw sbError || fallbackErr;
  }
}

/**
 * Sign out of Supabase auth session.
 */
export async function signOutSupabase(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {}
}
