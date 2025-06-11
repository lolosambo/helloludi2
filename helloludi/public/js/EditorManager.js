/**
 * Gestionnaire principal de l'éditeur de texte riche
 * Coordonne l'initialisation et la communication entre les composants
 */

class EditorManager {
    constructor() {
        this.editorInstance = null;
        this.modalManager = null;
        this.isInitialized = false;
        this.initializationAttempts = 0;
        this.maxInitializationAttempts = 3;
    }

    /**
     * Initialisation principale
     */
    async init(containerId, options = {}) {
        if (this.isInitialized) {
            console.log('EditorManager already initialized');
            return this.editorInstance;
        }

        console.log('Initializing EditorManager...');

        try {
            // Vérifier les prérequis
            if (!this.checkPrerequisites()) {
                throw new Error('Prerequisites not met');
            }

            // Initialiser le gestionnaire de modales
            this.modalManager = new ModalManager();

            // Initialiser l'éditeur
            this.editorInstance = new RichEditor(containerId, options);

            // Attendre que l'éditeur soit prêt
            await this.waitForEditor();

            // Connecter le gestionnaire de modales à l'éditeur
            this.modalManager.init(this.editorInstance);

            // Configurer les événements globaux
            this.setupGlobalEvents();

            this.isInitialized = true;
            console.log('EditorManager initialized successfully');

            // Émettre un événement de prêt
            this.dispatchEvent('ready', {
                editor: this.editorInstance,
                modalManager: this.modalManager
            });

            return this.editorInstance;

        } catch (error) {
            console.error('Error initializing EditorManager:', error);
            this.initializationAttempts++;

            if (this.initializationAttempts < this.maxInitializationAttempts) {
                console.log(`Retrying initialization (attempt ${this.initializationAttempts + 1}/${this.maxInitializationAttempts})...`);

                // Retry après un délai
                setTimeout(() => {
                    this.init(containerId, options);
                }, 1000);
            } else {
                console.error('Maximum initialization attempts reached');
                throw error;
            }
        }
    }

    /**
     * Vérification des prérequis
     */
    checkPrerequisites() {
        // Vérifier Bootstrap
        if (typeof window.bootstrap === 'undefined') {
            console.error('Bootstrap is required but not loaded');
            return false;
        }

        // Vérifier que les classes sont disponibles
        if (typeof window.RichEditor === 'undefined') {
            console.error('RichEditor class not available');
            return false;
        }

        if (typeof window.ModalManager === 'undefined') {
            console.error('ModalManager class not available');
            return false;
        }

        // Vérifier le DOM
        if (document.readyState === 'loading') {
            console.warn('DOM not ready yet');
            return false;
        }

        return true;
    }

    /**
     * Attendre que l'éditeur soit prêt
     */
    waitForEditor() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 secondes max

            const checkEditor = () => {
                if (this.editorInstance && this.editorInstance.isReady()) {
                    resolve();
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(checkEditor, 100);
                } else {
                    reject(new Error('Editor initialization timeout'));
                }
            };

            checkEditor();
        });
    }

    /**
     * Configuration des événements globaux
     */
    setupGlobalEvents() {
        // Écouter les événements de l'éditeur
        document.addEventListener('richEditorready', (event) => {
            console.log('Editor ready event received');
        });

        // Gérer la fermeture de page
        window.addEventListener('beforeunload', () => {
            this.destroy();
        });

        // Gérer les erreurs globales
        window.addEventListener('error', (event) => {
            if (event.message.includes('RichEditor') || event.message.includes('ModalManager')) {
                console.error('Editor-related error:', event.error);
            }
        });
    }

    /**
     * Obtenir l'instance de l'éditeur
     */
    getEditor() {
        return this.editorInstance;
    }

    /**
     * Obtenir le gestionnaire de modales
     */
    getModalManager() {
        return this.modalManager;
    }

    /**
     * Définir le contenu de l'éditeur
     */
    setContent(content) {
        if (this.editorInstance) {
            this.editorInstance.setContent(content);
        }
    }

    /**
     * Obtenir le contenu de l'éditeur
     */
    getContent() {
        return this.editorInstance ? this.editorInstance.getContent() : '';
    }

    /**
     * Synchroniser le contenu avec le champ caché
     */
    syncContent() {
        return this.editorInstance ? this.editorInstance.syncContent() : '';
    }

    /**
     * Vérifier si le gestionnaire est prêt
     */
    isReady() {
        return this.isInitialized &&
            this.editorInstance &&
            this.editorInstance.isReady() &&
            this.modalManager &&
            this.modalManager.isReady();
    }

    /**
     * Émission d'événement personnalisé
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(`editorManager${eventName}`, { detail });
        document.dispatchEvent(event);
    }

    /**
     * Destruction du gestionnaire
     */
    destroy() {
        if (this.editorInstance) {
            this.editorInstance.destroy();
            this.editorInstance = null;
        }

        if (this.modalManager) {
            this.modalManager = null;
        }

        this.isInitialized = false;
        console.log('EditorManager destroyed');
    }
}

// Instance globale du gestionnaire
window.editorManager = new EditorManager();

/**
 * Fonction utilitaire pour initialiser l'éditeur
 * Compatible avec l'ancienne API pour la rétrocompatibilité
 */
window.createRichEditor = function(containerId, options = {}) {
    console.log('createRichEditor called with legacy API');
    return window.editorManager.init(containerId, options);
};

/**
 * Fonction d'initialisation automatique
 */
function autoInitializeEditor() {
    const container = document.getElementById('richEditor');
    if (container && !window.editorManager.isReady()) {
        const uploadUrl = container.dataset.uploadUrl || '/upload_image';
        const hiddenFieldId = container.dataset.hiddenField || 'hiddenContent';

        window.editorManager.init('richEditor', {
            uploadUrl: uploadUrl,
            hiddenFieldId: hiddenFieldId
        }).catch(error => {
            console.error('Auto-initialization failed:', error);
        });
    }
}

// Auto-initialisation selon l'état du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitializeEditor);
} else if (document.readyState === 'interactive') {
    setTimeout(autoInitializeEditor, 100);
} else {
    autoInitializeEditor();
}

// Réessayer l'initialisation si nécessaire
setTimeout(() => {
    if (!window.editorManager.isReady()) {
        console.log('Retrying editor auto-initialization...');
        autoInitializeEditor();
    }
}, 2000);