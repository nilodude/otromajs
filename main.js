let fft;
let input;
const bands = 256
let w = 0
const maxEle = 35
let maxLogBin = 0;
let minLogBin = 9999;

let zStart = 5700
let stretch = 5
let angle = 0

let cameraX = 100
let cameraY = 500
let cameraZ = -2200

let prevPY = -500
let prevLX = 100
let prevLY = 400
let prevLZ = 5000

let presUP=false
let presDOWN=false
let presLEFT=false
let presRIGHT=false
let freezeCamera=true

let smoothing = 0.47
let vScale =29

let logBins = []
let scaledBins = []
let spectrum = []
let sum =Array(bands).fill(0)

let data = []
let cookedData = []

let btnSource;

let songs = ['casiohop.mp3',
'GND.mp3',
'piezos_colega_rescate_acopure.mp3',
'sinti.mp3',
'pruebita11-demo01.mp3',
'pruebita12-demo01.mp3',
'redobless.mp3',
'tartámara.mp3',
'tranki.mp3',
'betadin the shit']

async function setup() {
  let cnv = createCanvas(displayWidth, displayHeight, WEBGL);
  setAttributes({ antialias: false })
  fft = new p5.FFT(0,bands);
  cameraX = displayWidth*2.2
  prevLX = displayWidth*2.7
  prevLY= displayHeight
  sourceBtn = createButton('TOGGLE SOURCE')
  sourceBtn.position(1,0)
  sourceBtn.value('mic')
  sourceBtn.mousePressed(toggleSource);

  sourceDiv = createDiv(sourceBtn.value()+'<br>(click to play/stop)')
  sourceDiv.style('color', '#00ff00')
  // sourceDiv.position(40 ,20)
  sourceDiv.position(1 ,20)

  volumeSlider = createSlider(0,1,1, 0)
  volumeSlider.position(75 ,70)

  volumeDiv = createDiv(volumeSlider.value()*100)
  volumeDiv.style('color', '#cacaca')
  volumeDiv.position(120 ,0)

  overlayDiv = document.createElement('div')
  overlayDiv.appendChild(sourceBtn.elt)
  overlayDiv.appendChild(sourceDiv.elt)
  overlayDiv.appendChild(volumeSlider.elt)
  overlayDiv.appendChild(volumeDiv.elt)
  overlayDiv.style.display = 'none'
  document.body.appendChild(overlayDiv)

  if(sourceBtn.value() == 'mic'){
    await setupAudioIn();
  }else{
    loadSongFile();
  }
  
  
  setupDisplay();
}

function draw() {
  background(0);

  renderCamera();
  
  setVolume()

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
  sourceDiv.html(sourceBtn.value()+'<br>(click to play/stop)')
}

function setVolume(){
  volumeDiv.html(int(volumeSlider.value()*100))
  input.amp(volumeSlider.value())
}

function randomSong(){
  return songs[int(random(songs.length-1))]
}

function loadSongFile() {
  try {
    path = 'songs/'+randomSong()
    console.log(path)
    input = new p5.SoundFile(path);
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
    // await listInputs()
    await input.getSources(gotSources, errorSources);
    // input.connect() //this enables sound output
    input.start()
    input.amp(1);
    fft.setInput(input);
  }
}

async function listInputs(){
  if (!navigator.mediaDevices?.enumerateDevices) {
    console.log("enumerateDevices() not supported.");
  } else {
    // List cameras and microphones.
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        devices.forEach((device) => {
          console.log(device.toJSON());
        });
      })
      .catch((err) => {
        console.error(`${err.name}: ${err.message}`);
      });
  }
  
}

async function gotSources(deviceList){
  // if (deviceList.length > 0) {
    console.log(deviceList)
    input.setSource(0)
    console.log(input.currentSource)
  // }
}
function errorSources(error){
  console.error(error)

}
// function mouseClicked(event) {
//   if(event.target.localName == 'canvas'){
//     if (input instanceof p5.SoundFile && input.isLoaded()){ 
//      if(!input.isPlaying()){
//       input.play();
//      }else{
//       input.pause();
//      }
//     } else {
//         if(input.stream){
//           input.stop();
//         }else{
//           input.start()
//         }
//     }
//   }
  
// }

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
  const velocity = 35
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
  let posY = freezeCamera ? prevPY : (6 * mouseY + wiggle1 - height / 2);
  let posZ = zStart - cameraZ + (height / 2) / tan(PI * 30 / 180);
  let lookX = freezeCamera ? prevLX :  (mouseX * stretch + wiggle2);
  let lookY = freezeCamera ? prevLY :  (height - 200 + mouseY);
  let lookZ = freezeCamera ? prevLZ :  (5000 - 5 *mouseY + height/2);

  if (presRIGHT) {
    // console.log("position: " + posX + ", " + posY + ", " + posZ);
  }
  
  camera(posX, posY, posZ, lookX, lookY, lookZ, 0, 1, 0);
  prevPY = posY
  prevLX = lookX
  prevLY = lookY
  prevLZ = lookZ
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
  console.log(stretch)
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
  if(keyCode == 67 || (presUP||presDOWN||presLEFT||presRIGHT)){ // C
    freezeCamera = false
  }
  if (keyCode  == 84) { // T & G
    vScale--;
    printText("vScale: "+vScale);
    console.log("vScale: "+vScale);
  }
  if (keyCode  == 71) { // T & G
    vScale++;
    printText("vScale: "+vScale);
    console.log("vScale: "+vScale);
  }
  if (keyCode  == 49 && input instanceof p5.SoundFile) { // number "1"
    input.stop();
    loadSongFile();
  }
  if (keyCode  == 38 && smoothing < 0.97) { // arrows
    smoothing+= 0.030;
    printText("smoothing: "+smoothing);
    console.log("smoothing: "+smoothing);
  }
  if (keyCode  == 40 && smoothing >= 0.05) {
    smoothing-=0.030;
    printText("smoothing: "+smoothing);
    console.log("smoothing: "+smoothing);
  }

  if(keyCode == 32){ //spacebar
    if (input instanceof p5.SoundFile && input.isLoaded()){ 
      if(!input.isPlaying()){
       input.play();
      }else{
       input.pause();
      }
     } else {
         if(input.stream){
           input.stop();
         }else{
           input.start()
         }
     }
  }
}

function printText(str) {
  // beginShape();
  // loadFont('Courier New');
  // textFont('Courier New')
  // textSize(200);
  // // stroke(255);
  // text(str, 0, height/3);
  // endShape();
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
  if(keyCode == 67 || (!presUP&&!presDOWN&&!presLEFT&&!presRIGHT)){
    freezeCamera = true
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
  // if (cookedData.length > maxEle) {
  //   cookedData = [];
  // }
}

function drawTerrain(mode) {
  let z = 0;
  let timeFrame = 0;
  let zPlus = 100;
  let milis = millis()
  for (const row of cookedData) {
    //eleNum++;
    beginShape(mode); // empty string as an argument makes vertex visible alone, without mesh on top
    push();
    for (let i = 0; i < row.length; i++) {
      
      const red = 205- 3*i-sin(0.0002 * milis);
      const greem = 225-8*i-120 * sin(0.0001 * milis);;
      const blue = 4*i- sin(0.0003 * milis);

      fill(red, greem, blue, /*255-0.1**/255);
      //el -500 de la linea 353 y 354 deberia estar aqui en el translate
      translate(0, 0, z);
      
      if(stretch*scaledBins[i]>=0){
        // cuando el factor 0*timeFrame (-y*(0*timeFrame)) es demasiado grande, se desplaza casi en vertical y queda bastante guapo
        vertex(stretch*scaledBins[i], -500+(height)-row[i]+2*timeFrame,z);
        vertex(stretch*scaledBins[i], -500+(height)-row[i]+6*timeFrame,z+zPlus);
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