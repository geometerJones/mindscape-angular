"use strict";
var Relationship = (function () {
    function Relationship(data) {
        this.start = data.start;
        this.end = data.end;
        this.id = data.id;
        this.type = data.type;
        this.properties = data.properties;
    }
    return Relationship;
}());
exports.Relationship = Relationship;
//# sourceMappingURL=relationship.js.map