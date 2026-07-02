const RATIO = 2000 / 2851;

let imgFondo, imgCostados;
let imgEsquinas  = [];
let imgFondoAzul, imgFondoMarron;
let imgCuadrados = [];
let imgAmarillos = [];
let imgCirculoAzul;

const ALPHA_CIRCULO = Math.round(255 * 0.65);

// Audio
const AMP_MIN                   = 0.001;
const AMP_MAX                   = 0.13;
const UMBRAL_SONIDO             = 0.08;
const UMBRAL_GRAVE              = 0.32;
const UMBRAL_LARGO              = 380;  // era 600, reducido para respuesta más inmediata
const UMBRAL_DERIVADA_CHASQUIDO = 0.65;

let mic, gestorAmp;
let audioIniciado    = false;
let intensidad       = 0;
let derivadaActual   = 0;
let haySonido        = false;
let antesHabiaSonido = false;
let marcaInicio      = 0;
let durSonido        = 0;
let derivadaPico     = 0;
let estadoActual     = 'ESTADO INICIAL';

// ---------------------------------------------------------------------
// Paleta base: siempre saturada y de alto contraste. Es la que se usa
// para el estado "grave". El estado "suave" NUNCA elige una familia de
// color distinta: parte de la paleta activa (o de esta base si todavía
// no hubo ninguna) y genera versiones suavizadas (menos saturación,
// más brillo) de esos mismos colores, para mantener siempre coherencia
// cromática con la obra.
// ---------------------------------------------------------------------
const paletasGraves = [
  [ [180,20,20],  [20,100,40],  [20,20,150], [150,80,0],  [0,120,120]  ],
  [ [140,0,80],   [0,80,140],   [80,140,0],  [140,60,0],  [0,60,140]   ],
  [ [200,50,0],   [0,50,200],   [100,0,150], [0,150,100], [150,100,0]  ],
  [ [80,0,0],     [0,80,0],     [0,0,120],   [80,60,0],   [0,60,80]    ],
  [ [220,80,0],   [0,80,220],   [160,0,100], [0,160,80],  [80,0,160]   ],
];

// Paleta de referencia por si el estado "suave" se activa sin que antes
// haya habido ningún "grave" (para tener algo de qué partir).
const PALETA_BASE_DEFAULT = [
  [200,60,40],   // rojo teja
  [40,90,150],   // azul
  [210,150,60],  // ocre
  [60,120,90],   // verde
  [180,90,40],   // naranja tostado
  [90,70,140],   // violeta apagado
  [220,190,140], // amarillo arena
];

// Cuánto se desatura / aclara la paleta activa para el estado "suave"
const SUAVE_FACTOR_SATURACION = 0.42;
const SUAVE_SUMA_BRILLO       = 18;

let coloresActivos    = null;
let coloresAnteriores = null;
let tipoSonido        = 'inicial';

// Aleteo / escala / vibración
let escala    = 1.0;
let squeeze   = 1.0; // achicamiento horizontal relativo (efecto "plegado", solo lo usa el estado suave)
let aleteo    = 0;
let vibracion = 0;

const FASES_ALETEO = [0, 0.7, 1.4, 2.1, 2.8];
const AMPS_ALETEO  = [5, 4.5, 4, 3.5, 3];

// Offsets globales por grupo (para chasquido)
// índices: 0=FondoAzul, 1=FondoMarron, 2=Cuadrados, 3=Amarillos, 4=CirculoAzul
let offsetsActuales = Array.from({length:5}, ()=>({x:0,y:0}));
let offsetsObjetivo = Array.from({length:5}, ()=>({x:0,y:0}));

// Offsets individuales por PNG
let cuadActuales = Array.from({length:4}, ()=>({x:0,y:0}));
let cuadObjetivo = Array.from({length:4}, ()=>({x:0,y:0}));
let amarActuales = Array.from({length:4}, ()=>({x:0,y:0}));
let amarObjetivo = Array.from({length:4}, ()=>({x:0,y:0}));

// Escalas individuales por PNG
let cuadEscalaActual  = [1,1,1,1];
let cuadEscalaObjetivo= [1,1,1,1];
let amarEscalaActual  = [1,1,1,1];
let amarEscalaObjetivo= [1,1,1,1];

// Offsets individuales de fondos
let fondoAzulObjGrave   = {x:0, y:0};
let fondoMarronObjGrave = {x:0, y:0};
let fondoAzulActGrave   = {x:0, y:0};
let fondoMarronActGrave = {x:0, y:0};

const DIRS_GRUPO = [
  { x: -1,   y: -0.8 },
  { x:  1,   y:  0.8 },
  { x: -0.7, y:  1   },
  { x:  0.7, y: -1   },
  { x:  0,   y:  0   },
];

let estadoAnterior = 'ESTADO INICIAL';

// --- Panel de diagnóstico: visibilidad toggleable ---
let mostrarPanel = true;
const BOTON = { x: 12, y: 12, w: 26, h: 26 };

function preload() {
  imgFondo    = loadImage('data/fondo.png');
  imgCostados = loadImage('data/costados.png');
  imgEsquinas = [
    loadImage('data/esquinaA.png'), loadImage('data/esquinaB.png'),
    loadImage('data/esquinaC.png'), loadImage('data/esquinaD.png'),
  ];
  imgFondoAzul   = loadImage('data/FondoAzul.png');
  imgFondoMarron = loadImage('data/FondoMarron.png');
  imgCuadrados = [
    loadImage('data/cuadradoA.png'), loadImage('data/cuadradoB.png'),
    loadImage('data/cuadradoC.png'), loadImage('data/cuadradoD.png'),
  ];
  imgAmarillos = [
    loadImage('data/AmarilloA.png'), loadImage('data/AmarilloB.png'),
    loadImage('data/AmarilloC.png'), loadImage('data/AmarilloD.png'),
  ];
  imgCirculoAzul = loadImage('data/CirculoAzul.png');
}

function setup() {
  console.log("--- DIAGNÓSTICO: ENTRANDO A SETUP ---"); 
  let h   = min(windowHeight, 750);
  let w   = min(floor(h * RATIO), windowWidth);
  let cnv = createCanvas(w, h);
  cnv.elt.setAttribute('tabindex', '0');
  cnv.elt.focus();

  mic       = new p5.AudioIn();
  console.log("--- DIAGNÓSTICO: MIC CREADO:", mic);
  gestorAmp = new GestorSenial(AMP_MIN, AMP_MAX);

  let targetW = 700;
  let targetH = floor(targetW / RATIO);
  imgFondo.resize(targetW, targetH);
  imgCostados.resize(targetW, targetH);
  for (let img of imgEsquinas)  img.resize(targetW, targetH);
  imgFondoAzul.resize(targetW, targetH);
  imgFondoMarron.resize(targetW, targetH);
  for (let img of imgCuadrados) img.resize(targetW, targetH);
  for (let img of imgAmarillos) img.resize(targetW, targetH);
  imgCirculoAzul.resize(targetW, targetH);
}

function distanciaColor(a, b) {
  return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);
}

// Compara todos contra todos para evitar cualquier color similar entre selecciones
function distanciaSeleccion(a, b) {
  if (!a || !b) return Infinity;
  let minDist = Infinity;
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < b.length; j++) {
      let d = distanciaColor(a[i], b[j]);
      if (d < minDist) minDist = d;
    }
  return minDist;
}

// Convierte un color RGB en una versión "calma" del mismo color:
// misma tonalidad (hue), pero menos saturado y más luminoso.
// Así el estado suave nunca introduce una familia de color nueva o fría,
// solo atenúa la que ya está activa.
function suavizarColor(c, factorSaturacion = SUAVE_FACTOR_SATURACION, sumaBrillo = SUAVE_SUMA_BRILLO) {
  push();
  colorMode(RGB, 255);
  let original = color(c[0], c[1], c[2]);
  colorMode(HSB, 360, 100, 100);
  let h = hue(original);
  let s = saturation(original) * factorSaturacion;
  let b = min(100, brightness(original) + sumaBrillo);
  let suave = color(h, s, b);
  colorMode(RGB, 255);
  let resultado = [red(suave), green(suave), blue(suave)];
  pop();
  return resultado;
}

function seleccionarColores(tipo) {
  if (tipo === 'inicial') { coloresActivos = null; tipoSonido = 'inicial'; return; }

  if (tipo === 'suave') {
    // Partimos siempre de la paleta que ya estaba activa (o de una base de
    // referencia si todavía no hubo ninguna) y generamos versiones más
    // suaves de esos mismos colores. Nunca saltamos a una familia distinta.
    let base = coloresActivos || coloresAnteriores || PALETA_BASE_DEFAULT;
    coloresAnteriores = coloresActivos;
    coloresActivos    = base.map(c => suavizarColor(c));
    tipoSonido        = 'suave';
    return;
  }

  // tipo === 'grave': paleta plena, saturada, de máximo contraste
  let pool = [];
  for (let p of paletasGraves) for (let c of p) pool.push(c);

  let nueva; let intentos = 0;
  do {
    let copia = pool.slice();
    for (let i = copia.length-1; i > 0; i--) {
      let j = floor(random(i+1)); [copia[i],copia[j]] = [copia[j],copia[i]];
    }
    nueva = copia.slice(0, 7);
    intentos++;
  } while (distanciaSeleccion(nueva, coloresActivos) < 90 && intentos < 20);

  coloresAnteriores = coloresActivos;
  coloresActivos    = nueva;
  tipoSonido        = 'grave';
}

function generarOffsetIndividuales(tipo) {
  if (tipo === 'grave') {
    // Rangos grandes (±80px) para dispersión visualmente evidente
    const cuadrantes = [
      { x:  1, y: -1 }, { x: -1, y: -1 },
      { x: -1, y:  1 }, { x:  1, y:  1 },
    ];
    let orden = [0,1,2,3];
    for (let i = 3; i > 0; i--) {
      let j = floor(random(i+1)); [orden[i],orden[j]] = [orden[j],orden[i]];
    }
    for (let i = 0; i < 4; i++) {
      let dir = cuadrantes[orden[i]];
      let mag = random(40, 80);
      let ang = random(-0.5, 0.5);
      cuadObjetivo[i] = {
        x: (dir.x * cos(ang) - dir.y * sin(ang)) * mag,
        y: (dir.x * sin(ang) + dir.y * cos(ang)) * mag,
      };
    }
    for (let i = 0; i < 4; i++) {
      let dir = cuadrantes[orden[(i+1)%4]]; // rotación diferente a cuadrados
      let mag = random(40, 80);
      let ang = random(-0.5, 0.5);
      amarObjetivo[i] = {
        x: (dir.x * cos(ang) - dir.y * sin(ang)) * mag,
        y: (dir.x * sin(ang) + dir.y * cos(ang)) * mag,
      };
    }
    fondoAzulObjGrave   = { x: random(-40, 40), y: random(-35, 35) };
    fondoMarronObjGrave = { x: random(-40, 40), y: random(-35, 35) };

    for (let i = 0; i < 4; i++) {
      cuadEscalaObjetivo[i] = 1;
      amarEscalaObjetivo[i] = 1;
    }

  } else {
    // Suave: plegado leve y coherente, no dispersión.
    // Cada pieza se desplaza apenas, en direcciones correlacionadas
    // (como pliegues de alas), manteniendo el grupo unido y su escala
    // relativa intacta — la contracción global la maneja `escala`/`squeeze`
    // en draw().
    const cuadrantes = [
      { x:  1, y: -1 }, { x: -1, y: -1 },
      { x: -1, y:  1 }, { x:  1, y:  1 },
    ];
    for (let i = 0; i < 4; i++) {
      let dir = cuadrantes[i];
      let mag = random(8, 18); // desplazamiento pequeño y controlado
      cuadObjetivo[i] = { x: dir.x * mag * 0.4, y: dir.y * mag };
      amarObjetivo[i] = { x: dir.x * mag,       y: dir.y * mag * 0.4 };
      cuadEscalaObjetivo[i] = 1;
      amarEscalaObjetivo[i] = 1;
    }
    fondoAzulObjGrave   = { x: random(-8, 8), y: random(-8, 8) };
    fondoMarronObjGrave = { x: random(-8, 8), y: random(-8, 8) };
  }
}

function nuevaReorganizacion() {
  const rangos = [40, 40, 20, 20, 25];
  for (let i = 0; i < offsetsObjetivo.length; i++) {
    let r = rangos[i];
    offsetsObjetivo[i] = { x: random(-r, r), y: random(-r, r) };
  }
  for (let i = 0; i < 4; i++) {
    cuadObjetivo[i]  = { x: random(-20, 20), y: random(-20, 20) };
    amarObjetivo[i]  = { x: random(-20, 20), y: random(-20, 20) };
  }
}

function lerpOffset(actual, objetivo, t) {
  actual.x = lerp(actual.x, objetivo.x, t);
  actual.y = lerp(actual.y, objetivo.y, t);
}

function draw() {
  if (!audioIniciado) {
    background(20, 40, 70); fill(220); noStroke();
    textAlign(CENTER, CENTER); textSize(18); textFont('monospace');
    text('clic para comenzar', width/2, height/2);
    return;
  }

  // Audio
  let amp = mic.getLevel();
  gestorAmp.actualizar(amp);
  intensidad     = gestorAmp.filtrada;
  derivadaActual = gestorAmp.derivada;

  haySonido = intensidad > UMBRAL_SONIDO;
  let empezoElSonido  = haySonido && !antesHabiaSonido;
  let terminoElSonido = !haySonido && antesHabiaSonido;

  if (empezoElSonido) { marcaInicio = millis(); derivadaPico = 0; }
  if (haySonido) {
    durSonido = millis() - marcaInicio;
    if (abs(derivadaActual) > derivadaPico) derivadaPico = abs(derivadaActual);
  }

  // Estado
  let nuevoEstado;
  if (!haySonido) {
    nuevoEstado = 'ESTADO INICIAL';
  } else if (durSonido < UMBRAL_LARGO && derivadaPico > UMBRAL_DERIVADA_CHASQUIDO) {
    nuevoEstado = 'CHASQUIDO DETECTADO';
  } else if (intensidad > UMBRAL_GRAVE) {
    nuevoEstado = 'SONIDO GRAVE DETECTADO';
  } else if (durSonido >= UMBRAL_LARGO) {
    nuevoEstado = 'SONIDO SUAVE DETECTADO';
  } else {
    nuevoEstado = 'SHHH DETECTADO';
  }

  // Transiciones de estado
  let cambioDesdeSuave = estadoAnterior === 'SONIDO SUAVE DETECTADO' && nuevoEstado !== 'SONIDO SUAVE DETECTADO';
  let cambioDesdeGrave = estadoAnterior === 'SONIDO GRAVE DETECTADO' && nuevoEstado !== 'SONIDO GRAVE DETECTADO';

  if (nuevoEstado === 'SONIDO GRAVE DETECTADO' && estadoAnterior !== 'SONIDO GRAVE DETECTADO') {
    generarOffsetIndividuales('grave');
  }
  if (nuevoEstado === 'SONIDO SUAVE DETECTADO' && estadoAnterior !== 'SONIDO SUAVE DETECTADO') {
    generarOffsetIndividuales('suave');
  }
  if (cambioDesdeSuave || cambioDesdeGrave) {
    for (let i = 0; i < 4; i++) {
      cuadObjetivo[i]       = {x:0, y:0};
      amarObjetivo[i]       = {x:0, y:0};
      cuadEscalaObjetivo[i] = 1;
      amarEscalaObjetivo[i] = 1;
    }
    fondoAzulObjGrave   = {x:0, y:0};
    fondoMarronObjGrave = {x:0, y:0};
  }

  estadoActual = nuevoEstado;

  // Chasquido
  if (terminoElSonido) {
    let fueChasquido = durSonido < UMBRAL_LARGO && derivadaPico > UMBRAL_DERIVADA_CHASQUIDO;
    if (fueChasquido) nuevaReorganizacion();
  }

  // Paletas: solo grave y suave sostenidos, SHHH nunca activa colores
  if (haySonido && durSonido >= UMBRAL_LARGO && estadoActual !== 'SHHH DETECTADO') {
    if (intensidad > UMBRAL_GRAVE && tipoSonido !== 'grave') {
      seleccionarColores('grave');
    } else if (intensidad <= UMBRAL_GRAVE && tipoSonido !== 'suave') {
      seleccionarColores('suave');
    }
  }

  antesHabiaSonido = haySonido;
  estadoAnterior   = estadoActual;

  // Transición de offsets: más lenta y suave durante el estado "suave",
  // para que el plegado se sienta gradual y no un salto.
  let tGrupo = estadoActual === 'SONIDO SUAVE DETECTADO' ? 0.06 : 0.15;
  let tPieza = estadoActual === 'SONIDO SUAVE DETECTADO' ? 0.05 : 0.12;
  for (let i = 0; i < 5; i++) lerpOffset(offsetsActuales[i], offsetsObjetivo[i], tGrupo);
  for (let i = 0; i < 4; i++) {
    lerpOffset(cuadActuales[i],  cuadObjetivo[i],  tPieza);
    lerpOffset(amarActuales[i],  amarObjetivo[i],  tPieza);
    cuadEscalaActual[i]  = lerp(cuadEscalaActual[i],  cuadEscalaObjetivo[i],  tPieza);
    amarEscalaActual[i]  = lerp(amarEscalaActual[i],  amarEscalaObjetivo[i],  tPieza);
  }
  lerpOffset(fondoAzulActGrave,   fondoAzulObjGrave,   0.12);
  lerpOffset(fondoMarronActGrave, fondoMarronObjGrave, 0.12);

  // CAMINO A: sin sonido
  if (!haySonido) {
    aleteo += 0.012;
    background(0); noTint();
    image(imgFondo,    0, 0, width, height);
    image(imgCostados, 0, 0, width, height);
    for (let img of imgEsquinas) image(img, 0, 0, width, height);

    for (let gi = 0; gi < 5; gi++) {
      let fase = aleteo + FASES_ALETEO[gi];
      let a    = AMPS_ALETEO[gi];
      let ax   = sin(fase)        * a + offsetsActuales[gi].x;
      let ay   = cos(fase * 0.75) * a + offsetsActuales[gi].y;

      noTint();
      if (gi === 0) {
        image(imgFondoAzul,   ax + fondoAzulActGrave.x,   ay + fondoAzulActGrave.y,   width, height);
      } else if (gi === 1) {
        image(imgFondoMarron, ax + fondoMarronActGrave.x, ay + fondoMarronActGrave.y, width, height);
      } else if (gi === 2) {
        for (let k = 0; k < 4; k++) {
          let sw = width  * cuadEscalaActual[k];
          let sh = height * cuadEscalaActual[k];
          image(imgCuadrados[k], ax + cuadActuales[k].x, ay + cuadActuales[k].y, sw, sh);
        }
      } else if (gi === 3) {
        for (let k = 0; k < 4; k++) {
          let sw = width  * amarEscalaActual[k];
          let sh = height * amarEscalaActual[k];
          image(imgAmarillos[k], ax + amarActuales[k].x, ay + amarActuales[k].y, sw, sh);
        }
      } else {
        tint(255, ALPHA_CIRCULO);
        image(imgCirculoAzul, ax, ay, width, height);
        noTint();
      }
    }

    escala    = lerp(escala,    1.0, 0.05);
    squeeze   = lerp(squeeze,   1.0, 0.05);
    vibracion = lerp(vibracion, 0,   0.15);
    for (let i = 0; i < 5; i++) {
      offsetsObjetivo[i].x = lerp(offsetsObjetivo[i].x, 0, 0.01);
      offsetsObjetivo[i].y = lerp(offsetsObjetivo[i].y, 0, 0.01);
    }

    dibujarUI();
    return;
  }

  // CAMINO B: con sonido
  let escalaObj  = 1.0;
  let squeezeObj = 1.0;
  if (estadoActual === 'SONIDO GRAVE DETECTADO') {
    escalaObj  = 1.15;
    squeezeObj = 1.0;
  } else if (estadoActual === 'SONIDO SUAVE DETECTADO') {
    // Contracción moderada y gradual, con un leve achicamiento horizontal
    // extra (squeeze) que da sensación de plegado, como alas cerrándose,
    // en vez de un colapso uniforme y brusco.
    escalaObj  = 0.80;
    squeezeObj = 0.55;
  }
  let tEscala = estadoActual === 'SONIDO SUAVE DETECTADO' ? 0.05 : 0.10;
  escala  = lerp(escala,  escalaObj,  tEscala);
  squeeze = lerp(squeeze, squeezeObj, tEscala);

  // Vibración solo SHHH
  if (estadoActual === 'SHHH DETECTADO') {
    vibracion = lerp(vibracion, 2.5, 0.3);
  } else {
    vibracion = lerp(vibracion, 0, 0.15);
  }
  let vibX = vibracion > 0.05 ? random(-vibracion, vibracion) : 0;
  let vibY = vibracion > 0.05 ? random(-vibracion, vibracion) : 0;

  aleteo += 0.012;

  let separacion = 0;
  if      (estadoActual === 'SONIDO GRAVE DETECTADO') separacion =  45;
  else if (estadoActual === 'SONIDO SUAVE DETECTADO') separacion = -14; // acercamiento suave, no un choque

  // SHHH no usa paleta aunque exista una previa
  let usarColor = (estadoActual !== 'SHHH DETECTADO') && coloresActivos !== null;
  let c = usarColor ? coloresActivos : null;

  background(0);

  if (c) tint(c[6][0], c[6][1], c[6][2]); else noTint();
  image(imgFondo, 0, 0, width, height);

  if (c) tint(c[0][0], c[0][1], c[0][2]); else noTint();
  image(imgCostados, 0, 0, width, height);

  // Esquinas: máximo 22% de crecimiento en grave
  let escalaEsquinas = 1.0;
  if (estadoActual === 'SONIDO GRAVE DETECTADO') {
    escalaEsquinas = constrain(lerp(1.0, 1.22, (escala - 1.0) / 0.15), 1.0, 1.22);
  }
  let ew  = width  * escalaEsquinas;
  let eh  = height * escalaEsquinas;
  let eox = (width  - ew) / 2;
  let eoy = (height - eh) / 2;
  for (let img of imgEsquinas) image(img, eox, eoy, ew, eh);

  let cw2 = width  * escala * squeeze;
  let ch2 = height * escala;

  for (let gi = 0; gi < 5; gi++) {
    let fase = aleteo + FASES_ALETEO[gi];
    let aAmp = AMPS_ALETEO[gi] * 0.4;
    let aX   = sin(fase)        * aAmp;
    let aY   = cos(fase * 0.75) * aAmp;
    let dir  = DIRS_GRUPO[gi];

    let bx = (width  - cw2)/2 + vibX + aX + dir.x * separacion + offsetsActuales[gi].x;
    let by = (height - ch2)/2 + vibY + aY + dir.y * separacion + offsetsActuales[gi].y;

    if (gi === 0) {
      if (c) tint(c[1][0], c[1][1], c[1][2]); else noTint();
      image(imgFondoAzul, bx + fondoAzulActGrave.x, by + fondoAzulActGrave.y, cw2, ch2);

    } else if (gi === 1) {
      if (c) tint(c[2][0], c[2][1], c[2][2]); else noTint();
      image(imgFondoMarron, bx + fondoMarronActGrave.x, by + fondoMarronActGrave.y, cw2, ch2);

    } else if (gi === 2) {
      if (c) tint(c[3][0], c[3][1], c[3][2]); else noTint();
      for (let k = 0; k < 4; k++) {
        image(imgCuadrados[k], bx + cuadActuales[k].x, by + cuadActuales[k].y, cw2, ch2);
      }

    } else if (gi === 3) {
      if (c) tint(c[4][0], c[4][1], c[4][2]); else noTint();
      for (let k = 0; k < 4; k++) {
        image(imgAmarillos[k], bx + amarActuales[k].x, by + amarActuales[k].y, cw2, ch2);
      }

    } else {
      if (c) tint(c[5][0], c[5][1], c[5][2], ALPHA_CIRCULO);
      else   tint(255, ALPHA_CIRCULO);
      image(imgCirculoAzul, bx, by, cw2, ch2);
      noTint();
    }
  }

  noTint();
  dibujarUI();
}

function dentroBoton(x, y) {
  return x >= BOTON.x && x <= BOTON.x + BOTON.w &&
         y >= BOTON.y && y <= BOTON.y + BOTON.h;
}

function dibujarUI() {
  // Botón toggle: siempre visible, esté o no el panel abierto
  noStroke(); fill(0,0,0,160); rect(BOTON.x, BOTON.y, BOTON.w, BOTON.h, 5);
  fill(255); textFont('monospace'); textSize(14); textAlign(CENTER, CENTER);
  text(mostrarPanel ? '–' : 'i', BOTON.x + BOTON.w/2, BOTON.y + BOTON.h/2);

  if (!mostrarPanel) return;

  let pw = 230, ph = 150;
  let px = 12, py = BOTON.y + BOTON.h + 8;
  noStroke(); fill(0,0,0,140); rect(px, py, pw, ph, 6);
  fill(255); textFont('monospace'); textSize(12); textAlign(LEFT, TOP);
  let lh = 18, ty = py+10, tx = px+10;
  text('amplitud: '   + intensidad.toFixed(3),     tx, ty); ty += lh;
  text('derivada: '   + derivadaActual.toFixed(3), tx, ty); ty += lh;
  text('pico deriv: ' + derivadaPico.toFixed(3),   tx, ty); ty += lh;
  text('hay sonido: ' + (haySonido ? 'si' : 'no'), tx, ty); ty += lh;
  text('duracion: '   + durSonido + ' ms',          tx, ty); ty += lh;
  let barW = pw-20, barH = 10;
  noFill(); stroke(255); rect(tx, ty, barW, barH);
  noStroke(); fill(120,200,255);
  rect(tx, ty, barW * constrain(intensidad,0,1), barH);
  ty += barH+12;
  fill(255,220,120); text(estadoActual, tx, ty);
}

async function iniciarAudio() {
  if (audioIniciado) return;
  try {
    await userStartAudio();
    mic.start(
      () => { audioIniciado = true; marcaInicio = millis(); },
      (err) => console.error('Micrófono no disponible', err)
    );
  } catch (err) { console.error('Error al iniciar audio', err); }
}

function mousePressed() {
  if (audioIniciado && dentroBoton(mouseX, mouseY)) {
    mostrarPanel = !mostrarPanel;
    return false;
  }
  iniciarAudio();
}

function touchStarted() {
  if (audioIniciado && dentroBoton(mouseX, mouseY)) {
    mostrarPanel = !mostrarPanel;
    return false;
  }
  iniciarAudio();
  return false;
}

function keyPressed() {
  if (key === 'p' || key === 'P') {
    mostrarPanel = !mostrarPanel;
  }
}

function windowResized() {
  let h = min(windowHeight, 750);
  let w = min(floor(h * RATIO), windowWidth);
  resizeCanvas(w, h);
}
