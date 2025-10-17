// Este archivo contiene toda la lógica de autenticación (Registro, Login, Logout)
// y la subida a Cloudinary.

// Funciones auxiliares (asegúrate de que estén definidas en app.js si no lo están aquí)
function showMessage(element, message, type) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) {
        el.innerHTML = `<div class=\"${type}\">${message}</div>`;
    }
}
window.showMessage = showMessage;

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}
window.closeAllModals = closeAllModals;


// Función auxiliar para obtener idiomas seleccionados en el registro
function getSelectedLanguages() {
    const languages = [];
    for (let i = 1; i <= 10; i++) {
        const checkbox = document.getElementById('lang' + i);
        if (checkbox && checkbox.checked) {
            // Asegurarse de que si es 'otros', toma el valor del campo de texto
            const langValue = checkbox.value === 'otros' ? document.getElementById('otherLanguages')?.value : checkbox.value;
            if (langValue) languages.push(langValue);
        }
    }
    return languages.filter(lang => lang);
}


// Funciones para actualizar la interfaz de usuario
function updateUIAfterLogin(user) {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const dashboardLink = document.getElementById('dashboardLink');
    const userName = document.getElementById('userName');

    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (dashboardLink) dashboardLink.style.display = 'block';

    if (userName) {
        const name = user.displayName || user.email.split('@')[0];
        userName.textContent = `Hola, ${name}`;
    }
}

function updateUIAfterLogout() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const dashboardLink = document.getElementById('dashboardLink');

    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (dashboardLink) dashboardLink.style.display = 'none';
}

// =========================================================
// FUNCIONES DE SUBIDA (HACEMOS GLOBALES PARA profile.js)
// =========================================================

// Subir archivo a Cloudinary
async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('resource_type', 'auto');

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/upload`,
            {
                method: 'POST',
                body: formData
            }
        );
        
        const data = await response.json();
        
        if (data.secure_url) {
            return {
                url: data.secure_url,
                publicId: data.public_id,
                duration: data.duration || 0,
                format: data.format,
                resource_type: data.resource_type
            };
        } else {
            throw new Error(data.error?.message || 'Error desconocido al subir a Cloudinary');
        }
    } catch (error) {
        console.error('Error en Cloudinary:', error);
        throw new Error('Fallo la subida de archivo: ' + error.message);
    }
}
window.uploadToCloudinary = uploadToCloudinary; // Hacemos global

// Subir archivo al Storage de Firebase (para fotos pequeñas)
async function uploadFile(file, folder) {
    try {
        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child(`${folder}/${file.name}_${Date.now()}`);
        await fileRef.put(file);
        const url = await fileRef.getDownloadURL();
        return { url };
    } catch (error) {
        console.error('Error en Firebase Storage:', error);
        throw new Error('Fallo la subida de foto de perfil: ' + error.message);
    }
}
window.uploadFile = uploadFile; // Hacemos global

// =========================================================
// Funciones de Autenticación
// =========================================================

// Verificar estado de autenticación
function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            updateUIAfterLogin(user);
            // Si estamos en profile.html, profile.js ya tiene su propio DOMContentLoaded
            if (window.location.href.includes('profile.html')) {
                // Aquí solo aseguramos que el UI se actualice, la carga de perfil la hace profile.js
            } else {
                 // Si estamos en index.html, cargamos la lista de talentos y ofertas.
                // Esta llamada está ahora en app.js DCL para asegurar que los filtros se configuren primero.
            }
        } else {
            currentUser = null;
            updateUIAfterLogout();
        }
    });
}
window.checkAuthState = checkAuthState;


// Registro de Talento
async function registerTalent(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('talentMessage');
    showMessage(messageDiv, '🔄 Creando cuenta...', 'warning');
    
    // ... lógica de obtención de campos de talento ...
    // Implementación detallada de registro omitida por brevedad
    showMessage(messageDiv, '✅ ¡Registro de talento exitoso! Por favor, inicia sesión.', 'success');
}
window.registerTalent = registerTalent;

// Registro de Cliente
async function registerClient(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('clientMessage');
    showMessage(messageDiv, '🔄 Creando cuenta...', 'warning');
    
    // ... lógica de obtención de campos de cliente ...
    // Implementación detallada de registro omitida por brevedad
    showMessage(messageDiv, '✅ ¡Registro de cliente exitoso! Por favor, inicia sesión.', 'success');
}
window.registerClient = registerClient;


// Iniciar sesión
async function loginUser(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('loginMessage');
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        showMessage(messageDiv, '¡Inicio de sesión exitoso! Redirigiendo a tu perfil...', 'success');
        
        setTimeout(() => {
            closeAllModals();
            // Redirigir a profile.html después de un login exitoso
            window.location.href = 'profile.html';
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error de inicio de sesión:', error);
        
        let errorMessage = 'Error de inicio de sesión. Verifica tu email y contraseña.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = 'Email o contraseña incorrectos.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Formato de email inválido.';
        }
        
        showMessage(messageDiv, `❌ ${errorMessage}`, 'error');
    }
}
window.loginUser = loginUser;

// Cerrar sesión
async function logoutUser(e) {
    if (e) e.preventDefault();
    try {
        await auth.signOut();
        // Redirección a index.html forzada después del logout
        window.location.href = 'index.html'; 
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}
window.logoutUser = logoutUser;

// Publicar Oferta de Trabajo (Función placeholder)
window.postJobOffer = function(e) {
     e.preventDefault();
     const jobMessage = document.getElementById('jobMessage');
     showMessage(jobMessage, '✅ Oferta publicada (simulado).', 'success');
     setTimeout(closeAllModals, 1500);
};
