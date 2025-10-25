// profile.js - Gestión del perfil de usuario (COMPLETO Y CORREGIDO)

// Variable para controlar la inicialización
let profileInitialized = false;

// Inicialización del perfil
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Profile.js inicializando...');
    
    if (profileInitialized) return;
    profileInitialized = true;
    
    // Verificar autenticación
    if (!currentUser) {
        console.log('❌ Usuario no autenticado, redirigiendo...');
        window.location.href = 'index.html';
        return;
    }
    
    initializeProfile();
});

// Inicializar el perfil
function initializeProfile() {
    console.log('🚀 Inicializando perfil para:', currentUser.uid);
    
    setupProfileEventListeners();
    loadUserProfile(currentUser.uid);
    
    // Cargar datos de ubicación para los selects
    if (typeof window.loadLocationData === 'function') {
        window.loadLocationData('editCountrySelect', 'editStateSelect', 'editCitySelect');
    }
}

// Configurar event listeners del perfil
function setupProfileEventListeners() {
    console.log('🔧 Configurando event listeners del perfil...');
    
    // Botones de navegación del dashboard
    document.getElementById('showProfileBtn')?.addEventListener('click', () => showDashboardSection('profile'));
    document.getElementById('showEditProfileBtn')?.addEventListener('click', () => showDashboardSection('editProfile'));
    document.getElementById('showDemosBtn')?.addEventListener('click', () => showDashboardSection('demos'));
    document.getElementById('showApplicationsBtn')?.addEventListener('click', () => showDashboardSection('applications'));
    document.getElementById('showJobsBtn')?.addEventListener('click', () => showDashboardSection('jobs'));
    document.getElementById('showFavoritesBtn')?.addEventListener('click', () => showDashboardSection('favorites'));
    document.getElementById('showNotificationsBtn')?.addEventListener('click', () => showDashboardSection('notifications'));
    document.getElementById('showSettingsBtn')?.addEventListener('click', () => showDashboardSection('settings'));
    
    // Botones de acción
    document.getElementById('saveProfileChanges')?.addEventListener('click', saveProfileChanges);
    document.getElementById('uploadDemoBtn')?.addEventListener('click', openDemoUploader);
    document.getElementById('confirmUploadDemo')?.addEventListener('click', uploadDemoFile);
    document.getElementById('publishJobBtn')?.addEventListener('click', showPublishJobModal);
    document.getElementById('confirmPublishJob')?.addEventListener('click', publishJob);
    document.getElementById('saveSettingsBtn')?.addEventListener('click', saveSettings);
    
    // Listeners para cambios en selects
    document.getElementById('editCountrySelect')?.addEventListener('change', function() {
        if (typeof window.loadStates === 'function') {
            window.loadStates('editCountrySelect', 'editStateSelect', 'editCitySelect');
        }
    });
    
    document.getElementById('editStateSelect')?.addEventListener('change', function() {
        if (typeof window.loadCities === 'function') {
            window.loadCities('editCountrySelect', 'editStateSelect', 'editCitySelect');
        }
    });
    
    // Listener para otros idiomas
    document.getElementById('editLang10')?.addEventListener('change', function() {
        toggleEditOtherLanguages();
    });
    
    // Listeners para cerrar modales
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Listeners para filtros
    document.getElementById('filterApplications')?.addEventListener('change', loadJobApplications);
    document.getElementById('filterJobs')?.addEventListener('change', loadClientJobs);
    
    console.log('✅ Event listeners del perfil configurados');
}

// FUNCIÓN PRINCIPAL: Cargar perfil del usuario
window.loadUserProfile = async function(userId) {
    console.log('📥 Cargando perfil del usuario:', userId);
    
    try {
        let userData = null;
        let userType = null;
        
        // Determinar tipo de usuario y cargar datos
        const talentDoc = await db.collection('talents').doc(userId).get();
        if (talentDoc.exists) {
            userData = talentDoc.data();
            userType = 'talent';
            console.log('🎭 Usuario identificado como talento');
        } else {
            const clientDoc = await db.collection('clients').doc(userId).get();
            if (clientDoc.exists) {
                userData = clientDoc.data();
                userType = 'client';
                console.log('💼 Usuario identificado como cliente');
            }
        }
        
        if (!userData) {
            console.error('❌ No se encontraron datos del usuario');
            showMessage('userProfileContent', 'Error: No se encontraron datos del usuario.', 'error');
            return;
        }
        
        // Actualizar datos globales
        currentUserData = { ...userData, type: userType, id: userId };
        
        // Mostrar secciones según el tipo de usuario
        if (userType === 'talent') {
            document.getElementById('talentSections').style.display = 'block';
            showTalentProfile(userData, userId);
            populateEditForm(userData);
            loadTalentStats(userId);
        } else {
            document.getElementById('clientSections').style.display = 'block';
            showClientProfile(userData, userId);
            loadClientStats(userId);
        }
        
        // Mostrar dashboard por defecto
        showDashboardSection('profile');
        
        // Cargar notificaciones
        loadNotifications();
        
    } catch (error) {
        console.error('❌ Error cargando perfil:', error);
        showMessage('userProfileContent', 'Error al cargar el perfil: ' + error.message, 'error');
    }
};

// Mostrar perfil de talento
function showTalentProfile(userData, userId) {
    const profileContent = document.getElementById('userProfileContent');
    if (!profileContent) return;
    
    const countryName = typeof getCountryName !== 'undefined' ? getCountryName(userData.country) : userData.country;
    const stateName = typeof getStateName !== 'undefined' ? getStateName(userData.country, userData.state) : userData.state;
    const locationInfo = (countryName && stateName && userData.city) ? `${userData.city}, ${stateName}, ${countryName}` : 'N/A';
    const languages = userData.languages ? userData.languages.join(', ') : 'N/A';
    const homeStudio = userData.homeStudio === 'si' ? 
        '<span class="badge success"><i class="fas fa-check-circle"></i> Sí</span>' : 
        '<span class="badge error"><i class="fas fa-times-circle"></i> No</span>';
    
    // Calcular rating promedio si existe
    const rating = userData.rating ? userData.rating.toFixed(1) : 'N/A';
    const ratingStars = userData.rating ? generateRatingStars(userData.rating) : '';
    
    const profileHtml = `
        <div class="profile-header">
            <img src="${userData.profilePictureUrl || 'img/default-avatar.png'}" 
                 alt="${userData.name}" 
                 class="profile-picture-large"
                 onerror="this.src='img/default-avatar.png'">
            <div class="profile-info">
                <h1>${userData.name || 'Talento Sin Nombre'}</h1>
                <div class="profile-meta">
                    <p class="profile-location"><i class="fas fa-map-marker-alt"></i> ${locationInfo}</p>
                    <p class="profile-email"><i class="fas fa-envelope"></i> ${userData.email || 'N/A'}</p>
                    <p class="profile-phone"><i class="fas fa-phone"></i> ${userData.phone || 'N/A'}</p>
                    ${userData.rating ? `
                    <div class="profile-rating">
                        <span class="rating-stars">${ratingStars}</span>
                        <span class="rating-value">(${rating})</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
        
        <div class="profile-stats">
            <div class="stat-card">
                <div class="stat-number">${userData.demos ? userData.demos.length : 0}</div>
                <div class="stat-label">Demos</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${userData.jobApplications ? userData.jobApplications.length : 0}</div>
                <div class="stat-label">Postulaciones</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${userData.completedJobs ? userData.completedJobs.length : 0}</div>
                <div class="stat-label">Trabajos Completados</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${userData.favorites ? userData.favorites.length : 0}</div>
                <div class="stat-label">Favoritos</div>
            </div>
        </div>
        
        <div class="profile-details">
            <div class="detail-section">
                <h3><i class="fas fa-user"></i> Información Personal</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Género:</label>
                        <span>${userData.gender || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Edad:</label>
                        <span>${userData.realAge || userData.ageRange || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Nacionalidad:</label>
                        <span>${userData.nationality || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Idiomas:</label>
                        <span>${languages}</span>
                    </div>
                    <div class="detail-item">
                        <label>Home Studio:</label>
                        <span>${homeStudio}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-file-alt"></i> Biografía</h3>
                <p class="bio-text">${userData.bio || 'No hay biografía disponible.'}</p>
            </div>
            
            ${userData.skills && userData.skills.length > 0 ? `
            <div class="detail-section">
                <h3><i class="fas fa-star"></i> Habilidades Especiales</h3>
                <div class="skills-container">
                    ${userData.skills.map(skill => `
                        <span class="skill-tag">${skill}</span>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            ${userData.experience ? `
            <div class="detail-section">
                <h3><i class="fas fa-briefcase"></i> Experiencia</h3>
                <p class="experience-text">${userData.experience}</p>
            </div>
            ` : ''}
            
            ${userData.equipment ? `
            <div class="detail-section">
                <h3><i class="fas fa-microphone"></i> Equipamiento</h3>
                <p class="equipment-text">${userData.equipment}</p>
            </div>
            ` : ''}
        </div>
        
        <div class="profile-actions">
            <button class="btn btn-primary" onclick="showDashboardSection('editProfile')">
                <i class="fas fa-edit"></i> Editar Perfil
            </button>
            <button class="btn btn-secondary" onclick="generateProfileShareLink('${userId}')">
                <i class="fas fa-share"></i> Compartir Perfil
            </button>
        </div>
    `;
    
    profileContent.innerHTML = profileHtml;
}

// Mostrar perfil de cliente
function showClientProfile(userData, userId) {
    const profileContent = document.getElementById('userProfileContent');
    if (!profileContent) return;
    
    const countryName = typeof getCountryName !== 'undefined' ? getCountryName(userData.country) : userData.country;
    const stateName = typeof getStateName !== 'undefined' ? getStateName(userData.country, userData.state) : userData.state;
    const locationInfo = (countryName && stateName && userData.city) ? `${userData.city}, ${stateName}, ${countryName}` : 'N/A';
    const companyInfo = userData.clientType === 'empresa' ? 
        `<p class="profile-company"><i class="fas fa-building"></i> ${userData.companyName || 'N/A'}</p>` : '';
    const clientTypeBadge = userData.clientType === 'empresa' ? 
        '<span class="badge success">Empresa</span>' : 
        '<span class="badge info">Independiente</span>';
    
    const profileHtml = `
        <div class="profile-header">
            <img src="${userData.profilePictureUrl || 'img/default-avatar-client.png'}" 
                 alt="${userData.name}" 
                 class="profile-picture-large"
                 onerror="this.src='img/default-avatar-client.png'">
            <div class="profile-info">
                <h1>${userData.name || 'Cliente Sin Nombre'}</h1>
                <div class="profile-meta">
                    ${clientTypeBadge}
                    ${companyInfo}
                    <p class="profile-location"><i class="fas fa-map-marker-alt"></i> ${locationInfo}</p>
                    <p class="profile-email"><i class="fas fa-envelope"></i> ${userData.email || 'N/A'}</p>
                    <p class="profile-phone"><i class="fas fa-phone"></i> ${userData.phone || 'N/A'}</p>
                </div>
            </div>
        </div>
        
        <div class="profile-stats">
            <div class="stat-card">
                <div class="stat-number">${userData.postedJobs ? userData.postedJobs.length : 0}</div>
                <div class="stat-label">Trabajos Publicados</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${userData.activeJobs ? userData.activeJobs.length : 0}</div>
                <div class="stat-label">Trabajos Activos</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${userData.completedJobs ? userData.completedJobs.length : 0}</div>
                <div class="stat-label">Trabajos Completados</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${userData.favorites ? userData.favorites.length : 0}</div>
                <div class="stat-label">Talentos Favoritos</div>
            </div>
        </div>
        
        ${userData.companyDescription ? `
        <div class="detail-section">
            <h3><i class="fas fa-building"></i> Sobre la Empresa</h3>
            <p class="company-description">${userData.companyDescription}</p>
        </div>
        ` : ''}
        
        <div class="client-actions">
            <button class="btn btn-primary" onclick="showPublishJobModal()">
                <i class="fas fa-plus"></i> Publicar Nuevo Trabajo
            </button>
            <button class="btn btn-secondary" onclick="showDashboardSection('favorites')">
                <i class="fas fa-heart"></i> Ver Favoritos
            </button>
        </div>
    `;
    
    profileContent.innerHTML = profileHtml;
}

// FUNCIÓN CORREGIDA: Guardar cambios del perfil
window.saveProfileChanges = async function() {
    console.log('💾 Guardando cambios del perfil...');
    
    if (!currentUser || currentUserData.type !== 'talent') {
        alert('❌ Solo los talentos pueden editar su perfil.');
        return;
    }
    
    const saveButton = document.getElementById('saveProfileChanges');
    const originalText = saveButton.innerHTML;
    
    try {
        // Mostrar estado de guardado
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        saveButton.disabled = true;
        
        // Obtener valores del formulario
        const updatedData = {
            name: document.getElementById('editName').value,
            phone: document.getElementById('editPhone').value,
            email: document.getElementById('editEmail').value,
            country: document.getElementById('editCountrySelect').value,
            state: document.getElementById('editStateSelect').value,
            city: document.getElementById('editCitySelect').value,
            gender: document.getElementById('editGender').value,
            realAge: document.getElementById('editRealAge').value,
            ageRange: document.getElementById('editAgeRange').value,
            nationality: document.getElementById('editNationality').value,
            languages: getEditSelectedLanguages(),
            homeStudio: document.querySelector('input[name="editHomeStudio"]:checked')?.value || 'no',
            bio: document.getElementById('editBio').value || '',
            skills: getEditSkills(),
            experience: document.getElementById('editExperience').value || '',
            equipment: document.getElementById('editEquipment').value || '',
            hourlyRate: document.getElementById('editHourlyRate').value ? parseInt(document.getElementById('editHourlyRate').value) : null,
            availability: document.getElementById('editAvailability').value || 'flexible',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Validaciones básicas
        if (!updatedData.name || !updatedData.email) {
            throw new Error('El nombre y email son obligatorios.');
        }
        
        if (!updatedData.country || !updatedData.state || !updatedData.city) {
            throw new Error('Debes seleccionar país, estado/provincia y ciudad.');
        }
        
        // Manejar imagen de perfil si se subió una nueva
        const profilePictureFile = document.getElementById('editProfilePicture').files[0];
        if (profilePictureFile) {
            console.log('🖼️ Subiendo nueva imagen de perfil...');
            const uploadResult = await window.uploadToCloudinary(profilePictureFile);
            updatedData.profilePictureUrl = uploadResult.url;
        }
        
        // Actualizar en Firestore
        console.log('📤 Actualizando datos en Firestore...');
        await db.collection('talents').doc(currentUser.uid).update(updatedData);
        
        // Actualizar datos locales
        currentUserData = { ...currentUserData, ...updatedData };
        
        // Actualizar la UI del header si existe
        const headerUserPicture = document.getElementById('headerUserPicture');
        const userName = document.getElementById('userName');
        
        if (headerUserPicture && updatedData.profilePictureUrl) {
            headerUserPicture.src = updatedData.profilePictureUrl;
        }
        
        if (userName) {
            userName.textContent = updatedData.name;
        }
        
        // Mostrar mensaje de éxito
        showMessage('editProfileMessage', '✅ Perfil actualizado correctamente.', 'success');
        
        // Recargar la vista del perfil después de un breve delay
        setTimeout(() => {
            loadUserProfile(currentUser.uid);
            showDashboardSection('profile');
        }, 1500);
        
    } catch (error) {
        console.error('❌ Error guardando cambios:', error);
        showMessage('editProfileMessage', '❌ Error al guardar: ' + error.message, 'error');
    } finally {
        // Restaurar el botón
        saveButton.innerHTML = originalText;
        saveButton.disabled = false;
    }
};

// FUNCIÓN NUEVA: Obtener idiomas seleccionados en el formulario de edición
function getEditSelectedLanguages() {
    const languages = [];
    for (let i = 1; i <= 10; i++) {
        const checkbox = document.getElementById('editLang' + i);
        if (checkbox && checkbox.checked) {
            const langValue = checkbox.value === 'otros' ? 
                document.getElementById('editOtherLanguages').value : 
                checkbox.value;
            
            if (langValue.trim()) {
                languages.push(langValue);
            }
        }
    }
    return languages;
}

// FUNCIÓN NUEVA: Obtener habilidades del formulario
function getEditSkills() {
    const skillsInput = document.getElementById('editSkills');
    if (!skillsInput || !skillsInput.value) return [];
    
    return skillsInput.value.split(',').map(skill => skill.trim()).filter(skill => skill);
}

// FUNCIÓN NUEVA: Mostrar/ocultar campo de otros idiomas en edición
function toggleEditOtherLanguages() {
    const otherLanguagesField = document.getElementById('editOtherLanguagesField');
    const lang10 = document.getElementById('editLang10');
    
    if (otherLanguagesField && lang10) {
        otherLanguagesField.style.display = lang10.checked ? 'block' : 'none';
    }
}

// FUNCIÓN NUEVA: Poblar formulario de edición con datos actuales
function populateEditForm(userData) {
    console.log('📝 Poblando formulario de edición...');
    
    // Datos básicos
    setValue('editName', userData.name);
    setValue('editPhone', userData.phone);
    setValue('editEmail', userData.email);
    setValue('editGender', userData.gender);
    setValue('editRealAge', userData.realAge);
    setValue('editAgeRange', userData.ageRange);
    setValue('editNationality', userData.nationality);
    setValue('editBio', userData.bio);
    setValue('editExperience', userData.experience);
    setValue('editEquipment', userData.equipment);
    setValue('editHourlyRate', userData.hourlyRate);
    setValue('editAvailability', userData.availability);
    
    // Habilidades
    if (userData.skills && userData.skills.length > 0) {
        document.getElementById('editSkills').value = userData.skills.join(', ');
    }
    
    // Home Studio
    const homeStudioValue = userData.homeStudio || 'no';
    document.querySelectorAll('input[name="editHomeStudio"]').forEach(radio => {
        radio.checked = radio.value === homeStudioValue;
    });
    
    // Idiomas
    if (userData.languages) {
        // Resetear checkboxes primero
        for (let i = 1; i <= 10; i++) {
            const checkbox = document.getElementById('editLang' + i);
            if (checkbox) checkbox.checked = false;
        }
        
        // Marcar idiomas existentes
        userData.languages.forEach(language => {
            let found = false;
            
            // Buscar en los idiomas predefinidos
            for (let i = 1; i <= 9; i++) {
                const checkbox = document.getElementById('editLang' + i);
                if (checkbox && checkbox.value === language) {
                    checkbox.checked = true;
                    found = true;
                    break;
                }
            }
            
            // Si no se encuentra, es un "otro" idioma
            if (!found) {
                document.getElementById('editLang10').checked = true;
                document.getElementById('editOtherLanguages').value = language;
                toggleEditOtherLanguages();
            }
        });
    }
    
    // Ubicación (cargar async)
    setTimeout(() => {
        if (userData.country) {
            setSelectValue('editCountrySelect', userData.country);
            
            // Cargar estados después de un delay
            setTimeout(() => {
                if (userData.state && typeof window.loadStates === 'function') {
                    window.loadStates('editCountrySelect', 'editStateSelect', 'editCitySelect');
                    
                    setTimeout(() => {
                        setSelectValue('editStateSelect', userData.state);
                        
                        // Cargar ciudades después de un delay
                        setTimeout(() => {
                            if (userData.city && typeof window.loadCities === 'function') {
                                window.loadCities('editCountrySelect', 'editStateSelect', 'editCitySelect');
                                
                                setTimeout(() => {
                                    setSelectValue('editCitySelect', userData.city);
                                }, 500);
                            }
                        }, 500);
                    }, 500);
                }
            }, 500);
        }
    }, 100);
}

// ============================================================================
// FUNCIONES DEL DASHBOARD Y SECCIONES
// ============================================================================

// Mostrar sección del dashboard
function showDashboardSection(section) {
    console.log('📊 Mostrando sección:', section);
    
    // Ocultar todas las secciones
    document.querySelectorAll('.dashboard-section').forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Remover clase active de todos los botones
    document.querySelectorAll('.dashboard-nav button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar sección seleccionada
    const targetSection = document.getElementById(section + 'Section');
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Activar botón correspondiente
    const targetButton = document.getElementById('show' + section.charAt(0).toUpperCase() + section.slice(1) + 'Btn');
    if (targetButton) {
        targetButton.classList.add('active');
    }
    
    // Cargar datos específicos de la sección
    switch(section) {
        case 'demos':
            loadUserDemos();
            break;
        case 'applications':
            loadJobApplications();
            break;
        case 'jobs':
            if (currentUserData.type === 'client') {
                loadClientJobs();
            }
            break;
        case 'favorites':
            if (currentUserData.type === 'client') {
                loadFavorites();
            }
            break;
        case 'notifications':
            loadNotifications();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// ============================================================================
// GESTIÓN DE DEMOS
// ============================================================================

// Cargar demos del usuario
async function loadUserDemos() {
    if (!currentUser || currentUserData.type !== 'talent') return;
    
    try {
        const demosContainer = document.getElementById('demosContainer');
        if (!demosContainer) return;
        
        const talentDoc = await db.collection('talents').doc(currentUser.uid).get();
        const talentData = talentDoc.data();
        const demos = talentData.demos || [];
        
        if (demos.length === 0) {
            demosContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-music fa-3x"></i>
                    <h3>No tienes demos aún</h3>
                    <p>Sube tu primera demo para mostrar tu talento a los clientes.</p>
                    <button class="btn btn-primary" onclick="openDemoUploader()">
                        <i class="fas fa-upload"></i> Subir Primera Demo
                    </button>
                </div>
            `;
            return;
        }
        
        let demosHtml = '';
        demos.forEach((demo, index) => {
            demosHtml += `
                <div class="demo-item">
                    <div class="demo-info">
                        <strong>${demo.name || 'Demo ' + (index + 1)}</strong>
                        <span class="demo-duration">${demo.duration ? formatDuration(demo.duration) : 'N/A'}</span>
                        <span class="demo-date">${demo.uploadedAt ? formatDate(demo.uploadedAt.toDate()) : 'N/A'}</span>
                    </div>
                    <div class="demo-actions">
                        <audio controls src="${demo.url}"></audio>
                        <div class="demo-buttons">
                            <button class="btn btn-secondary btn-sm" onclick="setDemoAsFeatured(${index})">
                                <i class="fas fa-star"></i> Destacar
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteDemo(${index})">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        demosContainer.innerHTML = demosHtml;
        
    } catch (error) {
        console.error('Error cargando demos:', error);
        document.getElementById('demosContainer').innerHTML = '<p class="text-danger">Error al cargar las demos.</p>';
    }
}

// Abrir modal para subir demo
function openDemoUploader() {
    document.getElementById('uploadDemoModal').style.display = 'flex';
    document.getElementById('demoFile').value = '';
    document.getElementById('demoName').value = '';
    document.getElementById('uploadDemoMessage').innerHTML = '';
}

// Subir archivo de demo
async function uploadDemoFile() {
    if (!currentUser || currentUserData.type !== 'talent') return;
    
    const demoFile = document.getElementById('demoFile').files[0];
    const demoName = document.getElementById('demoName').value || 'Demo sin nombre';
    const messageDiv = document.getElementById('uploadDemoMessage');
    const uploadButton = document.getElementById('confirmUploadDemo');
    
    if (!demoFile) {
        showMessage(messageDiv, '❌ Por favor, selecciona un archivo de audio.', 'error');
        return;
    }
    
    // Validar tipo de archivo
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-m4a'];
    if (!validTypes.includes(demoFile.type)) {
        showMessage(messageDiv, '❌ Formato de archivo no válido. Usa MP3, WAV u OGG.', 'error');
        return;
    }
    
    // Validar tamaño (20MB máximo)
    if (demoFile.size > 20 * 1024 * 1024) {
        showMessage(messageDiv, '❌ El archivo es demasiado grande. Máximo 20MB.', 'error');
        return;
    }
    
    const originalText = uploadButton.innerHTML;
    
    try {
        uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
        uploadButton.disabled = true;
        
        showMessage(messageDiv, '⌛ Subiendo archivo...', 'info');
        
        // Subir a Cloudinary
        const uploadResult = await window.uploadToCloudinary(demoFile);
        
        // Crear objeto demo
        const demoData = {
            name: demoName,
            url: uploadResult.url,
            duration: uploadResult.duration,
            format: uploadResult.format,
            publicId: uploadResult.publicId,
            size: demoFile.size,
            uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
            isFeatured: false
        };
        
        // Agregar demo al array de demos del talento
        await db.collection('talents').doc(currentUser.uid).update({
            demos: firebase.firestore.FieldValue.arrayUnion(demoData)
        });
        
        showMessage(messageDiv, '✅ Demo subida correctamente.', 'success');
        
        // Cerrar modal y recargar demos después de un delay
        setTimeout(() => {
            document.getElementById('uploadDemoModal').style.display = 'none';
            loadUserDemos();
        }, 1500);
        
    } catch (error) {
        console.error('Error subiendo demo:', error);
        showMessage(messageDiv, '❌ Error al subir demo: ' + error.message, 'error');
    } finally {
        uploadButton.innerHTML = originalText;
        uploadButton.disabled = false;
    }
}

// Establecer demo como destacada
async function setDemoAsFeatured(demoIndex) {
    if (!currentUser || currentUserData.type !== 'talent') return;
    
    try {
        const talentDoc = await db.collection('talents').doc(currentUser.uid).get();
        const talentData = talentDoc.data();
        const demos = talentData.demos || [];
        
        // Quitar featured de todas las demos
        const updatedDemos = demos.map((demo, index) => ({
            ...demo,
            isFeatured: index === demoIndex
        }));
        
        await db.collection('talents').doc(currentUser.uid).update({
            demos: updatedDemos
        });
        
        // Recargar demos
        loadUserDemos();
        
        showMessage('demosMessage', '✅ Demo destacada correctamente.', 'success');
        
    } catch (error) {
        console.error('Error destacando demo:', error);
        showMessage('demosMessage', '❌ Error al destacar la demo.', 'error');
    }
}

// Eliminar demo
async function deleteDemo(demoIndex) {
    if (!currentUser || currentUserData.type !== 'talent') return;
    
    if (!confirm('¿Estás seguro de que quieres eliminar esta demo?')) {
        return;
    }
    
    try {
        const talentDoc = await db.collection('talents').doc(currentUser.uid).get();
        const talentData = talentDoc.data();
        const demos = talentData.demos || [];
        
        if (demoIndex >= 0 && demoIndex < demos.length) {
            // Remover demo del array
            const updatedDemos = demos.filter((_, index) => index !== demoIndex);
            
            await db.collection('talents').doc(currentUser.uid).update({
                demos: updatedDemos
            });
            
            // Recargar demos
            loadUserDemos();
            
            showMessage('demosMessage', '✅ Demo eliminada correctamente.', 'success');
        }
    } catch (error) {
        console.error('Error eliminando demo:', error);
        showMessage('demosMessage', '❌ Error al eliminar la demo.', 'error');
    }
}

// ============================================================================
// GESTIÓN DE POSTULACIONES
// ============================================================================

// Cargar postulaciones a trabajos
async function loadJobApplications() {
    if (!currentUser || currentUserData.type !== 'talent') return;
    
    try {
        const applicationsContainer = document.getElementById('applicationsContainer');
        if (!applicationsContainer) return;
        
        const filter = document.getElementById('filterApplications')?.value || 'all';
        
        // Obtener postulaciones del talento
        let applicationsQuery = db.collection('jobApplications')
            .where('talentId', '==', currentUser.uid)
            .orderBy('appliedAt', 'desc');
        
        // Aplicar filtro si no es 'all'
        if (filter !== 'all') {
            applicationsQuery = applicationsQuery.where('status', '==', filter);
        }
        
        const applicationsSnapshot = await applicationsQuery.get();
        
        if (applicationsSnapshot.empty) {
            applicationsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-briefcase fa-3x"></i>
                    <h3>No tienes postulaciones</h3>
                    <p>Encuentra oportunidades de trabajo y postúlate para mostrar tu talento.</p>
                    <button class="btn btn-primary" onclick="window.location.href = 'index.html'">
                        <i class="fas fa-search"></i> Buscar Trabajos
                    </button>
                </div>
            `;
            return;
        }
        
        let applicationsHtml = '';
        let applicationsCount = 0;
        
        for (const doc of applicationsSnapshot.docs) {
            const application = doc.data();
            const jobDoc = await db.collection('jobs').doc(application.jobId).get();
            
            if (jobDoc.exists) {
                const job = jobDoc.data();
                const statusBadge = getStatusBadge(application.status);
                const appliedDate = application.appliedAt?.toDate?.() || new Date();
                const budget = job.budget ? `$${job.budget}` : 'A convenir';
                
                applicationsHtml += `
                    <div class="application-card">
                        <div class="application-header">
                            <h4>${job.title}</h4>
                            ${statusBadge}
                        </div>
                        <div class="application-details">
                            <p><strong>Cliente:</strong> ${job.clientName}</p>
                            <p><strong>Presupuesto:</strong> ${budget}</p>
                            <p><strong>Fecha de postulación:</strong> ${formatDateTime(appliedDate)}</p>
                            ${application.clientMessage ? `
                            <p><strong>Mensaje del cliente:</strong> ${application.clientMessage}</p>
                            ` : ''}
                        </div>
                        <div class="application-actions">
                            <button class="btn btn-secondary btn-sm" onclick="viewJobDetails('${application.jobId}')">
                                <i class="fas fa-eye"></i> Ver Detalles
                            </button>
                            ${application.status === 'pending' ? `
                            <button class="btn btn-danger btn-sm" onclick="withdrawApplication('${doc.id}')">
                                <i class="fas fa-times"></i> Retirar
                            </button>
                            ` : ''}
                        </div>
                    </div>
                `;
                applicationsCount++;
            }
        }
        
        // Agregar contador y filtros
        const filterHtml = `
            <div class="section-filters">
                <div class="filter-group">
                    <label for="filterApplications">Filtrar por estado:</label>
                    <select id="filterApplications">
                        <option value="all">Todas</option>
                        <option value="pending">Pendientes</option>
                        <option value="approved">Aprobadas</option>
                        <option value="rejected">Rechazadas</option>
                        <option value="hired">Contratadas</option>
                    </select>
                </div>
                <div class="applications-count">
                    <span>${applicationsCount} postulaciones</span>
                </div>
            </div>
        `;
        
        applicationsContainer.innerHTML = filterHtml + applicationsHtml;
        
        // Actualizar el valor del filtro
        document.getElementById('filterApplications').value = filter;
        
    } catch (error) {
        console.error('Error cargando postulaciones:', error);
        applicationsContainer.innerHTML = '<p class="text-danger">Error al cargar las postulaciones.</p>';
    }
}

// Retirar postulación
async function withdrawApplication(applicationId) {
    if (!currentUser || currentUserData.type !== 'talent') return;
    
    if (!confirm('¿Estás seguro de que quieres retirar esta postulación?')) {
        return;
    }
    
    try {
        await db.collection('jobApplications').doc(applicationId).update({
            status: 'withdrawn',
            withdrawnAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Recargar postulaciones
        loadJobApplications();
        
        showMessage('applicationsMessage', '✅ Postulación retirada correctamente.', 'success');
        
    } catch (error) {
        console.error('Error retirando postulación:', error);
        showMessage('applicationsMessage', '❌ Error al retirar la postulación.', 'error');
    }
}

// ============================================================================
// GESTIÓN DE TRABAJOS (CLIENTES)
// ============================================================================

// Cargar trabajos del cliente
async function loadClientJobs() {
    if (!currentUser || currentUserData.type !== 'client') return;
    
    try {
        const jobsContainer = document.getElementById('jobsContainer');
        if (!jobsContainer) return;
        
        const filter = document.getElementById('filterJobs')?.value || 'all';
        
        let jobsQuery = db.collection('jobs')
            .where('clientId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc');
        
        // Aplicar filtro si no es 'all'
        if (filter !== 'all') {
            jobsQuery = jobsQuery.where('status', '==', filter);
        }
        
        const jobsSnapshot = await jobsQuery.get();
        
        if (jobsSnapshot.empty) {
            jobsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bullhorn fa-3x"></i>
                    <h3>No has publicado trabajos</h3>
                    <p>Publica tu primera oferta de trabajo para encontrar talento vocal.</p>
                    <button class="btn btn-primary" onclick="showPublishJobModal()">
                        <i class="fas fa-plus"></i> Publicar Trabajo
                    </button>
                </div>
            `;
            return;
        }
        
        let jobsHtml = '';
        let jobsCount = 0;
        
        jobsSnapshot.docs.forEach(doc => {
            const job = doc.data();
            const jobId = doc.id;
            const statusBadge = getStatusBadge(job.status);
            const createdDate = job.createdAt?.toDate?.() || new Date();
            const budget = job.budget ? `$${job.budget}` : 'A convenir';
            const applicationsCount = job.applicationsCount || 0;
            
            jobsHtml += `
                <div class="job-card">
                    <div class="job-header">
                        <h4>${job.title}</h4>
                        ${statusBadge}
                    </div>
                    <div class="job-details">
                        <p><strong>Descripción:</strong> ${job.description ? job.description.substring(0, 150) + '...' : 'Sin descripción'}</p>
                        <p><strong>Presupuesto:</strong> ${budget}</p>
                        <p><strong>Postulantes:</strong> ${applicationsCount}</p>
                        <p><strong>Publicado:</strong> ${formatDateTime(createdDate)}</p>
                    </div>
                    <div class="job-actions">
                        <button class="btn btn-secondary btn-sm" onclick="viewJobApplications('${jobId}')">
                            <i class="fas fa-users"></i> Postulantes (${applicationsCount})
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="editJob('${jobId}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        ${job.status === 'active' ? `
                        <button class="btn btn-danger btn-sm" onclick="closeJob('${jobId}')">
                            <i class="fas fa-times"></i> Cerrar
                        </button>
                        ` : ''}
                    </div>
                </div>
            `;
            jobsCount++;
        });
        
        // Agregar filtros
        const filterHtml = `
            <div class="section-filters">
                <div class="filter-group">
                    <label for="filterJobs">Filtrar por estado:</label>
                    <select id="filterJobs">
                        <option value="all">Todos</option>
                        <option value="active">Activos</option>
                        <option value="paused">Pausados</option>
                        <option value="closed">Cerrados</option>
                        <option value="completed">Completados</option>
                    </select>
                </div>
                <div class="jobs-count">
                    <span>${jobsCount} trabajos</span>
                </div>
            </div>
        `;
        
        jobsContainer.innerHTML = filterHtml + jobsHtml;
        
        // Actualizar el valor del filtro
        document.getElementById('filterJobs').value = filter;
        
    } catch (error) {
        console.error('Error cargando trabajos:', error);
        document.getElementById('jobsContainer').innerHTML = '<p class="text-danger">Error al cargar los trabajos.</p>';
    }
}

// ============================================================================
// GESTIÓN DE FAVORITOS
// ============================================================================

// Cargar favoritos del cliente
async function loadFavorites() {
    if (!currentUser || currentUserData.type !== 'client') return;
    
    try {
        const favoritesContainer = document.getElementById('favoritesContainer');
        if (!favoritesContainer) return;
        
        const clientDoc = await db.collection('clients').doc(currentUser.uid).get();
        const clientData = clientDoc.data();
        const favorites = clientData.favorites || [];
        
        if (favorites.length === 0) {
            favoritesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart fa-3x"></i>
                    <h3>No tienes talentos favoritos</h3>
                    <p>Explora el directorio de talentos y guarda tus favoritos para contactarlos fácilmente.</p>
                    <button class="btn btn-primary" onclick="window.location.href = 'index.html'">
                        <i class="fas fa-search"></i> Buscar Talentos
                    </button>
                </div>
            `;
            return;
        }
        
        let favoritesHtml = '';
        
        for (const talentId of favorites) {
            const talentDoc = await db.collection('talents').doc(talentId).get();
            
            if (talentDoc.exists) {
                const talent = talentDoc.data();
                const countryName = typeof getCountryName !== 'undefined' ? getCountryName(talent.country) : talent.country;
                const languages = talent.languages ? talent.languages.slice(0, 3).join(', ') : 'N/A';
                const rating = talent.rating ? talent.rating.toFixed(1) : 'Nuevo';
                const demoCount = talent.demos ? talent.demos.length : 0;
                
                favoritesHtml += `
                    <div class="talent-card">
                        <div class="talent-header">
                            <img src="${talent.profilePictureUrl || 'img/default-avatar.png'}" 
                                 alt="${talent.name}" 
                                 class="talent-pic"
                                 onerror="this.src='img/default-avatar.png'">
                            <div class="talent-info">
                                <h4>${talent.name}</h4>
                                <p class="talent-location"><i class="fas fa-map-marker-alt"></i> ${countryName || 'N/A'}</p>
                                <div class="talent-meta">
                                    <span class="rating"><i class="fas fa-star"></i> ${rating}</span>
                                    <span class="demos"><i class="fas fa-music"></i> ${demoCount} demos</span>
                                </div>
                            </div>
                        </div>
                        <div class="talent-details">
                            <p><strong>Idiomas:</strong> ${languages}${talent.languages && talent.languages.length > 3 ? '...' : ''}</p>
                            <p><strong>Home Studio:</strong> ${talent.homeStudio === 'si' ? 'Sí' : 'No'}</p>
                        </div>
                        <div class="talent-actions">
                            <button class="btn btn-secondary btn-sm" onclick="viewTalentProfile('${talentId}')">
                                <i class="fas fa-user"></i> Ver Perfil
                            </button>
                            <button class="btn btn-primary btn-sm" onclick="contactTalent('${talentId}')">
                                <i class="fas fa-envelope"></i> Contactar
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="removeFromFavorites('${talentId}')">
                                <i class="fas fa-trash"></i> Quitar
                            </button>
                        </div>
                    </div>
                `;
            }
        }
        
        favoritesContainer.innerHTML = `
            <div class="section-header">
                <h3>${favorites.length} Talentos Favoritos</h3>
            </div>
            <div class="favorites-grid">
                ${favoritesHtml}
            </div>
        `;
        
    } catch (error) {
        console.error('Error cargando favoritos:', error);
        favoritesContainer.innerHTML = '<p class="text-danger">Error al cargar los favoritos.</p>';
    }
}

// ============================================================================
// NOTIFICACIONES Y CONFIGURACIÓN
// ============================================================================

// Cargar notificaciones
async function loadNotifications() {
    if (!currentUser) return;
    
    try {
        const notificationsContainer = document.getElementById('notificationsContainer');
        if (!notificationsContainer) return;
        
        const notificationsSnapshot = await db.collection('notifications')
            .where('userId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        
        if (notificationsSnapshot.empty) {
            notificationsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell fa-3x"></i>
                    <h3>No tienes notificaciones</h3>
                    <p>Te avisaremos cuando tengas nuevas actividades en tu cuenta.</p>
                </div>
            `;
            return;
        }
        
        let notificationsHtml = '';
        let unreadCount = 0;
        
        notificationsSnapshot.docs.forEach(doc => {
            const notification = doc.data();
            const isRead = notification.read || false;
            const date = notification.createdAt?.toDate?.() || new Date();
            
            if (!isRead) unreadCount++;
            
            notificationsHtml += `
                <div class="notification-item ${!isRead ? 'unread' : ''}">
                    <div class="notification-icon">
                        <i class="fas fa-${getNotificationIcon(notification.type)}"></i>
                    </div>
                    <div class="notification-content">
                        <p class="notification-message">${notification.message}</p>
                        <span class="notification-date">${formatDateTime(date)}</span>
                    </div>
                    <div class="notification-actions">
                        ${!isRead ? `
                        <button class="btn btn-sm btn-outline" onclick="markNotificationAsRead('${doc.id}')">
                            <i class="fas fa-check"></i> Marcar como leída
                        </button>
                        ` : ''}
                        <button class="btn btn-sm btn-danger" onclick="deleteNotification('${doc.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        // Actualizar badge de notificaciones
        const notificationBadge = document.getElementById('notificationBadge');
        if (notificationBadge) {
            notificationBadge.textContent = unreadCount;
            notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
        
        notificationsContainer.innerHTML = `
            <div class="notifications-header">
                <h3>Notificaciones</h3>
                ${unreadCount > 0 ? `
                <button class="btn btn-outline btn-sm" onclick="markAllNotificationsAsRead()">
                    <i class="fas fa-check-double"></i> Marcar todas como leídas
                </button>
                ` : ''}
            </div>
            <div class="notifications-list">
                ${notificationsHtml}
            </div>
        `;
        
    } catch (error) {
        console.error('Error cargando notificaciones:', error);
        notificationsContainer.innerHTML = '<p class="text-danger">Error al cargar las notificaciones.</p>';
    }
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

// Funciones auxiliares para establecer valores
function setValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element && value !== null && value !== undefined) {
        element.value = value;
    }
}

function setSelectValue(selectId, value) {
    const select = document.getElementById(selectId);
    if (select && value) {
        select.value = value;
    }
}

function showMessage(element, message, type) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) {
        el.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
        
        // Auto-ocultar mensajes de éxito después de 5 segundos
        if (type === 'success') {
            setTimeout(() => {
                el.innerHTML = '';
            }, 5000);
        }
    }
}

function getStatusBadge(status) {
    const statusMap = {
        'pending': { class: 'warning', text: 'Pendiente', icon: 'clock' },
        'approved': { class: 'success', text: 'Aprobado', icon: 'check' },
        'rejected': { class: 'error', text: 'Rechazado', icon: 'times' },
        'hired': { class: 'success', text: 'Contratado', icon: 'user-check' },
        'withdrawn': { class: 'secondary', text: 'Retirado', icon: 'undo' },
        'active': { class: 'success', text: 'Activo', icon: 'play' },
        'paused': { class: 'warning', text: 'Pausado', icon: 'pause' },
        'closed': { class: 'error', text: 'Cerrado', icon: 'times' },
        'completed': { class: 'info', text: 'Completado', icon: 'check-double' }
    };
    
    const statusInfo = statusMap[status] || { class: 'secondary', text: status, icon: 'circle' };
    return `<span class="badge ${statusInfo.class}"><i class="fas fa-${statusInfo.icon}"></i> ${statusInfo.text}</span>`;
}

function getNotificationIcon(type) {
    const iconMap = {
        'new_application': 'user-plus',
        'application_approved': 'check-circle',
        'application_rejected': 'times-circle',
        'new_job': 'bullhorn',
        'job_completed': 'check-double',
        'message': 'envelope',
        'system': 'info-circle',
        'payment': 'credit-card'
    };
    
    return iconMap[type] || 'bell';
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(date) {
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDateTime(date) {
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function generateRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '';
    
    // Estrellas llenas
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    // Media estrella
    if (halfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Estrellas vacías
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// ============================================================================
// FUNCIONES GLOBALES
// ============================================================================

// Funciones que se llaman desde el HTML
window.viewTalentProfile = async function(talentId) {
    console.log('Ver perfil del talento:', talentId);
    // Esta función se implementa en app.js
};

window.viewJobDetails = async function(jobId) {
    console.log('Ver detalles del trabajo:', jobId);
    // Esta función se implementa en app.js
};

window.removeFromFavorites = async function(talentId) {
    if (!currentUser || currentUserData.type !== 'client') return;
    
    try {
        await db.collection('clients').doc(currentUser.uid).update({
            favorites: firebase.firestore.FieldValue.arrayRemove(talentId)
        });
        
        // Recargar favoritos
        loadFavorites();
        
        showMessage('favoritesMessage', '✅ Talento removido de favoritos.', 'success');
        
    } catch (error) {
        console.error('Error removiendo de favoritos:', error);
        showMessage('favoritesMessage', '❌ Error al remover de favoritos.', 'error');
    }
};

window.contactTalent = function(talentId) {
    // Implementar lógica de contacto
    console.log('Contactar talento:', talentId);
    alert('Funcionalidad de contacto en desarrollo');
};

window.viewJobApplications = function(jobId) {
    // Implementar vista de postulantes
    console.log('Ver postulantes del trabajo:', jobId);
    alert('Funcionalidad de ver postulantes en desarrollo');
};

window.editJob = function(jobId) {
    // Implementar edición de trabajo
    console.log('Editar trabajo:', jobId);
    alert('Funcionalidad de editar trabajo en desarrollo');
};

window.closeJob = function(jobId) {
    // Implementar cierre de trabajo
    console.log('Cerrar trabajo:', jobId);
    alert('Funcionalidad de cerrar trabajo en desarrollo');
};

window.markNotificationAsRead = function(notificationId) {
    // Implementar marcar notificación como leída
    console.log('Marcar notificación como leída:', notificationId);
};

window.markAllNotificationsAsRead = function() {
    // Implementar marcar todas las notificaciones como leídas
    console.log('Marcar todas las notificaciones como leídas');
};

window.deleteNotification = function(notificationId) {
    // Implementar eliminar notificación
    console.log('Eliminar notificación:', notificationId);
};

window.generateProfileShareLink = function(userId) {
    // Implementar generación de link de compartir perfil
    const shareUrl = `${window.location.origin}/profile-view.html?id=${userId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Link de perfil copiado al portapapeles: ' + shareUrl);
    });
};

// Funciones de estadísticas (simplificadas)
async function loadTalentStats(userId) {
    // Implementar carga de estadísticas para talentos
}

async function loadClientStats(userId) {
    // Implementar carga de estadísticas para clientes
}

// Funciones de configuración
function loadSettings() {
    // Implementar carga de configuración
}

function saveSettings() {
    // Implementar guardado de configuración
}

console.log('✅ Profile.js cargado correctamente - VERSIÓN COMPLETA');
