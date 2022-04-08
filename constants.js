const renderType = ':areas';
const defaultData = (uc) => 
{
    return {
        userContent: uc,
        visiblity: true,
        selected: "",
        areas: [new Area("Area1", getRandomRGB(), [new Shape("Shape1", [{x:300, y:300}, {x:200, y:300}, {x:250, y:213}])])] 
    }
};
const queryForProperty = (areaName) =>
                          `[:find (pull ?b [*])
                            :where
                            [?b :block/properties ?p]
                            [(get ?p :area) ?v]
                            [(= ?v "${areaName}")]
                            ]`;
const queryForPageProperty = (areaPageName) =>
                            `[:find (pull ?pp [*])
                              :where
                              [?b :block/page ?pp]
                              [?pp :block/properties ?p]
                              [(get ?p :area-page) ?v]
                              [(= ?v "${areaPageName}")]
                              ]`;
const defaultSettings = [
{
    key: "strokesWidth",
    type: "number",
    title: "Stroke Width?",
    default: 5,
    description: "This is about the width of the sides of the shapes."
},
{
    key: "strokesOutline",
    type: "number",
    title: "Stroke Outline Width?",
    default: 1,
    description: "This is about the width of the outlines of the sides for distinction from the outside."
},
{
    key: "controlPointRadius",
    type: "number",
    title: "Radius of Control-Points?",
    default: 4,
    description: "This is about the radius of the contorl-points which determines a form of shapes."
}];