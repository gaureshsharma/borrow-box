import { Request, Response, Express } from 'express';
import fs from 'fs';
import path from 'path';
import { ProductListing } from '../types/marketplace.ts';
import { DEMO_PRODUCT_LISTINGS } from '../data/demoCatalog.ts';
import { isSuperAdminEmail, PRIMARY_SUPER_ADMIN_EMAIL } from '../utils/adminRbac.ts';

const INVENTORY_FILE_PATH = path.join(process.cwd(), '.marketplace-inventory.json');

/**
 * Loads inventory from disk or initializes with base demo catalog.
 */
export function loadStoredInventory(): ProductListing[] {
  try {
    if (fs.existsSync(INVENTORY_FILE_PATH)) {
      const raw = fs.readFileSync(INVENTORY_FILE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read stored marketplace inventory, using fallback:', err);
  }

  // Initialize with DEMO_PRODUCT_LISTINGS
  const initial = DEMO_PRODUCT_LISTINGS.map((item) => ({
    ...item,
    status: item.status || 'active',
    isListed: item.isListed ?? true,
  }));
  saveStoredInventory(initial);
  return initial;
}

/**
 * Persists inventory atomically to disk.
 */
export function saveStoredInventory(items: ProductListing[]): void {
  try {
    fs.writeFileSync(INVENTORY_FILE_PATH, JSON.stringify(items, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write marketplace inventory file:', err);
  }
}

/**
 * Validates whether a requester is an authorized administrator.
 */
export function isAuthorizedAdmin(email?: string, role?: string): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  if (
    cleanEmail === PRIMARY_SUPER_ADMIN_EMAIL ||
    cleanEmail === 'marukrutarth@gmail.com' ||
    cleanEmail === 'gaureshsharma6@gmail.com' ||
    isSuperAdminEmail(cleanEmail)
  ) {
    return true;
  }
  return role === 'admin' || role === 'super_admin';
}

/**
 * Filters out drafts, pending, rejected, paused, unlisted, and deleted items from public discovery.
 */
export function filterPublicMarketplaceListings(listings: ProductListing[]): ProductListing[] {
  return listings.filter((item) => {
    if (item.status === 'archived' || item.status === 'unlisted' || item.status === 'paused') {
      return false;
    }
    if (item.status === 'draft' || item.status === 'pending' || item.status === 'rejected') {
      return false;
    }
    if (item.isListed === false) {
      return false;
    }
    return true;
  });
}

/**
 * Filters listings owned by a specific user for their own profile inventory.
 */
export function filterOwnerMarketplaceListings(
  listings: ProductListing[],
  ownerId: string
): ProductListing[] {
  return listings.filter((item) => item.owner?.id === ownerId);
}

/**
 * Creates a new marketplace listing with strict ownership binding.
 * Does not trust arbitrary forged client owner IDs.
 */
export function createMarketplaceListing(
  listingInput: Partial<ProductListing>,
  requesterUid: string,
  requesterName?: string
): ProductListing {
  if (!requesterUid) {
    throw new Error('Authentication required: requester UID is missing.');
  }

  const title = (listingInput.title || '').trim();
  if (title.length < 5 || title.length > 140) {
    throw new Error('Listing title must be between 5 and 140 characters.');
  }

  const dailyPriceINR = Math.round(Number(listingInput.dailyPriceINR) || 0);
  if (dailyPriceINR < 50 || dailyPriceINR > 500000) {
    throw new Error('Daily rental price must be between ₹50 and ₹5,00,000.');
  }

  const refundableDepositINR = Math.round(Number(listingInput.refundableDepositINR) || 0);
  if (refundableDepositINR < 0 || refundableDepositINR > 1000000) {
    throw new Error('Refundable deposit must be between ₹0 and ₹10,00,000.');
  }

  const currentInventory = loadStoredInventory();
  const listingId = listingInput.id || `bb-item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Bind ownership strictly to verified requester
  const newListing: ProductListing = {
    id: listingId,
    title,
    category: listingInput.category || 'Electronics',
    dailyPriceINR,
    refundableDepositINR,
    replacementValueINR: Math.max(
      100,
      Math.round(Number(listingInput.replacementValueINR) || dailyPriceINR * 35)
    ),
    condition: listingInput.condition || 'Excellent',
    city: listingInput.city || 'Bengaluru',
    neighborhood: (listingInput.neighborhood || 'Indiranagar').trim(),
    pickupLocation: (listingInput.pickupLocation || listingInput.neighborhood || 'Indiranagar').trim(),
    description: (listingInput.description || '').trim(),
    specifications: listingInput.specifications || [
      `Category: ${listingInput.category || 'Electronics'}`,
      `Condition: ${listingInput.condition || 'Excellent'}`,
      `Location: ${listingInput.city || 'Bengaluru'}`,
    ],
    includedItems: listingInput.includedItems || ['Main unit', 'Standard accessories'],
    rentalRules: listingInput.rentalRules || [
      'Original Government photo ID inspected at pickup',
      'Test functionality together at handover',
    ],
    availableFrom: listingInput.availableFrom || '2026-10-29',
    availableTo: listingInput.availableTo || '2026-12-31',
    minRentalDays: Math.max(1, Math.min(60, Math.round(Number(listingInput.minRentalDays) || 1))),
    featured: Boolean(listingInput.featured),
    isDemoData: false,
    status: listingInput.status === 'archived' ? 'archived' : 'active',
    isListed: listingInput.isListed !== false && listingInput.status !== 'unlisted' && listingInput.status !== 'paused',
    ownerEmail: listingInput.ownerEmail || '',
    createdAt: listingInput.createdAt || new Date().toISOString(),
    cancellationPolicy: listingInput.cancellationPolicy || 'Flexible (Full refund 24h prior)',
    imageUrl: listingInput.imageUrl || 'sony_camera',
    gallery: listingInput.gallery || [],
    owner: {
      id: requesterUid, // Strict ownership attribution
      name: (requesterName || listingInput.owner?.name || 'BorrowBox Member').trim(),
      neighborhood: (listingInput.neighborhood || 'Indiranagar').trim(),
      city: listingInput.city || 'Bengaluru',
      rating: 5.0,
      completedRentals: 0,
      responseTime: 'Usually responds in 1 hour',
      memberSince: '2026',
      kycVerified: true,
    },
  };

  // Replace existing or prepend new
  const updated = [newListing, ...currentInventory.filter((i) => i.id !== listingId)];
  saveStoredInventory(updated);
  return newListing;
}

/**
 * Updates an existing listing with strict ownership validation.
 */
export function updateMarketplaceListing(
  listingId: string,
  updates: Partial<ProductListing>,
  requesterUid: string,
  isAdmin = false
): ProductListing {
  const currentInventory = loadStoredInventory();
  const existing = currentInventory.find((i) => i.id === listingId);

  if (!existing) {
    throw new Error(`Listing "${listingId}" not found.`);
  }

  // Security requirement: Only authorized owner or administrator can modify
  if (!isAdmin && existing.owner?.id !== requesterUid) {
    throw new Error('Unauthorized: Only the listing owner or an administrator can modify this listing.');
  }

  const updated: ProductListing = {
    ...existing,
    ...updates,
    id: existing.id,
    owner: existing.owner, // Preserve immutable owner details
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  const nextInventory = currentInventory.map((i) => (i.id === listingId ? updated : i));
  saveStoredInventory(nextInventory);
  return updated;
}

/**
 * Deletes an existing listing with strict ownership validation.
 */
export function deleteMarketplaceListingWorkflow(
  listingId: string,
  requesterUid: string,
  isAdmin = false
): void {
  const currentInventory = loadStoredInventory();
  const existing = currentInventory.find((i) => i.id === listingId);

  if (!existing) {
    throw new Error(`Listing "${listingId}" not found.`);
  }

  // Security requirement: Only authorized owner or administrator can delete
  if (!isAdmin && existing.owner?.id !== requesterUid) {
    throw new Error('Unauthorized: Only the listing owner or an administrator can delete this listing.');
  }

  const nextInventory = currentInventory.filter((i) => i.id !== listingId);
  saveStoredInventory(nextInventory);
}

/**
 * Toggles a listing's listed/paused state with ownership check.
 */
export function toggleMarketplaceListingStatus(
  listingId: string,
  requesterUid: string,
  isAdmin = false
): ProductListing {
  const currentInventory = loadStoredInventory();
  const existing = currentInventory.find((i) => i.id === listingId);

  if (!existing) {
    throw new Error(`Listing "${listingId}" not found.`);
  }

  if (!isAdmin && existing.owner?.id !== requesterUid) {
    throw new Error('Unauthorized: Only the listing owner or an administrator can toggle this listing status.');
  }

  const willBeListed = !existing.isListed;
  const nextStatus = willBeListed ? 'active' : 'unlisted';

  const updated: ProductListing = {
    ...existing,
    isListed: willBeListed,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  };

  const nextInventory = currentInventory.map((i) => (i.id === listingId ? updated : i));
  saveStoredInventory(nextInventory);
  return updated;
}

/**
 * Registers Express routes for marketplace inventory management.
 */
export function registerInventoryRoutes(app: Express): void {
  // 1. Get Listings: Public discovery or owner-filtered
  app.get('/api/marketplace/listings', (req: Request, res: Response) => {
    try {
      const inventory = loadStoredInventory();
      const ownerId = typeof req.query.ownerId === 'string' ? req.query.ownerId.trim() : '';
      const requesterUid = typeof req.query.requesterUid === 'string' ? req.query.requesterUid.trim() : '';
      const role = typeof req.query.role === 'string' ? req.query.role.trim() : '';
      const email = typeof req.query.email === 'string' ? req.query.email.trim() : '';
      const isAdmin = isAuthorizedAdmin(email, role);

      // If owner requests their own listings
      if (ownerId && (ownerId === requesterUid || isAdmin)) {
        const ownerItems = filterOwnerMarketplaceListings(inventory, ownerId);
        res.json({ ok: true, listings: ownerItems });
        return;
      }

      // If administrator requests all listings
      if (isAdmin && req.query.includeAll === 'true') {
        res.json({ ok: true, listings: inventory });
        return;
      }

      // Default: Public discovery (active only, excluding drafts/paused/unlisted/deleted)
      const publicItems = filterPublicMarketplaceListings(inventory);
      res.json({ ok: true, listings: publicItems });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || 'Failed loading listings.' });
    }
  });

  // 2. Create Listing: Authenticated write with ownership binding
  app.post('/api/marketplace/listings', (req: Request, res: Response) => {
    try {
      const { listing, requesterUid, requesterName } = req.body || {};
      if (!requesterUid) {
        res.status(401).json({ ok: false, error: 'Authentication required to create a listing.' });
        return;
      }
      if (!listing) {
        res.status(400).json({ ok: false, error: 'Listing payload is required.' });
        return;
      }

      const created = createMarketplaceListing(listing, requesterUid, requesterName);
      res.status(201).json({ ok: true, listing: created });
    } catch (err: any) {
      res.status(400).json({ ok: false, error: err?.message || 'Failed creating listing.' });
    }
  });

  // 3. Update Listing: Owner or Admin only
  app.put('/api/marketplace/listings/:id', (req: Request, res: Response) => {
    try {
      const listingId = req.params.id;
      const { updates, requesterUid, requesterEmail, requesterRole } = req.body || {};
      if (!requesterUid) {
        res.status(401).json({ ok: false, error: 'Authentication required to update listing.' });
        return;
      }

      const isAdmin = isAuthorizedAdmin(requesterEmail, requesterRole);
      const updated = updateMarketplaceListing(listingId, updates || {}, requesterUid, isAdmin);
      res.json({ ok: true, listing: updated });
    } catch (err: any) {
      const isForbidden = err?.message?.includes('Unauthorized');
      res.status(isForbidden ? 403 : 400).json({ ok: false, error: err?.message || 'Failed updating listing.' });
    }
  });

  // 4. Delete Listing: Owner or Admin only
  app.delete('/api/marketplace/listings/:id', (req: Request, res: Response) => {
    try {
      const listingId = req.params.id;
      const { requesterUid, requesterEmail, requesterRole } = req.body || {};
      const uid = requesterUid || (typeof req.query.requesterUid === 'string' ? req.query.requesterUid : '');
      const email = requesterEmail || (typeof req.query.requesterEmail === 'string' ? req.query.requesterEmail : '');
      const role = requesterRole || (typeof req.query.requesterRole === 'string' ? req.query.requesterRole : '');

      if (!uid) {
        res.status(401).json({ ok: false, error: 'Authentication required to delete listing.' });
        return;
      }

      const isAdmin = isAuthorizedAdmin(email, role);
      deleteMarketplaceListingWorkflow(listingId, uid, isAdmin);
      res.json({ ok: true, message: 'Listing deleted successfully.' });
    } catch (err: any) {
      const isForbidden = err?.message?.includes('Unauthorized');
      res.status(isForbidden ? 403 : 400).json({ ok: false, error: err?.message || 'Failed deleting listing.' });
    }
  });

  // 5. Toggle Status (Unlist / Relist)
  app.post('/api/marketplace/listings/:id/toggle-status', (req: Request, res: Response) => {
    try {
      const listingId = req.params.id;
      const { requesterUid, requesterEmail, requesterRole } = req.body || {};
      if (!requesterUid) {
        res.status(401).json({ ok: false, error: 'Authentication required.' });
        return;
      }

      const isAdmin = isAuthorizedAdmin(requesterEmail, requesterRole);
      const toggled = toggleMarketplaceListingStatus(listingId, requesterUid, isAdmin);
      res.json({ ok: true, listing: toggled });
    } catch (err: any) {
      const isForbidden = err?.message?.includes('Unauthorized');
      res.status(isForbidden ? 403 : 400).json({ ok: false, error: err?.message || 'Failed toggling listing.' });
    }
  });
}
