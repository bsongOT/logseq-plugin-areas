logseq.useSettingsSchema(defaultSettings);

function main () {
    const settings = {
        strokesWidth: Math.max(1, Math.min(Number(logseq.settings.strokesWidth), 10)),
        strokesOutline: Math.max(1, Math.min(Number(logseq.settings.strokesOutline), 5)),
        controlPointRadius: Math.max(0, Math.min(Number(logseq.settings.controlPointRadius), 10))
    };

    const replaceWithAreas = (uuid, content, path) => {
        const startPos = content.indexOf("![");
        const middlePos = content.indexOf("](");
        const endPos = content.indexOf(")");

        if (startPos === -1 || middlePos === -1 || endPos === -1
            || !(startPos < middlePos && middlePos < endPos))
        {
            logseq.App.showMsg("ERROR!! Block has no image");
            return;
        }

        let source = content.substring(middlePos + 2, endPos);

        if (source.startsWith("../assets/")){
            source = `${path}${source.substring(2)}`;
        }

        logseq.Editor.updateBlock(uuid,
            content.substring(0, startPos) +
            `{{renderer ${renderType}-${getSeed()}, ${source}}}` +
            content.substring(endPos + 1)
        );
    }

    const renderInBlock = (slot, args, targetBlock) => {
        const [type, imgSrc, imgWidth, imgHeight] = args;
        const uiid = type.substring(renderType.length + 1, type.length);

        if (!type.startsWith(renderType)) return;

        const img = new Image();
        img.src = imgSrc;

        img.onload = () => {
            let size = customizeSize(img.width, img.height, imgWidth, imgHeight);
            size = restrictSize(size.w, size.h);

            const parser = new Parser();
            const htmlParser = new HtmlParser(targetBlock.uuid, uiid, settings.strokesWidth, settings.strokesOutline, size.w, size.h);
            const datas = parser.toDatas(targetBlock.content);

            if (datas.error){
                if (datas.error === "no data"){
                    const data = defaultData(targetBlock.content);
                    logseq.Editor.updateBlock(targetBlock.uuid, parser.toBlockContent(data));
                }
                if (datas.error === "invalid data"){
                    logseq.App.showMsg('Error! invalid data!');
                }
                return;
            }

            logseq.provideUI({
                key: uiid,
                slot,
                reset: true,
                template:             
                `<div class="lpa-area-container">
                <img class="canvas-image-${uiid}" src="${imgSrc}" data-on-click="cancelSelect" data-area-block="${targetBlock.uuid}">
                <button class="edit-${uiid}" type="button" data-on-click="openEdit" data-area-block="${targetBlock.uuid}" data-imgsrc="${imgSrc}">
                    <img src="${edit_icon_data}" alt="edit">
                </button>
                <button class="visible-${uiid}" type="button" data-on-click="toggleVisiblity" data-area-block="${targetBlock.uuid}">
                    <img src="${datas.visiblity ? visible_icon_data : invisible_icon_data}" alt="visible">
                </button>
                ${htmlParser.toSvgElements(datas.areas)}
                </div>`
            });

            let methods = {
                toggleVisiblity(_triggerInfo)
                {
                    logseq.Editor.getBlock(_triggerInfo.dataset.areaBlock).then((bl)=>{
                        logseq.Editor.updateBlock(bl.uuid, parser.toggleVisible(bl.content));
                    });
                },
                openEdit(_triggerInfo)
                {
                    logseq.Editor.getBlock(_triggerInfo.dataset.areaBlock).then((bl)=>{
                        const blockDatas = parser.toDatas(bl.content);
                        const imgSrc = _triggerInfo.dataset.imgsrc;
                        openEditWindow({uuid: bl.uuid}, blockDatas.userContent, imgSrc, blockDatas.areas);
                    });
                },
                selectArea(_triggerInfo)
                {
                    const areaName = _triggerInfo.id.split("-")[1];
                    const selected = `${_triggerInfo.id.split("-")[0]}-${areaName}`;
                    
                    logseq.DB.datascriptQuery(queryForPageProperty(areaName)).then(result => {
                        if (result.length >= 1){
                            logseq.App.pushState('page', {
                                name: result[0][0].name
                            });
                            return;
                        }
                        logseq.Editor.getBlock(_triggerInfo.dataset.areaBlock, {includeChildren: true}).then((bl)=>{
                            logseq.Editor.updateBlock(bl.uuid, parser.changeSelect(bl.content, selected));
                            logseq.DB.datascriptQuery(queryForProperty(areaName)).then((result)=>{
                                let desc = "#Area-Description\n";
                                for (let i = 0; i < result.length; i++){
                                    desc += `{{embed ((${result[i][0].uuid.$uuid$}))}}\n`;
                                }
                                
                                let descIndex = bl.children.map(a => a.content).findIndex(a => a.includes("#Area-Description"));
                                                        
                                if (descIndex !== -1) logseq.Editor.updateBlock(bl.children[descIndex].uuid, desc);
                                else logseq.Editor.insertBatchBlock(bl.uuid, {content: desc});
                            });
                        });
                    });
                },
                cancelSelect(_triggerInfo)
                {
                    logseq.Editor.getBlock(_triggerInfo.dataset.areaBlock, {includeChildren: true}).then((bl)=>{
                        logseq.Editor.updateBlock(bl.uuid, parser.changeSelect(bl.content, ""));
                        const children = bl.children;
                        for (let i = 0; i < children.length; i++){
                            if (children[i].content.includes("#Area-Description")){
                                logseq.Editor.removeBlock(children[i].uuid);
                            }
                        }
                    });
                }
            };

            logseq.provideModel(methods);
            logseq.provideStyle({key:uiid, style:css(uiid, settings.strokesWidth, settings.strokesOutline, size.w, size.h, datas.visiblity, datas.selected)});
        }

        img.onerror = () => {
            logseq.App.showMsg("ERROR! invalid image!");
        }
    }

    const openEditWindow = (e, content, imgStr, areaDatas) => {
        loadInfo(e.uuid, content, imgStr, areaDatas, settings);
        loadElements();
        draw();
        logseq.showMainUI();
    }
    
    logseq.App.onMacroRendererSlotted(({ slot, payload }) => 
        logseq.Editor.getBlock(payload.uuid).then(bl => {
            renderInBlock(slot, payload.arguments, bl);
        })
    ); 

    logseq.Editor.registerBlockContextMenuItem("Picture To Areas", (e) => {
        logseq.App.getCurrentGraph().then((graph) => {
            logseq.Editor.getBlock(e.uuid).then(bl => replaceWithAreas(bl.uuid, bl.content, graph.path));
        });
    });
}
logseq.ready().then(main).catch(console.error)