var Timer = require('./common/timer.js');

function rand(d) {
    return Math.random() * d;
}

var timer = new Timer;

var TESTS = 10000;
var N = 1000;

var tests = new Array(TESTS);

for (i=0; i<TESTS; ++i) {
    var test = new Array(N);

    for (j=0; j<N; ++j) {
        test[j] = rand(10);
    }

    tests[i] = test;
}

var unsorted_sanity_check = 0;

timer.profile("unsorted", function () {
    for (i=0; i<TESTS; ++i) {
        var test = tests[i];

        for (j=0; j<N; ++j) {
            if (test[j] < 5) {
                unsorted_sanity_check += test[j];
            }
        }
    }
});

for (i=0; i<TESTS; ++i) {
    tests[i].sort();
}

var sorted_sanity_check = 0;

timer.profile("sorted", function () {
    for (i=0; i<TESTS; ++i) {
        var test = tests[i];

        for (j=0; j<N; ++j) {
            if (test[j] < 5) {
                sorted_sanity_check += test[j];
            }
        }
    }
});

console.log(unsorted_sanity_check);
console.log(sorted_sanity_check);