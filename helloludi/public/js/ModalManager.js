/**
 * Gestionnaire des modales pour l'éditeur de texte riche
 * Version corrigée pour résoudre le problème de blocage des modales
 */

class ModalManager {
    constructor() {
        this.editorInstance = null;
        this.isInitialized = false;
        this.resetInProgress = {};
        this.processingInsert = {};
    }

    /**
     * Initialisation du gestionnaire
     */
    init(editorInstance = null) {
        if (this.isInitialized) {
            console.log('ModalManager already initialized');
            return;
        }

        this.editorInstance = editorInstance;
        this.setupEventListeners();
        this.setupValidation();
        this.setupPreviews();
        this.setupAccessibility();
        this.isInitialized = true;

        console.log('ModalManager initialized successfully');
    }

    /**
     * Configuration des event listeners
     */
    setupEventListeners() {
        // Nettoyer les anciens listeners d'abord
        this.cleanupEventListeners();

        // Boutons d'insertion avec gestion asynchrone
        this.bindAsyncButton('insertLinkBtn', () => this.handleLinkInsertion());
        this.bindAsyncButton('insertImageBtn', () => this.handleImageInsertion());
        this.bindAsyncButton('insertTableBtn', () => this.handleTableInsertion());
        this.bindAsyncButton('insertVideoBtn', () => this.handleVideoInsertion());

        // Reset des modales à la fermeture
        const modals = ['linkModal', 'imageModal', 'tableModal', 'videoModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                // Utiliser une seule fois l'événement pour éviter les doublons
                modal.addEventListener('hidden.bs.modal', () => this.resetModal(modalId), { once: false });

                // Nettoyer les états de traitement quand la modale se ferme
                modal.addEventListener('hide.bs.modal', () => {
                    this.processingInsert[modalId] = false;
                });
            }
        });
    }

    /**
     * Nettoyage des anciens event listeners
     */
    cleanupEventListeners() {
        const buttons = ['insertLinkBtn', 'insertImageBtn', 'insertTableBtn', 'insertVideoBtn'];
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                // Cloner le bouton pour supprimer tous les event listeners
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
            }
        });
    }

    /**
     * Liaison d'un bouton avec gestion asynchrone
     */
    bindAsyncButton(buttonId, handler) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', async (e) => {
                e.preventDefault();

                // Empêcher les clics multiples
                if (button.disabled || this.processingInsert[buttonId]) {
                    console.log(`Button ${buttonId} already processing, ignoring click`);
                    return;
                }

                try {
                    // Marquer comme en cours de traitement
                    this.processingInsert[buttonId] = true;
                    button.disabled = true;

                    // Ajouter un indicateur visuel
                    const originalContent = button.innerHTML;
                    button.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Insertion...';

                    // Exécuter le gestionnaire
                    await handler();

                } catch (error) {
                    console.error(`Error in ${buttonId} handler:`, error);
                } finally {
                    // Restaurer l'état du bouton
                    setTimeout(() => {
                        button.disabled = false;
                        button.innerHTML = button.innerHTML.replace(
                            '<span class="spinner-border spinner-border-sm me-1"></span>Insertion...',
                            button.querySelector('i') ? button.querySelector('i').outerHTML + ' ' + button.textContent.trim() : button.textContent
                        );
                        this.processingInsert[buttonId] = false;
                    }, 100);
                }
            });
        }
    }

    /**
     * Configuration de la validation
     */
    setupValidation() {
        // Validation du formulaire d'image
        const imageFile = document.getElementById('imageFile');
        const imageUrl = document.getElementById('imageUrl');

        if (imageFile) {
            imageFile.addEventListener('change', () => this.validateImageModal());
        }
        if (imageUrl) {
            imageUrl.addEventListener('input', () => this.validateImageModal());
        }

        // Validation du formulaire de vidéo
        const videoUrl = document.getElementById('videoUrl');
        if (videoUrl) {
            videoUrl.addEventListener('input', () => this.validateVideoModal());
        }

        // Prévisualisation d'image
        if (imageFile) {
            imageFile.addEventListener('change', (e) => this.handleImagePreview(e));
        }
    }

    /**
     * Configuration des aperçus
     */
    setupPreviews() {
        // Aperçu du tableau
        const tableInputs = ['tableRows', 'tableCols', 'tableHeader', 'tableResponsive'];
        tableInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                const eventType = input.type === 'checkbox' ? 'change' : 'input';
                input.addEventListener(eventType, () => this.updateTablePreview());
            }
        });

        // Styles de tableau
        const tableStyleInputs = document.querySelectorAll('input[name="tableStyle"]');
        tableStyleInputs.forEach(input => {
            input.addEventListener('change', () => this.updateTablePreview());
        });

        // Initialiser l'aperçu du tableau
        this.updateTablePreview();

        // Aperçu de la vidéo
        const videoUrl = document.getElementById('videoUrl');
        if (videoUrl) {
            videoUrl.addEventListener('input', () => this.updateVideoPreview());
        }
    }

    /**
     * Configuration de l'accessibilité
     */
    setupAccessibility() {
        // Focus automatique sur le premier champ
        document.addEventListener('shown.bs.modal', (event) => {
            const modal = event.target;
            const firstInput = modal.querySelector('input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])');

            if (firstInput) {
                setTimeout(() => {
                    firstInput.focus();
                    if (firstInput.select) firstInput.select();
                }, 150);
            }
        });

        // Gestion de la touche Échap
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    const bsModal = bootstrap.Modal.getInstance(openModal);
                    if (bsModal) bsModal.hide();
                }
            }
        });
    }

    /**
     * Gestionnaire d'insertion de lien (version corrigée)
     */
    async handleLinkInsertion() {
        try {
            await this.editorInstance.insertLink();
            // Fermeture forcée de la modale
            this.forceCloseModal('linkModal');
        } catch (error) {
            console.error('Error inserting link:', error);
        }
    }

    /**
     * Gestionnaire d'insertion d'image (version corrigée)
     */
    async handleImageInsertion() {
        try {
            await this.editorInstance.insertImage();
            this.forceCloseModal('imageModal');
        } catch (error) {
            console.error('Error inserting image:', error);
        }
    }

    /**
     * Gestionnaire d'insertion de tableau (version corrigée)
     */
    async handleTableInsertion() {
        try {
            await this.editorInstance.insertTable();
            this.forceCloseModal('tableModal');
        } catch (error) {
            console.error('Error inserting table:', error);
        }
    }

    /**
     * Gestionnaire d'insertion de vidéo (version corrigée)
     */
    async handleVideoInsertion() {
        try {
            await this.editorInstance.insertVideo();
            this.forceCloseModal('videoModal');
        } catch (error) {
            console.error('Error inserting video:', error);
        }
    }

    /**
     * Fermeture forcée d'une modale
     */
    forceCloseModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Méthode 1: Bootstrap
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
            bsModal.hide();
        }

        // Méthode 2: Force manuelle
        setTimeout(() => {
            modal.classList.remove('show');
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');

            // Nettoyer backdrop
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();

            // Restaurer body
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }, 100);
    }

    /**
     * Validation du modal d'image
     */
    validateImageModal() {
        const imageFile = document.getElementById('imageFile');
        const imageUrl = document.getElementById('imageUrl');
        const insertImageBtn = document.getElementById('insertImageBtn');

        if (!insertImageBtn) return;

        const hasFile = imageFile && imageFile.files[0];
        const hasUrl = imageUrl && imageUrl.value.trim();
        insertImageBtn.disabled = !(hasFile || hasUrl);
    }

    /**
     * Validation du modal de vidéo
     */
    validateVideoModal() {
        const videoUrl = document.getElementById('videoUrl');
        const insertVideoBtn = document.getElementById('insertVideoBtn');

        if (!videoUrl || !insertVideoBtn) return;

        const url = videoUrl.value.trim();
        const videoId = this.extractYouTubeId(url);
        insertVideoBtn.disabled = !videoId;

        this.updateVideoPreview();
    }

    /**
     * Extraction de l'ID YouTube
     */
    extractYouTubeId(url) {
        if (!url) return null;
        if (url.match(/^[a-zA-Z0-9_-]{11}$/)) return url;

        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        return null;
    }

    /**
     * Gestion de l'aperçu d'image
     */
    handleImagePreview(event) {
        const file = event.target.files[0];
        const imagePreview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');

        if (file && imagePreview && previewImg) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                imagePreview.style.display = 'block';
                this.validateImageModal();
            };
            reader.readAsDataURL(file);
        } else if (imagePreview) {
            imagePreview.style.display = 'none';
            this.validateImageModal();
        }
    }

    /**
     * Mise à jour de l'aperçu du tableau
     */
    updateTablePreview() {
        const tableRows = document.getElementById('tableRows');
        const tableCols = document.getElementById('tableCols');
        const tableHeader = document.getElementById('tableHeader');
        const tablePreview = document.getElementById('tablePreview');

        if (!tableRows || !tableCols || !tablePreview) return;

        const rows = parseInt(tableRows.value) || 3;
        const cols = parseInt(tableCols.value) || 3;
        const hasHeader = tableHeader ? tableHeader.checked : false;
        const style = document.querySelector('input[name="tableStyle"]:checked')?.value || 'default';
        const responsive = document.getElementById('tableResponsive')?.checked || false;

        let tableClasses = 'table table-sm';
        if (style === 'striped') tableClasses += ' table-striped';
        if (style === 'bordered') tableClasses += ' table-bordered';
        if (style === 'hover') tableClasses += ' table-hover';

        let tableHtml = '';
        if (responsive) {
            tableHtml += '<div class="table-responsive">';
        }

        tableHtml += `<table class="${tableClasses}">`;

        if (hasHeader) {
            tableHtml += '<thead><tr>';
            for (let j = 0; j < cols; j++) {
                tableHtml += `<th>En-tête ${j + 1}</th>`;
            }
            tableHtml += '</tr></thead>';
        }

        tableHtml += '<tbody>';
        const startRow = hasHeader ? 1 : 0;
        for (let i = startRow; i < rows; i++) {
            tableHtml += '<tr>';
            for (let j = 0; j < cols; j++) {
                tableHtml += `<td>Cellule ${i + 1}-${j + 1}</td>`;
            }
            tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table>';

        if (responsive) {
            tableHtml += '</div>';
        }

        tablePreview.innerHTML = tableHtml;
    }

    /**
     * Mise à jour de l'aperçu de la vidéo
     */
    updateVideoPreview() {
        const videoUrl = document.getElementById('videoUrl');
        const videoPreview = document.getElementById('videoPreview');
        const videoPreviewContent = document.getElementById('videoPreviewContent');

        if (!videoUrl || !videoPreview || !videoPreviewContent) return;

        const url = videoUrl.value.trim();
        const videoId = this.extractYouTubeId(url);

        if (videoId) {
            videoPreviewContent.innerHTML = `
                <div style="background: #f0f0f0; padding: 20px; border-radius: 8px;">
                    <div style="background: #000; color: white; padding: 10px; text-align: center; border-radius: 4px;">
                        <i class="bi bi-youtube" style="font-size: 2rem;"></i>
                        <br><strong>Vidéo YouTube</strong>
                        <br><small>ID: ${videoId}</small>
                    </div>
                </div>
            `;
            videoPreview.style.display = 'block';
        } else {
            videoPreview.style.display = 'none';
        }
    }

    /**
     * Reset d'un modal (version optimisée)
     */
    resetModal(modalId) {
        if (this.resetInProgress[modalId]) {
            console.log(`Reset already in progress for ${modalId}, skipping...`);
            return;
        }

        this.resetInProgress[modalId] = true;

        try {
            switch(modalId) {
                case 'linkModal':
                    this.resetLinkModal();
                    break;
                case 'imageModal':
                    this.resetImageModal();
                    break;
                case 'tableModal':
                    this.resetTableModal();
                    break;
                case 'videoModal':
                    this.resetVideoModal();
                    break;
            }
        } finally {
            setTimeout(() => {
                this.resetInProgress[modalId] = false;
            }, 300);
        }
    }

    /**
     * Reset du modal de lien
     */
    resetLinkModal() {
        const linkText = document.getElementById('linkText');
        const linkUrl = document.getElementById('linkUrl');
        const linkTarget = document.getElementById('linkTarget');

        if (linkText) linkText.value = '';
        if (linkUrl) linkUrl.value = '';
        if (linkTarget) linkTarget.checked = true;
    }

    /**
     * Reset du modal d'image
     */
    resetImageModal() {
        const imageFile = document.getElementById('imageFile');
        const imageUrl = document.getElementById('imageUrl');
        const imageAlt = document.getElementById('imageAlt');
        const imageWidth = document.getElementById('imageWidth');
        const imageHeight = document.getElementById('imageHeight');
        const imagePreview = document.getElementById('imagePreview');
        const alignLeft = document.getElementById('alignLeft');

        if (imageFile) imageFile.value = '';
        if (imageUrl) imageUrl.value = '';
        if (imageAlt) imageAlt.value = '';
        if (imageWidth) imageWidth.value = '';
        if (imageHeight) imageHeight.value = '';
        if (imagePreview) imagePreview.style.display = 'none';
        if (alignLeft) alignLeft.checked = true;

        this.validateImageModal();
    }

    /**
     * Reset du modal de tableau
     */
    resetTableModal() {
        const tableRows = document.getElementById('tableRows');
        const tableCols = document.getElementById('tableCols');
        const tableHeader = document.getElementById('tableHeader');
        const tableResponsive = document.getElementById('tableResponsive');
        const defaultStyle = document.getElementById('tableStyleDefault');

        if (tableRows) tableRows.value = '3';
        if (tableCols) tableCols.value = '3';
        if (tableHeader) tableHeader.checked = true;
        if (tableResponsive) tableResponsive.checked = true;
        if (defaultStyle) defaultStyle.checked = true;

        this.updateTablePreview();
    }

    /**
     * Reset du modal de vidéo
     */
    resetVideoModal() {
        const videoUrl = document.getElementById('videoUrl');
        const videoWidth = document.getElementById('videoWidth');
        const videoHeight = document.getElementById('videoHeight');
        const videoPreview = document.getElementById('videoPreview');
        const videoResponsive = document.getElementById('videoResponsive');
        const centerAlign = document.getElementById('videoAlignCenter');
        const insertVideoBtn = document.getElementById('insertVideoBtn');

        if (videoUrl) videoUrl.value = '';
        if (videoWidth) videoWidth.value = '560';
        if (videoHeight) videoHeight.value = '315';
        if (videoPreview) videoPreview.style.display = 'none';
        if (videoResponsive) videoResponsive.checked = true;
        if (centerAlign) centerAlign.checked = true;
        if (insertVideoBtn) insertVideoBtn.disabled = true;
    }

    /**
     * Définir l'instance de l'éditeur
     */
    setEditorInstance(instance) {
        this.editorInstance = instance;
    }

    /**
     * Obtenir l'instance de l'éditeur
     */
    getEditorInstance() {
        return this.editorInstance;
    }

    /**
     * Vérifier si le gestionnaire est initialisé
     */
    isReady() {
        return this.isInitialized;
    }
}

// Export de la classe
window.ModalManager = ModalManager;