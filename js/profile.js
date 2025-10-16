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
        }
        
    } catch (error) {
        console.error('Error cargando perfil:', error);
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
    
    // Agregar event listener al botón después de crear el HTML
    setTimeout(() => {
        const editBtn = document.getElementById('editProfileBtn');
        if (editBtn) {
            editBtn.addEventListener('click', openEditProfileModal);
        }
    }, 100);
}

// FUNCIÓN PRINCIPAL CORREGIDA - Abrir modal de edición de perfil
async function openEditProfileModal() {
    console.log('🔓 Botón Editar Perfil - CLICKEADO');
    
    if (!currentUser) {
        alert('Debes iniciar sesión para editar tu perfil');
        return;
    }
    
    try {
        // Ocultar dashboard primero
        document.getElementById('dashboardModal').style.display = 'none';
        
        console.log('🔄 Cargando datos del perfil para edición...');
        
        const userId = currentUser.uid;
        let userProfile = null;
        
        // Cargar datos actuales del usuario
        const talentDoc = await db.collection('talents').doc(userId).get();
        if (talentDoc.exists) {
            userProfile = talentDoc.data();
            console.log('✅ Perfil de talento cargado para edición');
            displayTalentEditForm(userProfile);
        } else {
            const clientDoc = await db.collection('clients').doc(userId).get();
            if (clientDoc.exists) {
                userProfile = clientDoc.data();
                console.log('✅ Perfil de cliente cargado para edición');
                displayClientEditForm(userProfile);
            } else {
                console.error('❌ No se encontró perfil para editar');
                document.getElementById('editProfileForm').innerHTML = 
                    '<div class="error">No se encontró perfil para editar</div>';
            }
        }
        
        // Mostrar el modal de edición
        document.getElementById('editProfileModal').style.display = 'flex';
        console.log('✅ Modal de edición mostrado');
        
    } catch (error) {
        console.error('❌ Error abriendo editor de perfil:', error);
        document.getElementById('editProfileForm').innerHTML = 
            '<div class="error">Error al cargar formulario: ' + error.message + '</div>';
        document.getElementById('editProfileModal').style.display = 'flex';
    }
}

// Mostrar formulario de edición para talentos
function displayTalentEditForm(profile) {
    const editForm = document.getElementById('editProfileForm');
    
    editForm.innerHTML = `
        <div style="max-height: 80vh; overflow-y: auto; padding-right: 10px;">
            <h3>Editar Perfil - Talento</h3>
            
            <div class="form-group">
                <label for="editName">Nombre Completo *</label>
                <input type="text" id="editName" class="form-control" value="${profile.name || ''}" required>
            </div>
            
            <div class="form-group">
                <label for="editPhone">Teléfono *</label>
                <input type="tel" id="editPhone" class="form-control" value="${profile.phone || ''}" required>
            </div>
            
            <!-- CAMPOS DE UBICACIÓN -->
            <div class="form-group">
                <label for="editCountry">País</label>
                <select id="editCountry" class="form-control">
                    <option value="">Selecciona tu país</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="editState">Provincia/Estado</label>
                <select id="editState" class="form-control">
                    <option value="">Selecciona tu provincia/estado</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="editCity">Ciudad</label>
                <select id="editCity" class="form-control">
                    <option value="">Selecciona tu ciudad</option>
                </select>
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
                <label>Idiomas que manejas</label>
                <div class="checkbox-group" id="editLanguagesContainer">
                    ${generateLanguageCheckboxes(profile.languages)}
                </div>
                <input type="text" id="editOtherLanguages" class="form-control" placeholder="Especifica otros idiomas" style="margin-top: 10px; display: none;">
            </div>
            
            <div class="form-group">
                <label for="editHomeStudio">Home Studio</label>
                <select id="editHomeStudio" class="form-control">
                    <option value="">Selecciona una opción</option>
                    <option value="si" ${profile.homeStudio === 'si' ? 'selected' : ''}>Sí</option>
                    <option value="no" ${profile.homeStudio === 'no' ? 'selected' : ''}>No</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Agregar nuevos demos de audio</label>
                <input type="file" id="newDemos" class="form-control" accept="audio/*" multiple>
                <small class="text-muted">Formatos: MP3, WAV, OGG. Máximo 10MB por archivo.</small>
            </div>
            
            ${profile.demos && profile.demos.length > 0 ? `
                <div class="form-group">
                    <label>Demos existentes</label>
                    <div class="existing-demos">
                        ${profile.demos.map(demo => `
                            <div class="demo-item-existing" style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                                <audio controls style="width: 100%; margin-bottom: 5px;">
                                    <source src="${demo.url}" type="audio/mpeg">
                                </audio>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 12px;">${demo.name}</span>
                                    <button type="button" class="btn btn-danger btn-sm" onclick="deleteDemo('${demo.publicId}', '${currentUser.uid}')">
                                        <i class="fas fa-trash"></i> Eliminar
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div id="editProfileMessage"></div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeEditProfileModal()">Cancelar</button>
                <button type="button" class="btn btn-primary" onclick="updateTalentProfile()">Guardar Cambios</button>
            </div>
        </div>
    `;
    
    // Cargar datos de ubicación
    loadLocationDataForEdit(profile);
    
    // Configurar event listeners
    setTimeout(() => {
        setupEditFormListeners();
    }, 200);
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

// Configurar event listeners para el formulario de edición
function setupEditFormListeners() {
    const countrySelect = document.getElementById('editCountry');
    const stateSelect = document.getElementById('editState');
    const editLang10 = document.getElementById('editLang10');
    const editOtherLanguages = document.getElementById('editOtherLanguages');
    
    if (countrySelect) {
        countrySelect.addEventListener('change', function() {
            updateEditStates(this.value);
        });
    }
    
    if (stateSelect) {
        stateSelect.addEventListener('change', function() {
            const countrySelect = document.getElementById('editCountry');
            updateEditCities(countrySelect.value, this.value);
        });
    }
    
    if (editLang10 && editOtherLanguages) {
        editLang10.addEventListener('change', function() {
            editOtherLanguages.style.display = this.checked ? 'block' : 'none';
        });
        
        if (editLang10.checked) {
            editOtherLanguages.style.display = 'block';
        }
    }
}

// Cargar datos de ubicación para edición
function loadLocationDataForEdit(profile) {
    const countrySelect = document.getElementById('editCountry');
    const stateSelect = document.getElementById('editState');
    const citySelect = document.getElementById('editCity');

    if (!countrySelect || !stateSelect || !citySelect) return;

    // Limpiar selects
    countrySelect.innerHTML = '<option value="">Selecciona tu país</option>';
    stateSelect.innerHTML = '<option value="">Selecciona tu provincia/estado</option>';
    citySelect.innerHTML = '<option value="">Selecciona tu ciudad</option>';

    // Llenar países
    if (locationData && locationData.paises) {
        locationData.paises.forEach(pais => {
            const option = document.createElement('option');
            option.value = pais.id;
            option.textContent = pais.nombre;
            if (profile.country === pais.id) {
                option.selected = true;
            }
            countrySelect.appendChild(option);
        });

        // Si hay país seleccionado, cargar estados
        if (profile.country && locationData.estados[profile.country]) {
            updateEditStates(profile.country, profile.state);
        }

        // Si hay estado seleccionado, cargar ciudades
        if (profile.country && profile.state && locationData.ciudades[profile.country] && locationData.ciudades[profile.country][profile.state]) {
            updateEditCities(profile.country, profile.state, profile.city);
        }
    }
}

// Actualizar estados en edición
function updateEditStates(countryId, selectedState = '') {
    const stateSelect = document.getElementById('editState');
    if (!stateSelect) return;
    
    stateSelect.innerHTML = '<option value="">Selecciona tu provincia/estado</option>';
    
    if (countryId && locationData.estados[countryId]) {
        locationData.estados[countryId].forEach(estado => {
            const option = document.createElement('option');
            option.value = estado.id;
            option.textContent = estado.nombre;
            if (estado.id === selectedState) {
                option.selected = true;
            }
            stateSelect.appendChild(option);
        });
    }
}

// Actualizar ciudades en edición
function updateEditCities(countryId, stateId, selectedCity = '') {
    const citySelect = document.getElementById('editCity');
    if (!citySelect) return;
    
    citySelect.innerHTML = '<option value="">Selecciona tu ciudad</option>';
    
    if (countryId && stateId && locationData.ciudades[countryId] && locationData.ciudades[countryId][stateId]) {
        locationData.ciudades[countryId][stateId].forEach(ciudad => {
            const option = document.createElement('option');
            option.value = ciudad.id;
            option.textContent = ciudad.nombre;
            if (ciudad.id === selectedCity) {
                option.selected = true;
            }
            citySelect.appendChild(option);
        });
    }
}

// Generar checkboxes de idiomas para edición
function generateLanguageCheckboxes(selectedLanguages) {
    const languages = [
        { id: 'editLang1', value: 'es-latino', label: 'Español Latino' },
        { id: 'editLang2', value: 'es-rioplatense', label: 'Español Rioplatense' },
        { id: 'editLang3', value: 'es-españa', label: 'Español de España' },
        { id: 'editLang4', value: 'italiano', label: 'Italiano' },
        { id: 'editLang5', value: 'en-britanico', label: 'Inglés Británico' },
        { id: 'editLang6', value: 'en-estadounidense', label: 'Inglés Estadounidense' },
        { id: 'editLang7', value: 'portugues', label: 'Portugués' },
        { id: 'editLang8', value: 'aleman', label: 'Alemán' },
        { id: 'editLang9', value: 'arabe', label: 'Árabe' },
        { id: 'editLang10', value: 'otros', label: 'Otros' }
    ];
    
    return languages.map(lang => `
        <div class="checkbox-item">
            <input type="checkbox" id="${lang.id}" value="${lang.value}" 
                ${Array.isArray(selectedLanguages) && selectedLanguages.includes(lang.value) ? 'checked' : ''}>
            <label for="${lang.id}">${lang.label}</label>
        </div>
    `).join('');
}

// Obtener idiomas seleccionados en edición
function getEditSelectedLanguages() {
    const languages = [];
    for (let i = 1; i <= 10; i++) {
        const checkbox = document.getElementById('editLang' + i);
        if (checkbox && checkbox.checked) {
            if (checkbox.value === 'otros') {
                const otherInput = document.getElementById('editOtherLanguages');
                if (otherInput && otherInput.value) {
                    languages.push(otherInput.value);
                }
            } else {
                languages.push(checkbox.value);
            }
        }
    }
    return languages;
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
            languages: getEditSelectedLanguages(),
            homeStudio: document.getElementById('editHomeStudio').value,
            nationality: document.getElementById('editNationality').value,
            realAge: parseInt(document.getElementById('editRealAge').value) || null,
            ageRange: document.getElementById('editAgeRange').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Agregar datos de ubicación
        const countrySelect = document.getElementById('editCountry');
        const stateSelect = document.getElementById('editState');
        const citySelect = document.getElementById('editCity');
        
        if (countrySelect && countrySelect.value) updateData.country = countrySelect.value;
        if (stateSelect && stateSelect.value) updateData.state = stateSelect.value;
        if (citySelect && citySelect.value) updateData.city = citySelect.value;
        
        if (!updateData.name || !updateData.phone) {
            showMessage(messageDiv, '❌ Nombre y teléfono son obligatorios', 'error');
            return;
        }
        
        showMessage(messageDiv, '🔄 Guardando cambios...', 'success');
        
        // Manejar nuevos archivos de audio
        const newAudioFiles = document.getElementById('newDemos').files;
        if (newAudioFiles.length > 0) {
            const newDemos = await uploadAudioFiles(newAudioFiles);
            const currentDoc = await db.collection('talents').doc(userId).get();
            const currentDemos = currentDoc.data().demos || [];
            updateData.demos = [...currentDemos, ...newDemos];
        }
        
        await db.collection('talents').doc(userId).update(updateData);
        
        showMessage(messageDiv, '✅ Perfil actualizado correctamente', 'success');
        
        setTimeout(() => {
            closeEditProfileModal();
            loadUserProfile(userId);
        }, 2000);
        
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        showMessage(messageDiv, '❌ Error: ' + error.message, 'error');
    }
};

// Actualizar perfil de cliente
window.updateClientProfile = async function() {
    const messageDiv = document.getElementById('editProfileMessage');
    
    try {
        const userId = currentUser.uid;
        const updateData = {
            name: document.getElementById('editName').value,
            phone: document.getElementById('editPhone').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const companyNameInput = document.getElementById('editCompanyName');
        if (companyNameInput) {
            updateData.companyName = companyNameInput.value;
        }
        
        if (!updateData.name) {
            showMessage(messageDiv, '❌ Nombre es obligatorio', 'error');
            return;
        }
        
        showMessage(messageDiv, '🔄 Guardando cambios...', 'success');
        
        await db.collection('clients').doc(userId).update(updateData);
        
        showMessage(messageDiv, '✅ Perfil actualizado correctamente', 'success');
        
        setTimeout(() => {
            closeEditProfileModal();
            loadUserProfile(userId);
        }, 2000);
        
    } catch (error) {
        console.error('Error actualizando perfil:', error);
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
        
        loadUserProfile(userId);
        
    } catch (error) {
        console.error('Error eliminando demo:', error);
        alert('Error eliminando el demo');
    }
};

// Cerrar modal de edición
window.closeEditProfileModal = function() {
    document.getElementById('editProfileModal').style.display = 'none';
    document.getElementById('dashboardModal').style.display = 'flex';
};

// Función auxiliar para mostrar mensajes
function showMessage(element, message, type) {
    if (element) {
        element.innerHTML = `<div class="${type}">${message}</div>`;
    }
}

// Hacer la función global
window.openEditProfileModal = openEditProfileModal;
