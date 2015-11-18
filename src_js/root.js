// window.$  = $;
var FuzedGame = window.FuzedGame = window["FuzedGame"] = window.FuzedGame || {};
FuzedGame.Screens = FuzedGame.Screens || {};
(function(){
var o = window.FuzedGame;
o.cb = tools.create_callback();
o.update = false;
o.init = function(ctx)
{
//__Init_______________________________________________________________________________________________________________
	o.isReady = tools.createIsReady();
	o.spriteSheetName = "sg_sheet";
	
	function init() {
		// o.supportTest();
		tools.setupRequestAnimationFrame();
		o.stage = window["FuzedGame"]["stage"] = tools.Sprite.create(ctx.canvas);
		o.stage.name = "stage";
		tools.Sprite.setToStage(o.stage);
		
		o.mainframe.executeCommand(o.mainframe.createCommand("mainMenu"));
		o.stage.draw(ctx);
		o.contentLayer = undefined;
		o.cb.add("resize", o.onResizeEvt);
		o.isReady.turnToReady();
		
		$(document.body)["on"]("keydown", function(e){
			o.cb.call("keydown", e);
			return o.Config.hotkeys.usedCodes.indexOf(e.keyCode) < 0;
		});
		$(document.body)["on"]("keyup", function(e){o.cb.call("keyup", e)});
		
		for(var i in o.Config.sfx) {
			tools.audio.load(o.Config.sfx[i]);
		}
		o.cb.call("inited");
	}
	
	o.startFade = function(afterShot) {
		var coverCtx = tools.createCtx(o.Config.fullWidth, o.Config.fullHeight);
		o.stage.draw(coverCtx);
		if(afterShot) afterShot();
		var layer = tools.Sprite.create(coverCtx.canvas);
		o.stage.add(layer);
		layer.mouseEnabled = false;
		var rects = [];
		var step = 8;
		for(var i = 0, il = o.Config.fullWidth/step; i < il; ++i) {
			for(var j = 0, jl = o.Config.fullHeight/step; j < jl; ++j) {
				rects.push(i*step, j*step);
			}
		}
		var totalRects = rects.length;
		var animState = 0;
		var l;
		// var lastRenderTime = +new Date();
		layer.onDraw = function() {
			// animState += (+new Date() - lastRenderTime) / 700;
			// lastRenderTime = +new Date();
			animState += .1;
			if(animState >= 1) {
				animState = 1;
				l = rects.length
			}
			else {
				l = rects.length - ~~(totalRects * Math.cos(animState*Math.PI/2));
			}
			
			while(l--) {
				var p = rects.splice(~~(rects.length/2 * Math.random())*2, 2);
				coverCtx.clearRect(p[0], p[1], step, step);
			}
			
			if(!rects.length){
				o.stage.remove(layer);
				layer.destroy();
				coverCtx = undefined;
			}
			else {
				layer.change();
			}
		}
		o.stage.change();
		return layer;
	}
	
	o.onResizeEvt = function() {
		if(o.contentLayer && o.contentLayer.w) {
			o.contentLayer.x = Math.floor((FuzedGame.Config.fullWidth - o.contentLayer.w)/2);
			o.contentLayer.y = Math.floor((FuzedGame.Config.fullHeight - o.contentLayer.h)/3);
			o.contentLayer.change();	
		}
	}
	
	
//__Screens___________________________________________________________________________________________________________
	o.Screens = o.Screens || {};
	// o.Screens.Menu = (function() {
		// var mainMenu_global = {};
		
		// mainMenu_global.create = function() {
			// var mm = {};
			// mm.cb = tools.create_callback();
			// mm.layer = new tools.Sprite.create();
			// mm.layer.w = FuzedGame.Config.gameWidth;
			// mm.layer.h = FuzedGame.Config.gameHeight;
			// mm.layer.name = "menu";
			// mm.bg = tools.Sprite.create(
				// tools.spriteSheet.getImage(FuzedGame.spriteSheetName, "title_screen.jpg"));
			// mm.layer.add(mm.bg, 0);
			// tools.Loader.loadImg(
				// tools.Loader.paths.gui + "title_screen.jpg", 
				// function(img) {
					// mm.bg = tools.Sprite.create(img);
					// mm.layer.add(mm.bg, 0);
				// }
			// )
			
			// mm.buttons = ["SINGLE PLAY", "MULTIPLAY", "SETTINGS", "MAP EDITOR", "ABOUT"];
			// for(var i = 0; i < mm.buttons.length; ++i) {
				// var btn = tools.ui.textBtn.create(mm.buttons[i], btnClick);
				// btn.layer.y = (18 * i + 190);
				// btn.layer.x = (230);
				// btn.layer.hitRect.y -= 1;
				// btn.layer.hitRect.h += 2;
				// mm.layer.add(btn.layer);
				// mm.buttons[i] = btn;
			// }
			
			// function btnClick(name){
				// switch(name) {
					// case "MAP EDITOR":
					// var cmd = o.mainframe.createCommand("editor");
					// o.mainframe.executeCommand(cmd);
					// mm.cb.call("exit", cmd);
					// break;
					
					// case "SINGLE PLAY":
					// var cmd = o.mainframe.createCommand("game", {
						// mapSaveCode: o.testmaps.f
					// });
					// mm.cb.call("exit", cmd);
					// break;
					
					// case "MULTIPLAY":
					// var cmd = o.mainframe.createCommand("singlePlayer");
					// mm.cb.call("exit", cmd);
					// break;
					
					// case "SETTINGS":
					// var cmd = o.mainframe.createCommand("settings");
					// mm.cb.call("exit", cmd);
					// break;
				// }
			// }
			
			// mm.destroy = function(){
				// for(var i in mm.buttons) {
					// mm.buttons[i].destroy();
					// delete mm.buttons[i];
				// }
			// };
			// return mm;
		// }
		// return mainMenu_global;
	// }())
	
	o.Screens.Submenu = (function() {
		var screens_global = {};
		screens_global.create = function(btnDatas, bgType){
			var sm = {};
			sm.cb = tools.create_callback();
			sm.layer = tools.Sprite.create();
			sm.layer.w = FuzedGame.Config.gameWidth;
			sm.layer.h = FuzedGame.Config.gameHeight;
			
			switch(bgType) {
				case "transparentBlack":
				sm.layer.ctx = tools.createCtx(o.Config.gameWidth, o.Config.gameHeight);
				sm.layer.ctx.fillStyle = "rgba(0, 0, 0, .4)";
				sm.layer.ctx.fillRect(0, 0, o.Config.gameWidth, o.Config.gameHeight);
				sm.layer.canvas = sm.layer.ctx.canvas;
				break;
				
				case "titleScreen":
				sm.layer.canvas = tools.spriteSheet.getImage(FuzedGame.spriteSheetName, "title_screen.jpg");
				var versionText = tools.Sprite.create(tools.TextWriter.write("BETA 0.8").canvas);
				versionText.x = sm.layer.canvas.width - versionText.canvas.width;
				versionText.y = sm.layer.canvas.height - 16;
				sm.layer.add(versionText);
				var text2 = tools.Sprite.create(tools.TextWriter.write("HTML5 DEMO").canvas);
				text2.y = sm.layer.canvas.height - 16;
				sm.layer.add(text2);
				break;
				
				default:
				sm.layer.canvas = tools.spriteSheet.getImage(FuzedGame.spriteSheetName, "generic_menus.jpg");
			}
			var btnNames = [];
			for(var i in btnDatas) {
				btnNames.push(btnDatas[i].name);
			}
			var btnList = tools.ui.selectList.create(btnNames, tools.ui.selectList.ALIGN_MIDDLE);
			sm.layer.add(btnList.layer);
			btnList.layer.x = ~~(o.Config.gameWidth - btnList.layer.w)/2;
			btnList.layer.y = ~~(o.Config.gameHeight - btnList.layer.h)/2;
			btnList.onClick = function(name) {
				btnData = sreachBtnData(btnDatas, name);
				if(btnData) {
					if(btnData.command) {
						sm.cb.call("exit", btnData.command);
					}
					if(btnData.onClick) {
						btnData.onClick();
					}
				}
			}
			
			sm.destroy = function(){
				btnList.destroy();
				sm.layer.destroy();
			}
			return sm;
		}
		
		function sreachBtnData(list, name) {
			for(var i in list) {
				if(list[i].name === name) return list[i];
			}
		}
		return screens_global;
	}());
	
	o.Screens.ControllSettings = (function(){
		var cs_global = {};
		cs_global.create = function(){
			var cs = {};
			cs.cb = tools.create_callback();
			cs.layer = tools.Sprite.create();
			cs.layer.canvas = tools.spriteSheet.getImage(FuzedGame.spriteSheetName, "generic_menus.jpg");
			cs.layer.setMaskRect(0, 0, FuzedGame.Config.gameWidth, FuzedGame.Config.gameHeight);
			cs.layer.w = FuzedGame.Config.gameWidth;
			cs.layer.h = FuzedGame.Config.gameHeight;
			var bgCtx = cs.layer.canvas.getContext("2d");
			var setters = [];
			var selectedSetter;
			cs.layer.cb.add("mousedown", deselectSetter);
			
			function deselectSetter() {
				if(selectedSetter) selectedSetter.deselect();
			}
			
			//player 1
			var i, j, r, keyNames;
			bgCtx.save();
			bgCtx.translate(16, 112);
			tools.TextWriter.write("PLAYER1", 16, undefined, bgCtx);
			bgCtx.restore();
			j = 0;
			r = o.Config.hotkeys.dir.player1;
			keyNames = ["up","left","right","bomb","dynamite","mine"];
			for(i in r) {
				var setter = createSetter(keyNames.shift(), r[i]);
				setters.push(setter);
				setter.layer.y = 144 + j++ * 18;
				cs.layer.add(setter.layer);
			}
			//player2
			bgCtx.save();
			bgCtx.translate(16, 284);
			tools.TextWriter.write("PLAYER2", 16, undefined, bgCtx);
			bgCtx.restore();
			j = 0;
			r = o.Config.hotkeys.dir.player2
			keyNames = ["up","left","right","bomb","dynamite","mine"]
			for(i in r) {
				var setter = createSetter(keyNames.shift(), r[i]);
				setters.push(setter);
				setter.layer.y = 316 + j++ * 18;
				cs.layer.add(setter.layer);
			}
			
			var halfPos = FuzedGame.Config.gameWidth/2;
			//pause
			var pauseSetter = createSetter("pause", o.Config.hotkeys.dir.pause);
			pauseSetter.layer.x = halfPos;
			pauseSetter.layer.y = 112;
			cs.layer.add(pauseSetter.layer);
			
			//editor
			keyNames = ["move","select","stamp","save","save_as","del","copy","undo","redo","exit"]
			bgCtx.save();
			bgCtx.translate(halfPos+16, 144);
			tools.TextWriter.write("EDITOR", 16, undefined, bgCtx);
			bgCtx.restore();
			j = 0;
			r = o.Config.hotkeys.dir.editor
			for(i in r) {
				var setter = createSetter(keyNames.shift(), r[i]);
				setters.push(setter);
				setter.layer.x = halfPos;
				setter.layer.y = 176 + j++ * 18;
				cs.layer.add(setter.layer);
			}
			//controls
			var btnList = tools.ui.selectList.create(
				["RESET", "EXIT"], 
				tools.ui.selectList.ALIGN_RIGHT
			);
			btnList.onClick = function(name) {
				if(name === "RESET") {
					FuzedGame.Config.hotkeys.reset();
					for(var i in setters) setters[i].refresh();
				}
				else if(name === "EXIT") {
					cs.cb.call("exit");
				}
			}
			btnList.layer.x = FuzedGame.Config.gameWidth - (btnList.layer.w+16);
			btnList.layer.y = 388;
			cs.layer.add(btnList.layer);
			
			function createSetter(name, data) {
				var o = tools.ui.textBtn.create(getText(), function(){
					if(selectedSetter) selectedSetter.deselect();
					selectedSetter = o;
					o.toggle(true);
					FuzedGame.cb.add("keydown", o.setKeyCode);
					return true;
				})
				o.deselect = function() {
					o.toggle(false);
					FuzedGame.cb.remove("keydown", o.setKeyCode)
				}
				o.setKeyCode = function(e) {
					FuzedGame.Config.hotkeys.changeCode(data, e.keyCode);
					o.refresh();
				}
				o.refresh = function(){
					o.write(getText());
				}
				function getText() {
					var value = tools.keyNameByKeyCode[data.key] ||
						String.fromCharCode(data.key);
					var ret = name+": "+value;
					if(data.ctrl) ret += "+ctrl";
					if(data.shift) ret += "+shift";
					return ret;
				}
				return o;
			}
			
			cs.destroy = function(){
				if(selectedSetter) selectedSetter.deselect();
				var i;
				for(i in setters) {
					setters[i].destroy();
					delete setters[i];
				}
				cs.layer.cb.remove("mousedown", deselectSetter);
				for(i in cs) delete cs[i];
				btnList.destroy();
			}
			return cs;
		}
		return cs_global;
	}())
		
	//o.MapEditor = mapeditor.js
	//o.GameManager = gamemanager.js

//__Mainframe_______________________________________________________________________________
	
	o.mainframe = (function(){
		var mf = {};
		var usedScreen;
		var editorInst;
		var savedCommands = [];
		var savedCommandsPointer = -1;
		var lastCommand;
		mf.executeCommand = function(command){
			command || (command = mf.createCommand());
			if(command.type && executions[command.type]) {
				executions[command.type](command);
				saveCommand();
			}
			else {
				if(savedCommandsPointer > 0) {
					var cmd = savedCommands[--savedCommandsPointer];
					cmd.noSave = true;
					mf.executeCommand(cmd);
				}
				else {
					executions["mainMenu"]();
					saveCommand();
				}
			}
			
			function saveCommand() {
				if(!command.noSave) {
					savedCommands.splice(++savedCommandsPointer);
					savedCommands.push(command);
				}
			}
		}
		
		var executions = {};
		executions["editor"] = function(){
			if(!editorInst) {
				editorInst = FuzedGame.Screens.MapEditor.create();
			}
			else {
				editorInst.activate();
			}
			mf.changeScreen(editorInst);
		}
		executions["game"] = function(command){
			var game = FuzedGame.Screens.GameManager.create(command.data.mapSaveCode);
			mf.changeScreen(game);
		}
		executions["mainMenu"] = function(command){
			// mf.changeScreen(o.Screens.Menu.create());
			var menu = o.Screens.Submenu.create([
				{name:"HELP", command:mf.createCommand("game",  {mapSaveCode: FuzedGame.demoMaps.help["data"]})},
				{name:"SINGLE PLAY", command:mf.createCommand("singlePlayer")},
				{name:"MULTIPLAY", command:mf.createCommand("multiplayer")},
				{name:"CONTROLS", command:mf.createCommand("settings")},
				{name:"MAP EDITOR", command:mf.createCommand("editor")},
				{name:"ABOUT", command:mf.createCommand("about")}
			], "titleScreen")
			mf.changeScreen(menu);
		}
		executions["singlePlayer"] = function(command){
			var menu = o.Screens.Submenu.create([
				{name:"DEMO MAPS", command:mf.createCommand("demoMaps", {folder:FuzedGame.demoMaps.single})},
				{name:"SUBMITTED MAPS", command:mf.createCommand("submittedMaps")},
				{name:"LOAD FROM FILE", command:mf.createCommand("openFile")},
				{name:"NOW EDITED MAPS", command:mf.createCommand("nowEditedMaps")},
				{name:"BACK", command:mf.createCommand("back")}
			])
			mf.changeScreen(menu);
		}
		executions["multiplayer"] = function(command){
			var menu = o.Screens.Submenu.create([
				{name:"DEMO MAPS", command:mf.createCommand("demoMaps", {folder:FuzedGame.demoMaps.multy})},
				{name:"SUBMITTED MAPS", command:mf.createCommand("submittedMaps")},
				{name:"LOAD FROM FILE", command:mf.createCommand("openFile")},
				{name:"NOW EDITED MAPS", command:mf.createCommand("nowEditedMaps")},
				{name:"BACK", command:mf.createCommand("back")}
			])
			mf.changeScreen(menu);
		}
		executions["demoMaps"] = function(command){
			var btns = [];
			for(var i in command.data.folder) {
				// if(typeof(command.data.folder[i]) === "string") {
					// var json = command.data.folder[i];
					// command.data.folder[i] = JSON.parse(json);
				// }
				mapSave = command.data.folder[i];
				btns.push({
					name: i, 
					command: mf.createCommand("game", {mapSaveCode: mapSave["data"]})
				})
				
			}
			btns.push({name:"BACK", command:mf.createCommand("back")});
			var menu = o.Screens.Submenu.create(btns)
			mf.changeScreen(menu);
		}
		executions["submittedMaps"] = function(command){
			var menu = o.Screens.Submenu.create([
				{name:"EMPTY. YET:) PLEASE UPLOAD YOUR MAP.", inactive:true},
				{name:"BACK", command:mf.createCommand("back")}
			])
			mf.changeScreen(menu);
		}
		executions["about"] = function(command){
			var menu = o.Screens.Submenu.create([
				{name:"GRAPHICS BY SPICYPIXEL.NET", onClick:function(){
					window.location.href = "http://www.spicypixel.net/2008/01/10/gfxlib-fuzed-a-free-developer-graphic-library/"
				}},
				{name:""},
				{name:"used libraries:"},
				{name:"FileSaver.js", onClick:function(){
					window.location.href = "https://github.com/eligrey/FileSaver.js"
				}},
				{name:"LZ77", onClick:function(){
					window.location.href = "https://github.com/olle/lz77-kit"
				}},
				{name:""},
				{name:"PROGRAMED BY AZAZDEAZ",  onClick:function(){
					var kukac = "@";
					window.location.href = "mailto:andras"+kukac+"azazdeaz.hu";
				}},
				{name:"BACK", command:mf.createCommand("back")}
			])
			mf.changeScreen(menu);
		}
		executions["nowEditedMaps"] = function(command){
			var lsData = tools.loadFromLS(FuzedGame.Config.LSKeys.editedMaps);
			var mapsData;
			if(lsData) mapsData = JSON.parse(lsData);
			var btns = [];
			if(mapsData) {
				for(var i in mapsData.maps) {
					var md = mapsData.maps[i];
					btns.push({
						name: md.saveName, 
						command: mf.createCommand("game", {mapSaveCode: md.data})
					})
				}
				//todo: add limit
				//todo: short by save time
			}
			btns.push({name:"BACK", command:mf.createCommand("back")});
			var menu = o.Screens.Submenu.create(btns);
			mf.changeScreen(menu);
		}
		executions["settings"] = function(command){
			var settings = FuzedGame.Screens.ControllSettings.create();
			mf.changeScreen(settings);
		}
		executions["openFile"] = function(){
			var btns = [];
			btns.push({name:"BROWSE", onClick:browse});
			btns.push({name:"OR DRAG THE MAP FILE INTO BROWSER", inactive:true});
			btns.push({name:"BACK", command:mf.createCommand("back")});
			$("#fileElem")["on"]("change", onFileElemChange);
			FuzedGame.cb.add("drop", onDropFile);
			var menu = o.Screens.Submenu.create(btns);
			mf.changeScreen(menu);
			
			var menuDestroy = menu.destroy;
			menu.destroy = function(){
				$("#fileElem")["off"]("change", onFileElemChange);
				FuzedGame.cb.remove("drop", onDropFile);
				menuDestroy();
			}
			function onDropFile(e) {
				FuzedGame.runMapSave(e.dataTransfer.files);
			}
			function onFileElemChange(e){
				FuzedGame.runMapSave(e.target.files);
			}			
			function browse() {
				$("#fileElem")["click"]();
			}
		}
		mf.createCommand = function(type, data) {
			var c = {
				type: type || "",
				data: data || {}
			}
			return c;
		}
		
		mf.changeScreen = function(s){
			if(usedScreen) {
				o.stage.remove(usedScreen.layer);
				usedScreen.cb.remove("exit", mf.executeCommand);
				usedScreen.destroy();
			}
			usedScreen = s;
			o.contentLayer = s.layer;
			o.onResizeEvt();
			usedScreen.cb.add("exit", mf.executeCommand);
			o.startFade(function(){o.stage.add(s.layer)});
			o.stage.change();
		}
		return mf;
	}())
	
	o.runMapSave = function(files) {
		var file = files[0]; 
		if (file) {
			var r = new FileReader();
			r.onload = function(e) { 
				try{
					var mapData = JSON.parse(e.target.result).data;
				}
				catch(e) {
					console.log("can't open: "+e.target.result);
				}
					var cmd = o.mainframe.createCommand("game", {mapSaveCode: mapData});
					o.mainframe.executeCommand(cmd);
			}
			r.readAsText(file);
		} else { 
		  dialog.alert("Failed to load file");
		}
	}

//____________________________________________________________________________________________________________________	

	o.Config = {
		gameWidth: 640,
		gameHeight: 480,
		fullWidth: ctx.canvas.width,
		fullHeight : ctx.canvas.height
	}
	
	o.Config.itemsMap = {};;
	o.Config.itemsMap.exit = o.Config.itemsMap["exit"] = {p:[0, 0, 64, 64]};
	o.Config.itemsMap.grog = o.Config.itemsMap["grog"] = {p:[64, 0, 32, 32]};
	o.Config.itemsMap.slinky = o.Config.itemsMap["slinky"] = {p:[96, 0, 32, 32]};
	o.Config.itemsMap.wheelie = o.Config.itemsMap["wheelie"] = {p:[128, 0, 32, 32]};
	o.Config.itemsMap.player1 = o.Config.itemsMap["player1"] = {p:[64, 32, 32, 32]};
	o.Config.itemsMap.player2 = o.Config.itemsMap["player2"] = {p:[96, 32, 32, 32]};
	o.Config.itemsMap.wall_top = o.Config.itemsMap["wall_top"] = {p:[144, 32, 16, 16]};
	o.Config.itemsMap.wall_bottom = o.Config.itemsMap["wall_bottom"] = {p:[160, 32, 16, 16]};
	o.Config.itemsMap.wall_left = o.Config.itemsMap["wall_left"] = {p:[160, 0, 16, 16]};
	o.Config.itemsMap.wall_right = o.Config.itemsMap["wall_right"] = {p:[160, 16, 16, 16]};
	o.Config.itemsMap.trap = o.Config.itemsMap["trap"] = {p:[128, 48, 16, 16]};
	o.Config.itemsMap.bomb = o.Config.itemsMap["bomb"] = {p:[0, 64, 16, 16]};
	o.Config.itemsMap.dynamite = o.Config.itemsMap["dynamite"] = {p:[16, 64, 16, 16]};
	o.Config.itemsMap.mine = o.Config.itemsMap["mine"] = {p:[32, 64, 16, 16]};
	o.Config.itemsMap.gem10 = o.Config.itemsMap["gem10"] = {p:[48, 64, 16, 16]};
	o.Config.itemsMap.gem20 = o.Config.itemsMap["gem20"] = {p:[64, 64, 16, 16]};
	o.Config.itemsMap.gem40 = o.Config.itemsMap["gem40"] = {p:[80, 64, 16, 16]};
	o.Config.itemsMap.gem80 = o.Config.itemsMap["gem80"] = {p:[96, 64, 16, 16]};
	o.Config.itemsMap.gem100 = o.Config.itemsMap["gem100"] = {p:[112, 64, 16, 16]};
	o.Config.itemsMap.gem150 = o.Config.itemsMap["gem150"] = {p:[128, 64, 16, 16]};
	o.Config.itemsMap.invincibility = o.Config.itemsMap["invincibility"] = {p:[144, 48, 32, 32]};
	
	o.Config.BG_TYPES = ["siberia", "checker", "ancient", "candy"];
	
	o.Config.LSKeys = {
		editedMaps: "fuzzed_editedMaps",
		controls: "fuzzed_controls",
		editorWindows: "fuzzed_editorWindows",
		editorBg: "fuzzed_editorBg"
	}
	
	// o.Config.paths = {
		// sfx:"res/sfx/",
		
	// }
	
	o.Config.sfx = {
		explosion: "res/sfx/explosion/spaceinvaders_death.wav",
		slinkyDie: "res/sfx/hit/synth_001.wav",
		grogDie: "res/sfx/hit/rpg_escape.wav",
		wheelieDie: "res/sfx/hit/robot_talk_003.wav",
		playerDie: "res/sfx/hit/kick_001.wav",
		playerDamage: "res/sfx/hit/kick_002.wav",
		pickupGem1: "res/sfx/pickup/blip_015.wav",
		pickupGem2: "res/sfx/pickup/blip_016.wav",
		pickupGem3: "res/sfx/pickup/blip_017.wav",
		pickupBomb: "res/sfx/pickup/blip_021.wav",
		exitAppear: "res/sfx/teleport/lift_off_fx_002.wav",
		exitDisappear: "res/sfx/teleport/zoom_down_002.wav"//"res/sfx/teleport/lift_off_fx_001.wav"
	}
	
	o.Config.php = {
		sendMap:"http://azazdeaz.hu/ref/fuzed/php/send_fuzed_map.php"
	}
		
	
	o.Config.hotkeys = (function(){
		var o = {};
		o.dir = {};
		o.usedCodes = [];
		o.changeCode = function(data, value, ctrl, shift){
			data.key = value;
			ctrl ? data.ctrl = true : delete data.ctrl;
			shift ? data.shift = true : delete data.shift;
			o.usedCodes = readUsedCodes();
			saveControls();
		}
		
		function init(){
			o.dir = getControls(true);
			o.usedCodes = readUsedCodes();
		}
		
		o.reset = function(){
			copy(getControls(false), o.dir);
			function copy(a, b) {
				for(var i in a) {
					if(typeof(a[i]) === "object") {
						b[i] || (b[i] = {});
						copy(a[i], b[i]);
					}
					else {
						b[i] = a[i];
					}
				}
			}
			o.usedCodes = readUsedCodes();
			saveControls();
		}
		
		function readUsedCodes() {
			var ret = [];
			read(o.dir)
			function read(dir) {
				for(var i in dir) {
					if(typeof(dir[i]) === "number") {
						ret.push(dir[i]);
					}
					else {
						read(dir[i]);
					}
				}
			}
			return ret;
		}
		
		function getControls(loadJson) {
			var json;
			if(loadJson) {
				json = tools.loadFromLS(FuzedGame.Config.LSKeys.controls);
				if(json) json = JSON.parse(json);
			}
			json = json || {};
			json["player1"] = json["player1"] || {};
			json["player2"] = json["player2"] || {};
			json["pause"] = json["pause"] || {};
			json["editor"] = json["editor"] || {};

			function r(json, base) {
				return {
					key: (json && json["key"]) || base.key,
					ctrl: (json && json["ctrl"]) || base.ctrl,
					shift: (json && json["shift"]) || base.shift
				}
			}
			return {
				player1: {
					up: r(json["player1"]["up"],{key: 38}),
					left: r(json["player1"]["left"],{key: 37}),
					right: r(json["player1"]["right"],{key: 39}),
					bomb: r(json["player1"]["bomb"],{key: 66}), 
					dynamite: r(json["player1"]["dynamite"],{key: 78}), 
					mine: r(json["player1"]["mine"],{key: 77})
				},
				player2: {
					up: r(json["player2"]["up"],{key: 87}),
					left: r(json["player2"]["left"],{key: 65}),
					right: r(json["player2"]["right"],{key: 68}),
					bomb: r(json["player2"]["bomb"],{key: 48}), 
					dynamite: r(json["player2"]["dynamite"],{key: 49}), 
					mine: r(json["player2"]["mine"],{key: 50})
				},
				pause: r(json["pause"],{key: 80}),
				editor: {
					move: r(json["editor"]["move"],{key:77}),
					select: r(json["editor"]["select"],{key:86}),
					stamp: r(json["editor"]["stamp"],{key:83}),
					save: r(json["editor"]["save"],{key:83, ctrl: true}),
					save_as: r(json["editor"]["save_as"],{key:83, ctrl: true, shift:true}),
					del: r(json["editor"]["del"],{key:46}),
					copy: r(json["editor"]["copy"],{key:67, ctrl: true}),
					undo: r(json["editor"]["undo"],{key:90, ctrl: true}),
					redo: r(json["editor"]["redo"],{key:89, ctrl: true}),
					exit: r(json["editor"]["exit"],{key:27})
				}
			}
		}

		function saveControls() {
			function r(data) {
				var ret = {};
				if(data.key !== undefined) ret["key"] = data.key;
				if(data.ctrl !== undefined) ret["ctrl"] = data.ctrl;
				if(data.shift !== undefined) ret["shift"] = data.shift;
				if(data.alt !== undefined) ret["alt"] = data.alt;
				return ret;
			}
			var json = {
				"player1": {
					"up": r(o.dir.player1.up),
					"left": r(o.dir.player1.left),
					"right": r(o.dir.player1.right),
					"bomb": r(o.dir.player1.bomb),
					"dynamite": r(o.dir.player1.dynamite),
					"mine": r(o.dir.player1.mine)
				},
				"player2": {
					"up": r(o.dir.player2.up),
					"left": r(o.dir.player2.left),
					"right": r(o.dir.player2.right),
					"bomb": r(o.dir.player2.bomb),
					"dynamite": r(o.dir.player2.dynamite),
					"mine": r(o.dir.player2.mine)
				},
				"pause": r(o.dir.pause),
				"editor": {
					"move": r(o.dir.editor.move),
					"select": r(o.dir.editor.select),
					"stamp": r(o.dir.editor.stamp),
					"save": r(o.dir.editor.save),
					"save_as": r(o.dir.editor.save_as),
					"del": r(o.dir.editor.del),
					"copy": r(o.dir.editor.copy),
					"undo": r(o.dir.editor.undo),
					"redo": r(o.dir.editor.redo),
					"exit": r(o.dir.editor.exit)
				}
			}
			tools.saveToLS(FuzedGame.Config.LSKeys.controls, JSON.stringify(json));
		}
		// player1: {
		// 		up: {key: 38}),
		// 		left: {key: 37},
		// 		right: {key: 39},
		// 		bomb: {key: 66}, 
		// 		dynamite: {key: 78}, 
		// 		mine: {key: 77}
		// 	},
		// 	player2: {
		// 		up: {key: 87},
		// 		left: {key: 65},
		// 		right: {key: 68},
		// 		bomb: {key: 48}, 
		// 		dynamite: {key: 49}, 
		// 		mine: {key: 50}
		// 	},
		// 	pause: {key: 80},
		// 	editor: {
		// 		move: {key:77},
		// 		select: {key:86},
		// 		stamp: {key:83},
		// 		save: {key:83, ctrl: true},
		// 		save_as: {key:83, ctrl: true, shift:true},
		// 		del: {key:46},
		// 		copy: {key:67, ctrl: true},
		// 		undo: {key:90, ctrl: true},
		// 		redo: {key:89, ctrl: true},
		// 		exit: {key:27}
		// 	}
		o.isMatch = function(evt, hkData) {
			return  hkData.key == evt.keyCode  &&
					Boolean(hkData.ctrl) == evt.ctrlKey  &&
					Boolean(hkData.shift) == evt.shiftKey  &&
					Boolean(hkData.alt) == evt.altKey;
		}
		init()
		return o;
	}());
	
	
	o.onResize = function(w, h)
	{
		if(!o.isReady.check()) return;
		ctx.canvas.width = o.Config.fullWidth = w;
		ctx.canvas.height = o.Config.fullHeight = h;
		o.cb.call("resize", {w:w, h:h});
		o.stage.change();
	}
	
	o.onMouseEvt = function(e){
		if(o.stage) {
			e.preventDefault();
			var evt = MouseEvent.create(e);
			o.stage.givMouseEvt(evt);
		}
	}
	
	var MouseEvent = function(){
		var container = document.getElementById("fuzed_container");
		var evt = {
			x: 0,
			y: 0,
			type: "",
			getLocal: function(p){
				var x = this.x;
				var y = this.y;
				do {x -= p.x;
					y -= p.y;
				} while(p = p.par);
				return {x:x, y:y};
			},
			clone: function() {
				return {
					x: this.x, y: this.y, 
					type: this.type,
					clone: this.clone,
					getLocal: this.getLocal
				};
			}
		}
		return {
			create: function(e) {
				var offset = $(container)["offset"]();
				evt.x = (e.pageX !== undefined ? e.pageX : e.clientX + document.body.scrollLeft + container.scrollLeft) - offset.left;
				evt.y = (e.pageY !== undefined ? e.pageY : e.clientY + document.body.scrollTop + container.scrollTop)   - offset.top ;
				evt.type = e.type;
				return evt;
			}
		}
	}();
	// function createMouseEvent(e){
		// return {
			// x: e.offsetX,
			// y: e.offsetY,
			// type: e.type,
			// getLocal: function(p){
				// var x = this.x;
				// var y = this.y;
				// do {x -= p.x;
					// y -= p.y;
				// } while(p = p.par);
				// return {x:x, y:y};
			// },
			// clone: function() {
				// return {
					// x: this.x, y: this.y, 
					// type:this.type
				// };
			// }
		// }
	// }
	
	
	o.supportTest = function(){
		ret = "";
		try{new Blob()}catch(e){ret+="Blob constructor is not supported!"};
		try{new File()}catch(e){ret+="File constructor is not supported!"};
		try{new FileReader()}catch(e){ret+="FileReader constructor is not supported!"};
		try{new FileList()}catch(e){ret+="FileList constructor is not supported!"};
		if(ret) console.log(ret);
		return ret;
	}
	tools.spriteSheet.load(o.spriteSheetName, tools.Loader.paths.gfx + "full", init);
}//end of FuzedGame.init()
}());

$(document)["ready"](function()
{
	// document.body.appendChild(tools.FpsMeter.element);
	// tools.FpsMeter.start();
	
	
	var container = $("#fuzed_container");
	var loadingTextNode = $("<code>loading...<\code>");
	loadingTextNode["css"]("color", "grey");
	container["append"](loadingTextNode);
	tools.createGreyStamp(256, function(gs) {
		container["css"]("background-image", "url("+gs.toDataURL()+")");
	});
	container["css"]("background-color", "#000000");
	$('body')["css"]("margin","0px");
	$('body')["css"]("height","100%");
	$('html')["css"]("height","100%");
	var gameCtx = tools.createCtx(Math.max(640, container["width"]()),
								  Math.max(480, container["height"]()))
	function onFuzedGameInited() {
		loadingTextNode["remove"]()
		FuzedGame.cb.remove("inited", onFuzedGameInited);
	}
	FuzedGame.cb.add("inited", onFuzedGameInited);
	FuzedGame.init(gameCtx);
	$(window)["resize"](function() {
		FuzedGame.onResize(container["width"](), container["height"]());
	})
	gameCtx.canvas.ondragower = function(e){e.preventDefault()};
	gameCtx.canvas.ondrop = function(e){
		FuzedGame.cb.call("drop", e);
		e.preventDefault();
	};
	container["append"](gameCtx.canvas);
	
	$(gameCtx.canvas)["mousedown"](FuzedGame.onMouseEvt);
	$(gameCtx.canvas)["click"](FuzedGame.onMouseEvt);
	$(gameCtx.canvas)["mouseup"](FuzedGame.onMouseEvt);
	$(gameCtx.canvas)["mousemove"](FuzedGame.onMouseEvt);
	$(gameCtx.canvas)["mouseleave"](FuzedGame.onMouseEvt);
	
	// gameCtx.canvas.onmousedown = FuzedGame.onMouseEvt;
	// gameCtx.canvas.onclick = FuzedGame.onMouseEvt;
	// gameCtx.canvas.onmouseup = FuzedGame.onMouseEvt;
	// gameCtx.canvas.onmousemove = FuzedGame.onMouseEvt;
	// gameCtx.canvas.onmouseleave = FuzedGame.onMouseEvt;
	
	var appCache = window.applicationCache;
	function onAppCacheChange() {
		if (appCache.status == appCache.UPDATEREADY) {
			appCache.swapCache();
			if (confirm('A new version of Fuzed is downloaded. Do you want to reload now?')) {
				window.location.reload();
			}
		} else {
			// alert("Manifest didn't changed. Nothing new to server.");
		}
	}
	onAppCacheChange();
 	// appCache.update();
	appCache.addEventListener('updateready', onAppCacheChange, false);
});

// res/sfx/explosion/spaceinvaders_death.wav
// res/sfx/hit/synth_001.wav
// res/sfx/hit/rpg_escape.wav
// res/sfx/hit/robot_talk_003.wav
// res/sfx/hit/kick_001.wav
// res/sfx/hit/kick_002.wav
// res/sfx/pickup/blip_015.wav
// res/sfx/pickup/blip_016.wav
// res/sfx/pickup/blip_017.wav
// res/sfx/pickup/blip_021.wav
// res/sfx/teleport/lift_off_fx_002.wav
// res/sfx/teleport/zoom_down_002.wav