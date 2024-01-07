#include "Circle.hpp"

Circle::Circle(const Vector& center, double radius)
    : _center{ center }
    , _radius{ radius }
{
}

Circle& Circle::setCenter(const Vector& center) {
    _center = center;
    return *this;
}

Circle& Circle::setRadius(double radius) {
    _radius = radius;
    return *this;
}