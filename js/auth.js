// Este archivo contiene toda la lógica de autenticación (Registro, Login, Logout)
// y la subida a Cloudinary.

// Funciones auxiliares (asegúrate de que estén definidas en app.js si no lo están aquí)
function showMessage(element, message, type) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) {
        el.innerHTML = `<div class="${type}">${message}</div>`;
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

    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (dashboardLink) dashboardLink.style.display = 'block';
    
    if (userName && currentUser) {
        // Se asume que el nombre está en el perfil de usuario o se cargará
        userName.textContent = currentUser.email; 
    }
}

function updateUIAfterLogout() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const dashboardLink = document.getElementById('dashboardLink');

    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (dashboardLink) dashboardLink.style.display = 'none';
    
    // Redirigir al index si no está en index
    if (window.location.pathname.includes('profile.html')) {
        window.location.href = 'index.html';
    }
}

// NUEVA FUNCIÓN: Registro de Talento (MODIFICADA para imagen y ubicación)
async function registerTalent(e) {
    e.preventDefault();
    const messageDiv = 'talentMessage';
    window.showMessage(messageDiv, '⌛ Registrando talento...', 'info');

    const email = document.getElementById('talentEmail').value;
    const password = document.getElementById('talentPassword').value;
    const name = document.getElementById('talentName').value;
    const phone = document.getElementById('talentPhone').value;
    
    // NUEVO: Ubicación
    const country = document.getElementById('countrySelectTalent').value;
    const state = document.getElementById('stateSelectTalent').value;
    const city = document.getElementById('citySelectTalent').value;
    
    // NUEVO: Imagen de Perfil
    const profilePictureFile = document.getElementById('talentProfilePicture').files[0];
    let profilePictureUrl = '';

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
            // Usamos la configuración global de Cloudinary
            const uploadResult = await window.uploadToCloudinary(profilePictureFile);
            profilePictureUrl = uploadResult.url;
        }

        // 2. Crear documento de perfil
        const languages = getSelectedLanguages();
        await db.collection('talents').doc(userId).set({
            name: name,
            email: email,
            phone: phone,
            type: 'talent',
            // NUEVO: Guardar URL de la imagen (usar avatar por defecto si no hay imagen)
            profilePictureUrl: profilePictureUrl || 'img/default-avatar.png', 
            // NUEVO: Guardar Ubicación
            country: country,
            state: state,
            city: city,
            
            // Campos específicos de talento (simplificados para el ejemplo)
            gender: document.getElementById('talentGender').value,
            realAge: document.getElementById('talentRealAge').value,
            ageRange: document.getElementById('talentAgeRange').value,
            nationality: document.getElementById('talentNationality').value,
            languages: languages,
            homeStudio: document.getElementById('hasHomeStudio').checked ? 'si' : 'no',
            bio: document.getElementById('talentBio').value || '',
            // Inicialización de arrays vacíos para demos, favoritos, etc.
            demos: [],
            favorites: [],
            jobApplications: [] // Array de IDs de trabajos a los que se ha postulado
        });

        window.showMessage(messageDiv, '✅ Registro de talento exitoso. Redirigiendo...', 'success');
        updateUIAfterLogin();
        window.closeAllModals();
        window.location.href = 'profile.html';

    } catch (error) {
        console.error('❌ Error de registro de talento:', error);
        window.showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
}
window.registerTalent = registerTalent;

// NUEVA FUNCIÓN: Registro de Cliente (MODIFICADA para ubicación e imagen)
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
    
    // NUEVO: Ubicación
    const country = document.getElementById('countrySelectClient').value;
    const state = document.getElementById('stateSelectClient').value;
    const city = document.getElementById('citySelectClient').value;
    
    // NUEVO: Imagen de Perfil para cliente
    const profilePictureFile = document.getElementById('clientProfilePicture').files[0];
    let profilePictureUrl = '';

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
            const uploadResult = await window.uploadToCloudinary(profilePictureFile);
            profilePictureUrl = uploadResult.url;
        }

        await db.collection('clients').doc(userId).set({
            name: name,
            email: email,
            phone: phone,
            type: 'client',
            clientType: type, // 'empresa' o 'particular'
            companyName: companyName,
            // NUEVO: Guardar Ubicación
            country: country,
            state: state,
            city: city,
            // NUEVO: Guardar imagen de perfil
            profilePictureUrl: profilePictureUrl || 'img/default-avatar-client.png', 
            // Inicialización de arrays vacíos para jobs, etc.
            postedJobs: [], 
            notifications: [] // Array para notificaciones de postulaciones
        });

        window.showMessage(messageDiv, '✅ Registro de cliente exitoso. Redirigiendo...', 'success');
        updateUIAfterLogin();
        window.closeAllModals();
        window.location.href = 'profile.html';

    } catch (error) {
        console.error('❌ Error de registro de cliente:', error);
        window.showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
}
window.registerClient = registerClient;

// Función de Login
async function loginUser(e) {
    e.preventDefault();
    const messageDiv = 'loginMessage';
    window.showMessage(messageDiv, '⌛ Iniciando sesión...', 'info');

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        
        window.showMessage(messageDiv, '✅ Sesión iniciada. Redirigiendo...', 'success');
        updateUIAfterLogin();
        window.closeAllModals();
        window.location.href = 'profile.html';

    } catch (error) {
        console.error('❌ Error de login:', error);
        window.showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
}
window.loginUser = loginUser;

// Función de Logout
function logoutUser() {
    auth.signOut().then(() => {
        updateUIAfterLogout();
        // Limpiar el estado global
        if (typeof window.currentUserData !== 'undefined') {
            window.currentUserData = null;
        }
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Error al cerrar sesión:', error);
    });
}
window.logoutUser = logoutUser;

// Chequear el estado de autenticación al cargar la página
function checkAuthState() {
    auth.onAuthStateChanged(user => {
        currentUser = user; // Actualiza el estado global
        if (user) {
            updateUIAfterLogin();
            // Cargar datos del usuario
            window.loadUserData(user.uid);
            // Cargar perfil si estamos en profile.html
            if (window.location.href.includes('profile.html')) {
                window.loadUserProfile(user.uid);
            }
        } else {
            updateUIAfterLogout();
        }
    });
}
window.checkAuthState = checkAuthState;

// Cargar datos del usuario
async function loadUserData(userId) {
    try {
        // Intentar cargar como talento
        const talentDoc = await db.collection('talents').doc(userId).get();
        if (talentDoc.exists) {
            window.currentUserData = {
                type: 'talent',
                ...talentDoc.data(),
                id: talentDoc.id
            };
        } else {
            // Intentar cargar como cliente
            const clientDoc = await db.collection('clients').doc(userId).get();
            if (clientDoc.exists) {
                window.currentUserData = {
                    type: 'client',
                    ...clientDoc.data(),
                    id: clientDoc.id
                };
            }
        }
        
        // Actualizar nombre en la UI
        const userName = document.getElementById('userName');
        if (userName && window.currentUserData) {
            userName.textContent = window.currentUserData.name || window.currentUserData.email;
        }
        
    } catch (error) {
        console.error('Error cargando datos de usuario:', error);
    }
}
window.loadUserData = loadUserData;

// Configuración de Cloudinary (asumiendo que cloudinaryConfig está en firebase-config.js)
// Subida a Cloudinary - FUNCIÓN GLOBAL
async function uploadToCloudinary(file) {
    // Usamos el objeto global cloudinaryConfig definido en firebase-config.js
    if (typeof cloudinaryConfig === 'undefined') {
        throw new Error('❌ Error: La configuración de Cloudinary no está cargada (firebase-config.js).');
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
                duration: data.duration || 0, // Cloudinary devuelve la duración para audios
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
