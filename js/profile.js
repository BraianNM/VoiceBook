// profile.js - Gestión completa del perfil de usuario

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    auth.onAuthStateChanged(user => {
        if (user) {
            window.currentUser = user;
            loadUserProfile(user.uid);
            loadUserNotifications(user.uid); // Cargar notificaciones
        } else {
            window.location.href = 'index.html';
        }
    });

    // Configurar event listeners para el perfil
    setupProfileEventListeners();
});

function setupProfileEventListeners() {
    // Botones de navegación del perfil
    document.getElementById('editProfileBtn')?.addEventListener('click', () => toggleProfileSection('editProfileSection'));
    document.getElementById('viewProfileBtn')?.addEventListener('click', () => toggleProfileSection('viewProfileSection'));
    document.getElementById('myJobsBtn')?.addEventListener('click', () => toggleProfileSection('myJobsSection'));
    document.getElementById('myApplicationsBtn')?.addEventListener('click', () => toggleProfileSection('myApplicationsSection'));
    document.getElementById('notificationsBtn')?.addEventListener('click', () => toggleProfileSection('notificationsSection'));
    
    // Botón para subir demo
    document.getElementById('uploadDemoBtn')?.addEventListener('click', () => document.getElementById('demoUploadModal').style.display = 'flex');
    document.getElementById('closeDemoModal')?.addEventListener('click', () => document.getElementById('demoUploadModal').style.display = 'none');
    
    // Formulario de subida de demo
    document.getElementById('demoUploadForm')?.addEventListener('submit', uploadDemo);
    
    // Botón para crear trabajo (clientes)
    document.getElementById('createJobBtn')?.addEventListener('click', () => document.getElementById('createJobModal').style.display = 'flex');
    document.getElementById('closeJobModal')?.addEventListener('click', () => document.getElementById('createJobModal').style.display = 'none');
    
    // Formulario de creación de trabajo
    document.getElementById('createJobForm')?.addEventListener('submit', createJob);
}

// Cargar perfil del usuario
async function loadUserProfile(userId) {
    try {
        // Intentar cargar como talento
        let talentDoc = await db.collection('talents').doc(userId).get();
        if (talentDoc.exists) {
            window.currentUserData = { type: 'talent', ...talentDoc.data(), id: talentDoc.id };
            displayTalentProfile(talentDoc.data());
            return;
        }

        // Intentar cargar como cliente
        let clientDoc = await db.collection('clients').doc(userId).get();
        if (clientDoc.exists) {
            window.currentUserData = { type: 'client', ...clientDoc.data(), id: clientDoc.id };
            displayClientProfile(clientDoc.data());
            return;
        }

        console.error('No se encontró perfil para el usuario:', userId);
        window.showMessage('profileMessage', '❌ Error: Perfil no encontrado.', 'error');

    } catch (error) {
        console.error('Error cargando perfil:', error);
        window.showMessage('profileMessage', '❌ Error al cargar el perfil.', 'error');
    }
}
window.loadUserProfile = loadUserProfile;

// Mostrar perfil de talento
function displayTalentProfile(talent) {
    // Actualizar información básica
    document.getElementById('profileUserName').textContent = talent.name || 'Talento';
    document.getElementById('viewProfileUserName').textContent = talent.name || 'Talento';
    
    // NUEVO: Mostrar imagen de perfil
    const profilePicture = talent.profilePictureUrl || 'img/default-avatar.png';
    document.getElementById('profileUserPicture').src = profilePicture;
    document.getElementById('viewProfileUserPicture').src = profilePicture;
    
    // Información de ubicación
    const countryName = typeof getCountryName !== 'undefined' ? getCountryName(talent.country) : talent.country;
    const stateName = typeof getStateName !== 'undefined' ? getStateName(talent.country, talent.state) : talent.state;
    const locationInfo = (countryName && stateName && talent.city) ? `${talent.city}, ${stateName}, ${countryName}` : 'Ubicación no especificada';
    
    // Mostrar información en la vista
    document.getElementById('viewProfileContent').innerHTML = `
        <div class="profile-info-grid">
            <div class="info-item"><label>Nombre:</label><span>${talent.name || 'No especificado'}</span></div>
            <div class="info-item"><label>Email:</label><span>${talent.email || 'No especificado'}</span></div>
            <div class="info-item"><label>Teléfono:</label><span>${talent.phone || 'No especificado'}</span></div>
            <div class="info-item"><label>Ubicación:</label><span>${locationInfo}</span></div>
            <div class="info-item"><label>Género:</label><span>${talent.gender || 'No especificado'}</span></div>
            <div class="info-item"><label>Edad:</label><span>${talent.realAge || talent.ageRange || 'No especificado'}</span></div>
            <div class="info-item"><label>Nacionalidad:</label><span>${talent.nationality || 'No especificado'}</span></div>
            <div class="info-item"><label>Idiomas:</label><span>${talent.languages ? talent.languages.join(', ') : 'No especificado'}</span></div>
            <div class="info-item"><label>Home Studio:</label><span>${talent.homeStudio === 'si' ? 'Sí' : 'No'}</span></div>
        </div>
        <div class="profile-bio-section">
            <h3>Biografía</h3>
            <p>${talent.bio || 'No hay biografía disponible.'}</p>
        </div>
        <div class="profile-demos-section">
            <h3>Mis Demos</h3>
            <div id="userDemosList" class="demos-list">
                ${talent.demos && talent.demos.length > 0 ? 
                    talent.demos.map(demo => `
                        <div class="demo-item">
                            <span class="demo-name">${demo.name}</span>
                            <audio controls src="${demo.url}"></audio>
                            <button class="btn btn-danger btn-sm" onclick="deleteDemo('${demo.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join('') : 
                    '<p>No hay demos subidos.</p>'
                }
            </div>
        </div>
    `;

    // Preparar formulario de edición
    setupTalentEditForm(talent);
    
    // Mostrar sección de vista por defecto
    toggleProfileSection('viewProfileSection');
}

// Mostrar perfil de cliente
function displayClientProfile(client) {
    // Actualizar información básica
    document.getElementById('profileUserName').textContent = client.name || 'Cliente';
    document.getElementById('viewProfileUserName').textContent = client.name || 'Cliente';
    
    // NUEVO: Mostrar imagen de perfil
    const profilePicture = client.profilePictureUrl || 'img/default-avatar-client.png';
    document.getElementById('profileUserPicture').src = profilePicture;
    document.getElementById('viewProfileUserPicture').src = profilePicture;
    
    // Información de ubicación
    const countryName = typeof getCountryName !== 'undefined' ? getCountryName(client.country) : client.country;
    const stateName = typeof getStateName !== 'undefined' ? getStateName(client.country, client.state) : client.state;
    const locationInfo = (countryName && stateName && client.city) ? `${client.city}, ${stateName}, ${countryName}` : 'Ubicación no especificada';
    
    // Mostrar información en la vista
    document.getElementById('viewProfileContent').innerHTML = `
        <div class="profile-info-grid">
            <div class="info-item"><label>Nombre:</label><span>${client.name || 'No especificado'}</span></div>
            <div class="info-item"><label>Email:</label><span>${client.email || 'No especificado'}</span></div>
            <div class="info-item"><label>Teléfono:</label><span>${client.phone || 'No especificado'}</span></div>
            <div class="info-item"><label>Ubicación:</label><span>${locationInfo}</span></div>
            <div class="info-item"><label>Tipo de Cliente:</label><span>${client.clientType === 'empresa' ? 'Empresa' : 'Particular'}</span></div>
            ${client.clientType === 'empresa' && client.companyName ? 
                `<div class="info-item"><label>Nombre de Empresa:</label><span>${client.companyName}</span></div>` : ''
            }
        </div>
    `;

    // Preparar formulario de edición
    setupClientEditForm(client);
    
    // Mostrar sección de vista por defecto
    toggleProfileSection('viewProfileSection');
    
    // Cargar trabajos del cliente
    loadClientJobs();
}

// Configurar formulario de edición para talento
function setupTalentEditForm(talent) {
    // Información básica
    document.getElementById('editProfileUserType').value = 'talent';
    document.getElementById('editTalentName').value = talent.name || '';
    document.getElementById('editTalentEmail').value = talent.email || '';
    document.getElementById('editTalentPhone').value = talent.phone || '';
    document.getElementById('editTalentGender').value = talent.gender || '';
    document.getElementById('editTalentRealAge').value = talent.realAge || '';
    document.getElementById('editTalentAgeRange').value = talent.ageRange || '';
    document.getElementById('editTalentNationality').value = talent.nationality || '';
    document.getElementById('editTalentBio').value = talent.bio || '';
    
    // NUEVO: Cargar ubicación en el formulario de edición
    if (typeof loadLocationData !== 'undefined') {
        loadLocationData('editCountrySelectTalent', 'editStateSelectTalent', 'editCitySelectTalent', 
                        talent.country, talent.state, talent.city);
    }
    
    // Home Studio
    if (talent.homeStudio === 'si') {
        document.getElementById('editHasHomeStudio').checked = true;
    }
    
    // Idiomas
    if (talent.languages) {
        talent.languages.forEach(lang => {
            // Buscar checkbox correspondiente
            for (let i = 1; i <= 10; i++) {
                const checkbox = document.getElementById('editLang' + i);
                if (checkbox && checkbox.value === lang) {
                    checkbox.checked = true;
                    break;
                }
            }
            // Manejar "otros"
            if (lang !== 'español' && lang !== 'inglés' && lang !== 'portugués' && 
                lang !== 'francés' && lang !== 'alemán' && lang !== 'italiano' && 
                lang !== 'catalán' && lang !== 'euskera' && lang !== 'gallego') {
                document.getElementById('editLang10').checked = true;
                document.getElementById('editOtherLanguages').value = lang;
                document.getElementById('editOtherLanguagesGroup').style.display = 'block';
            }
        });
    }
    
    // Event listener para "otros" idiomas en edición
    document.getElementById('editLang10')?.addEventListener('change', function() {
        document.getElementById('editOtherLanguagesGroup').style.display = this.checked ? 'block' : 'none';
    });
}

// Configurar formulario de edición para cliente
function setupClientEditForm(client) {
    document.getElementById('editProfileUserType').value = 'client';
    document.getElementById('editClientName').value = client.name || '';
    document.getElementById('editClientEmail').value = client.email || '';
    document.getElementById('editClientPhone').value = client.phone || '';
    document.getElementById('editClientType').value = client.clientType || 'particular';
    
    // NUEVO: Cargar ubicación en el formulario de edición
    if (typeof loadLocationData !== 'undefined') {
        loadLocationData('editCountrySelectClient', 'editStateSelectClient', 'editCitySelectClient', 
                        client.country, client.state, client.city);
    }
    
    // Mostrar/ocultar campo de empresa
    toggleCompanyNameEdit();
    if (client.clientType === 'empresa' && client.companyName) {
        document.getElementById('editCompanyName').value = client.companyName;
    }
    
    // Event listener para tipo de cliente en edición
    document.getElementById('editClientType')?.addEventListener('change', toggleCompanyNameEdit);
}

// Función auxiliar para mostrar/ocultar campo de empresa en edición
function toggleCompanyNameEdit() {
    const editCompanyNameGroup = document.getElementById('editCompanyNameGroup');
    if (editCompanyNameGroup) {
        editCompanyNameGroup.style.display = document.getElementById('editClientType').value === 'empresa' ? 'block' : 'none';
    }
}

// Actualizar perfil de talento (NUEVA función global)
window.updateTalentProfile = async function(e) {
    e.preventDefault();
    const messageDiv = 'editProfileMessage';
    window.showMessage(messageDiv, '⌛ Actualizando perfil...', 'info');

    const userId = window.currentUser.uid;
    
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
    
    // NUEVO: Obtener ubicación
    const country = document.getElementById('editCountrySelectTalent').value;
    const state = document.getElementById('editStateSelectTalent').value;
    const city = document.getElementById('editCitySelectTalent').value;
    
    // NUEVO: Manejar imagen de perfil
    const profilePictureFile = document.getElementById('editTalentProfilePicture').files[0];
    let profilePictureUrl = window.currentUserData.profilePictureUrl;

    // Obtener idiomas
    const languages = [];
    for (let i = 1; i <= 10; i++) {
        const checkbox = document.getElementById('editLang' + i);
        if (checkbox && checkbox.checked) {
            languages.push(checkbox.value === 'otros' ? document.getElementById('editOtherLanguages').value : checkbox.value);
        }
    }

    try {
        // Subir nueva imagen de perfil si se seleccionó
        if (profilePictureFile) {
            window.showMessage(messageDiv, '🖼️ Actualizando foto de perfil...', 'info');
            const uploadResult = await window.uploadToCloudinary(profilePictureFile);
            profilePictureUrl = uploadResult.url;
        }

        // Actualizar en Firestore
        await db.collection('talents').doc(userId).update({
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
            // NUEVO: Actualizar ubicación
            country: country,
            state: state,
            city: city,
            // NUEVO: Actualizar imagen de perfil
            profilePictureUrl: profilePictureUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Actualizar datos locales
        window.currentUserData = {
            ...window.currentUserData,
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
            profilePictureUrl: profilePictureUrl
        };

        window.showMessage(messageDiv, '✅ Perfil actualizado correctamente.', 'success');
        
        // Recargar la vista del perfil
        setTimeout(() => {
            displayTalentProfile(window.currentUserData);
            toggleProfileSection('viewProfileSection');
        }, 1500);

    } catch (error) {
        console.error('Error actualizando perfil de talento:', error);
        window.showMessage(messageDiv, '❌ Error al actualizar el perfil: ' + error.message, 'error');
    }
};

// Actualizar perfil de cliente (NUEVA función global)
window.updateClientProfile = async function(e) {
    e.preventDefault();
    const messageDiv = 'editProfileMessage';
    window.showMessage(messageDiv, '⌛ Actualizando perfil...', 'info');

    const userId = window.currentUser.uid;
    
    // Obtener datos del formulario
    const name = document.getElementById('editClientName').value;
    const email = document.getElementById('editClientEmail').value;
    const phone = document.getElementById('editClientPhone').value;
    const clientType = document.getElementById('editClientType').value;
    const companyName = clientType === 'empresa' ? document.getElementById('editCompanyName').value : '';
    
    // NUEVO: Obtener ubicación
    const country = document.getElementById('editCountrySelectClient').value;
    const state = document.getElementById('editStateSelectClient').value;
    const city = document.getElementById('editCitySelectClient').value;
    
    // NUEVO: Manejar imagen de perfil
    const profilePictureFile = document.getElementById('editClientProfilePicture').files[0];
    let profilePictureUrl = window.currentUserData.profilePictureUrl;

    try {
        // Subir nueva imagen de perfil si se seleccionó
        if (profilePictureFile) {
            window.showMessage(messageDiv, '🖼️ Actualizando foto de perfil...', 'info');
            const uploadResult = await window.uploadToCloudinary(profilePictureFile);
            profilePictureUrl = uploadResult.url;
        }

        // Actualizar en Firestore
        await db.collection('clients').doc(userId).update({
            name: name,
            email: email,
            phone: phone,
            clientType: clientType,
            companyName: companyName,
            // NUEVO: Actualizar ubicación
            country: country,
            state: state,
            city: city,
            // NUEVO: Actualizar imagen de perfil
            profilePictureUrl: profilePictureUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Actualizar datos locales
        window.currentUserData = {
            ...window.currentUserData,
            name: name,
            email: email,
            phone: phone,
            clientType: clientType,
            companyName: companyName,
            country: country,
            state: state,
            city: city,
            profilePictureUrl: profilePictureUrl
        };

        window.showMessage(messageDiv, '✅ Perfil actualizado correctamente.', 'success');
        
        // Recargar la vista del perfil
        setTimeout(() => {
            displayClientProfile(window.currentUserData);
            toggleProfileSection('viewProfileSection');
        }, 1500);

    } catch (error) {
        console.error('Error actualizando perfil de cliente:', error);
        window.showMessage(messageDiv, '❌ Error al actualizar el perfil: ' + error.message, 'error');
    }
};

// Subir demo (función existente mejorada)
async function uploadDemo(e) {
    e.preventDefault();
    const messageDiv = 'demoUploadMessage';
    window.showMessage(messageDiv, '⌛ Subiendo demo...', 'info');

    const demoFile = document.getElementById('demoFile').files[0];
    const demoName = document.getElementById('demoName').value || demoFile?.name || 'Demo sin nombre';

    if (!demoFile) {
        window.showMessage(messageDiv, '❌ Por favor, selecciona un archivo de audio.', 'error');
        return;
    }

    try {
        // Subir a Cloudinary
        const uploadResult = await window.uploadToCloudinary(demoFile);
        
        // Crear objeto demo
        const demo = {
            id: Date.now().toString(), // ID simple
            name: demoName,
            url: uploadResult.url,
            duration: uploadResult.duration || 0,
            uploadedAt: new Date().toISOString()
        };

        // Guardar en Firestore
        await db.collection('talents').doc(window.currentUser.uid).update({
            demos: firebase.firestore.FieldValue.arrayUnion(demo)
        });

        // Actualizar datos locales
        if (!window.currentUserData.demos) {
            window.currentUserData.demos = [];
        }
        window.currentUserData.demos.push(demo);

        window.showMessage(messageDiv, '✅ Demo subida correctamente.', 'success');
        
        // Limpiar formulario y cerrar modal
        document.getElementById('demoUploadForm').reset();
        document.getElementById('demoUploadModal').style.display = 'none';
        
        // Actualizar lista de demos
        updateDemosList();

    } catch (error) {
        console.error('Error subiendo demo:', error);
        window.showMessage(messageDiv, '❌ Error al subir la demo: ' + error.message, 'error');
    }
}

// Actualizar lista de demos
function updateDemosList() {
    const demosList = document.getElementById('userDemosList');
    if (!demosList || !window.currentUserData.demos) return;

    demosList.innerHTML = window.currentUserData.demos.map(demo => `
        <div class="demo-item">
            <span class="demo-name">${demo.name}</span>
            <audio controls src="${demo.url}"></audio>
            <button class="btn btn-danger btn-sm" onclick="deleteDemo('${demo.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// Eliminar demo
