import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCABTKmb_Dy_E9GNOXw4lH6mgleLUFLmoI",
  authDomain: "nutrisnacktech.firebaseapp.com",
  projectId: "nutrisnacktech",
  storageBucket: "nutrisnacktech.firebasestorage.app",
  messagingSenderId: "887283424464",
  appId: "1:887283424464:web:40e1bf63ef6859ef7192d5",
  measurementId: "G-3ZW6XW52KN",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar Storage para usarlo en App.jsx
export const storage = getStorage(app);

