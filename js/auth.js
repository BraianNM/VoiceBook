// auth.js
// ===================================
// Manejo de autenticación Firebase
// ===================================
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth-compat.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore-compat.js";

const auth = getAuth();
const db = getFirestore();

window.initializeAuth = function() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const dashboardLink = document.getElementById('dashboardLink');
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    const headerUserPicture = document.getElementById('headerUserPicture');

    // Observador de estado de autenticación
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Usuario logueado
            authButtons.style.display = 'none';
            userMenu.style.display = 'flex';
            dashboardLink.style.display = 'inline';
            userName.textContent = user.displayName || user.email;
            headerUserPicture.src = user.photoURL || 'img/default-avatar.png';
        } else {
            // Usuario no logueado
            authButtons.style.display = 'flex';
            userMenu.style.display = 'none';
            dashboardLink.style.display = 'none';
        }
    });

    // Logout
    logoutBtn.onclick = () => {
        signOut(auth)
            .then(() => alert('Sesión cerrada'))
            .catch(err => alert(err.message));
    };

    // Registro de talento
    window.registerTalent = async function(talentData) {
        const { email, password, name, gender, language, country, homeStudio, photoFile } = talentData;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Subir foto (si existe)
            let photoURL = '';
            if (photoFile) {
                const storageRef = firebase.storage().ref();
                const fileRef = storageRef.child(`talentPhotos/${user.uid}`);
                await fileRef.put(photoFile);
                photoURL = await fileRef.getDownloadURL();
            }

            // Actualizar perfil de Firebase Auth
            await updateProfile(user, { displayName: name, photoURL: photoURL });

            // Guardar datos adicionales en Firestore
            await setDoc(doc(db, 'talents', user.uid), {
                name,
                email,
                gender,
                language,
                country,
                homeStudio,
                photoURL
            });

            alert('Registro exitoso!');
            document.getElementById('talentModal').style.display = 'none';
        } catch (error) {
            alert('Error en registro: ' + error.message);
        }
    };

    // Login
    window.loginUser = async function(email, password) {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert('Bienvenido!');
            document.getElementById('loginModal').style.display = 'none';
        } catch (error) {
            alert('Error al iniciar sesión: ' + error.message);
        }
    };
};
