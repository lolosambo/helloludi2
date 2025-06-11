/*
 * RichEditor - rewritten modern version preserving existing design
 * Handles rich text editing with images, tables and videos
 */

class RichEditor {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = Object.assign({
            hiddenFieldId: 'hiddenContent',
            uploadUrl: '/upload_image'
        }, options);

        this.toolbar = this.container.querySelector('.editor-toolbar');
        this.editor = this.container.querySelector('.editor-content');
        this.hiddenField = document.getElementById(this.options.hiddenFieldId);

        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
        this.isFullscreen = false;
        this.savedRange = null;
        this.selectedImage = null;
        this.selectedTable = null;
        this.selectedVideo = null;
        this.imageToEdit = null;

        this.init();
    }

    /* ---------- initialisation ---------- */
    init() {
        if (!this.container || !this.editor || !this.toolbar) {
            console.error('RichEditor: container or essential elements missing');
            return;
        }

        this.setupToolbar();
        this.setupColorPickers();
        this.setupFormSync();

        this.editor.addEventListener('input', () => this.onInput());
        this.editor.addEventListener('paste', () => setTimeout(() => this.updateHidden(), 10));
        this.editor.addEventListener('keydown', e => this.onKeydown(e));
        this.editor.addEventListener('click', e => this.onEditorClick(e));

        this.updateHidden();
        this.saveState();

        this.container.classList.add('editor-ready');
        this.dispatch('ready', { instance: this });
    }

    setupToolbar() {
        this.toolbar.querySelectorAll('[data-command]').forEach(btn => {
            btn.addEventListener('click', e => {
                e.preventDefault();
                const cmd = btn.dataset.command;
                this.exec(cmd);
            });
        });

        const specials = {
            linkBtn: () => this.showModal('linkModal'),
            imageBtn: () => this.showModal('imageModal'),
            tableBtn: () => this.showModal('tableModal'),
            videoBtn: () => this.showModal('videoModal'),
            quoteBtn: () => this.insertQuote(),
            codeBtn: () => this.insertCode(),
            fullscreenBtn: () => this.toggleFullscreen()
        };
        Object.keys(specials).forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('mousedown', () => this.saveSelection());
                btn.addEventListener('click', e => {
                    e.preventDefault();
                    specials[id]();
                });
            }
        });
    }

    setupColorPickers() {
        const tc = document.getElementById('textColor');
        const bc = document.getElementById('bgColor');
        tc && tc.addEventListener('change', e => this.applyTextColor(e.target.value));
        bc && bc.addEventListener('change', e => this.applyBackgroundColor(e.target.value));
    }

    setupFormSync() {
        if (!this.hiddenField) return;
        const form = this.hiddenField.closest('form');
        if (form) form.addEventListener('submit', () => this.updateHidden());
    }

    /* ---------- basic handlers ---------- */
    onInput() {
        this.updateHidden();
        this.saveState();
    }

    onKeydown(e) {
        if ((e.ctrlKey || e.metaKey) && !e.altKey) {
            switch (e.key.toLowerCase()) {
                case 'z': e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); return;
                case 'y': e.preventDefault(); this.redo(); return;
                case 'b': e.preventDefault(); this.exec('bold'); return;
                case 'i': e.preventDefault(); this.exec('italic'); return;
                case 'u': e.preventDefault(); this.exec('underline'); return;
            }
        }
        if (e.key === 'Tab') { e.preventDefault(); this.exec('indent'); }
    }

    onEditorClick(e) {
        if (e.target.closest('.image-wrapper')) this.selectImage(e.target.closest('.image-wrapper'));
        else this.deselectImage();

        if (e.target.closest('table')) this.selectTable(e.target.closest('table'));
        else this.deselectTable();

        if (e.target.closest('.video-main-wrapper')) this.selectVideo(e.target.closest('.video-main-wrapper'));
        else this.deselectVideo();
    }

    /* ---------- commands ---------- */
    exec(command, value = null) {
        this.editor.focus();
        document.execCommand(command, false, value);
        this.updateHidden();
        this.updateToolbarState();
    }

    applyTextColor(color) {
        this.exec('foreColor', color);
    }

    applyBackgroundColor(color) {
        this.exec('hiliteColor', color);
    }

    updateToolbarState() {
        const cmds = ['bold', 'italic', 'underline', 'strikeThrough', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'];
        cmds.forEach(cmd => {
            const btn = this.toolbar.querySelector(`[data-command="${cmd}"]`);
            if (btn) {
                try {
                    btn.classList.toggle('active', document.queryCommandState(cmd));
                } catch { /* ignore */ }
            }
        });
    }

    /* ---------- selection helpers ---------- */
    saveSelection() {
        const sel = window.getSelection();
        if (sel && sel.rangeCount) this.savedRange = sel.getRangeAt(0).cloneRange();
    }

    restoreSelection() {
        if (this.savedRange) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(this.savedRange);
        }
    }

    insertNodeAtCursor(node) {
        this.restoreSelection();
        const sel = window.getSelection();
        if (!sel.rangeCount) { this.editor.appendChild(node); return; }
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(node);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        this.updateHidden();
    }

    /* ---------- link ---------- */
    async insertLink() {
        const text = document.getElementById('linkText').value.trim();
        const url = document.getElementById('linkUrl').value.trim();
        const target = document.getElementById('linkTarget').checked;
        if (!text || !url) return;

        if (window.getSelection().toString()) {
            this.exec('createLink', url);
            const links = this.editor.querySelectorAll(`a[href="${url}"]`);
            links.forEach(l => { if (target) { l.target = '_blank'; l.rel = 'noopener noreferrer'; } });
        } else {
            const a = document.createElement('a');
            a.href = url;
            a.textContent = text;
            if (target) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
            this.insertNodeAtCursor(a);
        }
    }

    showLinkModal() { this.saveSelection(); this.showModal('linkModal'); }

    /* ---------- image ---------- */
    async insertImage() {
        const fileInput = document.getElementById('imageFile');
        const urlInput = document.getElementById('imageUrl');
        const altInput = document.getElementById('imageAlt');
        let src = '';
        if (fileInput && fileInput.files[0]) src = await this.uploadImage(fileInput.files[0]);
        else if (urlInput && urlInput.value.trim()) src = urlInput.value.trim();
        if (!src) return;
        const alt = altInput ? altInput.value : '';
        if (this.imageToEdit) {
            const img = this.imageToEdit.querySelector('img');
            if (img) {
                img.src = src;
                img.alt = alt;
                const w = document.getElementById('imageWidth')?.value;
                const h = document.getElementById('imageHeight')?.value;
                if (w) { img.style.width = w + 'px'; img.style.maxWidth = w + 'px'; } else {
                    img.style.removeProperty('width');
                    img.style.removeProperty('max-width');
                }
                if (h) img.style.height = h + 'px'; else img.style.removeProperty('height');
                this.imageToEdit.style.float = '';
                this.imageToEdit.style.display = '';
                this.imageToEdit.style.textAlign = '';
                this.imageToEdit.style.marginLeft = '';
                this.imageToEdit.style.marginRight = '';
                const align = document.querySelector('input[name="imageAlign"]:checked')?.value || 'left';
                if (align === 'center') { this.imageToEdit.style.display = 'block'; this.imageToEdit.style.textAlign = 'center'; }
                if (align === 'right') { this.imageToEdit.style.float = 'right'; this.imageToEdit.style.marginLeft = '15px'; }
                if (align === 'left') { this.imageToEdit.style.float = 'left'; this.imageToEdit.style.marginRight = '15px'; }
                this.imageToEdit = null;
                this.updateHidden();
            }
        } else {
            this.insertImageElement(src, alt);
        }
    }

    async uploadImage(file) {
        const data = new FormData();
        data.append('file', file);
        const res = await fetch(this.options.uploadUrl, { method: 'POST', body: data });
        if (!res.ok) throw new Error('upload failed');
        const json = await res.json();
        return json.link;
    }

    insertImageElement(src, alt = '') {
        const align = document.querySelector('input[name="imageAlign"]:checked')?.value || 'left';
        const w = document.getElementById('imageWidth')?.value;
        const h = document.getElementById('imageHeight')?.value;
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        if (w) { img.style.width = w + 'px'; img.style.maxWidth = w + 'px'; }
        if (h) img.style.height = h + 'px';
        img.style.maxWidth = '100%';

        const wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';
        wrapper.appendChild(img);
        const handle = document.createElement('div');
        handle.className = 'image-resize-handle';
        wrapper.appendChild(handle);

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'image-edit-btn btn btn-light btn-sm';
        editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
        Object.assign(editBtn.style, {
            position: 'absolute',
            top: '4px',
            right: '4px',
            display: 'none',
            padding: '2px 4px'
        });
        editBtn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            this.selectImage(wrapper);
            this.saveSelection();
            this.fillImageModal(wrapper);
            this.showModal('imageModal');
        });
        wrapper.appendChild(editBtn);
        wrapper.style.position = 'relative';
        if (align === 'center') { wrapper.style.display = 'block'; wrapper.style.textAlign = 'center'; }
        if (align === 'right') { wrapper.style.float = 'right'; wrapper.style.marginLeft = '15px'; }
        if (align === 'left') { wrapper.style.float = 'left'; wrapper.style.marginRight = '15px'; }

        this.insertNodeAtCursor(wrapper);
        this.setupImageResize(wrapper);
    }

    setupImageResize(wrapper) {
        const img = wrapper.querySelector('img');
        const handle = wrapper.querySelector('.image-resize-handle');
        if (!img || !handle) return;
        let startX, startY, startW, startH, active = false;
        handle.addEventListener('mousedown', e => {
            e.preventDefault();
            active = true;
            startX = e.clientX; startY = e.clientY;
            startW = img.offsetWidth; startH = img.offsetHeight;
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        });
        const move = e => {
            if (!active) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const ratio = startW / startH;
            let newW = startW + dx;
            let newH = newW / ratio;
            if (newH < startH + dy) {
                newH = startH + dy;
                newW = newH * ratio;
            }
            if (newW < 50) { newW = 50; newH = newW / ratio; }
            img.style.width = newW + 'px';
            img.style.height = newH + 'px';
        };
        const up = () => {
            if (active) {
                active = false;
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', up);
                this.updateHidden();
            }
        };
    }

    selectImage(wrapper) {
        this.deselectImage();
        this.selectedImage = wrapper;
        wrapper.classList.add('selected');
        const handle = wrapper.querySelector('.image-resize-handle');
        if (handle) handle.style.display = 'block';
        const editBtn = wrapper.querySelector('.image-edit-btn');
        if (editBtn) editBtn.style.display = 'block';
    }

    deselectImage() {
        if (this.selectedImage) {
            this.selectedImage.classList.remove('selected');
            const handle = this.selectedImage.querySelector('.image-resize-handle');
            if (handle) handle.style.display = 'none';
            const editBtn = this.selectedImage.querySelector('.image-edit-btn');
            if (editBtn) editBtn.style.display = 'none';
            this.selectedImage = null;
        }
    }

    showImageModal() {
        this.imageToEdit = null;
        this.saveSelection();
        this.showModal('imageModal');
    }

    fillImageModal(wrapper) {
        const img = wrapper.querySelector('img');
        if (!img) return;
        this.imageToEdit = wrapper;
        const urlInput = document.getElementById('imageUrl');
        const altInput = document.getElementById('imageAlt');
        const wInput = document.getElementById('imageWidth');
        const hInput = document.getElementById('imageHeight');
        const alignLeft = document.getElementById('alignLeft');
        const alignCenter = document.getElementById('alignCenter');
        const alignRight = document.getElementById('alignRight');
        if (urlInput) urlInput.value = img.src;
        if (altInput) altInput.value = img.alt;
        if (wInput) wInput.value = parseInt(img.style.width) || '';
        if (hInput) hInput.value = parseInt(img.style.height) || '';
        if (alignLeft && alignCenter && alignRight) {
            if (wrapper.style.float === 'right') alignRight.checked = true;
            else if (wrapper.style.float === 'left') alignLeft.checked = true;
            else alignCenter.checked = true;
        }
    }

    /* ---------- table ---------- */
    async insertTable() {
        const rows = parseInt(document.getElementById('tableRows').value) || 3;
        const cols = parseInt(document.getElementById('tableCols').value) || 3;
        const header = document.getElementById('tableHeader').checked;
        const style = document.querySelector('input[name="tableStyle"]:checked').value || 'default';
        const responsive = document.getElementById('tableResponsive').checked;
        const table = this.createTable(rows, cols, header, style, responsive);
        this.insertNodeAtCursor(table);
        this.placeCursorAfter(table);
    }

    createTable(rows, cols, hasHeader, style, responsive) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-main-wrapper';
        let table = document.createElement('table');
        table.className = 'table editor-table';
        if (style === 'striped') table.classList.add('table-striped');
        if (style === 'bordered') table.classList.add('table-bordered');
        if (style === 'hover') table.classList.add('table-hover');
        if (responsive) {
            const resp = document.createElement('div');
            resp.className = 'table-responsive';
            resp.appendChild(table);
            wrapper.appendChild(resp);
        } else {
            wrapper.appendChild(table);
        }

        if (hasHeader) {
            const thead = table.createTHead();
            const tr = thead.insertRow();
            for (let c = 0; c < cols; c++) {
                const th = document.createElement('th');
                th.textContent = `En-t\u00eate ${c + 1}`;
                th.contentEditable = true;
                tr.appendChild(th);
            }
        }

        const tbody = table.createTBody();
        for (let r = 0; r < rows - (hasHeader ? 1 : 0); r++) {
            const tr = tbody.insertRow();
            for (let c = 0; c < cols; c++) {
                const td = tr.insertCell();
                td.textContent = `Cellule ${r + 1}-${c + 1}`;
                td.contentEditable = true;
            }
        }
        return wrapper;
    }

    selectTable(table) {
        this.deselectTable();
        this.selectedTable = table;
        table.classList.add('selected-table');
    }

    deselectTable() {
        if (this.selectedTable) {
            this.selectedTable.classList.remove('selected-table');
            this.selectedTable = null;
        }
    }

    showTableModal() { this.saveSelection(); this.showModal('tableModal'); }

    /* ---------- video ---------- */
    async insertVideo() {
        const url = document.getElementById('videoUrl').value.trim();
        const id = this.extractYouTubeId(url);
        if (!id) return;
        const w = document.getElementById('videoWidth').value || 560;
        const h = document.getElementById('videoHeight').value || 315;
        const align = document.querySelector('input[name="videoAlign"]:checked').value || 'center';
        const responsive = document.getElementById('videoResponsive').checked;
        const wrapper = this.createVideoWrapper(id, w, h, align, responsive);
        this.insertNodeAtCursor(wrapper);
    }

    extractYouTubeId(url) {
        if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
        const r = url.match(/(?:v=|be\/|embed\/)([a-zA-Z0-9_-]{11})/);
        return r ? r[1] : null;
    }

    createVideoWrapper(id, w, h, align, responsive) {
        const main = document.createElement('div');
        main.className = 'video-main-wrapper';
        const wrapper = document.createElement('div');
        wrapper.className = 'video-wrapper';
        if (responsive) {
            wrapper.style.position = 'relative';
            wrapper.style.paddingBottom = '56.25%';
            wrapper.style.height = 0;
        } else {
            wrapper.classList.add('fixed-size');
            wrapper.style.width = w + 'px';
            wrapper.style.height = h + 'px';
        }
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${id}`;
        iframe.allowFullscreen = true;
        if (!responsive) {
            iframe.style.width = '100%';
            iframe.style.height = '100%';
        }
        wrapper.appendChild(iframe);
        if (align === 'center') wrapper.classList.add('center');
        if (align === 'left') wrapper.classList.add('float-left');
        if (align === 'right') wrapper.classList.add('float-right');
        main.appendChild(wrapper);
        return main;
    }

    selectVideo(wrapper) {
        this.deselectVideo();
        this.selectedVideo = wrapper;
        wrapper.classList.add('selected-video');
    }

    deselectVideo() {
        if (this.selectedVideo) {
            this.selectedVideo.classList.remove('selected-video');
            this.selectedVideo = null;
        }
    }

    showVideoModal() { this.saveSelection(); this.showModal('videoModal'); }

    /* ---------- quote & code ---------- */
    insertQuote() {
        const block = document.createElement('blockquote');
        const text = window.getSelection().toString() || 'Votre citation ici...';
        block.textContent = text;
        this.insertNodeAtCursor(block);
    }

    insertCode() {
        if (window.getSelection().toString()) {
            const code = document.createElement('code');
            code.textContent = window.getSelection().toString();
            this.insertNodeAtCursor(code);
        } else {
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.textContent = 'Votre code ici...';
            pre.appendChild(code);
            this.insertNodeAtCursor(pre);
        }
    }

    /* ---------- fullscreen ---------- */
    toggleFullscreen() {
        this.isFullscreen = !this.isFullscreen;
        this.container.classList.toggle('fullscreen-editor', this.isFullscreen);
        const btn = document.getElementById('fullscreenBtn');
        if (btn) btn.innerHTML = this.isFullscreen ? '<i class="bi bi-fullscreen-exit"></i>' : '<i class="bi bi-fullscreen"></i>';
        document.body.style.overflow = this.isFullscreen ? 'hidden' : '';
    }

    /* ---------- history ---------- */
    saveState() {
        const html = this.editor.innerHTML;
        if (this.history[this.historyIndex] !== html) {
            this.history = this.history.slice(0, this.historyIndex + 1);
            this.history.push(html);
            if (this.history.length > this.maxHistory) this.history.shift();
            this.historyIndex = this.history.length - 1;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.editor.innerHTML = this.history[this.historyIndex];
            this.updateHidden();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.editor.innerHTML = this.history[this.historyIndex];
            this.updateHidden();
        }
    }

    /* ---------- util ---------- */
    updateHidden() { if (this.hiddenField) this.hiddenField.value = this.editor.innerHTML; }

    placeCursorAfter(el) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStartAfter(el);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    showModal(id) {
        const m = document.getElementById(id);
        if (m && window.bootstrap) new bootstrap.Modal(m).show();
    }

    dispatch(name, detail = {}) { document.dispatchEvent(new CustomEvent(`richEditor${name}`, { detail })); }

    /* ---------- public API ---------- */
    setContent(html) { this.editor.innerHTML = html; this.updateHidden(); this.saveState(); }
    getContent() { return this.editor.innerHTML; }
    getText() { return this.editor.textContent; }
    clear() { this.editor.innerHTML = '<p><br></p>'; this.updateHidden(); this.saveState(); }
    focus() { this.editor.focus(); }
    syncContent() { this.updateHidden(); return this.hiddenField ? this.hiddenField.value : ''; }
    isReady() { return !!this.container; }
    destroy() {
        this.editor.removeEventListener('input', () => this.onInput());
        this.editor.removeEventListener('paste', () => setTimeout(() => this.updateHidden(), 10));
        this.editor.removeEventListener('keydown', e => this.onKeydown(e));
        this.editor.removeEventListener('click', e => this.onEditorClick(e));
    }
}

window.RichEditor = RichEditor;
