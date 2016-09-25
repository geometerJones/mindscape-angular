"use strict";
var Node = (function () {
    //modified: boolean;
    //flagged: boolean;
    function Node(data) {
        this.created = data.created;
        this.updated = data.updated;
        this.id = data.id;
        this.root_id = data.root_id;
        this.name = data.name;
        this.theme = data.theme;
        this.meta = data.meta;
        this.secret = data.secret;
        this.degree = data.degree;
        this.x = data.x;
        this.y = data.y;
        this.z = data.z;
        this.fixed = data.fixed;
        this.showMeasurement = data.showMeasurement;
        this.showParagraph = data.showParagraph;
        this.showDefinitions = data.showDefinitions;
        this.showPresentations = data.showPresentations;
        this.showEquations = data.showEquations;
    }
    return Node;
}());
exports.Node = Node;
//# sourceMappingURL=node.js.map