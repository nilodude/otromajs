const songDir = "D:/MUSICA/LIBRERIAS/tracklists/anu27";
let songs = []
let fft;
let input;
const bands = 512
const maxEle = 200
let maxLogBin = 0;
let minLogBin = 9999;

let logBins = []
let scaledBins = []
let sum = []

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

let smoothing = 0.4
let vScale = 21

let data = []
let cookedData = []

function setup() {
  let cnv = createCanvas(displayWidth*0.8, displayHeight*0.8, WEBGL);
  background(1);
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
  box();
  showGridHelper();
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
    input.start()
    fft.setInput(input);
  }
}

function setupDisplay(){
  let w = displayWidth / bands
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
      // console.log(logBins[i]);
    }
  }
  for (let i=0; i<bands; i++) {
    scaledBins[i]= Math.round(map(logBins[i], minLogBin, maxLogBin, 0, width));
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

  let posX = cameraX + wiggle2 + width / 2.0;
  let posY = 6 * mouseY + wiggle1 - height / 2.0;
  let posZ = zStart - cameraZ + (height / 2.0) / tan(PI * 30.0 / 180.0);
  let lookX = mouseX * stretch + wiggle2;
  let lookY = height - 200 + mouseY;
  let lookZ = 100;

  if (presRIGHT) {
    println("position: " + posX + ", " + posY + ", " + posZ);
  }


  camera(posX, posY, posZ, lookX, lookY, lookZ, 0, 1, 0);

}


function readFFT(){
  if (input) {
    let spectrum = fft.analyze();
    const clone = structuredClone(spectrum);
    let cookedClone = [];
    
    for (let i = 0; i < clone.length; i++) {
      const amp = clone[i];
      sum[i] += (amp - sum[i]) * smoothing;

      let y =vScale*10* Math.log(sum[i]/height);
      
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
  line(0, 0, 0, 0, height, 0);
  line(0, 0, 0, width, 0, 0);
  pop();
}