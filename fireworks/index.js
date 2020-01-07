//linear congruent generator
function LCG(_seed) {
    this.seed = _seed;
    this.a = 1664525;
    this.c = 1013904223;
    this.m = 0x100000000;
}
LCG.prototype.randomi = function() {
    var old = this.seed;
    return this.seed = (this.a * this.seed + this.c) % this.m;    
}
LCG.prototype.randomf = function() {
    var i = this.randomi();
    return i/this.m;
}
window.LCG = LCG;

console.log('Generando tiradas');
var lcg = new LCG(2000);
var nums = [];
for(var i = 0; i < 100; i++) {
    nums.push(lcg.randomi());
}
//test
//console.log(nums.join(', '));

function Poisson(lambda, prng) {
    this.prng = prng;
    this.lambda = lambda;
}
Poisson.prototype.next = function() {
    var u = this.prng.randomf();
    return -Math.log(u)/this.lambda;
}
window.Poisson = Poisson;

var poisson = new Poisson(5, new LCG(2000));
for(var i = 0; i < 100; i++)
console.log(poisson.next());

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var last = Date.now(), elapsed = 0;

var seed = 7836827;
var lcg = new LCG(seed);
var poisson = new Poisson(175, lcg); //eventos por minuto
var nextEvent = 0;

var fireworks = [];
function launchFirework() {
    var speed = lcg.randomf()*150 + 450;
    var angle = lcg.randomf()*(Math.PI/3) + Math.PI/3;
    var fw = {
	x: lcg.randomi() % 400 + 200,
	y: 650,
	vx: speed * Math.cos(angle),
	vy: speed * Math.sin(-angle),
	age: 0,
	phase: 'launched',
	sparks: []
    };
    console.log(fw);
    return fw;
}
var sparkColors = [];
for(var i = 0; i < 12; i++) {
    var r = lcg.randomi()%50+150;
    var g = lcg.randomi()%30+180;
    var b = lcg.randomi()%20+40;
    sparkColors.push(`rgba(${r},${g},${b},255)`);
}
function genSpark(x, y, angle) {
    var speed = lcg.randomf()*50+200;
    var spark = {
	x: x, y: y, vx: speed*Math.cos(angle), vy: speed*Math.sin(-angle), age: 0, color: sparkColors[lcg.randomi()%sparkColors.length]
    }
    return spark;
}
function explodeFirework(firework) {
    firework.phase = 'explode';
    var randoms = new Array(8);
    for(var i = 0; i < 8; i++) randoms[i] = lcg.randomf() * 2 * Math.PI;
    randoms.sort();
    for(var i = 0; i < 8; i++) {
	firework.sparks.push(genSpark(firework.x, firework.y, randoms[i]));
    }
}
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fireworks.forEach(function(firework, index) {
	if(firework.phase === 'explode') {
	    firework.sparks.forEach(function(spark, iindex) {
		ctx.beginPath();
		ctx.fillStyle = spark.color;
		ctx.rect(spark.x, spark.y, 2, 2);
		ctx.fill();
	    });
	} else {
	    ctx.beginPath();
	    ctx.fillStyle = 'rgba(255,255,255,255)';
	    ctx.rect(firework.x, firework.y, 4, 4);
	    ctx.fill();
	}
    });
}
function update(dt) {
    fireworks.forEach(function(firework, index) {
	firework.age += dt;
	if(firework.phase === 'explode') {
	    firework.sparks.forEach(function(spark, iindex) {
		spark.age += dt;
		spark.x += spark.vx*dt;
		spark.y += spark.vy*dt;
		// TODO hacer perder un % de velocidad cada segundo
	    });
	    firework.sparks = firework.sparks.filter(s => s.age < 6);
	} else {
	    firework.x += firework.vx*dt;
	    firework.y += firework.vy*dt;
	    firework.vy += 250*dt;
	    //
	    if(firework.age > 2.5)
		explodeFirework(firework);
	}
    });
    fireworks = fireworks.filter(f => f.phase !== 'explode' || f.sparks.length !== 0);
}

function loop() {
    requestAnimationFrame(loop);
    var current = Date.now();
    var dt = current - last;
    last = current;
    elapsed += dt;

    if(nextEvent === 0) {
	nextEvent = poisson.next()*60;
    } else if(nextEvent < 0) { //timeout!
	nextEvent = 0;
	fireworks.push(launchFirework());
	console.log('fired firework!');
	console.log(`total fireworks # ${fireworks.length}`);
    } else { // > 0
	nextEvent -= dt/1000;
    }
    update(dt/1000);
    render();
}

loop();
