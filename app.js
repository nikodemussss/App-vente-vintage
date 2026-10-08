// ==========================================
// ASSISTANT VIDE-GRENIER
// Analyse photo + estimation réaliste
// ==========================================

// Ta clé API Gemini
const CLE_API = "AQ.Ab8RN6KtJ7pU6tpg8x4aofAvmA1x1RT9ma_mu1UUShzV_0AD6g";

// Modèle Gemini
const MODELE = "gemini-3.6-flash";

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

    preview.src = resultatLecture;
    preview.style.display = "block";

    imageBase64 = resultatLecture.split(",")[1];

    typeImage = fichier.type || "image/jpeg";

    boutonAnalyser.disabled = false;
  };

  lecteur.readAsDataURL(fichier);
});


// ==========================================
// FONCTION D'ATTENTE
// ==========================================

function attendre(milliseconds) {

  return new Promise(function (resolve) {
    setTimeout(resolve, milliseconds);
  });

}


// ==========================================
// ANALYSE DE L'OBJET
// ==========================================

boutonAnalyser.addEventListener("click", async function () {

  if (!imageBase64) {
    return;
  }

  chargement.style.display = "block";
  resultat.style.display = "none";
  boutonAnalyser.disabled = true;

  chargement.textContent =
    "⏳ Identification de l'objet...";


  // ========================================
  // PROMPT EXPERT
  // ========================================

  const instructions = `

Tu es un expert professionnel en brocante, antiquités,
objets de collection, numismatique et vente d'occasion en France.

Ta mission est d'analyser précisément l'objet visible sur la photo
et de produire une estimation réaliste de son prix de vente.

IMPORTANT :

Ne donne jamais une estimation basée uniquement sur une impression
visuelle générale.

Tu dois d'abord identifier précisément l'objet.

Si l'objet est une monnaie, médaille ou pièce numismatique,
effectue une analyse spécifique.

Pour une monnaie, recherche mentalement et prends en compte :

- valeur faciale
- pays
- année
- atelier si identifiable
- métal
- titre du métal
- poids
- diamètre
- variante éventuelle
- rareté éventuelle
- état apparent
- valeur intrinsèque du métal
- prix habituel entre particuliers
- différence entre prix professionnel et prix de particulier

Pour les monnaies en métal précieux, tu dois impérativement
distinguer :

1. valeur du métal
2. valeur numismatique
3. prix réaliste de vente entre particuliers

Ne confonds jamais la valeur faciale historique avec la valeur
actuelle de la pièce.

Pour l'état, sois prudent.
Ne classe pas une pièce en excellent état si la photo ne permet
pas de le confirmer.

Si plusieurs niveaux de prix sont possibles selon l'état,
explique-le.

Pour les autres objets, prends en compte :

- marque
- modèle
- époque
- matériau
- fabrication
- rareté
- état
- demande des collectionneurs
- prix habituel sur le marché de l'occasion
- prix de vente réaliste en France

IMPORTANT POUR LE PRIX :

Je veux un PRIX DE VENTE RÉALISTE, pas un prix théorique
de catalogue et pas le prix maximal qu'un vendeur pourrait
afficher.

Si tu n'es pas certain de l'identification, indique clairement
le niveau d'incertitude et élargis la fourchette.

Si une caractéristique importante n'est pas visible sur la photo,
ne l'invente jamais.

Pour une pièce numismatique, si le prix dépend fortement de l'état,
donne une fourchette réaliste correspondant à l'état visible.

Réponds UNIQUEMENT avec un objet JSON valide.

Utilise exactement cette structure :

{
  "objet": "identification précise de l'objet",
  "titre_ebay": "titre optimisé pour eBay, maximum 80 caractères",
  "description_ebay": "description détaillée et honnête de l'objet",
  "prix_estime": "fourchette réaliste de prix de vente en euros",
  "justification_prix": "explication courte et précise de l'estimation"
}

`;


  // ========================================
  // TENTATIVES AUTOMATIQUES
  // ========================================

  let derniereErreur = null;

  for (
    let tentative = 1;
    tentative <= MAX_TENTATIVES;
    tentative++
  ) {

    try {

      if (tentative > 1) {

        const secondes =
          tentative === 2 ? 3 : 7;

        chargement.textContent =
          "🔄 Gemini est très sollicité. " +
          "Nouvelle tentative dans " +
          secondes +
          " secondes...";

        await attendre(secondes * 1000);
      }


      // ====================================
      // APPEL GEMINI
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
      // RÉPONSE GEMINI
      // ====================================

      const donnees = await reponse.json();


      // ====================================
      // ERREUR 503
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

        continue;
      }


      // ====================================
      // AUTRE ERREUR
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
      // CONVERSION JSON
      // ====================================

      let json;

      try {

        json = JSON.parse(texteNettoye);

      } catch (erreurJSON) {

        console.error(
          "Réponse Gemini :",
          texteReponse
        );

        throw new Error(
          "La réponse de Gemini n'est pas un JSON valide."
        );
      }


      // ====================================
      // AFFICHAGE
      // ====================================

      document.getElementById("titre").value =
        json.titre_ebay || "";

      document.getElementById("description").value =
        json.description_ebay || "";

      document.getElementById("prix").value =
        json.prix_estime || "";


      // ====================================
      // AJOUT DE LA JUSTIFICATION
      // ====================================

      const justification =
        json.justification_prix || "";

      if (justification) {

        document.getElementById("prix").value +=
          "\n\nJustification : " +
          justification;
      }


      resultat.style.display = "block";

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

      // Pour une erreur autre que 503,
      // on arrête immédiatement.
      if (
        !erreur.message.includes("sollicité") &&
        !erreur.message.includes("503")
      ) {
        break;
      }

    }

  }


  // ========================================
  // ÉCHEC FINAL
  // ========================================

  chargement.style.display = "none";
  boutonAnalyser.disabled = false;

  alert(
    "Impossible d'obtenir l'analyse.\n\n" +
    (derniereErreur
      ? derniereErreur.message
      : "Gemini est actuellement indisponible.")
  );

});
