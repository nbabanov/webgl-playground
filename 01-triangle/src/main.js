'use strict';

// Canvas initialization
const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.appendChild(canvas);

// WebGL initialization
let gl = canvas.getContext('webgl');

if (!gl) {
    gl = canvas.getContext('experimental-webgl');
    console.warn('WebGL not supported, falling back to experimental!');
}

if (!gl) {
    alert('No WebGL support detected!');
}

// Shader initialization
const vertexShader = gl.createShader(gl.VERTEX_SHADER);
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);


let vertexShaderSource = null;
let fragmentShaderSource = null;

let shaderPromiseArray = [];

const vertexShaderPromise = HttpService.Get('src/shaders/VertexShader.glsl').then((data) => {
    vertexShaderSource = data;
}).catch((e) => {
    console.error(e);
});

const fragmentShaderPromse = HttpService.Get('src/shaders/FragmentShader.glsl').then((data) => {
    fragmentShaderSource = data;
}).catch((e) => {
    console.error(e);
});

shaderPromiseArray.push(vertexShaderPromise, fragmentShaderPromse);

Promise.all(shaderPromiseArray).then(draw).catch((e) => {
    console.error(e);
});

/**
 * Draws a triangle after the shaders have been
 * successfully loaded.
 *
 * @returns {boolean}
 */
function draw() {
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.shaderSource(fragmentShader, fragmentShaderSource);

    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
        return false;
    }

    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
        return false;
    }

    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('ERROR linking program!', gl.getProgramInfoLog(program));
        return false;
    }


    const meshVertices = [
        0.0, 0.5, 1, 1, 0,
        -0.5, -0.5, 0, 0, 0,
        0.5, -0.5, 1, 1, 1
    ];

    const meshBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, meshBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshVertices), gl.STATIC_DRAW);

    const positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    const colorAttribLocation = gl.getAttribLocation(program, 'vertColor');

    gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, gl.FALSE, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.vertexAttribPointer(colorAttribLocation, 3, gl.FLOAT, gl.FALSE, 5 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);

    gl.enableVertexAttribArray(positionAttribLocation);
    gl.enableVertexAttribArray(colorAttribLocation);

    gl.useProgram(program);

    gl.clearColor(1, 0.3, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
}