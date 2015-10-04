var Timer = function () {

    this.start = function (label) {
        this._label = label;
        this._start = process.hrtime();
    };

    this.stopAndReport = function () {
        var time = process.hrtime(this._start);
        var ms = time[0]*1000 + time[1]/1e6;
        console.log(this._label + ':', ms, 'ms (cc', this._cc, ')')
    };

    this.clearCache = function () {
        var CC = 10000;
        var clearCache = new Array(CC);
        clearCache[0] = Math.random();
        for (i=1; i<CC; ++i)
        {
            clearCache[i] = clearCache[i-1] + Math.random();
        }

        this._cc = clearCache[Math.floor(Math.random() * CC)];
    }

    this.profile = function(label, f) {
        this.clearCache();
        this.start(label);
        f();
        this.stopAndReport();
    }
};

module.exports = Timer;
