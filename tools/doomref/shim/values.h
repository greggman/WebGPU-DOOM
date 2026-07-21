/* Shim for the SysV <values.h> linuxdoom expects. Only m_bbox.h needs it,
   and only for MININT/MAXINT. Not part of the game — build-time only. */
#pragma once
#include <limits.h>
#ifndef MAXINT
#define MAXINT INT_MAX
#endif
#ifndef MININT
#define MININT INT_MIN
#endif
