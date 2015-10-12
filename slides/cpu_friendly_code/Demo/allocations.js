var Timer = require('./common/timer.js');

var TESTS = 100;
var N = 1000;

var timer = new Timer;

var SqrtCollector = function () {
    this.calc = function (n) {
        this.r = Math.sqrt(n);
    }
}

var s1 = 0;

timer.profile("no pool", function () {
    for (i=0; i<TESTS; ++i) {
        var ar = [];
        for (j=0; j<N; ++j) {
            var rc = new SqrtCollector;
            rc.calc(i+j);
            ar.push(rc);
        }

        for (j=0; j<N; ++j) {
            s1 += ar[i].r;
        }
    }
});

var s2 = 0;

timer.profile("pool", function () {
    var pool = new Array(N);
    for (i=0; i<N; ++i) {
        pool[i] = new SqrtCollector;
    }

    var pi = 0;

    for (i=0; i<TESTS; ++i) {
        var ar = [];
        for (j=0; j<N; ++j) {
            var rc = pool[pi];
            rc.calc(i+j);
            ar.push(rc);
            ++pi;
        }

        for (j=0; j<N; ++j) {
            s2 += ar[i].r;
        }

        pi = 0;
    }
});

console.log(s1);
console.log(s2);
