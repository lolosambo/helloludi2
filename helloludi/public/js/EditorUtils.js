/**
 * Utilitaires pour l'éditeur riche
 */

import { EditorConfig } from './EditorConfig.js';

export class EditorUtils {
    /**
     * Génère un ID unique
     */
    static generateId() {
        return 'editor_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Valide une URL
     */
    static isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * Valide une URL d'image
     */
    static isValidImageUrl(url) {
        if (!this.isValidUrl(url)) return false;
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    }

    /**
     * Valide une URL YouTube
     */
    static isValidYouTubeUrl(url) {
        const regex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        return regex.test(url);
    }

    /**
     * Extrait l'ID d'une vidéo YouTube
     */
    static extractYouTubeId(url) {
        const regex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    /**
     * Formate la taille d'un fichier
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Valide un fichier image
     */
    static validateImageFile(file) {
        const errors = [];

        // Vérifier la taille
        if (file.size > EditorConfig.defaultOptions.maxImageSize) {
            errors.push(EditorConfig.errorMessages.fileTooLarge);
        }

        // Vérifier le type
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!EditorConfig.defaultOptions.allowedImageTypes.includes(fileExtension)) {
            errors.push(EditorConfig.errorMessages.invalidFileType);
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Nettoie le HTML
     */
    static sanitizeHtml(html) {
        // Créer un élément temporaire pour nettoyer le HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Supprimer les scripts et autres éléments dangereux
        const scripts = temp.querySelectorAll('script');
        scripts.forEach(script => script.remove());

        const links = temp.querySelectorAll('link');
        links.forEach(link => link.remove());

        // Nettoyer les attributs dangereux
        const allElements = temp.querySelectorAll('*');
        allElements.forEach(el => {
            // Supprimer les attributs de style inline potentiellement dangereux
            const style = el.getAttribute('style');
            if (style && (style.includes('javascript:') || style.includes('expression('))) {
                el.removeAttribute('style');
            }

            // Supprimer les attributs d'événements
            const attributes = [...el.attributes];
            attributes.forEach(attr => {
                if (attr.name.startsWith('on')) {
                    el.removeAttribute(attr.name);
                }
            });
        });

        return temp.innerHTML;
    }

    /**
     * Obtient la sélection courante
     */
    static getSelection() {
        if (window.getSelection) {
            return window.getSelection();
        } else if (document.selection) {
            return document.selection.createRange();
        }
        return null;
    }

    /**
     * Sauvegarde la sélection courante
     */
    static saveSelection() {
        const selection = this.getSelection();
        if (selection.rangeCount > 0) {
            return selection.getRangeAt(0);
        }
        return null;
    }

    /**
     * Restaure la sélection sauvegardée
     */
    static restoreSelection(range) {
        if (range) {
            const selection = this.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    /**
     * Insère du HTML à la position du curseur
     */
    static insertHtmlAtCursor(html) {
        const selection = this.getSelection();

        if (selection.rangeCount) {
            const range = selection.getRangeAt(0);
            range.deleteContents();

            const div = document.createElement('div');
            div.innerHTML = html;

            const frag = document.createDocumentFragment();
            let node, lastNode;

            while (node = div.firstChild) {
                lastNode = frag.appendChild(node);
            }

            range.insertNode(frag);

            if (lastNode) {
                range = range.cloneRange();
                range.setStartAfter(lastNode);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }

    /**
     * Obtient l'élément parent d'un type donné
     */
    static getParentElement(element, tagName) {
        while (element && element.tagName !== tagName.toUpperCase()) {
            element = element.parentElement;
        }
        return element;
    }

    /**
     * Vérifie si l'élément courant est dans un conteneur spécifique
     */
    static isInElement(tagName) {
        const selection = this.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
            return this.getParentElement(element, tagName) !== null;
        }
        return false;
    }

    /**
     * Crée un élément avec des attributs
     */
    static createElement(tagName, attributes = {}, textContent = '') {
        const element = document.createElement(tagName);

        Object.keys(attributes).forEach(key => {
            element.setAttribute(key, attributes[key]);
        });

        if (textContent) {
            element.textContent = textContent;
        }

        return element;
    }

    /**
     * Affiche une notification
     */
    static showNotification(message, type = 'info', duration = 3000) {
        // Créer l'élément de notification
        const notification = this.createElement('div', {
            class: `editor-notification editor-notification-${type}`,
            style: `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff'};
                color: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-size: 0.9rem;
                max-width: 300px;
                animation: slideInRight 0.3s ease;
            `
        }, message);

        // Ajouter l'animation CSS
        if (!document.querySelector('#editor-notification-styles')) {
            const styles = this.createElement('style', { id: 'editor-notification-styles' });
            styles.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Supprimer après la durée spécifiée
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    /**
     * Débounce une fonction
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Escape HTML
     */
    static escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}