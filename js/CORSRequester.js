function CORSRequester (seriesName) {
    if (seriesName != null)
        this.seriesName = seriesName;

    this.url = 'http://54.69.113.40/query.php?';

    this.onServerDataLoadCallbacks = $.Callbacks();

    this.onServerSuggestionCallbacks = $.Callbacks();
}

CORSRequester.prototype._createRequest = function(url) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
        // XHR for Chrome/Firefox/Opera/Safari.
        xhr.open('GET', url, true);
    } else if (typeof XDomainRequest != "undefined") {
        // XDomainRequest for IE.
        xhr = new XDomainRequest();
        xhr.open('GET', url);
    } else {
        // CORS not supported.
        xhr = null;
    }
    return xhr;
};

CORSRequester.prototype.makeRequest = function(dataLoadReq, onResult) {
    var url = this._createURL(dataLoadReq.startDateTm, dataLoadReq.endDateTm, dataLoadReq.numIntervals);
    var xhr = this._createRequest(url);

    xhr.onload = function(){
        returnDyData(this.response, onResult);
    };

    function returnDyData(response, onResult) {
        var dps = [];
        var obj = JSON.parse(response);
        var data;
        if (obj.length > 0) {
            data = obj[0].dps;
            if (data.length > 0){
                // Fixes range viewer so that end range is corrent
                if (data[0][0] > dataLoadReq.startDateTm) {
                    dps.push({x: dataLoadReq.startDateTm, y: null});
                }
                for (var idx = 0; idx < data.length; idx++) {
                    var row = data[idx];
                    row[0] = new Date(row[0]); // Turn the string date into a Date.
                    row[1] = parseFloat(row[1]);
                    // arry.push(row);
                    dps.push({x: row[0], y: row[1]});
                }
                // Fixes range viewer so that end range is corrent
                if (data[data.length-1][0] < dataLoadReq.endDateTm) {
                    dps.push({x: dataLoadReq.endDateTm, y: null});
                }
            }
        }
        else {
            // no data
            dps.push({x: dataLoadReq.startDateTm, y: null});
            dps.push({x: dataLoadReq.endDateTm, y: null});
        }

        var dataLoadResp = {
            dataPoints: dps
        };
        onResult(dataLoadReq, dataLoadResp);
    };

    xhr.onerror = function() {
        alert('Woops, there was an error making the request.');
    };

    xhr.send();
};

CORSRequester.prototype.makeSuggestion = function(onResult) {
    var url = this.url.concat('/api/suggest?type=metrics&max=100');
    var xhr = this._createRequest(url);

    xhr.onload = function(){
        var obj = JSON.parse(this.response);
        onResult(obj);
    };

    xhr.onerror = function() {
        alert('Could not retrieve a list of metrics from the database!');
    };

    xhr.send();
}

CORSRequester.prototype._createURL = function(startDateTm, endDateTm, numIntervals) {
    var url = '';
    url = url.concat(this.url, '/api/query?start=', new Date(startDateTm).getTime(), '&end=', new Date(endDateTm).getTime(), '&m=avg:');

    var timeDiff = endDateTm - startDateTm;
    var interval = Math.floor(timeDiff/numIntervals);
    var avgTime = '';
    // if (interval <= 1000) { // 1 second
    //     avgTime = '1s-avg:';
    // }
    // else if (interval <= 30000) { // 30 seconds
    //     avgTime = '30s-avg:';
    // }
    if (interval < numIntervals) {
        avgTime = '';
    }
    else if (interval <= 60000) { // 1 minute
        avgTime = '1m-avg:';
    }
    else if (interval <= 600000) { // 10 minutes
        avgTime = '10m-avg:';
    }
    else if (interval <= 1800000) { // 30 minutes
        avgTime = '30m-avg:';
    }
    else if (interval <= 3600000) { // 1 hour
        avgTime = '1h-avg:';
    }
    else if (interval <= 21600000) { // 6 hours
        avgTime = '6h-avg:';
    }
    else if (interval <= 43200000) { // 12 hours
        avgTime = '12h-avg:';
    }
    else if (interval <= 604800000) { // 1 day
        avgTime = '1d-avg:';
    }
    else if (interval <= 259200000) { // 3 days
        avgTime = '3d-avg:';
    }
    else if (interval <= 604800000) { // 1 week
        avgTime = '1w-avg:';
    }
    else if (interval <= 1209600000) { // 2 weeks
        avgTime = '2w-avg:';
    }
    else if (interval <= 2629743000) { // 1 month
        avgTime = '1n-avg:';
    }
    else if (interval <= 7889229000) { // 3 month
        avgTime = '3n-avg:';
    }
    else if (interval <= 15778458000) { // 6 months
        avgTime = '6n-avg:';
    }
    else if ( interval <= 31556926000 ) {// 1 year
        avgTime = '1y-avg:';
    }
    url = url.concat(avgTime, this.seriesName, '&ms=true&arrays=true');
    // http://witsmeter.tk:4243/api/query?start=2014/07/01&m=avg:1h-avg:100-JT-001&ms=true&arrays=true

    return url;
};
