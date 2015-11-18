window.FuzedGame = window.FuzedGame || {};
window.FuzedGame.Screens = window.FuzedGame.Screens || {};
window.FuzedGame.Screens.MapEditor = (function (){
var mapEditor_global = {}
mapEditor_global.create = function(data){
var o = {};
var windows = {};
o.cb = tools.create_callback();
o.layer = tools.Sprite.create();
o.layer.name = "Map Editor"

function init() {
	o.layer.add(editorBg.layer);
	o.layer.add(preview.layer)
	o.layer.add(editorTools.layer)
	o.layer.add(commandBtns.layer);
	windows.layers = windows.layers();
	windows.items = windows.items();
	windows.open = windows.open();
	windows.settings = windows.settings();
	windows.layers.show(true);
	windows.items.show(true);
	windows.open.show(true);
	windows.settings.show(true);
	windows.loadParams();
	o.layer.add(editorConsole.layer);
	o.activate();
	render();
}

function addToTop(sprite) {
	o.layer.add(sprite);
	o.layer.add(editorConsole.layer);
}

function render(){
	editorBg.render();
	commandBtns.layer.x = FuzedGame.Config.fullWidth;	
	editorConsole.setHeight(FuzedGame.Config.fullHeight);
	FuzedGame.update = true;
}

var editorBg = (function(){
	var bg_o = {};
	var pats = [];
	var patIdx = tools.loadFromLS(FuzedGame.Config.LSKeys.editorBg) || 0;
	
	var init = function() {
		bg_o.layer = tools.Sprite.create();
		bg_o.layer.ctx = tools.createCtx(
			FuzedGame.Config.fullWidth, 
			FuzedGame.Config.fullHeight
		);
		bg_o.layer.canvas = bg_o.layer.ctx.canvas;
		
		createPatA("#000000", "#222222");
		createPatA("#434343", "#767676");
		createPatA("#adadad", "#767676");
		createPatB("#434343", "#767676");
		createPatB("#ff00ff", "#ffff00");
		
		function createPatA(c1, c2) {
			var pat = tools.createCtx(16, 16);
			pat.fillStyle = c1;
			pat.fillRect(0, 0, 16, 16);
			pat.beginPath();
			pat.strokeStyle = c2;
			pat.moveTo(0, .5);
			pat.lineTo(16, .5);
			pat.moveTo(.5, 0);
			pat.lineTo(.5, 16);
			pat.stroke();
			pat.closePath();
			pat = pat.createPattern(pat.canvas, "repeat");
			pats.push(pat);
		}
		
		function createPatB(c1, c2) {
			var pat = tools.createCtx(16, 16);
			pat.fillStyle = c1;
			pat.fillRect(0, 0, 16, 16);
			pat.beginPath();
			pat.fillStyle = c2;
			pat.moveTo(0, 0);
			pat.lineTo(16, 0);
			pat.lineTo(0, 16);
			pat.fill();
			pat.closePath();
			pat = pat.createPattern(pat.canvas, "repeat");
			pats.push(pat);
		}
		
		init = undefined;
	}
	
	bg_o.switchPattern = function(){
		patIdx = ++patIdx % pats.length;
		bg_o.render();
		tools.saveToLS(FuzedGame.Config.LSKeys.editorBg, patIdx)
	}
	
	bg_o.render = function() {
		o.layer.w = bg_o.layer.canvas.width = FuzedGame.Config.fullWidth;
		o.layer.h = bg_o.layer.canvas.height = FuzedGame.Config.fullHeight;
		bg_o.layer.ctx.fillStyle = pats[patIdx];
		bg_o.layer.ctx.fillRect(0, 0, o.layer.w, o.layer.h);
		bg_o.layer.change();
	}
	
	init();
	return bg_o;
}());
// function renderBg(){
	// var w = bg.canvas.width = FuzedGame.Config.fullWidth;
	// var h = bg.canvas.height = FuzedGame.Config.fullHeight;
	// o.layer.w = w;
	// o.layer.h = h;
	// var ctx = bg.canvas.getContext("2d");
	// ctx.fillRect(0, 0, w, h);
	// ctx.beginPath();
	// ctx.strokeStyle = "#222222";
	
	// for(var i = 0; i < w; i+= 16) {
		// ctx.moveTo(i+.5, 0);
		// ctx.lineTo(i+.5, h);
	// }
	// for(var i = 0; i < h; i+= 16) {
		// ctx.moveTo(0, i+.5);
		// ctx.lineTo(w, i+.5);
	// }
	// ctx.stroke();
// }

var DataEditor = function(){
	var o = {};
	o.Data = undefined;
	o.cb = tools.create_callback();
	o.selectedLayerName = undefined ;
	var saveData;
		
	
	var stampItems = [];
	o.setStampItems = function(items){
		if(!(items instanceof Array)) items = [items];
		var si = [];
		for(var i in items){
			si.push(items[i].clone());
		}
		stampItems = si;
	}
	o.getStampItems = function(){
		var si = [];
		for(var i in stampItems){
			si.push(stampItems[i].clone());
		}
		return si;
	}
	
	function init(data) {
		if(!data) {
			o.Data = { 
				layers: [], 
				name:"New Map",
				bgType: FuzedGame.Config.BG_TYPES[0],
				author: "Unknown",
				version: 0
			};
			// o.addLayer("BACKGROUND", false, 0, false);
			// o.addLayer("GROUND", true, 0, false);
			// o.addLayer("FOREGROUND", false, 0, false);
			
			// o.Data = new LZ77().decompress(FuzedGame.demoMaps.editor.a);
			o.openSave(FuzedGame.demoMaps.editor.a, true);
			o.selectedLayerName = o.Data.layers[0].name;
		} else {
			o.Data = data;
		}
	}
	
	o.setMapName = function(n){
		o.Data.name = n;
		o.cb.call("mapDatasChange");
	};
	o.getMapName = function(){return o.Data.name};
	o.setBgType = function(n){
		o.Data.bgType = n
		o.cb.call("mapDatasChange");
	};
	o.getBgType = function(){return o.Data.bgType};
	o.setAuthorName = function(n){
		o.Data.author = n
		o.cb.call("mapDatasChange");
	};
	o.getAuthorName = function(){return o.Data.author};
	o.setVersionNum = function(n){
		o.Data.version = n
		o.cb.call("mapDatasChange");
	};
	o.getVersionNum = function(){return o.Data.version};
	
	var itemIdCounter = 0;
	o.createItem = function(d){
		return {
			type: d.type || "",
			name: d.name || "",
			sx: d.sx || 0,
			sy: d.sy || 0,
			x: d.x || 0,
			y: d.y || 0,
			w: d.w || 0,
			h: d.h || 0,
			id: itemIdCounter++,
			clone:function(){
				var ret = {};
				for(var i in this) {
					ret[i] = this[i];
				}
				ret.id = itemIdCounter++;
				return ret;
			}
		}
	}
	
	var history = [];
	var historyPos = -1;
	o.undo = function() {
		if(history[historyPos]) {
			editorConsole.log("undo: "+history[historyPos].t);
			history[historyPos--].u();
		}
	}
	
	o.redo = function(){
		if(history[historyPos+1]) {
			history[++historyPos].r();
			editorConsole.log("redo: "+history[historyPos].t);
		}
	}
	function addToHistory(hi){
		if(history[historyPos]) { 
			history.splice(historyPos+1);
		}
		history.push(hi);
		historyPos = history.length-1;;
	}
	function clearHistory(){
		history = [];
		historyPos = -1;
	}
	o.clearAll = function(){
		if(dialog.confirm("Do you want to delete everything. You can't undo this command.")) {
			clearHistory()
			o.Data = { 
				layers: [], 
				name:"New Map",
				bgType: FuzedGame.Config.BG_TYPES[0],
				author: "Unknown",
				version: 0
			};
			o.addLayer("BACKGROUND", false, 0, false);
			o.addLayer("GROUND", true, 0, false);
			o.addLayer("FOREGROUND", false, 0, false);
			o.selectedLayerName = o.Data.layers[0].name;
		}
	}
	o.addLayer = function(name, ground, suffix, hlog){
		name = String(name) || "NEW LAYER";
		if(suffix === undefined) suffix = 0;
		if(o.getLayer(name + (suffix || ""))) {
			return o.addLayer(name, ground, ++suffix);
		}
		name += suffix || "";
		
		o.Data.layers.push(createEmptyLayer(name, ground))
		
		if(hlog === undefined) hlog = true;
		if(hlog) { addToHistory({
			t:"add layer",
			u:function(){o.removeLayer(name, false)},
			r:function(){o.addLayer(name, ground, undefined, false)}
		})}
		o.cb.call("layersChange");
	}
	function createEmptyLayer(name, isGround){
		return {
			name: String(name),
			items: [],
			isGround: Boolean(isGround),
			alpha: 1
		}
	}
	o.removeLayer = function(layerName, hlog) {
		var idx = o.getLayerIdx(layerName);
		if(idx === -1) return;
		if(!dialog.confirm("Delete layer "+layerName)) return;
		if(o.Data.layers[idx].isGround) {
			editorConsole.log("You can't delete the ground layer!");
			return;
		}
		var log = {
			t:"remove layer",
			layer:undefined,
			u:function(){
				this.layer = o.Data.layers.splice(idx, 1)[0];
			},
			r:function(){
				o.Data.layers.splice(oldIdx, 0, this.layer);
			}
		}
		log.u();
		if(hlog === undefined) hlog = true;
		if(hlog) { addToHistory(log) };
		o.cb.call("layersChange");
	}
	
	o.addItems = function(layerName, items, xOff, yOff, hlog, noCopy) {
		var l = o.getLayer(layerName);
		if(!l) return;
		if(!(items instanceof Array)) items = [items];
		items = items.concat();
		xOff = xOff || 0;
		yOff = yOff || 0;
		
		var skipped = 0;
		for(var i in items) {
			if((items[i].type === "item") !== l.isGround) {
				++skipped;
				continue;
			}
			items[i] = noCopy ? items[i] : items[i].clone();
			items[i].x = (items[i].x || 0) + xOff;
			items[i].y = (items[i].y || 0) + yOff;
			if(l.isGround && items[i].name.indexOf("wall") !== 0) {
				var conflictItems = o.getItemsUnderRect(layerName, 
					{x:items[i].x, y:items[i].y, w:items[i].w, h:items[i].h});
				for(var ci = 0; ci < conflictItems.length; ++ci) {
					if(conflictItems[ci].name.indexOf("wall") === 0) {
						conflictItems.splice(ci--, 1);
					}
				}
				if(conflictItems.length) o.removeItems(layerName, conflictItems);
			}
			l.items.push(items[i]);
		}
		
		if(skipped === items.length) return;
		if(hlog === undefined) hlog = true;
		if(hlog) { addToHistory({
			t:"add item",
			u:function(){o.removeItems(layerName, items, false)},
			r:function(){o.addItems(layerName, items, 0, 0, false, true)}
		})}
		o.cb.call("itemsAdded", {layerName:layerName, items:items});
	}
	
	o.removeItems = function(layerName, items, hlog) {
		var l = o.getLayer(layerName);
		if(!l) return;
		if(!(items instanceof Array)) items = [items];
		
		for(var i in items) {
			for(var j in l.items) {
				if(l.items[j] === items[i]) {
					l.items.splice(j, 1);
					break;
				}
			}
		}
		
		if(hlog === undefined) hlog = true;
		if(hlog) { addToHistory({
			t:"remove item",
			u:function(){o.addItems(layerName, items, 0, 0, false, true)},
			r:function(){o.removeItems(layerName, items, false)}
		})}
		o.cb.call("itemsRemoved", {layerName:layerName});
	}
	
	o.selectLayer = function(layerName) {
		if(o.selectedLayerName !== layerName) {
			o.selectedLayerName = layerName;
			o.cb.call("selectedLayerChange", o.selectedLayerName);
		}
	}
	
	o.getLayer = function(layerName) {
		for(var i in o.Data.layers) {
			if(o.Data.layers[i].name === layerName) {
				return o.Data.layers[i];
			}
		}
	}
	
	o.getLayerIdx = function(layerName){
		return o.Data.layers.indexOf(o.getLayer(layerName));
	}
	
	o.setLayerIdx = function(layerName, idx, hlog){
		var oldIdx = o.getLayerIdx(layerName);
		if(oldIdx === -1) return;
		var layer = o.Data.layers.splice(oldIdx, 1)[0];
		idx = ~~idx;
		idx < 0 && (idx = 0);
		idx > o.Data.layers.length && (idx = o.Data.layers.length);
		o.Data.layers.splice(idx, 0, layer);
		
		if(hlog === undefined) hlog = true;
		if(hlog) { addToHistory({
			t:"set layer index",
			u:function(){o.setLayerIdx(layerName, oldIdx, false)},
			r:function(){o.setLayerIdx(layerName, idx, false)}
		})}
		o.cb.call("layersChange");
	}
	
	o.getAlpha = function(layerName) {
		var l = o.getLayer(layerName);
		return l && l.alpha;
	}
	
	o.setAlpha = function(layerName, value) {
		var l = o.getLayer(layerName);
		if(l) {
			l.alpha = value;
			o.cb.call("alphaChange", layerName);
		}
	}
	
	o.getItemsUnderRect = function(layerName, rect) {
		var l = o.getLayer(layerName);
		if(!l) return;
		ret = [];
		for(var i in l.items) {
			var item = l.items[i];
			if (item.x < rect.x + rect.w &&
				item.x + item.w > rect.x &&
				item.y < rect.y + rect.h &&
				item.y + item.h > rect.y)
			{
				ret.push(item);
			}
		}
		return ret;
	}
	
	o.createMapCode = function(){
/* return structure
b:"siberia",//bgType
n:"map01",//name
a:"Malacka",//author
v:0.2b//version
l:[//layers
	{//example layer
		a:bool,//active or passive layer
		i:[//items
			{//example passive item
				p:[x, y, w, h, sx, sy],//position in game and in source
			},
			{//example active item
				p:[x, y, w, h, type],//position ant item type eg.:player1, exit, bomb
					//full list in FuzedGame.Config.itemsMap
			}
		]
	}
]
*/
		var valid = validateMap();
		if(valid !== true) {
			dialog.alert(valid);
			return;
		}
		
		if(!o.Data.name) o.Data.name = dialog.prompt("Map name:", "New map");
		if(!o.Data.name) return;
				
		var m = {};
		m["l"] = [];
		m["n"] = o.Data.name;
		m["b"] = o.Data.bgType;
		m["a"] = o.Data.author;
		m["v"] = o.Data.version;
		for(var i in o.Data.layers) {
			var newLayer = {};
			newLayer["a"] = o.Data.layers[i].isGround ? "1" : "0";
			newLayer["n"] = o.Data.layers[i].name;
			newLayer["i"] = [];
			for(var j in o.Data.layers[i].items){
				var srcItem = o.Data.layers[i].items[j];
				var item = {};
				item["p"] = [srcItem.x, srcItem.y, srcItem.w, srcItem.h];
				if(srcItem.type === "patch") {
					item["t"] = "0";
					item["p"].push(srcItem.sx, srcItem.sy);
				}
				else {
					item["t"] = "1";
					item["p"].push(srcItem.name);
				}
				newLayer["i"].push(item);
			}
			m["l"].push(newLayer);
		}
		var mapStr = JSON.stringify(m);
		// if(false){//Iuppiter encode
			// mapStr = Iuppiter.compress(mapStr);
			// mapStr = Iuppiter.Base64.encode(mapStr, false);
			// mapStr = "code0:"+mapStr;
		// }
		if(true) {//LZ77 encode
			var ll = mapStr.length;
			mapStr = "code1:"+new LZ77().compress(mapStr);
			console.log("compress rate: " + (mapStr.length/ll));
		}
		return mapStr;
	}
	
	o.readMapCode = function(json) {
		if(json.indexOf("code0:") === 0) {
			json = json.slice(6);
			json = Iuppiter.toByteArray(json);
			json = Iuppiter.decompress(Iuppiter.Base64.decode(json, false));
		}
		if(json.indexOf("code1:") === 0) {
			json = json.slice(6);
			json = new LZ77().decompress(json);
		}
		var mapCode = JSON.parse(json);
		var mapData = {
			layers: [],
			name: mapCode["n"],
			bgType: mapCode["b"],
			author: mapCode["a"],
			version: mapCode["v"]
		}
		var haveGround = false;
		for(var i in mapCode["l"]) {
			var lc = mapCode["l"][i];
			var ld = createEmptyLayer(lc["n"], lc["a"] === "1");
			for(var j in lc["i"]) {
				var ic = lc["i"][j];
				var id = {
					x: ic["p"][0],
					y: ic["p"][1],
					w: ic["p"][2],
					h: ic["p"][3]
				};
				if(lc["i"][j]["t"] === "0") {
					id.type = "patch";
					id.sx = ic["p"][4];
					id.sy = ic["p"][5];
				}
				else {
					haveGround = true;
					id.type = "item";
					id.name = ic["p"][4];
					id.sx = FuzedGame.Config.itemsMap[id.name].p[0];
					id.sy = FuzedGame.Config.itemsMap[id.name].p[1];
				}
				ld.items.push(o.createItem(id));
			}
			mapData.layers.push(ld);
		}
		return mapData;
	}
	o.openSave = function(json, skipConfirm) {
		// try { 
			saveData = typeof(json) === "string" ? JSON.parse(json) : json;
			if(!skipConfirm && !dialog.confirm("Open file: "+saveData["saveName"])) return false;
			o.Data = o.readMapCode(saveData["data"]);
		// } catch(e) {throw("can't read map code: "+e)}
		o.cb.call("mapLoaded");
		return true;
	}
	o.saveMap = function(saveAs) {
		
		var mapStr = o.createMapCode();
		if(!mapStr) return;
		var saveName = (!saveAs && saveData && saveData["saveName"]) || dialog.prompt("File Name:", o.Data.name+".fgm");
		if(!saveName) return;
		if(saveName.slice(-4) !== ".fgm") saveName += ".fgm";
		var newSaveData = {
			"data":mapStr,
			"saveTime": new Date().toISOString(),
			"saveName": saveName
		}
		
		var lsMapsData = tools.loadFromLS(FuzedGame.Config.LSKeys.editedMaps);
		if(lsMapsData) lsMapsData = JSON.parse(lsMapsData);
		if(lsMapsData && lsMapsData["maps"]) {
			for(var i in lsMapsData["maps"]) {
				if(lsMapsData["maps"][i]["saveName"] === newSaveData["saveName"] &&
					(!saveAs || dialog.confirm("The "+newSaveData["saveName"]+" file already exists in Web Storage. Do you want to overwrite it?")))
				{
					lsMapsData["maps"].splice(i, 1);
					break;
				}
			}
			lsMapsData["maps"].push(newSaveData)
		}
		else {
			lsMapsData = {"maps": [newSaveData]};
		}
		lsMapsData = JSON.stringify(lsMapsData);
		tools.saveToLS(FuzedGame.Config.LSKeys.editedMaps, lsMapsData);
		saveData = newSaveData;
		editorConsole.log("\""+saveName+"\" is saved.");
		DataEditor.cb.call("mapSaved");
		
		return JSON.stringify(newSaveData);
	}
	
	o.removeMapSaveFromLS = function(saveName) {
		var lsMapsData = tools.loadFromLS(FuzedGame.Config.LSKeys.editedMaps);
		if(lsMapsData) lsMapsData = JSON.parse(lsMapsData);
		if(lsMapsData && lsMapsData.maps) {
			for(var i in lsMapsData.maps) {
				if(lsMapsData.maps[i].saveName === saveName) {
					if(dialog.confirm("Delete "+saveName+"?")) {
						lsMapsData.maps.splice(i, 1);
						lsMapsData = JSON.stringify(lsMapsData);
						tools.saveToLS(FuzedGame.Config.LSKeys.editedMaps, lsMapsData);
						break;
					}
				}
			}
		}
	}
	
	function validateMap(){
		var havePlayer = false;
		var haveExit = false;
		var haveGround = false;
		var layer;
		var i;
		for(i in o.Data.layers) {
			if(o.Data.layers[i].isGround) {
				layer = o.Data.layers[i];
				break;
			}
		}
		for(i in layer.items) {
			var name = layer.items[i].name;
			if(name === "exit") haveExit = true;
			if(name === "player1" || name === "player2") havePlayer = true;
			if(name === "wall_top") haveGround = true;
		}
		if(!havePlayer || !haveExit || !haveGround) {
			var ret = "Error! The map don't have:"
			if(!havePlayer) ret += "\n\t-player";
			if(!haveExit) ret += "\n\t-exit";
			if(!haveGround) ret += "\n\t-ground";
			return ret;
		}
		else {
			return true;
		}
	}

	init();
	return o;
}()



//__Preview_________________________________________________

var preview = (function(){
	var p_o = {};
	var ctx = tools.createCtx();
	p_o.layer = tools.Sprite.create(ctx.canvas);
	p_o.layer.name = "preview";
	var layers = {};
	var cPalette = tools.spriteSheet.getImage(FuzedGame.spriteSheetName, "titleset.png");
	var cItems = tools.spriteSheet.getImage(FuzedGame.spriteSheetName, "items.png");
	var selectionRect = tools.Sprite.create();
	selectionRect.ctx = tools.createCtx();
	selectionRect.canvas = selectionRect.ctx.canvas;
	
	p_o.reset = function(){
		for(i in layers) {
			p_o.layer.remove(layers[i].layer);
			delete layers[i];
		}
		layers = {};
		for(var i in DataEditor.Data.layers) {
			createLayer(DataEditor.Data.layers[i].name);
		}
	}
	p_o.reset();
	
	p_o.layer.cb.add("mousedown", mDown);
	
	DataEditor.cb.add("itemsAdded", function onItemAdded(d){
		for(var i in d.items) {
			drawItem(d.layerName, d.items[i]);
		}
	})
	
	DataEditor.cb.add("itemsRemoved", function(d){
		drawLayer(d.layerName);
		p_o.layer.change();
	});
	DataEditor.cb.add("layersChange", function(){
		p_o.reset();
	});
	DataEditor.cb.add("mapLoaded", function(){
		p_o.reset();
	});
	
	DataEditor.cb.add("alphaChange", function(layerName){
		if(layers[layerName]) {
			layers[layerName].layer.alpha = DataEditor.getAlpha(layerName);
			layers[layerName].layer.change();
		}
	});
	
	p_o.getSelection = function(){
		if(!selectionRect.canvas.width || !selectionRect.canvas.height) return [];
		return {
			x: selectionRect.x,
			y: selectionRect.y,
			items: DataEditor.getItemsUnderRect(
				DataEditor.selectedLayerName,
				{
					x:selectionRect.x, 
					y:selectionRect.y, 
					w:selectionRect.canvas.width, 
					h:selectionRect.canvas.height
				}
			)
		}
	}
	
	
	function setLayerSequence(){
		var liveLayers = [];
		var i;
		for(i in DataEditor.Data.layers) {
			var l = DataEditor.Data.layers[i];
			liveLayers.push(l.name);
			if(!layers[l.name]) {
				// return createLayer(l.name);
				continue;
			}
			p_o.layer.add(layers[l.name].layer);
		}
		for(i in layers) {
			if(liveLayers.indexOf(i) === -1) {
				p_o.layer.remove(layers[i].layer);
				delete layers[i];
			}
		}
		p_o.layer.add(selectionRect);
		p_o.layer.change();
	}
	
	function createLayer(layerName) {
		layers[layerName] = {
			xOff:0, 
			yOff:0,
			ctx: tools.createCtx()
		};
		layers[layerName].layer = tools.Sprite.create(layers[layerName].ctx.canvas);
		layers[layerName].layer.name = "layer_"+layerName;
		drawLayer(layerName);
		setLayerSequence();
	}
	
	function drawLayer(layerName) {
		var l;
		for(var i in DataEditor.Data.layers)  {
			if(DataEditor.Data.layers[i].name === layerName) {
				l = DataEditor.Data.layers[i];
			}
		}
		
		var xMin=undefined, xMax=undefined, yMin=undefined, yMax=undefined; 
		var j, item;
		for(j in l.items) {
			item = l.items[j];
			if(xMin === undefined || item.x < xMin)          xMin = item.x;
			if(xMax === undefined || item.x + item.w > xMax) xMax = item.x + item.w;
			if(yMin === undefined || item.y < yMin)          yMin = item.y;
			if(yMax === undefined || item.y + item.h > yMax) yMax = item.y + item.h;
		}
		xMin = ~~xMin;
		xMax = ~~xMax;
		yMin = ~~yMin;
		yMax = ~~yMax;
		layers[l.name].ctx.canvas.width = xMax - xMin;
		layers[l.name].ctx.canvas.height = yMax - yMin;
		layers[l.name].xOff = xMin;
		layers[l.name].yOff = yMin;
		layers[l.name].layer.x = xMin;
		layers[l.name].layer.y = yMin;
		// layers[l.name].ctx.fillStyle = "rgba(155, 0, 155, .3)";
		// layers[l.name].ctx.fillRect(0, 0, xMax - xMin, yMax - yMin);
		for(j in l.items) {
			item = l.items[j];
			drawItem(l.name, item);
		}	
	}
	
	function drawItem(layerName, item) {
		var l = layers[layerName];
		//If the new item is out of the canvas.
		if (item.x < l.xOff || item.y < l.yOff ||
			item.x + item.w > l.ctx.canvas.width + l.xOff ||
			item.y + item.h > l.ctx.canvas.height + l.yOff) {
			return drawLayer(layerName);
		}
		
		if(item.type === "patch") {
			l.ctx.drawImage(cPalette, 
				item.sx, item.sy, item.w, item.h, 
				item.x - l.xOff, item.y - l.yOff, item.w, item.h);
		}
		if(item.type === "item") {
			l.ctx.drawImage(cItems, 
				item.sx, item.sy, item.w, item.h, 
				item.x - l.xOff, item.y - l.yOff, item.w, item.h);
		}
		p_o.layer.change();
	}
	
	function mDown(e) {
		var mde = e.clone();//mouseDownEvent
		var mdLoc = e.getLocal(p_o.layer);//local mouseDown position
		var d = {};//data
		switch(editorTools.getSelection()) {
			case editorTools.STAMP:
				d.items = DataEditor.getStampItems();
				for(var i in d.items){
					var item = d.items[i];
					item.x = item.x || 0;
					item.y = item.y || 0;
					if(d.itemsW < item.x + item.w || d.itemsW === undefined) d.itemsW = item.x + item.w;
					if(d.itemsH < item.y + item.h || d.itemsH === undefined) d.itemsH = item.y + item.h;
				}
				stamp(mdLoc);
				p_o.layer.stage.cb.add("mousemove", mMove_stamp);
				p_o.layer.stage.cb.add("mouseup", dragEnd_stamp);
				p_o.layer.stage.cb.add("mouseleave", dragEnd_stamp);
			break;
			case editorTools.MOVE:
				d.bx = p_o.layer.x;
				d.by = p_o.layer.y;
				p_o.layer.stage.cb.add("mousemove", mMove_move);
				p_o.layer.stage.cb.add("mouseup", dragEnd_move);
				p_o.layer.stage.cb.add("mouseleave", dragEnd_move);
			break
			case editorTools.SELECT:
				d.bx = ~~(mdLoc.x/16) * 16;
				d.by = ~~(mdLoc.y/16) * 16;
				if(mdLoc.x < 0) d.bx -= 16;
				if(mdLoc.y < 0) d.by -= 16;
				p_o.layer.stage.cb.add("mousemove", mMove_select);
				p_o.layer.stage.cb.add("mouseup", dragEnd_select);
				p_o.layer.stage.cb.add("mouseleave", dragEnd_select);
			break
		}
		
		function stamp(mLoc){
			var x = ~~(mLoc.x/16) * 16;
			var y = ~~(mLoc.y/16) * 16;
			if(mLoc.x < 0) x -= 16;
			if(mLoc.y < 0) y -= 16;
			var w = d.itemsW;
			var h = d.itemsH;
			if(d.lastStampPos) {
				var r = d.lastStampPos;
				if ((x === r.x && x == r.y) ||
					(x+w > r.x && x < r.x+w &&
					 y+h > r.y && y < r.y+h)) 
				{
					return;
				}
			}
			d.lastStampPos = {x:x, y:y};
			DataEditor.addItems(DataEditor.selectedLayerName, d.items, x, y);
		}
		
		function mMove_stamp(e){
			stamp(e.getLocal(p_o.layer));
		}
		
		function dragEnd_stamp(e){
			p_o.layer.stage.cb.remove("mousemove", mMove_stamp);
			p_o.layer.stage.cb.remove("mouseup", dragEnd_stamp);
			p_o.layer.stage.cb.remove("mouseleave", dragEnd_stamp);
		}
		
		function mMove_move(e) {
			p_o.layer.x = d.bx + e.x - mde.x;
			p_o.layer.y = d.by + e.y - mde.y;
			p_o.layer.change();
		}
		
		function dragEnd_move(e) {
			p_o.layer.x = ~~(p_o.layer.x / 16 + (p_o.layer.x > 0 ? .5 : -.5)) * 16;
			p_o.layer.y = ~~(p_o.layer.y / 16 + (p_o.layer.y > 0 ? .5 : -.5)) * 16;
			p_o.layer.change();
			p_o.layer.stage.cb.remove("mousemove", mMove_move);
			p_o.layer.stage.cb.remove("mouseup", dragEnd_move);
			p_o.layer.stage.cb.remove("mouseleave", dragEnd_move);
		}
		
		function mMove_select(e)
		{
			var p = e.getLocal(p_o.layer);
			var xDif = p.x - d.bx;
			var yDif = p.y - d.by;
			xDif += xDif < 0 ? -16 : 16;
			yDif += yDif < 0 ? -16 : 16;
			xDif = ~~(xDif / 16) * 16;
			yDif = ~~(yDif / 16) * 16;
			selectionRect.x = xDif < 0 ? d.bx + xDif : d.bx;
			selectionRect.y = yDif < 0 ? d.by + yDif : d.by;
			selectionRect.canvas.width = Math.abs(xDif);
			selectionRect.canvas.height = Math.abs(yDif);
			selectionRect.ctx.strokeStyle = "#ffffff";
			selectionRect.ctx.strokeRect(.5, .5, Math.abs(xDif)-1, Math.abs(yDif)-1);
			p_o.layer.change();
		}
		
		function dragEnd_select(e) {
			p_o.layer.stage.cb.remove("mousemove", mMove_select);
			p_o.layer.stage.cb.remove("mouseup", dragEnd_select);
			p_o.layer.stage.cb.remove("mouseleave", dragEnd_select);
		}
		
	}
	
	p_o.destroy = function() {
		p_o.layer.cb.remove("mousedown", mDown);
		DataEditor.cb.remove("itemAdded", onItemAdded);
	}
	
	return p_o;
}())

//__Tools___________________________________________________

var editorTools = (function(){
	var et_o = {};
	et_o.MOVE = "MOVE";
	et_o.SELECT = "SELECT";
	et_o.STAMP = "STAMP";
	et_o.cb = tools.create_callback();
	
	var hotkeys = FuzedGame.Config.hotkeys.dir.editor;
	var hcMatch = FuzedGame.Config.hotkeys.isMatch;
	var selection = et_o.STAMP;
	var btnNameList = [et_o.MOVE, et_o.SELECT, et_o.STAMP];
	var hotkeyPairs = {
		"MOVE": hotkeys.move,
		"SELECT": hotkeys.select,
		"STAMP": hotkeys.stamp
	}
	var btnList = [];
	function render(){
		var xPos = 0;
		for(var i in btnList) {
			var text = btnNameList[i];
			var hc =hotkeyPairs[btnNameList[i]];
			if(hc) {
				text += "(";
				if(hc.key) text += String.fromCharCode(hc.key);
				if(hc.ctrl) text += "+ctrl";
				if(hc.shift) text += "+shift";
				if(hc.alt) text += "+alt";
				text += ")";
			}
			btnList[i].write(text);
			btnList[i].layer.x = xPos;
			xPos += btnList[i].layer.w;
		}
		et_o.layer.setHitRect(0, 0, xPos, 16);
		et_o.layer.w = xPos;
	}
	
	function init() {
		et_o.layer = tools.Sprite.create();
		et_o.layer.name = "editor tools";
		et_o.layer.cb.add("click", onClick);
		et_o.layer.h = 16;
		
		for(var i in btnNameList) {
			var btn  = tools.ui.textBtn.create(btnNameList[i], onClick);
			btnList.push(btn);
			et_o.layer.add(btn.layer);
		}
		et_o.select(et_o.STAMP);
		render();
	}
	
	function onClick(btnName) {
		for(var idx in btnList) {
			if(btnList[idx].text === btnName) {
				et_o.select(~~idx);
				break;
			}
		}
	}
	
	function kDown(e){
		for(var i in hotkeyPairs) {
			if(hcMatch(e, hotkeyPairs[i])) {
				et_o.select(i);
				break;
			}
		}
	}
	
	et_o.activate = function(on) {
		if(on) render();
		FuzedGame.cb[(on ? "add" : "remove")]("keydown",  kDown);
	}
	
	et_o.select = function(idx)
	{console.log("et_o.select", idx);
		if(typeof(idx) !== "number") {
			idx = btnNameList.indexOf(idx);
		}
		if(idx < 0 || idx > btnNameList.length) return;
		
		for(var i in btnList) {
			btnList[i].toggle(i == idx);
		}
		
		selection = btnNameList[idx];
		et_o.cb.call("change", selection);
	}
	
	et_o.getSelection = function() {
		return selection;
	}
	
	et_o.destroy = function() {
		et_o.layer.cb.remove("click", onClick);
	}
	
	init();
	return et_o;
}())

var commandBtns = (function(){
	var _o = {};
	_o.layer = tools.Sprite.create();
	var btns = ["^RUN^", "SAVE", "SAVE_AS", "DOWNLOAD", "UPLOAD", "DEL", "CLEAR_ALL", "COPY", "UNDO", "REDO", "SWITCH_BG", "HELP", "EXIT"];
	var hotkeys = FuzedGame.Config.hotkeys.dir.editor;
	var hotkeyPairs = {
		"SAVE": hotkeys.save,
		"SAVE_AS": hotkeys.save_as,
		"DEL": hotkeys.del,
		"COPY": hotkeys.copy,
		"UNDO": hotkeys.undo,
		"REDO": hotkeys.redo,
		"EXIT": hotkeys.exit
	}
	var hcMatch = FuzedGame.Config.hotkeys.isMatch;
	var onClick = {};
	onClick["^RUN^"] = function(){
		var save = DataEditor.createMapCode();
		if(save) {
			var cmd = FuzedGame.mainframe.createCommand("game", {mapSaveCode: save});
			o.cb.call("exit", cmd);
		}
	}
	onClick["SAVE"] = function(){
		DataEditor.saveMap();
	}
	onClick["SAVE_AS"] = function(){
		DataEditor.saveMap(true);
	}
	onClick["DOWNLOAD"] = function(){
		var str = DataEditor.saveMap();
		if(!str) return;
		var d = new Date();
		var ts = d.getMonth()+"."+d.getDate()+"."+d.getHours()+"."+d.getMinutes();
		var sName = DataEditor.getMapName()+"_"+ts+".fgm";
		window["saveAs"](new Blob([str]), sName);
	}
	onClick["UPLOAD"] = function(){
		var data = {
			save_data: DataEditor.saveMap(),
			map_name: DataEditor.getMapName(),
			author_name: DataEditor.getAuthorName(),
			version_num: DataEditor.getVersionNum(),
			host: location.host || location.hostname
		}
		
		if(dialog.confirm(gui_texts.en.confirmMapUpload+
			"\nname: "+data.map_name+
			"\nauthor: "+data.author_name+
			"\nversion: "+data.version_num))
		{
			data.comment = dialog.prompt("Comment", "no comment");
			data.contact_mail =  dialog.prompt("Contact email (not required)", "your@mail.adr");
			$["post"](FuzedGame.Config.php.sendMap, data
			).success(function(){
				dialog.alert(gui_texts.en.successMapUpload);
			}).error(function(){
				dialog.alert(gui_texts.en.errorMapUpload);
			}).complete(function(e){
				console.log(e)
			})
		}
	}
	onClick["EXIT"] = function(){
		o.cb.call("exit");
	}
	onClick["UNDO"] = function(){
		DataEditor.undo();
	}
	onClick["REDO"] = function(){
		DataEditor.redo();
	}
	onClick["DEL"] = function(){
		DataEditor.removeItems(DataEditor.selectedLayerName, preview.getSelection().items);
	}
	onClick["CLEAR_ALL"] = function(){
		DataEditor.clearAll();
	}
	onClick["COPY"] = function(){
		var selection = preview.getSelection();
		var si = [];
		for(i in selection.items) {
			var item = selection.items[i];
			var newItem = item.clone();
			newItem.x -= selection.x;
			newItem.y -= selection.y;
			si.push(newItem);
		}
		DataEditor.setStampItems(si);
	}
	onClick["SWITCH_BG"] = function() {
		editorBg.switchPattern();
	}
	onClick["HELP"] = function() {
		dialog.showHelp(gui_texts.en.help.base || gui_texts.hu.help.base);
	}
	
	function kDown(e){
		for(var i in onClick) {
			if (i in hotkeyPairs &&
				hcMatch(e, hotkeyPairs[i]))
			{
				onClick[i]();
				break;
			}
		}
	}
	_o.layer.w = 0;
	_o.layer.h = 18*btns.length;
	for(var i in btns){
		var str = btns[i];
		btns[i] = tools.ui.textBtn.create(str, onClick[str]);
		_o.layer.add(btns[i].layer);
		btns[i].layer.x = -btns[i].layer.canvas.width;
		btns[i].layer.y = 18*i;
		
		if(_o.layer.w < str.length*16) _o.layer.w = str.length*16;
	}
	_o.layer.setHitRect(-_o.layer.w, 0, _o.layer.w, _o.layer.h);
	_o.layer.change();
	
	_o.activate = function(on){
		FuzedGame.cb[(on ? "add" : "remove")]("keydown",  kDown);
	}
	_o.destroy = function(){
		for(var i in btns){
			btns[i].destroy();
			delete btns[i];
		}
	}
	
	return _o;
}())

//__Windows_________________________________________________
windows.loadParams= function() {
	var json = tools.loadFromLS(FuzedGame.Config.LSKeys.editorWindows);
	var data;
	try{data = JSON.parse(json)}
	catch(e){data = windows.baseParams}
	
	for(var i in data) {
		var w = windows[i];
		var x = data[i]["x"];
		if(x < 0) x = 0;
		if(x + data[i]["w"] > FuzedGame.Config.fullWidth) x = FuzedGame.Config.fullWidth - data[i]["w"];
		var y = data[i]["y"];
		if(y < 0) y = 0;
		if(y + data[i]["h"] > FuzedGame.Config.fullHeight) y = FuzedGame.Config.fullHeight - data[i]["h"];
		if(w) {
			w.win.layer.x = x;
			w.win.layer.y = y;
			w.win.setSize(data[i]["w"], data[i]["h"]);
			w.win.setMinimized(data[i]["m"] == 1);
		}
	}
}
windows.onParamsChange = function(e) {
	windows.saveParams();
}
windows.saveParams = (function(){
	var save = function(){
		var wins = [windows.layers, windows.items, windows.open, windows.settings];
		var names = ["layers", "items", "open", "settings"];
		var params = {};
		for(var i in wins) {
			params[names[i]] = {
				"x": wins[i].win.layer.x,
				"y": wins[i].win.layer.y,
				"w": wins[i].win.getNormalW(),
				"h": wins[i].win.getNormalH(),
				"m": (wins[i].win.getIsMinimized() ? 1 : 0)
			}
		}
		var json = JSON.stringify(params);
		tools.saveToLS(FuzedGame.Config.LSKeys.editorWindows, json);
		
		windows.saveParams = wait;
		setTimeout(function() {
			if(windows.saveParams === wait) {
				windows.saveParams = save;
			} else {
				save();
			}
		}, 300);
	}
	var wait = function(){
		windows.savePramas = saveAgain;
	}
	var saveAgain = function(){};
	return save;
}());
windows.baseParams = {
	layers:{"x":3,"y":32,"w":185,"h":155,"m":0},
	items:{"x":1037,"y":164,"w":323,"h":434,"m":0},
	open:{"x":0,"y":332,"w":404,"h":285,"m":0},
	settings:{"x":2,"y":617,"w":403,"h":63,"m":0}
}

//__Layers_Win______________________________________________
windows.layers = (function(){
	var lw_o = {};
	var controlsStr;
	var ctxConrols;
	var controls;
	var cLayerBtns;
	var sLayerBtns;
	var LayerBtns;
	var LayerNames;
	var selectionShape;
	var selectionShapeCtx;
	
	function init(){
		lw_o.win = tools.ui.window.create("LAYERS", 120, 200, gui_texts.en.help.layers || gui_texts.hu.help.layers);
		lw_o.win.name = "layers_win";
		lw_o.win.layer.x = 16;
		lw_o.win.layer.y = 16;
		lw_o.win.cb.add("paramsChange", windows.onParamsChange);
		lw_o.win.layer.cb.add("mousedown", function(){lw_o.show(true)});
		
		controlsStr = "V+<>×";
		ctxConrols = tools.TextWriter.write(controlsStr);
		controls = tools.Sprite.create(ctxConrols.canvas);
		controls.name = "controls";
		lw_o.win.container.add(controls);
		controls.setHitRect(0, 0, controlsStr.length*16, 16);
		controls.cb.add("mousedown", controlClick);
		ctxConrols.clearRect(32, 0, 32, 16);
		ctxConrols.save();
		ctxConrols.translate(48, 0);
		ctxConrols.rotate(Math.PI/2);
		tools.TextWriter.write("«", 16, undefined, ctxConrols);
		ctxConrols.restore();
		ctxConrols.save();
		ctxConrols.translate(48, 16);
		ctxConrols.rotate(-Math.PI/2);
		tools.TextWriter.write("«", 16, undefined, ctxConrols);
		ctxConrols.restore();
		
		
		cLayerBtns = tools.createCtx().canvas;
		sLayerBtns = "";
		LayerBtns = tools.Sprite.create(cLayerBtns);
		LayerBtns.x = 2;
		LayerBtns.y = 16;
		LayerBtns.cb.add("mousedown", select);
		LayerBtns.name = "LayerBtns";
		lw_o.win.container.add(LayerBtns);
		
		selectionShapeCtx = tools.createCtx(2, 16);
		selectionShapeCtx.fillStyle = "#ffffff";
		selectionShapeCtx.fillRect(0,1,2,14);
		selectionShape = tools.Sprite.create(selectionShapeCtx.canvas);
		selectionShape.mouseEnabled = false;
		lw_o.win.container.add(selectionShape);
		DataEditor.cb.add("selectedLayerChange", lw_o.showSelection);
		DataEditor.cb.add("layersChange", lw_o.refresh);
		DataEditor.cb.add("mapLoaded", lw_o.refresh);
		
		lw_o.refresh();
		lw_o.showSelection();
	}
	
	function select(e){
		var pos = e.getLocal(LayerBtns);
		var selected = ~~(pos.y / 16);
		DataEditor.selectLayer(LayerNames[selected]);
		console.log("selected: "+selected);
	}
	
	function controlClick(e){
		var xp = e.getLocal(controls).x;
		var control = controlsStr.charAt(~~(xp/16));
		console.log("control: "+control);
		commands[control] && commands[control](control);
		return true;
	}
	var commands = {};
	commands["<"] = commands[">"] = function(control){
		var name = DataEditor.selectedLayerName;
		DataEditor.setLayerIdx(name, DataEditor.getLayerIdx(name) + (control === "<" ? -1 : 1));
	}
	commands["×"] = function(){
		DataEditor.removeLayer(DataEditor.selectedLayerName);
	}
	commands["+"] = function(){
		name = dialog.prompt("Layer name:", "LAYER");
		if(name) DataEditor.addLayer(name);
	}
	commands["V"] = function(){
		var alpha = DataEditor.getAlpha(DataEditor.selectedLayerName);
		(alpha === 0 && (alpha = .4)) ||
		(alpha === 1 && ((alpha = 0) || true)) ||
		(alpha = 1);
		console.log(alpha);
		DataEditor.setAlpha(DataEditor.selectedLayerName, alpha);
		setAlphaControlGraph();
	}
	
	function setAlphaControlGraph(){
		var alpha = DataEditor.getAlpha(DataEditor.selectedLayerName);
		ctxConrols.clearRect(0, 0, 16, 16);
		ctxConrols.globalAlpha = alpha || 1;
		tools.TextWriter.write("V", 16, undefined, ctxConrols);
		if(alpha === 0) tools.TextWriter.write("/", 16, undefined, ctxConrols);
		ctxConrols.globalAlpha = 1;
		controls.change();
	}
	
	lw_o.show = function(on){
		on ? addToTop(lw_o.win.layer) : o.layer.remove(lw_o.win.layer);
	}
	
	lw_o.showSelection = function() {
		selectionShape.y = 16 + LayerNames.indexOf(DataEditor.selectedLayerName) * 16;
		selectionShape.change();
		setAlphaControlGraph();
	}
	
	lw_o.refresh = function(){
		var str = "";
		var maxW = 0;
		LayerNames = [];
		for(var i in DataEditor.Data.layers) {
			if(i !== "0") str += "\n";
			var name = DataEditor.Data.layers[i].name;
			LayerNames.push(name);
			str += name;
			if(maxW < name.length) {
				maxW = name.length;
			}
		}
		if(str !== sLayerBtns){
			cLayerBtns.width = maxW * 16;
			cLayerBtns.height = DataEditor.Data.layers.length * 16;
			LayerBtns.setHitRect(0, 0, maxW*16, LayerNames.length*16);
			tools.TextWriter.write(str, 16, undefined, cLayerBtns.getContext("2d"));
		}
		lw_o.showSelection();
	}
	lw_o.destroy = function(){
		controls.cb.remove("click", controlClick);
		LayerBtns.cb.remove("mousedown", select);
		DataEditor.cb.remove("selectedLayerChange", lw_o.showSelection);
		DataEditor.cb.remove("layersChange", lw_o.refresh)
	}
	
	init()
	return lw_o;
});

//__Items_Win______________________________________________

windows.items = (function(){
	var iw_o = {};
	var onItemsPage = undefined;
	
	function init(){
		iw_o.win = tools.ui.window.create("ITEMS", 270, 200, gui_texts.en.help.items || gui_texts.hu.help.items);
		iw_o.win.layer.x = 300;
		iw_o.win.layer.y = 16;
		iw_o.win.cb.add("paramsChange", windows.onParamsChange);
		iw_o.win.layer.cb.add("mousedown", function(){iw_o.show(true)});
		modeSwitcher.onChange = modeSwitcherChange;
		onSelectedLayerChange(DataEditor.selectedLayerName);
		DataEditor.cb.add("selectedLayerChange", onSelectedLayerChange);
	}
	
	function modeSwitcherChange(mode){
		palette.selectionMode(mode === modeSwitcher.SELECT);
	}
	
	
	function onSelectedLayerChange(layerName) {
		var l = DataEditor.getLayer(layerName);
		if(onItemsPage !== Boolean(l.isGround)) {
			onItemsPage = Boolean(l.isGround);
			if(onItemsPage) {
				iw_o.win.container.remove(palette.layer);
				iw_o.win.container.remove(modeSwitcher.layer);
				iw_o.win.container.add(items.layer);
				items.reuseStamp();
			}
			else {
				iw_o.win.container.add(palette.layer);
				iw_o.win.container.add(modeSwitcher.layer);
				palette.reuseStamp();
				iw_o.win.container.remove(items.layer);
			}
		}
	}
	
	var modeSwitcher = (function(){
		var _o = {
			SELECT: 0,
			SEARCH: 1
		};
		var cSelect = tools.TextWriter.write("SELECT").canvas;
		var cSearch = tools.TextWriter.write("SEARCH").canvas;
		var mode = -1;
		_o.layer = tools.Sprite.create();
		_o.layer.setHitRect(0, 0, 6*16, 16);
		_o.layer.cb.add("click", onClick);
		_o.layer.name = "modeSwitcher";
		
		_o.change = function(m) {
			if(m > 1 || m < 0) m = 0;
			if(m === mode) return;
			if(m === _o.SELECT) _o.layer.canvas = cSelect;
			if(m === _o.SEARCH) _o.layer.canvas = cSearch;
			mode = m;
			if(_o.onChange) _o.onChange(mode);
			_o.layer.change();
		}
		_o.getMode = function() {
			return mode;
		}
		function onClick(e) {
			_o.change(mode+1)
		}
		_o.destroy = function() {
			_o.layer.cb.remove("click", onClick);
		}
		_o.change(0);
		return _o;
	}())
	
	var palette = (function(){
		var _o = {};
		_o.layer = tools.Sprite.create();
		_o.layer.name = "palette";
		var cTitleset = tools.spriteSheet.getImage(FuzedGame.spriteSheetName, "titleset.png");
		var bgPat = tools.createCtx(16, 16);
		bgPat.fillStyle = "#434343";
		bgPat.fillRect(0, 0, 16, 16);
		bgPat.beginPath();
		bgPat.fillStyle = "#767676";
		bgPat.moveTo(0, 0);
		bgPat.lineTo(16, 0);
		bgPat.lineTo(0, 16);
		bgPat.fill();
		bgPat.closePath();
		bgPat = bgPat.createPattern(bgPat.canvas, "repeat");
		_o.layer.ctx = tools.createCtx(cTitleset.width, cTitleset.height);
		_o.layer.ctx.fillStyle = bgPat;
		_o.layer.ctx.fillRect(0, 0, cTitleset.width, cTitleset.height);
		_o.layer.ctx.drawImage(cTitleset, 0, 0);
		cTitleset = undefined;
		_o.layer.canvas = _o.layer.ctx.canvas;
		var selectionRectCtx = tools.createCtx();
		var selectionRect = tools.Sprite.create(selectionRectCtx.canvas);
		selectionRect.name = "selectionRect";
		selectionRect.mouseEnabled = false;
		_o.layer.add(selectionRect);
		
		var lastStamp;
		_o.reuseStamp = function(){
			if(lastStamp) DataEditor.setStampItems(lastStamp);
		}
		
		function init(){
			_o.selectionMode(true);
		}
		
		_o.selectionMode = function(on){
			_o.layer.cb.remove("mousedown", mDownSelect);
			_o.layer.cb.remove("mousedown", mDownSearch);
			if(on) {
				_o.layer.cb.add("mousedown", mDownSelect);
			} else {
				_o.layer.cb.add("mousedown", mDownSearch);
			}
		}
		
		//__Select____________________________________________________
		
		function mDownSelect(e){
			var mdp = e.getLocal(_o.layer);
			var sx = ~~(mdp.x / 16) * 16;
			var sy = ~~(mdp.y / 16) * 16;
			_o.layer.stage.cb.add("mousemove", mMove);
			_o.layer.stage.cb.add("mouseup", end);
			_o.layer.stage.cb.add("mouseleave", end);
			
			function mMove(e) {
				var p = e.getLocal(_o.layer);
				var xDif = p.x - sx;
				var yDif = p.y - sy;
				xDif += xDif < 0 ? -16 : 16;
				yDif += yDif < 0 ? -16 : 16;
				xDif = ~~(xDif / 16) * 16;
				yDif = ~~(yDif / 16) * 16;
				selectionRect.x = xDif < 0 ? sx + xDif : sx;
				selectionRect.y = yDif < 0 ? sy + yDif : sy;
				selectionRectCtx.canvas.width = Math.abs(xDif);
				selectionRectCtx.canvas.height = Math.abs(yDif);
				selectionRectCtx.strokeStyle = "#ffffff";
				selectionRectCtx.strokeRect(.5, .5, Math.abs(xDif)-1, Math.abs(yDif)-1);
				_o.layer.change();
				
				lastStamp = [DataEditor.createItem({
					type: "patch",
					sx: selectionRect.x,
					sy: selectionRect.y,
					w: Math.abs(xDif),
					h: Math.abs(yDif)
				})];
				_o.reuseStamp();
				
				return true;
			}
			
			function end(e) {
				_o.layer.stage.cb.remove("mousemove", mMove);
				_o.layer.stage.cb.remove("mouseup", end);
				_o.layer.stage.cb.remove("mouseleave", end);
				return true;
			}
			
			return true;
		}
		
		
		//__Search____________________________________________________
		
		function mDownSearch(e){
			var mde = e.clone();
			var sx = _o.layer.x;
			var sy = _o.layer.y;
			_o.layer.stage.cb.add("mousemove", mMove);
			_o.layer.stage.cb.add("mouseup", end);
			_o.layer.stage.cb.add("mouseleave", end);
			
			function mMove(e) {
				_o.layer.x = sx + (e.x - mde.x);
				_o.layer.y = sy + (e.y - mde.y);
				_o.layer.change();
				return true;
			}
			
			function end(e) {
				_o.layer.stage.cb.remove("mousemove", mMove);
				_o.layer.stage.cb.remove("mouseup", end);
				_o.layer.stage.cb.remove("mouseleave", end);
				return true;
			}
			
			return true;
		}
		
		_o.destroy = function(){
			_o.layer.cb.remove("mousedown", mDownSelect);
			_o.layer.cb.remove("mousedown", mDownSearch);
		}
		
		init();
		return _o;
	}())
	
	var items = (function() {
		var _o = {};
		_o.layer = tools.Sprite.create();
		
		_o.lItems = tools.Sprite.create();
		_o.lItems.canvas = tools.spriteSheet.getImage(FuzedGame.spriteSheetName, "items.png");
		_o.layer.add(_o.lItems);
		_o.lItems.cb.add("mousedown", mDown);
		_o.layer.change();
		
		var selectRect = tools.Sprite.create();
		selectRect.ctx = tools.createCtx(1, 1);
		selectRect.canvas = selectRect.ctx.canvas;
		selectRect.mouseEnabled = false;
		_o.layer.add(selectRect);
		
		var lastStamp;
		_o.reuseStamp = function(){
			if(lastStamp) DataEditor.setStampItems(lastStamp);
		}
		
		function mDown(e){
			var p = e.getLocal(_o.lItems);
			var map = FuzedGame.Config.itemsMap;
			var name;
			for(var i in map) {
				if (map[i].p[0] < p.x && map[i].p[1] < p.y &&
					map[i].p[0] + map[i].p[2] > p.x &&
					map[i].p[1] + map[i].p[3] > p.y) 
				{
					name = i;
					break;
				}
			}
			if(!name) return;
			var itemData = map[name];
			var itemSource = {
				type: "item",
				name: name,
				sx: itemData.p[0],
				sy: itemData.p[1],
				w: itemData.p[2],
				h: itemData.p[3]
			}
			lastStamp = [DataEditor.createItem(itemSource)];
			_o.reuseStamp();
			
			selectRect.x = itemSource.sx;
			selectRect.y = itemSource.sy;
			selectRect.canvas.width = itemSource.w;
			selectRect.canvas.height = itemSource.h;
			selectRect.ctx.strokeStyle = "#ffffff";
			selectRect.ctx.strokeRect(.5, .5, itemSource.w-1, itemSource.h-1);
			selectRect.change();
			return true;
		}
		_o.destroy = function(){
			_o.lItems && _o.lItems.cb.remove("mousedown", mDown);
		}
		return _o;
	}());
	
	iw_o.destroy = function(){
		delete modeSwitcher.onChange;
		DataEditor.cb.remove("selectedLayerChange", onSelectedLayerChange)
		palette.destroy();
		items.destroy();
		commandBtns.destroy();
		modeSwitcher.destroy();
	}
	
	iw_o.show = function(on){
		on ? addToTop(iw_o.win.layer) : o.layer.remove(iw_o.win.layer);
	}
	
	init();
	return iw_o;
})

//__Open Win______________________________________________

windows.open = (function(){
	var ow_o = {};
	var mapsData = {"maps":[]};
	
	var deleteBtn = tools.ui.textBtn.create("DELETE SELECTED SAVE", function(name){
		DataEditor.removeMapSaveFromLS(btnList.getLastSelected());
		ow_o.refresh();
	});
	
	var openFileBtn = tools.ui.textBtn.create("OPEN FILE", function(name){
		$("#fileElem")["click"]();
	});
	openFileBtn.layer.y = 16;
	
	var border = tools.Sprite.create();
	border.ctx = tools.createCtx(300, 1);
	border.ctx.strokeStyle = "#aa0000";
	border.ctx.beginPath();
	border.ctx.moveTo(0, .5);
	border.ctx.lineTo(300, .5);
	border.ctx.stroke();
	border.canvas = border.ctx.canvas;
	border.y = 33;
	border.mouseEnabled = false;
	border.name = "border";
	
	var btnList = tools.ui.selectList.create();
	btnList.toggleLastSelected(true)
	btnList.layer.y = 35;
	
	
	function init(){
		ow_o.win = tools.ui.window.create("OPEN", 180, 230, gui_texts.en.help.open || gui_texts.hu.help.open);
		ow_o.win.layer.x = 500;
		ow_o.win.layer.y = 16;
		ow_o.win.cb.add("paramsChange", windows.onParamsChange);
		ow_o.win.layer.cb.add("mousedown", function(){ow_o.show(true)});
		ow_o.win.container.add(border)
		ow_o.win.container.add(btnList.layer)
		ow_o.win.container.add(deleteBtn.layer)
		ow_o.win.container.add(openFileBtn.layer)
		ow_o.refresh();
		DataEditor.cb.add("mapSaved", ow_o.refresh);
	}
	ow_o.refresh = function () {
		var lsData = tools.loadFromLS(FuzedGame.Config.LSKeys.editedMaps);
		if(lsData) mapsData = JSON.parse(lsData);
		btnList.removeAll();
		for(var i in mapsData["maps"]) {
			if(!mapsData["maps"][i]) {
				mapsData["maps"].slice(i, 1);
				--i;
				continue;
			}
			var md = mapsData["maps"][i];
			btnList.add(md["saveName"]);
		}
	}
	btnList.onClick = function(name) {
		for(var i in mapsData["maps"]) {
			if(mapsData["maps"][i]["saveName"] === name) {
				DataEditor.openSave(JSON.stringify(mapsData["maps"][i]));
			}
		}
	}
	ow_o.show = function(on){
		on ? addToTop(ow_o.win.layer) : o.layer.remove(ow_o.win.layer);
	}
	init();
	return ow_o;
})

//__Settings Win______________________________________________

windows.settings = (function(){
	var sw_o = {};
	var nameBtn = tools.ui.textBtn.create("NAME: "+DataEditor.getMapName(), function(){
		var newName = dialog.prompt("Map name:", DataEditor.getMapName());
		if(newName) {
			DataEditor.setMapName(newName);
		}
	});
	var bgBtn = tools.ui.textBtn.create("BACKGROUND: "+DataEditor.getBgType(), function(){
		var bgIdx = FuzedGame.Config.BG_TYPES.indexOf(DataEditor.getBgType());
		bgIdx = bgIdx === -1 ? 0 : (bgIdx+1) % FuzedGame.Config.BG_TYPES.length;
		DataEditor.setBgType(FuzedGame.Config.BG_TYPES[bgIdx]);
		// refresh();
	});
	bgBtn.layer.y = 16;
	var authorBtn = tools.ui.textBtn.create("AUTHOR: "+DataEditor.getAuthorName(), function(){
		var newName = dialog.prompt("Your name:", DataEditor.getAuthorName());
		if(newName) {
			DataEditor.setAuthorName(newName);
		}
	});
	authorBtn.layer.y = 32;
	var versionBtn = tools.ui.textBtn.create("VERSION: "+DataEditor.getVersionNum(), function(){
		var newNum = dialog.prompt("Map version number:", DataEditor.getVersionNum());
		if(newNum) {
			DataEditor.setVersionNum(newNum);
		}
	});
	versionBtn.layer.y = 48;
	
	function refresh(){
		nameBtn.write("NAME: "+DataEditor.getMapName());
		bgBtn.write("BACKGROUND: "+DataEditor.getBgType());
		authorBtn.write("AUTHOR: "+DataEditor.getAuthorName());
		versionBtn.write("VERSION: "+DataEditor.getVersionNum());
	}
	
	function init(){
		sw_o.win = tools.ui.window.create("SETTINGS", 180, 120, gui_texts.en.help.settings || gui_texts.hu.help.settings);
		sw_o.win.layer.x = 500;
		sw_o.win.layer.y = 400;
		sw_o.win.cb.add("paramsChange", windows.onParamsChange);
		sw_o.win.layer.cb.add("mousedown", function(){sw_o.show(true)});
		sw_o.win.container.add(nameBtn.layer);
		sw_o.win.container.add(bgBtn.layer);
		sw_o.win.container.add(authorBtn.layer);
		sw_o.win.container.add(versionBtn.layer);
		sw_o.win.layer.change();
		DataEditor.cb.add("mapLoaded", refresh);
		DataEditor.cb.add("mapDatasChange", refresh);
	}
	
	sw_o.show = function(on){
		on ? addToTop(sw_o.win.layer) : o.layer.remove(sw_o.win.layer);
	}
	init();
	return sw_o;
})



//__Console_________________________________________________________________________

var editorConsole = (function(){
	var ec = {};
	var PIp2 = Math.PI/2;
	ec.layer = tools.Sprite.create();
	ec.layer.mouseEnabled = false;
	var logs = [];
	ec.log = function(str){
		var logLayer =  tools.Sprite.create(tools.TextWriter.write(str).canvas);
		logLayer.y = (ec.layer[0] && ec.layer[0].y + 16) || ec.layer.h;
		var alphaState = 0;
		var renderStart = +new Date();
		logLayer.onDraw = function(){
			alphaState = (+new Date() - renderStart) / 4000;
			if(alphaState >= 1) {
				if(ec.layer) ec.layer.remove(logLayer);
				delete logLayer.onDraw;
				var idx = logs.indexOf(logLayer);
				if(idx >= 0) logs.splice(idx, 1);
				logLayer.destroy();
			} else {
				logLayer.alpha = Math.cos(alphaState*PIp2);
				logLayer.change();
			}
		}
		logs.unshift(logLayer);
		ec.layer.add(logLayer);
		ec.layer.onDraw = move;
	}
	ec.setHeight = function(h) {
		ec.layer.h = h;
		move();
	}
	
	function move(){
		if(!logs.length) return;
		var dist = logs[0].y - (ec.layer.h - 16);
		if(dist < 1) {
			delete ec.layer.onDraw;
		}
		else {
			dist /= 2;
		}
		for(var i in logs) {
			logs[i].y -= dist;
		}
		ec.layer.change();
	}
	
	return ec;
}())

//_____________________________________________________________________________

var dialog = (function(){
	return {
		alert: function(text){
			window.alert(text);
		},
		confirm: function(text){
			return window.confirm(text);
		},
		prompt: function(text, base){
			return window.prompt(text, base);
		},
		showHelp: function(text) {
			window.alert(text);
		}
	}
}())

//_____________________________________________________________
var gui_texts = {
	en: {
		confirmMapUpload: "Do you want to upload this map?",
		successMapUpload: "Your map is uploaded! Its be appear in the game soon as possible.",
		errorMapUpload: "Some kind of error incurred under upload. Please download and send your work to fuzedmap@azazdeaz.hu. Thanks!",
		help:{
			base: ["With the headline buttons in the left corner you can move (MOVE), select (SELECT) and add item to (STAMP) the gamefield."
,"For more help press the button ‘?’ upside on every window."
,"If you are ready with your gamemap, you can upload (UPLOAD) it or e-mail it to fuzedmap@azazdeaz.hu."
,"If you find any bug or need help contact fuzed@azazdeaz.hu."
,"Good luck!"].join("\n")
			,open: ["This window is for the saved files.",
"You can open (\"clicking on the filename\") and delete the files from your browser’s memory (DELETE SELECTED).",
"For the downloaded files use the OPEN FILES.",
"Opening the file by draging it to the browser’s screen is also possible."].join("\n")
			,layers: ["This window is for adding new layer (+) and editing the different layers.",
"V: changes the opacity of the selected layer.",
"↑,↓:  change the sequence of the layers",
"x: deletes the selected layer."].join("\n")
			,items: ["Here you can choose what kind of item you would  like to add (STAMP) on the selected layer.",
"By selecting the GROUND layer in the layerwindow you can see the active items.",
"If you choose any other layer, but the groundlayer, you can see the decorating items. ",
"By using the buttons in the left corner upside you can decide to search (SEARCH) or select (SELECT) from the decorating items. "].join("\n")
			,settings: "You can set the information of the gamemap."
		}
	},
	hu: {
		help :{
			base: ["A bal felső menüvel tudsz választani, hogy a szerkesztő felületet mozgatni szeretnéd (MOVE), kijelölni rajta (SELECT), vagy rajzolni rá (STAMP)."
,"A jobb felső sarokban a szokásos szerkesztő eszközöket találod."
,"Az ablakokhoz tartozó segítséget a bal felső sarkukban lévő ?-re kattintva láthatod. "
,"Ha elkészültél egy pályával feltöltheted az UPLOAD gombbal, vagy elküldheted emailban a fuzedmap@azazdeaz.hu címre. Ha bármi problémád adódik a kontakt cím fuzed@azazdeaz.hu. "
,"Jó pálya szerkesztést!"].join("\n")
			,open: "Itt láthatod és törölheted a böngésző memóriájában lévő mentéseket, illetve megnyithatod a letöltött mentéseket ha az OPEN FILE gombra kattintasz vagy behúzod a böngészőablakba."
			,layers: "Itt választhatod ki, hogy melyik réteget szeretnéd szerkeszteni. Változtathatod a rétegek pozícióját, láthatóságát, törölhetsz, vagy újakat adhatsz a pályához. A GROUND layer speciális, nem lehet törölni és csak ezen lehetnek a pálya aktív elemei (pl.: ellenségek, falak)."
			,items: "Itt választhatod ki, hogy milyen elemet szeretnél a kijelölt rétegre festeni. Ha a GROUND réteget választottad a LAYERS ablakban, a játék aktív elemei jelennek meg, ha mást akkor a díszítő elemek. Ekkor a bal felső sarokban lévő kapcsolóval választhatsz, hogy keresni, vagy kijelölni akarsz."
			,settings: "A pálya adatait állíthatod be."
		}
	}
}

//_____________________________________________________________

function onFileElemChange(e) {
	handleFiles(e.target.files);
}

function onDropFile(e) {
	// console.log(e);
	handleFiles(e.dataTransfer.files);
}

function handleFiles(files) {
	var file = files[0]; 
	if (file) {
		var r = new FileReader();
		r.onload = function(e) { 
			DataEditor.openSave(e.target.result);
		}
		r.readAsText(file);
    } else { 
        dialog.alert("Failed to load file");
    }
}

o.activate = function(){
	FuzedGame.cb.add("resize", render);
	FuzedGame.cb.add("drop", onDropFile);
	o.layer.mouseEnabled = true;
	editorTools.activate(true);
	commandBtns.activate(true);
	var delMe = $("#fileElem")
	$("#fileElem")["on"]("change", onFileElemChange);
}

o.destroy = function(){
	FuzedGame.cb.remove("resize", render);
	FuzedGame.cb.remove("drop", onDropFile);
	o.layer.mouseEnabled = false;
	editorTools.activate(false);
	commandBtns.activate(false);
	$("#fileElem")["off"]("change", onFileElemChange);
}

init();
return o;
}// end of MapEditor.create
return mapEditor_global;
}());// end of MapEditor
