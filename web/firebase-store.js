import { firebaseConfig, databaseId } from './firebase-config.js';
import { validatePlanner, acceptRevision } from './model.js';
const SDK='https://www.gstatic.com/firebasejs/13.0.0/';
export async function createFamilyStore(callbacks) {
  if(!firebaseConfig?.apiKey||!firebaseConfig?.projectId||!firebaseConfig?.authDomain)throw new Error('Googleログインの接続設定は準備中です。設定完了後に利用できます。');
  const [appSdk,authSdk,dbSdk]=await Promise.all([import(SDK+'firebase-app.js'),import(SDK+'firebase-auth.js'),import(SDK+'firebase-firestore.js')]);
  const app=appSdk.initializeApp(firebaseConfig),auth=authSdk.getAuth(app),db=dbSdk.getFirestore(app,databaseId);
  const planner=dbSdk.doc(db,'households','family');let stopSnapshot=()=>{},generation=0;
  authSdk.onAuthStateChanged(auth,async user=>{
    const thisGeneration=++generation;stopSnapshot();stopSnapshot=()=>{};callbacks.lock();
    if(!user){callbacks.signedOut();return}
    try{
      const token=await user.getIdTokenResult();
      if(!user.emailVerified||token.signInProvider!=='google.com')throw new Error('Googleアカウントでログインしてください。');
      const membership=await dbSdk.getDocFromServer(dbSdk.doc(db,'members',user.email));
      if(!membership.exists()||membership.data().enabled!==true)throw new Error('このGoogleアカウントには利用権限がありません。家族用のアカウントを選んでください。');
      if(thisGeneration!==generation)return;
      callbacks.signedIn({uid:user.uid,email:user.email});
      stopSnapshot=dbSdk.onSnapshot(planner,{includeMetadataChanges:true},snapshot=>{
        if(thisGeneration!==generation||snapshot.metadata.fromCache||snapshot.metadata.hasPendingWrites)return;
        try{callbacks.snapshot(decode(snapshot))}catch(e){callbacks.error(e)}
      },callbacks.error);
    }catch(e){if(thisGeneration===generation)callbacks.error(e)}
  });
  function decode(snapshot){if(!snapshot.exists())return {data:null,revision:0};const x=snapshot.data();if(!Number.isInteger(x.revision)||x.revision<1)throw new Error('共有リストの版情報が不正です。');return {data:validatePlanner(JSON.parse(x.payload)),revision:x.revision}}
  return {
    async login(){const provider=new authSdk.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});return authSdk.signInWithPopup(auth,provider)},
    async logout(){++generation;stopSnapshot();callbacks.lock();await authSdk.signOut(auth)},
    async read(){return decode(await dbSdk.getDocFromServer(planner))},
    async write(state,revision){validatePlanner(state);const user=auth.currentUser;if(!user)throw new Error('Googleでログインしてください。');const frozen=structuredClone(state);return dbSdk.runTransaction(db,async tx=>{const current=decode(await tx.get(planner));acceptRevision(current.revision,revision);const next=revision+1;tx.set(planner,{payload:JSON.stringify(frozen),revision:next,updatedAt:dbSdk.serverTimestamp(),updatedBy:user.uid});return {revision:next}})}
  };
}
