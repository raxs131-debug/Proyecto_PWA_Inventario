import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// ==========================================================
// 📚 ARCHIVOS DE TRADUCCIÓN (Resources)
// Usamos namespaces (por ejemplo, 'common' y 'dashboard')
// ==========================================================

const resources = {
  // Traducciones en Español (es)
  es: {
    // 1. Namespace 'common' (Textos usados en toda la app, como títulos de navegación)
    common: {
      "change_language": "Cambiar Idioma",
      "form_entry": "Formulario de Entrada",
      "global_inventory": "Inventario Global",
      // Añade más textos comunes aquí (ej: 'Guardar', 'Cancelar')
    },
    // 2. Namespace 'dashboard' (Textos específicos de InventarioDashboard.jsx)
    dashboard: {
      "dashboard_title": "Inventario General de Medicamentos",
      "loading_inventory": "Cargando inventario...",
      "error_prefix": "Error",
      "error_load_inventory": "No se pudo cargar el inventario. Asegúrate que el backend de Node.js esté funcionando en http://localhost:3001.",
      "total_unique_items": "Total de medicamentos únicos: {{count}}",
      "table_header_clave": "Clave de CB",
      "table_header_description": "Descripción",
      "table_header_presentation": "Presentación",
      "table_header_total_enzymes": "TOTAL DE ENZIMAS",
      "empty_inventory_message": "No hay datos en el inventario. Asegúrate de registrar una Entrada.",
    },
    // 3. Namespace 'entryForm' (Texto para FormularioEntrada.jsx)
    entryForm: {
        "title": "Registro de Entrada de Medicamentos",
        "submit_button": "Registrar Entrada",
        // ... Agrega claves del formulario
    },
    // Añade más namespaces aquí para el resto de tus vistas: 'exitForm', 'historyReport', etc.
  },
  
  // Traducciones en Inglés (en)
  en: {
    common: {
      "change_language": "Change Language",
      "form_entry": "Entry Form",
      "global_inventory": "Global Inventory",
    },
    dashboard: {
      "dashboard_title": "General Medicine Inventory",
      "loading_inventory": "Loading inventory...",
      "error_prefix": "Error",
      "error_load_inventory": "Could not load inventory. Make sure the Node.js backend is running at http://localhost:3001.",
      "total_unique_items": "Total unique items: {{count}}",
      "table_header_clave": "CB Key",
      "table_header_description": "Description",
      "table_header_presentation": "Presentation",
      "table_header_total_enzymes": "TOTAL ENZYMES",
      "empty_inventory_message": "No data in the inventory. Make sure to register an Entry.",
    },
    entryForm: {
        "title": "Medicine Entry Registration",
        "submit_button": "Register Entry",
    },
  }
};

i18n
  .use(LanguageDetector) 
  .use(initReactI18next) 
  .init({
    resources,
    // Define los namespaces que acabas de crear
    ns: ['common', 'dashboard', 'entryForm'], 
    // Establece el namespace que se usará por defecto si no se especifica uno
    defaultNS: 'common', 
    fallbackLng: 'es', 
    detection: {
        order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
    },
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;