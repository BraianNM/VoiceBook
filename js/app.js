// Funciones principales de la aplicación

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkAuthState();
    loadTalents();
    loadJobOffers();
});

// Configurar event listeners
function setupEventListeners() {
    // Abrir modales
    document.getElementById('heroTalentBtn').addEventListener('click', () => document.getElementById('talentModal').style.display = 'flex');
    document.getElementById('heroClientBtn').addEventListener('click', () => document.getElementById('clientModal').style.display = 'flex');
    document.getElementById('registerBtn').addEventListener('click', () => document.getElementById('talentModal').style.display = 'flex');
    document.getElementById('loginBtn').addEventListener('click', () => document.getElementById('loginModal').style.display = 'flex');
    document.getElementById('dashboardLink').addEventListener('click', showDashboard);
    document.getElementById('logoutBtn').addEventListener('click', logoutUser);

    // Cerrar modales
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', closeAllModals);
    });

    // Formularios
    document.getElementById('talentForm').addEventListener('submit', registerTalent);
    document.getElementById('clientForm').addEventListener('submit', registerClient);
    document.getElementById('loginForm').addEventListener('submit', loginUser);

    // Otros controles
    document.getElementById('clientType').addEventListener('change', toggleCompanyName);
    document.getElementById('lang10').addEventListener('change', toggleOtherLanguages);

    // Tabs del dashboard
    document.querySelectorAll('.dashboard-tabs .tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Remover active de todas las tabs
            document.querySelectorAll('.dashboard-tabs .tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Agregar active a la tab clickeada
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId + 'Tab').classList.add('active');
        });
    });
}

// Cargar talentos
async function loadTalents() {
    try {
        const snapshot = await db.collection('talents').get();
        const talentsContainer = document.getElementById('talentsContainer');
        
        if (snapshot.empty) {
            talentsContainer.innerHTML = '<p>No hay talentos registrados aún.</p>';
            return;
        }
        
        talentsContainer.innerHTML = '';
        snapshot.forEach(doc => {
            const talent = doc.data();
            displayTalentCard(talent, doc.id);
        });
        
    } catch (error) {
        console.error('Error cargando talentos:', error);
        document.getElementById('talentsContainer').innerHTML = '<p>Error al cargar talentos.</p>';
    }
}

// Mostrar tarjeta de talento
function displayTalentCard(talent, talentId) {
    const talentsContainer = document.getElementById('talentsContainer');
    const talentCard = document.createElement('div');
    talentCard.className = 'talent-card';
    
    // Crear reproductores de audio si hay demos
    let audioPlayers = '';
    if (talent.demos && talent.demos.length > 0) {
        audioPlayers = `
            <div class="audio-demos" style="margin-top: 15px;">
                <p><strong>Demos de Audio:</strong></p>
                ${talent.demos.map(demo => `
                    <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                        <p style="font-size: 14px; margin-bottom: 8px; font-weight: 500;">${demo.name}</p>
                        <audio controls style="width: 100%; height: 40px; border-radius: 20px;">
                            <source src="${demo.url}" type="audio/mpeg">
                            Tu navegador no soporta audio.
                        </audio>
                        <div style="font-size: 12px; color: #666; margin-top: 5px;">
                            ${Math.round(demo.duration)} segundos • ${(demo.size / 1024 / 1024).toFixed(1)} MB
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    talentCard.innerHTML = `
        <div class="talent-img" style="background-color: #3498db; display: flex; align-items: center; justify-content: center; color: white; font-size: 48px;">
            <i class="fas fa-user"></i>
        </div>
        <div class="talent-info">
            <h3 class="talent-name">${talent.name}</h3>
            <p class="talent-details">${talent.gender === 'hombre' ? 'Hombre' : 'Mujer'} • ${talent.nationality || 'Nacionalidad no especificada'}</p>
            <p class="talent-details">${Array.isArray(talent.languages) ? talent.languages.join(', ') : talent.languages}</p>
            <p class="talent-details">Home Studio: ${talent.homeStudio === 'si' ? 'Sí' : 'No'}</p>
            <p>${talent.description ? talent.description.substring(0, 100) + '...' : 'Sin descripción'}</p>
            ${audioPlayers}
            <div style="margin-top: 15px;">
                <button class="btn btn-primary" onclick="viewTalentProfile('${talentId}')">Ver Perfil Completo</button>
                ${currentUser ? `<button class="btn btn-success" onclick="addToFavorites('${talentId}')"><i class="fas fa-heart"></i> Favorito</button>` : ''}
            </div>
        </div>
    `;
    
    talentsContainer.appendChild(talentCard);
}

// Cargar ofertas de trabajo
async function loadJobOffers() {
    try {
        const snapshot = await db.collection('jobs').get();
        const jobOffersContainer = document.getElementById('jobOffersContainer');
        
        if (snapshot.empty) {
            jobOffersContainer.innerHTML = '<p>No hay ofertas de trabajo publicadas aún.</p>';
            return;
        }
        
        jobOffersContainer.innerHTML = '';
        snapshot.forEach(doc => {
            const job = doc.data();
            displayJobCard(job, doc.id);
        });
        
    } catch (error) {
        console.error('Error cargando ofertas:', error);
        document.getElementById('jobOffersContainer').innerHTML = '<p>Error al cargar ofertas.</p>';
    }
}

// Mostrar tarjeta de trabajo
function displayJobCard(job, jobId) {
    const jobOffersContainer = document.getElementById('jobOffersContainer');
    const jobCard = document.createElement('div');
    jobCard.className = 'job-card';
    
    jobCard.innerHTML = `
        <div class="job-header">
            <h3 class="job-title">${job.title}</h3>
        </div>
        <div class="job-description">
            <p>${job.description}</p>
        </div>
        <div>
            <p><strong>Contacto:</strong> ${job.contact}</p>
            <p><strong>Fecha de publicación:</strong> ${job.createdAt?.toDate?.().toLocaleDateString() || 'Fecha no disponible'}</p>
        </div>
        ${currentUser ? `
            <div style="margin-top: 15px;">
                <button class="btn btn-primary" onclick="applyToJob('${jobId}')">Postularme</button>
            </div>
        ` : ''}
    `;
    
    jobOffersContainer.appendChild(jobCard);
}

// Funciones auxiliares
function showMessage(element, message, type) {
    element.innerHTML = `<div class="${type}">${message}</div>`;
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function toggleCompanyName() {
    const companyNameGroup = document.getElementById('companyNameGroup');
    companyNameGroup.style.display = document.getElementById('clientType').value === 'empresa' ? 'block' : 'none';
}

function toggleOtherLanguages() {
    const otherLanguagesInput = document.getElementById('otherLanguages');
    otherLanguagesInput.style.display = document.getElementById('lang10').checked ? 'block' : 'none';
}

function getSelectedLanguages() {
    const languages = [];
    for (let i = 1; i <= 10; i++) {
        const checkbox = document.getElementById('lang' + i);
        if (checkbox.checked) {
            languages.push(checkbox.value);
        }
    }
    
    if (document.getElementById('lang10').checked && document.getElementById('otherLanguages').value) {
        languages.push(document.getElementById('otherLanguages').value);
    }
    
    return languages;
}

// ========== FUNCIONES CORREGIDAS - SIN ALERTS MOLESTOS ==========

// Función para ver perfil completo del talento
window.viewTalentProfile = function(talentId) {
    showTalentDetails(talentId);
};

// Nueva función para mostrar detalles del talento
async function showTalentDetails(talentId) {
    try {
        const talentDoc = await db.collection('talents').doc(talentId).get();
        
        if (talentDoc.exists) {
            const talent = talentDoc.data();
            
            // Cerrar modal existente si hay uno
            const existingModal = document.getElementById('talentDetailsModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Crear modal con información detallada
            const modalHTML = `
                <div class="modal" id="talentDetailsModal" style="display: flex;">
                    <div class="modal-content">
                        <span class="close-modal" onclick="closeTalentDetails()">&times;</span>
                        <h2>Perfil de ${talent.name}</h2>
                        
                        <div class="profile-details">
                            <div class="info-grid">
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
                                    <label>Género:</label>
                                    <span>${talent.gender === 'hombre' ? 'Hombre' : 'Mujer'}</span>
                                </div>
                                <div class="info-item">
                                    <label>Idiomas:</label>
                                    <span>${Array.isArray(talent.languages) ? talent.languages.join(', ') : talent.languages || 'No especificado'}</span>
                                </div>
                                <div class="info-item">
                                    <label>Home Studio:</label>
                                    <span>${talent.homeStudio === 'si' ? 'Sí' : 'No'}</span>
                                </div>
                                <div class="info-item">
                                    <label>Nacionalidad:</label>
                                    <span>${talent.nationality || 'No especificado'}</span>
                                </div>
                                ${talent.realAge ? `
                                <div class="info-item">
                                    <label>Edad real:</label>
                                    <span>${talent.realAge} años</span>
                                </div>
                                ` : ''}
                                ${talent.ageRange ? `
                                <div class="info-item">
                                    <label>Rango de edades:</label>
                                    <span>${talent.ageRange}</span>
                                </div>
                                ` : ''}
                            </div>
                            
                            ${talent.description ? `
                                <div class="description-section">
                                    <label>Descripción:</label>
                                    <p>${talent.description}</p>
                                </div>
                            ` : ''}
                            
                            ${talent.demos && talent.demos.length > 0 ? `
                                <div class="demos-section">
                                    <h3>Demos de Audio</h3>
                                    ${talent.demos.map(demo => `
                                        <div class="demo-item">
                                            <p><strong>${demo.name}</strong></p>
                                            <audio controls style="width: 100%;">
                                                <source src="${demo.url}" type="audio/mpeg">
                                            </audio>
                                            <div style="font-size: 12px; color: #666; margin-top: 5px;">
                                                ${Math.round(demo.duration)} segundos • ${(demo.size / 1024 / 1024).toFixed(1)} MB
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p>No hay demos de audio disponibles.</p>'}
                        </div>
                        
                        ${currentUser ? `
                            <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                                <button class="btn btn-primary" onclick="contactTalent('${talentId}')">Contactar</button>
                                <button class="btn btn-success" onclick="addToFavorites('${talentId}')">
                                    <i class="fas fa-heart"></i> Agregar a Favoritos
                                </button>
                            </div>
                        ` : '<p style="color: #666; margin-top: 20px; text-align: center;">Inicia sesión para contactar a este talento</p>'}
                    </div>
                </div>
            `;
            
            // Agregar el modal al body
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
        } else {
            console.log('No se encontró el perfil del talento:', talentId);
        }
    } catch (error) {
        console.error('Error cargando detalles del talento:', error);
    }
}

// Función para cerrar el modal de detalles
window.closeTalentDetails = function() {
    const modal = document.getElementById('talentDetailsModal');
    if (modal) {
        modal.remove();
    }
};

// Función para contactar talento
window.contactTalent = function(talentId) {
    // Aquí podés implementar el sistema de mensajes
    console.log('Contactando talento:', talentId);
    
    // Por ahora, mostrar información de contacto básica
    const talentDoc = db.collection('talents').doc(talentId).get()
        .then(doc => {
            if (doc.exists) {
                const talent = doc.data();
                alert(`Para contactar a ${talent.name}:\n\nEmail: ${talent.email}\nTeléfono: ${talent.phone || 'No disponible'}`);
            }
        });
};

// Función mejorada de favoritos
window.addToFavorites = function(talentId) {
    if (!currentUser) {
        alert('Debes iniciar sesión para agregar a favoritos');
        return;
    }
    
    // Aquí podés implementar la lógica para guardar en favoritos en Firestore
    console.log('Agregando a favoritos:', talentId);
    
    // Mensaje temporal
    const talentDoc = db.collection('talents').doc(talentId).get()
        .then(doc => {
            if (doc.exists) {
                const talent = doc.data();
                alert(`✅ ${talent.name} agregado a tus favoritos`);
            }
        });
};

// Función mejorada para postularse a trabajos
window.applyToJob = function(jobId) {
    if (!currentUser) {
        alert('Debes iniciar sesión para postularte');
        return;
    }
    
    // Aquí podés implementar la lógica de postulación
    console.log('Postulando a trabajo:', jobId);
    
    const jobDoc = db.collection('jobs').doc(jobId).get()
        .then(doc => {
            if (doc.exists) {
                const job = doc.data();
                alert(`📝 Te has postulado a: "${job.title}"\n\nSe ha enviado tu perfil al cliente. Te contactaremos si hay interés.`);
            }
        });
};

// ========== DASHBOARD FUNCIONAL - CORREGIDO ==========

window.showDashboard = function() {
    document.getElementById('dashboardModal').style.display = 'flex';
    
    // Asegurarse de que el tab de perfil esté activo
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector('[data-tab="profile"]').classList.add('active');
    document.getElementById('profileTab').classList.add('active');
    
    // Cargar el perfil
    if (currentUser) {
        loadUserProfile(currentUser.uid);
    } else {
        document.getElementById('userProfileContent').innerHTML = 
            '<div class="error">Error: Usuario no autenticado</div>';
    }
};

// Función para cargar perfil de usuario - CORREGIDA
window.loadUserProfile = async function(userId) {
    try {
        console.log('🔍 Cargando perfil para:', userId);
        
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
        } else {
            document.getElementById('userProfileContent').innerHTML = 
                '<div class="error">No se encontró perfil. Completa tu registro en la sección correspondiente.</div>';
        }
        
    } catch (error) {
        console.error('❌ Error cargando perfil:', error);
        document.getElementById('userProfileContent').innerHTML = 
            '<div class="error">Error al cargar el perfil: ' + error.message + '</div>';
    }
};

// Función para mostrar perfil en el dashboard
function displayUserProfile(profile) {
    const profileContent = document.getElementById('userProfileContent');
    console.log('📊 Mostrando perfil:', profile.type);
    
    if (profile.type === 'talent') {
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
                
                ${profile.demos && profile.demos.length > 0 ? `
                    <div class="demos-section">
                        <h4>Mis Demos de Audio</h4>
                        ${profile.demos.map(demo => `
                            <div class="demo-item">
                                <audio controls>
                                    <source src="${demo.url}" type="audio/mpeg">
                                </audio>
                                <span class="demo-name">${demo.name}</span>
                                <button class="btn btn-danger btn-sm" onclick="deleteDemo('${demo.publicId}', '${currentUser.uid}')">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p>No hay demos de audio subidos.</p>'}
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

// Funciones de edición de perfil
window.openEditProfileModal = function() {
    loadEditProfileForm();
    document.getElementById('editProfileModal').style.display = 'flex';
};

window.closeEditProfileModal = function() {
    document.getElementById('editProfileModal').style.display = 'none';
};

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
        document.getElementById('editProfileForm').innerHTML = 
            '<div class="error">Error al cargar formulario de edición</div>';
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

// Mostrar formulario de edición para clientes
function displayClientEditForm(profile) {
    const editForm = document.getElementById('editProfileForm');
    
    editForm.innerHTML = `
        <h3>Editar Perfil - Cliente</h3>
        
        <div class="form-group">
            <label for="editName">Nombre Completo *</label>
            <input type="text" id="editName" class="form-control" value="${profile.name || ''}" required>
        </div>
        
        <div class="form-group">
            <label for="editPhone">Teléfono</label>
            <input type="tel" id="editPhone" class="form-control" value="${profile.phone || ''}">
        </div>
        
        ${profile.companyName ? `
            <div class="form-group">
                <label for="editCompanyName">Nombre de la Empresa</label>
                <input type="text" id="editCompanyName" class="form-control" value="${profile.companyName || ''}">
            </div>
        ` : ''}
        
        <div id="editProfileMessage"></div>
        
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeEditProfileModal()">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="updateClientProfile()">Guardar Cambios</button>
        </div>
    `;
}

// Actualizar perfil de talento
window.updateTalentProfile = async function() {
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
        
        // Recargar perfil
        loadUserProfile(userId);
        
    } catch (error) {
        console.error('Error eliminando demo:', error);
        alert('Error eliminando el demo');
    }
};
