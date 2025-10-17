// Funciones de Autenticación

// Verificar estado de autenticación (CORREGIDO: Eliminamos la llamada a loadUserProfile aquí)
function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            updateUIAfterLogin();
            // Eliminado: loadUserProfile(user.uid);
            // Ahora loadUserProfile solo se llama en profile.html o al abrir el modal de edición.
        } else {
            currentUser = null;
            updateUIAfterLogout();
        }
    });
}

// ========== CLOUDINARY PARA VOICEBOOK - VERSIÓN CORREGIDA ==========

// Subir archivo de audio a Cloudinary - FUNCIÓN CORREGIDA
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
        console.log('📥 Respuesta de Cloudinary:', data);
        
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
            throw new Error(`Error en la respuesta de Cloudinary: ${data.error ? data.error.message : 'Desconocido'}`);
        }
        
    } catch (error) {
        console.error('❌ Error al subir a Cloudinary:', error);
        throw new Error('Fallo la subida del demo de audio.');
    }
}

// Registrar talento (MODIFICADO para manejar 2 demos de 10MB)
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
            demos: demos, // Guardar los demos subidos
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('talents').doc(user.uid).set(talentData);
        
        showMessage(messageDiv, '🎉 ¡Registro y subida exitosa! Ya puedes iniciar sesión.', 'success');
        
        setTimeout(() => {
            closeAllModals();
            document.getElementById('talentForm').reset();
            loadTalents();
        }, 3000);
        
    } catch (error) {
        console.error('Error en registro/subida:', error);
        showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
}

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

// Iniciar sesión
async function loginUser(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('loginFormMessage');
    
    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        await auth.signInWithEmailAndPassword(email, password);
        showMessage(messageDiv, '¡Inicio de sesión exitoso!', 'success');
        
        // Redirección forzada a profile.html después del login (para el nuevo flujo)
        setTimeout(() => {
            closeAllModals();
            window.location.href = 'profile.html';
        }, 1000);
        
    } catch (error) {
        showMessage(messageDiv, 'Error: ' + error.message, 'error');
    }
}

// Cerrar sesión
async function logoutUser() {
    try {
        await auth.signOut();
        // Redirección al index.html al cerrar sesión
        window.location.href = 'index.html'; 
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// Actualizar UI después del login
function updateUIAfterLogin() {
    document.getElementById('authButtons')?.style.display = 'none';
    document.getElementById('userMenu')?.style.display = 'block';
    document.getElementById('userName').textContent = currentUser.email;
    document.getElementById('dashboardLink')?.style.display = 'block';
}

// Actualizar UI después del logout
function updateUIAfterLogout() {
    document.getElementById('authButtons')?.style.display = 'flex';
    document.getElementById('userMenu')?.style.display = 'none';
    document.getElementById('dashboardLink')?.style.display = 'none';
}

// Funciones auxiliares para compatibilidad y globalidad
function showMessage(element, message, type) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) {
        el.innerHTML = `<div class="${type}">${message}</div>`;
    }
}
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


// Exportar funciones para uso global
window.loginUser = loginUser;
window.registerTalent = registerTalent;
window.registerClient = registerClient;
window.logoutUser = logoutUser;
window.checkAuthState = checkAuthState;
