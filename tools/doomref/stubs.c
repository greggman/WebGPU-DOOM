// Non-simulation stubs for the headless reference build. Everything here is
// either (a) a faithful slice the sim genuinely needs, or (b) a no-op standing
// in for a subsystem (audio/video/menu/net) that cannot affect demo sync.

#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>
#include <string.h>
#include "doomdef.h"
#include "doomtype.h"
#include "w_wad.h"

void I_Error(char* error, ...);       // matches i_system.h; declared before use

// --- renderer: texture/flat name lookup ----------------------------------
// FLAT numbers must be REAL: sector floor/ceiling pics and skyflatnum are
// compared numerically by the sim (a missile hitting a sky ceiling is removed
// without an explosion, which changes the RNG). Flats are contiguous lumps, so
// this reproduces vanilla's numbering exactly.
int firstflat;
int skyflatnum;

int R_FlatNumForName(char* name)
{
    int i = W_CheckNumForName(name);
    if (i == -1)
        I_Error("R_FlatNumForName: %s not found", name);
    return i - firstflat;
}

// TEXTURE numbers never feed collision or RNG (only switches/scrollers, which
// are cosmetic). Returning a constant is safe; returning -1 from Check makes
// P_InitPicAnims/P_InitSwitchList skip every entry — but P_Init isn't even
// called in this build, so these only satisfy P_LoadSideDefs.
int R_TextureNumForName(char* name) { (void)name; return 0; }
int R_CheckTextureNumForName(char* name) { (void)name; return -1; }
int R_FlatNumForName2(char* name) { return R_FlatNumForName(name); }

void R_PrecacheLevel(void) {}
void R_InitSprites(char** namelist) { (void)namelist; }

// --- platform: only I_Error and I_GetTime do anything --------------------
void I_Error(char* error, ...)
{
    va_list ap;
    va_start(ap, error);
    fprintf(stderr, "\nreference I_Error: ");
    vfprintf(stderr, error, ap);
    fprintf(stderr, "\n");
    va_end(ap);
    exit(3);
}

int I_GetTime(void)
{
    static int t = 0;
    return t++;
}

byte* I_ZoneBase(int* size) { extern int mb_used; *size = mb_used * 1024 * 1024; return (byte*)malloc(*size); }

void  I_Tactile(int a, int b, int c) { (void)a; (void)b; (void)c; }
void  I_Quit(void) { exit(0); }
void* I_ReadScreen(void* p) { return p; }
void* I_BaseTiccmd(void) { static char c[32] = {0}; return c; }

// --- subsystem no-ops (cannot affect demo sync) --------------------------
int  AM_Responder(void* e) { (void)e; return 0; }
void AM_Stop(void) {}
void AM_Ticker(void) {}
void D_AdvanceDemo(void) {}
void D_PageTicker(void) {}
int  F_Responder(void* e) { (void)e; return 0; }
void F_StartFinale(void) {}
void F_Ticker(void) {}
int  HU_Responder(void* e) { (void)e; return 0; }
void HU_Start(void) {}
void HU_Ticker(void) {}
char HU_dequeueChatChar(void) { return 0; }
void M_StartControlPanel(void) {}
void R_ExecuteSetViewSize(void) {}
void R_FillBackScreen(void) {}
int  ST_Responder(void* e) { (void)e; return 0; }
void ST_Start(void) {}
void ST_Ticker(void) {}
void S_PauseSound(void) {}
void S_ResumeSound(void) {}
void S_Start(void) {}
void S_StartSound(void* o, int id) { (void)o; (void)id; }
void S_StopSound(void* o) { (void)o; }
void WI_Start(void* w) { (void)w; }
void WI_Ticker(void) {}
void V_DrawPatch(int x, int y, int s, void* p) { (void)x; (void)y; (void)s; (void)p; }
void V_DrawPatchDirect(int x, int y, int s, void* p) { (void)x; (void)y; (void)s; (void)p; }
int  strcasecmp(const char* a, const char* b) { return _stricmp(a, b); }
