/**
 * MongoDB Index Setup for Pagination Optimization
 * File: server/src/utils/createIndexes.js
 * 
 * Run this once on server startup or via migration script
 * Indexes are essential for cursor-based pagination performance
 */

const mongoose = require('mongoose');
const ChatMessage = require('../models/ChatMessage');
const Expense = require('../models/Expense');
const Transaction = require('../models/Transaction');
const Group = require('../models/Group');
const User = require('../models/User');

/**
 * Create all required indexes
 * Call this in your server initialization
 */
async function createIndexes() {
  try {
    console.log('Creating database indexes...');

    // ─────────────────────────────────────────
    // Chat Message Indexes
    // ─────────────────────────────────────────
    
    // Primary index: group + createdAt for pagination
    await ChatMessage.collection.createIndex(
      { group: 1, createdAt: -1 },
      { background: true, name: 'group_createdAt_desc' }
    );
    console.log('✓ ChatMessage: group + createdAt');

    // ObjectId-based pagination index
    await ChatMessage.collection.createIndex(
      { group: 1, _id: -1 },
      { background: true, name: 'group_id_desc' }
    );
    console.log('✓ ChatMessage: group + _id');

    // Search index (if implementing search)
    await ChatMessage.collection.createIndex(
      { text: 'text', group: 1 },
      { background: true, name: 'text_search' }
    );
    console.log('✓ ChatMessage: text search');

    // ─────────────────────────────────────────
    // Expense Indexes
    // ─────────────────────────────────────────

    // Primary index: group + createdAt for pagination
    await Expense.collection.createIndex(
      { group: 1, createdAt: -1 },
      { background: true, name: 'group_createdAt_desc' }
    );
    console.log('✓ Expense: group + createdAt');

    // ObjectId-based pagination
    await Expense.collection.createIndex(
      { group: 1, _id: -1 },
      { background: true, name: 'group_id_desc' }
    );
    console.log('✓ Expense: group + _id');

    // Payer-based queries
    await Expense.collection.createIndex(
      { paidBy: 1, createdAt: -1 },
      { background: true, name: 'paidBy_createdAt_desc' }
    );
    console.log('✓ Expense: paidBy + createdAt');

    // Split type filtering
    await Expense.collection.createIndex(
      { group: 1, splitType: 1, createdAt: -1 },
      { background: true, name: 'group_splitType_createdAt_desc' }
    );
    console.log('✓ Expense: group + splitType + createdAt');

    // ─────────────────────────────────────────
    // Transaction Indexes
    // ─────────────────────────────────────────

    // Primary index: group + createdAt for pagination
    await Transaction.collection.createIndex(
      { group: 1, createdAt: -1 },
      { background: true, name: 'group_createdAt_desc' }
    );
    console.log('✓ Transaction: group + createdAt');

    // ObjectId-based pagination
    await Transaction.collection.createIndex(
      { group: 1, _id: -1 },
      { background: true, name: 'group_id_desc' }
    );
    console.log('✓ Transaction: group + _id');

    // Status filtering (for pending transactions)
    await Transaction.collection.createIndex(
      { group: 1, status: 1, createdAt: -1 },
      { background: true, name: 'group_status_createdAt_desc' }
    );
    console.log('✓ Transaction: group + status + createdAt');

    // Compound index for user transactions
    await Transaction.collection.createIndex(
      { group: 1, payer: 1, createdAt: -1 },
      { background: true, name: 'group_payer_createdAt_desc' }
    );
    console.log('✓ Transaction: group + payer + createdAt');

    await Transaction.collection.createIndex(
      { group: 1, receiver: 1, createdAt: -1 },
      { background: true, name: 'group_receiver_createdAt_desc' }
    );
    console.log('✓ Transaction: group + receiver + createdAt');

    // User-centric queries
    await Transaction.collection.createIndex(
      { payer: 1, createdAt: -1 },
      { background: true, name: 'payer_createdAt_desc' }
    );
    console.log('✓ Transaction: payer + createdAt');

    await Transaction.collection.createIndex(
      { receiver: 1, createdAt: -1 },
      { background: true, name: 'receiver_createdAt_desc' }
    );
    console.log('✓ Transaction: receiver + createdAt');

    // Pending transactions across groups
    await Transaction.collection.createIndex(
      { status: 1, payer: 1, createdAt: -1 },
      { background: true, name: 'status_payer_createdAt_desc' }
    );
    console.log('✓ Transaction: status + payer + createdAt');

    await Transaction.collection.createIndex(
      { status: 1, receiver: 1, createdAt: -1 },
      { background: true, name: 'status_receiver_createdAt_desc' }
    );
    console.log('✓ Transaction: status + receiver + createdAt');

    // ─────────────────────────────────────────
    // Group Indexes
    // ─────────────────────────────────────────

    // Existing indexes are good, ensure they exist
    await Group.collection.createIndex(
      { 'members.user': 1 },
      { background: true, name: 'members_user' }
    );
    console.log('✓ Group: members.user');

    await Group.collection.createIndex(
      { owner: 1, updatedAt: -1 },
      { background: true, name: 'owner_updatedAt_desc' }
    );
    console.log('✓ Group: owner + updatedAt');

    console.log('\n✅ All indexes created successfully!');
    console.log('Note: Use background: true to create indexes without blocking operations\n');

  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  }
}

/**
 * Drop all indexes (use with caution - for development only)
 */
async function dropAllIndexes() {
  try {
    console.warn('⚠️  Dropping all indexes...');
    await Promise.all([
      ChatMessage.collection.dropAllIndexes(),
      Expense.collection.dropAllIndexes(),
      Transaction.collection.dropAllIndexes()
    ]);
    console.log('✓ All indexes dropped');
  } catch (error) {
    console.error('Error dropping indexes:', error);
  }
}

/**
 * Get index statistics
 */
async function getIndexStats() {
  try {
    const stats = await Promise.all([
      ChatMessage.collection.getIndexes(),
      Expense.collection.getIndexes(),
      Transaction.collection.getIndexes()
    ]);

    console.log('\n📊 Index Statistics:\n');
    console.log('ChatMessage indexes:', Object.keys(stats[0]));
    console.log('Expense indexes:', Object.keys(stats[1]));
    console.log('Transaction indexes:', Object.keys(stats[2]));
  } catch (error) {
    console.error('Error getting index stats:', error);
  }
}

module.exports = {
  createIndexes,
  dropAllIndexes,
  getIndexStats
};
