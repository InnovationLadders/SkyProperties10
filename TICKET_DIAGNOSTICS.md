# Ticket Assignment Diagnostics Guide

## Problem Overview

Service providers may not see tickets assigned to them in their Tickets list. This typically happens when the `assignedTo` field in a ticket document contains an incorrect value (like an email address) instead of the user's Firebase Authentication UID.

## Root Cause

The ticket filtering system works as follows:

1. **Ticket Assignment**: When an admin/manager assigns a ticket to a service provider, the `assignedTo` field is set to the service provider's UID
2. **Ticket Query**: Service providers see tickets where `assignedTo === currentUser.uid`
3. **The Problem**: If `assignedTo` contains an email or incorrect ID, the query won't match the user's actual UID

## How to Diagnose

### Method 1: Using Browser Console (Recommended)

When running the app in development mode, diagnostic utilities are automatically loaded:

```javascript
// Check for ticket assignment issues
window.diagnoseTickets()

// This will output:
// - All tickets in the database
// - All service providers with their UIDs
// - Analysis of each assigned ticket
// - Any mismatches between assignedTo values and actual UIDs
```

### Method 2: Check Browser Console Logs

The application now includes detailed logging:

1. **Login**: When a service provider logs in, you'll see:
   ```
   Auth state changed - User logged in:
     uid: "abc123..."
     email: "serviceprovider@example.com"
   ```

2. **Ticket Query**: When viewing the Tickets page, you'll see:
   ```
   === TICKETS PAGE DEBUG ===
   User Role: serviceProvider
   Current User UID: abc123...
   Fetching tickets for SERVICE_PROVIDER (assignedTo == abc123...)
   Ticket found: { id, title, assignedTo, status }
   Total tickets fetched: 2
   ```

3. **Ticket Assignment**: When assigning a ticket, you'll see:
   ```
   === TICKET ASSIGNMENT DEBUG ===
   Selected Provider ID: abc123...
   Provider Details: { id, email, displayName }
   Current User UID: xyz789...
   Ticket ID: ticket123
   ```

### Method 3: Check Firebase Console

1. Go to Firebase Console → Firestore Database
2. Navigate to the `tickets` collection
3. Find the specific ticket assigned to the service provider
4. Check the `assignedTo` field value
5. Compare with the service provider's document ID in the `users` collection

## How to Fix Issues

### Method 1: Automatic Fix (Recommended)

```javascript
// In browser console, run:
window.fixTickets()

// This will:
// 1. Diagnose all ticket assignments
// 2. Identify issues
// 3. Automatically update incorrect assignedTo values
// 4. Provide a summary of fixes
```

### Method 2: Manual Fix via Firebase Console

If you prefer to fix manually:

1. Open Firebase Console → Firestore
2. Find the problematic ticket document
3. Find the service provider's UID from the `users` collection
4. Update the ticket's `assignedTo` field with the correct UID
5. Optionally, also update/add these fields for better tracking:
   - `assignedToEmail`: Service provider's email
   - `assignedToName`: Service provider's display name

## Prevention

The updated code includes several improvements to prevent future issues:

### 1. Enhanced Logging
- All ticket assignments now log detailed information
- User authentication logs UIDs and emails
- Ticket queries show filter criteria and results

### 2. Validation
- Assignment function validates the selected provider exists
- Additional fields (assignedToEmail, assignedToName) are stored for reference
- Error messages include detailed context

### 3. Better Error Messages
- Failed assignments show specific error details
- Users are informed when service providers aren't found
- Console logs help identify the exact problem

## Common Scenarios

### Scenario 1: Service Provider Can't See Assigned Ticket

**Symptoms**: Admin assigned a ticket, but service provider's Tickets page is empty

**Solution**:
1. Service provider should check browser console
2. Look for the debug logs showing their UID
3. Run `window.diagnoseTickets()` to identify the mismatch
4. Run `window.fixTickets()` to correct the assignment

### Scenario 2: Ticket Shows "No service provider found" Error

**Symptoms**: When trying to assign a ticket, you get this error

**Possible Causes**:
- Service provider's user document doesn't exist
- Service provider's role is not set correctly
- There's a mismatch between Auth UID and Firestore document ID

**Solution**:
1. Check Firebase Authentication for the user
2. Check Firestore `users` collection for a document with that UID
3. Verify the user document has `role: "serviceProvider"`
4. If document is missing, the user needs to log in again or be re-registered

### Scenario 3: Old Tickets Still Not Visible After Fix

**Symptoms**: Fixed the assignedTo field but service provider still doesn't see the ticket

**Solution**:
1. Refresh the page (clear any cached data)
2. Check if there's a Firestore index error in console
3. Verify the compound query index exists for: `assignedTo (=) + createdAt (desc)`
4. If index is missing, Firebase will show a link to create it

## Firestore Index Requirements

The service provider ticket query requires a composite index:

**Collection**: `tickets`
**Fields**:
- `assignedTo` (Ascending)
- `createdAt` (Descending)

If you see an index error, click the link in the console to create it automatically.

## Support

If issues persist after following this guide:

1. Export the diagnostic output: `window.diagnoseTickets()`
2. Check all console logs for errors
3. Verify Firestore security rules allow the queries
4. Ensure the user has the correct role in their profile
5. Contact the development team with the diagnostic output

## Technical Details

### Data Structure

**Ticket Document**:
```javascript
{
  id: "auto-generated",
  title: "Fix broken pipe",
  assignedTo: "abc123...",           // Firebase Auth UID (CRITICAL)
  assignedToEmail: "sp@example.com", // Reference only
  assignedToName: "John Plumber",    // Reference only
  assignedBy: "xyz789...",
  assignedAt: Timestamp,
  status: "assigned",
  // ... other fields
}
```

**User Document** (Service Provider):
```javascript
{
  uid: "abc123...",                  // MUST match document ID
  email: "sp@example.com",
  role: "serviceProvider",
  displayName: "John Plumber",
  // ... other fields
}
```

### Query Logic

```javascript
// For service providers:
query(
  collection(db, 'tickets'),
  where('assignedTo', '==', currentUser.uid),  // currentUser.uid from Firebase Auth
  orderBy('createdAt', 'desc')
)
```

The query will ONLY return tickets where `assignedTo` exactly matches the user's Firebase Authentication UID.
