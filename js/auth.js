// auth.js - Gestión completa de autenticación y talentos

// ===============================
// CONFIGURACIÓN DE FIREBASE
// ===============================
const firebaseConfig = {
    apiKey: "AIzaSyC6G6NgMqrMDyd5PB6_HmLNHpPU-vNJdf0",
    authDomain: "voicebook-8ba6c.firebaseapp.com",
    projectId: "voicebook-8ba6c",
    storageBucket: "voicebook-8ba6c.firebasestorage.app",
    messagingSenderId: "534166349589",
    appId: "1:534166349589:web:e5e9c11b488fa52828ab1c"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();
const talentsCollection = db.collection('talents');
const clientsCollection = db.collection('clients');

const cloudinaryConfig = {
    cloudName: 'dkujz9gj8',
    uploadPreset: 'voicebook_demos'
};

// ===============================
// ESTADO GLOBAL
// ===============================
let currentUser = null;
let currentUserData = null;
let authInitialized = false;

// ===============================
// UTILIDADES
// ===============================
function showMessage(element, message, type) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) {
        el.innerHTML = `<div class="${type}">${message}</div>`;
    }
}
window.showMessage = showMessage;

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
}
window.closeAllModals = closeAllModals;

function getSelectedLanguages() {
    const languages = [];
    for (let i = 1; i <= 10; i++) {
        const checkbox = document.getElementById('lang' + i);
        if (checkbox && checkbox.checked) {
            languages.push(checkbox.value === 'otros' ? document.getElementById('otherLanguages').value : checkbox.value);
        }
    }
    return languages.filter(Boolean);
}
window.getSelectedLanguages = getSelectedLanguages;

// ===============================
// INICIALIZACIÓN DE AUTH
// ===============================
function initializeAuth() {
    if (authInitialized) return;
    authInitialized = true;

    auth.onAuthStateChanged(async (user) => {
        currentUser = user;
        if (user) {
            await loadUserData(user.uid);
            updateUIAfterLogin();
            if (window.location.pathname.includes('profile.html') && typeof window.loadUserProfile === 'function') {
                window.loadUserProfile(user.uid);
            }
        } else {
            updateUIAfterLogout();
            if (window.location.pathname.includes('profile.html')) {
                window.location.href = 'index.html';
            }
        }
    });
}
window.initializeAuth = initializeAuth;

// ===============================
// LOGIN / LOGOUT
// ===============================
async function loginUser(e) {
    e.preventDefault();
    showMessage('loginMessage', '⌛ Iniciando sesión...', 'info');
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showMessage('loginMessage', '✅ Sesión iniciada', 'success');
        closeAllModals();
        window.location.href = 'profile.html';
    } catch (error) {
        showMessage('loginMessage', '❌ Error: ' + error.message, 'error');
    }
}
window.loginUser = loginUser;

function logoutUser() {
    auth.signOut().then(() => {
        updateUIAfterLogout();
        window.location.href = 'index.html';
    }).catch(console.error);
}
window.logoutUser = logoutUser;

// ===============================
// UI POST LOGIN / LOGOUT
// ===============================
function updateUIAfterLogin() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const dashboardLink = document.getElementById('dashboardLink');
    const userName = document.getElementById('userName');
    const headerUserPicture = document.getElementById('headerUserPicture');

    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (dashboardLink) dashboardLink.style.display = 'block';
    if (userName && currentUserData) userName.textContent = currentUserData.name || currentUserData.email;
    if (headerUserPicture && currentUserData) headerUserPicture.src = currentUserData.profilePictureUrl || 'img/default-avatar.png';
}

function updateUIAfterLogout() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const dashboardLink = document.getElementById('dashboardLink');

    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (dashboardLink) dashboardLink.style.display = 'none';

    currentUser = null;
    currentUserData = null;
}

// ===============================
// REGISTRO DE TALENTOS
// ===============================
async function registerTalent(e) {
    e.preventDefault();
    const messageDiv = 'talentMessage';
    showMessage(messageDiv, '⌛ Registrando talento...', 'info');

    const email = document.getElementById('talentEmail').value;
    const password = document.getElementById('talentPassword').value;
    const name = document.getElementById('talentName').value;
    const phone = document.getElementById('talentPhone').value;
    const country = document.getElementById('countrySelectTalent').value;
    const state = document.getElementById('stateSelectTalent').value;
    const city = document.getElementById('citySelectTalent').value;
    const profilePictureFile = document.getElementById('talentProfilePicture').files[0];
    let profilePictureUrl = 'img/default-avatar.png';

    if (!country || !state || !city) {
        showMessage(messageDiv, '❌ Selecciona País, Estado y Ciudad.', 'error');
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const userId = userCredential.user.uid;

        if (profilePictureFile) {
            try {
                const uploadResult = await uploadToCloudinary(profilePictureFile);
                profilePictureUrl = uploadResult.url;
            } catch {
                showMessage(messageDiv, '⚠️ No se pudo subir la imagen, usando por defecto.', 'warning');
            }
        }

        const languages = getSelectedLanguages();
        const talentData = {
            name, email, phone, type: 'talent', profilePictureUrl,
            country, state, city,
            gender: document.getElementById('talentGender').value,
            realAge: document.getElementById('talentRealAge').value,
            ageRange: document.getElementById('talentAgeRange').value,
            nationality: document.getElementById('talentNationality').value,
            languages,
            homeStudio: document.querySelector('input[name="homeStudio"]:checked')?.value || 'no',
            bio: document.getElementById('talentBio').value || '',
            demos: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await talentsCollection.doc(userId).set(talentData);
        currentUserData = { type: 'talent', ...talentData, id: userId };

        showMessage(messageDiv, '✅ Registro exitoso. Redirigiendo...', 'success');
        updateUIAfterLogin();
        closeAllModals();
        setTimeout(() => window.location.href = 'profile.html', 1500);
    } catch (error) {
        showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
}
window.registerTalent = registerTalent;

// ===============================
// CARGA DE DATOS DEL USUARIO
// ===============================
async function loadUserData(userId) {
    try {
        const talentDoc = await talentsCollection.doc(userId).get();
        if (talentDoc.exists) {
            currentUserData = { type: 'talent', ...talentDoc.data(), id: talentDoc.id };
            return;
        }
        const clientDoc = await clientsCollection.doc(userId).get();
        if (clientDoc.exists) {
            currentUserData = { type: 'client', ...clientDoc.data(), id: clientDoc.id };
            return;
        }
    } catch (error) {
        console.error('Error cargando datos de usuario:', error);
    }
}
window.loadUserData = loadUserData;

// ===============================
// CLOUDINARY
// ===============================
async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('resource_type', 'auto');

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/upload`, { method: 'POST', body: formData });
    const data = await response.json();
    if (data.secure_url) return { url: data.secure_url, publicId: data.public_id, duration: data.duration || 0 };
    throw new Error('Error subiendo archivo a Cloudinary');
}
window.uploadToCloudinary = uploadToCloudinary;

// ===============================
// LISTAR TALENTOS EN PÁGINA PRINCIPAL
// ===============================
async function listTalents(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '⌛ Cargando talentos...';

    try {
        const snapshot = await talentsCollection.orderBy('createdAt', 'desc').get();
        if (snapshot.empty) {
            container.innerHTML = 'No hay talentos registrados aún.';
            return;
        }

        container.innerHTML = '';
        snapshot.forEach(doc => {
            const talent = doc.data();
            const card = document.createElement('div');
            card.className = 'talent-card';
            card.innerHTML = `
                <img src="${talent.profilePictureUrl || 'img/default-avatar.png'}" alt="${talent.name}" class="talent-pic">
                <h3>${talent.name}</h3>
                <p>${talent.city}, ${talent.state}, ${talent.country}</p>
                <p>${talent.bio || ''}</p>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        container.innerHTML = '❌ Error cargando talentos';
        console.error('Error listando talentos:', error);
    }
}
window.listTalents = listTalents;

// ===============================
// INICIALIZAR AUTENTICACIÓN AUTOMÁTICAMENTE
// ===============================
initializeAuth();
