/**
 * TASKBAR OS / NEURAL OS — TRUSTED ADMINISTRATIVE BOOTSTRAP SCRIPT
 * 
 * Secure Privileged Operator Utility
 * Assigns Firebase Authentication Custom User Claims (`admin: true`, `super_admin: true`)
 * 
 * Usage:
 *   1. Download your service account JSON from Firebase Console -> Project Settings -> Service Accounts.
 *   2. Save it securely as `serviceAccountKey.json` in your local environment (NOT committed to git).
 *   3. Execute:
 *      node scripts/bootstrapAdmin.js <TARGET_USER_UID_OR_EMAIL>
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
  path.join(__dirname, '..', 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('\x1b[31m[ERROR]\x1b[0m Service account key not found at:', serviceAccountPath);
  console.log('\nTo run this script:');
  console.log('1. Go to Firebase Console -> Project Settings -> Service Accounts');
  console.log('2. Click "Generate new private key"');
  console.log('3. Save file as serviceAccountKey.json in the project root');
  console.log('4. Run: node scripts/bootstrapAdmin.js <USER_UID_OR_EMAIL>\n');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function bootstrapAdmin() {
  const target = process.argv[2];

  if (!target) {
    console.error('\x1b[31m[ERROR]\x1b[0m Please provide a target User UID or Email.');
    console.log('Usage: node scripts/bootstrapAdmin.js <TARGET_USER_UID_OR_EMAIL>');
    process.exit(1);
  }

  try {
    let userRecord;
    if (target.includes('@')) {
      userRecord = await admin.auth().getUserByEmail(target);
    } else {
      userRecord = await admin.auth().getUser(target);
    }

    console.log(`\x1b[34m[INFO]\x1b[0m Found user: ${userRecord.email} (${userRecord.uid})`);

    const customClaims = {
      admin: true,
      role: 'ADMIN'
    };

    // Assign custom claims securely in Firebase Auth
    await admin.auth().setCustomUserClaims(userRecord.uid, customClaims);

    // Update Firestore profile role for quick UI matching
    const db = admin.firestore();
    await db.collection('users').doc(userRecord.uid).set({
      role: 'admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Append to immutable administrative audit collection
    await db.collection('admin_audit_logs').add({
      action: 'BOOTSTRAP_ADMIN_ROLE_ASSIGNED',
      performedBy: 'privileged_cli_operator',
      targetUid: userRecord.uid,
      targetEmail: userRecord.email,
      assignedClaims: customClaims,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'SUCCESS'
    });

    console.log(`\x1b[32m[SUCCESS]\x1b[0m Successfully assigned ADMIN role to user ${userRecord.email}!`);
    console.log('The user must sign out and sign back in (or refresh their ID token) for the new privileges to take effect.');
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31m[FAILED]\x1b[0m Could not assign administrative role:', error.message);
    process.exit(1);
  }
}

bootstrapAdmin();
