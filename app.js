// Ta clé API Gemini
const CLE_API = "AQ.Ab8RN6JENVNHJwmJfgi92AoLPMudiokHW-7IEVOmh9wqT-UA2g";

const inputPhoto = document.getElementById("photo");
const preview = document.getElementById("preview");
const boutonAnalyser = document.getElementById("analyser");
const chargement = document.getElementById("chargement");
const resultat = document.getElementById("resultat");

let imageBase64 = null;
let typeImage = "image/jpeg";

inputPhoto.addEventListener("change", function () {
  const fichier = inputPhoto.files[0];

  if (!fichier) return;

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

boutonAnalyser.addEventListener("click", async function () {
  if (!imageBase64) return;

  chargement.style.display = "block";
  resultat.style.display = "none";
  boutonAnalyser.disabled = true;

  const instructions =
    "Tu es un expert en objets de collection et en vente sur eBay. " +
    "Analyse cette photo et réponds UNIQUEMENT avec un objet JSON valide, " +
    "sans aucun texte autour, au format exact suivant : " +
    "{\"objet\":\"nom de l'objet identifié\"," +
    "\"titre_ebay\":\"titre optimisé pour une annonce eBay, 80 caractères maximum\"," +
    "\"description_ebay\":\"description détaillée et attractive pour l'annonce, en français\"," +
    "\"prix_estime\":\"une fourchette de prix en euros, par exemple 15-25 EUR, avec une courte justification\"}";

  try {
    const reponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
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

    const donnees = await reponse.json();

    // Vérification de la réponse de Gemini
    if (!reponse.ok) {
      console.error("Erreur Gemini :", donnees);

      const message =
        donnees?.error?.message ||
        "Gemini a refusé la requête.";

      throw new Error(message);
    }

    if (
      !donnees.candidates ||
      !donnees.candidates[0] ||
      !donnees.candidates[0].content ||
      !donnees.candidates[0].content.parts ||
      !donnees.candidates[0].content.parts[0]
    ) {
      console.error("Réponse inattendue de Gemini :", donnees);

      throw new Error(
        "Gemini n'a pas renvoyé de résultat exploitable."
      );
    }

    const texteReponse =
      donnees.candidates[0].content.parts[0].text;

    const texteNettoye = texteReponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const json = JSON.parse(texteNettoye);

    document.getElementById("titre").value =
      json.titre_ebay || "";

    document.getElementById("description").value =
      json.description_ebay || "";

    document.getElementById("prix").value =
      json.prix_estime || "";

    resultat.style.display = "block";

  } catch (erreur) {

    console.error(erreur);

    alert(
      "Une erreur s'est produite :\n\n" +
      erreur.message
    );

  } finally {

    chargement.style.display = "none";
    boutonAnalyser.disabled = false;
  }
});
