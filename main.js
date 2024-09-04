const songDir = "D:/MUSICA/LIBRERIAS/tracklists/anu27";
let songs = []
let fft;
let input;
const bands = 256
let w = 0
const maxEle = 50
let maxLogBin = 0;
let minLogBin = 9999;

let zStart = 6000
let stretch = 3.2
let angle = 0
let cameraX = 0
let cameraY = 0
let cameraZ = 0
let presUP=false
let presDOWN=false
let presLEFT=false
let presRIGHT=false

let smoothing = 1
let vScale = 29

let logBins = []
let scaledBins = []
let spectrum = []
let sum =Array(bands).fill(0)

let data = []
let cookedData = []

function setup() {
  let cnv = createCanvas(displayWidth*0.8, displayHeight*0.8, WEBGL);
  // readSongDir();

  fft = new p5.FFT(0.8,bands);
  //loadSongFile();
  setupAudioIn();
  setupDisplay();
}

function draw() {
  background(0);

  renderCamera();
  
  readFFT();
  
  showGridHelper();
  // drawEQ();
  drawTerrain(TRIANGLE_STRIP)
}

function readSongDir() {
  let files = new File(songDir).listFiles();

  for (const file in files) {
    if (!file.isDirectory() && !file.getName().contains("flac")) {
      console.log(file.getPath())
      songs.add(file.getPath());
    }
  }
}

function setupAudioIn(){
  input = new p5.AudioIn();
  if(input){
    input.connect()
    input.start()
    input.amp(0.9);
    // fft.setInput(input);
  }
}

function setupDisplay(){
  w = window.innerWidth / bands
  let binWidth = 86

  for (let i=0; i<bands; i++) {
    let temp = (i+1)*binWidth;
    if (temp < 20000) {
      logBins[i]= Math.log10(temp);

      if (maxLogBin < logBins[i]) {
        maxLogBin = logBins[i];
      }
      if (minLogBin > logBins[i]) {
        minLogBin = logBins[i];
      }
    }
  }
  for (let i=0; i<bands; i++) {
    scaledBins[i]= Math.round(map(logBins[i], minLogBin, maxLogBin, 0, window.innerWidth));
  }
}

function renderCamera() {

  wiggle1 = 150 * sin(angle + 0.0001 * millis());
  wiggle2 = 200 * sin(0.5 * angle + 0.0001 * millis());
  angle -= 0.01;

  if (presUP) {
    cameraZ += 20;
  }
  if (presDOWN) {
    cameraZ -= 20;
  }
  if (presLEFT) {
    cameraX -= 20;
  }
  if (presRIGHT) {
    cameraX += 20;
  }

  let posX = cameraX + wiggle2 + window.innerWidth / 2.0;
  let posY = 6 * mouseY + wiggle1 - window.innerHeight / 2.0;
  let posZ = zStart - cameraZ + (window.innerHeight / 2.0) / tan(PI * 30.0 / 180.0);
  let lookX = mouseX * stretch + wiggle2;
  let lookY = window.innerHeight - 200 + mouseY;
  let lookZ = 100;

  if (presRIGHT) {
    println("position: " + posX + ", " + posY + ", " + posZ);
  }
  
  camera(posX, posY, posZ, lookX, lookY, lookZ, 0, 1, 0);

}


function readFFT(){
  if (input) {
    spectrum = fft.analyze();
    const clone = spectrum
    let cookedClone = [];
    
    for (let i = 0; i < clone.length; i++) {
      const amp = clone[i];
      sum[i] += (amp - sum[i]) * smoothing;
      let y =vScale*10* Math.log(sum[i]/displayHeight);
      
      cookedClone[i] = y;
    }
    cookedData.unshift(cookedClone);
    data.unshift(clone);
  }
  if (cookedData.length >= maxEle) {
    cookedData.pop();
  }  
  if (cookedData.length > maxEle) {
    cookedData = [];
  }
}

function showGridHelper() {
  push();
  fill(0, 255, 0);
  stroke(0, 255, 0);
  line(0, 0, 0, 0, 0, 2000);
  line(0, 0, 0, 0, window.innerHeight, 0);
  line(0, 0, 0, window.innerWidth, 0, 0);
  pop();
}

function drawTerrain(mode) {
  let z = 0;
  let timeFrame = 0;
  let zPlus = 150;
  for (const row of cookedData) {
    //eleNum++;
    beginShape(mode);
    push();
    for (let i = 0; i < row.length; i++) {
      const red = 255-3*i;
      const greem = 190-8*i;
      const blue = 4*i;

      fill(red, greem, blue, /*255-0.1**/255);
      translate(0, 0, z);
      
      if(stretch*scaledBins[i]>=0){
        // cuando el factor 0*timeFrame (-y*(0*timeFrame)) es demasiado grande, se desplaza casi en vertical y queda bastante guapo
        vertex(stretch*scaledBins[i], -row[i]+0*timeFrame,z);
        vertex(stretch*scaledBins[i], -row[i]+8*timeFrame,z+zPlus);
      }
    }
    if(stretch*scaledBins[row.length-1]>=0){
      vertex(stretch*scaledBins[row.length-1],displayHeight,z+zPlus);
    }
    pop();
    endShape();
    timeFrame++;
    z += 1.5*zPlus;
  }
}