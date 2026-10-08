// ==========================================
// MON ASSISTANT VIDE-GRENIER
// ==========================================

// ⚠️ METS TA CLÉ API GEMINI ENTRE LES GUILLEMETS
const CLE_API = "AQ.Ab8RN6KtJ7pU6tpg8x4aofAvmA1x1RT9ma_mu1UUShzV_0AD6g";

// Modèles essayés automatiquement, du plus puissant au plus léger
const MODELES = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite"
];

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
// REQUÊTE AVEC DÉLAI MAXIMUM
// ==========================================

async function envoyerRequete(url, options, delai = 30000) {

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
// INSTRUCTIONS POUR GEMINI
// ==========================================

const instructions = `
Tu es un expert français en brocante, objets anciens,
objets de collection, numismatique et vente sur eBay.

Analyse attentivement la photographie.

IDENTIFICATION :

Identifie l'objet le plus précisément possible.

Pour une monnaie, indique notamment :
- pays
- valeur faciale
- année
- type exact
- métal
- titre du métal si connu
- poids théorique si connu
- particularités
- état apparent

Pour les autres objets :
- marque
- modèle
- référence
- époque
- matière
- caractéristiques visibles
- état apparent

NE PAS INVENTER une information qui n'est pas visible
ou suffisamment certaine.

PRIX :

Donne une estimation réaliste du prix auquel un particulier
pourrait réellement vendre cet objet en France.

Ne prends pas simplement comme référence les prix demandés
dans des annonces très élevées.

Pour une monnaie en métal précieux, prends en compte :
- le poids
- le titre du métal
- la valeur intrinsèque du métal
- l'année
- la rareté éventuelle
- la demande des collectionneurs
- l'état apparent

Le prix doit correspondre à une vente réaliste entre particuliers.

Réponds UNIQUEMENT avec un JSON valide.
Aucun texte avant ou après le JSON.

Format obligatoire :

{
  "objet": "identification précise",
  "titre_ebay": "titre eBay de 80 caractères maximum",
  "description_ebay": "description détaillée en français",
  "prix_estime": "fourchette réaliste en euros",
  "justification_prix": "courte justification du prix"
}
`;


// ==========================================
// ANALYSE DE LA PHOTO
// ==========================================

boutonAnalyser.addEventListener("click", async function () {

  if (!imageBase64) {

    alert("Prends d'abord une photo.");

    return;
  }


  chargement.style.display = "block";
  resultat.style.display = "none";
  boutonAnalyser.disabled = true;


  let dernierErreur = null;
  let resultatFinal = null;


  try {

    // ======================================
    // ESSAI DES MODÈLES UN PAR UN
    // ======================================

    for (let i = 0; i < MODELES.length; i++) {

      const modele = MODELES[i];

      chargement.textContent =
        "🔎 Analyse avec Gemini " +
        modele.replace("gemini-", "") +
        "…";


      console.log(
        "Tentative avec le modèle :",
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

              generationConfig: {
                maxOutputTokens: 2000
              }

            })
          },
          30000
        );


        const donnees = await reponse.json();


        console.log(
          "Réponse Gemini " + modele + " :",
          donnees
        );


        // ==================================
        // MODÈLE DISPONIBLE
        // ==================================

        if (reponse.ok) {

          if (
            !donnees.candidates ||
            !donnees.candidates[0] ||
            !donnees.candidates[0].content ||
            !donnees.candidates[0].content.parts ||
            !donnees.candidates[0].content.parts[0]
          ) {

            throw new Error(
              "Gemini a répondu sans résultat exploitable."
            );
          }


          resultatFinal =
            donnees.candidates[0]
              .content
              .parts[0]
              .text;


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
          reponse.status === 503 ||
          reponse.status === 429 ||
          reponse.status === 500
        ) {

          dernierErreur =
            donnees?.error?.message ||
            "Serveur momentanément indisponible.";

          console.warn(
            modele +
            " indisponible (" +
            reponse.status +
            "). Passage au modèle suivant."
          );


          continue;
        }


        // ==================================
        // CLÉ API INCORRECTE
        // ==================================

        if (
          reponse.status === 401 ||
          reponse.status === 403
        ) {

          throw new Error(
            "Clé API refusée par Google (" +
            reponse.status +
            "). Vérifie ta clé API Gemini."
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


        // Timeout : on passe au modèle suivant
        if (erreurModele.name === "AbortError") {

          dernierErreur =
            "Le modèle a dépassé le délai de réponse.";

          continue;
        }


        // Erreur d'authentification :
        // inutile d'essayer les autres modèles.
        if (
          erreurModele.message.includes("401") ||
          erreurModele.message.includes("403") ||
          erreurModele.message.includes("Clé API")
        ) {

          throw erreurModele;
        }


        dernierErreur = erreurModele.message;

        continue;
      }
    }


    // ======================================
    // AUCUN MODÈLE N'A RÉPONDU
    // ======================================

    if (!resultatFinal) {

      throw new Error(
        "Aucun modèle Gemini n'a pu répondre.\n\n" +
        "Les serveurs sont probablement momentanément saturés.\n\n" +
        "Dernière erreur : " +
        (dernierErreur || "inconnue")
      );
    }


    // ======================================
    // NETTOYAGE DU JSON
    // ======================================

    let texteNettoye =
      resultatFinal.trim();


    texteNettoye =
      texteNettoye
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();


    let json;


    try {

      json = JSON.parse(texteNettoye);

    } catch (erreurJSON) {

      console.error(
        "Réponse reçue mais JSON incorrect :",
        resultatFinal
      );

      throw new Error(
        "Gemini a répondu, mais son résultat n'est pas exploitable."
      );
    }


    // ======================================
    // AFFICHAGE DES RÉSULTATS
    // ======================================

    document.getElementById("titre").value =
      json.titre_ebay ||
      "Non disponible";


    document.getElementById("description").value =
      json.description_ebay ||
      "Non disponible";


    document.getElementById("prix").value =
      (json.prix_estime || "Non disponible") +
      "\n\n" +
      (json.justification_prix || "");


    resultat.style.display = "block";


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
