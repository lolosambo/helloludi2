/**
 * Script d'initialisation global pour l'éditeur de texte riche
 * À inclure après les autres scripts de l'éditeur
 */

(function() {
    'use strict';

    // Configuration globale
    const EDITOR_CONFIG = {
        containerId: 'richEditor',
        retryAttempts: 3,
        retryDelay: 1000,
        initTimeout: 10000
    };

    let initializationAttempts = 0;
    let initializationTimer = null;

    /**
     * Vérification des prérequis
     */
    function checkPrerequisites() {
        const missing = [];

        if (typeof window.bootstrap === 'undefined') {
            missing.push('Bootstrap');
        }

        if (typeof window.RichEditor === 'undefined') {
            missing.push('RichEditor');
        }

        if (typeof window.ModalManager === 'undefined') {
            missing.push('ModalManager');
        }

        if (typeof window.editorManager === 'undefined') {
            missing.push('EditorManager');
        }

        if (!document.getElementById(EDITOR_CONFIG.containerId)) {
            missing.push('Editor container');
        }

        if (missing.length > 0) {
            console.warn('Missing prerequisites for editor:', missing);
            return false;
        }

        return true;
    }

    /**
     * Initialisation de l'éditeur
     */
    async function initializeEditor() {
        if (!checkPrerequisites()) {
            if (initializationAttempts < EDITOR_CONFIG.retryAttempts) {
                initializationAttempts++;
                console.log(`Retrying editor initialization (${initializationAttempts}/${EDITOR_CONFIG.retryAttempts})...`);

                setTimeout(initializeEditor, EDITOR_CONFIG.retryDelay);
                return;
            } else {
                console.error('Failed to initialize editor after maximum attempts');
                showError('Impossible d\'initialiser l\'éditeur. Veuillez recharger la page.');
                return;
            }
        }

        try {
            console.log('Initializing rich text editor...');

            // Récupérer la configuration depuis le DOM
            const container = document.getElementById(EDITOR_CONFIG.containerId);
            const uploadUrl = container.dataset.uploadUrl || '/upload_image';
            const hiddenField = container.dataset.hiddenField || 'content';

            // Initialiser l'éditeur
            const editorInstance = await window.editorManager.init(EDITOR_CONFIG.containerId, {
                uploadUrl: uploadUrl,
                hiddenFieldId: hiddenField
            });

            if (editorInstance) {
                console.log('Rich text editor initialized successfully');
                showSuccess();

                // Charger le contenu initial si présent
                const initialContent = document.getElementById(hiddenField)?.value;
                if (initialContent) {
                    editorInstance.setContent(initialContent);
                }

                // Configurer la synchronisation automatique
                setupAutoSync();

            } else {
                throw new Error('Editor instance is null');
            }

        } catch (error) {
            console.error('Error initializing editor:', error);
            showError('Erreur lors de l\'initialisation de l\'éditeur');
        }
    }

    /**
     * Configuration de la synchronisation automatique
     */
    function setupAutoSync() {
        // Synchronisation avant soumission du formulaire
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                if (window.editorManager && window.editorManager.isReady()) {
                    try {
                        window.editorManager.syncContent();
                        console.log('Content synchronized before form submission');
                    } catch (error) {
                        console.error('Error synchronizing content:', error);
                    }
                }
            });
        });

        // Synchronisation périodique (toutes les 30 secondes)
        setInterval(() => {
            if (window.editorManager && window.editorManager.isReady()) {
                try {
                    window.editorManager.syncContent();
                } catch (error) {
                    console.error('Error during periodic sync:', error);
                }
            }
        }, 30000);

        // Synchronisation avant fermeture de la page
        window.addEventListener('beforeunload', function() {
            if (window.editorManager && window.editorManager.isReady()) {
                try {
                    window.editorManager.syncContent();
                } catch (error) {
                    console.error('Error synchronizing before unload:', error);
                }
            }
        });
    }

    /**
     * Affichage d'un message de succès
     */
    function showSuccess() {
        const container = document.getElementById(EDITOR_CONFIG.containerId);
        if (container) {
            container.classList.remove('editor-loading');
            container.classList.add('editor-ready');
        }

        const indicator = document.getElementById('editorLoadingIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }

        // Optionnel : afficher une notification de succès
        showNotification('Éditeur prêt', 'success');
    }

    /**
     * Affichage d'un message d'erreur
     */
    function showError(message) {
        const indicator = document.getElementById('editorLoadingIndicator');
        if (indicator) {
            indicator.innerHTML = `
                <div class="text-danger">
                    <i class="bi bi-exclamation-triangle"></i>
                    <span class="ms-2">${message}</span>
                    <button class="btn btn-sm btn-outline-primary ms-2" onclick="location.reload()">
                        <i class="bi bi-arrow-clockwise"></i> Recharger
                    </button>
                </div>
            `;
        }

        showNotification(message, 'error');
    }

    /**
     * Affichage d'une notification temporaire
     */
    function showNotification(message, type = 'info') {
        // Créer la notification
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        notification.innerHTML = `
            <i class="bi bi-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto-suppression après 5 secondes
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * Gestion du timeout d'initialisation
     */
    function setupInitTimeout() {
        initializationTimer = setTimeout(() => {
            if (!window.editorManager || !window.editorManager.isReady()) {
                console.error('Editor initialization timeout');
                showError('Timeout lors de l\'initialisation de l\'éditeur');
            }
        }, EDITOR_CONFIG.initTimeout);
    }

    /**
     * Nettoyage du timeout
     */
    function clearInitTimeout() {
        if (initializationTimer) {
            clearTimeout(initializationTimer);
            initializationTimer = null;
        }
    }

    /**
     * Gestionnaire d'événements globaux
     */
    function setupGlobalEventHandlers() {
        // Écouter les événements de l'éditeur
        document.addEventListener('editorManagerready', function(event) {
            console.log('Editor manager ready event received');
            clearInitTimeout();
        });

        document.addEventListener('editorManagererror', function(event) {
            console.error('Editor manager error event received:', event.detail);
            clearInitTimeout();
            showError('Erreur dans le gestionnaire d\'éditeur');
        });

        // Gestion des erreurs JavaScript globales
        window.addEventListener('error', function(event) {
            if (event.message && (
                event.message.includes('RichEditor') ||
                event.message.includes('ModalManager') ||
                event.message.includes('EditorManager')
            )) {
                console.error('Editor-related JavaScript error:', event.error);
                showError('Erreur JavaScript dans l\'éditeur');
            }
        });

        // Gestion des promesses rejetées
        window.addEventListener('unhandledrejection', function(event) {
            if (event.reason && event.reason.message &&
                event.reason.message.includes('Editor')) {
                console.error('Editor-related promise rejection:', event.reason);
                showError('Erreur de promesse dans l\'éditeur');
            }
        });
    }

    /**
     * Point d'entrée principal
     */
    function main() {
        console.log('Rich Text Editor initialization script loaded');

        // Configurer les gestionnaires d'événements globaux
        setupGlobalEventHandlers();

        // Configurer le timeout d'initialisation
        setupInitTimeout();

        // Démarrer l'initialisation
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeEditor);
        } else if (document.readyState === 'interactive') {
            // DOM prêt mais ressources en cours de chargement
            setTimeout(initializeEditor, 100);
        } else {
            // DOM et ressources complètement chargés
            initializeEditor();
        }

        // Sauvegarde : réessayer après un délai si l'initialisation échoue
        setTimeout(() => {
            if (!window.editorManager || !window.editorManager.isReady()) {
                console.log('Fallback initialization attempt...');
                initializeEditor();
            }
        }, 3000);
    }

    /**
     * API publique pour le débogage
     */
    window.EditorDebug = {
        getManager: () => window.editorManager,
        getConfig: () => EDITOR_CONFIG,
        forceInit: initializeEditor,
        checkPrereqs: checkPrerequisites,
        getAttempts: () => initializationAttempts
    };

    // Démarrer l'initialisation
    main();

})();