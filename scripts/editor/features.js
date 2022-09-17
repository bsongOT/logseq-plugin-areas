class Feature {
    state;
    isWork;
    constructor(_state, _isWork){
        this.state = _state;
        this.isWork = _isWork;
    }
    toString(){
        return ""+
        `[${this.constructor.name}]` + "\n" +
        `State: ${this.state}` + "\n" +
        `IsWork: ${this.isWork ? "Yes" : "No"}`;
    }
}
class Add extends Feature {
    //state: expect -> done
    index;
    kind;
    piece;
    constructor(_state, _index, _kind, _piece, _isWork){
        super(_state, _isWork);
        this.index = _index;
        this.kind = _kind;
        this.piece = _piece;
    }
    toString(){
        return super.toString() + "\n" +
        `Kind: ${this.kind}` + "\n" +
        `Index: (${this.index?.area}, ${this.index?.shape}, ${this.index?.point})`;
    }
}
class Delete extends Feature {
    //state: expect -> done
    index;
    kind;
    piece;
    constructor(_state, _index, _kind, _isWork){
        super(_state, _isWork);
        this.index = _index;
        this.kind = _kind;
        this.piece = ADM.areas[_index?.area]?.clone();
        if (_kind !== "area"){
            this.piece = this.piece?.shapes?.[_index?.shape];
            if (_kind !== "shape") this.piece = this.piece?.points?.[_index?.point];
        }
    }
    toString(){
        return super.toString() + "\n" +
        `Kind: ${this.kind}` + "\n" +
        `Index: (${this.index?.area}, ${this.index?.shape}, ${this.index?.point})`;
    }
}
class Rename extends Feature {
    //state: editting -> done
    index;
    kind;
    name;
    oldName;
    constructor(_state, _index, _kind, _name, _isWork){
        super(_state, _isWork);
        this.index = _index;
        this.kind = _kind;
        this.name = _name;
        
        let piece = ADM.areas[_index?.area];
        if (_kind === "shape") piece = piece?.shapes?.[_index?.shape];

        this.oldName = piece?.name;
    }
    toString(){
        return super.toString() + "\n" +
        `Kind: ${this.kind}` + "\n" +
        `Index: (${this.index?.area}, ${this.index?.shape}, ${this.index?.point})` + "\n" +
        `Name: ${this.name}`;
    }
}
class Recolor extends Feature {
    //state: editting -> done
    index;
    kind;
    color;
    oldColor;
    constructor(_state, _index, _kind, _color, _isWork){
        super(_state, _isWork);
        this.index = _index;
        this.kind = _kind;
        this.color = _color;
        this.oldColor = ADM.areas[_index.area]?.color;
    }
    toString(){
        return super.toString() + "\n" +
        `Kind: ${this.kind}` + "\n" +
        `Index: (${this.index?.area}, ${this.index?.shape}, ${this.index?.point})` + "\n" +
        `Color: ${this.color}`;
    }
}
class Select extends Feature {
    //done
    index;
    oldIndex;
    kind;
    constructor(_state, _index, _kind, _isWork){
        super(_state, _isWork);
        this.index = _index;
        this.oldIndex = isSameIdx({area: -1, shape: -1}, ECP.selection.index) ? _index : {...ECP.selection.index};
        this.kind = _kind;
    }
    toString(){
        return super.toString() + "\n" +
        `Kind: ${this.kind}` + "\n" +
        `Index: (${this.index?.area}, ${this.index?.shape}, ${this.index?.point})`;
    }
}
class ChangeOrder extends Feature {
    //done
    index;
    afterIndex;
    kind;
    amount;
    constructor(_state, _index, _kind, _amount, _isWork){
        super(_state, _isWork);
        this.index = {..._index};
        this.afterIndex = (() => {
            if (_kind === "area") return { area: _index.area + _amount, shape: _index.shape};
            else return { area: _index.area, shape: _index.shape + _amount};
        })();
        this.kind = _kind;
        this.amount = _amount;
    }
}
class Save extends Feature {}
class Undo extends Feature {}
class Redo extends Feature {}
class Cancel extends Feature {}
class Confirm extends Feature {}
class SwitchMode extends Feature {
    mode;
    constructor(_mode, _isWork){
        super("", _isWork);
        this.mode = _mode;
    }
    toString(){
        return super.toString() + "\n" +
        `Mode: ${this.mode}`;
    }
}
class SwitchTool extends Feature {
    tool;
    constructor(_tool, _isWork){
        super("", _isWork);
        this.tool = _tool;
    }
    toString(){
        return super.toString() + "\n" +
        `Tool: ${this.tool}`;
    }
}
class DragAndDrop extends Feature {
    // expect -> start -> progressing -> drop
    index;
    kind;
    dir;
    constructor(_state, _index, _kind, _dir, _isWork){
        super(_state, _isWork);
        this.index = _index;
        this.kind = _kind;
        this.dir = _dir;
    }
    toString(){
        return super.toString() + "\n" +
        `Kind: ${this.kind}` + "\n" +
        `Index: (${this.index?.area}, ${this.index?.shape}, ${this.index?.point})` + "\n" +
        `Direction: (${this.dir?.x}, ${this.dir?.y})`;
    }
}
class Zoom extends Feature {
    // done
    force;
    refPoint;
    constructor(_state, _force, _refPoint, _isWork){
        super(_state, _isWork);
        this.force = _force;
        this.refPoint = _refPoint;
    }
    toString(){
        return super.toString() + "\n" +
        `Force: ${this.force}` + "\n" +
        `Ref: (${this.refPoint?.x}, ${this.refPoint?.y})`;
    }
}
class MoveView extends Feature {
    // start -> progressing -> drop
    dir;
    constructor(_state, _dir, _isWork){
        super(_state, _isWork);
        this.dir = _dir;
    }
    toString(){
        return super.toString() + "\n" +
        `Direction: (${this.dir?.x}, ${this.dir?.y})`;
    }
}