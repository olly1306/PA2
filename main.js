'use strict';

let gl;                         // The webgl context.
let surface;                   // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

function deg2rad(angle) {
    return angle * Math.PI / 180;
}

// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.iTexCoordBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (data) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertices), gl.STREAM_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.texCoords), gl.STREAM_DRAW);

        this.count = data.vertices.length / 3;
    };

    this.NormalBufferData = function (normals) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STREAM_DRAW);

        this.count = normals.length / 3;
    };

    this.Draw = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexCoordBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexCoord);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count);
    };
}



// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    this.iAttribNormal = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;
    this.iNormalMatrix = -1;
    this.lightPosLoc = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const projection = m4.perspective(Math.PI / 8, 1, 8, 12);
    const modelView = spaceball.getViewMatrix();
    const rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    const translateToPointZero = m4.translation(0, 0, -10);

    const matAccum0 = m4.multiply(rotateToPointZero, modelView);
    const matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    const modelViewProjection = m4.multiply(projection, matAccum1);
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    const modelviewInv = new Float32Array(16);
    const normalmatrix = new Float32Array(16);
    mat4Invert(modelViewProjection, modelviewInv);
    mat4Transpose(modelviewInv, normalmatrix);
    gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, normalmatrix);

    // Динамічне положення світла
    const lightX = 5 * Math.cos(Date.now() * 0.001);
    const lightY = 5 * Math.sin(Date.now() * 0.001);
    const lightZ = 5; // Висота світла над поверхнею
    gl.uniform3fv(shProgram.lightPosLoc, [lightX, lightY, lightZ]);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, diffuseTexture);
    gl.uniform1i(shProgram.iDiffuseMap, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, specularTexture);
    gl.uniform1i(shProgram.iSpecularMap, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, normalTexture);
    gl.uniform1i(shProgram.iNormalMap, 2);

    surface.Draw();

    window.requestAnimationFrame(draw);
}


function drawing() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI / 8, 1, 8, 12);
    
    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    let modelviewInv = new Float32Array(16);
    let normalmatrix = new Float32Array(16);
    mat4Invert(modelViewProjection, modelviewInv);
    mat4Transpose(modelviewInv, normalmatrix);

    gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, normalmatrix);

    /* Draw the six faces of a cube, with different colors. */
    gl.uniform4fv(shProgram.iColor, [0.2, 0.8, 0, 1]);
    gl.uniform3fv(shProgram.lightPosLoc, [5 * Math.cos(Date.now() * 0.001), 5 * Math.sin(Date.now() * 0.001), 0]);
    surface.Draw();
    window.requestAnimationFrame(drawing)
}


// Змінні для гранулярності
let uGranularity = 72;
let vGranularity = 20;

// Функція для обробки зміни повзунків
function updateGranularity() {
    const uSlider = document.getElementById('uGranularity');
    const vSlider = document.getElementById('vGranularity');

    uGranularity = parseInt(uSlider.value);
    vGranularity = parseInt(vSlider.value);

    console.log(`U Granularity: ${uGranularity}, V Granularity: ${vGranularity}`);

    // Перегенеруємо поверхню
    surface.BufferData(CreateSurfaceData());
    surface.NormalBufferData(CreateSurfaceData(true));

    // Оновлюємо рендеринг
    console.log("Buffers updated");
    draw();
}



function CreateSurfaceData(norms = false) {
    let vertexList = [];
    let normalsList = [];
    let texCoordsList = [];

    const uStep = Math.PI * 2 / uGranularity;
    const vStep = Math.PI * 2 / vGranularity;

    for (let i = 0; i <= Math.PI * 2; i += uStep) {
        for (let j = 0; j <= Math.PI * 2; j += vStep) {
            let v1 = virich(i, j);
            let v2 = virich(i + uStep, j);
            let v3 = virich(i, j + vStep);
            let v4 = virich(i + uStep, j + vStep);

            // Один трикутник
            vertexList.push(v1.x, v1.y, v1.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v3.x, v3.y, v3.z);

            texCoordsList.push(i / (Math.PI * 2), j / (Math.PI * 2));
            texCoordsList.push((i + uStep) / (Math.PI * 2), j / (Math.PI * 2));
            texCoordsList.push(i / (Math.PI * 2), (j + vStep) / (Math.PI * 2));

            // Інший трикутник
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v4.x, v4.y, v4.z);
            vertexList.push(v3.x, v3.y, v3.z);

            texCoordsList.push((i + uStep) / (Math.PI * 2), j / (Math.PI * 2));
            texCoordsList.push((i + uStep) / (Math.PI * 2), (j + vStep) / (Math.PI * 2));
            texCoordsList.push(i / (Math.PI * 2), (j + vStep) / (Math.PI * 2));

            if (norms) {
                // Нормалі для кожного трикутника
                const n1 = calculateNormal(v1, v2, v3);
                normalsList.push(n1.x, n1.y, n1.z, n1.x, n1.y, n1.z, n1.x, n1.y, n1.z);

                const n2 = calculateNormal(v2, v4, v3);
                normalsList.push(n2.x, n2.y, n2.z, n2.x, n2.y, n2.z, n2.x, n2.y, n2.z);
            }
        }
    }

    return norms ? normalsList : texCoordsList.length ? { vertices: vertexList, texCoords: texCoordsList } : vertexList;
   
}


// Обчислення нормалей для трикутника
function calculateNormal(v1, v2, v3) {
    const v21 = { x: v2.x - v1.x, y: v2.y - v1.y, z: v2.z - v1.z };
    const v31 = { x: v3.x - v1.x, y: v3.y - v1.y, z: v3.z - v1.z };
    const normal = vec3Cross(v21, v31);
    vec3Normalize(normal);
    return normal;
}


document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('uGranularity').addEventListener('input', updateGranularity);
    document.getElementById('vGranularity').addEventListener('input', updateGranularity);
});




function virich(i, j) {
    let a = 1.5
    let b = 3
    let c = 2
    let d = 4
    let x = 0.05 * (f(a, b, j) * (1 + Math.cos(i) + (d ** 2 - c ** 2) * ((1 - Math.cos(i)) / f(a, b, j)))) * Math.cos(j)
    let y = 0.05 * (f(a, b, j) * (1 + Math.cos(i) + (d ** 2 - c ** 2) * ((1 - Math.cos(i)) / f(a, b, j)))) * Math.sin(j)
    let z = 0.05 * (f(a, b, j) - (d ** 2 - c ** 2) / f(a, b, j)) * Math.sin(i)
    return { x: x, y: y, z: z }
}
function f(a, b, j) {
    return ((a * b) / (Math.sqrt(a ** 2 * Math.sin(j) ** 2 + b ** 2 * Math.cos(j) ** 2)))
}

function vec3Cross(a, b) {
    let x = a.y * b.z - b.y * a.z;
    let y = a.z * b.x - b.z * a.x;
    let z = a.x * b.y - b.x * a.y;
    return { x: x, y: y, z: z }
}

function vec3Normalize(a) {
    var mag = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    a[0] /= mag; a[1] /= mag; a[2] /= mag;
}

/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iNormalMatrix = gl.getUniformLocation(prog, "NormalMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.lightPosLoc = gl.getUniformLocation(prog, "light");

    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData());
    surface.NormalBufferData(CreateSurfaceData(1));

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
// Texture variables
let diffuseTexture, specularTexture, normalTexture;

function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([255, 255, 255, 255]); // White pixel
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

    const image = new Image();
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

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

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

function initTextures() {
    diffuseTexture = loadTexture(gl, 'diffuse.jpg');
    specularTexture = loadTexture(gl, 'specular.jpg');
    normalTexture = loadTexture(gl, 'normal.jpg');
}

function createShaderProgram() {
    const vertexShaderSource = `
        attribute vec3 vertex;
        attribute vec3 normal;
        attribute vec2 texCoord;

        varying vec2 vTexCoord;
        varying vec3 vNormal;
        varying vec3 vPosition;

        uniform mat4 ModelViewProjectionMatrix;
        uniform mat4 NormalMatrix;

        void main() {
            gl_Position = ModelViewProjectionMatrix * vec4(vertex, 1.0);
            vTexCoord = texCoord;
            vNormal = normalize(mat3(NormalMatrix) * normal);
            vPosition = vec3(ModelViewProjectionMatrix * vec4(vertex, 1.0));
        }
    `;

    const fragmentShaderSource = `
        precision mediump float;

        varying vec2 vTexCoord;
        varying vec3 vNormal;
        varying vec3 vPosition;

        uniform sampler2D diffuseMap;
        uniform sampler2D specularMap;
        uniform sampler2D normalMap;

        uniform vec3 light;

        void main() {
            vec3 normal = texture2D(normalMap, vTexCoord).rgb * 2.0 - 1.0;
            vec3 lightDir = normalize(light - vPosition);

            // Diffuse
            vec3 diffuseColor = texture2D(diffuseMap, vTexCoord).rgb;
            float diffuse = max(dot(normal, lightDir), 0.0);

            // Specular
            vec3 viewDir = normalize(-vPosition);
            vec3 reflectDir = reflect(-lightDir, normal);
            vec3 specularColor = texture2D(specularMap, vTexCoord).rgb;
            float specular = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);

            vec3 color = diffuseColor * diffuse + specularColor * specular;
            gl_FragColor = vec4(color, 1.0);
        }
    `;

    const prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('TexturedShader', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iAttribTexCoord = gl.getAttribLocation(prog, "texCoord");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iNormalMatrix = gl.getUniformLocation(prog, "NormalMatrix");
    shProgram.iDiffuseMap = gl.getUniformLocation(prog, "diffuseMap");
    shProgram.iSpecularMap = gl.getUniformLocation(prog, "specularMap");
    shProgram.iNormalMap = gl.getUniformLocation(prog, "normalMap");
    shProgram.lightPosLoc = gl.getUniformLocation(prog, "light");

    // Передача ambient освітлення у шейдер
    const ambientLight = [0.6, 0.6, 0.6]; // Рівень базового освітлення
    const ambientLightLoc = gl.getUniformLocation(prog, "ambientLight");
    gl.uniform3fv(ambientLightLoc, ambientLight);

    const directionalLight = [0.5, 0.5, 1.0]; // Додаткове світло зверху і збоку
    const directionalLightLoc = gl.getUniformLocation(shProgram.prog, "directionalLight");
    gl.uniform3fv(directionalLightLoc, directionalLight);

    const constantLight = [0.3, 0.3, 0.3]; // Постійне освітлення, додається до всього
    const constantLightLoc = gl.getUniformLocation(shProgram.prog, "constantLight");
    gl.uniform3fv(constantLightLoc, constantLight);
}

function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const projection = m4.perspective(Math.PI / 8, 1, 8, 12);
    const modelView = spaceball.getViewMatrix();
    const rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    const translateToPointZero = m4.translation(0, 0, -10);

    const matAccum0 = m4.multiply(rotateToPointZero, modelView);
    const matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    const modelViewProjection = m4.multiply(projection, matAccum1);
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    // Динамічне оновлення положення світла
    const time = Date.now() * 0.001; // Час для анімації
    const lightX = 5 * Math.cos(time);
    const lightY = 5 * Math.sin(time);
    const lightZ = 5; // Фіксована висота
    gl.uniform3fv(shProgram.lightPosLoc, [lightX, lightY, lightZ]);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, diffuseTexture);
    gl.uniform1i(shProgram.iDiffuseMap, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, specularTexture);
    gl.uniform1i(shProgram.iSpecularMap, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, normalTexture);
    gl.uniform1i(shProgram.iNormalMap, 2);

    surface.Draw();

    window.requestAnimationFrame(draw);
}

function init() {
    const canvas = document.querySelector('canvas');
    const resolution = Math.min(window.innerHeight, window.innerWidth);
    canvas.width = resolution;
    canvas.height = resolution;
    gl = canvas.getContext("webgl");

    if (!gl) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }

    initTextures();
    createShaderProgram();

    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData());
    surface.NormalBufferData(CreateSurfaceData(true));

    spaceball = new TrackballRotator(canvas, draw, 0);

    window.requestAnimationFrame(draw);
}

function mat4Transpose(a, transposed) {
    var t = 0;
    for (var i = 0; i < 4; ++i) {
        for (var j = 0; j < 4; ++j) {
            transposed[t++] = a[j * 4 + i];
        }
    }
}

function mat4Invert(m, inverse) {
    var inv = new Float32Array(16);
    inv[0] = m[5] * m[10] * m[15] - m[5] * m[11] * m[14] - m[9] * m[6] * m[15] +
        m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
    inv[4] = -m[4] * m[10] * m[15] + m[4] * m[11] * m[14] + m[8] * m[6] * m[15] -
        m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
    inv[8] = m[4] * m[9] * m[15] - m[4] * m[11] * m[13] - m[8] * m[5] * m[15] +
        m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
    inv[12] = -m[4] * m[9] * m[14] + m[4] * m[10] * m[13] + m[8] * m[5] * m[14] -
        m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
    inv[1] = -m[1] * m[10] * m[15] + m[1] * m[11] * m[14] + m[9] * m[2] * m[15] -
        m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
    inv[5] = m[0] * m[10] * m[15] - m[0] * m[11] * m[14] - m[8] * m[2] * m[15] +
        m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
    inv[9] = -m[0] * m[9] * m[15] + m[0] * m[11] * m[13] + m[8] * m[1] * m[15] -
        m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
    inv[13] = m[0] * m[9] * m[14] - m[0] * m[10] * m[13] - m[8] * m[1] * m[14] +
        m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
    inv[2] = m[1] * m[6] * m[15] - m[1] * m[7] * m[14] - m[5] * m[2] * m[15] +
        m[5] * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
    inv[6] = -m[0] * m[6] * m[15] + m[0] * m[7] * m[14] + m[4] * m[2] * m[15] -
        m[4] * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
    inv[10] = m[0] * m[5] * m[15] - m[0] * m[7] * m[13] - m[4] * m[1] * m[15] +
        m[4] * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
    inv[14] = -m[0] * m[5] * m[14] + m[0] * m[6] * m[13] + m[4] * m[1] * m[14] -
        m[4] * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
    inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] -
        m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
    inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] +
        m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
    inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] -
        m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
    inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] +
        m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];

    var det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
    if (det == 0) return false;
    det = 1.0 / det;
    for (var i = 0; i < 16; i++) inverse[i] = inv[i] * det;
    return true;
}
