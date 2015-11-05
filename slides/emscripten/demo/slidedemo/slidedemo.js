var Timer = function () {

    this.start = function () {
        this._start = Date.now(); //process.hrtime();
    };

    this.stop = function () {
        var time = Date.now() - this._start; //process.hrtime(this._start);
        //var ms = time[0]*1000 + time[1]/1e6;
        return time;
    };

    this.profile = function(f) {
        this.start();
        f();
        return this.stop();
    }
};

var cppFunc = Module.cwrap('slide_demo', 'number', ['number']);

var INPUT = 2000000;

function jsFunc(n) {
    var sieve = Array.apply(n+1);
    sieve[0] = true;
    sieve[1] = true;

    var sqrtmax = Math.sqrt(n);

    var sum = 0;

    for (var i=2; i<=sqrtmax; ++i) {
        if (sieve[i]) {
            continue;
        }

        for (var j=i*i; j<=n; j+=i) {
            sieve[j] = true;
        }
    }

    for (var i=0; i<n; ++i) {
        if (!sieve[i]) {
            sum += i;
        }
    }

    return sum;
}

function callJS() {
    var output = document.getElementById('output');

    var timer = new Timer;

    var result = 0;
    var time = timer.profile(function () {
        result = jsFunc(INPUT);
    });

    var resOutput = document.getElementById('js-output');
    resOutput.innerHTML = result;

    var timeOutput = document.getElementById('js-time');
    timeOutput.innerHTML = time;
}

function callCPP() {
    var output = document.getElementById('output');

    var timer = new Timer;

    var result = 0;
    var time = timer.profile(function () {
        result = cppFunc(INPUT);
    });

    var resOutput = document.getElementById('cpp-output');
    resOutput.innerHTML = result;

    var timeOutput = document.getElementById('cpp-time');
    timeOutput.innerHTML = time;
}