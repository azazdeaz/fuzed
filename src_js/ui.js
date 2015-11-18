var tools = window.tools = tools || {};
tools.ui = (function(){
	var o = {};
	
	o.textBtn = (function(){
		var o = {};
		var hlCanvas;
		var tCanvas;
		
		o.create = function(str, onClickCb) 
		{
			var o = {};
			o.layer = tools.Sprite.create();
			var onHL = false;
			var onT = false;
			var fullCtx;
			
			o.write = function(str) {
				fullCtx = tools.TextWriter.write(" "+str, 16);
				o.layer.canvas = fullCtx.canvas;
				o.layer.setHitRect(16, 0, str.length*16, 16);
				o.layer.name = "btn_"+str;
				o.layer.w = (str.length+1)*16;
				o.text = str;
				setIndicator();
				o.layer.change();
			}
			o.write(str);
			
			o.layer.cb.add("mouseover", onMouseOver);
			o.layer.cb.add("mouseout", onMouseOut);
			o.layer.cb.add("click", onClick);
			function onMouseOver(e){
				o.turnHL(true);
				return true;
			}
			function onMouseOut(e){
				o.turnHL(false);
				return true;
			}
			function onClick(e){
				if(onClickCb) onClickCb(o.text);
				return true;
			}
			
			o.turnHL = function(on){
				if(onHL != on) {
					onHL = on;
					setIndicator();
				}
			}
			
			o.toggle = function(on){
				if(onT != on) {
					onT = on;
					setIndicator();
				}
			}
			
			function setIndicator(){
				fullCtx.clearRect(0, 0, 16, 16);
				if(onT) fullCtx.drawImage(tCanvas || createTCanvas(), 0, 0);
				else if(onHL) fullCtx.drawImage(hlCanvas || createHLCanvas(), 0, 0);
				o.layer.change();
			}
			
			o.destroy = function(){
				o.layer.cb.remove("mouseover", onMouseOver);
				o.layer.cb.remove("mouseout", onMouseOut);
				o.layer.cb.remove("click", onClick);
				delete o;
			}
			
			return o;
		}
		
		function createHLCanvas() {
			var hlCtx = tools.createCtx(16, 16);
			hlCtx.save();
			hlCtx.translate(16, 0);
			hlCtx.scale(-1, 1);
			tools.TextWriter.write("«", 16, undefined, hlCtx);
			hlCtx.restore();
			hlCanvas = hlCtx.canvas;
			return hlCanvas;
		}
		function createTCanvas() {
			var tCtx = tools.createCtx(16, 16);
			tCtx.save();
			tCtx.rotate(Math.PI/2);
			tCtx.translate(0, -16);
			tools.TextWriter.write("^", 16, undefined, tCtx);
			tCtx.restore();
			tCanvas = tCtx.canvas;
			return tCanvas;
		}
		return o;
	}());
	
	o.selectList = (function(){
		var o = {};
		o.ALIGN_MIDDLE = "middle";
		o.ALIGN_LEFT = "left";
		o.ALIGN_RIGHT = "right";
		o.create = function(btnNames, align, spacing) {
			spacing === undefined && (spacing = 2);
			btnNames === undefined && (btnNames = []);
			var sl_o = {};
			sl_o.layer = tools.Sprite.create();
			var btns = [];
			var longestBtn;
			var lastSelected;
			var onToggleLastSelected = false;
			
			function init() {
				for(var i in btnNames){
					sl_o.add(btnNames[i]);
				}
			}
			
			sl_o.add = function(name){
				var btn = tools.ui.textBtn.create(name, onClick)
				btns.push(btn);
				sl_o.layer.add(btn.layer);
				alignBtns();
			}
			
			sl_o.remove = function(name) {
				for(var i in btns) {
					var btn = btns.splice(i, 1)[0];
					sl_o.layer.remove(btn.layer);
					btn.destroy();
					alignBtns();
					break;
				}
			}
			
			sl_o.removeAll = function() {
				while(btns.length) {
					sl_o.remove(btns[0].text);
				}
			}
			
			sl_o.getLastSelected = function() {
				return lastSelected;
			}
			
			sl_o.toggleLastSelected = function(on) {
				on = Boolean(on);
				if(onToggleLastSelected !== on){
					onToggleLastSelected = on;
					setToggle();
				}
			}
			
			function setToggle() {
				for(var i in btns) {
					btns[i].toggle(onToggleLastSelected && btns[i].text === lastSelected);
				}
			}
			
			function alignBtns(){
				var i;
				longestBtn = undefined;
				for(var i in btns) {
					if(btns[i].text.length > longestBtn || longestBtn === undefined) {
						longestBtn = btns[i].text.length;
					}
				}
				sl_o.layer.w = (longestBtn || 0)*16;
				sl_o.layer.h = (16+spacing)*btns.length;
				sl_o.layer.setHitRect(0, 0, sl_o.layer.w, sl_o.layer.h);
				for(var i in btns) {
					if(align === o.ALIGN_MIDDLE) {
						btns[i].layer.x = (longestBtn - btnNames[i].length) * 8 - 16;
					}
					else if(align === o.ALIGN_RIGHT) {
						btns[i].layer.x = (longestBtn - btnNames[i].length) * 16 -16
					}
					btns[i].layer.y = (16+spacing)*i;
				}
				sl_o.layer.change();
			}
			
			function onClick(name) {
				lastSelected = name;
				if(onToggleLastSelected) setToggle();
				if(sl_o.onClick) sl_o.onClick(name);
			}
			
			sl_o.destroy = function(){
				for(var i in btns){
					btns[i].destroy();
					delete btns[i];
				}
			}
			
			init();
			return sl_o;
		}
		return o;
	}())
	
	o.window = (function(){
		var o = {}
		// o.isReady = tools.createIsReady();
		var textAreaCtx;
		var inited = false;
		
		function g_init(){
			inited = true;
			textAreaCtx = tools.spriteSheet.getImage(FuzedGame.spriteSheetName, "text_area.png");
		}
		
		// tools.Loader.loadImg(
			// tools.Loader.paths.gui + "text_area.png", 
			// function(img){ textAreaCtx = img; o.isReady.turnToReady()})
		
		o.create = function(title, w, h, helpText){
			if(!inited) g_init();
			var o = {};
			o.cb = tools.create_callback();
			if(helpText) o.helpText = helpText;
			var selectedPage = 0;
			var minimized = false;
			o.layer = tools.Sprite.create();
			o.layer.name = "window_"+title;
			var bgCtx = tools.createCtx();
			var bgBitmap = tools.Sprite.create(bgCtx.canvas);
			bgBitmap.name = "bg";
			o.layer.add(bgBitmap);
			var headLine = createHeadLine();
			var resizeLayer = createResizeLayer();
			var normalSize = {w:48, h:48};
			var minSize = {w:48, h:32};
			var size = normalSize;
			
			o.container = tools.Sprite.create();
			o.container.x = 6;
			o.container.y = 18;
			o.container.name = "container";
			
			o.layer.add(o.container);
			o.layer.add(resizeLayer);
			o.layer.add(headLine.layer);
			
			function init(){
				o.setSize(w || 80, h || 60);
				o.layer.cb.add("mousedown", onPress);
				resizeLayer.cb.add("mousedown", onResizeMDown);
				render();
			}
			
			function render(){
				o.container.setMaskRect(0, 0, size.w-12, size.h-24);
				o.container.setHitRect(0, 0, size.w-12, size.h-24);
				resizeLayer.x = size.w-18
				resizeLayer.y = size.h-18
				bgCtx.canvas.width = size.w;
				bgCtx.canvas.height = size.h;
				o.layer.setHitRect(0, 0, size.w, size.h);
				renderBg();
				headLine.render();
				o.layer.change();
			}
			
			o.setSize = function(w, h){
				normalSize.w = Math.max(48, w);
				normalSize.h = Math.max(48, h);
				render();
				o.cb.call("paramsChange");
			}
			
			o.getNormalW = function(){return normalSize.w};
			o.getNormalH = function(){return normalSize.h};
			o.getIsMinimized = function(){return minimized};
			
			o.setMinimized = function(min){
				min = Boolean(min);
				if(min === minimized) return;
				minimized = min;
				size = minimized ? minSize : normalSize;
				render();
				o.cb.call("paramsChange");
			}
			
			function onPress(e) {
				var mdx = e.x;//mouseDownX
				var mdy = e.y;
				var mdLoc = e.getLocal(o.layer);
				var sx = o.layer.x;
				var sy = o.layer.y;
				
				if(o.layer.stage) {
					o.layer.stage.cb.add("mousemove", onDrag);
					o.layer.stage.cb.add("mouseup", onDragEnd);
					o.layer.stage.cb.add("mouseleave", onDragEnd);
				}
			
				function onDrag(e) {
					o.layer.x = (e.x - mdx) + sx;
					o.layer.y = (e.y - mdy) + sy;
					o.layer.change();
					o.cb.call("paramsChange");
				}
				
				function onDragEnd(e) {
					o.layer.stage.cb.remove("mousemove", onDrag);
					o.layer.stage.cb.remove("mouseup", onDragEnd);
					o.layer.stage.cb.remove("mouseleave", onDragEnd);
				}
			}
			
			function onResizeMDown(e) {
				if(minimized) return;
				var mdx = e.x;//mouseDownX
				var mdy = e.y;
				var sw = normalSize.w;
				var sh = normalSize.h;
				o.layer.stage.cb.add("mousemove", onResize);
				o.layer.stage.cb.add("mouseup", onResizeEnd);
				o.layer.stage.cb.add("mouseleave", onResizeEnd);
				
				function onResize(e) {
					if(!o.layer.onDraw) {
						o.layer.onDraw = function() {
							o.setSize((e.x - mdx) + sw,
									  (e.y - mdy) + sh);
							render();
							delete o.layer.onDraw;
						}
						o.layer.change();
					}
					return true;
				}
				
				function onResizeEnd(e) {
					o.layer.stage.cb.remove("mousemove", onResize);
					o.layer.stage.cb.remove("mouseup", onResizeEnd);
					o.layer.stage.cb.remove("mouseleave", onResizeEnd);
					return true;
				}
				return true;
			}
			
			function renderBg() {
				var w = size.w;
				var h = size.h-10;
				
				bgCtx.save();
				bgCtx.translate(0, 10);
				bgCtx.drawImage(textAreaCtx, 0, 0, 16, 16, 0, 0, 16, 16);
				if(w > 32) bgCtx.drawImage(textAreaCtx, 16, 0, 16, 16, 16, 0, w-32, 16);
				bgCtx.drawImage(textAreaCtx, 32, 0, 16, 16, w-16, 0, 16, 16);
				
				if(h > 32) {
					bgCtx.drawImage(textAreaCtx, 48, 0, 16, 16, 0, 16, 16, h-32);
					if(w > 32) bgCtx.drawImage(textAreaCtx, 64, 0, 16, 16, 16, 16, w-32, h-32);
					bgCtx.drawImage(textAreaCtx, 80, 0, 16, 16, w-16, 16, 16, h-32);
				}
				
				bgCtx.drawImage(textAreaCtx, 96, 0, 16, 16, 0, h-16, 16, 16);
				if(w > 32) bgCtx.drawImage(textAreaCtx, 112, 0, 16, 16, 16, h-16, w-32, 16);
				bgCtx.drawImage(textAreaCtx, 128, 0, 16, 16, w-16, h-16, 16, 16);
				bgCtx.restore();
			}
			
			function createResizeLayer(){
				var ctx = tools.createCtx(14, 14);
				var s = tools.Sprite.create(ctx.canvas);
				s.setHitRect(0, 0, 14, 14);
				s.name = "resize hook";
				
				ctx.strokeStyle = "#aa0000";
				ctx.moveTo(0, 14);
				ctx.lineTo(14, 0);
				ctx.moveTo(3, 14);
				ctx.lineTo(14, 3);
				ctx.moveTo(6, 14);
				ctx.lineTo(14, 6);
				ctx.stroke();
				
				return s;
			}
			
			function createHeadLine() {
				var hl_o = {};
				hl_o.layer = tools.Sprite.create();
				var lastWidth;
				
				var sTitle = tools.Sprite.create();
				sTitle.mouseEnabled = false;
				var savedTitle = "";
				hl_o.layer.add(sTitle);
				
				var sControls = tools.Sprite.create();
				sControls.cb.add("mousedown", onControlClick);
				var savedControls = ""
				hl_o.layer.add(sControls);
				
				hl_o.render = function(){
					var str = title || "EMPTY";
					if(savedTitle !== str){
						cSavedTitle = tools.TextWriter.write(str).canvas;
						savedTitle = str;
						sTitle.canvas = cSavedTitle;
						sTitle.change();
					}
					var controls = (minimized ? "+" : "-") + "?";
					if(savedControls !== controls){
						sControls.canvas = tools.TextWriter.write(controls).canvas;
						sControls.setHitRect(0, 0, sControls.canvas.width, 16);
						savedControls = controls;
						sControls.change();
					}
					if(bgCtx.canvas.width !== lastWidth){
						lastWidth = bgCtx.canvas.width;
						hl_o.layer.setHitRect(0, 0, lastWidth, 16);
						sControls.x = lastWidth - sControls.canvas.width;
						hl_o.layer.change();
					}
					minSize.w = sTitle.canvas.width + sControls.canvas.width;
				}
				function onControlClick(e){
					var mLoc = e.getLocal(sControls);
					var controlKey = savedControls.charAt(~~(mLoc.x/16));
					if(commands[controlKey]) commands[controlKey]();
					return true
				}
				var commands = {};
				commands["-"] = function(){
					o.setMinimized(true);
					hl_o.render();
				}
				commands["+"] = function(){
					o.setMinimized(false);
					hl_o.render();
				}
				commands["?"] = function(){
					if(o.helpText) {
						alert(o.helpText);
					}
				}
				return hl_o;
			}
			
			init();
			return o;
		}
		return o;
	}());
	return o;
}());
