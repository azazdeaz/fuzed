var FuzedGame = window.FuzedGame = window.FuzedGame || {};
FuzedGame.Screens = FuzedGame.Screens || {};
FuzedGame.Screens.GameManager = (function()
{
	var gameManagerGlobal = {};
	var cPalette = tools.spriteSheet.getImage(FuzedGame.spriteSheetName, "titleset.png");
	var cItems = tools.spriteSheet.getImage(FuzedGame.spriteSheetName, "items.png");
	var TICK_SPEED = 1000/15;
	
	gameManagerGlobal.create = function(mapData, w, h){
		if(!cPalette || !cItems) {
			cPalette = tools.spriteSheet.getImage(FuzedGame.spriteSheetName, "titleset.png");
			cItems = tools.spriteSheet.getImage(FuzedGame.spriteSheetName, "items.png");
		}
		
		var o = {};
		var renderW = w || 640;
		var renderH = h || 480;
		var needToRender = false;
		var map = {};
		var tickerSetI;
		var deadLine = 0;
		var lowestGround = 0;
		var lowestRenderPos = 0;
		var playerStateDisplays = {};
		// var giPlayer1;
		// var giPlayer2;
		var giPlayers = [];
		var giPlayersAll = [];
		var paused = false;
		var gameEnded = false;
		o.cb = tools.create_callback();
		o.layer = tools.Sprite.create();
		o.layer.w = FuzedGame.Config.gameWidth;
		o.layer.h = FuzedGame.Config.gameHeight;
		
		
		var renderView = (function(){
			var rv_global = {};
			var rv1;
			var rv2;
			rv_global.refresh = function() {
				var i, targetChanged;
				if(rv1) {
					if(rv1.readyForClose && rv2) {
						rv1 = undefined;
					} 
					else if(rv1 && giPlayers.indexOf(rv1.target) === -1) {
						targetChanged = false;
						for(i in giPlayers) {
							if(giPlayers[i].type === "player1") {
								rv1.changeTarget(giPlayers[i]);
								targetChanged = true;
								break;
							}
						}
						if(!targetChanged && rv2) rv1.closeTo(rv2);
					}
				}
				
				if(rv2) {
					if(rv2.readyForClose && rv1) {
						rv2 = undefined;
					} 
					else  if(giPlayers.indexOf(rv2.target) === -1) {
						targetChanged = false;
						for(i in giPlayers) {
							if(giPlayers[i].type === "player2") {
								rv2.changeTarget(giPlayers[i]);
								targetChanged = true;
								break;
							}
						}
						if(!targetChanged && rv1) rv2.closeTo(rv1);
					}
				}
				
				if(rv1 || rv2) {
					o.layer.onDraw = rv1 && rv2 ? renderTwoPlayer : renderOnePlayer;
				} else {
					delete o.layer.onDraw;
				}
			}
			
			rv_global.init = function() {
				for(var i in giPlayers) {
					if(!rv1 && giPlayers[i].type === "player1") rv1 = rv_global.create(giPlayers[i]);
					if(!rv2 && giPlayers[i].type === "player2") rv2 = rv_global.create(giPlayers[i]);
				}
				rv_global.refresh();
			}
			
			rv_global.step = function() {
				if(rv1) rv1.step(); 
				if(rv2) rv2.step(); 
			}
			
			rv_global.create = function(target) {
				var rv_o = {
					x: target.x + (target.w/2 || 0),
					y: target.y + (target.h/2 || 0),
					removable: false,
					target: target,
					ATTACH: "attach",
					NEAR: "near",
					readyForClose:false
				}
				var onRemove = false;
				var state = rv_o.ATTACH;
				var nearSpeed = 6;
				
				rv_o.changeTarget = function(t) {
					state = rv_o.NEAR;
					nearSpeed = 2048;
					rv_o.target = t;
				}
				rv_o.closeTo = function(t) {
					rv_o.changeTarget(t);
					onRemove = true;
				}
				rv_o.step = function(){
					if(state === rv_o.ATTACH) {
						rv_o.x = rv_o.target.x + (rv_o.target.w/2 || 0);
						rv_o.y = rv_o.target.y + (rv_o.target.h/2 || 0);
					}
					else {//NEAR
						var tx = rv_o.target.x + (rv_o.target.w/2 || 0);
						var ty = rv_o.target.y + (rv_o.target.h/2 || 0);
						if(nearSpeed > 8) nearSpeed /= 2;
						rv_o.x += (tx - rv_o.x) / nearSpeed;
						rv_o.y += (ty - rv_o.y) / nearSpeed;
						if (Math.abs(tx - rv_o.x) < 1 && 
							Math.abs(ty - rv_o.y) < 1) 
						{
							state = rv_o.ATTACH;
							if(onRemove) {
								rv_o.readyForClose = true;
								rv_global.refresh();
							}
						}
					}
				}
				return rv_o;
			}	
		
			function renderOnePlayer() {
				if(needToRender){
					var rv = rv1 || rv2;
					needToRender = false;
					renderer.render(-rv.x + renderW/2, 
						Math.max(lowestRenderPos, -rv.y + renderH/2));
				}
			}
			
			function renderTwoPlayer() {
				if(!needToRender) return;
				needToRender = false;
				var p1x = rv1.x;
				var p1y = rv1.y;
				var p2x = rv2.x;
				var p2y = rv2.y;
				var renderWp2 = renderW/2;
				var renderHp2 = renderH/2;
				var xDif = p1x - p2x;
				var yDif = p1y - p2y;
				var ms = Math.min(Math.abs(renderWp2 / xDif), Math.abs(renderHp2 / yDif));
				var maxXDif = (xDif * ms) || 0;
				var maxYDif = (yDif * ms) || 0;
				
				if(Math.abs(xDif) <= Math.abs(maxXDif) && Math.abs(yDif) <= Math.abs(maxYDif)) {
					renderer.render(-p1x + renderWp2 + xDif/2, 
						Math.max(lowestRenderPos, -p1y + renderHp2 + yDif/2));
				}
				else {
					var rxDif = Math.abs(maxXDif/2) < Math.abs(xDif/2) ? maxXDif/2 : xDif/2;
					var ryDif = Math.abs(maxYDif/2) < Math.abs(yDif/2) ? maxYDif/2 : yDif/2;
					var s;
					var spax, spay, spbx, spby;
					renderer.render((-p1x + renderWp2) + rxDif, 
						Math.max(lowestRenderPos, (-p1y + renderHp2) + ryDif));
					renderer.ctx.save();
					renderer.ctx.beginPath();
					
					if(maxXDif*2 === renderW) {
						if(rxDif < 0) {
							renderer.ctx.moveTo(renderW, 0);
							renderer.ctx.lineTo(renderW, renderH);
						} else {
							renderer.ctx.moveTo(0, 0);
							renderer.ctx.lineTo(0, renderH);
						}
						s = (ryDif/rxDif||0) * renderHp2
						spax = renderWp2 - s;
						spay = renderH;
						spbx = renderWp2 + s;
						spby = 0;
						renderer.ctx.lineTo(renderWp2 - s, renderH);
						renderer.ctx.lineTo(renderWp2 + s, 0);
					}
					else {
						if(ryDif < 0) {
							renderer.ctx.moveTo(0, renderH);
							renderer.ctx.lineTo(renderW, renderH);
						} else {
							renderer.ctx.moveTo(0, 0);
							renderer.ctx.lineTo(renderW, 0);
						}
						s = (rxDif/ryDif||0) * renderWp2;
						spax = renderW;
						spay = renderHp2 - s;
						spbx = 0;
						spby = renderHp2 + s;
						renderer.ctx.lineTo(renderW, renderHp2 - s);
						renderer.ctx.lineTo(0, renderHp2 + s);
					}
					// renderer.ctx.arc(renderWp2-rxDif, renderHp2-ryDif, 120, 0, Math.PI*2);
					// console.log(maxXDif+" "+xDif+"/"+maxYDif+" "+yDif+"-"+s);
					renderer.ctx.clip();
					renderer.render((-p2x + renderWp2) - rxDif, 
						Math.max(lowestRenderPos, (-p2y + renderHp2) - ryDif));
					
					renderer.ctx.restore();
					renderer.ctx.beginPath();
					renderer.ctx.moveTo(spax, spay);
					renderer.ctx.lineTo(spbx, spby);
					renderer.ctx.lineWidth = Math.min(4, Math.max(1, Math.abs(xDif - maxXDif), Math.abs(yDif - maxYDif)));
					renderer.ctx.strokeStyle = "#ffffff";
					renderer.ctx.stroke();
				}
			}

			return rv_global;
		}());
		
		function init() {
			//map reading
			var t1 = +new Date();
			if(mapData.indexOf("code0:") === 0) {
				mapData = mapData.slice(6);
				mapData = Iuppiter.toByteArray(mapData);
				mapData = Iuppiter.Base64.decode(mapData, false);
				mapData = Iuppiter.decompress(mapData);
			}
			if(mapData.indexOf("code1:") === 0) {
				mapData = mapData.slice(6);
				mapData = new LZ77().decompress(mapData);
			}
			mapData = JSON.parse(mapData);
			map = { 
				name:mapData["n"],
				bgType:mapData["b"],
				bg: [],
				items: [],
				fg: [],
				walls: {
					top: [],
					bottom: [],
					left: [],
					right: []
				},
				scores:[]
			}
			var giTarget = map.bg;
			var i, j;
			for(i in mapData["l"]) { 
				if(mapData["l"][i]["a"] === "1") giTarget = map.items;
				else if(giTarget === map.items) giTarget = map.fg;
				
				for(var j in mapData["l"][i]["i"]) {
					var itemSource = mapData["l"][i]["i"][j];
					if(mapData["l"][i]["a"] === "0") {
						giTarget.push(mapData["l"][i]["i"][j]);
					}
					else if(itemSource["p"][4].slice(0, 4) === "wall") {
						var wallType = itemSource["p"][4].slice(5);
						var newWall = {
							x:itemSource["p"][0], 
							y:itemSource["p"][1], 
							l:16
						};
						if(wallType === "bottom") newWall.y += 16;
						if(wallType === "right") newWall.x += 16;
						map.walls[wallType].push(newWall);
						
						if(wallType === "top" && itemSource["p"][1] > lowestGround) 
							lowestGround = itemSource["p"][1];
					}
					else {
						var gi = GameItem.create(itemSource);
						giTarget.push(gi);
						if(gi.type === "player1") {
							// giPlayer1 = gi;
							giPlayers.push(gi);
							giPlayersAll.push(gi);
						}
						else if(gi.type === "player2") {
							// giPlayer2 = gi;
							giPlayers.push(gi);
							giPlayersAll.push(gi);
						}
					}
				}
			}
			
			deadLine = lowestGround + renderH/2;
			lowestRenderPos = -lowestGround + renderH/2 + 64;
			//Organize walls
			var wi, wj, wallTypes = ["top", "bottom", "left", "right"];
			for(var wti in wallTypes) {
				var walls = map.walls[wallTypes[wti]];
				var horizontal = wallTypes[wti] === "top" || wallTypes[wti] === "bottom";
				for(i = 0; i < walls.length; ++i) {
					var wi = walls[i];
					for(j = 0; j < walls.length; ++j) {
						var wj = walls[j];
						if(horizontal){
							if (wi !== wj &&
								wi.y === wj.y && 
								wi.x <= wj.x + wj.l &&
								wi.x + wi.l >= wj.x)
							{
								if(wj.x < wi.x) {
									wi.l += wi.x - wj.x;
									wi.x = wj.x;
								}
								if(wj.x + wj.l > wi.x + wi.l) {
									wi.l += (wj.x + wj.l) - (wi.x + wi.l);
								}
								
								walls.splice(j, 1);
								if(j < i) --i;
								j = -1;
							}
						} 
						else {
							if (wi !== wj &&
								wi.x === wj.x && 
								wi.y <= wj.y + wj.l &&
								wi.y + wi.l >= wj.y)
							{
								if(wj.y < wi.y) {
									wi.l += wi.y - wj.y;
									wi.y = wj.y;
								}
								if(wj.y + wj.l > wi.y + wi.l) {
									wi.l += (wj.y + wj.l) - (wi.y + wi.l);
								}
								
								walls.splice(j, 1);
								if(j < i) --i;
								j = -1;
							}
						}
					}
				}
			}
			
			renderer = Renderer.create(map, renderW, renderH);
			o.layer.canvas = renderer.canvas;
			mapData = undefined;
			tickerSetI = setInterval(tick, TICK_SPEED);
			renderView.init();
			
			function tick(){
				if(paused || needToRender) return;
				var i;
				for(i in map.items){
					var item = map.items[i];
					var oldPos = {x:map.items[i].x, y:map.items[i].y};
					if(item.step) {
						item.step(stepperTools);
					}
				}
				for(var i = 0; i < map.scores.length; ++i) {
					if(map.scores[i].step()) {
						map.scores.splice(i--, 1);
					}
				}
				renderView.step();
				needToRender = true;
				o.layer.change();
			}
			
			FuzedGame.cb.add("keydown", onKeyDown);
			
			console.log("gm init: "+(+new Date() - t1)+"ms");
		}
		
		//StepperTools__________________________________________________________________________

		var stepperTools = {};
		stepperTools.playersOnScreen = function() {
			return giPlayers.length;
		}
		stepperTools.addBomb = function(type, x, y, thrower){
			var gi = GameItem.create({p:[x, y, 16, 16, "exploit_"+type], thrower: thrower})
			map.items.push(gi);
			return gi;
		}
		stepperTools.sreachWall = function(wallType, oldPos, item){
			var a, b, pos, walls;
			if(wallType === "top") {
				walls = map.walls[wallType];
				pos = item.y + item.hitRect.y + item.hitRect.h;
				oldPos += item.hitRect.y + item.hitRect.h;
				a = item.x + item.hitRect.x;
				b = a + item.hitRect.w;
				for(i in walls){
					if (walls[i].y >= oldPos && 
						walls[i].y <= pos &&
						walls[i].x < b &&
						walls[i].x + walls[i].l > a) 
					{
						return walls[i];
					}
				}
			}
			else if(wallType === "bottom") {
				walls = map.walls[wallType];
				pos = item.y + item.hitRect.y;
				oldPos += item.hitRect.y;
				a = item.x + item.hitRect.x;
				b = a + item.hitRect.w;
				for(i in walls){
					if (walls[i].y <= oldPos && 
						walls[i].y >= pos &&
						walls[i].x < b &&
						walls[i].x + walls[i].l > a) 
					{
						return walls[i];
					}
				}
			}
			else if(wallType === "left") {
				walls = map.walls[wallType];
				pos = item.x + item.hitRect.x + item.hitRect.w;
				oldPos += item.hitRect.x + item.hitRect.w;
				a = item.y + item.hitRect.y;
				b = a + item.hitRect.h;
				for(i in walls){
					if (walls[i].x >= oldPos && 
						walls[i].x <= pos &&
						walls[i].y < b &&
						walls[i].y + walls[i].l > a) 
					{
						return walls[i];
					}
				}
			}
			else if(wallType === "right") {
				walls = map.walls[wallType];
				pos = item.x + item.hitRect.x;
				oldPos += item.hitRect.x;
				a = item.y + item.hitRect.y;
				b = a + item.hitRect.h;
				for(i in walls){
					if (walls[i].x <= oldPos && 
						walls[i].x >= pos &&
						walls[i].y < b &&
						walls[i].y + walls[i].l > a) 
					{
						return walls[i];
					}
				}
			}
		}
		stepperTools.checkGroundLeft = function(item, ground, forEnemies) {
			if(forEnemies){
				return (!item.way && ground.x > item.x + item.hitRect.x) ||
				(item.way && ground.x + ground.l < item.x + item.hitRect.x + item.hitRect.w);
			} else {
				return ground.x > item.x + item.hitRect.x + item.hitRect.w ||
				ground.x + ground.l < item.x + item.hitRect.x;
			}
		}
		stepperTools.getCollosions = function(target, types) {
			var collosionList = [];
			if(!target.hitRect) return collosionList;
			for(var i in map.items) {
				var item = map.items[i];
				if (item.inGame && item.hitRect &&
					item !== target && 
					(!types || types.indexOf(item.type) >= 0) &&
					(target.x + target.hitRect.x < item.x + item.hitRect.x + item.hitRect.w &&
					 target.x + target.hitRect.x + target.hitRect.w > item.x + item.hitRect.x &&
					 target.y + target.hitRect.y < item.y + item.hitRect.y + item.hitRect.h &&
					 target.y + target.hitRect.y + target.hitRect.h > item.y + item.hitRect.y)) 
				{
					collosionList.push(item);
				}
			}
			return collosionList;
		}
		stepperTools.closestPlayer = function(target, maxDistX, maxDistY, retBool) {
			var ret = false;
			var p, xd, yd, dist;
			for(var i in giPlayers) {
				p = giPlayers[i];
				xd = (p.x + p.w/2) - (target.x + target.w/2);
				yd = (p.y + p.h/2) - (target.y + target.h/2);
				if (Math.abs(xd) <= maxDistX && Math.abs(yd) <= maxDistY) {
					dist = Math.sqrt(xd*xd + yd*yd);
					if(!ret || ret.dist > dist){
						if(retBool) {
							return true;
						}
						else {
							ret = {
								dist: dist,
								xd: xd,
								yd: yd,
								player: p
							}
						}
					}
				}
			}
			return ret;
		}
		stepperTools.destroyMe = function(item) {
			var idx = map.items.indexOf(item);
			if(idx >= 0) map.items.splice(idx, 1);
			
			if(item.type === "player1" || item.type === "player2") {
				idx = giPlayers.indexOf(item);
				if(idx >= 0) giPlayers.splice(idx, 1);
				renderView.refresh();
			}
			if(item.destroy) item.destroy();
		}
		stepperTools.displayMe = function(item){
			if(!playerStateDisplays[item.type]) {
				playerStateDisplays[item.type] = Screens.createPlayerStats(item.type);
				o.layer.add(playerStateDisplays[item.type].layer);
			}
			playerStateDisplays[item.type].refresh(item);
			// console.log("player2: score-"+item.score+
						// " ♥-"+item.lifes+
						// " bombs-"+item.bombs+
						// " dynamites-"+item.dynamites+
						// " mines-"+item.mines);
		}
		stepperTools.checkMyDeathLine = function(gi){
			return gi.y + gi.h > deadLine;
		}
		stepperTools.closeGame = function(win){
			endGame(win);
		}
		stepperTools.showPoint = function(value, x, y) {
			map.scores.push(ScoreGraf.create(value, x, y));
		}
		//____________________________________________________________________________________________

		function onKeyDown(e) {
			if(!paused && 
				FuzedGame.Config.hotkeys.isMatch(e, FuzedGame.Config.hotkeys.dir.pause)) 
			{
				pauseGame();
				e.stopPropagation();
			}
		}
		
		function pauseGame() {
			if(gameEnded) return;
			paused = true;
			var menu = Screens.createGameMenu();
			o.layer.add(menu.layer);
			menu.onExitGame = exitGame;
			menu.onResume = function(){
				paused = false;
				o.layer.remove(menu.layer);
				menu.destroy();
			}
		}
		
		document.addEventListener(tools.PageVisibility.evtName, pvChange);
		function pvChange() {
			if(tools.PageVisibility.isHidden()) {
				pauseGame();
			}
		}
		
		function endGame(win){
			gameEnded = true;
			clearInterval(tickerSetI);
			var screen;
			if(win){
				screen = Screens.crateWinnerScreen(renderW, renderH, giPlayersAll, exitGame);
			}
			else {
				screen = Screens.crateGameOverScreen(renderW, renderH, exitGame);
			}
			FuzedGame.startFade(function(){
				o.layer.add(screen.layer);
				delete o.layer.canvas;
				o.layer.change();
			});
		}
		
		function exitGame(){
			clearInterval(tickerSetI);
			o.cb.call("exit");
		}
		
		o.destroy = function(){
			document.removeEventListener(tools.PageVisibility.evtName, pvChange);
			FuzedGame.cb.remove("keydown", onKeyDown);
		}
		
		init();
		return o;
	}
//______________________________________________________________________________________________
	var ScoreGraf = (function(){
		var sc_global = {};
		sc_global.create = function(value, x, y){
			var textCtx = tools.TextWriter.write(value+"", 8);
			var cText = textCtx.canvas;
			var sc = {
				x: x || 0,
				y: y || 0,
				w: textCtx.canvas.width,
				h: textCtx.canvas.height,
				alpha: 1
			};
			sc.x -= sc.w/2;
			sc.y -= sc.h/2;
			sc.ctx = tools.createCtx(sc.w, sc.h);
			sc.canvas = sc.ctx.canvas;
			sc.step = function() {
				--sc.y;
				sc.alpha -= .037;
				sc.ctx.clearRect(0, 0, sc.w, sc.h);
				sc.ctx.globalAlpha = sc.alpha;
				sc.ctx.drawImage(cText, 0, 0);
				return sc.alpha <= 0;
			}
			sc.destroy = function() {
				for(var i in sc) delete sc[i];
				textCtx = cText = undefined;
			}
			return sc;
		}
		return sc_global;
	}());
	
//__Game Item_______________________________________________________________________________
	
	var GameItem = function(){
		var gi_global = {};
		var sn = FuzedGame.spriteSheetName;
		var idCounter = 0;
		var playerEyeshot = Math.sqrt(640*640+480*480);
		gi_global.create = function(si){
			si.p = si["p"] || si.p;
			var gi = {
				x: si.p[0],
				y: si.p[1],
				w: si.p[2],
				h: si.p[3],
				type: si.p[4],
				inGame: true,
				id: idCounter++
			}
			
			switch(gi.type) {
				case"gem10": case"gem20": case"gem40": case"gem80": case"gem100": case"gem150":
				gi.isGem = true;
				gi.value = gi.type.substr(3);
				gi.anim = Animator.create();
				gi.anim.add("glint", "gem_"+gi.value+"_points.png");
				gi.canvas = gi.anim.canvas;
				gi.anim.step(0);
				gi.hitRect = {x:1, y:1, w:14, h:14};
				
				setupToPickUp(gi);
				
				var glintEnd = true;
				var glintTimeout;
				gi.anim.play("glint");
				function onStep(tools){
					gi.anim.step();
					if(glintEnd){
						gi.step = undefined;
						glintEnd = false;
						glintTimeout = window.setTimeout(function(){
							if(gi.pickedUp) return;
							gi.step = onStep;
							gi.anim.play("glint", function(){
								glintEnd = true
							});
						}, 700 + 1400 * Math.random())
					}
				}
				gi.step = onStep;
				break;
				
				case "invincibility":
				gi.isLife = true;
				gi.hitRect = {x:8, y:8, w:16, h:16};
				gi.anim = Animator.create();
				gi.anim.add("idle", "invincibility_pickup.png");
				gi.anim.play("idle");
				gi.step = function(){gi.anim.step();};
				gi.canvas_fg = gi.anim.canvas;
				setupToPickUp(gi);
				gi.pickedUpAnimFile = "invincibility_picked_up.png";
				break;
				
				
				case "bomb":
				case "dynamite":
				case "mine":
				setupToPickUp(gi);
				gi.anim = Animator.create();
				gi.anim.add("idle", gi.type+"_floor.png");
				gi.anim.play("idle");
				gi.canvas_fg = gi.anim.canvas;
				// delete gi.step;
				gi.hitRect = {x:1, y:1, w:14, h:14};
				gi.pickupSfx = FuzedGame.Config.sfx.pickupBomb;
				break;
				
				case "exploit_bomb":
				case "exploit_dynamite":
				case "exploit_mine":
				setupToExploitBomb(gi, si.thrower);
				break;
				
				case "trap":
				gi.isTrap = true;
				gi.hitRect = {x:3, y:8, w:10, h:8};
				break;
				
				
				case "wheelie":
				setupToEnemy(gi);
				gi.value = 120;
				gi.hitRect = {x:3, y:6, w:28, h:26};
				gi.anim.add("dieLeft", "wheelie_die_left.png");
				gi.anim.add("dieRight", "wheelie_die_right.png");
				gi.kill = function() {
					delete gi.isEnemy;
					delete gi.hitRect;
					gi.step = function(tools) {
						if(!tools.closestPlayer(gi, playerEyeshot * 1.5, playerEyeshot * 1.5, true)) {
							tools.destroyMe(gi);
						}
					}
					gi.anim.play("die" + (gi.way ? "Right" : "Left"));
					tools.audio.play(FuzedGame.Config.sfx.wheelieDie);
				}
				break;
				
				case "grog":
				setupToEnemy(gi);
				gi.value = 230;
				gi.hitRect = {x:4, y:7, w:24, h:25};
				gi.died = false;
				gi.anim.add("goLeft", "grog.left.png");
				gi.anim.add("goRight", "grog.right.png");
				gi.anim.add("jumpLeft", "grog.left.jump.png");
				gi.anim.add("jumpRight", "grog.right.jump.png");
				gi.anim.add("dieLeft", "grog.left.die.png");
				gi.anim.add("dieRight", "grog.right.die.png");
				gi.speed = 1;
				gi.ySpeed = 0;
				var freeJump = true;
				var step_base = gi.step;
				var step_walk = function(tools){
					step_base(tools);
					if(freeJump) {
						var target;
						if((target = tools.closestPlayer(gi, 64, 16))){
							 gi.attack(target);
						}
					}
				};
				var step_jump = function(tools){
					gi.anim.step();
					var oldY = gi.y;
					gi.ySpeed *= gi.ySpeed < 0 ? .75 : (gi.ySpeed < 8 ? 1.2 : 1);
					if(gi.ySpeed > -1 && gi.ySpeed < 0) 
						gi.ySpeed = 1;
					gi.y += gi.ySpeed;
					gi.x += gi.speed * (gi.way ? 1 : -1);
					
					if(!gi.died) {
						gi.ground = tools.sreachWall("top", oldY, gi);
						if(gi.ground) {
							gi.y = gi.ground.y - gi.h;
							var target;
							if (gi.ground.l <= gi.hitRect.w &&
								(target = tools.closestPlayer(gi, 800, 800))) 
							{
								gi.attack(target)
							}
							else {
								gi.ySpeed = 0;
								gi.speed = 1;
								gi.anim.play("go"+(gi.way ? "Right" : "Left"));
								freeJump = false;
								setTimeout(function(){freeJump = true}, 1200);
								gi.step = step_walk;
							}
						};
					}

					if(tools.checkMyDeathLine(gi)){
						tools.destroyMe(gi);
					}
				}
				gi.step = step_walk;
				
				gi.attack = function(target){
					gi.ground = undefined;
					gi.ySpeed = -5;
					gi.speed = 7;
					gi.way = target.xd > 0;
					gi.anim.play((gi.died ? "die" : "jump")+(gi.way ? "Right" : "Left"));
					gi.step = step_jump;
				}
				
				gi.kill = function(){
					delete gi.isEnemy;
					delete gi.hitRect;
					gi.died = true;
					gi.attack({xd:(gi.way ? 1 : -1)});
					gi.speed *= .3;
					gi.ySpeed *= 2;
					tools.audio.play(FuzedGame.Config.sfx.grogDie);
				}
				break;
				
				case "slinky":
				gi.hitRect = {x:4, y:2, w:24, h:30};
				setupToEnemy(gi);
				gi.speed = 0;
				gi.value = 70;
				gi.anim.add("slink", "slinky.png");
				var animLength = gi.anim.getAnimLength("slink");
				gi.onChangeWay = function(){
					gi.x += 15 * (gi.way ? 1 : -1);
					gi.anim.play("slink", function(){
						gi.x += 15 * (gi.way ? 1 : -1);
					}, !gi.way);
				}
				var  super_kill = gi.kill;
				gi.kill = function() {
					super_kill();
					tools.audio.play(FuzedGame.Config.sfx.slinkyDie);
				}
				var step_base = gi.step;
				
				gi.step = function(tools){
					step_base(tools);
					var f = gi.anim.getCurrentFrame();
					var s = f/animLength;
					gi.hitRect.x = 2 + (s > .5 ? (s-.5)*36 : 0);
					gi.hitRect.y = 28 - Math.sin(s*Math.PI)*24;
					gi.hitRect.w = 8 + Math.sin(s*Math.PI)*16;
					gi.hitRect.h = 32 - gi.hitRect.y;
				}
				break;
				
				case "exit":
				delete gi.canvas;
				// gi.hitRect = {x:10, y:14, w:44, h:50};
				gi.hitRect = {x:22, y:30, w:20, h:34};
				gi.anim_bg = Animator.create();
				gi.anim_fg = Animator.create();
				gi.canvas_fg = gi.anim_fg.canvas;
				gi.appear = function(){
					gi.canvas_bg = undefined;
					gi.canvas_fg = gi.anim_fg.canvas;
					gi.anim_fg.add("appear", "exitpost_appear.png");
					gi.anim_fg.play("appear", function(){
						gi.appeared();
					});
					gi.step = function(){ gi.anim_fg.step() };
					tools.audio.play(FuzedGame.Config.sfx.exitAppear);
				}
				gi.appeared = function(){
					gi.canvas_bg = gi.anim_bg.canvas;
					gi.anim_bg.add("idle", "exitpost_back.png");
					gi.anim_fg.add("idle", "exitpost_overlay.png");
					gi.anim_bg.play("idle");
					gi.anim_fg.play("idle");
					gi.step = function(tools){
						gi.anim_bg.step();
						gi.anim_fg.step();
						var collosions = tools.getCollosions(gi);
						if(collosions.length) {
							var c;
							for(var i in collosions) {
								c = collosions[i];
								if((c.type === "player1" || c.type === "player2") && !c.isDied()) {
									c.removeFromGame();
									gi.disappear();
								}
							}
						}
					}
				}
				gi.disappear = function(){
					gi.canvas_bg = undefined;
					var ended = 0;
					gi.anim_fg.add("disappear", "exitpost_disappear.png");
					gi.anim_fg.play("disappear", function(){
						ended = 1;
						gi.canvas_fg = undefined;
					});
					gi.step = function(tools){
						gi.anim_fg.step();
						if(ended > 0) ++ended; 
						if(ended >= 20) {
							gi.canvas_fg = undefined;
							if(tools.playersOnScreen() > 0) {
								gi.step = baseStep;
							}
							else {
								tools.closeGame(true);
							}
						}
					};
					tools.audio.play(FuzedGame.Config.sfx.exitDisappear);
				}
				function baseStep(tools) {
					if(tools.closestPlayer(gi, playerEyeshot * .3, playerEyeshot * .3, true)) {
						gi.appear();
					}
				}
				gi.step = baseStep;
				break;
				
				case "player1":
				setupToPlayer(gi);
				break;
				
				case "player2":
				setupToPlayer(gi, true);
				break;
			}
			return gi;
		}
		
		function setupToPickUp(gi) {
			gi.pickedUp = false;
			gi.readyToDestroy = false;
			gi.pickedUpAnimFile = "picked_up_16x16.png";
			var sounds = [FuzedGame.Config.sfx.pickupGem1,
						FuzedGame.Config.sfx.pickupGem2,
						FuzedGame.Config.sfx.pickupGem3];
			gi.pickUp = function(){
				tools.audio.play(gi.pickupSfx || sounds[~~(sounds.length*Math.random())]);
				if(gi.pickedUp) return false;
				gi.inGame = false;
				gi.pickedUp = true;
				if(!gi.anim) gi.anim = Animator.create();
				gi.canvas = gi.anim.canvas;
				gi.anim.add("picked", gi.pickedUpAnimFile)
				gi.anim.play("picked", function(){
					gi.readyToDestroy = true;
				});
				gi.step = function(tools){
					gi.anim.step();
					if(gi.readyToDestroy) tools.destroyMe(gi);
				};
				return true;
			}
		}
		
		function setupToExploitBomb(gi, thrower) {
			var type = gi.type.slice(8);
			gi.readyToDestroy = false;
			gi.anim_fg = Animator.create();
			gi.anim_fg.add("idle", type+"_floor.png");
			gi.anim_fg.play("idle");
			gi.canvas_fg = gi.anim_fg.canvas;
			gi.hitRect = {x:2, y:2, w:12, h:12};
			var step_base = gi.step = function(tools){
				if(!gi.ground){
					var oldY = gi.y;
					if(!gi.ySpeed) gi.ySpeed = 4;
					gi.ySpeed *= gi.ySpeed < 8 ? 1.2 : 1;
					gi.y += gi.ySpeed;
					gi.ground = tools.sreachWall("top", oldY, gi);
					if(gi.ground) {
						gi.y = gi.ground.y - gi.h;
					}
				}
				gi.anim_fg.step()
			};
			if(type === "bomb") {
				setTimeout(blewUp, 5000);
			} else if(type === "dynamite") {
				gi.fire = function(){
					blewUp();
					gi.fire = undefined;
				}
			}
			else {//if mine
				gi.hitRect = {x:1, y:6, w:14, h:10};
				gi.step = function(tools){
					step_base(tools);
					if(gi.ground) {
						var collosions = tools.getCollosions(gi);
						if(collosions.length) {
							var c;
							for(var i in collosions){
								var c = collosions[i];
								if(c.isEnemy || (c.isPlayer && c !== thrower)) {
									blewUp();
									break;
								}
							}
						}		
					}
				}
			}
			function blewUp(){
				tools.audio.play(FuzedGame.Config.sfx.explosion);
				gi.x -= 24;
				gi.y -= 48;
				gi.w = gi.h = 64;
				gi.hitRect = {x:0, y:0, w:64, h:64};
				gi.expAnim_bg = Animator.create();
				gi.expAnim_bg.add("exp", "explosion2.png");
				gi.expAnim_bg.play("exp");
				gi.canvas_bg = gi.expAnim_bg.canvas;
				gi.expAnim_fg = Animator.create();
				gi.expAnim_fg.add("exp", "explosion.png");
				gi.expAnim_fg.play("exp", function(){
					gi.readyToDestroy = true;
				});
				gi.canvas_fg = gi.expAnim_fg.canvas;
				var damaged = false;
				gi.step = function(tools){
					gi.expAnim_bg.step();
					gi.expAnim_fg.step();
					if(gi.readyToDestroy) tools.destroyMe(gi);
					
					if(!damaged) {
						damaged = true;
						var collosions = tools.getCollosions(gi);
						if(collosions.length) {
							var c;
							for(var i in collosions){
								c = collosions[i];
								if(c.isEnemy) {
									c.kill();
									thrower.addScore(c.value);
									tools.showPoint(c.value, c.x + c.w/2, c.y);
								}
								if(c.isPlayer) c.loseLife();
							}
						}	
					}
				}
			}
				
		}
		
		function setupToPlayer(gi){
			gi.isPlayer = true;
			gi.xSpeed = 0;
			gi.ySpeed = 1;
			gi.orient = -1;
			gi.anim = Animator.create();
			delete gi.canvas;
			gi.canvas_guys = gi.anim.canvas;
			gi.footMargin = 7.5;
			gi.hitRect = {x:5, y:6, w:22, h:26};
			var isSnipe = gi.type === "player1";
			var controls;
			if(isSnipe) {
				controls = FuzedGame.Config.hotkeys.dir.player1;
			} else {
				controls = FuzedGame.Config.hotkeys.dir.player2;
			}
			var hcMatch = FuzedGame.Config.hotkeys.isMatch;
			// gi.weaponKeys = {"66":"bomb", "78":"dynamite", "77":"mine"};
			
			gi.score = 0;
			gi.lifes = 3;
			gi.bombs = 0;
			gi.dynamites = 0;
			gi.mines = 0;
			gi.ground = undefined;
			gi.isDied = function(){return died};
			
			var stepperTools;
			var died = false;
			var onPickUpInvincibility = false;
			var onLifeLoseInvincibility = false;
			var invincibilityFlasherSetI;
			
			var aName = isSnipe ? "snipe" : "gripe";
			gi.anim.add("standLeft", aName+".stand_left.png");
			gi.anim.add("standRight", aName+".stand_right.png");
			gi.anim.add("haltLeft", aName+".skid_halt_left.png");
			gi.anim.add("haltRight", aName+".skid_halt_right.png");
			gi.anim.add("runLeft", aName+".run_left.png");
			gi.anim.add("runRight", aName+".run_right.png");
			gi.anim.add("standLeft", aName+".stand_left.png");
			gi.anim.add("standRight", aName+".stand_right.png");
			gi.anim.add("turnLeft", aName+".turn_left_to_right.png");
			gi.anim.add("turnRight", aName+".turn_right_to_left.png");
			gi.anim.add("jumpLeft", aName+".jump_left.png");
			gi.anim.add("jumpRight", aName+".jump_right.png");
			gi.anim.add("drop_bomb_left", aName+".facing_left_drop_bomb.png");
			gi.anim.add("drop_bomb_right", aName+".facing_right_drop_bomb.png");
			gi.anim.add("drop_dynamite_left", aName+".facing_left_drop_dynamite.png");
			gi.anim.add("drop_dynamite_right", aName+".facing_right_drop_dynamite.png");
			gi.anim.add("drop_mine_left", aName+".facing_left_drop_mine.png");
			gi.anim.add("drop_mine_right", aName+".facing_right_drop_mine.png");
			gi.anim.add("trigger_dynamite_left", aName+".trigger_dynamite_left.png");
			gi.anim.add("trigger_dynamite_right", aName+".trigger_dynamite_right.png");
			gi.anim.add("blinkLeft", aName+".blink_facing_left.png");
			gi.anim.add("blinkRight", aName+".blink_facing_right.png");
			gi.anim.add("die", aName+".die.png");
			gi.anim.play("standLeft");
			
			function isBombKey(e) {
				if(hcMatch(e, controls.bomb)) return "bomb";
				if(hcMatch(e, controls.dynamite)) return "dynamite";
				if(hcMatch(e, controls.mine)) return "mine";
				return false;
			}
			gi.bombQuantity = function (type, increment) {
				increment = increment || 0;
				if (type === "bomb") return gi.bombs += increment;
				if (type === "dynamite") return gi.dynamites += increment;
				if (type === "mine") return gi.mines += increment;
			}
			gi.kDown = function(e){
				var type;
				if(hcMatch(e, controls.left) && gi.xSpeed !== -1) {
					gi.xSpeed = -1; 
					setAnimation();
					gi.orient = gi.xSpeed;
				}
				else if(hcMatch(e, controls.right) && gi.xSpeed !== 1) {
					gi.xSpeed = 1;
					setAnimation();
					gi.orient = gi.xSpeed;
				}
				else if(hcMatch(e, controls.up) && gi.ySpeed === 0) {
					gi.ySpeed = -18;
					gi.ground = undefined;
					setAnimation();
				}
				else if((type = isBombKey(e))) {
					dropBomb(type);
				}
			}
			gi.kUp = function(e){
				if(hcMatch(e, controls.left) && gi.xSpeed === -1) {
					gi.xSpeed = 0; 
					setAnimation();
				}
				else if(hcMatch(e, controls.right) && gi.xSpeed === 1) {
					gi.xSpeed = 0; 
					setAnimation();
				}
			}
			var onDropBomb = false;
			var waitingDynamite;
			function dropBomb(type){
				if(gi.xSpeed !== 0 || gi.ySpeed !== 0) return;
				if(type === "dynamite" && waitingDynamite){
					onDropBomb = true;
					gi.anim.play("trigger_dynamite_"+(gi.orient === 1 ? "right" : "left"), function(){
						onDropBomb = false;
						setAnimation();
					});
					gi.anim["onFrame5"] = function(){
						waitingDynamite.fire();
						waitingDynamite = undefined;
					}
				}
				else if(gi.bombQuantity(type) > 0 ){
					onDropBomb = true;
					gi.bombQuantity(type, -1);
					if(stepperTools) stepperTools.displayMe(gi);
					gi.anim.play("drop_"+type+"_"+(gi.orient === 1 ? "right" : "left"), function(){
						if(stepperTools) {
							var bomb = stepperTools.addBomb(type, gi.x + (gi.orient === 1 ? 16 : 0), gi.y + 16, gi);
							if(type === "dynamite") waitingDynamite = bomb;
						}
						onDropBomb = false;
						setAnimation();
					});
				}
			}
			var blinkSetT;
			function setAnimation(blink){
				clearTimeout(blinkSetT);
				if(onDropBomb) return;
				if(gi.ySpeed){
					gi.anim.play((gi.xSpeed || gi.orient) === 1 ? "jumpRight" : "jumpLeft");
				}
				else if(gi.xSpeed){
					if(gi.orient === gi.xSpeed) {
						gi.anim.play(gi.orient === 1 ? "runRight" : "runLeft");
					} else {
						gi.anim.play(gi.orient === 1 ? "turnRight" : "turnLeft", setAnimation);
					}
				}
				else {
					if(blink) {
						gi.anim.play(gi.orient === 1 ? "blinkRight" : "blinkLeft", function(){
							setAnimation();
						});
					}
					else {
						gi.anim.play(gi.orient === 1 ? "standRight" : "standLeft");
						blinkSetT = setTimeout(function(){setAnimation(true)}, 2300+2300*Math.random());
					}
				}
			}
			gi.step = function(tools) {
				if(!stepperTools) {
					stepperTools = tools;
					tools.displayMe(gi);
				}
				var isMove = gi.xSpeed || gi.ySpeed;
				if(gi.xSpeed) {
					var oldX = gi.x;
					gi.x += gi.xSpeed * 6;
					var wall;
					if(gi.xSpeed > 0) {
						wall = tools.sreachWall("left", oldX, gi);
						if(wall) {
							gi.x = wall.x - (gi.hitRect.x + gi.hitRect.w);
						}
					}
					else {
						wall = tools.sreachWall("right", oldX, gi);
						if(wall) {
							gi.x = wall.x - gi.hitRect.x;
						}
					}
					if(gi.ground){
						if (tools.checkGroundLeft(gi, gi.ground, false)){
							gi.ground = undefined;
							gi.y++;
							gi.ySpeed = 8;
							setAnimation();
						}
					}
				}
				if(gi.ySpeed) {
					var oldY = gi.y;
					gi.ySpeed *= gi.ySpeed < 0 ? .775 : (gi.ySpeed < 8 ? 1.2 : 1);
					if(gi.ySpeed > -3 && gi.ySpeed < 0) 
						gi.ySpeed = 3;
					gi.y += gi.ySpeed;
					if(!gi.ground && !died){
						if(gi.ySpeed > 0) {
							gi.ground = tools.sreachWall("top", oldY, gi);
							if(gi.ground){
								gi.y = gi.ground.y - gi.h;
								gi.ySpeed = 0;
								setAnimation();
							}
						}
						else {
							var ceiling = tools.sreachWall("bottom", oldY, gi);
							if(ceiling) {
								gi.y = ceiling.y - gi.hitRect.y;
								gi.ySpeed = 2;
							}
						}
					}
					if(tools.checkMyDeathLine(gi)) {
						tools.closeGame(false);
					}
				}
				var collosions = tools.getCollosions(gi);
				if(collosions.length && !died) {
					var c;
					for(var i in collosions) {
						c = collosions[i];
						if(c.pickUp && c.pickUp()) {
							if(c.isGem) {
								gi.addScore(~~c.value);
								tools.showPoint(c.value, c.x + c.w/2, c.y);
							}
							else if(c.type === "bomb") ++gi.bombs;
							else if(c.type === "dynamite") ++gi.dynamites;
							else if(c.type === "mine") ++gi.mines;
							else if(c.isLife) ++gi.lifes;
							
							tools.displayMe(gi);
						}
						else if(c.isEnemy){
							gi.loseLife();
						}
						else if(c.isTrap){
							gi.die();
						}
					}
				}
				//console.log(gi.x, gi.y,gi.xSpeed,gi.ySpeed,gi.speedY > -0.2, gi.speedY < 0);
				gi.anim.step();
			}
			gi.addScore = function(value){
				gi.score += value;
				if(stepperTools) stepperTools.displayMe(gi);
			}
			gi.turnKeyListening = function(on){
				// $(document.body)[on ? "on" : "off"]("keydown", gi.kDown);
				// $(document.body)[on ? "on" : "off"]("keyup", gi.kUp);
				FuzedGame.cb[(on ? "add" : "remove")]("keydown",  gi.kDown);
				FuzedGame.cb[(on ? "add" : "remove")]("keyup",  gi.kUp);
			}
			gi.turnKeyListening(true);
			gi.loseLife = function(){
				if(died || onLifeLoseInvincibility || onPickUpInvincibility) return;
				if(gi.lifes > 0){
					gi.lifes--;
					stepperTools.displayMe(gi);
					onLifeLoseInvincibility = true;
					invincibilityFlasherSetI = setInterval(function(){
						gi.canvas_guys = gi.canvas_guys ? undefined : gi.anim.canvas;
					}, 200);
					setTimeout(function(){
						clearInterval(invincibilityFlasherSetI);
						onLifeLoseInvincibility = false;
						gi.canvas_guys = gi.anim.canvas;
					}, 5000);
					tools.audio.play(FuzedGame.Config.sfx.playerDamage);
				}
				else {
					gi.die();
				}
			}
			gi.die = function(){
				if(!died) {
					died = true;
					gi.anim.play("die");
					gi.turnKeyListening(false);
					gi.xSpeed = 0;
					gi.ySpeed = -14;
					tools.audio.play(FuzedGame.Config.sfx.playerDie);
				}
			}
			gi.removeFromGame = function() {
				gi.turnKeyListening(false);
				if(stepperTools) stepperTools.destroyMe(gi);
			}
		}

		
		function setupToEnemy(gi) {
			gi.anim = Animator.create();
			gi.isEnemy = true;
			gi.canvas_guys = gi.anim.canvas;
			gi.anim.add("goLeft", "wheelie_left.png");
			gi.anim.add("goRight", "wheelie_right.png");
			gi.footMargin = 0;
			gi.way = true;
			gi.speed = 2;
			gi.ground = undefined;
			var readyToDestroy = false;
			gi.step = function(tools){
				if(!gi.ground){
					gi.ground = tools.sreachWall("top", gi.y, gi);
					if(!gi.ground) return;
				}
				if(!gi.anim.getNowPlayed()) gi.onChangeWay();
				gi.anim.step();
				gi.x += gi.speed * (gi.way ? 1 : -1);
				
				if(tools.checkGroundLeft(gi, gi.ground, true)) { 
					gi.way = !gi.way;
					gi.onChangeWay();
				}
				if(readyToDestroy){
					tools.destroyMe(gi);
				}
			}
			gi.onChangeWay = function() {
				gi.anim.play(gi.way ? "goRight" : "goLeft");
			}
			gi.kill = function(){
				readyToDestroy = true;
			}
		}
		return gi_global;
	}();
	
	var Animator = (function(){
		var animator_global = {};
		
		animator_global.create = function(){
			var a = {};
			var onFinish;
			var sources = {};
			var frameIdx; 
			var playedC;
			var playedSize;
			var playedLength;
			var playedName;
			a.getNowPlayed = function(){return playedName};
			var ctx = tools.createCtx();
			a.canvas = ctx.canvas;
			var onFinishAnim;
			var reversePlay = false;
			
			
			a.add = function(name, canvas) {
				if(typeof(canvas) === "string") {
					canvas = tools.spriteSheet.getImage(FuzedGame.spriteSheetName, canvas);
				}
				sources[name] = canvas;
			}
			a.play = function(name, onFinishCb, reverse) {
				if(!sources[name]) throw("Animator: not found name - "+name);
				onFinishAnim = onFinishCb;
				reversePlay = Boolean(reverse);
				playedName = name;
				playedC = sources[name];
				playedSize = playedC.height;
				playedLength = playedC.width / playedSize;
				a.canvas.width = a.canvas.height = playedSize;
				a.step(reversePlay ? playedLength-1 : 0);
			}
			a.step = function(idx) {
				if(!playedC) return;
				if(idx === undefined) {
					reversePlay ? --frameIdx : ++frameIdx;
					if(onFinishAnim && reversePlay && frameIdx === -1) onFinishAnim();
					if(onFinishAnim && !reversePlay && frameIdx === playedLength) onFinishAnim();
					frameIdx %= playedLength;
					if(frameIdx < 0) frameIdx += playedLength;
				}
				else {
					frameIdx = idx;
				}
				ctx.clearRect(0, 0, playedSize, playedSize);
				ctx.drawImage(playedC,
					frameIdx * playedSize, 0, playedSize, playedSize,
					0, 0, playedSize, playedSize);
				
				if (a["onFrame"+frameIdx]) {
					a["onFrame"+frameIdx]();
					a["onFrame"+frameIdx] = undefined;
				}
				return frameIdx;
			}
			a.getCurrentFrame = function(){
				return frameIdx;
			}
			a.getAnimLength = function(name){
				if(sources[name])
					return sources[name].width / sources[name].height;
				else
					return 0;
			}
			return a;
		}
		return animator_global;
	})();

	
	var Renderer = (function(){
		var rendererGlobal = {};
		
		rendererGlobal.create = function(map, renderW, renderH){
			var r_o = {};
			var ctx = tools.createCtx(renderW, renderH);
			r_o.ctx = ctx;
			r_o.canvas = ctx.canvas;
			
			var bgTypeIdx = FuzedGame.Config.BG_TYPES.indexOf(map.bgType);
			if(bgTypeIdx === -1) bgTypeIdx = 0;
			var bg = [
					BackGrounds.create_siberia,
					BackGrounds.create_checker,
					BackGrounds.create_ancient,
					BackGrounds.create_candy
			][bgTypeIdx]();
			
			//test renderer
			var bgCorners = {xMin:undefined, yMinjungle:undefined, xMax:undefined, yMax:undefined};
			var fgCorners = {xMin:undefined, yMin:undefined, xMax:undefined, yMax:undefined};
			
			function sreachCorners(items, c) {
				for(var i in items){
					var p = items[i]["p"];
					if (c.xMin > p[0] || c.xMin === undefined) 
						c.xMin = p[0];
					if (c.yMin > p[1] || c.yMin === undefined) 
						c.yMin = p[1];
					if (c.xMax < p[0] + p[2] || c.xMax === undefined) 
						c.xMax = p[0] + p[2];
					if (c.yMax < p[1] + p[3] || c.yMax === undefined) 
						c.yMax = p[1] + p[3];
				}
			}
			sreachCorners(map.bg, bgCorners);
			sreachCorners(map.fg, fgCorners);
			
			bgCorners.w = bgCorners.xMax - bgCorners.xMin || 0; 
			bgCorners.h = bgCorners.yMax - bgCorners.yMin || 1;
			var bgCtx = tools.createCtx(bgCorners.w || 1, bgCorners.h || 1);
			
			fgCorners.w = fgCorners.xMax - fgCorners.xMin || 0; 
			fgCorners.h = fgCorners.yMax - fgCorners.yMin || 1;
			var fgCtx = tools.createCtx(fgCorners.w || 1, fgCorners.h || 1);
			
			function coloringCtx(items, ctx, c){
				var gi;
				for(var i in items) {
					p = items[i]["p"];
					ctx.drawImage(cPalette, 
						p[4], p[5], p[2], p[3],  
						p[0]-c.xMin, p[1]-c.yMin, p[2], p[3])
				}
			}
			coloringCtx(map.bg, bgCtx, bgCorners);
			coloringCtx(map.fg, fgCtx, fgCorners);
			
			r_o.render = function(x, y) {
				//var time = +new Date();
				x = x || 0;
				y = y || 0;
				// ctx.fillRect(0, 0, renderW, renderH);
				ctx.drawImage(bg.render(x, y), 0, 0);
				var c = bgCtx.canvas;
				ctx.drawImage(c, 
					0, 0, c.width, c.height, 
					bgCorners.xMin + x, bgCorners.yMin + y, c.width, c.height);
				
				var layers = [
					/*0 not indexed*/["canvas"],
					/*1 bg*/["canvas_bg"],
					/*2 palyers and enemies*/["canvas_guys"],
					/*3 fg*/["canvas_fg"]
				];
				var i, j;
				for(i in map.items){
					var item = map.items[i];
					if(item.canvas) layers[0].push(item, item.canvas);
					if(item.canvas_bg) layers[1].push(item, item.canvas_bg);
					if(item.canvas_guys) layers[2].push(item, item.canvas_guys);
					if(item.canvas_fg) layers[3].push(item, item.canvas_fg);
				}
				// var yOff;
				for(i in layers){
					// yOff = i === "2" ? 1 : 0;
					for(j = 1, len = layers[i].length, cn = layers[i][0]; j < len; j+= 2) {
						var item = layers[i][j];
						ctx.drawImage(layers[i][j+1], 
							0, 0, item.w, item.h, 
							item.x + x, /*yOff + */item.y + y, item.w, item.h);
						//trace!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
						// if(item.hitRect){
							// ctx.beginPath();
							// ctx.strokeStyle = "#ff0088";
							// ctx.strokeRect(item.x + item.hitRect.x+.5 + x, item.y + item.hitRect.y+.5 + y,
								// item.hitRect.w-1, item.hitRect.h-1);
							// ctx.closePath();
						// }
						// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
					}
				}
				
				for(i in map.scores) {
					var score = map.scores[i];
					ctx.drawImage(score.canvas, 
						0, 0, score.w, score.h, 
						score.x + x, score.y + y, score.w, score.h);
				}
				
				c = fgCtx.canvas;
				ctx.drawImage(c,
					0, 0, c.width, c.height, 
					fgCorners.xMin + x, fgCorners.yMin + y, c.width, c.height);
				//trace!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
				// var wall, j;
				// ctx.beginPath();
				// ctx.strokeStyle = "#88ff00";
				// ctx.lineWidth = 2;
				// for(j in map.walls.top){
					// wall = map.walls.top[j];
					// ctx.moveTo(wall.x+x, .5+wall.y+y/*+10*Math.random()*/);
					// ctx.lineTo(wall.x+x + wall.l, .5+wall.y+y/*+10*Math.random()*/);
				// }
				// ctx.closePath();
				// ctx.stroke();
				
				// ctx.beginPath();
				// ctx.strokeStyle = "#00ff88";
				// ctx.lineWidth = 2;
				// for(j in map.walls.bottom){
					// wall = map.walls.bottom[j];
					// ctx.moveTo(wall.x+x, .5+wall.y+y/*+10*Math.random()*/);
					// ctx.lineTo(wall.x+x + wall.l, .5+wall.y+y/*+10*Math.random()*/);
				// }
				// ctx.closePath();
				// ctx.stroke();
				
				// ctx.beginPath();
				// ctx.strokeStyle = "#0088ff";
				// for(var j in map.walls.left){
					// var wall = map.walls.left[j];
					// ctx.moveTo(wall.x+x+.5/*+10*Math.random()*/, wall.y+y);
					// ctx.lineTo(wall.x+x+.5/*+10*Math.random()*/, wall.y+y + wall.l);
				// }
				// ctx.closePath();
				// ctx.stroke();
				
				// ctx.beginPath();
				// ctx.strokeStyle = "#8800ff";
				// for(var j in map.walls.right){
					// var wall = map.walls.right[j];
					// ctx.moveTo(wall.x+x+.5/*+10*Math.random()*/, wall.y+y);
					// ctx.lineTo(wall.x+x+.5/*+10*Math.random()*/, wall.y+y + wall.l);
				// }
				// ctx.closePath();
				// ctx.stroke();
				
				// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
				//console.log("renderTime: "+(+new Date()-time));
			}
			
			return r_o;
		}
		
		return rendererGlobal;
	}());
	
	var Screens = (function(){
		var screens_global = {};
		screens_global.crateGameOverScreen = function(w, h, onFinish){
			var o = {};
			o.layer = tools.Sprite.create();
			o.layer.ctx = tools.createCtx(w, h);
			o.layer.canvas = o.layer.ctx.canvas;
			o.layer.ctx.fillRect(0, 0, w, h);
			var text = tools.TextWriter.write("GAME OVER").canvas;
			o.layer.ctx.drawImage(text, (w-text.width)/2, (h-text.height)/2);
			setTimeout(onFinish, 2300);
			return o;
		}
		
		screens_global.crateWinnerScreen = function(w, h, giPlayersAll, onFinish) {
			var o = {};
			var giValues = {"invincibility": 120, "bomb": 30, "dynamite": 70, "mine": 70};
			o.layer = tools.Sprite.create();
			o.layer.ctx = tools.createCtx(w, h);
			o.layer.canvas = o.layer.ctx.canvas;
			o.layer.ctx.fillRect(0, 0, w, h);
			o.onFinish = onFinish;
			var stats = {};
			var t, i;
			for(i in giPlayersAll) {
				var gi = giPlayersAll[i];
				if(gi.type === "player1") {
					if(!stats.p1) stats.p1 = {s:0, l:0, b:0, d:0, m:0};
					stats.p1.s += gi.score;
					stats.p1.l += gi.lifes;
					stats.p1.b += gi.bombs;
					stats.p1.d += gi.dynamites;
					stats.p1.m += gi.mines;
					t = stats.p1;
				}
				else if(gi.type === "player2") {
					if(!stats.p2) stats.p2 = {s:0, l:0, b:0, d:0, m:0};
					stats.p2.s += gi.score;
					stats.p2.l += gi.lifes;
					stats.p2.b += gi.bombs;
					stats.p2.d += gi.dynamites;
					stats.p2.m += gi.mines;
					t = stats.p2;
				}
			}
			var is2p = Boolean(stats.p1 && stats.p2);
			
			function addLog(t) {
				t.text = tools.Sprite.create();
				t.text.canvas = tools.TextWriter.write("PLAYER" + (t === stats.p1 ? "1" : "2")).canvas;
				t.text.x = (w-t.text.canvas.width)/2;
				t.text.y = (h-t.text.canvas.height)/2 - 8;
				o.layer.add(t.text);
				t.scoreText = tools.Sprite.create();
				t.scoreText.canvas = tools.TextWriter.write("0").canvas;
				t.scoreText.x = (w-t.scoreText.canvas.width)/2;
				t.scoreText.y = (h-t.scoreText.canvas.height)/2 + 8;
				o.layer.add(t.scoreText);
				t.displayedScore = 0;
				t.targetScore = t.s || 0;
				t.items = [];
				
				function cp(type) {
					var dat = { p: FuzedGame.Config.itemsMap[type].p.concat()};
					dat.p.push(type);
					return GameItem.create(dat);
				}
				
				for(i = 0; i < t.l; ++i) t.items.push(cp("invincibility"));
				for(i = 0; i < t.b; ++i) t.items.push(cp("bomb"));
				for(i = 0; i < t.d; ++i) t.items.push(cp("dynamite"));
				for(i = 0; i < t.m; ++i) t.items.push(cp("mine"));
				
				var a;
				for(i in t.items) {
					var item = t.items[i];
					t.items[i] = tools.Sprite.create(item.canvas_fg);
					if(is2p) {
						a = Math.PI*Math.random();
						if(t === stats.p1) a += Math.PI;
					}
					else {
						a = Math.PI*Math.random()*2;
					}
					var r = 120*Math.random();
					t.items[i].x = ~~((w/2 - r/2) + r * Math.sin(a));
					t.items[i].y = ~~((h/2 - r/2) + r * Math.cos(a));
					t.items[i].gi = item;
					o.layer.add(t.items[i]);
				}
			}
			if(stats.p1) addLog(stats.p1);
			if(stats.p2) addLog(stats.p2);
			if(is2p) {
				stats.p1.text.y = (h-stats.p1.scoreText.canvas.height)/2 - 40;
				stats.p1.scoreText.y = (h-stats.p1.scoreText.canvas.height)/2 - 24;
				stats.p2.text.y = (h-stats.p2.scoreText.canvas.height)/2 +24;
				stats.p2.scoreText.y = (h-stats.p2.scoreText.canvas.height)/2 + 40;
			}
			
			function pickUpItem(){
				var t;
				var item;
				if(is2p) {
					i = ~~((stats.p1.items.length + stats.p2.items.length) * Math.random());
					if(i < stats.p1.items.length) {
						t = stats.p1;
						item = t.items[i];
					} else {
						t = stats.p2;
						item = t.items[i - stats.p1.items.length];
					}
				}
				else {
					if(stats.p1 && stats.p1.items.length) {
						t = stats.p1;
						item = t.items[~~(t.items.length * Math.random())];
					}
					if(stats.p2 && stats.p2.items.length) {
						t = stats.p2;
						item = t.items[~~(t.items.length * Math.random())];
					}
				}
				if(item) {
					item.gi.pickUp();
					setTimeout(pickUpItem, 300);
					t.targetScore += giValues[item.gi.type];
				}
			}
			pickUpItem();
			
			
			var sTools = {
				destroyMe: function(gi){
					var i, item;
					if(stats.p1) {
						for(i in stats.p1.items) {
							if(stats.p1.items[i].gi === gi) {
								item = stats.p1.items[i];
								stats.p1.items.splice(i, 1);
								break;
							}
						}
					}
					if(stats.p2 && !item) {
						for(i in stats.p2.items) {
							if(stats.p2.items[i].gi === gi) {
								item = stats.p2.items[i];
								stats.p2.items.splice(i, 1);
								break;
							}
						}
					}
					o.layer.remove(item);
					endTest();
				}
			}
			function onTick(){
				//count
				function stepPoints(t){
					if(t.targetScore - t.displayedScore < .3){
						t.displayedScore = t.targetScore;
						endTest();
					}
					else {
						t.displayedScore += (t.targetScore - t.displayedScore) / 12;
					}
					t.scoreText.canvas = tools.TextWriter.write(~~t.displayedScore).canvas;
					t.scoreText.x = (w-t.scoreText.canvas.width)/2;
				}
				if(stats.p1) stepPoints(stats.p1);
				if(stats.p2) stepPoints(stats.p2);
				//items
				var items = is2p ? stats.p1.items.concat(stats.p2.items) : (stats.p1 ? stats.p1.items.concat() : stats.p2.items.concat());
				for(i in items) {
					if(items[i].gi.step) items[i].gi.step(sTools);
				}
				
				o.layer.change();
			}
			var tickSetI = setInterval(onTick, TICK_SPEED);
			
			
			function endTest() {
				if ((!stats.p1 || (stats.p1.displayedScore === stats.p1.targetScore && stats.p1.items.length === 0)) &&
					(!stats.p2 || (stats.p2.displayedScore === stats.p2.targetScore && stats.p2.items.length === 0))
				) {
					delete o.layer.onDraw;
					clearInterval(tickSetI);
					if(o.onFinish) setTimeout(o.onFinish, 2000);
				}
			}
			
			return o;
		}
		
		screens_global.createGameMenu = function(){
			var o = FuzedGame.Screens.Submenu.create(
				[
					{name: "RESUME GAME", onClick: function(){
						if(o.onResume) o.onResume();
					}},
					{name: "CONTROLS", onClick: function(){
						var settings = FuzedGame.Screens.ControllSettings.create();
						FuzedGame.startFade(function(){o.layer.add(settings.layer)});
						settings.cb.add("exit", exitSettings);
						function exitSettings() {
							FuzedGame.startFade(function(){o.layer.remove(settings.layer)});
							settings.cb.remove("exit", exitSettings);
						}
					}},
					{name: "EXIT GAME", onClick: function(){
						if(o.onExitGame) o.onExitGame();
					}}
				],
				"transparentBlack"
			);
			return o;
		}
		
		screens_global.createPlayerStats = function(){
			var o = {};
			o.layer = tools.Sprite.create();
			o.layer.ctx = tools.createCtx(0, 48);
			o.layer.canvas = o.layer.ctx.canvas;
			o.refresh = function (p){
				var isP2 = p.type === "player2";
				var lifeLineStr = p.type+" ";
				for(var i = 0; i < p.lifes; ++i)  lifeLineStr += "♥";
				var lifeLine = tools.TextWriter.write(lifeLineStr);
				
				var scoreLineStr = "SCORE " + p.score;
				var scoreLine = tools.TextWriter.write(scoreLineStr);
				
				var invetoryLineStr = " ×"+p.bombs+" ×"+p.dynamites+" ×"+p.mines;
				var invetoryLine = tools.TextWriter.write(invetoryLineStr);
				var pos = 0;
				var im = FuzedGame.Config.itemsMap.bomb;
				invetoryLine.drawImage(cItems, 
					im.p[0], im.p[1], im.p[2], im.p[3], 
					pos*16, 0, im.p[2], im.p[3])
				pos = invetoryLineStr.indexOf(" ", pos+1);
				im = FuzedGame.Config.itemsMap.dynamite;
				invetoryLine.drawImage(cItems, 
					im.p[0], im.p[1], im.p[2], im.p[3], 
					pos*16, 0, im.p[2], im.p[3])
				pos = invetoryLineStr.indexOf(" ", pos+1);
				im = FuzedGame.Config.itemsMap.mine;
				invetoryLine.drawImage(cItems, 
					im.p[0], im.p[1], im.p[2], im.p[3], 
					pos*16, 0, im.p[2], im.p[3])
					
				o.layer.canvas.width = Math.max(lifeLineStr.length, 
					scoreLineStr.length, invetoryLineStr.length) * 16;
				
				if(isP2) {
					var w = o.layer.canvas.width;
					o.layer.x = FuzedGame.Config.gameWidth - w;
					o.layer.ctx.drawImage(lifeLine.canvas, w - lifeLine.canvas.width, 0);
					o.layer.ctx.drawImage(scoreLine.canvas, w - scoreLine.canvas.width, 16);
					o.layer.ctx.drawImage(invetoryLine.canvas, w - invetoryLine.canvas.width, 32);
				}
				else {
					o.layer.ctx.drawImage(lifeLine.canvas, 0, 0);
					o.layer.ctx.drawImage(scoreLine.canvas, 0, 16);
					o.layer.ctx.drawImage(invetoryLine.canvas, 0, 32);
				}
				o.layer.change();
			}
			
			return o;
		}
		return screens_global;
	}())
	
	var BackGrounds = (function(){
		var bg_global = {};
		var bgW = 640;
		var bgH = 480;
		bg_global.create_siberia = function(){
			var o = {};
			o.ctx = tools.createCtx(bgW, bgH);
			o.canvas = o.ctx.canvas;
			var cBack = tools.createCtx(bgW*2, bgH);
			var cFront = tools.createCtx(bgW*2, bgH);
			
			var src = tools.spriteSheet.getImage(FuzedGame.spriteSheetName, "area03_bkg0.png");
			cBack.drawImage(src, 0, 0);
			cBack.drawImage(src, bgW, 0);
			cBack = cBack.canvas;
			
			src = tools.spriteSheet.getImage(FuzedGame.spriteSheetName, "area03_bkg1.png");
			cFront.drawImage(src, 0, 0);
			cFront.drawImage(src, bgW, 0);
			cFront = cFront.canvas;
			src = undefined;
				
			o.render = function(x, y){
				var bx = (x / 10) % bgW;
				var fx = (x / 6) % bgW;
				if(bx > 0) bx -= bgW;
				if(fx > 0) fx -= bgW;
				o.ctx.drawImage(cBack, bx, 0);
				o.ctx.drawImage(cFront, fx, 0);
				return o.canvas;
			}
			
			o.destroy = function(){
				delete o.ctx;
				delete o.canvas;
				cBack = undefined;
				cFront = undefined;
			}
			
			return o;
		}
		bg_global.create_checker = function(){
			var o = {};
			o.ctx = tools.createCtx(bgW, bgH);
			o.canvas = o.ctx.canvas;
			o.ctx.globalCompositeOperation = "lighter";
			var cBack = tools.createCtx(bgW*2, bgH*2);
			var cFront = tools.createCtx(bgW*2, bgH*2);
			var backState = 0;
			var frontState = 0;
			
			var src = tools.spriteSheet.getImage(FuzedGame.spriteSheetName, "area01_bkg0.png");
			cBack.drawImage(src, 0, 0);
			cBack.drawImage(src, bgW, 0);
			cBack.drawImage(src, 0, bgH);
			cBack.drawImage(src, bgW, bgH);
			cBack = cBack.canvas;
			
			src = tools.spriteSheet.getImage(FuzedGame.spriteSheetName, "area01_bkg1.png");
			cFront.drawImage(src, 0, 0);
			cFront.drawImage(src, bgW, 0);
			cFront.drawImage(src, 0, bgH);
			cFront.drawImage(src, bgW, bgH);
			cFront = cFront.canvas;
			src = undefined;
			
			o.render = function(x, y){
				o.ctx.clearRect(0, 0, bgW, bgH);
				backState = (backState+1)  % bgW;
				var ox = (x / 10) % bgW;
				var oy = (y / 10 + backState) % bgH;
				if(ox > 0) ox -= bgW;
				if(oy > 0) oy -= bgH;
				o.ctx.drawImage(cBack, ox, oy);
				
				frontState = (frontState-1)  % bgW;
				ox = (x / 6) % bgW;
				oy = (y / 6 + frontState) % bgH;
				if(ox > 0) ox -= bgW;
				if(oy > 0) oy -= bgH;
				o.ctx.drawImage(cFront, ox, oy);
				return o.canvas;
			}
			
			o.destroy = function(){
				delete o.ctx;
				delete o.canvas;
				cBack = undefined;
				cFront = undefined;
			}
			
			return o;
		}
		bg_global.create_ancient = function(){
			var o = {};
			o.ctx = tools.createCtx(bgW, bgH);
			o.canvas = o.ctx.canvas;
			o.ctx.globalCompositeOperation = "lighter";
			var cBack = tools.createCtx(bgW*2, bgH);
			var cSmoke = tools.createCtx(bgW*2, bgH);
			var windState = 0;
			
			var src = tools.spriteSheet.getImage(FuzedGame.spriteSheetName, "area02_bkg0.jpg");
			cBack.drawImage(src, 0, 0);
			cBack.drawImage(src, bgW, 0);
			cBack = cBack.canvas;
			
			src = tools.spriteSheet.getImage(FuzedGame.spriteSheetName, "area02_bkg1.jpg");
			cSmoke.drawImage(src, 0, 0);
			cSmoke.drawImage(src, bgW, 0);
			cSmoke = cSmoke.canvas;
			src = undefined;
			
				
			o.render = function(x, y){
				windState = (windState+1)  % bgW;
				var bx = (x / 10) % bgW;
				var fx = (x / 4 + windState) % bgW;
				if(bx > 0) bx -= bgW;
				if(fx > 0) fx -= bgW;
				o.ctx.clearRect(0, 0, bgW, bgH);
				o.ctx.drawImage(cBack, bx, 0);
				o.ctx.drawImage(cSmoke, fx, 0);
				return o.canvas;
			}
			
			o.destroy = function(){
				delete o.ctx;
				delete o.canvas;
				cBack = undefined;
				cSmoke = undefined;
			}
			
			return o;
		}
		bg_global.create_candy = function() {
			var o = {};
			o.ctx = tools.createCtx(bgW, bgH);
			o.canvas = o.ctx.canvas;
			var src = tools.spriteSheet.getImage(FuzedGame.spriteSheetName, "area04_bkg0.png");
			var cBig = tools.createCtx(bgW*2, bgH*2);
			cBig.drawImage(src, 0, 0);
			cBig.drawImage(src, bgW, 0);
			cBig.drawImage(src, 0, bgH);
			cBig.drawImage(src, bgW, bgH);
			cBig = cBig.canvas;
			src = undefined;
			
			o.render = function(x, y){
				var ox = (x / 5) % bgW;
				var oy = (y / 5) % bgH;
				if(ox > 0) ox -= bgW;
				if(oy > 0) oy -= bgH;
				o.ctx.drawImage(cBig, ox, oy);
				return o.canvas;
			}
			
			o.destroy = function(){
				delete o.ctx;
				delete o.canvas;
				big = undefined;
			}
			return o;
		}
		return bg_global;
	}())
	return gameManagerGlobal;
}());