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
window.deleteDemo = async function(demoId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta demo?')) return;

    try {
        const talentRef = db.collection('talents').doc(window.currentUser.uid);
        const talentDoc = await talentRef.get();
        const demos = talentDoc.data().demos || [];
        
        // Filtrar la demo a eliminar
        const updatedDemos = demos.filter(demo => demo.id !== demoId);
        
        // Actualizar en Firestore
        await talentRef.update({ demos: updatedDemos });
        
        // Actualizar datos locales
        window.currentUserData.demos = updatedDemos;
        
        // Actualizar UI
        updateDemosList();
        
        window.showMessage('profileMessage', '✅ Demo eliminada correctamente.', 'success');
        
    } catch (error) {
        console.error('Error eliminando demo:', error);
        window.showMessage('profileMessage', '❌ Error al eliminar la demo.', 'error');
    }
};

// Crear trabajo (para clientes)
async function createJob(e) {
    e.preventDefault();
    const messageDiv = 'createJobMessage';
    window.showMessage(messageDiv, '⌛ Creando oferta de trabajo...', 'info');

    if (window.currentUserData.type !== 'client') {
        window.showMessage(messageDiv, '❌ Solo los clientes pueden crear ofertas de trabajo.', 'error');
        return;
    }

    const title = document.getElementById('jobTitle').value;
    const description = document.getElementById('jobDescription').value;
    const gender = document.getElementById('jobGender').value;
    const ageRange = document.getElementById('jobAgeRange').value;
    const budget = document.getElementById('jobBudget').value;
    const deadline = document.getElementById('jobDeadline').value;
    
    // NUEVO: Obtener ubicación del trabajo
    const country = document.getElementById('jobCountrySelect').value;
    const state = document.getElementById('jobStateSelect').value;
    const city = document.getElementById('jobCitySelect').value;

    // Obtener idiomas requeridos
    const languages = [];
    for (let i = 1; i <= 10; i++) {
        const checkbox = document.getElementById('jobLang' + i);
        if (checkbox && checkbox.checked) {
            languages.push(checkbox.value === 'otros' ? document.getElementById('jobOtherLanguages').value : checkbox.value);
        }
    }

    try {
        await db.collection('jobs').add({
            title: title,
            description: description,
            gender: gender,
            ageRange: ageRange,
            budget: budget,
            deadline: deadline,
            languages: languages,
            // NUEVO: Guardar ubicación del trabajo
            country: country,
            state: state,
            city: city,
            clientId: window.currentUser.uid,
            clientName: window.currentUserData.name,
            clientEmail: window.currentUserData.email,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            applications: 0
        });

        window.showMessage(messageDiv, '✅ Oferta de trabajo creada correctamente.', 'success');
        
        // Limpiar formulario y cerrar modal
        document.getElementById('createJobForm').reset();
        document.getElementById('createJobModal').style.display = 'none';
        
        // Recargar trabajos del cliente
        loadClientJobs();

    } catch (error) {
        console.error('Error creando trabajo:', error);
        window.showMessage(messageDiv, '❌ Error al crear la oferta: ' + error.message, 'error');
    }
}

// Cargar trabajos del cliente
async function loadClientJobs() {
    if (window.currentUserData.type !== 'client') return;

    try {
        const snapshot = await db.collection('jobs')
            .where('clientId', '==', window.currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();

        const jobsContainer = document.getElementById('clientJobsList');
        if (!jobsContainer) return;

        if (snapshot.empty) {
            jobsContainer.innerHTML = '<p>No has creado ninguna oferta de trabajo aún.</p>';
            return;
        }

        let jobsHtml = '';
        snapshot.docs.forEach(doc => {
            const job = doc.data();
            const jobId = doc.id;
            const countryName = typeof getCountryName !== 'undefined' ? getCountryName(job.country) : job.country;
            const stateName = typeof getStateName !== 'undefined' ? getStateName(job.country, job.state) : job.state;
            const locationInfo = (countryName && stateName && job.city) ? `${job.city}, ${stateName}, ${countryName}` : 'N/A';
            const languages = job.languages ? job.languages.join(', ') : 'N/A';
            const budget = job.budget ? `$${job.budget}` : 'A convenir';
            const deadline = job.deadline ? new Date(job.deadline).toLocaleDateString() : 'No especificada';

            jobsHtml += `
                <div class="job-card">
                    <div class="job-card-header">
                        <h3>${job.title}</h3>
                        <span class="job-status ${job.status}">${job.status === 'active' ? 'Activa' : 'Inactiva'}</span>
                    </div>
                    <p><strong>Ubicación:</strong> ${locationInfo}</p>
                    <p><strong>Idiomas:</strong> ${languages}</p>
                    <p><strong>Presupuesto:</strong> ${budget}</p>
                    <p><strong>Fecha límite:</strong> ${deadline}</p>
                    <p><strong>Descripción:</strong> ${job.description.substring(0, 100)}...</p>
                    <div class="card-actions">
                        <button class="btn btn-primary btn-sm" onclick="viewJobApplications('${jobId}')">
                            <i class="fas fa-users"></i> Ver postulaciones
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="editJob('${jobId}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteJob('${jobId}')">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
        });

        jobsContainer.innerHTML = jobsHtml;

    } catch (error) {
        console.error('Error cargando trabajos del cliente:', error);
        document.getElementById('clientJobsList').innerHTML = '<p class="text-danger">Error al cargar los trabajos.</p>';
    }
}

// Cargar postulaciones del talento
async function loadTalentApplications() {
    if (window.currentUserData.type !== 'talent') return;

    try {
        const applicationsSnapshot = await db.collection('jobApplications')
            .where('talentId', '==', window.currentUser.uid)
            .orderBy('appliedAt', 'desc')
            .get();

        const applicationsContainer = document.getElementById('talentApplicationsList');
        if (!applicationsContainer) return;

        if (applicationsSnapshot.empty) {
            applicationsContainer.innerHTML = '<p>No te has postulado a ninguna oferta aún.</p>';
            return;
        }

        let applicationsHtml = '';
        
        for (const doc of applicationsSnapshot.docs) {
            const application = doc.data();
            const jobDoc = await db.collection('jobs').doc(application.jobId).get();
            
            if (jobDoc.exists) {
                const job = jobDoc.data();
                const countryName = typeof getCountryName !== 'undefined' ? getCountryName(job.country) : job.country;
                const stateName = typeof getStateName !== 'undefined' ? getStateName(job.country, job.state) : job.state;
                const locationInfo = (countryName && stateName && job.city) ? `${job.city}, ${stateName}, ${countryName}` : 'N/A';
                const budget = job.budget ? `$${job.budget}` : 'A convenir';
                const appliedDate = application.appliedAt ? new Date(application.appliedAt.toDate()).toLocaleDateString() : 'Fecha no disponible';

                applicationsHtml += `
                    <div class="application-card">
                        <div class="application-header">
                            <h4>${job.title}</h4>
                            <span class="application-status ${application.status}">${application.status}</span>
                        </div>
                        <p><strong>Cliente:</strong> ${job.clientName}</p>
                        <p><strong>Ubicación:</strong> ${locationInfo}</p>
                        <p><strong>Presupuesto:</strong> ${budget}</p>
                        <p><strong>Fecha de postulación:</strong> ${appliedDate}</p>
                        <div class="application-actions">
                            <button class="btn btn-secondary btn-sm" onclick="window.viewJobDetails('${application.jobId}')">
                                <i class="fas fa-eye"></i> Ver oferta
                            </button>
                        </div>
                    </div>
                `;
            }
        }

        applicationsContainer.innerHTML = applicationsHtml;

    } catch (error) {
        console.error('Error cargando postulaciones:', error);
        document.getElementById('talentApplicationsList').innerHTML = '<p class="text-danger">Error al cargar las postulaciones.</p>';
    }
}

// Cargar notificaciones (NUEVA función)
async function loadUserNotifications(userId) {
    try {
        let query;
        if (window.currentUserData.type === 'client') {
            query = db.collection('notifications')
                .where('clientId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(50);
        } else {
            // Para talentos podrías agregar notificaciones también
            return;
        }

        const snapshot = await query.get();
        const notificationsContainer = document.getElementById('notificationsList');
        if (!notificationsContainer) return;

        if (snapshot.empty) {
            notificationsContainer.innerHTML = '<p>No tienes notificaciones.</p>';
            return;
        }

        let notificationsHtml = '';
        snapshot.docs.forEach(doc => {
            const notification = doc.data();
            const notificationDate = notification.createdAt ? 
                new Date(notification.createdAt.toDate()).toLocaleDateString() : 'Fecha no disponible';

            notificationsHtml += `
                <div class="notification-item ${notification.read ? 'read' : 'unread'}">
                    <div class="notification-header">
                        <img src="${notification.talentProfilePicture || 'img/default-avatar.png'}" 
                             alt="${notification.talentName}" class="notification-avatar">
                        <div class="notification-info">
                            <h4>${notification.talentName}</h4>
                            <span class="notification-date">${notificationDate}</span>
                        </div>
                    </div>
                    <p class="notification-message">${notification.message}</p>
                    <div class="notification-actions">
                        <button class="btn btn-primary btn-sm" onclick="viewTalentProfileFromNotification('${notification.talentId}')">
                            <i class="fas fa-user"></i> Ver perfil
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="viewJobFromNotification('${notification.jobId}')">
                            <i class="fas fa-briefcase"></i> Ver oferta
                        </button>
                        ${!notification.read ? `
                            <button class="btn btn-outline btn-sm" onclick="markNotificationAsRead('${doc.id}')">
                                <i class="fas fa-check"></i> Marcar como leída
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        notificationsContainer.innerHTML = notificationsHtml;

    } catch (error) {
        console.error('Error cargando notificaciones:', error);
        const notificationsContainer = document.getElementById('notificationsList');
        if (notificationsContainer) {
            notificationsContainer.innerHTML = '<p class="text-danger">Error al cargar las notificaciones.</p>';
        }
    }
}
window.loadUserNotifications = loadUserNotifications;

// Función para ver perfil del talento desde notificación (NUEVA)
window.viewTalentProfileFromNotification = function(talentId) {
    // Usar la función global viewTalentProfile
    if (typeof window.viewTalentProfile === 'function') {
        window.viewTalentProfile(talentId);
    }
};

// Función para ver oferta desde notificación (NUEVA)
window.viewJobFromNotification = function(jobId) {
    // Usar la función global viewJobDetails
    if (typeof window.viewJobDetails === 'function') {
        window.viewJobDetails(jobId);
    }
};

// Función para marcar notificación como leída (NUEVA)
window.markNotificationAsRead = async function(notificationId) {
    try {
        await db.collection('notifications').doc(notificationId).update({
            read: true
        });
        
        // Recargar notificaciones
        loadUserNotifications(window.currentUser.uid);
        
    } catch (error) {
        console.error('Error marcando notificación como leída:', error);
        window.showMessage('notificationsMessage', '❌ Error al marcar la notificación como leída.', 'error');
    }
};

// Función para ver postulaciones a un trabajo (NUEVA)
window.viewJobApplications = async function(jobId) {
    const applicationsModal = document.getElementById('jobApplicationsModal');
    const applicationsContent = document.getElementById('jobApplicationsContent');
    
    window.closeAllModals();
    applicationsModal.style.display = 'flex';
    applicationsContent.innerHTML = '<div class="loading">Cargando postulaciones...</div>';

    try {
        const applicationsSnapshot = await db.collection('jobApplications')
            .where('jobId', '==', jobId)
            .orderBy('appliedAt', 'desc')
            .get();

        const jobDoc = await db.collection('jobs').doc(jobId).get();
        const job = jobDoc.data();

        if (applicationsSnapshot.empty) {
            applicationsContent.innerHTML = `
                <div class="applications-header">
                    <h2>Postulaciones para: ${job.title}</h2>
                    <p>No hay postulaciones para esta oferta.</p>
                </div>
            `;
            return;
        }

        let applicationsHtml = `
            <div class="applications-header">
                <h2>Postulaciones para: ${job.title}</h2>
                <p>Total: ${applicationsSnapshot.size} postulaciones</p>
            </div>
            <div class="applications-list">
        `;

        applicationsSnapshot.docs.forEach(doc => {
            const application = doc.data();
            const appliedDate = application.appliedAt ? 
                new Date(application.appliedAt.toDate()).toLocaleDateString() : 'Fecha no disponible';

            applicationsHtml += `
                <div class="application-item">
                    <div class="application-item-header">
                        <img src="${application.talentProfilePicture}" 
                             alt="${application.talentName}" 
                             class="application-avatar">
                        <div class="application-item-info">
                            <h4>${application.talentName}</h4>
                            <p class="application-email">${application.talentEmail}</p>
                            <p class="application-date">Postuló el: ${appliedDate}</p>
                            <span class="application-status ${application.status}">${application.status}</span>
                        </div>
                    </div>
                    <div class="application-item-actions">
                        <button class="btn btn-primary btn-sm" onclick="window.viewTalentProfile('${application.talentId}')">
                            <i class="fas fa-user"></i> Ver perfil completo
                        </button>
                        <button class="btn btn-success btn-sm" onclick="updateApplicationStatus('${doc.id}', 'accepted')">
                            <i class="fas fa-check"></i> Aceptar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="updateApplicationStatus('${doc.id}', 'rejected')">
                            <i class="fas fa-times"></i> Rechazar
                        </button>
                    </div>
                </div>
            `;
        });

        applicationsHtml += '</div>';
        applicationsContent.innerHTML = applicationsHtml;

    } catch (error) {
        console.error('Error cargando postulaciones:', error);
        applicationsContent.innerHTML = '<p class="text-danger">Error al cargar las postulaciones.</p>';
    }
};

// Función para actualizar estado de postulación (NUEVA)
window.updateApplicationStatus = async function(applicationId, newStatus) {
    try {
        await db.collection('jobApplications').doc(applicationId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Recargar las postulaciones
        const applicationDoc = await db.collection('jobApplications').doc(applicationId).get();
        const application = applicationDoc.data();
        window.viewJobApplications(application.jobId);

        window.showMessage('applicationsMessage', `✅ Postulación ${newStatus === 'accepted' ? 'aceptada' : 'rechazada'} correctamente.`, 'success');

    } catch (error) {
        console.error('Error actualizando estado de postulación:', error);
        window.showMessage('applicationsMessage', '❌ Error al actualizar el estado de la postulación.', 'error');
    }
};

// Cambiar entre secciones del perfil
function toggleProfileSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.profile-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Mostrar la sección seleccionada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Cargar datos específicos de la sección
    if (sectionId === 'myJobsSection' && window.currentUserData.type === 'client') {
        loadClientJobs();
    } else if (sectionId === 'myApplicationsSection' && window.currentUserData.type === 'talent') {
        loadTalentApplications();
    } else if (sectionId === 'notificationsSection' && window.currentUserData.type === 'client') {
        loadUserNotifications(window.currentUser.uid);
    }
    
    // Actualizar botones activos
    document.querySelectorAll('.profile-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="toggleProfileSection('${sectionId}')"]`)?.classList.add('active');
}

// Función para editar trabajo (placeholder)
window.editJob = function(jobId) {
    alert('Funcionalidad de edición de trabajo en desarrollo...');
};

// Función para eliminar trabajo (placeholder)
window.deleteJob = function(jobId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta oferta de trabajo?')) {
        alert('Funcionalidad de eliminación de trabajo en desarrollo...');
    }
};
