// ==========================================
// MON ASSISTANT VIDE-GRENIER
// VERSION 100 % GRATUITE
// ==========================================

// ⚠️ METS TA CLÉ API ICI
const CLE_API = "AQ.Ab8RN6KtJ7pU6tpg8x4aofAvmA1x1RT9ma_mu1UUShzV_0AD6g";

// ==========================================
// UN SEUL MODÈLE
// ==========================================

// On utilise uniquement le modèle léger afin de limiter
// au maximum la consommation du quota gratuit.

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
// CHOIX DE LA PHOTO
// ==========================================

inputPhoto.addEventListener("change", function () {

  const fichier = inputPhoto.files[0];

  if (!fichier) {
    return;
  }

  mimeType = fichier.type || "image/jpeg";

  const lecteur = new FileReader();

  lecteur.onload = function (evenement) {

    const resultatLecture = evenement.target.result;

    preview.src = resultatLecture;
    preview.style.display = "block";

    imageBase64 = resultatLecture.split(",")[1];

    boutonAnalyser.disabled = false;
  };

  lecteur.onerror = function () {

    alert("Impossible de lire la photo.");

    imageBase64 = null;

    boutonAnalyser.disabled = true;
  };

  lecteur.readAsDataURL(fichier);
});

// ==========================================
// TIMEOUT
// ==========================================

async function envoyerRequete(url, options, delai = 60000) {

  const controleur = new AbortController();

  const timer = setTimeout(function () {
    controleur.abort();
  }, delai);

  try {

    return await fetch(url, {
      ...options,
      signal: controleur.signal
    });

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

NE transforme PAS automatiquement :

valeur du métal = prix de vente.

Un objet de collection peut valoir largement plus
que sa valeur matière.

Exemple :

si une monnaie contient 20 € d'argent mais que son marché
de collection la place autour de 40 €, l'estimation doit
être autour de 40 €, pas 20 €.

==================================================
5. COMPARABILITÉ
==================================================

Lorsque tu connais des prix de marché, privilégie les objets :

- même modèle
- même référence
- même année lorsque nécessaire
- même édition
- même version
- même plateforme
- même taille
- même matière
- même état
- même niveau de complétude

Ne compare pas des objets simplement parce qu'ils
se ressemblent.

==================================================
6. ÉTAT
==================================================

Estime l'état visible :

- neuf
- comme neuf
- très bon état
- bon état
- état correct
- usagé
- mauvais état

Mentionne les défauts visibles.

==================================================
7. FOURCHETTE
==================================================

Donne une fourchette réaliste.

Ne donne pas systématiquement une estimation basse.

Si un objet vaut probablement 40 à 50 €,
indique 40 à 50 €.

Ne cherche pas à être systématiquement prudent
en sous-évaluant l'objet.

==================================================
8. PRIX EBAY
==================================================

Donne également un prix de mise en vente conseillé.

Il peut être légèrement supérieur au prix de vente
probable afin de permettre une négociation.

Exemple :

vente probable : 40-45 €

mise en vente conseillée : 49,90 €

Mais ne gonfle pas artificiellement le prix.

==================================================
9. TITRE EBAY
==================================================

Crée un titre eBay précis.

Maximum 80 caractères.

Utilise les informations réellement identifiées.

==================================================
10. DESCRIPTION
==================================================

Rédige une description honnête et exploitable
directement pour une annonce eBay.

Décris :

- objet
- marque
- modèle
- référence
- caractéristiques
- état
- accessoires
- défauts visibles
- particularités

Ne prétends jamais qu'un objet est authentique,
rare ou complet si cela n'est pas suffisamment certain.

==================================================
11. CONFIANCE
==================================================

Indique :

- élevée
- moyenne
- faible

selon la précision de l'identification et la disponibilité
des informations de marché connues.

==================================================
RÉPONSE
==================================================

Réponds UNIQUEMENT avec ce JSON valide :

{
  "objet": "",
  "categorie": "",
  "caracteristiques": {
    "marque": "",
    "modele": "",
    "reference": "",
    "annee": "",
    "edition": "",
    "variante": "",
    "etat": "",
    "autres": ""
  },
  "titre_ebay": "",
  "description_ebay": "",
  "prix_estime": "",
  "prix_mise_en_vente": "",
  "niveau_confiance": "",
  "justification_prix": ""
}

Aucun texte avant ou après le JSON.

==================================================
RÈGLE FINALE
==================================================

Ne sous-évalue pas systématiquement les objets.

Ne pars pas automatiquement de la valeur des matériaux.

Ne donne pas automatiquement une petite fourchette.

Cherche à déterminer la valeur réelle de marché
la plus vraisemblable à partir de l'identification
précise de l'objet et de tes connaissances du marché.

`;

// ==========================================
// ANALYSE
// ==========================================

boutonAnalyser.addEventListener("click", async function () {

  if (!imageBase64) {

    alert("Prends d'abord une photo.");

    return;
  }

  chargement.style.display = "block";

  resultat.style.display = "none";

  boutonAnalyser.disabled = true;

  chargement.textContent =
    "🔎 Identification de l'objet…";

  try {

    // ======================================
    // URL GEMINI
    // ======================================

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      MODELE +
      ":generateContent?key=" +
      encodeURIComponent(CLE_API);

    // ======================================
    // APPEL UNIQUE
    // ======================================

    const reponse = await envoyerRequete(

      url,

      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          contents: [
            {
              parts: [

                {
                  text: instructions
                },

                {
                  inline_data: {
                    mime_type: mimeType,
                    data: imageBase64
                  }
                }

              ]
            }
          ],

          // =================================
          // IMPORTANT :
          // AUCUN GOOGLE SEARCH
          // AUCUN OUTIL PAYANT
          // =================================

          generationConfig: {

            responseMimeType:
              "application/json",

            maxOutputTokens: 3500,

            temperature: 0.15
          }

        })
      },

      60000
    );

    const donnees =
      await reponse.json();

    console.log(
      "Réponse Gemini :",
      donnees
    );

    // ======================================
    // QUOTA DÉPASSÉ
    // ======================================

    if (reponse.status === 429) {

      throw new Error(
        "Le quota gratuit Gemini est actuellement épuisé.\n\n" +
        "Aucune facturation n'a été déclenchée. " +
        "Réessaie lorsque le quota gratuit sera de nouveau disponible."
      );
    }

    // ======================================
    // CLÉ REFUSÉE
    // ======================================

    if (
      reponse.status === 401 ||
      reponse.status === 403
    ) {

      throw new Error(
        "La clé API Gemini est refusée (" +
        reponse.status +
        "). Vérifie la clé utilisée dans app.js."
      );
    }

    // ======================================
    // AUTRE ERREUR
    // ======================================

    if (!reponse.ok) {

      const message =
        donnees?.error?.message ||
        "Erreur Gemini " +
        reponse.status;

      throw new Error(message);
    }

    // ======================================
    // RÉCUPÉRATION DU TEXTE
    // ======================================

    if (
      !donnees.candidates ||
      !donnees.candidates[0] ||
      !donnees.candidates[0].content ||
      !donnees.candidates[0].content.parts
    ) {

      throw new Error(
        "Gemini n'a pas renvoyé de résultat exploitable."
      );
    }

    const parties =
      donnees.candidates[0].content.parts;

    let texte =
      parties
        .filter(function (partie) {
          return partie.text;
        })
        .map(function (partie) {
          return partie.text;
        })
        .join("\n")
        .trim();

    if (!texte) {

      throw new Error(
        "Gemini n'a renvoyé aucun résultat."
      );
    }

    // ======================================
    // NETTOYAGE
    // ======================================

    texte =
      texte
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    // ======================================
    // CONVERSION JSON
    // ======================================

    let json;

    try {

      json = JSON.parse(texte);

    } catch (erreurJSON) {

      console.error(
        "Réponse JSON reçue :",
        texte
      );

      const debut =
        texte.indexOf("{");

      const fin =
        texte.lastIndexOf("}");

      if (
        debut !== -1 &&
        fin > debut
      ) {

        try {

          json = JSON.parse(
            texte.substring(
              debut,
              fin + 1
            )
          );

        } catch (erreur2) {

          throw new Error(
            "La réponse de Gemini n'est pas exploitable."
          );
        }

      } else {

        throw new Error(
          "La réponse de Gemini n'est pas exploitable."
        );
      }
    }

    // ======================================
    // AFFICHAGE
    // ======================================

    document.getElementById("titre").value =
      json.titre_ebay ||
      "Non disponible";

    document.getElementById("description").value =
      json.description_ebay ||
      "Non disponible";

    document.getElementById("prix").value =

      "Estimation de vente : " +
      (
        json.prix_estime ||
        "Non disponible"
      ) +

      "\n\nPrix de mise en vente conseillé : " +
      (
        json.prix_mise_en_vente ||
        "Non disponible"
      ) +

      "\n\nNiveau de confiance : " +
      (
        json.niveau_confiance ||
        "Non précisé"
      ) +

      "\n\nJustification :\n" +
      (
        json.justification_prix ||
        "Non disponible"
      );

    resultat.style.display = "block";

    // ======================================
    // CONSOLE
    // ======================================

    console.log(
      "Objet identifié :",
      json.objet
    );

    console.log(
      "Catégorie :",
      json.categorie
    );

    console.log(
      "Prix estimé :",
      json.prix_estime
    );

    console.log(
      "Prix mise en vente :",
      json.prix_mise_en_vente
    );

  } catch (erreur) {

    console.error(
      "ERREUR :",
      erreur
    );

    alert(
      "L'analyse n'a pas pu aboutir.\n\n" +
      erreur.message
    );

  } finally {

    chargement.style.display =
      "none";

    boutonAnalyser.disabled =
      false;
  }
});
