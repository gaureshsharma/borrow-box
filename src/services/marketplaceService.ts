import { supabase } from './supabase';
import { ProductListing, BorrowBoxUserProfile, IndianCity, UserActiveMode } from '../types/marketplace';
import { DEMO_PRODUCT_LISTINGS } from '../data/demoCatalog';

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
 * Loads all community and user listings from localStorage and Supabase.
 * Guaranteed to NEVER throw raw Firebase or network errors.
 */
export async function loadAllCommunityListings(): Promise<ProductListing[]> {
  // 1. Read local items from both current and legacy keys
  const localItems = readStorage<ProductListing[]>(STORAGE_KEYS.ITEMS, []);
  const legacyItems = readStorage<ProductListing[]>(STORAGE_KEYS.COMMUNITY_LISTINGS_LEGACY, []);

  const mergedMap = new Map<string, ProductListing>();

  // Add demo listings as base
  for (const item of DEMO_PRODUCT_LISTINGS) {
    mergedMap.set(item.id, item);
  }

  // Add legacy items
  for (const item of legacyItems) {
    if (item && item.id) {
      mergedMap.set(item.id, {
        ...item,
        isListed: item.isListed ?? (item.status !== 'unlisted' && item.status !== 'archived'),
      });
    }
  }

  // Add primary local items
  for (const item of localItems) {
    if (item && item.id) {
      mergedMap.set(item.id, {
        ...item,
        isListed: item.isListed ?? (item.status !== 'unlisted' && item.status !== 'archived'),
      });
    }
  }

  // 2. Safely attempt Supabase sync in background (non-blocking)
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
            isListed: row.is_listed !== false && row.status !== 'unlisted',
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
    // Supabase table or RLS not yet migrated; gracefully use localStorage
  }

  const allItems = Array.from(mergedMap.values());
  // Save unified list back to localStorage
  writeStorage(
    STORAGE_KEYS.ITEMS,
    allItems.filter((i) => !i.isDemoData)
  );

  return allItems;
}

/**
 * Saves or updates a listing in persistent storage (localStorage + Supabase).
 * Never throws permission errors.
 */
export async function persistMarketplaceListing(
  listing: ProductListing,
  isEdit = false
): Promise<ProductListing> {
  const currentItems = readStorage<ProductListing[]>(STORAGE_KEYS.ITEMS, []);
  
  const standardized: ProductListing = {
    ...listing,
    isListed: listing.isListed ?? (listing.status !== 'unlisted' && listing.status !== 'archived'),
    status: listing.status || 'available',
    createdAt: listing.createdAt || new Date().toISOString(),
  };

  // 1. Update localStorage immediately (Zero duplicate protection)
  const filtered = currentItems.filter((i) => i.id !== standardized.id);
  const updatedList = [standardized, ...filtered];
  writeStorage(STORAGE_KEYS.ITEMS, updatedList);
  writeStorage(STORAGE_KEYS.COMMUNITY_LISTINGS_LEGACY, updatedList);

  // 2. Safe async sync to Supabase (try/catch so it never breaks UI if Supabase table is absent)
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
    // Non-fatal if Supabase table does not exist
  }

  return standardized;
}

/**
 * Unlists or Relists an item.
 * When unlisted: disappears from public marketplace, stays visible in owner's inventory.
 */
export async function toggleListingListedState(
  listingId: string,
  relist: boolean
): Promise<ProductListing | null> {
  const currentItems = readStorage<ProductListing[]>(STORAGE_KEYS.ITEMS, []);
  const target = currentItems.find((i) => i.id === listingId);
  if (!target) return null;

  const nextStatus = relist ? 'available' : 'unlisted';
  const updated: ProductListing = {
    ...target,
    isListed: relist,
    status: nextStatus,
  };

  const updatedList = currentItems.map((i) => (i.id === listingId ? updated : i));
  writeStorage(STORAGE_KEYS.ITEMS, updatedList);
  writeStorage(STORAGE_KEYS.COMMUNITY_LISTINGS_LEGACY, updatedList);

  try {
    await supabase
      .from('listings')
      .update({ is_listed: relist, status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', listingId);
  } catch {
    // Safe fallback
  }

  return updated;
}

/**
 * Permanently removes an item listing from persistent storage.
 */
export async function deleteMarketplaceListing(listingId: string): Promise<void> {
  const currentItems = readStorage<ProductListing[]>(STORAGE_KEYS.ITEMS, []);
  const filtered = currentItems.filter((i) => i.id !== listingId);

  writeStorage(STORAGE_KEYS.ITEMS, filtered);
  writeStorage(STORAGE_KEYS.COMMUNITY_LISTINGS_LEGACY, filtered);

  try {
    await supabase.from('listings').delete().eq('id', listingId);
  } catch {
    // Safe fallback
  }
}

/**
 * Saves and updates a user's profile in persistent storage (localStorage + Supabase).
 * Completely eliminates the split-brain Firebase Firestore permission error.
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
  // 1. Read existing profile from localStorage
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

  // 2. Save synchronously to localStorage so reloads keep the updated profile
  writeStorage(STORAGE_KEYS.ACTIVE_PROFILE, mergedProfile);

  // Update in user accounts list
  const usersList = readStorage<Record<string, BorrowBoxUserProfile>>(STORAGE_KEYS.USERS, {});
  usersList[mergedProfile.uid] = mergedProfile;
  writeStorage(STORAGE_KEYS.USERS, usersList);

  // 3. Sync to Supabase in a safe try/catch
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
  } catch {
    // Non-blocking: table may not exist
  }

  return mergedProfile;
}

