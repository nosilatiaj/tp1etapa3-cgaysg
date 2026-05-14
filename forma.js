let rectX;
let rectY;
let rectWidth = 100;
let rectHeight = 100;
let rectSpeedX = 2;
let rectSpeedY = 1.5;

let innerShapeX;
let innerShapeY;
let innerShapeSize = 20;
let innerShapeSpeedX = 1;
let innerShapeSpeedY = 0.8;

function setup() {
  createCanvas(400, 400);
  rectX = width / 2 - rectWidth / 2;
  rectY = height / 2 - rectHeight / 2;

  innerShapeX = rectX + rectWidth / 2;
  innerShapeY = rectY + rectHeight / 2;
}

function draw() {
  background(220);

  // Mover el rectángulo
  rectX += rectSpeedX;
  rectY += rectSpeedY;

  // Rebotar el rectángulo en los bordes del canvas
  if (rectX + rectWidth > width || rectX < 0) {
    rectSpeedX *= -1;
  }
  if (rectY + rectHeight > height || rectY < 0) {
    rectSpeedY *= -1;
  }

  // Dibujar el rectángulo
  fill(255, 0, 0); // Rojo
  rect(rectX, rectY, rectWidth, rectHeight);

  // Mover la figura interior relativa al rectángulo
  innerShapeX += innerShapeSpeedX;
  innerShapeY += innerShapeSpeedY;

  // Rebotar la figura interior dentro de los límites del rectángulo
  if (innerShapeX + innerShapeSize / 2 > rectX + rectWidth || innerShapeX - innerShapeSize / 2 < rectX) {
    innerShapeSpeedX *= -1;
  }
  if (innerShapeY + innerShapeSize / 2 > rectY + rectHeight || innerShapeY - innerShapeSize / 2 < rectY) {
    innerShapeSpeedY *= -1;
  }
  
  // Dibujar la figura interior (un círculo en este caso)
  fill(0, 0, 255); // Azul
  ellipse(innerShapeX, innerShapeY, innerShapeSize, innerShapeSize);
}