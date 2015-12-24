/** The classes file is used to declare some standard javascript classes which will be used in
 * the angular js services */

/** The spectra class is used to store information about each spectra loaded into marz
 * @param id - the fibre id
 * @param lambda - an array of wavelengths in Angstroms
 * @param intensity - an array of flux intensities
 * @param variance - an array of flux intensity variance
 * @param sky - an array of sky flux intensity, if it exists
 * @param name - the object's name
 * @param ra - the object's right ascension
 * @param dec - the object's declination
 * @param magnitude - the object's magnitude (extracted from fits file, not band explicit)
 * @param type - the object's type. Used to generate the prior for OzDES matching
 * @param filename - the filename this spectra belonged to. Used for storing data behind the scenes
 * @param drawingService - bad code style, but the angularjs drawing service is passed in to simplify logic in other locations
 * @constructor
 */
function Spectra(id, lambda, intensity, variance, sky, name, ra, dec, magnitude, type, filename) {
    this.version = marzVersion;
    this.id = id;
    this.name = name;
    this.ra = ra;
    this.dec = dec;
    this.magnitude = magnitude;
    this.type = type;
    this.filename = filename;
    this.lambda = lambda;
    this.intensity = intensity;
    this.variance = variance;
    this.variancePlot = variance;
    this.comment = "";
    this.compute = true;
    if (variance != null) {
        this.variancePlot = variance.slice();
        removeNaNs(this.variancePlot);
        normaliseViaShift(this.variancePlot, 0, varianceHeight, null);
    }
    this.autoQOP = null;
    this.sky = sky;
    this.intensitySubtractPlot = null;

    this.isProcessed = false;
    this.isProcessing = false;
    this.isMatched = false;
    this.isMatching = false;

    if (this.intensity != null) {
        this.intensityPlot = this.intensity.slice();
        this.processedLambdaPlot = null;
    }

    this.processedLambda = null;
    this.processedContinuum = null;
    this.processedIntensity = null;
    this.processedVariance = null;

    this.templateResults = null;
    this.automaticResults = null;
    this.automaticBestResults = null;
    this.manualRedshift = null;
    this.manualTemplateID = null;

    this.qopLabel = "";
    this.setQOP(0);
    this.imageZ = null;
    this.imageTID = null;
    this.image = null;
    this.getHash = function() {
        return "" + this.id + this.name + this.getFinalRedshift() + this.getFinalTemplateID() + this.isProcessed + this.isMatched;
    }
}
Spectra.prototype.setCompute = function(compute) {
    this.compute = compute;
    if (!compute) {
        this.isProcessed = true;
        this.isMatched = true;
    }
};
Spectra.prototype.setVersion = function(version) {
    this.version = version;
};
Spectra.prototype.setQOP = function(qop) {
    if (isNaN(qop)) {
        return;
    }
    this.qop = qop;
    // Best coding practise would have this UI logic outside of this class
    if (qop >= 6) {
        this.qopLabel = "label-primary";
    } else if (qop >= 4) {
        this.qopLabel = "label-success";
    } else if (qop >= 3) {
        this.qopLabel = "label-info";
    } else if (qop >= 2) {
        this.qopLabel = "label-warning";
    } else if (qop >= 1) {
        this.qopLabel = "label-danger";
    } else {
        this.qopLabel = "label-default";
    }
};
Spectra.prototype.getRA = function() {
    return this.ra * 180 / Math.PI;
};
Spectra.prototype.getDEC = function() {
    return this.dec * 180 / Math.PI;
};
Spectra.prototype.getImage = function(drawingService) {
    if (this.getFinalRedshift() != this.imageZ || this.imageTID != this.getFinalTemplateID() || this.image == null) {
        this.imageTID = this.getFinalTemplateID();
        this.imageZ = this.getFinalRedshift();
        this.image = this.getImageUrl(drawingService);
    }
    return this.image;

};
Spectra.prototype.getComment = function() {
    return this.comment;
};
Spectra.prototype.setComment = function(comment) {
    this.comment = comment;
};
Spectra.prototype.getImageUrl = function(drawingService) {
    var canvas = document.createElement('canvas');
    var ratio = window.devicePixelRatio || 1.0;
    var width = 318;
    var height = 118;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    var ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    drawingService.drawOverviewOnCanvas(this, canvas, width, height);
    return canvas.toDataURL();
};
Spectra.prototype.getTemplateResults = function() {
    return this.templateResults;
};
Spectra.prototype.getIntensitySubtracted = function() {
    if (this.intensitySubtractPlot == null) {
        if (this.intensityPlot == null) {
            return null;
        } else {
            this.intensitySubtractPlot = this.intensity.slice();
            subtractPolyFit(this.lambda, this.intensitySubtractPlot);
            return this.intensitySubtractPlot;
        }
    } else {
        return this.intensitySubtractPlot;
    }
};
Spectra.prototype.hasRedshift = function() {
    return this.automaticBestResults != null || this.manualRedshift != null;
};
Spectra.prototype.getAutomaticResults = function() {
    return this.automaticBestResults;
};
Spectra.prototype.getBestAutomaticResult = function() {
    if (this.automaticBestResults != null) {
        return this.automaticBestResults[0];
    }
    return null;
};
Spectra.prototype.getMatches = function(number) {
    if (number == null) return this.automaticBestResults;
    if (this.automaticBestResults == null) return [];
    return this.automaticBestResults.slice(0, number);
};
Spectra.prototype.getManual = function() {
    if (this.manualRedshift == null) return null;
    return {templateId: this.manualTemplateID, z: this.manualRedshift};
};
Spectra.prototype.getNumBestResults = function() {
    if (this.automaticBestResults == null) return 0;
    return this.automaticBestResults.length;
};
Spectra.prototype.hasMatches = function() {
    return (this.automaticBestResults != null && this.automaticBestResults.length > 1);
};
Spectra.prototype.getFinalRedshift = function() {
    if (this.manualRedshift != null) {
        return this.manualRedshift;
    } else if (this.automaticBestResults != null) {
        return this.automaticBestResults[0].z;
    } else {
        return null;
    }
};
Spectra.prototype.hasRedshiftToBeSaved = function() {
    return this.getFinalRedshift() != null;
};
Spectra.prototype.getFinalTemplateID = function() {
  if (this.manualRedshift) {
      return this.manualTemplateID;
  } else if (this.automaticBestResults) {
      return this.automaticBestResults[0].templateId;
  } else {
      return null;
  }
};
Spectra.prototype.getProcessingAndMatchingMessage = function() {
    return {
        processing: true,
        matching: true,
        id: this.id,
        name: this.name,
        lambda: this.lambda,
        type: this.type,
        intensity: this.intensity,
        variance: this.variance
    }
};
Spectra.prototype.getProcessMessage = function() {
    return {
        processing: true,
        id: this.id,
        name: this.name,
        lambda: this.lambda,
        intensity: this.intensity,
        variance: this.variance
    };
};
Spectra.prototype.getMatchMessage = function() {
    return {
        matching: true,
        id: this.id,
        name: this.name,
        type: this.type,
        lambda: this.processedLambda,
        intensity: this.processedIntensity,
        variance: this.processedVariance
    };
};






/**
 * The processor is responsible for hosting the worker and communicating with it.
 * @param $q - the angular promise creation object
 */
function Processor($q, node, worker) {
    this.flaggedForDeletion = false;
    this.node = node;
    this.$q = $q;
    if (worker == null) {
        this.worker = new Worker('js/worker.js');
    } else {
        this.worker = worker;
    }
    if (node) {
        try {
            this.worker.on('message', this.respond.bind(this));
        } catch (err) {}

    } else {
        try {
            this.worker.addEventListener('message', this.respond.bind(this), false);
        } catch (err) {}
    }
}
Processor.prototype.respond = function(e) {
    //window.onFileMatched("Got response");
    this.promise.resolve(e);
    this.promise = null;
    if (this.flaggedForDeletion) {
        this.worker = null;
    }
};
Processor.prototype.flagForDeletion = function() {
    this.flaggedForDeletion = true;
};
Processor.prototype.isIdle = function() {
    return this.promise == null;
};
Processor.prototype.workOnSpectra = function(data) {
    this.promise = this.$q.defer();
    if (this.node) {
        this.worker.send(data);
    } else {
        this.worker.postMessage(data);
    }
    return this.promise.promise;
};

function getProcessors($q, numberProcessors, node) {
    var processors = [];
    if (node) {
        //window.onFileMatched("IN 1");
        var workers = getNodeWorkers(numberProcessors);
        //window.onFileMatched("IN 2");
        //window.onFileMatched(workers.length);
        for (var i = 0; i < workers.length; i++) {
            processors.push(new Processor($q, true, workers[i]))
        }
    } else {
        for (var i = 0; i < numberProcessors; i++) {
            processors.push(new Processor($q, false))
        }
    }
    //window.onFileMatched("IN 3");
    return processors;
}

function getNodeWorkers(numberProcessors) {
    return window.getWorkers();
}


/**
 * This represents a stateful cumulative absolute area finder (super basic integral).
 *
 * Class kept in in case I need it again, I've done it a different way for now.
 * @param array
 * @constructor
 */
function FastAreaFinder(array) {
    this.array = array;
    this.start = null;
    this.end = null;
    this.area = 0;
}
FastAreaFinder.prototype.getArea = function(start, end) {
    if (start < 0) start = 0;
    if (end > this.array.length) end = this.array.length;
    if (this.start == null || this.end == null) {
        this.area = 0;
        for (var i = start; i < end; i++) {
            this.area += Math.abs(this.array[i]);
        }
    } else {

        if (start < this.start) {
            for (var i = start; i < this.start; i++) {
                this.area += Math.abs(this.array[i]);
            }
        } else if (start > this.start) {
            for (var i = this.start; i < start; i++) {
                this.area -= Math.abs(this.array[i]);
            }
        }
        if (end > this.end) {
            for (var i = this.end; i < end; i++) {
                this.area += Math.abs(this.array[i]);
            }
        } else if (end < this.end) {
            for (var i = end; i < this.end; i++) {
                this.area -= Math.abs(this.array[i]);
            }
        }
    }
    this.start = start;
    this.end = end;
    return this.area;
};
















function FitsFileLoader($q, global, log, processorService) {
    this.isLoading = false;
    this.hasFitsFile = false;
    this.originalFilename = null;
    this.filename = null;
    this.MJD = null;
    this.date = null;
    this.header0 = null;

    this.spectra = null;
    this.primaryIndex = 0;
    this.numPoints = null;

    this.$q = $q;
    this.processorService = processorService;
    this.global = global;
    this.log = log;
    this.subscribed = [];
    this.subscribedContexts = [];
}
FitsFileLoader.prototype.subscribeToInput = function(fn, context) {
    this.subscribed.push(fn);
    this.subscribedContexts.push(context);
};
FitsFileLoader.prototype.loadInFitsFile = function(file) {
    var q = this.$q.defer();
    this.isLoading = true;
    this.hasFitsFile = true;
    var pass = file;
    if (file.actualName != null) {
        this.originalFilename = file.actualName.replace(/\.[^/.]+$/, "");
        pass = file.file;
    } else {
        this.originalFilename = file.name.replace(/\.[^/.]+$/, "");
    }
    this.global.data.fitsFileName = this.originalFilename;
    this.filename = this.originalFilename.replace(/_/g, " ");
    this.log.debug("Loading FITs file");
    this.fits = new astro.FITS(pass, function() {
        this.log.debug("Loaded FITS file");
        this.parseFitsFile(q);
        this.processorService.setPause();
    }.bind(this));
    return q.promise;
};
FitsFileLoader.prototype.getHDUFromName = function(name) {
    var n = name.toUpperCase();
    for (var i = 0; i < this.fits.hdus.length; i++) {
        var h = this.fits.getHeader(i).cards['EXTNAME'];
        if (h != null && h.value.toUpperCase() == n) {
            this.log.debug(name + " index found at " + i);
            return i;
        }
    }
    return null;
};
/**
 * This function takes a promise object and resolves it on successful loading of a FITs file.
 *
 * The function will construct the wavelength array from header values, and then attempt to extract
 * intensity, variance, sky and fibre data.
 *
 * @param q
 */
FitsFileLoader.prototype.parseFitsFile = function(q) {
    this.log.debug("Getting headers");
    this.header0 = this.fits.getHDU(0).header;
    this.MJD = this.header0.get('UTMJD');
    date = MJDtoYMD(this.MJD);

    this.numPoints = this.fits.getHDU(0).data.width;

    this.$q.all([this.getWavelengths(), this.getIntensityData(), this.getVarianceData(), this.getSkyData(), this.getDetailsData()]).then(function(data) {
        this.log.debug("Load promises complete");
        var lambda = data[0];
        var intensity = data[1];
        var variance = data[2];
        var sky = data[3];
        var details = data[4];
        var indexesToRemove = [];
        if (details != null) {
            if (details['FIBRE'] != null) {
                for (var i = 0; i < details['FIBRE'].length; i++) {
                    if (details['FIBRE'][i] != 'P') {
                        indexesToRemove.push(i);
                    }
                }
            }
            if (details['TYPE'] != null) {
                for (var i = 0; i < details['TYPE'].length; i++) {
                    if (details['TYPE'][i].toUpperCase() == 'PARKED') {
                        indexesToRemove.push(i)
                    }
                }
            }
        }
        this.log.debug("Have indexes to remove");
        indexesToRemove.sort();
        indexesToRemove = indexesToRemove.unique();

        var spectraList = [];
        for (var i = 0; i < intensity.length; i++) {
            if (indexesToRemove.indexOf(i) != -1 || !this.useSpectra(intensity[i])) {
                continue;
            }
            var id = i + 1;
            var llambda = (lambda.length == 1) ? lambda[0].slice(0) : lambda[i];
            var int = intensity[i];
            var vari = variance == null ? null : variance[i];
            var skyy = sky == null ? null : (sky.length == 1) ? sky[0] : sky[i];
            var name = details == null ? "Unknown spectra " + id : details['NAME'][i];
            var ra = details == null ? null : details['RA'][i];
            var dec = details == null ? null : details['DEC'][i];
            var mag = details == null ? null : details['MAGNITUDE'][i];
            var type = details == null ? null : details['TYPE'][i];


            var s = new Spectra(id, llambda, int, vari, skyy, name, ra, dec, mag, type, this.originalFilename);
            s.setCompute(int != null && vari != null);
            spectraList.push(s)
        }
        this.log.debug("Spectra list made");
        this.isLoading = false;
        for (var i = 0; i < this.subscribed.length; i++) {
            this.subscribed[i].apply(this.subscribedContexts[i], [spectraList]);
        }
        this.log.debug("Returning FITs object");
        q.resolve();

    }.bind(this))
};
FitsFileLoader.prototype.getWavelengths = function() {
    var q = this.$q.defer();
    this.getRawWavelengths().then(function(lambdas) {
        var needToShift = this.header0.get('VACUUM') == null || this.header0.get('VACUUM') == 0;
        var logLinear = this.header0.get('LOGSCALE') != null && this.header0.get('LOGSCALE') != 0;

        if (logLinear) {
            this.log.debug("Log linear wavelength detected");
            for (var i = 0; i < lambdas.length; i++) {
                for (var j = 0; j < lambdas[i].length; j++) {
                    lambdas[i][j] = Math.pow(10, lambdas[i][j]);
                }
            }
        }
        if (needToShift) {
            this.log.debug("Shifting air wavelengths into vacuum");
            for (var i = 0; i < lambdas.length; i++) {
                convertVacuumFromAir(lambdas[i]);
            }
        }

        q.resolve(lambdas);
    }.bind(this), function(err) {
        this.log.error(err);
        q.reject(err);
    }.bind(this));

    return q.promise;
};
FitsFileLoader.prototype.getRawWavelengths = function() {
    this.log.debug("Getting spectra wavelengths");
    var q = this.$q.defer();
    var index = this.getHDUFromName("wavelength");
    if (index == null) {
        this.log.debug("Wavelength extension not found. Checking headings");
        var CRVAL1 = this.header0.get('CRVAL1');
        var CRPIX1 = this.header0.get('CRPIX1');
        var CDELT1 = this.header0.get('CDELT1');
        if (CDELT1 == null) {
            CDELT1 = this.header0.get('CD1_1');
        }
        if (CRVAL1 == null || CRPIX1 == null || CDELT1 == null) {
            q.reject("Wavelength header values incorrect: CRVAL1=" + CRVAL1 + ", CRPIX1=" + CRPIX1 + ", CDELT1=" + CDELT1 + ".");
        }
        var lambdas = [];
        var lambda = [];
        for (var i = 0; i < this.numPoints; i++) {
            lambda.push(((i + 1 - CRPIX1) * CDELT1) + CRVAL1);
        }
        lambdas.push(lambda);
        q.resolve(lambdas);

    } else {
        this.fits.getDataUnit(index).getFrame(0, function (data, q) {
            var d = Array.prototype.slice.call(data);
            var lambdas = [];
            for (var i = 0; i < data.length / this.numPoints; i++) {
                var s = d.slice(i * this.numPoints, (i + 1) * this.numPoints);
                lambdas.push(s);
            }
            this.log.debug(lambdas.length + " wavelength rows found");
            q.resolve(lambdas);
        }, q);
    }
    return q.promise;
};
/**
 * Attempts to extract the spectrum intensity data from the right extension.
 * On failure, will return null and not reject the deferred promise.
 *
 * @returns {deferred.promise}
 */
FitsFileLoader.prototype.getIntensityData = function() {
    this.log.debug("Getting spectra intensity");

    var index = this.getHDUFromName("intensity");
    if (index == null) {
        index = this.primaryIndex;
    }
    var q = this.$q.defer();
    try {
        this.fits.getDataUnit(index).getFrame(0, function (data, q) {
            var d = Array.prototype.slice.call(data);
            var intensity = [];
            for (var i = 0; i < data.length / this.numPoints; i++) {
                intensity.push(d.slice(i * this.numPoints, (i + 1) * this.numPoints));
            }
            q.resolve(intensity)
        }.bind(this), q);
    } catch (err) {
        console.warn(err);
        q.resolve(null);
    }
    return q.promise;
};
/**
 * Attempts to extract the spectrum variance data from the right extension.
 * On failure, will return null and not reject the deferred promise.
 *
 * @returns {deferred.promise}
 */
FitsFileLoader.prototype.getVarianceData = function() {
    this.log.debug("Getting spectra variance");
    var index = this.getHDUFromName("variance");
    var q = this.$q.defer();
    if (index == null) {
        q.resolve(null);
        return q.promise;
    }
    try {
        this.fits.getDataUnit(index).getFrame(0, function (data, q) {
            var d = Array.prototype.slice.call(data);
            var variance = [];
            for (var i = 0; i < data.length / this.numPoints; i++) {
                variance.push(d.slice(i * this.numPoints, (i + 1) * this.numPoints));
            }
            q.resolve(variance)
        }.bind(this), q);
    } catch (err) {
        q.resolve(null);
    }
    return q.promise;
};
/**
 * Attempts to extract the sky spectrum  from the right extension.
 * Does basic filtering on the sky (remove Nans and normalise to the right pixel height).
 *
 * Will return an array of sky data if data is found, which may contain one element or as many
 * elements as there are spectra.
 *
 * On failure, will return null and not reject the deferred promise.
 *
 * @returns {deferred.promise}
 */
FitsFileLoader.prototype.getSkyData = function() {
    this.log.debug("Getting sky");
    var index = this.getHDUFromName("sky");
    var q = this.$q.defer();
    if (index == null) {
        q.resolve(null);
        return q.promise;
    }
    try {
        this.fits.getDataUnit(index).getFrame(0, function (data, q) {
            var d = Array.prototype.slice.call(data);
            var sky = [];
            for (var i = 0; i < data.length / this.numPoints; i++) {
                var s = d.slice(i * this.numPoints, (i + 1) * this.numPoints);
                try {
                    removeNaNs(s);
                    normaliseViaShift(s, 0, this.global.ui.detailed.skyHeight, null);
                } catch (ex) {}
                sky.push(s);
            }
            q.resolve(sky)
        }.bind(this), q);
    } catch (err) {
        q.resolve(null);
    }
    return q.promise;
};

/**
 * Searches for tabular data in the fibres extension, and attempts to extract the fibre type, name, magnitude,
 * right ascension, declination and comment.
 *
 * On failure, will return null and not reject the deferred promise.
 *
 * @returns {deferred.promise}
 */
FitsFileLoader.prototype.getDetailsData = function() {
    this.log.debug("Getting details");
    var index = this.getHDUFromName("fibres");
    var q = this.$q.defer();
    if (index == null) {
        q.resolve(null);
        return q.promise;
    }
    try {
        this.getFibres(q, index, {});
    } catch (err) {
        q.resolve(null);
    }
    return q.promise;
};
FitsFileLoader.prototype.getFibres = function(q, index, cumulative) {
    this.log.debug("Getting fibres");
    this.fits.getDataUnit(index).getColumn("TYPE", function(data) {
        cumulative['FIBRE'] = data;
        this.getNames(q, index, cumulative);
    }.bind(this));
};
FitsFileLoader.prototype.getNames = function(q, index, cumulative) {
    this.log.debug("Getting names");
    this.fits.getDataUnit(index).getColumn("NAME", function(data) {
        var names = [];
        for (var i = 0; i < data.length; i++) {
            names.push(data[i].replace(/\s+/g, '').replace(/\u0000/g, ""));
        }
        cumulative['NAME'] = names;
        this.getRA(q, index, cumulative);
    }.bind(this));
};
FitsFileLoader.prototype.getRA = function(q, index, cumulative) {
    this.log.debug("Getting RA");
    this.fits.getDataUnit(index).getColumn("RA", function(data) {
        cumulative['RA'] = data;
        this.getDec(q, index, cumulative);
    }.bind(this));
};
FitsFileLoader.prototype.getDec = function(q, index, cumulative) {
    this.log.debug("Getting DEC");
    this.fits.getDataUnit(index).getColumn("DEC", function(data) {
        cumulative['DEC'] = data;
        this.getMagnitudes(q, index, cumulative);
    }.bind(this));
};

FitsFileLoader.prototype.getMagnitudes = function(q, index, cumulative) {
    this.log.debug("Getting magnitude");
    this.fits.getDataUnit(index).getColumn("MAGNITUDE", function(data) {
        cumulative['MAGNITUDE'] = data;
        this.getComments(q, index, cumulative);
    }.bind(this));
};
FitsFileLoader.prototype.getComments = function(q, index, cumulative) {
    this.log.debug("Getting comment");
    this.fits.getDataUnit(index).getColumn("COMMENT", function(data) {
        this.global.data.types.length = 0;
        var ts = [];
        for (var i = 0; i < data.length; i++) {
            var t = data[i].split(' ')[0];
            t = t.trim().replace(/\W/g, '');
            ts.push(t);
            if (t != 'Parked' && this.global.data.types.indexOf(t) == -1) {
                this.global.data.types.push(t);
            }
        }
        cumulative['TYPE'] = ts;
        q.resolve(cumulative);
    }.bind(this));
};

/**
 * Issues with some spectra containing almost all NaN values means I now check
 * each spectra before redshifting. This is a simple check at the moment,
 * but it can be extended if needed.
 *
 * Currently, if 90% or more of spectra values are NaN, throw it out. Realistically,
 * I could make this limit much lower.
 *
 * @param intensity
 * @returns {boolean}
 */
FitsFileLoader.prototype.useSpectra = function(intensity) {
    var c = 0;
    for (var i = 0; i < intensity.length; i++) {
        if (isNaN(intensity[i])) {
            c += 1;
        }
    }
    if (c > 0.9 * intensity.length) {
        return false;
    }
    return true;
};
















function ProcessorManager() {
    this.processing = true;

    this.getInactiveTemplates = null;
    this.processedCallback = null;
    this.processedCallbackContext = null;
    this.matchedCallback = null;
    this.matchedCallbackContext = null;

    this.processTogether = true;

    this.processors = [];
    this.jobs = [];
    this.priorityJobs = [];

    this.node = false;
}
ProcessorManager.prototype.setNode = function() {
    this.node = true;
};
ProcessorManager.prototype.setProcessTogether = function(processTogether) {
    this.processTogether = processTogether;
};
ProcessorManager.prototype.setInactiveTemplateCallback = function(fn) {
    this.getInactiveTemplates = fn;
};
ProcessorManager.prototype.toggleProcessing = function() {
    this.processing = !this.processing;
};
ProcessorManager.prototype.setProcessedCallback = function(fn, context) {
    this.processedCallback = fn;
    this.processedCallbackContext = context;
};
ProcessorManager.prototype.setMatchedCallback = function(fn, context) {
    this.matchedCallback = fn;
    this.matchedCallbackContext = context;
};
ProcessorManager.prototype.setNumberProcessors = function(num, $q) {
    if (num < this.processors.length) {
        while (this.processors.length > num) {
            this.processors[0].flagForDeletion();
            this.processors.splice(0, 1);
        }
    } else if (num > this.processors.length) {
        while (this.processors.length < num) {
            this.processors.push(new Processor($q, this.node));
        }
    }
};
ProcessorManager.prototype.setWorkers = function(workers, $q) {
    while (this.processors.length > 0) {
        this.processors[0].flagForDeletion();
        this.processors.splice(0, 1);
    }
    for (var i = 0; i < workers.length; i++) {
        this.processors.push(new Processor($q, true, workers[i]));
    }
};
ProcessorManager.prototype.processSpectra = function(spectra) {
    spectra.inactiveTemplates = this.getInactiveTemplates();
    var processor = this.getIdleProcessor();
    processor.workOnSpectra(spectra, this.node).then(function(result) {
        if (result.data.processing) {
            this.processedCallback.apply(this.processedCallbackContext, [result.data]);
        }
        if (result.data.matching) {
            this.matchedCallback.apply(this.matchedCallbackContext, [result.data]);
        }
        this.processJobs();
    }.bind(this), function(reason) {
        console.warn(reason);
    });
};
ProcessorManager.prototype.getNumberProcessors = function() {
    return this.processors.length;
};
ProcessorManager.prototype.getIdleProcessor = function() {
    for (var i = 0; i < this.processors.length; i++) {
        if (this.processors[i].isIdle()) {
            return this.processors[i];
        }
    }
    return null;
};
ProcessorManager.prototype.addSpectraListToQueue = function(spectraList) {
    this.jobs.length = 0;
    for (var i = 0; i < spectraList.length; i++) {
        this.jobs.push(spectraList[i]);
    }
    this.setRunning();
};
ProcessorManager.prototype.addToPriorityQueue = function(spectra, start) {
    spectra.isMatched = false;
    this.priorityJobs.push(spectra);
    if (start) {
        this.processJobs();
    }
};
ProcessorManager.prototype.hasIdleProcessor = function() {
    return this.getIdleProcessor() != null;
};
ProcessorManager.prototype.shouldProcess = function(spectra) {
    return !spectra.isProcessing && !spectra.isProcessed;
};
ProcessorManager.prototype.shouldMatch = function(spectra) {
    return spectra.isProcessed && !spectra.isMatching && (!spectra.isMatched || spectra.templateResults == null);
};
ProcessorManager.prototype.shouldProcessAndMatch = function(spectra) {
    return !spectra.isProcessing && !spectra.isProcessed;
};
ProcessorManager.prototype.processJobs = function() {
    var findingJobs = true;
    while (findingJobs && this.hasIdleProcessor()) {
        findingJobs = this.processAJob();
    }
};
ProcessorManager.prototype.isPaused = function() {
    return !this.processing;
};
ProcessorManager.prototype.setPause = function() {
    this.processing = false;
};
ProcessorManager.prototype.setRunning = function() {
    this.processing = true;
    this.processJobs();
};
ProcessorManager.prototype.togglePause = function() {
    this.processing = !this.processing;
    if (this.processing) {
        this.processJobs();
    }
};
/**
 * Processes priority jobs processing then matching, and then normal
 * jobs processing and matching if processing is enabled.
 */
ProcessorManager.prototype.processAJob = function() {
    for (var i = 0; i < this.priorityJobs.length; i++) {
        if (this.shouldProcess(this.priorityJobs[i])) {
            this.priorityJobs[i].isProcessing = true;
            this.processSpectra(this.priorityJobs[i].getProcessMessage());
            return true;
        }
    }
    for (i = 0; i < this.priorityJobs.length; i++) {
        if (this.shouldMatch(this.priorityJobs[i])) {
            this.priorityJobs[i].isMatching = true;
            this.processSpectra(this.priorityJobs[i].getMatchMessage());
            return true;
        }
    }
    if (this.processing) {
        if (this.processTogether) {
            for (i = 0; i < this.jobs.length; i++) {
                if (this.shouldProcessAndMatch(this.jobs[i])) {
                    this.jobs[i].isProcessing = true;
                    this.processSpectra(this.jobs[i].getProcessingAndMatchingMessage());
                    return true;
                }
            }
        } else {
            for (i = 0; i < this.jobs.length; i++) {
                if (this.shouldProcess(this.jobs[i])) {
                    this.jobs[i].isProcessing = true;
                    this.processSpectra(this.jobs[i].getProcessMessage());
                    return true;
                }
            }
            for (i = 0; i < this.jobs.length; i++) {
                if (this.shouldMatch(this.jobs[i])) {
                    this.jobs[i].isMatching = true;
                    this.processSpectra(this.jobs[i].getMatchMessage());
                    return true;
                }
            }
        }
    }
    return false;
};









function SpectraManager(data, log) {
    this.data = data;
    this.finishedCallback = null;
    this.log = log;
    this.autoQOPs = false;
}
SpectraManager.prototype.setFinishedCallback = function(fn) {
    this.finishedCallback = fn;
};
SpectraManager.prototype.setAssignAutoQOPs = function (autoQOPs) {
    this.autoQOPs = autoQOPs;
};
SpectraManager.prototype.setMatchedResults = function(results) {
    var spectra = this.data.spectraHash[results.id];
    if (spectra == null || spectra.name != results.name) return;
    spectra.automaticResults = results.results.coalesced;
    spectra.templateResults = results.results.templates;
    spectra.setVersion(marzVersion);
    spectra.autoQOP = results.results.autoQOP;
    spectra.automaticBestResults = results.results.coalesced;
    spectra.isMatching = false;
    spectra.isMatched = true;
    if (this.autoQOPs == true && spectra.qop == 0) {
        spectra.setQOP(results.results.autoQOP);
    }
    this.log.debug("Matched " + results.id);
    if (this.isFinishedMatching() && !this.isProcessing()) {
        if (this.finishedCallback) {
            this.finishedCallback();
        }
    }
};
SpectraManager.prototype.setSpectra = function(spectraList) {
    this.data.spectra.length = 0;
    this.data.spectraHash = {};
    for (var i = 0; i < spectraList.length; i++) {
        this.data.spectra.push(spectraList[i]);
        this.data.spectraHash[spectraList[i].id] = spectraList[i];
    }
};
SpectraManager.prototype.setProcessedResults = function(results) {
    var spectra = this.data.spectraHash[results.id];
    if (spectra.name != results.name) return;
    spectra.processedLambda = results.lambda;
    spectra.processedIntensity = results.intensity;
    spectra.processedContinuum = results.continuum;
    spectra.isProcessing = false;
    spectra.isProcessed = true;
};
SpectraManager.prototype.isFinishedMatching = function() {
    return this.getNumberMatched() == this.getNumberTotal();
};
SpectraManager.prototype.isProcessing = function() {
    return this.getNumberProcessed() < this.getNumberTotal();
};
SpectraManager.prototype.getNumberMatched = function() {
    var num = 0;
    for (var i = 0; i < this.data.spectra.length; i++) {
        if (this.data.spectra[i].isMatched) {
            num++;
        }
    }
    return num;
};
SpectraManager.prototype.getNumberProcessed = function() {
    var num = 0;
    for (var i = 0; i < this.data.spectra.length; i++) {
        if (this.data.spectra[i].isProcessed) {
            num++;
        }
    }
    return num;
};
SpectraManager.prototype.getNumberTotal = function() {
    return this.data.spectra.length;
};








function ResultsGenerator(data, templates) {
    this.data = data;
    this.templates = templates;
    this.numAutomatic = 1;
}
ResultsGenerator.prototype.setNumAutomatic = function(num) {
    this.numAutomatic = num;
};
ResultsGenerator.prototype.getStatistics = function(results) {
    var totalSpectra = results.length;
    var uses = [];
    for (var i = 0; i < results.length; i++) {
        var d = results[i];
        var use = false;
        for (var j = 0; j < d.length; j++) {
            if (d[j]['name'] == 'QOP' && parseInt(d[j]['value']) > 2) {
                use = true;
            }
        }
        if (use) {
            uses.push(d);
        }
    }
    var string = "# Redshift quality > 2 for ";
    string += uses.length;
    string += " out of " ;
    string += totalSpectra;
    string += " targets, a success rate of  ";
    string += (100.0 * uses.length / totalSpectra).toFixed(1);
    string += "%\n";
    return string;
};

ResultsGenerator.prototype.getResultsCSV = function(initials) {
    var results = this.getResultsArray();
    initials = defaultFor(initials, "");
    var string = "# Results generated by " + initials
        + " for file [[" + this.data.fitsFileName + "]] at " + new Date().toLocaleString() + " (JSON: " + JSON.stringify(new Date()) + ") at version {{" + marzVersion + "}}\n";
    string += this.getStatistics(results);
    string += "#";
    if (results.length > 0) {
        var spaces = results[0].map(function(x) { return x.name.length; });
        for (var i = 0; i < results.length; i++) {
            var lengths = results[i];
            for (var j = 0; j < lengths.length; j++) {
                if (lengths[j].value != null && lengths[j].value.length > spaces[j]) {
                    spaces[j] = lengths[j].value.length;
                }
            }
        }

        for (var i = 0; i < results.length; i++) {
            var res = results[i];
            var first = 0;
            if (i == 0) {
                for (var k = 0; k < res.length; k++) {
                    string += ((first++ == 0) ? "" : ",  ") + res[k].name.spacePad(spaces[k]);
                }
                string += "\n";
                first = 0;
            }
            for (var j = 0; j < res.length; j++) {
                string += ((first++ == 0) ? " " : ",  ") + (res[j].value == null ? "" : res[j].value.replace(",","")).spacePad(spaces[j]);
            }
            string += "\n";
        }
    }

    return string;
};
ResultsGenerator.prototype.getResultsArray = function() {
    var result = [];
    for (var i = 0; i < this.data.spectra.length; i++) {
        var spectra = this.data.spectra[i];
        if (spectra.hasRedshiftToBeSaved()) {
            result.push(this.getResultFromSpectra(spectra));
        }
    }
    return result;
};
ResultsGenerator.prototype.getResultFromSpectra = function(spectra) {
    var result = [];
    result.push({name: "ID", value: ("" + spectra.id).pad(4)});
    result.push({name: "Name", value: spectra.name});
    result.push({name: "RA", value: spectra.ra == null ? null : spectra.ra.toFixed(6)});
    result.push({name: "DEC", value: spectra.dec == null ? null : spectra.dec.toFixed(6)});
    result.push({name: "Mag", value: spectra.magnitude == null ? null : spectra.magnitude.toFixed(2)});
    result.push({name: "Type", value: spectra.type});
    var automatics = spectra.getAutomaticResults();
    if (automatics != null) {
        for (var i = 0; i < this.numAutomatic; i++) {
            var suffix = (i == 0 ? "" : ""+(i+1));
            if (i >= automatics.length) break;
            result.push({name: "AutoTID"+suffix, value: automatics[i].templateId});
            result.push({name: "AutoTN"+suffix, value:  this.templates.getNameForTemplate(automatics[i].templateId)});
            result.push({name: "AutoZ"+suffix, value: automatics[i].z.toFixed(5)});
            result.push({name: "AutoXCor"+suffix, value: automatics[i].value.toFixed(5)});
        }
    }
    result.push({name: "FinTID", value: spectra.getFinalTemplateID() ? spectra.getFinalTemplateID() : "0"});
    result.push({name: "FinTN", value: this.templates.getNameForTemplate(spectra.getFinalTemplateID())});
    result.push({name: "FinZ", value: spectra.getFinalRedshift().toFixed(5)});
    result.push({name: "QOP", value: "" + spectra.qop});
    result.push({name: "Comment", value: spectra.getComment()});
    return result;
};