// Este archivo contiene toda la lógica de autenticación (Registro, Login, Logout)
// y la subida a Cloudinary.

// Funciones auxiliares (asumo que están definidas aquí o en app.js)
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

function getSelectedLanguages(prefix = '') {
    const languages = [];
    for (let i = 1; i <= 10; i++) {
        const checkbox = document.getElementById(prefix + 'lang' + i);
        if (checkbox && checkbox.checked) {
            languages.push(checkbox.value === 'otros' ? document.getElementById(prefix + 'otherLanguages').value : checkbox.value);
        }
    }
    return languages.filter(lang => lang);
}
window.getSelectedLanguages = getSelectedLanguages;


// Funciones para actualizar la interfaz de usuario (simplificada)
function updateUIAfterLogin(userData) {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const dashboardLink = document.getElementById('dashboardLink');
    const userNameEl = document.getElementById('userName');

    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (dashboardLink) dashboardLink.style.display = 'block';
    
    if (userNameEl) {
        userNameEl.textContent = userData.name || userData.email || 'Mi Perfil';
    }
    closeAllModals();
}

function updateUIAfterLogout() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const dashboardLink = document.getElementById('dashboardLink');
    
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (dashboardLink) dashboardLink.style.display = 'none';
}


// Función para verificar el estado de autenticación de Firebase (CORREGIDA)
async function checkAuthState() {
    return new Promise(resolve => {
        // Usa onAuthStateChanged para obtener el estado actual
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                window.currentUser = user;
                const userId = user.uid;
                
                // 1. Cargar el documento del usuario (Talent o Client)
                let userDoc = null;
                let userType = null;

                userDoc = await db.collection('talents').doc(userId).get();
                userType = 'talent';

                if (!userDoc.exists) {
                    userDoc = await db.collection('clients').doc(userId).get();
                    userType = 'client';
                }
                
                // Si el documento existe, guardamos los datos completos (CLAVE PARA LA EDICIÓN)
                if (userDoc.exists) {
                    window.currentUserData = { 
                        ...userDoc.data(), 
                        id: userId, 
                        type: userType 
                    };
                    updateUIAfterLogin(window.currentUserData);
                    
                    // Si estamos en profile.html, cargar el perfil inmediatamente
                    if (window.location.href.includes('profile.html') && typeof window.loadUserProfile === 'function') {
                         window.loadUserProfile(userId);
                    }

                } else {
                    // Usuario autenticado pero sin datos de perfil (ej: registro incompleto)
                    window.currentUserData = null;
                    updateUIAfterLogin({name: user.email, type: 'unknown'}); 
                }

            } else {
                // No hay usuario logueado
                window.currentUser = null;
                window.currentUserData = null; 
                updateUIAfterLogout();
                
                // Si está en profile.html y no hay usuario, redirigir
                if (window.location.href.includes('profile.html')) {
                    // Esto evita el bucle de redirección en caso de que loadUserProfile maneje la redirección
                    if (window.location.href !== 'index.html') {
                       // window.location.href = 'index.html'; // Descomentar si quieres forzar la redirección
                    }
                }
            }
            resolve(user);
        });
    });
}
window.checkAuthState = checkAuthState;


// Lógica de Login
window.loginUser = async function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const messageDiv = document.getElementById('loginMessage');
    window.showMessage(messageDiv, 'Iniciando sesión...', 'warning');

    try {
        await auth.signInWithEmailAndPassword(email, password);
        window.showMessage(messageDiv, '✅ Sesión iniciada', 'success');
        
        // checkAuthState se encarga de cargar los datos y actualizar la UI
        await window.checkAuthState(); 

    } catch (error) {
        console.error('Error de login:', error);
        window.showMessage(messageDiv, '❌ Error al iniciar sesión: ' + error.message, 'error');
    }
};

// Lógica de Registro (Talento y Cliente) - (Se mantiene la lógica de registro con Firestore)

// Lógica de Logout
window.logoutUser = async function() {
    try {
        await auth.signOut();
        window.location.href = 'index.html'; // Redirigir a la página principal
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
};


// Función de Subida a Cloudinary - FUNCIÓN GLOBAL
async function uploadToCloudinary(file) {
    if (typeof cloudinaryConfig === 'undefined') {
        throw new Error('La configuración de Cloudinary no está cargada (firebase-config.js).');
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
