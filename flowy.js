window.flowy = {
    /**
     * init all the shit
     * @param canvas
     * @param grab
     * @param release
     * @param snapping
     * @param rearrange
     * @param spacing_x
     * @param spacing_y
     */
    init: function (canvas, grab, release, snapping, rearrange, spacing_x = 20, spacing_y = 80) {
        this.canvas = canvas;
        this.grab = grab;
        this.release = release;
        this.snapping = snapping;
        this.rearrange = rearrange;
        this.spacing_x = spacing_x;
        this.spacing_y = spacing_y;

        /**
         * init some functions
         */
        this.initVariables();
        this.creatIndicator();
        this.addEventListener();
        /**
         * test function must be disable in productiob
         */
        this.mouseCoordinates();
    },

    /**
     * variables are set here
     */
    initVariables: function () {
        /**
         * store block informations
         * flowy variable
         * @type {*[]}
         */
        this.blocks = [];
        /**
         * absolute left and top pixel
         * flowy variable
         * @type {number}
         */
        this.absx = this.absy = 0;
        /**
         * flowy variable
         * @type {boolean}
         */
        this.active = false;
        /**
         * block element
         * flowy variable
         * @type {null}
         */
        this.drag = this.original = null;
        /**
         * block x,y
         * flowy variable
         * @type {number}
         */
        this.dragx = this.dragy = 0;
        /**
         * mouse event x,y
         * flowy variable
         * @type {number}
         */
        this.mouse_x = this.mouse_y = 0;
        /**
         * canvas scale default 1
         * new variable by cdebattista
         * @type {number}
         */
        this.zoom = 1;
        /**
         * use to stop mouse move event
         * new variable by cdebattista
         * @type {boolean}
         */
        this.mouseIsDown = false;
        /**
         * use to get the x and y on the left click mouse
         * new variable by cdebattista
         * @type {number}
         */
        this.mouseStartX = this.mouseStartY = 0;
        /**
         * use to get the x and y when the mouse down or when this.mouseIsDown = true
         * new variable by cdebattista
         * @type {number}
         */
        this.mouseX = this.mouseY = 0;
    },

    /**
     * insert indicator element to the canvas DOM
     */
    creatIndicator: function () {
        const el = document.createElement("div");
        el.classList.add('indicator');
        el.classList.add('invisible');
        this.canvas.appendChild(el);
    },

    /**
     * set global variable
     * left and top pixel
     */
    absxy: function () {
        if (window.getComputedStyle(this.canvas).position == "absolute" || window.getComputedStyle(this.canvas).position == "fixed") {
            this.absx = this.canvas.getBoundingClientRect().left;
            this.absy = this.canvas.getBoundingClientRect().top;
        }
    },

    /**
     * addEventListener
     */
    addEventListener: function () {
        document.addEventListener('mousedown', this.beginDrag.bind(this));
        document.addEventListener('touchstart', this.beginDrag.bind(this));

        document.addEventListener("mousemove", this.moveBlock.bind(this), false);
        document.addEventListener("touchmove", this.moveBlock.bind(this), false);

        document.addEventListener("mouseup", this.endDrag.bind(this), false);
        document.addEventListener("touchend", this.endDrag.bind(this), false);

        document.addEventListener("mousedown", this.mousedown.bind(this), false);
        document.addEventListener("mousemove", this.mousemove.bind(this), false);
        document.addEventListener("mouseup", this.mouseup.bind(this), false);
        document.addEventListener("mouseout", this.mouseout.bind(this), false);
    },

    /**
     * get a new block id
     * @returns {number}
     */
    getNewBlockId: function () {
        if (this.blocks.length === 0) {
            return 0;
        }
        return parseInt(Math.max.apply(Math, this.blocks.map(a => a.id))) + 1;
    },

    /**
     * get current block id
     * @returns {number}
     */
    getDragBlockId: function () {
        return parseInt(this.drag.querySelector(".blockid").value);
    },

    /**
     * get x coordinate
     * @returns {number}
     */
    getX: function () {
        return (this.drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(this.drag).width) / 2) + this.canvas.scrollLeft - this.canvas.getBoundingClientRect().left;
    },

    /**
     * get y coordinate
     * @returns {number}
     */
    getY: function () {
        return (this.drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(this.drag).height) / 2) + this.canvas.scrollTop - this.canvas.getBoundingClientRect().top;
    },

    /**
     * check if the block currently dragged is touching anothers blocks indicator
     * @param id
     * @returns {boolean|boolean}
     */
    checkAttach: function (id) {
        const xpos = (this.drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(this.drag).width) * this.zoom / 2) + this.canvas.scrollLeft - this.canvas.getBoundingClientRect().left;
        const ypos = (this.drag.getBoundingClientRect().top + window.scrollY) + this.canvas.scrollTop - this.canvas.getBoundingClientRect().top;
        const block = this.blocks.filter(a => a.id === id)[0];
        return xpos >= block.x - (block.width * this.zoom / 2) - (this.spacing_x * this.zoom)
            && xpos <= block.x + (block.width * this.zoom / 2) + (this.spacing_x * this.zoom)
            && ypos >= block.y - (block.height * this.zoom / 2)
            && ypos <= block.y + (block.height * this.zoom / 2);
    },

    /**
     * Zoom on the canvas
     * @param value
     * @param restore
     */
    zoomCanvas: function (value = 0, restore = false) {
        this.zoom += value;
        if (this.zoom < 0.4) {
            this.zoom = 0.4;
            return;
        }
        if (this.zoom > 1 || restore) {
            this.zoom = 1;
        }
        this.canvas.style.transform = "scale(" + this.zoom + ")";
        this.canvas.style.transformOrigin = "top left";
        this.canvas.style.width = "calc(" + 100 / this.zoom + "% - 0px)";
        this.canvas.style.height = "calc(" + 100 / this.zoom + "% - 98px)";
        /**
         * we need a timeout cause of transition
         * transition: all 1s ease 0s;
         * timeout should be equal to the transition duration
         * remove setTimeout if you don't use transition
         */
        setTimeout(function () {
            if (this.blocks.length) {
                this.blocks.forEach(function (block) {
                    const node = document.querySelector(".blockid[value='" + block.id + "']").parentNode;
                    block.x = parseInt((node.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(node).width) * this.zoom / 2) + this.canvas.scrollLeft - this.canvas.getBoundingClientRect().left);
                    block.y = parseInt((node.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(node).height) * this.zoom / 2) + this.canvas.scrollTop - this.canvas.getBoundingClientRect().top);
                }.bind(this));
            }
            this.canvas.style.cursor = '';
        }.bind(this), 1000);
    },

    /**
     * use for panning inside the canvas
     * @param event
     */
    mousedown: function (event) {
        if (this.hasParentClass(event.target, "block")) {
            this.mouseIsDown = false;
        } else {
            event.preventDefault();
            event.stopPropagation();
            this.mouseStartX = event.clientX;
            this.mouseStartY = event.clientY;
            this.canvas.style.cursor = 'grabbing';
            this.mouseIsDown = true;
        }
    },
    /**
     * use for panning inside the canvas
     * @param event
     */
    mouseup: function (event) {
        event.preventDefault();
        event.stopPropagation();
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
        this.canvas.style.cursor = '';
        this.mouseIsDown = false;
    },
    /**
     * use for panning inside the canvas
     * @param event
     */
    mouseout: function (event) {
        event.preventDefault();
        event.stopPropagation();
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
        this.canvas.style.cursor = '';
        this.mouseIsDown = false;
    },
    /**
     * use for panning inside the canvas
     * @param event
     */
    mousemove: function (event) {
        if (!this.mouseIsDown) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
        let dx = this.mouseX - this.mouseStartX;
        let dy = this.mouseY - this.mouseStartY;
        this.mouseStartX = this.mouseX;
        this.mouseStartY = this.mouseY;

        if (this.canvas.childNodes.length) {
            this.canvas.childNodes.forEach(function (node) {
                if (node.className.indexOf("indicator") === -1) {
                    let left = parseInt(window.getComputedStyle(node).left);
                    let top = parseInt(window.getComputedStyle(node).top);

                    let newLeft = left + parseInt(dx / this.zoom);
                    let newTop = top + parseInt(dy / this.zoom);

                    node.style.left = newLeft + "px";
                    node.style.top = newTop + "px";

                    if (node.className.indexOf("arrowblock") === -1) {
                        let id = parseInt(node.querySelector(".blockid").value);
                        let block = this.blocks.filter(a => a.id === id)[0];
                        block.x = parseInt((parseInt(window.getComputedStyle(node).left) * this.zoom)) + (block.width * this.zoom / 2);
                        block.y = parseInt((parseInt(window.getComputedStyle(node).top) * this.zoom)) + (block.height * this.zoom / 2);
                    }
                }
            }.bind(this));
        }
    },

    /**
     * click on block from the left
     * @param event
     */
    beginDrag: function (event) {
        this.absxy();
        if (event.targetTouches) {
            this.mouse_x = event.changedTouches[0].clientX;
            this.mouse_y = event.changedTouches[0].clientY;
        } else {
            this.mouse_x = event.clientX;
            this.mouse_y = event.clientY;
        }
        if (event.which !== 3 && event.target.closest(".create-flowy")) {
            this.original = event.target.closest(".create-flowy");
            let newNode = event.target.closest(".create-flowy").cloneNode(true);
            event.target.closest(".create-flowy").classList.add("dragnow");
            newNode.classList.add("block");
            newNode.classList.remove("create-flowy");
            newNode.innerHTML += "<input type='hidden' name='blockid' class='blockid' value='" + this.getNewBlockId() + "'>";
            document.body.appendChild(newNode);
            this.drag = document.querySelector(".blockid[value='" + this.getNewBlockId() + "']").parentNode;
            this.grab(event.target.closest(".create-flowy"));
            this.drag.classList.add("dragging");
            this.drag.style.transform = "scale(" + this.zoom + ")";
            this.active = true;
            this.dragx = this.mouse_x - (event.target.closest(".create-flowy").getBoundingClientRect().left);
            this.dragy = this.mouse_y - (event.target.closest(".create-flowy").getBoundingClientRect().top);
            this.drag.style.left = this.mouse_x - this.dragx + "px";
            this.drag.style.top = this.mouse_y - this.dragy + "px";
        }
    },

    /**
     * moving the block grabbed in beginDrag
     * @param event
     */
    moveBlock: function (event) {
        /**
         * compute x,y
         */
        if (event.targetTouches) {
            this.mouse_x = event.targetTouches[0].clientX;
            this.mouse_y = event.targetTouches[0].clientY;
        } else {
            this.mouse_x = event.clientX;
            this.mouse_y = event.clientY;
        }

        /**
         * compute left and top
         */
        if (this.active) {
            this.drag.style.left = this.mouse_x - this.dragx + "px";
            this.drag.style.top = this.mouse_y - this.dragy + "px";
        }

        /**
         * add scroll to the canvas
         * not working on this version cause we don't need
         */
        if (this.active) {
            if (this.mouse_x > this.canvas.getBoundingClientRect().width + this.canvas.getBoundingClientRect().left - 10 && this.mouse_x < this.canvas.getBoundingClientRect().width + this.canvas.getBoundingClientRect().left + 10) {
                this.canvas.scrollLeft += 10;
            } else if (this.mouse_x < this.canvas.getBoundingClientRect().left + 10 && this.mouse_x > this.canvas.getBoundingClientRect().left - 10) {
                this.canvas.scrollLeft -= 10;
            } else if (this.mouse_y > this.canvas.getBoundingClientRect().height + this.canvas.getBoundingClientRect().top - 10 && this.mouse_y < this.canvas.getBoundingClientRect().height + this.canvas.getBoundingClientRect().top + 10) {
                this.canvas.scrollTop += 10;
            } else if (this.mouse_y < this.canvas.getBoundingClientRect().top + 10 && this.mouse_y > this.canvas.getBoundingClientRect().top - 10) {
                this.canvas.scrollLeft -= 10;
            }

            /**
             * check if we colid with another block and show indicator
             * @type {*[]}
             */
            const blocko = this.blocks.map(a => a.id);
            for (let i = 0; i < this.blocks.length; i++) {
                if (this.checkAttach(blocko[i])) {
                    const indicator = document.querySelector(".indicator");
                    document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode.appendChild(indicator);
                    document.querySelector(".indicator").style.left = (document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode.offsetWidth / 2) - (parseInt(window.getComputedStyle(indicator).width) / 2) + "px";
                    document.querySelector(".indicator").style.top = document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode.offsetHeight + "px";
                    document.querySelector(".indicator").classList.remove("invisible");
                    break;
                } else if (i === this.blocks.length - 1) {
                    if (!document.querySelector(".indicator").classList.contains("invisible")) {
                        document.querySelector(".indicator").classList.add("invisible");
                    }
                }
            }
        }
    },

    /**
     * drop the block on the canvas
     * @param event
     */
    endDrag: function (event) {
        if (event.which !== 3 && (this.active)) {
            this.release();
            if (!document.querySelector(".indicator").classList.contains("invisible")) {
                document.querySelector(".indicator").classList.add("invisible");
            }

            if (this.active) {
                this.original.classList.remove("dragnow");
                this.drag.classList.remove("dragging");
            }

            /**
             * drop the first block if we are inside the canvas
             */
            if (
                this.active
                && this.blocks.length === 0
                && (this.drag.getBoundingClientRect().top + window.scrollY) > (this.canvas.getBoundingClientRect().top + window.scrollY)
                && (this.drag.getBoundingClientRect().left + window.scrollX) > (this.canvas.getBoundingClientRect().left + window.scrollX)
            ) {
                this.firstBlock();
            } else if (this.active && this.blocks.length == 0) {
                this.removeSelection();
            } else if (this.active) {
                const blocko = this.blocks.map(a => a.id);
                for (let i = 0; i < this.blocks.length; i++) {
                    /**
                     * attach the block if we colid with another block
                     */

                    if (this.checkAttach(blocko[i])) {
                        this.active = false;
                        /**
                         * snapping is a callback
                         * so we can false it to remove a dragging block we don't need
                         * like block incompatible each other.
                         */
                        if (this.snapping(this.drag, false, document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode)) {
                            this.snap(this.drag, i, blocko);
                        } else {
                            this.active = false;
                            this.removeSelection();
                        }
                        break;
                    } else if (i === this.blocks.length - 1) {
                        /**
                         * drop the block without attachement
                         * remove it
                         * @type {boolean}
                         */
                        this.active = false;
                        this.removeSelection();
                    }
                }
            }
        }
    },

    /**
     * compute first block
     * left, top
     * blocks informations
     * @param type
     */
    firstBlock: function () {
        /**
         * callback snapping
         */
        if (this.snapping(this.drag, true, undefined)) {
            this.active = false;

            /**
             * get x, y
             */
            const x = this.getX();
            const y = this.getY();

            /**
             * apply left and top
             * @type {string}
             */
            this.drag.style.left = (x / this.zoom) - (parseInt(window.getComputedStyle(this.drag).width) / 2) + "px";
            this.drag.style.top = (y / this.zoom) - (parseInt(window.getComputedStyle(this.drag).height) / 2) + "px";

            /**
             * insert in DOM
             */
            this.canvas.appendChild(this.drag);

            /**
             * write block informations
             */
            this.blocks.push({
                parent: -1,
                childwidth: 0,
                id: this.getDragBlockId(),
                x: x,
                y: y,
                width: parseInt(window.getComputedStyle(this.drag).width),
                height: parseInt(window.getComputedStyle(this.drag).height)
            });
        } else {
            this.active = false;
            this.removeSelection();
        }
    },

    /**
     * compute other blocks
     * @param drag
     * @param i
     * @param blocko
     */
    snap: function (drag, i, blocko) {
        this.canvas.appendChild(drag);
        let parent_id = blocko[i];
        let children_block = this.blocks.filter(id => id.parent === parent_id);
        let parent_block = this.blocks.filter(id => id.id === parent_id);
        let children;
        let w;
        let totalwidth = 0;
        let totalremove = 0;
        /**
         * compute children
         */
        for (w = 0; w < children_block.length; w++) {
            children = children_block[w];
            if (children.childwidth > children.width) {
                totalwidth += children.childwidth + this.spacing_x;
            } else {
                totalwidth += children.width + this.spacing_x;
            }
        }
        totalwidth += parseInt(window.getComputedStyle(this.drag).width);
        /**
         * compute children
         * recomputing x
         * recomputing left
         * we don't need to recompute top and y cause blocks are aligned on the same line
         */
        for (w = 0; w < children_block.length; w++) {
            children = children_block[w];
            if (children.childwidth > children.width) {
                document.querySelector(".blockid[value='" + children.id + "']").parentNode.style.left = (parent_block[0].x / this.zoom) - (totalwidth / 2) + totalremove + (children.childwidth / 2) - (children.width / 2) + "px";
                children.x = (parent_block[0].x) - (totalwidth * this.zoom / 2) + (totalremove * this.zoom) + (children.childwidth * this.zoom / 2);
                totalremove += children.childwidth + this.spacing_x;
            } else {
                document.querySelector(".blockid[value='" + children.id + "']").parentNode.style.left = (parent_block[0].x / this.zoom) - (totalwidth / 2) + totalremove + "px";
                children.x = (parent_block[0].x) - (totalwidth * this.zoom / 2) + (totalremove * this.zoom) + (parseInt(window.getComputedStyle(this.drag).width) * this.zoom / 2);
                totalremove += children.width + this.spacing_x;
            }
        }

        /**
         * apply left and top
         * @type {string}
         */
        drag.style.left = (parent_block[0].x / this.zoom) - ((totalwidth) / 2) + totalremove - (window.scrollX + this.absx) + this.canvas.scrollLeft + this.canvas.getBoundingClientRect().left + "px";
        drag.style.top = ((parent_block[0].y / this.zoom) + ((parent_block[0].height) / 2) + this.spacing_y - (window.scrollY + this.absy) + this.canvas.getBoundingClientRect().top) + "px";
        drag.style.transform = null;
        /**
         * write blocks informations
         */
        this.blocks.push({
            childwidth: 0,
            parent: parent_id,
            id: this.getDragBlockId(),
            x: parent_block[0].x,
            y: parent_block[0].y + ((parent_block[0].height * this.zoom) / 2) + (this.spacing_y * this.zoom) + (parseInt(window.getComputedStyle(drag).height) * this.zoom / 2),
            width: parseInt(window.getComputedStyle(drag).width),
            height: parseInt(window.getComputedStyle(drag).height)
        });

        /**
         * draw arrow
         */
        const arrowblock = this.blocks.filter(a => a.id === this.getDragBlockId())[0];
        const arrowx = arrowblock.x - parent_block[0].x + 20;
        const arrowy = this.spacing_y;
        this.drawArrow(arrowblock, arrowx, arrowy, parent_block);

        /**
         * TODO what's for ?
         */
        if (this.blocks.filter(a => a.id === parent_id)[0].parent !== -1) {
            var flag = false;
            var idval = parent_id;
            while (!flag) {
                if (this.blocks.filter(a => a.id === idval)[0].parent === -1) {
                    flag = true;
                } else {
                    var zwidth = 0;
                    for (w = 0; w < this.blocks.filter(id => id.parent === idval).length; w++) {
                        children = this.blocks.filter(id => id.parent === idval)[w];
                        if (children.childwidth > children.width) {
                            if (w === this.blocks.filter(id => id.parent === idval).length - 1) {
                                zwidth += children.childwidth;
                            } else {
                                zwidth += children.childwidth + this.spacing_x;
                            }
                        } else {
                            if (w === this.blocks.filter(id => id.parent === idval).length - 1) {
                                zwidth += children.width;
                            } else {
                                zwidth += children.width + this.spacing_x;
                            }
                        }
                    }
                    this.blocks.filter(a => a.id === idval)[0].childwidth = zwidth;
                    idval = this.blocks.filter(a => a.id === idval)[0].parent;
                }
            }
            this.blocks.filter(id => id.id === idval)[0].childwidth = totalwidth;
        }
        /**
         * was used for recomputing all blocks
         * but now that snap is working correctly
         * it's needed to recomputing the first block
         * but why not to check all :)
         * also it's needed to redraw arrows correctly
         */
        this.rearrangeMe();
    },

    /**
     * magic function
     * do the same as snap function but for all blocks
     */
    rearrangeMe: function () {
        let children;
        const result = this.blocks.map(a => a.parent);
        for (let z = 0; z < result.length; z++) {
            let w;
            if (result[z] === -1) {
                z++;
            }
            const blocks_parent = this.blocks.filter(id => id.parent === result[z]);
            let totalwidth = 0;
            let totalremove = 0;
            for (w = 0; w < blocks_parent.length; w++) {
                children = blocks_parent[w];
                if (this.blocks.filter(id => id.parent === children.id).length === 0) {
                    children.childwidth = 0;
                }
                if (children.childwidth > children.width) {
                    if (w === blocks_parent.length - 1) {
                        totalwidth += children.childwidth;
                    } else {
                        totalwidth += children.childwidth + this.spacing_x;
                    }
                } else {
                    if (w === blocks_parent.length - 1) {
                        totalwidth += children.width;
                    } else {
                        totalwidth += children.width + this.spacing_x;
                    }
                }
            }
            if (result[z] !== -1) {
                this.blocks.filter(a => a.id === result[z])[0].childwidth = totalwidth;
            }
            for (w = 0; w < blocks_parent.length; w++) {
                children = blocks_parent[w];
                const r_block = document.querySelector(".blockid[value='" + children.id + "']").parentNode;
                const r_array = this.blocks.filter(id => id.id === result[z]);
                r_block.style.top = (r_array[0].y / this.zoom) + ((r_array[0].height) / 2) + this.spacing_y + this.canvas.getBoundingClientRect().top - this.absy + "px";
                if (children.childwidth > children.width) {
                    r_block.style.left = (r_array[0].x / this.zoom) - (totalwidth / 2) + totalremove + (children.childwidth / 2) - (children.width / 2) - (this.absx + window.scrollX) + this.canvas.getBoundingClientRect().left + "px";
                    children.x = r_array[0].x - (totalwidth * this.zoom / 2) + (totalremove * this.zoom) + (children.childwidth * this.zoom / 2);
                    totalremove += children.childwidth + this.spacing_x;
                } else {
                    r_block.style.left = (r_array[0].x / this.zoom) - (totalwidth / 2) + totalremove - (this.absx + window.scrollX) + this.canvas.getBoundingClientRect().left + "px";
                    children.x = r_array[0].x - (totalwidth * this.zoom / 2) + (totalremove * this.zoom) + (children.width * this.zoom / 2);
                    totalremove += children.width + this.spacing_x;
                }
                const arrowblock = this.blocks.filter(a => a.id === children.id)[0];
                const arrowx = arrowblock.x - this.blocks.filter(a => a.id === children.parent)[0].x + 20;
                const arrowy = this.spacing_y;
                this.updateArrow(arrowblock, arrowx, arrowy, children);
            }
        }
    },

    /**
     * delete one block by id
     * @param id
     * @returns {number}
     */
    deleteBlock: function (id) {
        let newParentId;

        if (!Number.isInteger(id)) {
            id = parseInt(id);
        }

        for (let i = 0; i < this.blocks.length; i++) {
            if (this.blocks[i].id === id) {
                newParentId = this.blocks[i].parent;
                this.canvas.appendChild(document.querySelector(".indicator"));
                this.removeBlockEls(this.blocks[i].id);
                this.blocks.splice(i, 1);
                this.modifyChildBlocks(id);
                break;
            }
        }

        if (this.blocks.length > 1) {
            this.rearrangeMe();
        }

        return Math.max.apply(
            Math,
            this.blocks.map((a) => a.id)
        );
    },

    /**
     * use for delete block by id
     * @param parentId
     */
    modifyChildBlocks: function (parentId) {
        let i;
        let children = [];
        let blocko = this.blocks.map((a) => a.id);
        for (i = blocko.length - 1; i >= 0; i--) {
            let currentBlock = this.blocks.filter((a) => a.id == blocko[i])[0];
            if (currentBlock.parent === parentId) {
                children.push(currentBlock.id);
                this.removeBlockEls(currentBlock.id);
                this.blocks.splice(i, 1);
            }
        }

        for (i = 0; i < children.length; i++) {
            this.modifyChildBlocks(children[i]);
        }
    },

    /**
     * use for delete block by id
     * @param id
     */
    removeBlockEls: function (id) {
        document.querySelector(".blockid[value='" + id + "']").parentNode.remove();
        if (document.querySelector(".arrowid[value='" + id + "']")) {
            document.querySelector(".arrowid[value='" + id + "']").parentNode.remove();
        }
    },

    /**
     * remove the block when  we don't need
     */
    removeSelection: function () {
        this.canvas.appendChild(document.querySelector(".indicator"));
        this.drag.parentNode.removeChild(this.drag);
    },

    /**
     * check if a element has a parent with a specific class
     * recursivly
     * @param element
     * @param classname
     * @returns {*|boolean}
     */
    hasParentClass: function (element, classname) {
        if (typeof element.className === "string") {
            if (element.className.split(' ').indexOf(classname) >= 0) return true;
        }
        return element.parentNode && this.hasParentClass(element.parentNode, classname);
    },

    /**
     * draw a arrow
     * @param arrow
     * @param x
     * @param y
     * @param parent_block
     */
    drawArrow: function (arrow, x, y, parent_block) {
        x /= this.zoom;
        let twenty = 20;
        twenty /= this.zoom;
        if (x < 0) {
            this.canvas.innerHTML += '<div class="arrowblock"><input type="hidden" class="arrowid" value="' + this.getDragBlockId() + '">' +
                '<svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="' +
                'M ' + ((parent_block[0].x / this.zoom) - (arrow.x / this.zoom) + (5 / this.zoom)) + ',0' +
                'S ' + ((parent_block[0].x / this.zoom) - (arrow.x / this.zoom) + (5 / this.zoom)) + ',' + (y / 2) + ' ' + (((parent_block[0].x / this.zoom) - (arrow.x / this.zoom) + (5 / this.zoom)) - (y / 2)) + ',' + (y / 2) +
                'L ' + (((parent_block[0].x / this.zoom) - (arrow.x / this.zoom) + (5 / this.zoom)) - (y / 2)) + ',' + (y / 2) +
                'L ' + (5 + (y / 2)) + ',' + (y / 2) +
                'S ' + (5) + ',' + (y / 2) + ' 5,' + y +
                'L 5,' + y + '" stroke="#00c1d4" stroke-width="1px"/></svg></div>';
            document.querySelector('.arrowid[value="' + this.getDragBlockId() + '"]').parentNode.style.left = ((arrow.x / this.zoom) - 5) - (this.absx + window.scrollX) + this.canvas.scrollLeft + this.canvas.getBoundingClientRect().left + "px";
        } else if (x === 20 / this.zoom) {
            /**
             * draw the straight arrow
             * @type {string}
             */
            this.canvas.innerHTML += '<div class="arrowblock"><input type="hidden" class="arrowid" value="' + this.getDragBlockId() + '">' +
                '<svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="' +
                '' + 'M ' + twenty + ',0' +
                'L ' + twenty + ',' + y + '" stroke="#00c1d4" stroke-width="1px"/></svg>';
            document.querySelector('.arrowid[value="' + this.getDragBlockId() + '"]').parentNode.style.left = (parent_block[0].x / this.zoom) - 20 - (this.absx + window.scrollX) + this.canvas.scrollLeft + this.canvas.getBoundingClientRect().left + "px";
        } else {
            this.canvas.innerHTML += '<div class="arrowblock"><input type="hidden" class="arrowid" value="' + this.getDragBlockId() + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                '<path d="' +
                'M ' + twenty + ',0' +
                'S ' + twenty + ',' + (y / 2) + ' ' + (twenty + (y / 2)) + ',' + (y / 2) +
                'L ' + (twenty + (y / 2)) + ',' + (y / 2) +
                'L ' + (x - (y / 2)) + ',' + (y / 2) +
                'S ' + x + ',' + (y / 2) + ' ' + x + ',' + y +
                'L ' + x + ',' + y + '" stroke="#00c1d4" stroke-width="1px"/></svg></div>';
            document.querySelector('.arrowid[value="' + this.getDragBlockId() + '"]').parentNode.style.left = (parent_block[0].x / this.zoom) - 20 - (this.absx + window.scrollX) + this.canvas.scrollLeft + this.canvas.getBoundingClientRect().left + "px";
        }
        document.querySelector('.arrowid[value="' + this.getDragBlockId() + '"]').parentNode.style.top = (parent_block[0].y / this.zoom) + (parent_block[0].height / 2) + this.canvas.getBoundingClientRect().top - this.absy + "px";
    },

    /**
     * update arrow
     * @param arrow
     * @param x
     * @param y
     * @param children
     */
    updateArrow: function (arrow, x, y, children) {
        const block_parent = this.blocks.filter(id => id.id == children.parent);
        let five = 5;
        let twenty = 20;
        five /= this.zoom;
        twenty /= this.zoom;
        x /= this.zoom;
        if (x < 0) {
            document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.style.left = ((arrow.x / this.zoom) - five) - (this.absx + window.scrollX) + this.canvas.getBoundingClientRect().left + "px";
            document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.innerHTML = '<input type="hidden" class="arrowid" value="' + children.id + '">' +
                '<svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="' +
                'M ' + ((block_parent[0].x / this.zoom) - (arrow.x / this.zoom) + (5 / this.zoom)) + ',0' +
                'S ' + ((block_parent[0].x / this.zoom) - (arrow.x / this.zoom) + (5 / this.zoom)) + ',' + (y / 2) + ' ' + (((block_parent[0].x / this.zoom) - (arrow.x / this.zoom) + (5 / this.zoom)) - (y / 2)) + ',' + (y / 2) +
                'L ' + (((block_parent[0].x / this.zoom) - (arrow.x / this.zoom) + (5 / this.zoom)) - (y / 2)) + ',' + (y / 2) +
                'L ' + (5 + (y / 2)) + ',' + (y / 2) +
                'S ' + (5) + ',' + (y / 2) + ' 5,' + y +
                'L 5,' + y + '" stroke="#00c1d4" stroke-width="1px"/></svg>';
        } else if (x === 20 / this.zoom) {
            /**
             * redraw the straight arrow
             * @type {string}
             */
            document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.style.left = (block_parent[0].x / this.zoom) - twenty - (this.absx + window.scrollX) + this.canvas.getBoundingClientRect().left + "px";
            document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.innerHTML = '<input type="hidden" class="arrowid" value="' + children.id + '">' +
                '<svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="' +
                '' + 'M ' + twenty + ',0' +
                'L ' + twenty + ',' + y + '" stroke="#00c1d4" stroke-width="1px"/></svg>';
        } else {
            document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.style.left = (block_parent[0].x / this.zoom) - twenty - (this.absx + window.scrollX) + this.canvas.getBoundingClientRect().left + "px";
            document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.innerHTML = '<input type="hidden" class="arrowid" value="' + children.id + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                '<path d="' +
                'M ' + twenty + ',0' +
                'S ' + twenty + ',' + (y / 2) + ' ' + (twenty + (y / 2)) + ',' + (y / 2) +
                'L ' + (twenty + (y / 2)) + ',' + (y / 2) +
                'L ' + (x - (y / 2)) + ',' + (y / 2) +
                'S ' + x + ',' + (y / 2) + ' ' + x + ',' + y +
                'L ' + x + ',' + y + '" stroke="#00c1d4" stroke-width="1px"/></svg>';
        }
    },
    /**
     *
     * @param output
     */
    import: function (output) {
        this.canvas.innerHTML = output.html;
        for (let a = 0; a < output.blockarr.length; a++) {
            this.blocks.push({
                childwidth: parseFloat(output.blockarr[a].childwidth),
                parent: parseFloat(output.blockarr[a].parent),
                id: parseFloat(output.blockarr[a].id),
                x: parseFloat(output.blockarr[a].x),
                y: parseFloat(output.blockarr[a].y),
                width: parseFloat(output.blockarr[a].width),
                height: parseFloat(output.blockarr[a].height)
            })
        }
    },

    /**
     * return all information in json
     * @returns {{blocks: [], blockarr: [], html: *}}
     */
    output: function () {
        const html_ser = this.canvas.innerHTML;
        const json_data = {html: html_ser, blockarr: this.blocks, blocks: []};
        if (this.blocks.length > 0) {
            for (let i = 0; i < this.blocks.length; i++) {
                json_data.blocks.push({
                    id: this.blocks[i].id,
                    parent: this.blocks[i].parent,
                    data: [],
                    attr: []
                });
                const blockParent = document.querySelector(".blockid[value='" + this.blocks[i].id + "']").parentNode;
                blockParent.querySelectorAll("input").forEach(function (block) {
                    const json_name = block.getAttribute("name");
                    const json_value = block.value;
                    json_data.blocks[i].data.push({
                        name: json_name,
                        value: json_value
                    });
                });
                Array.prototype.slice.call(blockParent.attributes).forEach(function (attribute) {
                    const jsonobj = {};
                    jsonobj[attribute.name] = attribute.value;
                    json_data.blocks[i].attr.push(jsonobj);
                });
            }
            return json_data;
        }
    },

    /**
     * use for test, showing coordinates
     */
    mouseCoordinates: function () {
        this.canvas.addEventListener('mousemove', function (e) {
            const mouseX = parseInt(e.clientX - this.absx + this.canvas.scrollLeft);
            const mouseY = parseInt(e.clientY - this.absy + this.canvas.scrollTop);
            document.querySelector('.fmf-form__input-search').value = "Move: " + mouseX + " / " + mouseY;
        }.bind(this));
    },

}