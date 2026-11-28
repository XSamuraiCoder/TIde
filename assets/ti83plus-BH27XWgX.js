var e=`	.nolist\r
#define EQU .EQU\r
#define equ .EQU\r
#define db .DB\r
#define DB .DB\r
\r
#define bcall(xxxx)	rst 28h \\ .dw xxxx\r
.addinstr B_CALL *       EF   3 NOP 1\r
#define bjump(label) call 50h \\ .dw label\r
#define	bcallz(xxxx)	jr nz,$+5 \\ rst 28h \\ .dw xxxx\r
#define	bcallnz(xxxx)	jr	z,$+5 \\ rst 28h \\ .dw xxxx\r
#define	bcallc(xxxx)	jr	nc,$+5 \\ rst 28h \\ .dw xxxx\r
#define	bcallnc(xxxx)	jr	c,$+5	\\ rst 28h \\ .dw xxxx\r
\r
\r
usermemoff        = $89EC\r
_JForceCmd        = $402A\r
_homeup           = $4558\r
LCD_BUSY_QUICK	= $000B\r
;======================================================================\r
; Include File for the TI-83 Plus\r
; Last Updated 11/09/2001 \r
;\r
; Copyright (c) 1999, 2001 Texas Instruments: The Licensed Materials are\r
; copyrighted by TI. LICENSEE agrees that it will \r
; not delete the copyright notice, trademarks or\r
; protective notices from any copy made by LICENSEE.\r
;\r
; Warranty: TI does not warrant that the Licensed Materials will\r
; be free from errors or will meet your specific requirements.\r
; The Licensed Materials are made available "AS IS" to LICENSEE.\r
;\r
; Limitations: TI MAKES NO WARRANTY OR CONDITION, EITHER EXPRESS\r
; OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY IMPLIED\r
; WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE,\r
; REGARDING THE LICENSED MATERIALS.  IN NO EVENT SHALL\r
; TI OR ITS SUPPLIERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL\r
; OR CONSEQUENTIAL DAMAGES, LOSS OF PROFITS, LOSS OF USE OR DATA, \r
; OR INTERRUPTION OF BUSINESS, WHETHER THE ALLEGED DAMAGES ARE\r
; LABELED IN TORT, CONTRACT OR INDEMNITY.\r
;\r
;\r
;======================================================================\r
;           System Variable Equates\r
;======================================================================\r
;       Entry Points : RclSysTok, StoSysTok\r
;\r
XSCLt		EQU  2\r
YSCLt		EQU  3\r
XMINt		EQU  0Ah\r
XMAXt		EQU  0Bh\r
YMINt		EQU  0Ch\r
YMAXt		EQU  0Dh\r
TMINt		EQU  0Eh\r
TMAXt		EQU  0Fh\r
THETMINt	EQU  10h\r
THETMAXt	EQU  11h\r
TBLMINt		EQU  1Ah\r
PLOTSTARTt	EQU  1Bh\r
NMAXt		EQU  1Dh\r
NMINt		EQU  1Fh\r
TBLSTEPt	EQU  21h\r
TSTEPt		EQU  22h\r
THETSTEPt	EQU  23h\r
DELTAXt		EQU  26h\r
DELTAYt		EQU  27h\r
XFACTt		EQU  28h\r
YFACTt		EQU  29h\r
FINNt		EQU  2Bh\r
FINIt		EQU  2Ch\r
FINPVt		EQU  2Dh\r
FINPMTt		EQU  2Eh\r
FINFVt		EQU  2Fh\r
FINPYt		EQU  30h\r
FINCYt		EQU  31h\r
PLOTSTEPt	EQU  34h\r
XRESt		EQU  36h\r
;\r
\r
;======================================================================\r
;           Run indicators\r
;======================================================================\r
;\r
busyPause	EQU	10101010b\r
busyNormal	EQU	11110000b\r
;\r
;======================================================================\r
; Macro to call base code from an app,\r
;======================================================================\r
;\r
rBR_CALL	EQU	28h		; NEEDED FOR APPS\r
BRT_JUMP0	EQU	50h\r
;\r
\r
;======================================================================\r
;           Common subroutine RST numbers  \r
;======================================================================\r
;\r
rOP1TOOP2	EQU  1*8\r
rFINDSYM	EQU  2*8\r
rPUSHREALO1	EQU  3*8\r
rMOV9TOOP1	EQU  4*8\r
rFPADD	EQU  6*8\r
;\r
\r
;SYMBOLIC_DEBUG_START\r
;======================================================================\r
;           Entry points  \r
;======================================================================\r
;\r
_AbsO1O2Cp	EQU 410Eh\r
_AbsO1PAbsO2	EQU 405Ah\r
_ACos		EQU 40DEh\r
_ACosH		EQU 40F0h\r
_ACosRad	EQU 40D2h\r
_AdrLEle	EQU 462Dh\r
_AdrMEle	EQU 4609h\r
_AdrMRow	EQU 4606h\r
_AllEq		EQU 4876h\r
_AllocFPS	EQU 43A5h\r
_AllocFPS1	EQU 43A8h\r
_Angle		EQU 4102h\r
_AnsName	EQU 4B52h\r
_ApdSetup	EQU 4C93h\r
_AppGetCalc	EQU 4C78h\r
_AppGetCbl	EQU 4C75h\r
_AppInit	EQU 404Bh  ;***\r
_Arc_Unarc	EQU 4FD8h\r
_ASin		EQU 40E4h\r
_ASinH		EQU 40EDh\r
_ASinRad	EQU 40DBh\r
_ATan		EQU 40E1h\r
_ATan2		EQU 40E7h\r
_ATan2Rad	EQU 40D8h\r
_ATanH		EQU 40EAh\r
_ATanRad	EQU 40D5h\r
\r
_BinOPExec	EQU 4663h\r
_Bit_VertSplit	EQU 4FA8h\r
_BufClr		EQU 5074h\r
_BufCpy		EQU 5071h\r
\r
_CAbs		EQU 4E97h\r
_CAdd		EQU 4E88h\r
_CanAlphIns	EQU 4C69h\r
_CDiv		EQU 4E94h\r
_CDivByReal	EQU 4EBBh\r
_CEtoX		EQU 4EA9h\r
_CFrac		EQU 4EC1h\r
_CheckSplitFlag	EQU 49F0h\r
_Chk_Batt_Low	EQU 50B3h  ;***\r
_ChkFindSym	EQU 42F1h\r
_CIntgr		EQU 4EC4h\r
_CircCmd	EQU 47D4h\r
_CkInt		EQU 4234h\r
_CkOdd		EQU 4237h\r
_CkOP1C0	EQU 4225h\r
_CkOP1Cplx	EQU 40FCh\r
_CkOP1FP0	EQU 4228h\r
_CkOP1Pos	EQU 4258h\r
_CkOP1Real	EQU 40FFh\r
_CkOP2FP0	EQU 422Bh\r
_CkOP2Pos	EQU 4255h\r
_CkOP2Real	EQU 42DFh\r
_CkPosInt	EQU 4231h\r
_CkValidNum	EQU 4270h\r
_CleanAll	EQU 4A50h\r
_ClearRect	EQU 4D5Ch\r
_ClearRow	EQU 4CEDh\r
_CLine		EQU 4798h\r
_CLineS		EQU 479Bh\r
_CLN		EQU 4EA0h\r
_CLog		EQU 4EA3h\r
_CloseEditBuf	EQU 48D3h  ;***\r
_CloseEditBufNoR	EQU 476Eh\r
_CloseEditEqu	EQU 496Ch  ;***\r
_CloseProg	EQU 4A35h\r
_ClrGraphRef	EQU 4A38h\r
_ClrLCD		EQU 4543h\r
_ClrLCDFull	EQU 4540h\r
_ClrLp		EQU 41D1h\r
_ClrOP1S	EQU 425Eh\r
_ClrOP2S	EQU 425Bh\r
_ClrScrn	EQU 4549h\r
_ClrScrnFull	EQU 4546h\r
_ClrTxtShd	EQU 454Ch\r
_CMltByReal	EQU 4EB8h\r
_CmpSyms	EQU 4A4Ah\r
_CMult		EQU 4E8Eh\r
_Conj		EQU 4EB5h\r
_ConvDim	EQU 4B43h\r
_ConvDim00	EQU 4B46h\r
_ConvLcToLr	EQU 4A23h\r
_ConvLrToLc	EQU 4A56h\r
_ConvOP1	EQU 4AEFh\r
_COP1Set0	EQU 4105h\r
_Cos		EQU 40C0h\r
_CosH		EQU 40CCh\r
_CpHLDE		EQU 400Ch\r
_CPoint		EQU 4DC8h\r
_CPointS	EQU 47F5h\r
_CpOP1OP2	EQU 4111h\r
_CpOP4OP3	EQU 4108h\r
_CpyO1ToFPS1	EQU 445Ch\r
_CpyO1ToFPS2	EQU 446Bh\r
_CpyO1ToFPS3	EQU 4477h\r
_CpyO1ToFPS4	EQU 4489h\r
_CpyO1ToFPS5	EQU 4483h\r
_CpyO1ToFPS6	EQU 447Dh\r
_CpyO1ToFPS7	EQU 4480h\r
_CpyO1ToFPST	EQU 444Ah\r
_CpyO2ToFPS1	EQU 4459h\r
_CpyO2ToFPS2	EQU 4462h\r
_CpyO2ToFPS3	EQU 4474h\r
_CpyO2ToFPS4	EQU 4486h\r
_CpyO2ToFPST	EQU 4444h\r
_CpyO3ToFPS1	EQU 4453h\r
_CpyO3ToFPS2	EQU 4465h\r
_CpyO3ToFPST	EQU 4441h\r
_CpyO5ToFPS1	EQU 4456h\r
_CpyO5ToFPS3	EQU 4471h\r
_CpyO6ToFPS2	EQU 4468h\r
_CpyO6ToFPST	EQU 4447h\r
_CpyStack	EQU 4429h\r
_CpyTo1FPS1	EQU 4432h\r
_CpyTo1FPS10	EQU 43F3h\r
_CpyTo1FPS11	EQU 43D8h\r
_CpyTo1FPS2	EQU 443Bh\r
_CpyTo1FPS3	EQU 4408h\r
_CpyTo1FPS4	EQU 440Eh\r
_CpyTo1FPS5	EQU 43DEh\r
_CpyTo1FPS6	EQU 43E4h\r
_CpyTo1FPS7	EQU 43EAh\r
_CpyTo1FPS8	EQU 43EDh\r
_CpyTo1FPS9	EQU 43F6h\r
_CpyTo1FPST	EQU 4423h\r
_CpyTo2FPS1	EQU 442Fh\r
_CpyTo2FPS2	EQU 4438h\r
_CpyTo2FPS3	EQU 4402h\r
_CpyTo2FPS4	EQU 43F9h\r
_CpyTo2FPS5	EQU 43DBh\r
_CpyTo2FPS6	EQU 43E1h\r
_CpyTo2FPS7	EQU 43E7h\r
_CpyTo2FPS8	EQU 43F0h\r
_CpyTo2FPST	EQU 4420h\r
_CpyTo3FPS1	EQU 442Ch\r
_CpyTo3FPS2	EQU 4411h\r
_CpyTo3FPST	EQU 441Dh\r
_CpyTo4FPST	EQU 441Ah\r
_CpyTo5FPST	EQU 4414h\r
_CpyTo6FPS2	EQU 43FFh\r
_CpyTo6FPS3	EQU 43FCh\r
_CpyTo6FPST	EQU 4417h\r
_CpyToFPS1	EQU 445Fh\r
_CpyToFPS2	EQU 446Eh\r
_CpyToFPS3	EQU 447Ah\r
_CpyToFPST	EQU 444Dh\r
_CpyToStack	EQU 4450h\r
_Create0Equ	EQU 432Ah\r
_CreateAppVar	EQU 4E6Ah\r
_CreateCList	EQU 431Bh\r
_CreateCplx	EQU 430Ch\r
_CreateEqu	EQU 4330h\r
_CreatePair	EQU 4B0Dh\r
_CreatePict	EQU 4333h\r
_CreateProg	EQU 4339h\r
_CreateProtProg	EQU 4E6Dh\r
_CreateReal	EQU 430Fh\r
_CreateRList	EQU 4315h\r
_CreateRMat	EQU 4321h\r
_CreateStrng	EQU 4327h\r
_CRecip		EQU 4E91h\r
_CSqRoot	EQU 4E9Dh\r
_CSquare	EQU 4E8Bh\r
_CSub		EQU 4E85h\r
_CTenX		EQU 4EA6h\r
_CTrunc		EQU 4EBEh\r
_Cube		EQU 407Bh\r
_CursorOff	EQU 45BEh\r
_CursorOn	EQU 45C4h\r
_CXrootY	EQU 4EACh\r
_CYtoX		EQU 4EB2h\r
\r
_DarkLine	EQU 47DDh\r
_DarkPnt	EQU 47F2h\r
_DataSize	EQU 436Ch\r
_DataSizeA	EQU 4369h\r
_DeallocFPS	EQU 439Fh\r
_DeallocFPS1	EQU 43A2h\r
_DecO1Exp	EQU 4267h\r
_DelListEl	EQU 4A2Fh\r
_DelMem		EQU 4357h\r
_DelRes		EQU 4A20h\r
_DelVar		EQU 4351h\r
_DelVarArc	EQU 4FC6h\r
_DelVarNoArc	EQU 4FC9h\r
_DisableApd	EQU 4C84h\r
_Disp		EQU 4F45h\r
_DispDone	EQU 45B5h\r
_DispEOL	EQU 45A6h\r
_DispHL		EQU 4507h\r
_DisplayImage	EQU 4D9Bh\r
_DispMenuTitle	EQU 5065h\r
_DispOP1A	EQU 4BF7h\r
_DivHLBy10	EQU 400Fh\r
_DivHLByA	EQU 4012h\r
_DrawCirc2	EQU 4C66h\r
_DrawCmd	EQU 48C1h\r
_DrawRectBorder	EQU 4D7Dh\r
_DrawRectBorderClear	EQU 4D8Ch\r
_DToR		EQU 4075h\r
\r
_EditProg	EQU 4A32h\r
_EnableApd	EQU 4C87h\r
_EnoughMem	EQU 42FDh\r
_EOP1NotReal	EQU 4279h\r
_Equ_or_NewEqu	EQU 42C4h\r
_EraseEOL	EQU 4552h\r
_EraseRectBorder	EQU 4D86h\r
_ErrArgument	EQU 44ADh\r
_ErrBadGuess	EQU 44CBh\r
_ErrBreak	EQU 44BFh\r
_ErrD_OP1_0	EQU 42D3h\r
_ErrD_OP1_LE_0	EQU 42D0h\r
_ErrD_OP1Not_R	EQU 42CAh\r
_ErrD_OP1NotPos	EQU 42C7h\r
_ErrD_OP1NotPosInt	EQU 42CDh\r
_ErrDataType	EQU 44AAh\r
_ErrDimension	EQU 44B3h\r
_ErrDimMismatch	EQU 44B0h\r
_ErrDivBy0	EQU 4498h\r
_ErrDomain	EQU 449Eh\r
_ErrIncrement	EQU 44A1h\r
_ErrInvalid	EQU 44BCh\r
_ErrIterations	EQU 44C8h\r
_ErrLinkXmit	EQU 44D4h\r
_ErrMemory	EQU 44B9h\r
_ErrNon_Real	EQU 44A4h\r
_ErrNonReal	EQU 4A8Ch\r
_ErrNotEnoughMem	EQU 448Ch\r
_ErrOverflow	EQU 4495h\r
_ErrSignChange	EQU 44C5h\r
_ErrSingularMat	EQU 449Bh\r
_ErrStat	EQU 44C2h\r
_ErrStatPlot	EQU 44D1h\r
_ErrSyntax	EQU 44A7h\r
_ErrTolTooSmall	EQU 44CEh\r
_ErrUndefined	EQU 44B6h\r
_EToX		EQU 40B4h\r
_Exch9		EQU 43D5h\r
_ExLp		EQU 4222h\r
_ExpToHex	EQU 424Fh\r
\r
_Factorial	EQU 4B85h\r
_FillRect	EQU 4D62h\r
_FillRectPattern	EQU 4D89h\r
_Find_Parse_Formula	EQU 4AF2h\r
_FindAlphaDn	EQU 4A47h\r
_FindAlphaUp	EQU 4A44h\r
_FindApp		EQU 4C4Eh\r
_FindAppDn		EQU 4C4Bh\r
_FindAppNumPages	EQU 509Bh\r
_FindAppUp		EQU 4C48h\r
_FindSym	EQU 42F4h\r
_FiveExec	EQU 467Eh\r
_FixTempCnt	EQU 4A3Bh\r
_FlashToRam	EQU 5017h\r
_ForceFullScreen	EQU 508Fh\r
_FormBase	EQU 50AAh\r
_FormDCplx	EQU 4996h\r
_FormEReal	EQU 4990h\r
_FormReal	EQU 4999h\r
_FourExec	EQU 467Bh\r
_FPAdd		EQU 4072h\r
_FPDiv		EQU 4099h\r
_FPMult		EQU 4084h\r
_FPRecip	EQU 4096h\r
_FPSquare	EQU 4081h\r
_FPSub		EQU 406Fh\r
_Frac		EQU 4093h\r
\r
_Get_Tok_Strng	EQU 4594h  ;***\r
_GetBaseVer	EQU 4C6Fh\r
_GetCSC		EQU 4018h\r
_GetKey		EQU 4972h\r
_GetLToOP1	EQU 4636h\r
_GetMToOP1	EQU 4615h\r
_GetSysInfo 	EQU 50DDh  ; v. 1.13+ only\r
_GetTokLen	EQU 4591h  ;***\r
_GrBufClr	EQU 4BD0h\r
_GrBufCpy	EQU 486Ah\r
_GrphCirc	EQU 47D7h\r
\r
_HLTimes9	EQU 40F9h\r
_HorizCmd	EQU 48A6h\r
_HTimesL	EQU 4276h\r
\r
_IBounds	EQU 4C60h\r
_IBoundsFull	EQU 4D98h\r
_ILine		EQU 47E0h\r
_IncLstSize	EQU 4A29h\r
_InsertList	EQU 4A2Ch\r
_InsertMem	EQU 42F7h\r
_Int		EQU 40A5h\r
_Intgr		EQU 405Dh\r
_InvCmd		EQU 48C7h\r
_InvertRect	EQU 4D5Fh\r
_InvOP1S	EQU 408Dh\r
_InvOP1SC	EQU 408Ah\r
_InvOP2S	EQU 4090h\r
_InvSub		EQU 4063h\r
_IOffset	EQU 4C63h\r
_IPoint		EQU 47E3h\r
_IsA2ByteTok	EQU 42A3h  ;***\r
_IsEditEmpty	EQU 492Dh  ;***\r
\r
_JError		EQU 44D7h\r
_JErrorNo	EQU 4000h\r
_JForceCmdNoChar	EQU 4027h\r
_JForceGraphKey	EQU 5005h\r
_JForceGraphNoKey	EQU 5002h\r
\r
_KeyToString	EQU 45CAh\r
\r
_LCD_DRIVERON	equ 4978h  ;***\r
_LdHLind	equ 4009h  ;***\r
_LineCmd	EQU 48ACh\r
_LnX		EQU 40ABh\r
_Load_SFont	EQU 4783h\r
_LoadCIndPaged	EQU 501Dh\r
_LoadDEIndPaged	EQU 501Ah\r
_LoadPattern	EQU 4CB1h\r
_LogX		EQU 40AEh\r
\r
_Max		EQU 4057h\r
_MemChk		EQU 42E5h\r
_MemClear	EQU 4C30h\r
_MemSet		EQU 4C33h\r
_Min		EQU 4054h\r
_Minus1		EQU 406Ch\r
_Mov10B		EQU 415Ch\r
_Mov18B		EQU 47DAh\r
_Mov7B		EQU 4168h\r
_Mov8B		EQU 4165h\r
_Mov9B		EQU 415Fh\r
_Mov9OP1OP2	EQU 417Dh\r
_Mov9OP2Cp	EQU 410Bh\r
_Mov9ToOP1	EQU 417Ah\r
_Mov9ToOP2	EQU 4180h\r
_MovFrOP1	EQU 4183h\r
\r
_NewLine	EQU 452Eh  ;***\r
\r
_OneVar		EQU 4BA3h\r
_OP1ExOP2	EQU 421Fh\r
_OP1ExOP3	EQU 4219h\r
_OP1ExOP4	EQU 421Ch\r
_OP1ExOP5	EQU 420Dh\r
_OP1ExOP6	EQU 4210h\r
_OP1ExpToDec	EQU 4252h\r
_OP1Set0	EQU 41BFh\r
_OP1Set1	EQU 419Bh\r
_OP1Set2	EQU 41A7h\r
_OP1Set3	EQU 41A1h\r
_OP1Set4	EQU 419Eh\r
_OP1ToOP2	EQU 412Fh\r
_OP1ToOP3	EQU 4123h\r
_OP1ToOP4	EQU 4117h\r
_OP1ToOP5	EQU 4153h\r
_OP1ToOP6	EQU 4150h\r
_OP2ExOP4	EQU 4213h\r
_OP2ExOP5	EQU 4216h\r
_OP2ExOP6	EQU 4207h\r
_OP2Set0	EQU 41BCh\r
_OP2Set1	EQU 41ADh\r
_OP2Set2	EQU 41AAh\r
_OP2Set3	EQU 4198h\r
_OP2Set4	EQU 4195h\r
_OP2Set5	EQU 418Fh\r
_OP2Set60	EQU 4AB0h\r
_OP2Set8	EQU 418Ch\r
_OP2SetA	EQU 4192h\r
_OP2ToOP1	EQU 4156h\r
_OP2ToOP3	EQU 416Eh\r
_OP2ToOP4	EQU 411Ah\r
_OP2ToOP5	EQU 414Ah\r
_OP2ToOP6	EQU 414Dh\r
_OP3Set0	EQU 41B9h\r
_OP3Set1	EQU 4189h\r
_OP3Set2	EQU 41A4h\r
_OP3ToOP1	EQU 413Eh\r
_OP3ToOP2	EQU 4120h\r
_OP3ToOP4	EQU 4114h\r
_OP3ToOP5	EQU 4147h\r
_OP4Set0	EQU 41B6h\r
_OP4Set1	EQU 4186h\r
_OP4ToOP1	EQU 4138h\r
_OP4ToOP2	EQU 411Dh\r
_OP4ToOP3	EQU 4171h\r
_OP4ToOP5	EQU 4144h\r
_OP4ToOP6	EQU 4177h\r
_OP5ExOP6	EQU 420Ah\r
_OP5Set0	EQU 41B3h\r
_OP5ToOP1	EQU 413Bh\r
_OP5ToOP2	EQU 4126h\r
_OP5ToOP3	EQU 4174h\r
_OP5ToOP4	EQU 412Ch\r
_OP5ToOP6	EQU 4129h\r
_OP6ToOP1	EQU 4135h\r
_OP6ToOP2	EQU 4132h\r
_OP6ToOP5	EQU 4141h\r
_OutputExpr	EQU 4BB2h\r
\r
_PagedGet	EQU 5023h\r
_ParseInp	EQU 4A9Bh\r
_PDspGrph	EQU 48A3h\r
_PixelTest	EQU 48B5h\r
_Plus1		EQU 4069h\r
_PointCmd	EQU 48B2h\r
_PointOn	EQU 4C39h\r
_PopMCplxO1	EQU 436Fh  ;***\r
_PopOP1		EQU 437Eh\r
_PopOP3		EQU 437Bh\r
_PopOP5		EQU 4378h\r
_PopReal	EQU 4393h\r
_PopRealO1	EQU 4390h\r
_PopRealO2	EQU 438Dh\r
_PopRealO3	EQU 438Ah\r
_PopRealO4	EQU 4387h\r
_PopRealO5	EQU 4384h\r
_PopRealO6	EQU 4381h\r
_PosNo0Int	EQU 422Eh\r
_PToR		EQU 40F3h\r
_PushMCplxO1	EQU 43CFh  ;***\r
_PushMCplxO3	EQU 43C6h  ;***\r
_PushOP1	EQU 43C9h\r
_PushOP3	EQU 43C3h\r
_PushOP5	EQU 43C0h\r
_PushReal	EQU 43BDh\r
_PushRealO1	EQU 43BAh\r
_PushRealO2	EQU 43B7h\r
_PushRealO3	EQU 43B4h\r
_PushRealO4	EQU 43B1h\r
_PushRealO5	EQU 43AEh\r
_PushRealO6	EQU 43ABh\r
_PutAway	EQU 4039h  ;***\r
_PutC		EQU 4504h\r
_PutMap		EQU 4501h\r
_PutPS		EQU 4510h\r
_PutPSB		EQU 450dh  ;***\r
_PutS		EQU 450Ah\r
_PutTokString	EQU 4960h\r
_PutToL		EQU 4645h\r
_PutToMat	EQU 461Eh\r
\r
_RandInit	EQU 4B7Fh\r
_Random		EQU 4B79h\r
_Rcl_StatVar	EQU 42DCh\r
_RclAns		EQU 4AD7h\r
_RclGDB2	EQU 47D1h\r
_RclN		EQU 4ADDh\r
_RclSysTok	EQU 4AE6h\r
_RclVarSym	EQU 4AE3h\r
_RclX		EQU 4AE0h\r
_RclY		EQU 4ADAh\r
_Rec1stByte	EQU 4EFAh\r
_Rec1stByteNC	EQU 4EFDh\r
_RecAByteIO	EQU 4F03h\r
_RedimMat	EQU 4A26h\r
_Regraph	EQU 488Eh\r
_ReleaseBuffer	EQU 4771h  ;***\r
_ReloadAppEntryVecs	EQU 4C36h\r
_RestoreDisp	EQU 4870h\r
_RName		EQU 427Fh\r
_RndGuard	EQU 409Fh\r
_RnFx		EQU 40A2h\r
_Round		EQU 40A8h\r
_RToD		EQU 4078h\r
_RToP		EQU 40F6h\r
_RunIndicOff	EQU 4570h\r
_RunIndicOn	EQU 456Dh\r
\r
_SaveDisp	EQU 4C7Bh\r
_SendAByte	EQU 4EE5h\r
_SendVarCmd	EQU 4A14h ;***\r
_SetAllPlots	EQU 4FCCh\r
_SetExSpeed 	EQU 50BFh ; v. 1.13+ only\r
_SetFuncM	EQU 4840h\r
_SetNorm_Vals	EQU 49FCh\r
_SetParM	EQU 4849h\r
_SetPolM	EQU 4846h\r
_SetSeqM	EQU 4843h\r
_SetTblGraphDraw	EQU 4C00h\r
_SetupPagedPtr	EQU 5020h\r
_SetXXOP1	EQU 478Ch\r
_SetXXOP2	EQU 478Fh\r
_SetXXXXOP2	EQU 4792h\r
_SFont_Len	EQU 4786h\r
_Sin		EQU 40BDh\r
_SinCosRad	EQU 40BAh\r
_SinH		EQU 40CFh\r
_SinHCosH	EQU 40C6h\r
_SqRoot		EQU 409Ch\r
_SrchVLstDn	EQU 4F12h\r
_SrchVLstUp	EQU 4F0Fh\r
_SStringLength	EQU 4CB4h\r
_StMatEl	EQU 4AE9h\r
_StoAns		EQU 4ABFh\r
_StoGDB2	EQU 47CEh\r
_StoN		EQU 4ACBh\r
_StoOther	EQU 4AD4h\r
_StoR		EQU 4AC5h\r
_StoRand	EQU 4B7Ch\r
_StoSysTok	EQU 4ABCh\r
_StoT		EQU 4ACEh\r
_StoTheta	EQU 4AC2h\r
_StoX		EQU 4AD1h\r
_StoY		EQU 4AC8h\r
_StrCopy	EQU 44E3h\r
_StrLength	EQU 4C3Fh   \r
\r
_Tan		EQU 40C3h\r
_TanH		EQU 40C9h\r
_TanLnF		EQU 48BBh\r
_TenX		EQU 40B7h\r
_ThetaName	EQU 427Ch\r
_ThreeExec	EQU 4675h\r
_Times2		EQU 4066h\r
_TimesPt5	EQU 407Eh\r
_TName		EQU 428Eh\r
_ToFrac		EQU 4657h\r
_Trunc		EQU 4060h\r
\r
_UCLineS	EQU 4795h\r
_UnLineCmd	EQU 48AFh\r
_UnOPExec	EQU 4672h\r
\r
_VertCmd	EQU 48A9h\r
_VPutMap	EQU 455Eh\r
_VPutS		EQU 4561h\r
_VPutSN		EQU 4564h\r
_VtoWHLDE	EQU 47FBh\r
\r
\r
_XftoI		EQU 4804h\r
_Xitof		EQU 47FEh\r
_XName		EQU 4288h\r
_XRootY		EQU 479Eh\r
\r
_YftoI		EQU 4801h\r
_YName		EQU 428Bh\r
_YToX		EQU 47A1h\r
\r
_Zero16D	EQU 41B0h\r
_ZeroOP		EQU 41CEh\r
_ZeroOP1	EQU 41C5h\r
_ZeroOP2	EQU 41C8h\r
_ZeroOP3	EQU 41CBh\r
_ZmDecml	EQU 484Fh\r
_ZmFit		EQU 485Bh\r
_ZmInt		EQU 484Ch\r
_ZmPrev		EQU 4852h\r
_ZmSquare	EQU 485Eh\r
_ZmStats	EQU 47A4h\r
_ZmTrig		EQU 4861h\r
_ZmUsr		EQU 4855h\r
_ZooDefault	EQU 4867h\r
;\r
;======================================================================\r
;           System-defined RAM Variable Address Equates\r
;======================================================================\r
;\r
\r
ramStart             EQU  8000h\r
appData              EQU  8000h\r
ramCode              EQU  8100h\r
ramCodeEnd           EQU  822Fh\r
baseAppBrTab         EQU  8230h\r
bootTemp             EQU  8251h\r
appSearchPage        EQU  82A3h\r
tempSwapArea         EQU  82A5h\r
appID                EQU  838Dh\r
ramReturnData        EQU  83EDh\r
arcInfo              EQU  83EEh\r
savedArcInfo         EQU  8406h\r
appInfo              EQU  8432h\r
appBank_jump         EQU  843Ch\r
appPage              EQU  843Eh\r
kbdScanCode          EQU  843Fh\r
kbdKey               EQU  8444h\r
kbdGetKy             EQU  8445h\r
keyExtend            EQU  8446h\r
contrast             EQU  8447h\r
apdSubTimer          EQU  8448h\r
apdTimer             EQU  8449h\r
curTime              EQU  844Ah\r
curRow               EQU  844Bh\r
curCol               EQU  844Ch\r
curOffset            EQU  844Dh\r
curUnder             EQU  844Eh\r
curY                 EQU  844Fh\r
curType              EQU  8450h\r
curXRow              EQU  8451h\r
prevDData            EQU  8452h\r
lFont_record         EQU  845Ah\r
sFont_record         EQU  8462h\r
tokVarPtr            EQU  846Ah\r
tokLen               EQU  846Ch\r
indicMem             EQU  846Eh\r
indicCounter         EQU  8476h\r
indicBusy            EQU  8477h\r
OP1                  EQU  8478h\r
OP1M                 EQU  847Ah\r
OP2                  EQU  8483h\r
OP2M                 EQU  8485h\r
OP2EXT               EQU  848Ch\r
OP3                  EQU  848Eh\r
OP3M                 EQU  8490h\r
OP4                  EQU  8499h\r
OP4M                 EQU  849Bh\r
OP5                  EQU  84A4h\r
OP5M                 EQU  84A6h\r
OP6                  EQU  84AFh\r
OP6M                 EQU  84B1h\r
OP6EXT               EQU  84B8h\r
progToEdit           EQU  84BFh\r
nameBuff             EQU  84C7h\r
equ_edit_save        EQU  84D2h\r
iMathPtr1            EQU  84D3h\r
iMathPtr2            EQU  84D5h\r
iMathPtr3            EQU  84D7h\r
iMathPtr4            EQU  84D9h\r
iMathPtr5            EQU  84DBh\r
chkDelPtr1           EQU  84DDh\r
chkDelPtr2           EQU  84DFh\r
insDelPtr            EQU  84E1h\r
upDownPtr            EQU  84E3h\r
fOutDat              EQU  84E5h\r
asm_data_ptr1        EQU  84EBh\r
asm_data_ptr2        EQU  84EDh\r
asm_sym_ptr1         EQU  84EFh\r
asm_sym_ptr2         EQU  84F1h\r
asm_ram              EQU  84F3h\r
asm_ind_call         EQU  8507h\r
textShadow           EQU  8508h\r
textShadCur          EQU  8588h\r
textShadTop          EQU  858Ah\r
textShadAlph         EQU  858Bh\r
textShadIns          EQU  858Ch\r
cxMain               EQU  858Dh\r
cxPPutAway           EQU  858Fh\r
cxPutAway            EQU  8591h\r
cxRedisp             EQU  8593h\r
cxErrorEP            EQU  8595h\r
cxSizeWind           EQU  8597h\r
cxPage               EQU  8599h\r
cxCurApp             EQU  859Ah\r
cxPrev               EQU  859Bh\r
monQH                EQU  85AAh\r
monQT                EQU  85ABh\r
monQueue             EQU  85ACh\r
onSP                 EQU  85BCh\r
promptRow            EQU  85C0h\r
promptCol            EQU  85C1h\r
promptIns            EQU  85C2h\r
promptShift          EQU  85C3h\r
promptRet            EQU  85C4h\r
promptValid          EQU  85C6h\r
promptTop            EQU  85C8h\r
promptCursor         EQU  85CAh\r
promptTail           EQU  85CCh\r
promptBtm            EQU  85CEh\r
varType              EQU  85D0h\r
varCurrent           EQU  85D1h\r
varClass             EQU  85D9h\r
menuActive           EQU  85DCh\r
menuAppDepth         EQU  85DDh\r
MenuCurrent          EQU  85DEh\r
ProgCurrent          EQU  85E8h\r
userMenuSA           EQU  85FEh\r
ioPrompt             EQU  865Fh\r
dImageWidth          EQU  8660h\r
RectFillPHeight      equ  8660h\r
RectFillPWidth       equ  8661h\r
RectFillPattern      equ  8662h\r
ioFlag               EQU  8670h\r
sndRecState          EQU  8672h\r
ioErrState           EQU  8673h\r
header               EQU  8674h\r
ioData               EQU  867Dh\r
ioNewData            EQU  8689h\r
bakHeader            EQU  868Bh\r
penCol               EQU  86D7h\r
penRow               EQU  86D8h\r
rclQueue             EQU  86D9h\r
rclQueueEnd          EQU  86DBh\r
errNo                EQU  86DDh\r
errSP                EQU  86DEh\r
errOffset            EQU  86E0h\r
saveSScreen          EQU  86ECh\r
bstCounter           EQU  89EEh\r
flags                EQU  89F0h\r
statVars             EQU  8A3Ah\r
anovaf_vars          EQU  8C17h\r
infVars              EQU  8C4Dh\r
curGStyle            EQU  8D17h\r
curGY                EQU  8D18h\r
curGX                EQU  8D19h\r
curGY2               EQU  8D1Ah\r
curGX2               EQU  8D1Bh\r
freeSaveY            EQU  8D1Ch\r
freeSaveX            EQU  8D1Dh\r
XOffset              EQU  8DA1h\r
YOffset              EQU  8DA2h\r
lcdTallP             EQU  8DA3h\r
pixWideP             EQU  8DA4h\r
pixWide_m_1          EQU  8DA5h\r
pixWide_m_2          EQU  8DA6h\r
lastEntryPTR         EQU  8DA7h\r
lastEntryStk         EQU  8DA9h\r
numLastEntries       EQU  8E29h\r
currLastEntry        EQU  8E2Ah\r
curInc               EQU  8E67h\r
uXmin                EQU  8E7Eh\r
uXmax                EQU  8E87h\r
uXscl                EQU  8E90h\r
uYmin                EQU  8E99h\r
uYmax                EQU  8EA2h\r
uYscl                EQU  8EABh\r
uThetMin             EQU  8EB4h\r
uThetMax             EQU  8EBDh\r
uThetStep            EQU  8EC6h\r
uTmin                EQU  8ECFh\r
uTmax                EQU  8ED8h\r
uTStep               EQU  8EE1h\r
uPlotStart           EQU  8EEAh\r
unMax                EQU  8EF3h\r
uu0                  EQU  8EFCh\r
uv0                  EQU  8F05h\r
unMin                EQU  8F0Eh\r
uu02                 EQU  8F17h\r
uv02                 EQU  8F20h\r
uw0                  EQU  8F29h\r
uPlotStep            EQU  8F32h\r
uXres                EQU  8F3Bh\r
uw02                 EQU  8F44h\r
Xmin                 EQU  8F50h\r
Xmax                 EQU  8F59h\r
Xscl                 EQU  8F62h\r
Ymin                 EQU  8F6Bh\r
Ymax                 EQU  8F74h\r
Yscl                 EQU  8F7Dh\r
ThetaMin             EQU  8F86h\r
ThetaMax             EQU  8F8Fh\r
ThetaStep            EQU  8F98h\r
TminPar              EQU  8FA1h\r
TmaxPar              EQU  8FAAh\r
Tstep                EQU  8FB3h\r
PlotStart            EQU  8FBCh\r
nMax                 EQU  8FC5h\r
u0                   EQU  8FCEh\r
v0                   EQU  8FD7h\r
nMin                 EQU  8FE0h\r
u02                  EQU  8FE9h\r
v02                  EQU  8FF2h\r
w0                   EQU  8FFBh\r
PlotStep             EQU  9004h\r
XresO                EQU  900Dh\r
w02                  EQU  9016h\r
un1                  EQU  901Fh\r
un2                  EQU  9028h\r
vn1                  EQU  9031h\r
vn2                  EQU  903Ah\r
wn1                  EQU  9043h\r
wn2                  EQU  904Ch\r
fin_N                EQU  9055h\r
fin_I                EQU  905Eh\r
fin_PV               EQU  9067h\r
fin_PMT              EQU  9070h\r
fin_FV               EQU  9079h\r
fin_PY               EQU  9082h\r
fin_CY               EQU  908Bh\r
cal_N                EQU  9094h\r
cal_I                EQU  909Dh\r
cal_PV               EQU  90A6h\r
cal_PMT              EQU  90AFh\r
cal_FV               EQU  90B8h\r
cal_PY               EQU  90C1h\r
smallEditRAM         EQU  90D3h\r
XFact                EQU  913Fh\r
YFact                EQU  9148h\r
Xres_int             EQU  9151h\r
deltaX               EQU  9152h\r
deltaY               EQU  915Bh\r
shortX               EQU  9164h\r
shortY               EQU  916Dh\r
lower                EQU  9176h\r
upper                EQU  917Fh\r
XOutSym              EQU  918Ch\r
XOutDat              EQU  918Eh\r
YOutSym              EQU  9190h\r
YOutDat              EQU  9192h\r
inputSym             EQU  9194h\r
inputDat             EQU  9196h\r
prevData             EQU  9198h\r
TblMin               EQU  92B3h\r
TblStep              EQU  92BCh\r
plotSScreen          EQU  9340h\r
seed1                EQU  9640h\r
seed2                EQU  9649h\r
cmdShadow            EQU  966Eh\r
cmdShadCur           EQU  96EEh\r
cmdShadAlph          EQU  96F0h\r
cmdShadIns           EQU  96F1h\r
cmdCursor            EQU  96F2h\r
editTop              EQU  96F4h\r
editCursor           EQU  96F6h\r
editTail             EQU  96F8h\r
editBtm              EQU  96FAh\r
editSym              EQU  9706h\r
editDat              EQU  9708h\r
winTop               EQU  97A5h\r
winBtm               EQU  97A6h\r
winLeftEdge          EQU  97A7h\r
winLeft              EQU  97A8h\r
winAbove             EQU  97AAh\r
winRow               EQU  97ACh\r
winCol               EQU  97AEh\r
fmtDigits            EQU  97B0h\r
fmtString            EQU  97B1h\r
fmtConv              EQU  97F2h\r
fmtLeft              EQU  9804h\r
fmtIndex             EQU  9806h\r
fmtMatSym            EQU  9808h\r
fmtMatMem            EQU  980Ah\r
EQS                  EQU  980Ch\r
tSymPtr1             EQU  9818h\r
tSymPtr2             EQU  981Ah\r
chkDelPtr3           EQU  981Ch\r
chkDelPtr4           EQU  981Eh\r
tempMem              EQU  9820h\r
fpBase               EQU  9822h\r
FPS                  EQU  9824h\r
OPBase               EQU  9826h\r
OPS                  EQU  9828h\r
pTempCnt             EQU  982Ah\r
cleanTmp             EQU  982Ch\r
pTemp                EQU  982Eh\r
progPtr              EQU  9830h\r
newDataPtr           EQU  9832h\r
pagedCount           EQU  9834h\r
pagedPN              EQU  9835h\r
pagedGetPtr          EQU  9836h\r
pagedPutPtr          EQU  9838h\r
pagedBuf             EQU  983Ah\r
appErr1              EQU  984Dh\r
appErr2              EQU  985Ah\r
flashByte1           EQU  9867h\r
flashByte2           EQU  9868h\r
freeArcBlock         EQU  9869h\r
arcPage              EQU  986Bh\r
arcPtr               EQU  986Ch\r
appRawKeyHandle      EQU  9870h\r
appBackUpScreen      EQU  9872h\r
customHeight         EQU  9B72h\r
localLanguage        EQU  9B73h\r
cursorHookPtr        EQU  9B7Ch\r
rawKeyHookPtr        EQU  9B84h\r
getKeyHookPtr        EQU  9B88h\r
fontHookPtr          EQU  9B9Ch\r
restartClr           EQU  9BD0h\r
localTokStr          EQU  9D65h\r
keyForStr            EQU  9D76h\r
keyToStrRam          EQU  9D77h\r
sedMonSp             EQU  9D88h\r
bpSave               EQU  9D8Ah\r
userMem              EQU  9D95h\r
symTable             EQU  0FE66h\r
\r
;SYMBOLIC_DEBUG_END\r
;\r
;======================================================================\r
;		Language localization equates\r
;======================================================================\r
LANG_NEUTRAL                       equ   00h\r
LANG_DANISH                        equ   06h\r
LANG_DUTCH                         equ   13h\r
LANG_ENGLISH                       equ   09h\r
LANG_FINNISH                       equ   0bh\r
LANG_FRENCH                        equ   0ch\r
LANG_GERMAN                        equ   07h\r
LANG_HUNGARIAN                     equ   0eh\r
LANG_ITALIAN                       equ   10h\r
LANG_NORWEGIAN                     equ   14h\r
LANG_POLISH                        equ   15h\r
LANG_PORTUGUESE                    equ   16h\r
LANG_SPANISH                       equ   0ah\r
LANG_SWEDISH                       equ   1dh\r
\r
SUBLANG_NEUTRAL                    equ   00h   ; language neutral\r
SUBLANG_DUTCH                    equ   01h   ; Dutch\r
SUBLANG_ENGLISH_US               equ   01h   ; English (USA)\r
SUBLANG_FRENCH                   equ   01h   ; French\r
SUBLANG_GERMAN                   equ   01h   ; German\r
SUBLANG_ITALIAN                  equ   01h   ; Italian\r
SUBLANG_NORWEGIAN_BOKMAL         equ   01h   ; Norwegian (Bokmal)\r
SUBLANG_PORTUGUESE               equ   02h   ; Portuguese\r
SUBLANG_SPANISH                  equ   01h   ; Spanish (Castilian)\r
\r
\r
;======================================================================\r
;           Error handler equates/macros \r
;======================================================================\r
;\r
APP_PUSH_ERRORH EQU	59h\r
APP_POP_ERRORH	EQU	5Ch\r
;\r
#define AppOnErr xxxx	ld HL,xxxx \\ CALL APP_PUSH_ERRORH\r
#define AppOffErr		CALL	APP_POP_ERRORH\r
;\r
;======================================================================\r
;           System and State Flags\r
;======================================================================\r
;\r
\r
trigFlags	EQU  0		;Trigonometry mode settings\r
trigDeg 	EQU    2	; 1=degrees, 0=radians\r
\r
kbdFlags	EQU  0		;Keyboard scan\r
kbdSCR		EQU    3	; 1=scan code ready\r
kbdKeyPress	EQU    4	; 1=key has been pressed\r
\r
doneFlags	EQU  0		;display "Done"\r
donePrgm	EQU    5	; 1=display "Done" after prgm\r
\r
ioDelFlag	EQU  0\r
inDelete	EQU    0	;1 = DELETE SCREEN \r
\r
;----------------------------------------------------------------------\r
editFlags	EQU  1\r
editOpen	EQU    2	; 1=edit buffer is open\r
\r
monFlags	EQU  1		;monitor flags\r
monAbandon	EQU    4	; 1=don't start any long process\r
				; in put away (#715)\r
;----------------------------------------------------------------------\r
plotFlags	EQU  2		;plot generation flags\r
plotLoc 	EQU    1	; 0=bkup & display, 1=display only\r
plotDisp	EQU    2	; 1=plot is in display, 0=text in display\r
\r
\r
grfModeFlags	EQU  2		;graph mode settings\r
grfFuncM	EQU    4	; 1=function graph\r
grfPolarM	EQU    5	; 1=polar graph\r
grfParamM	EQU    6	; 1=parametric graph\r
grfRecurM       EQU    7        ; 1=RECURSION graph\r
\r
graphFlags	EQU  3\r
graphDraw	EQU    0	; 0=graph is valid, 1=redraw graph\r
\r
grfDBFlags	EQU  4\r
grfDot		EQU    0	; 0=line, 1=dot\r
grfSimul	EQU    1	; 0=sequential, 1=simultaneous\r
grfGrid 	EQU    2	; 0=no grid, 1=grid\r
grfPolar	EQU    3	; 0=rectangular, 1=polar coordinates\r
grfNoCoord	EQU    4	; 0=display coordinates, 1=off\r
grfNoAxis	EQU    5	; 0=axis, 1=no axis\r
grfLabel	EQU    6	; 0=off, 1=axis label\r
\r
textFlags	EQU  5		;Text output flags\r
textEraseBelow	EQU    1	; 1=erase line below small char\r
textScrolled	EQU    2	; 1=screen scrolled\r
textInverse	EQU    3	; 1=display inverse bit-map\r
textInsMode	EQU    4	; 0=overstrike, 1=insert mode\r
\r
ParsFlag2	EQU  7		;PARSER flags\r
numOP1		EQU    0	; 1=RESULT IN OP1, 0=NO RESULT\r
\r
newDispF        EQU  8		;Derivative mode flags\r
preClrForMode   EQU    0	; 1=HELP BLINK ON MODE SCREEN\r
\r
apdFlags	EQU  8		;Automatic power-down\r
apdAble 	EQU    2	; 1=APD enabled\r
apdRunning	EQU    3	; 1=APD clock running\r
\r
\r
web_err_mask    EQU  60h\r
\r
onFlags 	EQU  9		;on key flags\r
onRunning	EQU  3		; 1 = calculator is running\r
onInterrupt	EQU    4	; 1=on key interrupt request\r
\r
statFlags	EQU  9		;statistics flags\r
statsValid	EQU    6	; 1=stats are valid\r
statANSDISP	EQU  7		; 1=display stat results\r
\r
\r
fmtFlags	EQU  10		;numeric format flags\r
fmtExponent	EQU    0	; 1=show exponent, 0=no exponent\r
fmtEng		EQU    1	; 1=engineering notion, 0=scientific\r
fmtHex		EQU    2	; 1=hexadecimal\r
fmtOct		EQU    3	; 1=octal\r
fmtBin		EQU    4	; 1=binary\r
;\r
numMode         EQU  10\r
fmtReal         EQU    5\r
fmtRect         EQU    6\r
fmtPolar        EQU    7\r
\r
realMode        EQU    5\r
rectMode        EQU    6\r
polarMode       EQU    7\r
;					;   if Hex and Oct both = 1\r
;					;   then Bin=0 means >Frac\r
;					;	 Bin=1 means >DMS\r
fmtBaseMask     EQU  00011100B		; mask to base flags\r
fmtBaseShift    EQU  2			; offset to base flags\r
;\r
;       CHECK IF THESE ARE USED BY NUMFORM,\r
;\r
;               EQU  6\r
;               EQU  7\r
\r
fmtOverride	EQU  11		;copy of fmtFlags with conversion override\r
\r
fmtEditFlags	EQU  12		;numeric editing flags\r
fmtEdit 	EQU    0	; 1=format number for editing\r
\r
curFlags	EQU  12		;Cursor\r
curAble 	EQU    2	; 1=cursor flash is enabled\r
curOn		EQU    3	; 1=cursor is showing\r
curLock 	EQU    4	; 1=cursor is locked off\r
\r
appFlags	EQU  13		;application flags\r
appWantIntrpt	EQU    0		; 1=want ON key interrupts\r
appTextSave	EQU    1		; 1=save characters in textShadow\r
appAutoScroll	EQU    2		; 1=auto-scroll text on last line\r
appMenus	EQU    3		; 1=process keys that bring up menus\r
					; 0=check Lock menu flag\r
appLockMenus	EQU    4		; 1=ignore menu keys\r
					; 0=switch to home screen and bring up menu\r
appCurGraphic	EQU    5		; 1=graphic cursor\r
appCurWord	EQU    6		; 1=text cursor covers entire word\r
appExit 	EQU    7		; 1=application handles [EXIT] key itself\r
\r
appWantIntrptF	EQU	1<<appWantIntrpt\r
appTextSaveF	EQU	1<<appTextSave\r
appAutoScrollF	EQU	1<<appAutoScroll\r
appMenusF	EQU	1<<appMenus\r
appLockMenusF	EQU	1<<appLockMenus\r
appCurGraphicF	EQU	1<<appCurGraphic\r
appCurWordF	EQU	1<<appCurWord\r
appExitF	EQU	1<<appExit\r
\r
\r
seqFlags        EQU  15              ; Sequential Graph flags\r
webMode         EQU    0             ; 0 = NORMAL SEQ MODE, 1 = WEB MODE\r
webVert         EQU    1             ;\r
sequv           EQU    2             ; U vs V\r
seqvw           EQU    3             ; V vs W\r
sequw           EQU    4             ; U vs W\r
\r
\r
promptFlags	EQU  17		;prompt line flags\r
promptEdit	EQU    0	; 1=editing in prompt buffer\r
\r
indicFlags	EQU  18		;Indicator flags\r
indicRun	EQU    0	; 1=run indicator ON\r
indicInUse	EQU    1	; indicator save area in use=1, free=0\r
indicOnly	EQU    2	; interrupt handler only checks run indicator\r
\r
shiftFlags	EQU  18		;[2nd] and [ALPHA] flags\r
shift2nd	EQU    3	; 1=[2nd] has been pressed\r
shiftAlpha	EQU    4	; 1=[ALPHA] has been pressed\r
shiftLwrAlph	EQU    5	; 1=lower case, 0=upper case\r
shiftALock	EQU    6	; 1=alpha lock has been pressed\r
shiftKeepAlph	EQU    7	; 1=cannot cancel alpha shift\r
\r
\r
tblFlags        EQU  19		;table flags.\r
autoFill        EQU    4	; 1=prompt, 0=fillAuto\r
autoCalc        EQU    5	; 1=prompt, 0=CalcAuto\r
reTable         EQU    6	; 0=table is ok, 1=must recompute table.\r
\r
sGrFlags	EQU  20\r
grfSplit        EQU    0	; 1=Split Graph, 0=Normal\r
vertSplit       EQU    1	; 1=Vertical (left-right) Split\r
grfSChanged     EQU    2	; 1=Graph just changed Split <-> normal\r
grfSplitOverride EQU   3	; 1 = ignore graph split flag if set\r
write_on_graph  EQU    4	; 1 = TEXT OR EQU WRITING TO GRAPH SCREEN\r
g_style_active  EQU    5	; 1 = GRAPH STYLES ARE ENABLED, USE THEM\r
cmp_mod_box     EQU    6	; 1 = DOING MOD BOX PLOT COMPUTATION\r
textWrite       EQU    7\r
;\r
\r
newIndicFlags   EQU  21\r
extraIndic      EQU    0\r
saIndic         EQU    1\r
\r
newFlags2	    EQU  22\r
noRestores	    EQU  5\r
\r
smartFlags      EQU  23\r
;\r
;----------------------------------------------------------------------\r
; Note: Fix these Equates if smartFlags are moved                            \r
;----------------------------------------------------------------------\r
;\r
smarter_mask    EQU  3\r
smarter_test    EQU  1\r
smartGraph      EQU  0\r
smartGraph_inv  EQU  1                                                 \r
\r
more_Flags	EQU 26\r
\r
No_Del_Stat	EQU 2\r
;----------------------------------------------------------------------\r
;           Available for ASM programming\r
;----------------------------------------------------------------------\r
\r
asm_Flag1       EQU  33          ; ASM CODING\r
asm_Flag2       EQU  34          ; ASM CODING\r
asm_Flag3       EQU  35          ; ASM CODING\r
\r
;----------------------------------------------------------------------\r
;\r
getSendFlg	EQU  36\r
comFailed	EQU  1	      ; 1 = Get/Send Communication Failed\r
;\r
appLwrCaseFlag  EQU  36\r
lwrCaseActive   EQU  3\r
;\r
apiFlg3		EQU  42 \r
;\r
apiFlg4		EQU  43\r
fullScrnDraw	EQU    2	; DRAW INTO LAST ROW/COL OF SCREEN\r
\r
groupFlags	EQU  38\r
inGroup		EQU  1		;1 = IN GROUP CONTEXT\r
\r
\r
xapFlag0        EQU  46      ; external app flags\r
xapFlag1        EQU  47\r
xapFlag2        EQU  48\r
xapFlag3        EQU  49\r
\r
fontFlags	EQU  50\r
fracDrawLFont	EQU    2\r
fracTallLFont	EQU    3\r
customFont	EQU    7  \r
\r
plotFlag3	EQU  60  \r
bufferOnly	EQU    0\r
useFastCirc	EQU    4\r
\r
;\r
varTypeMask	EQU  1FH             \r
varGraphRef	EQU    6\r
\r
;\r
;======================================================================\r
;           Character Font equates  \r
;======================================================================\r
;\r
; Large font equates\r
;\r
LrecurN         EQU     001h\r
LrecurU 	EQU	002h\r
LrecurV 	EQU	003h\r
LrecurW		EQU	004h\r
Lconvert	EQU	005h\r
LsqUp		EQU	006h\r
LsqDown		EQU	007h\r
Lintegral	EQU	008h\r
Lcross		EQU	009h\r
LboxIcon 	EQU     00Ah\r
LcrossIcon 	EQU     00Bh\r
LdotIcon 	EQU     00Ch\r
LsubT   	EQU     00Dh		;small capital T for parametric mode.\r
LcubeR  	EQU     00Eh		;slightly different 3 for cubed root.\r
LhexF		EQU	00Fh\r
Lroot		EQU	010h\r
Linverse	EQU	011h\r
Lsquare		EQU	012h\r
Langle		EQU	013h\r
Ldegree		EQU	014h\r
Lradian		EQU	015h\r
Ltranspose	EQU	016h\r
LLE		EQU	017h\r
LNE		EQU	018h\r
LGE		EQU	019h\r
Lneg		EQU	01Ah\r
Lexponent	EQU	01Bh\r
Lstore		EQU	01Ch\r
Lten		EQU	01Dh\r
LupArrow	EQU	01Eh\r
LdownArrow	EQU	01Fh\r
Lspace		EQU	020h\r
Lexclam		EQU	021h\r
Lquote		EQU	022h\r
Lpound		EQU	023h\r
Lfourth		EQU     024h\r
Lpercent	EQU	025h\r
Lampersand	EQU	026h\r
Lapostrophe	EQU	027h\r
LlParen		EQU	028h\r
LrParen		EQU	029h\r
Lasterisk	EQU	02Ah\r
LplusSign	EQU	02Bh\r
Lcomma		EQU	02Ch\r
Ldash		EQU	02Dh\r
Lperiod		EQU	02Eh\r
Lslash		EQU	02Fh\r
L0		EQU	030h\r
L1		EQU	031h\r
L2		EQU	032h\r
L3		EQU	033h\r
L4		EQU	034h\r
L5		EQU	035h\r
L6		EQU	036h\r
L7		EQU	037h\r
L8		EQU	038h\r
L9		EQU	039h\r
Lcolon		EQU	03Ah\r
Lsemicolon	EQU	03Bh\r
LLT		EQU	03Ch\r
LEQ		EQU	03Dh\r
LGT		EQU	03Eh\r
Lquestion	EQU	03Fh\r
LatSign		EQU	040h\r
LcapA	EQU	041h\r
LcapB	EQU	042h\r
LcapC	EQU	043h\r
LcapD	EQU	044h\r
LcapE	EQU	045h\r
LcapF	EQU	046h\r
LcapG	EQU	047h\r
LcapH	EQU	048h\r
LcapI	EQU	049h\r
LcapJ	EQU	04Ah\r
LcapK	EQU	04Bh\r
LcapL	EQU	04Ch\r
LcapM	EQU	04Dh\r
LcapN	EQU	04Eh\r
LcapO	EQU	04Fh\r
LcapP	EQU	050h\r
LcapQ	EQU	051h\r
LcapR	EQU	052h\r
LcapS	EQU	053h\r
LcapT	EQU	054h\r
LcapU	EQU	055h\r
LcapV	EQU	056h\r
LcapW	EQU	057h\r
LcapX	EQU	058h\r
LcapY	EQU	059h\r
LcapZ	EQU	05Ah\r
Ltheta  EQU     05Bh\r
Lbackslash	EQU	05Ch\r
LrBrack		EQU	05Dh\r
Lcaret		EQU	05Eh\r
Lunderscore	EQU	05Fh\r
Lbackquote	EQU	060h\r
La	EQU	061h\r
Lb	EQU	062h\r
Lc	EQU	063h\r
Ld	EQU	064h\r
Le	EQU	065h\r
Lf	EQU	066h\r
Lg	EQU	067h\r
Lh	EQU	068h\r
Li	EQU	069h\r
Lj	EQU	06Ah\r
Lk	EQU	06Bh\r
Ll	EQU	06Ch\r
Lm	EQU	06Dh\r
Ln	EQU	06Eh\r
Lo	EQU	06Fh\r
Lp	EQU	070h\r
Lq	EQU	071h\r
Lr	EQU	072h\r
Ls	EQU	073h\r
Lt	EQU	074h\r
Lu	EQU	075h\r
Lv	EQU	076h\r
Lw	EQU	077h\r
Lx	EQU	078h\r
Ly	EQU	079h\r
Lz	EQU	07Ah\r
LlBrace	EQU	07Bh\r
Lbar	EQU	07Ch\r
LrBrace	EQU	07Dh\r
Ltilde	EQU	07Eh\r
LinvEQ	EQU	07Fh\r
Lsub0	EQU	080h\r
Lsub1	EQU	081h\r
Lsub2	EQU	082h\r
Lsub3	EQU	083h\r
Lsub4	EQU	084h\r
Lsub5	EQU	085h\r
Lsub6	EQU	086h\r
Lsub7	EQU	087h\r
Lsub8	EQU	088h\r
Lsub9	EQU	089h\r
LcapAAcute	EQU	08Ah\r
LcapAGrave	EQU	08Bh\r
LcapACaret	EQU	08Ch\r
LcapADier	EQU	08Dh\r
LaAcute		EQU	08Eh\r
LaGrave		EQU	08Fh\r
LaCaret		EQU	090h\r
LaDier		EQU	091h\r
LcapEAcute	EQU	092h\r
LcapEGrave	EQU	093h\r
LcapECaret	EQU	094h\r
LcapEDier	EQU	095h\r
LeAcute		EQU	096h\r
LeGrave		EQU	097h\r
LeCaret		EQU	098h\r
LeDier		EQU	099h\r
LcapIAcute	EQU	09Ah\r
LcapIGrave	EQU	09Bh\r
LcapICaret	EQU	09Ch\r
LcapIDier	EQU	09Dh\r
LiAcute		EQU	09Eh\r
LiGrave		EQU	09Fh\r
LiCaret		EQU	0A0h\r
LiDier		EQU	0A1h\r
LcapOAcute	EQU	0A2h\r
LcapOGrave	EQU	0A3h\r
LcapOCaret	EQU	0A4h\r
LcapODier	EQU	0A5h\r
LoAcute		EQU	0A6h\r
LoGrave		EQU	0A7h\r
LoCaret		EQU	0A8h\r
LoDier		EQU	0A9h\r
LcapUAcute	EQU	0AAh\r
LcapUGrave	EQU	0ABh\r
LcapUCaret	EQU	0ACh\r
LcapUDier	EQU	0ADh\r
LuAcute		EQU	0AEh\r
LuGrave		EQU	0AFh\r
LuCaret		EQU	0B0h\r
LuDier		EQU	0B1h\r
LcapCCed	EQU	0B2h\r
LcCed		EQU	0B3h\r
LcapNTilde	EQU	0B4h\r
LnTilde		EQU	0B5h\r
Laccent		EQU	0B6h\r
Lgrave		EQU	0B7h\r
Ldieresis	EQU	0B8h\r
LquesDown	EQU	0B9h\r
LexclamDown	EQU	0BAh\r
Lalpha		EQU	0BBh\r
Lbeta		EQU	0BCh\r
Lgamma		EQU	0BDh\r
LcapDelta	EQU	0BEh\r
Ldelta		EQU	0BFh\r
Lepsilon	EQU	0C0h\r
LlBrack 	EQU     0C1h\r
Llambda		EQU	0C2h\r
Lmu		EQU	0C3h\r
Lpi		EQU	0C4h\r
Lrho		EQU	0C5h\r
LcapSigma	EQU	0C6h\r
Lsigma		EQU	0C7h\r
Ltau		EQU	0C8h\r
Lphi		EQU	0C9h\r
LcapOmega	EQU	0CAh\r
LxMean		EQU	0CBh\r
LyMean		EQU	0CCh\r
LsupX		EQU	0CDh\r
Lellipsis	EQU	0CEh\r
Lleft		EQU	0CFh\r
Lblock		EQU	0D0h\r
Lper		EQU	0D1h\r
Lhyphen		EQU	0D2h\r
Larea		EQU	0D3h\r
Ltemp		EQU	0D4h\r
Lcube		EQU	0D5h\r
Lenter		EQU	0D6h\r
LimagI		EQU	0D7h\r
Lphat		EQU	0D8h\r
Lchi		EQU	0D9h\r
LstatF		EQU     0DAh\r
Llne		EQU	0DBh\r
LlistL		EQU	0DCh\r
LfinanN 	EQU	0DDh\r
L2_r_paren 	EQU	0DEh\r
LblockArrow     EQU     0DFh\r
LcurO   	EQU     0E0h\r
LcurO2  	EQU     0E1h\r
LcurOcapA       EQU     0E2h\r
LcurOa  	EQU     0E3h\r
LcurI   	EQU     0E4h\r
LcurI2  	EQU     0E5h\r
LcurIcapA       EQU     0E6h\r
LcurIa  	EQU     0E7h\r
LGline          EQU     0E8h    ; = 0\r
LGthick         EQU     0E9h    ; = 1\r
LGabove         EQU     0EAh    ; = 2\r
LGbelow         EQU     0EBh    ; = 3\r
LGpath          EQU     0ECh    ; = 4\r
LGanimate       EQU     0EDh    ; = 5\r
LGdot           EQU     0EEh    ; = 6\r
LUpBlk          EQU     0EFh    ;Up arrow and Block in solver\r
LDnBlk          EQU     0F0h    ;Down arrow and Block in solver\r
LcurFull        EQU     0F1h    ;note: must be last char (PutMap checks)\r
\r
;Small font equates\r
;\r
SrecurN         equ     001h\r
SrecurU		equ	002h\r
SrecurV		equ	003h\r
SrecurW		equ	004h\r
Sconvert	equ	005h\r
SFourSpaces 	equ 	006h\r
SsqDown		equ	007h\r
Sintegral	equ	008h\r
Scross		equ	009h\r
SboxIcon 	equ	00Ah\r
ScrossIcon 	equ	00Bh\r
SdotIcon 	equ    	00Ch\r
SsubT   	equ     00Dh\r
ScubeR  	equ     00Eh\r
ShexF		equ	00Fh\r
Sroot		equ	010h\r
Sinverse	equ	011h\r
Ssquare		equ	012h\r
Sangle		equ	013h\r
Sdegree		equ	014h\r
Sradian		equ	015h\r
Stranspose	equ	016h\r
SLE		equ	017h\r
SNE		equ	018h\r
SGE		equ	019h\r
Sneg		equ	01Ah\r
Sexponent	equ	01Bh\r
Sstore		equ	01Ch\r
Sten		equ	01Dh\r
SupArrow	equ	01Eh\r
SdownArrow	equ	01Fh\r
Sspace		equ	020h\r
Sexclam		equ	021h\r
Squote		equ	022h\r
Spound		equ	023h\r
Sdollar		equ	024h\r
Spercent	equ	025h\r
Sampersand	equ	026h\r
Sapostrophe	equ	027h\r
SlParen		equ	028h\r
SrParen		equ	029h\r
Sasterisk	equ	02Ah\r
SplusSign	equ	02Bh\r
Scomma		equ	02Ch\r
Sdash		equ	02Dh\r
Speriod		equ	02Eh\r
Sslash		equ	02Fh\r
S0		equ	030h\r
S1		equ	031h\r
S2		equ	032h\r
S3		equ	033h\r
S4		equ	034h\r
S5		equ	035h\r
S6		equ	036h\r
S7		equ	037h\r
S8		equ	038h\r
S9		equ	039h\r
Scolon		equ	03Ah\r
Ssemicolon	equ	03Bh\r
SLT		equ	03Ch\r
SEQ		equ	03Dh\r
SGT		equ	03Eh\r
Squestion	equ	03Fh\r
SatSign		equ	040h\r
ScapA		equ	041h\r
ScapB		equ	042h\r
ScapC		equ	043h\r
ScapD		equ	044h\r
ScapE		equ	045h\r
ScapF		equ	046h\r
ScapG		equ	047h\r
ScapH		equ	048h\r
ScapI		equ	049h\r
ScapJ		equ	04Ah\r
ScapK		equ	04Bh\r
ScapL		equ	04Ch\r
ScapM		equ	04Dh\r
ScapN		equ	04Eh\r
ScapO		equ	04Fh\r
ScapP		equ	050h\r
ScapQ		equ	051h\r
ScapR		equ	052h\r
ScapS		equ	053h\r
ScapT		equ	054h\r
ScapU		equ	055h\r
ScapV		equ	056h\r
ScapW		equ	057h\r
ScapX		equ	058h\r
ScapY		equ	059h\r
ScapZ		equ	05Ah\r
Stheta  	equ     05Bh\r
Sbackslash	equ	05Ch\r
SrBrack		equ	05Dh\r
Scaret		equ	05Eh\r
Sunderscore	equ	05Fh\r
Sbackquote	equ	060h\r
SmallA		equ	061h\r
SmallB		equ	062h\r
SmallC		equ	063h\r
SmallD		equ	064h\r
SmallE		equ	065h\r
SmallF		equ	066h\r
SmallG		equ	067h\r
SmallH		equ	068h\r
SmallI		equ	069h\r
SmallJ		equ	06Ah\r
SmallK		equ	06Bh\r
SmallL		equ	06Ch\r
SmallM		equ	06Dh\r
SmallN		equ	06Eh\r
SmallO		equ	06Fh\r
SmallP		equ	070h\r
SmallQ		equ	071h\r
SmallR		equ	072h\r
SmallS		equ	073h\r
SmallT		equ	074h\r
SmallU		equ	075h\r
SmallV		equ	076h\r
SmallW		equ	077h\r
SmallX		equ	078h\r
SmallY		equ	079h\r
SmallZ		equ	07Ah\r
SlBrace		equ	07Bh\r
Sbar		equ	07Ch\r
SrBrace		equ	07Dh\r
Stilde		equ	07Eh\r
SinvEQ		equ	07Fh\r
Ssub0		equ	080h\r
Ssub1		equ	081h\r
Ssub2		equ	082h\r
Ssub3		equ	083h\r
Ssub4		equ	084h\r
Ssub5		equ	085h\r
Ssub6		equ	086h\r
Ssub7		equ	087h\r
Ssub8		equ	088h\r
Ssub9		equ	089h\r
ScapAAcute	equ	08Ah\r
ScapAGrave	equ	08Bh\r
ScapACaret	equ	08Ch\r
ScapADier	equ	08Dh\r
SaAcute		equ	08Eh\r
SaGrave		equ	08Fh\r
SaCaret		equ	090h\r
SaDier		equ	091h\r
ScapEGrave	equ	092h\r
ScapEAcute	equ	093h\r
ScapECaret	equ	094h\r
ScapEDier	equ	095h\r
SeAcute		equ	096h\r
SeGrave		equ	097h\r
SeCaret		equ	098h\r
SeDier		equ	099h\r
ScapIAcute	equ	09Ah\r
ScapIGrave	equ	09Bh\r
ScapICaret	equ	09Ch\r
ScapIDier	equ	09Dh\r
SiAcute		equ	09Eh\r
SiGrave		equ	09Fh\r
SiCaret		equ	0A0h\r
SiDier		equ	0A1h\r
ScapOAcute	equ	0A2h\r
ScapOGrave	equ	0A3h\r
ScapOCaret	equ	0A4h\r
ScapODier	equ	0A5h\r
SoAcute		equ	0A6h\r
SoGrave		equ	0A7h\r
SoCaret		equ	0A8h\r
SoDier		equ	0A9h\r
ScapUAcute	equ	0AAh\r
ScapUGrave	equ	0ABh\r
ScapUCaret	equ	0ACh\r
ScapUDier	equ	0ADh\r
SuAcute		equ	0AEh\r
SuGrave		equ	0AFh\r
SuCaret		equ	0B0h\r
SuDier		equ	0B1h\r
ScapCCed	equ	0B2h\r
ScCed		equ	0B3h\r
ScapNTilde	equ	0B4h\r
SnTilde		equ	0B5h\r
Saccent		equ	0B6h\r
Sgrave		equ	0B7h\r
Sdieresis	equ	0B8h\r
SquesDown	equ	0B9h\r
SexclamDown	equ	0BAh\r
Salpha		equ	0BBh\r
Sbeta		equ	0BCh\r
Sgamma		equ	0BDh\r
ScapDelta	equ	0BEh\r
Sdelta		equ	0BFh\r
Sepsilon	equ	0C0h\r
SlBrack 	equ     0C1h\r
Slambda		equ	0C2h\r
Smu		equ	0C3h\r
Spi		equ	0C4h\r
Srho		equ	0C5h\r
ScapSigma	equ	0C6h\r
Ssigma		equ	0C7h\r
Stau		equ	0C8h\r
Sphi		equ	0C9h\r
ScapOmega	equ	0CAh\r
SxMean		equ	0CBh\r
SyMean		equ	0CCh\r
SsupX		equ	0CDh\r
Sellipsis	equ	0CEh\r
Sleft		equ	0CFh\r
Sblock		equ	0D0h\r
Sper		equ	0D1h\r
Shyphen		equ	0D2h\r
Sarea		equ	0D3h\r
Stemp		equ	0D4h\r
Scube		equ	0D5h\r
Senter		equ	0D6h\r
SimagI		equ	0D7h\r
Sphat		equ	0D8h\r
Schi		equ	0D9h\r
SstatF  	equ     0DAh\r
Slne		equ	0DBh\r
SlistL		equ	0DCh\r
SfinanN 	equ	0DDh\r
S2_r_paren 	equ	0DEh\r
SnarrowCapE     equ     0DFh\r
SListLock 	equ	0E0h\r
Sscatter1 	equ	0E1h                    \r
Sscatter2 	equ	0E2h                    \r
Sxyline1  	equ	0E3h                    \r
Sxyline2  	equ	0E4h\r
Sboxplot1 	equ	0E5h\r
Sboxplot2 	equ	0E6h\r
Shist1    	equ	0E7h\r
Shist2    	equ	0E8h\r
SmodBox1  	equ	0E9h\r
SmodBox2  	equ	0EAh\r
Snormal1  	equ	0EBh\r
Snormal2  	equ	0ECh\r
;\r
;======================================================================\r
;           Keypress Equates\r
;======================================================================\r
;           Keyboard key names\r
;\r
;\r
kRight          EQU       001h\r
kLeft           EQU       002h\r
kUp             EQU       003h\r
kDown           EQU       004h\r
kEnter          EQU       005h\r
kAlphaEnter     EQU       006h\r
kAlphaUp        EQU       007h\r
kAlphaDown      EQU       008h\r
kClear          EQU       009h\r
kDel            EQU       00Ah\r
kIns            EQU       00Bh\r
kRecall         EQU       00Ch\r
kLastEnt        EQU       00Dh\r
kBOL            EQU       00Eh\r
kEOL            EQU       00Fh\r
;\r
kSelAll         EQU       010h\r
kUnselAll       EQU       011h\r
kLtoTI82        EQU       012h\r
kBackup         EQU       013h\r
kRecieve        EQU       014h\r
kLnkQuit        EQU       015h\r
kTrans          EQU       016h\r
kRename         EQU       017h\r
kOverw          EQU       018h\r
kOmit           EQU       019h\r
kCont           EQU       01Ah\r
kSendID         EQU       01Bh\r
kSendSW         EQU       01Ch\r
kYes            EQU       01Dh\r
kNoWay          EQU       01Eh\r
kvSendType      EQU       01Fh\r
kOverWAll       EQU       020h\r
;\r
kNo             EQU       025h\r
kKReset         EQU       026h\r
kApp            EQU       027h\r
;\r
kDoug           EQU       028h\r
kListflag       EQU       029h\r
menuStart       EQU       02Bh\r
;\r
kAreYouSure     EQU       02Bh\r
kAppsMenu       EQU       02Ch\r
kPrgm           EQU       02Dh\r
kZoom           EQU       02Eh\r
kDraw           EQU       02Fh\r
kSPlot          EQU       030h\r
kStat           EQU       031h\r
kMath           EQU       032h\r
kTest           EQU       033h\r
kChar           EQU       034h\r
kVars           EQU       035h\r
kMem            EQU       036h\r
kMatrix         EQU       037h\r
kDist           EQU       038h\r
kAngle          EQU       039h\r
kList           EQU       03Ah\r
kCalc           EQU       03Bh\r
kFin            EQU       03Ch\r
;\r
menuEnd         EQU       kFin\r
;\r
kCatalog        EQU       03Eh\r
kInputDone      EQU       03Fh\r
kOff            EQU       kInputDone\r
;\r
kQuit           EQU       040h\r
appStart        EQU       kQuit\r
\r
;\r
kLinkIO         EQU       041h\r
kMatrixEd       EQU       042h\r
kStatEd         EQU       043h\r
kGraph          EQU       044h\r
kMode           EQU       045h\r
kPrgmEd         EQU       046h        ; PROGRAM EDIT\r
kPrgmCr         EQU       047h        ; PROGRAM CREATE\r
kWindow         EQU       048h        ; RANGE EDITOR\r
kYequ           EQU       049h        ; EQUATION EDITOR\r
kTable          EQU       04Ah        ; TABLE EDITOR\r
kTblSet         EQU       04Bh        ; TABLE SET\r
kChkRAM         EQU       04Ch        ; CHECK RAM\r
kDelMem         EQU       04Dh        ; DELETE MEM\r
kResetMem       EQU       04Eh        ; RESET MEM\r
kResetDef	EQU	  04Fh        ; RESET DEFAULT\r
kPrgmInput      EQU       050h        ; PROGRAM INPUT\r
kZFactEd        EQU       051h        ; ZOOM FACTOR EDITOR\r
kError          EQU       052h        ; ERROR\r
kSolveTVM       EQU       053h        ; TVM SOLVER\r
kSolveRoot	EQU	  054h        ; SOLVE EDITOR\r
kStatP          EQU       055h        ; stat plot\r
kInfStat 	EQU	  056h	      ; Inferential Statistic\r
kFormat         EQU       057h        ; FORMAT\r
kExtApps        EQU       058h        ; External Applications.     NEW\r
kNewApps        EQU       059h        ; New Apps for Cerberus.\r
;\r
append          EQU       kNewApps\r
;\r
echoStart1      EQU       05Ah\r
;\r
kTrace          EQU       05Ah\r
kZFit           EQU       05Bh\r
kZIn            EQU       05Ch\r
kZOut           EQU       05Dh\r
kZPrev          EQU       05Eh\r
kBox            EQU       05Fh\r
kDecml          EQU       060h\r
kSetZm          EQU       061h\r
kSquar          EQU       062h\r
kStd            EQU       063h\r
kTrig           EQU       064h\r
kUsrZm          EQU       065h\r
kZSto           EQU       066h\r
kZInt           EQU       067h\r
kZStat          EQU       068h\r
;\r
echoStart2      EQU       069h\r
;\r
kSelect         EQU       069h\r
kCircl          EQU       06Ah\r
kClDrw          EQU       06Bh\r
kLine           EQU       06Ch\r
kPen            EQU       06Dh\r
kPtChg          EQU       06Eh\r
kPtOff          EQU       06Fh\r
kPtOn           EQU       070h\r
kVert           EQU       071h\r
kHoriz          EQU       072h\r
kText           EQU       073h\r
kTanLn          EQU       074h\r
;\r
kEval           EQU       075h\r
kInters         EQU       076h\r
kDYDX           EQU       077h\r
kFnIntg         EQU       078h\r
kRootG          EQU       079h\r
kDYDT           EQU       07Ah\r
kDXDT           EQU       07Bh\r
kDRDo           EQU       07Ch\r
KGFMin          EQU       07Dh\r
KGFMax          EQU       07Eh\r
;\r
;\r
EchoStart       EQU       07Fh\r
;\r
kListName       EQU       07Fh\r
kAdd            EQU       080h\r
kSub            EQU       081h\r
kMul            EQU       082h\r
kDiv            EQU       083h\r
kExpon          EQU       084h\r
kLParen         EQU       085h\r
kRParen         EQU       086h\r
kLBrack         EQU       087h\r
kRBrack         EQU       088h\r
kShade          EQU       089h\r
kStore          EQU       08Ah\r
kComma          EQU       08Bh\r
kChs            EQU       08Ch\r
kDecPnt         EQU       08Dh\r
k0              EQU       08Eh\r
k1              EQU       08Fh\r
k2              EQU       090h\r
k3              EQU       091h\r
k4              EQU       092h\r
k5              EQU       093h\r
k6              EQU       094h\r
k7              EQU       095h\r
k8              EQU       096h\r
k9              EQU       097h\r
kEE             EQU       098h\r
kSpace          EQU       099h\r
kCapA           EQU       09Ah\r
kCapB           EQU       09Bh\r
kCapC           EQU       09Ch\r
kCapD           EQU       09Dh\r
kCapE           EQU       09Eh\r
kCapF           EQU       09Fh\r
kCapG           EQU       0A0h\r
kCapH           EQU       0A1h\r
kCapI           EQU       0A2h\r
kCapJ           EQU       0A3h\r
kCapK           EQU       0A4h\r
kCapL           EQU       0A5h\r
kCapM           EQU       0A6h\r
kCapN           EQU       0A7h\r
kCapO           EQU       0A8h\r
kCapP           EQU       0A9h\r
kCapQ           EQU       0AAh\r
kCapR           EQU       0ABh\r
kCapS           EQU       0ACh\r
kCapT           EQU       0ADh\r
kCapU           EQU       0AEh\r
kCapV           EQU       0AFh\r
kCapW           EQU       0B0h\r
kCapX           EQU       0B1h\r
kCapY           EQU       0B2h\r
kCapZ           EQU       0B3h\r
kVarx           EQU       0B4h\r
kPi             EQU       0B5h\r
kInv            EQU       0B6h\r
kSin            EQU       0B7h\r
kASin           EQU       0B8h\r
kCos            EQU       0B9h\r
kACos           EQU       0BAh\r
kTan            EQU       0BBh\r
kATan           EQU       0BCh\r
kSquare         EQU       0BDh\r
kSqrt           EQU       0BEh\r
kLn             EQU       0BFh\r
kExp            EQU       0C0h\r
kLog            EQU       0C1h\r
kALog           EQU       0C2h\r
kToABC          EQU       0C3h\r
;\r
kClrTbl         EQU       0C4h\r
;\r
kAns            EQU       0C5h\r
kColon          EQU       0C6h\r
;\r
kNDeriv         EQU       0C7h\r
kFnInt          EQU       0C8h\r
kRoot           EQU       0C9h\r
;\r
kQuest          EQU       0CAh\r
kQuote          EQU       0CBh\r
kTheta          EQU       0CCh\r
kIf             EQU       0CDh\r
kThen           EQU       0CEh\r
kElse           EQU       0CFh\r
kFor            EQU       0D0h\r
kWhile          EQU       0D1h\r
kRepeat         EQU       0D2h\r
kEnd            EQU       0D3h\r
kPause          EQU       0D4h\r
kLbl            EQU       0D5h\r
kGoto           EQU       0D6h\r
kISG            EQU       0D7h\r
kDSL            EQU       0D8h\r
kMenu           EQU       0D9h\r
kExec           EQU       0DAh\r
kReturn         EQU       0DBh\r
kStop           EQU       0DCh\r
kInput          EQU       0DDh\r
kPrompt         EQU       0DEh\r
kDisp           EQU       0DFh\r
kDispG          EQU       0E0h\r
kDispT          EQU       0E1h\r
kOutput         EQU       0E2h\r
kGetKey         EQU       0E3h\r
kClrHome        EQU       0E4h\r
kPrtScr         EQU       0E5h\r
kSinH           EQU       0E6h\r
kCosH           EQU       0E7h\r
kTanH           EQU       0E8h\r
kASinH          EQU       0E9h\r
kACosH          EQU       0EAh\r
kATanH          EQU       0EBh\r
kLBrace         EQU       0ECh\r
kRBrace         EQU       0EDh\r
kI              EQU       0EEh\r
kCONSTeA        EQU       0EFh\r
kPlot3          EQU       0F0h\r
kFMin           EQU       0F1h\r
kFMax           EQU       0F2h\r
kL1A            EQU       0F3h\r
kL2A            EQU       0F4h\r
kL3A            EQU       0F5h\r
kL4A            EQU       0F6h\r
kL5A            EQU       0F7h\r
kL6A            EQU       0F8h\r
kunA            EQU       0F9h\r
kvnA            EQU       0FAh\r
kwnA            EQU       0FBh\r
;\r
;======================================================================\r
;       THIS KEY MEANS THAT IT IS A 2 BYTE KEYCODE\r
;       THERE ARE 2 OF THESE KEYS; BE CAREFUL WITH USAGE\r
;======================================================================\r
;\r
kExtendEcho2    EQU       0FCh\r
;\r
;======================================================================;\r
;       THIS KEY MEANS THAT THE KEY PRESS IS ONE THAT ECHOS\r
;       INTO A BUFFER, AND IT IS A 2 BYTE KEY CODE, GO LOOK AT\r
;       (EXTECHO) FOR THE KEY VALUE \r
;======================================================================\r
;\r
kExtendEcho     EQU       0FEh\r
;\r
\r
kE1BT           EQU       0\r
\r
kDrawInv        EQU       kE1BT\r
kDrawF          EQU       kE1BT+1\r
kPixelOn        EQU       kE1BT+2\r
kPixelOff       EQU       kE1BT+3\r
kPxlTest        EQU       kE1BT+4\r
kRCGDB          EQU       kE1BT+5\r
kRCPic          EQU       kE1BT+6\r
kSTGDB          EQU       kE1BT+7\r
kSTPic          EQU       kE1BT+8\r
kAbs            EQU       kE1BT+9\r
kTEqu           EQU       kE1BT+10    ; ==\r
kTNoteQ         EQU       kE1BT+11    ; <>\r
kTGT            EQU       kE1BT+12    ; >\r
kTGTE           EQU       kE1BT+13    ; > =\r
kTLT            EQU       kE1BT+14    ; <\r
kTLTE           EQU       kE1BT+15    ; < =\r
\r
kAnd            EQU       kE1BT+16\r
kOr             EQU       kE1BT+17\r
kXor            EQU       kE1BT+18\r
kNot            EQU       kE1BT+19\r
\r
kLR1            EQU       kE1BT+20\r
\r
kXRoot          EQU       kE1BT+21\r
kCube           EQU       kE1BT+22\r
kCbRt           EQU       kE1BT+23    ; Cube ROOT\r
kToDec          EQU       kE1BT+24\r
;\r
kCubicR         EQU       kE1BT+25\r
kQuartR         EQU       kE1BT+26\r
;\r
kPlot1          EQU       kE1BT+27\r
kPlot2          EQU       kE1BT+28\r
;\r
\r
kRound          EQU       kE1BT+29\r
kIPart          EQU       kE1BT+30\r
kFPart          EQU       kE1BT+31\r
kInt            EQU       kE1BT+32\r
\r
kRand           EQU       kE1BT+33\r
kNPR            EQU       kE1BT+34\r
kNCR            EQU       kE1BT+35\r
kXFactorial     EQU       kE1BT+36\r
\r
kRad            EQU       kE1BT+37\r
kDegr           EQU       kE1BT+38    ; DEGREES CONV\r
kAPost          EQU       kE1BT+39\r
kToDMS          EQU       kE1BT+40\r
kRToPo          EQU       kE1BT+41    ; R\r
kRToPr          EQU       kE1BT+42\r
kPToRx          EQU       kE1BT+43\r
kPToRy          EQU       kE1BT+44\r
\r
kRowSwap        EQU       kE1BT+45\r
kRowPlus        EQU       kE1BT+46\r
kTimRow         EQU       kE1BT+47\r
kTRowP          EQU       kE1BT+48\r
\r
kSortA          EQU       kE1BT+49\r
kSortD          EQU       kE1BT+50\r
kSeq            EQU       kE1BT+51\r
\r
kMin            EQU       kE1BT+52\r
kMax            EQU       kE1BT+53\r
kMean           EQU       kE1BT+54\r
kMedian         EQU       kE1BT+55\r
kSum            EQU       kE1BT+56\r
kProd           EQU       kE1BT+57\r
\r
kDet            EQU       kE1BT+58\r
kTransp         EQU       kE1BT+59\r
kDim            EQU       kE1BT+60\r
kFill           EQU       kE1BT+61\r
kIdent          EQU       kE1BT+62\r
kRandm          EQU       kE1BT+63\r
kAug            EQU       kE1BT+64\r
\r
kOneVar         EQU       kE1BT+65\r
kTwoVar         EQU       kE1BT+66\r
kLR             EQU       kE1BT+67\r
kLRExp          EQU       kE1BT+68\r
kLRLn           EQU       kE1BT+69\r
kLRPwr          EQU       kE1BT+70\r
kMedMed         EQU       kE1BT+71\r
kQuad           EQU       kE1BT+72\r
kClrLst         EQU       kE1BT+73\r
kHist           EQU       kE1BT+74\r
kxyLine         EQU       kE1BT+75\r
kScatter        EQU       kE1BT+76\r
\r
kmRad           EQU       kE1BT+77\r
kmDeg           EQU       kE1BT+78\r
kmNormF         EQU       kE1BT+79\r
kmSci           EQU       kE1BT+80\r
kmEng           EQU       kE1BT+81\r
kmFloat         EQU       kE1BT+82\r
\r
kFix            EQU       kE1BT+83\r
kSplitOn        EQU       kE1BT+84\r
kFullScreen     EQU       kE1BT+85\r
kStndrd         EQU       kE1BT+86\r
kParam          EQU       kE1BT+87\r
kPolar          EQU       kE1BT+88\r
kSeqG           EQU       kE1BT+89\r
kAFillOn        EQU       kE1BT+90\r
kAFillOff       EQU       kE1BT+91\r
kACalcOn        EQU       kE1BT+92\r
kACalcOff       EQU       kE1BT+93\r
kFNOn           EQU       kE1BT+94\r
kFNOff          EQU       kE1BT+95\r
\r
kPlotsOn        EQU       kE1BT+96\r
kPlotsOff       EQU       kE1BT+97\r
\r
kPixelChg       EQU       kE1BT+98\r
\r
kSendMBL        EQU       kE1BT+99\r
kRecvMBL        EQU       kE1BT+100\r
\r
kBoxPlot        EQU       kE1BT+101\r
kBoxIcon        EQU       kE1BT+102\r
kCrossIcon      EQU       kE1BT+103\r
kDotIcon        EQU       kE1BT+104\r
\r
kE2BT           EQU       kE1BT+105\r
\r
kSeqential      EQU       kE2BT\r
kSimulG         EQU       kE2BT+1\r
kPolarG         EQU       kE2BT+2\r
kRectG          EQU       kE2BT+3\r
kCoordOn        EQU       kE2BT+4\r
kCoordOff       EQU       kE2BT+5\r
kDrawLine       EQU       kE2BT+6\r
kDrawDot        EQU       kE2BT+7\r
kAxisOn         EQU       kE2BT+8\r
kAxisOff        EQU       kE2BT+9\r
kGridOn         EQU       kE2BT+10\r
kGridOff        EQU       kE2BT+11\r
kLblOn          EQU       kE2BT+12\r
kLblOff         EQU       kE2BT+13\r
\r
kL1             EQU       kE2BT+14\r
kL2             EQU       kE2BT+15\r
kL3             EQU       kE2BT+16\r
kL4             EQU       kE2BT+17\r
kL5             EQU       kE2BT+18\r
kL6             EQU       kE2BT+19\r
\r
;\r
;======================================================================\r
;           These keys are layed on top of existing keys to\r
;           enable localization in the inferential stats editor\r
;======================================================================\r
;\r
kinfData        EQU       kL1\r
kinfStats       EQU       kL1+1\r
kinfYes         EQU       kL1+2\r
kinfNo          EQU       kL1+3\r
kinfCalc        EQU       kL1+4\r
kinfDraw        EQU       kL1+5\r
kinfAlt1ne      EQU       kL1+6\r
kinfAlt1lt      EQU       kL1+7\r
kinfAlt1gt      EQU       kL1+8\r
kinfAlt2ne      EQU       kL1+9\r
kinfAlt2lt      EQU       kL1+10\r
kinfAlt2gt      EQU       kL1+11\r
kinfAlt3ne      EQU       kL1+12\r
kinfAlt3lt      EQU       kL1+13\r
kinfAlt3gt      EQU       kL1+14\r
kinfAlt4ne      EQU       kL1+15\r
kinfAlt4lt      EQU       kL1+16\r
kinfAlt4gt      EQU       kL1+17\r
kinfAlt5ne      EQU       kL1+18\r
kinfAlt5lt      EQU       kL1+19\r
kinfAlt5gt      EQU       kL1+20\r
kinfAlt6ne      EQU       kL1+21\r
kinfAlt6lt      EQU       kL1+22\r
kinfAlt6gt      EQU       kL1+23\r
;\r
;\r
kMatA           EQU       kE2BT+20\r
kMatB           EQU       kE2BT+21\r
kMatC           EQU       kE2BT+22\r
kMatD           EQU       kE2BT+23\r
kMatE           EQU       kE2BT+24\r
\r
kXmin           EQU       kE2BT+25\r
kXmax           EQU       kE2BT+26\r
kXscl           EQU       kE2BT+27\r
kYmin           EQU       kE2BT+28\r
kYmax           EQU       kE2BT+29\r
kYscl           EQU       kE2BT+30\r
kTmin           EQU       kE2BT+31\r
kTmax           EQU       kE2BT+32\r
kTStep          EQU       kE2BT+33\r
kOmin           EQU       kE2BT+34\r
kOmax           EQU       kE2BT+35\r
kOStep          EQU       kE2BT+36\r
ku0             EQU       kE2BT+37\r
kv0             EQU       kE2BT+38\r
knMin           EQU       kE2BT+39\r
knMax           EQU       kE2BT+40\r
kDeltaY         EQU       kE2BT+41\r
kDeltaX         EQU       kE2BT+42\r
\r
kZXmin          EQU       kE2BT+43\r
kZXmax          EQU       kE2BT+44\r
kZXscl          EQU       kE2BT+45\r
kZYmin          EQU       kE2BT+46\r
kZYmax          EQU       kE2BT+47\r
kZYscl          EQU       kE2BT+48\r
kZTmin          EQU       kE2BT+49\r
kZTmax          EQU       kE2BT+50\r
kZTStep         EQU       kE2BT+51\r
kZOmin          EQU       kE2BT+52\r
kZOmax          EQU       kE2BT+53\r
kZOStep         EQU       kE2BT+54\r
kZu0            EQU       kE2BT+55\r
kZv0            EQU       kE2BT+56\r
kZnMin          EQU       kE2BT+57\r
kZnMax          EQU       kE2BT+58\r
\r
kDelLast        EQU       kE2BT+59\r
kSinReg         EQU       kE2BT+60\r
kConstE         EQU       kE2BT+61\r
\r
kPic1           EQU       kE2BT+62\r
kPic2           EQU       kE2BT+63\r
kPic3           EQU       kE2BT+64\r
\r
kDelVar         EQU       kE2BT+65\r
kGetCalc        EQU       kE2BT+66\r
kRealM          EQU       kE2BT+67\r
kPolarM         EQU       kE2BT+68\r
kRectM          EQU       kE2BT+69\r
kuv             EQU       kE2BT+70    ; U vs V\r
kvw             EQU       kE2BT+71    ; V vs W\r
kuw             EQU       kE2BT+72    ; U vs W\r
kFinPMTend      EQU       kE2BT+73\r
kFinPMTbeg      EQU       kE2BT+74\r
;\r
kGraphStyle     EQU       kE2BT+75\r
;\r
kExprOn         EQU       kE2BT+76\r
kExprOff        EQU       kE2BT+77\r
kStatA          EQU       kE2BT+78\r
kStatB          EQU       kE2BT+79\r
kStatC          EQU       kE2BT+80\r
kCorr           EQU       kE2BT+81\r
kStatD          EQU       kE2BT+82\r
kStatE          EQU       kE2BT+83\r
kRegEq          EQU       kE2BT+84\r
kMinX           EQU       kE2BT+85\r
kQ1             EQU       kE2BT+86\r
kMD             EQU       kE2BT+87\r
kQ3             EQU       kE2BT+88\r
kMaxX           EQU       kE2BT+89\r
kStatX1         EQU       kE2BT+90\r
kStatY1         EQU       kE2BT+91\r
kStatX2         EQU       kE2BT+92\r
kStatY2         EQU       kE2BT+93\r
kStatX3         EQU       kE2BT+94\r
kStatY3         EQU       kE2BT+95\r
kTblMin         EQU       kE2BT+96\r
kTblStep        EQU       kE2BT+97\r
kSetupLst       EQU       kE2BT+98\r
kClrAllLst      EQU       kE2BT+99\r
kLogistic       EQU       kE2BT+100\r
kZTest          EQU       kE2BT+101\r
kTTest          EQU       kE2BT+102\r
k2SampZTest     EQU       kE2BT+103\r
k2SampTTest     EQU       kE2BT+104\r
k1PropZTest     EQU       kE2BT+105\r
k2PropZTest     EQU       kE2BT+106\r
kChiTest        EQU       kE2BT+107\r
k2SampFTest     EQU       kE2BT+108\r
kZIntVal        EQU       kE2BT+109\r
kTIntVal        EQU       kE2BT+110\r
k2SampTInt      EQU       kE2BT+111\r
k2SampZInt      EQU       kE2BT+112\r
k1PropZInt      EQU       kE2BT+113\r
k2PropZInt      EQU       kE2BT+114\r
kDNormal        EQU       kE2BT+115\r
kInvNorm        EQU       kE2BT+116\r
kDT             EQU       kE2BT+117\r
kChi            EQU       kE2BT+118\r
kDF             EQU       kE2BT+119\r
kBinPDF         EQU       kE2BT+120\r
kBinCDF         EQU       kE2BT+121\r
kPoiPDF         EQU       kE2BT+122\r
kPoiCDF         EQU       kE2BT+123\r
kun             EQU       kE2BT+124\r
kvn             EQU       kE2BT+125\r
kwn             EQU       kE2BT+126\r
kRecn           EQU       kE2BT+127\r
kPlotStart      EQU       kE2BT+128\r
kZPlotStart     EQU       kE2BT+129   ; recursion n\r
kXFact          EQU       kE2BT+130   ; PlotStart\r
kYFact          EQU       kE2BT+131   ; ZPlotStart\r
kANOVA          EQU       kE2BT+132   ; XFact\r
kMaxY           EQU       kE2BT+133   ; YFact\r
kWebOn          EQU       kE2BT+134   ; MinY\r
kWebOff         EQU       kE2BT+135   ; MaxY\r
kTblInput       EQU       kE2BT+136   ; WEB ON\r
kGeoPDF         EQU       kE2BT+137   ; WEB OFF\r
kGeoCDF         EQU       kE2BT+138   ; WEB OFF\r
kShadeNorm      EQU       kE2BT+139\r
kShadeT         EQU       kE2BT+140\r
kShadeChi       EQU       kE2BT+141\r
kShadeF         EQU       kE2BT+142\r
kPlotStep       EQU       kE2BT+143\r
kZPlotStep      EQU       kE2BT+144\r
kLinRegtTest    EQU       kE2BT+145\r
KMGT		EQU	  kE2BT+146   ; VERT SPLIT\r
kSelectA        EQU       kE2BT+147\r
kZFitA          EQU       kE2BT+148\r
kE2BT_End       EQU       kZFitA\r
;\r
;\r
;======================================================================\r
;           More 2 Byte Keys \r
;======================================================================\r
\r
kE2BT2		EQU       0\r
\r
kGDB1		EQU       kE2BT2\r
kGDB2		EQU       kE2BT2+1\r
kGDB3		EQU       kE2BT2+2\r
kY1		EQU       kE2BT2+3\r
kY2		EQU       kE2BT2+4\r
kY3		EQU       kE2BT2+5\r
kY4		EQU       kE2BT2+6\r
kY5		EQU       kE2BT2+7\r
kY6		EQU       kE2BT2+8\r
kY7		EQU       kE2BT2+9\r
kY8		EQU       kE2BT2+10\r
kY9		EQU       kE2BT2+11\r
kY0		EQU       kE2BT2+12\r
kX1T		EQU       kE2BT2+13\r
kY1T		EQU       kE2BT2+14\r
kX2T		EQU       kE2BT2+15\r
kY2T		EQU       kE2BT2+16\r
kX3T		EQU       kE2BT2+17\r
kY3T		EQU       kE2BT2+18\r
kX4T		EQU       kE2BT2+19\r
kY4T		EQU       kE2BT2+20\r
kX5T		EQU       kE2BT2+21\r
kY5T		EQU       kE2BT2+22\r
kX6T		EQU       kE2BT2+23\r
kY6T		EQU       kE2BT2+24\r
kR1		EQU       kE2BT2+25\r
kR2		EQU       kE2BT2+26\r
kR3		EQU       kE2BT2+27\r
kR4		EQU       kE2BT2+28\r
kR5		EQU       kE2BT2+29\r
kR6		EQU       kE2BT2+30\r
kGDB4		EQU       kE2BT2+31\r
kGDB5		EQU       kE2BT2+32\r
kGDB6		EQU       kE2BT2+33\r
kPic4		EQU       kE2BT2+34\r
kPic5		EQU       kE2BT2+35\r
kPic6		EQU       kE2BT2+36\r
kGDB7		EQU       kE2BT2+37\r
kGDB8		EQU       kE2BT2+38\r
kGDB9		EQU       kE2BT2+39\r
kGDB0		EQU       kE2BT2+40\r
kPic7		EQU       kE2BT2+41\r
kPic8		EQU       kE2BT2+42\r
kPic9		EQU       kE2BT2+43\r
kPic0		EQU       kE2BT2+44\r
kStatN		EQU       kE2BT2+45\r
kXMean		EQU       kE2BT2+46\r
kConj		EQU       kE2BT2+47\r
kReal		EQU       kE2BT2+48\r
kFAngle		EQU       kE2BT2+49\r
kLCM		EQU       kE2BT2+50\r
kGCD		EQU       kE2BT2+51\r
kRandInt	EQU       kE2BT2+52\r
kRandNorm	EQU       kE2BT2+53\r
kToPolar	EQU       kE2BT2+54\r
kToRect		EQU       kE2BT2+55\r
kYMean		EQU       kE2BT2+56\r
kStdX		EQU       kE2BT2+57\r
kStdX1		EQU       kE2BT2+58\r
kw0		EQU       kE2BT2+59\r
kMatF		EQU       kE2BT2+60\r
kMatG		EQU       kE2BT2+61\r
kMatRH		EQU       kE2BT2+62\r
kMatI		EQU       kE2BT2+63\r
kMatJ		EQU       kE2BT2+64\r
kYMean1		EQU       kE2BT2+65\r
kStdY		EQU       kE2BT2+66\r
kStdY1		EQU       kE2BT2+67\r
kMatToLst	EQU       kE2BT2+68\r
kLstToMat	EQU       kE2BT2+69\r
kCumSum		EQU       kE2BT2+70\r
kDeltaLst	EQU       kE2BT2+71\r
kStdDev		EQU       kE2BT2+72\r
kVariance	EQU       kE2BT2+73\r
kLength		EQU       kE2BT2+74\r
kEquToStrng	EQU       kE2BT2+75\r
kStrngToEqu	EQU       kE2BT2+76\r
kExpr		EQU       kE2BT2+77\r
kSubStrng	EQU       kE2BT2+78\r
kInStrng	EQU       kE2BT2+79\r
kStr1		EQU       kE2BT2+80\r
kStr2		EQU       kE2BT2+81\r
kStr3		EQU       kE2BT2+82\r
kStr4           EQU       kE2BT2+83\r
kStr5           EQU       kE2BT2+84\r
kStr6           EQU       kE2BT2+85\r
kStr7           EQU       kE2BT2+86\r
kStr8           EQU       kE2BT2+87\r
kStr9           EQU       kE2BT2+88\r
kStr0           EQU       kE2BT2+89\r
kFinN           EQU       kE2BT2+90\r
kFinI           EQU       kE2BT2+91\r
kFinPV          EQU       kE2BT2+92\r
kFinPMT         EQU       kE2BT2+93\r
kFinFV          EQU       kE2BT2+94\r
kFinPY          EQU       kE2BT2+95\r
kFinCY          EQU       kE2BT2+96\r
kFinFPMT        EQU       kE2BT2+97\r
kFinFI          EQU       kE2BT2+98\r
kFinFPV         EQU       kE2BT2+99\r
kFinFN          EQU       kE2BT2+100\r
kFinFFV         EQU       kE2BT2+101\r
kFinNPV         EQU       kE2BT2+102\r
kFinIRR         EQU       kE2BT2+103\r
kFinBAL         EQU       kE2BT2+104\r
kFinPRN         EQU       kE2BT2+105\r
kFinINT         EQU       kE2BT2+106\r
kSumX           EQU       kE2BT2+107\r
kSumX2          EQU       kE2BT2+108\r
kFinToNom       EQU       kE2BT2+109\r
kFinToEff       EQU       kE2BT2+110\r
kFinDBD         EQU       kE2BT2+111\r
kStatVP         EQU       kE2BT2+112\r
kStatZ          EQU       kE2BT2+113\r
kStatT          EQU       kE2BT2+114\r
kStatChi        EQU       kE2BT2+115\r
kStatF          EQU       kE2BT2+116\r
kStatDF         EQU       kE2BT2+117\r
kStatPhat       EQU       kE2BT2+118\r
kStatPhat1      EQU       kE2BT2+119\r
kStatPhat2      EQU       kE2BT2+120\r
kStatMeanX1     EQU       kE2BT2+121\r
kStatMeanX2     EQU       kE2BT2+122\r
kStatStdX1      EQU       kE2BT2+123\r
kStatStdX2      EQU       kE2BT2+124\r
kStatStdXP      EQU       kE2BT2+125\r
kStatN1         EQU       kE2BT2+126\r
kStatN2         EQU       kE2BT2+127\r
kStatLower      EQU       kE2BT2+128\r
kStatUpper      EQU       kE2BT2+129\r
kuw0            EQU       kE2BT2+130\r
kImag           EQU       kE2BT2+131\r
kSumY           EQU       kE2BT2+132\r
kXres           EQU       kE2BT2+133\r
kStat_s         EQU       kE2BT2+134\r
kSumY2          EQU       kE2BT2+135\r
kSumXY          EQU       kE2BT2+136\r
kuXres          EQU       kE2BT2+137\r
kModBox		EQU       kE2BT2+138\r
kNormProb	EQU       kE2BT2+139\r
kNormalPDF      EQU       kE2BT2+140\r
kTPDF           EQU       kE2BT2+141\r
kChiPDF         EQU       kE2BT2+142\r
kFPDF           EQU       kE2BT2+143\r
kMinY           EQU       kE2BT2+144   ; MinY\r
kRandBin        EQU       kE2BT2+145\r
kRef            EQU       kE2BT2+146\r
kRRef           EQU       kE2BT2+147\r
kLRSqr          EQU       kE2BT2+148\r
kBRSqr          EQU       kE2BT2+149\r
kDiagOn         EQU       kE2BT2+150\r
kDiagOff        EQU       kE2BT2+151\r
kun1            EQU       kE2BT2+152   ; FOR RCL USE WHEN GOTTEN FROM 82\r
kvn1            EQU       kE2BT2+153   ; FOR RCL USE WHEN GOTTEN FROM 82\r
;\r
k83_00End       EQU	kvn1            ;end of original keys...\r
kArchive        EQU     k83_00End + 1\r
kUnarchive      EQU     k83_00End + 2\r
kAsm            EQU     k83_00End + 3   ; Asm(\r
kAsmPrgm        EQU     k83_00End + 4   ; AsmPrgm\r
kAsmComp        EQU     k83_00End + 5   ; AsmComp(\r
;\r
kcapAAcute	EQU       k83_00End + 6\r
kcapAGrave	EQU       k83_00End + 7\r
kcapACaret	EQU       k83_00End + 8\r
kcapADier	EQU       k83_00End + 9\r
kaAcute		EQU       k83_00End + 10\r
kaGrave		EQU       k83_00End + 11\r
kaCaret		EQU       k83_00End + 12\r
kaDier		EQU       k83_00End + 13\r
kcapEAcute	EQU       k83_00End + 14\r
kcapEGrave	EQU       k83_00End + 15\r
kcapECaret	EQU       k83_00End + 16\r
kcapEDier	EQU       k83_00End + 17\r
keAcute		EQU       k83_00End + 18\r
keGrave		EQU       k83_00End + 19\r
keCaret		EQU       k83_00End + 20\r
keDier		EQU       k83_00End + 21\r
kcapIAcute	EQU       k83_00End + 22\r
kcapIGrave	EQU       k83_00End + 23\r
kcapICaret	EQU       k83_00End + 24\r
kcapIDier	EQU       k83_00End + 25\r
kiAcute		EQU       k83_00End + 26\r
kiGrave		EQU       k83_00End + 27\r
kiCaret		EQU       k83_00End + 28\r
kiDier		EQU       k83_00End + 29\r
kcapOAcute	EQU       k83_00End + 30\r
kcapOGrave	EQU       k83_00End + 31\r
kcapOCaret	EQU       k83_00End + 32\r
kcapODier	EQU       k83_00End + 33\r
koAcute		EQU       k83_00End + 34\r
koGrave		EQU       k83_00End + 35\r
koCaret		EQU       k83_00End + 36\r
koDier		EQU       k83_00End + 37\r
kcapUAcute	EQU       k83_00End + 38\r
kcapUGrave	EQU       k83_00End + 39\r
kcapUCaret	EQU       k83_00End + 40\r
kcapUDier	EQU       k83_00End + 41\r
kuAcute		EQU       k83_00End + 42\r
kuGrave		EQU       k83_00End + 43\r
kuCaret		EQU       k83_00End + 44\r
kuDier		EQU       k83_00End + 45\r
kcapCCed	EQU       k83_00End + 46\r
kcCed		EQU       k83_00End + 47\r
kcapNTilde	EQU       k83_00End + 48\r
knTilde		EQU       k83_00End + 49\r
kaccent		EQU       k83_00End + 50\r
kgrave		EQU       k83_00End + 51\r
kdieresis	EQU       k83_00End + 52\r
kquesDown	EQU       k83_00End + 53\r
kexclamDown     EQU       k83_00End + 54\r
kalpha          EQU       k83_00End + 55\r
kbeta           EQU      k83_00End +  56\r
kgamma          EQU      k83_00End +  57\r
kcapDelta       EQU      k83_00End +  58\r
kdelta          EQU      k83_00End +  59\r
kepsilon        EQU      k83_00End +  60\r
klambda         EQU      k83_00End +  61\r
kmu             EQU      k83_00End +  62\r
kpi2            EQU      k83_00End +  63\r
krho            EQU      k83_00End +  64\r
kcapSigma       EQU      k83_00End +  65\r
ksigma          EQU      k83_00End +  66\r
ktau            EQU      k83_00End +  67\r
kphi            EQU      k83_00End +  68\r
kcapOmega       EQU      k83_00End +  69\r
kphat           EQU      k83_00End +  70\r
kchi2           EQU      k83_00End +  71\r
kstatF2         EQU      k83_00End +  72\r
kLa		EQU     k83_00End + 73\r
kLb		EQU     k83_00End + 74\r
kLc		EQU     k83_00End + 75\r
kLd		EQU     k83_00End + 76\r
kLe		EQU     k83_00End + 77\r
kLf		EQU     k83_00End + 78\r
kLg		EQU     k83_00End + 79\r
kLh		EQU     k83_00End + 80\r
kLi		EQU     k83_00End + 81\r
kLj		EQU     k83_00End + 82\r
kLk		EQU     k83_00End + 83\r
kLl		EQU     k83_00End + 84\r
kLm		EQU     k83_00End + 85\r
kLsmalln	EQU    k83_00End +  86\r
kLo		EQU    k83_00End +  87\r
kLp		EQU    k83_00End +  88\r
kLq		EQU    k83_00End +  89\r
kLsmallr	EQU    k83_00End +  90\r
kLs		EQU    k83_00End +  91\r
kLt		EQU    k83_00End +  92\r
kLu		EQU    k83_00End +  93\r
kLv		EQU    k83_00End +  94\r
kLw		EQU    k83_00End +  95\r
kLx		EQU    k83_00End +  96\r
kLy		EQU    k83_00End +  97\r
kLz		EQU    k83_00End +  98\r
kGarbageC	EQU  k83_00End +  99 ; GarbageCollect\r
;\r
kE2BT2_End	EQU     kGarbageC\r
;\r
;======================================================================\r
;           TI-83 Plus Context Equates\r
;======================================================================\r
;\r
cxCmd           EQU     kQuit                   ;home screen\r
cxMatEdit       EQU     kMatrixEd               ;matrix editor\r
cxPrgmEdit      EQU     kPrgmEd                 ;program editor\r
cxEquEdit       EQU     kYequ                   ;equation editor\r
cxGrRange       EQU     kWindow                 ;graph range editor\r
cxGrZfact       EQU     kZFactEd                ;graph zoom factors editor\r
cxGraph         EQU     kGraph                  ;graph mode\r
cxStatEdit      EQU     kStatEd                 ;statistics list editor\r
cxPrgmInput     EQU     kPrgmInput              ;programmed input\r
cxError         EQU     kError                  ;error handler\r
cxLinkIO        EQU     kLinkIO                 ;LINK I/O interface\r
cxMem           EQU     kResetMem               ;reset memory\r
cxDefMem        EQU     kResetDef               ;reset default\r
cxRAMApp        EQU     kChkRAM                 ;RAM usage screen\r
cxMode          EQU     kMode                   ;mode settings screen\r
cxErase         EQU     kDelMem                 ;memory erase\r
cxPrgmCreate    EQU     kPrgmCr                 ;PROGRAM CREATE\r
cxTableEditor   EQU     kTable                  ;TABLE EDITOR\r
cxTableSet      EQU     kTblSet                 ;TABLE SET UP\r
cxStatPlot      EQU     kStatP                  ;STAT PLOTS\r
cxInfStat	EQU	kInfStat		;Inferential Statistic\r
cxFormat        EQU     kFormat                 ;FORMAT CONTEXT\r
cxSolveTVM      EQU     kSolveTVM               ;Solve TVM\r
cxSolveRoot     EQU     kSolveRoot              ;Solve Root\r
lastOldApp      EQU     kExtApps                ;external applications\r
cxextapps       EQU     kExtApps\r
cxNewApps       EQU     kNewApps                ;new cerberus applications\r
cxGroup         EQU     cxNewApps+0             ;1st new app.\r
cxUnGroup       EQU     cxNewApps+1             ;2nd new app.\r
lastNewApp      EQU     cxUnGroup               ;last new app for this ver\r
\r
;\r
;======================================================================\r
;           Scan Code Equates\r
;======================================================================;\r
skDown          EQU	01h\r
skLeft          EQU	02h\r
skRight         EQU	03h\r
skUp            EQU	04h\r
skEnter         EQU	09h\r
skAdd           EQU	0Ah\r
skSub           EQU	0Bh\r
skMul           EQU	0Ch\r
skDiv           EQU	0Dh\r
skPower         EQU	0Eh\r
skClear         EQU	0Fh\r
skChs           EQU	11h\r
sk3             EQU	12h\r
sk6             EQU	13h\r
sk9             EQU	14h\r
skRParen        EQU	15h\r
skTan           EQU	16h\r
skVars          EQU	17h\r
skDecPnt        EQU	19h\r
sk2             EQU	1Ah\r
sk5             EQU	1Bh\r
sk8             EQU	1Ch\r
skLParen        EQU	1Dh\r
skCos           EQU	1Eh\r
skPrgm          EQU	1Fh\r
skStat          EQU	20h\r
sk0             EQU	21h\r
sk1             EQU	22h\r
sk4             EQU	23h\r
sk7             EQU	24h\r
skComma         EQU	25h\r
skSin           EQU	26h\r
skMatrix        EQU	27h\r
skGraphvar      EQU	28h\r
skStore         EQU	2Ah\r
skLn            EQU	2Bh\r
skLog           EQU	2Ch\r
skSquare        EQU	2Dh\r
skRecip         EQU	2Eh\r
skMath          EQU	2Fh\r
skAlpha         EQU	30h\r
skGraph         EQU	31h\r
skTrace         EQU	32h\r
skZoom          EQU	33h\r
skWindow        EQU	34h\r
skYEqu          EQU	35h\r
sk2nd           EQU	36h\r
skMode          EQU	37h\r
skDel           EQU	38h\r
;\r
;======================================================================\r
;           Tokens\r
;======================================================================\r
;\r
EOSSTART        EQU       0\r
;\r
;\r
;   DISPLAY CONVERSIONS COME IMMEDIATELY BEFORE 'TSTORE'\r
;\r
DCONV   EQU     01h\r
;\r
tToDMS          EQU       DCONV       ; 01h\r
tToDEC          EQU       DCONV+1     ; 02h\r
tToAbc          EQU       DCONV+2     ; 03h    > A b/c\r
;\r
tStore          EQU       DCONV+3     ; 04h Lstore                01\r
;\r
tBoxPlot        EQU       05h\r
;\r
BRACKS          EQU       06h\r
;\r
tLBrack         EQU       BRACKS      ; 06h '['\r
tRBrack         EQU       BRACKS+1    ; 07h ']'\r
tLBrace         EQU       BRACKS+2    ; 08h '{'\r
tRBrace         EQU       BRACKS+3    ; 09h '}'\r
;\r
tPOST1          EQU       BRACKS+4\r
;\r
tFromRad        EQU       tPOST1       ; 0Ah Lradian\r
tFromDeg        EQU       tPOST1+1     ; 0Bh Ldegree\r
tRecip          EQU       tPOST1+2     ; 0Ch Linverse\r
tSqr            EQU       tPOST1+3     ; 0Dh Lsquare\r
tTrnspos        EQU       tPOST1+4     ; 0Eh Ltranspose\r
tCube           EQU       tPOST1+5     ; 0Fh '^3'\r
;\r
tLParen         EQU       10h         ; 10h '('\r
tRParen         EQU       11h         ; 11h ')'\r
;\r
;\r
IMUN            EQU       12h\r
;\r
tRound          EQU       IMUN        ; 12h 'round'\r
tPxTst          EQU       IMUN+1      ; 13h 'PXL-TEST'\r
tAug            EQU       IMUN+2      ; 14h 'aug'\r
tRowSwap        EQU       IMUN+3      ; 15h 'rSwap'\r
tRowPlus        EQU       IMUN+4      ; 16h 'rAdd'\r
tmRow           EQU       IMUN+5      ; 17h 'multR'\r
tmRowPlus       EQU       IMUN+6      ; 18h 'mRAdd'\r
tMax            EQU       IMUN+7      ; 19h 'max'\r
tMin            EQU       IMUN+8      ; 1Ah 'min'\r
tRToPr          EQU       IMUN+9      ; 1Bh 'R>Pr\r
tRToPo          EQU       IMUN+10     ; 1Ch 'R>Po\r
tPToRx          EQU       IMUN+11     ; 1Dh 'P>Rx\r
tPToRy          EQU       IMUN+12     ; 1Eh 'P>Ry\r
tMedian         EQU       IMUN+13     ; 1Fh 'MEDIAN\r
tRandM          EQU       IMUN+14     ; 20h 'randM'\r
tMean           EQU       IMUN+15     ; 21h\r
tRoot           EQU       IMUN+16     ; 22h 'ROOT'\r
tSeries         EQU       IMUN+17     ; 23h 'seq'\r
tFnInt          EQU       IMUN+18     ; 24h 'fnInt'\r
tNDeriv         EQU       IMUN+19     ; 25h 'fnIr'\r
tEvalF          EQU       IMUN+20     ; 26h\r
tFmin           EQU       IMUN+21     ; 27h\r
tFmax           EQU       IMUN+22     ; 28h\r
;\r
tEOSEL          EQU       IMUN+23\r
;\r
tSpace          EQU       tEOSEL       ; 29h   ' '\r
tString         EQU       tEOSEL+1     ; 2Ah  '"'\r
tComma          EQU       tEOSEL+2     ; 2Bh  ','\r
;\r
;\r
tii             EQU       2Ch         ; i\r
;\r
;======================================================================\r
;           Postfix Functions\r
;======================================================================\r
;\r
tPost           EQU       2Dh\r
;\r
tFact           EQU       tPost       ; 2Dh '!'\r
;\r
tCubicR         EQU       2Eh\r
tQuartR         EQU       2Fh\r
\r
;======================================================================\r
;           Number Tokens \r
;======================================================================\r
;\r
NUMS            EQU       30h\r
;\r
t0              EQU       NUMS        ; 30h\r
t1              EQU       NUMS+1      ; 31h\r
t2              EQU       NUMS+2      ; 32h\r
t3              EQU       NUMS+3      ; 33h\r
t4              EQU       NUMS+4      ; 34h\r
t5              EQU       NUMS+5      ; 35h\r
t6              EQU       NUMS+6      ; 36h\r
t7              EQU       NUMS+7      ; 37h\r
t8              EQU       NUMS+8      ; 38h\r
t9              EQU       NUMS+9      ; 39h\r
tDecPt          EQU       NUMS+10     ; 3Ah\r
tee             EQU       NUMS+11     ; 3Bh\r
;\r
;======================================================================\r
;            BINARY OP\r
;======================================================================\r
;\r
tOr             EQU       3Ch         ; 3Ch  '_or_'\r
tXor            EQU       3Dh         ; 3Dh\r
;\r
tColon          EQU       3Eh         ; 3Eh ':'\r
tEnter          EQU       3Fh         ; 3Fh  Lenter\r
;\r
tAnd            EQU       40h         ; 40h  '_and_'       \r
;\r
;======================================================================\r
;            LETTER TOKENS   \r
;======================================================================\r
\r
;\r
LET             EQU       41h\r
;\r
tA              EQU       LET         ; 41h\r
tB              EQU       LET+1       ; 42h\r
tC              EQU       LET+2       ; 43h\r
tD              EQU       LET+3       ; 44h\r
tE              EQU       LET+4       ; 45h\r
tF              EQU       LET+5       ; 46h\r
tG              EQU       LET+6       ; 47h\r
tH              EQU       LET+7       ; 48h\r
tI              EQU       LET+8       ; 49h\r
tJ              EQU       LET+9       ; 4Ah\r
tK              EQU       LET+10      ; 4Bh\r
tL              EQU       LET+11      ; 4Ch\r
tM              EQU       LET+12      ; 4Dh\r
tN              EQU       LET+13      ; 4Eh\r
tO              EQU       LET+14      ; 4Fh\r
tP              EQU       LET+15      ; 50h\r
tQ              EQU       LET+16      ; 51h\r
tR              EQU       LET+17      ; 52h\r
tS              EQU       LET+18      ; 53h\r
tT              EQU       LET+19      ; 54h\r
tU              EQU       LET+20      ; 55h\r
tV              EQU       LET+21      ; 56h\r
tW              EQU       LET+22      ; 57h\r
tX              EQU       LET+23      ; 58h\r
tY              EQU       LET+24      ; 59h\r
tZ              EQU       LET+25      ; 5Ah\r
tTheta          EQU       LET+26      ; 5Bh\r
;\r
;======================================================================\r
;   THESE VAR TOKENS ARE 1ST OF A DOUBLE TOKEN \r
;======================================================================\r
\r
;\r
vToks   EQU     LET+27    ;\r
;\r
;       USER MATRIX TOKEN, 2ND TOKEN NEEDED FOR NAME\r
;\r
tVarMat         EQU       vToks       ; 5Ch\r
;\r
;       USER LIST TOKEN, 2ND TOKEN NEEDED FOR NAME\r
;\r
tVarLst         EQU       vToks+1     ; 5Dh\r
;\r
;       USER EQUATION TOKEN, 2ND TOKEN NEEDED FOR NAME\r
;\r
tVarEqu         EQU       vToks+2     ; 5Eh\r
tProg           EQU       vToks+3     ; 5Fh\r
;\r
;       USER PICT TOKEN, 2ND TOKEN NEEDED FOR NAME\r
;\r
tVarPict        EQU       vToks+4     ; 60h\r
;\r
;       USER GDB TOKEN, 2ND TOKEN NEEDED FOR NAME\r
;\r
tVarGDB         EQU       vToks+5     ; 61h\r
tVarOut         EQU       vToks+6     ; 62h\r
tVarSys         EQU       vToks+7     ; 63h\r
;\r
;\r
;======================================================================\r
;            Mode Setting Commands\r
;======================================================================\r
\r
;\r
MODESA          EQU       vToks+8     ; 64h\r
;\r
tRad            EQU       MODESA      ; 64h 'Radian'\r
tDeg            EQU       MODESA+1    ; 65h 'Degree'\r
tNormF          EQU       MODESA+2    ; 66h 'Normal'\r
tSci            EQU       MODESA+3    ; 67h 'Sci'\r
tEng            EQU       MODESA+4    ; 68h 'Eng'\r
tFloat          EQU       MODESA+5    ; 69h 'Float'\r
;\r
CMPS            EQU       6Ah\r
;\r
tEQ             EQU       CMPS        ; 6Ah '=='\r
tLT             EQU       CMPS+1      ; 6Bh '<'\r
tGT             EQU       CMPS+2      ; 6Ch '>'\r
tLE             EQU       CMPS+3      ; 6Dh LLE\r
tGE             EQU       CMPS+4      ; 6Eh LGE\r
tNE             EQU       CMPS+5      ; 6Fh LNE\r
;\r
;======================================================================\r
;            BINARY OP\r
;======================================================================\r
;\r
tAdd            EQU       70h         ; 70h '+'\r
tSub            EQU       71h         ; 71h '-'\r
tAns            EQU       72h         ; 72h\r
;\r
;======================================================================\r
;            Mode Setting Commands\r
;======================================================================\r
;\r
MODES           EQU       73h\r
;\r
tFix            EQU       MODES       ; 73h 'Fix_'\r
tSplitOn        EQU       MODES+1     ; 74h\r
tFullScreen     EQU       MODES+2     ; 75h\r
tStndrd         EQU       MODES+3     ; 76h 'Func'\r
tParam          EQU       MODES+4     ; 77h 'Param'\r
tPolar          EQU       MODES+5     ; 78h 'Pol'\r
tSeqG           EQU       MODES+6     ; 79h\r
tAFillOn        EQU       MODES+7     ; 7Ah 'AUTO FILL ON\r
tAFillOff       EQU       MODES+8     ; 7Bh\r
tACalcOn        EQU       MODES+9     ; 7Ch\r
tACalcOff       EQU       MODES+10    ; 7Dh 'AutoFill OFF\r
;\r
;       GRAPH FORMAT TOKENS ARE 2 BYTE TOKENS\r
;\r
tGFormat        EQU       MODES+11    ; 7Eh\r
;\r
tBoxIcon        EQU       7Fh\r
tCrossIcon      EQU       80h\r
tDotIcon        EQU       81h\r
;\r
;======================================================================\r
;            (More) BINARY OP\r
;======================================================================\r
;\r
tMul            EQU       82h         ; 82h  '*'\r
tDiv            EQU       83h         ; 83h  '/'\r
;\r
;======================================================================\r
;            SOME GRAPH COMMANDS\r
;======================================================================\r
;\r
GRCMDS          EQU       84h\r
;\r
tTrace          EQU       GRCMDS      ; 84h 'Trace'\r
tClDrw          EQU       GRCMDS+1    ; 85h 'ClDrw'\r
tZoomStd        EQU       GRCMDS+2    ; 86h 'ZStd'\r
tZoomtrg        EQU       GRCMDS+3    ; 87h 'Ztrg'\r
tZoomBox        EQU       GRCMDS+4    ; 88h 'ZBOX'\r
tZoomIn         EQU       GRCMDS+5    ; 89h 'ZIn'\r
tZoomOut        EQU       GRCMDS+6    ; 8Ah 'ZOut'\r
tZoomSqr        EQU       GRCMDS+7    ; 8Bh 'ZSqr'\r
tZoomInt        EQU       GRCMDS+8    ; 8Ch 'ZInt'\r
tZoomPrev       EQU       GRCMDS+9    ; 8Dh 'ZPrev'\r
tZoomDec        EQU       GRCMDS+10   ; 8Eh 'ZDecm'\r
tZoomStat       EQU       GRCMDS+11   ; 8Fh 'ZStat\r
tUsrZm          EQU       GRCMDS+12   ; 90h 'ZRcl'\r
tPrtScrn        EQU       GRCMDS+13   ; 91h 'PrtScrn'\r
tZoomSto        EQU       GRCMDS+14   ; 92h  ZOOM STORE\r
tText           EQU       GRCMDS+15   ; 93h\r
;\r
;======================================================================\r
;           BINARY OP  (Combination & Permutation)\r
;======================================================================\r
;\r
tnPr            EQU       GRCMDS+16   ; 94h '_nPr_'\r
tnCr            EQU       GRCMDS+17   ; 95h '_nCr_'\r
;\r
;======================================================================\r
;           MORE GRAPH COMMANDS\r
;======================================================================\r
;\r
tYOn            EQU       GRCMDS+18   ; 96h 'FnOn_'\r
tYOff           EQU       GRCMDS+19   ; 97h 'FnOff_'\r
tStPic          EQU       GRCMDS+20   ; 98h 'StPic_'\r
tRcPic          EQU       GRCMDS+21   ; 99h 'RcPic_'\r
tStoDB          EQU       GRCMDS+22   ; 9Ah 'StGDB_'\r
tRclDB          EQU       GRCMDS+23   ; 9Bh 'RcGDB_'\r
tLine           EQU       GRCMDS+24   ; 9Ch 'Line'\r
tVert           EQU       GRCMDS+25   ; 9Dh 'Vert_'\r
tPtOn           EQU       GRCMDS+26   ; 9Eh 'PtOn'\r
tPtOff          EQU       GRCMDS+27   ; 9Fh 'PtOff'\r
;\r
;======================================================================\r
;           TOKEN A0 CANNOT BE AN EOS FUNCTION\r
;           SINCE LOW MULT=A0 ALREADY\r
;======================================================================\r
;\r
tPtChg          EQU       GRCMDS+28   ; A0h 'PtChg'\r
tPXOn           EQU       GRCMDS+29   ; A1h\r
tPXOff          EQU       GRCMDS+30   ; A2h\r
tPXChg          EQU       GRCMDS+31   ; A3h\r
tShade          EQU       GRCMDS+32   ; A4h 'Shade'\r
tCircl          EQU       GRCMDS+33   ; A5h 'Circl'\r
tHorz           EQU       GRCMDS+34   ; A6h 'HORIZONTAL'\r
tTanLn          EQU       GRCMDS+35   ; A7h 'TanLn'\r
tDrInv          EQU       GRCMDS+36   ; A8h 'DrInv_'\r
tDrawF          EQU       GRCMDS+37   ; A9h 'DrawF_'\r
;\r
tVarStrng       EQU       0AAh\r
;\r
;======================================================================\r
;           Functions with No Arguments                                    \r
;======================================================================\r
;\r
NOARG   EQU     0ABh\r
;\r
tRand           EQU       NOARG       ; ABh 'rand'\r
tPi             EQU       NOARG+1     ; ACh  Lpi\r
tGetKey         EQU       NOARG+2     ; ADh 'getKy'\r
;\r
;\r
tAPost          EQU       tGetKey+1   ; APOSTROPHY\r
tQuest          EQU       tAPost+1    ; QUESTION MARK\r
;\r
;\r
UNARY   EQU     tQuest+1              ; B0h\r
;\r
tChs            EQU       UNARY       ; B0h\r
tInt            EQU       UNARY+1     ; B1h\r
tAbs            EQU       UNARY+2     ; B2h\r
tDet            EQU       UNARY+3     ; B3h\r
tIdent          EQU       UNARY+4     ; B4h\r
tDim            EQU       UNARY+5     ; B5h\r
tSum            EQU       UNARY+6     ; B6h\r
tProd           EQU       UNARY+7     ; B7h\r
tNot            EQU       UNARY+8     ; B8h\r
tIPart          EQU       UNARY+9     ; B9h\r
tFPart          EQU       UNARY+10    ; BAh\r
;\r
;\r
;======================================================================\r
;           NEW 2 BYTE TOKENS\r
;======================================================================\r
;\r
t2ByteTok       EQU       0BBh         ;\r
;\r
;\r
UNARYLR EQU     UNARY+12\r
;\r
tSqrt           EQU       UNARYLR     ; BCh\r
tCubRt          EQU       UNARYLR+1   ; BDh\r
tLn             EQU       UNARYLR+2   ; BEh\r
tExp            EQU       UNARYLR+3   ; BFh\r
tLog            EQU       UNARYLR+4   ; C0h\r
tALog           EQU       UNARYLR+5   ; C1h\r
tSin            EQU       UNARYLR+6   ; C2h\r
tASin           EQU       UNARYLR+7   ; C3h\r
tCos            EQU       UNARYLR+8   ; C4h\r
tACos           EQU       UNARYLR+9   ; C5h\r
tTan            EQU       UNARYLR+10  ; C6h\r
tATan           EQU       UNARYLR+11  ; C7h\r
tSinH           EQU       UNARYLR+12  ; C8h\r
tASinH          EQU       UNARYLR+13  ; C9h\r
tCoshH          EQU       UNARYLR+14  ; CAh\r
tACosH          EQU       UNARYLR+15  ; CBh\r
tTanH           EQU       UNARYLR+16  ; CCh\r
tATanH          EQU       UNARYLR+17  ; CDh\r
; \r
;======================================================================\r
;           SOME PROGRAMMING COMMANDS                                      \r
;======================================================================\r
;\r
PROGTOK EQU     UNARYLR+18\r
;\r
tIf             EQU       PROGTOK     ; CEh\r
tThen           EQU       PROGTOK+1   ; CFh\r
tElse           EQU       PROGTOK+2   ; D0h\r
tWhile          EQU       PROGTOK+3   ; D1h\r
tRepeat         EQU       PROGTOK+4   ; D2h\r
tFor            EQU       PROGTOK+5   ; D3h\r
tEnd            EQU       PROGTOK+6   ; D4h\r
tReturn         EQU       PROGTOK+7   ; D5h\r
tLbl            EQU       PROGTOK+8   ; D6h   'Lbl_'\r
tGoto           EQU       PROGTOK+9   ; D7h   'Goto_'\r
tPause          EQU       PROGTOK+10  ; D8h   'Pause_'\r
tStop           EQU       PROGTOK+11  ; D9h   'Stop'\r
tISG            EQU       PROGTOK+12  ; DAh   'IS>'\r
tDSL            EQU       PROGTOK+13  ; DBh   'DS<'\r
tInput          EQU       PROGTOK+14  ; DCh   'Input_'\r
tPrompt         EQU       PROGTOK+15  ; DDh   'Prompt_'\r
tDisp           EQU       PROGTOK+16  ; DEh   'Disp_'\r
tDispG          EQU       PROGTOK+17  ; DFh   'DispG'\r
;\r
tOutput         EQU       PROGTOK+18  ; E0h    'Outpt'\r
tClLCD          EQU       PROGTOK+19  ; E1h    'ClLCD'\r
tConst          EQU       PROGTOK+20  ; E2h    'Fill'\r
tSortA          EQU       PROGTOK+21  ; E3h    'sortA_'\r
tSortD          EQU       PROGTOK+22  ; E4h    'sortD_'\r
tDispTab        EQU       PROGTOK+23  ; E5h    'Disp Table\r
tMenu           EQU       PROGTOK+24  ; E6h    'Menu'\r
tSendMBL        EQU       PROGTOK+25  ; E7h    'SEND'\r
tGetMBL         EQU       PROGTOK+26  ; E8h    'GET'\r
;\r
;======================================================================\r
;           STAT PLOT COMMANDS                                             \r
;======================================================================\r
;\r
statPCmd        EQU       PROGTOK+27\r
;\r
tPlotOn         EQU       statPCmd    ; E9h     ' PLOTSON'\r
tPlotOff        EQU       statPCmd+1   ; EAh     ' PLOTSOFF\r
;\r
tListName       EQU       0EBh        ; LIST DESIGNATOR\r
;\r
tPlot1          EQU       0ECh\r
tPlot2          EQU       0EDh\r
tPlot3          EQU       0EEh\r
;\r
tUnused01       EQU       0EFh        ;        available?\r
;\r
tPower          EQU       0F0h        ;        '^'\r
tXRoot          EQU       0F1h        ;        LsupX,Lroot\r
\r
STATCMD         EQU       0F2h\r
;\r
tOneVar         EQU       STATCMD     ; F2h    'OneVar_'\r
tTwoVar         EQU       STATCMD+1   ; F3h\r
tLR             EQU       STATCMD+2   ; F4h    'LinR(A+BX\r
tLRExp          EQU       STATCMD+3   ; F5h    'ExpR_'\r
tLRLn           EQU       STATCMD+4   ; F6h    'LnR_'\r
tLRPwr          EQU       STATCMD+5   ; F7h    'PwrR_'\r
tMedMed         EQU       STATCMD+6   ; F8h\r
tQuad           EQU       STATCMD+7   ; F9h\r
tClrLst         EQU       STATCMD+8   ; FAh    'CLEAR LIST\r
tClrTbl         EQU       STATCMD+9   ; FBh    CLEAR TABLE\r
tHist           EQU       STATCMD+10  ; FCh    'Hist_'\r
txyLine         EQU       STATCMD+11  ; FDh    'xyline_'\r
tScatter        EQU       STATCMD+12  ; FEh    'Scatter_'\r
tLR1            EQU       STATCMD+13  ; FFh    'LINR(AX+B\r
\r
;       \r
;======================================================================\r
;           2ND HALF OF GRAPH FORMAT TOKENS\r
;======================================================================\r
;           Format settings commands\r
;\r
GFMT            EQU       0\r
;\r
tSeq            EQU       GFMT        ; 'SeqG'\r
tSimulG         EQU       GFMT+1      ; 'SimulG'\r
tPolarG         EQU       GFMT+2      ; 'PolarGC'\r
tRectG          EQU       GFMT+3      ; 'RectGC'\r
tCoordOn        EQU       GFMT+4      ; 'CoordOn'\r
tCoordOff       EQU       GFMT+5      ; 'CoordOff'\r
tDrawLine       EQU       GFMT+6      ; 'DrawLine'\r
tDrawDot        EQU       GFMT+7      ; 'DrawDot'\r
tAxisOn         EQU       GFMT+8      ; 'AxesOn'\r
tAxisOff        EQU       GFMT+9      ; 'AxesOff'\r
tGridOn         EQU       GFMT+10     ; 'GridOn'\r
tGridOff        EQU       GFMT+11     ; 'GridOff'\r
tLblOn          EQU       GFMT+12     ; 'LabelOn'\r
tLblOff         EQU       GFMT+13     ; 'LabelOff'\r
tWebOn          EQU       GFMT+14     ; 'WebOn'\r
tWebOff         EQU       GFMT+15     ; 'WebOFF'\r
tuv             EQU       GFMT+16     ; U vs V\r
tvw             EQU       GFMT+17     ; V vs W\r
tuw             EQU       GFMT+18     ; U vs W\r
;\r
;======================================================================\r
;           2ND HALF OF USER MATRIX TOKENS                                 \r
;======================================================================\r
;\r
tMatA           EQU       00h         ; MAT A\r
tMatB           EQU       01h         ; MAT B\r
tMatC           EQU       02h         ; MAT C\r
tMatD           EQU       03h         ; MAT D\r
tMatE           EQU       04h         ; MAT E\r
tMatF           EQU       05h         ; MAT F\r
tMatG           EQU       06h         ; MAT G\r
tMatH           EQU       07h         ; MAT H\r
tMatI           EQU       08h         ; MAT I\r
tMatJ           EQU       09h         ; MAT J\r
;      \r
;======================================================================\r
;           2ND HALF OF USER LIST TOKENS\r
;======================================================================\r
;\r
tL1             EQU       00h         ; LIST 1\r
tL2             EQU       01h         ; LIST 2\r
tL3             EQU       02h         ; LIST 3\r
tL4             EQU       03h         ; LIST 4\r
tL5             EQU       04h         ; LIST 5\r
tL6             EQU       05h         ; LIST 6\r
\r
;\r
;======================================================================\r
;           2ND HALF OF USER EQUATION TOKENS\r
;======================================================================\r
;\r
;       "Y" EQUATIONS HAVE BIT 4 SET\r
;\r
tY1             EQU       10h         ; Y1\r
tY2             EQU       11h         ; Y2\r
tY3             EQU       12h         ; Y3\r
tY4             EQU       13h         ; Y4\r
tY5             EQU       14h         ; Y5\r
tY6             EQU       15h         ; Y6\r
tY7             EQU       16h         ; Y7\r
tY8             EQU       17h         ; Y8\r
tY9             EQU       18h         ; Y9\r
tY0             EQU       19h         ; Y0\r
;\r
;       PARAM EQUATIONS HAVE BIT 5 SET\r
;\r
tX1T            EQU       20h         ; X1t\r
tY1T            EQU       21h         ; Y1t\r
tX2T            EQU       22h         ; X2t\r
tY2T            EQU       23h         ; Y2t\r
tX3T            EQU       24h         ; X3t\r
tY3T            EQU       25h         ; Y3t\r
tX4T            EQU       26h         ; X4t\r
tY4T            EQU       27h         ; Y4t\r
tX5T            EQU       28h         ; X5t\r
tY5T            EQU       29h         ; Y5t\r
tX6T            EQU       2Ah         ; X6t\r
tY6T            EQU       2Bh         ; Y6t\r
;\r
;       POLAR EQUATIONS HAVE BIT 6 SET\r
;\r
tR1             EQU       40h         ; R1\r
tR2             EQU       41h         ; R2\r
tR3             EQU       42h         ; R3\r
tR4             EQU       43h         ; R4\r
tR5             EQU       44h         ; R5\r
tR6             EQU       45h         ; R6\r
;\r
;       RECURSION EQUATIONS HAVE BIT 7 SET\r
;\r
tun             EQU       80h         ; Un\r
tvn             EQU       81h         ; Vn\r
twn             EQU       82h         ; Wn\r
;\r
;======================================================================\r
;           2ND HALF OF USER PICTURE TOKENS                                \r
;======================================================================\r
;\r
tPic1           EQU       00h         ; PIC1\r
tPic2           EQU       01h         ; PIC2\r
tPic3           EQU       02h         ; PIC3\r
tPic4           EQU       03h         ; PIC4\r
tPic5           EQU       04h         ; PIC5\r
tPic6           EQU       05h         ; PIC6\r
tPic7           EQU       06h         ; PIC7\r
tPic8           EQU       07h         ; PIC8\r
tPic9           EQU       08h         ; PIC9\r
tPic0           EQU       09h         ; PIC0\r
; \r
;======================================================================\r
;           2ND HALF OF USER GRAPH DATABASE TOKENS                         \r
;======================================================================\r
;\r
tGDB1           EQU       00h         ; GDB1\r
tGDB2           EQU       01h         ; GDB2\r
tGDB3           EQU       02h         ; GDB3\r
tGDB4           EQU       03h         ; GDB4\r
tGDB5           EQU       04h         ; GDB5\r
tGDB6           EQU       05h         ; GDB6\r
tGDB7           EQU       06h         ; GDB7\r
tGDB8           EQU       07h         ; GDB8\r
tGDB9           EQU       08h         ; GDB9\r
tGDB0           EQU       09h         ; GDB0\r
;  \r
;======================================================================\r
;           2ND HALF OF STRING VARS                                        \r
;======================================================================\r
;\r
tStr1           EQU       00h\r
tStr2           EQU       01h\r
tStr3           EQU       02h\r
tStr4           EQU       03h\r
tStr5           EQU       04h\r
tStr6           EQU       05h\r
tStr7           EQU       06h\r
tStr8           EQU       07h\r
tStr9           EQU       08h\r
tStr0           EQU       09h\r
\r
; \r
;======================================================================\r
;           2ND HALF OF SYSTEM OUTPUT ONLY VARIABLES                       \r
;======================================================================\r
;\r
;\r
;   OPEN        EQU       00h\r
;\r
tRegEq          EQU       01h         ; REGRESSION EQUATION\r
;\r
tStatN          EQU       02h         ; STATISTICS N\r
;\r
tXMean          EQU       03h         ; X MEAN\r
tSumX           EQU       04h         ; SUM(X)\r
tSumXSqr        EQU       05h         ; SUM(X^2)\r
tStdX           EQU       06h         ; STANDARD DEV X\r
tStdPX          EQU       07h         ; STANDARD DEV POP X\r
tMinX           EQU       08h         ; Min X VALUE\r
tMaxX           EQU       09h         ; Max X VALUE\r
;\r
tMinY           EQU       0Ah         ; Min Y VALUE\r
tMaxY           EQU       0Bh         ; Max Y VALUE\r
tYmean          EQU       0Ch         ; Y MEAN\r
tSumY           EQU       0Dh         ; SUM(Y)\r
tSumYSqr        EQU       0Eh         ; SUM(Y^2)\r
tStdY           EQU       0Fh         ; STANDARD DEV Y\r
tStdPY          EQU       10h         ; STANDARD DEV POP Y\r
;\r
tSumXY          EQU       11h         ; SUM(XY)\r
tCorr           EQU       12h         ; CORRELATION\r
tMedX           EQU       13h         ; MED(X)\r
tQ1             EQU       14h         ; 1ST QUADRANT OF X\r
tQ3             EQU       15h         ; 3RD QUADRANT OF X\r
tQuadA          EQU       16h         ; 1ST TERM OF QUAD POLY REG/ Y-INT\r
tQuadB          EQU       17h         ; 2ND TERM OF QUAD POLY REG/ SLOPE\r
tQuadC          EQU       18h         ; 3RD TERM OF QUAD POLY REG\r
tCubeD          EQU       19h         ; 4TH TERM OF CUBIC POLY REG\r
tQuartE         EQU       1Ah         ; 5TH TERM OF QUART POLY REG\r
tMedX1          EQU       1Bh         ; x1 FOR MED-MED\r
tMedX2          EQU       1Ch         ; x2 FOR MED-MED\r
tMedX3          EQU       1Dh         ; x3 FOR MED-MED\r
tMedY1          EQU       1Eh         ; y1 FOR MED-MED\r
tMedY2          EQU       1Fh         ; y2 FOR MED-MED\r
tMedY3          EQU       20h         ; y3 FOR MED-MED\r
;\r
tRecurn		EQU       21h		; RECURSION N\r
tStatP          EQU       22h\r
tStatZ          EQU       23h\r
tStatT          EQU       24h\r
tStatChi        EQU       25h\r
tStatF          EQU       26h\r
tStatDF         EQU       27h\r
tStatPhat       EQU       28h\r
tStatPhat1      EQU       29h\r
tStatPhat2      EQU       2Ah\r
tStatMeanX1     EQU       2Bh\r
tStatStdX1      EQU       2Ch\r
tStatN1         EQU       2Dh\r
tStatMeanX2     EQU       2Eh\r
tStatStdX2      EQU       2Fh\r
tStatN2         EQU       30h\r
tStatStdXP      EQU       31h\r
tStatLower      EQU       32h\r
tStatUpper      EQU       33h\r
tStat_s         EQU       34h\r
tLRSqr          EQU       35h         ; r^2\r
tBRSqr          EQU       36h         ; R^2\r
;\r
;======================================================================\r
;       These next tokens are only used to access the data\r
;       they are display only and the user cannot access them at all\r
;======================================================================\r
;\r
tF_DF    EQU     37h       ; ANOFAV FACTOR DF\r
tF_SS    EQU     38h       ; ANOFAV FACTOR SS\r
tF_MS    EQU     39h       ; ANOFAV FACTOR MS\r
tE_DF    EQU     3Ah       ; ANOFAV ERROR DF\r
tE_SS    EQU     3Bh       ; ANOFAV ERROR SS\r
tE_MS    EQU     3Ch       ; ANOFAV ERROR MS\r
;\r
;\r
;======================================================================\r
;           2ND HALF OF SYSTEM INPUT/OUTPUT VARIABLES\r
;======================================================================\r
;      SYSTEM VARIABLE EQUATES\r
;\r
tuXscl       EQU  0\r
tuYscl       EQU  1\r
tXscl        EQU  2\r
tYscl        EQU  3\r
tRecuru0     EQU  4        ; U 1ST INITIAL COND\r
tRecurv0     EQU  5        ; V 1ST INITIAL COND\r
tun1         EQU  6        ; U(N-1)    ; NOT USED\r
tvn1         EQU  7        ; V(N-1)    ; NOT USED\r
tuRecuru0    EQU  8        ;\r
tuRecurv0    EQU  9        ;\r
;\r
tXmin        EQU  0Ah\r
tXmax        EQU  0Bh\r
tYmin        EQU  0Ch\r
tYmax        EQU  0Dh\r
tTmin        EQU  0Eh\r
tTmax        EQU  0Fh\r
tThetaMin    EQU  10h\r
tThetaMax    EQU  11h\r
tuXmin       EQU  12h\r
tuXmax       EQU  13h\r
tuYmin       EQU  14h\r
tuYmax       EQU  15h\r
tuThetMin    EQU  16h\r
tuThetMax    EQU  17h\r
tuTmin       EQU  18h\r
tuTmax       EQU  19h\r
tTblMin      EQU  1Ah\r
tPlotStart   EQU  1Bh\r
tuPlotStart  EQU  1Ch\r
tnMax        EQU  1Dh\r
tunMax       EQU  1Eh\r
tnMin        EQU  1Fh\r
tunMin       EQU  20h\r
;\r
tTblStep	EQU  21h\r
tTStep		EQU  22h\r
tThetaStep	EQU  23h\r
tuTStep		EQU  24h\r
tuThetStep	EQU  25h\r
;\r
tDeltaX		EQU  26h\r
tDeltaY		EQU  27h\r
;\r
tXFact		EQU  28h\r
tYFact		EQU  29h\r
;\r
tTblInput       EQU       2Ah\r
;\r
tFinN           EQU       2Bh\r
tFinI           EQU       2Ch\r
tFinPV          EQU       2Dh\r
tFinPMT         EQU       2Eh\r
tFinFV          EQU       2Fh\r
tFinPY          EQU       30h\r
tFinCY          EQU       31h\r
;\r
tRecurw0        EQU       32h         ; w0(1)\r
tuRecurw0       EQU       33h\r
;\r
tPlotStep       EQU       34h\r
tuPlotStep      EQU       35h\r
;\r
tXres           EQU       36h\r
tuXres          EQU       37h\r
;\r
tRecuru02       EQU       38h         ; u0(2)\r
tuRecuru02      EQU       39h\r
tRecurv02       EQU       3Ch         ; v0(2)\r
tuRecurv02      EQU       3Dh\r
tRecurw02       EQU       3Eh         ; w0(2)\r
tuRecurw02      EQU       3Fh\r
;\r
;======================================================================\r
;           2nd byte of t2ByteTok tokens\r
;======================================================================\r
;\r
tFinNPV         EQU       00h         ;\r
tFinIRR         EQU       01h         ;\r
tFinBAL         EQU       02h         ;\r
tFinPRN         EQU       03h         ;\r
tFinINT         EQU       04h         ;\r
tFinToNom       EQU       05h         ;\r
tFinToEff       EQU       06h         ;\r
tFinDBD         EQU       07h         ;\r
tLCM            EQU       08h         ;\r
tGCD            EQU       09h         ;\r
tRandInt        EQU       0Ah         ;\r
tRandBin        EQU       0Bh         ;\r
tSubStrng       EQU       0Ch         ;\r
tStdDev         EQU       0Dh         ;\r
tVariance       EQU       0Eh         ;\r
tInStrng        EQU       0Fh         ;\r
tDNormal        EQU       10h         ;\r
tInvNorm        EQU       11h         ;\r
tDT             EQU       12h         ;\r
tChI            EQU       13h         ;\r
tDF             EQU       14h         ;\r
tBINPDF         EQU       15h         ;\r
tBINCDF         EQU       16h         ;\r
tPOIPDF         EQU       17h         ;\r
tPOICDF         EQU       18h         ;\r
tGEOPDF         EQU       19h         ;\r
tGEOCDF         EQU       1Ah         ;\r
tNormalPDF      EQU       1Bh         ;\r
tTPDF           EQU       1Ch         ;\r
tChiPDF         EQU       1Dh         ;\r
tFPDF           EQU       1Eh         ;\r
tRandNorm       EQU       1Fh         ;\r
tFinFPMT        EQU       20h         ;\r
tFinFI          EQU       21h         ;\r
tFinFPV         EQU       22h         ;\r
tFinFN          EQU       23h         ;\r
tFinFFV         EQU       24h         ;\r
tConj           EQU       25h         ;\r
tReal           EQU       26h         ;\r
tImag           EQU       27h         ;\r
tAngle          EQU       28h         ;\r
tCumSum         EQU       29h         ;\r
tExpr           EQU       2Ah         ;\r
tLength         EQU       2Bh         ;\r
tDeltaLst       EQU       2Ch         ;\r
tRef            EQU       2Dh         ;\r
tRRef           EQU       2Eh         ;\r
tToRect         EQU       2Fh         ;\r
tToPolar        EQU       30h         ;\r
tConste         EQU       31h         ;\r
tSinReg         EQU       32h         ;\r
tLogistic       EQU       33h         ;\r
tLinRegTTest    EQU       34h         ;\r
tShadeNorm      EQU       35h         ;\r
tShadeT         EQU       36h         ;\r
tShadeChi       EQU       37h         ;\r
tShadeF         EQU       38h         ;\r
tMatToLst       EQU       39h         ;\r
tLstToMat       EQU       3Ah         ;\r
tZTest          EQU       3Bh         ;\r
tTTest          EQU       3Ch         ;\r
t2SampZTest     EQU       3Dh         ;\r
t1PropZTest     EQU       3Eh         ;\r
t2PropZTest     EQU       3Fh         ;\r
tChiTest        EQU       40h         ;\r
tZIntVal        EQU       41h         ;\r
t2SampZInt      EQU       42h         ;\r
t1PropZInt      EQU       43h         ;\r
t2PropZInt      EQU       44h         ;\r
tGraphStyle     EQU       45h         ;\r
t2SampTTest     EQU       46h         ;\r
t2SampFTest     EQU       47h         ;\r
tTIntVal        EQU       48h         ;\r
t2SampTInt      EQU       49h         ;\r
tSetupLst       EQU       4Ah         ;\r
tFinPMTend      EQU       4Bh         ;\r
tFinPMTbeg      EQU       4Ch         ;\r
tRealM          EQU       4Dh         ;\r
tPolarM         EQU       4Eh         ;\r
tRectM          EQU       4Fh         ;\r
tExprOn         EQU       50h         ;\r
tExprOff        EQU       51h         ;\r
tClrAllLst      EQU       52h         ;\r
tGetCalc        EQU       53h         ;\r
tDelVar         EQU       54h         ;\r
tEquToStrng     EQU       55h         ;\r
tStrngToEqu     EQU       56h         ;\r
tDelLast        EQU       57h         ;\r
tSelect         EQU       58h         ;\r
tANOVA          EQU       59h         ;\r
tModBox         EQU       5Ah         ;\r
tNormProb       EQU       5Bh         ;\r
;\r
;\r
tMGT            EQU       64h         ; VERTICAL SPLIT\r
tZFit           EQU       65h         ; ZOOM FIT\r
tDiag_on        EQU       66h         ; DIANOSTIC DISPLAY ON\r
tDiag_off       EQU       67h         ; DIANOSTIC DISPLAY OFF\r
tOkEnd2v0       EQU       67h         ;end of 2byte tokens for version 0.\r
tArchive        EQU       68h         ;archive\r
tUnarchive      EQU       69h         ;unarchive\r
tasm		EQU	  6Ah\r
tasmComp	EQU	  6Bh	      ; asm compile\r
tasmPrgm	EQU	  6Ch	      ; signifies a program is asm\r
tasmCmp 	EQU	  6Dh	      ; asm program is compiled\r
;\r
tLcapAAcute     EQU       6Eh\r
tLcapAGrave     EQU       6Fh\r
tLcapACaret     EQU       70h\r
tLcapADier      EQU       71h\r
tLaAcute        EQU       72h\r
tLaGrave        EQU       73h\r
tLaCaret        EQU       74h\r
tLaDier         EQU       75h\r
tLcapEAcute     EQU       76h\r
tLcapEGrave     EQU       77h\r
tLcapECaret     EQU       78h\r
tLcapEDier      EQU       79h\r
tLeAcute        EQU       7Ah\r
tLeGrave        EQU       7Bh\r
tLeCaret        EQU       7Ch\r
tLeDier         EQU       7Dh\r
;\r
tLcapIGrave     EQU       7Fh\r
tLcapICaret     EQU       80h\r
tLcapIDier      EQU       81h\r
tLiAcute        EQU       82h\r
tLiGrave        EQU       83h\r
tLiCaret        EQU       84h\r
tLiDier         EQU       85h\r
tLcapOAcute     EQU       86h\r
tLcapOGrave     EQU       87h\r
tLcapOCaret     EQU       88h\r
tLcapODier      EQU       89h\r
tLoAcute        EQU       8Ah\r
tLoGrave        EQU       8Bh\r
tLoCaret        EQU       8Ch\r
tLoDier         EQU       8Dh\r
tLcapUAcute     EQU       8Eh\r
tLcapUGrave     EQU       8Fh\r
tLcapUCaret     EQU       90h\r
tLcapUDier      EQU       91h\r
tLuAcute        EQU       92h\r
tLuGrave        EQU       93h\r
tLuCaret        EQU       94h\r
tLuDier         EQU       95h\r
tLcapCCed       EQU       96h\r
tLcCed          EQU       97h\r
tLcapNTilde     EQU       98h\r
tLnTilde        EQU       99h\r
tLaccent        EQU       9Ah\r
tLgrave         EQU       9Bh\r
tLdieresis      EQU       9Ch\r
tLquesDown      EQU       9Dh\r
tLexclamDown    EQU       9Eh\r
tLalpha         EQU       9Fh\r
tLbeta          EQU      0a0h\r
tLgamma         EQU      0a1h\r
tLcapDelta      EQU      0a2h\r
tLdelta         EQU      0a3h\r
tLepsilon       EQU      0a4h\r
tLlambda        EQU      0a5h\r
tLmu            EQU      0a6h\r
tLpi            EQU      0a7h\r
tLrho           EQU      0a8h\r
tLcapSigma      EQU      0a9h\r
;\r
;\r
tLphi           EQU      0aBh\r
tLcapOmega      EQU      0aCh\r
tLphat          EQU      0aDh\r
tLchi           EQU      0aEh\r
tLstatF         EQU      0aFh\r
;\r
\r
tLa      EQU     0b0h\r
tLb      EQU     0b1h\r
tLc      EQU     0b2h\r
tLd      EQU     0b3h\r
tLsmalle EQU     0b4h\r
tLf      EQU     0b5h\r
tLsmallg EQU     0b6h\r
tLh      EQU     0b7h\r
tLi      EQU     0b8h\r
tLj      EQU     0b9h\r
tLk      EQU     0bAh\r
;\r
\r
tLl      EQU     0bCh\r
tLm      EQU     0bDh\r
;tLn      EQU     0bEh		;i don't know why there are 2\r
tLo      EQU     0bFh\r
tLp      EQU     0c0h\r
tLq      EQU     0c1h\r
tLsmallr EQU     0c2h\r
tLs      EQU     0c3h\r
tLsmallt EQU     0c4h\r
tLu      EQU     0c5h\r
tLv      EQU     0c6h\r
tLw      EQU     0c7h\r
tLx      EQU     0c8h\r
tLy      EQU     0c9h\r
tLz      EQU     0cAh\r
tLsigma         EQU      0cbh\r
tLtau           EQU      0cch\r
tLcapIAcute     EQU      0cdh\r
;\r
;\r
tGarbagec EQU    0Ceh\r
LastToken       EQU      0Ceh         ;tLAST TOKEN IN THIS VERSION...\r
;\r
;======================================================================\r
;           Data Type Equates                                                    \r
;======================================================================\r
;\r
RealObj         EQU       0\r
ListObj         EQU       1\r
MatObj          EQU       2\r
EquObj          EQU       3\r
StrngObj        EQU       4\r
ProgObj         EQU       5\r
ProtProgObj     EQU       6\r
PictObj         EQU       7\r
GDBObj          EQU       8\r
UnknownObj      EQU       9\r
UnknownEquObj   EQU       0Ah\r
NewEquObj       EQU       0Bh\r
CplxObj         EQU       0Ch\r
CListObj        EQU       0Dh\r
UndefObj        EQU       0Eh\r
WindowObj       EQU       0Fh\r
ZStoObj         EQU       10h\r
TblRngObj       EQU       11h\r
LCDObj          EQU       12h\r
BackupObj       EQU       13h\r
AppObj		EQU	  14h		;application, only used in menus/link\r
AppVarObj	EQU	  15h		;application variable\r
TempProgObj     EQU       16h           ;program, home deletes when finished\r
GroupObj        EQU       17h           ;group.\r
; \r
;======================================================================\r
;           I/O equates                                                          \r
;======================================================================\r
;\r
D0D1_bits	EQU  03h\r
D0LD1L		EQU  03h\r
D0LD1H		EQU  01h\r
D0HD1L		EQU  02h\r
D0HD1H		EQU  00h\r
bport		EQU  0			; 4-BIT LINK PORT (I/O) \r
;\r
;======================================================================\r
;	Interrupt equates\r
;======================================================================\r
;\r
iAll	EQU 1011b\r
intrptEnPort	equ 3 ; interrupt enable (in/out) \r
;\r
;======================================================================\r
;	Memory paging equates\r
;======================================================================\r
;\r
memPageAPort	equ 6 ; memory page A (in/out)\r
;\r
;======================================================================\r
;           DEVICE CODES                                                       \r
;======================================================================\r
;\r
;\r
TI82DEV		EQU  82h\r
PC82DEV		EQU  02h\r
MAC82DEV	EQU  12h\r
;\r
TI83FDEV	EQU  73h\r
LINK83FDEV	EQU  23h\r
;\r
TI83DEV		EQU  83h\r
PC83DEV		EQU  03h\r
MAC83DEV	EQU  13h\r
;\r
TI85DEV		EQU  95h      ; DIFF THEN REAL 85 SO ME TALK\r
PC85DEV		EQU  05h\r
MAC85DEV	EQU  15h\r
;\r
TI73DEV		EQU  74h      ; Device x3 is always an 83\r
PC73DEV		EQU  07h\r
MAC73DEV	EQU  17h\r
;\r
	;TI83FDEV	EQU  73h\r
LINK73FDEV	EQU  23h\r
PC83FDEV	EQU  23h\r
;\r
;======================================================================\r
;           System Error Codes                                                  \r
;======================================================================\r
;\r
E_EDITF		EQU	7		;allow re-entering application\r
E_EDIT		EQU	1<<E_EDITF\r
E_Mask		EQU	7Fh\r
\r
E_Overflow	EQU	1+E_EDIT\r
E_DivBy0	EQU	2+E_EDIT\r
E_SingularMat	EQU	3+E_EDIT\r
E_Domain	EQU	4+E_EDIT\r
E_Increment	EQU	5+E_EDIT\r
E_Break		EQU	6+E_EDIT\r
E_NonReal       EQU     7+E_EDIT\r
E_Syntax        EQU     8+E_EDIT\r
E_DataType      EQU     9+E_EDIT\r
E_Argument      EQU     10+E_EDIT\r
E_DimMismatch   EQU     11+E_EDIT\r
E_Dimension     EQU     12+E_EDIT\r
E_Undefined     EQU     13+E_EDIT\r
E_Memory        EQU     14+E_EDIT\r
E_Invalid       EQU     15+E_EDIT\r
E_IllegalNest   EQU     16+E_EDIT\r
E_Bound         EQU     17+E_EDIT\r
E_GraphRange    EQU     18+E_EDIT\r
E_Zoom          EQU     19+E_EDIT\r
E_Label         EQU     20\r
E_Stat          EQU     21\r
E_Solver        EQU     22+E_EDIT\r
E_Singularity   EQU     23+E_EDIT\r
E_SignChange    EQU     24+E_EDIT\r
E_Iterations    EQU     25+E_EDIT\r
E_BadGuess      EQU     26+E_EDIT\r
E_StatPlot      EQU     27\r
E_TolTooSmall   EQU     28+E_EDIT\r
E_Reserved      EQU     29+E_EDIT\r
E_Mode          EQU     30+E_EDIT\r
E_LnkErr        EQU     31+E_EDIT\r
E_LnkMemErr     EQU     32+E_EDIT\r
E_LnkTransErr   EQU     33+E_EDIT\r
E_LnkDupErr     EQU     34+E_EDIT\r
E_LnkMemFull    EQU     35+E_EDIT\r
E_Unknown       EQU     36+E_EDIT\r
\r
E_Scale         EQU     37+E_EDIT\r
E_IdNotFound    EQU     38\r
E_NoMode        EQU     39+E_EDIT\r
E_Validation    EQU     40\r
E_Length        EQU     41+E_EDIT\r
E_Application   EQU     42+E_EDIT\r
E_AppErr1       EQU     43+E_EDIT\r
E_AppErr2       EQU     44+E_EDIT\r
E_ExpiredApp	EQU	45\r
E_BadAddr	EQU	46\r
E_Archived      EQU     47+E_EDIT\r
E_Version       EQU     48\r
E_ArchFull      EQU     49\r
E_Variable      EQU     50+E_EDIT\r
E_Duplicate     EQU     51+E_EDIT\r
HigErrNum       EQU     51\r
\r
\r
; obsolete error numbers34              ;first LINK error\r
E_LinkIOChkSum	EQU	34\r
E_LinkIOTimeOut	EQU	35\r
E_LinkIOBusy	EQU	36\r
E_LinkIOVer	EQU	37\r
\r
;\r
;======================================================================\r
;           EQUATES TO RAM LOCATIONS FOR STAT VARS \r
;======================================================================\r
;\r
;\r
FPLEN	EQU	9		;Length of a floating-point number.\r
StatN   EQU     statVars\r
XMean   EQU     StatN      + FPLEN\r
SumX    EQU     XMean      + FPLEN\r
SumXSqr EQU     SumX       + FPLEN\r
StdX    EQU     SumXSqr    + FPLEN\r
StdPX   EQU     StdX       + FPLEN\r
MinX    EQU     StdPX      + FPLEN\r
MaxX    EQU     MinX       + FPLEN\r
MinY    EQU     MaxX       + FPLEN\r
MaxY    EQU     MinY       + FPLEN\r
YMean   EQU     MaxY       + FPLEN\r
SumY    EQU     YMean      + FPLEN\r
SumYSqr EQU     SumY       + FPLEN\r
StdY    EQU     SumYSqr    + FPLEN\r
StdPY   EQU     StdY       + FPLEN\r
SumXY   EQU     StdPY      + FPLEN\r
Corr    EQU     SumXY      + FPLEN\r
MedX    EQU     Corr       + FPLEN\r
Q1      EQU     MedX       + FPLEN\r
Q3      EQU     Q1         + FPLEN\r
QuadA   EQU     Q3         + FPLEN\r
QuadB   EQU     QuadA      + FPLEN\r
QuadC   EQU     QuadB      + FPLEN\r
CubeD   EQU     QuadC      + FPLEN\r
QuartE  EQU     CubeD      + FPLEN\r
MedX1   EQU     QuartE     + FPLEN\r
MedX2   EQU     MedX1      + FPLEN\r
MedX3   EQU     MedX2      + FPLEN\r
MedY1   EQU     MedX3      + FPLEN\r
MedY2   EQU     MedY1      + FPLEN\r
MedY3   EQU     MedY2      + FPLEN\r
PStat   EQU     MedY3      + 2*FPLEN\r
ZStat   EQU     PStat      + FPLEN\r
TStat   EQU     ZStat      + FPLEN\r
ChiStat EQU     TStat      + FPLEN\r
FStat   EQU     ChiStat    + FPLEN\r
DF      EQU     FStat      + FPLEN\r
Phat    EQU     DF         + FPLEN\r
Phat1   EQU     Phat       + FPLEN\r
Phat2   EQU     Phat1      + FPLEN\r
MeanX1  EQU     Phat2      + FPLEN\r
StdX1   EQU     MeanX1     + FPLEN\r
StatN1  EQU     StdX1      + FPLEN\r
MeanX2  EQU     StatN1     + FPLEN\r
StdX2   EQU     MeanX2     + FPLEN\r
StatN2  EQU     StdX2      + FPLEN\r
StdXP2  EQU     StatN2     + FPLEN\r
SLower  EQU     StdXP2     + FPLEN\r
SUpper  EQU     SLower     + FPLEN\r
SStat   EQU     SUpper     + FPLEN\r
\r
F_DF	EQU     anovaf_vars\r
F_SS	EQU     F_DF + FPLEN\r
F_MS	EQU     F_SS + FPLEN\r
E_DF	EQU     F_MS + FPLEN\r
E_SS	EQU     E_DF + FPLEN\r
E_MS	EQU     E_SS + FPLEN\r
\r
.list`;export{e as default};