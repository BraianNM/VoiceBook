// profile.js - Gestión completa del perfil de usuario (CORREGIDO)

// Cargar perfil del usuario (FUNCIÓN CORREGIDA)
async function loadUserProfile(userId) {
    console.log('Cargando perfil para usuario:', userId);
    
    try {
        const profileContent = document.getElementById('viewProfileContent');
        const profileMessage = document.getElementById('profileMessage');
        
        if (!currentUserData) {
            console.log('No hay datos de usuario, cargando...');
            await loadUserData(userId);
        }

        if (!currentUserData) {
            if (profileContent) {
                profileContent.innerHTML = '<p class="text-danger">Error: No se pudieron cargar los datos del perfil.</p>';
            }
            return;
        }

        console.log('Datos del usuario cargados:', currentUserData);

        // Actualizar información del header del perfil
        updateProfileHeader(currentUserData);
        
        // Mostrar secciones según el tipo de usuario
        showUserSpecificSections(currentUserData.type);
        
        // Mostrar el perfil
        displayUserProfile(currentUserData);

    } catch (error) {
        console.error('Error cargando perfil:', error);
        const profileContent = document.getElementById('viewProfileContent');
        if (profileContent) {
            profileContent.innerHTML = '<p class="text-danger">Error al cargar el perfil. Por favor, recarga la página.</p>';
        }
    }
}
window.loadUserProfile = loadUserProfile;

// Actualizar header del perfil (FUNCIÓN NUEVA)
function updateProfileHeader(userData) {
    const profileUserName = document.getElementById('profileUserName');
    const profileUserType = document.getElementById('profileUserType');
    const profileUserPicture = document.getElementById('profileUserPicture');
    const headerUserPicture = document.getElementById('headerUserPicture');

    if (profileUserName) {
        profileUserName.textContent = userData.name || 'Usuario';
    }
    
    if (profileUserType) {
        profileUserType.textContent = userData.type === 'talent' ? 'Talento de Voz' : 'Cliente';
    }
    
    if (profileUserPicture) {
        profileUserPicture.src = userData.profilePictureUrl || 
            (userData.type === 'talent' ? 'img/default-avatar.png' : 'img/default-avatar-client.png');
    }
    
    if (headerUserPicture) {
        headerUserPicture.src = userData.profilePictureUrl || 
            (userData.type === 'talent' ? 'img/default-avatar.png' : 'img/default-avatar-client.png');
    }
}

// Mostrar secciones específicas del usuario (FUNCIÓN NUEVA)
function showUserSpecificSections(userType) {
    const talentSections = document.querySelectorAll('.talent-only');
    const clientSections = document.querySelectorAll('.client-only');
    
    if (userType === 'talent') {
        talentSections.forEach(section => {
            section.style.display = 'flex';
        });
        clientSections.forEach(section => {
            section.style.display = 'none';
        });
    } else if (userType === 'client') {
        talentSections.forEach(section => {
            section.style.display = 'none';
        });
        clientSections.forEach(section => {
            section.style.display = 'flex';
        });
    }
}

// Mostrar perfil de talento (FUNCIÓN CORREGIDA)
function displayTalentProfile(talent) {
    const profileContent = document.getElementById('viewProfileContent');
    if (!profileContent) return;

    const countryName = typeof getCountryName !== 'undefined' ? getCountryName(talent.country) : talent.country;
    const stateName = typeof getStateName !== 'undefined' ? getStateName(talent.country, talent.state) : talent.state;
    const locationInfo = (countryName && stateName && talent.city) ? 
        `${talent.city}, ${stateName}, ${countryName}` : 'Ubicación no especificada';
    
    const languages = talent.languages ? talent.languages.join(', ') : 'No especificado';
    const homeStudio = talent.homeStudio === 'si' ? 'Sí' : 'No';

    let demosHtml = '';
    if (talent.demos && talent.demos.length > 0) {
        demosHtml = talent.demos.map(demo => `
            <div class="demo-item">
                <span class="demo-name">${demo.name || 'Demo'}</span>
                <audio controls src="${demo.url}"></audio>
                <button class="btn btn-danger btn-sm" onclick="deleteDemo('${demo.id}')">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `).join('');
    } else {
        demosHtml = '<p>No hay demos subidos.</p>';
    }

    profileContent.innerHTML = `
        <div class="profile-info-grid">
            <div class="info-item">
                <label>Nombre:</label>
                <span>${talent.name || 'No especificado'}</span>
            </div>
            <div class="info-item">
                <label>Email:</label>
                <span>${talent.email || 'No especificado'}</span>
            </div>
            <div class="info-item">
                <label>Teléfono:</label>
                <span>${talent.phone || 'No especificado'}</span>
            </div>
            <div class="info-item">
                <label>Ubicación:</label>
                <span>${locationInfo}</span>
            </div>
            <div class="info-item">
                <label>Género:</label>
                <span>${talent.gender || 'No especificado'}</span>
            </div>
            <div class="info-item">
                <label>Edad Real:</label>
                <span>${talent.realAge || 'No especificado'}</span>
            </div>
            <div class="info-item">
                <label>Rango de Edad:</label>
                <span>${talent.ageRange || 'No especificado'}</span>
            </div>
            <div class="info-item">
                <label>Nacionalidad:</label>
                <span>${talent.nationality || 'No especificado'}</span>
            </div>
            <div class="info-item">
                <label>Idiomas:</label>
                <span>${languages}</span>
            </div>
            <div class="info-item">
                <label>Home Studio:</label>
                <span>${homeStudio}</span>
            </div>
        </div>
        
        <div class="profile-bio-section">
            <h3>Biografía</h3>
            <p class="profile-bio">${talent.bio || 'No hay biografía disponible.'}</p>
        </div>
        
        <div class="profile-demos-section">
            <h3>Mis Demos</h3>
            <div class="demos-list">
                ${demosHtml}
            </div>
            <button class="btn btn-primary" onclick="showUploadDemoModal()" style="margin-top: 15px;">
                <i class="fas fa-upload"></i> Subir Nuevo Demo
            </button>
        </div>
    `;

    // Preparar formulario de edición
    setupTalentEditForm(talent);
}

// Mostrar perfil de cliente (FUNCIÓN CORREGIDA)
function displayClientProfile(client) {
    const profileContent = document.getElementById('viewProfileContent');
    if (!profileContent) return;

    const countryName = typeof getCountryName !== 'undefined' ? getCountryName(client.country) : client.country;
    const stateName = typeof getStateName !== 'undefined' ? getStateName(client.country, client.state) : client.state;
    const locationInfo = (countryName && stateName && client.city) ? 
        `${client.city}, ${stateName}, ${countryName}` : 'Ubicación no especificada';
    
    const clientType = client.clientType === 'empresa' ? 'Empresa / Agencia' : 'Particular';

    let companyInfo = '';
    if (client.clientType === 'empresa' && client.companyName) {
        companyInfo = `
            <div class="info-item">
                <label>Nombre de Empresa:</label>
                <span>${client.companyName}</span>
            </div>
        `;
    }

    profileContent.innerHTML = `
        <div class="profile-info-grid">
            <div class="info-item">
                <label>Nombre:</label>
                <span>${client.name || 'No especificado'}</span>
            </div>
            <div class="info-item">
                <label>Email:</label>
                <span>${client.email || 'No especificado'}</span>
            </div>
            <div class="info-item">
                <label>Teléfono:</label>
                <span>${client.phone || 'No especificado'}</span>
            </div>
            <div class="info-item">
                <label>Ubicación:</label>
                <span>${locationInfo}</span>
            </div>
            <div class="info-item">
                <label>Tipo de Cliente:</label>
                <span>${clientType}</span>
            </div>
            ${companyInfo}
        </div>
        
        <div class="profile-actions" style="margin-top: 30px;">
            <button class="btn btn-primary" onclick="toggleProfileSection('jobsSection')">
                <i class="fas fa-briefcase"></i> Ver Mis Ofertas de Trabajo
            </button>
        </div>
    `;

    // Preparar formulario de edición
    setupClientEditForm(client);
}

// Función principal para mostrar perfil (FUNCIÓN NUEVA)
function displayUserProfile(userData) {
    console.log('Mostrando perfil para:', userData);
    
    if (userData.type === 'talent') {
        displayTalentProfile(userData);
    } else if (userData.type === 'client') {
        displayClientProfile(userData);
    }
}
window.displayUserProfile = displayUserProfile;

// Configurar formulario de edición para talento (FUNCIÓN CORREGIDA)
function setupTalentEditForm(talent) {
    console.log('Configurando formulario de edición para talento:', talent);
    
    // Mostrar formulario de talento
    document.getElementById('editTalentForm').style.display = 'block';
    document.getElementById('editClientForm').style.display = 'none';
    
    // Establecer tipo de usuario
    document.getElementById('editProfileUserType').value = 'talent';
    
    // Información básica
    document.getElementById('editTalentName').value = talent.name || '';
    document.getElementById('editTalentEmail').value = talent.email || '';
    document.getElementById('editTalentPhone').value = talent.phone || '';
    document.getElementById('editTalentGender').value = talent.gender || '';
    document.getElementById('editTalentRealAge').value = talent.realAge || '';
    document.getElementById('editTalentAgeRange').value = talent.ageRange || '';
    document.getElementById('editTalentNationality').value = talent.nationality || '';
    document.getElementById('editTalentBio').value = talent.bio || '';
    
    // Home Studio
    document.getElementById('editHasHomeStudio').checked = talent.homeStudio === 'si';
    
    // Idiomas
    if (talent.languages) {
        talent.languages.forEach(lang => {
            for (let i = 1; i <= 10; i++) {
                const checkbox = document.getElementById('editLang' + i);
                if (checkbox && checkbox.value === lang) {
                    checkbox.checked = true;
                    break;
                }
            }
            // Manejar "otros"
            const commonLanguages = ['Español (Latam)', 'Español (España)', 'Inglés', 'Portugués', 'Francés', 'Alemán', 'Italiano', 'Japonés', 'Chino'];
            if (!commonLanguages.includes(lang)) {
                document.getElementById('editLang10').checked = true;
                document.getElementById('editOtherLanguages').value = lang;
                document.getElementById('editOtherLanguages').style.display = 'block';
            }
        });
    }
    
    // Ubicación - Cargar después de un breve delay para asegurar que los selects estén listos
    setTimeout(() => {
        if (typeof loadLocationData !== 'undefined' && talent.country) {
            loadLocationData('editCountrySelectTalent', 'editStateSelectTalent', 'editCitySelectTalent', 
                            talent.country, talent.state, talent.city);
        }
    }, 100);
}

// Configurar formulario de edición para cliente (FUNCIÓN CORREGIDA)
function setupClientEditForm(client) {
    console.log('Configurando formulario de edición para cliente:', client);
    
    // Mostrar formulario de cliente
    document.getElementById('editTalentForm').style.display = 'none';
    document.getElementById('editClientForm').style.display = 'block';
    
    // Establecer tipo de usuario
    document.getElementById('editProfileUserType').value = 'client';
    
    // Información básica
    document.getElementById('editClientName').value = client.name || '';
    document.getElementById('editClientEmail').value = client.email || '';
    document.getElementById('editClientPhone').value = client.phone || '';
    document.getElementById('editClientType').value = client.clientType || 'particular';
    
    // Empresa
    if (client.clientType === 'empresa' && client.companyName) {
        document.getElementById('editCompanyName').value = client.companyName;
        document.getElementById('editCompanyNameGroup').style.display = 'block';
    }
    
    // Ubicación - Cargar después de un breve delay
    setTimeout(() => {
        if (typeof loadLocationData !== 'undefined' && client.country) {
            loadLocationData('editCountrySelectClient', 'editStateSelectClient', 'editCitySelectClient', 
                            client.country, client.state, client.city);
        }
    }, 100);
}

// Actualizar perfil de talento (FUNCIÓN CORREGIDA)
window.updateTalentProfile = async function(e) {
    e.preventDefault();
    const messageDiv = 'editProfileMessage';
    window.showMessage(messageDiv, '⌛ Actualizando perfil...', 'info');

    const userId = currentUser.uid;
    
    try {
        // Obtener datos del formulario
        const name = document.getElementById('editTalentName').value;
        const email = document.getElementById('editTalentEmail').value;
        const phone = document.getElementById('editTalentPhone').value;
        const gender = document.getElementById('editTalentGender').value;
        const realAge = document.getElementById('editTalentRealAge').value;
        const ageRange = document.getElementById('editTalentAgeRange').value;
        const nationality = document.getElementById('editTalentNationality').value;
        const bio = document.getElementById('editTalentBio').value;
        const homeStudio = document.getElementById('editHasHomeStudio').checked ? 'si' : 'no';
        
        // Ubicación
        const country = document.getElementById('editCountrySelectTalent').value;
        const state = document.getElementById('editStateSelectTalent').value;
        const city = document.getElementById('editCitySelectTalent').value;
        
        // Imagen de perfil
        const profilePictureFile = document.getElementById('editTalentProfilePicture').files[0];
        let profilePictureUrl = currentUserData.profilePictureUrl;

        // Obtener idiomas
        const languages = [];
        for (let i = 1; i <= 10; i++) {
            const checkbox = document.getElementById('editLang' + i);
            if (checkbox && checkbox.checked) {
                languages.push(checkbox.value === 'otros' ? document.getElementById('editOtherLanguages').value : checkbox.value);
            }
        }

        // Subir nueva imagen de perfil si se seleccionó
        if (profilePictureFile) {
            window.showMessage(messageDiv, '🖼️ Actualizando foto de perfil...', 'info');
            try {
                const uploadResult = await window.uploadToCloudinary(profilePictureFile);
                profilePictureUrl = uploadResult.url;
            } catch (uploadError) {
                console.error('Error subiendo imagen:', uploadError);
                window.showMessage(messageDiv, '⚠️ No se pudo actualizar la imagen.', 'warning');
            }
        }

        // Datos a actualizar
        const updateData = {
            name: name,
            email: email,
            phone: phone,
            gender: gender,
            realAge: realAge,
            ageRange: ageRange,
            nationality: nationality,
            bio: bio,
            homeStudio: homeStudio,
            languages: languages,
            country: country,
            state: state,
            city: city,
            profilePictureUrl: profilePictureUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Actualizar en Firestore
        await db.collection('talents').doc(userId).update(updateData);

        // Actualizar datos locales
        currentUserData = { ...currentUserData, ...updateData };

        window.showMessage(messageDiv, '✅ Perfil actualizado correctamente.', 'success');
        
        // Recargar la vista del perfil
        setTimeout(() => {
            displayTalentProfile(currentUserData);
            updateProfileHeader(currentUserData);
            toggleProfileSection('viewProfileSection');
        }, 1500);

    } catch (error) {
        console.error('Error actualizando perfil de talento:', error);
        window.showMessage(messageDiv, '❌ Error al actualizar el perfil: ' + error.message, 'error');
    }
};

// Actualizar perfil de cliente (FUNCIÓN CORREGIDA)
window.updateClientProfile = async function(e) {
    e.preventDefault();
    const messageDiv = 'editProfileMessage';
    window.showMessage(messageDiv, '⌛ Actualizando perfil...', 'info');

    const userId = currentUser.uid;
    
    try {
        // Obtener datos del formulario
        const name = document.getElementById('editClientName').value;
        const email = document.getElementById('editClientEmail').value;
        const phone = document.getElementById('editClientPhone').value;
        const clientType = document.getElementById('editClientType').value;
        const companyName = clientType === 'empresa' ? document.getElementById('editCompanyName').value : '';
        
        // Ubicación
        const country = document.getElementById('editCountrySelectClient').value;
        const state = document.getElementById('editStateSelectClient').value;
        const city = document.getElementById('editCitySelectClient').value;
        
        // Imagen de perfil
        const profilePictureFile = document.getElementById('editClientProfilePicture').files[0];
        let profilePictureUrl = currentUserData.profilePictureUrl;

        // Subir nueva imagen de perfil si se seleccionó
        if (profilePictureFile) {
            window.showMessage(messageDiv, '🖼️ Actualizando foto de perfil...', 'info');
            try {
                const uploadResult = await window.uploadToCloudinary(profilePictureFile);
                profilePictureUrl = uploadResult.url;
            } catch (uploadError) {
                console.error('Error subiendo imagen:', uploadError);
                window.showMessage(messageDiv, '⚠️ No se pudo actualizar la imagen.', 'warning');
            }
        }

        // Datos a actualizar
        const updateData = {
            name: name,
            email: email,
            phone: phone,
            clientType: clientType,
            companyName: companyName,
            country: country,
            state: state,
            city: city,
            profilePictureUrl: profilePictureUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Actualizar en Firestore
        await db.collection('clients').doc(userId).update(updateData);

        // Actualizar datos locales
        currentUserData = { ...currentUserData, ...updateData };

        window.showMessage(messageDiv, '✅ Perfil actualizado correctamente.', 'success');
        
        // Recargar la vista del perfil
        setTimeout(() => {
            displayClientProfile(currentUserData);
            updateProfileHeader(currentUserData);
            toggleProfileSection('viewProfileSection');
        }, 1500);

    } catch (error) {
        console.error('Error actualizando perfil de cliente:', error);
        window.showMessage(messageDiv, '❌ Error al actualizar el perfil: ' + error.message, 'error');
    }
};

// Función para cambiar entre secciones (FUNCIÓN CORREGIDA)
function toggleProfileSection(sectionId) {
    console.log('Cambiando a sección:', sectionId);
    
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
    const activeButton = document.querySelector(`[onclick="toggleProfileSection('${sectionId}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Cargar datos específicos de la sección
    if (sectionId === 'applicationsSection') {
        loadTalentApplications();
    } else if (sectionId === 'jobsSection') {
        loadClientJobs();
    } else if (sectionId === 'notificationsSection') {
        loadUserNotifications();
    }
}
window.toggleProfileSection = toggleProfileSection;

// Funciones placeholder para otras secciones (PARA COMPLETAR MÁS TARDE)
function loadTalentApplications() {
    const applicationsList = document.getElementById('applicationsList');
    if (applicationsList) {
        applicationsList.innerHTML = '<p>Funcionalidad en desarrollo. Aquí se mostrarán tus postulaciones.</p>';
    }
}

function loadClientJobs() {
    const jobsList = document.getElementById('jobsList');
    if (jobsList) {
        jobsList.innerHTML = '<p>Funcionalidad en desarrollo. Aquí se mostrarán tus ofertas de trabajo.</p>';
    }
}

function loadUserNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    if (notificationsList) {
        notificationsList.innerHTML = '<p>Funcionalidad en desarrollo. Aquí se mostrarán tus notificaciones.</p>';
    }
}

function showUploadDemoModal() {
    alert('Funcionalidad de subida de demos en desarrollo.');
}

function deleteDemo(demoId) {
    if (confirm('¿Estás seguro de que quieres eliminar este demo?')) {
        alert('Funcionalidad de eliminación de demos en desarrollo.');
    }
}

// Inicialización del perfil cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile.js cargado');
    
    // Verificar autenticación
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('Usuario autenticado:', user.uid);
            currentUser = user;
            // El perfil se cargará cuando checkAuthState se ejecute
        } else {
            console.log('Usuario no autenticado, redirigiendo...');
            window.location.href = 'index.html';
        }
    });

    // Configurar event listeners para el formulario de edición
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const userType = document.getElementById('editProfileUserType').value;
            if (userType === 'talent') {
                window.updateTalentProfile(e);
            } else {
                window.updateClientProfile(e);
            }
        });
    }

    // Configurar toggle para otros idiomas
    const editLang10 = document.getElementById('editLang10');
    const editOtherLanguages = document.getElementById('editOtherLanguages');
    if (editLang10 && editOtherLanguages) {
        editLang10.addEventListener('change', function() {
            editOtherLanguages.style.display = this.checked ? 'block' : 'none';
        });
    }

    // Configurar toggle para tipo de cliente
    const editClientType = document.getElementById('editClientType');
    const editCompanyNameGroup = document.getElementById('editCompanyNameGroup');
    if (editClientType && editCompanyNameGroup) {
        editClientType.addEventListener('change', function() {
            editCompanyNameGroup.style.display = this.value === 'empresa' ? 'block' : 'none';
        });
    }

    console.log('Profile.js inicializado correctamente');
});
