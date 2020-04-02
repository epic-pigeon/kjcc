(global => {
    let impls = {};
    global.implementation = function (name, f) {
        if (typeof f === "undefined") {
            return impls[name];
        } else if (typeof f === "function") {
            impls[name] = f;
        } else throw new Error("f should be a function");
    }
})(window || global);