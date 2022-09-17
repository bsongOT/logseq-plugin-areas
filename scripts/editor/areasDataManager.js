class AreasDataManager
{
    areas;
    get area3arr(){ return this.areas.map(a => a.toArray()) };
    get #commands(){
        return {
            add: this.#add, delete: this.#delete, move: this.#move, rename: this.#rename, recolor: this.#recolor,
            changeOrder: this.#changeOrder
        }
    }
    constructor(_areas){
        this.areas = _areas;
    }
    ask(_type, _feat) {
        return this.#commands[_type](_feat);
    }
    #changeOrder = (_feat) => {
        if (isNaN(_feat.index.area) || _feat.index.area < 0 || _feat.index.area >= this.areas.length) return;
        if (_feat.kind === "area"){
            const afterIdx = _feat.index.area + _feat.amount;
            if (isNaN(afterIdx) || afterIdx < 0 || afterIdx >= this.areas.length) return;
            const area = this.areas[_feat.index.area];
            this.areas.splice(_feat.index.area, 1);
            this.areas.splice(afterIdx, 0, area);
            return _feat;
        }
        else if (_feat.kind === "shape"){
            if (isNaN(_feat.index.shape) || _feat.index.shape < 0 || _feat.index.shape >= this.areas[_feat.index.area].shapes.length) return;
            const afterIdx = _feat.index.shape + _feat.amount;
            if (isNaN(afterIdx) || afterIdx < 0 || afterIdx >= this.areas[_feat.index.area].shapes.length) return;
            const shape = this.areas[_feat.index.area].shapes[_feat.index.shape];
            this.areas[_feat.index.area].shapes.splice(_feat.index.shape, 1);
            this.areas[_feat.index.area].shapes.splice(afterIdx, 0, shape);
            return _feat;
        }
    }
    #add = (_feat) => {
        const idx = _feat.index;
        switch(_feat.kind){
            case "point":
                if (!this.areas[idx.area]?.shapes?.[idx.shape]?.points) return;

                this.areas[idx.area].shapes[idx.shape].points.splice(idx.point, 0, _feat.piece);
                
                return _feat;
            case "shape":
                if (!this.areas[idx.area]?.shapes) return;

                this.areas[idx.area].shapes.splice(idx.shape, 0, _feat.piece);
                
                return _feat;
            case "area":
                this.areas.splice(idx.area, 0, _feat.piece);
                this.#rename(new Rename("done", idx, "area", this.areas[idx.area].name, false));
                
                return _feat;
        }
    }
    #delete = (_feat) => {
        const idx = _feat.index;
        switch(_feat.kind){
            case "point":
                if (!this.areas[idx.area]?.shapes?.[idx.shape]?.points?.[idx.point]) return; 
                if (this.areas[idx.area].shapes[idx.shape].points.length <= 3) return;

                this.areas[idx.area].shapes[idx.shape].points.splice(idx.point, 1);
                return _feat;
            case "shape":
                if (!this.areas[idx.area]?.shapes?.[idx.shape]) return;
                if (this.areas[idx.area].shapes.length <= 1) return;

                this.areas[idx.area].shapes.splice(idx.shape, 1);
                return _feat;
            case "area":
                if (!this.areas[idx.area]) return;
                if (this.areas.length <= 1) return;

                this.areas.splice(idx.area, 1);
                return _feat;
        }
    }
    #move = (_feat) => {
        const idx = _feat.index;
        const movePoint = (_idx, _v) => {
            const p = this.areas[_idx.area]?.shapes?.[_idx.shape]?.points?.[_idx.point];
            if (!p) return;
            p.x = Number(p.x) + Number(_v.x);
            p.y = Number(p.y) + Number(_v.y);
        }
        switch(_feat.kind){
            case "point":
                movePoint(idx, _feat.dir);
                return;
            case "shape":
                if (!this.areas[idx.area]?.shapes?.[idx.shape]) return;
                for (let i = 0; i < this.areas[idx.area].shapes[idx.shape].points.length; i++)
                    movePoint({area: idx.area, shape: idx.shape, point: i}, _feat.dir);
                return;
            case "area":
                if (!this.areas[idx.area]) return;
                for (let i = 0; i < this.areas[idx.area].shapes.length; i++)
                    for (let j = 0; j < this.areas[idx.area].shapes[i].points.length; j++)
                        movePoint({area: idx.area, shape: i, point: j}, _feat.dir);
                return;
        }
    }
    #rename = (_feat) => {
        const idx = _feat.index;
        switch (_feat.kind){
            case "shape":
                if (!this.areas[idx.area]?.shapes?.[idx.shape]) return;
                this.areas[idx.area].shapes[idx.shape].name = _feat.name;
                return _feat;
            case "area":
                if (!this.areas[idx.area]) return;
                let newName = restrictName(_feat.name.trim(), 30, ["-", "=", "{", "}", "[", "]", ";", "]"]);
                if (newName === "") return new Rename(_feat.state, _feat.index, _feat.kind, this.areas[idx.area].name, false);
                newName = preventOverlap(this.areas.map(a => a.name), newName, idx.area);
                this.areas[idx.area].name = newName;
                return new Rename(_feat.state, _feat.index, _feat.kind, newName, _feat.isWork);
        }
    }
    #recolor = (_feat) => {
        const idx = _feat.index;

        if (!this.areas[idx.area]) return;
        this.areas[idx.area].color = _feat.color;
        return _feat;
    }
}