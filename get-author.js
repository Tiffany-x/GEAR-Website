console.log("Inside the reading scripts");

const urlParams = new URLSearchParams(window.location.search);
const authorID = urlParams.get('id');



function getAuthor() {
    console.log(authorID);
    fetch(`get-author.php?id=${authorID}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

return response.text().then(text => {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error("Failed to parse JSON:", text);
                    throw new Error("Invalid JSON response");
                }
            });
        })
        .then(author => {
            const details = author.data;
            document.getElementById('author-pic').src = details.image;
            details.topics.forEach(topic =>{
                    const artTopic = document.createElement('div');
                    console.log(topic);
                    artTopic.innerHTML =   `
                    <p class="nav-text" style="font-size: 20px;">${topic}</p>`;
                    document.getElementById('similars').appendChild(artTopic);
                })
            document.getElementById('authorName').textContent = details.name;

      fetch(details.about)
  .then(response => response.blob())
  .then(blob => {
    var options = { inWrapper: false, 
    ignoreWidth: true, 
    ignoreHeight: true, 
    ignoreFonts: true, 
    className: "main-text", 
    hideWrapperOnPrint: true};
   docx.renderAsync(blob, document.getElementById("about"), null, options)
      .then(() => {
         const docxSection = document.querySelector('section.main-text');
        if (docxSection) {
          docxSection.style.padding = '0';  // Remove inline padding
          docxSection.style.margin = '0';   // Remove margins
        }

    const text = document.querySelectorAll('.main-text_normal span');
    
    // Force black color and underline
    text.forEach(text => {
        text.style.color = 'black';          // Override inline color
        text.style.fontFamily = "Lora";
        text.style.fontSize = '18px';
        text.style.lineHeight = '160%';
    });

    const titles = document.querySelectorAll('.main-text_heading2 span');

    titles.forEach(titles => {
        titles.style.fontSize = '32px';
        titles.style.fontFamily = "Quattrocento";

    });


    const links = document.querySelectorAll('.main-text_hyperlink');
    
    links.forEach(links => {
      links.style.color = 'var(--links)';          // Override inline color
    });
        const docxElements = document.querySelectorAll('.docx, .docx *');       
      });
  })
             
  })
  .catch(error => console.error('Error fetching the document:', error));
   
            }

            


getAuthor();