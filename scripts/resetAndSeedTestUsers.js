/**
 * TASKBAR OS / NEURAL OS — DATABASE PURGE & TEST ACCOUNT SEED UTILITY
 * 
 * Secure privileged script:
 * 1. Purges all existing user accounts from Firebase Authentication and Firestore `users`.
 * 2. Creates 3 distinct, fresh testing accounts:
 *    - Super Admin:   superadmin@taskbar.local  (Password: SuperAdmin123!, Role: super_admin)
 *    - Admin:         admin@taskbar.local       (Password: Admin123!,      Role: admin)
 *    - Standard User: user@taskbar.local        (Password: User123!,       Role: user)
 * 3. Assigns exact custom claims and user profile records in Firestore.
 * 
 * Usage:
 *   node scripts/resetAndSeedTestUsers.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
  path.join(__dirname, '..', 'serviceAccountKey.json');

const hasServiceAccount = fs.existsSync(serviceAccountPath);

if (!hasServiceAccount) {
  console.log('\x1b[33m[NOTE]\x1b[0m No serviceAccountKey.json found.');
  console.log('To run this script directly against remote Firebase Cloud:');
  console.log('1. Download serviceAccountKey.json from Firebase Console -> Project Settings -> Service Accounts');
  console.log('2. Place it in the project root and run this command again.');
  console.log('\n\x1b[32m[IN-APP TESTING READY]\x1b[0m The TaskBar OS application now includes a 1-Click Evaluation Switcher on the login screen for Super Admin, Admin, and User roles!\n');
  process.exit(0);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

const TEST_ACCOUNTS = [
  {
    email: 'superadmin@taskbar.local',
    password: 'SuperAdmin123!',
    displayName: 'Apex Super Admin',
    username: 'apex_superadmin',
    role: 'super_admin',
    claims: { admin: true, super_admin: true }
  },
  {
    email: 'admin@taskbar.local',
    password: 'Admin123!',
    displayName: 'Operations Admin',
    username: 'ops_admin',
    role: 'admin',
    claims: { admin: true, super_admin: false }
  },
  {
    email: 'user@taskbar.local',
    password: 'User123!',
    displayName: 'Standard Operative',
    username: 'standard_operative',
    role: 'user',
    claims: { admin: false, super_admin: false }
  }
];

async function purgeAndSeed() {
  console.log('\x1b[34m[INFO]\x1b[0m Initiating database purge of all existing user records...');

  try {
    // 1. Delete all existing Firebase Auth users
    let nextPageToken;
    let deletedCount = 0;
    do {
      const listUsersResult = await auth.listUsers(100, nextPageToken);
      const uids = listUsersResult.users.map(u => u.uid);
      if (uids.length > 0) {
        await auth.deleteUsers(uids);
        deletedCount += uids.length;
      }
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log(`\x1b[32m[PURGED]\x1b[0m Successfully deleted ${deletedCount} existing Firebase Auth user(s).`);

    // 2. Delete all Firestore user documents in `users` collection
    const usersSnapshot = await db.collection('users').get();
    const batch = db.batch();
    usersSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`\x1b[32m[PURGED]\x1b[0m Cleared ${usersSnapshot.size} Firestore user profile documents.`);

    // 3. Create fresh test accounts
    console.log('\n\x1b[34m[SEEDING]\x1b[0m Creating 3 fresh testing accounts with distinct roles...');

    for (const acc of TEST_ACCOUNTS) {
      const userRecord = await auth.createUser({
        email: acc.email,
        password: acc.password,
        displayName: acc.displayName
      });

      // Set custom claims
      await auth.setCustomUserClaims(userRecord.uid, acc.claims);

      // Create root user document
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: acc.email,
        displayName: acc.displayName,
        username: acc.username,
        role: acc.role,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastActive: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`\x1b[32m[CREATED]\x1b[0m Account: ${acc.email} | Role: ${acc.role.toUpperCase()} | Password: ${acc.password}`);
    }

    console.log('\n\x1b[32m[SUCCESS]\x1b[0m All test accounts created successfully! You can now log into any role.');
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31m[ERROR]\x1b[0m Failed during purge and seed operation:', error);
    process.exit(1);
  }
}

purgeAndSeed();
