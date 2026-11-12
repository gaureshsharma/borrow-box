import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMarketplaceListing,
  updateMarketplaceListing,
  deleteMarketplaceListingWorkflow,
  toggleMarketplaceListingStatus,
  filterPublicMarketplaceListings,
  filterOwnerMarketplaceListings,
  isAuthorizedAdmin,
} from './inventoryBackend.ts';
import { ProductListing } from '../types/marketplace.ts';

test('Inventory Delete Workflow: verifies owner authorization and deletion logic', () => {
  interface MockListing {
    id: string;
    title: string;
    ownerId: string;
    status: string;
  }

  let inventory: MockListing[] = [
    { id: 'item-1', title: 'Sony Alpha Camera', ownerId: 'user-123', status: 'active' },
    { id: 'item-2', title: 'PS5 Console', ownerId: 'user-456', status: 'active' },
  ];

  // 1. Unauthorized attempt (different user)
  const tryDelete = (itemId: string, requesterId: string) => {
    const item = inventory.find((i) => i.id === itemId);
    if (!item) throw new Error('Not found');
    if (item.ownerId !== requesterId) {
      throw new Error('Unauthorized');
    }
    inventory = inventory.filter((i) => i.id !== itemId);
  };

  assert.throws(
    () => tryDelete('item-1', 'unauthorized-user'),
    /Unauthorized/
  );
  assert.equal(inventory.length, 2);

  // 2. Authorized deletion
  tryDelete('item-1', 'user-123');
  assert.equal(inventory.length, 1);
  assert.equal(inventory[0].id, 'item-2');
});

test('Marketplace Cross-Account Visibility & Moderation Policy', () => {
  const userA_id = 'user-a-101';
  const userB_id = 'user-b-202';
  const userC_id = 'user-c-303';

  // 1. User A creates an active listing
  const listingA = createMarketplaceListing(
    {
      id: 'test-item-a',
      title: 'Sony FX3 Cinema Camera Kit',
      category: 'Photography',
      dailyPriceINR: 3500,
      refundableDepositINR: 15000,
      city: 'Bengaluru',
      neighborhood: 'Koramangala',
      description: 'Professional 4K full frame cinema camera kit with 24-70mm lens.',
      status: 'active',
      isListed: true,
    },
    userA_id,
    'User A'
  );

  assert.equal(listingA.owner.id, userA_id);
  assert.equal(listingA.status, 'active');

  // 2. Listing appears in User A's My Listings
  const mockInventory: ProductListing[] = [
    listingA,
    {
      ...listingA,
      id: 'test-item-draft',
      title: 'Draft DJ Controller',
      status: 'draft',
      isListed: false,
    },
    {
      ...listingA,
      id: 'test-item-paused',
      title: 'Paused Drone 4K',
      status: 'paused',
      isListed: false,
    },
    {
      ...listingA,
      id: 'test-item-pending',
      title: 'Pending Lighting Kit',
      status: 'pending',
      isListed: true,
    },
    {
      ...listingA,
      id: 'test-item-rejected',
      title: 'Rejected Projector',
      status: 'rejected',
      isListed: false,
    },
    {
      ...listingA,
      id: 'test-item-unlisted',
      title: 'Unlisted Sound System',
      status: 'unlisted',
      isListed: false,
    },
    {
      ...listingA,
      id: 'test-item-archived',
      title: 'Archived Tent',
      status: 'archived',
      isListed: false,
    },
  ];

  const userAListings = filterOwnerMarketplaceListings(mockInventory, userA_id);
  assert.equal(userAListings.length, 7, 'User A sees all their own listings (including paused and drafts)');

  // 3. User B discovers it in Browse (Public discovery strictly filters out non-active items)
  const publicBrowseItems = filterPublicMarketplaceListings(mockInventory);
  assert.equal(publicBrowseItems.length, 1);
  assert.equal(publicBrowseItems[0].id, 'test-item-a');
  assert.equal(publicBrowseItems[0].title, 'Sony FX3 Cinema Camera Kit');

  // 4. User C can find it through search query
  const searchQuery = 'cinema camera';
  const searchResults = publicBrowseItems.filter((i) =>
    i.title.toLowerCase().includes(searchQuery) ||
    i.description.toLowerCase().includes(searchQuery)
  );
  assert.equal(searchResults.length, 1);
  assert.equal(searchResults[0].id, 'test-item-a');

  // 5. Unauthorized User B cannot modify or delete User A's listing
  assert.throws(
    () => updateMarketplaceListing('test-item-a', { title: 'Hacked Title' }, userB_id, false),
    /Unauthorized/
  );
  assert.throws(
    () => deleteMarketplaceListingWorkflow('test-item-a', userB_id, false),
    /Unauthorized/
  );
  assert.throws(
    () => toggleMarketplaceListingStatus('test-item-a', userB_id, false),
    /Unauthorized/
  );

  // 6. Authorized Super Admin can manage any listing
  assert.ok(isAuthorizedAdmin('gaureshsharma6@gmail.com', 'super_admin'));
  assert.ok(isAuthorizedAdmin('marukrutarth@gmail.com', 'super_admin'));
  assert.ok(!isAuthorizedAdmin('randomuser@gmail.com', 'user'));

  // 7. Authorized owner User A can update and delete their own listing
  const updatedByOwner = updateMarketplaceListing(
    'test-item-a',
    { dailyPriceINR: 3200 },
    userA_id,
    false
  );
  assert.equal(updatedByOwner.dailyPriceINR, 3200);

  deleteMarketplaceListingWorkflow('test-item-a', userA_id, false);
});
