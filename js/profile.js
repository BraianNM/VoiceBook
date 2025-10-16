// Funciones de Perfil y Edición

// Cargar perfil del usuario
async function loadUserProfile(userId) {
    try {
        let userProfile = null;
        
        // Intentar cargar como talento
        const talentDoc = await db.collection('talents').doc(userId).get();
        if (talentDoc.exists) {
            userProfile = {
                type: 'talent',
                ...talentDoc.data()
            };
        } else {
            // Intentar cargar como cliente
            const clientDoc = await db.collection('clients').doc(userId).get();
            if (clientDoc.exists) {
                userProfile = {
                    type: 'client',
                    ...clientDoc.data()
                };
            }
        }
        
        if (userProfile) {
            displayUserProfile(userProfile);
        }
        
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }
}

// Mostrar perfil en el dashboard - FUNCIÓN MEJORADA
function displayUserProfile(profile) {
    const profileContent = document.getElementById('userProfileContent');
    console.log('📊 Mostrando perfil:', profile.type);
    console.log('🎵 Demos en el perfil:', profile.demos);
    
    if (profile.type === 'talent') {
        // Crear HTML para demos
        let demosHTML = '';
        if (profile.demos && profile.demos.length > 0) {
            console.log(`🎵 Mostrando ${profile.demos.length} demos en el dashboard`);
            demosHTML = `
                <div class="demos-section">
                    <h4>Mis Demos de Audio</h4>
                    ${profile.demos.map((demo, index) => `
                        <div class="demo-item" style="margin-bottom: 15px; padding: 12px; background: white; border: 1px solid #e9ecef; border-radius: 6px;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <audio controls style="flex: 1;">
                                    <source src="${demo.url}" type="audio/mpeg">
                                </audio>
                                <span class="demo-name" style="min-width: 150px; font-size: 14px;">
                                    ${demo.name || `Demo ${index + 1}`}
                                </span>
                                <button class="btn btn-danger btn-sm" onclick="deleteDemo('${demo.publicId}', '${currentUser.uid}')">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>
                            </div>
                            <div style="font-size: 12px; color: #666; margin-top: 5px;">
                                ${Math.round(demo.duration || 0)} segundos • 
                                ${demo.size ? (demo.size / 1024 / 1024).toFixed(1) + ' MB' : 'Tamaño no disponible'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            demosHTML = '<p style="color: #666; text-align: center; padding: 20px;">No hay demos de audio subidos.</p>';
        }
        
        profileContent.innerHTML = `
            <div class="profile-header">
                <h3>Mi Perfil - Talento</h3>
                <button class="btn btn-primary" onclick="openEditProfileModal()">
                    <i class="fas fa-edit"></i> Editar Perfil
                </button>
            </div>
            
            <div class="profile-info">
                <div class="info-grid">
                    <div class="info-item">
                        <label>Nombre:</label>
                        <span>${profile.name || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Email:</label>
                        <span>${profile.email || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Teléfono:</label>
                        <span>${profile.phone || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Género:</label>
                        <span>${profile.gender === 'hombre' ? 'Hombre' : 'Mujer'}</span>
                    </div>
                    <div class="info-item">
                        <label>Idiomas:</label>
                        <span>${Array.isArray(profile.languages) ? profile.languages.join(', ') : profile.languages || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Home Studio:</label>
                        <span>${profile.homeStudio === 'si' ? 'Sí' : 'No'}</span>
                    </div>
                    <div class="info-item">
                        <label>Nacionalidad:</label>
                        <span>${profile.nationality || 'No especificado'}</span>
                    </div>
                    ${profile.realAge ? `
                    <div class="info-item">
                        <label>Edad real:</label>
                        <span>${profile.realAge} años</span>
                    </div>
                    ` : ''}
                    ${profile.ageRange ? `
                    <div class="info-item">
                        <label>Rango de edades:</label>
                        <span>${profile.ageRange}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="description-section">
                    <label>Descripción:</label>
                    <p>${profile.description || 'Sin descripción'}</p>
                </div>
                
                ${demosHTML}
            </div>
        `;
    } else {
        // Perfil de cliente
        profileContent.innerHTML = `
            <div class="profile-header">
                <h3>Mi Perfil - Cliente</h3>
                <button class="btn btn-primary" onclick="openEditProfileModal()">
                    <i class="fas fa-edit"></i> Editar Perfil
                </button>
            </div>
            
            <div class="profile-info">
                <div class="info-grid">
                    <div class="info-item">
                        <label>Nombre:</label>
                        <span>${profile.name || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Email:</label>
                        <span>${profile.email || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Teléfono:</label>
                        <span>${profile.phone || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Tipo:</label>
                        <span>${profile.type === 'empresa' ? 'Empresa' : 'Particular'}</span>
                    </div>
                    ${profile.companyName ? `
                        <div class="info-item">
                            <label>Empresa:</label>
                            <span>${profile.companyName}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
}

// Abrir modal de edición de perfil
function openEditProfileModal() {
    loadEditProfileForm();
    document.getElementById('editProfileModal').style.display = 'flex';
}

// Cargar formulario de edición
async function loadEditProfileForm() {
    try {
        const userId = currentUser.uid;
        let userProfile = null;
        
        // Cargar datos actuales
        const talentDoc = await db.collection('talents').doc(userId).get();
        if (talentDoc.exists) {
            userProfile = talentDoc.data();
            displayTalentEditForm(userProfile);
        } else {
            const clientDoc = await db.collection('clients').doc(userId).get();
            if (clientDoc.exists) {
                userProfile = clientDoc.data();
                displayClientEditForm(userProfile);
            }
        }
        
    } catch (error) {
        console.error('Error cargando formulario de edición:', error);
    }
}

// Mostrar formulario de edición para talentos
function displayTalentEditForm(profile) {
    const editForm = document.getElementById('editProfileForm');
    
    editForm.innerHTML = `
        <h3>Editar Perfil - Talento</h3>
        
        <div class="form-group">
            <label for="editName">Nombre Completo *</label>
            <input type="text" id="editName" class="form-control" value="${profile.name || ''}" required>
        </div>
        
        <div class="form-group">
            <label for="editPhone">Teléfono *</label>
            <input type="tel" id="editPhone" class="form-control" value="${profile.phone || ''}" required>
        </div>
        
        <div class="form-group">
            <label for="editDescription">Descripción</label>
            <textarea id="editDescription" class="form-control" rows="4">${profile.description || ''}</textarea>
        </div>
        
        <div class="form-group">
            <label for="editNationality">Nacionalidad</label>
            <input type="text" id="editNationality" class="form-control" value="${profile.nationality || ''}">
        </div>
        
        <div class="form-group">
            <label for="editRealAge">Edad real</label>
            <input type="number" id="editRealAge" class="form-control" value="${profile.realAge || ''}">
        </div>
        
        <div class="form-group">
            <label for="editAgeRange">Rango de edades que puede interpretar</label>
            <input type="text" id="editAgeRange" class="form-control" value="${profile.ageRange || ''}">
        </div>
        
        <div class="form-group">
            <label>Agregar nuevos demos de audio</label>
            <input type="file" id="newDemos" class="form-control" accept="audio/*" multiple>
            <small class="text-muted">Puedes agregar nuevos archivos de audio</small>
        </div>
        
        <div id="editProfileMessage"></div>
        
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeEditProfileModal()">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="updateTalentProfile()">Guardar Cambios</button>
        </div>
    `;
}

// Actualizar perfil de talento
async function updateTalentProfile() {
    const messageDiv = document.getElementById('editProfileMessage');
    
    try {
        const userId = currentUser.uid;
        const updateData = {
            name: document.getElementById('editName').value,
            phone: document.getElementById('editPhone').value,
            description: document.getElementById('editDescription').value,
            nationality: document.getElementById('editNationality').value,
            realAge: parseInt(document.getElementById('editRealAge').value) || null,
            ageRange: document.getElementById('editAgeRange').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Subir nuevos archivos de audio si existen
        const newAudioFiles = document.getElementById('newDemos').files;
        if (newAudioFiles.length > 0) {
            showMessage(messageDiv, 'Subiendo nuevos demos...', 'success');
            const newDemos = await uploadAudioFiles(newAudioFiles);
            
            // Obtener demos existentes y agregar los nuevos
            const currentDoc = await db.collection('talents').doc(userId).get();
            const currentDemos = currentDoc.data().demos || [];
            updateData.demos = [...currentDemos, ...newDemos];
        }
        
        // Actualizar en Firestore
        await db.collection('talents').doc(userId).update(updateData);
        
        showMessage(messageDiv, '✅ Perfil actualizado correctamente', 'success');
        
        // Recargar perfil y cerrar modal después de 2 segundos
        setTimeout(() => {
            closeEditProfileModal();
            loadUserProfile(userId);
        }, 2000);
        
    } catch (error) {
        showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
}

// Eliminar demo de audio
async function deleteDemo(publicId, userId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este demo?')) {
        return;
    }
    
    try {
        // Aquí podrías agregar código para eliminar el archivo de Cloudinary
        // Por ahora solo lo eliminamos de Firestore
        
        const currentDoc = await db.collection('talents').doc(userId).get();
        const currentDemos = currentDoc.data().demos || [];
        const updatedDemos = currentDemos.filter(demo => demo.publicId !== publicId);
        
        await db.collection('talents').doc(userId).update({
            demos: updatedDemos
        });
        
        // Recargar perfil
        loadUserProfile(userId);
        
    } catch (error) {
        console.error('Error eliminando demo:', error);
        alert('Error eliminando el demo');
    }
}

// Cerrar modal de edición
function closeEditProfileModal() {
    document.getElementById('editProfileModal').style.display = 'none';
}

// Funciones globales
window.openEditProfileModal = openEditProfileModal;
window.closeEditProfileModal = closeEditProfileModal;
window.updateTalentProfile = updateTalentProfile;
window.deleteDemo = deleteDemo;
