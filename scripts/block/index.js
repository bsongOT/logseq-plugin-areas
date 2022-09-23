logseq.useSettingsSchema(defaultSettings);

function main () {
    let settings = {
        strokesWidth: Math.max(1, Math.min(Number(logseq.settings.strokesWidth), 10)),
        strokesOutline: Math.max(1, Math.min(Number(logseq.settings.strokesOutline), 5)),
        controlPointRadius: Math.max(0, Math.min(Number(logseq.settings.controlPointRadius), 10)),
        scrollDirection: logseq.settings.scrollDirection === "↑" ? 1 : -1
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
                key: uiid + slot.slice(5), //for case: block is open simultaneously on the sidebar and body.
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
                async selectArea(_triggerInfo)
                {
                    console.log(_triggerInfo);
                    const areaName = await _triggerInfo.id.split("-")[1];
                    const selected = `${_triggerInfo.id.split("-")[0]}-${areaName}`;
                    const selBlock = await logseq.Editor.getBlock(_triggerInfo.dataset.areaBlock);

                    logseq.Editor.updateBlock(selBlock.uuid, parser.changeSelect(selBlock.content, selected));
                    //for :area-page
                    const pages = await logseq.DB.datascriptQuery(queryForPageProperty(areaName));
                    if (pages.length >= 1){
                        return await logseq.App.pushState('page', {name: pages[0][0].name});
                    }

                    //for :area-block
                    const blocks = await logseq.DB.datascriptQuery(queryForProperty(areaName));
                    if(blocks.length >= 1){
                        return await logseq.Editor.scrollToBlockInPage(
                            (await logseq.Editor.getPage(blocks[0][0].page.id)).originalName,
                            blocks[0][0].uuid
                        );
                    }
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
        settings = {
            strokesWidth: Math.max(1, Math.min(Number(logseq.settings.strokesWidth), 10)),
            strokesOutline: Math.max(1, Math.min(Number(logseq.settings.strokesOutline), 5)),
            controlPointRadius: Math.max(0, Math.min(Number(logseq.settings.controlPointRadius), 10)),
            scrollDirection: logseq.settings.scrollDirection === "↑" ? 1 : -1
        };
        prepareEditor(e.uuid, content, imgStr, areaDatas, settings);
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