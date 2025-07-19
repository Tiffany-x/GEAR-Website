console.log("Inside the reading scripts");

const urlParams = new URLSearchParams(window.location.search);
const articleID = urlParams.get('id');



function getArticle() {
    console.log(articleID);
    fetch(`fetch-read-pub.php?id=${articleID}`)
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
        .then(data => {
            console.log("topic searched: ", data.data.topics[0]);

            fetch(`fetch-by-topic.php?topic=${data.data.topics[0]}`)
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
        .then(similars => {
             console.log(similars);

            similars.data.forEach(similar => {
                if (similar.id != articleID) {
                    const story =  document.createElement('div');
                story.innerHTML = `
                <a class="story" style="width: auto;" href="read-publication.html?id=${similar.id}">
                        <div class="sim-img">
                            <img src="experts/${similar.image}" style="display: block; width: 100%; height: 180px;">
                        </div>
                        <h1 class="titles" style="color: white; align-self: start; font-size: 24px;">
                            <span id="pub-title">${similar.title}</span></h1>
                            <p class="text" style="color: var(--links); font-size: 20px;">${similar.date}</p>
                    </a>`;
                document.getElementById('similars').appendChild(story);
                }

            })
        })
        const artData = data.data;
        const container = document.getElementById('publication-bg');
                container.style.backgroundImage = `linear-gradient(0deg, rgba(18, 54, 121, 0.50) 0%, #123679 100%), url('experts/${artData.image}')`;
                container.style.backgroundSize = "cover";
                container.style.backgroundPosition = "top";

                document.getElementById('art-title').textContent = artData.title;

                document.getElementById('description').textContent = artData.description;
                document.getElementById('auth-name').textContent = data.data.authors[0].name;
                document.getElementById('to-author').href = `about-expert.html?id=${data.data.authors[0].id}`;
                document.getElementById('artDate').textContent = artData.date;
                document.getElementById('topic').textContent = artData.topics[0];


                artData.topics.forEach(topic =>{
                    const artTopic = document.createElement('div');
                    console.log(topic);
                    artTopic.innerHTML =   `
                    <p class="a-topic">${topic}</p>`;
                    document.getElementById('topic-list').appendChild(artTopic);

                })
                console.log("doc: ", artData.document);


      fetch(`experts/${artData.document}`)
  .then(response => response.blob())
  .then(blob => {
    var options = { inWrapper: false, 
    ignoreWidth: true, 
    ignoreHeight: true, 
    ignoreFonts: true, 
    className: "main-text", 
    hideWrapperOnPrint: true};
   docx.renderAsync(blob, document.getElementById("content"), null, options)
      .then(() => {
         const docxSection = document.querySelector('section.main-text');
        if (docxSection) {
          docxSection.style.padding = '0';  // Remove inline padding
          docxSection.style.margin = '0';   // Remove margins
        }

    const text = document.querySelectorAll('.main-text span');
    
    // Force black color and underline
    text.forEach(text => {
        text.style.color = 'black';          // Override inline color
        text.style.fontFamily = "Lora";
        text.style.fontSize = '18px';
        text.style.lineHeight = '160%';
        text.style.fontWeight = "normal";
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
  .catch(error => console.error('Error fetching the document:', error));
   
            })

            }


getArticle();