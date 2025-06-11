function openDropdown() {
    document.getElementById("region-dropdown").classList.toggle("show");
}

function filterFunction() {
    var input, filter, ul, li, a, i;
    input = document.getElementById("topic-search");
    filter = input.ariaValueMax.toUpperCase();
    div = document.getElementById("region-dropdown");

}


fetch('Lora-Chase-bio.txt')
  .then(response => response.text())
  .then(text => {
    // Replace newlines with <br> and display
    const formattedText = text.replace(/\n/g, '<br>');
    document.getElementById('about').innerHTML = formattedText;
  })
  .catch(error => console.error('Error loading file:', error));

fetch('about-media.txt')
  .then(response => response.text())
  .then(text => {
    // Replace newlines with <br> and display
    const formattedText = text.replace(/\n/g, '<br>');
    document.getElementById('about-media').innerHTML = formattedText;
  })
  .catch(error => console.error('Error loading file:', error));

fetch('about-event.txt')
  .then(response => response.text())
  .then(text => {
    // Replace newlines with <br> and display
    const formattedText = text.replace(/\n/g, '<br>');
    document.getElementById('about-event').innerHTML = formattedText;
  })
  .catch(error => console.error('Error loading file:', error));

  fetch('about-event-speaker.txt')
  .then(response => response.text())
  .then(text => {
    // Replace newlines with <br> and display
    const formattedText = text.replace(/\n/g, '<br>');
    document.getElementById('about-event-speaker').innerHTML = formattedText;
  })
  .catch(error => console.error('Error loading file:', error));