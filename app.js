// ==========================================
// ASSISTANT VIDE-GRENIER - GEMINI
// ==========================================

// Mets ici ta nouvelle clé API Gemini
const CLE_API = "AQ.Ab8RN6KtJ7pU6tpg8x4aofAvmA1x1RT9ma_mu1UUShzV_0AD6g";

// Modèle Gemini utilisé
const MODELE = "gemini-3.8-flash";

// Nombre maximum de tentatives
const MAX_TENTATIVES = 3;


// ==========================================
// ÉLÉMENTS DE L'INTERFACE
// ==========================================

const inputPhoto = document.getElementById("photo");
const preview = document.getElementById("preview");
const boutonAnalyser = document.getElementById("analyser");
const chargement = document.getElementById("chargement");
const resultat = document.getElementById("resultat");

let imageBase64 = null;
let typeImage = "image/jpeg";


// ==========================================
// SÉLECTION DE LA PHOTO
// ==========================================

inputPhoto.addEventListener("change", function () {

  const fichier = inputPhoto.files[0];

  if (!fichier) {
    return;
  }

  const lecteur = new FileReader();

  lecteur.onload = function (evenement) {

    const resultatLecture = evenement.target.result;

    // Affichage de la photo
    preview.src = resultatLecture;
    preview.style.display = "block";

    // Extraction du Base64
    imageBase64 = resultatLecture.split(",")[1];

    // Conservation du véritable type d'image
    typeImage = fichier.type || "image/jpeg";

    // Activation du bouton
    boutonAnalyser.disabled = false;
  };

  lecteur.readAsDataURL(fichier);
});


// ==========================================
// ATTENTE ENTRE DEUX TENTATIVES
// ==========================================

function attendre(milliseconds) {

  return new Promise(function (resolve) {
    setTimeout(resolve, milliseconds);
  });

}


// ==========================================
// ANALYSE GEMINI
// ==========================================

boutonAnalyser.addEventListener("click", async function () {

  if (!imageBase64) {
    return;
  }

  chargement.style.display = "block";
  chargement.textContent = "⏳ Analyse en cours...";
  resultat.style.display = "none";
  boutonAnalyser.disabled = true;


  // ========================================
  // INSTRUCTIONS POUR GEMINI
  // ========================================

  const instructions =
    "Tu es un expert en objets anciens, objets de collection, brocante " +
    "et vente sur eBay en France. " +

    "Analyse attentivement la photo de l'objet. " +

    "Identifie l'objet, sa marque éventuelle, son époque, son modèle, " +
    "ses caractéristiques visibles et son état apparent. " +

    "Ne prétends pas connaître une information qui n'est pas visible. " +

    "Pour le prix, donne une estimation réaliste du prix de vente " +
    "d'occasion en France, et non un prix neuf ou un prix fantasmé. " +

    "Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant " +
    "ou après le JSON. " +

    "Utilise exactement cette structure : " +

    "{\"objet\":\"nom de l'objet identifié\"," +
    "\"titre_ebay\":\"titre optimisé pour une annonce eBay, 80 caractères maximum\"," +
    "\"description_ebay\":\"description détaillée et attractive pour l'annonce, en français\"," +
    "\"prix_estime\":\"fourchette réaliste en euros avec une courte justification\"}";


  // ========================================
  // TENTATIVES AUTOMATIQUES
  // ========================================

  let derniereErreur = null;

  for (let tentative = 1; tentative <= MAX_TENTATIVES; tentative++) {

    try {

      if (tentative > 1) {

        const secondes =
          tentative === 2 ? 3 : 7;

        chargement.textContent =
          "⏳ Gemini est très sollicité... nouvelle tentative dans " +
          secondes +
          " secondes (" +
          tentative +
          "/" +
          MAX_TENTATIVES +
          ")";

        await attendre(secondes * 1000);
      }


      chargement.textContent =
        tentative === 1
          ? "⏳ Analyse en cours..."
          : "🔄 Nouvelle tentative avec Gemini...";


      // ====================================
      // APPEL À GEMINI
      // ====================================

      const reponse = await fetch(

        "https://generativelanguage.googleapis.com/v1beta/models/" +
        MODELE +
        ":generateContent?key=" +
        CLE_API,

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
                      mime_type: typeImage,
                      data: imageBase64
                    }
                  }

                ]
              }

            ]

          })
        }

      );


      // ====================================
      // LECTURE DE LA RÉPONSE
      // ====================================

      const donnees = await reponse.json();


      // ====================================
      // SERVEUR GEMINI INDISPONIBLE
      // ====================================

      if (reponse.status === 503) {

        derniereErreur =
          new Error(
            "Gemini est temporairement très sollicité."
          );

        console.warn(
          "Gemini 503 - tentative " +
          tentative +
          "/" +
          MAX_TENTATIVES
        );

        // On recommence automatiquement
        continue;
      }


      // ====================================
      // AUTRE ERREUR API
      // ====================================

      if (!reponse.ok) {

        console.error(
          "Erreur Gemini :",
          donnees
        );

        const message =
          donnees?.error?.message ||
          "Gemini a refusé la requête.";

        throw new Error(message);
      }


      // ====================================
      // VÉRIFICATION DE LA RÉPONSE
      // ====================================

      if (
        !donnees.candidates ||
        !donnees.candidates[0] ||
        !donnees.candidates[0].content ||
        !donnees.candidates[0].content.parts ||
        !donnees.candidates[0].content.parts[0] ||
        !donnees.candidates[0].content.parts[0].text
      ) {

        console.error(
          "Réponse inattendue de Gemini :",
          donnees
        );

        throw new Error(
          "Gemini n'a pas renvoyé de résultat exploitable."
        );
      }


      // ====================================
      // RÉCUPÉRATION DU TEXTE
      // ====================================

      const texteReponse =
        donnees.candidates[0]
          .content
          .parts[0]
          .text;


      // ====================================
      // NETTOYAGE DU JSON
      // ====================================

      const texteNettoye =
        texteReponse
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();


      // ====================================
      // CONVERSION EN JSON
      // ====================================

      let json;

      try {

        json = JSON.parse(texteNettoye);

      } catch (erreurJSON) {

        console.error(
          "Réponse reçue de Gemini :",
          texteReponse
        );

        throw new Error(
          "Gemini a répondu, mais sa réponse n'est pas dans le format attendu."
        );
      }


      // ====================================
      // AFFICHAGE DU RÉSULTAT
      // ====================================

      document.getElementById("titre").value =
        json.titre_ebay || "";

      document.getElementById("description").value =
        json.description_ebay || "";

      document.getElementById("prix").value =
        json.prix_estime || "";

      resultat.style.display = "block";


      // ====================================
      // SUCCÈS
      // ====================================

      chargement.style.display = "none";
      boutonAnalyser.disabled = false;

      return;


    } catch (erreur) {

      console.error(
        "Erreur tentative " +
        tentative +
        ":",
        erreur
      );

      derniereErreur = erreur;

      // Si ce n'est pas une erreur 503,
      // inutile de recommencer automatiquement.
      if (
        !erreur.message.includes("sollicité") &&
        !erreur.message.includes("503")
      ) {
        break;
      }

    }

  }


  // ========================================
  // TOUTES LES TENTATIVES ONT ÉCHOUÉ
  // ========================================

  chargement.style.display = "none";
  boutonAnalyser.disabled = false;


  if (derniereErreur) {

    alert(
      "Gemini est actuellement indisponible.\n\n" +
      "L'application a essayé automatiquement " +
      MAX_TENTATIVES +
      " fois.\n\n" +
      "Détail : " +
      derniereErreur.message
    );

  } else {

    alert(
      "Impossible d'obtenir une réponse de Gemini."
    );
  }

});
