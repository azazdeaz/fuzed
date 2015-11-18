addEventListener("message", function(e){
	var src = e.data.imageData.data;
	var srcW = e.data.imageData.width;
	var srcH = e.data.imageData.height;
	var map = e.data.d;
	
	var x, y, w, h, a, lw;
	for(var fName in map.frames) {
		var f = map.frames[fName];
		x = f.frame.x;
		y = f.frame.y;
		w = f.frame.w;
		h = f.frame.h;
		a = new Uint8ClampedArray(w*h*4);
		lw = w*4;
		for(var yp = y, yl = y+h; yp < yl; ++yp) {
			var p = (srcW * yp + x)*4;
			a.set(src.subarray(p, p+lw), lw*(yp-y));
		}
		postMessage({
			type: "image",
			fileName:fName, 
			imageData: {data:a, width:w, height:h}
		});
	}
	postMessage({type: "finish"});
})