console.log("Inside the reading scripts");

const urlParams = new URLSearchParams(window.location.search);
const eventID = urlParams.get('id');

function getEvent() {
    console.log(eventID);

    fetch(`view-event.php?id=${eventID}`)
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

            const date = new Date(details.date);

            const formattedDate = date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
            });

            let start = details.start;
            let end = details.end;

            // Set event name
            document.getElementById('title').textContent = details.title;
            document.getElementById('type').textContent = details.type;
            document.getElementById('prompt').textContent = details.prompt;
            document.getElementById('date').textContent = formattedDate;
            document.getElementById('city').textContent = details.city;
            document.getElementById('venue').textContent = details.venue;
            document.getElementById('timing').textContent = `${start} - ${end}`;
            document.getElementById('rsvp-name').textContent = details.rsvp;
            document.getElementById('rsvp-contact').textContent = details.contact;


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

            return docx.renderAsync(blob, document.getElementById("about-event"), null, options);
        })
        .then(() => {
            const docxSection = document.querySelector('section.main-text');
            if (docxSection) {
                docxSection.style.padding = '0';
                docxSection.style.margin = '0';
            }

            document.querySelectorAll('.main-text_normal span').forEach(el => {
                el.style.color = 'black';
                el.style.fontFamily = "Lora";
                el.style.fontSize = '18px';
                el.style.lineHeight = '160%';
                el.style.fontWeight = "normal";
            });

            const text = document.querySelectorAll('.main-text_bodytext span');
            text.forEach(el => {
                el.style.color = 'black';
                el.style.fontFamily = "Lora";
                el.style.fontSize = '18px';
                el.style.lineHeight = '160%';
                el.style.fontWeight = "normal";
            });
            
            document.querySelectorAll('.main-text_heading1 span').forEach(el => {
                el.style.fontSize = '32px';
                el.style.fontFamily = "Quattrocento";
                el.style.color = 'var(--main)';
            });

            const titles = document.querySelectorAll('.main-text_heading2 span');
            titles.forEach(el => {
                el.style.fontSize = '32px';
                el.style.fontFamily = "Quattrocento";
                el.style.color = 'var(--main)';

            });

            const links = document.querySelectorAll('.main-text_hyperlink');
            links.forEach(el => {
                el.style.color = 'var(--links)';
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

getEvent();
