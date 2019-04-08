'use strict';

let slides = {
    footerSetup(link, conf) {
        let revealWrapper = document.querySelector( '.reveal' );
        let foot = document.createElement('div');
        foot.classList.add('footer');
        revealWrapper.appendChild(foot);

        Reveal.addEventListener('slidechanged', function (event) {
            if (event.indexh != 0) {
                foot.innerHTML = event.indexh + ' | ' + link + ' | ' + conf + ' | @stanimirovb';
            } else {
                foot.innerHTML = '';
            }
        }, false);
    }
};