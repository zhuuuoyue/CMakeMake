#pragma once

#include "GeometryExport.hpp"
#include "Vector.hpp"

class GEOMETRY_API Circle {
public:
    Circle(const Vector& center, double radius);
    const Vector& center() const { return _center; }
    double radius() const { return _radius; }
    Circle& setCenter(const Vector& center);
    Circle& setRadius(double radius);
private:
    Vector _center;
    double _radius;
};
