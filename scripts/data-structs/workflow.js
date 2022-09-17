class Workflow
{
    #works;
    #cancelds;

    constructor()
    {
        this.#works = [];
        this.#cancelds = [];
    }

    doWork(_func, _feat)
    {
        if (_func(_feat)){
            this.#cancelds = [];
            this.#works.push({func: _func.name.slice(1), feature: _feat});
            return true;
        }
    }

    undo()
    {
        const targetWork = this.#works.pop();
        this.#cancelds.push(targetWork)
        return targetWork;
    }

    redo()
    {
        const targetWork = this.#cancelds.pop();
        this.#works.push(targetWork);
        return targetWork;
    }

    get undoable(){return this.#works.length >= 1};
    get redoable(){return this.#cancelds.length >= 1};
}