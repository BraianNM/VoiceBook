// 🔥 CONFIGURACIÓN DE FIREBASE - REEMPLAZA CON TUS DATOS REALES
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "TU_PROYECTO",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar servicios
const db = firebase.firestore();
const auth = firebase.auth();

// Configuración de Cloudinary para VoiceBook
const cloudinaryConfig = {
    cloudName: 'TU_CLOUD_NAME', // REEMPLAZA con tu Cloud Name real de Cloudinary
    uploadPreset: 'voicebook_demos'
};

// Estado global de la aplicación
let currentUser = null;
