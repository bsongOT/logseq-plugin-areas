class CanvasDrawer
{
    canvas;
    ctx;
    img;
    imgSrc;
    movableRange;
    settings;
    muts;

    zoomScale = 1;
    viewOffset = {x: 0, y: 0};
    zoomMin = 1;

    constructor(_canvas, _imgSrc, _canvasSettings){
        this.canvas = _canvas;
        this.ctx = _canvas.getContext("2d");
        this.ctx.lineJoin = "round";
        this.settings = _canvasSettings;
        this.img = new Image();
        this.imgSrc = _imgSrc;
        this.img.src = _imgSrc;
        this.img.onload = () => {
            if (this.img.width <= this.img.height){
                this.zoomScale = this.zoomMin = this.img.width / this.img.height;
                this.movableRange = {x: _canvas.width, y: _canvas.height * this.img.height / this.img.width};
            }
            else{
                this.zoomScale = this.zoomMin = this.img.height / this.img.width;
                this.movableRange = {x: _canvas.width * this.img.width / this.img.height, y: _canvas.height};
            }
            this.adjustViewOffset();
            this.draw(ADM.areas);
        }
    }
    zoom(_areas, _force, _refPoint){
        const before = this.zoomScale;

        this.zoomScale *= 1 + _force;
        this.zoomScale = clamp(this.zoomMin, this.zoomScale, zoomMax);

        const zoomRatio = this.zoomScale / before;

        this.viewOffset.x -= (_refPoint.x + this.viewOffset.x) * (1 - zoomRatio);
        this.viewOffset.y -= (_refPoint.y + this.viewOffset.y) * (1 - zoomRatio);

        this.adjustViewOffset();
        this.draw(_areas);
    }
    moveView(_areas, _v){
        this.viewOffset.x += _v.x;
        this.viewOffset.y += _v.y;

        this.adjustViewOffset();
    }
    adjustViewOffset(){
        const [cw, ch, iw, ih] = [this.canvas.width, this.canvas.height, this.img.width, this.img.height];
        const [vox, voy] = [this.viewOffset.x, this.viewOffset.y];
        const zs = this.zoomScale;

        if (iw <= ih){
            if (zs >= 1) this.viewOffset.x = clamp(0, vox, cw * (zs - 1));
            else this.viewOffset.x = cw * (zs - 1) / 2;
            this.viewOffset.y = clamp(0, voy, ch * (ih / iw - 1) + cw * ih / iw * (zs - 1));
        }
        else{
            this.viewOffset.x = clamp(0, vox, cw * (iw / ih - 1) + ch * iw / ih * (zs - 1));
            if (zs >= 1) this.viewOffset.y = clamp(0, voy, ch * (zs - 1));
            else this.viewOffset.y = ch * (zs - 1) / 2;
        }
    }
    drawWithFloats(_areas, _selection, _float){
        if (!_areas || !_selection || !_float) return;

        switch(_float.kind){
            case "point":
                _areas[_selection.index.area].shapes[_selection.index.shape].points.splice(_float.index.point, 0, _float.piece);

                this.#drawBackground();
                this.#drawAreas(_areas);
        
                const areasPoints = _areas.map(a => a.toArray());
                let scope = areasPoints[_selection.index.area];
                if (_selection.index.shape !== -1) scope = scope[_selection.index.shape];
                this.#drawFloat(_float.kind, _areas, _float.index, _float.piece);
                this.#drawPoints(scope.flat());
        
                return _areas[_selection.index.area].shapes[_selection.index.shape].points.splice(_float.index.point, 1);
            case "shape":
            case "area":
                this.draw(_areas, _selection);
                return this.#drawFloat(_float.kind, _areas, _float.index, _float.piece);
        }
    }
    drawWithMutations(_areas, _selection, _mutations){
        this.muts = _mutations;
        this.draw(_areas, _selection);
        this.muts = null;
    }
    draw(_areas, _selection){
        this.#drawBackground();
        this.#drawAreas(_areas);

        if (!_selection?.index || (_selection.index.area === -1)) return;

        const areasPoints = _areas.map(a => a.toArray());
        let scope = areasPoints[_selection.index.area];
        if (!isNaN(_selection.index.shape) && (_selection.index.shape !== -1)) scope = scope[_selection.index.shape];
        this.#drawPoints(scope.flat());
    }
    #drawBackground(){
        const [cw, ch, iw, ih] = [this.canvas.width, this.canvas.height, this.img.width, this.img.height];
        const [vox, voy] = [this.viewOffset.x, this.viewOffset.y];
        const zs = this.zoomScale;
        this.ctx.clearRect(0, 0, cw, ch);

        if (iw <= ih){
            this.ctx.drawImage(this.img, 
                vox * ih / cw / zs + (iw - ih) / 2, voy * ih / ch / zs, 
                ih / zs, ih / zs, 
                0, 0, 
                cw, ch
            );
        }
        else {
            this.ctx.drawImage(this.img, 
                vox * ih / cw / zs, voy * ih / ch / zs + (ih - iw) / 2, 
                iw / zs, iw / zs, 
                0, 0, 
                cw, ch
            );
        }
        
        this.ctx.clearRect(0, 0, cw, ch);
        const side = Math.min(iw, ih) / zs;
        const part = { w: vox * side / cw, h: voy * side / ch };
        this.ctx.drawImage(this.img, part.w, part.h, side, side, 0, 0, cw, ch);
    }
    #drawAreas(_areas){
        if (this.muts?.[0]?.piece) {
            this.ctx.strokeStyle = "#ff000080";
            this.ctx.lineWidth = 3 * this.settings.lineW + 2 * this.settings.lineShadow;
            for (let i = 0; i < this.muts.length; i++){
                const m = this.muts[i];
                if (m.kind === "point") continue;
                else if (m.kind === "shape"){
                    const points = m.piece.points.map(a=>toCanvasPos(a, this.zoomScale, this.viewOffset));
                    this.#drawPolygon(points, false);
                }
                else if (m.kind === "area"){
                    const pointArrs = m.piece.shapes.map(a => 
                        a.points.map(p => toCanvasPos(p, this.zoomScale, this.viewOffset)));
                    pointArrs.forEach(arr => this.#drawPolygon(arr, false));
                }
            }
        }
        for (let i = 0; i < _areas.length; i++){
            let shapes = _areas[i].shapes;

            this.ctx.strokeStyle = "#000000";
            this.ctx.fillStyle = _areas[i].color + "80";

            this.#drawArea(shapes, _areas[i].color);
        }
    }
    #drawArea(_shapes, _rgbCode){
        this.ctx.strokeStyle = "#000000";
        this.ctx.lineWidth = this.settings.lineW + 2 * this.settings.lineShadow;

        for (let i = 0; i < _shapes.length; i++){
            let points = _shapes[i].points.map(a => toCanvasPos(a, this.zoomScale, this.viewOffset));
            this.#drawPolygon(points, false);
        }

        this.ctx.strokeStyle = _rgbCode;
        this.ctx.lineWidth = this.settings.lineW;

        for(let i = 0; i < _shapes.length; i++){
            let points = _shapes[i].points.map(a => toCanvasPos(a, this.zoomScale, this.viewOffset));
            this.#drawPolygon(points, true);
        }
    }
    #drawPolygon(_points, _mustFill){ //single line
        this.ctx.beginPath();
        this.ctx.moveTo(_points[0].x, _points[0].y);

        for (let j = 1; j < _points.length; j++) this.ctx.lineTo(_points[j].x, _points[j].y);            

        this.ctx.closePath();
        if (_mustFill) this.ctx.fill();
        this.ctx.stroke();
    }
    #drawPoints(_points){
        if (!_points) return;

        const points = _points.map(a => toCanvasPos(a, this.zoomScale, this.viewOffset));

        this.ctx.beginPath();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "#000000";
        this.ctx.fillStyle = "#ff0000";

        for (let i = 0; i < points.length; i++){
            this.ctx.beginPath();
            this.ctx.moveTo(points[i].x, points[i].y)
            this.ctx.arc(points[i].x, points[i].y, this.settings.controlPointR, 0, 2 * Math.PI);
            this.ctx.stroke();
            this.ctx.fill();
        }

        if (this.muts?.[0]?.piece) {
            this.ctx.strokeStyle = "#ff000080";
            this.ctx.lineWidth = 1.5 * this.settings.controlPointR;
            for (let i = 0; i < this.muts.length; i++){
                if (this.muts[i].kind !== "point") continue;
                const point = toCanvasPos(this.muts[i].piece, this.zoomScale, this.viewOffset);
                this.ctx.beginPath();
                this.ctx.moveTo(point.x, point.y);
                this.ctx.arc(point.x, point.y, 2 * this.settings.controlPointR, 0, 2 * Math.PI);
                this.ctx.stroke();
            }
        }
    }
    #drawFloat(_type, _areas, _index, _piece){
        switch(_type){
            case "point":{
                const points = _areas[_index.area].shapes[_index.shape].points.map(a => toCanvasPos(a, this.zoomScale, this.viewOffset));
                const float = toCanvasPos(_piece, this.zoomScale, this.viewOffset);
                const idx = _index.point;
                const prevIdx = (idx + points.length - 1) % points.length;
                const nextIdx = (idx + 1) % points.length;
                this.ctx.strokeStyle = "#ffffff";
                this.ctx.lineWidth = this.settings.lineW;
                this.ctx.beginPath();
                this.ctx.setLineDash([10, 10]);
                this.ctx.moveTo(points[prevIdx].x, points[prevIdx].y);
                this.ctx.lineTo(float.x, float.y);
                this.ctx.moveTo(points[nextIdx].x, points[nextIdx].y);
                this.ctx.lineTo(float.x, float.y);
                this.ctx.stroke();
                return this.ctx.setLineDash([]);
            }
            case "shape":
                this.ctx.fillStyle = _areas[_index.area].color + "80";
                this.#drawArea([_piece], "#ffffff");
                this.ctx.setLineDash([10, 10]);
                this.ctx.fillStyle = "#00000000";
                this.#drawArea([_piece], _areas[_index.area].color);
                return this.ctx.setLineDash([]);
            case "area":
                this.ctx.fillStyle = _piece.color + "80";
                this.#drawArea(_piece.shapes, "#ffffff");
                this.ctx.setLineDash([10, 10]);
                this.ctx.fillStyle = "#00000000";
                this.#drawArea(_piece.shapes, _piece.color);
                return this.ctx.setLineDash([]);
        }
    }
}