// auth.js - Gestión de autenticación (CORREGIDO COMPLETAMENTE)

// Variable global para controlar la inicialización
let authInitialized = false;

// Función para inicializar autenticación UNA SOLA VEZ
function initializeAuth() {
    if (authInitialized) {
        console.log('✅ Auth ya estaba inicializado');
        return;
    }
    
    authInitialized = true;
    console.log('🚀 Inicializando autenticación...');
    
    auth.onAuthStateChanged(async (user) => {
        console.log('🔄 Estado de autenticación cambiado:', user ? 'Usuario autenticado' : 'Usuario no autenticado');
        
        currentUser = user;
        
        if (user) {
            console.log('✅ Usuario autenticado:', user.uid);
            await loadUserData(user.uid);
            updateUIAfterLogin();
            
            // Solo cargar perfil si estamos en profile.html
            if (window.location.pathname.includes('profile.html') && typeof window.loadUserProfile === 'function') {
                console.log('📁 Cargando perfil desde auth.js');
                window.loadUserProfile(user.uid);
            }
        } else {
            console.log('❌ Usuario no autenticado');
            updateUIAfterLogout();
            
            // Redirigir solo si estamos en profile.html
            if (window.location.pathname.includes('profile.html')) {
                console.log('🔄 Redirigiendo a index.html');
                window.location.href = 'index.html';
            }
        }
    });
}

// Funciones auxiliares
function showMessage(element, message, type) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) {
        el.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    }
}
window.showMessage = showMessage;

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
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
    return languages.filter(lang => lang);
}

// Funciones para actualizar la interfaz de usuario
function updateUIAfterLogin() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const dashboardLink = document.getElementById('dashboardLink');
    const userName = document.getElementById('userName');
    const headerUserPicture = document.getElementById('headerUserPicture');

    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (dashboardLink) dashboardLink.style.display = 'block';
    
    if (userName && currentUserData) {
        userName.textContent = currentUserData.name || currentUserData.email;
    }
    
    if (headerUserPicture && currentUserData) {
        headerUserPicture.src = currentUserData.profilePictureUrl || 
            (currentUserData.type === 'talent' ? 'img/default-avatar.png' : 'img/default-avatar-client.png');
        headerUserPicture.onerror = function() {
            this.src = currentUserData.type === 'talent' ? 'img/default-avatar.png' : 'img/default-avatar-client.png';
        };
    }
}

function updateUIAfterLogout() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const dashboardLink = document.getElementById('dashboardLink');

    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (dashboardLink) dashboardLink.style.display = 'none';
    
    // Limpiar datos
    currentUser = null;
    currentUserData = null;
    
    // Redirigir al index si no está en index
    if (window.location.pathname.includes('profile.html')) {
        window.location.href = 'index.html';
    }
}

// REGISTRO DE TALENTO (CORREGIDO)
async function registerTalent(e) {
    e.preventDefault();
    const messageDiv = 'talentMessage';
    window.showMessage(messageDiv, '⌛ Registrando talento...', 'info');

    const email = document.getElementById('talentEmail').value;
    const password = document.getElementById('talentPassword').value;
    const name = document.getElementById('talentName').value;
    const phone = document.getElementById('talentPhone').value;
    
    // Ubicación
    const country = document.getElementById('countrySelectTalent').value;
    const state = document.getElementById('stateSelectTalent').value;
    const city = document.getElementById('citySelectTalent').value;
    
    // Imagen de Perfil
    const profilePictureFile = document.getElementById('talentProfilePicture').files[0];
    let profilePictureUrl = 'img/default-avatar.png';

    // Validaciones básicas de ubicación
    if (!country || !state || !city) {
        window.showMessage(messageDiv, '❌ Error: Por favor, selecciona País, Provincia/Estado y Ciudad.', 'error');
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const userId = userCredential.user.uid;
        
        // 1. Subir Imagen de Perfil si existe
        if (profilePictureFile) {
            window.showMessage(messageDiv, '🖼️ Subiendo foto de perfil...', 'info');
            try {
                const uploadResult = await window.uploadToCloudinary(profilePictureFile);
                profilePictureUrl = uploadResult.url;
            } catch (uploadError) {
                console.error('Error subiendo imagen:', uploadError);
                window.showMessage(messageDiv, '⚠️ No se pudo subir la imagen, usando imagen por defecto.', 'warning');
            }
        }

        // 2. Crear documento de perfil
        const languages = getSelectedLanguages();
        const talentData = {
            name: name,
            email: email,
            phone: phone,
            type: 'talent',
            profilePictureUrl: profilePictureUrl,
            country: country,
            state: state,
            city: city,
            gender: document.getElementById('talentGender').value,
            realAge: document.getElementById('talentRealAge').value,
            ageRange: document.getElementById('talentAgeRange').value,
            nationality: document.getElementById('talentNationality').value,
            languages: languages,
            homeStudio: document.querySelector('input[name="homeStudio"]:checked')?.value || 'no',
            bio: document.getElementById('talentBio').value || '',
            demos: [],
            favorites: [],
            jobApplications: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('talents').doc(userId).set(talentData);

        // Actualizar datos globales
        currentUserData = { type: 'talent', ...talentData, id: userId };

        window.showMessage(messageDiv, '✅ Registro de talento exitoso. Redirigiendo...', 'success');
        updateUIAfterLogin();
        window.closeAllModals();
        
        // Redirigir después de un breve delay
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 1500);

    } catch (error) {
        console.error('❌ Error de registro de talento:', error);
        window.showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
}
window.registerTalent = registerTalent;

// REGISTRO DE CLIENTE (CORREGIDO)
async function registerClient(e) {
    e.preventDefault();
    const messageDiv = 'clientMessage';
    window.showMessage(messageDiv, '⌛ Registrando cliente...', 'info');

    const email = document.getElementById('clientEmail').value;
    const password = document.getElementById('clientPassword').value;
    const name = document.getElementById('clientName').value;
    const phone = document.getElementById('clientPhone').value;
    const type = document.getElementById('clientType').value;
    const companyName = type === 'empresa' ? document.getElementById('companyName').value : '';
    
    // Ubicación
    const country = document.getElementById('countrySelectClient').value;
    const state = document.getElementById('stateSelectClient').value;
    const city = document.getElementById('citySelectClient').value;
    
    // Imagen de Perfil
    const profilePictureFile = document.getElementById('clientProfilePicture').files[0];
    let profilePictureUrl = 'img/default-avatar-client.png';

    // Validaciones básicas de ubicación
    if (!country || !state || !city) {
        window.showMessage(messageDiv, '❌ Error: Por favor, selecciona País, Provincia/Estado y Ciudad.', 'error');
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const userId = userCredential.user.uid;

        // Subir Imagen de Perfil si existe
        if (profilePictureFile) {
            window.showMessage(messageDiv, '🖼️ Subiendo foto de perfil...', 'info');
            try {
                const uploadResult = await window.uploadToCloudinary(profilePictureFile);
                profilePictureUrl = uploadResult.url;
            } catch (uploadError) {
                console.error('Error subiendo imagen:', uploadError);
                window.showMessage(messageDiv, '⚠️ No se pudo subir la imagen, usando imagen por defecto.', 'warning');
            }
        }

        const clientData = {
            name: name,
            email: email,
            phone: phone,
            type: 'client',
            clientType: type,
            companyName: companyName,
            country: country,
            state: state,
            city: city,
            profilePictureUrl: profilePictureUrl,
            postedJobs: [],
            notifications: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('clients').doc(userId).set(clientData);

        // Actualizar datos globales
        currentUserData = { type: 'client', ...clientData, id: userId };

        window.showMessage(messageDiv, '✅ Registro de cliente exitoso. Redirigiendo...', 'success');
        updateUIAfterLogin();
        window.closeAllModals();
        
        // Redirigir después de un breve delay
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 1500);

    } catch (error) {
        console.error('❌ Error de registro de cliente:', error);
        window.showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
}
window.registerClient = registerClient;

// FUNCIÓN DE LOGIN (CORREGIDA)
async function loginUser(e) {
    e.preventDefault();
    const messageDiv = 'loginMessage';
    window.showMessage(messageDiv, '⌛ Iniciando sesión...', 'info');

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        
        window.showMessage(messageDiv, '✅ Sesión iniciada. Redirigiendo...', 'success');
        window.closeAllModals();
        
        // Redirigir después de un breve delay para que se carguen los datos
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 1000);

    } catch (error) {
        console.error('❌ Error de login:', error);
        window.showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
}
window.loginUser = loginUser;

// FUNCIÓN DE LOGOUT
function logoutUser() {
    auth.signOut().then(() => {
        updateUIAfterLogout();
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Error al cerrar sesión:', error);
    });
}
window.logoutUser = logoutUser;

// CHEQUEAR ESTADO DE AUTENTICACIÓN (para compatibilidad)
function checkAuthState() {
    console.log('⚠️ Usando checkAuthState (legacy)');
    initializeAuth();
}
window.checkAuthState = checkAuthState;

// CARGAR DATOS DEL USUARIO (FUNCIÓN NUEVA Y CORREGIDA)
async function loadUserData(userId) {
    try {
        console.log('Cargando datos del usuario:', userId);
        
        // Intentar cargar como talento
        const talentDoc = await db.collection('talents').doc(userId).get();
        if (talentDoc.exists) {
            currentUserData = {
                type: 'talent',
                ...talentDoc.data(),
                id: talentDoc.id
            };
            console.log('Usuario cargado como talento:', currentUserData);
            return;
        }

        // Intentar cargar como cliente
        const clientDoc = await db.collection('clients').doc(userId).get();
        if (clientDoc.exists) {
            currentUserData = {
                type: 'client',
                ...clientDoc.data(),
                id: clientDoc.id
            };
            console.log('Usuario cargado como cliente:', currentUserData);
            return;
        }

        console.error('No se encontró perfil para el usuario:', userId);
        
    } catch (error) {
        console.error('Error cargando datos de usuario:', error);
    }
}
window.loadUserData = loadUserData;

// CONFIGURACIÓN DE CLOUDINARY (CORREGIDA)
async function uploadToCloudinary(file) {
    if (typeof cloudinaryConfig === 'undefined') {
        throw new Error('❌ Error: La configuración de Cloudinary no está cargada.');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('resource_type', 'auto');

    try {
        console.log('📤 Iniciando subida a Cloudinary:', file.name);
        
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/upload`,
            {
                method: 'POST',
                body: formData
            }
        );
        
        const data = await response.json();
        
        if (data.secure_url) {
            console.log('✅ Archivo subido exitosamente:', data.secure_url);
            return {
                url: data.secure_url,
                publicId: data.public_id,
                duration: data.duration || 0,
                format: data.format,
                resource_type: data.resource_type
            };
        } else {
            console.error('❌ Falló la subida de Cloudinary:', data);
            throw new Error(`Error en Cloudinary: ${data.error ? data.error.message : 'Respuesta inesperada'}`);
        }
    } catch (error) {
        console.error('❌ Error general al subir a Cloudinary:', error);
        throw new Error('Error al subir el archivo. Revisa tu conexión y configuración de Cloudinary.');
    }
}
window.uploadToCloudinary = uploadToCloudinary;

// Inicializar autenticación cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Auth.js cargado - Inicializando autenticación...');
    initializeAuth();
});
