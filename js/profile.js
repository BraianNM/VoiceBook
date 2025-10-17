<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mi Perfil - VoiceBook</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
    
    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-auth-compat.js"></script>
</head>
<body>
    <header class="profile-header-custom">
        <div class="container">
            <div class="header-content-custom">
                <div class="logo">
                    <i class="fas fa-microphone-alt"></i>
                    <span>VoiceBook</span>
                </div>
                <nav class="profile-nav-center">
                    <ul>
                        <li><a href="index.html">Inicio</a></li>
                        <li><a href="index.html#talentos">Talentos</a></li>
                        <li><a href="index.html#ofertas">Ofertas</a></li>
                    </ul>
                </nav>
                <div id="userMenu" class="profile-logo-right" style="display:none;">
                    <span id="userName" style="color:white; margin-right:15px;"></span>
                    <button class="btn btn-outline" id="logoutBtn">Cerrar Sesión</button>
                </div>
            </div>
        </div>
    </header>

    <main class="profile-main">
        <div class="container large-container">
            
            <div class="profile-section">
                <h2>Mi Panel de Control</h2>
                
                <div class="dashboard">
                    <div class="dashboard-tabs">
                        <div class="tab active" data-tab="profile">Mi Perfil</div>
                        <div class="tab" data-tab="favorites">Favoritos</div>
                        <div class="tab" data-tab="jobs" id="jobsTab" style="display:none;">Mis Ofertas</div>
                        <div class="tab" data-tab="applications" id="applicationsTab" style="display:none;">Mis Postulaciones</div>
                    </div>
                    
                    <div class="tab-content active" id="profileTab">
                        <div id="userProfileContent">
                            <div class="loading">Cargando perfil...</div>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="favoritesTab">
                        <div id="favoritesContent">
                            <p>Funcionalidad de favoritos - Próximamente</p>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="jobsTabContent">
                        <div id="jobsContent">
                            <p>Mis ofertas de trabajo - Próximamente</p>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="applicationsTabContent">
                        <div id="applicationsContent">
                            <p>Mis postulaciones - Próximamente</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <div class="modal" id="editProfileModal">
        <div class="modal-content">
            <span class="close-modal" onclick="window.closeEditProfileModal()">&times;</span>
            <h2>Editar Perfil</h2>
            
            <div id="editProfileMessage"></div>

            <form id="editProfileForm">
                <div class="form-group">
                    <label for="editName">Nombre Completo:</label>
                    <input type="text" id="editName" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label for="editPhone">Teléfono:</label>
                    <input type="tel" id="editPhone" class="form-control">
                </div>

                <div id="editClientFields" style="display: none;">
                    <div class="form-group">
                        <label for="editCompanyName">Nombre de la Empresa (Opcional):</label>
                        <input type="text" id="editCompanyName" class="form-control">
                    </div>
                </div>

                <div id="editTalentFields" style="display: none;">
                    <div class="form-group">
                        <label for="editDescription">Descripción:</label>
                        <textarea id="editDescription" class="form-control" rows="4"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="editGender">Género:</label>
                        <select id="editGender" class="form-control">
                            <option value="">Seleccionar</option>
                            <option value="hombre">Hombre</option>
                            <option value="mujer">Mujer</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="editHomeStudio">¿Tienes Home Studio?</label>
                        <select id="editHomeStudio" class="form-control">
                            <option value="">Seleccionar</option>
                            <option value="si">Sí</option>
                            <option value="no">No</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="editNationality">Nacionalidad:</label>
                        <input type="text" id="editNationality" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="editRealAge">Edad real:</label>
                        <input type="number" id="editRealAge" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="editAgeRange">Rango de edades que puede interpretar:</label>
                        <input type="text" id="editAgeRange" class="form-control">
                    </div>
                    
                    <div class="form-group">
                        <label for="editTalentDemos">Subir Demos de Audio (Máx 2):</label>
                        <input type="file" id="editTalentDemos" class="form-control" accept="audio/mp3, audio/wav, audio/ogg" multiple>
                        <small class="text-muted">Si subes archivos, se añadirán a los demos existentes (Máx 2, 10MB c/u).</small>
                    </div>

                    </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="window.closeEditProfileModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                </div>
            </form>
        </div>
    </div>
    
    <footer>
        <div class="copyright">
            <p>&copy; 2023 VoiceBook. Todos los derechos reservados.</p>
        </div>
    </footer>


    <script src="js/firebase-config.js"></script>
    <script src="js/locations.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/profile.js"></script>
    <script src="js/app.js"></script>
    
    <script>
        // Lógica de inicialización específica para profile.html
        document.addEventListener('DOMContentLoaded', function() {
            // Si el usuario no está logueado, redirigir al index. Esto es para evitar que se vea la página vacía.
            auth.onAuthStateChanged((user) => {
                if (!user) {
                    window.location.href = 'index.html';
                } else {
                    // Carga el perfil solo si estamos logueados en esta página
                    window.setupEventListeners();
                    // Asumimos loadLocationData está en locations.js
                    if (typeof window.loadLocationData === 'function') {
                        window.loadLocationData(); 
                    }
                    window.loadUserProfile(user.uid); // Carga el perfil
                    
                    // Lógica para que las pestañas funcionen en esta página
                    document.querySelectorAll('.dashboard-tabs .tab').forEach(tab => {
                        tab.addEventListener('click', function() {
                            document.querySelectorAll('.dashboard-tabs .tab').forEach(t => t.classList.remove('active'));
                            // Desactivar el contenido activo
                            document.querySelectorAll('.tab-content.active').forEach(content => content.classList.remove('active'));
                            
                            this.classList.add('active');
                            const tabId = this.getAttribute('data-tab');
                            // Activar el nuevo contenido. Se usa un switch para manejar IDs
                            let contentId = tabId + 'Tab';
                            if (tabId !== 'profile') {
                                // Para Favoritos, Jobs, Applications, el ID de la pestaña es XTab, pero el contenido es XTabContent
                                contentId = tabId + 'TabContent'; 
                            }
                            const contentElement = document.getElementById(contentId);
                            if (contentElement) {
                                contentElement.classList.add('active');
                            }
                        });
                    });
                }
            });
        });
    </script>
</body>
</html>
