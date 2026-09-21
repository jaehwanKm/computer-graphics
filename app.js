"use strict";

const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl");

if (!gl) {
  document.getElementById("status").textContent = "이 브라우저는 WebGL을 지원하지 않습니다.";
  throw new Error("WebGL is not supported");
}

const vertexShaderSource = `
  attribute vec2 aPosition;
  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform vec4 uColor;
  void main() {
    gl_FragColor = uColor;
  }
`;

function createShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram() {
  const program = gl.createProgram();
  gl.attachShader(program, createShader(gl.VERTEX_SHADER, vertexShaderSource));
  gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragmentShaderSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
  }
  return program;
}

const program = createProgram();
const positionLocation = gl.getAttribLocation(program, "aPosition");
const colorLocation = gl.getUniformLocation(program, "uColor");
const positionBuffer = gl.createBuffer();
let vertexCount = 0;
let currentColor = [48 / 255, 213 / 255, 200 / 255, 1];

function addSquare(vertices, x, y, size) {
  const x2 = x + size;
  const y2 = y + size;
  vertices.push(x, y, x2, y, x, y2, x, y2, x2, y, x2, y2);
}

function subdivide(vertices, x, y, size, depth) {
  if (depth === 0) {
    addSquare(vertices, x, y, size);
    return;
  }

  const nextSize = size / 3;
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      if (row === 1 && col === 1) continue;
      subdivide(vertices, x + col * nextSize, y + row * nextSize, nextSize, depth - 1);
    }
  }
}

function buildGeometry(depth) {
  const vertices = [];
  subdivide(vertices, -0.9, -0.9, 1.8, depth);
  const data = new Float32Array(vertices);
  vertexCount = data.length / 2;
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  updateStats(depth);
}

function draw() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(5 / 255, 10 / 255, 14 / 255, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.uniform4fv(colorLocation, currentColor);
  gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
}

function updateStats(depth) {
  const squares = 8 ** depth;
  document.getElementById("squareCount").textContent = squares.toLocaleString();
  document.getElementById("triangleCount").textContent = (squares * 2).toLocaleString();
  document.getElementById("vertexCount").textContent = (squares * 6).toLocaleString();
}

function hexToRgba(hex) {
  return [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255).concat(1);
}

document.getElementById("depth").addEventListener("input", (event) => {
  const depth = Number(event.target.value);
  document.getElementById("depthValue").textContent = depth;
  buildGeometry(depth);
  draw();
});

document.getElementById("color").addEventListener("input", (event) => {
  currentColor = hexToRgba(event.target.value);
  document.getElementById("colorValue").textContent = event.target.value.toUpperCase();
  draw();
});

buildGeometry(3);
draw();
