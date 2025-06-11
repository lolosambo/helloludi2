/**
 * Corrections et utilitaires pour les modales bloquées
 * À inclure après les autres scripts ou intégrer dans ModalManager
 */

(function() {
    'use strict';

    /**
     * Utilitaire pour forcer la fermeture de toutes les modales
     */
    function forceCloseAllModals() {
        // Fermer toutes les instances Bootstrap Modal
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(modal => {
            try {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) {
                    bsModal.hide();
                }
            } catch (error) {
                console.warn('Error closing modal with Bootstrap:', error);
            }
        });

        // Forcer la fermeture manuelle
        setTimeout(() => {
            const stillOpenModals = document.querySelectorAll('.modal.show');
            stillOpenModals.forEach(modal => {
                modal.classList.remove('show');
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
            });

            // Nettoyer les backdrops
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());

            // Restaurer le body
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }, 100);
    }

    /**
     * Vérifier et corriger les modales bloquées périodiquement
     */
    function checkForStuckModals() {
        const openModals = document.querySelectorAll('.modal.show');
        const backdrops = document.querySelectorAll('.modal-backdrop');

        // Si il y a des backdrops mais pas de modales ouvertes, nettoyer
        if (backdrops.length > 0 && openModals.length === 0) {
            console.log('Found orphaned modal backdrops, cleaning up...');
            backdrops.forEach(backdrop => backdrop.remove());
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }

        // Si le body a la classe modal-open mais pas de modales ouvertes
        if (document.body.classList.contains('modal-open') && openModals.length === 0) {
            console.log('Found modal-open class without open modals, cleaning up...');
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
    }

    /**
     * Ajouter des event listeners pour détecter les problèmes de modales
     */
    function setupModalMonitoring() {
        // Surveiller les clics sur les backdrops
        document.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal-backdrop')) {
                console.log('Backdrop clicked, checking modal state...');
                setTimeout(checkForStuckModals, 100);
            }
        });

        // Surveiller les événements de fermeture de modales
        document.addEventListener('hidden.bs.modal', function(event) {
            console.log('Modal hidden event detected');
            setTimeout(checkForStuckModals, 100);
        });

        // Surveiller les touches ESC
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                setTimeout(checkForStuckModals, 100);
            }
        });
    }

    /**
     * Ajouter un bouton de déblocage d'urgence (pour le développement)
     */
    function addEmergencyUnlockButton() {
        if (document.getElementById('modalEmergencyUnlock')) return;

        const button = document.createElement('button');
        button.id = 'modalEmergencyUnlock';
        button.className = 'btn btn-danger btn-sm';
        button.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 10000;
            display: none;
        `;
        button.innerHTML = '<i class="bi bi-unlock"></i> Débloquer';
        button.title = 'Débloquer toutes les modales';

        button.addEventListener('click', function() {
            forceCloseAllModals();
            button.style.display = 'none';
        });

        document.body.appendChild(button);

        // Montrer le bouton si des modales sont bloquées
        setInterval(() => {
            const hasStuckModals = document.body.classList.contains('modal-open') ||
                document.querySelectorAll('.modal-backdrop').length > 0;

            if (hasStuckModals) {
                button.style.display = 'block';
            } else {
                button.style.display = 'none';
            }
        }, 1000);
    }

    /**
     * Corriger les problèmes de z-index des modales
     */
    function fixModalZIndex() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach((modal, index) => {
            const baseZIndex = 1050;
            modal.style.zIndex = baseZIndex + (index * 10);

            // Assurer que le backdrop a un z-index approprié
            modal.addEventListener('show.bs.modal', function() {
                setTimeout(() => {
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) {
                        backdrop.style.zIndex = modal.style.zIndex - 1;
                    }
                }, 50);
            });
        });
    }

    /**
     * API publique pour le débogage des modales
     */
    window.ModalDebugger = {
        forceCloseAll: forceCloseAllModals,
        checkStuck: checkForStuckModals,
        getOpenModals: () => document.querySelectorAll('.modal.show'),
        getBackdrops: () => document.querySelectorAll('.modal-backdrop'),
        getBodyState: () => ({
            hasModalOpen: document.body.classList.contains('modal-open'),
            overflow: document.body.style.overflow,
            paddingRight: document.body.style.paddingRight
        })
    };

    /**
     * Initialisation automatique
     */
    function init() {
        console.log('Modal fixes initialized');

        setupModalMonitoring();
        fixModalZIndex();

        // Ajouter le bouton d'urgence seulement en développement
        if (window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.search.includes('debug=1')) {
            addEmergencyUnlockButton();
        }

        // Vérification périodique
        setInterval(checkForStuckModals, 5000);
    }

    // Démarrer l'initialisation
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();