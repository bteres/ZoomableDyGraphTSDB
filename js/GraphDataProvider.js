function GraphDataProvider () {
    this.serverDataSims = {};
    this.newGraphDataCallbacks = $.Callbacks();

    this.lastRangeReqNum = 0;
    this.lastDetailReqNum = 0;
}

/**
Initiates data load request. The rangeStartDateTm and rangeEndDateTm parameters are optional. If null, then only
new detail data will be loaded, and the result spliced with most recent existing range data.
@method loadData
*/
GraphDataProvider.prototype.loadData = function (seriesName, rangeStartDateTm, rangeEndDateTm, detailStartDateTm, detailEndDateTm, pixelWidth) {

    //Construct server data provider/simulator if needed for the requested series
    var serverDataSim = this.serverDataSims[seriesName];
    if (!serverDataSim) {
        serverDataSim = new CORSRequester(seriesName);
        serverDataSim.onServerDataLoadCallbacks.add($.proxy(this._onServerDataLoad, this));
        this.serverDataSims[seriesName] = serverDataSim;
    }

    // loading range data is optional
    if (rangeStartDateTm && rangeEndDateTm) {
        this.rangeDataLoadComplete = false;

        //This determines how many points we load (and so how much downsampling is being asked for).
        //This might be specific to each project and require some knowledge of the underlying data purpose.
        var numRangeIntervals = pixelWidth / 0.5; // ...so at most, downsample to one point every two pixels in the range selector

        var rangeDataLoadReq = {
            reqType: "range",
            reqNum: ++this.lastRangeReqNum,
            startDateTm: rangeStartDateTm,
            endDateTm: rangeEndDateTm,
            numIntervals: numRangeIntervals,
            includeMinMax: false
        };
        this.lastRangeDataLoadReq = rangeDataLoadReq;
        serverDataSim.makeRequest(rangeDataLoadReq, serverDataSim.onServerDataLoadCallbacks.fire);
    }
    else {
        this.rangeDataLoadComplete = true;
    }

    // load detail data ...also coded optional, but never used as optional because we don't range extents without changing detail extents
    if (detailStartDateTm && detailEndDateTm) {
        this.detailDataLoadComplete = false;

        //This determines how many points we load (and so how much downsampling is being asked for).
        //This might be specific to each project and require some knowledge of the underlying data purpose.
        var numDetailsIntervals = pixelWidth / 0.5; // ...so at most, downsample to one point every two pixels in the graph

        var detailDataLoadReq = {
            reqType: "detail",
            reqNum: ++this.lastDetailReqNum,
            startDateTm: detailStartDateTm,
            endDateTm: detailEndDateTm,
            numIntervals: numDetailsIntervals,
            includeMinMax: false
        };
        this.lastDetailDataLoadReq = detailDataLoadReq;
        serverDataSim.makeRequest(detailDataLoadReq, serverDataSim.onServerDataLoadCallbacks.fire);
    }
    else {
        this.detailDataLoadComplete = true;
    }
};

/**
Callback handler for server data load response. Will discard responses if newer requests were made in the meantime.
Responsible for making sure all data received before continuing.

@method _onServerDataLoad
@private
*/
GraphDataProvider.prototype._onServerDataLoad = function (dataLoadReq, dataLoadResp) {
    //console.log("_onServerDataLoad", dataLoadReq, dataLoadResp);

    if (dataLoadReq.reqType == 'detail') {
        if (this.lastDetailReqNum != dataLoadReq.reqNum) {
            return;  //discard because newer request was sent
        }
        else {
            this.lastDetailDataLoadResp = dataLoadResp;
            this.detailDataLoadComplete = true;
        }
    }
    else { //range
        if (this.lastRangeReqNum != dataLoadReq.reqNum) {
            return;  //discard because newer request was sent
        }
        else {
            this.lastRangeDataLoadResp = dataLoadResp;
            this.rangeDataLoadComplete = true;
        }
    }
    if (this.rangeDataLoadComplete && this.detailDataLoadComplete) {
        var splicedData = this._spliceRangeAndDetail(this.lastRangeDataLoadResp.dataPoints, this.lastDetailDataLoadResp.dataPoints);

        //Convert to dygraph native format
        var dyData = [];
        for (var i = 0; i < splicedData.length; i++) {
            if (dataLoadReq.includeMinMax)
                dyData.push([new Date(splicedData[i].x), [splicedData[i].min, splicedData[i].avg, splicedData[i].max]]);
            else
                dyData.push([new Date(splicedData[i].x), splicedData[i].y]);
        }

        var graphData = {
            dyData: dyData,
            detailStartDateTm: this.lastDetailDataLoadReq.startDateTm,
            detailEndDateTm: this.lastDetailDataLoadReq.endDateTm
        };

        this.newGraphDataCallbacks.fire(graphData);
    }

};

/**
Splices the range data set, with detail data set, to come-up with a single spliced dataset. See documentation
for explanation.  There might be more efficient ways to code it.

@method _spliceRangeAndDetail
@private
*/
GraphDataProvider.prototype._spliceRangeAndDetail = function (rangeDps, detailDps) {

    var splicedDps = [];

    if (rangeDps.length == 0 && detailDps.length == 0) {
        // do nothing, no data
    } else if (detailDps.length == 0) {
        for (var i = 0; i < rangeDps.length; i++) {
            splicedDps.push(rangeDps[i]);
        }
    } else if (rangeDps.length == 0) { //should never happen?
        for (var i = 0; i < detailDps.length; i++) {
            splicedDps.push(detailDps[i]);
        }
    } else {
        var detailStartX = detailDps[0].x;
        var detailEndX = detailDps[detailDps.length - 1].x;

        // Find last data point index in range where-after detail data will be inserted
        var lastRangeIdx = this._findLastRangeIdxBeforeDetailStart(rangeDps, detailStartX);

        //Insert 1st part of range
        if (lastRangeIdx >= 0) {
            splicedDps.push.apply(splicedDps, rangeDps.slice(0, lastRangeIdx + 1));
        }

        //Insert detail
        splicedDps.push.apply(splicedDps, detailDps.slice(0));

        //Insert last part of range
        var startEndRangeIdx = rangeDps.length;
        for (var i = startEndRangeIdx; i >= lastRangeIdx; i--) {
            if (i <= 1 || rangeDps[i - 1].x <= detailEndX) {
                break;
            } else {
                startEndRangeIdx--;
            }
        }

        if (startEndRangeIdx < rangeDps.length) {
            splicedDps.push.apply(splicedDps, rangeDps.slice(startEndRangeIdx, rangeDps.length));
        }

    }

    return splicedDps;
};

/**
Finds last index in the range data set before the first detail data value.  Uses binary search per suggestion
by Benoit Person (https://github.com/ddr2) in Dygraphs mailing list.

@method _findLastRangeIdxBeforeDetailStart
@private
*/
GraphDataProvider.prototype._findLastRangeIdxBeforeDetailStart = function (rangeDps, firstDetailTime) {

    var minIndex = 0;
    var maxIndex = rangeDps.length - 1;
    var currentIndex;
    var currentElement;

    // Handle out of range cases
    if (rangeDps.length == 0 || firstDetailTime <= rangeDps[0].x)
        return -1;
    else if (rangeDps[rangeDps.length-1].x < firstDetailTime)
        return rangeDps.length-1;

    // Use binary search to find index of data point in range data that occurs immediately before firstDetailTime
    while (minIndex <= maxIndex) {
        currentIndex = Math.floor((minIndex + maxIndex) / 2);
        currentElement = rangeDps[currentIndex];

        if (currentElement.x < firstDetailTime) {
            minIndex = currentIndex + 1;

            //we want previous point, and will not often have an exact match due to different sampling intervals
            if (rangeDps[minIndex].x > firstDetailTime) {
                return currentIndex;
            }
        }
        else if (currentElement.x > firstDetailTime) {
            maxIndex = currentIndex - 1;

            //we want previous point, and will not often have an exact match due to different sampling intervals
            if (rangeDps[maxIndex].x < firstDetailTime) {
                return currentIndex-1;
            }

        }
        else {
            return currentIndex-1; //if exact match, we use previous range data point
        }

    }

    return -1;

};
