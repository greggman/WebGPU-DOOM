$vc = "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars32.bat"
cmd /c "`"$vc`" && cl /nologo /O2 /D_CRT_SECURE_NO_WARNINGS oplref.c opl3.c /Fe:oplref.exe"
