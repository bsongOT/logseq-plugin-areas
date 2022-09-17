const delta = (p1, p2) => {
    return { x: p2.x - p1.x, y: p2.y - p1.y }
}
const triangle = (center, scale) => [
    {x: center.x, y: center.y - 58 / scale},
    {x: center.x - 50 / scale, y: center.y + 29 / scale}, 
    {x: center.x + 50 / scale, y: center.y + 29 / scale}
];
function getDistanceSquare(p1, p2) { 
    return getSquare(p1.x - p2.x) + getSquare(p1.y - p2.y); 
}
function getDistanceSqPointStraight(point, straight){
    const deltaBAx = straight.b.x - straight.a.x;
    const deltaBAy = straight.b.y - straight.a.y;
    const deltaACx = straight.a.x - point.x;
    const deltaACy = straight.a.y - point.y;

    return getSquare(deltaBAx * deltaACy - deltaBAy * deltaACx) / (getSquare(deltaBAx) + getSquare(deltaBAy));
}
function getDistanceSqPointSegment(point, segment){
    const d_PA = getDistanceSquare(point, segment.a);
    const d_PB = getDistanceSquare(point, segment.b);
    const d_AB = getDistanceSquare(segment.a, segment.b);

    if (d_AB + d_PA - d_PB <= 0) return d_PA;
    else if (d_AB - d_PA + d_PB <= 0) return d_PB;
    else return getDistanceSqPointStraight(point, segment);
}
function getIndexOfClosestSegment(_segments, _point){
    return indexOfMin(_segments.map(a => getDistanceSqPointSegment(_point, {a: a[0], b: a[1]})));
}
function isInPoint(_coord, _point, _radius){
    return getDistanceSquare(_point, _coord) <= getSquare(_radius)
}
function isInShape(_coord, _shape, _ctx){
    const shapePath = new Path2D();

    shapePath.moveTo(_shape.points[0].x, _shape.points[0].y);
    for (let i = 1; i < _shape.points.length; i++)
        shapePath.lineTo(_shape.points[i].x, _shape.points[i].y);
    shapePath.closePath();

    return _ctx.isPointInPath(shapePath, _coord.x, _coord.y)
}
function isInArea(_coord, _area, _ctx){
    return _area.shapes.some(a => isInShape(_coord, a, _ctx));
}
function clampBox(pos, boxRange, triangleSide)
{
    const s = triangleSide;
    const adjustedX = clamp(0.5 * s, pos.x, boxRange.x - 0.5 * s);
    const adjustedY = clamp(0.58 * s, pos.y, boxRange.y - 0.29 * s);

    return {x: adjustedX, y: adjustedY};
}
function reviseDir(_point, _dir){                    
    const before = _point;
    const later = { x: before.x + _dir.x, y: before.y + _dir.y};
    const after = clampBox(later, DER.CD.movableRange, 0);
    return {x: after.x - before.x, y: after.y - before.y};
}
function getThresholds(points){
    const xs = points.map(a => a.x);
    const ys = points.map(a => a.y);
    const p1 = {x: Math.min(...xs), y: Math.min(...ys)}
    const p2 = {x: Math.max(...xs), y: Math.max(...ys)}
    return [p1, p2];
}
function getAfterMove(_type, _areas, _idx, _dir){
    let cl;
    if (_type === "shape"){
        cl = _areas[_idx.area].shapes[_idx.shape].clone();
        cl.points = cl.points.map(a => ({x: a.x + _dir.x, y: a.y + _dir.y}));
    }
    else if (_type === "area"){
        cl = _areas[_idx.area].clone();
        cl.shapes = cl.shapes.map(s => {
            s.points = s.points.map(a => ({x: a.x + _dir.x, y: a.y + _dir.y}));
            return s;
        })
    }
    return cl;
}
function toCanvasPos(_pos, _zoomScale, _viewOffset){
    return { 
        x: _zoomScale * _pos.x - _viewOffset.x,
        y: _zoomScale * _pos.y - _viewOffset.y 
    };
}
function toDataPos(_pos, _zoomScale, _viewOffset){
    return {
        x: (Number(_pos.x) + _viewOffset.x) / _zoomScale,
        y: (Number(_pos.y) + _viewOffset.y) / _zoomScale
    };
}