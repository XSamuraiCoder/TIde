var e=`;\r
;       TI83 SYSTEM ROUTINE EQUATES\r
;\r
_CLRLCDFULL             equ     4755h\r
_clrScrnFull            equ     475Dh\r
_CLRTXTSHD              equ     4765h\r
_dispDone               equ     47F1h\r
_dispHL                 equ     4709h\r
_DISPOP1A               equ     51D4h\r
_eraseEOL               equ     476Dh\r
_formDCplx              equ     4D2Eh\r
_formReal               equ     4D32h\r
_GDISPTOKEN             equ     4B20h\r
_homeUp                 equ     4775h\r
_lcd_busy               equ     4066h\r
_moveup                 equ     474Dh\r
_newline                equ     473Dh\r
_outputExpr             equ     5106h\r
_putc                   equ     4705h\r
_putmap                 equ     4701h\r
_putps                  equ     4715h\r
_puts                   equ     470Dh\r
_runIndicOff            equ     4795h\r
_runIndicOn             equ     4791h\r
_scrollDown             equ     4751h\r
_scrollUp               equ     4745h\r
_setPenT                equ     51B9h\r
_setPenX                equ     51A7h\r
_setPenY                equ     51B0h\r
_SFONT_LEN              equ     4A6Ch\r
_VPUTBLANK              equ     4C53h\r
_vputmap                equ     477Dh\r
_vputs                  equ     4781h\r
_vputsn                 equ     4785h\r
_Axes                   equ     519Eh\r
_CLine                  equ     4A84h\r
_CPointS                equ     4B00h\r
_GRBUFCLR               equ     515Bh\r
_GRBUFCPY_V             equ     5164h\r
_HORIZCMD               equ     4BEFh\r
_ILINE                  equ     4AE4h\r
_IPOINT                 equ     4AE8h\r
_moveDown               equ     4741h\r
_PDspGrph               equ     4BEBh\r
_PUTXY                  equ     4BE4h\r
_REGRAPH                equ     4BCCh\r
_VERTCMD                equ     4BF3h\r
_GetK                   equ     4A18h\r
_getkey                 equ     4CFEh\r
_ADRLELE                equ     489Dh\r
_GETLTOOP1              equ     48A9h\r
_PUTTOL                 equ     48BDh\r
_ADRMELE                equ     486Dh\r
_GETMTOOP1              equ     487Dh\r
_PUTTOMAT               equ     4889h\r
_ACOS                   equ     4122h\r
_ACOSH                  equ     413Ah\r
_ANGLE                  equ     4152h\r
_ASIN                   equ     412Ah\r
_ASINH                  equ     4136h\r
_ATAN                   equ     4126h\r
_ATANH                  equ     4132h\r
_Ceiling                equ     4BE0h\r
_COS                    equ     40FAh\r
_COSH                   equ     410Ah\r
_CUBE                   equ     409Eh\r
_DTOR                   equ     4096h\r
_ETOX                   equ     40EAh\r
_FACTORIAL              equ     50C6h\r
_FPADD                  equ     4092h\r
_FPDIV                  equ     40C6h\r
_FPMULT                 equ     40AAh\r
_FPRECIP                equ     40C2h\r
_FPSQUARE               equ     40A6h\r
_FPSUB                  equ     408Eh\r
_FRAC                   equ     40BEh\r
_INT                    equ     40D6h\r
_INTGR                  equ     4076h\r
_INVOP1SC               equ     40B2h\r
_INVSUB                 equ     407Eh\r
_LNX                    equ     40DEh\r
_LOGX                   equ     40E2h\r
_MAX                    equ     406Eh\r
_MIN                    equ     406Ah\r
_MINUS1                 equ     408Ah\r
_PLUS1                  equ     4086h\r
_PTOR                   equ     413Eh\r
_RANDOM                 equ     50B6h\r
_RNDGUARD               equ     40CEh\r
_ROUND                  equ     40DAh\r
_RTOD                   equ     409Ah\r
_RTOP                   equ     4142h\r
_SIN                    equ     40F6h\r
_SINH                   equ     410Eh\r
_SQROOT                 equ     40CAh\r
_STORAND                equ     50BAh\r
_TAN                    equ     40FEh\r
_TANH                   equ     4106h\r
_TENX                   equ     40EEh\r
_TIMES2                 equ     4082h\r
_TIMESPT5               equ     40A2h\r
_TRUNC                  equ     407Ah\r
_XROOTY                 equ     4A8Ch\r
_YTOX                   equ     4A90h\r
_CHKFINDSYM             equ     442Ah\r
_DELVAR                 equ     44AAh\r
_RCLSYSTOK              equ     4EF0h\r
_RCLVARSYM              equ     4EECh\r
_RCLX                   equ     4EE8h\r
_RCLY                   equ     4EE0h\r
_RSTRSHADOW             equ     47A1h\r
_SAVESHADOW             equ     479Dh\r
_STOOTHER               equ     4ED8h\r
_STOSYSTOK              equ     4EB8h\r
_STOX                   equ     4ED4h\r
_STOY                   equ     4EC8h\r
_CKINT                  equ     4322h\r
_CKODD                  equ     4326h\r
_CKOP1FP0               equ     4312h\r
_CKOP1POS               equ     435Ah\r
_CKOP1REAL              equ     414Eh\r
_CKOP2FP0               equ     4316h\r
_CKOP2POS               equ     4356h\r
_CKOP2REAL              equ     4412h\r
_CKPOSINT               equ     431Eh\r
_CLROP1S                equ     4362h\r
_CLROP2S                equ     435Eh\r
_CONVOP1                equ     4EFCh\r
_cphlde                 equ     4004h\r
_CPOP1OP2               equ     4166h\r
_divHLbyA               equ     400Ch\r
_HTIMESL                equ     4382h\r
_INVOP1S                equ     40B6h\r
_INVOP2S                equ     40BAh\r
_ldHLind                equ     4000h\r
_MOVFROP1               equ     4212h\r
_OP1EXOP2               equ     4306h\r
_OP1EXOP3               equ     42FEh\r
_OP1EXOP4               equ     4302h\r
_OP1EXOP5               equ     42EEh\r
_OP1EXOP6               equ     42F2h\r
_OP1SET0                equ     4286h\r
_OP1SET1                equ     4232h\r
_OP1SET2                equ     4242h\r
_OP1SET3                equ     423Ah\r
_OP1SET4                equ     4236h\r
_OP1TOOP2               equ     418Eh\r
_OP1TOOP3               equ     417Eh\r
_OP1TOOP4               equ     416Eh\r
_OP1TOOP5               equ     41BEh\r
_OP1TOOP6               equ     41BAh\r
_OP2EXOP4               equ     42F6h\r
_OP2EXOP5               equ     42FAh\r
_OP2EXOP6               equ     42E6h\r
_OP2SET0                equ     4282h\r
_OP2SET1                equ     4252h\r
_OP2SET2                equ     4246h\r
_OP2SET3                equ     422Eh\r
_OP2SET4                equ     422Ah\r
_OP2SET5                equ     4222h\r
_OP2SET60               equ     4EA8h\r
_OP2SET8                equ     421Eh\r
_OP2SETA                equ     4226h\r
_OP2TOOP1               equ     41C2h\r
_OP2TOOP3               equ     41F6h\r
_OP2TOOP4               equ     4172h\r
_OP2TOOP5               equ     41B2h\r
_OP2TOOP6               equ     41B6h\r
_OP3SET0                equ     427Eh\r
_OP3SET1                equ     421Ah\r
_OP3SET2                equ     423Eh\r
_OP3TOOP1               equ     41A2h\r
_OP3TOOP2               equ     417Ah\r
_OP3TOOP4               equ     416Ah\r
_OP3TOOP5               equ     41AEh\r
_OP4SET0                equ     427Ah\r
_OP4SET1                equ     4216h\r
_OP4TOOP1               equ     419Ah\r
_OP4TOOP2               equ     4176h\r
_OP4TOOP3               equ     41FAh\r
_OP4TOOP5               equ     41AAh\r
_OP4TOOP6               equ     4202h\r
_OP5EXOP6               equ     42EAh\r
_OP5SET0                equ     4276h\r
_OP5TOOP1               equ     419Eh\r
_OP5TOOP2               equ     4182h\r
_OP5TOOP3               equ     41FEh\r
_OP5TOOP4               equ     418Ah\r
_OP5TOOP6               equ     4186h\r
_OP6TOOP1               equ     4196h\r
_OP6TOOP2               equ     4192h\r
_OP6TOOP5               equ     41A6h\r
_PUSHREALO1             equ     4536h\r
_SETXXOP1               equ     4A74h\r
_SETXXOP2               equ     4A78h\r
_SETXXXXOP2             equ     4A7Ch\r
_ZEROOOP1               equ     428Eh\r
\r
;\r
;       OP1 TO OP6 RAM EQUATES\r
;\r
OP2         EQU                 8044h\r
op2exp      equ                 8045h\r
op2m        equ                 8046H\r
OP1M        EQU                 803Bh\r
OP1         EQU                 8039h\r
OP3         EQU                 804Fh\r
OP3EXP      EQU                 8050h\r
OP3EXT      EQU                 8058h\r
OP3M        EQU                 8051h\r
OP4         EQU                 805Ah\r
OP4EXP      EQU                 805Bh\r
OP4EXT      EQU                 8063h\r
OP4M        EQU                 805Ch\r
OP5         EQU                 8065h\r
OP5EXP      EQU                 8066h\r
OP5EXT      EQU                 806Eh\r
OP5M        EQU                 8067h\r
OP6         EQU                 8070h\r
OP6EXP      EQU                 8071h\r
OP6EXT      EQU                 8079h\r
OP6M        EQU                 8072h\r
;\r
;       POINTERS\r
;\r
IMATHPTR1   EQU                 8094h\r
IMATHPTR2   EQU                 8096h\r
IMATHPTR3   EQU                 8098h\r
IMATHPTR4   EQU                 809Ah\r
IMATHPTR5   EQU                 809Ch\r
;\r
;       POIONTER TO START OF PROGRAM/LIST SYMBOL ENTRIES\r
;\r
PROGPTR     EQU                 9319h\r
;\r
;       ADDRESS OF LCD DRIVER INSTRUCTION PORT\r
;\r
LCDINSTPORT  EQU                10h\r
;\r
;       SCREEN SHADOWS\r
;\r
TEXTSHADOW  EQU                 80C9h\r
CMDSHADOW   EQU                 9157h\r
;\r
;       GRAPH BACKUP BUFFER\r
;\r
PLOTSSCREEN EQU                 8E29h\r
;\r
;       SAFE RAM LOCATIONS\r
;\r
SAVESSCREEN EQU                 8265h\r
STATVARS    EQU                 858Fh\r
;\r
;       START OF SYMBOL TABLE\r
;\r
SYMTABLE    EQU                 0FE6Eh\r
;\r
;       RAM EQUATES DEALING WITH DISPLAY ROUTINES\r
;\r
CURROW      EQU                 800Ch\r
CURCOL      EQU                 800Dh\r
PENCOL      EQU                 8252h\r
PENROW      EQU                 8253h\r
CURGY       EQU                 886Dh\r
CURGX       EQU                 886Eh\r
;\r
;       INDIRECT CALL BYTE\r
;\r
ASM_IND_CALL    EQU             80C8h\r
;\r
;       LINK PORT WRITE EQUATES\r
;\r
D0LD1L      EQU              0C3h\r
D0LD1H      EQU              0C1h\r
D0HD1L      EQU              0C2h\r
D0HD1H      EQU              0C0h\r
BPORT       EQU              0\r
;\r
;       SYSTEM FLAG EQUATES\r
;       ALL OF THESE FLAGS CAN BE ACCESSED THROUGH THE 'IY' REGISTER\r
;\r
trigflags       EQU       0           ; IY OFFSET VALUE\r
trigdeg         EQU       2\r
;\r
plotflags       EQU       2           ; IY OFFSET VALUE\r
plotloc         EQU       1\r
plotdisp        EQU       2\r
;\r
grfmodeflags    EQU       2           ; IY OFFSET VALUE\r
grffuncm        EQU       4\r
grfpolarm       EQU       5\r
grfparamm       EQU       6\r
grfrecurm       EQU       7\r
;\r
graphflags      EQU       3           ; IY OFFSET VALUE\r
graphdraw       EQU       0\r
graphcursor     EQU       2\r
;\r
grfdbflags      EQU       4           ; IY OFFSET VALUE\r
grfdot          EQU       0\r
grfsimul        EQU       1\r
grfgrid         EQU       2\r
grfpolar        EQU       3\r
grfnocoord      EQU       4\r
grfnoaxis       EQU       5\r
grflabel        EQU       6\r
;\r
textflags       EQU       5           ; IY OFFSET VALUE\r
textEraseBelow  EQU       1\r
textScrolled    EQU       2\r
textInverse     EQU       3\r
;\r
onflags         EQU       9           ; IY OFFSET VALUE\r
onRunning       EQU       3\r
onInterrupt     EQU       4\r
;\r
statflags       EQU       9           ; IY OFFSET VALUE\r
statsvalid      EQU       6\r
;\r
fmtflags        EQU       10          ; IY OFFSET VALUE\r
fmtExponent     EQU       0\r
fmtEng          EQU       1\r
;\r
nummode         EQU       10          ; IY OFFSET VALUE\r
FMTREAL         EQU       5\r
FMTRECT         EQU       6\r
FMTPOLAR        EQU       7\r
;\r
curflags        EQU       12          ; IY OFFSET VALUE\r
curAble         EQU       2\r
curOn           EQU       3\r
curLock         EQU       4\r
;\r
appflags        EQU       13          ; IY OFFSET VALUE\r
appTextSave     EQU       1\r
appAutoScroll   EQU       2\r
;\r
PLOTFLAG2       EQU       17          ; IY OFFSET VALUE\r
EXPR_PARAM      EQU       3\r
EXPR_WRITING    EQU       4\r
;\r
indicflags      EQU       18          ; IY OFFSET VALUE\r
indicRun        EQU       0\r
indicOnly       EQU       2\r
;\r
shiftflags      EQU       18          ; IY OFFSET VALUE\r
shift2nd        EQU       3\r
shiftAlpha      EQU       4\r
shiftALock      EQU       6\r
;\r
tblflags        EQU       19          ; IY OFFSET VALUE\r
AutoFill        EQU       4\r
AutoCalc        EQU       5\r
;\r
sgrflags        EQU       20          ; IY OFFSET VALUE\r
grfSplit        EQU       0\r
VertSplit       EQU       1\r
WRITE_ON_GRAPH  EQU       4\r
textwrite       EQU       7\r
;\r
asm_flag1       EQU       33          ; IY OFFSET VALUE\r
asm_flag1_0     EQU       0\r
asm_flag1_1     EQU       1\r
asm_flag1_2     EQU       2\r
asm_flag1_3     EQU       3\r
asm_flag1_4     EQU       4\r
asm_flag1_5     EQU       5\r
asm_flag1_6     EQU       6\r
asm_flag1_7     EQU       7\r
;\r
asm_flag2       EQU       34          ; IY OFFSET VALUE\r
asm_flag2_0     EQU       0\r
asm_flag2_1     EQU       1\r
asm_flag2_2     EQU       2\r
asm_flag2_3     EQU       3\r
asm_flag2_4     EQU       4\r
asm_flag2_5     EQU       5\r
asm_flag2_6     EQU       6\r
asm_flag2_7     EQU       7\r
;\r
asm_flag3       EQU       35          ; IY OFFSET VALUE\r
asm_flag3_0     EQU       0\r
asm_flag3_1     EQU       1\r
asm_flag3_2     EQU       2\r
asm_flag3_3     EQU       3\r
asm_flag3_4     EQU       4\r
asm_flag3_5     EQU       5\r
asm_flag3_6     EQU       6\r
asm_flag3_7     EQU       7\r
;\r
;       SYSTEM VAR EQUATES, FOR STORING AND RECALLING THEM\r
;\r
XSCLt       EQU  2        ; XSCALE\r
YSCLt       EQU  3        ; YSCALE\r
XMINt       EQU  0AH      ; XMIN\r
XMAXt       EQU  0BH      ; XMAX\r
YMINt       EQU  0CH      ; YMIN\r
YMAXt       EQU  0DH      ; XMAX\r
TMINt       EQU  0EH      ; TMIN\r
TMAXt       EQU  0FH      ; TMAX\r
THETMINt    EQU  10H      ; THETA MIN\r
THETMAXt    EQU  11H      ; THETA MAX\r
TBLMINt     EQU  1AH      ; TABLE MIN\r
PLOTSTARTt  EQU  1BH      ; PLOT START\r
NMAXt       EQU  1DH      ; NMAX\r
nmint       EQU  1FH      ; NMIN\r
TBLSTEPt    EQU  21H      ; TABLE STEP\r
TSTEPt      EQU  22H      ; T STEP\r
THETSTEPt   EQU  23H      ; THETA STEP\r
DELTAXt     EQU  26H      ; DELTA X\r
DELTAYt     EQU  27H      ; DELTA Y\r
XFACTt      EQU  28H      ; X ZOOM FACTOR\r
YFACTt      EQU  29H      ; Y ZOOM FACTOR\r
FINnT       EQU  2Bh      ; TVM n\r
FINiT       EQU  2Ch      ; TVM i\r
FINpvT      EQU  2Dh      ; TVM pv\r
FINpmtT     EQU  2Eh      ; TVM pmt\r
FINfvT      EQU  2Fh      ; TVM fv\r
FINpyT      EQU  30h      ; TVM p/y\r
FINcyT      EQU  31h      ; TVM c/y\r
PLOTSTEPT   EQU  34h      ; PLOT STEP\r
XREST       EQU  36h      ; X RES\r
\r
\r
\r
\r
\r
\r
\r
\r
\r
\r
\r
\r
\r
\r
\r
\r
\r
;\r
;       CHARACTER FONT EQUATES\r
;\r
LSEQ_N          equ     001h\r
LSEQ_U          equ     002h\r
LSEQ_V          equ     003h\r
LSEQ_W          equ     004h\r
Lconvert        equ     005h\r
LsqUp           equ     006h\r
LsqDown         equ     007h\r
Lintegral       equ     008h\r
Lcross          equ     009h\r
LBOXICON        equ     00Ah\r
LCROSSICON      equ     00Bh\r
LDOTICON        equ     00Ch\r
LsubT           equ     00Dh            ;small capital T for parametric mode.\r
LcubeR          equ     00Eh            ;slightly different 3 for cubed root.\r
LhexF           equ     00Fh\r
Lroot           equ     010h\r
Linverse        equ     011h\r
Lsquare         equ     012h\r
Langle          equ     013h\r
Ldegree         equ     014h\r
Lradian         equ     015h\r
Ltranspose      equ     016h\r
LLE             equ     017h\r
LNE             equ     018h\r
LGE             equ     019h\r
Lneg            equ     01Ah\r
Lexponent       equ     01Bh\r
Lstore          equ     01Ch\r
Lten            equ     01Dh\r
LupArrow        equ     01Eh\r
LdownArrow      equ     01Fh\r
Lspace          equ     020h\r
Lexclam         equ     021h\r
Lquote          equ     022h\r
Lpound          equ     023h\r
LFOURTH         equ     024h\r
Lpercent        equ     025h\r
Lampersand      equ     026h\r
Lapostrophe     equ     027h\r
LlParen         equ     028h\r
LrParen         equ     029h\r
Lasterisk       equ     02Ah\r
LplusSign       equ     02Bh\r
Lcomma          equ     02Ch\r
Ldash           equ     02Dh\r
Lperiod         equ     02Eh\r
Lslash          equ     02Fh\r
L0              equ     030h\r
L1              equ     031h\r
L2              equ     032h\r
L3              equ     033h\r
L4              equ     034h\r
L5              equ     035h\r
L6              equ     036h\r
L7              equ     037h\r
L8              equ     038h\r
L9              equ     039h\r
Lcolon          equ     03Ah\r
Lsemicolon      equ     03Bh\r
LLT             equ     03Ch\r
LEQ             equ     03Dh\r
LGT             equ     03Eh\r
Lquestion       equ     03Fh\r
LatSign         equ     040h\r
LcapA           equ     041h\r
LcapB           equ     042h\r
LcapC           equ     043h\r
LcapD           equ     044h\r
LcapE           equ     045h\r
LcapF           equ     046h\r
LcapG           equ     047h\r
LcapH           equ     048h\r
LcapI           equ     049h\r
LcapJ           equ     04Ah\r
LcapK           equ     04Bh\r
LcapL           equ     04Ch\r
LcapM           equ     04Dh\r
LcapN           equ     04Eh\r
LcapO           equ     04Fh\r
LcapP           equ     050h\r
LcapQ           equ     051h\r
LcapR           equ     052h\r
LcapS           equ     053h\r
LcapT           equ     054h\r
LcapU           equ     055h\r
LcapV           equ     056h\r
LcapW           equ     057h\r
LcapX           equ     058h\r
LcapY           equ     059h\r
LcapZ           equ     05Ah\r
Ltheta          equ     05Bh\r
Lbackslash      equ     05Ch\r
LrBrack         equ     05Dh\r
Lcaret          equ     05Eh\r
Lunderscore     equ     05Fh\r
Lbackquote      equ     060h\r
La              equ     061h\r
Lb              equ     062h\r
Lc              equ     063h\r
Ld              equ     064h\r
Le              equ     065h\r
Lf              equ     066h\r
Lg              equ     067h\r
Lh              equ     068h\r
Li              equ     069h\r
Lj              equ     06Ah\r
Lk              equ     06Bh\r
Ll              equ     06Ch\r
Lm              equ     06Dh\r
Ln              equ     06Eh\r
Lo              equ     06Fh\r
Lp              equ     070h\r
Lq              equ     071h\r
Lr              equ     072h\r
Ls              equ     073h\r
Lt              equ     074h\r
Lu              equ     075h\r
Lv              equ     076h\r
Lw              equ     077h\r
Lx              equ     078h\r
Ly              equ     079h\r
Lz              equ     07Ah\r
LlBrace         equ     07Bh\r
Lbar            equ     07Ch\r
LrBrace         equ     07Dh\r
Ltilde          equ     07Eh\r
LinvEQ          equ     07Fh\r
Lsub0           equ     080h\r
Lsub1           equ     081h\r
Lsub2           equ     082h\r
Lsub3           equ     083h\r
Lsub4           equ     084h\r
Lsub5           equ     085h\r
Lsub6           equ     086h\r
Lsub7           equ     087h\r
Lsub8           equ     088h\r
Lsub9           equ     089h\r
LcapAAcute      equ     08Ah\r
LcapAGrave      equ     08Bh\r
LcapACaret      equ     08Ch\r
LcapADier       equ     08Dh\r
LaAcute         equ     08Eh\r
LaGrave         equ     08Fh\r
LaCaret         equ     090h\r
LaDier          equ     091h\r
LcapEAcute      equ     092h\r
LcapEGrave      equ     093h\r
LcapECaret      equ     094h\r
LcapEDier       equ     095h\r
LeAcute         equ     096h\r
LeGrave         equ     097h\r
LeCaret         equ     098h\r
LeDier          equ     099h\r
LcapIAcute      equ     09Ah\r
LcapIGrave      equ     09Bh\r
LcapICaret      equ     09Ch\r
LcapIDier       equ     09Dh\r
LiAcute         equ     09Eh\r
LiGrave         equ     09Fh\r
LiCaret         equ     0A0h\r
LiDier          equ     0A1h\r
LcapOAcute      equ     0A2h\r
LcapOGrave      equ     0A3h\r
LcapOCaret      equ     0A4h\r
LcapODier       equ     0A5h\r
LoAcute         equ     0A6h\r
LoGrave         equ     0A7h\r
LoCaret         equ     0A8h\r
LoDier          equ     0A9h\r
LcapUAcute      equ     0AAh\r
LcapUGrave      equ     0ABh\r
LcapUCaret      equ     0ACh\r
LcapUDier       equ     0ADh\r
LuAcute         equ     0AEh\r
LuGrave         equ     0AFh\r
LuCaret         equ     0B0h\r
LuDier          equ     0B1h\r
LcapCCed        equ     0B2h\r
LcCed           equ     0B3h\r
LcapNTilde      equ     0B4h\r
LnTilde         equ     0B5h\r
Laccent         equ     0B6h\r
Lgrave          equ     0B7h\r
Ldieresis       equ     0B8h\r
LquesDown       equ     0B9h\r
LexclamDown     equ     0BAh\r
Lalpha          equ     0BBh\r
Lbeta           equ     0BCh\r
Lgamma          equ     0BDh\r
LcapDelta       equ     0BEh\r
Ldelta          equ     0BFh\r
Lepsilon        equ     0C0h\r
LlBrack         equ     0C1h\r
Llambda         equ     0C2h\r
Lmu             equ     0C3h\r
Lpi             equ     0C4h\r
Lrho            equ     0C5h\r
LcapSigma       equ     0C6h\r
Lsigma          equ     0C7h\r
Ltau            equ     0C8h\r
Lphi            equ     0C9h\r
LcapOmega       equ     0CAh\r
LxMean          equ     0CBh\r
LyMean          equ     0CCh\r
LsupX           equ     0CDh\r
Lellipsis       equ     0CEh\r
Lleft           equ     0CFh\r
Lblock          equ     0D0h\r
Lper            equ     0D1h\r
Lhyphen         equ     0D2h\r
Larea           equ     0D3h\r
Ltemp           equ     0D4h\r
Lcube           equ     0D5h\r
Lenter          equ     0D6h\r
LimagI          equ     0D7h\r
Lphat           equ     0D8h\r
Lchi            equ     0D9h\r
LstatF          equ     0DAh\r
Llne            equ     0DBh\r
LlistL          equ     0DCh\r
LfinanN         equ     0DDh\r
`;export{e as default};