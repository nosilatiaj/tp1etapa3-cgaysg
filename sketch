const RATIO = 2000 / 2851;


const paletas = [
  { fondo: [35,55,90]  },
  { fondo: [55,75,110] },
  { fondo: [20,40,70]  },
];


let capasFijas = [];
let capasMoviles = [];
let capasVisibles = 0;
let totalCapas = 0;
let timer = 0;
let paletaIdx = 0;
let escalaExtra = 0;
let estado = 0;


let cx, cy, cvx, cvy, cw, ch;
let centralMoviendo = false;


function preload() {
  capasFijas = [
    loadImage('data/fondo (1).png'),
    loadImage('data/costados.png'),
    loadImage('data/esquinaA.png'),
    loadImage('data/esquinaB.png'),
    loadImage('data/esquinaC.png'),
    loadImage('data/esquinaD.png'),
  ];
  capasMoviles = [
    loadImage('data/cuadradoA.png'),
    loadImage('data/cuadradoB.png'),
    loadImage('data/cuadradoC.png'),
    loadImage('data/cuadradoD.png'),
    loadImage('data/AzulFondo.png'),
    loadImage('data/AmarilloA.png'),
    loadImage('data/AmarilloB.png'),
    loadImage('data/AmarilloC.png'),
    loadImage('data/AmarilloD.png'),
    loadImage('data/Marron.png'),
    loadImage('data/CirculoA.png'),
    loadImage('data/CirculoB.png'),
    loadImage('data/CirculoFondo.png'),
  ];
  totalCapas = capasFijas.length + capasMoviles.length;
}


function setup() {
  let h = min(windowHeight, 750);
  let w = min(floor(h * RATIO), windowWidth);
  let cnv = createCanvas(w, h);
  cnv.elt.setAttribute('tabindex', '0');
  cnv.elt.focus();
  iniciarCentral();
}


function iniciarCentral() {
  cw = width;
  ch = height;
  cx = width / 2;
  cy = height / 2;
  cvx = random(0.8, 1.5) * (random() > 0.5 ? 1 : -1);
  cvy = random(0.8, 1.5) * (random() > 0.5 ? 1 : -1);
}


function draw() {
  let p = paletas[paletaIdx];
  background(p.fondo[0], p.fondo[1], p.fondo[2]);


  let fijasMostrar  = min(capasVisibles, capasFijas.length);
  let movilesMostrar = max(0, capasVisibles - capasFijas.length);


  // capas fijas: siempre en (0,0), tamaño original
  for (let i = 0; i < fijasMostrar; i++) {
    image(capasFijas[i], 0, 0, width, height);
  }


  // capas móviles: posición y tamaño afectados por escala
  for (let i = 0; i < movilesMostrar; i++) {
    image(capasMoviles[i], cx - cw/2, cy - ch/2, cw, ch);
  }


  if (estado === 1 && capasVisibles < totalCapas) {
    timer++;
    if (timer > 45) { capasVisibles++; timer = 0; }
  }


  if (centralMoviendo) {
    cx += cvx;  cy += cvy;
    if (cx < cw/2 || cx > width  - cw/2) cvx *= -1;
    if (cy < ch/2 || cy > height - ch/2) cvy *= -1;
  }
}


function keyPressed() {
  if (key === '1' || keyCode === ENTER || keyCode === 32) {
    if (estado === 0) { estado = 1; capasVisibles = 1; }
  }
  if (key === '2') {
    paletaIdx = (paletaIdx + 1) % paletas.length;
  }
  if (key === '3') {
    escalaExtra = min(escalaExtra + 1, 4);
    cw = width  * (1 + escalaExtra * 0.04);
    ch = height * (1 + escalaExtra * 0.04);
  }
  if (key === '4') {
    escalaExtra = max(escalaExtra - 1, -3);
    cw = width  * (1 + escalaExtra * 0.04);
    ch = height * (1 + escalaExtra * 0.04);
    cx = lerp(cx, width / 2, 0.3);
    cy = lerp(cy, height / 2, 0.3);
  }
  if (key === '5') {
    centralMoviendo = !centralMoviendo;
  }
  if (key === 'r' || key === 'R') {
    estado = 0;
    capasVisibles = 0;
    centralMoviendo = false;
    paletaIdx = 0;
    escalaExtra = 0;
    timer = 0;
    iniciarCentral();
  }
  return false;
}


function windowResized() {
  let h = min(windowHeight, 750);
  let w = min(floor(h * RATIO), windowWidth);
  resizeCanvas(w, h);
  iniciarCentral();
}

