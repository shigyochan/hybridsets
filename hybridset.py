from collections import defaultdict
from collections.abc import Mapping, Sized
from multiset import Multiset, FrozenMultiset
from itertools import chain, repeat, starmap

_sequence_types = (
    list,
    tuple,
    set,
    frozenset,
    range,
    str,
    Multiset,
    FrozenMultiset,
    Sized,
)
_iter_types = (type(iter([])), type((lambda: (yield))()))

__all__ = ["hybridset", "frozenhybridset"]


class hybridset(object):
    __slots__ = ("_elements", "_p", "_n")

    # Khởi tạo hybridset
    def __init__(self, iterable=None, another_iterable=None) -> None:
        self._elements = defaultdict(int)
        self._p = 0
        self._n = 0
        if isinstance(iterable, hybridset):
            self._elements = iterable._elements.copy()
            self._p = iterable._p
            self._n = iterable._n
        else:
            if iterable is not None:
                if another_iterable is not None:
                    if isinstance(iterable, _sequence_types) and isinstance(
                        another_iterable,
                        _sequence_types,
                    ):
                        for element in iterable:
                            self._elements[element] += 1
                        for element in another_iterable:
                            self._elements[element] -= 1

                        self._p = len(Multiset(iterable) - Multiset(another_iterable))
                        self._n = len(Multiset(another_iterable) - Multiset(iterable))
                    else:
                        raise TypeError(
                            "Two arguments to construct this hybridset must be a instance of one in the sequence types!"
                        )
                else:
                    if isinstance(iterable, (dict, Mapping)):
                        for element, multiplicity in iterable.items():
                            if type(multiplicity) == type(0):
                                pass
                            if multiplicity != 0:
                                self._elements[element] = multiplicity
                            if multiplicity > 0:
                                self._p += multiplicity
                            elif multiplicity < 0:
                                self._n += multiplicity
                    else:
                        for element in iterable:
                            self._elements[element] += 1
                            self._p += 1

    # Kiểm tra xem phần tử có tồn tại trong hybridst hay không
    def __contains__(self, element):
        return element in self._elements

    def __getitem__(self, element):
        return self._elements.get(element, 0)

    # In ra màn hình
    def __str__(self) -> str:
        return "{%s|%s}" % (
            ", ".join(map(str, self.positive_part().__iter__())),
            ", ".join(map(str, self.negative_part().__iter__())),
        )

    def __bool__(self):
        return self._p > 0 or self._n > 0

    # So sánh bằng với hai giá trị hybridset
    def __eq__(self, other):
        return (
            self._elements == other._elements if isinstance(other, hybridset) else False
        )

    # Sao chép
    def copy(self):
        return self.__class__(self)

    # Xóa toàn bộ phần tử
    def clear(self):
        self._elements.clear()
        self._p = 0
        self._n = 0

    __copy__ = copy

    # Phần dương và phần âm
    def positive_part(self):
        return Multiset(
            {
                element: self._elements[element]
                for element in self._elements
                if self._elements[element] > 0
            }
        )

    def negative_part(self):
        return Multiset(
            {
                element: -self._elements[element]
                for element in self._elements
                if self._elements[element] < 0
            }
        )

    # Các phần tử riêng biệt
    def distinct_elements(self):
        return set(self._elements.keys())

    # Lực lượng và trọng số
    def cardinality(self):
        return sum(self._elements.values())

    def weight(self):
        return sum(map(abs, self._elements.values()))

    # Nhân vô hướng với một số
    def times(self, factor):
        result = self.__copy__()
        if factor == 0:
            return self.__class__()
        elif factor < 0:
            result._p, result._n = result._n, result._p
        else:
            for element in result._elements:
                result._elements[element] *= factor
        result._n *= factor
        result._p *= factor
        return result

    def __mul__(self, factor):
        if not isinstance(factor, int):
            return NotImplemented
        return self.times(factor)

    def __imul__(self, factor):
        if not isinstance(factor, int):
            return NotImplemented
        return self.times(factor)

    def supportingsets(self):
        a = self.distinct_elements()
        return set(filter(lambda element: self._elements[element] > 0, a)), set(
            filter(lambda element: self._elements[element] < 0, a)
        )

    # Kiểm tra xem hybridset có phải là một new set hay không
    def isnewset(self):
        return all(self._elements[element] == 1 for element in self._elements) or all(
            self._elements[element] == -1 for element in self._elements
        )

    # Kiểm tra xem phần âm của hybridset có rỗng hay không
    def isproper(self):
        return any(self._elements[element] < 0 for element in self._elements)

    def __iter__(self):
        return chain.from_iterable(starmap(repeat, self._elements.items()))

    def isdisjoint(self, other):
        return all(element not in other for element in self._elements.keys())

    # Thêm và gỡ một phần tử ra khỏi hybridset
    def add(self, element, multiplicity=1):
        if multiplicity < 0:
            return
        a = self._elements[element]
        if a < 0:
            b = multiplicity - a
            if b > 0:
                self._p += b
                self._n -= a
            else:
                self._n -= multiplicity
        else:
            self._p += multiplicity
        self._elements[element] += multiplicity
        return

    def remove(self, element, multiplicity=1):
        if multiplicity < 0:
            return
        a = self._elements[element]
        if a > 0:
            b = multiplicity - a
            if b > 0:
                self._n += b
                self._p -= a
            else:
                self._p -= multiplicity
        else:
            self._n += multiplicity
        self._elements[element] -= multiplicity

    # Kết hợp hai hybridset
    def combine(self, other):
        if not isinstance(other, hybridset):
            return NotImplemented
        return hybridset(
            {
                element: self._elements[element] + other._elements[element]
                for element in self.distinct_elements() | other.distinct_elements()
                if self._elements[element] + other._elements[element] != 0
            }
        )

    def __add__(self, other):
        return self.combine(other)

    def __iadd__(self, other):
        return self.combine(other)

    def __neg__(self):
        return self * -1

    def __sub__(self, other):
        return self.combine(other * -1)

    def __isub__(self, other):
        return self.combine(other * -1)

    # Kiểm tra xem nó có phải là tập hợp lai con của một tập hợp lai cho trước hay không
    def issubset(self, other):
        if not isinstance(other, hybridset):
            return NotImplemented
        return all(
            self.partial_ordering(multiplicity, other._elements[element])
            or self.partial_ordering(
                other._elements[element] - multiplicity, other._elements[element]
            )
            for element, multiplicity in self._elements.items()
        )

    # Kiểm tra xem nó có "chứa" một tập hợp lai cho trước hay không
    def issuperset(self, other):
        return (
            NotImplemented
            if not isinstance(other, hybridset)
            else bool(other.issubset(self))
        )

    # Kiểm tra xem nó có phải là tập hợp lai con "tự nhiên" của một tập hợp lai cho trước hay không
    def isnaturalsubset(self, other):
        if not isinstance(other, hybridset):
            return NotImplemented
        a = other.supportingsets()
        return (
            self.distinct_elements().issubset(other.distinct_elements())
            and all(
                0 <= self._elements[element] <= other._elements[element]
                for element in a[0]
            )
            and all(self._elements[element] >= 0 for element in a[1])
        )

    # Phần bù của một tập hợp cho trước trên một tập hợp kia
    def complement(self, other):
        return (
            NotImplemented
            if not isinstance(other, hybridset)
            else other - self if self.isnaturalsubset(other) else None
        )

    @staticmethod
    def partial_ordering(a, b):
        return a <= b < 0 or 0 <= a <= b


class frozenhybridset(hybridset):
    __slots__ = ()

    def hash(self):
        return hash(frozenset(self._elements.items()))
