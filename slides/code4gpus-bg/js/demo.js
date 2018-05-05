var WebGLDemo = (function() {
    var canvas = null;
    var gl = null;
    var requestAnimationFrameId = null;
    var prevFrameTime = 0;

    var state = {
        dt: 0,
    }

    var statePresetStack = [];

    function initializeGL() {
        gl = canvas.getContext('webgl');
        if (!gl) {
          alert('o_O : Unable to init WebGL!');
          return;
        }

        gl.clearColor(0.8, 1, 0.8, 1);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
        gl.frontFace(gl.CW);
    }

    function isAnimating() {
        return requestAnimationFrameId !== null;
    }

    function frame(now) {
        now *= 0.001; // to seconds

        state.dt = now - prevFrameTime;
        prevFrameTime = now;

        draw();

        requestAnimationFrameId = requestAnimationFrame(frame);
    }

    function draw() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    function pushStatePreset(name) {
        if (!isAnimating()) {
            // not in demo mode... so don't care about this
            return;
        }

        if (setStatePreset(name)) {
            statePresetStack.push(name);
        }
    }

    function popStatePreset(name) {
        if (!isAnimating()) {
            // not in demo mode... so don't care about this
            return;
        }

        if (statePresetStack.length > 0 && statePresetStack[statePresetStack.length - 1] === name) {
            statePresetStack.pop();
        } else {
            console.log('Unknown state:', name);
            return;
        }

        if (statePresetStack.length == 0) {
            // either popping something we don't seem to have here o_O
            // or popping the last thing
            // set empty state and hope for the best
            setStatePreset('empty');
        } else {
            // set the new top as current
            setStatePreset(statePresetStack[statePresetStack.length - 1]);
        }
    }

    function setStatePreset(name) {
        console.log('Setting preset to', name);
        return true;
    }

//////////////////////////
// Hooks
    function onNewSlide(slideChildren) {
        var holder = slideChildren.namedItem('webgl-canvas');
        if (holder) {
            if (canvas) {
                // move canvas to new position
                holder.appendChild(canvas);
            } else {
                // create canvas and gl context
                canvas = document.createElement('canvas');
                canvas.className = 'webgl';
                holder.appendChild(canvas);

                initializeGL();
            }

            // start or resume animation if it's not running
            if (!isAnimating()) {
                prevFrameTime = performance.now();
                requestAnimationFrameId = requestAnimationFrame(frame);
            }
        } else {
            // no canvas on this slide so stop animation (if we have it)
            if (isAnimating()) {
                cancelAnimationFrame(requestAnimationFrameId);
                requestAnimationFrameId = null;
            }
        }

        // in any case clear the state preset stack
        statePresetStack.length = 0;
    }

    function onNewFragment(fragment) {
        pushStatePreset(fragment.innerText);
    }

    function onFragmentHidden(fragment) {
        popStatePreset(fragment.innerText);
    }

    return {
        onNewSlide: onNewSlide,
        onNewFragment: onNewFragment,
        onFragmentHidden: onFragmentHidden,
    }
})();