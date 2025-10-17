// Este archivo contiene toda la lógica de autenticación (Registro, Login, Logout)
// y la subida a Cloudinary.

// Funciones auxiliares (asegúrate de que estén definidas en app.js si no lo están aquí)
function showMessage(element, message, type) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) {
        el.innerHTML = `<div class="${type}">${message}</div>`;
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function getSelectedLanguages() {
    const languages = [];
    for (let i = 1; i <= 10; i++) {
        const checkbox = document.getElementById('lang' + i);
        if (checkbox && checkbox.checked) {
            // Asegurarse de que si es 'otros', toma el valor del campo de texto
            languages.push(checkbox.value === 'otros' ? document.getElementById('otherLanguages').value : checkbox.value);
        }
    }
    return languages.filter(lang => lang);
}


// Funciones para actualizar la interfaz de usuario
function updateUIAfterLogin() {
    // Estas funciones buscan los elementos por ID en index.html
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const dashboardLink = document.getElementById('dashboardLink');
    const userName = document.getElementById('userName');

    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (dashboardLink) dashboardLink.style.display = 'block';
    if (userName && currentUser) userName.textContent = currentUser.email; 
}

function updateUIAfterLogout() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const dashboardLink = document.getElementById('dashboardLink');
    
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (dashboardLink) dashboardLink.style.display = 'none';
    
    // Si el usuario cierra sesión estando en profile.html, lo redirigimos a index.html
    if (window.location.pathname.includes('profile.html')) {
        window.location.href = 'index.html';
    }
}


// Verificar estado de autenticación (CORRECCIÓN CRÍTICA)
function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            updateUIAfterLogin();
            
            // CORRECCIÓN: Solo cargar perfil si la URL contiene 'profile.html'
            // Esto evita el error que bloquea loadTalents() en index.html
            if (window.location.pathname.includes('profile.html') && typeof loadUserProfile !== 'undefined') {
                loadUserProfile(user.uid);
            }
        } else {
            currentUser = null;
            updateUIAfterLogout();
        }
    });
}
window.checkAuthState = checkAuthState; // Hacer la función global


// ========== CLOUDINARY PARA VOICEBOOK ==========

// Subir archivo de audio a Cloudinary
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
            throw new Error(`Error en la respuesta de Cloudinary: ${data.error ? data.error.message : 'Desconocido'}`);
        }
        
    } catch (error) {
        throw new Error('Fallo la subida del demo de audio.');
    }
}

// Registrar talento
async function registerTalent(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('talentFormMessage');
    const demoFiles = document.getElementById('talentDemos').files;
    const MAX_FILES = 2;
    const MAX_SIZE_MB = 10;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    
    try {
        // 1. VALIDACIÓN DE ARCHIVOS
        if (demoFiles.length > MAX_FILES) {
            showMessage(messageDiv, `❌ Solo puedes subir un máximo de ${MAX_FILES} demos.`, 'error');
            return;
        }
        for (const file of demoFiles) {
            if (file.size > MAX_SIZE_BYTES) {
                showMessage(messageDiv, `❌ El archivo "${file.name}" supera el límite de ${MAX_SIZE_MB}MB.`, 'error');
                return;
            }
        }
        
        const email = document.getElementById('talentEmail').value;
        const password = document.getElementById('talentPassword').value;
        
        showMessage(messageDiv, 'Creando cuenta y subiendo demos (esto puede tardar)...', 'success');
        
        // 2. Crear usuario
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // 3. Subir demos
        const demos = [];
        for (const file of demoFiles) {
            const demoData = await uploadToCloudinary(file);
            demos.push({
                url: demoData.url,
                publicId: demoData.publicId,
                name: file.name,
                duration: demoData.duration,
                size: file.size
            });
        }
        
        // 4. Guardar perfil con demos
        const talentData = {
            name: document.getElementById('talentName').value,
            email: email,
            phone: document.getElementById('talentPhone').value,
            gender: document.getElementById('talentGender').value,
            country: document.getElementById('talentCountry').value,
            state: document.getElementById('talentState').value,
            city: document.getElementById('talentCity').value,
            description: document.getElementById('talentDescription').value,
            languages: getSelectedLanguages(),
            homeStudio: document.getElementById('talentHomeStudio').value,
            ageRange: document.getElementById('talentAgeRange').value,
            nationality: document.getElementById('talentNationality').value,
            realAge: document.getElementById('talentRealAge').value ? parseInt(document.getElementById('talentRealAge').value) : null,
            demos: demos, 
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('talents').doc(user.uid).set(talentData);
        
        showMessage(messageDiv, '🎉 ¡Registro y subida exitosa! Ya puedes iniciar sesión.', 'success');
        
        setTimeout(() => {
            closeAllModals();
            document.getElementById('talentForm').reset();
            // Si loadTalents es global, se actualizará el índice automáticamente
            if (typeof loadTalents !== 'undefined') loadTalents();
        }, 3000);
        
    } catch (error) {
        console.error('Error en registro/subida:', error);
        showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
}
window.registerTalent = registerTalent;

// Registrar cliente
async function registerClient(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('clientFormMessage');
    
    try {
        const email = document.getElementById('clientEmail').value;
        const password = document.getElementById('clientPassword').value;
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        const clientData = {
            name: document.getElementById('clientName').value,
            email: email,
            phone: document.getElementById('clientPhone').value,
            type: document.getElementById('clientType').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (clientData.type === 'empresa') {
            clientData.companyName = document.getElementById('companyName').value;
        }
        
        await db.collection('clients').doc(user.uid).set(clientData);
        
        showMessage(messageDiv, '¡Registro exitoso!', 'success');
        setTimeout(() => {
            closeAllModals();
            document.getElementById('clientForm').reset();
        }, 2000);
        
    } catch (error) {
        showMessage(messageDiv, 'Error: ' + error.message, 'error');
    }
}
window.registerClient = registerClient;

// Iniciar sesión (CORREGIDO: Manejo de errores y redirección)
async function loginUser(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('loginFormMessage');
    
    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        showMessage(messageDiv, 'Iniciando sesión...', 'success');
        
        await auth.signInWithEmailAndPassword(email, password);
        
        // Si el login tiene éxito, cerramos modales y redirigimos.
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

// Actualizar perfil de cliente (función auxiliar para la edición, si no está en profile.js)
window.updateClientProfile = async function() {
    // Esta función debe estar definida en profile.js, pero se mantiene para compatibilidad
    console.warn('updateClientProfile: Función debe estar definida en profile.js');
};
