# Builds the headless vanilla-DOOM reference (doomref.exe).
# Compiles the real linuxdoom-1.10 playsim + support TUs, plus our harness/stubs,
# and links them. Objects go to build/ so the submodule stays clean.

# 32-bit build is REQUIRED: linuxdoom-1.10 puns ints and pointers throughout
# (the zone allocator, R_PointInSubsector, node flags), which truncates on x64.
$vc   = "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars32.bat"
$here = "C:\Users\gregg\src\webgpu-doom\tools\doomref"
$doom = "C:\Users\gregg\src\webgpu-doom\DOOM\linuxdoom-1.10"
$shim = "$here\shim"
$build = "$here\build"
New-Item -ItemType Directory -Force -Path $build | Out-Null

# Real sim + support translation units (compiled from the submodule as-is).
$sim = @(
  'p_ceilng','p_doors','p_floor','p_lights','p_maputl',
  'p_plats','p_pspr','p_setup','p_sight','p_spec','p_switch','p_telept',
  'p_tick','p_saveg','m_fixed','m_bbox','m_swap','m_misc',
  'm_argv','m_cheat','tables','info','sounds','d_items','doomstat','z_zone','g_game'
) | ForEach-Object { "$_.c" }

$cflags = "/nologo /c /Zi /Od /I. /I`"$shim`" /DNORMALUNIX /D_CRT_SECURE_NO_WARNINGS /D_CRT_NONSTDC_NO_WARNINGS /wd4013 /wd4090 /wd4101 /wd4244 /wd4267 /wd4996 /Fd`"$build\ref.pdb`""

# One cl call for the whole submodule batch (cwd = $doom, relative names).
$c1 = "cl $cflags /Fo`"$build\\`" " + ($sim -join ' ')
# Patched w_wad + our three files.
$c2 = "cl $cflags /Fo`"$build\w_wad.obj`" `"$build\w_wad.c`""
$c2b = "cl $cflags /Fo`"$build\m_random.obj`" `"$build\m_random.c`" && cl $cflags /Fo`"$build\p_mobj.obj`" `"$build\p_mobj.c`" && cl $cflags /Fo`"$build\p_inter.obj`" `"$build\p_inter.c`" && cl $cflags /Fo`"$build\p_enemy.obj`" `"$build\p_enemy.c`" && cl $cflags /Fo`"$build\p_map.obj`" `"$build\p_map.c`" && cl $cflags /Fo`"$build\p_user.obj`" `"$build\p_user.c`""
$c3 = "cl $cflags /Fo`"$build\\`" `"$here\r_geom.c`" `"$here\stubs.c`" `"$here\globals.c`" `"$here\harness.c`""
$lk = "link /nologo /DEBUG /OUT:`"$build\doomref.exe`" `"$build\*.obj`""

$script = "call `"$vc`" >nul 2>&1 && cd /d `"$doom`" && $c1 && $c2 && $c2b && $c3 && $lk"
cmd /c $script 2>&1
"---exit: $LASTEXITCODE"
