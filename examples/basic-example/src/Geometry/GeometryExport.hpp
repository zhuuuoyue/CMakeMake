#pragma once

#ifdef GEOMETRY_LIBRARY
#define GEOMETRY_API __declspec(dllexport)
#else
#define GEOMETRY_API __declspec(dllimport)
#endif
