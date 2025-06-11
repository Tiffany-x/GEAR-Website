console.log("Inside the scripts");
document.getElementById('value1').textContent = 1;

function fetchArticles() {
    fetch('rowcount.php')
        .then(answer => {
            if (!answer.ok) {
                console.log("not okay")
                throw new Error('Network response was not ok');
            }
            return answer.json();

        })
        .then(count => {
                     console.log("here")
            if (count.status === 'success') {
                const artTotal = count.data.total_rows;
                console.log(count.data.total_rows);
                document.getElementById('total').textContent = artTotal;
                if (artTotal < 11) {
                    document.getElementById('value2').textContent = artTotal;
                } else {
                    document.getElementById('value2').textContent = 10;
                }
            }
        })
    fetch('fetch-articles-page.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                console.log("Success, producing...");
                const container = document.getElementById('publications');
                
                data.data.forEach(articleData => {
                    const articleDiv = document.createElement('div');

                    articleDiv.innerHTML = `
                        <a class="publication" href="read-publication.html?id=${articleData.id}">
                            <div class="pub-dets">
                                <h1 class="titles" style="font-size: 24px; font-weight: 700; align-self: flex-start;">
                                    <span id="pub-title">${articleData.title}</span></h1>
                                <p class="text" style="font-size: 16px; align-self: flex-start;">${articleData.description}</p>
                                <p style="color: var(--links); font-size: 16px; font-family: 'Cinzel'; align-self: flex-start;">${articleData.date}</p>
                            </div>
                            <img class="pub-img" src="${articleData.image}"></img>
                        </a>
                    `;
                    container.appendChild(articleDiv);

                });
            } else {
                console.error(data.error);
            }
        })
        .catch(error => {
            console.error("Fetch request failed:", error);
        });
}

fetchArticles();
