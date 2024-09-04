const songDir = "D:/MUSICA/LIBRERIAS/tracklists/anu27";
let songs = []

function setup() {
  createCanvas(displayWidth, displayHeight, WEBGL);
  background(1);
  readSongDir();
}


function draw() {

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
