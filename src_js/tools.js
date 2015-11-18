var tools = window.tools = window["tools"] = tools || {};
tools.Loader = (function()
{
	var o = {};
	var loadeds = {};
	
	o.loadImg = function(path, cb) {
		if(loadeds[path]) {
			if(loadeds[path].type === "onLoad...") {
				loadeds[path].cbList.push(cb);
			} else {
				cb(loadeds[path]);
			}
		}
		else {
			loadeds[path] = {
				type: "onLoad...",
				cbList: [cb]
			}
			var img = new Image();
			img.onload = function() {
				var ctx = tools.createCtx(img.width, img.height);
				ctx.drawImage(img, 0, 0);
				// tools.removeHeuristicMask(ctx);
				for(var i in loadeds[path].cbList){
					loadeds[path].cbList[i](ctx.canvas);
				}
				loadeds[path] = ctx.canvas;
			}
			img.src = path;
		}
	}
	o.loadText = function(path, cb) {
		$["ajax"]({
			"url" : path,
			"dataType": "text",
			"success" : cb
		});
	}
	
	o.paths = {
		sprites: "res/gfx/Sprites/",
		gfx: "res/gfx/",
		gui: "res/gfx/GUI/"
	}
	return o;
}());

tools.Sprite = tools["Sprite"] = (function(){
	var o = {};
	var nameIdx = 0;
	var idCounter = 0;
	
	o.create = function(canvas){
		var o = {
			x: 0, y: 0, 
			par: undefined, 
			stage: undefined, 
			canvas: canvas,
			mouseEnabled: true,
			cb: tools.create_callback(),
			onMouseOver: false,
			name: "sprite_"+nameIdx++,
			hitRect: undefined,
			maskRect: undefined,
			visible: true,
			alpha: 1,
			id: idCounter++
		};
		
		var displayList = o._displayList = [];
		
		o.add = function(sprite, idx)
		{
			function checkCircRef(s){
				var i = 0; 
				var child;
				while(child = s._displayList[i++]) {
					if(child === o) {
						throw new Error("Circular reference error:\n"+
							tools.Sprite.logHierarchy(sprite)+" add to '"+o.name+"'");
					}
					checkCircRef(child);
				}
			};
			checkCircRef(sprite)
			
			if (sprite.par) sprite.par.remove(sprite);
			
			if (idx === undefined || 
				idx > displayList.length) idx = displayList.length;
			else if (idx < 0) idx = 0;
			
			displayList.splice(idx, 0, sprite);
			sprite.par = o;
			sprite._setStage(o.stage || o);
			o.change();
		}
		o.remove = function(sprite)
		{
			var idx = displayList.indexOf(sprite);
			if(idx >= 0) {
				displayList.splice(idx, 1)
				sprite.par = undefined;
				sprite._setStage(undefined);
				o.change();
			}
		}
		o.draw = function(ctx)
		{
			if(!ctx) return;
			
			if(o.onDraw) o.onDraw(ctx);
			try{if(o.canvas) ctx.drawImage(o.canvas, 0, 0);}
			catch(e){//canvas width or height equal to zero
			}
			
			var i = 0;
			var s;
			var dl = displayList.concat();
			while(s = dl[i++]) {
				if(!s.visible || s.destroyed) continue;
				ctx.save();
				if(s.alpha !== 1) {
					ctx.globalAlpha *= s.alpha;
				}
				if(o.maskRect) {
					ctx.beginPath();
					ctx.rect(o.maskRect.x, o.maskRect.y, o.maskRect.w, o.maskRect.h);
					ctx.clip();
				}
				ctx.translate(~~s.x, ~~s.y);
				s.draw(ctx);
				ctx.restore();
			}
		}
		o.setHitRect = function(x, y, w, h) {
			o.hitRect = {x:x, y:y, w:w, h:h};
		}
		o.setMaskRect = function(x, y, w, h) {
			o.maskRect = {x:x, y:y, w:w, h:h};
		}
		o.change = function(){
			if(o.par) o.par.change();
		}
		o.givMouseEvt = function(e){
			var i = displayList.length;
			var s;
			var mp = e.getLocal(o);
			var catcher;
			//if(e.type==="click")console.log("ME: "+o.name,mp.x,mp.y);
			while(s = displayList[--i]){
				if(!s.mouseEnabled) continue;
				var hr = s.hitRect;
				if (!catcher && 
					(hr === undefined || hr.w === undefined || hr.h === undefined || (
					hr.x + s.x < mp.x && hr.x + s.x + hr.w > mp.x &&
					hr.y + s.y < mp.y && hr.y + s.y + hr.h > mp.y)))
				{
					if(!s.onMouseOver) {
						var evt = e.clone();
						evt.type = "mouseover";
						s.onMouseOver = true;
						s.givMouseEvt(evt);
					}
					
					s.givMouseEvt(e);
					
					catcher = s;
				}
				else if(s.onMouseOver) {
					var evt = e.clone();
					evt.type = "mouseout";
					s.onMouseOver = false;
					s.givMouseEvt(evt);
				}
			}
			if(!catcher) o.bubbleMouseEvt(e);
		}
		o.bubbleMouseEvt = function(e){
			if(!o.cb.call(e.type, e) && o.par) {//if propagation is not stopped and have parent
				o.par.bubbleMouseEvt(e);
			}
		}
		o.getGlobalPos = function(){
			var x = o.x;
			var y = o.y;
			var p = o;
			while((p = p.par)) {
				x += p.x;
				y += p.y;
			}
			return {x: x, y: y};
		}
		o._setStage = function(stage, ddd){
			o.stage = stage;
			for(var i in displayList) {
				displayList[i]._setStage(stage);
			}
		}
		o.destroy = function(){
			for(var i in o) {
				delete o[i];
			}
			o.destroyed = true;
		}
		return o;
	}
	
	o.logHierarchy = o["logHierarchy"] = function(sprite, silent){
		var ret = "";
		log(sprite, 0);
		if(!silent) console.log(ret);
		return ret;
		
		function log(s, deep){
			for(var d = 0; d < deep; ++d) ret += "\t";
			ret += s.name+"("+s.x+"/"+s.y+", "+s.w+"*"+s.h+")";
			if(s.hitRect && s.mouseEnabled) ret +="hit x:"+s.hitRect.x+" y:"+s.hitRect.y+" w:"+s.hitRect.w+" h:"+s.hitRect.h;
			if(!s.mouseEnabled) ret += "mouseEnabled: false";
			ret += "\n";
			for(var i in s._displayList) {
				log(s._displayList[i], deep+1);
			}
		}
	}
	o.setToStage = function(sprite){
		var canvas = sprite.canvas;
		var ctx = canvas.getContext("2d");
		var update = false;
		sprite.change = function(){
			if(!update){
				update = true;
				window.requestAnimationFrame(function(){
					update = false;
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					sprite.draw(ctx);
				})
			}
		}
	}
	return o;
}());

tools.createIsReady = function(){
	var destroyed = false;
	var ready = false;
	var ret =  {};
	ret.check = function(){ return ready };
	ret.cbList = [],
	ret.onReady = function(cb){
		if(destroyed) return;
		ret.cbList.push(cb);
	}
	ret.turnToReady = function(){
		if(destroyed) return;
		ready = true;
		var i = ret.cbList.length;
		var cb;
		while(cb = ret.cbList[--i]) { 
			cb();
		}
		ret.destroy();
	}
	ret.destroy = function(){
		destroyed = true;
		delete ret.cbList;
	}
	return ret;
}

tools.removeHeuristicMask = function(ctx){
	var imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
	var data = imageData.data;
	var l = imageData.width * imageData.height * 4;
	var i = 0;
	while(i < l) {
		if (data[i] === 0xff &&
			data[i+1] === 0x00 &&
			data[i+2] === 0xff) {
			data[i+3] = 0;
		}
		i += 4;
	}
	ctx.putImageData(imageData, 0, 0);
}

tools.createCtx = function(w, h){
	var canvas = document.createElement("canvas");
	canvas.width = w === undefined ? 300 : w;
	canvas.height = h === undefined ? 250 : h;
	return canvas.getContext("2d");
}

// tools.addToObjectPath = function(fullPath, value)
// {
// 	path = fullPath.split(".");
// 	var name = path.pop();
// 	var root = window;
// 	var tag;
// 	while(path.length)
// 	{
// 		tag = path.shift();
// 		if(typeof(root[tag]) === "undefined")
// 		{
// 			root[tag] = {};
// 		}
		
// 		if(typeof(root[tag]) !== "object")
// 		{
// 			alert("addToObjectPath: "+tag+" in "+fullPath+" is "+typeof(root[tag]));
// 			return;
// 		}
// 		else {
// 			root = root[tag];
// 		}
// 	}
// 	root[name] = value;
// }

tools.setupRequestAnimationFrame = function(){
	window.requestAnimationFrame = (function(){
	  return  window.requestAnimationFrame       || 
			  window.webkitRequestAnimationFrame || 
			  window.mozRequestAnimationFrame    || 
			  window.oRequestAnimationFrame      || 
			  window.msRequestAnimationFrame     || 
			  function( callback ){
				window.setTimeout(callback, 1000 / 60);
			  };
	})();
}

tools.globalToLocal = function(event, displayObject) {
	var x = e.stageX;
	var y = e.stageY;
	var p = displayObject;
	do {
		x -= p.x;
		y -= p.y;
	} while (p = p.parent);
	return {x:x,y:y};
}

tools.TextWriter = (function(){
	var o = {};
	var px8;
	var px16;
	var px8alphabet = "0123456789";
	var px16alphabet = " !\"©♥×«'()^+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var inited = false;
	
	function init() {
		inited = true;
		px8 = tools.spriteSheet.getImage(FuzedGame.spriteSheetName, "8x8_font.png");
		px16 = tools.spriteSheet.getImage(FuzedGame.spriteSheetName, "16x16_font.png");
	}
	// o.isReady = tools.createIsReady();
	
	// tools.Loader.loadImg(
		// tools.Loader.paths.sprites + "8x8_font.png", 
		// function(img){ px8 = img; if(px8 && px16) o.isReady.turnToReady()})
	// tools.Loader.loadImg(
		// tools.Loader.paths.sprites + "16x16_font.png", 
		// function(img){ px16 = img; if(px8 && px16) o.isReady.turnToReady()})
	
	o.write = function(str, font, maxW, ctx){
		if(!inited) init();
		str = String(str);
		var lines = str.split("\n");
		var lf = font === 8;//use little font
		if(maxW !== undefined){
			maxW = ~~maxW;
			if(maxW < 1) maxW = 1;
			for(var i = 0; i < lines.length; ++i) {
				if(lines[i].length > maxW) {
					lines.splice(i, 0, lines[i].slice(maxW+1));
					lines[i] = lines[i].slice(0, maxW);
				}
			}
		}
		var step = lf ? 8 : 16;
		if(!ctx){
			var maxLength = 1;
			for(var li = 0; li < lines.length; ++li) {
				if(lines[li].length > maxLength) maxLength = lines[li].length;
			}
			ctx = tools.createCtx(maxLength*step, lines.length*step);
		}
		for(var i in lines) {
			for(var j = 0; j < lines[i].length; ++j) {
				var charIdx = (lf ? px8alphabet : px16alphabet).indexOf(lines[i].charAt(j).toUpperCase());
				if(charIdx === -1) charIdx = lf ? 0 : 0;
				ctx.drawImage(lf ? px8 : px16,
					charIdx*step, 0, step, step,
					j*step, i*step, step, step);
			}
		}
		return ctx;
	}
	return o;
}())

tools.spriteSheet = (function(){
	var o = {};
	var sheets = {};
	o.load = function(name, path, cb){
		var sheet = {
			spliter: new Worker("js/wSSSpliter.js"),
			buffer: {}
		};
		tools.Loader.loadImg(path+".png", function(d){
			sheet.canvas = d;
			checkComplete();
		})
		tools.Loader.loadText(path+".json", function(d){
			sheet.data = JSON.parse(d);
			checkComplete();
		})
		function checkComplete() {
			if(sheet.canvas && sheet.data) {
				var id = sheet.canvas.getContext("2d").getImageData(0, 0, sheet.canvas.width, sheet.canvas.height);
				sheet.spliter.postMessage({
					"imageData":id,
					"d":sheet.data}
				);
				sheet.spliter.addEventListener("message", function(e){
					// console.log(e);
					if(e.data.type === "image") {
						var imgData = e.data["imageData"]
						var ccc = tools.createCtx(imgData.width, imgData.height);
						var newImageData = ccc.createImageData(imgData.width, imgData.height);
						newImageData.data.set(imgData.data, 0);
						ccc.putImageData(newImageData, 0, 0);
						sheet.buffer[e.data.fileName] = ccc.canvas;
						// $("body").append(ccc.canvas);
					}
					else if(e.data.type === "finish") {
						delete sheet.canvas;
						delete sheet.data;
					}
				});
				sheets[name] = sheet;
				if(cb) cb();
			}
		}
	}
	o.getImage = function (sheetName, fileName) {
		var sheet = sheets[sheetName];
		if(!sheet) return;
		var ctx;
		if(sheet.buffer[fileName]) {
			var src = sheet.buffer[fileName];
			ctx = tools.createCtx(src.width, src.height);
			ctx.drawImage(src, 0, 0);
			return ctx.canvas;
		}
		else {
			var f = sheet.data.frames[fileName];
			if(!f) return;
			var frame = f["frame"]
			ctx = tools.createCtx(frame["w"], frame["h"]);
			ctx.drawImage(sheet.canvas,
				frame["x"], frame["y"], frame["w"], frame["h"],
				0, 0, frame["w"], frame["h"]);
			sheet.buffer[fileName] = ctx.canvas;
			return ctx.canvas;
		}
	}
	return o;
}())

tools.create_callback = function()
{
	var types = {};

	return  {
		add : function(type, cb, context)
		{
			if(!type || !cb) return;
			var reg = {cb: cb, context:context}
			types[type] ? types[type].push(reg) : types[type] = [reg];
		},

		remove : function(type, cb)
		{
			var list = types[type];
			if(!list) return;
			for(var i = 0; i < list.length; ++i) {
				if(list[i].cb === cb) {
					list.splice(i--, 1);
				}
			}
		},

		call : function(type, data)
		{
			var list = types[type];
			if (list)
			{
				var cbs = [];
				for(var j = 0, l = list.length; j < l; ++j) {
					cbs.push(list[j]);
				}
				for(var j in cbs) {
					if(cbs[j].cb.call(cbs[j].context, data) === true) {
						return true;//stop propagation
					};
				}
			}
		}
	}
}

tools.loadFromLS = function(key){
	if(window.localStorage) {
		return localStorage[key];
	} else {
		return undefined;
	}
}

tools.saveToLS = function(key, data){
	if(window.localStorage) localStorage[key] = data;
}

tools.FpsMeter = (function(){
	var o = {};
	o.element = document.createTextNode("");
	var lastRender = +new Date();
	var lastFps = 0;
	var time;
	var rTime;
	function newFrame(){
		time = +new Date();
		rTime = time - lastRender;
		lastRender = time;
		lastFps += (1000/rTime - lastFps)/20;
		o.element.nodeValue = ~~lastFps+"fps";
		window.requestAnimationFrame(newFrame);
	}
	o.start = function(){
		if(!window.requestAnimationFrame) tools.setupRequestAnimationFrame();
		window.requestAnimationFrame(newFrame);
	}
	return o;
}());

tools.createGreyStamp = function(size, onComplete) {
	size || (size = 100);
	var ctx = tools.createCtx(size, size);
	var imageData = ctx.createImageData(size, size);
	
	// window.URL = window.URL || window.webkiURL;
	// var blob = new Blob(["onmessage = function(e) { "
	// +'	var imageData = e.data;'
	// +'	var d = imageData.data;'
	// +'	var l = imageData.data.length;'
	// +'	var c, p = 0;'
	// +'	for(var i = 0; i < l; ++i){'
	// +'		c = 0 + ~~(17*Math.random());'
	// +'		d[i++] = d[i++] = d[i++] = c;'
	// +'		d[i] = 255;'
	// +'	}'
	// +'	postMessage(imageData);'
	// +"}"]);
	// var blobURL = window.URL.createObjectURL(blob);
	// var worker = new Worker(blobURL);
	// worker.onmessage = function(e) {
	  	// ctx.putImageData(e.data, 0, 0);
		// onComplete(ctx.canvas);
	// };
	// worker.postMessage(imageData);
	
	var d = imageData.data;
	var l = imageData.data.length;
	var c, p = 0;
	for(var i = 0; i < l; ++i){
		c = 0 + ~~(17*Math.random());
		d[i++] = d[i++] = d[i++] = c;
		d[i] = 255;
	}
	ctx.putImageData(imageData, 0, 0);
	onComplete(ctx.canvas);
}

tools.PageVisibility = (function(){
	var o = {};
	o.propName = "hidden";
	o.statePropName = "visibilityState";
	o.evtName = "visibilitychange";
	o.isHidden = function() {
		return document[o.propName];
	}
	o.getState = function() {
		return document[o.statePropName];
	}
	
	function init(){
		if (!('hidden' in document)) {
			var supported = false;
			var prefixes = ['webkit','moz','ms','o'];
			for (var i = 0; i < prefixes.length; i++){
				if ((prefixes[i] + 'Hidden') in document) {
					o.propName = prefixes[i] + 'Hidden';
					o.statePropName = prefixes[i] + "VisibilityState";
					o.evtName = prefixes[i] + "visibilitychange";
					supported = true;
					break;
				}
			}
			if(!supported) {
				document.hidden = false;
				document.visibilityState = "visible";
			}
		}
	}
	init();
	return o;
}());

tools.audio = function() {
	var o = {};
	var context;
	function init() {
		if(!window.audioContext) {
			var prefs = ["moz", "ms", "o", "webkit"];
			for(var i in prefs) {
				if(window[prefs[i]+"AudioContext"]) {
					window.audioContext = window[prefs[i]+"AudioContext"];
				}
			}
		}
		if(window.audioContext) context = new window.audioContext();
	}
	
	var sounds = {};
	o.load = function(path, cb) {
		if(!context) return;
		if(sounds[path]) {
			if(typeof(cb) === "function") {
				if(sounds[path].ready) cb();
				else sounds[path].cbs.push(cb);
			}
		}
		else {
			var log = {
				ready: false,
				cbs: [],
				buffer: undefined
			}
			if(typeof(cb) === "function") log.cbs.push(cb);
			sounds[path] = log;
			
			var request = new XMLHttpRequest();
			request.open('GET', path);
			request.responseType = 'arraybuffer';
			request.onload = function() {
				context["decodeAudioData"](request.response, function(buffer) {
						log.buffer = buffer;
						log.ready = true;
						for(var i in log.cbs) {
							log.cbs[i]();
						}
						delete log.cbs;
				});
			}
			request.send();
		}
	}
	o.play = function(path, time) {
		if(!context) return;
		if(o.isReady(path)) {
			var source = context["createBufferSource"]();
			source["buffer"] = sounds[path].buffer;
			source["connect"](context["destination"]);
			source["noteOn"](time || 0);
		}
	}
	o.isReady = function(path) {
		return Boolean(sounds[path]) && sounds[path].ready;
	}
	
	o.available = function(){
		return Boolean(context);
	}
	init();
	return o;
}();