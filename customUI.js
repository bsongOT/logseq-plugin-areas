let shapemenuObservers = [];
let accordionObservers = [];
let selectedAcc = null;

function initUI(){
    let accs = document.getElementsByClassName("accordion");
    shapemenuObservers = [];
    accordionObservers = [];
    selectedAcc = null;

    for (let i = 0; i < accs.length; i++){
        initAccordion(accs[i]);
    }
}

function initAccordion(acc)
{
    const panel = acc.nextElementSibling;
    const editButton = acc.previousElementSibling;
    const nameText = acc.children[0];

    acc.addEventListener("click", function() {
        this.dataset.selected = this !== selectedAcc;
    });

    editButton.addEventListener("click", function() {
        nameText.contentEditable='true';
        nameText.focus();
    });

    nameText.addEventListener("focus", function(){
        document.execCommand('selectAll', false, null);
        document.addEventListener("keydown", function(e){
            if (e.code === "Enter") {
                nameText.blur();
            }
        });
    });

    nameText.addEventListener("focusout", function(){
        const limit = this.dataset.nameLimit;
        const forbiddens = this.dataset.forbiddens.split(" ");

        this.contentEditable = false;
        this.innerText = restrictName(this.innerText, limit, forbiddens);
    });

    const menuObserver = new MutationObserver(() => {
        if (acc.classList[1]) {
            panel.style.maxHeight = panel.scrollHeight + "px";
        }
    });

    if (acc.dataset.selected === "true")
    {
        if (selectedAcc){
            selectedAcc.classList.remove("active");
            selectedAcc.nextElementSibling.style.maxHeight = null;
            selectedAcc.previousElementSibling.disabled = true;
        }
        acc.classList.add("active");
        editButton.disabled = false;
        panel.style.maxHeight = panel.scrollHeight + "px";
        selectedAcc = acc;
    }
    else
    {
        acc.classList.remove("active");
        panel.style.maxHeight = null;
        editButton.disabled = true;
        if (acc === selectedAcc)
            selectedAcc = null;
    }

    const accObserver = new MutationObserver(() => {
        if (acc.dataset.selected === "true")
        {
            if (selectedAcc && selectedAcc.nextElementSibling){
                selectedAcc.classList.remove("active");
                selectedAcc.nextElementSibling.style.maxHeight = null;
                selectedAcc.previousElementSibling.disabled = true;
            }
            acc.classList.add("active");
            editButton.disabled = false;
            panel.style.maxHeight = panel.scrollHeight + "px";
            selectedAcc = acc;
        }
        else
        {
            acc.classList.remove("active");
            panel.style.maxHeight = null;
            editButton.disabled = true;
            if (acc === selectedAcc)
                selectedAcc = null;
        }
    });

    shapemenuObservers.push(menuObserver);
    accordionObservers.push(accObserver);

    menuObserver.observe(panel, {childList: true});
    accObserver.observe(acc, {attributes: true, attributeFilter: ["data-selected"]});
}