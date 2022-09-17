var ECP, UIA, DER, ADM;

function prepareEditor(_uuid, _userContent, _imgSrc, _areas, _settings){
    _settings = {
        lineW: _settings.strokesWidth, 
        lineShadow: _settings.strokesOutline, 
        controlPointR: _settings.controlPointRadius,
        scrollDir: _settings.scrollDirection
    }

    ADM = new AreasDataManager(_areas);
    DER = new DOMElementRenderer(document, _imgSrc, _settings);
    UIA = new UserInputAnalyzer(document, document.getElementById("lpa-canvas"));
    ECP = new EditorCenterProcessor(_uuid, _userContent);
}

class EditorCenterProcessor{
    mode;
    tool;
    selection;
    #blockInfo;
    #workflow;

    get undoable(){ return this.#workflow.undoable }
    get redoable(){ return this.#workflow.redoable }
    get #commands(){
        return{ 
            save: this.#save, undo: this.#undo, redo: this.#redo,  cancel: this.#cancel, confirm: this.#confirm,
            changeMode: this.#changeMode, changeTool: this.#changeTool,
            dragTarget: this.#dragTarget, zoom: this.#zoom, moveView: this.#moveView, changeOrder: this.#changeOrder,
            add: this.#add, delete: this.#delete, select: this.#select, rename: this.#rename, recolor: this.#recolor
        }
    };
    constructor(_uuid, _userContent){
        this.#blockInfo = { uuid: _uuid, userContent: _userContent};
        this.#changeMode(new SwitchMode("point"));
        this.#changeTool(new SwitchTool("select"));
        this.selection = { index: { area: -1, shape: -1 } };
        this.#workflow = new Workflow();
    }
    report(_type, _feature){
        console.log(`${_feature}`);

        if (_feature.isWork) {
            if (this.#workflow.doWork(this.#commands[_type], _feature)) DER.render("doWork");
        }
        else this.#commands[_type](_feature);
    }
    #save = () => {
        const parser = new Parser();
        const datas = {userContent: this.#blockInfo.userContent, visiblity: true, selected: "", areas: ADM.areas};

        logseq.Editor.updateBlock(this.#blockInfo.uuid, parser.toBlockContent(datas));

        DER.render("save");
        return true;
    }
    #undo = () =>{
        if (!this.#workflow.undoable) return false;
        const work = this.#workflow.undo();
        const feat = work.feature;

        DER.render("undo");
        switch(work.func){
            case "changeOrder": return this.report("changeOrder", new ChangeOrder("done", feat.afterIndex, feat.kind, -feat.amount));
            case "select": return this.report("select", new Select("done", feat.oldIndex, !isNaN(feat.oldIndex.shape) && feat.oldIndex.shape !==-1 ? "shape" : "area"));
            case "rename": return this.report("rename", new Rename("done", feat.index, feat.kind, feat.oldName));
            case "recolor": return this.report("recolor", new Recolor("done", feat.index, feat.kind, feat.oldColor))
            case "dragTarget": return this.report("dragTarget", new DragAndDrop("drop", feat.index, feat.kind, {
                x: -feat.dir.x, y: -feat.dir.y
            }))
            case "add": return this.report("delete", new Delete("done", feat.index, feat.kind));
            case "delete": return this.report("add", new Add("done", feat.index, feat.kind, feat.piece));
        }

        return true;
    }
    #redo = () => {
        if (!this.#workflow.redoable) return false;
        const work = this.#workflow.redo();
        this.#commands[work.func](work.feature);

        DER.render("redo");
        return true;
    }
    #cancel = () => {
        UIA = ECP = DER = ADM = null;
        logseq.hideMainUI();
    }
    #confirm = () => {
        this.#save();
        this.#cancel();
    }
    #changeMode = (_modeFeat) => {
        if (!modeList.includes(_modeFeat.mode)) return false;

        this.mode = _modeFeat.mode;
        DER.render("mode", _modeFeat);
        return true;
    }
    #changeTool = (_toolFeat) => {
        if (!toolList.includes(_toolFeat.tool)) return false;

        this.tool = _toolFeat.tool;
        DER.render("tool", _toolFeat);
        return true;
    }
    #dragTarget = (_dragFeat) => {
        if (!_dragFeat) return false;
        if (_dragFeat.state === "progressing" || _dragFeat.state === "drop"){
            //limit drag space.
            const idx = _dragFeat.index;
            _dragFeat.dir = (function(){
                switch(_dragFeat.kind){
                    case "point":
                        return reviseDir(ADM.areas[idx.area].shapes[idx.shape].points[idx.point], _dragFeat.dir);   
                    case "shape":
                        const ps = getThresholds(ADM.areas[idx.area].shapes[idx.shape].points);
                        return reviseDir(ps[1], reviseDir(ps[0], _dragFeat.dir));
                    case "area":
                        const ps2 = getThresholds(ADM.areas[idx.area].shapes.map(a => a.points).flat());
                        return reviseDir(ps2[1], reviseDir(ps2[0], _dragFeat.dir));
                }
            })();
        }
        switch(_dragFeat.state){
            case "expect":
            case "start":
            case "progressing":
                DER.render("dragTarget", _dragFeat);
                return true;
            case "drop":
                ADM.ask("move", _dragFeat);
                if (!isSameIdx(_dragFeat.index, this.selection.index) && _dragFeat.kind !== "point"){
                    const idx = _dragFeat.index;
                    const acc = DER.accordions[idx.area];
                    if (_dragFeat.kind === "area") DER.get(acc, "accLabel").click();
                    if (_dragFeat.kind === "shape") acc.getElementsByClassName("shapesMenu")[0].children[idx.shape].click();
                }
                DER.CD.draw(ADM.areas, this.selection);
                return true;
        }
        return true;
    }
    #zoom = (_zoomFeat) => {
        if (!_zoomFeat) return false;
        DER.render("zoom", _zoomFeat);
        return true;
    }
    #moveView = (_moveViewFeat) => {
        if (!_moveViewFeat) return false;
        DER.render("moveView", _moveViewFeat);
        return true;
    }
    #changeOrder = (_orderFeat) => {
        if (!_orderFeat) return false;
        const change = ADM.ask("changeOrder", _orderFeat);
        if (!change) return;
        if (change.kind === "area") this.selection.index.area += change.amount;
        else this.selection.index.shape += change.amount;
        DER.render("changeOrder", change);
        return true;
    }
    #add = (_addFeat) => {
        if (!_addFeat) return false;
        switch(_addFeat.kind){
            case "point":
                const dir0 = reviseDir(_addFeat.piece, {x:0,y:0});
                _addFeat.piece = {x: _addFeat.piece.x + dir0.x, y: _addFeat.piece.y + dir0.y};
                break;  
            case "shape":
                const ps = getThresholds(_addFeat.piece.points);
                const dir = reviseDir(ps[1], reviseDir(ps[0], {x:0, y:0}));
                _addFeat.piece.points = _addFeat.piece.points.map(a => ({x: a.x + dir.x, y: a.y + dir.y}));
                break;
            case "area":
                const ps2 = getThresholds(_addFeat.piece.shapes.map(a => a.points).flat());
                const dir2 = reviseDir(ps2[1], reviseDir(ps2[0], {x:0, y:0}));
                _addFeat.piece.shapes = _addFeat.piece.shapes.map(s => {
                                            s.points = s.points.map(p => 
                                                ({x: p.x + dir2.x, y: p.y + dir2.y})
                                            )
                                            return s;
                                        });
                break;
        }
        switch(_addFeat.state){
            case "expect":
                DER.render("add", _addFeat);
                return true;
            case "done":
                const change = ADM.ask("add", _addFeat);
                if (!change) return false;
                if (change.kind == "area") {
                    if (this.selection.index.area >= 0)
                        this.selection.index.area += Number(change.index.area <= this.selection.index.area);
                    const acc = DER.render("add", change);
                    for(let i = _addFeat.piece.shapes.length - 1; i >= 0; i--)
                        DER.render("add", new Add("done", {..._addFeat.index, shape: i}, "shape", _addFeat.piece.shapes[i]));
                    UIA.initAcc(acc);
                }
                else if (change.kind == "shape") {
                    if (this.selection.index.shape >= 0)
                        this.selection.index.shape += Number(change.index.shape <= this.selection.index.shape);
                    UIA.initShapeItem(DER.render("add", change));
                }
                return true;
        }
    }
    #delete = (_deleteFeat) => {
        if (!_deleteFeat) return false;
        switch(_deleteFeat.state){
            case "expect":
                DER.render("delete", _deleteFeat);
                return true;
            case "done":
                const change = ADM.ask("delete", _deleteFeat);
                if (!change) return false;
                if (this.selection.index[_deleteFeat.kind] >= 0)
                    this.selection.index[_deleteFeat.kind] -= Number(change.index[_deleteFeat.kind] <= this.selection.index[_deleteFeat.kind]);
                DER.render("delete", change);
                return true;
        }
    }
    #select = (_selectFeat) => {
        if (!_selectFeat) return false;
        if (_selectFeat.kind === "area"){
            if (this.selection.index.area !== _selectFeat.index.area)
                this.selection.index.area = _selectFeat.index.area;
            else
                this.selection.index.area = -1;
        }
        else if (_selectFeat.kind === "shape"){
            if (this.selection.index.shape !== _selectFeat.index.shape)
                this.selection.index.shape = _selectFeat.index.shape;
            else
                this.selection.index.shape = -1;
        }
        DER.render("select", _selectFeat);
        return true;
    }
    #rename = (_renameFeat) => {
        if (!_renameFeat) return false;
        if (_renameFeat.state === "editting") {
            document.execCommand('selectAll', false, null);
            return false;
        }
        const change = ADM.ask("rename", _renameFeat);
        if (!change) return false;
        DER.render("rename", change);
        return true;
    }
    #recolor = (_recolorFeat) => {
        if (!_recolorFeat) return false;
        const change = ADM.ask("recolor", _recolorFeat);
        if (!change) return false;
        DER.render("recolor", change);
        return true;
    }
}