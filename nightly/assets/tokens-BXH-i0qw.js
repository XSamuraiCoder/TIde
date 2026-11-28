var e=`.NOLIST\r
;                                             length (+80h for leading blank)\r
;       # TOKENS IN USE = 249\r
;						     (+40h for trailing blank)\r
EOSSTART        EQU       0\r
;\r
;\r
;   DISPLAY CONVERSIONS  COME IMMEDIATELY BEFORE 'TSTORE'\r
;\r
DCONV   EQU     01H\r
;\r
TTODMS          equ       DCONV       ; 01H\r
TTODEC          equ       DCONV+1     ; 02H\r
TTOAbc          EQU       DCONV+2     ; 03H    > A b/c\r
;\r
TSTORE          equ       DCONV+3     ; 04H Lstore                01\r
;\r
TBOXPLOT        EQU       05h\r
;\r
BRACKS          EQU       06H\r
;\r
tLBrack         equ       BRACKS      ; 06h '['\r
tRBrack         equ       BRACKS+1    ; 07h ']'\r
tLBrace         equ       BRACKS+2    ; 08h '{'\r
tRBrace         equ       BRACKS+3    ; 09h '}'\r
;\r
TPOST1          EQU       BRACKS+4\r
;\r
tFromRad        equ       TPOST1       ; 0Ah Lradian\r
tFromDeg        equ       TPOST1+1     ; 0Bh Ldegree\r
tRecip          equ       TPOST1+2     ; 0Ch Linverse\r
tSqr            equ       TPOST1+3     ; 0Dh Lsquare\r
tTrnspos        equ       TPOST1+4     ; 0Eh Ltranspose\r
TCUBE           EQU       TPOST1+5     ; 0Fh '^3'\r
;\r
tLParen         equ       10H         ; 10h '('\r
tRParen         equ       11H         ; 11h ')'\r
;\r
;\r
;   IMMEDIATE UNARY TOKENS GO FROM HERE TO 'EOSEL-1'\r
;\r
IMUN            EQU       12H\r
;\r
tRound          equ       IMUN        ; 12h 'round'\r
TPXTST          equ       IMUN+1      ; 13h 'PXL-TEST'\r
tAug            equ       IMUN+2      ; 14h 'aug'\r
tRowSwap        EQU       IMUN+3      ; 15h 'rSwap'\r
tRowPlus        equ       IMUN+4      ; 16h 'rAdd'\r
tmRow           EQU       IMUN+5      ; 17h 'multR'\r
tmRowPlus       EQU       IMUN+6      ; 18h 'mRAdd'\r
tMax            equ       IMUN+7      ; 19H 'max'\r
tMin            equ       IMUN+8      ; 1AH 'min'\r
TRTOPr          EQU       IMUN+9      ; 1BH 'R>Pr\r
TRTOPo          EQU       IMUN+10     ; 1CH 'R>Po\r
TPTORx          EQU       IMUN+11     ; 1DH 'P>Rx\r
TPTORy          EQU       IMUN+12     ; 1EH 'P>Ry\r
tMEDIAN         equ       IMUN+13     ; 1Fh 'MEDIAN\r
tRandM          equ       IMUN+14     ; 20h 'randM'\r
TMEAN           EQU       IMUN+15     ; 21h\r
TROOT           EQU       IMUN+16     ; 22h 'ROOT'\r
tSeries         equ       IMUN+17     ; 23h 'seq'\r
tFnInt          equ       IMUN+18     ; 24h 'fnInt'\r
tNDeriv         equ       IMUN+19     ; 25h 'fnIr'\r
TEVALF          EQU       IMUN+20     ; 26h\r
TFMIN           EQU       IMUN+21     ; 27h\r
TFMAX           EQU       IMUN+22     ; 28h\r
;\r
;\r
;\r
;  TOKEN 29H CANNOT BE AN EOS FUNCTION SINCE EL(=29H ALREADY\r
;\r
tEOSEL          EQU       IMUN+23\r
;\r
TSPACE          EQU       tEOSEL       ; 29h   ' '\r
tString         equ       tEOSEL+1     ; 2Ah  '"'\r
tComma          equ       tEOSEL+2     ; 2Bh  ','\r
;\r
;\r
;\r
Tii             equ       2Ch         ; i\r
;\r
; ===== Postfix functions\r
;\r
TPOST           EQU       2Dh\r
;\r
tFact           equ       TPOST       ; 2Dh '!'\r
\r
\r
\r
TCUBICR         EQU       2Eh\r
TQUARTR         EQU       2Fh\r
\r
;\r
;       NUMBER TOKENS\r
;\r
NUMS            EQU       30h\r
;\r
T0              EQU       NUMS        ; 30h\r
T1              EQU       NUMS+1      ; 31h\r
T2              EQU       NUMS+2      ; 32h\r
T3              EQU       NUMS+3      ; 33h\r
T4              EQU       NUMS+4      ; 34h\r
T5              EQU       NUMS+5      ; 35h\r
T6              EQU       NUMS+6      ; 36h\r
T7              EQU       NUMS+7      ; 37h\r
T8              EQU       NUMS+8      ; 38h\r
T9              EQU       NUMS+9      ; 39h\r
TDECPT          EQU       NUMS+10     ; 3Ah\r
Tee             EQU       NUMS+11     ; 3Bh\r
;\r
;   BINARY OP\r
;\r
tOr             equ       3Ch         ; 3Ch  '_or_'\r
TXOR            equ       3Dh         ; 3Dh\r
;\r
tColon          equ       3Eh         ; 3Eh ':'\r
tEnter          equ       3Fh         ; 3Fh  Lenter\r
;\r
;   BINARY OP\r
;\r
tAnd            equ       40h         ; 40h  '_and_'               05\r
;\r
;       LETTER TOKENS\r
;\r
LET             EQU       41h\r
;\r
TA              EQU       LET         ; 41h\r
TB              EQU       LET+1       ; 42h\r
TC              EQU       LET+2       ; 43h\r
TD              EQU       LET+3       ; 44h\r
TE              EQU       LET+4       ; 45h\r
TF              EQU       LET+5       ; 46h\r
TG              EQU       LET+6       ; 47h\r
TH              EQU       LET+7       ; 48h\r
TI              EQU       LET+8       ; 49h\r
TJ              EQU       LET+9       ; 4Ah\r
TK              EQU       LET+10      ; 4Bh\r
TL              EQU       LET+11      ; 4Ch\r
TM              EQU       LET+12      ; 4Dh\r
TN              EQU       LET+13      ; 4Eh\r
TO              EQU       LET+14      ; 4Fh\r
TP              EQU       LET+15      ; 50h\r
TQ              EQU       LET+16      ; 51h\r
TR              EQU       LET+17      ; 52h\r
TS              EQU       LET+18      ; 53h\r
TT              EQU       LET+19      ; 54h\r
TU              EQU       LET+20      ; 55h\r
TV              EQU       LET+21      ; 56h\r
TW              EQU       LET+22      ; 57h\r
TX              EQU       LET+23      ; 58h\r
TY              EQU       LET+24      ; 59h\r
TZ              EQU       LET+25      ; 5Ah\r
TTHETA          EQU       LET+26      ; 5Bh\r
;\r
;\r
;   THESE VAR TOKENS ARE 1ST OF A DOUBLE TOKEN\r
;\r
;   SEE 'VARS.DOC' FOR MORE INFO ON VARS\r
;\r
VTOKS   EQU     LET+27    ;\r
;\r
;       USER MATRIX TOKEN, 2ND TOKEN NEEDED FOR NAME\r
;\r
TVARMAT         EQU       VTOKS       ; 5Ch\r
;\r
;       USER LIST TOKEN, 2ND TOKEN NEEDED FOR NAME\r
;\r
TVARLST         EQU       VTOKS+1     ; 5Dh\r
;\r
;       USER EQUATION TOKEN, 2ND TOKEN NEEDED FOR NAME\r
;\r
TVAREQU         EQU       VTOKS+2     ; 5Eh\r
;\r
;       THIS IS A SINGLE TOKEN, I WILL HAVE TO READ THE NAME IN\r
;       EVERY SINGLE TIME I EXECUTE\r
;\r
TPROG           EQU       VTOKS+3     ; 5Fh\r
;\r
;       USER PICT TOKEN, 2ND TOKEN NEEDED FOR NAME\r
;\r
TVARPICT        EQU       VTOKS+4     ; 60h\r
;\r
;       USER GDB TOKEN, 2ND TOKEN NEEDED FOR NAME\r
;\r
TVARGDB         EQU       VTOKS+5     ; 61h\r
;\r
;       SYSTEM VARS THAT ARE USED FOR OUTPUT ONLY\r
;       CANNOT BE STORED TO BY THE USER\r
;\r
tVarOut         equ       VTOKS+6     ; 62h\r
;\r
;       SYSTEM VARS THAT ARE NOT IN THE SYMBOL TABLE\r
;       BUT THE USER CAN STORE TO THEM.\r
;\r
tVarSys         equ       VTOKS+7     ; 63h\r
;\r
;\r
; ===== Mode setting commands\r
;\r
MODESA          EQU       VTOKS+8     ; 64h\r
;\r
tRad            equ       MODESA      ; 64h 'Radian'\r
tDeg            equ       MODESA+1    ; 65h 'Degree'\r
tNormF          equ       MODESA+2    ; 66h 'Normal'\r
tSci            equ       MODESA+3    ; 67h 'Sci'\r
tEng            equ       MODESA+4    ; 68h 'Eng'\r
tFloat          equ       MODESA+5    ; 69h 'Float'\r
;\r
CMPS            EQU       6Ah\r
;\r
tEQ             equ       CMPS        ; 6Ah '=='\r
tLT             equ       CMPS+1      ; 6Bh '<'\r
tGT             equ       CMPS+2      ; 6Ch '>'\r
tLE             equ       CMPS+3      ; 6Dh LLE\r
tGE             equ       CMPS+4      ; 6Eh LGE\r
tNE             equ       CMPS+5      ; 6Fh LNE\r
;\r
;   BINARY OP\r
;\r
tAdd            equ       70h         ; 70h '+'\r
tSub            equ       71h         ; 71h '-'\r
;\r
TANS            EQU       72H         ; 72h\r
;\r
; ===== Mode setting commands\r
;\r
MODES           EQU       73h\r
;\r
tFix            equ       MODES       ; 73h 'Fix_'\r
TSPLITON        equ       MODES+1     ; 74h\r
TFULLSCREEN     EQU       MODES+2     ; 75h\r
tStndrd         EQU       MODES+3     ; 76h 'Func'\r
tParam          equ       MODES+4     ; 77h 'Param'\r
tPolar          EQU       MODES+5     ; 78h 'Pol'\r
TSEQG           equ       MODES+6     ; 79h\r
TAFILLON        equ       MODES+7     ; 7Ah 'AUTO FILL ON\r
TAFILLOFF       equ       MODES+8     ; 7Bh\r
TACALCON        EQU       MODES+9     ; 7Ch\r
TACALCOFF       equ       MODES+10    ; 7Dh 'AUTOFILL OFF\r
;\r
;\r
;       GRAPH FORMAT TOKENS ARE 2 BYTE TOKENS\r
;\r
TGFORMAT        EQU       MODES+11    ; 7Eh\r
;\r
TBOXICON        equ       7Fh\r
TCROSSICON      EQU       80h\r
TDOTICON        EQU       81h\r
;\r
;       BINARY OP\r
;\r
tMul            equ       82h         ; 82h  '*'\r
tDiv            equ       83h         ; 83h  '/'\r
;\r
;       SOME GRAPH COMMANDS\r
;\r
GRCMDS          EQU       84h\r
;\r
tTrace          equ       GRCMDS      ; 84h 'Trace'\r
tClDrw          equ       GRCMDS+1    ; 85h 'ClDrw'\r
tZoomStd        equ       GRCMDS+2    ; 86h 'ZStd'\r
tZoomtrg        equ       GRCMDS+3    ; 87h 'Ztrg'\r
tZOOMBOX        EQU       GRCMDS+4    ; 88h 'ZBOX'\r
tZoomIn         equ       GRCMDS+5    ; 89h 'ZIn'\r
tZoomOut        equ       GRCMDS+6    ; 8Ah 'ZOut'\r
tZoomSqr        equ       GRCMDS+7    ; 8Bh 'ZSqr'\r
tZoomInt        equ       GRCMDS+8    ; 8Ch 'ZInt'\r
tZoomPrev       equ       GRCMDS+9    ; 8Dh 'ZPrev'\r
tZoomDec        equ       GRCMDS+10   ; 8Eh 'ZDecm'\r
TZOOMSTAT       EQU       GRCMDS+11   ; 8Fh 'ZSTAT\r
tUsrZm          equ       GRCMDS+12   ; 90h 'ZRcl'\r
tPrtScrn        equ       GRCMDS+13   ; 91h 'PrtScrn'\r
tZOOMSTO        EQU       GRCMDS+14   ; 92H  ZOOM STORE\r
TTEXT           EQU       GRCMDS+15   ; 93h\r
;\r
;       BINARY OP\r
;\r
tnPr            equ       GRCMDS+16   ; 94h '_nPr_'\r
tnCr            equ       GRCMDS+17   ; 95h '_nCr_'\r
;\r
;       MORE GRAPH COMMANDS\r
;\r
tYOn            equ       GRCMDS+18   ; 96h 'FnOn_'\r
tYOff           equ       GRCMDS+19   ; 97h 'FnOff_'\r
tStPic          equ       GRCMDS+20   ; 98h 'StPic_'\r
tRcPic          equ       GRCMDS+21   ; 99h 'RcPic_'\r
tStoDB          equ       GRCMDS+22   ; 9Ah 'StGDB_'\r
tRclDB          equ       GRCMDS+23   ; 9Bh 'RcGDB_'\r
tLine           equ       GRCMDS+24   ; 9Ch 'Line'\r
tVert           equ       GRCMDS+25   ; 9Dh 'Vert_'\r
tPtOn           equ       GRCMDS+26   ; 9Eh 'PtOn'\r
tPtOff          equ       GRCMDS+27   ; 9Fh 'PtOff'\r
;\r
;  TOKEN A0 CANNOT BE AN EOS FUNCTION SINCE LOW MULT=A0 ALREADY\r
;\r
tPtChg          equ       GRCMDS+28   ; A0h 'PtChg'\r
TPXON           EQU       GRCMDS+29   ; A1h\r
TPXOFF          EQU       GRCMDS+30   ; A2h\r
TPXCHG          EQU       GRCMDS+31   ; A3h\r
tShade          equ       GRCMDS+32   ; A4h 'Shade'\r
tCircl          equ       GRCMDS+33   ; A5h 'Circl'\r
tHORZ           equ       GRCMDS+34   ; A6h 'HORIZONTAL'\r
tTanLn          equ       GRCMDS+35   ; A7h 'TanLn'\r
tDrInv          equ       GRCMDS+36   ; A8h 'DrInv_'\r
tDrawF          equ       GRCMDS+37   ; A9h 'DrawF_'\r
;\r
TVARSTRNG       EQU       0AAh\r
;\r
; ===== Functions with no arguments\r
;\r
NOARG   EQU     0ABh\r
;\r
tRand           equ       NOARG       ; ABh 'rand'\r
tPi             equ       NOARG+1     ; ACh  Lpi\r
tGetKey         equ       NOARG+2     ; ADh 'getKy'\r
;\r
;\r
TAPOST          EQU       TGETKEY+1   ; APOSTROPHY\r
TQUEST          EQU       TAPOST+1    ; QUESTION MARK\r
;\r
;\r
; ===== Unary functions\r
;\r
;       UNARY : THESE UNARY FUNCTIONS TAKE A COMBINATION OF\r
;               ARGUMENTS, REAL,LIST,MATRIX\r
;\r
UNARY   EQU     TQUEST+1              ; B0h\r
;\r
tChs            equ       UNARY       ; B0h\r
tInt            equ       UNARY+1     ; B1h\r
TABS            equ       UNARY+2     ; B2h\r
tDet            equ       UNARY+3     ; B3h\r
tIdent          equ       UNARY+4     ; B4h\r
tDim            equ       UNARY+5     ; B5h\r
tSum            equ       UNARY+6     ; B6h\r
tProd           equ       UNARY+7     ; B7h\r
tNot            equ       UNARY+8     ; B8h\r
tIPart          equ       UNARY+9     ; B9h\r
tFPart          equ       UNARY+10    ; BAh\r
;\r
;\r
;       NEW 2 BYTE TOKENS\r
;\r
T2BYTETOK       EQU       0BBh         ;\r
;\r
;\r
;       UNARYLR : UNARY FUNCTIONS THAT ONLY WORK WITH\r
;                 REAL NUMBERS AND LISTS\r
;\r
UNARYLR EQU     UNARY+12\r
;\r
tSqrt           equ       UNARYLR     ; BCh\r
TCUBRT          equ       UNARYLR+1   ; BDh\r
tLn             equ       UNARYLR+2   ; BEh\r
tExp            equ       UNARYLR+3   ; BFh\r
tLog            equ       UNARYLR+4   ; C0h\r
tALog           equ       UNARYLR+5   ; C1h\r
tSin            equ       UNARYLR+6   ; C2h\r
tASin           equ       UNARYLR+7   ; C3h\r
tCos            equ       UNARYLR+8   ; C4h\r
tACos           equ       UNARYLR+9   ; C5h\r
tTan            equ       UNARYLR+10  ; C6h\r
tATan           equ       UNARYLR+11  ; C7h\r
tSinh           equ       UNARYLR+12  ; C8h\r
tASinh          equ       UNARYLR+13  ; C9h\r
tCosh           equ       UNARYLR+14  ; CAh\r
tACosh          equ       UNARYLR+15  ; CBh\r
tTanh           equ       UNARYLR+16  ; CCh\r
tATanh          equ       UNARYLR+17  ; CDh\r
;\r
;       SOME PROGRAMMING COMMANDS\r
;\r
PROGTOK EQU     UNARYLR+18\r
;\r
tIf             equ       PROGTOK     ; CEh\r
tThen           equ       PROGTOK+1   ; CFh\r
tElse           equ       PROGTOK+2   ; D0h\r
tWhile          equ       PROGTOK+3   ; D1h\r
tRepeat         equ       PROGTOK+4   ; D2h\r
tFor            equ       PROGTOK+5   ; D3h\r
tEnd            equ       PROGTOK+6   ; D4h\r
tReturn         equ       PROGTOK+7   ; D5h\r
tLbl            equ       PROGTOK+8   ; D6h   'Lbl_'\r
tGoto           equ       PROGTOK+9   ; D7h   'Goto_'\r
tPause          equ       PROGTOK+10  ; D8h   'Pause_'\r
tStop           equ       PROGTOK+11  ; D9h   'Stop'\r
tISG            equ       PROGTOK+12  ; DAh   'IS>'\r
tDSL            equ       PROGTOK+13  ; DBh   'DS<'\r
tInput          equ       PROGTOK+14  ; DCh   'Input_'\r
tPrompt         equ       PROGTOK+15  ; DDh   'Prompt_'\r
tDisp           equ       PROGTOK+16  ; DEh   'Disp_'\r
tDispG          equ       PROGTOK+17  ; DFh   'DispG'\r
;\r
;  TOKEN E0 CANNOT BE AN EOS FUNCTION SINCE HI MU\r
;\r
tOutput         equ       PROGTOK+18  ; E0H    'Outpt'\r
tClLCD          equ       PROGTOK+19  ; E1H    'ClLCD'\r
tConst          equ       PROGTOK+20  ; E2H    'Fill'\r
tSortA          equ       PROGTOK+21  ; E3H    'sortA_'\r
tSortD          equ       PROGTOK+22  ; E4H    'sortD_'\r
TDISPTAB        EQU       PROGTOK+23  ; E5h    'DISP TABLE\r
tMenu           equ       PROGTOK+24  ; E6H    'Menu'\r
tSENDMBL        EQU       PROGTOK+25  ; E7H    'SEND'\r
tGETMBL         EQU       PROGTOK+26  ; E8H    'GET'\r
;\r
;       STAT PLOT COMMANDS\r
;\r
STATPCMD        EQU       PROGTOK+27\r
;\r
TPLOTON         EQU       STATPCMD    ; E9h     ' PLOTSON'\r
TPLOTOFF        EQU       STATPCMD+1   ; EAh     ' PLOTSOFF\r
;\r
TLISTNAME       EQU       0EBH        ; LIST DESIGNATOR\r
;\r
;\r
;\r
TPLOT1          EQU       0ECH\r
TPLOT2          EQU       0EDH\r
TPLOT3          EQU       0EEH\r
;\r
tPower          equ       0F0h        ;        '^'\r
tXRoot          equ       0F1h        ;        LsupX,Lroot\r
\r
STATCMD         EQU       0F2h\r
;\r
tOneVar         equ       STATCMD     ; F2h    'OneVar_'\r
TTWOVAR         EQU       STATCMD+1   ; F3h\r
tLR             equ       STATCMD+2   ; F4h    'LinR(A+BX\r
tLRExp          equ       STATCMD+3   ; F5h    'ExpR_'\r
tLRLn           equ       STATCMD+4   ; F6h    'LnR_'\r
tLRPwr          equ       STATCMD+5   ; F7h    'PwrR_'\r
TMEDMED         EQU       STATCMD+6   ; F8h\r
TQUAD           EQU       STATCMD+7   ; F9h\r
tCLRLST         equ       STATCMD+8   ; FAh    'CLEAR LIST\r
TCLRTBL         EQU       STATCMD+9   ; FBH    CLEAR TABLE\r
tHist           equ       STATCMD+10  ; FCh    'Hist_'\r
txyLine         equ       STATCMD+11  ; FDH    'xyline_'\r
tScatter        equ       STATCMD+12  ; FEh    'Scatter_'\r
tLR1            equ       STATCMD+13  ; FFh    'LINR(AX+B\r
;\r
; 2ND HALF OF GRAPH FORMAT TOKENS\r
;\r
; ===== Format settings commands\r
;\r
GFMT            EQU       0\r
;\r
tSeq            equ       GFMT        ; 'SeqG'\r
tSimulG         equ       GFMT+1      ; 'SimulG'\r
tPolarG         equ       GFMT+2      ; 'PolarGC'\r
tRectG          equ       GFMT+3      ; 'RectGC'\r
tCoordOn        equ       GFMT+4      ; 'CoordOn'\r
tCoordOff       equ       GFMT+5      ; 'CoordOff'\r
tDrawLine       equ       GFMT+6      ; 'DrawLine'\r
tDrawDot        equ       GFMT+7      ; 'DrawDot'\r
tAxisOn         equ       GFMT+8      ; 'AxesOn'\r
tAxisOff        equ       GFMT+9      ; 'AxesOff'\r
tGridOn         equ       GFMT+10     ; 'GridOn'\r
tGridOff        equ       GFMT+11     ; 'GridOff'\r
tLblOn          equ       GFMT+12     ; 'LabelOn'\r
tLblOff         equ       GFMT+13     ; 'LabelOff'\r
tWebOn          equ       GFMT+14     ; 'WebOn'\r
tWebOff         equ       GFMT+15     ; 'WebOFF'\r
TUV             EQU       GFMT+16     ; U vs V\r
TVW             EQU       GFMT+17     ; V vs W\r
TUW             EQU       GFMT+18     ; U vs W\r
;\r
;       2ND HALF OF USER MATRIX TOKENS\r
;\r
TMATA           EQU       00h         ; MAT A\r
TMATB           EQU       01h         ; MAT B\r
TMATC           EQU       02h         ; MAT C\r
TMATD           EQU       03h         ; MAT D\r
TMATE           EQU       04h         ; MAT E\r
TMATF           EQU       05h         ; MAT F\r
TMATG           EQU       06h         ; MAT G\r
TMATH           EQU       07h         ; MAT H\r
TMATI           EQU       08h         ; MAT I\r
TMATJ           EQU       09h         ; MAT J\r
;\r
;       2ND HALF OF USER LIST TOKENS\r
;\r
TL1             EQU       00h         ; LIST 1\r
TL2             EQU       01h         ; LIST 2\r
TL3             EQU       02h         ; LIST 3\r
TL4             EQU       03h         ; LIST 4\r
TL5             EQU       04h         ; LIST 5\r
TL6             EQU       05h         ; LIST 6\r
;\r
;       2ND HALF OF USER EQUATION TOKENS\r
;\r
;\r
;       "Y" EQUATIONS HAVE BIT 4 SET\r
;\r
TY1             EQU       10h         ; Y1\r
TY2             EQU       11h         ; Y2\r
TY3             EQU       12h         ; Y3\r
TY4             EQU       13h         ; Y4\r
TY5             EQU       14h         ; Y5\r
TY6             EQU       15h         ; Y6\r
TY7             EQU       16h         ; Y7\r
TY8             EQU       17h         ; Y8\r
TY9             EQU       18h         ; Y9\r
TY0             EQU       19H         ; Y0\r
;\r
;       PARAM EQUATIONS HAVE BIT 5 SET\r
;\r
TX1T            EQU       20h         ; X1t\r
TY1T            EQU       21h         ; Y1t\r
TX2T            EQU       22h         ; X2t\r
TY2T            EQU       23h         ; Y2t\r
TX3T            EQU       24h         ; X3t\r
TY3T            EQU       25h         ; Y3t\r
TX4T            EQU       26h         ; X4t\r
TY4T            EQU       27h         ; Y4t\r
TX5T            EQU       28h         ; X5t\r
TY5T            EQU       29h         ; Y5t\r
TX6T            EQU       2Ah         ; X6t\r
TY6T            EQU       2Bh         ; Y6t\r
;\r
;       POLAR EQUATIONS HAVE BIT 6 SET\r
;\r
TR1             EQU       40h         ; R1\r
TR2             EQU       41h         ; R2\r
TR3             EQU       42h         ; R3\r
TR4             EQU       43h         ; R4\r
TR5             EQU       44h         ; R5\r
TR6             EQU       45h         ; R6\r
;\r
;       RECURSION EQUATIONS HAVE BIT 7 SET\r
;\r
TUN             EQU       80h         ; Un\r
TVN             EQU       81h         ; Vn\r
TWN             EQU       82h         ; Wn\r
;\r
;       2ND HALF OF USER PICTURE TOKENS\r
;\r
TPIC1           EQU       00h         ; PIC1\r
TPIC2           EQU       01h         ; PIC2\r
TPIC3           EQU       02h         ; PIC3\r
TPIC4           EQU       03h         ; PIC4\r
TPIC5           EQU       04h         ; PIC5\r
TPIC6           EQU       05h         ; PIC6\r
TPIC7           EQU       06h         ; PIC7\r
TPIC8           EQU       07h         ; PIC8\r
TPIC9           EQU       08h         ; PIC9\r
TPIC0           EQU       09h         ; PIC0\r
;\r
;       2ND HALF OF USER GRAPH DATABASE TOKENS\r
;\r
TGDB1           EQU       00h         ; GDB1\r
TGDB2           EQU       01h         ; GDB2\r
TGDB3           EQU       02h         ; GDB3\r
TGDB4           EQU       03h         ; GDB4\r
TGDB5           EQU       04h         ; GDB5\r
TGDB6           EQU       05h         ; GDB6\r
TGDB7           EQU       06h         ; GDB7\r
TGDB8           EQU       07h         ; GDB8\r
TGDB9           EQU       08h         ; GDB9\r
TGDB0           EQU       09h         ; GDB0\r
;\r
;       2ND HALF OF STRING VARS\r
;\r
TSTR1           EQU       00h\r
TSTR2           EQU       01h\r
TSTR3           EQU       02h\r
TSTR4           EQU       03h\r
TSTR5           EQU       04h\r
TSTR6           EQU       05h\r
TSTR7           EQU       06h\r
TSTR8           EQU       07h\r
TSTR9           EQU       08h\r
TSTR0           EQU       09h\r
;\r
;       2ND HALF OF SYSTEM OUTPUT ONLY VARIABLES\r
;\r
;\r
;   OPEN        EQU       00H\r
;\r
TREGEQ          EQU       01h         ; REGRESSION EQUATION\r
;\r
TSTATN          EQU       02h         ; STATISTICS N\r
;\r
TXMEAN          EQU       03h         ; X MEAN\r
TSUMX           EQU       04h         ; SUM(X)\r
TSUMXSQR        EQU       05h         ; SUM(X^2)\r
TSTDX           EQU       06h         ; STANDARD DEV X\r
TSTDPX          EQU       07h         ; STANDARD DEV POP X\r
TMINX           EQU       08h         ; MIN X VALUE\r
TMAXX           EQU       09h         ; MAX X VALUE\r
;\r
TMINY           EQU       0Ah         ; MIN Y VALUE\r
TMAXY           EQU       0Bh         ; MAX Y VALUE\r
TYMEAN          EQU       0Ch         ; Y MEAN\r
TSUMY           EQU       0Dh         ; SUM(Y)\r
TSUMYSQR        EQU       0Eh         ; SUM(Y^2)\r
TSTDY           EQU       0Fh         ; STANDARD DEV Y\r
TSTDPY          EQU       10h         ; STANDARD DEV POP Y\r
;\r
TSUMXY          EQU       11h         ; SUM(XY)\r
TCORR           EQU       12h         ; CORRELATION\r
TMEDX           EQU       13h         ; MED(X)\r
TQ1             EQU       14h         ; 1ST QUADRANT OF X\r
TQ3             EQU       15h         ; 3RD QUADRANT OF X\r
TQUADa          EQU       16h         ; 1ST TERM OF QUAD POLY REG/ Y-INT\r
TQUADb          EQU       17h         ; 2ND TERM OF QUAD POLY REG/ SLOPE\r
TQUADc          EQU       18h         ; 3RD TERM OF QUAD POLY REG\r
TCUBEd          EQU       19h         ; 4TH TERM OF CUBIC POLY REG\r
TQUARTe         EQU       1Ah         ; 5TH TERM OF QUART POLY REG\r
TMEDX1          EQU       1Bh         ; x1 FOR MED-MED\r
TMEDX2          EQU       1Ch         ; x2 FOR MED-MED\r
TMEDX3          EQU       1Dh         ; x3 FOR MED-MED\r
TMEDY1          EQU       1Eh         ; y1 FOR MED-MED\r
TMEDY2          EQU       1Fh         ; y2 FOR MED-MED\r
TMEDY3          EQU       20h         ; y3 FOR MED-MED\r
;\r
TRECURN           EQU       21h       ; RECURSION N\r
TSTATP          EQU       22h\r
TSTATZ          EQU       23h\r
TSTATT          EQU       24h\r
TSTATCHI        EQU       25h\r
TSTATF          EQU       26h\r
TSTATDF         EQU       27h\r
TSTATPHAT       EQU       28h\r
TSTATPHAT1      EQU       29h\r
TSTATPHAT2      EQU       2Ah\r
TSTATMEANX1     EQU       2Bh\r
TSTATSTDX1      EQU       2Ch\r
TSTATN1         EQU       2Dh\r
TSTATMEANX2     EQU       2Eh\r
TSTATSTDX2      EQU       2Fh\r
TSTATN2         EQU       30h\r
TSTATSTDXP      EQU       31h\r
TSTATLOWER      EQU       32h\r
TSTATUPPER      EQU       33h\r
TSTAT_S         EQU       34h\r
TLRSQR          EQU       35h         ; r^2\r
TBRSQR          EQU       36h         ; R^2\r
;\r
;       these next tokens are only used to acess the data\r
;       they are display only and the user cannot access them at all\r
;\r
TF_DF    EQU     37h       ; ANOFAV FACTOR DF\r
TF_SS    EQU     38h       ; ANOFAV FACTOR SS\r
TF_MS    EQU     39h       ; ANOFAV FACTOR MS\r
TE_DF    EQU     3Ah       ; ANOFAV ERROR DF\r
TE_SS    EQU     3Bh       ; ANOFAV ERROR SS\r
TE_MS    EQU     3Ch       ; ANOFAV ERROR MS\r
;\r
;\r
;       2ND HALF OF SYSTEM INPUT/OUTPUT VARIABLES\r
;\r
\r
; SYSTEM VARIABLE EQUATES\r
;\r
;       VARS WITH NO RESTRICTION\r
;\r
TUXSCL       EQU  0\r
TUYSCL       EQU  1\r
TXSCL        EQU  2\r
TYSCL        EQU  3\r
TRECURU0     EQU  4        ; U 1ST INITIAL COND\r
TRECURV0     EQU  5        ; V 1ST INITIAL COND\r
TUN1         EQU  6        ; U(N-1)    ; NOT USED\r
TVN1         EQU  7        ; V(N-1)    ; NOT USED\r
TURECURU0    EQU  8        ;\r
TURECURV0    EQU  9        ;\r
;\r
;       VARS ROUNDED TO 10 DIGITS\r
;\r
TXMIN        EQU  0AH\r
TXMAX        EQU  0BH\r
TYMIN        EQU  0CH\r
TYMAX        EQU  0DH\r
TTMIN        EQU  0EH\r
TTMAX        EQU  0FH\r
TTHETAMIN    EQU  10H\r
TTHETAMAX    EQU  11H\r
TUXMIN       EQU  12H\r
TUXMAX       EQU  13H\r
TUYMIN       EQU  14H\r
TUYMAX       EQU  15H\r
TUTHETMIN    EQU  16H\r
TUTHETMAX    EQU  17H\r
TUTMIN       EQU  18H\r
TUTMAX       EQU  19H\r
TTBLMIN      EQU  1AH\r
TPLOTSTART   EQU  1BH\r
TUPLOTSTART  EQU  1CH\r
TNMAX        EQU  1DH\r
TUNMAX       EQU  1EH\r
TNMIN        EQU  1FH\r
TUNMIN       EQU  20H\r
;\r
;       VARS CANNOT BE 0\r
;\r
TTBLSTEP     EQU  21H\r
TTSTEP       EQU  22H\r
TTHETASTEP    EQU  23H\r
TUTSTEP      EQU  24H\r
TUTHETSTEP     EQU  25H\r
;\r
;       SPECIAL LIMITS ON THESE\r
;\r
TDELTAX      EQU  26H\r
TDELTAY      EQU  27H\r
;\r
;       SPECIAL LIMITS ON THESE\r
;\r
TXFACT       EQU  28H\r
TYFACT       EQU  29H\r
;\r
TTBLINPUT       EQU       2Ah\r
;\r
;       ANY RESTRICTIONS ??????\r
;\r
TFINn           EQU       2Bh\r
TFINi           EQU       2Ch\r
TFINpv          EQU       2Dh\r
TFINpmt         EQU       2Eh\r
TFINfv          EQU       2Fh\r
TFINpy          EQU       30h\r
TFINcy          EQU       31h\r
;\r
TRECURW0        EQU       32h         ; W0(1)\r
TURECURW0       EQU       33h\r
;\r
TPLOTSTEP       EQU       34h\r
TUPLOTSTEP      EQU       35h\r
;\r
TXRES           EQU       36h\r
TUXRES          EQU       37h\r
;\r
;       ALL THE TOKENS BELOW DO NOT HAVE STRINGS ASSOCIATED\r
;       THEY ARE HERE JUST FOR STORING AND RECALLING\r
;\r
TRECURU02       EQU       38h         ; U0(2)\r
TURECURU02      EQU       39h\r
TRECURV02       EQU       3Ch         ; V0(2)\r
TURECURV02      EQU       3Dh\r
TRECURW02       EQU       3Eh         ; W0(2)\r
TURECURW02      EQU       3Fh\r
;\r
; NO RESTRICTIONS\r
;\r
;TWN1           EQU       40h         ; W(N-1)\r
;UN2           EQU       41h         ; U(N-2)\r
;VN2           EQU       42h         ; V(N-2)\r
;WN2           EQU       43h         ; W(N-2)\r
;\r
;\r
;       DON'T KNOW IF NEED THESE YET ?\r
;\r
;TUI12\r
;TUI22\r
;TUUI12\r
;TUUI22\r
;\r
;\r
\r
TFINnpv         EQU       00h         ; immediate unary\r
TFINirr         EQU       01h         ; immediate unary\r
TFINbal         EQU       02h         ; immediate unary\r
TFINprn         EQU       03h         ; immediate unary\r
TFINint         EQU       04h         ; immediate unary\r
TFINtonom       EQU       05h         ; immediate unary\r
TFINtoeff       EQU       06h         ; immediate unary\r
TFINdbd         EQU       07h         ; immediate unary\r
TLCM            EQU       08h         ; immediate unary\r
TGCD            EQU       09h         ; immediate unary\r
TRANDINT        EQU       0Ah         ; immediate unary\r
TRANDBIN        EQU       0Bh         ; immediate unary\r
TSUBSTRNG       EQU       0Ch         ; immediate unary\r
TSTDDEV         EQU       0Dh         ; immediate unary\r
TVARIANCE       EQU       0Eh         ; immediate unary\r
TINSTRNG        EQU       0Fh         ; immediate unary\r
TDNORMAL        EQU       10h         ; immediate unary\r
TINVNORM        EQU       11h         ; immediate unary\r
TDT             EQU       12h         ; immediate unary\r
TCHI            EQU       13h         ; immediate unary\r
TDF             EQU       14h         ; immediate unary\r
TBINPDF         EQU       15h         ; immediate unary\r
TBINCDF         EQU       16h         ; immediate unary\r
TPOIPDF         EQU       17h         ; immediate unary\r
TPOICDF         EQU       18h         ; immediate unary\r
TGEOPDF         EQU       19h         ; immediate unary\r
TGEOCDF         EQU       1Ah         ; immediate unary\r
TNORMALPDF      EQU       1Bh         ; immediate unary\r
TTPDF           EQU       1Ch         ; immediate unary\r
TCHIPDF         EQU       1Dh         ; immediate unary\r
TFPDF           EQU       1Eh         ; immediate unary\r
;TRANDBIN        EQU       1Fh         ; immediate unary\r
TRANDNORM       EQU       1Fh         ; immediate unary\r
TFINFpmt        EQU       20h         ; 0 or multy arg function\r
TFINFi          EQU       21h         ; 0 or multy arg function\r
TFINFpv         EQU       22h         ; 0 or multy arg function\r
TFINFn          EQU       23h         ; 0 or multy arg function\r
TFINFfv         EQU       24h         ; 0 or multy arg function\r
TCONJ           EQU       25h         ; unary\r
TREAL           EQU       26h         ; unary\r
TIMAG           EQU       27h         ; unary\r
TANGLE          EQU       28h         ; unary\r
TCUMSUM         EQU       29h         ; unary\r
TEXPR           EQU       2Ah         ; unary\r
TLENGTH         EQU       2Bh         ; unary\r
TDELTALST       EQU       2Ch         ; unary\r
TREF            EQU       2Dh         ; unary\r
TRREF           EQU       2Eh         ; unary\r
TTORECT         EQU       2Fh         ; display conversion\r
TTOPOLAR        EQU       30h         ; display conversion\r
TCONSTE         EQU       31h         ; function no arg\r
TSINREG         EQU       32h         ; command opt push\r
TLOGISTIC       EQU       33h         ; command opt push\r
TLINREGTTEST    EQU       34h         ; command opt push\r
TSHADENORM      EQU       35h         ; command pushed\r
TSHADET         EQU       36h         ; command pushed\r
TSHADECHI       EQU       37h         ; command pushed\r
TSHADEF         EQU       38h         ; command pushed\r
TMATTOLST       EQU       39h         ; command pushed\r
TLSTTOMAT       EQU       3Ah         ; command pushed\r
TZTEST          EQU       3Bh         ; command pushed\r
TTTEST          EQU       3Ch         ; command pushed\r
T2SAMPZTEST     EQU       3Dh         ; command pushed\r
T1PROPZTEST     EQU       3Eh         ; command pushed\r
T2PROPZTEST     EQU       3Fh         ; command pushed\r
TCHITEST        EQU       40h         ; command pushed\r
TZINTVAL        EQU       41h         ; command pushed\r
T2SAMPZINT      EQU       42h         ; command pushed\r
T1PROPZINT      EQU       43h         ; command pushed\r
T2PROPZINT      EQU       44h         ; command pushed\r
TGRAPHSTYLE     EQU       45h         ; command pushed\r
T2SAMPTTEST     EQU       46h         ; command opt pushed\r
T2SAMPFTEST     EQU       47h         ; command opt pushed\r
TTINTVAL        EQU       48h         ; command opt pushed\r
T2SAMPTINT      EQU       49h         ; command opt pushed\r
TSETUPLST       EQU       4Ah         ; command opt pushed\r
TFINpmtend      EQU       4Bh         ; mode command\r
TFINpmtbeg      EQU       4Ch         ; mode command\r
TREALM          EQU       4Dh         ; mode command\r
TPOLARM         EQU       4Eh         ; mode command\r
TRECTM          EQU       4Fh         ; mode command\r
TEXPRON         EQU       50h         ; mode command\r
TEXPROFF        EQU       51h         ; mode command\r
TCLRALLLST      EQU       52h         ; command not pushed\r
TGETCALC        EQU       53h         ; command not pushed\r
TDELVAR         EQU       54h         ; command not pushed\r
TEQUTOSTRNG     EQU       55h         ; command not pushed\r
TSTRNGTOEQU     EQU       56h         ; command not pushed\r
tdellast        EQU       57h         ; command not pushed\r
TSELECT         EQU       58h         ; command not pushed\r
TANOVA          EQU       59h         ; command not pushed\r
TMODBOX         EQU       5Ah         ; icon\r
TNORMPROB       EQU       5Bh         ; icon\r
;\r
;       tokens 5Ch to 63h CANNOT BE THE 2ND BYTE OF\r
;       TWO BYTE TOKENS. THESE ARE ALREADY THE 1ST BYTE VALUE\r
;       OF TWO BYTE TOKENS. READING TOKENS BACKWARDS WILL NOT\r
;       WORK IF THIS RESTRICTION IS NOT IN PLACE.\r
;\r
;\r
;       NO USE  EQU       5Ch\r
;       NO USE  EQU       5Dh\r
;       NO USE  EQU       5Eh\r
;       NO USE  EQU       5Fh\r
;       NO USE  EQU       60h\r
;       NO USE  EQU       61h\r
;       NO USE  EQU       62h\r
;       NO USE  EQU       63h\r
;\r
TMGT            EQU       64h         ; VERTICAL SPLIT\r
TZFIT           EQU       65h         ; ZOOM FIT\r
TDIAG_ON        EQU       66h         ; DIANOSTIC DISPLAY ON\r
TDIAG_OFF       EQU       67h         ; DIANOSTIC DISPLAY OFF\r
;\r
;\r
\r
\r
\r
`;export{e as default};