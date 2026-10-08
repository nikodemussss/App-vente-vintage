// ==========================================
// MON ASSISTANT VIDE-GRENIER
// VERSION 100 % GRATUITE
// AVEC FONDS BROCANTE ALÉATOIRES
// ==========================================

// ⚠️ METS TA CLÉ API ICI
const CLE_API = "AQ.Ab8RN6KtJ7pU6tpg8x4aofAvmA1x1RT9ma_mu1UUShzV_0AD6g";

// ==========================================
// UN SEUL MODÈLE
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
// FOND BROCANTE ALÉATOIRE
// ==========================================

let dernierFond = 0;

function changerFond() {

  let numero;

  // Choisit un numéro entre 1 et 36
  // en évitant de reprendre immédiatement
  // le même fond
  do {
    numero = Math.floor(Math.random() * 36) + 1;
  } while (numero === dernierFond);

  dernierFond = numero;

  // Transforme 1 en 01, 2 en 02, etc.
  const numeroFormate =
    String(numero).padStart(2, "0");

  // Chemin exact de l'image
  const chemin =
    "fonds/brocante (" +
    numeroFormate +
    ").jpg";

  // Fond de la page avec un léger voile sombre
  document.documentElement.style.backgroundImage =
    'linear-gradient(rgba(0,0,0,0.30), rgba(0,0,0,0.30)), url("' +
    chemin +
    '")';

  document.documentElement.style.backgroundSize =
    "cover";

  document.documentElement.style.backgroundPosition =
    "center";

  document.documentElement.style.backgroundAttachment =
    "fixed";

  document.documentElement.style.backgroundRepeat =
    "no-repeat";

  // Rend le fond blanc de l'application légèrement transparent
  // afin de laisser apparaître l'image derrière.
  document.body.style.backgroundColor =
    "rgba(255,255,255,0.82)";
}

// ==========================================
// PREMIER FOND AU DÉMARRAGE
// ==========================================

changerFond();

// ==========================================
// CHOIX DE LA PHOTO
// ==========================================

inputPhoto.addEventListener("change", function () {

  const fichier = inputPhoto.files[0];

  if (!fichier) return;

  mimeType =
    fichier.type || "image/jpeg";

  const lecteur = new FileReader();

  lecteur.onload = function (evenement) {

    const resultatLecture =
      evenement.target.result;

    preview.src =
      resultatLecture;

    preview.style.display =
      "block";

    imageBase64 =
      resultatLecture.split(",")[1];

    boutonAnalyser.disabled =
      false;
  };

  lecteur.onerror = function () {

    alert(
      "Impossible de lire la photo."
    );

    imageBase64 =
      null;

    boutonAnalyser.disabled =
      true;
  };

  lecteur.readAsDataURL(fichier);
});

// ==========================================
// TIMEOUT
// ==========================================

async function envoyerRequete(
  url,
  options,
  delai = 60000
) {

  const controleur =
    new AbortController();

  const timer =
    setTimeout(function () {

      controleur.abort();

    }, delai);

  try {

    return await fetch(
      url,
      {
        ...options,
        signal:
          controleur.signal
      }
    );

  } finally {

    clearTimeout(timer);
  }
}

// ==========================================
// INSTRUCTIONS GEMINI
// ==========================================

const instructions = `

Tu es l'assistant expert de "Mon Assistant Vide-Grenier".

Ta mission est d'analyser une photographie d'un objet
destiné à être vendu entre particuliers.

Tu dois être particulièrement bon pour :

- brocante
- antiquités
- objets anciens
- objets de collection
- monnaies
- bijoux
- montres
- livres
- BD
- mangas
- jeux vidéo
- jouets
- figurines
- objets publicitaires
- vaisselle
- décoration
- mobilier
- électronique
- outils
- objets de marque
- objets vintage
- objets du quotidien
- et tout autre objet identifiable.

==================================================
1. IDENTIFICATION
==================================================

Identifie l'objet le plus précisément possible.

Recherche visuellement :

- marque
- fabricant
- modèle
- référence
- numéro
- inscription
- logo
- année
- époque
- édition
- version
- variante
- matière
- couleur
- forme
- particularités
- accessoires
- emballage
- état
- défauts visibles

NE JAMAIS inventer une information.

Si une information n'est pas certaine,
indique qu'elle est inconnue.

==================================================
2. CARACTÉRISTIQUES ADAPTÉES
==================================================

Les caractéristiques importantes dépendent de l'objet.

Pour une monnaie :

- pays
- valeur faciale
- année
- type
- atelier
- variante
- diamètre
- poids
- métal
- titre
- état

Pour un jeu vidéo :

- plateforme
- titre
- édition
- région
- version
- boîte
- manuel
- accessoires
- état du disque

Pour un livre :

- auteur
- titre
- édition
- éditeur
- année
- ISBN
- reliure
- jaquette
- état

Pour un bijou :

- marque
- métal
- poinçon
- pierres
- poids si identifiable
- modèle
- époque
- état

Pour un objet électronique :

- marque
- modèle
- référence
- génération
- accessoires
- état apparent

Pour tout autre objet :

détermine toi-même les caractéristiques importantes
pour identifier correctement le produit et estimer sa valeur.

==================================================
3. ESTIMATION DU MARCHÉ
==================================================

L'objectif n'est PAS de donner une cote théorique.

L'objectif est d'estimer :

"Combien cet objet pourrait raisonnablement se vendre
entre particuliers en France ?"

Privilégie toujours :

1. prix de vente réellement observés lorsque tu en as
connaissance ;

2. prix historiques connus ;

3. prix généralement pratiqués sur le marché de l'occasion ;

4. cote spécialisée lorsqu'elle est pertinente ;

5. valeur des matériaux uniquement comme information
secondaire.

NE CONFONDS JAMAIS :

prix demandé par un vendeur

avec

prix auquel l'objet se vend réellement.

==================================================
4. VALEUR DES MATIÈRES
==================================================

Pour l'or, l'argent ou d'autres matières précieuses :

la valeur du matériau est seulement un élément.

NE transforme PAS
