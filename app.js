// ==========================================
// MON ASSISTANT VIDE-GRENIER
// VERSION 100 % GRATUITE
// AVEC 36 FONDS BROCANTE ALÉATOIRES
// ==========================================

// ⚠️ METS TA CLÉ API ICI
const CLE_API = "AQ.Ab8RN6KtJ7pU6tpg8x4aofAvmA1x1RT9ma_mu1UUShzV_0AD6g";

// ==========================================
// MODÈLE GEMINI
// ==========================================

const MODELE = "gemini-3.5-flash-lite";

// ==========================================
// ÉLÉMENTS DE L'INTERFACE
// ==========================================

const inputPhoto = document.getElementById("photo");
const preview = document.getElementById("preview");
const boutonAnalyser = document.getElementById("analyser");
const chargement = document.getElementById("chargement");
const resultat = document.getElementById("resultat");

let imageBase64 = null;
let mimeType = "image/jpeg";

// ==========================================
// FONDS BROCANTE
// ==========================================

const NOMBRE_DE_FONDS = 36;

let dernierFond = 0;

// ------------------------------------------
// CHOISIR UN FOND
// ------------------------------------------

function obtenirNumeroFond() {

  let numero;

  do {
    numero =
      Math.floor(
        Math.random() * NOMBRE_DE_FONDS
      ) + 1;

  } while (
    numero === dernierFond &&
    NOMBRE_DE_FONDS > 1
  );

  dernierFond = numero;

  return numero;
}

// ------------------------------------------
// CHANGER LE FOND
// ------------------------------------------

function changerFond() {

  const numero =
    obtenirNumeroFond();

  const numeroFormate =
    String(numero).padStart(2, "0");

  const chemin =
    "./fonds/brocante (" +
    numeroFormate +
    ").jpg";

  console.log(
    "Fond sélectionné :",
    chemin
  );

  // Préchargement de l'image
  const image =
    new Image();

  image.onload = function () {

    console.log(
      "Fond chargé :",
      chemin
    );

    // Image sur toute la page
    document.body.style.backgroundImage =
      'linear-gradient(rgba(0,0,0,0.28), rgba(0,0,0,0.28)), url("' +
      chemin +
      '")';

    document.body.style.backgroundSize =
      "cover";

    document.body.style.backgroundPosition =
      "center center";

    document.body.style.backgroundRepeat =
      "no-repeat";

    document.body.style.backgroundAttachment =
      "fixed";

    // On retire le fond gris de index.html
    document.body.style.backgroundColor =
      "transparent";
  };

  image.onerror = function () {

    console.error(
      "Impossible de charger le fond :",
      chemin
    );

    // Si le fichier ne fonctionne pas,
    // on essaie un autre fond.
    if (NOMBRE_DE_FONDS > 1) {
      changerFond();
    }
  };

  image.src = chemin;
}

// ==========================================
// FOND AU DÉMARRAGE
// ==========================================

window.addEventListener(
  "DOMContentLoaded",
  function () {
    changerFond();
  }
);

// ==========================================
// CHOIX DE LA PHOTO
// ==========================================

inputPhoto.addEventListener(
  "change",
  function () {

    const fichier =
      inputPhoto.files[0];

    if (!fichier) {
      return;
    }

    mimeType =
      fichier.type ||
