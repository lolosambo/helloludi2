document.addEventListener('DOMContentLoaded', () => {
  const editors = document.querySelectorAll('.ckeditor');
  editors.forEach(textarea => {
    ClassicEditor.create(textarea, {
      toolbar: {
        items: [
          'heading', '|',
          'bold', 'italic', 'underline', 'strikethrough', '|',
          'alignment', '|',
          'fontFamily', 'fontSize', '|',
          'link', 'imageUpload', 'insertTable', 'mediaEmbed', '|',
          'bulletedList', 'numberedList', '|',
          'blockQuote', 'codeBlock', '|',
          'horizontalLine', '|',
          'undo', 'redo'
        ]
      },
      fontFamily: {
        options: [
          'default',
          'Quicksand, sans-serif',
          'Montserrat, sans-serif',
          'Delius Swash Caps, cursive'
        ]
      },
      heading: {
        options: [
          { model: 'paragraph', title: 'Paragraphe', class: 'ck-heading_paragraph' },
          { model: 'heading1', view: 'h1', title: 'Titre 1', class: 'ck-heading_heading1' },
          { model: 'heading2', view: 'h2', title: 'Titre 2', class: 'ck-heading_heading2' },
          { model: 'heading3', view: 'h3', title: 'Titre 3', class: 'ck-heading_heading3' },
          { model: 'heading4', view: 'h4', title: 'Titre 4', class: 'ck-heading_heading4' },
          { model: 'heading5', view: 'h5', title: 'Titre 5', class: 'ck-heading_heading5' }
        ]
      },
      simpleUpload: {
        uploadUrl: '/upload_image'
      }
    }).catch(error => console.error(error));
  });
});
