#include <iostream>
#include "Shape/Circle.hpp"
#include "Algo/Area.hpp"

int main() {
    Circle circle(Vector{}, 2);
    std::cout << area(circle) << std::endl;
    return 0;
}