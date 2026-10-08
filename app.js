// ============================================================
// MON ASSISTANT VIDE-GRENIER
// ============================================================

// ------------------------------------------------------------
// CONFIGURATION GEMINI
// ------------------------------------------------------------

const CLE_API = "AQ.Ab8RN6KtJ7pU6tpg8x4aofAvmA1x1RT9ma_mu1UUShzV_0AD6g";
const MODELE = "gemini-3.5-flash-lite";


// ------------------------------------------------------------
// ELEMENTS DE LA PAGE
// ------------------------------------------------------------

const inputPhoto = document.getElementById("photo");
const preview = document.getElementById("preview");
const boutonAnalyser = document.getElementById("analyser");
const chargement = document.getElementById("chargement");
const resultat = document.getElementById("resultat");
const champTitre = document.getElementById("titre");
const champDescription = document.getElementById("description");
const champPrix = document.getElementById("prix");


// ------------------------------------------------------------
// FONDS D'ECRAN
// ------------------------------------------------------------

const NOMBRE_DE_FONDS = 36;
let dernierFond = 0;

function changerFond() {
    try {
        let numero;

        // Evite de remettre immédiatement la même image
        do {
            numero = Math.floor(Math.random() * NOMBRE_DE_FONDS) + 1;
        } while (numero === dernierFond && NOMBRE_DE_FONDS > 1);

        dernierFond = numero;

        const numeroFormate = String(numero).padStart(2, "0");

        // Encodage du nom du fichier pour gérer correctement
        // les espaces et les parenthèses
        const nomFichier = `brocante (${numeroFormate}).jpg`;
        const chemin = "./fonds/" + encodeURIComponent(nomFichier);

        console.log("Fond sélectionné :", chemin);

        const imageFond = new Image();

        imageFond.onload = function () {
            console.log("Fond chargé :", chemin);

            // On applique le fond uniquement lorsque
            // l'image est réellement disponible.
            document.body.style.background =
                'linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.25)), url("' +
                chemin +
                '") center center / cover no-repeat fixed';

            document.body.style.backgroundColor = "transparent";
        };

        // IMPORTANT :
        // Si le fond ne fonctionne pas, on ne bloque RIEN d'autre.
        imageFond.onerror = function () {
            console.warn("Fond introuvable :", chemin);
        };

        imageFond.src = chemin;

    } catch (erreur) {
        console.warn("Erreur avec le fond d'écran :", erreur);
    }
}


// ------------------------------------------------------------
// CHANGEMENT DE FOND AU CHARGEMENT
// ------------------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
    changerFond();
});


// ------------------------------------------------------------
// PHOTO
// ------------------------------------------------------------

inputPhoto.addEventListener("change", function () {

    const fichier = inputPhoto.files[0];

    if (!fichier) {
        return;
    }

    console.log("Photo sélectionnée :", fichier.name);

    // Affichage de l'aperçu
    const lecteur = new FileReader();

    lecteur.onload = function (event) {
        preview.src = event.target.result;
        preview.style.display = "block";
    };

    lecteur.readAsDataURL(fichier);

    // Activation du bouton d'analyse
    boutonAnalyser.disabled = false;

    // Masque les anciens résultats
    resultat.style.display = "none";

    champTitre.value = "";
    champDescription.value = "";
    champPrix.value = "";
});


// ------------------------------------------------------------
// ANALYSE
// ------------------------------------------------------------

boutonAnalyser.addEventListener("click", async function () {

    const fichier = inputPhoto.files[0];

    if (!fichier) {
        alert("Prends d'abord une photo de l'objet.");
        return;
    }

    if (!CLE_API || CLE_API === "TA_CLE_API_ICI") {
        alert("La clé API Gemini n'est pas renseignée dans app.js.");
        return;
    }

    boutonAnalyser.disabled = true;
    chargement.style.display = "block";
    resultat.style.display = "none";

    // Change également le fond lors d'une nouvelle analyse
    changerFond();

    try {

        // ----------------------------------------------------
        // CONVERSION DE LA PHOTO
        // ----------------------------------------------------

        const base64Image = await convertirImageEnBase64(fichier);

        // ----------------------------------------------------
        // PROMPT
        // ----------------------------------------------------

        const prompt = `
Tu es un expert français de la brocante, des objets d'occasion
et de la vente sur eBay France.

Analyse attentivement la photo de l'objet.

Identifie si possible :
- la nature exacte de l'objet
- la marque
- le modèle
- la période ou l'année approximative
- les inscriptions visibles
- les caractéristiques particulières
- l'état apparent

Pour l'estimation du prix, donne une estimation réaliste
du prix de vente entre particuliers en France.

Ne donne pas un prix neuf.
Ne donne pas un prix théorique maximal.
Privilégie un prix réaliste de vente.

Réponds UNIQUEMENT avec ce format :

TITRE:
[un titre eBay clair et vendeur]

DESCRIPTION:
[une description complète et honnête de l'objet]

PRIX:
[prix conseillé en euros + éventuellement une fourchette]

Si une information n'est pas visible sur la photo,
ne l'invente pas.
`;

        // ----------------------------------------------------
        // APPEL GEMINI
        // ----------------------------------------------------

        const url =
            "https://generativelanguage.googleapis.com/v1beta/models/" +
            MODELE +
            ":generateContent?key=" +
            encodeURIComponent(CLE_API);

        const reponse = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            },
                            {
                                inline_data: {
                                    mime_type: fichier.type,
                                    data: base64Image
                                }
                            }
                        ]
                    }
                ]
            })
        });

        // ----------------------------------------------------
        // GESTION DES ERREURS GEMINI
        // ----------------------------------------------------

        if (!reponse.ok) {

            const texteErreur = await reponse.text();

            console.error(
                "Erreur Gemini :",
                reponse.status,
                texteErreur
            );

            if (reponse.status === 429) {
                throw new Error(
                    "Quota Gemini atteint. Le compte gratuit a probablement atteint sa limite."
                );
            }

            throw new Error(
                "Erreur Gemini (" +
                reponse.status +
                ")."
            );
        }

        const donnees = await reponse.json();

        console.log("Réponse Gemini :", donnees);

        // ----------------------------------------------------
        // RECUPERATION DU TEXTE
        // ----------------------------------------------------

        let texte = "";

        if (
            donnees.candidates &&
            donnees.candidates[0] &&
            donnees.candidates[0].content &&
            donnees.candidates[0].content.parts
        ) {

            texte = donnees.candidates[0].content.parts
                .map(partie => partie.text || "")
                .join("\n");
        }

        if (!texte) {
            throw new Error(
                "Gemini n'a retourné aucun résultat."
            );
        }

        console.log("Texte Gemini :", texte);

        // ----------------------------------------------------
        // EXTRACTION DES RESULTATS
        // ----------------------------------------------------

        let titre = "";
        let description = "";
        let prix = "";

        const blocTitre = texte.match(
            /TITRE\s*:\s*([\s\S]*?)(?=\n\s*DESCRIPTION\s*:)/i
        );

        const blocDescription = texte.match(
            /DESCRIPTION\s*:\s*([\s\S]*?)(?=\n\s*PRIX\s*:)/i
        );

        const blocPrix = texte.match(
            /PRIX\s*:\s*([\s\S]*)/i
        );

        if (blocTitre) {
            titre = blocTitre[1].trim();
        }

        if (blocDescription) {
            description = blocDescription[1].trim();
        }

        if (blocPrix) {
            prix = blocPrix[1].trim();
        }

        // Si le format n'est pas parfaitement respecté,
        // on affiche quand même la réponse complète.
        if (!titre && !description && !prix) {
            description = texte.trim();
        }

        // ----------------------------------------------------
        // AFFICHAGE
        // ----------------------------------------------------

        champTitre.value = titre;
        champDescription.value = description;
        champPrix.value = prix;

        resultat.style.display = "block";

    } catch (erreur) {

        console.error("Erreur :", erreur);

        alert(
            "Impossible d'analyser la photo.\n\n" +
            erreur.message
        );

    } finally {

        boutonAnalyser.disabled = false;
        chargement.style.display = "none";
    }
});


// ------------------------------------------------------------
// CONVERSION IMAGE EN BASE64
// ------------------------------------------------------------

function convertirImageEnBase64(fichier) {

    return new Promise(function (resolve, reject) {

        const lecteur = new FileReader();

        lecteur.onload = function () {

            const resultatLecture = lecteur.result;

            // Retire "data:image/...;base64,"
            // pour ne garder que les données utiles.
            const base64 = resultatLecture.split(",")[1];

            resolve(base64);
        };

        lecteur.onerror = function () {
            reject(
                new Error("Impossible de lire la photo.")
            );
        };

        lecteur.readAsDataURL(fichier);
    });
}
