"use client";

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    en: {
        translation: {
            common: {
                back: "Back",
                forward: "Forward",
                search: "Search..",
                logout: "Logout",
                recordHistory: "Record History",
                export: "Export",
                trials: "Trials",
                trialId: "Trial ID",
                therapeuticArea: "Therapeutic Area",
                diseaseType: "Disease Type",
                primaryDrug: "Primary Drug",
                trialStatus: "Trial Status",
                sponsor: "Sponsor",
                phase: "Phase",
                trialPhase: "Trial Phase",
                patientSegment: "Patient Segment",
                status: "Status",
                endpointsMet: "Endpoints met",
                resultPosted: "Result Posted",
                trialIdentifier: "Trial Identifier",
                otherDrugs: "Other Drugs",
                advancedSearch: "Advanced Search",
                filter: "Filter",
                savedQueries: "Saved Queries",
                viewType: "View Type",
                listView: "List view",
                cardView: "Card view",
                sortBy: "Sort By",
                clearSort: "Clear Sort",
                saveThisQuery: "Save This Query",
                yes: "Yes",
                no: "No",
                closeTab: "Close this trial tab",
                lineOfTherapy: "Line of Therapy",
                noTitleAvailable: "No scientific title available",
                noSummaryAvailable: "No summary available"
            },
            sections: {
                overview: "Overview",
                scientificTitle: "Scientific Title",
                summary: "Summary",
                keyInformation: "Key Information"
            },
            sidebar: {
                overview: "Overview",
                objectives: "Objectives",
                treatmentPlan: "Treatment Plan",
                patientDescription: "Patient Description",
                timing: "Timing",
                outcome: "Outcome",
                publishedResults: "Published Results",
                sites: "Sites",
                otherSources: "Other Sources",
                associatedStudies: "Associated Studies",
                logs: "Logs",
                pipelineData: "Pipeline Data",
                pressRelease: "Press Release",
                publications: "Publications",
                trialRegistries: "Trial Registries"
            },
            trials: {
                trialsSearch: "Trials Search",
                trials: "Trials",
                status: "Status",
                phase: "Phase",
                keyInformation: "Key Information",
                studyDesign: "Study Design",
                primaryDrugs: "Primary Drugs",
                otherDrugs: "Other Drugs",
                primaryEndpoint: "Primary Endpoint",
                studyDetails: "Study Details",
                references: "References",
                noDataAvailable: "No data available",
                therapeuticArea: "Therapeutic Area",
                diseaseType: "Disease Type",
                patientSegment: "Patient Segment",
                trialId: "Trial ID",
                sponsor: "Sponsor",
                startDate: "Start Date",
                endDate: "End Date",
                enrollment: "Enrollment",
                countries: "Countries"
            },
            language: {
                select: "Select Language",
                english: "English",
                spanish: "Español",
                french: "Français"
            }
        }
    },
    es: {
        translation: {
            common: {
                back: "Atrás",
                forward: "Adelante",
                search: "Buscar..",
                logout: "Cerrar sesión",
                recordHistory: "Historial de Registros",
                export: "Exportar",
                trials: "Ensayos",
                trialId: "ID del Ensayo",
                therapeuticArea: "Área Terapéutica",
                diseaseType: "Tipo de Enfermedad",
                primaryDrug: "Medicamento Primario",
                trialStatus: "Estado del Ensayo",
                sponsor: "Patrocinador",
                phase: "Fase",
                trialPhase: "Fase del Ensayo",
                patientSegment: "Segmento de Paciente",
                status: "Estado",
                endpointsMet: "Puntos finales cumplidos",
                resultPosted: "Resultado Publicado",
                trialIdentifier: "Identificador del Ensayo",
                otherDrugs: "Otros Medicamentos",
                advancedSearch: "Búsqueda Avanzada",
                filter: "Filtro",
                savedQueries: "Consultas Guardadas",
                viewType: "Tipo de Vista",
                listView: "Vista de Lista",
                cardView: "Vista de Tarjeta",
                sortBy: "Ordenar Por",
                clearSort: "Borrar Orden",
                saveThisQuery: "Guardar Esta Consulta",
                yes: "Sí",
                no: "No",
                closeTab: "Cerrar esta pestaña de ensayo",
                lineOfTherapy: "Línea de Terapia",
                noTitleAvailable: "No hay título científico disponible",
                noSummaryAvailable: "No hay resumen disponible"
            },
            sections: {
                overview: "Visión general",
                scientificTitle: "Título Científico",
                summary: "Resumen",
                keyInformation: "Información Clave"
            },
            sidebar: {
                overview: "Resumen",
                objectives: "Objetivos",
                treatmentPlan: "Plan de Tratamiento",
                patientDescription: "Descripción del Paciente",
                timing: "Cronograma",
                outcome: "Resultado",
                publishedResults: "Resultados Publicados",
                sites: "Sitios",
                otherSources: "Otras Fuentes",
                associatedStudies: "Estudios Asociados",
                logs: "Registros",
                pipelineData: "Datos de Pipeline",
                pressRelease: "Comunicado de Prensa",
                publications: "Publicaciones",
                trialRegistries: "Registros de Ensayos"
            },
            trials: {
                trialsSearch: "Búsqueda de Ensayos",
                trials: "Ensayos",
                status: "Estado",
                phase: "Fase",
                keyInformation: "Información Clave",
                studyDesign: "Diseño del Estudio",
                primaryDrugs: "Medicamentos Primarios",
                otherDrugs: "Otros Medicamentos",
                primaryEndpoint: "Punto Final Primario",
                studyDetails: "Detalles del Estudio",
                references: "Referencias",
                noDataAvailable: "Datos no disponibles",
                therapeuticArea: "Área Terapéutica",
                diseaseType: "Tipo de Enfermedad",
                patientSegment: "Segmento de Paciente",
                trialId: "ID del Ensayo",
                sponsor: "Patrocinador",
                startDate: "Fecha de Inicio",
                endDate: "Fecha de Fin",
                enrollment: "Inscripción",
                countries: "Países"
            },
            language: {
                select: "Seleccionar Idioma",
                english: "English",
                spanish: "Español",
                french: "Français"
            }
        }
    },
    fr: {
        translation: {
            common: {
                back: "Retour",
                forward: "Suivant",
                search: "Rechercher..",
                logout: "Déconnexion",
                recordHistory: "Historique des Enregistrements",
                export: "Exporter",
                trials: "Essais",
                trialId: "ID de l'essai",
                therapeuticArea: "Domaine Thérapeutique",
                diseaseType: "Type de Maladie",
                primaryDrug: "Médicament Primaire",
                trialStatus: "Statut de l'essai",
                sponsor: "Promoteur",
                phase: "Phase",
                trialPhase: "Phase de l'essai",
                patientSegment: "Segment Patient",
                status: "Statut",
                endpointsMet: "Critères satisfaits",
                resultPosted: "Résultat Publié",
                trialIdentifier: "Identifiant de l'essai",
                otherDrugs: "Autres Médicaments",
                advancedSearch: "Recherche Avancée",
                filter: "Filtre",
                savedQueries: "Requêtes Enregistrées",
                viewType: "Type de Vue",
                listView: "Vue Liste",
                cardView: "Vue Carte",
                sortBy: "Trier Par",
                clearSort: "Effacer le Tri",
                saveThisQuery: "Enregistrer Cette Requête",
                yes: "Oui",
                no: "Non",
                closeTab: "Fermer cet onglet d'essai",
                lineOfTherapy: "Ligne de Traitement",
                noTitleAvailable: "Aucun titre scientifique disponible",
                noSummaryAvailable: "Aucun résumé disponible"
            },
            sections: {
                overview: "Aperçu",
                scientificTitle: "Titre Scientifique",
                summary: "Résumé",
                keyInformation: "Informations Clés"
            },
            sidebar: {
                overview: "Aperçu",
                objectives: "Objectifs",
                treatmentPlan: "Plan de Traitement",
                patientDescription: "Description du Patient",
                timing: "Calendrier",
                outcome: "Résultat",
                publishedResults: "Résultats Publiés",
                sites: "Sites",
                otherSources: "Autres Sources",
                associatedStudies: "Études Associées",
                logs: "Journaux",
                pipelineData: "Données Pipeline",
                pressRelease: "Communiqué de Presse",
                publications: "Publications",
                trialRegistries: "Registres d'Essais"
            },
            trials: {
                trialsSearch: "Recherche d'Essais",
                trials: "Essais",
                status: "Statut",
                phase: "Phase",
                keyInformation: "Informations Clés",
                studyDesign: "Conception de l'Étude",
                primaryDrugs: "Médicaments Primaires",
                otherDrugs: "Autres Médicaments",
                primaryEndpoint: "Critère Principal",
                studyDetails: "Détails de l'Étude",
                references: "Références",
                noDataAvailable: "Données non disponibles",
                therapeuticArea: "Domaine Thérapeutique",
                diseaseType: "Type de Maladie",
                patientSegment: "Segment Patient",
                trialId: "ID de l'Essai",
                sponsor: "Promoteur",
                startDate: "Date de Début",
                endDate: "Date de Fin",
                enrollment: "Inscription",
                countries: "Pays"
            },
            language: {
                select: "Choisir la Langue",
                english: "English",
                spanish: "Español",
                french: "Français"
            }
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') || 'en' : 'en',
        fallbackLng: 'en',
        debug: false,
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
