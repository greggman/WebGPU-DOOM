// Headless vanilla-DOOM reference: plays a demo through the REAL linuxdoom-1.10
// playsim and dumps per-tic state, so webgpu-doom's port can be diffed against
// it tic-by-tic. No rendering, no audio, no video — every subsystem that isn't
// the simulation is stubbed (see stubs.c). The point is a ground-truth trace:
//   tic prndindex x y angle health
// The first line that differs from our port's demotrace is the desync tic.

#include <stdio.h>
#include <stdlib.h>
#include "doomdef.h"
#include "doomstat.h"
#include "d_player.h"
#include "p_mobj.h"
#include "w_wad.h"
#include "z_zone.h"

extern int prndindex;                 // m_random.c (non-static in 1.10)
extern int firstflat;                 // defined below; R_FlatNumForName uses it

void P_Ticker(void);
void G_InitNew(skill_t skill, int episode, int map);
void G_ReadDemoTiccmd(ticcmd_t* cmd);
void P_MobjThinker(mobj_t* mo);
int P_CheckSight(mobj_t* t1, mobj_t* t2);
extern thinker_t thinkercap;
extern state_t states[];
extern int leveltime;

// Per-tic probe of every shotgun guy (type 2): state index, tics left, and
// whether it can currently see the player. Distinguishes a state-clock phase
// bug (state/tics differ) from a sight-timing bug (sight flips on a different
// tic while state/tics match).
static void probe(int t, mobj_t* plmo)
{
    if (t > 20) return;
    for (thinker_t* th = thinkercap.next; th && th != &thinkercap; th = th->next)
    {
        if (th->function.acp1 != (actionf_p1)P_MobjThinker) continue;
        mobj_t* m = (mobj_t*)th;
        if (m->type != 2) continue;
        int sidx = (int)(m->state - states);
        fprintf(stderr, "PROBE t=%d st=%d tics=%d sight=%d x=%d y=%d\n",
                t, sidx, m->tics, P_CheckSight(m, plmo), m->x, m->y);
    }
}

// Wake tracking: log the first tic each monster acquires a target, which is when
// it starts drawing P_Random every A_Chase tic. A 2-tic offset here vs our port
// is the phase lag the trace diff points at.
static mobj_t* g_seen[1024];
static int g_nseen;
static int seenAlready(mobj_t* m)
{
    for (int i = 0; i < g_nseen; i++) if (g_seen[i] == m) return 1;
    return 0;
}
static void logWakes(int t)
{
    for (thinker_t* th = thinkercap.next; th && th != &thinkercap; th = th->next)
    {
        if (th->function.acp1 != (actionf_p1)P_MobjThinker) continue;
        mobj_t* m = (mobj_t*)th;
        if (m->target && (m->flags & MF_COUNTKILL) && !seenAlready(m))
        {
            if (g_nseen < 1024) g_seen[g_nseen++] = m;
            fprintf(stderr, "WAKE tic=%d type=%d x=%d y=%d\n", t, m->type, m->x, m->y);
        }
    }
}

// g_game.c demo-stream pointers (non-static in 1.10).
extern byte* demobuffer;
extern byte* demo_p;

// Replicates G_DoPlayDemo WITHOUT the `version == VERSION` gate. The doom1.wad
// demos are v109 and this source is v110; our TypeScript port runs them through
// 1.10 logic anyway, so the reference must too — otherwise there's nothing to
// compare. Both engines being "1.10 on a 109 demo" is exactly the apples-to-
// apples we want: any trace divergence is then OUR port's bug, not a version gap.
static void startDemoNoVersionGate(char* name)
{
    int i;
    demobuffer = demo_p = W_CacheLumpName(name, PU_STATIC);
    demo_p++;                          // skip the version byte (the gate)
    skill_t skill = *demo_p++;
    int episode = *demo_p++;
    int map = *demo_p++;
    deathmatch = *demo_p++;
    respawnparm = *demo_p++;
    fastparm = *demo_p++;
    nomonsters = *demo_p++;
    consoleplayer = *demo_p++;
    for (i = 0; i < MAXPLAYERS; i++)
        playeringame[i] = *demo_p++;

    precache = false;
    G_InitNew(skill, episode, map);
    precache = true;
    usergame = false;
    demoplayback = true;
}

// The WAD list W_InitMultipleFiles walks (NULL-terminated).
static char* wadfiles[] = { "doom1.wad", 0 };
#define DUMPTIC 2511

// Draw log: the patched m_random.c calls this on every P_Random when g_rnglog set.
extern int g_rnglog;
void RngLog(int n, int v) { fprintf(stderr, "DRAW %d %d\n", n, v); }
void SpwnLog(int type, int x, int y, int c) { fprintf(stderr, "SPWN t=%d x=%d y=%d c=%d\n", type, x, y, c); }
int g_thinklog;
void ThinkLog(int type, int x, int y, int c) { fprintf(stderr, "THINK type=%d x=%d y=%d draw=%d\n", type, x, y, c); }
int g_dmglog;
void DmgLog(int ttype, int tx, int ty, int hp, int stype, int dmg) { fprintf(stderr, "DMG target=%d tx=%d ty=%d hp=%d src=%d dmg=%d\n", ttype, tx, ty, hp, stype, dmg); }
int g_sposlog;
void SposLog(int ax, int ay, int az, unsigned aa, int slope, int tx, int ty, int tz) { fprintf(stderr, "SPOS ax=%d ay=%d az=%d aangle=%u slope=%d tx=%d ty=%d tz=%d\n", ax, ay, az, aa, slope, tx, ty, tz); }
int g_slidelog;
void SlideLogHit(int frac, int lineidx, int slope) { fprintf(stderr, "  hit bestFrac=%d line=%d slope=%d\n", frac, lineidx, slope); }
void SlideLogMom(int mx, int my) { fprintf(stderr, "  after HitSlideLine mom=%d,%d\n", mx, my); }
int g_thrustlog;
void ThrustLog(int fine, int move, int fcos, int fsin, int dmx, int dmy) { fprintf(stderr, "THRUST fine=%d move=%d fcos=%d fsin=%d dmx=%d dmy=%d\n", fine, move, fcos, fsin, dmx, dmy); }

int main(int argc, char** argv)
{
    extern int myargc; extern char** myargv;
    extern unsigned int _fmode;
    _fmode = 0x8000;                  // _O_BINARY: linuxdoom forces O_BINARY 0

    myargc = argc;
    myargv = argv;

    setvbuf(stdout, 0, _IONBF, 0);    // flush each line: a crash mustn't eat the trace
    fprintf(stderr, "[chk] start\n");
    Z_Init();
    W_InitMultipleFiles(wadfiles);
    firstflat = W_GetNumForName("F_START") + 1;
    fprintf(stderr, "[chk] wad ready, firstflat=%d\n", firstflat);

    char* demo = (argc > 1) ? argv[1] : "DEMO1";
    // Set g_rnglog=1 here to dump every setup P_Random draw (via RngLog/SpwnLog)
    // for diffing spawn order against our port. Off by default — verbose.
    startDemoNoVersionGate(demo);     // reads header, G_InitNew -> P_SetupLevel
    fprintf(stderr, "[chk] level loaded, demoplayback=%d consoleplayer=%d\n",
            demoplayback, consoleplayer);

    if (!demoplayback)
    {
        fprintf(stderr, "reference: demo '%s' failed to start\n", demo);
        return 1;
    }

    player_t* pl = &players[consoleplayer];
    printf("# %s reference E%dM%d skill %d\n", demo, gameepisode, gamemap, gameskill);
    printf("# tic prnd x y angle health\n");

    for (int t = 0; ; t++)
    {
        G_ReadDemoTiccmd(&pl->cmd);   // at DEMOMARKER clears demoplayback
        if (!demoplayback) break;
        // Desync diagnosis hooks (g_thinklog/g_dmglog/g_slidelog/g_thrustlog, the
        // CK world-checksum and per-mobj MON dumps) attach here at a target tic. Off.
        P_Ticker();
        mobj_t* mo = pl->mo;
        printf("%d %d %d %d %u %d\n",
               t, prndindex, mo->x, mo->y, (unsigned)mo->angle, pl->health);
    }
    return 0;
}
