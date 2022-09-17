class Area
{
    name;
    color;
    shapes;

    constructor(_name, _color, _shapes){
        this.name = _name;
        this.color = _color;
        this.shapes = _shapes;
    }
    static default = (p, c) => new Area("Area1", c ?? getRandomRGB(), [Shape.default(p)]);
    clone = () => new Area(this.name, this.color, this.shapes.map(s => s.clone()));
    toArray(){
        return this.shapes.map(a => [...a.points]);
    }
}

class Shape
{
    name;
    points;

    constructor(_name, _points){
        this.name = _name;
        this.points = _points.map(a => ({x: Number(a.x), y: Number(a.y)}));
    }
    static default = (p) => new Shape("Shape", triangle(p, DER.CD.zoomScale));
    clone = () => new Shape(this.name, this.points.map(a => ({x: a.x, y: a.y})));
}