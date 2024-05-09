class Multiset {
    constructor(iterable) {
        if (iterable instanceof Map) {
            this.elements = new Map(
                Array.from(iterable.entries()).filter(
                    ([element, multiplicity]) => multiplicity > 0
                )
            );
        }
        if (iterable instanceof Multiset) {
            this.elements = new Map(iterable.elements);
        }
        if (iterable instanceof Set) {
            this.elements = new Map();
            iterable.forEach((e) => {
                this.elements.set(e, 1);
            });
        }
        if (iterable instanceof Array) {
            this.elements = new Map();
            iterable.forEach((e) => {
                if (!this.elements.has(e)) {
                    this.elements.set(e, 1);
                } else {
                    this.elements.set(e, this.elements.get(e) + 1);
                }
            });
        }
    }
    copy() {
        return new Multiset(this);
    }
    isEmpty() {
        return this.elements.size == 0;
    }
    toString() {
        if (this.isEmpty()) {
            return "{}";
        }
        var s = "{";
        this.elements.forEach((multiplicity, element) => {
            s += `${element}, `.repeat(multiplicity);
        });
        return s.slice(0, -2) + "}";
    }
    clear() {
        this.elements.clear();
    }
    length() {
        // let len = 0;
        return Array.from(this.elements.values()).reduce((x, y) => x + y);
        // this.elements.forEach((multiplicity) => {
        //     len += multiplicity;
        // });
        // return len;
    }
    distinctElements() {
        return new Set(this.elements.keys());
    }
    has(element) {
        return this.elements.has(element);
    }
    add(element, multiplicity) {
        if (multiplicity > 0) {
            if (this.elements.has(element)) {
                var newMultiplicity = this.elements.get(element) + multiplicity;
                if (newMultiplicity == 0) {
                    this.elements.delete(element);
                } else {
                    this.elements.set(element, newMultiplicity);
                }
            } else {
                this.elements.set(element, multiplicity);
            }
        }
    }
    remove(element, multiplicity) {
        if (multiplicity > 0) {
            if (this.elements.has(element)) {
                const diff = this.elements.get(element) - multiplicity;
                if (diff > 0) {
                    this.elements.set(element, diff);
                } else {
                    this.elements.delete(element);
                }
            } else {
                this.elements.set(element, multiplicity);
            }
        }
    }
    combine(other) {
        if (other instanceof Multiset) {
            other.elements.forEach((ele, mul) => {
                if (this.elements.has(ele)) {
                    this.elements.set(ele, this.elements.get(ele) + mul);
                } else {
                    this.elements.set(ele, mul);
                }
            });
        }
    }
    count(element) {
        return !this.has(element) ? 0 : this.elements.get(element);
    }
    times(factor) {
        if (factor > 0) {
            this.elements.forEach((element, multiplicity) => {
                this.elements.set(element, multiplicity * factor);
            });
        }
    }
    isSubsetOf(other) {
        if (!other instanceof Multiset) {
            return false;
        }
        return Array.from(
            union(this.distinctElements(), other.distinctElements())
        ).every((element) => this.count(element) <= other.count(element));
    }
    isSupersetOf(other) {
        return other.isSubsetOf(this);
    }
    union(other) {
        if (other instanceof Multiset) {
            const u = union(this.distinctElements(), other.distinctElements());
            const m = new Map();
            u.forEach((i) => {
                m.set(i, Math.max(this.count(i), other.count(i)));
            });
            return new Multiset(m);
        }
    }
    intersection(other) {
        if (other instanceof Multiset) {
            const i = intersection(
                this.distinctElements(),
                other.distinctElements()
            );
            const m = new Map();
            i.forEach((i) => {
                m.set(i, Math.min(this.count(i), other.count(i)));
            });
            return new Multiset(m);
        }
    }
    difference(other) {
        if (other instanceof Multiset) {
            const i = union(this.distinctElements(), other.distinctElements());
            const m = new Map();
            i.forEach((i) => {
                m.set(i, Math.max(this.count(i) - other.count(i), 0));
            });
            return new Multiset(m);
        }
    }
    symmetricDifference(other) {
        if (other instanceof Multiset) {
            const i = union(this.distinctElements(), other.distinctElements());
            const m = new Map();
            i.forEach((e) => {
                m.set(e, Math.abs(this.count(e) - other.count(e)));
            });
            return new Multiset(m);
        }
    }
    forEach(func) {
        if (func instanceof Function) {
            this.elements.forEach((multiplicity, element) => {
                while (multiplicity > 0) {
                    func(element);
                    multiplicity--;
                }
            });
        }
    }
    all(boolfunc) {
        return (
            boolfunc instanceof Function &&
            this.isEmpty() &&
            Array.from(this.elements.keys()).every((e) => boolfunc(e))
        );
    }
    any(boolfunc) {
        return (
            boolfunc instanceof Function &&
            this.isEmpty() &&
            Array.from(this.elements.keys).some((e) => boolfunc(e))
        );
    }
}

class Hybridset {
    constructor(iterable) {
        if (iterable instanceof Map) {
            this.elements = new Map(
                Array.from(iterable.entries()).filter(
                    ([element, multiplicity]) => multiplicity != 0
                )
            );
        }
        if (iterable instanceof Hybridset) {
            this.elements = iterable.elements;
        }
        if (
            iterable instanceof Array &&
            iterable.length == 2 &&
            iterable.every((x) => x instanceof Multiset)
        ) {
            this.multisetGenerate(iterable[0], iterable[1]);
        }
    }
    copy() {
        return new Hybridset(this);
    }
    isEmpty() {
        return this.elements.size == 0;
    }
    clear() {
        this.elements.clear();
    }
    multisetGenerate(a, b) {
        if (this.isEmpty()) {
            this.clear();
        }
        if (a instanceof Set || a instanceof Array) {
            a.forEach((element) => {
                if (this.elements.has(element)) {
                    this.elements.set(element, this.elements.get(element) + 1);
                } else {
                    this.elements.set(element, 1);
                }
            });
        }
        if (a instanceof Multiset) {
            a.elements.combine(a);
        }
        if (b instanceof Set || b instanceof Array) {
            b.forEach((element) => {
                if (this.elements.has(element)) {
                    this.elements.set(element, this.elements.get(element) - 1);
                } else {
                    this.elements.set(element, -1);
                }
            });
        }
        if (b instanceof Multiset) {
            b.elements.combine(b);
        }
    }
    has(element) {
        return this.elements.has(element);
    }
    count(element) {
        return this.has(element) ? this.elements.get(element) : 0;
    }
    negativePart() {
        var newMap = new Map(this.elements);
        this.elements.forEach((multiplicity, element) => {
            if (multiplicity > 0) {
                newMap.delete(element);
            } else {
                newMap.set(element, -multiplicity);
            }
        });
        return new Multiset(newMap);
    }
    positivePart() {
        var newMap = new Map(this.elements);
        this.elements.forEach((multiplicity, element) => {
            if (multiplicity < 0) {
                newMap.delete(element);
            }
        });
        return new Multiset(newMap);
    }
    distinctElements() {
        return new Set(this.elements.keys());
    }
    toString() {
        let a = this.positivePart().toString();
        let b = this.negativePart().toString();
        return a.slice(0, -1) + "|" + b.slice(1);
    }
    cardinality() {
        var i = 0;
        this.elements.forEach((multiplicity, element) => {
            i += multiplicity;
        });
        return i;
    }
    weight() {
        var i = 0;
        this.elements.forEach((multiplicity, element) => {
            i += Math.abs(multiplicity);
        });
        return i;
    }
    add(element, multiplicity) {
        if (this.elements.has(element)) {
            var s = this.elements.get(element) + multiplicity;
            if (s == 0) {
                this.elements.delete(element);
            } else {
                this.elements.set(element, s);
            }
        } else {
            this.elements.set(element, multiplicity);
        }
    }
    remove(element, multiplicity) {
        if (this.elements.has(element)) {
            var s = this.elements.get(element) - multiplicity;
            if (s == 0) {
                this.elements.delete(element);
            } else {
                this.elements.set(element, s);
            }
        } else {
            this.elements.set(element, -multiplicity);
        }
    }
    combine(other) {
        if (other instanceof Multiset || other instanceof Hybridset) {
            const localMap = this.elements;
            other.elements.forEach((multiplicity, element) => {
                if (!localMap.has(element)) {
                    localMap.set(element, multiplicity);
                } else {
                    localMap.set(element, localMap.get(element) - multiplicity);
                }
            });
            return new Hybridset(localMap);
        }
    }
    times(factor) {
        let anotherHybridset = this.copy();
        anotherHybridset.elements.forEach((multiplicity, element) => {
            anotherHybridset.elements.set(element, multiplicity * factor);
        });
        return anotherHybridset;
    }
    part(other) {
        if (other instanceof Hybridset || other instanceof Multiset) {
            const localMap = this.elements;
            other.elements.forEach((multiplicity, element) => {
                if (!localMap.has(element)) {
                    localMap.set(element, -multiplicity);
                } else {
                    localMap.set(element, localMap.get(element) - multiplicity);
                }
            });
            return new Hybridset(localMap);
        }
    }
    isNewset() {
        const afte = Array.from(this.elements);
        return afte.every((m) => m[1] == -1) || afte.every((m) => m[1] == 1);
    }
    isProper() {
        return Array.from(this.elements).some((m) => m[1] < 0);
    }
    isSubsetOf(other) {
        return (
            (other instanceof Hybridset || other instanceof Multiset) &&
            Array.from(
                union(this.distinctElements(), other.distinctElements())
            ).every((m) => {
                const t = this.count(m),
                    o = other.count(m);
                return (t <= o && o < 0) || (0 <= t && t <= o);
            })
        );
    }
}
