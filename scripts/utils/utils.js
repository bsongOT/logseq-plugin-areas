const getSeed = () => Math.random().toString(36).replace(/[^a-z]+/g, '');
const getRandomRGB = () => "#" + ("000000" + Math.floor(Math.random() * 0xffffff).toString(16)).slice(-6);
const clamp = (min, value, max) => Math.min(Math.max(value, min), max);
const getSquare = num => num * num;
const getMousePos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}
function normalizeImageSize(_width, _height, _normalSide){
    if (_width >= _height) return { w: _normalSide * _width / _height, h: _normalSide };
    else return { w: _normalSide, h: _normalSide * _height / _width };
}
function restrictSize(w, h){
    const restrictedW = clamp(200, w, 776);
    const restrictedlH = restrictedW * h / w;

    return {w: restrictedW, h: restrictedlH};
}
function customizeSize(w, h, custom_w, custom_h){
    return {w: custom_w ?? w, h: custom_h ?? (custom_w ?? w) * h / w};
}
function isSameIdx(_idx1, _idx2){
    const isValid = a => (a >= 0) && !isNaN(a);
    if (!_idx1 && !_idx2) return true;
    if (_idx1 && _idx2) {
        const same1 = (!isValid(_idx1?.area) && !isValid(_idx2?.area)) || (_idx1.area === _idx2.area);
        const same2 = (!isValid(_idx1?.shape) && !isValid(_idx2?.shape)) || (_idx1.shape === _idx2.shape);
        const same3 = (!isValid(_idx1?.point) && !isValid(_idx2?.point)) || (_idx1.point === _idx2.point);

        return same1 && same2 && same3;
    }
    return false;
}