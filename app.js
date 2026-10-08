// Ta cle API Gemini - a remplacer par la tienne
const CLE_API = "AQ.Ab8RN6JQXytS7hWLUib7lM5gPOo9c5K0sV3qQkewnjmlFanNuw";

const inputPhoto = document.getElementById("photo");
const preview = document.getElementById("preview");
const boutonAnalyser = document.getElementById("analyser");
const chargement = document.getElementById("chargement");
const resultat = document.getElementById("resultat");

let imageBase64 = null;

inputPhoto.addEventListener("change", function () {
  const fichier = inputPhoto.files[0];
  if (!fichier) return;

  const lecteur = new FileReader();
  lecteur.onload = function (evenement) {
    const resultatLecture = evenement.target.result;
    preview.src = resultatLecture;
    preview.style.display = "block";
    imageBase64 = resultatLecture.split(",")[1];
    boutonAnalyser.disabled = false;
  };
  lecteur.readAsDataURL(fichier);
});

boutonAnalyser.addEventListener("click", async function () {
  if (!imageBase64) return;

  chargement.style.display = "block";
  resultat.style.display = "none";
  boutonAnalyser.disabled = true;

  const instructions = "Tu es un expert en objets de collection et en vente sur eBay. Analyse cette photo et reponds UNIQUEMENT avec un objet JSON valide, sans aucun texte autour, au format exact suivant : {\"objet\": \"nom de l'objet identifie\", \"titre_ebay\": \"titre optimise pour une annonce eBay, 80 caracteres maximum\", \"description_ebay\": \"description detaillee et attractive pour l'annonce, en francais\", \"prix_estime\": \"une fourchette de prix en euros, par exemple 15-25 EUR, avec une courte justification\"}";

  try {
    const reponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + CLE_API,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: instructions },
                { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
              ]
            }
          ]
        })
      }
    );

    const donnees = await reponse.json();
    const texteReponse = donnees.candidates[0].content.parts[0].text;

    const texteNettoye = texteReponse.replace(/json|`/g, "").trim();
    const json = JSON.parse(texteNettoye);

    document.getElementById("titre").value = json.titre_ebay;
    document.getElementById("description").value = json.description_ebay;
    document.getElementById("prix").value = json.prix_estime;

    resultat.style.display = "block";
  } catch (erreur) {
    alert("Une erreur s'est produite. Verifie ta cle API et reessaie. Detail : " + erreur.message);
    console.error(erreur);
  } finally {
    chargement.style.display = "none";
    boutonAnalyser.disabled = false;
  }
});
```
