const renderType = ':areas';
const wheelSpeed = 0.0005;
const zoomMax = 5;
const nameForbiddens = ["-", "=", "{", "}", "[", "]", ";"];
const modeList = ["area", "shape", "point"];
const toolList = ["select", "add", "delete", "hand"];
const queryForProperty = (_areaName) =>
   `[:find (pull ?b [*])
      :where
      [?b :block/properties ?p]
      [(get ?p :area-block) ?v]
      [(= ?v "${_areaName}")]
    ]`;
const queryForPageProperty = (_areaPageName) =>
   `[:find (pull ?pp [*])
      :where
      [?b :block/page ?pp]
      [?pp :block/properties ?p]
      [(get ?p :area-page) ?v]
      [(= ?v "${_areaPageName}")]
    ]`;
const defaultData = (_uc) => {
    return {
        userContent: _uc,
        visiblity: true,
        selected: "",
        areas: [new Area("Area1", getRandomRGB(), [new Shape("Shape1", [{x:300, y:300}, {x:200, y:300}, {x:250, y:213}])])] 
    }
};
const defaultSettings = [
{
    key: "strokesWidth",
    type: "number",
    title: "Stroke Width?",
    default: 5,
    description: "The width of the sides of the shapes."
},
{
    key: "strokesOutline",
    type: "number",
    title: "Stroke Outline Width?",
    default: 1,
    description: "The width of the outlines of the sides for distinction from the outside."
},
{
    key: "controlPointRadius",
    type: "number",
    title: "Radius of Control-Points?",
    default: 4,
    description: "The radius of the contorl-points which determines a form of shapes."
},
{
    key: "scrollDirection",
    type: "enum",
    title: "Zoom in/out Scroll Direction?",
    default: "↑",
    enumChoices: ["↑", "↓"],
    description: "The direction of enlargement when scrolling to zoom in or out in editor"
}];