console.log("Inside the scripts");

function fetchArticles() {
    fetch('fetch-articles-home.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                console.log("Success, producing...");
                const container = document.getElementById('recent-pubs');
                
                data.data.forEach(articleData => {
                    console.log("producing an article: " + articleData.location);
                    
                    const listItem = document.createElement('li');
                    const articleDiv = document.createElement('div');
                    listItem.appendChild(articleDiv);

                    articleDiv.innerHTML = `
                        <a class="card" href="read-publication.html?id=${articleData.id}">
                            <li><img src="experts/${articleData.image}" class="rec-img" alt="${articleData.title}"></li>
                            <li>
                            <div class="rec-deets">
                                <h2 class="titles" style="font-size: 28px;">
                                    <span id="pub-title">${articleData.title}</span>
                                </h2>
                                <p class="text">${articleData.description}</p>
                                <p class= "rec-author">${articleData.date}</p>
                            </div></li>
                        </a>
                    `;
                    
                    listItem.appendChild(articleDiv);
                    container.appendChild(listItem);

                    const item = document.createElement('li');
                    const divider = document.createElement('hr');
                    item.appendChild(divider);
                    container.appendChild(item);

                });
            } else {
                console.error(data.error);
            }
        })
        .catch(error => {
            console.error("Fetch request failed:", error);
        });
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired');
    fetchArticles();
});