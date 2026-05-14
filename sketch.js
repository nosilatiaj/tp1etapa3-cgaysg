let rectWidth = 100;
let rectHeight = 100;

let innerImage; // Variable para almacenar nuestra imagen PNG

let innerImageWidth = 80; // Ancho deseado de la imagen
let innerImageHeight = 60; // Alto deseado de la imagen

// Variables para la posición ACTUAL del CENTRO de la imagen interior
let currentInnerX;
let currentInnerY;

// Factor de suavizado (cuanto más cerca de 0, más lento, más cerca de 1, más rápido)
let easing = 0.05;

// Variable para el nivel de transparencia (0 es totalmente transparente, 255 es totalmente opaco)
let transparency = 150; // Por ejemplo, 150 para una transparencia media

function preload() {
  innerImage = loadImage('assets/ovalo.png'); // ¡Asegúrate de usar el nombre correcto de tu archivo!
}

function setup() {
  createCanvas(600, 400);
  imageMode(CENTER); // Dibujar las imágenes desde su centro
  rectMode(CORNER); // Asegurarse de que el rectángulo se dibuje desde la esquina

  // Inicializar la posición de la imagen interior al centro del canvas o al centro del primer rectángulo
  currentInnerX = width / 2;
  currentInnerY = height / 2;
}

function draw() {
  background(220);

  // Calcula la posición del rectángulo centrada en el ratón
  // (rectX, rectY es la esquina superior izquierda del rectángulo)
  let rectX = mouseX - rectWidth / 2;
  let rectY = mouseY - rectHeight / 2;

  // Asegura que el rectángulo no salga de los bordes del canvas
  rectX = constrain(rectX, 0, width - rectWidth);
  rectY = constrain(rectY, 0, height - rectHeight);

  // Dibujar el rectángulo
  fill(255, 0, 0); // Rojo
  rect(rectX, rectY, rectWidth, rectHeight);

  // --- Movimiento y límites de la imagen interior ---

  // 1. Calcular la posición ideal del CENTRO de la imagen interior basada en el ratón
  let targetInnerX = mouseX;
  let targetInnerY = mouseY;

  // 2. Calcular los límites REALES para el CENTRO de la imagen interior
  //    para que NINGUNA parte de la imagen se salga del rectángulo.
  let minAllowedInnerX_center = rectX + innerImageWidth / 2;
  let maxAllowedInnerX_center = rectX + rectWidth - innerImageWidth / 2;
  let minAllowedInnerY_center = rectY + innerImageHeight / 2;
  let maxAllowedInnerY_center = rectY + rectHeight - innerImageHeight / 2;

  // Asegurarnos de que el ancho/alto de la imagen no es mayor que el del rectángulo
  if (innerImageWidth > rectWidth) {
      minAllowedInnerX_center = rectX + rectWidth / 2;
      maxAllowedInnerX_center = rectX + rectWidth / 2; // Se centrará
  }
  if (innerImageHeight > rectHeight) {
      minAllowedInnerY_center = rectY + rectHeight / 2;
      maxAllowedInnerY_center = rectY + rectHeight / 2; // Se centrará
  }

  // 3. Constreñir la posición ideal del ratón a estos nuevos límites para el CENTRO de la imagen
  let constrainedTargetX = constrain(targetInnerX, minAllowedInnerX_center, maxAllowedInnerX_center);
  let constrainedTargetY = constrain(targetInnerY, minAllowedInnerY_center, maxAllowedInnerY_center);

  // 4. Mover gradualmente la posición actual de la imagen hacia la posición objetivo constreñida
  currentInnerX = lerp(currentInnerX, constrainedTargetX, easing);
  currentInnerY = lerp(currentInnerY, constrainedTargetY, easing);

  // --- Aplicar transparencia con tint() ---
  tint(255, transparency); // Aplica un tinte blanco con el nivel de transparencia deseado

  // Dibujar la imagen interior en su posición actual
  image(innerImage, currentInnerX, currentInnerY, innerImageWidth, innerImageHeight);

  // --- Restablecer el tinte ---
  // Es importante llamar a noTint() después de dibujar la imagen si no quieres que
  // otros elementos gráficos (o futuras llamadas a image) también se vean afectados.
  noTint();
}