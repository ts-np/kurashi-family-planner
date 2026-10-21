import { firebaseConfig as c } from '../web/firebase-config.js';
if(!c||['apiKey','authDomain','projectId','appId'].some(k=>typeof c[k]!=='string'||!c[k].trim())){
  console.error('Firebase Web app configuration is missing. Configure web/firebase-config.js before publishing.');process.exit(1);
}
console.log('Firebase configuration is present. Deploy Firestore rules and provision family membership before publishing.');
