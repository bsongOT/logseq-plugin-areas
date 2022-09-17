const css = (_uiid, _stroke, _strokeLine, _imgWidth, _imgHeight, _visiblity, _selected) => 
    `div.lpa-area-container
    {
        position: relative;
        white-space: normal;
    }
    img.canvas-image-${_uiid}
    {
        position: relative;
        width: ${_imgWidth}px;
        aspect-ratio: ${_imgWidth/_imgHeight};
        cursor: default;
    }
    svg.area-${_uiid}
    {
        position: absolute;
        left: 0;
        top: 0;
        width: ${_imgWidth}px;
        aspect-ratio: ${_imgWidth/_imgHeight};
        max-width: 100%;
        stroke-linejoin:round;
        pointer-events: none;
        opacity: ${_visiblity ? 1 : 0};
        transition: 0.2s;
    }
    svg.area-${_uiid}:hover
    {
        opacity: 1;
    }
    svg.area-${_uiid} > polygon.strokeOutline
    {
        stroke-width:${_stroke + 2 * _strokeLine};
        stroke:black;
    }
    svg.area-${_uiid} > polygon.stroke
    {
        stroke-width:${_stroke};
        fill:none;
    }
    svg.area-${_uiid} > polygon
    {
        pointer-events: auto;
        cursor: pointer;
    }`
    +
    (_selected !== "" ?
    `#${_selected}
    {
        opacity: 1;
    }` : "")
    +
    `button.edit-${_uiid}
    {
        position: absolute;
        top: 0;
        right: -35px;
        width: 30px;
        height: 30px;
        border: 0;
        background-color: rgba(255, 255, 255, 0);
        opacity: 0;
        transition: 0.4s;
    }
    button.edit-${_uiid} > img
    {
        position: absolute;
        top: 0;
        left: 0;
        width: 30px;
        height: 30px;
        box-shadow: none;
        filter: drop-shadow(1px 0 0 white)
                drop-shadow(-1px 0 0 white)
                drop-shadow(0 1px 0 white)
                drop-shadow(0 -1px 0 white);
    }
    button.visible-${_uiid}
    {
        position: absolute;
        top: 40px;
        right: -35px;
        width: 30px;
        height: 30px;
        border: 0;
        background-color: rgba(255, 255, 255, 0);
        opacity: 0;
        transition: 0.4s;
    }
    button.visible-${_uiid} > img
    {
        position: absolute;
        top: 0;
        left: 0;
        width: 30px;
        height: 30px;
        box-shadow: none;
        filter: drop-shadow(1px 0 0 white)
                drop-shadow(-1px 0 0 white)
                drop-shadow(0 1px 0 white)
                drop-shadow(0 -1px 0 white);
    }
    img.canvas-image-${_uiid}:hover ~ button
    {
        opacity: 1;
    }
    button.edit-${_uiid}:hover
    {
        opacity: 1;
    }
    button.visible-${_uiid}:hover
    {
        opacity: 1;
    }`;