class SingleSelect extends HTMLInputElement
{
    constructor(...args)
    {
        super(...args);

        this.addEventListener("click", function(e){
            this.selected = !this.selected;
            this.checked = this.selected;
        });
    }

    get name(){
        return this.getAttribute("name");
    }

    set name(_value){
        this.setAttribute("name", _value);
    }

    get selected(){
        return this.getAttribute("selected") === "true";
    }
    
    set selected(_value){
        const before = this.selected;

        if (_value){
            const singleSelects = Array.from(document.getElementsByTagName("input")).filter(a => a.getAttribute("is") === "single-select");
            const targets = Array.from(singleSelects).filter(a => a.name === this.name);
            const selectedNode = targets.filter(a => a.selected === true)[0];

            if (selectedNode) selectedNode.selected = false;
        }

        this.checked = _value;
        this.setAttribute("selected", _value);

        if (before != _value)
            this.dispatchEvent(new CustomEvent("selectchange"));
    }
}

window.customElements.define("single-select", SingleSelect, {
    extends: "input"
});