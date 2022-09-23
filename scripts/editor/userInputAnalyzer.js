class UserInputAnalyzer{
    isDragging;
    isEditingText;

    target;

    canvasDownPos;
    canvasDownOffset;
    nextAreaColor;

    constructor(_doc, _canvas){
        this.isDragging = false;
        this.isEditingText = false;
        this.target = null;
        this.canvasDownPos = { x: 0, y: 0 };
        this.canvasDownOffset = { x: 0, y: 0 };
        this.nextAreaColor = getRandomRGB();

        _canvas.onwheel = this.#handleCanvasWheel;
        _canvas.onmousedown = this.#handleCanvasMouseDown;
        _canvas.onmouseleave = this.#handleCanvasMouseLeave;
        _doc.onmousemove = this.#handleMouseMove;
        _doc.onkeydown = this.#handleKeyInput;
        _doc.onkeyup = this.#handleKeyUp;
        _doc.onmousedown = this.#handleMouseDown;
        _doc.onmouseup = this.#handleMouseUp;

        for (let i = 0; i < DER.accordions.length; i++) this.initAcc(DER.accordions[i]);     
    }
    initAcc = (acc) => {
        this.#initInput("accordion", acc, DER.accordions);
        const shapeMenuL = DER.get(acc, "shapesMenu");
        for (let j = 0; j < shapeMenuL.children.length; j++)
            this.#initInput("shapeItem", shapeMenuL.children[j], DER.accordions);
    }
    initShapeItem = (item) => {
        this.#initInput("shapeItem", item, DER.accordions)
    }
    //#region Input to Behavior
    #handleKeyInput = (e) => {
        if (!UIA || !DER || !ECP || !ADM) return;
        if (this.isEditingText) {
            if (e.code === "Enter") document.activeElement.blur(); 
            else return;
        }
        const key = e.code;

        if (e.shiftKey) ECP.report("changeTool", new SwitchTool("hand"));

        if (key === "Digit1") ECP.report("changeMode", new SwitchMode("point"));
        else if (key === "Digit2") ECP.report("changeMode", new SwitchMode("shape"));
        else if (key === "Digit3") ECP.report("changeMode", new SwitchMode("area"));

        else if (key === "KeyQ") ECP.report("changeTool", new SwitchTool("select"));
        else if (key === "KeyW") ECP.report("changeTool", new SwitchTool("add"));
        else if (key === "KeyE") ECP.report("changeTool", new SwitchTool("delete"));
        else if (key === "KeyR") ECP.report("changeTool", new SwitchTool("hand"));
    }
    #handleKeyUp = (e) => {
        if (!UIA || !DER || !ECP || !ADM) return;
        if (this.isEditingText) return;
        const key = e.code;

        if (key.startsWith("Shift")) ECP.report("changeTool", new SwitchTool("select"));
        else if (key === "Escape") ECP.report("cancel", new Cancel());

        else if (e.ctrlKey) {
            if (key === "KeyS") ECP.report("save", new Save());
            else if (key === "KeyY") ECP.report("redo", new Redo());
            else if (key === "KeyZ") ECP.report("undo", new Undo());
        }
    }
    #handleMouseMove = (e) => {
        if (!UIA || !DER || !ECP || !ADM) return;
        const gm = getMousePos(e, DER.CD.canvas);
        const m = toDataPos(gm, DER.CD.zoomScale, DER.CD.viewOffset);
        const isOut = gm.x < 0 || gm.x > DER.CD.canvas.width || gm.y < 0 || gm.y > DER.CD.canvas.height;
        switch(ECP.tool){
            case "select":
                if (e.which === 1) {
                    if (!e.ctrlKey) return this.#analyzeDrag(m, "progressing");
                    else if (ECP.mode !== "point") {
                        const del = delta(this.canvasDownPos, m);
                        const clone = getAfterMove(ECP.mode, ADM.areas, this.target.index, del);
                        return this.#analyzeAdd(m, "expect", clone);
                    }
                    else return;
                }
                else if (!isOut) return this.#analyzeDrag(m, "expect");
                else return;
            case "add": 
                if (!isOut) return this.#analyzeAdd(m, "expect");
                else return;
            case "delete":
                if (e.which === 1) return;
                if (!isOut) return this.#analyzeDelete(m, "expect");
                else return;
            case "hand": 
                if (e.which === 1 && !isOut) return this.#analyzeMoveView(m, "progressing");
                else return;
        }
    }
    #handleCanvasMouseLeave = (e) => {
        if (!UIA || !DER || !ECP || !ADM) return;
        DER.CD.draw(ADM.areas, ECP.selection);
    }
    #handleMouseDown = (e) => {}
    #handleMouseUp = (e) => {
        if (!UIA || !DER || !ECP || !ADM) return;
        const gm = getMousePos(e, DER.CD.canvas);
        const m = toDataPos(gm, DER.CD.zoomScale, DER.CD.viewOffset);
        const isOut = gm.x < 0 || gm.x > DER.CD.canvas.width || gm.y < 0 || gm.y > DER.CD.canvas.height;

        if (e.which === 1){
            switch(ECP.tool){
                case "select": 
                    if (!this.target) return;
                    if (!e.ctrlKey) return this.#analyzeDrag(m, "drop");
                    else if (ECP !== "point") {
                        const del = delta(this.canvasDownPos, m);
                        const clone = getAfterMove(ECP.mode, ADM.areas, this.target.index, del);
                        return this.#analyzeAdd(m, "done", clone);
                    }
                    else return;
                case "add": return !isOut ? this.#analyzeAdd(m, "done") : null;
                case "delete": return this.target ? this.#analyzeDelete(m, "done") : null;
                case "hand": return !isOut ? this.#analyzeMoveView(m, "drop") : null;
            }
        }
    }
    #handleCanvasMouseDown = (e) => {
        if (!UIA || !DER || !ECP || !ADM) return;
        const gm = getMousePos(e, DER.CD.canvas);
        const m = toDataPos(gm, DER.CD.zoomScale, DER.CD.viewOffset);
        if (e.which === 1){
            switch(ECP.tool){ 
                case "select": return this.#analyzeDrag(m, "start");
                case "hand": return this.#analyzeMoveView(m, "start");
            }
        }
    }
    #handleCanvasWheel = (e) => {
        if (!UIA || !DER || !ECP || !ADM) return;
        const power = DER.CD.settings.scrollDir * wheelSpeed * e.deltaY;
        ECP.report("zoom", new Zoom("done", power, getMousePos(e, DER.CD.canvas)));
    }
    //#endregion
    #analyzeDrag = (m, _state) => {
        switch(_state){
            case "expect":{
                const newTarget = this.#findTarget(m, ECP.mode);

                if (this.target && !newTarget) ECP.report("dragTarget", new DragAndDrop("expect"));
                else if (newTarget?.name !== this.target?.name ||
                            newTarget?.index?.area !== this.target?.index?.area ||
                            newTarget?.index?.shape !== this.target?.index?.shape ||
                            newTarget?.index?.point !== this.target?.index?.point){
                    ECP.report("dragTarget", new DragAndDrop("expect", newTarget.index, newTarget.name));
                }

                this.target = newTarget;
                break;
            }
            case "start": {
                if (!this.target) return;
                this.canvasDownPos = m;
                return ECP.report("dragTarget", new DragAndDrop("start", this.target.index, this.target.name, {x:0,y:0}));
            }
            case "progressing":{
                if (!this.target) return;
                return ECP.report("dragTarget", new DragAndDrop("progressing", this.target.index, this.target.name, delta(this.canvasDownPos, m)));
            }
            case "drop":{
                if (!this.target) return;
                ECP.report("dragTarget", new DragAndDrop("drop", this.target.index, this.target.name, delta(this.canvasDownPos, m), true));
                this.isDragging = false;
                this.target = null;
                return;
            }
        }
    }
    #analyzeAdd = (m, _state, _piece) => {
        switch(ECP.mode){
            case "point":switch(_state){
                case "expect":
                case "done":{
                    if (!ADM?.areas?.[ECP?.selection?.index?.area] ||
                        !ADM.areas[ECP.selection.index.area].shapes?.[ECP.selection.index.shape]) return;
                    const segs = ADM.areas[ECP.selection.index.area].shapes[ECP.selection.index.shape].points.map(
                        (x, i, a) => [a[(i + a.length - 1) % a.length], x]
                    );
                    const idx = {
                        ...ECP.selection.index, 
                        point: getIndexOfClosestSegment(segs, m)
                    };
                    return ECP.report("add", new Add(_state, idx, "point", m, _state==="done"));
                }
            }
            break;
            case "shape":switch(_state){
                case "expect":
                case "done":{
                    if (!ADM?.areas?.[ECP?.selection?.index?.area]) return;
                    const idx = ECP.selection.index.shape >= 0 ? 
                        ECP.selection.index : 
                        {area: ECP.selection.index.area, shape: ADM.areas[ECP.selection.index.area].shapes.length - 1};
                    _piece = _piece ?? Shape.default(m);
                    return ECP.report("add", new Add(_state, {...idx}, "shape", _piece, _state==="done"));
                }
            }
            break;
            case "area":switch(_state){
                case "expect":
                case "done":{
                    const idx = ECP.selection.index.area >= 0 ? ECP.selection.index : {area: ADM.areas.length - 1}
                    _piece = _piece ?? Area.default(m, this.nextAreaColor);
                    if (_state === "done") {
                        this.nextAreaColor = getRandomRGB();
                        this.target = null;
                    }
                    return ECP.report("add", new Add(_state, {...idx}, "area", _piece, _state==="done"));
                }
            }
            break;
        }
    }
    #analyzeDelete = (m, _state) => {
        switch(_state){
            case "expect":{
                const newTarget = this.#findTarget(m, ECP.mode);

                if (this.target && !newTarget) ECP.report("delete", new Delete("expect"));
                else if (newTarget?.name !== this.target?.name ||
                            newTarget?.index?.area !== this.target?.index?.area ||
                            newTarget?.index?.shape !== this.target?.index?.shape ||
                            newTarget?.index?.point !== this.target?.index?.point){
                        ECP.report("delete", new Delete("expect", newTarget.index, newTarget.name));
                }

                this.target = newTarget;
                break;
            }
            case "done": 
                ECP.report("delete", new Delete("done", this.target.index, ECP.mode, true));
                this.target = undefined;
                return;
        }
    }
    #analyzeMoveView = (m, _state) => {
        const multi = (_c, _v) => ({x: _c * _v.x, y: _c * _v.y});
        switch(_state){
            case "start":
                this.canvasDownPos = m; 
                return ECP.report("moveView", new MoveView("start", {x:0,y:0}));
            case "progressing":
                return ECP.report("moveView", new MoveView("progressing", multi(DER.CD.zoomScale, delta(m, this.canvasDownPos))));
            case "drop": 
                return ECP.report("moveView", new MoveView("drop", multi(DER.CD.zoomScale, delta(m, this.canvasDownPos))));
        }
    }
    #findTarget(m, type) {
        let idx;

        switch(type){
            case "point":{
                if (ECP.selection.index.area === -1) return null;
                const r = DER.CD.settings.controlPointR / DER.CD.zoomScale;
                let pointsScope;

                if (ECP.selection.index.shape === -1){
                    // selection == area
                    pointsScope = ADM.areas[ECP.selection.index.area].toArray();
                    idx = [ECP.selection.index.area, ...findIndex2(pointsScope, p => isInPoint(m, p, r))];
                    return pointsScope?.[idx[1]]?.[idx[2]] ? 
                        { name: "point", index: { area: idx[0], shape: idx[1], point: idx[2] } } : null;
                }
                else{
                    // selection == shape
                    pointsScope = ADM.areas[ECP.selection.index.area].shapes[ECP.selection.index.shape].points;
                    idx = [ECP.selection.index.area, ECP.selection.index.shape, pointsScope.findIndex(p => isInPoint(m, p, r))];
                    return pointsScope?.[idx[2]] ?
                        { name: "point", index: { area: idx[0], shape: idx[1], point: idx[2] } } : null;
                }
            }
            case "shape":{
                if (ECP.selection.index.area === -1) return null;
                const shapesScope = ADM.areas[ECP.selection.index.area].shapes;
                idx = [ECP.selection.index.area, shapesScope.findIndex(s => isInShape(m, s, DER.CD.ctx))];

                return shapesScope?.[idx[1]] ? 
                    { name: "shape", index: { area: idx[0], shape: idx[1] } } : null;
            }
            case "area":{
                idx = ADM.areas.findIndex(a => isInArea(m, a, DER.CD.ctx));
                return ADM.areas[idx] ? { name: "area", index: { area: idx } } : null;
            }
        };

        return null;
    }
    #initInput(_type, _element, _collection){
        if (_type === "accordion"){
            const $ = (_s) => DER.get(_element, _s);
            const idx = () => Array.from(_collection).indexOf(_element);
            $("color").addEventListener("change", function(){
                ECP.report("recolor", new Recolor("done", {area: idx(), shape: -1}, "area", this.value, true));
            });
            $("deleteAcc").addEventListener("click", function() {
                ECP.report("delete", new Delete("done", {area: idx()}, "area", true));
            });
            $("editName").addEventListener("click", () => {
                this.isEditingText = true;
                $("areaNameText").contentEditable = true;
                $("areaNameText").focus();
            });
            $("areaNameText").addEventListener("focus", function(){
                ECP.report("rename", new Rename("editting"));
            });
            $("areaNameText").addEventListener("focusout", function(){
                UIA.isEditingText = false;
                this.contentEditable = false;
                ECP.report("rename", new Rename("done", {area: idx(), shape: -1}, "area", this.innerText, true));
            });
            $("areaSelect").addEventListener('selectchange', function(){
                ECP.report("select", new Select("done", {area: idx(), shape: -1}, "area", true));
            });
        }
        else if (_type === "shapeItem"){
            const $ = (_s) => DER.get(_element, _s);
            $("deleteShape").addEventListener("click", function(){
                const areaIdx = Array.from(_collection).indexOf(_element.parentElement.parentElement);
                const shapeIdx = Array.from(_collection[areaIdx].getElementsByClassName("shapeitem")).indexOf(_element);
                ECP.report("delete", new Delete("done", {area: areaIdx, shape: shapeIdx}, "shape", true));
            })
            $("editShapeName").addEventListener("click", () => {
                this.isEditingText = true;
                $("shapeNameText").contentEditable = true;
                $("shapeNameText").focus();
            })
            $("shapeNameText").addEventListener("focus", function(){
                ECP.report("rename", new Rename("editting"));
            })
            $("shapeNameText").addEventListener("focusout", function(){
                const areaIdx = Array.from(_collection).indexOf(_element.parentElement.parentElement);
                const shapeIdx = Array.from(_collection[areaIdx].getElementsByClassName("shapeitem")).indexOf(_element);
                UIA.isEditingText = false;
                this.contentEditable = false;
                ECP.report("rename", new Rename("done", {area: areaIdx, shape: shapeIdx}, "shape", this.innerText, true));
            })
            $("shapeSelect").addEventListener("selectchange", function(){
                const areaIdx = Array.from(_collection).indexOf(this.parentElement.parentElement.parentElement);
                const shapeIdx = Array.from(_collection[areaIdx].getElementsByClassName("shapeitem")).indexOf(this.parentElement);

                ECP.report("select", new Select("done", {area: areaIdx, shape: shapeIdx}, "shape", true), true);
            });
        }
    }
}