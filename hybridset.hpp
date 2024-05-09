#ifndef HYBRIDSET_HPP
#define HYBRIDSET_HPP
#include <algorithm>
#include <list>
#include <map>
#include <math.h>
#include <numeric>
#include <set>
#include <string>
#include <unordered_map>
/*Định nghĩa để rút ngắn biểu thức để kiểm tra xem có phần tử nào tồn tại trong một iterable hay không*/
#define contains(iterable, element) (iterable.find(element) != iterable.end())
/*Định nghĩa kiểu object*/
typedef struct
{
        int key;
        float otherfields;
} object;
/*So sánh các giá trị cùng kiểu dữ liệu object*/
bool operator==(const object &lhs, const object &rhs) { return lhs.key == rhs.key && lhs.otherfields == rhs.otherfields; }
/*Ghi đè lên các toán tử () và ==*/
namespace std {
    template <>
    struct hash<object> {
            size_t operator()(const object &obj) const { return hash<int>()(obj.key); }
    };
    template <>
    struct equal_to<object> {
            bool operator()(const object &lhs, const object &rhs) const { return lhs.key == rhs.key; }
    };
    template <>
    struct less<object> {
            bool operator()(const object &lhs, const object &rhs) const { return lhs.key < rhs.key; }
    };
}
using namespace std;
/*Định nghĩa lớp hybridset*/
class hybridset {
    private:
        unordered_map<object, int> elements;
        /*Xóa bỏ các cặp có giá trị bằng 0*/
        inline void erase_zero_multiplicities() {
            for (const auto &x : elements) {
                if (x.second == 0) {
                    elements.erase(x.first);
                }
            }
        }

    public:
        hybridset() {
            unordered_map<object, int> a;
            elements = a;
        }
        hybridset(multiset<object> a, multiset<object> b) {
            for (const auto &element : a) {
                if (!contains(elements, element)) {
                    elements[element] = 1;
                } else {
                    elements[element]++;
                }
            }
            for (const auto &element : b) {
                if (!contains(elements, element)) {
                    elements[element] = -1;
                } else {
                    elements[element]--;
                }
            }
            erase_zero_multiplicities();
        }
        hybridset(unordered_map<object, int> a) : elements(a) { erase_zero_multiplicities(); }
        hybridset(const hybridset &a) : elements(a.elements) {}
        unordered_map<object, int> get_elements() { return elements; }
        /*Thêm một phần tử*/
        void insert(const object &element, int multiplicity = 1) {
            if (multiplicity == 0) {
                return;
            }
            if (!contains(elements, element)) {
                elements[element] = multiplicity;
            } else {
                elements[element] += multiplicity;
                if (elements[element] == 0) {
                    elements.erase(element);
                }
            }
        }
        /*Bớt một phần tử*/
        void remove(const object &element, int multiplicity = 1) {
            if (multiplicity == 0) {
                return;
            }
            if (!contains(elements, element)) {
                elements[element] = -multiplicity;
            } else {
                elements[element] -= multiplicity;
                if (elements[element] == 0) {
                    elements.erase(element);
                }
            }
        }
        /*Xóa tất cả phần tử*/
        void clear() { elements.clear(); }
        /*Đếm số phần tử của cùng một loại*/
        int count(const object &element) { return (!contains(elements, element) ? 0 : elements[element]); }
        /*Phần dương và phần âm*/
        hybridset positive_part() const {
            hybridset a;
            int e;
            for (const auto &i : elements) {
                e = i.second;
                if (e > 0) {
                    while (e > 0) {
                        a.insert(i.first);
                        e--;
                    }
                }
            }
            return a;
        }
        hybridset negative_part() const {
            hybridset a;
            int e;
            for (const auto &i : elements) {
                e = i.second;
                if (e < 0) {
                    while (e < 0) {
                        a.remove(i.first);
                        e++;
                    }
                }
            }
            return a;
        }
        /*Kiểm tra xem hybridset có bị trống hay không*/
        bool empty() { return elements.empty(); }
        /*Kiểm tra xem hybridset có chứa một phần tử duy nhất thuộc mỗi loại hay không?*/
        bool is_new_set() {
            return all_of(elements.begin(), elements.end(), [](pair<object, int> x) {
                return (x.second > 0 || x.second == 1) && (x.second < 0 || x.second == -1);
            });
        }
        /*Kiểm tra xem phần âm của hybridset có rỗng hay không*/
        bool is_proper() {
            return any_of(elements.begin(), elements.end(), [](pair<object, int> x) {
                return x.second < 0;
            });
        }
        /*Các loại phần tử*/
        set<object> distinct_elements() {
            set<object> keys;
            for (const auto &x : elements) {
                keys.insert(x.first);
            }
            return keys;
        }
        /*Lực lượng*/
        int cardinality() {
            list<int> a;
            transform(elements.begin(), elements.end(), back_inserter(a), [](pair<object, int> x) {
                return x.second;
            });
            return accumulate(a.begin(), a.end(), 0);
        }
        /*Trọng số*/
        int weight() {
            list<int> a;
            transform(elements.begin(), elements.end(), back_inserter(a), [](pair<object, int> x) {
                return abs(x.second);
            });
            return accumulate(a.begin(), a.end(), 0);
        }
        /*Ghi đè một số toán tử*/
        bool operator==(const hybridset a) const { return this->elements == a.elements; }
        hybridset operator+(const hybridset &a) const {
            hybridset b = *this;
            for (const auto &x : a.elements) {
                if (!contains(b.elements, x.first)) {
                    b.elements[x.first] = x.second;
                } else {
                    b.elements[x.first] += x.second;
                }
            }
            b.erase_zero_multiplicities();
            return b;
        }
        hybridset operator+=(const hybridset &a) {
            *this = *this + a;
            return *this;
        }
        hybridset operator*(const int &a) const {
            hybridset b = *this;
            for (auto &x : b.elements) {
                x.second *= a;
            }
            return b;
        }
        hybridset operator*=(const int &a) {
            *this = *this * a;
            return *this;
        }
        hybridset operator-(const hybridset &a) { return *this + a * (-1); }
        hybridset operator-=(const hybridset &a) {
            *this = *this - a;
            return *this;
        }
        ~hybridset();
        bool is_subset_of(hybridset a);
        bool is_superset_of(hybridset a);
        bool is_natural_subset_of(hybridset a);
        hybridset complement_of(hybridset a);
        void test();
        friend ostream &operator<<(ostream &os, const hybridset &H);
};
hybridset::~hybridset() {}
bool partial_ordering(const int a, const int b) { return (a <= b && b < 0 || 0 <= a && a <= b); }
/*Kiểm tra xem nó có phải là tập hợp lai con của một tập hợp lai cho trước hay không*/
bool hybridset::is_subset_of(hybridset a) {
    return all_of(a.elements.begin(), a.elements.end(), [&a, this](pair<object, int> x) {
        int i = this->count(x.first), j = a.count(x.first);
        return partial_ordering(i, j) || partial_ordering(j - i, j);
    });
}
/*Kiểm tra xem nó có chứa một tập hợp lai cho trước hay không*/
bool hybridset::is_superset_of(hybridset a) { return a.is_subset_of(*this); }
/*Kiểm tra xem nó có phải là tập hợp lai con "tự nhiên" của một tập hợp lai cho trước hay không*/
bool hybridset::is_natural_subset_of(hybridset a) {
    auto issubset = [](set<object> a, set<object> b) {
        return all_of(a.begin(), a.end(), [&b](object x) {
            return contains(b, x);
        });
    };
    set<object> p, n;
    hybridset copy = *this;
    for (const auto &x : elements) {
        if (x.second > 0) {
            p.insert(x.first);
        } else if (x.second < 0) {
            n.insert(x.first);
        }
    }
    return issubset(this->distinct_elements(), a.distinct_elements()) &&
           all_of(p.begin(), p.end(), [&a, this](object x) {
               return (0 <= this->count(x)) && (this->count(x) <= a.count(x));
           }) &&
           all_of(n.begin(), n.end(), [this, &a](object x) {
               return this->count(x) >= 0;
           });
}
/*Phần bù của một tập hợp cho trước trên một tập hợp kia*/
hybridset hybridset::complement_of(hybridset a) {
    if (this->is_natural_subset_of(a)) {
        return a - *this;
    } else {
        hybridset h;
        return h;
    }
}
#endif