/**
 * Insertion de vidéo YouTube/**
 * Rich Text Editor - Version optimisée et modulaire
 * Gère l'éditeur de texte riche avec tableaux, vidéos, images et liens
 */

class RichEditor {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            hiddenFieldId: 'hiddenContent',
            uploadUrl: '/upload_image',
            ...options
        };

        // États de l'éditeur
        this.isInitialized = false;
        this.isFullscreen = false;
        this.isProcessing = false;
        this.selectedImage = null;
        this.selectedTable = null;
        this.selectedVideo = null;

        // Historique pour undo/redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;

        // Éléments DOM
        this.toolbar = null;
        this.editor = null;
        this.hiddenField = null;

        // Initialisation
        this.init();
    }

    /**
     * Initialisation principale
     */
    init() {
        if (!this.container) {
            console.error(`Container with ID '${this.containerId}' not found`);
            return;
        }

        this.toolbar = this.container.querySelector('.editor-toolbar');
        this.editor = this.container.querySelector('.editor-content');
        this.hiddenField = document.getElementById(this.options.hiddenFieldId);

        if (!this.toolbar || !this.editor) {
            console.error('Required editor elements not found');
            return;
        }

        this.setupEventListeners();
        this.updateHiddenField();
        this.saveState();
        this.isInitialized = true;

        // Marquer le conteneur comme prêt
        this.container.classList.add('editor-ready');

        // Émettre un événement de prêt
        this.dispatchEvent('ready', {instance: this});
    }

    /**
     * Configuration des event listeners
     */
    setupEventListeners() {
        // Event listeners de l'éditeur
        this.editor.addEventListener('input', this.handleInput.bind(this));
        this.editor.addEventListener('blur', this.handleBlur.bind(this));
        this.editor.addEventListener('paste', this.handlePaste.bind(this));
        this.editor.addEventListener('keydown', this.handleKeydown.bind(this));
        this.editor.addEventListener('click', this.handleEditorClick.bind(this));

        // Event listeners pour la sélection
        document.addEventListener('selectionchange', this.updateToolbar.bind(this));

        // Event listeners du formulaire
        this.setupFormSubmissionHandler();

        // Configuration des boutons - DIRECTEMENT ICI
        this.setupToolbarButtons();
    }

    /**
     * Configuration directe des boutons de la toolbar
     */
    setupToolbarButtons() {
        console.log('Setting up toolbar buttons...');

        // SUPPRIMER tous les anciens event listeners
        const allButtons = this.toolbar.querySelectorAll('.editor-btn');
        allButtons.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
        });

        // Boutons de formatage de base avec event listeners directs
        const formatButtons = [
            {command: 'bold', selector: '[data-command="bold"]'},
            {command: 'italic', selector: '[data-command="italic"]'},
            {command: 'underline', selector: '[data-command="underline"]'},
            {command: 'strikeThrough', selector: '[data-command="strikeThrough"]'},
            {command: 'insertUnorderedList', selector: '[data-command="insertUnorderedList"]'},
            {command: 'insertOrderedList', selector: '[data-command="insertOrderedList"]'},
            {command: 'justifyLeft', selector: '[data-command="justifyLeft"]'},
            {command: 'justifyCenter', selector: '[data-command="justifyCenter"]'},
            {command: 'justifyRight', selector: '[data-command="justifyRight"]'},
            {command: 'justifyFull', selector: '[data-command="justifyFull"]'},
            {command: 'indent', selector: '[data-command="indent"]'},
            {command: 'outdent', selector: '[data-command="outdent"]'},
            {command: 'insertHorizontalRule', selector: '[data-command="insertHorizontalRule"]'}
        ];

        formatButtons.forEach(({command, selector}) => {
            const btn = this.toolbar.querySelector(selector);
            if (btn) {
                console.log(`Setting up button for command: ${command}`);

                // Supprimer mousedown pour éviter les conflits
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    console.log(`Executing command: ${command}`);

                    // Focus sur l'éditeur
                    this.editor.focus();

                    // Exécuter immédiatement
                    const result = document.execCommand(command, false, null);
                    console.log(`Command ${command} result:`, result);

                    // Mettre à jour
                    this.updateHiddenField();

                    // Mettre à jour l'état du bouton
                    setTimeout(() => {
                        try {
                            const isActive = document.queryCommandState(command);
                            btn.classList.toggle('active', isActive);
                        } catch (e) {
                            console.warn('Cannot check state for:', command);
                        }
                    }, 10);
                });
            }
        });

        // Boutons spéciaux
        const specialButtons = [
            {id: 'linkBtn', handler: () => this.showLinkModal()},
            {id: 'imageBtn', handler: () => this.showImageModal()},
            {id: 'tableBtn', handler: () => this.showTableModal()},
            {id: 'videoBtn', handler: () => this.showVideoModal()},
            {id: 'quoteBtn', handler: () => this.insertQuote()},
            {id: 'codeBtn', handler: () => this.insertCode()},
            {id: 'fullscreenBtn', handler: () => this.toggleFullscreen()}
        ];

        specialButtons.forEach(({id, handler}) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    handler();
                });
            }
        });

        // Sélecteurs de couleur
        this.setupColorPickers();

        console.log('Toolbar setup completed');
    }

    /**
     * Gestionnaire d'input de l'éditeur
     */
    handleInput() {
        this.updateHiddenField();
        this.saveState();
    }

    /**
     * Gestionnaire de blur de l'éditeur
     */
    handleBlur() {
        this.updateHiddenField();
    }

    /**
     * Gestionnaire de paste
     */
    handlePaste() {
        setTimeout(() => this.updateHiddenField(), 100);
    }

    /**
     * Gestionnaire de keydown
     */
    handleKeydown(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'z':
                    e.preventDefault();
                    e.shiftKey ? this.redo() : this.undo();
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
                case 'b':
                    e.preventDefault();
                    this.execCommand('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    this.execCommand('italic');
                    break;
                case 'u':
                    e.preventDefault();
                    this.execCommand('underline');
                    break;
            }
        }

        if (e.key === 'Tab') {
            e.preventDefault();
            this.execCommand('indent');
        }

        setTimeout(() => this.updateHiddenField(), 10);
    }

    /**
     * Gestionnaire de clic dans l'éditeur
     */
    handleEditorClick(e) {
        if (e.target.tagName === 'IMG') {
            this.selectImage(e.target);
        } else if (e.target.closest('table')) {
            this.selectTable(e.target.closest('table'));
        } else if (e.target.closest('.video-main-wrapper')) {
            this.selectVideo(e.target.closest('.video-main-wrapper'));
        } else {
            this.deselectImage();
            this.deselectTable();
            this.deselectVideo();
        }
    }

    /**
     * Configuration du gestionnaire de soumission de formulaire
     */
    setupFormSubmissionHandler() {
        const form = this.hiddenField ? this.hiddenField.closest('form') : null;
        if (form) {
            form.addEventListener('submit', () => {
                this.updateHiddenField();
            });
        }
    }


    /**
     * Configuration des boutons de formatage de base
     */
    setupFormattingButtons() {
        // Boutons avec commandes directes
        const commandButtons = this.toolbar.querySelectorAll('[data-command]');
        commandButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const command = btn.dataset.command;
                this.execCommand(command);
            });
        });
    }

    /**
     * Configuration des sélecteurs de couleur
     */
    setupColorPickers() {
        const textColor = document.getElementById('textColor');
        const bgColor = document.getElementById('bgColor');

        if (textColor) {
            textColor.addEventListener('change', (e) => this.applyTextColor(e.target.value));
        }

        if (bgColor) {
            bgColor.addEventListener('change', (e) => this.applyBackgroundColor(e.target.value));
        }
    }

    /**
     * Application de couleur de texte
     */
    applyTextColor(color) {
        this.editor.focus();
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            this.wrapSelectionWithElement('span', {style: `color: ${color}`});
        }
    }

    /**
     * Application de couleur de fond
     */
    applyBackgroundColor(color) {
        this.editor.focus();
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            this.wrapSelectionWithElement('span', {style: `background-color: ${color}`});
        }
    }

    /**
     * Enrouler la sélection avec un élément
     */
    wrapSelectionWithElement(tagName, attributes = {}) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0 || selection.isCollapsed) return;

        const range = selection.getRangeAt(0);
        const text = range.toString();
        const element = document.createElement(tagName);

        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });

        element.textContent = text;
        range.deleteContents();
        range.insertNode(element);

        this.updateHiddenField();
    }

    /**
     * Affichage du modal de lien
     */
    showLinkModal() {
        const selection = window.getSelection();
        const selectedText = selection.toString();

        const linkText = document.getElementById('linkText');
        const linkUrl = document.getElementById('linkUrl');

        if (linkText) linkText.value = selectedText;
        if (linkUrl) linkUrl.value = '';

        this.showModal('linkModal');
    }

    /**
     * Insertion de lien
     */
    async insertLink() {
        if (this.isProcessing) return Promise.reject('Already processing');

        this.isProcessing = true;
        console.log('Starting link insertion...');

        try {
            const linkText = document.getElementById('linkText')?.value;
            const linkUrl = document.getElementById('linkUrl')?.value;
            const linkTarget = document.getElementById('linkTarget')?.checked;

            if (!linkText || !linkUrl) {
                alert('Veuillez remplir tous les champs');
                return Promise.reject('Missing fields');
            }

            const selection = window.getSelection();
            if (selection.toString()) {
                this.execCommand('createLink', linkUrl);
                const links = this.editor.querySelectorAll(`a[href="${linkUrl}"]`);
                links.forEach(link => {
                    if (linkTarget) {
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                    }
                });
            } else {
                const link = document.createElement('a');
                link.href = linkUrl;
                link.textContent = linkText;
                if (linkTarget) {
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                }
                this.insertNodeAtCursor(link);
            }

            this.updateHiddenField();
            console.log('Link inserted successfully');
            return Promise.resolve();

        } catch (error) {
            console.error('Error inserting link:', error);
            return Promise.reject(error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Affichage du modal d'image
     */
    showImageModal() {
        this.showModal('imageModal');
    }

    /**
     * Insertion d'image
     */
    async insertImage() {
        if (this.isProcessing) return Promise.reject('Already processing');

        this.isProcessing = true;
        console.log('Starting image insertion...');

        try {
            const imageFile = document.getElementById('imageFile');
            const imageUrl = document.getElementById('imageUrl');
            const imageAlt = document.getElementById('imageAlt');

            const file = imageFile?.files[0];
            const url = imageUrl?.value;
            const alt = imageAlt?.value || '';

            let imageSrc = '';

            if (file) {
                imageSrc = await this.uploadImage(file);
            } else if (url) {
                imageSrc = url;
            } else {
                alert('Veuillez sélectionner un fichier ou saisir une URL');
                return Promise.reject('No image source');
            }

            this.insertImageElement(imageSrc, alt);
            console.log('Image inserted successfully');
            return Promise.resolve();

        } catch (error) {
            console.error('Error inserting image:', error);
            alert('Erreur lors de l\'insertion de l\'image');
            return Promise.reject(error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Upload d'image
     */
    async uploadImage(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(this.options.uploadUrl, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Erreur serveur lors de l\'upload');
        }

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        if (!result.link) {
            throw new Error('Aucun lien d\'image retourné');
        }

        return result.link;
    }

    /**
     * Insertion d'élément image
     */
    insertImageElement(src, alt = '') {
        this.editor.focus();

        const imageAlign = document.querySelector('input[name="imageAlign"]:checked')?.value || 'left';
        const imageWidth = document.getElementById('imageWidth')?.value;
        const imageHeight = document.getElementById('imageHeight')?.value;

        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';

        if (imageWidth) {
            img.style.width = imageWidth + 'px';
            img.style.maxWidth = imageWidth + 'px';
        }
        if (imageHeight) {
            img.style.height = imageHeight + 'px';
        }

        const wrapper = this.createImageWrapper(img, imageAlign);
        this.insertNodeAtCursor(wrapper);
        this.setupImageResize(wrapper);
        this.updateHiddenField();
    }

    /**
     * Création du wrapper d'image
     */
    createImageWrapper(img, align) {
        const wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';
        wrapper.style.position = 'relative';
        wrapper.style.margin = '10px 0';
        wrapper.style.display = 'inline-block';

        switch (align) {
            case 'center':
                wrapper.style.display = 'block';
                wrapper.style.textAlign = 'center';
                wrapper.style.margin = '10px auto';
                img.style.margin = '0 auto';
                break;
            case 'right':
                wrapper.style.float = 'right';
                wrapper.style.marginLeft = '15px';
                wrapper.style.marginRight = '0';
                break;
            case 'left':
            default:
                wrapper.style.float = 'left';
                wrapper.style.marginRight = '15px';
                wrapper.style.marginLeft = '0';
                break;
        }

        const handle = document.createElement('div');
        handle.className = 'image-resize-handle';
        handle.style.display = 'none';

        wrapper.appendChild(img);
        wrapper.appendChild(handle);

        return wrapper;
    }

    /**
     * Configuration du redimensionnement d'image avec conservation des proportions
     */
    setupImageResize(wrapper) {
        const img = wrapper.querySelector('img');
        const handle = wrapper.querySelector('.image-resize-handle');

        if (!img || !handle) return;

        let isResizing = false;
        let startX, startY, startWidth, startHeight, aspectRatio;

        const handleMouseDown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(window.getComputedStyle(img).width, 10);
            startHeight = parseInt(window.getComputedStyle(img).height, 10);
            aspectRatio = startWidth / startHeight;

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            // Empêcher la sélection de texte
            document.body.style.userSelect = 'none';
            img.style.pointerEvents = 'none';
        };

        const handleMouseMove = (e) => {
            if (!isResizing) return;
            e.preventDefault();

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            // Utiliser la plus grande variation pour conserver les proportions
            const delta = Math.max(Math.abs(deltaX), Math.abs(deltaY));
            const sign = deltaX >= 0 && deltaY >= 0 ? 1 : -1;

            let newWidth = startWidth + (delta * sign);
            let newHeight = newWidth / aspectRatio;

            // Limites minimales
            if (newWidth < 50) {
                newWidth = 50;
                newHeight = newWidth / aspectRatio;
            }

            // Limites maximales (largeur de l'éditeur)
            const editorWidth = this.editor.clientWidth - 30; // 30px de marge
            if (newWidth > editorWidth) {
                newWidth = editorWidth;
                newHeight = newWidth / aspectRatio;
            }

            img.style.width = Math.round(newWidth) + 'px';
            img.style.height = Math.round(newHeight) + 'px';
            img.style.maxWidth = Math.round(newWidth) + 'px';
        };

        const handleMouseUp = () => {
            if (isResizing) {
                isResizing = false;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.body.style.userSelect = '';
                img.style.pointerEvents = '';
                this.updateHiddenField();
            }
        };

        handle.addEventListener('mousedown', handleMouseDown);

        // Styles améliorés pour le handle
        handle.style.cssText = `
        position: absolute;
        width: 12px;
        height: 12px;
        background: #007bff;
        border: 2px solid white;
        cursor: nw-resize;
        bottom: -6px;
        right: -6px;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        z-index: 10;
        transition: all 0.2s ease;
    `;
    }

    /**
     * Sélection d'image
     */
    selectImage(img) {
        this.deselectImage();
        const wrapper = img.closest('.image-wrapper');
        if (wrapper) {
            wrapper.classList.add('selected');
            const handle = wrapper.querySelector('.image-resize-handle');
            if (handle) {
                handle.style.display = 'block';
            }
            this.selectedImage = wrapper;
        }
    }

    /**
     * Désélection d'image
     */
    deselectImage() {
        if (this.selectedImage) {
            this.selectedImage.classList.remove('selected');
            const handle = this.selectedImage.querySelector('.image-resize-handle');
            if (handle) {
                handle.style.display = 'none';
            }
            this.selectedImage = null;
        }
    }

    /**
     * Affichage du modal de tableau
     */
    showTableModal() {
        this.showModal('tableModal');
    }

    /**
     * Insertion de tableau
     */
    async insertTable() {
        if (this.isProcessing) return Promise.reject('Already processing');

        this.isProcessing = true;
        console.log('Starting table insertion...');

        try {
            const rows = parseInt(document.getElementById('tableRows')?.value) || 3;
            const cols = parseInt(document.getElementById('tableCols')?.value) || 3;
            const hasHeader = document.getElementById('tableHeader')?.checked || false;
            const style = document.querySelector('input[name="tableStyle"]:checked')?.value || 'default';
            const responsive = document.getElementById('tableResponsive')?.checked || false;

            const tableWrapper = this.createTable(rows, cols, hasHeader, style, responsive);
            this.insertNodeAtCursor(tableWrapper);
            this.placeCursorAfterElement(tableWrapper);
            this.updateHiddenField();

            console.log('Table inserted successfully');
            return Promise.resolve();

        } catch (error) {
            console.error('Error inserting table:', error);
            return Promise.reject(error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Création de tableau
     */
    createTable(rows, cols, hasHeader, style, responsive) {
        const mainWrapper = document.createElement('div');
        mainWrapper.className = 'table-main-wrapper';
        mainWrapper.style.cssText = 'margin: 20px 0; clear: both; display: block; width: 100%;';

        let tableClasses = 'table editor-table';
        if (style === 'striped') tableClasses += ' table-striped';
        if (style === 'bordered') tableClasses += ' table-bordered';
        if (style === 'hover') tableClasses += ' table-hover';

        const table = document.createElement('table');
        table.className = tableClasses;
        table.style.cssText = 'width: 100%; border-collapse: collapse; background: white; margin: 0;';

        if (hasHeader) {
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');

            for (let j = 0; j < cols; j++) {
                const th = document.createElement('th');
                th.textContent = `En-tête ${j + 1}`;
                th.contentEditable = true;
                th.style.cssText = `
                    background: #f8f9fa;
                    color: #495057;
                    font-weight: 600;
                    padding: 12px 15px;
                    text-align: left;
                    border-bottom: 2px solid #dee2e6;
                    border-right: 1px solid #dee2e6;
                `;
                headerRow.appendChild(th);
            }
            thead.appendChild(headerRow);
            table.appendChild(thead);
        }

        const tbody = document.createElement('tbody');
        const startRow = hasHeader ? 1 : 0;

        for (let i = startRow; i < rows; i++) {
            const row = document.createElement('tr');
            for (let j = 0; j < cols; j++) {
                const td = document.createElement('td');
                td.textContent = `Cellule ${i + 1}-${j + 1}`;
                td.contentEditable = true;
                td.style.cssText = `
                    padding: 12px 15px;
                    border-bottom: 1px solid #dee2e6;
                    border-right: 1px solid #dee2e6;
                    min-height: 20px;
                    min-width: 80px;
                    word-wrap: break-word;
                `;
                row.appendChild(td);
            }
            tbody.appendChild(row);
        }

        table.appendChild(tbody);
        this.setupTableFeatures(table);

        const wrapper = document.createElement('div');
        wrapper.className = responsive ? 'table-responsive table-wrapper' : 'table-wrapper';
        wrapper.style.cssText = `
            margin-bottom: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            ${responsive ? 'overflow-x: auto;' : 'overflow: hidden;'}
        `;

        wrapper.appendChild(table);
        mainWrapper.appendChild(wrapper);

        const afterParagraph = document.createElement('p');
        afterParagraph.innerHTML = '&nbsp;';
        afterParagraph.style.cssText = 'margin: 10px 0; min-height: 20px; line-height: 1.5;';
        mainWrapper.appendChild(afterParagraph);

        return mainWrapper;
    }

    /**
     * Configuration des fonctionnalités de tableau
     */
    setupTableFeatures(table) {
        table.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectTable(table);
        });
    }

    /**
     * Sélection de tableau
     */
    selectTable(table) {
        this.deselectTable();
        table.classList.add('selected-table');
        this.selectedTable = table;
    }

    /**
     * Désélection de tableau
     */
    deselectTable() {
        if (this.selectedTable) {
            this.selectedTable.classList.remove('selected-table');
            this.selectedTable = null;
        }
    }

    /**
     * Affichage du modal de vidéo
     */
    showVideoModal() {
        this.showModal('videoModal');
    }

    insertVideoAtCursor(videoWrapper) {
        const selection = window.getSelection();

        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(videoWrapper);

            // Placer le curseur après la vidéo
            range.setStartAfter(videoWrapper);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            // Si pas de sélection, ajouter à la fin du contenu
            this.editor.appendChild(videoWrapper);
        }

        this.updateHiddenField();
    }

    /**
     * Insertion de vidéo YouTube
     */
    async insertVideo() {
        if (this.isProcessing) return Promise.reject('Already processing');

        this.isProcessing = true;
        console.log('Starting video insertion...');

        try {
            const videoUrl = document.getElementById('videoUrl')?.value?.trim();
            const width = parseInt(document.getElementById('videoWidth')?.value) || 560;
            const height = parseInt(document.getElementById('videoHeight')?.value) || 315;
            const align = document.querySelector('input[name="videoAlign"]:checked')?.value || 'center';
            const responsive = document.getElementById('videoResponsive')?.checked || false;

            const videoId = this.extractYouTubeId(videoUrl);
            if (!videoId) {
                alert('URL YouTube invalide');
                return Promise.reject('Invalid YouTube URL');
            }

            const videoWrapper = this.createVideoElement(videoId, width, height, align, responsive);

            // UTILISER la même méthode que pour les images
            this.insertVideoAtCursor(videoWrapper);
            this.updateHiddenField();

            console.log('Video inserted successfully');
            return Promise.resolve();

        } catch (error) {
            console.error('Error inserting video:', error);
            return Promise.reject(error);
        } finally {
            this.isProcessing = false;
        }
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
     * Création d'élément vidéo
     */
    createVideoElement(videoId, width, height, align, responsive) {
        const mainWrapper = document.createElement('span'); // Changer de div à span
        mainWrapper.className = 'video-main-wrapper';
        mainWrapper.style.cssText = 'display: inline-block; margin: 10px; vertical-align: top;';

        const embedUrl = `https://www.youtube.com/embed/${videoId}`;

        const iframe = document.createElement('iframe');
        iframe.src = embedUrl;
        iframe.title = 'Vidéo YouTube';
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;

        const wrapper = document.createElement('div');
        wrapper.className = 'video-wrapper';

        if (responsive) {
            // Limiter la largeur initiale même en mode responsive
            const maxInitialWidth = Math.min(560, this.editor.clientWidth - 50);

            wrapper.style.cssText = `
            position: relative;
            width: ${maxInitialWidth}px;
            max-width: 100%;
            height: 0;
            padding-bottom: ${(maxInitialWidth * 0.5625)}px;
            margin-bottom: 15px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: inline-block;
        `;

                iframe.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 8px;
        `;
        } else {
            wrapper.style.cssText = `
            display: inline-block;
            margin-bottom: 15px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            width: auto;
        `;

            iframe.width = width;
            iframe.height = height;
            iframe.style.cssText = 'border: none; border-radius: 8px; display: block;';
        }

        // Configuration de l'alignement
        switch (align) {
            case 'center':
                wrapper.style.display = 'block';
                wrapper.style.margin = '20px auto 15px auto';
                wrapper.style.textAlign = 'center';
                if (!responsive) {
                    wrapper.style.maxWidth = width + 'px';
                }
                break;
            case 'right':
                wrapper.style.float = 'right';
                wrapper.style.marginLeft = '20px';
                wrapper.style.marginRight = '0';
                if (responsive) {
                    wrapper.style.maxWidth = '400px';
                }
                break;
            case 'left':
                wrapper.style.float = 'left';
                wrapper.style.marginRight = '20px';
                wrapper.style.marginLeft = '0';
                if (responsive) {
                    wrapper.style.maxWidth = '400px';
                }
                break;
        }

        wrapper.appendChild(iframe);
        mainWrapper.appendChild(wrapper);

        // Ajouter le redimensionnement APRÈS avoir créé la structure complète
        this.setupVideoResize(mainWrapper);

        return mainWrapper;
    }

    /**
     * Configuration du redimensionnement de vidéo
     */
    setupVideoResize(mainWrapper) {
        const videoWrapper = mainWrapper.querySelector('.video-wrapper');
        const iframe = videoWrapper?.querySelector('iframe');
        if (!iframe || !videoWrapper) return;

        // Créer le handle de redimensionnement
        const handle = document.createElement('div');
        handle.className = 'video-resize-handle';
        handle.style.cssText = `
        position: absolute;
        width: 12px;
        height: 12px;
        background: #dc3545;
        border: 2px solid white;
        cursor: nw-resize;
        bottom: -6px;
        right: -6px;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: none;
        z-index: 10;
        transition: all 0.2s ease;
    `;

        // IMPORTANT: S'assurer que videoWrapper a position relative
        videoWrapper.style.position = 'relative';
        videoWrapper.appendChild(handle);

        let isResizing = false;
        let startX, startY, startWidth, startHeight, isResponsive;
        const aspectRatio = 16 / 9;

        const handleMouseDown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;

            // Détecter si la vidéo est responsive
            isResponsive = videoWrapper.style.paddingBottom ? true : false;

            if (isResponsive) {
                startWidth = parseInt(videoWrapper.style.width) || videoWrapper.clientWidth;
                startHeight = startWidth / aspectRatio;
            } else {
                startWidth = iframe.offsetWidth;
                startHeight = iframe.offsetHeight;
            }

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = 'none';
            iframe.style.pointerEvents = 'none';
        };

        const handleMouseMove = (e) => {
            if (!isResizing) return;
            e.preventDefault();

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            const delta = Math.max(Math.abs(deltaX), Math.abs(deltaY));
            const sign = deltaX >= 0 || deltaY >= 0 ? 1 : -1;

            let newWidth = startWidth + (delta * sign);
            let newHeight = newWidth / aspectRatio;

            // Limites
            const minWidth = 200;
            const maxWidth = this.editor.clientWidth - 50;

            newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
            newHeight = newWidth / aspectRatio;

            // Appliquer les dimensions
            if (isResponsive) {
                videoWrapper.style.width = Math.round(newWidth) + 'px';
                videoWrapper.style.paddingBottom = Math.round(newHeight) + 'px';
            } else {
                videoWrapper.style.width = Math.round(newWidth) + 'px';
                videoWrapper.style.height = Math.round(newHeight) + 'px';
                iframe.style.width = Math.round(newWidth) + 'px';
                iframe.style.height = Math.round(newHeight) + 'px';
                iframe.width = Math.round(newWidth);
                iframe.height = Math.round(newHeight);
            }
        };

        const handleMouseUp = () => {
            if (isResizing) {
                isResizing = false;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.body.style.userSelect = '';
                iframe.style.pointerEvents = '';
                this.updateHiddenField();
            }
        };

        handle.addEventListener('mousedown', handleMouseDown);

        // Gestion de la sélection
        mainWrapper.addEventListener('click', (e) => {
            if (!e.target.classList.contains('video-resize-handle')) {
                e.stopPropagation();
                this.selectVideo(mainWrapper);
            }
        });
    }

    /**
     * Sélection de vidéo
     */
    selectVideo(mainWrapper) {
        this.deselectVideo();
        this.deselectImage(); // Désélectionner les autres éléments
        this.deselectTable();

        mainWrapper.classList.add('selected-video');
        const handle = mainWrapper.querySelector('.video-resize-handle');
        if (handle) {
            handle.style.display = 'block';
        }
        this.selectedVideo = mainWrapper;
    }

    /**
     * Désélection de vidéo
     */
    deselectVideo() {
        if (this.selectedVideo) {
            this.selectedVideo.classList.remove('selected-video');
            const handle = this.selectedVideo.querySelector('.video-resize-handle');
            if (handle) {
                handle.style.display = 'none';
            }
            this.selectedVideo = null;
        }
    }

    /**
     * Insertion de citation
     */
    insertQuote() {
        this.editor.focus();
        const selection = window.getSelection();
        const selectedText = selection.toString();

        const blockquote = document.createElement('blockquote');
        blockquote.textContent = selectedText || 'Votre citation ici...';

        if (selectedText && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(blockquote);
        } else {
            this.insertNodeAtCursor(blockquote);
        }

        this.updateHiddenField();
    }

    /**
     * Insertion de code
     */
    insertCode() {
        this.editor.focus();
        const selection = window.getSelection();
        const selectedText = selection.toString();

        if (selectedText && selection.rangeCount > 0) {
            const code = document.createElement('code');
            code.textContent = selectedText;

            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(code);
        } else {
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.textContent = 'Votre code ici...';
            pre.appendChild(code);

            this.insertNodeAtCursor(pre);
        }

        this.updateHiddenField();
    }

    /**
     * Basculement plein écran
     */
    toggleFullscreen() {
        this.isFullscreen = !this.isFullscreen;
        const fullscreenBtn = document.getElementById('fullscreenBtn');

        if (this.isFullscreen) {
            this.container.classList.add('fullscreen-editor');
            if (fullscreenBtn) {
                fullscreenBtn.innerHTML = '<i class="bi bi-fullscreen-exit"></i>';
            }
            document.body.style.overflow = 'hidden';
        } else {
            this.container.classList.remove('fullscreen-editor');
            if (fullscreenBtn) {
                fullscreenBtn.innerHTML = '<i class="bi bi-fullscreen"></i>';
            }
            document.body.style.overflow = '';
        }
    }

    /**
     * Insertion de nœud au curseur
     */
    insertNodeAtCursor(node) {
        this.editor.focus();

        const selection = window.getSelection();

        if (selection.rangeCount === 0) {
            // Si pas de sélection, ajouter à la fin
            this.editor.appendChild(node);
        } else {
            const range = selection.getRangeAt(0);

            // Supprimer le contenu sélectionné s'il y en a
            range.deleteContents();

            // Insérer le nœud à la position actuelle
            range.insertNode(node);

            // Créer un espace après pour continuer à taper
            const space = document.createTextNode('\u00A0'); // espace insécable
            range.setStartAfter(node);
            range.insertNode(space);

            // Positionner le curseur après l'espace
            range.setStartAfter(space);
            range.collapse(true);

            selection.removeAllRanges();
            selection.addRange(range);
        }

        this.updateHiddenField();
    }

    /**
     * Placement du curseur après un élément
     */
    placeCursorAfterElement(element) {
        const selection = window.getSelection();
        const range = document.createRange();

        const afterParagraph = element.querySelector('p:last-child');

        if (afterParagraph) {
            range.setStart(afterParagraph, 0);
            range.setEnd(afterParagraph, 0);
        } else {
            range.setStartAfter(element);
            range.setEndAfter(element);
        }

        selection.removeAllRanges();
        selection.addRange(range);
        this.editor.focus();
    }

    /**
     * Exécution de commande (version simplifiée)
     */
    execCommand(command, value = null) {
        console.log(`execCommand called: ${command}`);

        // Focus sur l'éditeur
        this.editor.focus();

        // Exécuter la commande
        const result = document.execCommand(command, false, value);
        console.log(`execCommand result for ${command}:`, result);

        // Mettre à jour
        this.updateHiddenField();

        return result;
    }

    /**
     * Mise à jour du champ caché
     */
    updateHiddenField() {
        if (this.hiddenField) {
            this.hiddenField.value = this.editor.innerHTML;
        }
    }

    /**
     * Mise à jour de la toolbar
     */
    updateToolbar() {
        try {
            const commands = ['bold', 'italic', 'underline', 'strikeThrough'];
            commands.forEach(command => {
                const btn = this.toolbar.querySelector(`[data-command="${command}"]`);
                if (btn) {
                    try {
                        const isActive = document.queryCommandState(command);
                        btn.classList.toggle('active', isActive);
                    } catch (e) {
                        // Ignorer les erreurs de queryCommandState
                    }
                }
            });

            // Mettre à jour l'état des boutons d'alignement
            const alignCommands = ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'];
            alignCommands.forEach(command => {
                const btn = this.toolbar.querySelector(`[data-command="${command}"]`);
                if (btn) {
                    try {
                        const isActive = document.queryCommandState(command);
                        btn.classList.toggle('active', isActive);
                    } catch (e) {
                        // Ignorer les erreurs
                    }
                }
            });
        } catch (error) {
            console.error('Error updating toolbar:', error);
        }
    }

    /**
     * Sauvegarde d'état pour l'historique
     */
    saveState() {
        const state = this.editor.innerHTML;

        if (this.history.length === 0 || this.history[this.historyIndex] !== state) {
            this.history = this.history.slice(0, this.historyIndex + 1);
            this.history.push(state);
            this.historyIndex++;

            if (this.history.length > this.maxHistory) {
                this.history.shift();
                this.historyIndex--;
            }
        }
    }

    /**
     * Annuler (Undo)
     */
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.editor.innerHTML = this.history[this.historyIndex];
            this.updateHiddenField();
        }
    }

    /**
     * Refaire (Redo)
     */
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.editor.innerHTML = this.history[this.historyIndex];
            this.updateHiddenField();
        }
    }

    /**
     * Affichage de modal générique
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal && window.bootstrap) {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        }
    }

    /**
     * Émission d'événement personnalisé
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(`richEditor${eventName}`, {detail});
        document.dispatchEvent(event);
    }

    // ===== API PUBLIQUE =====

    /**
     * Définir le contenu
     */
    setContent(content) {
        this.editor.innerHTML = content;
        this.updateHiddenField();
        this.saveState();
    }

    /**
     * Obtenir le contenu HTML
     */
    getContent() {
        return this.editor.innerHTML;
    }

    /**
     * Obtenir le contenu texte
     */
    getText() {
        return this.editor.textContent || this.editor.innerText;
    }

    /**
     * Vider le contenu
     */
    clear() {
        this.editor.innerHTML = '<p><br></p>';
        this.updateHiddenField();
        this.saveState();
    }

    /**
     * Donner le focus
     */
    focus() {
        this.editor.focus();
    }

    /**
     * Synchroniser le contenu
     */
    syncContent() {
        this.updateHiddenField();
        return this.hiddenField ? this.hiddenField.value : '';
    }

    /**
     * Vérifier si l'éditeur est initialisé
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * Destruction de l'éditeur
     */
    destroy() {
        if (this.isFullscreen) {
            this.toggleFullscreen();
        }

        // Nettoyer les event listeners
        this.editor?.removeEventListener('input', this.handleInput);
        this.editor?.removeEventListener('blur', this.handleBlur);
        this.editor?.removeEventListener('paste', this.handlePaste);
        this.editor?.removeEventListener('keydown', this.handleKeydown);
        this.editor?.removeEventListener('click', this.handleEditorClick);

        this.isInitialized = false;
    }
}

// Export de la classe pour utilisation globale
window.RichEditor = RichEditor;