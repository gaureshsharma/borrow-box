import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DEMO_PRODUCT_LISTINGS } from '../src/data/demoCatalog.ts';

// In-memory / serverless warm cache for shared community listings across Vercel requests
const serverlessCommunityInventory: any[] = [...DEMO_PRODUCT_LISTINGS];

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method } = req;
  const idFromUrl = typeof req.query.id === 'string' ? req.query.id : '';

  try {
    if (method === 'GET') {
      const ownerId = typeof req.query.ownerId === 'string' ? req.query.ownerId.trim() : '';
      const requesterUid = typeof req.query.requesterUid === 'string' ? req.query.requesterUid.trim() : '';

      // Owner requests their own items
      if (ownerId && ownerId === requesterUid) {
        const ownerItems = serverlessCommunityInventory.filter((i) => i.owner?.id === ownerId);
        res.status(200).json({ ok: true, listings: ownerItems });
        return;
      }

      // Public browse: filter out unlisted, paused, archived, draft, pending, rejected
      const publicItems = serverlessCommunityInventory.filter((item) => {
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

      res.status(200).json({ ok: true, listings: publicItems });
      return;
    }

    if (method === 'POST') {
      const { listing, requesterUid, requesterName } = req.body || {};
      if (!requesterUid) {
        res.status(401).json({ ok: false, error: 'Authentication required to create a listing.' });
        return;
      }
      if (!listing) {
        res.status(400).json({ ok: false, error: 'Listing payload is required.' });
        return;
      }

      const listingId = listing.id || `bb-item-${Date.now()}`;
      const newListing = {
        ...listing,
        id: listingId,
        status: listing.status || 'active',
        isListed: listing.isListed !== false && listing.status !== 'unlisted' && listing.status !== 'paused',
        owner: {
          ...listing.owner,
          id: requesterUid, // Strict ownership attribution
          name: requesterName || listing.owner?.name || 'BorrowBox Member',
        },
      };

      const existingIndex = serverlessCommunityInventory.findIndex((i) => i.id === listingId);
      if (existingIndex >= 0) {
        serverlessCommunityInventory[existingIndex] = newListing;
      } else {
        serverlessCommunityInventory.unshift(newListing);
      }

      res.status(201).json({ ok: true, listing: newListing });
      return;
    }

    if (method === 'PUT') {
      const targetId = idFromUrl || req.body?.listing?.id || req.body?.updates?.id;
      const { updates, requesterUid } = req.body || {};
      const target = serverlessCommunityInventory.find((i) => i.id === targetId);

      if (!target) {
        res.status(404).json({ ok: false, error: 'Listing not found.' });
        return;
      }

      if (target.owner?.id !== requesterUid) {
        res.status(403).json({ ok: false, error: 'Unauthorized: Only owner can modify.' });
        return;
      }

      const updated = { ...target, ...updates, id: target.id, owner: target.owner };
      const idx = serverlessCommunityInventory.findIndex((i) => i.id === targetId);
      serverlessCommunityInventory[idx] = updated;

      res.status(200).json({ ok: true, listing: updated });
      return;
    }

    if (method === 'DELETE') {
      const targetId = idFromUrl || req.body?.id;
      const { requesterUid } = req.body || {};
      const target = serverlessCommunityInventory.find((i) => i.id === targetId);

      if (!target) {
        res.status(404).json({ ok: false, error: 'Listing not found.' });
        return;
      }

      if (requesterUid && target.owner?.id !== requesterUid) {
        res.status(403).json({ ok: false, error: 'Unauthorized: Only owner can delete.' });
        return;
      }

      const idx = serverlessCommunityInventory.findIndex((i) => i.id === targetId);
      if (idx >= 0) {
        serverlessCommunityInventory.splice(idx, 1);
      }

      res.status(200).json({ ok: true, message: 'Deleted.' });
      return;
    }

    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Server error' });
  }
}
