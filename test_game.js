const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const dir = path.join(__dirname, 'game', fs.readdirSync(path.join(__dirname,'game'))[0]);
let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
// inline the script instead of loading file
html = html.replace('<script src="js/offline.js"></script>', '<script></script>');

const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
const win = dom.window;

// stub canvas getContext with node-canvas so drawImage works
const { createCanvas, Image } = require('canvas');
win.HTMLCanvasElement.prototype.getContext = function(w) {
  if (!this.__c) this.__c = createCanvas(this.width||300, this.height||150);
  return this.__c.getContext('2d');
};
Object.defineProperty(win.HTMLCanvasElement.prototype, 'width', { get(){return this.__w||600}, set(v){this.__w=v; if(this.__c) this.__c.width=v;} });
Object.defineProperty(win.HTMLCanvasElement.prototype, 'height', { get(){return this.__h||150}, set(v){this.__h=v; if(this.__c) this.__c.height=v;} });

// make image loading work with node-canvas Image
const spritePath1x = path.join(dir, 'assets/100-offline-sprite.png');
win.devicePixelRatio = 1;

const errors = [];
win.addEventListener('error', e => errors.push(String(e.error||e.message)));

const js = fs.readFileSync(path.join(dir, 'js/offline.js'), 'utf8');
try {
  win.eval(js);
} catch (e) { errors.push('eval: '+e.stack.split('\n').slice(0,4).join(' | ')); }

setTimeout(() => {
  const R = win.Runner && win.Runner.instance_;
  console.log('instance:', !!R, 'errors:', errors.length ? errors : 'none');
  if (!R) process.exit(1);
  console.log('imageSprite complete?', R.imageSprite && R.imageSprite.complete);
  console.log('init done? canvas:', !!R.canvas, 'tRex:', !!R.tRex, 'horizon:', !!R.horizon);
  if (R.canvas) {
    // simulate keydown space
    const kd = new win.KeyboardEvent('keydown', {keyCode: 32});
    win.document.dispatchEvent(kd);
    setTimeout(() => {
      console.log('playing:', R.playing, 'activated:', R.activated, 'distanceRan:', R.distanceRan.toFixed(1), 'obstacles:', R.horizon.obstacles.length);
      const ku = new win.KeyboardEvent('keyup', {keyCode: 32});
      win.document.dispatchEvent(ku);
      setTimeout(() => {
        console.log('after 500ms playing:', R.playing, 'distanceRan:', R.distanceRan.toFixed(1), 'crashed:', R.crashed, 'errors:', errors.slice(0,3));
        process.exit(0);
      }, 500);
    }, 500);
  }
}, 300);
