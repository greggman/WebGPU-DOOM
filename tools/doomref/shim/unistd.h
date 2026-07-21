/* Shim for POSIX <unistd.h> on MSVC. Maps the file I/O linuxdoom uses
   (open/read/write/close/lseek/access) onto the CRT's io.h. Build-time only.

   NOTE on filelength: w_wad.c *defines its own* `int filelength(int)`, which
   collides with the `long filelength(int)` MSVC declares in io.h. We compile
   w_wad.c with /Dfilelength=w_filelength so its private copy is renamed and the
   CRT symbol is left untouched. */
#pragma once
#include <io.h>
#include <fcntl.h>
#include <process.h>
#include <direct.h>
