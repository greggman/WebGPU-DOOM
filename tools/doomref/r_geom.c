// Minimal geometry slice of r_main.c for the headless reference build. These
// four functions are the ONLY renderer code the playsim calls, and they are
// copied VERBATIM from linuxdoom-1.10/r_main.c so the reference is bit-exact.
// Compiling the real r_main.c would drag in the entire rasteriser + video layer;
// the sim only needs point-in-subsector and point-to-angle.

#include "doomdef.h"
#include "m_fixed.h"
#include "tables.h"
#include "r_defs.h"
#include "r_state.h"

// Normally defined in r_main.c; R_PointToAngle reads them and R_PointToAngle2
// sets them. Nothing else in the headless build touches them.
fixed_t viewx;
fixed_t viewy;

int SlopeDiv(unsigned num, unsigned den); // tables.c

int
R_PointOnSide
( fixed_t	x,
  fixed_t	y,
  node_t*	node )
{
    fixed_t	dx;
    fixed_t	dy;
    fixed_t	left;
    fixed_t	right;

    if (!node->dx)
    {
	if (x <= node->x)
	    return node->dy > 0;
	return node->dy < 0;
    }
    if (!node->dy)
    {
	if (y <= node->y)
	    return node->dx < 0;
	return node->dx > 0;
    }

    dx = (x - node->x);
    dy = (y - node->y);

    if ( (node->dy ^ node->dx ^ dx ^ dy)&0x80000000 )
    {
	if  ( (node->dy ^ dx) & 0x80000000 )
	    return 1;
	return 0;
    }

    left = FixedMul ( node->dy>>FRACBITS , dx );
    right = FixedMul ( dy , node->dx>>FRACBITS );

    if (right < left)
	return 0;
    return 1;
}

angle_t
R_PointToAngle
( fixed_t	x,
  fixed_t	y )
{
    x -= viewx;
    y -= viewy;

    if ( (!x) && (!y) )
	return 0;

    if (x>= 0)
    {
	if (y>= 0)
	{
	    if (x>y)
		return tantoangle[ SlopeDiv(y,x)];
	    else
		return ANG90-1-tantoangle[ SlopeDiv(x,y)];
	}
	else
	{
	    y = -y;
	    if (x>y)
		return -tantoangle[SlopeDiv(y,x)];
	    else
		return ANG270+tantoangle[ SlopeDiv(x,y)];
	}
    }
    else
    {
	x = -x;
	if (y>= 0)
	{
	    if (x>y)
		return ANG180-1-tantoangle[ SlopeDiv(y,x)];
	    else
		return ANG90+ tantoangle[ SlopeDiv(x,y)];
	}
	else
	{
	    y = -y;
	    if (x>y)
		return ANG180+tantoangle[ SlopeDiv(y,x)];
	    else
		return ANG270-1-tantoangle[ SlopeDiv(x,y)];
	}
    }
    return 0;
}

angle_t
R_PointToAngle2
( fixed_t	x1,
  fixed_t	y1,
  fixed_t	x2,
  fixed_t	y2 )
{
    viewx = x1;
    viewy = y1;
    return R_PointToAngle (x2, y2);
}

subsector_t*
R_PointInSubsector
( fixed_t	x,
  fixed_t	y )
{
    node_t*	node;
    int		side;
    int		nodenum;

    if (!numnodes)
	return subsectors;

    nodenum = numnodes-1;

    while (! (nodenum & NF_SUBSECTOR) )
    {
	node = &nodes[nodenum];
	side = R_PointOnSide (x, y, node);
	nodenum = node->children[side];
    }

    return &subsectors[nodenum & ~NF_SUBSECTOR];
}
