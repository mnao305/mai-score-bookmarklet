import firebase from './firebase'

const db = firebase.firestore()
const FieldValue = firebase.firestore.FieldValue

export { db, FieldValue }
