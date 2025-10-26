// Autenticación y registro de usuarios

// Verificar estado de autenticación
window.checkAuthState = function() {
    auth.onAuthStateChanged(async (user) => {
        currentUser = user;
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        const userNameSpan = document.getElementById('userName');

        if (user) {
            console.log('Usuario autenticado:', user.uid);
            
            try {
                let userDoc;
                
                // Intentar obtener como talento primero
                userDoc = await db.collection('talents').doc(user.uid).get();
                if (userDoc.exists) {
                    currentUserData = userDoc.data();
                    currentUserData.type = 'talent';
                } else {
                    // Intentar obtener como cliente
                    userDoc = await db.collection('clients').doc(user.uid).get();
                    if (userDoc.exists) {
                        currentUserData = userDoc.data();
                        currentUserData.type = 'client';
                    } else {
                        console.log('Usuario no encontrado en ninguna colección');
                        currentUserData = null;
                    }
                }

                // Actualizar UI
                if (authButtons && userMenu) {
                    authButtons.style.display = 'none';
                    userMenu.style.display = 'flex';
                    
                    if (userNameSpan && currentUserData) {
                        userNameSpan.textContent = currentUserData.name || user.email;
                    }
                }

                // Si estamos en profile.html, cargar el perfil
                if (window.location.href.includes('profile.html')) {
                    if (typeof window.loadUserProfile === 'function') {
                        window.loadUserProfile();
                    }
                }

            } catch (error) {
                console.error('Error obteniendo datos del usuario:', error);
            }
        } else {
            console.log('Usuario no autenticado');
            currentUser = null;
            currentUserData = null;
            
            if (authButtons && userMenu) {
                authButtons.style.display = 'flex';
                userMenu.style.display = 'none';
            }

            // Redirigir a index.html si está en profile.html sin autenticación
            if (window.location.href.includes('profile.html')) {
                window.location.href = 'index.html';
            }
        }
    });
};

// Registrar talento
async function registerTalent(e) {
    e.preventDefault();
    console.log('Iniciando registro de talento...');

    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
        submitBtn.disabled = true;

        // Validar contraseña
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        if (password !== confirmPassword) {
            throw new Error('Las contraseñas no coinciden');
        }

        if (password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }

        // Crear usuario en Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(
            formData.get('email'), 
            password
        );
        
        const user = userCredential.user;
        console.log('Usuario creado:', user.uid);

        // Preparar datos para Firestore
        const talentData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            country: formData.get('country'),
            state: formData.get('state'),
            city: formData.get('city'),
            gender: formData.get('gender'),
            ageRange: formData.get('ageRange'),
            realAge: formData.get('realAge'),
            nationality: formData.get('nationality'),
            bio: formData.get('bio'),
            homeStudio: formData.get('homeStudio'),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Procesar idiomas
        const languages = [];
        for (let i = 1; i <= 10; i++) {
            if (formData.get(`lang${i}`)) {
                languages.push(formData.get(`lang${i}`));
            }
        }
        if (formData.get('otherLanguages')) {
            languages.push(formData.get('otherLanguages'));
        }
        talentData.languages = languages;

        // Subir foto de perfil si existe
        const profilePicture = formData.get('profilePicture');
        if (profilePicture && profilePicture.size > 0) {
            try {
                const storageRef = storage.ref(`profile-pictures/${user.uid}`);
                const snapshot = await storageRef.put(profilePicture);
                const downloadURL = await snapshot.ref.getDownloadURL();
                talentData.profilePictureUrl = downloadURL;
            } catch (uploadError) {
                console.error('Error subiendo foto de perfil:', uploadError);
            }
        }

        // Guardar en Firestore
        await db.collection('talents').doc(user.uid).set(talentData);
        console.log('Talento guardado en Firestore');

        // Cerrar modal y mostrar mensaje
        window.closeAllModals();
        alert('¡Registro exitoso! Bienvenido/a a VoiceBook.');
        
        // Recargar la página para actualizar el estado
        setTimeout(() => {
            window.location.reload();
        }, 2000);

    } catch (error) {
        console.error('Error en registro de talento:', error);
        let errorMessage = 'Error en el registro: ';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage += 'El email ya está registrado.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'El email no es válido.';
                break;
            case 'auth/weak-password':
                errorMessage += 'La contraseña es demasiado débil.';
                break;
            default:
                errorMessage += error.message;
        }
        
        alert(errorMessage);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Registrar cliente
async function registerClient(e) {
    e.preventDefault();
    console.log('Iniciando registro de cliente...');

    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
        submitBtn.disabled = true;

        // Validar contraseña
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        if (password !== confirmPassword) {
            throw new Error('Las contraseñas no coinciden');
        }

        if (password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }

        // Crear usuario en Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(
            formData.get('email'), 
            password
        );
        
        const user = userCredential.user;
        console.log('Cliente creado:', user.uid);

        // Preparar datos para Firestore
        const clientData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            clientType: formData.get('clientType'),
            country: formData.get('country'),
            state: formData.get('state'),
            city: formData.get('city'),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Agregar nombre de empresa si es empresa
        if (formData.get('clientType') === 'empresa') {
            clientData.companyName = formData.get('companyName');
        }

        // Subir foto de perfil si existe
        const profilePicture = formData.get('profilePicture');
        if (profilePicture && profilePicture.size > 0) {
            try {
                const storageRef = storage.ref(`profile-pictures/${user.uid}`);
                const snapshot = await storageRef.put(profilePicture);
                const downloadURL = await snapshot.ref.getDownloadURL();
                clientData.profilePictureUrl = downloadURL;
            } catch (uploadError) {
                console.error('Error subiendo foto de perfil:', uploadError);
            }
        }

        // Guardar en Firestore
        await db.collection('clients').doc(user.uid).set(clientData);
        console.log('Cliente guardado en Firestore');

        // Cerrar modal y mostrar mensaje
        window.closeAllModals();
        alert('¡Registro exitoso! Bienvenido/a a VoiceBook.');
        
        // Recargar la página para actualizar el estado
        setTimeout(() => {
            window.location.reload();
        }, 2000);

    } catch (error) {
        console.error('Error en registro de cliente:', error);
        let errorMessage = 'Error en el registro: ';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage += 'El email ya está registrado.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'El email no es válido.';
                break;
            case 'auth/weak-password':
                errorMessage += 'La contraseña es demasiado débil.';
                break;
            default:
                errorMessage += error.message;
        }
        
        alert(errorMessage);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Iniciar sesión
async function loginUser(e) {
    e.preventDefault();
    console.log('Iniciando sesión...');

    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
        submitBtn.disabled = true;

        const userCredential = await auth.signInWithEmailAndPassword(
            formData.get('email'), 
            formData.get('password')
        );
        
        console.log('Sesión iniciada:', userCredential.user.uid);
        window.closeAllModals();
        
        // Mostrar mensaje de bienvenida
        alert('¡Bienvenido de nuevo!');
        
        // Si está en index.html, recargar para actualizar UI
        if (!window.location.href.includes('profile.html')) {
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }

    } catch (error) {
        console.error('Error iniciando sesión:', error);
        let errorMessage = 'Error al iniciar sesión: ';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage += 'Usuario no encontrado.';
                break;
            case 'auth/wrong-password':
                errorMessage += 'Contraseña incorrecta.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Email no válido.';
                break;
            default:
                errorMessage += error.message;
        }
        
        alert(errorMessage);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Cerrar sesión
async function logoutUser() {
    try {
        await auth.signOut();
        console.log('Sesión cerrada');
        currentUser = null;
        currentUserData = null;
        
        // Redirigir a index.html
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error cerrando sesión:', error);
        alert('Error al cerrar sesión: ' + error.message);
    }
}

console.log('Auth.js cargado correctamente');
