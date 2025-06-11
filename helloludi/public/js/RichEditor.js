class RichEditor {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.options = options;
        this.hiddenFieldId = options.hiddenFieldId || null;
        this.quill = null;
        this.hoverButton = null;
        this.currentElement = null;
        this.init();
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Initialize Quill
        const toolbarSelector = '#' + this.containerId + '-toolbar';
        this.quill = new Quill(container.querySelector('.editor-content'), {
            modules: {
                toolbar: toolbarSelector
            },
            theme: 'snow'
        });

        // Load content from hidden field
        const hidden = document.getElementById(this.hiddenFieldId);
        if (hidden && hidden.value) {
            this.quill.root.innerHTML = hidden.value;
        }

        this.quill.on('text-change', () => this.updateHiddenField());

        this.setupHoverButton(container);
        this.setupToolbarHandlers();
    }

    updateHiddenField() {
        if (!this.hiddenFieldId) return;
        const hidden = document.getElementById(this.hiddenFieldId);
        if (hidden) hidden.value = this.quill.root.innerHTML;
    }

    setupToolbarHandlers() {
        const toolbar = this.quill.getModule('toolbar');
        toolbar.addHandler('image', () => this.showImageModal());
        toolbar.addHandler('video', () => this.showVideoModal());
        toolbar.addHandler('link', () => this.showLinkModal());
        toolbar.addHandler('table', () => this.showTableModal());
        toolbar.addHandler('hr', () => this.insertHorizontalRule());
    }

    setupHoverButton(container) {
        const btn = document.createElement('button');
        btn.className = 'editor-hover-button';
        btn.type = 'button';
        btn.textContent = '⚙';
        container.appendChild(btn);
        this.hoverButton = btn;

        container.addEventListener('mouseover', (e) => {
            const el = e.target;
            if (['IMG', 'IFRAME', 'TABLE'].includes(el.tagName)) {
                const rect = el.getBoundingClientRect();
                const parentRect = container.getBoundingClientRect();
                btn.style.top = (rect.top - parentRect.top + container.scrollTop) + 'px';
                btn.style.left = (rect.left - parentRect.left + container.scrollLeft + rect.width - 20) + 'px';
                btn.style.display = 'block';
                btn.dataset.type = el.tagName.toLowerCase();
                this.currentElement = el;
            }
        });

        container.addEventListener('mouseleave', () => {
            btn.style.display = 'none';
            this.currentElement = null;
        });

        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            if (type === 'img') this.showImageModal(this.currentElement);
            else if (type === 'iframe') this.showVideoModal(this.currentElement);
            else if (type === 'table') this.showTableModal(this.currentElement);
        });
    }

    showImageModal(el) {
        const modalEl = document.getElementById('imageModal');
        if (!modalEl) return;
        const input = modalEl.querySelector('input');
        input.value = el ? el.getAttribute('src') : '';
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
        modalEl.querySelector('.insert-image-btn').onclick = () => {
            const url = input.value.trim();
            if (url) {
                if (el) {
                    el.setAttribute('src', url);
                } else {
                    this.insertImage(url);
                }
            }
            modal.hide();
        };
    }

    showVideoModal(el) {
        const modalEl = document.getElementById('videoModal');
        if (!modalEl) return;
        const input = modalEl.querySelector('input');
        input.value = el ? el.getAttribute('src') : '';
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
        modalEl.querySelector('.insert-video-btn').onclick = () => {
            const url = input.value.trim();
            if (url) {
                if (el) {
                    el.setAttribute('src', url);
                } else {
                    this.insertVideo(url);
                }
            }
            modal.hide();
        };
    }

    showLinkModal() {
        const modalEl = document.getElementById('linkModal');
        if (!modalEl) return;
        const input = modalEl.querySelector('input');
        input.value = '';
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
        modalEl.querySelector('.insert-link-btn').onclick = () => {
            const url = input.value.trim();
            if (url) {
                let range = this.quill.getSelection();
                if (range) {
                    this.quill.format('link', url);
                }
            }
            modal.hide();
        };
    }

    showTableModal(el) {
        const modalEl = document.getElementById('tableModal');
        if (!modalEl) return;
        const rowsInput = modalEl.querySelector('input[name="rows"]');
        const colsInput = modalEl.querySelector('input[name="cols"]');
        rowsInput.value = '2';
        colsInput.value = '2';
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
        modalEl.querySelector('.insert-table-btn').onclick = () => {
            const rows = parseInt(rowsInput.value, 10) || 2;
            const cols = parseInt(colsInput.value, 10) || 2;
            if (el) {
                // simple rebuild
                el.innerHTML = this.buildTableBody(rows, cols);
            } else {
                this.insertTable(rows, cols);
            }
            modal.hide();
        };
    }

    buildTableBody(rows, cols) {
        let html = '';
        for (let r = 0; r < rows; r++) {
            html += '<tr>';
            for (let c = 0; c < cols; c++) {
                html += '<td>&nbsp;</td>';
            }
            html += '</tr>';
        }
        return html;
    }

    insertImage(url) {
        const range = this.quill.getSelection(true);
        this.quill.insertEmbed(range.index, 'image', url, Quill.sources.USER);
    }

    insertVideo(url) {
        const range = this.quill.getSelection(true);
        this.quill.insertEmbed(range.index, 'video', url, Quill.sources.USER);
    }

    insertTable(rows, cols) {
        let table = '<table class="table table-bordered">' + this.buildTableBody(rows, cols) + '</table>';
        const range = this.quill.getSelection(true);
        this.quill.clipboard.dangerouslyPasteHTML(range.index, table);
    }

    insertHorizontalRule() {
        const range = this.quill.getSelection(true);
        this.quill.clipboard.dangerouslyPasteHTML(range.index, '<hr>');
    }
}

window.RichEditor = RichEditor;
