var Timer = require('./common/timer.js');

function rand(d) {
    return Math.random() * d;
}

var timer = new Timer;

var N = 100000;

var Point = function(x, y) {
    this.x = x;
    this.y = y;
}

var array = new Array(N)
var typed_array = new Float64Array(N*2)

for (i=0; i<N; ++i) {
    var x = rand(10);
    var y = rand(10);

    array[i] = new Point(x, y);
    typed_array[2*i] = x;
    typed_array[2*i+1] = y;
}

var array_max = 0;

timer.profile("arrays", function () {
    for (i=0; i<N; ++i) {
        var p = array[i];
        var md = p.x + p.y;
        if(md > array_max)
        {
            array_max = md;
        }
    }
});

var typed_array_max = 0;

timer.profile("typed_arrays", function () {
    for (i=0; i<N; ++i) {
        var md = typed_array[2*i] + typed_array[2*i+1];
        if(md > typed_array_max)
        {
            typed_array_max = md;
        }
    }
});

console.log(array_max);
console.log(typed_array_max);