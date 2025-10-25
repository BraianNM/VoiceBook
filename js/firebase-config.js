// 🔥 CONFIGURACIÓN DE FIREBASE - 
const firebaseConfig = {
    apiKey: "AIzaSyC6G6NgMqrMDyd5PB6_HmLNHpPU-vNJdf0",
    authDomain: "voicebook-8ba6c.firebaseapp.com",
    projectId: "voicebook-8ba6c",
    storageBucket: "voicebook-8ba6c.firebasestorage.app",
    messagingSenderId: "534166349589",
    appId: "1:534166349589:web:e5e9c11b488fa52828ab1c"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar servicios
const db = firebase.firestore();
const auth = firebase.auth();

// Configuración de Cloudinary para VoiceBook - CORREGIDO
const cloudinaryConfig = {
    cloudName: 'dkujz9gj8',
    uploadPreset: 'voicebook_demos'
};

// Estado global de la aplicación
let currentUser = null;
let currentUserData = null;
