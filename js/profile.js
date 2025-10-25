// profile.js - Gestión de perfiles (CORREGIDO COMPLETAMENTE)

let profileInitialized = false;

// Inicializar perfil
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Profile.js inicializando...');
    
    // Esperar a que Firebase y auth estén listos
    const checkAuthAndLoad = () => {
        if (typeof auth !== 'undefined' && auth.currentUser) {
            console.log('🔥 Usuario autenticado, cargando perfil...');
            loadUserProfile(auth.currentUser.uid);
            setupProfileEventListeners();
            profileInitialized = true;
        } else if (typeof currentUser !== 'undefined' && currentUser) {
            console.log('👤 Usuario disponible, cargando perfil...');
            loadUserProfile(currentUser.uid);
            setupProfileEventListeners();
            profileInitialized = true;
        } else {
            console.log('⏳ Esperando autenticación...');
            setTimeout(checkAuthAndLoad, 500);
        }
    };
    
    checkAuthAndLoad();
});

// Configurar event listeners del perfil
function setupProfileEventListeners() {
    console.log('Configurando event listeners del perfil...');
    
    // Botones de edición
    document.getElementById('editProfileBtn')?.addEventListener('click', () => {
        toggleEditMode(true);
    });
    
    document.getElementById('saveProfileBtn')?.addEventListener('click', saveProfile);
    document.getElementById('cancelEditBtn')?.addEventListener('click', () => {
        toggleEditMode(false);
        loadUserProfile(currentUser.uid); // Recargar datos originales
    });
    
    // Subida de archivos
    document.getElementById('profilePictureInput')?.addEventListener('change', uploadProfilePicture);
    document.getElementById('demoFileInput')?.addEventListener('change', uploadDemo);
    
    // Navegación de pestañas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.getAttribute('data-tab'));
        });
    });
    
    // Botón de logout
    document.getElementById('profileLogoutBtn')?.addEventListener('click', logoutUser);
}

// Cambiar entre pestañas
function switchTab(tabName) {
    console.log('Cambiando a pestaña:', tabName);
    
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Desactivar todos los botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar pestaña seleccionada
    const activeTab = document.getElementById(tabName + 'Tab');
    if (activeTab) {
        activeTab.style.display = 'block';
    }
    
    // Activar botón
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Cargar datos específicos de la pestaña
    if (tabName === 'jobs' && currentUserData?.type === 'client') {
        loadClientJobs();
    } else if (tabName === 'applications' && currentUserData?.type === 'talent') {
        loadTalentApplications();
    } else if (tabName === 'favorites' && currentUserData?.type === 'client') {
        loadFavorites();
    }
}

// Cargar perfil del usuario (FUNCIÓN PRINCIPAL CORREGIDA)
window.loadUserProfile = async function(userId) {
    console.log('Cargando perfil para:', userId);
    
    try {
        // Determinar tipo de usuario y cargar datos
        let userData = null;
        let userType = null;
        
        // Intentar cargar como talento
        const talentDoc = await db.collection('talents').doc(userId).get();
        if (talentDoc.exists) {
            userData = talentDoc.data();
            userType = 'talent';
            console.log('Perfil cargado como talento');
        } else {
            // Intentar cargar como cliente
            const clientDoc = await db.collection('clients').doc(userId).get();
            if (clientDoc.exists) {
                userData = clientDoc.data();
                userType = 'client';
                console.log('Perfil cargado como cliente');
            } else {
                console.error('No se encontró perfil para el usuario');
                document.getElementById('profileContent').innerHTML = '<p class="error">Perfil no encontrado.</p>';
                return;
            }
        }
        
        // Actualizar datos globales
        currentUserData = { ...userData, id: userId, type: userType };
        
        // Renderizar perfil según el tipo
        if (userType === 'talent') {
            renderTalentProfile(userData, userId);
        } else {
            renderClientProfile(userData, userId);
        }
        
        // Actualizar UI
        updateProfileUI();
        
    } catch (error) {
        console.error('Error cargando perfil:', error);
        document.getElementById('profileContent').innerHTML = '<p class="error">Error al cargar el perfil.</p>';
    }
};

// Renderizar perfil de talento
function renderTalentProfile(talent, userId) {
    const profileContent = document.getElementById('profileContent');
    if (!profileContent) return;
    
    const countryName = typeof getCountryName !== 'undefined' ? getCountryName(talent.country) : talent.country;
    const stateName = typeof getStateName !== 'undefined' ? getStateName(talent.country, talent.state) : talent.state;
    const locationInfo = (countryName && stateName && talent.city) ? `${talent.city}, ${stateName}, ${countryName}` : 'N/A';
    const languages = talent.languages ? talent.languages.join(', ') : 'N/A';
    const homeStudio = talent.homeStudio === 'si' ? '<i class="fas fa-check-circle text-success"></i> Sí' : '<i class="fas fa-times-circle text-danger"></i> No';
    const profilePicture = talent.profilePictureUrl || 'img/default-avatar.png';
    
    // Generar HTML de demos
    let demosHtml = '';
    if (talent.demos && talent.demos.length > 0) {
        demosHtml = talent.demos.map(demo => `
            <div class="demo-item">
                <div class="demo-info">
                    <span class="demo-name">${demo.name || 'Demo'}</span>
                    <span class="demo-duration">${demo.duration ? formatDuration(demo.duration) : 'N/A'}</span>
                </div>
                <div class="demo-actions">
                    <audio controls src="${demo.url}"></audio>
                    <button class="btn btn-danger btn-sm" onclick="deleteDemo('${demo.publicId}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        demosHtml = '<p>No hay demos subidos todavía.</p>';
    }
    
    profileContent.innerHTML = `
        <div class="profile-header">
            <div class="profile-picture-section">
                <img src="${profilePicture}" alt="${talent.name}" id="currentProfilePicture" class="profile-picture-large">
                <div class="profile-picture-actions">
                    <input type="file" id="profilePictureInput" accept="image/*" style="display: none;">
                    <button class="btn btn-outline btn-sm" onclick="document.getElementById('profilePictureInput').click()">
                        <i class="fas fa-camera"></i> Cambiar foto
                    </button>
                </div>
            </div>
            
            <div class="profile-info">
                <h1 id="profileName">${talent.name || 'Talento'}</h1>
                <p class="profile-location"><i class="fas fa-map-marker-alt"></i> ${locationInfo}</p>
                <p class="profile-email"><i class="fas fa-envelope"></i> ${talent.email || 'N/A'}</p>
                <p class="profile-phone"><i class="fas fa-phone"></i> ${talent.phone || 'N/A'}</p>
                
                <div class="profile-actions">
                    <button id="editProfileBtn" class="btn btn-primary">
                        <i class="fas fa-edit"></i> Editar Perfil
                    </button>
                </div>
            </div>
        </div>
        
        <div class="profile-tabs">
            <div class="tab-buttons">
                <button class="tab-btn active" data-tab="info"><i class="fas fa-user"></i> Información</button>
                <button class="tab-btn" data-tab="demos"><i class="fas fa-music"></i> Demos</button>
                <button class="tab-btn" data-tab="applications"><i class="fas fa-briefcase"></i> Postulaciones</button>
            </div>
            
            <div class="tab-content" id="infoTab" style="display: block;">
                <div class="profile-section">
                    <h2>Información Personal</h2>
                    <div class="info-grid">
                        <div class="info-item"><label>Género:</label><span id="infoGender">${talent.gender || 'N/A'}</span></div>
                        <div class="info-item"><label>Edad:</label><span id="infoAge">${talent.realAge || talent.ageRange || 'N/A'}</span></div>
                        <div class="info-item"><label>Nacionalidad:</label><span id="infoNationality">${talent.nationality || 'N/A'}</span></div>
                        <div class="info-item"><label>Idiomas:</label><span id="infoLanguages">${languages}</span></div>
                        <div class="info-item"><label>Home Studio:</label><span id="infoHomeStudio">${homeStudio}</span></div>
                    </div>
                </div>
                
                <div class="profile-section">
                    <h2>Biografía</h2>
                    <p id="infoBio">${talent.bio || 'No hay biografía disponible.'}</p>
                </div>
            </div>
            
            <div class="tab-content" id="demosTab">
                <div class="profile-section">
                    <h2>Mis Demos</h2>
                    <div class="upload-demo-section">
                        <input type="file" id="demoFileInput" accept="audio/*" style="display: none;">
                        <button class="btn btn-primary" onclick="document.getElementById('demoFileInput').click()">
                            <i class="fas fa-upload"></i> Subir Nuevo Demo
                        </button>
                        <p class="help-text">Formatos aceptados: MP3, WAV, M4A. Tamaño máximo: 10MB</p>
                    </div>
                    
                    <div class="demos-container" id="demosContainer">
                        ${demosHtml}
                    </div>
                </div>
            </div>
            
            <div class="tab-content" id="applicationsTab">
                <div class="profile-section">
                    <h2>Mis Postulaciones</h2>
                    <div id="applicationsContainer">
                        <p>Cargando postulaciones...</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Formulario de Edición (oculto inicialmente) -->
        <div id="editProfileForm" style="display: none;">
            <div class="profile-section">
                <h2>Editar Perfil</h2>
                <form id="profileEditForm">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="editName">Nombre completo *</label>
                            <input type="text" id="editName" value="${talent.name || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="editEmail">Email *</label>
                            <input type="email" id="editEmail" value="${talent.email || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="editPhone">Teléfono</label>
                            <input type="tel" id="editPhone" value="${talent.phone || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label for="editGender">Género</label>
                            <select id="editGender">
                                <option value="">Seleccionar</option>
                                <option value="masculino" ${talent.gender === 'masculino' ? 'selected' : ''}>Masculino</option>
                                <option value="femenino" ${talent.gender === 'femenino' ? 'selected' : ''}>Femenino</option>
                                <option value="otro" ${talent.gender === 'otro' ? 'selected' : ''}>Otro</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="editRealAge">Edad real</label>
                            <input type="number" id="editRealAge" value="${talent.realAge || ''}" min="1" max="100">
                        </div>
                        
                        <div class="form-group">
                            <label for="editAgeRange">Rango de edad vocal</label>
                            <select id="editAgeRange">
                                <option value="">Seleccionar</option>
                                <option value="niño" ${talent.ageRange === 'niño' ? 'selected' : ''}>Niño</option>
                                <option value="adolescente" ${talent.ageRange === 'adolescente' ? 'selected' : ''}>Adolescente</option>
                                <option value="joven" ${talent.ageRange === 'joven' ? 'selected' : ''}>Joven</option>
                                <option value="adulto" ${talent.ageRange === 'adulto' ? 'selected' : ''}>Adulto</option>
                                <option value="maduro" ${talent.ageRange === 'maduro' ? 'selected' : ''}>Maduro</option>
                                <option value="anciano" ${talent.ageRange === 'anciano' ? 'selected' : ''}>Anciano</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="editNationality">Nacionalidad</label>
                            <input type="text" id="editNationality" value="${talent.nationality || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label>Idiomas</label>
                            <div class="languages-grid">
                                ${generateLanguageCheckboxes(talent.languages || [])}
                            </div>
                            <div id="otherLanguagesField" style="display: none;">
                                <input type="text" id="editOtherLanguages" placeholder="Especificar otros idiomas">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Home Studio</label>
                            <div class="radio-group">
                                <label><input type="radio" name="editHomeStudio" value="si" ${talent.homeStudio === 'si' ? 'checked' : ''}> Sí</label>
                                <label><input type="radio" name="editHomeStudio" value="no" ${talent.homeStudio !== 'si' ? 'checked' : ''}> No</label>
                            </div>
                        </div>
                        
                        <div class="form-group full-width">
                            <label for="editBio">Biografía</label>
                            <textarea id="editBio" rows="4">${talent.bio || ''}</textarea>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" id="saveProfileBtn" class="btn btn-primary">
                            <i class="fas fa-save"></i> Guardar Cambios
                        </button>
                        <button type="button" id="cancelEditBtn" class="btn btn-outline">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Configurar event listeners para los checkboxes de idiomas
    document.getElementById('editLang10')?.addEventListener('change', function() {
        document.getElementById('otherLanguagesField').style.display = this.checked ? 'block' : 'none';
    });
    
    // Configurar pestañas
    setupProfileEventListeners();
}

// Renderizar perfil de cliente
function renderClientProfile(client, userId) {
    const profileContent = document.getElementById('profileContent');
    if (!profileContent) return;
    
    const countryName = typeof getCountryName !== 'undefined' ? getCountryName(client.country) : client.country;
    const stateName = typeof getStateName !== 'undefined' ? getStateName(client.country, client.state) : client.state;
    const locationInfo = (countryName && stateName && client.city) ? `${client.city}, ${stateName}, ${countryName}` : 'N/A';
    const profilePicture = client.profilePictureUrl || 'img/default-avatar-client.png';
    const companyInfo = client.clientType === 'empresa' ? `<p><i class="fas fa-building"></i> ${client.companyName || 'N/A'}</p>` : '';
    
    profileContent.innerHTML = `
        <div class="profile-header">
            <div class="profile-picture-section">
                <img src="${profilePicture}" alt="${client.name}" id="currentProfilePicture" class="profile-picture-large">
                <div class="profile-picture-actions">
                    <input type="file" id="profilePictureInput" accept="image/*" style="display: none;">
                    <button class="btn btn-outline btn-sm" onclick="document.getElementById('profilePictureInput').click()">
                        <i class="fas fa-camera"></i> Cambiar foto
                    </button>
                </div>
            </div>
            
            <div class="profile-info">
                <h1 id="profileName">${client.name || 'Cliente'}</h1>
                <p class="profile-type"><i class="fas fa-user-tag"></i> ${client.clientType === 'empresa' ? 'Empresa' : 'Independiente'}</p>
                ${companyInfo}
                <p class="profile-location"><i class="fas fa-map-marker-alt"></i> ${locationInfo}</p>
                <p class="profile-email"><i class="fas fa-envelope"></i> ${client.email || 'N/A'}</p>
                <p class="profile-phone"><i class="fas fa-phone"></i> ${client.phone || 'N/A'}</p>
                
                <div class="profile-actions">
                    <button id="editProfileBtn" class="btn btn-primary">
                        <i class="fas fa-edit"></i> Editar Perfil
                    </button>
                    <button id="publishJobBtn" class="btn btn-success">
                        <i class="fas fa-plus"></i> Publicar Trabajo
                    </button>
                </div>
            </div>
        </div>
        
        <div class="profile-tabs">
            <div class="tab-buttons">
                <button class="tab-btn active" data-tab="info"><i class="fas fa-user"></i> Información</button>
                <button class="tab-btn" data-tab="jobs"><i class="fas fa-briefcase"></i> Mis Trabajos</button>
                <button class="tab-btn" data-tab="favorites"><i class="fas fa-heart"></i> Favoritos</button>
            </div>
            
            <div class="tab-content" id="infoTab" style="display: block;">
                <div class="profile-section">
                    <h2>Información del Cliente</h2>
                    <div class="info-grid">
                        <div class="info-item"><label>Tipo:</label><span>${client.clientType === 'empresa' ? 'Empresa' : 'Independiente'}</span></div>
                        ${client.clientType === 'empresa' ? `<div class="info-item"><label>Empresa:</label><span>${client.companyName || 'N/A'}</span></div>` : ''}
                        <div class="info-item"><label>País:</label><span>${countryName || 'N/A'}</span></div>
                        <div class="info-item"><label>Provincia/Estado:</label><span>${stateName || 'N/A'}</span></div>
                        <div class="info-item"><label>Ciudad:</label><span>${client.city || 'N/A'}</span></div>
                    </div>
                </div>
            </div>
            
            <div class="tab-content" id="jobsTab">
                <div class="profile-section">
                    <h2>Mis Ofertas de Trabajo</h2>
                    <div id="clientJobsContainer">
                        <p>Cargando ofertas de trabajo...</p>
                    </div>
                </div>
            </div>
            
            <div class="tab-content" id="favoritesTab">
                <div class="profile-section">
                    <h2>Mis Talentos Favoritos</h2>
                    <div id="favoritesContainer">
                        <p>Cargando favoritos...</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Formulario de Edición para Cliente -->
        <div id="editProfileForm" style="display: none;">
            <div class="profile-section">
                <h2>Editar Perfil</h2>
                <form id="profileEditForm">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="editName">Nombre completo *</label>
                            <input type="text" id="editName" value="${client.name || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="editEmail">Email *</label>
                            <input type="email" id="editEmail" value="${client.email || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="editPhone">Teléfono</label>
                            <input type="tel" id="editPhone" value="${client.phone || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label for="editClientType">Tipo de Cliente</label>
                            <select id="editClientType">
                                <option value="independiente" ${client.clientType === 'independiente' ? 'selected' : ''}>Independiente</option>
                                <option value="empresa" ${client.clientType === 'empresa' ? 'selected' : ''}>Empresa</option>
                            </select>
                        </div>
                        
                        <div class="form-group" id="editCompanyNameField" style="${client.clientType === 'empresa' ? 'display: block;' : 'display: none;'}">
                            <label for="editCompanyName">Nombre de la Empresa</label>
                            <input type="text" id="editCompanyName" value="${client.companyName || ''}">
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" id="saveProfileBtn" class="btn btn-primary">
                            <i class="fas fa-save"></i> Guardar Cambios
                        </button>
                        <button type="button" id="cancelEditBtn" class="btn btn-outline">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Configurar event listener para tipo de cliente
    document.getElementById('editClientType')?.addEventListener('change', function() {
        document.getElementById('editCompanyNameField').style.display = this.value === 'empresa' ? 'block' : 'none';
    });
    
    // Configurar botón de publicar trabajo
    document.getElementById('publishJobBtn')?.addEventListener('click', showPublishJobModal);
    
    setupProfileEventListeners();
}

// Generar checkboxes de idiomas
function generateLanguageCheckboxes(selectedLanguages) {
    const languages = [
        { id: 'lang1', value: 'español', label: 'Español' },
        { id: 'lang2', value: 'inglés', label: 'Inglés' },
        { id: 'lang3', value: 'portugués', label: 'Portugués' },
        { id: 'lang4', value: 'francés', label: 'Francés' },
        { id: 'lang5', value: 'alemán', label: 'Alemán' },
        { id: 'lang6', value: 'italiano', label: 'Italiano' },
        { id: 'lang7', value: 'japonés', label: 'Japonés' },
        { id: 'lang8', value: 'chino', label: 'Chino' },
        { id: 'lang9', value: 'árabe', label: 'Árabe' },
        { id: 'lang10', value: 'otros', label: 'Otros' }
    ];
    
    return languages.map(lang => `
        <label class="checkbox-label">
            <input type="checkbox" id="edit${lang.id}" value="${lang.value}" 
                   ${selectedLanguages.includes(lang.value) ? 'checked' : ''}>
            ${lang.label}
        </label>
    `).join('');
}

// Alternar modo de edición
function toggleEditMode(enable) {
    const viewMode = document.getElementById('profileContent');
    const editMode = document.getElementById('editProfileForm');
    
    if (viewMode && editMode) {
        if (enable) {
            viewMode.style.display = 'none';
            editMode.style.display = 'block';
        } else {
            viewMode.style.display = 'block';
            editMode.style.display = 'none';
        }
    }
}

// Guardar perfil
async function saveProfile() {
    if (!currentUser) return;
    
    const saveBtn = document.getElementById('saveProfileBtn');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    saveBtn.disabled = true;
    
    try {
        if (currentUserData.type === 'talent') {
            await saveTalentProfile();
        } else {
            await saveClientProfile();
        }
        
        // Recargar perfil
        await loadUserProfile(currentUser.uid);
        toggleEditMode(false);
        
        showProfileMessage('Perfil actualizado exitosamente.', 'success');
        
    } catch (error) {
        console.error('Error guardando perfil:', error);
        showProfileMessage('Error al guardar el perfil: ' + error.message, 'error');
    } finally {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

// Guardar perfil de talento
async function saveTalentProfile() {
    const updatedData = {
        name: document.getElementById('editName').value,
        email: document.getElementById('editEmail').value,
        phone: document.getElementById('editPhone').value,
        gender: document.getElementById('editGender').value,
        realAge: document.getElementById('editRealAge').value,
        ageRange: document.getElementById('editAgeRange').value,
        nationality: document.getElementById('editNationality').value,
        homeStudio: document.querySelector('input[name="editHomeStudio"]:checked')?.value || 'no',
        bio: document.getElementById('editBio').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Procesar idiomas
    const languages = [];
    for (let i = 1; i <= 10; i++) {
        const checkbox = document.getElementById('editLang' + i);
        if (checkbox && checkbox.checked) {
            const value = checkbox.value === 'otros' ? 
                document.getElementById('editOtherLanguages').value : 
                checkbox.value;
            if (value) languages.push(value);
        }
    }
    updatedData.languages = languages;
    
    await db.collection('talents').doc(currentUser.uid).update(updatedData);
}

// Guardar perfil de cliente
async function saveClientProfile() {
    const clientType = document.getElementById('editClientType').value;
    const updatedData = {
        name: document.getElementById('editName').value,
        email: document.getElementById('editEmail').value,
        phone: document.getElementById('editPhone').value,
        clientType: clientType,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (clientType === 'empresa') {
        updatedData.companyName = document.getElementById('editCompanyName').value;
    }
    
    await db.collection('clients').doc(currentUser.uid).update(updatedData);
}

// Subir foto de perfil
async function uploadProfilePicture(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showProfileMessage('Por favor, selecciona un archivo de imagen válido.', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
        showProfileMessage('La imagen debe ser menor a 5MB.', 'error');
        return;
    }
    
    try {
        showProfileMessage('Subiendo imagen...', 'info');
        
        const uploadResult = await uploadToCloudinary(file);
        const profilePictureUrl = uploadResult.url;
        
        // Actualizar en la base de datos según el tipo de usuario
        const collection = currentUserData.type === 'talent' ? 'talents' : 'clients';
        await db.collection(collection).doc(currentUser.uid).update({
            profilePictureUrl: profilePictureUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Actualizar imagen en la UI
        document.getElementById('currentProfilePicture').src = profilePictureUrl;
        
        showProfileMessage('Foto de perfil actualizada exitosamente.', 'success');
        
    } catch (error) {
        console.error('Error subiendo imagen:', error);
        showProfileMessage('Error al subir la imagen: ' + error.message, 'error');
    }
}

// Subir demo de audio
async function uploadDemo(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('audio/')) {
        showProfileMessage('Por favor, selecciona un archivo de audio válido.', 'error');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
        showProfileMessage('El archivo de audio debe ser menor a 10MB.', 'error');
        return;
    }
    
    if (currentUserData.type !== 'talent') {
        showProfileMessage('Solo los talentos pueden subir demos.', 'error');
        return;
    }
    
    try {
        showProfileMessage('Subiendo demo...', 'info');
        
        const uploadResult = await uploadToCloudinary(file);
        
        const demoData = {
            name: file.name.replace(/\.[^/.]+$/, ""), // Remover extensión
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            duration: uploadResult.duration,
            format: uploadResult.format,
            uploadedAt: new Date().toISOString()
        };
        
        // Agregar demo al array de demos del talento
        await db.collection('talents').doc(currentUser.uid).update({
            demos: firebase.firestore.FieldValue.arrayUnion(demoData),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showProfileMessage('Demo subido exitosamente.', 'success');
        
        // Recargar la pestaña de demos
        setTimeout(() => {
            loadUserProfile(currentUser.uid);
            switchTab('demos');
        }, 1000);
        
    } catch (error) {
        console.error('Error subiendo demo:', error);
        showProfileMessage('Error al subir el demo: ' + error.message, 'error');
    }
}

// Eliminar demo
async function deleteDemo(publicId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este demo?')) {
        return;
    }
    
    try {
        showProfileMessage('Eliminando demo...', 'info');
        
        // Obtener el talento actual
        const talentDoc = await db.collection('talents').doc(currentUser.uid).get();
        const talent = talentDoc.data();
        
        // Encontrar y remover el demo
        const updatedDemos = talent.demos.filter(demo => demo.publicId !== publicId);
        
        await db.collection('talents').doc(currentUser.uid).update({
            demos: updatedDemos,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showProfileMessage('Demo eliminado exitosamente.', 'success');
        
        // Recargar la pestaña de demos
        setTimeout(() => {
            loadUserProfile(currentUser.uid);
            switchTab('demos');
        }, 1000);
        
    } catch (error) {
        console.error('Error eliminando demo:', error);
        showProfileMessage('Error al eliminar el demo.', 'error');
    }
}
window.deleteDemo = deleteDemo;

// Cargar aplicaciones del talento
async function loadTalentApplications() {
    const container = document.getElementById('applicationsContainer');
    if (!container) return;
    
    try {
        const applicationsSnapshot = await db.collection('jobApplications')
            .where('talentId', '==', currentUser.uid)
            .orderBy('appliedAt', 'desc')
            .get();
        
        if (applicationsSnapshot.empty) {
            container.innerHTML = '<p>No tienes postulaciones activas.</p>';
            return;
        }
        
        let applicationsHtml = '';
        
        for (const doc of applicationsSnapshot.docs) {
            const application = doc.data();
            const jobDoc = await db.collection('jobs').doc(application.jobId).get();
            
            if (jobDoc.exists) {
                const job = jobDoc.data();
                const statusClass = application.status === 'accepted' ? 'accepted' : 
                                  application.status === 'rejected' ? 'rejected' : 'pending';
                const statusText = application.status === 'accepted' ? 'Aceptada' :
                                 application.status === 'rejected' ? 'Rechazada' : 'Pendiente';
                
                applicationsHtml += `
                    <div class="application-card ${statusClass}">
                        <div class="application-header">
                            <h3>${job.title}</h3>
                            <span class="application-status ${statusClass}">${statusText}</span>
                        </div>
                        <p><strong>Cliente:</strong> ${job.clientName}</p>
                        <p><strong>Presupuesto:</strong> ${job.budget ? '$' + job.budget : 'A convenir'}</p>
                        <p><strong>Fecha de postulación:</strong> ${application.appliedAt?.toDate().toLocaleDateString() || 'N/A'}</p>
                        <div class="application-actions">
                            <button class="btn btn-secondary btn-sm" onclick="window.viewJobDetails('${application.jobId}')">
                                Ver Detalles
                            </button>
                        </div>
                    </div>
                `;
            }
        }
        
        container.innerHTML = applicationsHtml;
        
    } catch (error) {
        console.error('Error cargando aplicaciones:', error);
        container.innerHTML = '<p class="error">Error al cargar las postulaciones.</p>';
    }
}

// Cargar trabajos del cliente
async function loadClientJobs() {
    const container = document.getElementById('clientJobsContainer');
    if (!container) return;
    
    try {
        const jobsSnapshot = await db.collection('jobs')
            .where('clientId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        if (jobsSnapshot.empty) {
            container.innerHTML = '<p>No has publicado ninguna oferta de trabajo.</p>';
            return;
        }
        
        let jobsHtml = '';
        
        jobsSnapshot.docs.forEach(doc => {
            const job = doc.data();
            const jobId = doc.id;
            const countryName = typeof getCountryName !== 'undefined' ? getCountryName(job.country) : job.country;
            const statusClass = job.status === 'active' ? 'active' : 'inactive';
            const statusText = job.status === 'active' ? 'Activa' : 'Inactiva';
            
            jobsHtml += `
                <div class="job-card ${statusClass}">
                    <div class="job-card-header">
                        <h3>${job.title}</h3>
                        <span class="job-status ${statusClass}">${statusText}</span>
                    </div>
                    <p><strong>Ubicación:</strong> ${countryName || 'Remoto'}</p>
                    <p><strong>Presupuesto:</strong> ${job.budget ? '$' + job.budget : 'A convenir'}</p>
                    <p><strong>Fecha límite:</strong> ${job.deadline ? new Date(job.deadline).toLocaleDateString() : 'No especificada'}</p>
                    <p><strong>Descripción:</strong> ${job.description ? job.description.substring(0, 100) + '...' : 'Sin descripción'}</p>
                    <div class="card-actions">
                        <button class="btn btn-primary btn-sm" onclick="window.viewJobApplications('${jobId}')">
                            <i class="fas fa-users"></i> Ver Postulantes
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="window.viewJobDetails('${jobId}')">
                            <i class="fas fa-eye"></i> Ver Detalles
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = jobsHtml;
        
    } catch (error) {
        console.error('Error cargando trabajos del cliente:', error);
        container.innerHTML = '<p class="error">Error al cargar las ofertas de trabajo.</p>';
    }
}

// Cargar favoritos del cliente
async function loadFavorites() {
    const container = document.getElementById('favoritesContainer');
    if (!container) return;
    
    try {
        const clientDoc = await db.collection('clients').doc(currentUser.uid).get();
        const client = clientDoc.data();
        const favorites = client.favorites || [];
        
        if (favorites.length === 0) {
            container.innerHTML = '<p>No tienes talentos en favoritos.</p>';
            return;
        }
        
        let favoritesHtml = '';
        
        for (const talentId of favorites) {
            const talentDoc = await db.collection('talents').doc(talentId).get();
            
            if (talentDoc.exists) {
                const talent = talentDoc.data();
                const countryName = typeof getCountryName !== 'undefined' ? getCountryName(talent.country) : talent.country;
                const languages = talent.languages ? talent.languages.join(', ') : 'N/A';
                const profilePicture = talent.profilePictureUrl || 'img/default-avatar.png';
                
                favoritesHtml += `
                    <div class="talent-card">
                        <div class="talent-card-header">
                            <img src="${profilePicture}" alt="${talent.name}" class="talent-profile-pic" onerror="this.src='img/default-avatar.png'">
                            <h3>${talent.name || 'Talento Anónimo'}</h3>
                        </div>
                        <p><strong>País:</strong> ${countryName || 'N/A'}</p>
                        <p><strong>Idiomas:</strong> ${languages}</p>
                        <div class="card-actions">
                            <button class="btn btn-secondary btn-sm" onclick="window.viewTalentProfile('${talentId}')">
                                <i class="fas fa-user"></i> Ver perfil
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="removeFromFavorites('${talentId}')">
                                <i class="fas fa-trash"></i> Quitar
                            </button>
                        </div>
                    </div>
                `;
            }
        }
        
        container.innerHTML = favoritesHtml;
        
    } catch (error) {
        console.error('Error cargando favoritos:', error);
        container.innerHTML = '<p class="error">Error al cargar los favoritos.</p>';
    }
}

// Remover de favoritos
async function removeFromFavorites(talentId) {
    try {
        await db.collection('clients').doc(currentUser.uid).update({
            favorites: firebase.firestore.FieldValue.arrayRemove(talentId)
        });
        
        showProfileMessage('Talento removido de favoritos.', 'success');
        loadFavorites(); // Recargar la lista
        
    } catch (error) {
        console.error('Error removiendo de favoritos:', error);
        showProfileMessage('Error al remover de favoritos.', 'error');
    }
}
window.removeFromFavorites = removeFromFavorites;

// Mostrar modal de publicar trabajo
function showPublishJobModal() {
    // Esta función se implementaría para mostrar un modal de publicación de trabajo
    alert('Funcionalidad de publicar trabajo en desarrollo');
}

// Mostrar mensajes en el perfil
function showProfileMessage(message, type) {
    // Crear o actualizar elemento de mensaje
    let messageEl = document.getElementById('profileMessage');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'profileMessage';
        messageEl.className = 'profile-message';
        document.querySelector('.profile-header').appendChild(messageEl);
    }
    
    messageEl.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    messageEl.style.display = 'block';
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}

// Formatear duración de audio
function formatDuration(seconds) {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Actualizar UI del perfil
function updateProfileUI() {
    // Actualizar nombre de usuario en el header si existe
    const userNameElement = document.getElementById('userName');
    if (userNameElement && currentUserData) {
        userNameElement.textContent = currentUserData.name || currentUserData.email;
    }
    
    // Actualizar foto de perfil en el header si existe
    const headerUserPicture = document.getElementById('headerUserPicture');
    if (headerUserPicture && currentUserData) {
        headerUserPicture.src = currentUserData.profilePictureUrl || 
            (currentUserData.type === 'talent' ? 'img/default-avatar.png' : 'img/default-avatar-client.png');
        headerUserPicture.onerror = function() {
            this.src = currentUserData.type === 'talent' ? 'img/default-avatar.png' : 'img/default-avatar-client.png';
        };
    }
}

console.log('✅ Profile.js cargado correctamente');
