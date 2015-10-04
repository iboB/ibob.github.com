var Timer = require('./common/timer.js');

function irand() {
    return Math.floor(Math.random() * 32000);
}

var timer = new Timer;

var TESTS = 10000;
var N = 22;

var array_tests = new Array(N);
var typed_array_tests = new Array(N);
var table_tests = new Array(N);

var search_terms = new Array(N);


for (i=0; i<TESTS; ++i) {
    var array = new Array(N);
    var typed_array = new Uint32Array(N);
    var table = {};

    for (j = 0; j < N; ++j) {
        var r = irand();
        array[j] = r;
        typed_array[j] = r;
        if(table[r]) {
            table[r].push(j);
        } else {
            table[r] = [j];
        }
    }

    search_terms[i] = array[irand() % N];

    array_tests[i] = array;
    typed_array_tests[i] = typed_array;
    table_tests[i] = table;
}

var table_sanity_check = 0;

timer.profile("tables", function () {
    for (i=0; i<TESTS; ++i) {
        var s = search_terms[i];
        var t = table_tests[i][s];

        if (t) {
            for (j=0; j<t.length; ++j) {
                table_sanity_check += t[j];
            }
        }
    }
});

var array_sanity_check = 0;

timer.profile("arrays", function () {
    for (i=0; i<TESTS; ++i) {
        var s = search_terms[i];
        var a = array_tests[i];

        for (j=0; j<a.length; ++j) {
            if (s == a[j]) {
                array_sanity_check += j;
            }
        }
    }
});

var typed_array_sanity_check = 0;

timer.profile("typed_arrays", function () {
    for (i=0; i<TESTS; ++i) {
        var s = search_terms[i];
        var a = typed_array_tests[i];

        for (j=0; j<a.length; ++j) {
            if (s == a[j]) {
                typed_array_sanity_check += j;
            }
        }
    }
});

console.log(table_sanity_check);
console.log(array_sanity_check);
console.log(typed_array_sanity_check);