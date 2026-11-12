import { supabase } from './supabase';
import { ProductListing, BorrowBoxUserProfile, IndianCity, UserActiveMode } from '../types/marketplace';
import { DEMO_PRODUCT_LISTINGS } from '../data/demoCatalog';
import {
  fetchActiveCommunityListings,
  createListingInFirestore,
  updateListingInFirestore,
  deleteListingFromFirestore,
} from './firebase';

export const STORAGE_KEYS = {
  ITEMS: 'borrowbox_items',
  COMMUNITY_LISTINGS_LEGACY: 'borrowbox_community_listings_v1',
  USERS: 'borrowbox_users',
  ACTIVE_PROFILE: 'borrowbox_user_profile_v1',
};

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed writing to localStorage[${key}]:`, err);
  }
}

/**
 * Loads all community and user listings across all layers:
 * 1. Base DEMO_PRODUCT_LISTINGS
 * 2. Shared backend marketplace inventory (/api/marketplace/listings)
 * 3. Firestore /listings collection (status == 'active')
 * 4. Local storage cache (offline resilience)
 * 5. Supabase listings table (if configured)
 *
 * Guarantees zero duplicate entries by item ID and never throws.
 */
export async function loadAllCommunityListings(options?: {
  ownerId?: string;
  requesterUid?: string;
  role?: string;
  email?: string;
}): Promise<ProductListing[]> {
  const mergedMap = new Map<string, ProductListing>();

  // 1. Add demo listings as foundation
  for (const item of DEMO_PRODUCT_LISTINGS) {
    mergedMap.set(item.id, item);
  }

  // 2. Read local items from both current and legacy cache keys
  const localItems = readStorage<ProductListing[]>(STORAGE_KEYS.ITEMS, []);
  const legacyItems = readStorage<ProductListing[]>(STORAGE_KEYS.COMMUNITY_LISTINGS_LEGACY, []);

  for (const item of legacyItems) {
    if (item && item.id) {
      mergedMap.set(item.id, {
        ...item,
        isListed: item.isListed ?? (item.status !== 'unlisted' && item.status !== 'archived' && item.status !== 'paused'),
      });
    }
  }

  for (const item of localItems) {
    if (item && item.id) {
      mergedMap.set(item.id, {
        ...item,
        isListed: item.isListed ?? (item.status !== 'unlisted' && item.status !== 'archived' && item.status !== 'paused'),
      });
    }
  }

  // 3. Fetch from shared backend API (/api/marketplace/listings)
  try {
    const queryParams = new URLSearchParams();
    if (options?.ownerId) queryParams.set('ownerId', options.ownerId);
    if (options?.requesterUid) queryParams.set('requesterUid', options.requesterUid);
    if (options?.role) queryParams.set('role', options.role);
    if (options?.email) queryParams.set('email', options.email);

    const url = `/api/marketplace/listings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const res = await fetch(url, { method: 'GET' });
    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.listings)) {
        for (const item of json.listings) {
          if (item && item.id) {
            mergedMap.set(item.id, {
              ...item,
              isListed: item.isListed ?? (item.status !== 'unlisted' && item.status !== 'archived' && item.status !== 'paused'),
            });
          }
        }
      }
    }
  } catch {
    // Non-blocking: API server may be unavailable in pure static client deployment
  }

  // 4. Fetch directly from Firestore `/listings` (queries active items publicly)
  try {
    const firestoreItems = await fetchActiveCommunityListings();
    if (Array.isArray(firestoreItems)) {
      for (const item of firestoreItems) {
        if (item && item.id) {
          mergedMap.set(item.id, {
            ...item,
            isListed: item.isListed ?? (item.status !== 'unlisted' && item.status !== 'archived' && item.status !== 'paused'),
          });
        }
      }
    }
  } catch {
    // Non-blocking fallback
  }

  // 5. Safely attempt Supabase sync in background
  try {
    const { data, error } = await supabase.from('listings').select('*');
    if (!error && Array.isArray(data)) {
      for (const row of data) {
        if (row && row.id) {
          const parsed: ProductListing = {
            id: row.id,
            title: row.title || 'Untitled Item',
            category: row.category || 'Electronics',
            dailyPriceINR: Number(row.daily_price_inr || row.dailyPriceINR || 500),
            refundableDepositINR: Number(row.refundable_deposit_inr || row.refundableDepositINR || 1000),
            replacementValueINR: Number(row.replacement_value_inr || row.replacementValueINR || 5000),
            condition: row.condition || 'Excellent',
            city: row.city || 'Delhi',
            neighborhood: row.neighborhood || 'Central',
            pickupLocation: row.pickup_location || row.neighborhood || 'Near metro',
            description: row.description || '',
            specifications: row.specifications || [],
            includedItems: row.included_items || ['Item', 'Accessories'],
            rentalRules: row.rental_rules || ['Govt ID required'],
            availableFrom: row.available_from || '2026-10-29',
            availableTo: row.available_to || '2026-12-31',
            minRentalDays: Number(row.min_rental_days || 1),
            featured: Boolean(row.featured),
            isDemoData: false,
            status: row.status || (row.is_listed === false ? 'unlisted' : 'available'),
            isListed: row.is_listed !== false && row.status !== 'unlisted' && row.status !== 'paused',
            cancellationPolicy: row.cancellation_policy || 'Flexible (Full refund 24h prior)',
            imageUrl: row.image_url || 'sony_camera',
            gallery: row.gallery || [],
            owner: row.owner || {
              id: row.owner_id || 'community-owner',
              name: row.owner_name || 'Community Member',
              neighborhood: row.neighborhood || 'Local',
              city: row.city || 'Delhi',
              rating: 5.0,
              completedRentals: 1,
              responseTime: 'Usually in 1 hour',
              memberSince: '2026',
              kycVerified: true,
            },
          };
          mergedMap.set(parsed.id, parsed);
        }
      }
    }
  } catch {
    // Non-blocking if Supabase table is not configured
  }

  const allItems = Array.from(mergedMap.values());

  // Save unified community items back to localStorage for instant offline access
  writeStorage(
    STORAGE_KEYS.ITEMS,
    allItems.filter((i) => !i.isDemoData)
  );

  return allItems;
}

/**
 * Saves or updates a listing across all storage layers (localStorage, backend API, Firestore, Supabase).
 * Never throws permission errors.
 */
export async function persistMarketplaceListing(
  listing: ProductListing,
  isEdit = false,
  requesterProfile?: BorrowBoxUserProfile | null
): Promise<ProductListing> {
  const currentItems = readStorage<ProductListing[]>(STORAGE_KEYS.ITEMS, []);
  
  const standardized: ProductListing = {
    ...listing,
    status: listing.status || 'active',
    isListed: listing.isListed ?? (listing.status !== 'unlisted' && listing.status !== 'archived' && listing.status !== 'paused'),
    createdAt: listing.createdAt || new Date().toISOString(),
  };

  // 1. Update localStorage immediately (Zero duplicate protection)
  const filtered = currentItems.filter((i) => i.id !== standardized.id);
  const updatedList = [standardized, ...filtered];
  writeStorage(STORAGE_KEYS.ITEMS, updatedList);
  writeStorage(STORAGE_KEYS.COMMUNITY_LISTINGS_LEGACY, updatedList);

  // 2. Sync to shared Backend API (/api/marketplace/listings)
  try {
    const endpoint = isEdit
      ? `/api/marketplace/listings/${standardized.id}`
      : '/api/marketplace/listings';
    const method = isEdit ? 'PUT' : 'POST';

    await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing: standardized,
        updates: standardized,
        requesterUid: requesterProfile?.uid || standardized.owner?.id,
        requesterEmail: requesterProfile?.email,
        requesterRole: requesterProfile?.role,
        requesterName: requesterProfile?.name || standardized.owner?.name,
      }),
    });
  } catch {
    // Safe non-blocking fallback
  }

  // 3. Safe sync to Firestore `/listings`
  if (!standardized.isDemoData) {
    try {
      if (isEdit) {
        await updateListingInFirestore(standardized);
      } else {
        await createListingInFirestore(standardized);
      }
    } catch {
      // Safe fallback
    }
  }

  // 4. Safe async sync to Supabase (try/catch so it never breaks UI if Supabase table is absent)
  try {
    await supabase.from('listings').upsert({
      id: standardized.id,
      title: standardized.title,
      category: standardized.category,
      daily_price_inr: standardized.dailyPriceINR,
      refundable_deposit_inr: standardized.refundableDepositINR,
      replacement_value_inr: standardized.replacementValueINR,
      condition: standardized.condition,
      city: standardized.city,
      neighborhood: standardized.neighborhood,
      pickup_location: standardized.pickupLocation,
      description: standardized.description,
      image_url: standardized.imageUrl,
      available_from: standardized.availableFrom,
      available_to: standardized.availableTo,
      min_rental_days: standardized.minRentalDays,
      status: standardized.status,
      is_listed: standardized.isListed,
      owner_id: standardized.owner.id,
      owner_name: standardized.owner.name,
      owner: standardized.owner,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Non-fatal
  }

  return standardized;
}

/**
 * Unlists or Relists an item across all storage layers.
 * When unlisted: disappears from public discovery (Browse, Search, Homepage),
 * but remains visible in owner's inventory.
 */
export async function toggleListingListedState(
  listingId: string,
  relist: boolean,
  requesterProfile?: BorrowBoxUserProfile | null
): Promise<ProductListing | null> {
  const currentItems = readStorage<ProductListing[]>(STORAGE_KEYS.ITEMS, []);
  const target = currentItems.find((i) => i.id === listingId);
  if (!target) return null;

  const nextStatus = relist ? 'active' : 'unlisted';
  const updated: ProductListing = {
    ...target,
    isListed: relist,
    status: nextStatus,
  };

  // 1. LocalStorage update
  const updatedList = currentItems.map((i) => (i.id === listingId ? updated : i));
  writeStorage(STORAGE_KEYS.ITEMS, updatedList);
  writeStorage(STORAGE_KEYS.COMMUNITY_LISTINGS_LEGACY, updatedList);

  // 2. Backend API toggle
  try {
    await fetch(`/api/marketplace/listings/${listingId}/toggle-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requesterUid: requesterProfile?.uid || target.owner?.id,
        requesterEmail: requesterProfile?.email,
        requesterRole: requesterProfile?.role,
      }),
    });
  } catch {}

  // 3. Firestore update
  if (!target.isDemoData) {
    try {
      await updateListingInFirestore(updated);
    } catch {}
  }

  // 4. Supabase update
  try {
    await supabase
      .from('listings')
      .update({ is_listed: relist, status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', listingId);
  } catch {}

  return updated;
}

/**
 * Permanently removes an item listing from persistent storage.
 */
export async function deleteMarketplaceListing(
  listingId: string,
  requesterProfile?: BorrowBoxUserProfile | null
): Promise<void> {
  const currentItems = readStorage<ProductListing[]>(STORAGE_KEYS.ITEMS, []);
  const target = currentItems.find((i) => i.id === listingId);
  const filtered = currentItems.filter((i) => i.id !== listingId);

  // 1. LocalStorage remove
  writeStorage(STORAGE_KEYS.ITEMS, filtered);
  writeStorage(STORAGE_KEYS.COMMUNITY_LISTINGS_LEGACY, filtered);

  // 2. Backend API remove
  try {
    await fetch(`/api/marketplace/listings/${listingId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requesterUid: requesterProfile?.uid || target?.owner?.id,
        requesterEmail: requesterProfile?.email,
        requesterRole: requesterProfile?.role,
      }),
    });
  } catch {}

  // 3. Firestore remove
  if (target && !target.isDemoData) {
    try {
      await deleteListingFromFirestore(listingId, requesterProfile?.uid || target.owner?.id);
    } catch {}
  }

  // 4. Supabase remove
  try {
    await supabase.from('listings').delete().eq('id', listingId);
  } catch {}
}

/**
 * Saves and updates a user's profile in persistent storage (localStorage + Supabase).
 */
export async function persistUserProfile(
  uid: string,
  updates: {
    name?: string;
    photoURL?: string;
    city?: IndianCity;
    neighborhood?: string;
    phone?: string;
    activeMode?: UserActiveMode;
  }
): Promise<BorrowBoxUserProfile> {
  const currentProfile = readStorage<BorrowBoxUserProfile | null>(STORAGE_KEYS.ACTIVE_PROFILE, null);
  const now = new Date().toISOString();

  const mergedProfile: BorrowBoxUserProfile = {
    uid: uid || currentProfile?.uid || 'user-default',
    name: (updates.name !== undefined ? updates.name : currentProfile?.name || 'BorrowBox Member').trim(),
    email: currentProfile?.email || '',
    phone: (updates.phone !== undefined ? updates.phone : currentProfile?.phone || '').trim(),
    photoURL: (updates.photoURL !== undefined ? updates.photoURL : currentProfile?.photoURL || '').trim(),
    city: updates.city || currentProfile?.city || 'Delhi',
    neighborhood: (updates.neighborhood !== undefined ? updates.neighborhood : currentProfile?.neighborhood || '').trim(),
    canRent: currentProfile?.canRent ?? true,
    canList: currentProfile?.canList ?? true,
    activeMode: updates.activeMode || currentProfile?.activeMode || 'renter',
    createdAtISO: currentProfile?.createdAtISO || now,
    updatedAtISO: now,
    isAdmin: currentProfile?.isAdmin ?? false,
    role: currentProfile?.role || 'user',
  };

  writeStorage(STORAGE_KEYS.ACTIVE_PROFILE, mergedProfile);

  const usersList = readStorage<Record<string, BorrowBoxUserProfile>>(STORAGE_KEYS.USERS, {});
  usersList[mergedProfile.uid] = mergedProfile;
  writeStorage(STORAGE_KEYS.USERS, usersList);

  try {
    await supabase.from('profiles').upsert({
      id: mergedProfile.uid,
      full_name: mergedProfile.name,
      phone: mergedProfile.phone,
      avatar_url: mergedProfile.photoURL,
      city: mergedProfile.city,
      neighborhood: mergedProfile.neighborhood,
      active_mode: mergedProfile.activeMode,
      updated_at: now,
    });
  } catch {}

  return mergedProfile;
}
