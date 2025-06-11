(function(){
class Modal{constructor(title,save){this.save=save;this.el=document.createElement('div');this.el.className='modal-re';this.el.innerHTML=`<div class="re-content"><h5>${title}</h5><form></form><div class="actions"><button type="button" class="closeBtn">Annuler</button><button type="submit">Valider</button></div></div>`;document.body.appendChild(this.el);this.form=this.el.querySelector('form');this.el.querySelector('.closeBtn').onclick=()=>this.hide();this.form.onsubmit=e=>{e.preventDefault();this.save(new FormData(this.form));this.hide();};}
show(){this.el.style.display='block';}
hide(){this.el.style.display='none';}}
class RichEditor{constructor(t){this.ta=t;this.init();}
init(){this.ta.style.display='none';this.wrapper=document.createElement('div');this.wrapper.className='re-wrapper';this.ta.parentNode.insertBefore(this.wrapper,this.ta.nextSibling);this.wrapper.innerHTML=`<div class="re-toolbar">
<button data-cmd="bold"><b>B</b></button>
<button data-cmd="italic"><i>I</i></button>
<button data-cmd="underline"><u>U</u></button>
<button data-cmd="strikeThrough"><s>S</s></button>
<span>|</span>
<button data-cmd="justifyLeft">L</button>
<button data-cmd="justifyCenter">C</button>
<button data-cmd="justifyRight">R</button>
<button data-cmd="justifyFull">J</button>
<select class="fontSel"><option value="">Police</option><option>Poppins</option><option>Montserrat</option><option>Courier New</option><option>Georgia</option></select>
<select class="blockSel"><option value="P">P</option><option value="H1">H1</option><option value="H2">H2</option><option value="H3">H3</option><option value="H4">H4</option><option value="H5">H5</option></select>
<button id="linkBtn">🔗</button>
<button id="imageBtn">🖼</button>
<button id="tableBtn">⌗</button>
<button id="videoBtn">🎞</button>
<button data-cmd="insertUnorderedList">•</button>
<button data-cmd="insertOrderedList">1.</button>
<button id="quoteBtn">❝</button>
<button id="codeBtn">⌘</button>
<button id="hrBtn">HR</button>
</div><div class="re-area" contenteditable="true"></div>`;this.area=this.wrapper.querySelector('.re-area');this.area.innerHTML=this.ta.value;this.area.addEventListener('input',()=>{this.ta.value=this.area.innerHTML;});this.bind();}
exec(cmd,val=null){document.execCommand(cmd,false,val);this.area.focus();}
bind(){this.wrapper.querySelectorAll('button').forEach(btn=>{btn.addEventListener('click',e=>{e.preventDefault();const c=btn.dataset.cmd;if(c){this.exec(c);}else{switch(btn.id){case'linkBtn':this.link();break;case'imageBtn':this.image();break;case'tableBtn':this.table();break;case'videoBtn':this.video();break;case'quoteBtn':this.exec('formatBlock','BLOCKQUOTE');break;case'codeBtn':this.exec('formatBlock','PRE');break;case'hrBtn':this.exec('insertHorizontalRule');break;}}});});this.wrapper.querySelector('.fontSel').addEventListener('change',e=>{this.exec('fontName',e.target.value);e.target.value='';});this.wrapper.querySelector('.blockSel').addEventListener('change',e=>{this.exec('formatBlock',e.target.value);});}
insert(html){this.exec('insertHTML',html);}
wrap(el,type){const w=document.createElement('div');w.className='re-element';w.style.textAlign='left';const b=document.createElement('button');b.className='re-edit';b.textContent='⚙';b.onclick=()=>{if(type==='image')this.image(w);if(type==='video')this.video(w);if(type==='table')this.table(w);};w.appendChild(el);w.appendChild(b);return w;}
link(){const m=new Modal('Lien',fd=>{this.exec('createLink',fd.get('url'));});m.form.innerHTML='<label>URL<input name="url" required></label>';m.show();}
image(existing){const m=new Modal('Image',fd=>{const url=fd.get('file').name?URL.createObjectURL(fd.get('file')):fd.get('url');const img=existing?existing.querySelector('img'):document.createElement('img');img.src=url;img.width=fd.get('w');img.height=fd.get('h');const align=fd.get('align');if(existing){existing.style.textAlign=align;}else{const w=this.wrap(img,'image');w.style.textAlign=align;this.insert(w.outerHTML);}});m.form.innerHTML='<label>Fichier<input type="file" name="file"></label><label>ou URL<input name="url"></label><label>Largeur<input name="w" value="300"></label><label>Hauteur<input name="h" value="200"></label><label>Alignement<select name="align"><option>left</option><option>center</option><option>right</option></select></label>';if(existing){const img=existing.querySelector('img');m.form.w.value=img.width;m.form.h.value=img.height;m.form.align.value=existing.style.textAlign;}m.show();}
video(existing){const m=new Modal('Video',fd=>{const src=fd.get('url');const iframe=existing?existing.querySelector('iframe'):document.createElement('iframe');iframe.src=src;iframe.width=fd.get('w');iframe.height=fd.get('h');const align=fd.get('align');if(existing){existing.style.textAlign=align;}else{const w=this.wrap(iframe,'video');w.style.textAlign=align;this.insert(w.outerHTML);}});m.form.innerHTML='<label>URL iframe<input name="url" required></label><label>Largeur<input name="w" value="400"></label><label>Hauteur<input name="h" value="300"></label><label>Alignement<select name="align"><option>left</option><option>center</option><option>right</option></select></label>';if(existing){const ifr=existing.querySelector('iframe');m.form.url.value=ifr.src;m.form.w.value=ifr.width;m.form.h.value=ifr.height;m.form.align.value=existing.style.textAlign;}m.show();}
table(existing){const m=new Modal('Table',fd=>{let rows=+fd.get('rows'),cols=+fd.get('cols');const tbl=existing?existing.querySelector('table'):document.createElement('table');tbl.border='1';if(!existing){for(let r=0;r<rows;r++){const tr=tbl.insertRow();for(let c=0;c<cols;c++)tr.insertCell().textContent=' ';}}tbl.width=fd.get('w');tbl.height=fd.get('h');const align=fd.get('align');if(existing){existing.style.textAlign=align;}else{const w=this.wrap(tbl,'table');w.style.textAlign=align;this.insert(w.outerHTML);}});m.form.innerHTML='<label>Lignes<input name="rows" value="2"></label><label>Colonnes<input name="cols" value="2"></label><label>Largeur<input name="w" value="100%"></label><label>Hauteur<input name="h"></label><label>Alignement<select name="align"><option>left</option><option>center</option><option>right</option></select></label>';if(existing){const t=existing.querySelector('table');m.form.w.value=t.width;m.form.h.value=t.height;m.form.align.value=existing.style.textAlign;}m.show();}}
window.initRichEditors=function(){document.querySelectorAll('textarea.rich-editor').forEach(t=>{if(!t._rich){t._rich=new RichEditor(t);}});};
document.addEventListener('DOMContentLoaded',window.initRichEditors);
})();
