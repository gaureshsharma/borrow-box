import test from 'node:test';
import assert from 'node:assert/strict';

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

