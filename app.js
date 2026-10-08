// ==========================================
// MON ASSISTANT VIDE-GRENIER
// Analyse + recherche de prix sur Internet
// ==========================================

// ⚠️ METS TA CLÉ API GEMINI ICI
const CLE_API = "AQ.Ab8RN6KtJ7pU6tpg8x4aofAvmA1x1RT9ma_mu1UUShzV_0AD6g";


// ==========================================
// CASCADE DES MODÈLES
// ==========================================

const MODELES = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite"
];


// ==========================================
// ÉLÉMENTS DE LA PAGE
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
// REQUÊTE AVEC TIMEOUT
// ==========================================

async function envoyerRequete(url, options, delai = 45000) {

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
// CONSIGNE PRINCIPALE
// ==========================================

const instructions = `

Tu es un expert français en brocante, antiquités,
objets de collection et vente entre particuliers.

Tu dois analyser la photographie puis rechercher sur Internet
des références de prix afin de produire une estimation réaliste.

==================================================
ÉTAPE 1 — IDENTIFICATION
==================================================

Identifie l'objet le plus précisément possible.

Cherche notamment :

- marque
- fabricant
- modèle
- référence
- numéro
- année
- époque
- matière
- dimensions éventuelles
- variante
- édition
- série
- pays
- caractéristiques particulières

Pour une monnaie :

- pays
- valeur faciale
- année
- type exact
- métal
- titre du métal si connu
- poids théorique
- variante éventuelle
- état apparent

Pour un jeu vidéo :

- plateforme
- titre exact
- édition
- région
- version
- présence éventuelle du manuel
- état

Pour un objet de marque :

- marque
- modèle
- référence
- version
- époque

NE PAS inventer une référence ou une caractéristique
qui n'est pas visible ou suffisamment certaine.

==================================================
ÉTAPE 2 — RECHERCHE INTERNET
==================================================

Une fois l'objet identifié, utilise la recherche Google disponible
pour trouver des références de prix réelles et récentes.

La recherche doit être adaptée à l'objet identifié.

Recherche en priorité :

- eBay France
- Delcampe
- Catawiki
- Etsy
- Rakuten
- sites spécialisés dans la catégorie de l'objet
- résultats de ventes aux enchères
- autres marketplaces pertinentes

Utilise plusieurs recherches différentes si nécessaire.

Par exemple :

"nom exact de l'objet vendu"

"nom exact de l'objet prix"

"nom exact de l'objet eBay"

"nom exact de l'objet vendu eBay"

"marque modèle prix occasion"

Adapte évidemment les recherches à l'objet réellement identifié.

==================================================
ÉTAPE 3 — COMPARAISON
==================================================

Compare les résultats trouvés.

PRIORITÉ ABSOLUE :

1. ventes réellement réalisées lorsque cette information
   est disponible ;
2. résultats d'enchères terminées ;
3. prix observés sur plusieurs marketplaces ;
4. annonces actuellement en vente seulement en dernier recours.

Ne considère PAS qu'un objet vaut le prix demandé
par un vendeur simplement parce qu'une annonce affiche
un prix élevé.

Écarte :

- les objets différents ;
- les variantes différentes ;
- les années différentes lorsque l'année a une importance ;
- les éditions différentes ;
- les lots lorsque nous cherchons le prix d'une unité ;
- les objets neufs lorsque notre objet est d'occasion ;
- les prix manifestement aberrants ;
- les annonces qui ne correspondent pas réellement
  à l'objet photographié.

Si seulement quelques références sont disponibles,
indique-le et réduis ta confiance dans l'estimation.

==================================================
ÉTAPE 4 — ESTIMATION
==================================================

Détermine ensuite une fourchette de prix réaliste
pour une vente entre particuliers en France.

Je veux savoir :

- combien je peux raisonnablement en demander ;
- combien l'objet peut réellement se vendre ;
- si l'objet est susceptible d'être négocié.

Ne donne PAS systématiquement une fourchette basse.

Si les références trouvées montrent qu'un objet se vend
40 à 50 €, indique 40-50 € même si ta connaissance générale
aurait donné une valeur inférieure.

Pour les objets en métal précieux :

prends également en compte la valeur intrinsèque du métal,
mais ne limite pas automatiquement le prix à cette valeur
si le marché collectionneur est supérieur.

Pour les objets rares ou recherchés :

la valeur de collection peut être nettement supérieure
à la valeur matérielle.

==================================================
ÉTAPE 5 — RECOMMANDATION EBAY
==================================================

Donne également un prix de mise en vente conseillé.

Ce prix doit permettre :

- une vente réaliste ;
- une petite marge de négociation ;
- d'éviter de sous-évaluer fortement l'objet.

==================================================
RÉPONSE
==================================================

Réponds UNIQUEMENT avec un JSON valide.

Aucun texte avant ou après le JSON.

Format obligatoire :

{
  "objet": "identification précise de l'objet",

  "titre_ebay": "titre optimisé pour eBay, maximum 80 caractères",

  "description_ebay": "description détaillée et honnête en français",

  "prix_estime": "fourchette réaliste de vente en euros",

  "prix_mise_en_vente": "prix conseillé pour commencer l'annonce",

  "justification_prix": "explication courte basée sur les comparables trouvés",

  "nombre_comparables": "nombre approximatif de références pertinentes trouvées",

  "comparables": [
    {
      "site": "nom du site",
      "description": "objet comparable",
      "prix": "prix observé",
      "type": "vente réalisée, enchère terminée ou annonce"
    }
  ]
}

IMPORTANT :

Le prix final doit être basé en priorité sur les références
de marché trouvées pendant cette recherche.

Ne donne jamais une estimation uniquement basée sur ta mémoire
si des références Internet pertinentes sont disponibles.
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


  let resultatFinal = null;
  let dernierErreur = null;
  let modeleUtilise = null;


  try {

    // ======================================
    // CASCADE DES MODÈLES
    // ======================================

    for (let i = 0; i < MODELES.length; i++) {

      const modele = MODELES[i];


      chargement.textContent =
        "🔎 Identification + recherche avec " +
        modele.replace("gemini-", "") +
        "…";


      console.log(
        "Tentative Gemini :",
        modele
      );


      const url =
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        modele +
        ":generateContent?key=" +
        encodeURIComponent(CLE_API);


      try {

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


              // ==================================
              // RECHERCHE GOOGLE
              // ==================================

              tools: [
                {
                  google_search: {}
                }
              ],


              generationConfig: {
                maxOutputTokens: 5000
              }

            })

          },

          45000

        );


        const donnees = await reponse.json();


        console.log(
          "Réponse Gemini " + modele + " :",
          donnees
        );


        // ==================================
        // RÉPONSE OK
        // ==================================

        if (reponse.ok) {

          if (
            !donnees.candidates ||
            !donnees.candidates[0] ||
            !donnees.candidates[0].content ||
            !donnees.candidates[0].content.parts
          ) {

            throw new Error(
              "Gemini a répondu sans résultat exploitable."
            );
          }


          const parties =
            donnees.candidates[0].content.parts;


          // Gemini peut retourner plusieurs parties
          // lorsque la recherche Google est utilisée.

          resultatFinal = parties
            .filter(function (partie) {
              return partie.text;
            })
            .map(function (partie) {
              return partie.text;
            })
            .join("\n");


          if (!resultatFinal) {

            throw new Error(
              "Gemini n'a renvoyé aucun texte exploitable."
            );
          }


          modeleUtilise = modele;


          console.log(
            "Réponse obtenue avec :",
            modele
          );


          break;
        }


        // ==================================
        // SERVEUR SATURÉ
        // ==================================

        if (
          reponse.status === 429 ||
          reponse.status === 500 ||
          reponse.status === 503
        ) {

          dernierErreur =
            donnees?.error?.message ||
            "Serveur momentanément indisponible.";


          console.warn(
            modele +
            " indisponible (" +
            reponse.status +
            "). Passage au suivant."
          );


          continue;
        }


        // ==================================
        // AUTHENTIFICATION
        // ==================================

        if (
          reponse.status === 401 ||
          reponse.status === 403
        ) {

          throw new Error(
            "Clé API refusée par Google (" +
            reponse.status +
            "). Vérifie ta clé API."
          );
        }


        // ==================================
        // AUTRE ERREUR
        // ==================================

        dernierErreur =
          donnees?.error?.message ||
          "Erreur Gemini " + reponse.status;


      } catch (erreurModele) {

        console.warn(
          "Erreur avec " + modele + " :",
          erreurModele
        );


        if (erreurModele.name === "AbortError") {

          dernierErreur =
            "Le modèle a dépassé 45 secondes.";

          continue;
        }


        if (
          erreurModele.message.includes("401") ||
          erreurModele.message.includes("403") ||
          erreurModele.message.includes("Clé API")
        ) {

          throw erreurModele;
        }


        dernierErreur =
          erreurModele.message;


        continue;
      }
    }


    // ======================================
    // AUCUNE RÉPONSE
    // ======================================

    if (!resultatFinal) {

      throw new Error(
        "Aucun modèle Gemini n'a pu répondre.\n\n" +
        "Dernière erreur : " +
        (dernierErreur || "inconnue")
      );
    }


    // ======================================
    // NETTOYAGE
    // ======================================

    let texteNettoye =
      resultatFinal.trim();


    // Retire les éventuelles balises Markdown.

    texteNettoye =
      texteNettoye
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();


    // ======================================
    // EXTRACTION DU JSON
    // ======================================

    let json;


    try {

      json = JSON.parse(texteNettoye);

    } catch (erreurJSON) {

      console.error(
        "JSON reçu :",
        resultatFinal
      );


      // Tentative de récupération si Gemini
      // a ajouté du texte autour du JSON.

      const debut =
        texteNettoye.indexOf("{");

      const fin =
        texteNettoye.lastIndexOf("}");


      if (debut !== -1 && fin !== -1) {

        try {

          json = JSON.parse(
            texteNettoye.substring(
              debut,
              fin + 1
            )
          );

        } catch (deuxiemeErreur) {

          throw new Error(
            "Gemini a répondu, mais son résultat n'est pas exploitable."
          );
        }

      } else {

        throw new Error(
          "Gemini a répondu, mais son résultat n'est pas exploitable."
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

      (json.prix_estime ||
        "Non disponible")

      + "\n\nPrix de mise en vente conseillé : " +

      (json.prix_mise_en_vente ||
        "Non disponible")

      + "\n\n" +

      (json.justification_prix ||
        "")

      + "\n\nComparables trouvés : " +

      (json.nombre_comparables ||
        "non précisé");


    resultat.style.display = "block";


    console.log(
      "Modèle utilisé :",
      modeleUtilise
    );


    console.log(
      "Comparables :",
      json.comparables
    );


  } catch (erreur) {

    console.error(
      "ERREUR FINALE :",
      erreur
    );


    alert(
      "L'analyse n'a pas pu aboutir.\n\n" +
      erreur.message
    );


  } finally {

    chargement.style.display = "none";

    boutonAnalyser.disabled = false;
  }

});
