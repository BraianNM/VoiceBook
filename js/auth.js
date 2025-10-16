// Funciones de Autenticación

// Verificar estado de autenticación
function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            updateUIAfterLogin();
            loadUserProfile(user.uid);
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
        console.log('🔧 Configuración:', {
            cloudName: cloudinaryConfig.cloudName,
            uploadPreset: cloudinaryConfig.uploadPreset
        });

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
        // Validar que sea archivo de audio
        if (!file.type.startsWith('audio/')) {
            console.warn(`❌ ${file.name} no es un archivo de audio válido`);
            continue;
        }
        
        // Validar tamaño (10MB máximo)
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
            
            console.log(`✅ Demo subido: ${file.name}`, result);
            
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
        
        // Mostrar mensaje de carga
        showMessage(messageDiv, 'Creando cuenta...', 'success');
        
        // Crear usuario en Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Subir archivos de audio si existen
        const audioFiles = document.getElementById('talentDemos').files;
        let demos = [];
        
        if (audioFiles.length > 0) {
            showMessage(messageDiv, `Subiendo ${audioFiles.length} demo(s) de audio...`, 'success');
            demos = await uploadAudioFiles(audioFiles);
        }
        
        // Guardar datos en Firestore
        await db.collection('talents').doc(user.uid).set({
            name: document.getElementById('talentName').value,
            email: email,
            phone: document.getElementById('talentPhone').value,
            gender: document.getElementById('talentGender').value,
            description: document.getElementById('talentDescription').value,
            languages: getSelectedLanguages(),
            homeStudio: document.getElementById('talentHomeStudio').value,
            ageRange: document.getElementById('talentAgeRange').value,
            nationality: document.getElementById('talentNationality').value,
            realAge: parseInt(document.getElementById('talentRealAge').value) || null,
            demos: demos,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Mensaje de éxito
        const successMsg = demos.length > 0 
            ? `🎉 ¡Registro exitoso! Se subieron ${demos.length} demo(s) de audio.`
            : '🎉 ¡Registro exitoso!';
            
        showMessage(messageDiv, successMsg, 'success');
        
        // Cerrar modal después de 3 segundos
        setTimeout(() => {
            closeAllModals();
            document.getElementById('talentForm').reset();
            loadTalents();
        }, 3000);
        
    } catch (error) {
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
        setTimeout(() => closeAllModals(), 1000);
        
    } catch (error) {
        showMessage(messageDiv, 'Error: ' + error.message, 'error');
    }
}

// Cerrar sesión
async function logoutUser() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// Actualizar UI después del login
function updateUIAfterLogin() {
    document.getElementById('authButtons').style.display = 'none';
    document.getElementById('userMenu').style.display = 'block';
    document.getElementById('userName').textContent = currentUser.email;
    document.getElementById('dashboardLink').style.display = 'block';
}

// Actualizar UI después del logout
function updateUIAfterLogout() {
    document.getElementById('authButtons').style.display = 'flex';
    document.getElementById('userMenu').style.display = 'none';
    document.getElementById('dashboardLink').style.display = 'none';
}

// Actualizar perfil de talento - FUNCIÓN CORREGIDA
window.updateTalentProfile = async function() {
    const messageDiv = document.getElementById('editProfileMessage');
    
    try {
        const userId = currentUser.uid;
        const updateData = {
            name: document.getElementById('editName').value,
            phone: document.getElementById('editPhone').value,
            description: document.getElementById('editDescription').value,
            languages: getEditSelectedLanguages(),
            homeStudio: document.getElementById('editHomeStudio').value,
            nationality: document.getElementById('editNationality').value,
            realAge: parseInt(document.getElementById('editRealAge').value) || null,
            ageRange: document.getElementById('editAgeRange').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (!updateData.name || !updateData.phone) {
            showMessage(messageDiv, '❌ Nombre y teléfono son obligatorios', 'error');
            return;
        }
        
        showMessage(messageDiv, '🔄 Guardando cambios...', 'success');
        
        // Subir nuevos archivos de audio si existen
        const newAudioFiles = document.getElementById('newDemos').files;
        let newDemos = [];
        
        if (newAudioFiles.length > 0) {
            showMessage(messageDiv, `🎵 Subiendo ${newAudioFiles.length} demo(s) de audio...`, 'success');
            newDemos = await uploadAudioFiles(newAudioFiles);
            console.log('📁 Nuevos demos subidos:', newDemos);
        }
        
        // Obtener demos existentes
        const currentDoc = await db.collection('talents').doc(userId).get();
        const currentDemos = currentDoc.data().demos || [];
        
        // Combinar demos existentes con nuevos
        if (newDemos.length > 0) {
            updateData.demos = [...currentDemos, ...newDemos];
        } else {
            updateData.demos = currentDemos;
        }
        
        console.log('💾 Actualizando perfil con datos:', updateData);
        
        // Actualizar en Firestore
        await db.collection('talents').doc(userId).update(updateData);
        
        showMessage(messageDiv, `✅ Perfil actualizado correctamente. ${newDemos.length} nuevo(s) demo(s) agregado(s).`, 'success');
        
        // Recargar TODO después de 2 segundos
        setTimeout(() => {
            closeEditProfileModal();
            loadUserProfile(userId);
            loadTalents();
            showDashboard();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error actualizando perfil:', error);
        showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
};

window.loadUserProfile = loadUserProfile;
