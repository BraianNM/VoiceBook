// Este archivo contiene toda la lógica de autenticación (Registro, Login, Logout)
// y la subida a Cloudinary.

// Funciones auxiliares (definidas aquí para garantizar su disponibilidad)
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

function getSelectedLanguages() {
    const languages = [];
    const otherLanguagesInput = document.getElementById('otherLanguages');
    
    for (let i = 1; i <= 10; i++) {
        const checkbox = document.getElementById('lang' + i);
        if (checkbox && checkbox.checked) {
            if (checkbox.value === 'otros') {
                if (otherLanguagesInput.value.trim()) {
                    languages.push(otherLanguagesInput.value.trim());
                }
            } else {
                languages.push(checkbox.value);
            }
        }
    }
    return languages.filter(lang => lang);
}


// Funciones para actualizar la interfaz de usuario
function updateUIAfterLogin(userName) {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const dashboardLink = document.getElementById('dashboardLink');
    const userNameEl = document.getElementById('userName');

    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'block';
    if (dashboardLink) dashboardLink.style.display = 'block';
    if (userNameEl) userNameEl.textContent = `Hola, ${userName}`;
}

function updateUIAfterLogout() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const dashboardLink = document.getElementById('dashboardLink');
    
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (dashboardLink) dashboardLink.style.display = 'none';
    
    // Redirigir a la página principal si estamos en el dashboard
    if (window.location.pathname.includes('profile.html')) {
        window.location.href = 'index.html';
    }
}

// =========================================================================
// FUNCIONES DE AUTENTICACIÓN
// =========================================================================

// Verificar estado de autenticación
function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Cargar el perfil para obtener el nombre y el tipo
            const talentDoc = await db.collection('talents').doc(user.uid).get();
            if (talentDoc.exists) {
                currentUser = { ...user, isTalent: true, ...talentDoc.data() };
                updateUIAfterLogin(currentUser.name);
            } else {
                const clientDoc = await db.collection('clients').doc(user.uid).get();
                if (clientDoc.exists) {
                    currentUser = { ...user, isTalent: false, ...clientDoc.data() };
                    updateUIAfterLogin(currentUser.name);
                } else {
                    // Caso raro: usuario existe pero no tiene perfil (recién registrado)
                    currentUser = user;
                    updateUIAfterLogin('Usuario');
                }
            }
            
            // Solo cargar perfil si estamos en profile.html
            if (window.location.pathname.includes('profile.html')) {
                window.loadUserProfile(user.uid);
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
    const name = document.getElementById('talentName').value;
    const email = document.getElementById('talentEmail').value;
    const password = document.getElementById('talentPassword').value;
    const messageDiv = document.getElementById('talentMessage');
    
    // Obtener datos de ubicación con IDs de TALENTO
    const country = document.getElementById('country').value;
    const state = document.getElementById('state').value;
    const city = document.getElementById('city').value;
    const languages = getSelectedLanguages();

    if (!country || !state || !city) {
        showMessage(messageDiv, '❌ Debes seleccionar País, Provincia/Estado y Ciudad.', 'error');
        return;
    }

    showMessage(messageDiv, '🔄 Creando cuenta...', 'success');

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const userId = userCredential.user.uid;
        
        await db.collection('talents').doc(userId).set({
            name,
            email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            // Datos de perfil
            country,
            state,
            city,
            languages,
            isTalent: true,
            photoURL: '',
            specialty: '',
            bio: '',
            homeStudio: false,
            demos: [],
            realAge: null,
            ageRange: ''
        });
        
        showMessage(messageDiv, '✅ ¡Registro exitoso! Redirigiendo...', 'success');
        setTimeout(() => {
            closeAllModals();
            window.location.href = 'profile.html';
        }, 1500);

    } catch (error) {
        console.error('Error de registro de talento:', error);
        let errorMessage = 'Error al registrar. Inténtalo de nuevo.';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'El email ya está registrado.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
        }
        showMessage(messageDiv, `❌ ${errorMessage}`, 'error');
    }
}
window.registerTalent = registerTalent;


// Registro de Cliente
async function registerClient(e) {
    e.preventDefault();
    const name = document.getElementById('clientName').value;
    const email = document.getElementById('clientEmail').value;
    const password = document.getElementById('clientPassword').value;
    const clientType = document.getElementById('clientType').value;
    const companyName = document.getElementById('companyName').value;
    const messageDiv = document.getElementById('clientMessage');
    
    // Obtener datos de ubicación con IDs de CLIENTE
    const country = document.getElementById('clientCountry').value;
    const state = document.getElementById('clientState').value;
    const city = document.getElementById('clientCity').value;

    if (!country || !state || !city) {
        showMessage(messageDiv, '❌ Debes seleccionar País, Provincia/Estado y Ciudad.', 'error');
        return;
    }

    showMessage(messageDiv, '🔄 Creando cuenta...', 'success');

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const userId = userCredential.user.uid;
        
        await db.collection('clients').doc(userId).set({
            name,
            email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            // Datos de perfil
            clientType,
            companyName: clientType === 'empresa' ? companyName : '',
            country,
            state,
            city,
            isTalent: false
        });
        
        showMessage(messageDiv, '✅ ¡Registro exitoso! Redirigiendo...', 'success');
        setTimeout(() => {
            closeAllModals();
            window.location.href = 'profile.html';
        }, 1500);

    } catch (error) {
        console.error('Error de registro de cliente:', error);
        let errorMessage = 'Error al registrar. Inténtalo de nuevo.';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'El email ya está registrado.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
        }
        showMessage(messageDiv, `❌ ${errorMessage}`, 'error');
    }
}
window.registerClient = registerClient;


// Iniciar Sesión - CORREGIDO
async function loginUser(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const messageDiv = document.getElementById('loginMessage');

    showMessage(messageDiv, '🔄 Iniciando sesión...', 'success');

    try {
        await auth.signInWithEmailAndPassword(email, password);
        
        // La redirección se maneja en checkAuthState/updateUIAfterLogin al cargar el perfil
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
        // Redirección manejada por updateUIAfterLogout
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}
window.logoutUser = logoutUser;

// =========================================================================
// CLOUDINARY PARA VOICEBOOK - Subida de Archivos
// =========================================================================

// Subir archivo de audio a Cloudinary
async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('resource_type', 'auto'); // Permite audio o imagen

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
            throw new Error(data.error?.message || 'Fallo en la subida a Cloudinary.');
        }

    } catch (error) {
        console.error('Error en uploadToCloudinary:', error);
        throw error;
    }
}
window.uploadToCloudinary = uploadToCloudinary;
