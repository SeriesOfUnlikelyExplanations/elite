//common Scrips for Always-onward.com

function loadScript(url_string) {
  return new Promise(function(resolve,  reject) {
    var script = document.createElement("script");
    script.onload = resolve;
    script.onerror = reject;
    script.src = url_string;
    document.getElementsByTagName("head")[0].appendChild(script);
  });
}

loadScript('https://stackpath.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js');
loadScript('js/moment.js');
loadScript('js/jquery.flexslider-min.js');
$(function(){
  // Mobile menu
  $('.mobile-menu-icon').click(function(){
    $('.tm-nav').toggleClass('show');
  });
  // http://stackoverflow.com/questions/2851663/how-do-i-simulate-a-hover-with-a-touch-in-touch-enabled-browsers
  $('body').bind('touchstart', function() {});

  var includes = $('[data-include]');
  jQuery.each(includes, function(){
    var file = 'assets/' + $(this).data('include') + '.html';
    $(this).load(file, () => {
      if ($(this).data('include') == 'header') {
        if (window.location.href.includes('index.html')) {
          var els = document.querySelectorAll('a[href^="index.html"]')
          console.log(els)
        }
      }
    });
  });
  $('#rental-signin-button').attr("href", 'https://auth.always-onward.com/login?client_id=5c72ninemr6imij5ul0a0i0jbe&response_type=token&redirect_uri='+window.location.protocol+'//'+window.location.host)

});
