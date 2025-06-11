/**
 * Configuration centrale de l'éditeur riche
 */

export const EditorConfig = {
    // Configuration par défaut de l'éditeur
    defaultOptions: {
        hiddenFieldId: 'post_content',
        uploadUrl: '/upload_image',
        placeholder: 'Commencez à taper votre contenu ici...',
        minHeight: 400,
        maxImageSize: 5000000, // 5MB
        allowedImageTypes: ['jpeg', 'jpg', 'png', 'gif'],
        toolbarButtons: [
            'bold', 'italic', 'underline', 'strikethrough',
            'h2', 'h3', 'h4', 'h5', 'h6',
            'insertUnorderedList', 'insertOrderedList',
            'justifyLeft', 'justifyCenter', 'justifyRight',
            'createLink', 'insertImage', 'insertTable', 'insertVideo',
            'blockquote', 'insertHorizontalRule',
            'formatBlock', 'foreColor', 'backColor',
            'subscript', 'superscript',
            'undo', 'redo'
        ]
    },

    // Messages d'erreur
    errorMessages: {
        uploadFailed: 'Erreur lors de l\'upload de l\'image',
        fileTooLarge: 'Le fichier est trop volumineux (max 5MB)',
        invalidFileType: 'Type de fichier non supporté',
        invalidUrl: 'URL invalide',
        networkError: 'Erreur réseau'
    },

    // Templates HTML
    templates: {
        toolbar: `
            <div class="editor-toolbar">
                <div class="toolbar-group">
                    <button type="button" class="editor-btn" data-command="bold" title="Gras">
                        <i class="fi fi-rs-bold"></i>
                    </button>
                    <button type="button" class="editor-btn" data-command="italic" title="Italique">
                        <i class="fi fi-rs-italic"></i>
                    </button>
                    <button type="button" class="editor-btn" data-command="underline" title="Souligné">
                        <i class="fi fi-rs-underline"></i>
                    </button>
                    <button type="button" class="editor-btn" data-command="strikethrough" title="Barré">
                        <i class="fi fi-rs-strikethrough"></i>
                    </button>
                </div>

                <div class="toolbar-group">
                    <select class="editor-select" data-command="formatBlock">
                        <option value="">Format</option>
                        <option value="h2">Titre 2</option>
                        <option value="h3">Titre 3</option>
                        <option value="h4">Titre 4</option>
                        <option value="h5">Titre 5</option>
                        <option value="h6">Titre 6</option>
                        <option value="p">Paragraphe</option>
                    </select>
                </div>

                <div class="toolbar-group">
                    <button type="button" class="editor-btn" data-command="insertUnorderedList" title="Liste à puces">
                        <i class="fi fi-rs-list"></i>
                    </button>
                    <button type="button" class="editor-btn" data-command="insertOrderedList" title="Liste numérotée">
                        <i class="fi fi-rs-list-check"></i>
                    </button>
                </div>

                <div class="toolbar-group">
                    <button type="button" class="editor-btn" data-command="justifyLeft" title="Aligner à gauche">
                        <i class="fi fi-rs-align-left"></i>
                    </button>
                    <button type="button" class="editor-btn" data-command="justifyCenter" title="Centrer">
                        <i class="fi fi-rs-align-center"></i>
                    </button>
                    <button type="button" class="editor-btn" data-command="justifyRight" title="Aligner à droite">
                        <i class="fi fi-rs-align-right"></i>
                    </button>
                </div>

                <div class="toolbar-group">
                    <button type="button" class="editor-btn" id="insertLink" title="Insérer un lien">
                        <i class="fi fi-rs-link"></i>
                    </button>
                    <button type="button" class="editor-btn" id="insertImage" title="Insérer une image">
                        <i class="fi fi-rs-picture"></i>
                    </button>
                    <button type="button" class="editor-btn" id="insertTable" title="Insérer un tableau">
                        <i class="fi fi-rs-table"></i>
                    </button>
                    <button type="button" class="editor-btn" id="insertVideo" title="Insérer une vidéo">
                        <i class="fi fi-rs-video-camera"></i>
                    </button>
                </div>

                <div class="toolbar-group">
                    <button type="button" class="editor-btn" data-command="blockquote" title="Citation">
                        <i class="fi fi-rs-quote-right"></i>
                    </button>
                    <button type="button" class="editor-btn" data-command="insertHorizontalRule" title="Ligne horizontale">
                        <i class="fi fi-rs-horizontal-rule"></i>
                    </button>
                </div>

                <div class="toolbar-group">
                    <input type="color" class="editor-color-picker" id="textColor" title="Couleur du texte">
                    <input type="color" class="editor-color-picker" id="backgroundColor" title="Couleur de fond">
                </div>

                <div class="toolbar-group">
                    <button type="button" class="editor-btn" data-command="subscript" title="Indice">
                        <i class="fi fi-rs-subscript"></i>
                    </button>
                    <button type="button" class="editor-btn" data-command="superscript" title="Exposant">
                        <i class="fi fi-rs-superscript"></i>
                    </button>
                </div>

                <div class="toolbar-group">
                    <button type="button" class="editor-btn" data-command="undo" title="Annuler">
                        <i class="fi fi-rs-undo"></i>
                    </button>
                    <button type="button" class="editor-btn" data-command="redo" title="Refaire">
                        <i class="fi fi-rs-redo"></i>
                    </button>
                </div>
            </div>
        `,

        editorContent: `
            <div class="editor-content" contenteditable="true" id="editorContent">
                {{CONTENT}}
            </div>
        `
    },

    // Styles CSS pour l'éditeur
    styles: `
        .rich-editor-container {
            border: 2px solid #e9ecef;
            border-radius: 15px;
            overflow: hidden;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .editor-toolbar {
            background: #f8f9fa;
            padding: 0.5rem;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        .toolbar-group {
            display: flex;
            gap: 0.25rem;
            align-items: center;
            padding: 0.25rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .editor-btn {
            background: transparent;
            border: none;
            padding: 0.5rem;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .editor-btn:hover {
            background: #e9ecef;
            transform: translateY(-1px);
        }

        .editor-btn.active {
            background: #007bff;
            color: white;
        }

        .editor-select {
            border: none;
            background: transparent;
            padding: 0.25rem;
            border-radius: 4px;
            cursor: pointer;
        }

        .editor-color-picker {
            width: 30px;
            height: 30px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        .editor-content {
            min-height: 400px;
            padding: 1.5rem;
            font-size: 1rem;
            line-height: 1.6;
            outline: none;
        }

        .editor-content:focus {
            outline: none;
        }

        .editor-content h2,
        .editor-content h3,
        .editor-content h4,
        .editor-content h5,
        .editor-content h6 {
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
            font-weight: 600;
        }

        .editor-content blockquote {
            border-left: 4px solid #007bff;
            padding-left: 1rem;
            margin: 1rem 0;
            font-style: italic;
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 0 8px 8px 0;
        }

        .editor-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
        }

        .editor-content table td,
        .editor-content table th {
            border: 1px solid #ddd;
            padding: 0.5rem;
            text-align: left;
        }

        .editor-content table th {
            background: #f8f9fa;
            font-weight: 600;
        }

        .editor-content img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 1rem 0;
        }

        .editor-content hr {
            border: none;
            height: 2px;
            background: linear-gradient(to right, #007bff, transparent);
            margin: 2rem 0;
        }
    `
};