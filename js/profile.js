// profile.js - Gestión completa del perfil de usuario (VERSIÓN COMPLETA)

console.log('✅ profile.js cargado - Inicializando gestión de perfiles...');

// Estado global del perfil
let profileData = null;
let profileInitialized = false;

// =============================================
// INICIALIZACIÓN PRINCIPAL
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM cargado en profile.html - Inicializando perfil...');
    initializeProfile();
});

function initializeProfile() {
    if (profileInitialized) {
        console.log('✅ Perfil ya estaba inicializado');
        return;
    }
    
    profileInitialized = true;
    console.log('🎯 Inicializando sistema de perfil...');

    // Verificar autenticación
    if (typeof auth !== 'undefined' && auth.currentUser) {
        console.log('👤 Usuario autenticado encontrado:', auth.currentUser.uid);
        loadUserProfile(auth.currentUser.uid);
    } else if (typeof currentUser !== 'undefined' && currentUser) {
        console.log('👤 Usuario desde variable global:', currentUser.uid);
        loadUserProfile(currentUser.uid);
    } else {
        console.log('❌ No hay usuario autenticado, verificando estado...');
        // Esperar un poco por si auth se inicializa después
        setTimeout(() => {
            if (auth && auth.currentUser) {
                loadUserProfile(auth.currentUser.uid);
            } else {
                console.error('❌ No se pudo autenticar al usuario, redirigiendo...');
                window.location.href = 'index.html';
            }
        }, 2000);
        return;
    }

    setupProfileEventListeners();
    console.log('✅ Sistema de perfil inicializado correctamente');
}

// =============================================
// CONFIGURACIÓN DE EVENT LISTENERS
// =============================================

function setupProfileEventListeners() {
    console.log('🔧 Configurando event listeners del perfil...');
    
    // Botones de navegación del perfil
    document.querySelectorAll('.profile-nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-tab');
            console.log('📍 Navegando a sección:', targetSection);
            toggleProfileSection(targetSection);
        });
    });

    // Formulario de edición principal
    const editForm = document.getElementById('editProfileForm');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📝 Formulario de edición enviado');
            handleProfileUpdate(e);
        });
    }

    // Botón de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            console.log('🚪 Solicitando logout...');
            if (typeof logoutUser === 'function') {
                logoutUser();
            } else {
                auth.signOut().then(() => {
                    window.location.href = 'index.html';
                });
            }
        });
    }

    // Botón de crear trabajo
    const createJobBtn = document.getElementById('createJobBtn');
    if (createJobBtn) {
        createJobBtn.addEventListener('click', function() {
            console.log('💼 Abriendo modal de crear trabajo');
            showCreateJobModal();
        });
    }

    // Formulario de crear trabajo
    const createJobForm = document.getElementById('createJobForm');
    if (createJobForm) {
        createJobForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📋 Formulario de crear trabajo enviado');
            createJobPost(e);
        });
    }

    // Event listeners para dinámicos (se configuran después)
    setupDynamicEventListeners();

    console.log('✅ Todos los event listeners configurados');
}

function setupDynamicEventListeners() {
    // Configurar evento para "otros" idiomas en talentos
    const editLang10 = document.getElementById('editLang10');
    const editOtherLanguages = document.getElementById('editOtherLanguages');
    if (editLang10 && editOtherLanguages) {
        editLang10.addEventListener('change', function() {
            editOtherLanguages.style.display = this.checked ? 'block' : 'none';
            if (!this.checked) {
                editOtherLanguages.value = '';
            }
        });
    }

    // Configurar evento para tipo de cliente
    const editClientType = document.getElementById('editClientType');
    const editCompanyNameGroup = document.getElementById('editCompanyNameGroup');
    if (editClientType && editCompanyNameGroup) {
        editClientType.addEventListener('change', function() {
            editCompanyNameGroup.style.display = this.value === 'empresa' ? 'block' : 'none';
            if (this.value !== 'empresa') {
                document.getElementById('editCompanyName').value = '';
            }
        });
    }
}

// =============================================
// GESTIÓN PRINCIPAL DEL PERFIL
// =============================================

async function loadUserProfile(userId) {
    console.log('📥 Cargando perfil para usuario:', userId);
    
    const profileContent = document.getElementById('viewProfileContent');
    const profileMessage = document.getElementById('profileMessage');
    
    if (profileContent) {
        profileContent.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando perfil...</div>';
    }

    try {
        // Intentar cargar como talento
        let userDoc = await db.collection('talents').doc(userId).get();
        let userType = 'talent';
        
        if (!userDoc.exists) {
            // Intentar cargar como cliente
            userDoc = await db.collection('clients').doc(userId).get();
            userType = 'client';
            
            if (!userDoc.exists) {
                throw new Error('No se encontró perfil para este usuario. Por favor, completa tu registro.');
            }
        }

        // Guardar datos del perfil globalmente
        profileData = {
            ...userDoc.data(),
            id: userId,
            type: userType
        };

        console.log('✅ Perfil cargado exitosamente:', {
            tipo: userType,
            nombre: profileData.name,
            email: profileData.email
        });

        // Actualizar interfaz de usuario
        updateProfileHeader(profileData);
        displayUserProfile(profileData);
        setupEditForm(profileData);
        showUserSpecificSections(userType);

        // Mostrar mensaje de éxito
        if (profileMessage) {
            showMessage(profileMessage, 'Perfil cargado correctamente', 'success', 3000);
        }

    } catch (error) {
        console.error('❌ Error crítico cargando perfil:', error);
        
        if (profileContent) {
            profileContent.innerHTML = `
                <div class="error-message">
                    <h3><i class="fas fa-exclamation-triangle"></i> Error al cargar el perfil</h3>
                    <p>${error.message}</p>
                    <div class="error-actions">
                        <button class="btn btn-primary" onclick="loadUserProfile('${userId}')">
                            <i class="fas fa-redo"></i> Reintentar
                        </button>
                        <button class="btn btn-outline" onclick="window.location.href='index.html'">
                            <i class="fas fa-home"></i> Volver al Inicio
                        </button>
                    </div>
                </div>
            `;
        }
        
        if (profileMessage) {
            showMessage(profileMessage, `Error: ${error.message}`, 'error');
        }
    }
}

// =============================================
// ACTUALIZACIÓN DE INTERFAZ
// =============================================

function updateProfileHeader(userData) {
    console.log('🔄 Actualizando header del perfil...');
    
    const elements = {
        profileUserName: document.getElementById('profileUserName'),
        profileUserType: document.getElementById('profileUserType'),
        profileUserPicture: document.getElementById('profileUserPicture'),
        headerUserPicture: document.getElementById('headerUserPicture'),
        userName: document.getElementById('userName')
    };

    // Actualizar textos
    if (elements.profileUserName) {
        elements.profileUserName.textContent = userData.name || 'Usuario VoiceBook';
    }
    
    if (elements.profileUserType) {
        elements.profileUserType.textContent = userData.type === 'talent' ? 'Talento de Voz' : 'Cliente';
    }
    
    if (elements.userName) {
        elements.userName.textContent = userData.name || 'Usuario';
    }
    
    // Actualizar imágenes
    const defaultAvatar = userData.type === 'talent' ? 'img/default-avatar.png' : 'img/default-avatar-client.png';
    const profilePicUrl = userData.profilePictureUrl || defaultAvatar;
    
    [elements.profileUserPicture, elements.headerUserPicture].forEach(img => {
        if (img) {
            img.src = profilePicUrl;
            img.onerror = function() {
                console.warn('⚠️ Error cargando imagen de perfil, usando default');
                this.src = defaultAvatar;
            };
        }
    });
}

function showUserSpecificSections(userType) {
    console.log('👥 Configurando secciones para:', userType);
    
    const talentSections = document.querySelectorAll('.talent-only');
    const clientSections = document.querySelectorAll('.client-only');
    
    if (userType === 'talent') {
        talentSections.forEach(section => section.style.display = 'flex');
        clientSections.forEach(section => section.style.display = 'none');
        
        // Agregar clase CSS para estilos específicos
        document.body.classList.add('user-talent');
        document.body.classList.remove('user-client');
    } else {
        talentSections.forEach(section => section.style.display = 'none');
        clientSections.forEach(section => section.style.display = 'flex');
        
        document.body.classList.add('user-client');
        document.body.classList.remove('user-talent');
    }
}

// =============================================
// VISUALIZACIÓN DEL PERFIL
// =============================================

function displayUserProfile(userData) {
    console.log('🎨 Renderizando perfil de:', userData.type);
    
    if (userData.type === 'talent') {
        displayTalentProfile(userData);
    } else {
        displayClientProfile(userData);
    }
}

function displayTalentProfile(talent) {
    const profileContent = document.getElementById('viewProfileContent');
    if (!profileContent) return;

    // Preparar datos para mostrar
    const locationInfo = formatLocation(talent);
    const languages = talent.languages ? talent.languages.join(', ') : 'No especificado';
    const homeStudio = talent.homeStudio === 'si' ? 
        '<span class="badge success"><i class="fas fa-check-circle"></i> Sí</span>' : 
        '<span class="badge warning"><i class="fas fa-times-circle"></i> No</span>';

    // Generar HTML de demos
    const demosHtml = generateDemosHtml(talent.demos);

    profileContent.innerHTML = `
        <div class="profile-view">
            <div class="profile-main-info">
                <div class="profile-info-grid">
                    <div class="info-item">
                        <label><i class="fas fa-user"></i> Nombre:</label>
                        <span>${talent.name || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label><i class="fas fa-envelope"></i> Email:</label>
                        <span>${talent.email || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label><i class="fas fa-phone"></i> Teléfono:</label>
                        <span>${talent.phone || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label><i class="fas fa-map-marker-alt"></i> Ubicación:</label>
                        <span>${locationInfo}</span>
                    </div>
                    <div class="info-item">
                        <label><i class="fas fa-venus-mars"></i> Género:</label>
                        <span>${talent.gender || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label><i class="fas fa-birthday-cake"></i> Edad Real:</label>
                        <span>${talent.realAge || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label><i class="fas fa-calendar-alt"></i> Rango de Edad:</label>
                        <span>${talent.ageRange || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label><i class="fas fa-flag"></i> Nacionalidad:</label>
                        <span>${talent.nationality || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label><i class="fas fa-language"></i> Idiomas:</label>
                        <span>${languages}</span>
                    </div>
                    <div class="info-item">
                        <label><i class="fas fa-home"></i> Home Studio:</label>
                        <span>${homeStudio}</span>
                    </div>
                </div>
            </div>
            
            <div class="profile-bio-section">
                <h3><i class="fas fa-book"></i> Biografía</h3>
                <div class="profile-bio">${talent.bio || '<p class="text-muted">No hay biografía disponible.</p>'}</div>
            </div>
            
            <div class="profile-demos-section">
                <h3><i class="fas fa-music"></i> Mis Demos</h3>
                <div class="demos-list">
                    ${demosHtml}
                </div>
                <div class="demos-actions">
                    <button class="btn btn-primary" onclick="toggleProfileSection('editProfileSection')">
                        <i class="fas fa-upload"></i> Gestionar Demos
                    </button>
                </div>
            </div>
        </div>
    `;
}

function displayClientProfile(client) {
    const profileContent = document.getElementById('viewProfileContent');
    if (!profileContent) return;

    const locationInfo = formatLocation(client);
    const clientType = client.clientType === 'empresa' ? 
        '<span class="badge info"><i class="fas fa-building"></i> Empresa/Agencia</span>' : 
        '<span class="badge secondary"><i class="fas fa-user"></i> Particular</span>';

    let companyInfo = '';
    if (client.clientType === 'empresa' && client.companyName) {
        companyInfo = `
            <div class="info-item">
                <label><i class="fas fa-building"></i> Empresa:</label>
                <span>${client.companyName}</span>
            </div>
        `;
    }

    profileContent.innerHTML = `
        <div class="profile-view">
            <div class="profile-main-info">
                <div class="profile-info-grid">
                    <div class="info-item">
                        <label><i class="fas fa-user"></i> Nombre:</label>
                        <span>${client.name || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label><i class="fas fa-envelope"></i> Email:</label>
                        <span>${client.email || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label><i class="fas fa-phone"></i> Teléfono:</label>
                        <span>${client.phone || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label><i class="fas fa-map-marker-alt"></i> Ubicación:</label>
                        <span>${locationInfo}</span>
                    </div>
                    <div class="info-item">
                        <label><i class="fas fa-tag"></i> Tipo de Cliente:</label>
                        <span>${clientType}</span>
                    </div>
                    ${companyInfo}
                </div>
            </div>
            
            <div class="profile-client-actions">
                <h3><i class="fas fa-briefcase"></i> Acciones</h3>
                <div class="action-buttons">
                    <button class="btn btn-primary btn-large" onclick="toggleProfileSection('jobsSection')">
                        <i class="fas fa-eye"></i> Ver Mis Ofertas
                    </button>
                    <button class="btn btn-success btn-large" onclick="showCreateJobModal()">
                        <i class="fas fa-plus"></i> Crear Nueva Oferta
                    </button>
                    <button class="btn btn-outline btn-large" onclick="toggleProfileSection('notificationsSection')">
                        <i class="fas fa-bell"></i> Notificaciones
                    </button>
                </div>
            </div>
        </div>
    `;
}

// =============================================
// FORMULARIOS DE EDICIÓN
// =============================================

function setupEditForm(userData) {
    console.log('⚙️ Configurando formulario de edición para:', userData.type);
    
    // Establecer tipo de usuario
    setValue('editProfileUserType', userData.type);
    
    // Mostrar formulario correspondiente
    const talentForm = document.getElementById('editTalentForm');
    const clientForm = document.getElementById('editClientForm');
    
    if (userData.type === 'talent') {
        if (talentForm) talentForm.style.display = 'block';
        if (clientForm) clientForm.style.display = 'none';
        setupTalentEditForm(userData);
    } else {
        if (talentForm) talentForm.style.display = 'none';
        if (clientForm) clientForm.style.display = 'block';
        setupClientEditForm(userData);
    }
    
    // Re-configurar event listeners dinámicos
    setTimeout(setupDynamicEventListeners, 100);
}

function setupTalentEditForm(talent) {
    console.log('🎤 Configurando formulario de edición de talento');
    
    // Información básica
    setValue('editTalentName', talent.name);
    setValue('editTalentEmail', talent.email);
    setValue('editTalentPhone', talent.phone);
    setValue('editTalentGender', talent.gender);
    setValue('editTalentRealAge', talent.realAge);
    setValue('editTalentAgeRange', talent.ageRange);
    setValue('editTalentNationality', talent.nationality);
    setValue('editTalentBio', talent.bio);
    
    // Home Studio
    if (talent.homeStudio === 'si') {
        setChecked('editHomeStudioYes', true);
    } else {
        setChecked('editHomeStudioNo', true);
    }
    
    // Idiomas
    setupLanguagesEdit(talent.languages);
    
    // Ubicación (con retardo para asegurar que los selects estén listos)
    setTimeout(() => {
        if (typeof loadLocationData === 'undefined') {
            console.warn('⚠️ loadLocationData no está disponible');
            return;
        }
        loadLocationData(
            'editCountrySelectTalent', 
            'editStateSelectTalent', 
            'editCitySelectTalent', 
            talent.country, 
            talent.state, 
            talent.city
        );
    }, 500);
}

function setupClientEditForm(client) {
    console.log('💼 Configurando formulario de edición de cliente');
    
    // Información básica
    setValue('editClientName', client.name);
    setValue('editClientEmail', client.email);
    setValue('editClientPhone', client.phone);
    setValue('editClientType', client.clientType);
    
    // Empresa
    if (client.clientType === 'empresa' && client.companyName) {
        setValue('editCompanyName', client.companyName);
        showElement('editCompanyNameGroup', true);
    } else {
        showElement('editCompanyNameGroup', false);
    }
    
    // Ubicación
    setTimeout(() => {
        if (typeof loadLocationData === 'undefined') {
            console.warn('⚠️ loadLocationData no está disponible');
            return;
        }
        loadLocationData(
            'editCountrySelectClient', 
            'editStateSelectClient', 
            'editCitySelectClient', 
            client.country, 
            client.state, 
            client.city
        );
    }, 500);
}

function setupLanguagesEdit(languages) {
    // Limpiar checkboxes primero
    for (let i = 1; i <= 10; i++) {
        setChecked('editLang' + i, false);
    }
    setValue('editOtherLanguages', '');
    showElement('editOtherLanguages', false);
    
    if (!languages || !Array.isArray(languages)) return;
    
    // Marcar idiomas seleccionados
    languages.forEach(lang => {
        let found = false;
        
        // Buscar en los idiomas predefinidos
        for (let i = 1; i <= 10; i++) {
            const checkbox = document.getElementById('editLang' + i);
            if (checkbox && checkbox.value === lang) {
                setChecked('editLang' + i, true);
                found = true;
                break;
            }
        }
        
        // Si no se encuentra, es un idioma "otros"
        if (!found && lang) {
            setChecked('editLang10', true);
            setValue('editOtherLanguages', lang);
            showElement('editOtherLanguages', true);
        }
    });
}

// =============================================
// GESTIÓN DE ACTUALIZACIONES
// =============================================

async function handleProfileUpdate(e) {
    e.preventDefault();
    console.log('💾 Iniciando actualización del perfil...');
    
    const messageDiv = document.getElementById('editProfileMessage');
    const userId = profileData.id;
    const userType = profileData.type;
    
    showMessage(messageDiv, '<i class="fas fa-spinner fa-spin"></i> Guardando cambios...', 'info');

    try {
        let result;
        if (userType === 'talent') {
            result = await updateTalentProfile(userId);
        } else {
            result = await updateClientProfile(userId);
        }
        
        showMessage(messageDiv, '<i class="fas fa-check-circle"></i> Perfil actualizado correctamente', 'success');
        
        // Recargar perfil después de guardar
        setTimeout(() => {
            loadUserProfile(userId);
            toggleProfileSection('viewProfileSection');
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error actualizando perfil:', error);
        showMessage(messageDiv, `<i class="fas fa-exclamation-circle"></i> Error: ${error.message}`, 'error');
    }
}

async function updateTalentProfile(userId) {
    console.log('🔄 Actualizando perfil de talento...');
    
    const updateData = {
        name: getValue('editTalentName'),
        email: getValue('editTalentEmail'),
        phone: getValue('editTalentPhone'),
        gender: getValue('editTalentGender'),
        realAge: getValue('editTalentRealAge'),
        ageRange: getValue('editTalentAgeRange'),
        nationality: getValue('editTalentNationality'),
        bio: getValue('editTalentBio'),
        homeStudio: getSelectedRadio('editHomeStudio') || 'no',
        country: getValue('editCountrySelectTalent'),
        state: getValue('editStateSelectTalent'),
        city: getValue('editCitySelectTalent'),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Validaciones básicas
    if (!updateData.name || !updateData.email) {
        throw new Error('Nombre y email son obligatorios');
    }
    
    if (!updateData.country || !updateData.state || !updateData.city) {
        throw new Error('Debes completar toda la ubicación');
    }
    
    // Procesar idiomas
    updateData.languages = getSelectedLanguages();
    if (updateData.languages.length === 0) {
        throw new Error('Debes seleccionar al menos un idioma');
    }
    
    // Subir nueva imagen de perfil si existe
    const profilePictureFile = getFile('editTalentProfilePicture');
    if (profilePictureFile) {
        console.log('🖼️ Subiendo nueva imagen de perfil...');
        const uploadResult = await uploadToCloudinary(profilePictureFile);
        updateData.profilePictureUrl = uploadResult.url;
    }
    
    // Manejar demos de audio
    const demoFiles = getFiles('editAudioFiles');
    if (demoFiles.length > 0) {
        console.log('🎵 Subiendo nuevos demos...');
        const newDemos = await uploadDemos(demoFiles);
        
        // Combinar con demos existentes (mantener máximo 5)
        const existingDemos = profileData.demos || [];
        const allDemos = [...existingDemos, ...newDemos].slice(0, 5);
        updateData.demos = allDemos;
    }
    
    console.log('📤 Enviando actualización a Firebase...', updateData);
    await db.collection('talents').doc(userId).update(updateData);
    
    return { success: true, message: 'Perfil de talento actualizado' };
}

async function updateClientProfile(userId) {
    console.log('🔄 Actualizando perfil de cliente...');
    
    const clientType = getValue('editClientType');
    const updateData = {
        name: getValue('editClientName'),
        email: getValue('editClientEmail'),
        phone: getValue('editClientPhone'),
        clientType: clientType,
        country: getValue('editCountrySelectClient'),
        state: getValue('editStateSelectClient'),
        city: getValue('editCitySelectClient'),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Validaciones
    if (!updateData.name || !updateData.email) {
        throw new Error('Nombre y email son obligatorios');
    }
    
    if (!updateData.country || !updateData.state || !updateData.city) {
        throw new Error('Debes completar toda la ubicación');
    }
    
    if (clientType === 'empresa') {
        updateData.companyName = getValue('editCompanyName');
        if (!updateData.companyName) {
            throw new Error('El nombre de la empresa es obligatorio');
        }
    }
    
    // Subir nueva imagen de perfil si existe
    const profilePictureFile = getFile('editClientProfilePicture');
    if (profilePictureFile) {
        console.log('🖼️ Subiendo nueva imagen de perfil...');
        const uploadResult = await uploadToCloudinary(profilePictureFile);
        updateData.profilePictureUrl = uploadResult.url;
    }
    
    console.log('📤 Enviando actualización a Firebase...', updateData);
    await db.collection('clients').doc(userId).update(updateData);
    
    return { success: true, message: 'Perfil de cliente actualizado' };
}

// =============================================
// FUNCIONALIDADES ADICIONALES
// =============================================

// Gestión de demos
async function uploadDemos(files) {
    const uploadPromises = Array.from(files).slice(0, 2).map(async (file) => {
        try {
            const uploadResult = await uploadToCloudinary(file);
            return {
                name: file.name.replace(/\.[^/.]+$/, ""), // Remover extensión
                url: uploadResult.url,
                publicId: uploadResult.publicId,
                duration: uploadResult.duration || 0,
                format: uploadResult.format,
                uploadedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error subiendo demo:', file.name, error);
            throw new Error(`Error al subir el demo: ${file.name}`);
        }
    });
    
    return await Promise.all(uploadPromises);
}

async function deleteDemo(demoId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este demo?')) {
        return;
    }

    try {
        const userId = profileData.id;
        const talentDoc = await db.collection('talents').doc(userId).get();
        const talent = talentDoc.data();
        
        // Filtrar el demo a eliminar
        const updatedDemos = (talent.demos || []).filter(demo => 
            demo.publicId !== demoId && 
            demo.id !== demoId &&
            demo.url !== demoId
        );
        
        // Actualizar en Firestore
        await db.collection('talents').doc(userId).update({
            demos: updatedDemos
        });
        
        // Actualizar datos locales y recargar
        profileData.demos = updatedDemos;
        loadUserProfile(userId);
        
        showMessage('profileMessage', '<i class="fas fa-check-circle"></i> Demo eliminado correctamente', 'success');
        
    } catch (error) {
        console.error('Error eliminando demo:', error);
        showMessage('profileMessage', '<i class="fas fa-exclamation-circle"></i> Error al eliminar el demo', 'error');
    }
}

// Sistema de navegación
function toggleProfileSection(sectionId) {
    console.log('🔄 Cambiando a sección:', sectionId);
    
    // Ocultar todas las secciones
    document.querySelectorAll('.profile-section').forEach(section => {
        section.classList.remove('active-section');
    });
    
    // Mostrar la sección seleccionada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active-section');
    }
    
    // Actualizar botones activos
    document.querySelectorAll('.profile-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Marcar el botón correspondiente como activo
    const activeButton = document.querySelector(`[data-tab="${sectionId}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Cargar datos específicos de la sección
    loadSectionData(sectionId);
}

function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'applicationsSection':
            loadTalentApplications();
            break;
        case 'jobsSection':
            loadClientJobs();
            break;
        case 'notificationsSection':
            loadUserNotifications();
            break;
        default:
            // No necesita carga adicional
            break;
    }
}

// Secciones específicas (implementación básica)
function loadTalentApplications() {
    const applicationsList = document.getElementById('applicationsList');
    if (applicationsList) {
        applicationsList.innerHTML = `
            <div class="section-placeholder">
                <i class="fas fa-paper-plane fa-3x"></i>
                <h3>Mis Postulaciones</h3>
                <p>Aquí podrás ver el historial de todas las ofertas a las que te has postulado.</p>
                <p class="text-muted">Esta funcionalidad estará disponible próximamente.</p>
            </div>
        `;
    }
}

function loadClientJobs() {
    const jobsList = document.getElementById('jobsList');
    if (jobsList) {
        jobsList.innerHTML = `
            <div class="section-placeholder">
                <i class="fas fa-briefcase fa-3x"></i>
                <h3>Mis Ofertas de Trabajo</h3>
                <p>Gestiona todas las ofertas de trabajo que has publicado.</p>
                <p class="text-muted">Esta funcionalidad estará disponible próximamente.</p>
            </div>
        `;
    }
}

function loadUserNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    if (notificationsList) {
        notificationsList.innerHTML = `
            <div class="section-placeholder">
                <i class="fas fa-bell fa-3x"></i>
                <h3>Notificaciones</h3>
                <p>Revisa tus notificaciones y mantente actualizado.</p>
                <p class="text-muted">Esta funcionalidad estará disponible próximamente.</p>
            </div>
        `;
    }
}

// Creación de trabajos (placeholder)
async function createJobPost(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('createJobMessage');
    
    showMessage(messageDiv, '<i class="fas fa-spinner fa-spin"></i> Publicando oferta...', 'info');
    
    // Simular publicación
    setTimeout(() => {
        showMessage(messageDiv, '<i class="fas fa-check-circle"></i> Oferta publicada correctamente (demo)', 'success');
        closeCreateJobModal();
    }, 2000);
}

// =============================================
// FUNCIONES AUXILIARES
// =============================================

// Utilidades de DOM
function setValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element && value !== undefined && value !== null) {
        element.value = value;
    }
}

function getValue(elementId) {
    const element = document.getElementById(elementId);
    return element ? element.value : '';
}

function setChecked(elementId, checked) {
    const element = document.getElementById(elementId);
    if (element) {
        element.checked = checked;
    }
}

function getSelectedRadio(name) {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : null;
}

function showElement(elementId, show) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = show ? 'block' : 'none';
    }
}

function getFile(elementId) {
    const element = document.getElementById(elementId);
    return element && element.files.length > 0 ? element.files[0] : null;
}

function getFiles(elementId) {
    const element = document.getElementById(elementId);
    return element ? Array.from(element.files) : [];
}

function getSelectedLanguages() {
    const languages = [];
    for (let i = 1; i <= 10; i++) {
        const checkbox = document.getElementById('editLang' + i);
        if (checkbox && checkbox.checked) {
            const value = checkbox.value === 'otros' ? 
                getValue('editOtherLanguages') : 
                checkbox.value;
            if (value && value.trim()) {
                languages.push(value.trim());
            }
        }
    }
    return languages;
}

// Utilidades de formato
function formatLocation(userData) {
    const countryName = typeof getCountryName === 'function' ? getCountryName(userData.country) : userData.country;
    const stateName = typeof getStateName === 'function' ? getStateName(userData.country, userData.state) : userData.state;
    
    if (countryName && stateName && userData.city) {
        return `${userData.city}, ${stateName}, ${countryName}`;
    } else if (userData.country) {
        return userData.country;
    }
    return 'Ubicación no especificada';
}

function generateDemosHtml(demos) {
    if (!demos || demos.length === 0) {
        return '<p class="no-demos"><i class="fas fa-music"></i> No hay demos subidos todavía.</p>';
    }
    
    return demos.map((demo, index) => `
        <div class="demo-item">
            <div class="demo-info">
                <span class="demo-name">${demo.name || `Demo ${index + 1}`}</span>
                <span class="demo-duration">${demo.duration ? formatDuration(demo.duration) : ''}</span>
            </div>
            <div class="demo-actions">
                <audio controls src="${demo.url}">
                    Tu navegador no soporta el elemento audio.
                </audio>
                <button class="btn btn-danger btn-sm" onclick="deleteDemo('${demo.publicId || demo.url}')" title="Eliminar demo">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function formatDuration(seconds) {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function showMessage(element, message, type, timeout = 5000) {
    if (!element) return;
    
    element.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    
    if (timeout > 0) {
        setTimeout(() => {
            element.innerHTML = '';
        }, timeout);
    }
}

// Funciones de modal
function showCreateJobModal() {
    document.getElementById('createJobModal').style.display = 'flex';
}

function closeCreateJobModal() {
    document.getElementById('createJobModal').style.display = 'none';
}

function closeJobApplicationsModal() {
    document.getElementById('jobApplicationsModal').style.display = 'none';
}

// =============================================
// EXPORTACIÓN DE FUNCIONES GLOBALES
// =============================================

window.loadUserProfile = loadUserProfile;
window.toggleProfileSection = toggleProfileSection;
window.deleteDemo = deleteDemo;
window.showCreateJobModal = showCreateJobModal;
window.closeCreateJobModal = closeCreateJobModal;
window.closeJobApplicationsModal = closeJobApplicationsModal;
window.updateTalentProfile = updateTalentProfile;
window.updateClientProfile = updateClientProfile;

console.log('✅ profile.js COMPLETAMENTE cargado y listo para usar');
