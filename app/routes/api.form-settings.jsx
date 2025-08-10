// 🔧 FICHIER 2: app/routes/api.form-settings.jsx  
// API pour sauvegarder les paramètres du concepteur de formulaire
// ===============================

import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  
  const formData = await request.formData();
  const action = formData.get("action");

  try {
    if (action === "save") {
      // Récupérer tous les paramètres du formulaire
      const settings = {
        formType: formData.get("formType"),
        selectedCountry: formData.get("selectedCountry"),
        multiCountryEnabled: formData.get("multiCountryEnabled") === "true",
        formStyle: JSON.parse(formData.get("formStyle") || "{}"),
        fields: JSON.parse(formData.get("fields") || "[]"),
        buttonText: formData.get("buttonText"),
        errorMessages: JSON.parse(formData.get("errorMessages") || "{}"),
        backgroundImage: formData.get("backgroundImage"),
        shop: session.shop,
        updatedAt: new Date().toISOString()
      };

      console.log("💾 Sauvegarde des paramètres:", settings);

      // TODO: Sauvegarder dans votre base de données
      // Vous pouvez utiliser Prisma ou votre méthode préférée
      // await prisma.formSettings.upsert({
      //   where: { shop: session.shop },
      //   update: settings,
      //   create: settings
      // });

      return json({
        success: true,
        message: "Paramètres sauvegardés avec succès!",
        data: settings
      });
    }

    if (action === "load") {
      // Charger les paramètres existants
      // TODO: Récupérer depuis votre base de données
      // const settings = await prisma.formSettings.findUnique({
      //   where: { shop: session.shop }
      // });

      // Paramètres par défaut pour l'instant
      const defaultSettings = {
        formType: 'integrated',
        selectedCountry: 'Morocco',
        multiCountryEnabled: false,
        formStyle: {
          textColor: '#1e293b',
          fieldTextColor: '#333333',
          fieldBorderColor: '#e5e7eb',
          fieldBgColor: '#ffffff',
          buttonColor: '#667eea',
          buttonTextColor: '#ffffff',
          formBackground: '#ffffff',
          borderRadius: 10,
          fieldBorderRadius: 8,
          borderWidth: 2,
          showLabels: true,
          rtlEnabled: false,
          showShadow: false,
          fontFamily: 'system-ui',
          fontSize: 14
        },
        fields: [],
        buttonText: 'Confirmer ma commande',
        errorMessages: {
          required: 'Ce champ est requis',
          invalid: 'Veuillez vérifier vos informations'
        }
      };

      return json({
        success: true,
        data: defaultSettings
      });
    }

    return json({
      success: false,
      error: "Action non reconnue"
    }, { status: 400 });

  } catch (error) {
    console.error("❌ Erreur paramètres formulaire:", error);
    return json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

