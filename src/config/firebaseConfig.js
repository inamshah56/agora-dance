import admin from 'firebase-admin';


const filePath = process.env.AGORA_ADMIN_SDK;
const serviceAccount = await import(filePath, {
    assert: { type: 'json' }
});
admin.initializeApp({
    // un comment the below line during deployment after setting the 
    // GOOGLE_APPLICATION_CREDENTIALS that contains the path of the service account key
    // credential: admin.credential.applicationDefault(),
    credential: admin.credential.cert(serviceAccount.default)
});

export default admin.messaging();