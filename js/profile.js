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
            // Mostrar u ocultar pestañas específicas (Mis Ofertas/Postulaciones)
            if (userProfile.type === 'client') {
                document.getElementById('jobsTab').style.display = 'block';
                document.getElementById('applicationsTab').style.display = 'none';
            } else { // Talent
                document.getElementById('jobsTab').style.display = 'none';
                document.getElementById('applicationsTab').style.display = 'block';
            }
        } else {
            document.getElementById('userProfileContent').innerHTML = '<p class="error">No se encontró información de perfil.</p>';
        }
        
    } catch (error) {
        console.error('Error cargando perfil:', error);
        document.getElementById('userProfileContent').innerHTML = '<p class="error">Error al cargar perfil. Intenta de nuevo más tarde.</p>';
    }
}

// Mostrar perfil en el dashboard
function displayUserProfile(profile) {
    const profileContent = document.getElementById('userProfileContent');
    
    // Información de ubicación (si está disponible)
    const locationInfo = profile.country && profile.state && profile.city ? 
        `<div class="info-item">
            <label>Ubicación:</label>
            <span>${getCityName(profile.country, profile.state, profile.city)}, ${getStateName(profile.country, profile.state)}, ${getCountryName(profile.country)}</span>
        </div>` : '';
    
    if (profile.type === 'talent') {
        // Crear HTML para demos
        let demosHTML = '';
        if (profile.demos && profile.demos.length > 0) {
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
                <button class="btn btn-primary" id="editProfileBtn">
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
                    ${locationInfo}
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
                <button class="btn btn-primary" id="editProfileBtn">
                    <i class="fas fa-edit"></i> Editar Perfil
                </button>
            </div>
            
            <div class="profile-info">
                <div class="info-grid">
                    <div class="info-item">
                        <label>Nombre/Representante:</label>
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
                
                <div class="description-section">
                    <p>¡Bienvenido! Como cliente, puedes publicar ofertas de trabajo en la pestaña "Mis Ofertas".</p>
                </div>
            </div>
        `;
    }
    
    // CORRECCIÓN: Agregar Event Listener al botón "Editar Perfil"
    const editBtn = document.getElementById('editProfileBtn');
    if (editBtn) {
        editBtn.addEventListener('click', () => openEditProfileModal(profile));
    }
}

// CORRECCIÓN: Implementación de la función para abrir el modal de edición
window.openEditProfileModal = function(profile) {
    const editModal = document.getElementById('editProfileModal');
    const profileContent = document.getElementById('userProfileContent');
    const editProfileForm = document.getElementById('editProfileForm');
    
    if (!editModal || !profileContent || !editProfileForm) {
        console.error('Elementos de modal de edición no encontrados.');
        return;
    }
    
    // Ocultar el contenido actual del perfil y mostrar el modal
    profileContent.style.display = 'none';
    editModal.style.display = 'flex';
    
    const isTalent = profile.type === 'talent';
    
    // Configurar el handler de envío del formulario
    editProfileForm.setAttribute('onsubmit', isTalent ? 'updateTalentProfile(event)' : 'updateClientProfile(event)');

    // Poblar campos comunes
    document.getElementById('editName').value = profile.name || '';
    document.getElementById('editPhone').value = profile.phone || '';

    // Mostrar/Ocultar campos específicos
    const talentFields = document.getElementById('editTalentFields');
    const clientFields = document.getElementById('editClientFields');

    talentFields.style.display = isTalent ? 'block' : 'none';
    clientFields.style.display = !isTalent ? 'block' : 'none';

    if (isTalent) {
        document.getElementById('editDescription').value = profile.description || '';
        // NOTA: Aquí se añadiría la lógica compleja para rellenar idiomas, demos, etc.
    } else {
        const companyNameInput = document.getElementById('editCompanyName');
        if (companyNameInput) companyNameInput.value = profile.companyName || '';
    }
};

// Eliminar demo de audio
window.deleteDemo = async function(publicId, userId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este demo?')) {
        return;
    }
    
    try {
        const currentDoc = await db.collection('talents').doc(userId).get();
        const currentDemos = currentDoc.data().demos || [];
        const updatedDemos = currentDemos.filter(demo => demo.publicId !== publicId);
        
        await db.collection('talents').doc(userId).update({
            demos: updatedDemos
        });
        
        loadUserProfile(userId);
        
    } catch (error) {
        console.error('Error eliminando demo:', error);
        alert('Error eliminando el demo');
    }
};

// Cerrar modal de edición
window.closeEditProfileModal = function() {
    // Ocultar modal de edición
    document.getElementById('editProfileModal').style.display = 'none';
    // Mostrar contenido del perfil
    document.getElementById('userProfileContent').style.display = 'block';
};

// Función auxiliar para mostrar mensajes
function showMessage(element, message, type) {
    if (element) {
        element.innerHTML = `<div class=\"${type}\">${message}</div>`;
    }
}
