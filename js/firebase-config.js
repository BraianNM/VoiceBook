// 🔥 CONFIGURACIÓN DE FIREBASE - REEMPLAZA CON TUS DATOS REALES
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

// Estado global de la aplicación
let currentUser = null;

// Configuración de Cloudinary para VoiceBook
const cloudinaryConfig = {
    cloudName: 'TU_CLOUD_NAME', // REEMPLAZA con tu Cloud Name real
    uploadPreset: 'voicebook_demos'
};
