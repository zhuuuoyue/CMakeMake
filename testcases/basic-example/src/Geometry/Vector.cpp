#include "Vector.hpp"

Vector::Vector(double x_value, double y_value)
    : _x{ x_value }
    , _y{ y_value }
{
}

Vector& Vector::setX(double value) {
    this->_x = value;
    return *this;
}

Vector& Vector::setY(double value) {
    this->_y = value;
    return *this;
}