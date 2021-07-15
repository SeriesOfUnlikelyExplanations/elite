function parseJwt(token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
};

function login() {
  $("#login-link").click(function(e) {
   if ($("#login-text").text() == 'Logout') {
     e.preventDefault();
     $.removeCookie('access_token', { path: '/' });
     $.removeCookie('id_token', { path: '/' });
     window.location = $(this).attr('href');
   }
  });
  var my_url = new URL(window.location.href);

  var code = my_url.searchParams.get("code");
  if (code != null) {
  var request_url = new URL( '/api/auth/calback', my_url);
  request_url.search = new URLSearchParams({code: code}).toString();
  } else {
  var request_url = new URL( '/api/auth/refresh', my_url);
  }
  fetch(request_url, {withCredentials: true, credentials: 'include'})
  .then((res) => res.json())
  .then((data) => {
    console.log(data);
    $('.login-link').attr("href", data.redirect_url);
    if (data.login) {
      $('#login-text').text('Sign Out');
    } else {
      $('#login-text').text('Sign In');
    }
  });
}
