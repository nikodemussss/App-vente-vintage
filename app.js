// ==========================================
// MON ASSISTANT VIDE-GRENIER
// Identification + recherche du marché réel
// + estimation basée sur les ventes récentes
// ==========================================

// ⚠️ METS TA CLÉ API GEMINI ICI
const CLE_API = "AQ.Ab8RN6KtJ7pU6tpg8x4aofAvmA1x1RT9ma_mu1UUShzV_0AD6g";

// ==========================================
// MODÈLES GEMINI
// ==========================================

const MODELES = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite"
];

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

  if (!fichier) return;

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
// DATE DU JOUR
// ==========================================

function obtenirDateISO() {

  const maintenant = new Date();

  return maintenant.toISOString().slice(0, 10);
}

function obtenirDate90JoursAvant() {

  const date = new Date();

  date.setDate(date.getDate() - 90);

  return date.toISOString().slice(0, 10);
}

const DATE_DU_JOUR = obtenirDateISO();
const DATE_90_JOURS_AVANT = obtenirDate90JoursAvant();

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

Tu es le moteur d'analyse et d'estimation de prix de
"Mon Assistant Vide-Grenier".

Tu es un expert français de la brocante, de l'occasion,
des objets de collection, des antiquités, des jeux vidéo,
des livres, des jouets, des objets publicitaires,
de l'électronique, des bijoux, des monnaies,
des objets de marque et de manière générale de tout objet
pouvant être vendu entre particuliers.

L'objectif principal est de déterminer COMBIEN CET OBJET
PEUT RÉELLEMENT SE VENDRE AUJOURD'HUI sur le marché français.

Nous sommes le ${DATE_DU_JOUR}.

La période de référence prioritaire pour les ventes est :

DU ${DATE_90_JOURS_AVANT}
AU ${DATE_DU_JOUR}

==================================================
RÈGLE ABSOLUE SUR LE PRIX
==================================================

NE CALCULE PAS le prix uniquement à partir de ta connaissance
générale.

NE CALCULE PAS le prix principalement à partir de la valeur
des matériaux.

NE PRENDS PAS comme référence principale le prix demandé
par un vendeur.

Le prix doit être déterminé PRIORITAIREMENT à partir du
MARCHÉ RÉEL et notamment des objets COMPARABLES QUI SE SONT
RÉELLEMENT VENDUS.

Une annonce actuellement en vente à 80 € ne signifie PAS
qu'un objet vaut 80 €.

Un objet vendu réellement 42 € est une information beaucoup
plus importante qu'une annonce actuellement affichée à 80 €.

==================================================
ÉTAPE 1 — IDENTIFICATION VISUELLE
==================================================

Analyse attentivement la photographie.

Identifie l'objet le plus précisément possible.

Cherche notamment :

- nature exacte de l'objet
- marque
- fabricant
- modèle
- référence
- numéro de modèle
- année
- époque
- édition
- version
- variante
- matière
- couleur
- dimensions visibles ou estimables
- accessoires
- emballage
- signature
- inscription
- logo
- numéro de série
- particularités
- état apparent
- défauts visibles
- complétude

NE JAMAIS inventer une information qui n'est pas visible
ou suffisamment fiable.

Si une caractéristique n'est pas identifiable, indique-la
comme inconnue.

==================================================
ÉTAPE 2 — CARACTÉRISTIQUES ADAPTÉES À L'OBJET
==================================================

Les caractéristiques à rechercher doivent dépendre
de l'objet identifié.

NE PAS utiliser systématiquement les mêmes critères
pour toutes les catégories.

Exemples :

MONNAIE :

- pays
- valeur faciale
- année
- type
- variante
- atelier
- diamètre
- poids
- métal
- titre du métal
- état
- particularités

JEU VIDÉO :

- plateforme
- titre exact
- région
- édition
- version
- édition collector éventuelle
- présence du boîtier
- présence du manuel
- présence des accessoires
- état du disque ou de la cartouche

LIVRE :

- auteur
- titre
- édition
- éditeur
- année
- numéro d'édition
- ISBN
- reliure
- état
- présence éventuelle d'une jaquette

BIJOU :

- marque
- modèle
- matière
- métal
- poinçons
- pierres
- poids si connu
- époque
- état

OBJET DE MARQUE :

- marque
- modèle
- référence
- série
- version
- époque
- accessoires

ÉLECTRONIQUE :

- marque
- modèle
- référence
- génération
- version
- accessoires
- état
- fonctionnement apparent

OBJET DE COLLECTION :

- fabricant
- série
- référence
- année
- édition
- variante
- état
- boîte
- accessoires

Pour tout autre objet, détermine toi-même les
caractéristiques réellement importantes pour son identification
et sa valeur.

==================================================
ÉTAPE 3 — CONSTRUIRE LES RECHERCHES
==================================================

Une fois l'objet identifié, construis plusieurs recherches
Internet spécifiques à CET OBJET.

Ne fais PAS une recherche générique du type :

"combien vaut cet objet"

Construis des recherches avec les informations précises
trouvées sur la photographie.

Exemples pour une monnaie :

"10 francs Hercule 1967 vendu"

"10 francs Hercule 1967 vente réalisée"

"10 francs Hercule 1967 eBay vendu"

"10 francs Hercule 1967 eBay vente terminée"

"10 francs Hercule 1967 Catawiki vendu"

"10 francs Hercule 1967 Delcampe"

Exemple pour un jeu :

"Nom exact PS3 vendu"

"Nom exact PS3 eBay vendu"

"Nom exact PS3 sold"

"Nom exact PS3 completed sale"

Exemple pour un objet de marque :

"marque modèle référence vendu"

"marque modèle référence eBay vendu"

"marque modèle référence prix réalisé"

Adapte complètement les recherches à l'objet identifié.

Lorsque c'est pertinent, utilise aussi les termes :

- vendu
- vente réalisée
- vendu pour
- prix réalisé
- vente terminée
- enchère terminée
- sold
- sold for
- completed sale
- completed listing

==================================================
ÉTAPE 4 — PRIORITÉ AUX VENTES RÉELLES
==================================================

Classe les informations trouvées selon cette priorité :

NIVEAU 1 — TRÈS IMPORTANT

Objet réellement vendu avec prix identifiable.

Exemples :

- vente eBay terminée avec prix
- objet vendu sur une marketplace avec prix
- enchère terminée avec prix final
- résultat d'enchère avec prix réalisé
- vente professionnelle avec prix réellement constaté

NIVEAU 2 — IMPORTANT

Vente ancienne mais réellement réalisée lorsque
les ventes récentes sont rares.

NIVEAU 3 — SECONDAIRE

Annonces actuellement disponibles avec prix demandé.

NIVEAU 4 — INFORMATION COMPLÉMENTAIRE

Cote théorique, guide de prix, catalogue,
valeur du matériau, etc.

==================================================
RÈGLE TRÈS IMPORTANTE
==================================================

NE CONFONDS JAMAIS :

"prix demandé"

avec

"prix réellement vendu".

Si une page indique seulement qu'un vendeur DEMANDE 80 €,
tu dois la classer comme :

"type": "annonce"

et PAS comme :

"type": "vente réalisée"

Si tu ne peux pas déterminer qu'une vente a réellement
eu lieu, NE LA PRÉSENTE PAS comme une vente réalisée.

NE FABRIQUE JAMAIS un prix de vente.

==================================================
ÉTAPE 5 — PÉRIODE DE 90 JOURS
==================================================

Recherche en priorité les ventes réalisées entre :

${DATE_90_JOURS_AVANT}

et

${DATE_DU_JOUR}

Les ventes des 30 derniers jours sont particulièrement
intéressantes.

Les ventes entre 31 et 90 jours restent très pertinentes.

Si tu trouves très peu de ventes dans les 90 derniers jours,
tu peux élargir progressivement la recherche jusqu'à
180 jours.

Pour un objet très rare, tu peux aller plus loin uniquement
si nécessaire.

Dans ce cas, indique clairement que les données récentes
sont insuffisantes.

NE mélange pas automatiquement une vente vieille de plusieurs
années avec des ventes récentes.

Une vente récente doit avoir davantage de poids.

==================================================
ÉTAPE 6 — COMPARABILITÉ
==================================================

Chaque vente trouvée doit être comparée à L'OBJET
PHOTOGRAPHIÉ.

Écarte les résultats qui concernent :

- autre modèle
- autre référence
- autre année lorsque l'année est importante
- autre édition
- autre version
- autre plateforme
- autre taille
- autre matière
- autre variante
- autre quantité
- autre état
- objet neuf alors que le nôtre est d'occasion
- objet incomplet alors que le nôtre est complet
- lot alors que notre objet est vendu à l'unité
- contrefaçon ou résultat douteux
- objet seulement vaguement similaire

La ressemblance visuelle seule ne suffit pas.

==================================================
ÉTAPE 7 — ÉTAT DE L'OBJET
==================================================

Compare l'état apparent de l'objet photographié
avec celui des objets vendus.

Tiens compte notamment de :

- neuf
- comme neuf
- très bon état
- bon état
- état correct
- usure
- rayures
- défauts
- boîte
- emballage
- manuel
- accessoires
- fonctionnement

Ne compare pas automatiquement un objet neuf à un objet
usagé au même prix.

==================================================
ÉTAPE 8 — CALCUL DE L'ESTIMATION
==================================================

Après avoir trouvé les comparables pertinents :

1. donne davantage de poids aux ventes réellement réalisées ;

2. donne davantage de poids aux ventes récentes ;

3. donne davantage de poids aux objets identiques ou
   presque identiques ;

4. écarte les prix aberrants ;

5. ne laisse pas une annonce actuellement en vente
   influencer fortement la moyenne ;

6. si plusieurs ventes réelles convergent vers une même
   zone de prix, considère cette zone comme particulièrement
   fiable ;

7. utilise une médiane ou une zone centrale des ventes
   pertinentes plutôt qu'une simple moyenne influencée
   par des valeurs extrêmes.

L'estimation finale doit représenter :

"combien cet objet peut raisonnablement se vendre
entre particuliers en France"

et NON :

"quel prix maximum quelqu'un demande pour cet objet".

==================================================
CAS PARTICULIER DES MATIÈRES PRÉCIEUSES
==================================================

Pour une monnaie, un bijou ou un objet contenant de l'or,
de l'argent ou une autre matière précieuse :

la valeur du métal est une INFORMATION SECONDAIRE.

Elle peut servir de contrôle de cohérence.

Elle NE DOIT PAS devenir automatiquement le prix de vente.

Si les ventes réelles montrent qu'un objet se vend
40 à 50 € alors que sa valeur métal est inférieure,
l'estimation doit refléter le marché de collection,
donc environ 40 à 50 €.

NE ramène jamais automatiquement une monnaie à sa valeur
de fonte.

==================================================
CAS PARTICULIER DES OBJETS RARES
==================================================

Si l'objet est rare et qu'il existe peu de ventes récentes :

ne fabrique pas de statistiques.

Indique que les données sont limitées.

Utilise les meilleures références disponibles
et élargis éventuellement la période.

==================================================
ÉTAPE 9 — NOMBRE DE COMPARABLES
==================================================

Indique séparément :

- nombre de ventes réellement réalisées pertinentes
- nombre d'annonces actuelles pertinentes
- nombre total de références utilisées

Une estimation basée sur 5 ventes réelles est plus fiable
qu'une estimation basée sur une seule annonce.

==================================================
ÉTAPE 10 — PRIX EBAY
==================================================

Après avoir déterminé le prix de vente probable :

donne un prix de mise en vente conseillé sur eBay.

Ce prix peut être légèrement supérieur au prix de vente
réel attendu afin de laisser une petite marge de négociation.

Mais il ne doit pas être artificiellement gonflé.

Exemple :

Si les ventes réelles sont principalement entre 38 et 44 € :

prix de vente probable :
40–44 €

prix de mise en vente conseillé :
44,90 €

et non 69,90 € simplement parce qu'une annonce concurrente
est affichée à 69,90 €.

==================================================
ÉTAPE 11 — TITRE EBAY
==================================================

Crée un titre eBay précis et vendeur.

Maximum 80 caractères.

Utilise les informations réellement identifiées :

marque + modèle + référence + variante + année
+ caractéristique importante.

N'invente jamais de mot-clé destiné uniquement à faire
monter artificiellement le prix.

==================================================
ÉTAPE 12 — DESCRIPTION EBAY
==================================================

Rédige une description claire et honnête en français.

Elle doit reprendre :

- identification de l'objet
- marque
- modèle
- référence si connue
- caractéristiques importantes
- état
- accessoires
- défauts visibles
- particularités

Ne prétends jamais qu'un objet est neuf, authentique,
rare ou complet si cela n'est pas suffisamment établi.

==================================================
ÉTAPE 13 — CONFIANCE
==================================================

Donne un niveau de confiance :

- élevée
- moyenne
- faible

Une confiance élevée nécessite plusieurs comparables
réels et pertinents.

==================================================
RÉPONSE OBLIGATOIRE
==================================================

Réponds UNIQUEMENT avec un JSON valide.

Aucun texte avant le JSON.

Aucun texte après le JSON.

Format obligatoire :

{
  "objet": "identification précise",
  "categorie": "catégorie de l'objet",
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
  "titre_ebay": "maximum 80 caractères",
  "description_ebay": "description détaillée et honnête",
  "prix_estime": "fourchette réaliste de vente",
  "prix_mise_en_vente": "prix conseillé",
  "niveau_confiance": "élevée, moyenne ou faible",
  "justification_prix": "explication courte basée sur les ventes comparables",
  "ventes_reelles": "nombre de ventes réellement réalisées pertinentes",
  "annonces_actuelles": "nombre d'annonces actuellement en vente pertinentes",
  "nombre_comparables": "nombre total de références pertinentes",
  "comparables": [
    {
      "site": "site",
      "description": "objet comparable",
      "prix": "prix",
      "date": "date ou période si disponible",
      "type": "vente réalisée, enchère terminée ou annonce",
      "pertinence": "élevée, moyenne ou faible"
    }
  ]
}

==================================================
RÈGLE FINALE
==================================================

AVANT de déterminer le prix final, pose-toi cette question :

"Si je devais réellement vendre cet objet en France
aujourd'hui, quel prix est cohérent avec les objets
IDENTIQUES ou TRÈS COMPARABLES qui se sont réellement
VENDUS récemment ?"

C'est cette réponse qui doit déterminer l'estimation.

La valeur théorique, la cote, la valeur du métal
ou le prix demandé par un vendeur ne doivent jamais
remplacer les données de ventes réelles lorsqu'elles
sont disponibles.
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
    // ESSAI DES MODÈLES
    // ======================================

    for (let i = 0; i < MODELES.length; i++) {

      const modele = MODELES[i];

      chargement.textContent =
        "🔎 Identification + recherche des ventes avec " +
        modele.replace("gemini-", "") +
        "…";

      console.log("Tentative Gemini :", modele);

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

              // ====================================
              // RECHERCHE GOOGLE
              // ====================================

              tools: [
                {
                  google_search: {}
                }
              ],

              // ====================================
              // SORTIE JSON
              // ====================================

              generationConfig: {

                responseMimeType: "application/json",

                maxOutputTokens: 8000,

                temperature: 0.2
              }

            })
          },

          60000
        );

        const donnees = await reponse.json();

        console.log(
          "Réponse Gemini " + modele + " :",
          donnees
        );

        // ====================================
        // RÉPONSE OK
        // ====================================

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

          // Affichage éventuel des informations
          // de recherche Google dans la console.
          if (donnees.candidates[0].groundingMetadata) {

            console.log(
              "Informations de recherche Google :",
              donnees.candidates[0].groundingMetadata
            );
          }

          break;
        }

        // ====================================
        // MODÈLE TEMPORAIREMENT INDISPONIBLE
        // ====================================

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
            "). Passage au modèle suivant."
          );

          continue;
        }

        // ====================================
        // CLÉ API
        // ====================================

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

        dernierErreur =
          donnees?.error?.message ||
          "Erreur Gemini " +
          reponse.status;

      } catch (erreurModele) {

        console.warn(
          "Erreur avec " + modele + " :",
          erreurModele
        );

        // Timeout
        if (
          erreurModele.name === "AbortError"
        ) {

          dernierErreur =
            "Le modèle a dépassé 60 secondes.";

          continue;
        }

        // Erreur de clé
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
    // AUCUN MODÈLE N'A RÉPONDU
    // ======================================

    if (!resultatFinal) {

      throw new Error(
        "Aucun modèle Gemini n'a pu répondre.\n\n" +
        "Dernière erreur : " +
        (
          dernierErreur ||
          "erreur inconnue"
        )
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

      json = JSON.parse(
        texteNettoye
      );

    } catch (erreurJSON) {

      console.error(
        "JSON reçu par Gemini :",
        resultatFinal
      );

      // Tentative de récupération
      // si Gemini a ajouté quelque chose
      // malgré la demande JSON.

      const debut =
        texteNettoye.indexOf("{");

      const fin =
        texteNettoye.lastIndexOf("}");

      if (
        debut !== -1 &&
        fin !== -1 &&
        fin > debut
      ) {

        try {

          json = JSON.parse(
            texteNettoye.substring(
              debut,
              fin + 1
            )
          );

        } catch (deuxiemeErreur) {

          throw new Error(
            "Gemini a répondu, mais son résultat JSON est invalide."
          );
        }

      } else {

        throw new Error(
          "Gemini a répondu, mais son résultat n'est pas exploitable."
        );
      }
    }

    // ======================================
    // AFFICHAGE DU TITRE
    // ======================================

    document.getElementById("titre").value =
      json.titre_ebay ||
      "Non disponible";

    // ======================================
    // AFFICHAGE DESCRIPTION
    // ======================================

    document.getElementById("description").value =
      json.description_ebay ||
      "Non disponible";

    // ======================================
    // AFFICHAGE PRIX
    // ======================================

    let textePrix =
      "";

    textePrix +=
      "Estimation de vente : " +
      (
        json.prix_estime ||
        "Non disponible"
      );

    textePrix +=
      "\n\nPrix de mise en vente conseillé : " +
      (
        json.prix_mise_en_vente ||
        "Non disponible"
      );

    textePrix +=
      "\n\nNiveau de confiance : " +
      (
        json.niveau_confiance ||
        "Non précisé"
      );

    textePrix +=
      "\n\nVentes réellement réalisées : " +
      (
        json.ventes_reelles ??
        "Non précisé"
      );

    textePrix +=
      "\nAnnonces actuellement en vente : " +
      (
        json.annonces_actuelles ??
        "Non précisé"
      );

    textePrix +=
      "\nComparables utilisés : " +
      (
        json.nombre_comparables ??
        "Non précisé"
      );

    textePrix +=
      "\n\nJustification :\n" +
      (
        json.justification_prix ||
        "Aucune justification disponible."
      );

    document.getElementById("prix").value =
      textePrix;

    // ======================================
    // AFFICHAGE DU RÉSULTAT
    // ======================================

    resultat.style.display = "block";

    // ======================================
    // CONSOLE POUR CONTRÔLER LES RÉSULTATS
    // ======================================

    console.log(
      "===================================="
    );

    console.log(
      "OBJET IDENTIFIÉ :",
      json.objet
    );

    console.log(
      "CATÉGORIE :",
      json.categorie
    );

    console.log(
      "CARACTÉRISTIQUES :",
      json.caracteristiques
    );

    console.log(
      "PRIX ESTIMÉ :",
      json.prix_estime
    );

    console.log(
      "PRIX MISE EN VENTE :",
      json.prix_mise_en_vente
    );

    console.log(
      "VENTES RÉELLES :",
      json.ventes_reelles
    );

    console.log(
      "ANNONCES :",
      json.annonces_actuelles
    );

    console.log(
      "COMPARABLES :",
      json.comparables
    );

    console.log(
      "MODÈLE UTILISÉ :",
      modeleUtilise
    );

    console.log(
      "===================================="
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

    chargement.style.display =
      "none";

    boutonAnalyser.disabled =
      false;
  }
});
