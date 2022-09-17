const accordion = (_color) =>
   `<div class="accordion">
        <input class="color" type="color" value="${_color}">
        <button class="editName" type="button" disabled>
            <img src="icons/pencil.png">
        </button>
        <button class="deleteAcc" type="button">
            <img src="icons/trash.png">
        </button>
        <label class="accLabel">
            <div class="areaNameText"></div>
            <input class="areaSelect" is="single-select" type="checkbox" name="accordion">
        </label>
        <div class="shapesMenu">
        </div>
    </div>`;
const shapeItem = () =>
   `<label class="shapeitem">
        <input class="shapeSelect" is="single-select" type="checkbox" name="shape">
        <button class="editShapeName" type="button">
            <img src="icons/pencil.png">
        </button>
        <button class="deleteShape" type="button">
            <img src="icons/trash.png">
        </button>
        <div class="shapeNameText"></div>
    </label>`;
class DOMElementRenderer{
    buttons;
    modeRadios;
    toolRadios;

    doc;
    hierarchy;
    accordions;
    CD;

    constructor(_doc, _imgSrc, _canvasSettings){
        this.doc = _doc;
        this.CD = new CanvasDrawer(_doc.getElementById("lpa-canvas"), _imgSrc, _canvasSettings);
        this.accordions = _doc.getElementsByClassName("accordion");
        this.hierarchy = _doc.getElementById("lpa-hierarchy");
        this.hierarchy.innerHTML = "";

        for (let i = 0; i < ADM.areas.length; i++){
            const $ = _class => this.get(this.accordions[i], _class);

            this.hierarchy.insertAdjacentHTML("beforeend", accordion(ADM.areas[i].color));
            $("areaNameText").innerText = ADM.areas[i].name;

            const menuL = $("shapesMenu");
            for (let j = 0; j < ADM.areas[i].shapes.length; j++){
                menuL.insertAdjacentHTML("beforeend", shapeItem());
                menuL.getElementsByClassName("shapeNameText")[j].innerText = ADM.areas[i].shapes[j].name;
            }
        }

        this.buttons = {
            save: _doc.getElementById("lpa-save-button"),
            undo: _doc.getElementById("lpa-undo-button"),
            redo: _doc.getElementById("lpa-redo-button")
        };
        this.modeRadios = {
            point: _doc.getElementById('lpa-point-mode'),
            shape: _doc.getElementById('lpa-shape-mode'),
            area: _doc.getElementById('lpa-area-mode')
        };
        this.toolRadios = {
            select: _doc.getElementById('lpa-select-tool'),
            add: _doc.getElementById('lpa-add-tool'),
            delete: _doc.getElementById('lpa-delete-tool'),
            hand: _doc.getElementById('lpa-hand-tool')
        };

        this.buttons.save.disabled = false;
        this.buttons.undo.disabled = true;
        this.buttons.redo.disabled = true;
    }
    render(_type, _change){
        const accL = () => this.accordions[_change.index.area];

        switch(_type){
            case "mode": {
                this.modeRadios[_change.mode].checked = true;
                return DER.CD.draw(ADM.areas, ECP?.selection);
            }
            case "tool":{
                this.CD.canvas.className = `using${toUpperFirstLetter(_change.tool)}Tool`;
                this.toolRadios[_change.tool].checked = true;
                return DER.CD.draw(ADM.areas, ECP?.selection);
            }
            case "moveView": switch(_change.state){
                case "start":
                case "progressing":
                    this.CD.moveView(ADM.areas, _change.dir);
                    this.CD.draw(ADM.areas, ECP.selection);
                    return this.CD.moveView(ADM.areas, {x: -_change.dir.x, y: -_change.dir.y});
                case "drop":
                    this.CD.moveView(ADM.areas, _change.dir);
                    return this.CD.draw(ADM.areas, ECP.selection);
                default: return;
            }
            case "zoom": 
                return this.CD.zoom(ADM.areas, _change.force, _change.refPoint);
            case "changeOrder":
                if (_change.kind === "area"){
                    const idx = _change.index.area + _change.amount
                    if (_change.amount >= 0) this.accordions[idx].insertAdjacentElement("afterend", accL());
                    else this.accordions[idx].insertAdjacentElement("beforebegin", accL());
                }
                else if (_change.kind === "shape"){
                    const items = accL().getElementsByClassName("shapeitem");
                    const item = items[_change.index.shape];
                    const idx = _change.index.shape + _change.amount;
                    if (_change.amount >= 0) items[idx].insertAdjacentElement("afterend", item);
                    else items[idx].insertAdjacentElement("beforebegin", item);
                }
                return this.CD.draw(ADM.areas, ECP.selection);
            case "add": switch(_change.kind){
                case "area": switch(_change.state){
                    case "expect": 
                        return this.CD.drawWithFloats(ADM.areas, ECP.selection, _change);
                    case "done":
                        accL().insertAdjacentHTML("beforebegin", accordion(_change.piece.color));
                        this.get(this.accordions[_change.index.area], "areaNameText").innerText = _change.piece.name;                        
                        this.CD.draw(ADM.areas, ECP.selection);
                        return this.accordions[_change.index.area];
                }
                break;
                case "shape": switch(_change.state){
                    case "expect": 
                        return this.CD.drawWithFloats(ADM.areas, ECP.selection, _change);
                    case "done": 
                        const menu = this.get(accL(), "shapesMenu");
                        const isSelected = _change.index.area === ECP.selection.index.area;
                        const $ = (_c) => menu.getElementsByClassName(_c)[_change.index.shape];
                        if (menu.children.length <= 0) menu.insertAdjacentHTML("beforeend", shapeItem());
                        else $("shapeitem").insertAdjacentHTML("beforebegin", shapeItem());
                        $("shapeNameText").innerText = "Shape";
                        if (isSelected) menu.style.maxHeight = menu.scrollHeight + "px";
                        this.CD.draw(ADM.areas, ECP.selection);
                        return menu.children[_change.index.shape];
                }
                break;
                case "point": switch(_change.state){
                    case "expect": return this.CD.drawWithFloats(ADM.areas, ECP.selection, _change);
                    case "done": return this.CD.draw(ADM.areas, ECP.selection);
                } 
                break;
                default: return;
            }
            case "delete": switch(_change.kind){
                case "area": switch(_change.state){
                    case "expect":
                        const area = ADM.areas[_change.index.area];
                        ADM.areas.splice(_change.index.area, 1);
                        this.CD.drawWithFloats(ADM.areas, ECP.selection, {
                            kind: "area",
                            index: _change.index,
                            piece: area
                        });
                        return ADM.areas.splice(_change.index.area, 0, area);
                    case "done":
                        accL().remove();
                        return this.CD.draw(ADM.areas, ECP.selection);
                }
                case "shape": switch(_change.state){
                    case "expect":
                        const shape = ADM.areas[_change.index.area].shapes[_change.index.shape];
                        ADM.areas[_change.index.area].shapes.splice(_change.index.shape, 1);
                        this.CD.drawWithFloats(ADM.areas, ECP.selection, {
                            kind: "shape",
                            index: _change.index,
                            piece: shape
                        });
                        return ADM.areas[_change.index.area].shapes.splice(_change.index.shape, 0, shape);
                    case "done":
                        this.get(accL(), "shapesMenu").children[_change.index.shape].remove();
                        return this.CD.draw(ADM.areas, ECP.selection);
                }                  
                case "point":
                    return this.CD.draw(ADM.areas, ECP.selection);
                default: return this.CD.draw(ADM.areas, ECP.selection);
            }
            case "select": switch(_change.kind){
                case "area":
                    const menu = this.get(accL(), "shapesMenu");
                    const isSelected = _change.index.area === ECP.selection.index.area;
                    
                    if (isSelected) menu.style.maxHeight = menu.scrollHeight + "px";
                    else menu.style.maxHeight = 0;

                    this.get(accL(), "editName").disabled = !isSelected;
                    accL().classList.toggle("active");

                    return this.CD.draw(ADM.areas, ECP.selection);
                case "shape":
                    console.log({...ECP.selection.index}, {..._change.index});
                    const item = this.get(accL(), "shapesMenu").children[_change.index.shape];
                    item.classList.toggle("item-active");
                    return this.CD.draw(ADM.areas, ECP.selection);
                default: return;
            }
            case "rename": switch(_change.kind){
                case "area":
                    this.get(this.accordions[_change.index.area], "areaNameText").innerText = _change.name;
                    return;
                case "shape":
                    this.get(this.accordions[_change.index.area], "shapeitem")[_change.index.shape] = _change.name;
                    return;
                default: return;
            }
            case "recolor": return this.CD.draw(ADM.areas, ECP.selection);
            case "dragTarget": switch(_change.state){
                case "expect": 
                    return this.CD.drawWithMutations(ADM.areas, ECP.selection, [{
                        kind: _change.kind,
                        piece:
                        (() => {switch(_change.kind){
                        case "point":
                            return ADM.areas[_change.index.area].shapes[_change.index.shape].points[_change.index.point];
                        case "shape":
                            return ADM.areas[_change.index.area].shapes[_change.index.shape];
                        case "area":
                            return ADM.areas[_change.index.area];
                        }})()
                    }]);
                case "progressing":
                    ADM.ask("move", _change);
                    this.CD.drawWithMutations(ADM.areas, ECP.selection, [{
                        kind: _change.kind,
                        piece:
                        (() => {switch(_change.kind){
                        case "point":
                            return ADM.areas[_change.index.area].shapes[_change.index.shape].points[_change.index.point];
                        case "shape":
                            return ADM.areas[_change.index.area].shapes[_change.index.shape];
                        case "area":
                            return ADM.areas[_change.index.area];
                        }})()
                    }]);
                    return ADM.ask("move", new DragAndDrop("progressing", _change.index, _change.kind, {x: -_change.dir.x, y: -_change.dir.y}));
                case "done": 
                    return this.CD.draw(ADM.areas, ECP.selection);
                default: return;
            }
            case "doWork":
                this.buttons.redo.disabled = true;
                this.buttons.undo.disabled = false;
                this.buttons.save.disabled = false;
                return;
            case "save":
                this.buttons.save.disabled = true;
                return;
            case "undo":
                this.buttons.redo.disabled = false;
                this.buttons.undo.disabled = !ECP.undoable;
                return;
            case "redo":
                this.buttons.redo.disabled = !ECP.redoable;
                this.buttons.undo.disabled = false;
                return;
        }
    }
    get(_acc, _name){
        return _acc.getElementsByClassName(_name)[0];
    }
}