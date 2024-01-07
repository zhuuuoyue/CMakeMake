#pragma once

#include "GeometryExport.hpp"

class GEOMETRY_API Vector {
public:
    Vector(double x_value = 0, double y_value = 0);
    double x() const { return _x; }
    double y() const { return _y; }
    Vector& setX(double value);
    Vector& setY(double value);
private:
    double _x;
    double _y;
};
