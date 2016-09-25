"use strict";
var Link = (function () {
    function Link(noteA, noteB, type) {
        if (noteA.node.id < noteB.node.id) {
            this.source = noteA;
            this.target = noteB;
        }
        else {
            this.source = noteB;
            this.target = noteA;
        }
        if (type == 'DEFINE' || type == 'PRESENT' || type == 'EQUATE') {
            this.type = type;
        }
        else {
            console.error('invalid pair type', type);
        }
        // TODO verify that note relations are complementary/reverse-symmetric?
    }
    Link.getLinks = function (noteA, noteB) {
        var links = [];
        var relationA = noteA.relations_by_id[noteB.node.id];
        var relationB = noteB.relations_by_id[noteA.node.id];
        console.assert((relationA && relationB) || (!relationA && !relationB), 'relation mismatch', noteA, noteB);
        if (relationA && relationB) {
            console.assert(relationA.define.empty == relationB.define.empty, 'relation mismatch', relationA, relationB);
            console.assert(relationA.present.empty == relationB.present.empty, 'relation mismatch', relationA, relationB);
            console.assert(relationA.define.empty == relationB.define.empty, 'relation mismatch', relationA, relationB);
            if (!relationA.define.empty && !relationB.define.empty) {
                var link = new Link(noteA, noteB, 'DEFINE');
                links.push(link);
            }
            if (!relationA.present.empty && !relationB.present.empty) {
                var link = new Link(noteA, noteB, 'PRESENT');
                links.push(link);
            }
            if (!relationA.equate.empty && !relationB.equate.empty) {
                var link = new Link(noteA, noteB, 'EQUATE');
                links.push(link);
            }
        }
        return links;
    };
    return Link;
}());
exports.Link = Link;
//# sourceMappingURL=link.js.map