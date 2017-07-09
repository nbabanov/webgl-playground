class HttpService {
    /**
     * Performs a HTTP GET request
     * @param {string} requestURL
     * @returns {Promise<any>}
     */
    static Get(requestURL) {
        const request = new XMLHttpRequest();

        return new Promise((resolve, reject) => {
            request.onreadystatechange = function() {
                if (request.readyState == XMLHttpRequest.DONE ) {
                    if (request.status == 200) {
                        resolve(request.responseText);
                    } else {
                       reject(request);
                    }
                }
            };

            request.open('GET', requestURL, true);
            request.send();
        });
    }
}