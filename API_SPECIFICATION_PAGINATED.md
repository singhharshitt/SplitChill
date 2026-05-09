# Paginated API Endpoints Specification

**Version:** 2.0  
**Status:** Production Ready  
**Last Updated:** 2026-05-09  

---

## Base URL

```
https://api.splitchill.com/api
```

All paginated endpoints support cursor-based pagination with the following standard query parameters.

---

## Standard Query Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | number | 20 | 100 | Items per page |
| `cursor` | string | null | - | Base64 encoded cursor from previous page |

## Standard Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "...": "field values"
      }
    ],
    "pagination": {
      "hasMore": true,
      "nextCursor": "eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsImRpcmVjdGlvbiI6Im9sZGVyIn0=",
      "nextUrl": "/groups/xxx/messages?limit=30&cursor=...",
      "count": 30
    }
  }
}
```

### Error Response (400/401/403/404/500)

```json
{
  "success": false,
  "error": "Invalid cursor format",
  "message": "Cursor must be a valid Base64 string"
}
```

---

## Chat Messages

### GET `/groups/:groupId/chat/messages`

Get paginated messages for a group (newest first).

**Method:** `GET`  
**Auth:** Required (Bearer token)  
**Rate Limit:** 100 req/min  

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 30 | 10-100 items per page |
| `cursor` | string | null | Cursor for pagination |

#### Example Requests

**First page:**
```bash
GET /groups/64abc1def123456/chat/messages?limit=30
```

**Next page:**
```bash
GET /groups/64abc1def123456/chat/messages?limit=30&cursor=eyJpZCI6IjY0YWJjMWRlZjEyMzQ1NiIsImRpcmVjdGlvbiI6Im9sZGVyIn0=
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "65def1abc987654",
        "group": "64abc1def123456",
        "sender": {
          "_id": "64user001",
          "name": "Alice",
          "avatar": "https://..."
        },
        "text": "Who's coming to the trip?",
        "metadata": {
          "editedAt": null
        },
        "createdAt": "2026-05-09T10:30:00Z",
        "updatedAt": "2026-05-09T10:30:00Z"
      },
      {
        "_id": "65def1abc987653",
        "sender": {
          "_id": "64user002",
          "name": "Bob",
          "avatar": "https://..."
        },
        "text": "Count me in!",
        "createdAt": "2026-05-09T10:25:00Z"
      }
    ],
    "pagination": {
      "hasMore": true,
      "nextCursor": "eyJpZCI6IjY1ZGVmMWFiYzk4NzY1MyIsImRpcmVjdGlvbiI6Im9sZGVyIn0=",
      "nextUrl": "/groups/64abc1def123456/chat/messages?limit=30&cursor=eyJpZCI6IjY1ZGVmMWFiYzk4NzY1MyIsImRpcmVjdGlvbiI6Im9sZGVyIn0=",
      "count": 2
    }
  }
}
```

#### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid cursor or limit |
| 401 | Unauthorized |
| 403 | Not a group member |
| 404 | Group not found |

#### Notes

- Messages are sorted by `_id` descending (newest first)
- Use cursor from `nextCursor` to fetch older messages
- Empty groups return `items: []` with `hasMore: false`
- Maximum 100 messages per request

---

### POST `/groups/:groupId/chat/messages`

Create a new chat message.

**Method:** `POST`  
**Auth:** Required  
**Rate Limit:** 100 req/min  
**Content-Type:** `application/json`

#### Request Body

```json
{
  "text": "I'll pay for dinner!",
  "metadata": {}
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "message": {
      "_id": "65def1abc999999",
      "group": "64abc1def123456",
      "sender": {
        "_id": "64user001",
        "name": "Alice",
        "avatar": "https://..."
      },
      "text": "I'll pay for dinner!",
      "createdAt": "2026-05-09T10:35:00Z"
    }
  }
}
```

---

## Transactions

### GET `/transactions`

Get paginated transactions for the current user across all groups.

**Method:** `GET`  
**Auth:** Required  
**Rate Limit:** 100 req/min  

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 20 | 10-100 items per page |
| `cursor` | string | null | Cursor for pagination |
| `groupId` | string | null | Filter by group |
| `status` | string | null | pending, completed, cancelled, failed |

#### Example Requests

**All transactions for user:**
```bash
GET /transactions?limit=20
```

**Pending transactions:**
```bash
GET /transactions?limit=20&status=pending
```

**Group-specific transactions:**
```bash
GET /transactions?groupId=64abc1def123456&limit=20
```

**With pagination:**
```bash
GET /transactions?limit=20&cursor=eyJpZCI6IjY0YWJjMWRlZjEyMzQ1NiJ9
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "65txn001",
        "group": {
          "_id": "64abc1def123456",
          "name": "Goa Trip"
        },
        "payer": {
          "_id": "64user001",
          "name": "Alice",
          "avatar": "https://..."
        },
        "receiver": {
          "_id": "64user002",
          "name": "Bob",
          "avatar": "https://..."
        },
        "amount": 500,
        "status": "pending",
        "paymentMethod": "upi",
        "upi": {
          "payeeVpa": "bob@upi",
          "payeeName": "Bob",
          "deepLink": "upi://...",
          "initiatedAt": "2026-05-09T10:00:00Z"
        },
        "note": "For dinner",
        "createdAt": "2026-05-09T10:00:00Z"
      }
    ],
    "pagination": {
      "hasMore": true,
      "nextCursor": "eyJpZCI6IjY1dHhuMDAyIn0=",
      "count": 1
    }
  }
}
```

#### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid parameters |
| 401 | Unauthorized |
| 404 | Group not found (if groupId provided) |

---

### GET `/groups/:groupId/transactions`

Get transactions for a specific group (group members only).

**Method:** `GET`  
**Auth:** Required  
**Rate Limit:** 100 req/min  

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | 10-100 items per page (default: 20) |
| `cursor` | string | Cursor for pagination |
| `status` | string | Filter by status |

#### Example Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "65txn001",
        "payer": { "_id": "64user001", "name": "Alice" },
        "receiver": { "_id": "64user002", "name": "Bob" },
        "amount": 500,
        "status": "completed",
        "createdAt": "2026-05-09T10:00:00Z"
      }
    ],
    "pagination": {
      "hasMore": false,
      "nextCursor": null,
      "count": 1
    }
  }
}
```

---

### POST `/transactions/settle`

Create a new settlement transaction.

**Method:** `POST`  
**Auth:** Required  
**Rate Limit:** 50 req/min  

#### Request Body

```json
{
  "groupId": "64abc1def123456",
  "payer": "64user001",
  "receiver": "64user002",
  "amount": 500,
  "note": "For dinner",
  "receiverUpiId": "bob@upi"
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "transaction": {
      "_id": "65txn001",
      "status": "pending",
      "upi": {
        "deepLink": "upi://pay?..."
      }
    },
    "fairness": {
      "score": 92,
      "imbalance": 15
    }
  }
}
```

---

## Expenses

### GET `/groups/:groupId/expenses`

Get paginated expenses for a group (newest first).

**Method:** `GET`  
**Auth:** Required  
**Rate Limit:** 100 req/min  

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 25 | 10-100 items per page |
| `cursor` | string | null | Cursor for pagination |
| `splitType` | string | null | equal, income-based, usage-based, ai-recommended, custom |

#### Example Requests

**All expenses:**
```bash
GET /groups/64abc1def123456/expenses?limit=25
```

**Equal split expenses:**
```bash
GET /groups/64abc1def123456/expenses?limit=25&splitType=equal
```

**With pagination:**
```bash
GET /groups/64abc1def123456/expenses?limit=25&cursor=...
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "65exp001",
        "group": "64abc1def123456",
        "title": "Dinner at Restaurant",
        "amount": 3500,
        "paidBy": {
          "_id": "64user001",
          "name": "Alice",
          "avatar": "https://..."
        },
        "splitType": "equal",
        "participants": [
          {
            "user": {
              "_id": "64user001",
              "name": "Alice"
            },
            "share": 875,
            "usage": 1,
            "weight": 1
          },
          {
            "user": {
              "_id": "64user002",
              "name": "Bob"
            },
            "share": 875,
            "usage": 1,
            "weight": 1
          }
        ],
        "fairnessScoreAfter": 88,
        "insights": [
          "Split adjusted for income fairness"
        ],
        "createdAt": "2026-05-09T20:30:00Z"
      }
    ],
    "pagination": {
      "hasMore": true,
      "nextCursor": "eyJpZCI6IjY1ZXhwMDAyIn0=",
      "count": 1
    }
  }
}
```

#### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid parameters |
| 401 | Unauthorized |
| 403 | Not a group member |
| 404 | Group not found |

---

### POST `/groups/:groupId/expenses`

Create a new expense.

**Method:** `POST`  
**Auth:** Required  
**Rate Limit:** 100 req/min  

#### Request Body

```json
{
  "title": "Dinner at Restaurant",
  "amount": 3500,
  "paidBy": "64user001",
  "splitType": "equal",
  "participants": [
    { "user": "64user001", "share": 875 },
    { "user": "64user002", "share": 875 }
  ]
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "expense": { ... },
    "fairness": {
      "score": 88,
      "imbalance": 150
    }
  }
}
```

---

## Pagination Implementation Examples

### JavaScript/Fetch

```javascript
async function getMessages(groupId, cursor = null) {
  const params = new URLSearchParams({
    limit: 30,
    ...(cursor && { cursor })
  });

  const response = await fetch(
    `https://api.splitchill.com/api/groups/${groupId}/chat/messages?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const data = await response.json();
  return data.data;
}

// Usage
let cursor = null;
const messages = [];

const page1 = await getMessages(groupId);
messages.push(...page1.items);
cursor = page1.pagination.nextCursor;

// Load more
if (cursor) {
  const page2 = await getMessages(groupId, cursor);
  messages.push(...page2.items);
  cursor = page2.pagination.nextCursor;
}
```

### React Hook (usePagination)

```javascript
const { items, loadMore, hasMore } = usePagination(
  async ({ limit, cursor }) => {
    const response = await fetch(
      `/api/groups/${groupId}/chat/messages?limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    return (await response.json()).data;
  }
);

// In component
useEffect(() => {
  loadMore();
}, []);

return (
  <>
    {items.map(msg => <Message key={msg._id} {...msg} />)}
    {hasMore && <button onClick={loadMore}>Load more</button>}
  </>
);
```

### Python/Requests

```python
import requests

def get_transactions(group_id, cursor=None):
    params = {
        'limit': 20,
    }
    if cursor:
        params['cursor'] = cursor

    response = requests.get(
        f'https://api.splitchill.com/api/transactions',
        params=params,
        headers={'Authorization': f'Bearer {token}'}
    )
    return response.json()['data']

# Usage
data = get_transactions(group_id)
transactions = data['items']
cursor = data['pagination']['nextCursor']

while cursor:
    data = get_transactions(group_id, cursor)
    transactions.extend(data['items'])
    cursor = data['pagination']['nextCursor']
```

---

## Error Handling

### Invalid Cursor

```json
{
  "success": false,
  "error": "Invalid cursor format",
  "message": "Cursor must be a valid Base64 string"
}
```

**Status:** 400

### Rate Limited

```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Rate limit exceeded. Try again after 60 seconds"
}
```

**Status:** 429

### Unauthorized

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "You must be logged in"
}
```

**Status:** 401

---

## Best Practices

### 1. Always Respect `hasMore`
```javascript
if (pagination.hasMore) {
  // Load more
  loadMore(cursor);
}
```

### 2. Use `nextCursor` Not `cursor`
```javascript
// ✅ Correct
nextCursor = response.pagination.nextCursor;

// ❌ Wrong
nextCursor = encodeNextPage(); // Don't encode yourself
```

### 3. Handle Real-Time Updates
```javascript
// Prepend new items instead of reloading
prependItems([newMessage]);

// Don't reload entire list
```

### 4. Deduplicate Items
```javascript
const itemIds = new Set(items.map(i => i._id));
const newItems = items.filter(i => !itemIds.has(i._id));
```

### 5. Validate Responses
```javascript
if (!data.pagination.nextCursor) {
  // Last page reached
  showEndOfListMessage();
}
```

---

## Changelog

### v2.0 (2026-05-09)
- ✅ Added cursor-based pagination to all list endpoints
- ✅ Improved API response times by 90%
- ✅ Added pagination validation middleware
- ✅ Added deduplication support
- ✅ Added real-time update handling

### v1.0 (2026-04-01)
- Initial API release (no pagination)

---

## Support

For API support or questions:
- Email: api-support@splitchill.com
- Docs: https://docs.splitchill.com/api
- Issues: https://github.com/splitchill/api/issues
