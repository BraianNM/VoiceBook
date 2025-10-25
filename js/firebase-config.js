// 🔥 CONFIGURACIÓN DE FIREBASE
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

// Colección principal de talentos
const talentsCollection = db.collection("talents");

// Configuración de Cloudinary para VoiceBook
const cloudinaryConfig = {
    cloudName: 'dkujz9gj8',
    uploadPreset: 'voicebook_demos'
};

// Estado global de la aplicación
let currentUser = null;
let currentUserData = null;

// ===============================
// FUNCIONES PARA GESTIONAR DATOS
// ===============================

// Obtener datos del usuario actual
async function fetchCurrentUserData(uid) {
    try {
        const doc = await talentsCollection.doc(uid).get();
        if (doc.exists) {
            currentUserData = doc.data();
            console.log("Datos del usuario cargados:", currentUserData);
        } else {
            console.log("No se encontró el usuario en la colección 'talents'");
            currentUserData = null;
        }
    } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
    }
}

// Crear o actualizar perfil de talento
async function saveOrUpdateTalent(uid, talentData) {
    try {
        talentData.updatedAt = new Date();
        if (!currentUserData) {
            talentData.createdAt = new Date();
        }
        await talentsCollection.doc(uid).set(talentData, { merge: true });
        console.log("Perfil guardado/actualizado correctamente");
        fetchCurrentUserData(uid);
    } catch (error) {
        console.error("Error al guardar/actualizar perfil:", error);
    }
}

// Agregar demo de voz
async function addDemo(uid, demoData) {
    try {
        const userRef = talentsCollection.doc(uid);
        await userRef.update({
            demos: firebase.firestore.FieldValue.arrayUnion(demoData),
            updatedAt: new Date()
        });
        console.log("Demo agregada correctamente");
        fetchCurrentUserData(uid);
    } catch (error) {
        console.error("Error al agregar demo:", error);
    }
}

// Actualizar foto de perfil
async function updateProfilePicture(uid, profilePictureUrl) {
    try {
        await talentsCollection.doc(uid).update({
            profilePictureUrl,
            updatedAt: new Date()
        });
        console.log("Foto de perfil actualizada correctamente");
        fetchCurrentUserData(uid);
    } catch (error) {
        console.error("Error al actualizar foto de perfil:", error);
    }
}

// ===============================
// OBSERVADOR DE AUTENTICACIÓN
// ===============================
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        fetchCurrentUserData(user.uid);
    } else {
        currentUser = null;
        currentUserData = null;
    }
});
