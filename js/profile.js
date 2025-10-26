// Gestión de perfiles de usuario (CORREGIDO Y MEJORADO)

// Cargar perfil del usuario
window.loadUserProfile = async function() {
    console.log('Cargando perfil del usuario...');
    
    const profileContent = document.getElementById('profileContent');
    const profileSpinner = document.getElementById('profileSpinner');
    
    if (!currentUser) {
        console.log('No hay usuario autenticado');
        if (profileContent) {
            profileContent.innerHTML = `
                <div class="alert alert-warning text-center">
                    <h4><i class="fas fa-exclamation-triangle"></i> No autenticado</h4>
                    <p>Debes iniciar sesión para ver tu perfil.</p>
                    <button class="btn btn-primary mt-3" onclick="window.location.href='index.html'">
                        <i class="fas fa-home"></i> Ir a Inicio
                    </button>
                </div>
            `;
        }
        if (profileSpinner) profileSpinner.style.display = 'none';
        return;
    }

    try {
        console.log('Buscando datos del usuario:', currentUser.uid);
        
        // Mostrar spinner
        if (profileSpinner) profileSpinner.style.display = 'block';
        if (profileContent) profileContent.innerHTML = '';

        let userData = null;
        let userType = null;

        // Buscar en ambas colecciones
        const talentDoc = await db.collection('talents').doc(currentUser.uid).get();
        if (talentDoc.exists) {
            userData = talentDoc.data();
            userType = 'talent';
            console.log('Usuario encontrado como talento:', userData);
        } else {
            const clientDoc = await db.collection('clients').doc(currentUser.uid).get();
            if (clientDoc.exists) {
                userData = clientDoc.data();
                userType = 'client';
                console.log('Usuario encontrado como cliente:', userData);
            }
        }

        if (!userData) {
            throw new Error('Perfil no encontrado en la base de datos');
        }

        // Actualizar currentUserData global
        currentUserData = userData;
        currentUserData.type = userType;

        // Renderizar el perfil según el tipo de usuario
        if (profileContent) {
            if (userType === 'talent') {
                profileContent.innerHTML = renderTalentProfile(userData);
                setupTalentEventListeners();
            } else {
                profileContent.innerHTML = renderClientProfile(userData);
                setupClientEventListeners();
            }
        }

        console.log('Perfil cargado exitosamente');

    } catch (error) {
        console.error('Error cargando perfil:', error);
        
        if (profileContent) {
            profileContent.innerHTML = `
                <div class="alert alert-danger text-center">
                    <h4><i class="fas fa-exclamation-circle"></i> Error al cargar el perfil</h4>
                    <p>${error.message}</p>
                    <div class="mt-3">
                        <button class="btn btn-primary" onclick="window.loadUserProfile()">
                            <i class="fas fa-redo"></i> Reintentar
                        </button>
                        <button class="btn btn-outline ml-2" onclick="window.location.href='index.html'">
                            <i class="fas fa-home"></i> Ir a Inicio
                        </button>
                    </div>
                </div>
            `;
        }
    } finally {
        // Ocultar spinner
        if (profileSpinner) profileSpinner.style.display = 'none';
    }
};

// Renderizar perfil de talento
function renderTalentProfile(talent) {
    const countryName = typeof getCountryName !== 'undefined' && talent.country ? getCountryName(talent.country) : talent.country;
    const stateName = typeof getStateName !== 'undefined' && talent.country && talent.state ? getStateName(talent.country, talent.state) : talent.state;
    const languages = talent.languages && talent.languages.length > 0 ? talent.languages.join(', ') : 'No especificado';
    const homeStudio = talent.homeStudio === 'si' ? 'Sí' : 'No';
    const profilePicture = talent.profilePictureUrl || 'https://via.placeholder.com/150/007bff/ffffff?text=VO';
    
    const locationInfo = [talent.city, stateName, countryName].filter(Boolean).join(', ') || 'Ubicación no especificada';

    return `
        <div class="profile-header">
            <div class="profile-picture-section">
                <img src="${profilePicture}" alt="${talent.name}" class="profile-picture-large" onerror="this.src='https://via.placeholder.com/150/007bff/ffffff?text=VO'">
                <button class="btn btn-outline btn-sm mt-2" onclick="changeProfilePicture()">
                    <i class="fas fa-camera"></i> Cambiar foto
                </button>
            </div>
            <div class="profile-info">
                <h2>${talent.name || 'Nombre no especificado'}</h2>
                <p class="profile-email"><i class="fas fa-envelope"></i> ${talent.email || 'Email no especificado'}</p>
                <p class="profile-location"><i class="fas fa-map-marker-alt"></i> ${locationInfo}</p>
                <div class="profile-badges">
                    <span class="badge badge-talent"><i class="fas fa-microphone"></i> Talento de Voz</span>
                    <span class="badge ${talent.homeStudio === 'si' ? 'badge-success' : 'badge-warning'}">
                        <i class="fas fa-home"></i> Home Studio: ${homeStudio}
                    </span>
                </div>
            </div>
        </div>

        <div class="profile-actions">
            <button class="btn btn-primary" onclick="editTalentProfile()">
                <i class="fas fa-edit"></i> Editar Perfil
            </button>
            <button class="btn btn-outline" onclick="loadUserApplications()">
                <i class="fas fa-briefcase"></i> Mis Postulaciones
            </button>
        </div>

        <div class="profile-sections">
            <div class="profile-section">
                <h3><i class="fas fa-user"></i> Información Personal</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <label>Teléfono:</label>
                        <span>${talent.phone || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Género:</label>
                        <span>${talent.gender || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Edad:</label>
                        <span>${talent.realAge || talent.ageRange || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Nacionalidad:</label>
                        <span>${talent.nationality || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Idiomas:</label>
                        <span>${languages}</span>
                    </div>
                </div>
            </div>

            <div class="profile-section">
                <h3><i class="fas fa-file-alt"></i> Biografía</h3>
                <div class="bio-content">
                    ${talent.bio ? `<p>${talent.bio}</p>` : '<p class="text-muted">No hay biografía disponible.</p>'}
                </div>
            </div>

            <div class="profile-section">
                <h3><i class="fas fa-music"></i> Demos de Voz</h3>
                <div id="demosContainer" class="demos-container">
                    ${renderDemos(talent.demos)}
                </div>
                <button class="btn btn-outline btn-sm mt-2" onclick="showUploadDemoModal()">
                    <i class="fas fa-plus"></i> Agregar Demo
                </button>
            </div>
        </div>

        <!-- Modal para editar perfil -->
        <div id="editTalentModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-edit"></i> Editar Perfil de Talento</h3>
                    <span class="close-modal" onclick="closeEditModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="editTalentForm" onsubmit="updateTalentProfile(event)">
                        <!-- El formulario se llenará dinámicamente -->
                    </form>
                </div>
            </div>
        </div>

        <!-- Modal para subir demos -->
        <div id="uploadDemoModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-upload"></i> Subir Demo de Voz</h3>
                    <span class="close-modal" onclick="closeUploadDemoModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="uploadDemoForm" onsubmit="uploadDemo(event)">
                        <div class="form-group">
                            <label for="demoName">Nombre del Demo:</label>
                            <input type="text" id="demoName" name="demoName" class="form-control" required 
                                   placeholder="Ej: Demo comercial, Narración documental, etc.">
                        </div>
                        <div class="form-group">
                            <label for="demoFile">Archivo de Audio:</label>
                            <input type="file" id="demoFile" name="demoFile" accept="audio/*" class="form-control" required>
                            <small class="form-text text-muted">Formatos aceptados: MP3, WAV, OGG (Máximo 10MB)</small>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-upload"></i> Subir Demo
                            </button>
                            <button type="button" class="btn btn-outline" onclick="closeUploadDemoModal()">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

// Renderizar demos
function renderDemos(demos) {
    if (!demos || demos.length === 0) {
        return '<div class="alert alert-info"><i class="fas fa-info-circle"></i> No hay demos subidos todavía.</div>';
    }

    return demos.map((demo, index) => `
        <div class="demo-item" data-demo-id="${demo.id || index}">
            <div class="demo-info">
                <strong><i class="fas fa-file-audio"></i> ${demo.name || 'Demo ' + (index + 1)}</strong>
                <audio controls class="demo-audio">
                    <source src="${demo.url}" type="audio/mpeg">
                    Tu navegador no soporta el elemento de audio.
                </audio>
            </div>
            <button class="btn btn-danger btn-sm" onclick="deleteDemo('${demo.id || index}')" title="Eliminar demo">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// Renderizar perfil de cliente
function renderClientProfile(client) {
    const countryName = typeof getCountryName !== 'undefined' && client.country ? getCountryName(client.country) : client.country;
    const stateName = typeof getStateName !== 'undefined' && client.country && client.state ? getStateName(client.country, client.state) : client.state;
    const profilePicture = client.profilePictureUrl || 'https://via.placeholder.com/150/007bff/ffffff?text=VO';
    const companyInfo = client.clientType === 'empresa' ? 
        `<div class="info-item">
            <label>Empresa:</label>
            <span>${client.companyName || 'No especificado'}</span>
        </div>` : '';
    
    const locationInfo = [client.city, stateName, countryName].filter(Boolean).join(', ') || 'Ubicación no especificada';

    return `
        <div class="profile-header">
            <div class="profile-picture-section">
                <img src="${profilePicture}" alt="${client.name}" class="profile-picture-large" onerror="this.src='https://via.placeholder.com/150/007bff/ffffff?text=VO'">
                <button class="btn btn-outline btn-sm mt-2" onclick="changeProfilePicture()">
                    <i class="fas fa-camera"></i> Cambiar foto
                </button>
            </div>
            <div class="profile-info">
                <h2>${client.name || 'Nombre no especificado'}</h2>
                <p class="profile-email"><i class="fas fa-envelope"></i> ${client.email || 'Email no especificado'}</p>
                <p class="profile-location"><i class="fas fa-map-marker-alt"></i> ${locationInfo}</p>
                <div class="profile-badges">
                    <span class="badge badge-client"><i class="fas fa-briefcase"></i> Cliente</span>
                    <span class="badge badge-info">Tipo: ${client.clientType === 'empresa' ? 'Empresa' : 'Individual'}</span>
                </div>
            </div>
        </div>

        <div class="profile-actions">
            <button class="btn btn-primary" onclick="editClientProfile()">
                <i class="fas fa-edit"></i> Editar Perfil
            </button>
            <button class="btn btn-outline" onclick="loadClientJobs()">
                <i class="fas fa-list"></i> Mis Ofertas de Trabajo
            </button>
            <button class="btn btn-outline" onclick="loadFavorites()">
                <i class="fas fa-heart"></i> Talentos Favoritos
            </button>
        </div>

        <div class="profile-sections">
            <div class="profile-section">
                <h3><i class="fas fa-user"></i> Información de Contacto</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <label>Teléfono:</label>
                        <span>${client.phone || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Tipo de Cliente:</label>
                        <span>${client.clientType === 'empresa' ? 'Empresa' : 'Individual'}</span>
                    </div>
                    ${companyInfo}
                </div>
            </div>
        </div>

        <!-- Modal para editar perfil de cliente -->
        <div id="editClientModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-edit"></i> Editar Perfil de Cliente</h3>
                    <span class="close-modal" onclick="closeEditModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="editClientForm" onsubmit="updateClientProfile(event)">
                        <!-- El formulario se llenará dinámicamente -->
                    </form>
                </div>
            </div>
        </div>
    `;
}

// Configurar event listeners para talentos
function setupTalentEventListeners() {
    console.log('Configurando listeners para talento');
}

// Configurar event listeners para clientes
function setupClientEventListeners() {
    console.log('Configurando listeners para cliente');
}

// Editar perfil de talento
function editTalentProfile() {
    const modal = document.getElementById('editTalentModal');
    const form = document.getElementById('editTalentForm');
    
    if (!modal || !form) {
        console.error('Modal o form no encontrado');
        return;
    }

    // Llenar formulario con datos actuales
    form.innerHTML = `
        <div class="form-group">
            <label for="editName">Nombre:</label>
            <input type="text" id="editName" name="name" class="form-control" 
                   value="${currentUserData.name || ''}" required>
        </div>
        
        <div class="form-group">
            <label for="editPhone">Teléfono:</label>
            <input type="tel" id="editPhone" name="phone" class="form-control" 
                   value="${currentUserData.phone || ''}" placeholder="+1234567890">
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label for="editCountry">País:</label>
                <select id="editCountry" name="country" class="form-control" required>
                    <option value="">Seleccionar país</option>
                </select>
            </div>
            <div class="form-group">
                <label for="editState">Estado/Provincia:</label>
                <select id="editState" name="state" class="form-control" required>
                    <option value="">Seleccionar estado</option>
                </select>
            </div>
        </div>
        
        <div class="form-group">
            <label for="editCity">Ciudad:</label>
            <input type="text" id="editCity" name="city" class="form-control" 
                   value="${currentUserData.city || ''}" required>
        </div>
        
        <div class="form-group">
            <label for="editGender">Género:</label>
            <select id="editGender" name="gender" class="form-control" required>
                <option value="">Seleccionar género</option>
                <option value="masculino" ${currentUserData.gender === 'masculino' ? 'selected' : ''}>Masculino</option>
                <option value="femenino" ${currentUserData.gender === 'femenino' ? 'selected' : ''}>Femenino</option>
                <option value="otro" ${currentUserData.gender === 'otro' ? 'selected' : ''}>Otro</option>
            </select>
        </div>
        
        <div class="form-group">
            <label for="editRealAge">Edad real (opcional):</label>
            <input type="number" id="editRealAge" name="realAge" class="form-control" 
                   min="1" max="100" value="${currentUserData.realAge || ''}" placeholder="Ej: 25">
        </div>
        
        <div class="form-group">
            <label for="editNationality">Nacionalidad:</label>
            <input type="text" id="editNationality" name="nationality" class="form-control" 
                   value="${currentUserData.nationality || ''}" placeholder="Ej: Mexicana">
        </div>
        
        <div class="form-group">
            <label for="editBio">Biografía:</label>
            <textarea id="editBio" name="bio" class="form-control" rows="4" 
                      placeholder="Describe tu experiencia, estilo vocal, etc.">${currentUserData.bio || ''}</textarea>
        </div>
        
        <div class="form-group">
            <label for="editHomeStudio">Home Studio:</label>
            <select id="editHomeStudio" name="homeStudio" class="form-control" required>
                <option value="si" ${currentUserData.homeStudio === 'si' ? 'selected' : ''}>Sí</option>
                <option value="no" ${currentUserData.homeStudio === 'no' ? 'selected' : ''}>No</option>
            </select>
        </div>
        
        <div class="form-actions">
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> Guardar Cambios
            </button>
            <button type="button" class="btn btn-outline" onclick="closeEditModal()">
                <i class="fas fa-times"></i> Cancelar
            </button>
        </div>
    `;

    // Cargar datos de ubicación
    if (typeof window.loadLocationData === 'function') {
        window.loadLocationData('editCountry', 'editState', 'editCity', currentUserData.country, currentUserData.state);
    } else {
        console.warn('loadLocationData no disponible');
    }

    modal.style.display = 'flex';
}

// Actualizar perfil de talento
async function updateTalentProfile(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        submitBtn.disabled = true;

        const updateData = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            country: formData.get('country'),
            state: formData.get('state'),
            city: formData.get('city'),
            gender: formData.get('gender'),
            realAge: formData.get('realAge') || null,
            nationality: formData.get('nationality'),
            bio: formData.get('bio'),
            homeStudio: formData.get('homeStudio'),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        console.log('Actualizando perfil de talento:', updateData);

        // Actualizar en Firestore
        await db.collection('talents').doc(currentUser.uid).update(updateData);

        // Actualizar datos locales
        Object.assign(currentUserData, updateData);

        // Cerrar modal y recargar perfil
        closeEditModal();
        alert('Perfil actualizado correctamente');
        window.loadUserProfile();

    } catch (error) {
        console.error('Error actualizando perfil:', error);
        alert('Error al actualizar el perfil: ' + error.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Cerrar modal de edición
function closeEditModal() {
    const talentModal = document.getElementById('editTalentModal');
    const clientModal = document.getElementById('editClientModal');
    
    if (talentModal) talentModal.style.display = 'none';
    if (clientModal) clientModal.style.display = 'none';
}

// Mostrar modal para subir demo
function showUploadDemoModal() {
    const modal = document.getElementById('uploadDemoModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Cerrar modal de upload demo
function closeUploadDemoModal() {
    const modal = document.getElementById('uploadDemoModal');
    const form = document.getElementById('uploadDemoForm');
    
    if (modal) modal.style.display = 'none';
    if (form) form.reset();
}

// Subir demo
async function uploadDemo(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
        submitBtn.disabled = true;

        const demoFile = formData.get('demoFile');
        const demoName = formData.get('demoName');

        if (!demoFile || demoFile.size === 0) {
            throw new Error('Selecciona un archivo de audio');
        }

        // Validar tamaño del archivo (10MB máximo)
        if (demoFile.size > 10 * 1024 * 1024) {
            throw new Error('El archivo es demasiado grande. Máximo 10MB.');
        }

        console.log('Subiendo demo:', demoName);

        // Subir archivo a Firebase Storage
        const fileName = `demo_${Date.now()}_${demoFile.name}`;
        const storageRef = storage.ref(`demos/${currentUser.uid}/${fileName}`);
        const snapshot = await storageRef.put(demoFile);
        const downloadURL = await snapshot.ref.getDownloadURL();

        console.log('Demo subido:', downloadURL);

        // Crear objeto demo
        const demo = {
            id: Date.now().toString(),
            name: demoName,
            url: downloadURL,
            fileName: fileName,
            size: demoFile.size,
            uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Agregar demo al array de demos del talento
        await db.collection('talents').doc(currentUser.uid).update({
            demos: firebase.firestore.FieldValue.arrayUnion(demo),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Actualizar datos locales
        if (!currentUserData.demos) {
            currentUserData.demos = [];
        }
        currentUserData.demos.push(demo);

        // Cerrar modal y actualizar UI
        closeUploadDemoModal();
        alert('Demo subido correctamente');
        window.loadUserProfile();

    } catch (error) {
        console.error('Error subiendo demo:', error);
        alert('Error al subir el demo: ' + error.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Eliminar demo
async function deleteDemo(demoId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este demo?')) {
        return;
    }

    try {
        // Encontrar el demo a eliminar
        const demoToDelete = currentUserData.demos.find(demo => demo.id === demoId);
        if (!demoToDelete) {
            throw new Error('Demo no encontrado');
        }

        // Eliminar de Firestore
        await db.collection('talents').doc(currentUser.uid).update({
            demos: firebase.firestore.FieldValue.arrayRemove(demoToDelete),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Actualizar datos locales
        currentUserData.demos = currentUserData.demos.filter(demo => demo.id !== demoId);

        // Actualizar UI
        alert('Demo eliminado correctamente');
        window.loadUserProfile();

    } catch (error) {
        console.error('Error eliminando demo:', error);
        alert('Error al eliminar el demo: ' + error.message);
    }
}

// Cambiar foto de perfil
async function changeProfilePicture() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar que sea una imagen
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona un archivo de imagen válido.');
            return;
        }

        // Validar tamaño (5MB máximo)
        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen es demasiado grande. Máximo 5MB.');
            return;
        }

        try {
            // Subir nueva foto
            const storageRef = storage.ref(`profile-pictures/${currentUser.uid}`);
            const snapshot = await storageRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();

            console.log('Nueva foto de perfil subida:', downloadURL);

            // Actualizar en Firestore
            const collectionName = currentUserData.type === 'talent' ? 'talents' : 'clients';
            await db.collection(collectionName).doc(currentUser.uid).update({
                profilePictureUrl: downloadURL,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Actualizar datos locales
            currentUserData.profilePictureUrl = downloadURL;

            // Actualizar UI
            alert('Foto de perfil actualizada correctamente');
            window.loadUserProfile();

        } catch (error) {
            console.error('Error cambiando foto de perfil:', error);
            alert('Error al cambiar la foto de perfil: ' + error.message);
        }
    };

    input.click();
}

// Funciones para cliente
function editClientProfile() {
    const modal = document.getElementById('editClientModal');
    const form = document.getElementById('editClientForm');
    
    if (!modal || !form) {
        console.error('Modal o form no encontrado');
        return;
    }

    form.innerHTML = `
        <div class="form-group">
            <label for="editClientName">Nombre:</label>
            <input type="text" id="editClientName" name="name" class="form-control" 
                   value="${currentUserData.name || ''}" required>
        </div>
        
        <div class="form-group">
            <label for="editClientPhone">Teléfono:</label>
            <input type="tel" id="editClientPhone" name="phone" class="form-control" 
                   value="${currentUserData.phone || ''}" placeholder="+1234567890">
        </div>
        
        <div class="form-group">
            <label for="editClientType">Tipo de Cliente:</label>
            <select id="editClientType" name="clientType" class="form-control" required>
                <option value="individual" ${currentUserData.clientType === 'individual' ? 'selected' : ''}>Individual</option>
                <option value="empresa" ${currentUserData.clientType === 'empresa' ? 'selected' : ''}>Empresa</option>
            </select>
        </div>
        
        <div id="companyNameField" class="form-group" style="${currentUserData.clientType === 'empresa' ? '' : 'display: none;'}">
            <label for="editCompanyName">Nombre de la Empresa:</label>
            <input type="text" id="editCompanyName" name="companyName" class="form-control" 
                   value="${currentUserData.companyName || ''}" placeholder="Nombre de la empresa">
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label for="editClientCountry">País:</label>
                <select id="editClientCountry" name="country" class="form-control" required>
                    <option value="">Seleccionar país</option>
                </select>
            </div>
            <div class="form-group">
                <label for="editClientState">Estado/Provincia:</label>
                <select id="editClientState" name="state" class="form-control" required>
                    <option value="">Seleccionar estado</option>
                </select>
            </div>
        </div>
        
        <div class="form-group">
            <label for="editClientCity">Ciudad:</label>
            <input type="text" id="editClientCity" name="city" class="form-control" 
                   value="${currentUserData.city || ''}" required>
        </div>
        
        <div class="form-actions">
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> Guardar Cambios
            </button>
            <button type="button" class="btn btn-outline" onclick="closeEditModal()">
                <i class="fas fa-times"></i> Cancelar
            </button>
        </div>
    `;

    // Mostrar/ocultar campo de empresa según tipo de cliente
    document.getElementById('editClientType').addEventListener('change', function() {
        document.getElementById('companyNameField').style.display = 
            this.value === 'empresa' ? 'block' : 'none';
    });

    // Cargar datos de ubicación
    if (typeof window.loadLocationData === 'function') {
        window.loadLocationData('editClientCountry', 'editClientState', 'editClientCity', currentUserData.country, currentUserData.state);
    } else {
        console.warn('loadLocationData no disponible');
    }

    modal.style.display = 'flex';
}

async function updateClientProfile(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        submitBtn.disabled = true;

        const updateData = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            clientType: formData.get('clientType'),
            country: formData.get('country'),
            state: formData.get('state'),
            city: formData.get('city'),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Agregar nombre de empresa si es empresa
        if (formData.get('clientType') === 'empresa') {
            updateData.companyName = formData.get('companyName');
        } else {
            updateData.companyName = null;
        }

        console.log('Actualizando perfil de cliente:', updateData);

        // Actualizar en Firestore
        await db.collection('clients').doc(currentUser.uid).update(updateData);

        // Actualizar datos locales
        Object.assign(currentUserData, updateData);

        // Cerrar modal y recargar perfil
        closeEditModal();
        alert('Perfil actualizado correctamente');
        window.loadUserProfile();

    } catch (error) {
        console.error('Error actualizando perfil:', error);
        alert('Error al actualizar el perfil: ' + error.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Funciones placeholder para futuras implementaciones
function loadUserApplications() {
    alert('Funcionalidad en desarrollo - Mis Postulaciones');
}

function loadClientJobs() {
    alert('Funcionalidad en desarrollo - Mis Ofertas de Trabajo');
}

function loadFavorites() {
    alert('Funcionalidad en desarrollo - Talentos Favoritos');
}

console.log('Profile.js cargado correctamente');
