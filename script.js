document.getElementsByClassName("CTA").addEventListener("click", function() {
    var targetElement = document.getElementById("articles");


    window.scrollTo({
        top: targetElement.offsetTop,
        behavior: "smooth"
    });
})