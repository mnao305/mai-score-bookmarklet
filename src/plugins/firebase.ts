import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'
import 'firebase/storage'

if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: 'AIzaSyCQiHzheUpyavPNfQm72B0LHBHDR8cBNnk',
    authDomain: 'mai-score.firebaseapp.com',
    databaseURL: 'https://mai-score.firebaseio.com',
    projectId: 'mai-score',
    storageBucket: 'mai-score.appspot.com',
    messagingSenderId: '256203593707'
  })
}

export default firebase
