console.log('\'custom.js\' loaded');

var SSOCheckLimit = 4;
function checkForSSOError() {
    var currentUrl = window.location.href;
    console.log('Current window URL: ', currentUrl);
    if(currentUrl == 'https://latrobe.primo.exlibrisgroup.com/nde/' || currentUrl == 'https://search.lib.latrobe.edu.au/nde/') {
        console.log('Current URL is for blank page, so redirect')
        // likely blank page after SSO, so redirect to Primo home page (3 sec delay for testing)
        setTimeout(function() {
            window.location.href = 'https://search.lib.latrobe.edu.au/nde/home?vid=61LATROBE_INST:TRENDALL_COLL&lang=en';
        }, 3000)
    } else if(currentUrl.indexOf('&loginId=') > -1) {
        console.log('Current URL has \'loginId\', so check again soon')
        // just signed in, so check in a bit to make sure user didn't get a blank page after this JS was loaded
        setTimeout(function() {
            if(SSOCheckLimit-- > 0) checkForSSOError();
        },500)
    }
}
checkForSSOError();