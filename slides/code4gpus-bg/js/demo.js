// jshint esversion: 6

var WebGLDemo = (function() {
    var canvas = null;
    var gl = null;
    var requestAnimationFrameId = null;
    var prevFrameTime = 0;
    var rotateAngle = 0;

    const Attribs = { Pos: 0, TC: 1, Normal: 2, Tangent: 3, Bitangent: 4 };
    const Uniforms = {
        Proj: 'uProj',
        View: 'uView',
        LightPos: 'uLightPos',
        Diffuse: 'uDiffuse',
        NormalMap: 'uNormalMap',
        Color: 'uColor',
        EyePos: 'uEyePos',
    };

    var data = {};

    var state = {
        dt: 0,
    };

    var statePresetStack = [];

    function initializeGL() {
        gl = canvas.getContext('webgl');
        if (!gl) {
          alert('o_O : Unable to init WebGL!');
          return;
        }

        //gl.clearColor(0.8, 1, 0.8, 1);
        gl.clearColor(1, 1, 1, 1);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
        gl.frontFace(gl.CW);

        data = {
            programs: {
                color: initColorProgram(),
                texture: initTextureProgram(),
                lambert: initTextureLambertProgram(),
                normalLambert: initLambertNormalMapProgram(),
                normalSpecular: initSpecularNormalMapProgram(),
            },
            textures: {
                test: loadTexture('media/tex-test.png'),
                granite: loadTexture('media/tex-granite-color.png'),
                graniteNormal: loadTexture('media/tex-granite-normal.png'),
                brocks: loadTexture('media/tex-bricks-color.jpg'),
                bricksNormal: loadTexture('media/tex-bricks-normal.jpg'),
            },
            meshes: {
                cube: makeCuboid(1, 1, 1),
                sphere: makeSphere(0.75, 14, 10),
                sphereNorm: makeSphereNorm(0.75, 14, 10),
            },
        };
    }

    function isDrawing() {
        return requestAnimationFrameId !== null;
    }

    function frame(now) {
        now *= 0.001; // to seconds

        state.dt = now - prevFrameTime;
        prevFrameTime = now;

        update();
        draw();

        requestAnimationFrameId = requestAnimationFrame(frame);
    }

    function update() {
        if (state.skipFrame) return;

        if (state.rotateCam || state.rotateLight) {
            rotateAngle += state.dt;
            if (rotateAngle > Math.PI * 2) {
                rotateAngle -= Math.PI * 2;
            }
        }

        if (!state.eye)
        {
            state.eye = [0, 0, 2];
        }

        if (state.rotateCam) {
            state.eye = [Math.sin(rotateAngle) * 2,
                0,
                Math.cos(rotateAngle) * 2];
        }

        if (state.rotateLight) {
            state.lightPos = [4 * Math.cos(rotateAngle), 2, 4 * Math.sin(rotateAngle)];
        }
    }

    function draw() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (state.skipFrame) return;

        gl.useProgram(state.program.id);

        {
            const fieldOfView = 45 * Math.PI / 180;
            const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
            const zNear = 0.1;
            const zFar = 100.0;
            const projectionMatrix = mat4.create();

            mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
            gl.uniformMatrix4fv(state.program.uniforms.proj, false, projectionMatrix);
        }

        {
            const cameraMatrix = mat4.create();
            mat4.lookAt(cameraMatrix, state.eye, [0, 0, 0], [0, 1, 0]);
            gl.uniformMatrix4fv(state.program.uniforms.view, false, cameraMatrix);

            gl.uniform3fv(state.program.uniforms.eyePos, state.eye);
        }

        {
            const stride = 14 * 4;

            gl.bindBuffer(gl.ARRAY_BUFFER, state.mesh.vb);

            gl.vertexAttribPointer(Attribs.Pos, 3, gl.FLOAT, false, stride, 0);
            gl.enableVertexAttribArray(Attribs.Pos);

            gl.vertexAttribPointer(Attribs.TC, 2, gl.FLOAT, false, stride, 3 * 4);
            gl.enableVertexAttribArray(Attribs.TC);

            gl.vertexAttribPointer(Attribs.Normal, 3, gl.FLOAT, false, stride, 5 * 4);
            gl.enableVertexAttribArray(Attribs.Normal);

            gl.vertexAttribPointer(Attribs.Tangent, 3, gl.FLOAT, false, stride, 8 * 4);
            gl.enableVertexAttribArray(Attribs.Tangent);

            gl.vertexAttribPointer(Attribs.Bitangent, 3, gl.FLOAT, false, stride, 11 * 4);
            gl.enableVertexAttribArray(Attribs.Bitangent);
        }

        if (state.lightPos) {
            gl.uniform3fv(state.program.uniforms.lightPos, state.lightPos);
        }

        if (state.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, state.texture);
            gl.uniform1i(state.program.uniforms.diffuse, 0);
        }

        if (state.normalMap) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, state.normalMap);
            gl.uniform1i(state.program.uniforms.normalMap, 1);
        }

        if (state.color) {
            gl.uniform4fv(state.program.uniforms.color, state.color);
        }

        if (state.wire) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.mesh.wire);
            gl.drawElements(gl.LINES, state.mesh.size * 2, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.mesh.ib);
            gl.drawElements(gl.TRIANGLES, state.mesh.size, gl.UNSIGNED_SHORT, 0);
        }
    }

    function pushStatePreset(name) {
        if (!isDrawing()) {
            // not in demo mode... so don't care about this
            return;
        }

        if (setStatePreset(name)) {
            statePresetStack.push(name);
        }
    }

    function popStatePreset(name) {
        if (!isDrawing()) {
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
        //console.log('Setting preset to', name);
        switch (name) {
            case 'colorCube':
                state = {
                    program: data.programs.color,
                    mesh: data.meshes.cube,
                    color: [0, 0.9, 0.3, 1],
                    rotateCam: false,
                };
                break;
            case 'rotateColorCube':
                state = {
                    program: data.programs.color,
                    mesh: data.meshes.cube,
                    color: [0, 0.9, 0.3, 1],
                    rotateCam: true,
                };
                break;
            case 'rotateWireCube':
                state = {
                    program: data.programs.color,
                    mesh: data.meshes.cube,
                    color: [0, 0.9, 0.3, 1],
                    rotateCam: true,
                    wire: true,
                };
                break;
            case 'rotateTextureCube':
                state = {
                    program: data.programs.texture,
                    texture: data.textures.test,
                    mesh: data.meshes.cube,
                    rotateCam: true,
                };
                break;
            case 'rotateLambertCube':
                state = {
                    program: data.programs.lambert,
                    texture: data.textures.test,
                    mesh: data.meshes.cube,
                    rotateCam: true,
                    lightPos: [4, 2, 7],
                };
                break;
            case 'rotateLambertNormSphere':
                state = {
                    program: data.programs.lambert,
                    texture: data.textures.test,
                    mesh: data.meshes.sphereNorm,
                    rotateCam: true,
                    lightPos: [4, 2, 7],
                };
                break;
            case 'rotateLambertNormWireSphere':
                state = {
                    program: data.programs.lambert,
                    texture: data.textures.test,
                    mesh: data.meshes.sphereNorm,
                    rotateCam: true,
                    lightPos: [4, 2, 7],
                    wire: true,
                };
                break;
            case 'rotateLambertSphere':
                state = {
                    program: data.programs.lambert,
                    texture: data.textures.test,
                    mesh: data.meshes.sphere,
                    rotateCam: true,
                    lightPos: [4, 2, 7],
                };
                break;
            case 'rotateLambertWireSphere':
                state = {
                    program: data.programs.lambert,
                    texture: data.textures.test,
                    mesh: data.meshes.sphere,
                    rotateCam: true,
                    lightPos: [4, 2, 7],
                    wire: true,
                };
                break;
            case 'rotateLambertGraniteCube':
                state = {
                    program: data.programs.lambert,
                    texture: data.textures.granite,
                    mesh: data.meshes.cube,
                    rotateCam: true,
                    lightPos: [4, 2, 7],
                };
                break;
            case 'angleLambertGraniteCube':
                state = {
                    program: data.programs.lambert,
                    texture: data.textures.granite,
                    mesh: data.meshes.cube,
                    eye: [Math.sin(0.51) * 2, 0, Math.cos(0.51) * 2],
                    lightPos: [4, 2, 7],
                };
                break;
            case 'angleNormalGraniteCube':
                state = {
                    program: data.programs.normalLambert,
                    texture: data.textures.granite,
                    normalMap: data.textures.graniteNormal,
                    mesh: data.meshes.cube,
                    eye: [Math.sin(0.51) * 2, 0, Math.cos(0.51) * 2],
                    lightPos: [4, 2, 7],
                };
                break;
            case 'rotateLightNormalGraniteCube':
                state = {
                    program: data.programs.normalLambert,
                    texture: data.textures.granite,
                    normalMap: data.textures.graniteNormal,
                    mesh: data.meshes.cube,
                    eye: [Math.sin(0.51) * 2, 0, Math.cos(0.51) * 2],
                    rotateLight: true,
                };
                break;
            case 'rotateLightGraniteCube':
                state = {
                    program: data.programs.lambert,
                    texture: data.textures.granite,
                    mesh: data.meshes.cube,
                    eye: [Math.sin(0.51) * 2, 0, Math.cos(0.51) * 2],
                    rotateLight: true,
                };
                break;
            case 'rotateLightNormalSpecularGraniteCube':
                state = {
                    program: data.programs.normalSpecular,
                    texture: data.textures.granite,
                    normalMap: data.textures.graniteNormal,
                    mesh: data.meshes.cube,
                    eye: [Math.sin(0.51) * 2, 0, Math.cos(0.51) * 2],
                    rotateLight: true,
                };
                break;
            case 'rotateLightNormalSpecularBrickCube':
                state = {
                    program: data.programs.normalSpecular,
                    texture: data.textures.bricks,
                    normalMap: data.textures.bricksNormal,
                    mesh: data.meshes.cube,
                    eye: [Math.sin(0.51) * 2, 0, Math.cos(0.51) * 2],
                    rotateLight: true,
                };
                break;
            case 'empty':
            default:
                state = { skipFrame: true };
        }
        return true;
    }

    function loadShader(type, src) {
        const shader = gl.createShader(type);

        gl.shaderSource(shader, src);

        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert('o_O : An error occurred compiling the shader: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    function initProgram(vssrc, fssrc) {
        const vs = loadShader(gl.VERTEX_SHADER, vssrc);
        const fs = loadShader(gl.FRAGMENT_SHADER, fssrc);

        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);

        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            alert('o_O : Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
            return null;
        }

        return prog;
    }

    function isPowerOf2(value) {
        return (value & (value - 1)) === 0;
    }

    function loadTexture(url) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Because images have to be download over the internet
        // they might take a moment until they are ready.
        // Until then put a single pixel in the texture so we can
        // use it immediately. When the image has finished downloading
        // we'll update the texture with the contents of the image.
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    width, height, border, srcFormat, srcType,
                    pixel);

        const image = new Image();
        image.onload = function() {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                        srcFormat, srcType, image);

            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
        };
        image.src = url;

        return texture;
    }

    function makeWire(tris) {
        let ret = [];
        for(let i=0; i<tris.length; i+=3) {
            const a = tris[i];
            const b = tris[i + 1];
            const c = tris[i + 2];

            ret.push(a, b, b, c, a, c);
        }

        return ret;
    }


    function initColorProgram() {
        const vssrc = `
        attribute vec4 aPos;

        uniform mat4 uView;
        uniform mat4 uProj;

        void main() {
            gl_Position = uProj * uView * aPos;
        }
        `;

        const fssrc = `
        uniform lowp vec4 uColor;

        void main() {
            gl_FragColor = uColor;
        }
        `;

        const p = initProgram(vssrc, fssrc);

        gl.bindAttribLocation(p, Attribs.Pos, 'aPos');

        return {
            id: p,
            uniforms: {
                proj: gl.getUniformLocation(p, Uniforms.Proj),
                view: gl.getUniformLocation(p, Uniforms.View),
                color: gl.getUniformLocation(p, Uniforms.Color),
            },
        };
    }

    function initTextureProgram() {
        const vssrc = `
        attribute vec4 aPos;
        attribute vec2 aTexCoord;

        uniform mat4 uView;
        uniform mat4 uProj;

        varying highp vec2 vTexCoord;

        void main() {
            vTexCoord = aTexCoord;
            gl_Position = uProj * uView * aPos;
        }
        `;

        const fssrc = `
        varying highp vec2 vTexCoord;

        uniform sampler2D uDiffuse;

        void main() {
            gl_FragColor = texture2D(uDiffuse, vTexCoord);
        }
        `;

        const p = initProgram(vssrc, fssrc);

        gl.bindAttribLocation(p, Attribs.Pos, 'aPos');
        gl.bindAttribLocation(p, Attribs.TC, 'aTexCoord');

        return {
            id: p,
            uniforms: {
                proj: gl.getUniformLocation(p, Uniforms.Proj),
                view: gl.getUniformLocation(p, Uniforms.View),
                diffuse: gl.getUniformLocation(p, Uniforms.Diffuse),
            },
        };
    }

    function initTextureLambertProgram() {
        const vssrc = `
        attribute vec4 aPos;
        attribute vec2 aTexCoord;
        attribute vec3 aNormal;

        uniform mat4 uView;
        uniform mat4 uProj;
        uniform vec3 uLightPos;

        varying highp vec2 vTexCoord;
        varying vec3 vNormal;
        varying vec3 vLightDir;

        void main() {
            vTexCoord = aTexCoord;
            vNormal = aNormal;
            vLightDir = uLightPos - aPos.xyz;
            gl_Position = uProj * uView * aPos;
        }
        `;

        const fssrc = `
        precision mediump float;
        varying highp vec2 vTexCoord;
        varying vec3 vNormal;
        varying vec3 vLightDir;

        uniform sampler2D uDiffuse;

        #define saturate(f) clamp(f, 0.0, 1.0)

        void main() {
            float shade = dot(normalize(vNormal), normalize(vLightDir));
            shade = saturate(shade);

            vec4 color = texture2D(uDiffuse, vTexCoord);
            gl_FragColor = vec4(color.xyz * saturate(shade + 0.1), 1);
        }
        `;

        const p = initProgram(vssrc, fssrc);

        gl.bindAttribLocation(p, Attribs.Pos, 'aPos');
        gl.bindAttribLocation(p, Attribs.TC, 'aTexCoord');
        gl.bindAttribLocation(p, Attribs.Normal, 'aNormal');

        return {
        id: p,
        uniforms: {
            proj: gl.getUniformLocation(p, Uniforms.Proj),
            view: gl.getUniformLocation(p, Uniforms.View),
            diffuse: gl.getUniformLocation(p, Uniforms.Diffuse),
            lightPos: gl.getUniformLocation(p, Uniforms.LightPos),
        },
        };
    }

    function initLambertNormalMapProgram() {
        const vssrc = `
        uniform mat4 uView;
        uniform mat4 uProj;
        uniform vec3 uLightPos;

        attribute vec4 aPos;
        attribute vec2 aTexCoord;
        attribute vec3 aNormal;
        attribute vec3 aTangent;
        attribute vec3 aBitangent;

        varying vec2 vTexCoord;
        varying vec3 vSSLightDir; // SS = surface space

        void main()
        {
            gl_Position = uProj * uView * aPos;
            vTexCoord = aTexCoord;

            //vec3 bitangent = cross(aNormal, aTangent);

            mat3 tbn = mat3(
                -aTangent,
                -aBitangent,
                aNormal);

            vec3 lightDir = uLightPos - aPos.xyz;
            vSSLightDir = lightDir * tbn; // note the "inverted" transform
        }
        `;

        const fssrc = `
        precision mediump float;

        varying highp vec2 vTexCoord;
        varying vec3 vSSLightDir; // SS = surface space

        uniform sampler2D uDiffuse;
        uniform sampler2D uNormalMap;

        #define saturate(f) clamp(f, 0.0, 1.0)

        void main(void)
        {
            // ss = surface space
            vec3 ssNormal = normalize(2.0 * texture2D(uNormalMap, vTexCoord).xyz - 1.0);
            float shade = dot(ssNormal, normalize(vSSLightDir));

            vec4 color = texture2D(uDiffuse, vTexCoord);
            gl_FragColor = vec4(color.xyz * saturate(shade + 0.1), 1.0);
        }
        `;

        const p = initProgram(vssrc, fssrc);

        gl.bindAttribLocation(p, Attribs.Pos, 'aPos');
        gl.bindAttribLocation(p, Attribs.TC, 'aTexCoord');
        gl.bindAttribLocation(p, Attribs.Normal, 'aNormal');
        gl.bindAttribLocation(p, Attribs.Tangent, 'aTangent');
        gl.bindAttribLocation(p, Attribs.Bitangent, 'aBitangent');

        return {
            id: p,
            uniforms: {
                proj: gl.getUniformLocation(p, Uniforms.Proj),
                view: gl.getUniformLocation(p, Uniforms.View),
                diffuse: gl.getUniformLocation(p, Uniforms.Diffuse),
                normalMap: gl.getUniformLocation(p, Uniforms.NormalMap),
                lightPos: gl.getUniformLocation(p, Uniforms.LightPos),
            },
        };
    }

    function initSpecularNormalMapProgram() {
        const vssrc = `
        uniform mat4 uView;
        uniform mat4 uProj;
        uniform vec3 uLightPos;
        uniform vec3 uEyePos;

        attribute vec4 aPos;
        attribute vec2 aTexCoord;
        attribute vec3 aNormal;
        attribute vec3 aTangent;
        attribute vec3 aBitangent;

        varying vec2 vTexCoord;
        varying vec3 vSSLightDir; // SS = surface space
        varying vec3 vSSEyeDir;

        void main()
        {
            gl_Position = uProj * uView * aPos;
            vTexCoord = aTexCoord;

            //vec3 bitangent = cross(aNormal, aTangent);

            mat3 tbn = mat3(
                -aTangent,
                -aBitangent,
                aNormal);

            vec3 lightDir = uLightPos - aPos.xyz;
            vSSLightDir = lightDir * tbn; // note the "inverted" transform

            vec3 eyeDir = uEyePos - aPos.xyz;
            vSSEyeDir = eyeDir * tbn;
        }
        `;

        const fssrc = `
        precision mediump float;

        varying highp vec2 vTexCoord;
        varying vec3 vSSLightDir; // SS = surface space
        varying vec3 vSSEyeDir;

        uniform sampler2D uDiffuse;
        uniform sampler2D uNormalMap;

        #define saturate(f) clamp(f, 0.0, 1.0)

        void main(void)
        {
            // ss = surface space
            vec3 ssNormal = normalize(2.0 * texture2D(uNormalMap, vTexCoord).xyz - 1.0);
            vec3 eyeDir = -normalize(vSSEyeDir);
            vec3 lightDir = normalize(vSSLightDir);

            vec3 reflection = reflect(lightDir, ssNormal);
            float specular = pow(max(0.0, dot(reflection, eyeDir)), 25.0);

            float shade = dot(ssNormal, lightDir);

            vec4 color = texture2D(uDiffuse, vTexCoord);
            gl_FragColor = vec4(color.xyz * saturate(shade + 0.1) + specular, 1.0);
        }
        `;

        const p = initProgram(vssrc, fssrc);

        gl.bindAttribLocation(p, Attribs.Pos, 'aPos');
        gl.bindAttribLocation(p, Attribs.TC, 'aTexCoord');
        gl.bindAttribLocation(p, Attribs.Normal, 'aNormal');
        gl.bindAttribLocation(p, Attribs.Tangent, 'aTangent');
        gl.bindAttribLocation(p, Attribs.Bitangent, 'aBitangent');

        return {
            id: p,
            uniforms: {
                proj: gl.getUniformLocation(p, Uniforms.Proj),
                view: gl.getUniformLocation(p, Uniforms.View),
                diffuse: gl.getUniformLocation(p, Uniforms.Diffuse),
                normalMap: gl.getUniformLocation(p, Uniforms.NormalMap),
                lightPos: gl.getUniformLocation(p, Uniforms.LightPos),
                eyePos: gl.getUniformLocation(p, Uniforms.EyePos),
            },
        };
    }

    function makeMesh(vertices, indices) {
        const vbuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(vertices),
        gl.STATIC_DRAW);

        const ibuf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(indices),
        gl.STATIC_DRAW);

        const wbuf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wbuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(makeWire(indices)),
        gl.STATIC_DRAW);

        return {
            vb: vbuf,
            ib: ibuf,
            size: indices.length,
            wire: wbuf
        };
    }

    function makeCuboid(sx, sy, sz) {
        const UNIT_X = [1, 0, 0];
        const UNIT_Y = [0, 1, 0];
        const UNIT_Z = [0, 0, 1];
        const NUNIT_X = [-1, 0, 0];
        const NUNIT_Y = [0, -1, 0];
        const NUNIT_Z = [0, 0, -1];

        const x = sx / 2;
        const y = sy / 2;
        const z = sz / 2;

        vertices =
        [
            // top
            -x, y, z,   0, 0, ...UNIT_Y, ...UNIT_X, ...NUNIT_Z,
            -x, y, -z,  0, 1, ...UNIT_Y, ...UNIT_X, ...NUNIT_Z,
            x, y, -z,   1, 1, ...UNIT_Y, ...UNIT_X, ...NUNIT_Z,
            x, y, z,    1, 0, ...UNIT_Y, ...UNIT_X, ...NUNIT_Z,

            // bottom
            -x, -y, z,  0, 0, ...NUNIT_Y, ...UNIT_X, ...UNIT_Z,
            -x, -y, -z, 0, 1, ...NUNIT_Y, ...UNIT_X, ...UNIT_Z,
            x, -y, -z,  1, 1, ...NUNIT_Y, ...UNIT_X, ...UNIT_Z,
            x, -y, z,   1, 0, ...NUNIT_Y, ...UNIT_X, ...UNIT_Z,

            // back
            -x, y, z,   0, 0, ...UNIT_Z, ...UNIT_X, ...UNIT_Y,
            x, y, z,    1, 0, ...UNIT_Z, ...UNIT_X, ...UNIT_Y,
            x, -y, z,   1, 1, ...UNIT_Z, ...UNIT_X, ...UNIT_Y,
            -x, -y, z,  0, 1, ...UNIT_Z, ...UNIT_X, ...UNIT_Y,

            // front
            -x, y, -z,  0, 0, ...NUNIT_Z, ...UNIT_X, ...NUNIT_Y,
            x, y, -z,   1, 0, ...NUNIT_Z, ...UNIT_X, ...NUNIT_Y,
            x, -y, -z,  1, 1, ...NUNIT_Z, ...UNIT_X, ...NUNIT_Y,
            -x, -y, -z, 0, 1, ...NUNIT_Z, ...UNIT_X, ...NUNIT_Y,

            // left
            -x, y, -z,  1, 0, ...NUNIT_X, ...NUNIT_Z, ...UNIT_Y,
            -x, y, z,   0, 0, ...NUNIT_X, ...NUNIT_Z, ...UNIT_Y,
            -x, -y, z,  0, 1, ...NUNIT_X, ...NUNIT_Z, ...UNIT_Y,
            -x, -y, -z, 1, 1, ...NUNIT_X, ...NUNIT_Z, ...UNIT_Y,

            // right
            x, y, -z,   0, 0, ...UNIT_X, ...NUNIT_Z, ...UNIT_Y,
            x, y, z,    1, 0, ...UNIT_X, ...NUNIT_Z, ...UNIT_Y,
            x, -y, z,   1, 1, ...UNIT_X, ...NUNIT_Z, ...UNIT_Y,
            x, -y, -z,  0, 1, ...UNIT_X, ...NUNIT_Z, ...UNIT_Y,
        ];

        indices = [
            0, 1, 2, 0, 2, 3, // top
            4, 6, 5, 6, 4, 7, // bottom
            8, 9, 10, 8, 10, 11, // front
            13, 12, 14, 14, 12, 15, // back
            16, 17, 18, 16, 18, 19, // left
            21, 20, 22, 22, 20, 23, // right
        ];

        return makeMesh(vertices, indices);
    }

    function makeSphere(radius, slices, stacks) {
        let vertices = [];
        let indices = [];

        for (let i = 0; i<stacks; ++i)
        {
            heightPhi = Math.PI * (i / (stacks - 1) - 0.5);
            const y = Math.sin(heightPhi);

            const heightP = Math.cos(heightPhi);

            for (let j = 0; j<slices; ++j)
            {
                const radiusPhi = 2 * Math.PI * j / (slices - 1);

                const ny = y;
                const nx = Math.cos(radiusPhi) * heightP;
                const nz = Math.sin(radiusPhi) * heightP;

                const px = nx * radius;
                const py = ny * radius;
                const pz = nz * radius;

                vertices.push(px, py, pz, 0, 0, nx, ny, nz, 0, 0, 0, 0, 0, 0);

                if (j !== slices - 1 && i !== stacks - 1)
                {
                    indices.push(i * slices + j);
                    indices.push(i * slices + j + 1);
                    indices.push((i + 1) * slices + j);

                    indices.push(i * slices + j + 1);
                    indices.push((i + 1) * slices + j + 1);
                    indices.push((i + 1) * slices + j);
                }
            }
        }
        return makeMesh(vertices, indices);
    }

    function makeSphereNorm(radius, slices, stacks) {
        let vertices = [];
        let indices = [];
        let index = 0;

        for (let i = 0; i<stacks - 1; ++i)
        {
            heightPhi = Math.PI * (i / (stacks - 1) - 0.5);
            heightPhi1 = Math.PI * ((i + 1) / (stacks - 1) - 0.5);
            const y = Math.sin(heightPhi);
            const y1 = Math.sin(heightPhi1);

            const heightP = Math.cos(heightPhi);
            const heightP1 = Math.cos(heightPhi1);

            for (let j = 0; j<slices - 1; ++j)
            {
                const radiusPhi = 2 * Math.PI * j / (slices - 1);
                const radiusPhi1 = 2 * Math.PI * (j + 1) / (slices - 1);

                const n00 = [y, Math.cos(radiusPhi) * heightP, Math.sin(radiusPhi) * heightP];
                const n10 = [y, Math.cos(radiusPhi1) * heightP, Math.sin(radiusPhi1) * heightP];
                const n01 = [y1, Math.cos(radiusPhi) * heightP1, Math.sin(radiusPhi) * heightP1];
                const n11 = [y1, Math.cos(radiusPhi1) * heightP1, Math.sin(radiusPhi1) * heightP1];

                const p00 = n00.map(c => c * radius);
                const p10 = n10.map(c => c * radius);
                const p01 = n01.map(c => c * radius);
                const p11 = n11.map(c => c * radius);

                let v1 = [];
                let v3 = [];
                vec3.subtract(v1, p01, p00);
                vec3.subtract(v3, p00, p11);

                let n1 = [];
                vec3.cross(n1, v1, v3);

                vertices.push(p00[0], p00[1], p00[2], 0, 0, n1[0], n1[1], n1[2], 0, 0, 0, 0, 0, 0);
                vertices.push(p01[0], p01[1], p01[2], 0, 0, n1[0], n1[1], n1[2], 0, 0, 0, 0, 0, 0);
                vertices.push(p10[0], p10[1], p10[2], 0, 0, n1[0], n1[1], n1[2], 0, 0, 0, 0, 0, 0);
                vertices.push(p11[0], p11[1], p11[2], 0, 0, n1[0], n1[1], n1[2], 0, 0, 0, 0, 0, 0);

                indices.push(index, index + 1, index + 3, index, index + 3, index + 2);
                index += 4;
            }
        }
        return makeMesh(vertices, indices);
    }


//////////////////////////
// Hooks
    function onNewSlide(slideChildren) {
        let holder = slideChildren.namedItem('webgl-canvas');
        if (holder) {
            if (canvas) {
                // move canvas to new position
                holder.appendChild(canvas);
            } else {
                // create canvas and gl context
                canvas = document.createElement('canvas');
                canvas.setAttribute('width', 1200);
                canvas.setAttribute('height', 768);
                canvas.className = 'webgl';
                holder.appendChild(canvas);

                initializeGL();
            }

            // start or resume animation if it's not running
            if (!isDrawing()) {
                prevFrameTime = performance.now();
                requestAnimationFrameId = requestAnimationFrame(frame);
            }
        } else {
            // no canvas on this slide so stop animation (if we have it)
            if (isDrawing()) {
                cancelAnimationFrame(requestAnimationFrameId);
                requestAnimationFrameId = null;
            }
        }

        // in any case clear the state preset stack
        //statePresetStack.length = 0;
        setStatePreset('empty');
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