document.getElementById('CTA').addEventListener('click', function () {
  const target = document.getElementById('join-us');
  target.scrollIntoView({ behavior: 'smooth' });
});

document.querySelector('.logo').style = "cursor: pointer;"
document.querySelector('.logo').addEventListener('click', function () {
  console.log("clicked");
  window.location.href = "index.html"
})