var WebGLDemo = (function() {
    var canvas = null;

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
            }
        }
    }

    function onNewFragment(fragment) {
        console.log('On new fragment:', fragment.innerText);
    }

    function onFragmentHidden(fragment) {
        console.log('On hidden:', fragment.innerText);
    }

    return {
        onNewSlide: onNewSlide,
        onNewFragment: onNewFragment,
        onFragmentHidden: onFragmentHidden,
    }
})();