class Parser
{
    toDatas(_blockContent)
    {
        const begin = "#+BEGIN_COMMENT\n";
        const end = "\n#+END_COMMENT";
        const beginIndex = _blockContent.indexOf(begin);
        const endIndex = _blockContent.indexOf(end);
    
        if (beginIndex === -1 || endIndex === -1) return {error: "no data"};
        if (beginIndex >= endIndex) return {error: "no data"};
    
        const before = _blockContent.substring(0, beginIndex);
        const dataStr = _blockContent.substring(beginIndex + begin.length, endIndex);
        const dataArr = dataStr.split("\n");
        const after = _blockContent.substring(endIndex + end.length);

        if (dataArr.length !== 3) return {error: "invalid data", userContent: before + after};
        if (!dataArr[0].startsWith("visiblity=")) return {error: "invalid data", userContent: (before + after).trim()};
        if (!dataArr[1].startsWith("selected=")) return {error: "invalid data", userContent: (before + after).trim()};
    
        const userContent = (before + after).trim();
        const visiblity = dataArr[0][10] === "1";
        const selected = dataArr[1].substring(9);
        const areas = this.toAreas(dataArr[2]);
    
        return {userContent: userContent, visiblity: visiblity, selected: selected, areas: areas};
    }

    toBlockContent(_datas)
    {
        return _datas.userContent + "\n" +
                "#+BEGIN_COMMENT\n" +
                "visiblity=" + (_datas.visiblity ? "1":"0") + "\n" + 
                "selected=" + _datas.selected + "\n" +
                this.toAreasString(_datas.areas) +
                "\n#+END_COMMENT";
    }

    toggleVisible(_blockContent){
        const lines = _blockContent.split("\n");
        const begin = "#+BEGIN_COMMENT";
        const end = "#+END_COMMENT";
        const beginIndex = lines.indexOf(begin);
        const endIndex = lines.indexOf(end);
        
        if (beginIndex === -1 || endIndex === -1) return {error: "no data"};
        if (beginIndex >= endIndex) return {error: "no data"};
        if (!lines[beginIndex + 1].startsWith("visiblity=")) return {error: "invalid data"};

        lines[beginIndex + 1] = "visiblity=" + (lines[beginIndex + 1][10] === "1" ? "0" : "1");
        return lines.join("\n");
    }

    changeSelect(_blockContent, _selected){
        const lines = _blockContent.split("\n");
        const begin = "#+BEGIN_COMMENT";
        const end = "#+END_COMMENT";
        const beginIndex = lines.indexOf(begin);
        const endIndex = lines.indexOf(end);
        
        if (beginIndex === -1 || endIndex === -1) return {error: "no data"};
        if (beginIndex >= endIndex) return {error: "no data"};
        if (!lines[beginIndex + 2].startsWith("selected=")) return {error: "invalid data"};

        lines[beginIndex + 2] = "selected=" + _selected;
        return lines.join("\n");
    }

    toAreasString(_areas){
        return _areas.map(el => this.toAreaString(el)).join(";");
    }

    toAreaString(_area){
        let output = `${_area.name}-${_area.color}-[`;
        for (let i = 0; i < _area.shapes.length; i++){
            const shape = _area.shapes[i];
            output += `{${shape.name}=`;
            output += shape.points.map(el => `${el.x},${el.y}`).join(" ");
            output += `}`;
        }
    
        output += ']';
    
        return output;
    }

    toAreas(_areasStr){
        return _areasStr.split(";").map(el => this.toArea(el)).filter(a => a);
    }

    toArea(_areaStr){
        const areaArr = _areaStr.split("-");

        if (areaArr.length !== 3) return null;

        const shapesArr = areaArr[2].substring(2, areaArr[2].length - 2).split("}{");
        let shapes = [];

        for (let i = 0; i < shapesArr.length; i++){
            const shapeArr = shapesArr[i].split("=");
            const shapeName = shapeArr[0];
            const shapePoints = shapeArr[1].split(" ").map(el => {
                const point = el.split(",");
                return {x: point[0], y: point[1]};
            });
            shapes.push(new Shape(shapeName, shapePoints));
        }

        return new Area(areaArr[0], areaArr[1], shapes);
    }
}
class HtmlParser
{
    blockuuid;
    uiid;
    lineWidth;
    lineShadow;
    sizeW;
    sizeH;

    constructor(_uuid, _uiid, _lineWidth, _lineShadow, _sizeW, _sizeH)
    {
        this.blockuuid = _uuid;
        this.uiid = _uiid;
        this.lineWidth = _lineWidth;
        this.lineShadow = _lineShadow;
        this.sizeW = _sizeW;
        this.sizeH = _sizeH;
    }

    toSvgElements(_areas){
        return _areas.map(el => this.toSvgElement(el)).join("");
    }

    toSvgElement(_area){
        let areaSvg = `<svg class="area-${this.uiid}" id="${this.uiid}-${_area.name}" preserveAspectRatio="none" viewBox="0 0 ${this.sizeW} ${this.sizeH}">`;
        areaSvg += _area.shapes.map((el, idx) => this.toPolygonElement(el, idx, _area.name, _area.color));
        areaSvg += "</svg>";
    
        return areaSvg;
    }

    toPolygonElement(_shape, _index, _areaName, _areaColor){
        const normalSize = normalizeImageSize(this.sizeW, this.sizeH, 500);
        const pointsStr = _shape.points.map(el => `${el.x * this.sizeW / normalSize.w},${el.y * this.sizeH / normalSize.h}`).join(" ");
        const areaSvg = `<polygon class="strokeOutline" id="${this.uiid}-${_areaName}-shape${_index}" data-on-click="selectArea"
                        data-area-block=${this.blockuuid} style="fill:${_areaColor}80;"
                        points="${pointsStr}"/>
                        <polygon class="stroke" style="stroke:${_areaColor};" points="${pointsStr}"/>`;
        return areaSvg;
    }
}