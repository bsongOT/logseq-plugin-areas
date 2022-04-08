const getSeed = () => Math.random().toString(36).replace(/[^a-z]+/g, '');
const getRandomRGB = () =>
{
    const rgbStr = "000000" + Math.floor(Math.random() * 0xffffff).toString(16);
    return "#" + rgbStr.substring(rgbStr.length - 6, rgbStr.length); 
}
const getSquare = num => num * num;
const clamp = (min, value, max) => {
    return Math.min(Math.max(value, min), max);
}
const getDistanceSquare = (p1, p2) => 
{
    const deltax = p1.x - p2.x;
    const deltay = p1.y - p2.y;
    return deltax * deltax + deltay * deltay;
}

const getDistanceSqPointStraight = (point, straight) =>
{
    const deltaBAx = straight.b.x - straight.a.x;
    const deltaBAy = straight.b.y - straight.a.y;
    const deltaACx = straight.a.x - point.x;
    const deltaACy = straight.a.y - point.y;

    return getSquare(deltaBAx * deltaACy - deltaBAy * deltaACx) / (getSquare(deltaBAx) + getSquare(deltaBAy));
}

const getDistanceSqPointSegment = (point, segment) =>
{
    const disqPA = getDistanceSquare(point, segment.a);
    const disqPB = getDistanceSquare(point, segment.b);
    const disqAB = getDistanceSquare(segment.a, segment.b);

    if (disqAB + disqPA - disqPB <= 0) return disqPA;
    else if (disqAB + disqPB - disqPA <= 0) return disqPB;
    else return getDistanceSqPointStraight(point, segment);
}

const getMousePos = (canvas) =>
{
    const rect = canvas.getBoundingClientRect();
    return {
    x: mouseE.clientX - rect.left,
    y: mouseE.clientY - rect.top
    };
}

const adjustPos = (pos, canvas, triangleSide) =>
{
    const c = { x: canvas.width, y: canvas.height };
    const s = triangleSide;
    const adjustedX = Math.max(Math.min(pos.x, c.x - 0.5 * s), 0.5 * s);
    const adjustedY = Math.max(Math.min(pos.y, c.y - 0.29 * s), 0.58 * s);

    return {x: adjustedX, y: adjustedY};
}

const triangle = (center, scale) => [
    {x: center.x, y: center.y - 58 / scale},
    {x: center.x - 50 / scale, y: center.y + 29 / scale}, 
    {x: center.x + 50 / scale, y: center.y + 29 / scale}
];

const restrictName = (_name, _limit, _forbidden_chars) =>
{
    _name = _name.substring(0, _limit);

    for (let i = 0; i < _forbidden_chars.length; i++){
        _name = _name.replaceAll(_forbidden_chars[i], '');
    }
    
    return _name;
}

function normalizeImageSize(_width, _height, _normalSide){
    if (_width >= _height){
        return { w: _normalSide * _width / _height, h: _normalSide };
    }
    else{
        return { w: _normalSide, h: _normalSide * _height / _width };
    }
}

const restrictSize = (w, h) =>
{
    const restrictedW = Math.min(Math.max(w, 200), 776);
    const restrictedlH = restrictedW * h / w;

    return {w: restrictedW, h: restrictedlH};
}

const customizeSize = (w, h, custom_w, custom_h) =>{
    return {w: custom_w ?? w, h: custom_h ?? (custom_w ?? w) * h / w};
}