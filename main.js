let fft;
let input;
const bands = 256
let w = 0
const maxEle = 25
let maxLogBin = 0;
let minLogBin = 9999;

let zStart = 5700
let stretch = 3.2
let angle = 0

let cameraX = 3500
let cameraY = 0
let cameraZ = 0
let presUP=false
let presDOWN=false
let presLEFT=false
let presRIGHT=false

let smoothing = 0.2
let vScale =29

let logBins = []
let scaledBins = []
let spectrum = []
let sum =Array(bands).fill(0)

let data = []
let cookedData = []

let btnSource;

function setup() {
  let cnv = createCanvas(displayWidth, displayHeight*0.85, WEBGL);
  fft = new p5.FFT(0,bands);
  
  sourceBtn = createButton('SOURCE')
  sourceBtn.position(0,0)
  sourceBtn.value('file')
  sourceBtn.mousePressed(toggleSource);

  // volumeSlider = createSlider(0,1,0.8, 0)
  // volumeSlider.position(100 ,0)

  loadSongFile();
  
  setupDisplay();
}

function draw() {
  background(0);

  renderCamera();
  
  readFFT();
  
  showGridHelper();
  
  drawTerrain(QUAD_STRIP)
}

async function toggleSource(){
  if(sourceBtn.value() == 'mic'){
    input.disconnect()
    input = undefined
    sourceBtn.value('file')
    loadSongFile();
  }else{
    input.stop()
    input.disconnect()
    input = undefined
    sourceBtn.value('mic')
    await setupAudioIn();
  }
}

function loadSongFile() {
  try {
    input = new p5.SoundFile('songs/melodia-the-mail-troika-1979.mp3');
    if (input != null) {
      input.amp(1);
      input.connect()
      fft.setInput(input);
    }
  }
  catch(e) {
    console.error(e)
  }
}


async function setupAudioIn(){
  input = new p5.AudioIn();
  if(input){
    input.getSources(gotSources);
    // input.connect() //this enables sound output
    input.start()
    input.amp(0.9);
    fft.setInput(input);
  }
}

function gotSources(deviceList){
  if (deviceList.length > 0) {
    console.log(deviceList)
  }
}

function mouseClicked(event) {
  if(event.target.localName == 'canvas'){
    if (input instanceof p5.SoundFile && !input.isPlaying() && input.isLoaded()) {
      input.play();
    } else {
      if(input instanceof p5.SoundFile){
        input.pause();
      }else{
        input.stop()
      }
    }
  }
  
}

function setupDisplay(){
  w = width / bands
  let binWidth = 86;
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
    scaledBins[i]= Math.round(map(logBins[i], minLogBin, maxLogBin, 0, width));
  }
}

function renderCamera() {
  const velocity = 50
  wiggle1 = 150 * sin(angle + 0.0001 * millis());
  wiggle2 = 200 * sin(0.5 * angle + 0.0001 * millis());
  angle -= 0.01;

  if (presUP) {
    cameraZ += velocity;
  }
  if (presDOWN) {
    cameraZ -= velocity;
  }
  if (presLEFT) {
    cameraX -= velocity;
  }
  if (presRIGHT) {
    cameraX += velocity;
  }

  let posX = cameraX + wiggle2 + width / 2;
  let posY = 6 * mouseY + wiggle1 - height / 2;
  let posZ = zStart - cameraZ + (height / 2) / tan(PI * 30 / 180);
  let lookX = mouseX * stretch + wiggle2;
  let lookY = height - 200 + mouseY;
  let lookZ = 100;

  if (presRIGHT) {
    // console.log("position: " + posX + ", " + posY + ", " + posZ);
  }
  
  camera(posX, posY, posZ, lookX, lookY, lookZ, 0, 1, 0);

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


function mouseWheel(event) {
  const count = event.delta;
  stretch -= 0.005*count;

  if (stretch < 1) {
    stretch = 1;
  }
}

function keyPressed() {
  //CAMERA CONTROLS
  if (keyCode  == 87) {
    presUP = true;
  }
  if (keyCode  == 83) {
    presDOWN = true;
  }
  if (keyCode  == 68) { 
    presRIGHT = true;
  }
  if (keyCode  == 65) {
    presLEFT = true;
  }
  if (keyCode  == 84) {
    vScale--;
    printText("vScale: "+vScale);
    console.log("vScale: "+vScale);
  }
  if (keyCode  == 71) {
    vScale++;
    printText("vScale: "+vScale);
    console.log("vScale: "+vScale);
  }
  if (keyCode  == '1') {
    file.stop();
    file.removeFromCache();
    changeSongFile();
  }
  if (keyCode  == 38 && smoothing<0.97) {
    smoothing+= 0.030;
    printText("smoothing: "+smoothing);
    console.log("smoothing: "+smoothing);
  }
  if (keyCode  == 40 && smoothing>=0.05) {
    smoothing-=0.030;
    printText("smoothing: "+smoothing);
    console.log("smoothing: "+smoothing);
  }
}

function printText(str) {
  beginShape();
  textFont('Courier New');
  textSize(200);
  fill(255);
  text(str, 0, height/3);
  endShape();
}

function keyReleased() {
  if (keyCode  == 87) {
    presUP = false;
  }
  if (keyCode  == 83) {
    presDOWN = false;
  }
  if (keyCode  == 68) { 
    presRIGHT = false;
  }
  if (keyCode  == 65) {
    presLEFT = false;
  }
  
}


function readFFT(){
  if (input) {
    spectrum = fft.analyze('dB');
    fft.smooth(smoothing)
    const clone = spectrum
    let cookedClone = [];
    
    for (let i = 0; i <= clone.length; i++) {
      const amp = clone[i];
      sum[i] += (amp - sum[i]) * smoothing;
      
      
      cookedClone[i] = map(clone[i],-140,0,-2*height, height/2);
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

function drawTerrain(mode) {
  let z = 0;
  let timeFrame = 0;
  let zPlus = 100;
  for (const row of cookedData) {
    //eleNum++;
    beginShape(mode); // empty string as an argument makes vertex visible alone, without mesh on top
    push();
    for (let i = 0; i < row.length; i++) {
      const red = 255-3*i;
      const greem = 190-8*i;
      const blue = 4*i;

      fill(red, greem, blue, /*255-0.1**/255);
      translate(0, 0, z);
      
      if(stretch*scaledBins[i]>=0){
        // cuando el factor 0*timeFrame (-y*(0*timeFrame)) es demasiado grande, se desplaza casi en vertical y queda bastante guapo
        vertex(stretch*scaledBins[i], (height)-row[i]+2*timeFrame,z);
        vertex(stretch*scaledBins[i], (height)-row[i]+6*timeFrame,z+zPlus);
      }
    }
    // if(stretch*scaledBins[row.length-1]>=0){
    //   vertex(stretch*scaledBins[row.length-1],height,z+zPlus);
    // }
    pop();
    endShape();
    timeFrame++;
    z += 2*zPlus;
  }
}