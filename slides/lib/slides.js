'use strict';

let slides = {
    footerSetup(link, conf, ver) {
        let revealWrapper = document.querySelector( '.reveal' );
        let foot = document.createElement('div');
        foot.classList.add('footer');
        revealWrapper.appendChild(foot);

        let listener = function (event) {
            if (event.indexh != 0) {
                let index = String(event.indexh);
                if (event.indexv != 0) {
                    index += '-' + event.indexv;
                }
                foot.innerHTML = index + ' | ' + link + ' | ' + conf + ' | @stanimirovb';
            } else {
                ver = ver || '';
                foot.innerHTML = ver;
            }
        };

        Reveal.addEventListener('slidechanged', listener, false);
        Reveal.addEventListener('ready', listener, false);
    }
};
