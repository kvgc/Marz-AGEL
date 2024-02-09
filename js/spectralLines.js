var deps = ["./methods"];
for (var i = 0; i < deps.length; i++) {
    require(deps[i])();
}


function SpectralLines() {
    this.lines = [];
    this.types = {
        BOTH: 0,
        EMISSION: 1,
        ABSORPTION: 2
    };
    this.initialiseDefault();
}
/**
 * Adds a spectral line to the globally available array.
 *
 * @param id - the short name of the line (eg 'Lya')
 * @param name - the full name of the line (eg 'Lyman Alpha')
 * @param wavelength - the wavelength of the line
 * @param air - true if the wavelength is with respect to air, not the vacuum
 * @param type - whether this a line found in emission or absorption spectra, or both. Use. spectraLines.TYPES
 * @param enabled - whether or not to use the spectral line
 */
SpectralLines.prototype.addSpectralLine = function(id, label, name, wavelength, air, type, enabled, shortcut, displayLines) {
    if (id == null || label == null || name == null || wavelength == null || air == null || type == null) {
        console.warn('Not a valid line. A null was passed in.');
        return;
    }
    if (parseFloat(wavelength) == null || isNaN(parseFloat(wavelength))) {
        console.warn('Wavelength is not a valid number');
        return;
    }
    if (type < 0 || type > 2) {
        console.warn('Type is not valid');
        return;
    }

    if (air) {
        wavelength = convertSingleVacuumFromAir(wavelength);
    }
    if (displayLines == null || typeof displayLines == "undefined") {
        displayLines = [wavelength];
    } else if (air) {
        for (var i = 0; i < displayLines.length; i++) {
            displayLines[i] = convertSingleVacuumFromAir(displayLines[i])
        }
    }
    // Check if already exists.
    for (var i = 0; i < this.lines.length; i++) {
        if (this.lines[i].id == id) {
            console.warn('Id of ' + id + ' already declared');
            return;
        } else if (this.lines[i].name == name) {
            console.warn('Name of ' + name + ' already declared');
            return;
        } else if (this.lines[i].wavelength == wavelength) {
            console.warn('Vacuum wavelength of ' + wavelength.toFixed(2) + ' already declared');
            return;
        }
    }
    this.lines.push({
        id: id,
        label: label,
        name: name,
        wavelength: wavelength,
        logWavelength: Math.log(wavelength)/Math.LN10,
        type: type,
        enabled: enabled,
        shortcut: shortcut,
        displayLines: displayLines
    });
};
SpectralLines.prototype.initialiseDefault = function() {

    this.addSpectralLine('Si III 1206','Si III 1206', 'Si III 1206',1206.5,  0, 1, 1, '');
    this.addSpectralLine('H I 1216','H I 1216', 'H I 1216',1215.6701,  0, 1, 1, '');
    this.addSpectralLine('Si II 1260','Si II 1260', 'Si II 1260',1260.4221,  0, 1, 1, '');
    this.addSpectralLine('O I 1302','O I 1302', 'O I 1302',1302.1685,  0, 1, 1, '');
    this.addSpectralLine('Si II 1304','Si II 1304', 'Si II 1304',1304.3702,  0, 1, 1, '');
    this.addSpectralLine('C II  1334','C II  1334', 'C II  1334',1334.5323,  0, 1, 1, '');
    this.addSpectralLine('C II 1334','C II 1334', 'C II 1334',1334.5323,  0, 1, 1, '');
    this.addSpectralLine('Si II 1526','Si II 1526', 'Si II 1526',1526.7066,  0, 1, 1, '');
    this.addSpectralLine('Fe II 1608','Fe II 1608', 'Fe II 1608',1608.4511,  0, 1, 1, '');
    this.addSpectralLine('Fe II 1611','Fe II 1611', 'Fe II 1611',1611.2005,  0, 1, 1, '');
    this.addSpectralLine('Al II 1670','Al II 1670', 'Al II 1670',1670.7874,  0, 1, 1, '');
    this.addSpectralLine('Fe II 2344','Fe II 2344', 'Fe II 2344',2344.214,  0, 1, 1, '');
    this.addSpectralLine('Fe II 2374','Fe II 2374', 'Fe II 2374',2374.4612,  0, 1, 1, '');
    this.addSpectralLine('Fe II 2382','Fe II 2382', 'Fe II 2382',2382.765,  0, 1, 1, '');
    this.addSpectralLine('Fe II 2586','Fe II 2586', 'Fe II 2586',2586.65,  0, 1, 1, '');
    this.addSpectralLine('Fe II 2600','Fe II 2600', 'Fe II 2600',2600.1729,  0, 1, 1, '');
    this.addSpectralLine('Mg II 2796','Mg II 2796', 'Mg II 2796',2796.352,  0, 1, 1, '');
    this.addSpectralLine('Mg II 2803','Mg II 2803', 'Mg II 2803',2803.531,  0, 1, 1, '');
    this.addSpectralLine('Mg I 2852','Mg I 2852', 'Mg I 2852',2852.9642,  0, 1, 1, '');
    this.addSpectralLine('Si IV 1393','Si IV 1393', 'Si IV 1393',1393.755,  0, 1, 1, '');
    this.addSpectralLine('Si IV 1402','Si IV 1402', 'Si IV 1402',1402.77,  0, 1, 1, '');
    this.addSpectralLine('C IV  1548','C IV  1548', 'C IV  1548',1548.195,  0, 1, 1, '');
    this.addSpectralLine('C IV  1550','C IV  1550', 'C IV  1550',1550.77,  0, 1, 1, '');
    this.addSpectralLine('Al III 1854','Al III 1854', 'Al III 1854',1854.7164,  0, 1, 1, '');
    this.addSpectralLine('Al III 1862','Al III 1862', 'Al III 1862',1862.7895,  0, 1, 1, '');
    this.addSpectralLine('He II 1640','He II 1640', 'He II 1640',1640.42,  0, 1, 1, '');
    this.addSpectralLine('O III] 1661','O III] 1661', 'O III] 1661',1660.809,  0, 1, 1, '');
    this.addSpectralLine('O III] 1666','O III] 1666', 'O III] 1666',1666.15,  0, 1, 1, '');
    this.addSpectralLine('Si III] 1882','Si III] 1882', 'Si III] 1882',1882.71,  0, 1, 1, '');
    this.addSpectralLine('Si III] 1892','Si III] 1892', 'Si III] 1892',1892.03,  0, 1, 1, '');
    this.addSpectralLine('C III] 1907','C III] 1907', 'C III] 1907',1906.683,  0, 1, 1, '');
    this.addSpectralLine('C III] 1909','C III] 1909', 'C III] 1909',1908.734,  0, 1, 1, '');
    this.addSpectralLine('O2', '[OII]',  'Oxygen 2',         3728.485,  0, 1, 1, '', [3727.09, 3729.88]);
    this.addSpectralLine('Ne3', '[NeIII]',  'Neon 3',        3869.81,   0, 1, 1, '');
    this.addSpectralLine('K',  'K',   'Potassium',           3933.663,  1, 2, 1, '');
    this.addSpectralLine('H',  'H',   'Hydrogen',            3968.468,  1, 2, 1, '');
    this.addSpectralLine('Hd',  'H\u03B4', 'Hydrogen Delta', 4102.92,   0, 0, 1, '');
    this.addSpectralLine('G',  'G',   'G',                   4304.4,    1, 2, 1, '');
    this.addSpectralLine('Hg', 'H\u03B3',  'Hydrogen gamma', 4341.69,   0, 0, 1, '');
    this.addSpectralLine('Hb', 'H\u03B2',  'Hydrogen Beta',  4861.325,  1, 0, 1, '');
    this.addSpectralLine('O3', '[OIII]',  'Oxygen 3',        4958.911,  1, 1, 1, '');
    this.addSpectralLine('O3d','[OIII]', 'Oxygen 3 Doublet', 5006.843,  1, 1, 1, '');
    this.addSpectralLine('Mg', 'Mg',  'Magnesium',           5175.3,    1, 2, 1, '');
    this.addSpectralLine('Na', 'Na',  'Sodium',              5894.0,    1, 2, 1, '');
    this.addSpectralLine('N2', '[NII]',  'Nitrogen 2',       6549.84,   0, 1, 1, '');
    this.addSpectralLine('Ha', 'H\u03B1',  'Hydrogen Alpha', 6562.80,   1, 0, 1, '');
    this.addSpectralLine('N2d', '[NII]','Nitrogen 2 Doublet',6585.23,   0, 1, 1, '');
    this.addSpectralLine('S2', '[SII]',  'Sulfur 2',         6718.32,   0, 1, 1, '');
    this.addSpectralLine('S2d','[SII]', 'Sulfur 2 Doublet',  6732.71,   0, 1, 1, '');
};
SpectralLines.prototype.getAll = function() {
    return this.lines;
};
SpectralLines.prototype.getEnabled = function() {
    var result = [];
    for (var i = 0; i < this.lines.length; i++) {
        if (this.lines[i].enabled) {
            result.push(this.lines[i]);
        }
    }
    return result;
};
SpectralLines.prototype.getFromID = function(id) {
    for (var i = 0; i < this.lines.length; i++) {
        if (this.lines[i].id == id) {
            return this.lines[i];
        }
    }
    return null;
};
SpectralLines.prototype.getNext = function(id) {
    if (id == null) return null;
    for (var i = 0; i < this.lines.length; i++) {
        if (this.lines[i].id == id) {
            return this.lines[(i + 1) % this.lines.length].id;
        }
    }
    return null;
};
SpectralLines.prototype.getPrevious = function(id) {
    if (id == null) return null;
    for (var i = 0; i < this.lines.length; i++) {
        if (this.lines[i].id == id) {
            return this.lines[(i + this.lines.length - 1) % this.lines.length].id;
        }
    }
    return null;
};
SpectralLines.prototype.toggle = function(id) {
    for (var i = 0; i < this.lines.length; i++) {
        if (this.lines[i].id == id) {
            this.lines[i].enabled = !this.lines[i].enabled;
            return;
        }
    }
};


module.exports = function() {
    this.SpectralLines = SpectralLines;
};