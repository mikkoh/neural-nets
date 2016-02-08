// Training images for this experiment are from: http://digitalcollections.nypl.org/
//

var Perceptron = require('synaptic').Architect.Perceptron;
var async = require('async');
var getImagePixels = require('get-image-pixels');
var raf = require('raf');

var LEARNING_RATE = 0.6;
// input size will be 5 because we want to pass in rgb + xy position
// output size will be 3 so we get back rgb
var net = new Perceptron(5, 5, 3);
var iterations = 0;
var outCanvas1;
var outContext1;
var outCanvas2;
var outContext2;

async.map([
  'nypl.digitalcollections.510d47d9-cc20-a3d9-e040-e00a18064a99.001.w.jpg',
  'filtered.nypl.digitalcollections.510d47d9-cc20-a3d9-e040-e00a18064a99.001.w.jpg',
  'nypl.digitalcollections.510d47d9-c049-a3d9-e040-e00a18064a99.001.w.jpg'
], loadImage, function(err, images) {
  var cc;

  images.forEach(addElToCanvas);
  
  cc = getOutCanvas(images[ 0 ].width, images[ 1 ].height);
  outCanvas1 = cc.canvas;
  outContext1 = cc.context;

  cc = getOutCanvas(images[ 0 ].width, images[ 1 ].height);
  outCanvas2 = cc.canvas;
  outContext2 = cc.context;

  trainRender();

  function trainRender() {
    iterations++;

    train(images[ 0 ], images[ 1 ]);
    output(images[ 0 ], outContext1);
    output(images[ 2 ], outContext2);

    raf(trainRender);
  }
});

function train(input, expected) {
  var width = input.width;
  var height = input.height;
  var pixelsInput = getImagePixels(input);
  var pixelsExpected = getImagePixels(expected);
  var i;

  for(var x = 0; x < width; x++) {
    for(var y = 0; y < height; y++) {
      i = (y * width + x) * 4;

      net.activate([
        pixelsInput[ i ] / 255, // red
        pixelsInput[ i + 1 ] / 255, // green
        pixelsInput[ i + 2 ] / 255, // blue
        x / width, // x
        y / height // y
      ]);
      net.propagate(LEARNING_RATE, [
        pixelsExpected[ i ] / 255, // red
        pixelsExpected[ i + 1 ] / 255, // green
        pixelsExpected[ i + 2 ] / 255 // blue
      ]);
    }
  }
}

function output(input, outContext) {
  var width = input.width;
  var height = input.height;
  var pixelsInput = getImagePixels(input);
  var imageData = outContext.createImageData(width, height);
  var out;
  var i;
  

  for(var x = 0; x < width; x++) {
    for(var y = 0; y < height; y++) {
      i = (y * width + x) * 4;

      out = net.activate([
        pixelsInput[ i ] / 255, // red
        pixelsInput[ i + 1 ] / 255, // green
        pixelsInput[ i + 2 ] / 255, // blue
        x / width, // x
        y / height // y
      ]);

      imageData.data[ i ] = Math.round(out[ 0 ] * 255);
      imageData.data[ i + 1 ] = Math.round(out[ 1 ] * 255);
      imageData.data[ i + 2 ] = Math.round(out[ 2 ] * 255);
      imageData.data[ i + 3 ] = pixelsInput[ i + 3 ];
    }
  }

  outContext.putImageData(imageData, 0, 0);

  outContext.font='15px Georgia';
  outContext.fillText('Iterations: ' + iterations, 15, 30);
}

function addElToCanvas(el) {
  addToDOM(el);
}

function getOutCanvas(width, height) {
  var outCanvas = document.createElement('canvas');
  var outContext;

  outCanvas.width = width;
  outCanvas.height = height;

  outContext = outCanvas.getContext('2d');

  addElToCanvas(outCanvas);

  return {
    canvas: outCanvas,
    context: outContext
  };  
}

function addToDOM(el) {
  document.body.appendChild(el);
}


function loadImage(url, cb) {
  var image = new Image();
  image.src = url;
  image.onload = function() {
    cb(null, image);
  };
}
