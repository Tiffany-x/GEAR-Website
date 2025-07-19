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
        .then(data => {
            const details = data.data;
            console.log(details);

            // Set author image
            document.getElementById('author-pic').src = "experts/" + details.image;

            // Set author name
            document.getElementById('authorName').textContent = details.name;
            document.getElementById('position').textContent = details.position;
            // Add topics
            details.topics.forEach(topic => {
                const artTopic = document.createElement('div');
                console.log(topic);
                artTopic.innerHTML = `<p class="nav-text" style="font-size: 20px;">${topic}</p>`;
                document.getElementById('similars').appendChild(artTopic);
            });

            
            document.getElementById('main-topic').textContent = details.topics[0];

            document.getElementById('email').textContent = details.email;
            document.getElementById('linkedin').textContent = details.name;
            document.getElementById('linkedin-link').href = details.linkedin;


            // Fetch about document
            return fetch(`experts/${details.about}`);
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch about document');
            }

            const contentType = response.headers.get("Content-Type");
            console.log("Content-Type:", contentType);



            return response.blob();
        })
        .then(blob => {
            const options = {
                inWrapper: false,
                ignoreWidth: true,
                ignoreHeight: true,
                ignoreFonts: true,
                className: "main-text",
                hideWrapperOnPrint: true
            };

            return docx.renderAsync(blob, document.getElementById("about"), null, options);
        })
        .then(() => {
            const docxSection = document.querySelector('section.main-text');
            if (docxSection) {
                docxSection.style.padding = '0';
                docxSection.style.margin = '0';
            }

            const text = document.querySelectorAll('.main-text_normal span');
            text.forEach(el => {
                el.style.color = 'black';
                el.style.fontFamily = "Lora";
                el.style.fontSize = '18px';
                el.style.lineHeight = '160%';
                el.style.fontWeight = "normal";
            });

            const titles = document.querySelectorAll('.main-text_heading2 span');
            titles.forEach(el => {
                el.style.fontSize = '32px';
                el.style.fontFamily = "Quattrocento";
            });

            const links = document.querySelectorAll('.main-text_hyperlink');
            links.forEach(el => {
                el.style.color = 'var(--links)';
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });

        fetch(`fetch-articles-author.php?authorID=${authorID}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); // Parse as JSON directly
    })
    .then(data => {
        // Check if data exists and has the expected structure
        if (!data || !data.data) {
            throw new Error('Invalid data structure in response');
        }
        
        // Process each article
        data.data.forEach(article => {
            const anArticle = document.createElement('div');
            anArticle.className = "story";
            console.log(article);
            anArticle.innerHTML = `
                <a href="read-publication.html?id=${article.id}">
                    <div class="author-pub-img">
                        <img src="experts/${article.image}" style="width: 100%;">
                    </div>
                    <h1 class="titles" style="color: var(--main); align-self: start; font-size: 24px;">
                        <span id="pub-title">${article.title}</span></h1>
                    <p class="text" style="color: var(--links); font-size: 18px;">${article.date}</p>
                </a>
            `;
            document.getElementById('author-pubs').appendChild(anArticle);
        });
    })
    .catch(error => {
        console.error('Error:', error);
        // Display error message to user
        document.getElementById('author-pubs').innerHTML = `
            <div class="error">Error loading articles: ${error.message}</div>
        `;
    });
}

getAuthor();
