//#region required variables
var limitSettings = { nameLimit: 30, forbiddenChars: "- = { } [ ] ; ]" };
var canvasSettings = { lineW: 5, lineShadow: 1, controlPointR: 4 };
var blockInfo = { uuid: "", userContent: ""};
var areas = [];
var img = new Image();
//#endregion
//#region editor variables
var mouseE;
var mousedown = false, rightMousedown = false;
var canvasMousedown = false;
var dragTarget = { shape: -1, point: -1 };
var isEditingText = false;

var hierarchy, colorInputers, accordions, shapeMenus, canvas, ctx, 
    saveButton, undoButton, redoButton, pointModeRadio, shapeModeRadio, areaModeRadio, handToolCheck;

var imageLoaded = false;
var selection = { areaIndex: -1, shapeIndex: -1 };
var zoomScale = 1;
var viewOffset = { x: 0, y: 0 };
var canvasDownPos = { x: 0, y: 0 };
var canvasDownOffset = { x: 0, y: 0 };
const zoomMax = 5;
const zoomMin = 1;
const wheelSpeed = 0.0005;

var isUsingHand = false;
var mode = "point";
var workflow = [];
var canceledWorks = [];
//#endregion
//#region manage task
function addWork(work){
    workflow.push(work);
    undoButton.disabled = false;
    redoButton.disabled = true;
    saveButton.disabled = false;
    
    canceledWorks = [];
}
//#endregion
//#region ui actions
function toPointMode()
{
    mode = "point";
    pointModeRadio.checked = true;
}
function toShapeMode()
{
    mode = "shape";
    shapeModeRadio.checked = true;
}
function toAreaMode()
{
    mode = "area";
    areaModeRadio.checked = true;
}
function useHandTool(use)
{
    handToolCheck.checked = use;
    isUsingHand = use;
    if (isUsingHand) canvas.style.cursor = "grab";
    else canvas.style.cursor = "default";
}
function save()
{
    const parser = new Parser();
    const datas = {userContent: blockInfo.userContent, visiblity: true, selected: "", areas: areas};

    logseq.Editor.updateBlock(blockInfo.uuid, parser.toBlockContent(datas));

    saveButton.disabled = true;
}
function undo()
{
    const work = workflow.pop();
    canceledWorks.push(work);

    const temp = Array.from(canceledWorks);

    switch(work.func){
        case "unselectShape":
            selectShape(work.old.areaIndex, work.old.shapeIndex);
            break;
        case "selectShape":
            if (work.old.shapeIndex !== -1)
                selectShape(work.old.areaIndex, work.old.shapeIndex);
            else
                selectShape(work.new.areaIndex, work.new.shapeIndex);
            break;
        case "unselectArea":
            selectArea(work.old.areaIndex);
            break;
        case "selectArea":
            if (work.old.areaIndex !== -1)
                selectArea(work.old.areaIndex);
            else
                selectArea(work.new.areaIndex);
            break;
        case "renameShape":
            shapeMenus[work.index.areaIndex].children[work.index.shapeIndex] = work.old;
            renameShape(work.index.areaIndex, work.index.shapeIndex, work.old);
            break;
        case "renameArea":
            accordions[work.index].children[0].innerText = work.old;
            renameArea(work.index, work.old);
            break;
        case "changeAreaColor":
            colorInputers[work.index].value = work.old;
            changeAreaColor(work.index, work.old);
            break;
        case "dragPoint":
            areas[work.index.area].shapes[work.index.shape].points[work.index.point] = work.old;
            draw();
            console.log(workflow);
            console.log(canceledWorks);
            addWork({});
            break;
        case "addPoint":
            deletePointByIndex(work.index.area, work.index.shape, work.index.point);
            break;
        case "addShape":
            deleteShapeByIndex(work.index.area, work.index.shape);
            break;
        case "addArea":
            deleteAreaByIndex(work.index.area);
            break;
        case "deletePoint":
            addPointAtIndex(work.index.area, work.index.shape, work.index.point, work.point);
            break;
        case "deleteShape":
            addShape(work.index.area, work.index.shape, work.shape);
            break;
        case "deleteArea":
            addArea(work.index.area, work.area);
            break;
    }

    workflow.pop();
    canceledWorks = temp;

    console.log("workflow:\n", Array.from(workflow), "\ncanceld:\n", Array.from(canceledWorks));

    undoButton.disabled = workflow.length === 0;
    redoButton.disabled = false;
}
function redo()
{
    const work = canceledWorks.pop();
    const temp = Array.from(canceledWorks);

    switch(work.func){
        case "unselectShape":
            selectShape(work.old.areaIndex, work.old.shapeIndex);
            break;
        case "selectShape":
            selectShape(work.new.areaIndex, work.new.shapeIndex);
            break;
        case "unselectArea":
            selectArea(work.old.areaIndex);
            break;
        case "selectArea":
            selectArea(work.new.areaIndex);
            break;
        case "renameShape":
            renameShape(work.index.area, work.index.shape, work.new);
            break;
        case "renameArea":
            renameArea(work.index.area, work.new);
            break;
        case "changeAreaColor":
            colorInputers[work.index].value = work.new;
            changeAreaColor(work.index.area, work.new);
            break;
        case "dragPoint":
            areas[work.index.area].shapes[work.index.shape].points[work.index.point] = work.new;
            draw();
            addWork(work);
            break;
        case "addPoint":
            addPointAtIndex(work.index.area, work.index.shape, work.index.point, work.point);
            break;
        case "addShape":
            addShape(work.index.area, work.index.shape, work.shape);
            break;
        case "addArea":
            addArea(work.index.area, work.area);
            break;
        case "deletePoint":
            deletePointByIndex(work.index.area, work.index.shape, work.index.point);
            break;
        case "deleteShape":
            deleteShapeByIndex(work.index.area, work.index.shape);
            break;
        case "deleteArea":
            deleteShapeByIndex(work.index.area);
            break;
    }

    canceledWorks = temp;

    console.log("workflow:\n", Array.from(workflow), "\ncanceld:\n", Array.from(canceledWorks));

    redoButton.disabled = canceledWorks.length === 0;
    undoButton.disabled = false;
}
function cancel()
{
    logseq.hideMainUI();
}
function confirm()
{
    save();
    logseq.hideMainUI();
}
//#endregion
//#region select
function dropPoint()
{
    const targetPoints = areas[selection.areaIndex].shapes[dragTarget.shape].points;

    addWork({
        func: "dragPoint",
        index: {area: selection.areaIndex, shape: dragTarget.shape, point: dragTarget.point},
        old: dragTarget.beforeCoord,
        new: targetPoints[dragTarget.point]
    });
}
function dragPoint()
{
    if (!mousedown) return;
    if (selection.areaIndex === -1) return;

    const shape = areas[selection.areaIndex].shapes[dragTarget.shape];

    if (dragTarget.shape >= 0 && dragTarget.point >= 0)
    {
        shape.points[dragTarget.point] = toDataPos(adjustPos(getMousePos(canvas), canvas, 0));
        draw();
    }
}
function selectPoint()
{
    if (selection.areaIndex === -1) return;

    const selectedArea = areas[selection.areaIndex];
    const mousePos = toDataPos(getMousePos(canvas));

    if (selection.shapeIndex !== -1){
        const shape = selectedArea.shapes[selection.shapeIndex];
        for (let i = 0; i < shape.points.length; i++){
            const point = shape.points[i];
            if (getDistanceSquare(point, mousePos) <= getSquare(canvasSettings.controlPointR / zoomScale))
            {
                toPointMode();
                dragTarget = {shape: selection.shapeIndex, point: i, beforeCoord: point};
                break;
            }
        }
        return;
    }

    for (let i = 0; i < selectedArea.shapes.length; i++){
        const shape = selectedArea.shapes[i];
        for (let j = 0; j < shape.points.length; j++){
            const point = shape.points[j];
            if (getDistanceSquare(point, mousePos) <= getSquare(canvasSettings.controlPointR / zoomScale))
            {
                toPointMode();
                dragTarget = {shape: i, point: j, beforeCoord: point};
                break;
            }
        }
    }
}
function selectShape(_areaIndex, _shapeIndex)
{
    const oldIndex = selection;
    selection = { areaIndex: _areaIndex, shapeIndex: _shapeIndex };

    if (oldIndex.areaIndex === _areaIndex && oldIndex.shapeIndex === _shapeIndex){
        selection.shapeIndex = -1;
        shapeMenus[_areaIndex].children[_shapeIndex].classList.remove("item-active");
        draw();
        addWork({func: "unselectShape", old: oldIndex, new: selection});
        return;
    }

    shapeMenus[oldIndex.areaIndex]?.children[oldIndex.shapeIndex]?.classList?.remove("item-active");
    shapeMenus[_areaIndex].children[_shapeIndex].classList.add("item-active");
    draw();

    addWork({func: "selectShape", old: oldIndex, new: selection});
}
function selectArea(_areaIndex)
{
    const oldIndex = selection;
    selection = { areaIndex: _areaIndex, shapeIndex: -1};

    if (oldIndex.areaIndex === selection.areaIndex){
        selection.areaIndex = -1;
        accordions[_areaIndex].dataset.selected = "false";
        draw();
        addWork({func: "unselectArea", old: oldIndex, new: selection});
        return;
    }

    shapeMenus[oldIndex.areaIndex]?.children[oldIndex.shapeIndex]?.classList?.remove("item-active");
    accordions[_areaIndex].dataset.selected = "true";
    draw();

    addWork({func: "selectArea", old: oldIndex, new: selection});
}
//#endregion
//#region rename&recolor
function renameShape(_areaIndex, _shapeIndex, _newName)
{
    const oldName = areas[_areaIndex].shapes[_shapeIndex].name;
    areas[_areaIndex].shapes[_shapeIndex].name = _newName;

    if (oldName !== _newName){
        addWork({func: "renameShape", index: {area: _areaIndex, shape: _shapeIndex}, old: oldName, new: _newName});
        return true;
    }

    return false;
}
function renameArea(_areaIndex, _newName)
{
    const oldName = areas[_areaIndex].name;
    const areaNames = areas.map(el => el.name);

    let nameIndex = areaNames.indexOf(_newName)
    while (nameIndex !== -1 && nameIndex !== _areaIndex) {
        _newName += "(1)";
        nameIndex = areaNames.indexOf(_newName);
    }

    areas[_areaIndex].name = _newName;
    accordions[_areaIndex].children[0].innerText = _newName;

    if (oldName !== _newName){
        addWork({func: "renameArea", index: {area: _areaIndex}, old: oldName, new: _newName});
        return true;
    }

    return false;
}
function changeAreaColor(_areaIndex, _newColor)
{
    const oldColor = areas[_areaIndex].color;
    areas[_areaIndex].color = _newColor;

    draw();
    
    if (oldColor !== _newColor)
        addWork({func: "changeAreaColor", index: _areaIndex, old:oldColor, new:_newColor});
}
//#endregion
//#region for hierarchy html
function getAccordionHTML(_area)
{
    const limit = limitSettings.nameLimit;
    const notallow = limitSettings.forbiddenChars;

    return `<input class="color-inputer" type="color" value="${_area.color}">
            <button class="editName" type="button" disabled><img src="icons/pencil.png"></button>
            <button class="accordion">
                <div data-name-limit="${limit}" data-forbiddens="${notallow}"></div>
            </button>
            ${getShapemenuHTML(_area.shapes.length)}`;
}
function setAccordionAction(_cin, _acc, _shmn, _area)
{
    _acc.children[0].innerText = _area.name;

    _cin.addEventListener("change", function(){
        const targetAreaindex = Array.from(colorInputers).indexOf(this);
        changeAreaColor(targetAreaindex, this.value);
    });

    _acc.previousElementSibling.addEventListener("click", function(){
        isEditingText = true;
        _acc.disabled = true;
    });

    _acc.addEventListener("click", function(){
        const targetAreaindex = Array.from(accordions).indexOf(this);
        selectArea(targetAreaindex);
    });

    _acc.children[0].addEventListener("focusout", function(){
        isEditingText = false;
        _acc.disabled = false;
        const targetAreaindex = Array.from(accordions).indexOf(_acc);
        this.innerText = this.innerText.trim();
        if (this.innerText === "") this.innerText = areas[targetAreaindex].name;

        renameArea(targetAreaindex, this.innerText);
    });

    for (let i = 0; i < _area.shapes.length; i++){
        setShapeitemAction(_shmn, _shmn.children[i], _area.shapes[i]);
    }
}
function getShapemenuHTML(_shapeAmount)
{
    return `<div class="shapesMenu">
                ${`<button class="shapeitem"></button>`.repeat(_shapeAmount)}
            </div>`
}
function setShapeitemAction(_shmn, _shpit, _shp)
{
    _shpit.innerText = _shp.name;

    _shpit.addEventListener("click", function(){
        const targetAreaindex = Array.from(shapeMenus).indexOf(_shmn);
        const targetShapeindex = Array.from(_shmn.children).indexOf(this);

        if (targetAreaindex === selection.areaIndex && targetShapeindex === selection.shapeIndex){
            this.classList.remove("item-active");
        }
        else{
            if (selection.areaIndex !== -1 && selection.shapeIndex !== -1){
                shapeMenus[selection.areaIndex].children[selection.shapeIndex].classList.remove("item-active");
            }
            this.classList.add("item-active");
        }

        selectShape(targetAreaindex, targetShapeindex);
    });
}
//#endregion
//#region load
function init()
{
    hierarchy.innerHTML = "";
    selection = { areaIndex: -1, shapeIndex: -1 };
    dragTarget = { shape: -1, point: -1 };
    imageLoaded = false;
    zoomScale = 1;
    viewOffset = { x: 0, y: 0 };
    toPointMode();
    useHandTool(false);
    workflow = [];
    canceledWorks = [];
    undoButton.disabled = true;
    redoButton.disabled = true;
    saveButton.disabled = true;
    isEditingText = false;
}
function loadElements()
{
    hierarchy = document.getElementById('lpa-hierarchy');
    canvas = document.getElementById('lpa-canvas');
    ctx = canvas.getContext('2d');
    ctx.lineJoin = "round";
    saveButton = document.getElementById('lpa-save-button');
    undoButton = document.getElementById('lpa-undo-button');
    redoButton = document.getElementById('lpa-redo-button');
    pointModeRadio = document.getElementById('lpa-point-mode');
    shapeModeRadio = document.getElementById('lpa-shape-mode');
    areaModeRadio = document.getElementById('lpa-area-mode');
    handToolCheck = document.getElementById('lpa-hand-tool');
    colorInputers = document.getElementsByClassName('color-inputer');
    accordions = document.getElementsByClassName('accordion');
    shapeMenus = document.getElementsByClassName('shapesMenu');

    init();

    canvas.addEventListener('wheel', (e) => {zoom(e.deltaY, getMousePos(canvas))})
    canvas.addEventListener('mousedown', (e) => {handleCanvasMouseDown(e)})

    for (let i = 0; i < areas.length; i++){
        hierarchy.insertAdjacentHTML("beforeend", getAccordionHTML(areas[i]));
    }

    initUI();

    for (let i = 0; i < areas.length; i++){
        setAccordionAction(colorInputers[i], accordions[i], shapeMenus[i], areas[i]);
    }
}
function loadInfo(_uuid, _userContent, _imgSrc, _areas, _settings)
{
    canvasSettings.lineW = _settings.strokesWidth;
    canvasSettings.lineShadow = _settings.strokesOutline;
    canvasSettings.controlPointR = _settings.controlPointRadius;

    blockInfo.uuid = _uuid;
    blockInfo.userContent = _userContent;

    img.src = _imgSrc;
    areas = _areas;
}
//#endregion
//#region add piece
function addPoint(_areaIdx, _shapeIdx, _point){
    if (_areaIdx === -1 || _shapeIdx === -1) return;

    let points = areas[_areaIdx].shapes[_shapeIdx].points;
    let min = getDistanceSqPointSegment(_point, {a: points[points.length - 1], b: points[0]});
    let indexWhenMin = 0;

    for (let i = 0; i < points.length - 1; i++){
        const distSquare = getDistanceSqPointSegment(_point, {a: points[i], b: points[i + 1]})
        if (min >= distSquare){
            min = distSquare;
            indexWhenMin = i + 1;
        }
    }

    addPointAtIndex(_areaIdx, _shapeIdx, indexWhenMin, _point);
}
function addPointAtIndex(_areaIdx, _shapeIdx, _pointIdx, _point){
    if (_areaIdx === -1 || _shapeIdx === -1 || _pointIdx === -1) return;

    _point = adjustPos(_point, canvas, 0);
    areas[_areaIdx].shapes[_shapeIdx].points.splice(_pointIdx, 0, _point);
    draw();

    addWork({func: "addPoint", index: {area: _areaIdx, shape: _shapeIdx, point: _pointIdx}, point: _point});
}
function addShape(_areaIdx, _shapeIdx, _shape){
    if (_areaIdx === -1) return;
    if (_shapeIdx < 0) _shapeIdx = areas[_areaIdx].shapes.length - 1;

    const shapes = areas[_areaIdx].shapes;
    const shapeMenu = shapeMenus[_areaIdx];

    shapes.push(_shape);
    shapeMenu.insertAdjacentHTML("beforeend", `<button class="shapeitem"></button>`);
    setShapeitemAction(shapeMenu, shapeMenu.children[shapes.length - 1], _shape);
    selectShape(_areaIdx, shapes.length - 1);
    workflow.pop();

    addWork({
        func: "addShape", 
        index: {area: selection.areaIndex, shape: selection.shapeIndex}, 
        shape: _shape
    });
}
function addArea(_areaIdx, _area){
    if (_areaIdx < 0) _areaIdx = areas.length - 1;
    if (_areaIdx === 0) _areaIdx = 1;

    areas.splice(_areaIdx, 0, _area);

    shapeMenus[_areaIdx - 1].insertAdjacentHTML('afterend', getAccordionHTML(_area));
    initAccordion(accordions[_areaIdx]);
    setAccordionAction(colorInputers[_areaIdx], accordions[_areaIdx], shapeMenus[_areaIdx], areas[_areaIdx]);

    if (renameArea(_areaIdx, _area.name)) workflow.pop();
    selectArea(_areaIdx);
    selectShape(_areaIdx, 0);
    workflow.pop();
    workflow.pop();

    selection.areaIndex = _areaIdx;
    selection.shapeIndex = 0;

    draw();

    addWork({func: "addArea", index: {area: selection.areaIndex}, area: _area});
}
//#endregion
//#region pos to index of piece
function getShapeIndexByPos(_shapes, _pos)
{
    let shapeIdx = -1;

    for (let i = 0; i < _shapes.length; i++){
        const points = _shapes[i].points;
        const shapePath = new Path2D();

        shapePath.moveTo(points[0].x, points[0].y);
        for (let j = 1; j < points.length; j++)
            shapePath.lineTo(points[j].x, points[j].y);
        shapePath.closePath();

        if (ctx.isPointInPath(shapePath, _pos.x, _pos.y))
        {
            shapeIdx = i;
            break;
        }
    }

    return shapeIdx;
}
function getAreaIndexByPos(_pos)
{
    let areaIdx = -1;

    for (let i = 0; i < areas.length; i++){
        if (getShapeIndexByPos(areas[i].shapes, _pos) !== -1){
            areaIdx = i;
        }
    }

    return areaIdx;
}
//#endregion
//#region delete piece
function deletePointByPos(_areaIdx, _shapeIdx, _point){
    if (_areaIdx === -1) return;
    if (_shapeIdx === -1) return;

    let points = areas[_areaIdx].shapes[_shapeIdx].points;
    let index = -1;

    if (points.length <= 3) return;

    for (let i = 0; i < points.length; i++){
        const distSquare = getDistanceSquare(points[i], _point);
        if (distSquare <= getSquare(canvasSettings.controlPointR / zoomScale))
        {
            index = i;
            break;
        }
    }

    deletePointByIndex(_areaIdx, _shapeIdx, index);
}
function deletePointByIndex(_areaIdx, _shapeIdx, _pointIdx){
    if (areas[_areaIdx].shapes[_shapeIdx].points.length <= 3) return;
    if (_areaIdx === -1) return;
    if (_shapeIdx === -1) return;
    if (_pointIdx === -1) return;

    const point = areas[_areaIdx].shapes[_shapeIdx].points[_pointIdx];

    areas[_areaIdx].shapes[_shapeIdx].points.splice(_pointIdx, 1);
    draw();

    addWork({
        func: "deletePoint", 
        index: {area: _areaIdx, shape: _shapeIdx, point: _pointIdx}, 
        point: point
    });
}
function deleteShapeByPos(_areaIdx, _point)
{
    if (_areaIdx === -1) return;

    const shapes = areas[_areaIdx].shapes;
    const shapeIdx = getShapeIndexByPos(shapes, _point);

    if (shapeIdx === -1) return;

    deleteShapeByIndex(_areaIdx, shapeIdx);
}
function deleteShapeByIndex(_areaIdx, _shapeIdx)
{
    if (_areaIdx === -1) return;

    const shapes = areas[_areaIdx].shapes;

    if (shapes.length <= 1) return;

    const shape = shapes[_shapeIdx];
    shapeMenus[_areaIdx].children[_shapeIdx].remove();
    shapes.splice(_shapeIdx, 1);
    selectShape(_areaIdx, Math.max(0, _shapeIdx - 1));
    workflow.pop();

    draw();

    addWork({func: "deleteShape", index: {area: _areaIdx, shape: _shapeIdx}, shape: shape});
}
function deleteAreaByPos(_pos){
    if (areas.length <= 1) return;

    deleteAreaByIndex(getAreaIndexByPos(_pos));
}
function deleteAreaByIndex(_areaIdx){
    if (areas.length <= 1) return;

    const area = areas[_areaIdx];
    
    accordions[_areaIdx].previousElementSibling.remove();
    accordions[_areaIdx].remove();
    shapeMenus[_areaIdx].remove();
    colorInputers[_areaIdx].remove();

    areas.splice(_areaIdx, 1);
    
    selection = {areaIndex: Math.max(0, _areaIdx - 1), shapeIndex: -1};
    accordions[Math.max(0, _areaIdx - 1)].dataset.selected = "true";

    draw();

    addWork({func: "deleteArea", index: {area: _areaIdx}, area: area});
}
//#endregion
//#region zoom
function zoom(_scale, _refPoint)
{
    const before = zoomScale;

    zoomScale *= 1 + wheelSpeed * _scale;
    zoomScale = clamp(zoomMin, zoomScale, zoomMax);

    const zoomRatio = zoomScale / before;

    viewOffset.x -= (_refPoint.x + viewOffset.x) * (1 - zoomRatio);
    viewOffset.y -= (_refPoint.y + viewOffset.y) * (1 - zoomRatio);

    adjustViewOffset();

    draw();
}
function moveView()
{
    if (!canvasMousedown) return;

    const m = getMousePos(canvas);

    viewOffset.x = canvasDownOffset.x + (canvasDownPos.x - m.x);
  	viewOffset.y = canvasDownOffset.y + (canvasDownPos.y - m.y);

    adjustViewOffset();

    draw();
}
function adjustViewOffset()
{
	const side = Math.min(img.width, img.height);
    const normalized = normalizeImageSize(img.width, img.height, 500);

    viewOffset.x = clamp(0, viewOffset.x, 500 * (img.width - side) / side + normalized.w * (zoomScale - 1));
    viewOffset.y = clamp(0, viewOffset.y, 500 * (img.height - side) / side + normalized.h * (zoomScale - 1));
}
//#endregion
//#region coordinate transform
function toCanvasPos(_pos)
{
    return { 
        x: zoomScale * _pos.x - viewOffset.x,
        y: zoomScale * _pos.y - viewOffset.y 
    };
}
function toDataPos(_pos)
{
    return {
        x: (Number(_pos.x) + viewOffset.x) / zoomScale,
        y: (Number(_pos.y) + viewOffset.y) / zoomScale
    };
}
//#endregion
//#region draw on canvas
function drawAreas()
{
    for (let i = 0; i < areas.length; i++){
        let shapes = areas[i].shapes;

        ctx.strokeStyle = "#000000";
        ctx.fillStyle = areas[i].color + "80";

        drawArea(shapes, areas[i].color);
    }
}
function drawArea(shapes, rgbCode)
{
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = canvasSettings.lineW + 2 * canvasSettings.lineShadow;

    for(let i = 0; i < shapes.length; i++){
        ctx.beginPath();
        const points = shapes[i].points.map(a => toCanvasPos(a));
        ctx.moveTo(points[0].x, points[0].y);

        for(let j = 1; j < points.length; j++)
        {
            ctx.lineTo(points[j].x, points[j].y);
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    ctx.strokeStyle = rgbCode;
    ctx.lineWidth = canvasSettings.lineW;

    for(let i = 0; i < shapes.length; i++){
        const points = shapes[i].points.map(a => toCanvasPos(a));
        ctx.moveTo(points[0].x, points[0].y);

        for(let j = 1; j < points.length; j++)
        {
            ctx.lineTo(points[j].x, points[j].y);
        }

        ctx.closePath();
        ctx.stroke();
    }
}
function drawControlPoint()
{
    let shapes = areas[selection.areaIndex].shapes;

    if (selection.shapeIndex !== -1)
        shapes = [shapes[selection.shapeIndex]];

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#ff0000";

    for(let i = 0; i < shapes.length; i++){
        const points = shapes[i].points.map(a => toCanvasPos(a));
        for(let j = 0; j < points.length; j++){
            ctx.beginPath();
            ctx.moveTo(points[j].x, points[j].y)
            ctx.arc(points[j].x, points[j].y, canvasSettings.controlPointR, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fill();
        }
    }
}
function draw()
{
    if (!canvas.getContext) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (imageLoaded){
        const side = Math.min(img.width, img.height);

        ctx.drawImage(img, 
            viewOffset.x * side / 500 / zoomScale, viewOffset.y * side / 500 / zoomScale,
            side / zoomScale, side / zoomScale,
            0, 0, 
            500, 500);
        drawAreas();
        if (selection.areaIndex != -1)
            drawControlPoint();
    }

    img.onload = function()
    {
        imageLoaded = true;

        const side = Math.min(img.width, img.height);

        ctx.drawImage(img, 
            viewOffset.x * side / 500 / zoomScale, viewOffset.y * side / 500 / zoomScale,
            side / zoomScale, side / zoomScale,
            0, 0, 
            500, 500);
        drawAreas();
        if (selection.areaIndex != -1)
            drawControlPoint();
    }
}
//#endregion
//#region handling user input
function handleDragging(e)
{
    if (isUsingHand){
        moveView();
    }
    else{
        dragPoint();
    }
}
function handleCanvasMouseDown(e)
{
    if (e.which === 1){
        if (!canvasMousedown){
            const m = getMousePos(canvas);
            canvasDownPos.x = m.x;
            canvasDownPos.y = m.y;
            canvasDownOffset.x = viewOffset.x;
            canvasDownOffset.y = viewOffset.y;
        }
        if (isUsingHand){
            canvas.style.cursor = "grabbing";
        }
        canvasMousedown = true;
    }
}
function handleKeyDown(e)
{
    if (isEditingText) return;
    const key = e.code;

    if (key === "Digit1") toPointMode();
    else if (key === "Digit2") toShapeMode();
    else if (key === "Digit3") toAreaMode();

    if (e.shiftKey){
        useHandTool(true);
    }
}
function handleKeyUp(e)
{
    if (isEditingText) return;
    const key = e.code;
    const mousePos = toDataPos(adjustPos(getMousePos(canvas), canvas, 100));

    if (key.startsWith("Shift")){
        useHandTool(false);
    }
    if (key === "KeyA") {
        switch(mode){
            case "point": 
                addPoint(selection.areaIndex, selection.shapeIndex, mousePos);
                break;
            case "shape":
                const defaultShape = 
                    new Shape(
                        `Shape${areas[selection.areaIndex]?.shapes?.length + 1}`,
                        triangle(mousePos, zoomScale)
                    );
                addShape(selection.areaIndex, selection.shapeIndex, defaultShape);
                break;
            case "area":
                const defaultArea =
                new Area(
                    `Area${areas.length + 1}`,
                    getRandomRGB(),
                    [new Shape(
                        `Shape1`,
                        triangle(mousePos, zoomScale)
                    )]
                );
                addArea(selection.areaIndex + 1, defaultArea);
                break;
        }
    }
    if (key === "KeyS"){
        if (e.ctrlKey) {
            save();
        }
    }
    if (key === "KeyY"){
        if (e.ctrlKey){
            redo();
        }
    }
    if (key === "KeyZ"){
        if (e.ctrlKey){
            undo();
        }
    }
    if (key === "Escape") {
        cancel();
    }
}
function handleMouseInput(e)
{
    if (e.which === 1) {
        mousedown = true;
        selectPoint();
    }
    if (e.which === 3) {
        rightMousedown = true;
    }
}
function handleMouseUp(e)
{
    if (rightMousedown) {
        const mousePos = toDataPos(getMousePos(canvas));
        switch(mode){
            case "point":
                deletePointByPos(selection.areaIndex, selection.shapeIndex, mousePos);
                break;
            case "shape":
                deleteShapeByPos(selection.areaIndex, mousePos);
                break;
            case "area":
                deleteAreaByPos(mousePos);
                break;
        }
    }

    if (dragTarget.shape !== -1 && dragTarget.point !== -1){
        dropPoint();
    }

    if (e.which === 1){
        if (isUsingHand){
            canvas.style.cursor = "grab";
        }
        canvasMousedown = false;
        mousedown = false;
    }
    if (e.which === 3){
        rightMousedown = false;
    }
    dragTarget = {shape: -1, point: -1};
}
//#endregion

document.addEventListener('keydown', (e) => {handleKeyDown(e)});
document.addEventListener('keyup', (e) => {handleKeyUp(e)});
document.addEventListener('mousemove', (e) => {mouseE = e; handleDragging(e);})
document.addEventListener('mousedown', (e) => {handleMouseInput(e)});
document.addEventListener('mouseup', (e) => {handleMouseUp(e)});