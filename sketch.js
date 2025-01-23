let walls = []; // Variable para las paredes
let particle;

let wallCount = 25;  // Aumentar el número de paredes
let rayCount = 0.25; // Cantidad de rayos, puede ser 0-1 para ver el efecto más claro

let scales = ["E minor"]; // Array de tonalidades posibles
let selectedScale = ""; // Variable para la tonalidad seleccionada
let tracks = []; // Array para almacenar las pistas de audio
let isAudioAllowed = false; // Verificar si se puede reproducir audio

let amplitude; // Analizador de amplitud de la música

function preload() {
  // Cargar las pistas de audio en un array
  tracks.push(loadSound("Chopin - Prelude in E Minor (Op. 28 No. 4).mp3"));
  tracks.push(loadSound("Mendelssohn Violin Concerto E Minor OP.64 - 3rd mov..mp3"));
  tracks.push(loadSound("Vivaldi Concerto for Violin, Strings and Harpsichord in E Minor, RV 278 - I. Allegro molto (1).mp3"));
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Elegir una tonalidad aleatoria de la lista
  selectedScale = random(scales);

  // Crear paredes
  for (let i = 0; i < wallCount; i++) {
    let angle = random(TWO_PI); // Ángulo inicial aleatorio
    let radius = random(100, min(width, height) / 2); // Radio inicial aleatorio
    walls[i] = new Boundary(angle, radius); // Usar walls para almacenar las paredes
  }

  particle = new Particle();

  // Hacer que el cursor sea visible
  cursor(); // Restaurar el cursor al estado normal

  // Inicializar el analizador de amplitud
  amplitude = new p5.Amplitude();
}

function draw() {
  background(245, 245, 235); // Fondo beige muy claro

  // Mostrar el nombre de la tonalidad seleccionada en la parte superior del lienzo
  fill(38, 38, 38); // Color negro para el texto
  textSize(32);
  textAlign(CENTER, TOP);
  textFont("Georgia"); // Usar la fuente predeterminada 'Georgia' con serifa
  text(selectedScale, width / 2, 20);

  // Analizar la amplitud de la música para ajustar las dinámicas
  let level = amplitude.getLevel(); // Obtener el nivel de amplitud
  let dynamicSpeed = map(level, 0, 1, 0.005, 0.1); // Mapeo de la amplitud a velocidad de las paredes
  let dynamicRadius = map(level, 0, 1, 100, min(width, height) / 2); // Mapeo de la amplitud a radio de las paredes

  // Mostrar las paredes y moverlas según la amplitud de la música
  for (let wall of walls) {
    wall.show();
    wall.update(dynamicSpeed, dynamicRadius); // Usar la amplitud para modificar velocidad y radio
  }

  // Mantener la partícula en el centro del lienzo
  particle.update(width / 2, height / 2); // Establecer la posición de la partícula en el centro
  particle.show();
  particle.look(walls); // Ver interacciones de los rayos con las paredes

  // Mostrar mensaje constante en la parte inferior
  fill(38, 38, 38); // Color negro para el texto
  textSize(20);
  textAlign(CENTER, BOTTOM);
  text("Click to start and change the piece :))", width / 2, height - 20); // Texto centrado en la parte inferior
}

function mousePressed() {
  // Activar el audio si no está permitido aún
  if (!isAudioAllowed) {
    userStartAudio(); // Inicia el contexto de audio
    isAudioAllowed = true;
  }

  playRandomTrack(); // Reproducir una pista aleatoria al hacer clic
}

function playRandomTrack() {
  // Detener cualquier pista que esté reproduciéndose actualmente
  for (let track of tracks) {
    if (track.isPlaying()) {
      track.stop();
    }
  }

  // Seleccionar una pista aleatoria y reproducirla
  let randomTrack = random(tracks);
  randomTrack.play();
}

// Clase para representar una pared
class Boundary {
  constructor(angle, radius) {
    this.angle = angle;
    this.radius = radius;
    this.speed = random(0.005, 0.015); // Reducir velocidad de rotación
    this.radiusSpeed = random(0.2, 0.5); // Reducir velocidad de cambio del radio
  }

  // Función para mostrar la pared
  show() {
    let x1 = width / 2 + cos(this.angle) * this.radius;
    let y1 = height / 2 + sin(this.angle) * this.radius;
    let x2 = width / 2 + cos(this.angle + 0.1) * this.radius;
    let y2 = height / 2 + sin(this.angle + 0.1) * this.radius;

    stroke(38, 38, 38); // Paredes de color negro
    line(x1, y1, x2, y2);
  }

  // Función para actualizar el ángulo y el radio
  update(dynamicSpeed, dynamicRadius) {
    this.angle += dynamicSpeed; // Actualiza con la velocidad dinámica
    this.radius += this.radiusSpeed; // Mantener la velocidad del radio

    // Restringir el radio dentro del rango visible, usando la dinámica de amplitud
    if (this.radius > dynamicRadius || this.radius < 50) {
      this.radiusSpeed *= -1; // Invertir la dirección del cambio de radio
    }
  }
}

// Clase para los rayos
class Ray {
  constructor(pos, angle) {
    this.pos = pos;
    this.dir = p5.Vector.fromAngle(angle);
  }

  lookAt(x, y) {
    this.dir.x = x - this.pos.x;
    this.dir.y = y - this.pos.y;
    this.dir.normalize();
  }

  show() {
    stroke(38, 38, 38); // Rayos de color negro
    push();
    translate(this.pos.x, this.pos.y);
    line(0, 0, this.dir.x * 2, this.dir.y * 2);
    pop();
  }

  cast(wall) {
    let x1 = width / 2 + cos(wall.angle) * wall.radius;
    let y1 = height / 2 + sin(wall.angle) * wall.radius;
    let x2 = width / 2 + cos(wall.angle + 0.1) * wall.radius;
    let y2 = height / 2 + sin(wall.angle + 0.1) * wall.radius;

    const x3 = this.pos.x;
    const y3 = this.pos.y;
    const x4 = this.pos.x + this.dir.x;
    const y4 = this.pos.y + this.dir.y;

    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den == 0) {
      return;
    }

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
    if (t > 0 && t < 1 && u > 0) {
      const pt = createVector();
      pt.x = x1 + t * (x2 - x1);
      pt.y = y1 + t * (y2 - y1);
      return pt;
    } else {
      return;
    }
  }
}

// Clase para la partícula (fuente de luz)
class Particle {
  constructor() {
    this.pos = createVector(width / 2, height / 2); // Inicialmente en el centro
    this.rays = [];
    for (let a = 0; a < 360; a += rayCount) {
      this.rays.push(new Ray(this.pos, radians(a)));
    }
  }

  update(x, y) {
    this.pos.set(x, y); // Establecer la posición de la partícula en el centro
  }

  look(walls) {
    for (let i = 0; i < this.rays.length; i++) {
      const ray = this.rays[i];
      let closest = null;
      let record = Infinity;
      for (let wall of walls) {
        const pt = ray.cast(wall);
        if (pt) {
          const d = p5.Vector.dist(this.pos, pt);
          if (d < record) {
            record = d;
            closest = pt;
          }
        }
      }
      if (closest) {
        stroke(38, 38, 38, 100); // Rayos de color negro con opacidad
        line(this.pos.x, this.pos.y, closest.x, closest.y);
      }
    }
  }

  show() {
    fill(38, 38, 38); // Partícula de color negro
    noStroke();
    ellipse(this.pos.x, this.pos.y, 1); // Fuente de luz en el centro
    for (let ray of this.rays) {
      ray.show();
    }
  }
}
