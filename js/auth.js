// Funciones de Autenticación
// (Asegúrate de que tus variables globales 'currentUser', 'db', 'auth' están definidas en firebase-config.js)

// Verificar estado de autenticación
function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            updateUIAfterLogin();
            
            // Si estamos en la página de perfil, cargamos el perfil
            if (window.location.pathname.endsWith('profile.html')) {
                loadUserProfile(user.uid);
            }
        } else {
            currentUser = null;
            updateUIAfterLogout();
            
            // Si no hay usuario y estamos en profile.html, redirigir a index.html
            if (window.location.pathname.endsWith('profile.html')) {
                 window.location.href = 'index.html';
            }
        }
    });
}

// Función auxiliar para obtener idiomas seleccionados (se asume que existe)
function getSelectedLanguages(formId) {
    const checkboxes = document.querySelectorAll(`#${formId} input[name="lang"]:checked`);
    const languages = [];
    let otherLangInput = null;

    for (const checkbox of checkboxes) {
        if (checkbox.value === 'otro') {
            otherLangInput = document.querySelector(`#${formId} input[placeholder="Otros idiomas, separados por coma"]`);
            if (otherLangInput && otherLangInput.value) {
                // Añadir los idiomas separados por coma
                otherLangInput.value.split(',').map(lang => lang.trim()).forEach(lang => {
                    if (lang) languages.push(lang);
                });
            }
        } else {
            languages.push(checkbox.value);
        }
    }
    return languages;
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
            console.error('❌ Error de Cloudinary:', data);
            throw new Error(data.error?.message || 'Error subiendo archivo a Cloudinary');
        }
    } catch (error) {
        console.error('❌ Error en uploadToCloudinary:', error);
        throw new Error('Error de conexión con Cloudinary: ' + error.message);
    }
}

// Subir múltiples archivos de audio - FUNCIÓN MEJORADA
async function uploadAudioFiles(files) {
    const uploadedFiles = [];
    
    for (const file of files) {
        if (!file.type.startsWith('audio/')) {
            console.warn(`❌ ${file.name} no es un archivo de audio válido`);
            continue;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            console.warn(`❌ ${file.name} es muy grande (máximo 10MB)`);
            continue;
        }
        
        try {
            console.log(`🎵 Subiendo demo: ${file.name}...`);
            const result = await uploadToCloudinary(file);
            
            uploadedFiles.push({
                name: file.name,
                url: result.url,
                duration: result.duration,
                format: result.format,
                size: file.size,
                publicId: result.publicId
            });
            console.log(`✅ Demo subido: ${file.name}`);
        } catch (error) {
            console.error(`❌ Error subiendo ${file.name}:`, error);
        }
    }
    return uploadedFiles;
}

// Registrar talento
async function registerTalent(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('talentFormMessage');
    try {
        const email = document.getElementById('talentEmail').value;
        const password = document.getElementById('talentPassword').value;
        showMessage(messageDiv, 'Creando cuenta...', 'success');
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const userId = userCredential.user.uid;
        
        // Subir demos
        const audioFiles = document.getElementById('audioDemos').files;
        let demos = [];
        if (audioFiles.length > 0) {
            showMessage(messageDiv, 'Subiendo demos de audio (puede tardar)...', 'warning');
            demos = await uploadAudioFiles(audioFiles);
        }
        
        // Obtener idiomas
        const languages = getSelectedLanguages('talentForm');
        
        // Crear documento en Firestore
        await db.collection('talents').doc(userId).set({
            name: document.getElementById('talentName').value,
            email: email,
            gender: document.getElementById('talentGender').value,
            nationality: document.getElementById('talentNationality').value,
            languages: languages,
            realAge: document.getElementById('talentRealAge').value,
            ageRange: document.getElementById('talentAgeRange').value,
            homeStudio: document.getElementById('talentHomeStudio').value,
            phone: document.getElementById('talentPhone').value,
            description: document.getElementById('talentDescription').value,
            demos: demos,
            country: document.getElementById('talentCountry').value,
            state: document.getElementById('talentState').value,
            city: document.getElementById('talentCity').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showMessage(messageDiv, '✅ Registro de Talento exitoso. Redirigiendo...', 'success');
        closeAllModals();
        
        // Redirigir a la nueva página de perfil después del registro
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 1500);

    } catch (error) {
        console.error('Error en registro de talento:', error);
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
        const clientType = document.getElementById('clientType').value;
        
        showMessage(messageDiv, 'Creando cuenta...', 'success');
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const userId = userCredential.user.uid;
        
        const clientData = {
            name: document.getElementById('clientName').value,
            email: email,
            phone: document.getElementById('clientPhone').value,
            type: clientType,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (clientType === 'empresa') {
            clientData.companyName = document.getElementById('clientCompanyName').value;
        }
        
        await db.collection('clients').doc(userId).set(clientData);
        
        showMessage(messageDiv, '✅ Registro de Cliente exitoso. Redirigiendo...', 'success');
        closeAllModals();
        
        // Redirigir a la nueva página de perfil después del registro
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 1500);

    } catch (error) {
        console.error('Error en registro de cliente:', error);
        showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
}

// Iniciar Sesión
async function loginUser(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('loginFormMessage');
    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        showMessage(messageDiv, 'Iniciando sesión...', 'success');
        
        await auth.signInWithEmailAndPassword(email, password);
        
        showMessage(messageDiv, '✅ Sesión iniciada. Redirigiendo...', 'success');
        closeAllModals();
        
        // Redirigir a la nueva página de perfil después de iniciar sesión
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error en login:', error);
        showMessage(messageDiv, '❌ Error: Credenciales incorrectas o usuario no encontrado.', 'error');
    }
}

// Cerrar Sesión
window.logoutUser = async function() {
    try {
        await auth.signOut();
        window.location.href = 'index.html'; // Redirigir a inicio tras cerrar sesión
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
};

// Actualizar UI tras Login
function updateUIAfterLogin() {
    document.getElementById('authButtons').style.display = 'none';
    document.getElementById('userMenu').style.display = 'flex';
    document.getElementById('dashboardLink').style.display = 'block';
    document.getElementById('userName').textContent = currentUser.email;
}

// Actualizar UI tras Logout
function updateUIAfterLogout() {
    document.getElementById('authButtons').style.display = 'flex';
    document.getElementById('userMenu').style.display = 'none';
    document.getElementById('dashboardLink').style.display = 'none';
}

// Funciones para actualizar perfil (usadas por openEditProfileModal y el form de edición)

// Actualizar perfil de talento
window.updateTalentProfile = async function(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('editProfileMessage');
    
    try {
        const userId = currentUser.uid;
        const updateData = {
            name: document.getElementById('editName').value,
            phone: document.getElementById('editPhone').value,
            description: document.getElementById('editDescription').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            // NOTA: La lógica para actualizar idiomas, ubicación y demos es más compleja y se omite aquí por brevedad,
            // pero el esqueleto de la función ya existe y puede ser completado.
        };
        
        if (!updateData.name) {
            showMessage(messageDiv, '❌ Nombre es obligatorio', 'error');
            return;
        }
        
        showMessage(messageDiv, '🔄 Guardando cambios...', 'success');
        
        await db.collection('talents').doc(userId).update(updateData);
        
        showMessage(messageDiv, '✅ Perfil actualizado correctamente', 'success');
        
        setTimeout(() => {
            closeEditProfileModal();
            loadUserProfile(userId); // Recargar el perfil para ver los cambios
        }, 2000);
        
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
};

// Actualizar perfil de cliente
window.updateClientProfile = async function(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('editProfileMessage');
    
    try {
        const userId = currentUser.uid;
        const updateData = {
            name: document.getElementById('editName').value,
            phone: document.getElementById('editPhone').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const companyNameInput = document.getElementById('editCompanyName');
        if (companyNameInput) {
            updateData.companyName = companyNameInput.value;
        }
        
        if (!updateData.name) {
            showMessage(messageDiv, '❌ Nombre es obligatorio', 'error');
            return;
        }
        
        showMessage(messageDiv, '🔄 Guardando cambios...', 'success');
        
        await db.collection('clients').doc(userId).update(updateData);
        
        showMessage(messageDiv, '✅ Perfil actualizado correctamente', 'success');
        
        setTimeout(() => {
            closeEditProfileModal();
            loadUserProfile(userId); // Recargar el perfil para ver los cambios
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error actualizando perfil:', error);
        showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
};

// Hacer la función global para que se pueda llamar desde profile.js
window.loadUserProfile = loadUserProfile;
