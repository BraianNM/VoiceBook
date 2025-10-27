// Gestión de perfiles de usuario - VOICEBOOK (CORREGIDO)

// Cargar perfil del usuario actual
window.loadUserProfile = async function() {
    console.log('=== INICIANDO CARGA DE PERFIL ===');
    console.log('Usuario actual:', currentUser ? currentUser.uid : 'No autenticado');
    
    const profileContent = document.getElementById('userProfileContent');
    if (!profileContent) {
        console.error('No se encontró el contenedor del perfil');
        return;
    }

    if (!currentUser) {
        profileContent.innerHTML = `
            <div class="alert alert-danger text-center">
                <h4><i class="fas fa-exclamation-triangle"></i> No autenticado</h4>
                <p>Debes iniciar sesión para ver tu perfil.</p>
                <button class="btn btn-primary mt-3" onclick="window.location.href='index.html'">
                    <i class="fas fa-home"></i> Ir a Inicio
                </button>
            </div>
        `;
        return;
    }

    try {
        profileContent.innerHTML = '<div class="loading">Cargando perfil...</div>';

        console.log('Buscando datos del usuario en Firestore...');
        
        let userData = null;
        let userType = null;

        // Buscar en ambas colecciones
        const talentDoc = await db.collection('talents').doc(currentUser.uid).get();
        if (talentDoc.exists) {
            userData = talentDoc.data();
            userType = 'talent';
            console.log('✅ Usuario encontrado como talento:', userData.name);
        } else {
            const clientDoc = await db.collection('clients').doc(currentUser.uid).get();
            if (clientDoc.exists) {
                userData = clientDoc.data();
                userType = 'client';
                console.log('✅ Usuario encontrado como cliente:', userData.name);
            } else {
                throw new Error('Perfil no encontrado en la base de datos');
            }
        }

        // Actualizar currentUserData global
        currentUserData = userData;
        currentUserData.type = userType;

        console.log('Renderizando perfil...');
        
        // Renderizar el perfil según el tipo de usuario
        if (userType === 'talent') {
            profileContent.innerHTML = renderTalentProfile(userData);
            setupTalentEventListeners();
        } else {
            profileContent.innerHTML = renderClientProfile(userData);
            setupClientEventListeners();
        }

        console.log('✅ Perfil cargado exitosamente');

    } catch (error) {
        console.error('❌ Error cargando perfil:', error);
        profileContent.innerHTML = `
            <div class="alert alert-danger text-center">
                <h4><i class="fas fa-exclamation-circle"></i> Error al cargar el perfil</h4>
                <p>${error.message}</p>
                <div class="mt-3">
                    <button class="btn btn-primary" onclick="window.loadUserProfile()">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                    <button class="btn btn-outline" onclick="window.location.href='index.html'">
                        <i class="fas fa-home"></i> Ir a Inicio
                    </button>
                </div>
            </div>
        `;
    }
};

// Renderizar perfil de talento
function renderTalentProfile(talent) {
    console.log('Renderizando perfil de talento:', talent.name);
    
    const countryName = window.getCountryName ? window.getCountryName(talent.country) : talent.country;
    const stateName = window.getStateName ? window.getStateName(talent.country, talent.state) : talent.state;
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
    console.log('Renderizando perfil de cliente:', client.name);
    
    const countryName = window.getCountryName ? window.getCountryName(client.country) : client.country;
    const stateName = window.getStateName ? window.getStateName(client.country, client.state) : client.state;
    const profilePicture = client.profilePictureUrl || 'https://via.placeholder.com/150/6c757d/ffffff?text=CL';
    const companyInfo = client.clientType === 'empresa' ? 
        `<div class="info-item">
            <label>Empresa:</label>
            <span>${client.companyName || 'No especificado'}</span>
        </div>` : '';
    
    const locationInfo = [client.city, stateName, countryName].filter(Boolean).join(', ') || 'Ubicación no especificada';

    return `
        <div class="profile-header">
            <div class="profile-picture-section">
                <img src="${profilePicture}" alt="${client.name}" class="profile-picture-large" onerror="this.src='https://via.placeholder.com/150/6c757d/ffffff?text=CL'">
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

            <div class="profile-section">
                <h3><i class="fas fa-briefcase"></i> Mis Ofertas de Trabajo</h3>
                <div id="clientJobsContainer">
                    <div class="loading">Cargando ofertas de trabajo...</div>
                </div>
            </div>

            <div class="profile-section">
                <h3><i class="fas fa-heart"></i> Talentos Favoritos</h3>
                <div id="favoritesContainer">
                    <div class="loading">Cargando favoritos...</div>
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
    // Cargar datos del cliente después de renderizar
    setTimeout(() => {
        loadClientJobs();
        loadFavorites();
    }, 100);
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
        
        <div class="form-group">
            <label for="editBio">Biografía:</label>
            <textarea id="editBio" name="bio" class="form-control" rows="4" 
                      placeholder="Describe tu experiencia, estilo vocal, etc.">${currentUserData.bio || ''}</textarea>
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

// Cargar trabajos del cliente
async function loadClientJobs() {
    try {
        const container = document.getElementById('clientJobsContainer');
        if (!container) return;

        console.log('Cargando trabajos del cliente...');

        const snapshot = await db.collection('jobs')
            .where('clientId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();

        if (snapshot.empty) {
            container.innerHTML = `
                <div class="alert alert-info text-center">
                    <i class="fas fa-briefcase fa-3x text-muted mb-3"></i>
                    <p>No has publicado ninguna oferta de trabajo.</p>
                    <button class="btn btn-primary mt-2" onclick="createJobPost()">
                        <i class="fas fa-plus"></i> Publicar tu primera oferta
                    </button>
                </div>
            `;
            return;
        }

        let jobsHtml = '<div class="jobs-list">';
        snapshot.forEach(doc => {
            const job = doc.data();
            jobsHtml += `
                <div class="job-card" style="margin-bottom: 15px;">
                    <div class="job-header">
                        <h4>${job.title}</h4>
                        <span class="badge ${job.status === 'active' ? 'badge-success' : 'badge-secondary'}">
                            ${job.status === 'active' ? 'Activa' : 'Cerrada'}
                        </span>
                    </div>
                    <p><strong>Descripción:</strong> ${job.description ? (job.description.substring(0, 100) + '...') : 'Sin descripción'}</p>
                    <p><strong>Presupuesto:</strong> ${job.budget ? `$${job.budget}` : 'A convenir'}</p>
                    <div class="card-actions">
                        <button class="btn btn-outline btn-sm" onclick="viewJobApplications('${doc.id}')">
                            <i class="fas fa-users"></i> Ver postulaciones
                        </button>
                    </div>
                </div>
            `;
        });
        jobsHtml += '</div>';

        container.innerHTML = jobsHtml;

    } catch (error) {
        console.error('Error cargando trabajos del cliente:', error);
        const container = document.getElementById('clientJobsContainer');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    Error al cargar las ofertas de trabajo: ${error.message}
                </div>
            `;
        }
    }
}

// Cargar favoritos del cliente - CORREGIDO
async function loadFavorites() {
    try {
        const container = document.getElementById('favoritesContainer');
        if (!container) {
            console.error('Contenedor de favoritos no encontrado');
            return;
        }

        console.log('Cargando favoritos del cliente...');

        // Obtener el documento del cliente actual
        const clientDoc = await db.collection('clients').doc(currentUser.uid).get();
        if (!clientDoc.exists) {
            container.innerHTML = '<div class="alert alert-warning">No se encontraron datos del cliente.</div>';
            return;
        }

        const clientData = clientDoc.data();
        const favorites = clientData.favorites || [];

        console.log('Favoritos encontrados:', favorites);

        if (favorites.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info text-center">
                    <i class="fas fa-heart fa-3x text-muted mb-3"></i>
                    <p>No tienes talentos favoritos todavía.</p>
                    <button class="btn btn-primary mt-2" onclick="window.location.href='index.html'">
                        <i class="fas fa-search"></i> Explorar talentos
                    </button>
                </div>
            `;
            return;
        }

        let favoritesHtml = '<div class="favorites-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">';
        
        // Cargar información de cada talento favorito
        for (const talentId of favorites) {
            try {
                const talentDoc = await db.collection('talents').doc(talentId).get();
                if (talentDoc.exists) {
                    const talent = talentDoc.data();
                    const profilePicture = talent.profilePictureUrl || 'https://via.placeholder.com/150/007bff/ffffff?text=VO';
                    const languages = talent.languages ? talent.languages.slice(0, 2).join(', ') : 'No especificado';
                    
                    favoritesHtml += `
                        <div class="talent-card" style="text-align: center; padding: 15px;">
                            <img src="${profilePicture}" alt="${talent.name}" class="talent-profile-pic" 
                                 onerror="this.src='https://via.placeholder.com/150/007bff/ffffff?text=VO'">
                            <h4>${talent.name || 'Talento Anónimo'}</h4>
                            <p><strong>Idiomas:</strong> ${languages}</p>
                            <p><strong>Home Studio:</strong> ${talent.homeStudio === 'si' ? 'Sí' : 'No'}</p>
                            <div class="card-actions">
                                <button class="btn btn-primary btn-sm" onclick="viewTalentProfile('${talentId}')">
                                    <i class="fas fa-eye"></i> Ver Perfil
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="removeFromFavorites('${talentId}')">
                                    <i class="fas fa-trash"></i> Quitar
                                </button>
                            </div>
                        </div>
                    `;
                }
            } catch (error) {
                console.error(`Error cargando talento favorito ${talentId}:`, error);
            }
        }
        favoritesHtml += '</div>';

        container.innerHTML = favoritesHtml;

    } catch (error) {
        console.error('Error cargando favoritos:', error);
        const container = document.getElementById('favoritesContainer');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    Error al cargar los favoritos: ${error.message}
                </div>
            `;
        }
    }
}

// Remover de favoritos
async function removeFromFavorites(talentId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este talento de tus favoritos?')) {
        return;
    }

    try {
        await db.collection('clients').doc(currentUser.uid).update({
            favorites: firebase.firestore.FieldValue.arrayRemove(talentId)
        });

        alert('Talento eliminado de favoritos');
        loadFavorites(); // Recargar la lista

    } catch (error) {
        console.error('Error eliminando de favoritos:', error);
        alert('Error al eliminar de favoritos: ' + error.message);
    }
}

// Ver perfil de talento
function viewTalentProfile(talentId) {
    window.viewTalentProfile(talentId);
}

// Cerrar modal de edición
function closeEditModal() {
    const talentModal = document.getElementById('editTalentModal');
    const clientModal = document.getElementById('editClientModal');
    
    if (talentModal) talentModal.style.display = 'none';
    if (clientModal) clientModal.style.display = 'none';
}

// Funciones placeholder para futuras implementaciones
function editClientProfile() {
    alert('Funcionalidad de edición de perfil de cliente en desarrollo');
}

function updateClientProfile(e) {
    e.preventDefault();
    alert('Funcionalidad de actualización de perfil de cliente en desarrollo');
}

function loadUserApplications() {
    alert('Funcionalidad de postulaciones en desarrollo');
}

function createJobPost() {
    alert('Funcionalidad de publicación de trabajos en desarrollo');
}

function viewJobApplications(jobId) {
    alert(`Funcionalidad de ver postulaciones para el trabajo ${jobId} en desarrollo`);
}

// Funciones para demos (placeholder)
function showUploadDemoModal() {
    alert('Funcionalidad de subida de demos en desarrollo');
}

function closeUploadDemoModal() {
    // Placeholder
}

function uploadDemo(e) {
    e.preventDefault();
    alert('Funcionalidad de upload de demo en desarrollo');
}

function deleteDemo(demoId) {
    if (confirm('¿Estás seguro de que quieres eliminar este demo?')) {
        alert(`Demo ${demoId} eliminado (funcionalidad en desarrollo)`);
    }
}

// Cambiar foto de perfil
async function changeProfilePicture() {
    alert('Funcionalidad de cambio de foto de perfil en desarrollo');
}

// Inicialización del perfil
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== PROFILE.JS INICIALIZADO ===');
    
    // Verificar autenticación y cargar perfil
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            console.log('Usuario autenticado, cargando perfil...');
            
            // Pequeño delay para asegurar que el DOM esté listo
            setTimeout(() => {
                if (window.location.pathname.includes('profile.html')) {
                    window.loadUserProfile();
                }
            }, 500);
        } else {
            console.log('Usuario no autenticado, redirigiendo...');
            if (window.location.pathname.includes('profile.html')) {
                window.location.href = 'index.html';
            }
        }
    });
});

console.log('✅ Profile.js cargado correctamente - VoiceBook Profile System');
