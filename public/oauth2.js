var client_id = "abc123";
var client_secret ="ssh-secret";
var client_registration_loaded = false;
var baseURL = "http://" + location.host;
var tokenEndpoint = baseURL + "/oauth/token";
var authEndpoint = baseURL + "/oauth/dialog/auth";
var sampleResource = baseURL + "/protected/html/secret.html";

function getRedirectURI() {
	return encodeURIComponent(baseURL + location.pathname);
}

function tokenByClientCredentials(clientId, clientSecret, scope, tokenCallback, errorCallback) {
        scope = scope || "demo";
	var data = "grant_type=client_credentials&client_id=" + clientId
			+ "&client_secret=" + clientSecret + "&scope=" + scope;

	$.post(tokenEndpoint, data, tokenCallback)
			.error(errorCallback);
}

function tokenByResourceOwnerPasswordCredentials(clientId, clientSecret, username,
		password, scope, tokenCallback, errorCallback) {
        scope = scope || "demo";
	var data = "grant_type=password&client_id=" + clientId + "&client_secret="
			+ clientSecret + "&username=" + username + "&password=" + password + "&scope=" + scope;
	$.post(tokenEndpoint, data, tokenCallback)
			.error(errorCallback);
}

function tokenByCode(clientId, clientSecret, code, tokenCallback) {
	var data = "code=" + code + "&grant_type=authorization_code&client_id="
			+ clientId + "&client_secret=" + clientSecret + "&redirect_uri="
			+ getRedirectURI();
	$.post(tokenEndpoint, data, tokenCallback);
}

function implicit(clientId, scope) {
        scope = scope || "demo";
	var authUrl = authEndpoint + "?client_id="
			+ clientId + "&redirect_uri=" + getRedirectURI() 
			+ "&response_type=token&scope="+scope+"&state=123";

	if (confirm("Redirecting to: " + authUrl)) {
		location.replace(authUrl);
		return true;
	}
	return false;
}

function implicitFake(clientId, scope) {
	var authUrl = authEndpoint + "?client_id="
			+ clientId + "&redirect_uri=" + getRedirectURI() 
			+ "&response_type=token&scope="+scope+"&state=124";
	
	if (confirm("Redirecting to: " + authUrl)) {
		location.replace(authUrl);
		return true;
	}
	return false;
}

function authorizationCode(clientId, scope) {
        scope = scope || "demo";
	var authUrl = authEndpoint + "?client_id="
			+ clientId + "&redirect_uri=" + getRedirectURI()
			+ "&response_type=code&scope="+scope+"&state=123";
	if (confirm("Redirecting to: " + authUrl)) {
		location.replace(authUrl);
		return true;
	}
	return false;
}

function authorizationCodeFake(clientId, scope) {
var authUrl = authEndpoint + "?client_id="
		+ clientId + "&redirect_uri=" + getRedirectURI()
		+ "&response_type=code&scope="+scope+"&state=125";
if (confirm("Redirecting to: " + authUrl)) {
	location.replace(authUrl);
	return true;
}
return false;
}


function getAccessToken() {
	if (location.hash.length != 0) {
		accessToken = location.hash.substring(1);
		index = accessToken.indexOf("access_token=", 0);
		endIndex = accessToken.indexOf("&", index + 13);
		if (endIndex == -1) {
			endIndex = accessToken.length() - 1;
		}
		oAuthToken = accessToken.substring(index + 13, endIndex);
		return oAuthToken;
	}
	return null;
}

function getState() {
	//alert('in getState');
	if (location.hash.length != 0) {
		state = location.hash.substring(1);
		index = state.indexOf("state=", 0);
		endIndex = state.indexOf("&", index + 6);
		if (endIndex == -1) {
			endIndex = state.length() - 1;
		}
		s = state.substring(index + 6, endIndex);
		return s;
	}
	return null;
}

function getCode() {
	var query = location.search;
	var parameters = [];

	if (query != null && query != "") {
		parameters = query.substring(1).split('&');
	}

        for(i=0; i<parameters.length; i++) {
	        if (parameters[i].indexOf("code=") == 0) {
		    code = parameters[i].substring(5);
		    return code;
	        }
        }
	return null;
}

function updateHtml(id, html) {
	$("#" + id).html(html);
}

function appendHtml(id, html) {
	var current = $("#" + id).html();
        current = current ? current+html: html; 
	$("#" + id).html(current);
}

function updateJson(id, jsonObject) {
	$("#" + id).html(JSON.stringify(jsonObject));
}

function displayMessage(msg) {
	updateHtml("msg", msg);
}
