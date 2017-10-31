module.exports = function (cy, gridSpacing) {
    
        var snap = { };
    
        snap.changeOptions = function (opts) {
            gridSpacing = opts.gridSpacing;
        };
    
        var getScratch = function (node) {
            if (!node.scratch("_gridGuide"))
                node.scratch("_gridGuide", {});
    
            return node.scratch("_gridGuide");
        };
    
        function isNodeCaption (node) {
          return node.hasClass('container-node') || node.hasClass('child-node') || node.hasClass('child-node-title') || node.hasClass('child-node-description');
        }
    
    
        function getTopMostNodes(nodes) {
            var nodesMap = {};
    
            for (var i = 0; i < nodes.length; i++) {
                nodesMap[nodes[i].id()] = true;
            }
    
            var roots = nodes.filter(function (ele, i) {
                if(typeof ele === "number") {
                  ele = i;
                }
    
                var parent = ele.parent()[0];
                while(parent != null){
                    if(nodesMap[parent.id()]){
                        return false;
                    }
                    parent = parent.parent()[0];
                }
                return true;
            });
    
            return roots;
        }
    
        /**
         * Returns true if the row is even, false otherwise.
         * @param {*} y Y position of the node.
         * @return Returns true if the row is even, false otherwise.
         */
        function isEvenRow (y) {
          return Math.floor(y / gridSpacing) % 2 == 0;
        }
    
        /**
         * We skip odd rows (if user would have landed in an odd row, we snap
         * in the closer even row).
         * @param {*} y Y position of the node.
         * @return Correct y position to drop the node (never dropping on an odd row).
         */
        function obtainCorrectEvenRowPosition (y) {
          var correction = 0.5;
    
          if (!isEvenRow(y)) {
            var topRowCoordinate = (Math.floor(y / gridSpacing) - 0.5) * gridSpacing;
            var bottomRowCoordinate = (Math.floor(y / gridSpacing) + 0.5) * gridSpacing;
            var centerRowCoordinate = (topRowCoordinate + bottomRowCoordinate) / 2;
    
            correction = ((y - Math.floor(gridSpacing/2)) < centerRowCoordinate) ? - 0.5: 1.5;
          }
    
          return (Math.floor(y / gridSpacing) + correction) * gridSpacing;
        }
    
        /**
         * Obtains the position for the caption (captions must sit in odd rows).
         * @param {*} y Y position of the caption.
         * @return Correct y position to drop the node (odd row).
         * TODO: After demo improve approach.
         */
        function obtainCorrectCaptionPosition (y) {
          var correction = 0.5;
          if (isEvenRow(y)) {
            correction = 1;
          }
          return (Math.floor(y / gridSpacing) + correction) * gridSpacing;
        }
    
        snap.snapPos = function (pos, isCaption) {
          console.log('isCaption', isCaption);
          var correctedY = isCaption ? obtainCorrectCaptionPosition(pos.y): obtainCorrectEvenRowPosition(pos.y);
            var newPos = {
                x: (Math.floor(pos.x / gridSpacing) + 0.5) * gridSpacing,
                y: correctedY //obtainCorrectEvenRowPosition(pos.y)
            };
            return newPos;
        };
    
        snap.snapNode = function (node) {
            console.log('node', node);
            var isCaption = isNodeCaption(node);
            var pos = node.position();
            var newPos = snap.snapPos(pos, isCaption);
    
            node.position(newPos);
        };
    
        function snapTopDown(nodes) {
    
            nodes.union(nodes.descendants()).positions(function (node, i) {
                if(typeof node === "number") {
                  node = i;
                }
                var pos = node.position();
                var isCaption = isNodeCaption(node);
                return snap.snapPos(pos, isCaption);
            });
            /*
            for (var i = 0; i < nodes.length; i++) {
    
                if (!nodes[i].isParent())
                    snap.snapNode(nodes[i]);
    
                snapTopDown(nodes.children());
            }*/
    
        }
    
        snap.snapNodesTopDown = function (nodes) {
            // getTOpMostNodes -> nodes
            cy.startBatch();
            nodes.union(nodes.descendants()).positions(function (node, i) {
                if(typeof node === "number") {
                  node = i;
                }
                var pos = node.position();
                var isCaption = isNodeCaption(node);
                return snap.snapPos(pos, isCaption);
            });
            cy.endBatch();
        };
    
        snap.onFreeNode = function (e) {
            var nodes;
            var cyTarget = e.target || e.cyTarget;
            if (cyTarget.selected())
                nodes = e.cy.$(":selected");
            else
                nodes = cyTarget;
    
            snap.snapNodesTopDown(nodes);
    
        };
    
    
        snap.recoverSnapNode = function (node) {
            var snapScratch = getScratch(node).snap;
            if (snapScratch) {
                node.position(snapScratch.oldPos);
            }
        };
    
        return snap;
    
    
    
    
    
    };