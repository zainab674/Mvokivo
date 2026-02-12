import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

let firebaseAdminApp;

export const initializeFirebaseAdmin = () => {
    if (firebaseAdminApp) return firebaseAdminApp;

    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (!projectId) {
        console.warn('FIREBASE_PROJECT_ID NOT SET. Firebase Admin integration will not work.');
        return null;
    }

    try {
        // We're initializing with just project ID. 
        // For verifyIdToken, this is often enough if the token is from the same project.
        // If a service account is needed later, we can add it.
        firebaseAdminApp = admin.initializeApp({
            projectId: projectId
        });
        console.log('Firebase Admin initialized for project:', projectId);
        return firebaseAdminApp;
    } catch (error) {
        if (error.code === 'app/duplicate-app') {
            firebaseAdminApp = admin.app();
            return firebaseAdminApp;
        }
        console.error('Error initializing Firebase Admin:', error);
        return null;
    }
};

export const getFirebaseAdmin = () => {
    if (!firebaseAdminApp) {
        return initializeFirebaseAdmin();
    }
    return firebaseAdminApp;
};

export default {
    getFirebaseAdmin,
    initializeFirebaseAdmin
};
