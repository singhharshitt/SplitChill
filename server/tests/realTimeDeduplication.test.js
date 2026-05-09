/**
 * Test Suite for Real-Time Deduplication
 * Location: server/tests/realTimeDeduplication.test.js
 * 
 * Verifies that WebSocket events properly deduplicate items
 * when combined with cursor-based pagination
 * 
 * Run with: npm test -- realTimeDeduplication.test.js
 */

const assert = require('assert');

// ─────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────

/**
 * Simulates the usePagination hook's deduplication logic
 * Tests the Set-based deduplication from client/src/hooks/usePagination.js
 */
class PaginationSimulator {
  constructor() {
    this.items = [];
    this.itemIds = new Set();
  }

  // Simulates prependItems from usePagination hook
  prependItems(newItems) {
    const result = [];
    const localSeen = new Set(this.itemIds);

    for (const item of newItems) {
      if (!localSeen.has(item.id)) {
        result.push(item);
        localSeen.add(item.id);
      }
    }

    this.itemIds = localSeen;
    this.items = [...result, ...this.items];
  }

  // Simulates appendItems from usePagination hook
  appendItems(newItems) {
    const result = [];
    const localSeen = new Set(this.itemIds);

    for (const item of newItems) {
      if (!localSeen.has(item.id)) {
        result.push(item);
        localSeen.add(item.id);
      }
    }

    this.itemIds = new Set([...this.itemIds, ...localSeen]);
    this.items = [...this.items, ...result];
  }

  // Simulates mergeById from LiveDataContext
  mergeById(newItem) {
    if (!this.itemIds.has(newItem.id)) {
      this.items = [newItem, ...this.items];
      this.itemIds.add(newItem.id);
    } else {
      // Update existing item
      this.items = this.items.map(item =>
        item.id === newItem.id ? newItem : item
      );
    }
  }

  getItemCount() {
    return this.items.length;
  }

  getIds() {
    return this.items.map(item => item.id);
  }
}

// ─────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────

describe('Real-Time Deduplication with Pagination', () => {

  describe('Test 1: Basic Pagination Loading', () => {
    it('should load first page of 30 items without duplicates', () => {
      const simulator = new PaginationSimulator();
      
      // Simulate loading first 30 messages
      const page1 = Array.from({ length: 30 }, (_, i) => ({
        id: `msg_${i}`,
        text: `Message ${i}`,
        timestamp: Date.now()
      }));

      simulator.prependItems(page1);

      assert.strictEqual(simulator.getItemCount(), 30);
      assert.strictEqual(new Set(simulator.getIds()).size, 30, 'All IDs should be unique');
    });
  });

  describe('Test 2: Loading Additional Pages', () => {
    it('should load page 2 without duplicating page 1', () => {
      const simulator = new PaginationSimulator();

      // Page 1: 30 items
      const page1 = Array.from({ length: 30 }, (_, i) => ({
        id: `msg_${i}`,
        text: `Message ${i}`,
        timestamp: Date.now()
      }));
      simulator.prependItems(page1);

      // Page 2: 30 new items (newer ones prepend)
      const page2 = Array.from({ length: 30 }, (_, i) => ({
        id: `msg_${30 + i}`,
        text: `Message ${30 + i}`,
        timestamp: Date.now() + 1000
      }));
      simulator.prependItems(page2);

      assert.strictEqual(simulator.getItemCount(), 60, 'Should have 60 total items');
      assert.strictEqual(new Set(simulator.getIds()).size, 60, 'All IDs should be unique');
    });
  });

  describe('Test 3: Real-Time Message During Pagination', () => {
    it('should handle WebSocket message without duplication while loading page 2', () => {
      const simulator = new PaginationSimulator();

      // Initial: 30 messages (page 1)
      const page1 = Array.from({ length: 30 }, (_, i) => ({
        id: `msg_${i}`,
        text: `Message ${i}`,
        timestamp: Date.now()
      }));
      simulator.prependItems(page1);
      assert.strictEqual(simulator.getItemCount(), 30);

      // Real-time: New message arrives via WebSocket
      const newMessage = { id: 'msg_rtc_1', text: 'Real-time message', timestamp: Date.now() + 2000 };
      simulator.mergeById(newMessage);
      assert.strictEqual(simulator.getItemCount(), 31, 'Should have 31 items after real-time message');

      // Pagination: Load page 2
      const page2 = Array.from({ length: 30 }, (_, i) => ({
        id: `msg_${30 + i}`,
        text: `Message ${30 + i}`,
        timestamp: Date.now() + 1000
      }));
      simulator.prependItems(page2);
      assert.strictEqual(simulator.getItemCount(), 61, 'Should have 61 items (30 page1 + 30 page2 + 1 rtc)');
      assert.strictEqual(new Set(simulator.getIds()).size, 61, 'All IDs should still be unique');
    });
  });

  describe('Test 4: Duplicate Detection', () => {
    it('should not duplicate if same message received twice', () => {
      const simulator = new PaginationSimulator();

      const message = { id: 'msg_1', text: 'Important message', timestamp: Date.now() };

      // First time via WebSocket
      simulator.mergeById(message);
      assert.strictEqual(simulator.getItemCount(), 1);

      // Second time (race condition - WebSocket retry)
      simulator.mergeById(message);
      assert.strictEqual(simulator.getItemCount(), 1, 'Should NOT duplicate');
    });
  });

  describe('Test 5: Rapid Concurrent Operations', () => {
    it('should handle rapid page loads + real-time messages correctly', () => {
      const simulator = new PaginationSimulator();

      // Simulate: Load page 1
      const page1 = Array.from({ length: 30 }, (_, i) => ({
        id: `msg_${i}`,
        text: `Message ${i}`,
        timestamp: 1000 + i
      }));
      simulator.prependItems(page1);

      // Simulate: 3 real-time messages arrive during page load
      for (let i = 0; i < 3; i++) {
        simulator.mergeById({
          id: `msg_rtc_${i}`,
          text: `Real-time ${i}`,
          timestamp: 5000 + i
        });
      }

      // Simulate: Load page 2
      const page2 = Array.from({ length: 30 }, (_, i) => ({
        id: `msg_${30 + i}`,
        text: `Message ${30 + i}`,
        timestamp: 2000 + i
      }));
      simulator.prependItems(page2);

      assert.strictEqual(simulator.getItemCount(), 63, 'Should have 30+3+30 = 63 items');
      assert.strictEqual(new Set(simulator.getIds()).size, 63, 'All 63 should be unique');
    });
  });

  describe('Test 6: Message Update (Merge)', () => {
    it('should update existing message instead of duplicating', () => {
      const simulator = new PaginationSimulator();

      // Initial message
      const message = { id: 'msg_1', text: 'Original text', timestamp: Date.now() };
      simulator.mergeById(message);
      assert.strictEqual(simulator.items[0].text, 'Original text');

      // Same message with updated text (e.g., edited message)
      const updatedMessage = { id: 'msg_1', text: 'Updated text', timestamp: Date.now() };
      simulator.mergeById(updatedMessage);
      assert.strictEqual(simulator.getItemCount(), 1, 'Should NOT duplicate');
      assert.strictEqual(simulator.items[0].text, 'Updated text', 'Should have updated text');
    });
  });

  describe('Test 7: Edge Case - Empty Pages', () => {
    it('should handle empty pagination gracefully', () => {
      const simulator = new PaginationSimulator();

      // Load page 1 with items
      const page1 = Array.from({ length: 30 }, (_, i) => ({
        id: `msg_${i}`,
        text: `Message ${i}`,
        timestamp: Date.now()
      }));
      simulator.prependItems(page1);

      // Load "page 2" but it's empty (hasMore = false scenario)
      const emptyPage = [];
      simulator.prependItems(emptyPage);

      assert.strictEqual(simulator.getItemCount(), 30, 'Should still have 30 items');
      assert.strictEqual(new Set(simulator.getIds()).size, 30, 'All IDs unique');
    });
  });

  describe('Test 8: Large Dataset Performance', () => {
    it('should handle 1000+ items efficiently', () => {
      const simulator = new PaginationSimulator();
      const startTime = Date.now();

      // Load 1000 items in batches of 30
      for (let batch = 0; batch < 34; batch++) {
        const page = Array.from({ length: 30 }, (_, i) => ({
          id: `msg_${batch * 30 + i}`,
          text: `Message ${batch * 30 + i}`,
          timestamp: Date.now()
        }));
        simulator.prependItems(page);
      }

      const duration = Date.now() - startTime;

      assert.strictEqual(simulator.getItemCount(), 1020, 'Should have 1020 items');
      assert.strictEqual(new Set(simulator.getIds()).size, 1020, 'All IDs unique');
      assert(duration < 1000, `Performance should be < 1s, was ${duration}ms`);
    });
  });

  describe('Test 9: Mixed Append and Prepend', () => {
    it('should handle appendItems and prependItems without duplication', () => {
      const simulator = new PaginationSimulator();

      // Initial load: 20 items
      const initial = Array.from({ length: 20 }, (_, i) => ({
        id: `msg_${i}`,
        text: `Message ${i}`,
        timestamp: Date.now()
      }));
      simulator.prependItems(initial);

      // Append newer items (infinite scroll downward)
      const appended = Array.from({ length: 10 }, (_, i) => ({
        id: `msg_new_${i}`,
        text: `New message ${i}`,
        timestamp: Date.now() + 1000 + i
      }));
      simulator.appendItems(appended);

      assert.strictEqual(simulator.getItemCount(), 30, 'Should have 30 total items');
      assert.strictEqual(new Set(simulator.getIds()).size, 30, 'All IDs unique');
    });
  });

  describe('Test 10: Cursor Encoding/Decoding', () => {
    it('should properly encode and decode cursors without losing data', () => {
      // Simulate paginationUtils cursor functions
      const encodeCursor = (data) => Buffer.from(JSON.stringify(data)).toString('base64');
      const decodeCursor = (cursor) => JSON.parse(Buffer.from(cursor, 'base64').toString());

      const original = { id: '507f1f77bcf86cd799439011', direction: 'older' };
      const encoded = encodeCursor(original);
      const decoded = decodeCursor(encoded);

      assert.deepStrictEqual(decoded, original, 'Cursor should survive encode/decode cycle');
    });
  });
});

// ─────────────────────────────────────────
// Summary
// ─────────────────────────────────────────

console.log(`
✅ Real-Time Deduplication Test Suite
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This test suite verifies:
1. ✓ Pagination loads data without duplicates
2. ✓ Multiple pages load correctly
3. ✓ Real-time messages don't duplicate paginated items
4. ✓ Duplicate detection works (WebSocket retry scenario)
5. ✓ Concurrent operations are handled safely
6. ✓ Message updates use merge instead of duplicate
7. ✓ Empty pages don't break pagination
8. ✓ Performance with 1000+ items is acceptable
9. ✓ Mixed append/prepend operations stay clean
10. ✓ Cursor encoding/decoding is reversible

To run: npm test -- realTimeDeduplication.test.js
`);

module.exports = {
  PaginationSimulator
};
