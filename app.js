// ================================
// MON ASSISTANT VIDE-GRENIER
// ================================

// ⚠️ Mets ici TA clé API Gemini
const CLE_API = "AQ.Ab8RN6KtJ7pU6tpg8x4aofAvmA1x1RT9ma_mu1UUShzV_0AD6g";

// Modèle Gemini stable
const MODELE = "gemini-3.6-flash";

const inputPhoto = document.getElementById("photo");
const preview = document.getElementById("preview");
const boutonAnalyser = document.getElementById("analyser");
const chargement = document.getElementById("chargement");
const resultat = document.getElementById("resultat");

let imageBase64 = null;
let mimeType = "image/jpeg";


// ================================
// SÉLECTION DE LA PHOTO
// ================================

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


// ================================
// FONCTION AVEC DÉLAI MAXIMUM
// ================================

async function fetchAvecTimeout(url, options, delai = 30000) {

  const controleur = new AbortController();

  const timer = setTimeout(function () {
    controleur.abort();
  }, delai);

  try {

    const reponse = await fetch(url, {
      ...options,
      signal: controleur.signal
    });

    return reponse;

  } finally {

    clearTimeout(timer);
  }
}


// ================================
// ANALYSE
// ================================

boutonAnalyser.addEventListener("click", async function () {

  if (!imageBase64) {
    alert("Prends d'abord une photo.");
    return;
  }

  chargement.style.display = "block";
  chargement.textContent = "🔎 Identification de l'objet…";

  resultat.style.display = "none";
  boutonAnalyser.disabled = true;

  const instructions = `
Tu es un expert français en brocante, objets anciens, collection et vente sur eBay.

Analyse attentivement la photo.

TON PREMIER OBJECTIF EST D'IDENTIFIER L'OBJET LE PLUS PRÉCISÉMENT POSSIBLE.

Pour une monnaie :
- pays
- valeur faciale
- année
- type exact
- métal
- poids si le type est connu
- particularités visibles
- état apparent
- ne confonds jamais une monnaie en argent avec une monnaie courante similaire.

Pour les autres objets :
- marque
- modèle
- époque
- matière
- référence
- caractéristiques visibles
- état apparent.

NE DEVINE PAS une information qui n'est pas visible ou suffisamment certaine.

Pour le prix, donne une estimation réaliste du prix auquel un particulier peut réellement vendre l'objet en France.
Ne prends pas comme référence les annonces actuellement en vente à des prix fantaisistes.
Ne confonds pas prix demandé et prix réellement obtenu.

Pour les monnaies en métal précieux :
- tiens compte de la valeur du métal,
- du titre du métal,
- du poids,
- de l'année,
- de la demande des collectionneurs,
- et de l'état apparent.

Si l'identification est incertaine, indique-le clairement.

Réponds UNIQUEMENT avec un JSON valide.
Aucun texte avant ou après le JSON.

Format obligatoire :

{
  "objet": "identification précise de l'objet",
  "titre_ebay": "titre optimisé pour eBay, maximum 80 caractères",
  "description_ebay": "description claire et attractive en français",
  "prix_estime": "fourchette réaliste en euros",
  "justification_prix": "courte explication de l'estimation"
}
`;


  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    MODELE +
    ":generateContent";


  try {

    chargement.textContent = "🔎 Identification de l'objet…";


    const reponse = await fetchAvecTimeout(
      url,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": CLE_API
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
            temperature: 0.2,
            maxOutputTokens: 2000
          }

        })
      },
      30000
    );


    // ================================
    // LECTURE DE LA RÉPONSE
    // ================================

    const donnees = await reponse.json();


    console.log("Réponse Gemini :", donnees);


    if (!reponse.ok) {

      const message =
        donnees?.error?.message ||
        "Erreur inconnue de Gemini.";

      throw new Error(
        "Gemini " +
        reponse.status +
        " : " +
        message
      );
    }


    if (
      !donnees.candidates ||
      !donnees.candidates[0] ||
      !donnees.candidates[0].content ||
      !donnees.candidates[0].content.parts ||
      !donnees.candidates[0].content.parts[0]
    ) {

      throw new Error(
        "Gemini a répondu, mais sans résultat exploitable."
      );
    }


    const texteReponse =
      donnees.candidates[0].content.parts[0].text;


    console.log("Texte Gemini :", texteReponse);


    // ================================
    // NETTOYAGE DU JSON
    // ================================

    let texteNettoye = texteReponse.trim();

    // Retire les éventuelles balises ```json
    texteNettoye = texteNettoye
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();


    let json;

    try {

      json = JSON.parse(texteNettoye);

    } catch (erreurJSON) {

      console.error(
        "JSON reçu impossible à lire :",
        texteReponse
      );

      throw new Error(
        "Gemini a répondu, mais le résultat n'est pas dans le bon format."
      );
    }


    // ================================
    // AFFICHAGE
    // ================================

    document.getElementById("titre").value =
      json.titre_ebay || "Non disponible";


    document.getElementById("description").value =
      json.description_ebay || "Non disponible";


    document.getElementById("prix").value =
      (json.prix_estime || "Non disponible") +
      "\n\n" +
      (json.justification_prix || "");


    resultat.style.display = "block";


  } catch (erreur) {

    console.error("Erreur complète :", erreur);


    if (erreur.name === "AbortError") {

      alert(
        "Gemini n'a pas répondu dans les 30 secondes.\n\n" +
        "Le serveur est probablement très chargé. " +
        "Réessaie dans quelques instants."
      );

    } else {

      alert(
        "L'analyse n'a pas pu aboutir.\n\n" +
        erreur.message
      );
    }


  } finally {

    chargement.style.display = "none";
    boutonAnalyser.disabled = false;
  }

});
