// Globals normally defined in the renderer / d_main / i_system, which the
// headless reference doesn't compile. Sync-relevant ones (validcount, finecosine,
// netcmds) are given their real values; the rest are inert placeholders that the
// simulation never reads in a way that affects a demo.

#include "doomdef.h"
#include "doomtype.h"
#include "d_ticcmd.h"
#include "d_net.h"
#include "tables.h"

// --- sync-relevant: must be correct --------------------------------------
int validcount = 1;                    // r_main.c: blockmap/BSP traversal marker
fixed_t* finecosine = &finesine[FINEANGLES/4];  // r_main.c derives it from finesine
ticcmd_t netcmds[MAXPLAYERS][BACKUPTICS];       // g_game.c reads player cmds here
int mb_used = 6;                       // zone heap size in MB (i_system.c default)

// --- inert placeholders ---------------------------------------------------
int skytexture;
int wipegamestate = -1;
boolean automapactive;
boolean menuactive;
int detailLevel;
int screenblocks = 9;
boolean setsizeneeded;
int nomonsters, respawnparm, fastparm; // set from the demo header
int numChannels;
int snd_MusicVolume, snd_SfxVolume;
int mouseSensitivity;
boolean showMessages = 1;
int usegamma;
boolean singletics;
int ticdup = 1;
int maketic;
char* basedefault = "default.cfg";
char* sndserver_filename = "sndserver";
byte* screens[5];
fixed_t* textureheight;                // renderer-only; sim never dereferences it
int* flattranslation;                  // NULL: no animations registered (no P_Init)
int* texturetranslation;
void* hu_font[256];
char* chat_macros[10];
char* player_names[4];
