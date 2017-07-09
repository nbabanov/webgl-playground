'use strict';

const BACKGROUND_COLOR = [0.9, 0.9, 0.9, 1];

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
        // Top
        -1.0, 1.0, -1.0,   0.83, 0.3, 0.0,
        -1.0, 1.0, 1.0,    0.83, 0.3, 0.0,
        1.0, 1.0, 1.0,     0.83, 0.3, 0.0,
        1.0, 1.0, -1.0,    0.83, 0.3, 0.0,

        // Left
        -1.0, 1.0, 1.0,    0.15, 0.25, 0.5,
        -1.0, -1.0, 1.0,   0.15, 0.35, 0.5,
        -1.0, -1.0, -1.0,  0.15, 0.45, 0.5,
        -1.0, 1.0, -1.0,   0.15, 0.55, 0.5,

        // Right
        1.0, 1.0, 1.0,    0.25, 0.25, 0.75,
        1.0, -1.0, 1.0,   0.25, 0.25, 0.75,
        1.0, -1.0, -1.0,  0.25, 0.25, 0.75,
        1.0, 1.0, -1.0,   0.25, 0.25, 0.75,

        // Front
        1.0, 1.0, 1.0,    0.0, 0.83, 0.75,
        1.0, -1.0, 1.0,    0.0, 0.83, 0.75,
        -1.0, -1.0, 1.0,    0.0, 0.83, 0.35,
        -1.0, 1.0, 1.0,    0.3, 0.83, 0.85,

        // Back
        1.0, 1.0, -1.0,    0.25, 0.85, 0.15,
        1.0, -1.0, -1.0,    0.35, 0.85, 0.15,
        -1.0, -1.0, -1.0,    0.45, 0.85, 0.15,
        -1.0, 1.0, -1.0,    0.55, 0.85, 0.15,

        // Bottom
        -1.0, -1.0, -1.0,   0.93, 0.1, 0.0,
        -1.0, -1.0, 1.0,    0.93, 0.1, 0.0,
        1.0, -1.0, 1.0,     0.83, 0.3, 0.0,
        1.0, -1.0, -1.0,    0.83, 0.3, 0.0
    ];

    const meshIndices = [
        // Top
        0, 1, 2,
        0, 2, 3,

        // Left
        5, 4, 6,
        6, 4, 7,

        // Right
        8, 9, 10,
        8, 10, 11,

        // Front
        13, 12, 14,
        15, 14, 12,

        // Back
        16, 17, 18,
        16, 18, 19,

        // Bottom
        21, 20, 22,
        22, 20, 23
    ];

    const meshBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, meshBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshVertices), gl.STATIC_DRAW);

    const meshIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(meshIndices), gl.STATIC_DRAW);

    const positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    const colorAttribLocation = gl.getAttribLocation(program, 'vertColor');

    gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, gl.FALSE, 6 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.vertexAttribPointer(colorAttribLocation, 3, gl.FLOAT, gl.FALSE, 6 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);

    gl.enableVertexAttribArray(positionAttribLocation);
    gl.enableVertexAttribArray(colorAttribLocation);

    gl.useProgram(program);

    let worldMatrix = new Float32Array(16);
    let viewMatrix = new Float32Array(16);
    let projectionMatrix = new Float32Array(16);
    let identityMatrix = new Float32Array(16);

    mat4.identity(worldMatrix);
    mat4.identity(identityMatrix);
    mat4.lookAt(viewMatrix, [0, 0, -8], [0, 0, 0], [0, 1, 0]);
    mat4.perspective(projectionMatrix, glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000);

    const mWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
    const mViewUniformLocation = gl.getUniformLocation(program, 'mView');
    const mProjUniformLocation = gl.getUniformLocation(program, 'mProj');

    gl.uniformMatrix4fv(mWorldUniformLocation, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(mViewUniformLocation, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(mProjUniformLocation, gl.FALSE, projectionMatrix);

    gl.clearColor(...BACKGROUND_COLOR);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    let angle = 0;

    drawLoop(angle, worldMatrix, identityMatrix, mWorldUniformLocation, meshIndices);
}

function drawLoop(angle, worldMatrix, identityMatrix, mWorldUniformLocation, meshIndices) {
    angle = performance.now() / 1000 / 6 * 2 * Math.PI;
    mat4.rotate(worldMatrix, identityMatrix, angle, [0, 1, 0.5]);
    gl.uniformMatrix4fv(mWorldUniformLocation, gl.FALSE, worldMatrix);

    gl.clearColor(...BACKGROUND_COLOR);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, meshIndices.length, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(drawLoop.bind(this, angle, worldMatrix, identityMatrix, mWorldUniformLocation, meshIndices));
}