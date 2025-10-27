// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAjDbjmBaCwyIUoEr8e8bZF20RXXzhl5IA",
    authDomain: "voicebook-8ba6c.firebaseapp.com",
    projectId: "voicebook-8ba6c",
    storageBucket: "voicebook-8ba6c.firebasestorage.app",
    messagingSenderId: "534166349589",
    appId: "1:534166349589:web:e5e9c11b488fa52828ab1c"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar servicios
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Variables globales
let currentUser = null;
let currentUserData = null;

console.log('Firebase configurado correctamente');
