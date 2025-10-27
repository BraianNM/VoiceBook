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


// Funciones de Autenticación

// Verificar estado de autenticación
function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            updateUIAfterLogin();
            // loadUserProfile se llama en profile.html o app.js
        } else {
            currentUser = null;
            updateUIAfterLogout();
        }
    });
}
window.checkAuthState = checkAuthState;

// Registro de Talento (Lógica simplificada)
async function registerTalent(e) {
    e.preventDefault();
    const form = e.target;
    const messageDiv = document.getElementById('talentMessage');

    try {
        const email = form.email.value;
        const password = form.password.value;
        
        // 1. Crear usuario en Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // 2. Guardar perfil de talento en Firestore
        const talentData = {
            name: form.name.value,
            email: email,
            phone: form.phone.value,
            gender: form.gender.value,
            nationality: form.nationality.value,
            homeStudio: form.homeStudio.value,
            city: form.city.value,
            state: form.state.value,
            country: form.country.value,
            realAge: form.realAge.value,
            ageRange: form.ageRange.value,
            languages: getSelectedLanguages(),
            description: '', // Se actualizará en la edición
            demos: [], // Se actualizará en la edición
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('talents').doc(user.uid).set(talentData);
        
        showMessage(messageDiv, '✅ Registro de talento exitoso. Redirigiendo...', 'success');
        
        setTimeout(() => {
            closeAllModals();
            window.location.href = 'profile.html';
        }, 1500);

    } catch (error) {
        console.error('❌ Error de registro:', error);
        let errorMessage = 'Error al registrar. Intenta con otro email.';
        if (error.code === 'auth/email-already-in-use') {
             errorMessage = 'El email ya está registrado.';
        }
        showMessage(messageDiv, `❌ ${errorMessage}`, 'error');
    }
}
window.registerTalent = registerTalent;

// Registro de Cliente
async function registerClient(e) {
    e.preventDefault();
    const form = e.target;
    const messageDiv = document.getElementById('clientMessage');

    try {
        const email = form.email.value;
        const password = form.password.value;
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        const clientType = form.clientType.value;
        
        const clientData = {
            name: form.name.value,
            email: email,
            phone: form.phone.value,
            type: clientType,
            companyName: clientType === 'empresa' ? form.companyName.value : null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('clients').doc(user.uid).set(clientData);
        
        showMessage(messageDiv, '✅ Registro de cliente exitoso. Redirigiendo...', 'success');
        
        setTimeout(() => {
            closeAllModals();
            window.location.href = 'profile.html';
        }, 1500);

    } catch (error) {
        console.error('❌ Error de registro:', error);
        let errorMessage = 'Error al registrar. Intenta con otro email.';
        if (error.code === 'auth/email-already-in-use') {
             errorMessage = 'El email ya está registrado.';
        }
        showMessage(messageDiv, `❌ ${errorMessage}`, 'error');
    }
}
window.registerClient = registerClient;

// Inicio de sesión
async function loginUser(e) {
    e.preventDefault();
    const form = e.target;
    const messageDiv = document.getElementById('loginMessage');
    
    try {
        const email = form.loginEmail.value;
        const password = form.loginPassword.value;
        
        await auth.signInWithEmailAndPassword(email, password);
        
        showMessage(messageDiv, '¡Inicio de sesión exitoso! Redirigiendo a tu perfil...', 'success');
        
        setTimeout(() => {
            closeAllModals();
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
        // Redirección manejada por updateUIAfterLogout
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}
window.logoutUser = logoutUser;


// ========== CLOUDINARY PARA SUBIDA DE ARCHIVOS (CRÍTICO) ==========

// Subir archivo de audio a Cloudinary - FUNCIÓN GLOBAL
async function uploadToCloudinary(file) {
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
        throw new Error('Error al subir el archivo de audio. Revisa tu conexión y configuración de Cloudinary.');
    }
}
window.uploadToCloudinary = uploadToCloudinary;
// VoiceBook - Updated: Mon Oct 27 07:51:19     2025
