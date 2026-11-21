var e=`;TI-84 Plus CE Include File\r
\r
;Various Parts Contributed by\r
;- BrandonW\r
;- calc84\r
;- tr1p1ea\r
;- MateoConLechuga\r
;- Texas Instruments (ti83plus.inc)\r
.nolist\r
\r
#ifndef TI84PCE\r
#define TI84PCE\r
\r
;Included for Assembler Compatibility\r
;------------------------------------\r
#define equ .equ\r
#define EQU .equ\r
#define end .end\r
#define END .end\r
\r
;Hardware Defines\r
;------------------------------\r
lcdWidth		equ 320\r
lcdHeight		equ 240\r
\r
;System Calls\r
;Jump Table located at 020104h\r
;--------------------------------\r
_BootOS			equ 0020108h\r
_InterruptHandler	equ 002010Ch\r
_Rst10Handler		equ 0020110h\r
_Rst18Handler		equ 0020114h\r
_Rst20Handler		equ 0020118h\r
_Rst28Handler		equ 002011Ch\r
_Rst30Handler		equ 0020120h\r
;0020124h\r
;0020128h\r
_JErrorNo		equ 002012Ch\r
_CallFontHook		equ 0020130h\r
_CallLocalizeHook	equ 0020134h\r
_LoadHLInd_s		equ 0020138h\r
_CpHLDE			equ 002013Ch\r
_DivHLBy10_s		equ 0020140h\r
_DivHLByA_s		equ 0020144h\r
_KbdScan		equ 0020148h\r
_GetCSC			equ 002014Ch\r
_CoorMon		equ 0020150h\r
_Mon			equ 0020154h\r
_MonForceKey		equ 0020158h\r
_SendKPress		equ 002015Ch\r
_JForceCmdNoChar	equ 0020160h\r
_JForceCmd		equ 0020164h\r
_SysErrHandler		equ 0020168h\r
_NewContext		equ 002016Ch\r
_NewContext0		equ 0020170h\r
_PPutawayPrompt		equ 0020174h\r
_PPutAway		equ 0020178h\r
_PutAway		equ 002017Ch\r
_SizeWind		equ 0020180h\r
_ErrorEP		equ 0020184h\r
_CallMain		equ 0020188h\r
_MonErrHand		equ 002018Ch\r
_AppInit		equ 0020190h\r
_Initialize		equ 0020194h\r
_Min			equ 0020198h\r
_Max			equ 002019Ch\r
_AbsO1PAbsO2		equ 00201A0h\r
_Intgr			equ 00201A4h\r
_TRunc			equ 00201A8h\r
_InvSub			equ 00201ACh\r
_Times2String		equ 00201B0h\r
_Plus1			equ 00201B4h\r
_Minus1			equ 00201B8h\r
_FPSub			equ 00201BCh\r
_FPAdd			equ 00201C0h\r
_DToR			equ 00201C4h\r
_RToD			equ 00201C8h\r
_Cube			equ 00201CCh\r
_TimesPT5		equ 00201D0h\r
_FPSquare		equ 00201D4h\r
_FPMult			equ 00201D8h\r
_LJRnd			equ 00201DCh\r
_InvOP1Sc		equ 00201E0h\r
_InvOP1S		equ 00201E4h\r
_InvOP2S		equ 00201E8h\r
_Frac			equ 00201ECh\r
_FPRecip		equ 00201F0h\r
_FPDiv			equ 00201F4h\r
_SqRoot			equ 00201F8h\r
_RndGuard		equ 00201FCh\r
_Rnfx			equ 0020200h\r
_Int			equ 0020204h\r
_Round			equ 0020208h\r
_LnX			equ 002020Ch\r
_LogX			equ 0020210h\r
_LJNoRnd		equ 0020214h\r
_EToX			equ 0020218h\r
_TenX			equ 002021Ch\r
_SinCosRad		equ 0020220h\r
_Sin			equ 0020224h\r
_Cos			equ 0020228h\r
_Tan			equ 002022Ch\r
_SinhCosh		equ 0020230h\r
_Tanh			equ 0020234h\r
_Cosh			equ 0020238h\r
_Sinh			equ 002023Ch\r
_AcosRad		equ 0020240h\r
_AtanRad		equ 0020244h\r
_Atan2Rad		equ 0020248h\r
_AsinRad		equ 002024Ch\r
_Acos			equ 0020250h\r
_Atan			equ 0020254h\r
_Asin			equ 0020258h\r
_Atan2			equ 002025Ch\r
_Atanh			equ 0020260h\r
_Asinh			equ 0020264h\r
_Acosh			equ 0020268h\r
_PToR			equ 002026Ch\r
_RToP			equ 0020270h\r
_HLTimes9		equ 0020274h\r
_CkOP1Cplx		equ 0020278h\r
_CkOP1Real		equ 002027Ch\r
_Angle			equ 0020280h\r
_COP1Set0		equ 0020284h\r
_Cpop4OP3		equ 0020288h\r
_Mov9OP2Cp		equ 002028Ch\r
_AbsO1O2Cp		equ 0020290h\r
_cpop1OP2		equ 0020294h\r
_OP3ToOP4		equ 0020298h\r
_OP1ToOP4		equ 002029Ch\r
_OP2ToOP4		equ 00202A0h\r
_OP4ToOP2		equ 00202A4h\r
_OP3ToOP2		equ 00202A8h\r
_OP1ToOP3		equ 00202ACh\r
_OP5ToOP2		equ 00202B0h\r
_OP5ToOP6		equ 00202B4h\r
_OP5ToOP4		equ 00202B8h\r
_OP1ToOP2		equ 00202BCh\r
_OP6ToOP2		equ 00202C0h\r
_OP6ToOP1		equ 00202C4h\r
_OP4toOP1		equ 00202C8h\r
_OP5ToOP1		equ 00202CCh\r
_OP3ToOP1		equ 00202D0h\r
_OP6ToOP5		equ 00202D4h\r
_OP4ToOP5		equ 00202D8h\r
_OP3ToOP5		equ 00202DCh\r
_OP2ToOP5		equ 00202E0h\r
_OP2ToOP6		equ 00202E4h\r
_OP1ToOP6		equ 00202E8h\r
_OP1ToOP5		equ 00202ECh\r
_OP2ToOP1		equ 00202F0h\r
_Mov11b			equ 00202F4h\r
_Mov10b			equ 00202F8h\r
_Mov9b			equ 00202FCh\r
_Mov9b_Dup		equ 0020300h\r
_Mov8b			equ 0020304h\r
_Mov7b			equ 0020308h\r
_Mov7b_Dup		equ 002030Ch\r
_OP2ToOP3		equ 0020310h\r
_OP4ToOP3		equ 0020314h\r
_OP5ToOP3		equ 0020318h\r
_OP4ToOP6		equ 002031Ch\r
_Mov9ToOP1		equ 0020320h\r
_Mov9OP1OP2		equ 0020324h\r
_Mov9ToOP2		equ 0020328h\r
_MovFROP1		equ 002032Ch\r
_OP4Set1		equ 0020330h\r
_OP3Set1		equ 0020334h\r
_OP2Set8		equ 0020338h\r
_OP2Set5		equ 002033Ch\r
_OP2Seta		equ 0020340h\r
_OP2Set4		equ 0020344h\r
_OP2Set3		equ 0020348h\r
_OP1Set1		equ 002034Ch\r
_OP1Set4		equ 0020350h\r
_OP1Set3		equ 0020354h\r
_OP3Set2		equ 0020358h\r
_OP1Set2		equ 002035Ch\r
_OP2Set2		equ 0020360h\r
_OP2Set1		equ 0020364h\r
_Zero16d		equ 0020368h\r
_OP5Set0		equ 002036Ch\r
_OP4Set0		equ 0020370h\r
_OP3Set0		equ 0020374h\r
_OP2Set0		equ 0020378h\r
_OP1Set0		equ 002037Ch\r
_SetNum0		equ 0020380h\r
_ZeroOP1		equ 0020384h\r
_ZeroOP2		equ 0020388h\r
_ZeroOP3		equ 002038Ch\r
_ZeroOP			equ 0020390h\r
_ClrLP			equ 0020394h\r
_ShrACC			equ 0020398h\r
_ShlACC			equ 002039Ch\r
_Shr18			equ 00203A0h\r
_Shr18a			equ 00203A4h\r
_Shr16			equ 00203A8h\r
_Shr14			equ 00203ACh\r
_Shl16			equ 00203B0h\r
_Shl14			equ 00203B4h\r
_Srdo1			equ 00203B8h\r
_ShrdRnd		equ 00203BCh\r
_MantPa			equ 00203C0h\r
_AddPrOP		equ 00203C4h\r
_AddPrOPlP		equ 00203C8h\r
_Add16d			equ 00203CCh\r
_Add14d			equ 00203D0h\r
_Sub16d			equ 00203D4h\r
_Sub14d			equ 00203D8h\r
_OP2ExOP6		equ 00203DCh\r
_OP5ExOP6		equ 00203E0h\r
_OP1ExOP5		equ 00203E4h\r
_OP1ExOP6		equ 00203E8h\r
_OP2ExOP4		equ 00203ECh\r
_OP2ExOP5		equ 00203F0h\r
_OP1ExOP3		equ 00203F4h\r
_OP1ExOP4		equ 00203F8h\r
_OP1ExOP2		equ 00203FCh\r
_ExLP			equ 0020400h\r
_CkOP1c0		equ 0020404h\r
_CkOP1FP0		equ 0020408h\r
_CkOP2fp0		equ 002040Ch\r
_PosNo0Int		equ 0020410h\r
_CkPosInt		equ 0020414h\r
_CkInt			equ 0020418h\r
_CkOdd			equ 002041Ch\r
_CkOP1EX		equ 0020420h\r
_GetCon1		equ 0020424h\r
_GetCon			equ 0020428h\r
_PiDiv2			equ 002042Ch\r
_PiDiv4			equ 0020430h\r
_TwoPi			equ 0020434h\r
_PiCon			equ 0020438h\r
_ExpToHex		equ 002043Ch\r
_OP1ExpToDec		equ 0020440h\r
_CkOP2Pos		equ 0020444h\r
_CkOP1Pos		equ 0020448h\r
_ClrOP2S		equ 002044Ch\r
_ClrOP1S		equ 0020450h\r
_FDiv100		equ 0020454h\r
_FDiv10			equ 0020458h\r
_DecO1exp		equ 002045Ch\r
_IncO1exp		equ 0020460h\r
_IncExp			equ 0020464h\r
_CkValidNum		equ 0020468h\r
_GetExp			equ 002046Ch\r
_HtimesL		equ 0020470h\r
_EOP1NotReal		equ 0020474h\r
_ThetaName		equ 0020478h\r
_RName			equ 002047Ch\r
_RegEqName		equ 0020480h\r
_ReCurnName		equ 0020484h\r
_XName			equ 0020488h\r
_YName			equ 002048Ch\r
_TName			equ 0020490h\r
_RealName		equ 0020494h\r
_SetEStoFPS		equ 0020498h\r
_ChkTempDirt		equ 002049Ch\r
_OP1ExOP2Exp		equ 00204A0h\r
_OP1ExpmDE		equ 00204A4h\r
_ChkErrBreak		equ 00204A8h\r
_Isa2ByteTok		equ 00204ACh\r
_GetLastEntry		equ 00204B0h\r
_GetLastEntryPtr	equ 00204B4h\r
_RegRclrChng		equ 00204B8h\r
_ResetWinTop		equ 00204BCh\r
_IsO1NonTLstOrProg	equ 00204C0h\r
_IsO1NonTempLst		equ 00204C4h\r
_Is_A_LstOrCLst		equ 00204C8h\r
_Chk_HL_999		equ 00204CCh\r
_Equ_Or_NewEqu		equ 00204D0h\r
_Errd_OP1NotPos		equ 00204D4h\r
_Errd_OP1Not_R		equ 00204D8h\r
_Errd_OP1NotPosInt	equ 00204DCh\r
_Errd_OP1_le_0		equ 00204E0h\r
_Errd_OP1_0		equ 00204E4h\r
_ChkFindSym_Get_Size	equ 00204E8h\r
_Sto_StatVar		equ 00204ECh\r
_Rcl_StatVar		equ 00204F0h\r
_CkOP2Real		equ 00204F4h\r
_Get_X_Indirect		equ 00204F8h\r
_MemChk			equ 00204FCh\r
_CmpPrgNamLen1		equ 0020500h\r
_CmpPrgNamLen		equ 0020504h\r
_FindProgSym		equ 0020508h\r
_ChkFindSym		equ 002050Ch\r
_FindSym		equ 0020510h\r
_InsertMem		equ 0020514h\r
_InsertMemA		equ 0020518h\r
_EnoughMem		equ 002051Ch\r
_CmpMemNeed		equ 0020520h\r
_CreatePVar4		equ 0020524h\r
_CreatePVar3		equ 0020528h\r
_CreateVar3		equ 002052Ch\r
_CreateCplx		equ 0020530h\r
_CreateReal		equ 0020534h\r
_CreateTRList		equ 0020538h\r
_CreateRList		equ 002053Ch\r
_CreateTCList		equ 0020540h\r
_CreateCList		equ 0020544h\r
_CreateTRMat		equ 0020548h\r
_CreateRMat		equ 002054Ch\r
_CreateTStrng		equ 0020550h\r
_CreateStrng		equ 0020554h\r
_Create0Equ		equ 0020558h\r
_CreatetEqu		equ 002055Ch\r
_CreateEqu		equ 0020560h\r
_CreateGDB		equ 0020564h\r
_CreateProg		equ 0020568h\r
_ChkDel			equ 002056Ch\r
_ChkDelA		equ 0020570h\r
_AdjParser		equ 0020574h\r
_AdjMath		equ 0020578h\r
_AdjM7			equ 002057Ch\r
_DelMemA		equ 0020580h\r
_Get_Form_Num		equ 0020584h\r
_DelVar			equ 0020588h\r
_DelVarIO		equ 002058Ch\r
_DelMem			equ 0020590h\r
_DelVar3D		equ 0020594h\r
_DelVar3C		equ 0020598h\r
_DelVar3DC		equ 002059Ch\r
_Sym_Prog_non_t_Lst	equ 00205A0h\r
_AdjSymPtrs		equ 00205A4h\r
_DataSizeA		equ 00205A8h\r
_DataSize		equ 00205ACh\r
_PopMCplxO1		equ 00205B0h\r
_PopMCplx		equ 00205B4h\r
_MovCplx		equ 00205B8h\r
_PopOP5			equ 00205BCh\r
_PopOP3			equ 00205C0h\r
_PopOP1			equ 00205C4h\r
_PopRealO6		equ 00205C8h\r
_PopRealO5		equ 00205CCh\r
_PopRealO4		equ 00205D0h\r
_PopRealO3		equ 00205D4h\r
_PopRealO2		equ 00205D8h\r
_PopRealO1		equ 00205DCh\r
_PopReal		equ 00205E0h\r
_FPopCplx		equ 00205E4h\r
_FPopReal		equ 00205E8h\r
_FPopFPS		equ 00205ECh\r
_DeallocFPS		equ 00205F0h\r
_DeallocFPS1		equ 00205F4h\r
_AllocFPS		equ 00205F8h\r
_AllocFPS1		equ 00205FCh\r
_PushRealO6		equ 0020600h\r
_PushRealO5		equ 0020604h\r
_PushRealO4		equ 0020608h\r
_PushRealO3		equ 002060Ch\r
_PushRealO2		equ 0020610h\r
_PushRealO1		equ 0020614h\r
_PushReal		equ 0020618h\r
_PushOP5		equ 002061Ch\r
_PushOP3		equ 0020620h\r
_PushMCplxO3		equ 0020624h\r
_PushOP1		equ 0020628h\r
_PushMCplxO1		equ 002062Ch\r
_PushMCplx		equ 0020630h\r
_ExMCplxO1		equ 0020634h\r
_Exch9			equ 0020638h\r
_CpyTo1FPS11		equ 002063Ch\r
_CpyTo2FPS5		equ 0020640h\r
_CpyTo1FPS5		equ 0020644h\r
_CpyTo2FPS6		equ 0020648h\r
_CpyTo1FPS6		equ 002064Ch\r
_CpyTo2FPS7		equ 0020650h\r
_CpyTo1FPS7		equ 0020654h\r
_CpyTo1FPS8		equ 0020658h\r
_CpyTo2FPS8		equ 002065Ch\r
_CpyTo1FPS10		equ 0020660h\r
_CpyTo1FPS9		equ 0020664h\r
_CpyTo2FPS4		equ 0020668h\r
_CpyTo6FPS3		equ 002066Ch\r
_CpyTo6FPS2		equ 0020670h\r
_CpyTo2FPS3		equ 0020674h\r
_Cpycto1FPS3		equ 0020678h\r
_CpyTo1FPS3		equ 002067Ch\r
_CpyFPS3		equ 0020680h\r
_CpyTo1FPS4		equ 0020684h\r
_CpyTo3FPS2		equ 0020688h\r
_CpyTo5FPSt		equ 002068Ch\r
_CpyTo6FPSt		equ 0020690h\r
_CpyTo4FPSt		equ 0020694h\r
_CpyTo3FPSt		equ 0020698h\r
_CpyTo2FPSt		equ 002069Ch\r
_CpyTo1FPSt		equ 00206A0h\r
_CpyFPSt		equ 00206A4h\r
_CpyStack		equ 00206A8h\r
_CpyTo3FPS1		equ 00206ACh\r
_CpyTo2FPS1		equ 00206B0h\r
_CpyTo1FPS1		equ 00206B4h\r
_CpyFPS1		equ 00206B8h\r
_CpyTo2FPS2		equ 00206BCh\r
_CpyTo1FPS2		equ 00206C0h\r
_CpyFPS2		equ 00206C4h\r
_CpyO3ToFPSt		equ 00206C8h\r
_CpyO2ToFPSt		equ 00206CCh\r
_CpyO6ToFPSt		equ 00206D0h\r
_CpyO1ToFPSt		equ 00206D4h\r
_CpyToFPSt		equ 00206D8h\r
_CpyToStack		equ 00206DCh\r
_CpyO3ToFPS1		equ 00206E0h\r
_CpyO5ToFPS1		equ 00206E4h\r
_CpyO2ToFPS1		equ 00206E8h\r
_CpyO1ToFPS1		equ 00206ECh\r
_CpyToFPS1		equ 00206F0h\r
_CpyO2ToFPS2		equ 00206F4h\r
_CpyO3ToFPS2		equ 00206F8h\r
_CpyO6ToFPS2		equ 00206FCh\r
_CpyO1ToFPS2		equ 0020700h\r
_CpyToFPS2		equ 0020704h\r
_CpyO5ToFPS3		equ 0020708h\r
_CpyO2ToFPS3		equ 002070Ch\r
_CpyO1ToFPS3		equ 0020710h\r
_CpyToFPS3		equ 0020714h\r
_CpyO1ToFPS6		equ 0020718h\r
_CpyO1ToFPS7		equ 002071Ch\r
_CpyO1ToFPS5		equ 0020720h\r
_CpyO2ToFPS4		equ 0020724h\r
_CpyO1ToFPS4		equ 0020728h\r
_ErrNotEnoughMem	equ 002072Ch\r
_FPSMinus9		equ 0020730h\r
_HLMinus9		equ 0020734h\r
_ErrOverflow		equ 0020738h\r
_ErrDivBy0		equ 002073Ch\r
_ErrSingularMat		equ 0020740h\r
_ErrDomain		equ 0020744h\r
_ErrIncrement		equ 0020748h\r
_ErrNon_Real		equ 002074Ch\r
_ErrSyntax		equ 0020750h\r
_ErrDataType		equ 0020754h\r
_ErrArgument		equ 0020758h\r
_ErrDimMismatch		equ 002075Ch\r
_ErrDimension		equ 0020760h\r
_ErrUndefined		equ 0020764h\r
_ErrMemory		equ 0020768h\r
_ErrInvalid		equ 002076Ch\r
_ErrBreak		equ 0020770h\r
_ErrStat		equ 0020774h\r
_ErrSignchange		equ 0020778h\r
_ErrIterations		equ 002077Ch\r
_ErrBadGuess		equ 0020780h\r
_ErrTolTooSmall		equ 0020784h\r
_ErrStatPlot		equ 0020788h\r
_ErrLinkXmit		equ 002078Ch\r
_JError			equ 0020790h\r
_NoErrorEntry		equ 0020794h\r
_PushErrorHandler	equ 0020798h\r
_PopErrorHandler	equ 002079Ch\r
_StrCopy		equ 00207A0h\r
_StrngCat		equ 00207A4h\r
_IsInSet		equ 00207A8h\r
_GeqNameA		equ 00207ACh\r
_RecName		equ 00207B0h\r
_PutMap			equ 00207B4h\r
_PutC			equ 00207B8h\r
_DispHL_s		equ 00207BCh\r
_PutS			equ 00207C0h\r
_PutPSB			equ 00207C4h\r
_PutPS			equ 00207C8h\r
_WPutPS			equ 00207CCh\r
_PutBuf			equ 00207D0h\r
_PutBuf1		equ 00207D4h\r
_WPutC			equ 00207D8h\r
_WPutS			equ 00207DCh\r
_WPutSEOL		equ 00207E0h\r
_WDispEOL		equ 00207E4h\r
_WHomeUp		equ 00207E8h\r
_SetNumWindow		equ 00207ECh\r
_NewLine		equ 00207F0h\r
_MoveDown		equ 00207F4h\r
_ScrollUp		equ 00207F8h\r
_ShrinkWindow		equ 00207FCh\r
_MoveUp			equ 0020800h\r
_ScrollDown		equ 0020804h\r
_ClrLCDFull		equ 0020808h\r
_ClrLCD			equ 002080Ch\r
_ClrScrnFull		equ 0020810h\r
_ClrScrn		equ 0020814h\r
_ClrTxtShd		equ 0020818h\r
_ClrWindow		equ 002081Ch\r
_EraseEOL		equ 0020820h\r
_EraseEOW		equ 0020824h\r
_HomeUp			equ 0020828h\r
_GetCurloc		equ 002082Ch\r
_VPutmap		equ 0020830h\r
_VPutS			equ 0020834h\r
_VPutSN			equ 0020838h\r
_VPutSNG		equ 002083Ch\r
_VPutSNT		equ 0020840h\r
_RunIndicOn		equ 0020844h\r
_RunIndicOff		equ 0020848h\r
_SaveCmdShadow		equ 002084Ch\r
_SaveShadow		equ 0020850h\r
_RStrShadow		equ 0020854h\r
_RStrPartial		equ 0020858h\r
_RStrCurRow		equ 002085Ch\r
_RStrUnderMenu		equ 0020860h\r
_RStrbotRow		equ 0020864h\r
_GetKeypress		equ 0020868h\r
_GetTokLen		equ 002086Ch\r
_Get_Tok_Strng		equ 0020870h\r
_GetTokString		equ 0020874h\r
_PutBPatBuf2		equ 0020878h\r
_PutBPatBuf		equ 002087Ch\r
_PutBPat		equ 0020880h\r
_PutcChkScroll		equ 0020884h\r
_DispEOL		equ 0020888h\r
_FDispEOL		equ 002088Ch\r
_MakeRowCmd		equ 0020890h\r
_ToToStrp		equ 0020894h\r
_SetVarName		equ 0020898h\r
_DispDone		equ 002089Ch\r
_FinishOutput		equ 00208A0h\r
_CurBlink		equ 00208A4h\r
_CursorOff		equ 00208A8h\r
_HideCursor		equ 00208ACh\r
_CursorOn		equ 00208B0h\r
_ShowCursor		equ 00208B4h\r
_KeyToString		equ 00208B8h\r
_PullDownChk		equ 00208BCh\r
_MenuCatCommon		equ 00208C0h\r
_LoadCurcat		equ 00208C4h\r
_NCIFPrgmedMode		equ 00208C8h\r
_LoadMenuNum		equ 00208CCh\r
_LoadMenuNuml		equ 00208D0h\r
_MenuEdKey		equ 00208D4h\r
_MenCatRet		equ 00208D8h\r
_NotAlphNum		equ 00208DCh\r
;00208E0h\r
;00208E4h\r
;00208E8h\r
;00208ECh\r
_DispLIstName		equ 00208F0h\r
_DispLAlphaName		equ 00208F4h\r
_AbortPrgmode		equ 00208F8h\r
_IsFullCntx		equ 00208FCh\r
_AdrMRow		equ 0020900h\r
_AdrmeLE		equ 0020904h\r
_GetmatOP1A		equ 0020908h\r
_Getm1toOP1		equ 002090Ch\r
_Getm1tOP1A		equ 0020910h\r
_GetmtoOP1		equ 0020914h\r
_Puttom1a		equ 0020918h\r
_Puttoma1		equ 002091Ch\r
_PutToMat		equ 0020920h\r
_MatELDiv		equ 0020924h\r
_CMatFun		equ 0020928h\r
_RowEchPoly		equ 002092Ch\r
_RowEchelon		equ 0020930h\r
_AdrLELE		equ 0020934h\r
_Getl1ToOP1		equ 0020938h\r
_Getl1TOP1A		equ 002093Ch\r
_GetlToOP1		equ 0020940h\r
_Getl1ToOP2		equ 0020944h\r
_Getl1TOP2A		equ 0020948h\r
_Getl2TOP1A		equ 002094Ch\r
_PutTola1		equ 0020950h\r
_PutToL			equ 0020954h\r
_MaxMinLst		equ 0020958h\r
_LLow			equ 002095Ch\r
_LHigh			equ 0020960h\r
_LSum			equ 0020964h\r
_CumSum			equ 0020968h\r
_ToFrac			equ 002096Ch\r
_SeqSet			equ 0020970h\r
_SeqSolve		equ 0020974h\r
_CmpNumInit		equ 0020978h\r
_BinopExec		equ 002097Ch\r
_ExMeanL		equ 0020980h\r
_Set2MVLPtrs		equ 0020984h\r
_SetMat1		equ 0020988h\r
_CreateTLIst		equ 002098Ch\r
_UnopExec		equ 0020990h\r
_ThreeExec		equ 0020994h\r
_RestoreErrNo		equ 0020998h\r
_FourExec		equ 002099Ch\r
_FiveExec		equ 00209A0h\r
_CpyTo2ES1		equ 00209A4h\r
_CpyTo6ES1		equ 00209A8h\r
_CpyTo1ES1		equ 00209ACh\r
_CpyTo3ES1		equ 00209B0h\r
_CpyTo3ES2		equ 00209B4h\r
_CpyTo2ES2		equ 00209B8h\r
_CpyTo1ES2		equ 00209BCh\r
_CpyTo2ES3		equ 00209C0h\r
_CpyTo1ES3		equ 00209C4h\r
_CpyTo3ES4		equ 00209C8h\r
_CpyTo6ES3		equ 00209CCh\r
_CpyTo2ES4		equ 00209D0h\r
_CpyTo1ES4		equ 00209D4h\r
_CpyTo2ES5		equ 00209D8h\r
_CpyTo1ES5		equ 00209DCh\r
_CpyTo4ESt		equ 00209E0h\r
_CpyTo2ESt		equ 00209E4h\r
_CpyTo1ESt		equ 00209E8h\r
_CpyTo2ES6		equ 00209ECh\r
_CpyTo1ES6		equ 00209F0h\r
_CpyTo2ES7		equ 00209F4h\r
_CpyTo1ES7		equ 00209F8h\r
_CpyTo2ES8		equ 00209FCh\r
_CpyTo1ES8		equ 0020A00h\r
_CpyTo1ES9		equ 0020A04h\r
_CpyTo2ES9		equ 0020A08h\r
_CpyTo2ES10		equ 0020A0Ch\r
_CpyTo1ES10		equ 0020A10h\r
_CpyTo2ES11		equ 0020A14h\r
_CpyTo1ES11		equ 0020A18h\r
_CpyTo2ES12		equ 0020A1Ch\r
_CpyTo1ES12		equ 0020A20h\r
_CpyTo2ES13		equ 0020A24h\r
_CpyTo1ES13		equ 0020A28h\r
_CpyTo1ES14		equ 0020A2Ch\r
_CpyTo1ES16		equ 0020A30h\r
_CpyTo1ES17		equ 0020A34h\r
_CpyTo1ES18		equ 0020A38h\r
_CpyTo1ES15		equ 0020A3Ch\r
_CpyTo2ES15		equ 0020A40h\r
_CpyO1ToESt		equ 0020A44h\r
_CpyO1ToES1		equ 0020A48h\r
_CpyO6ToES1		equ 0020A4Ch\r
_CpyO6ToES3		equ 0020A50h\r
_CpyO1ToES2		equ 0020A54h\r
_CpyO2ToES2		equ 0020A58h\r
_CpyO1ToES3		equ 0020A5Ch\r
_CpyO1ToES4		equ 0020A60h\r
_CpyO1ToES5		equ 0020A64h\r
_CpyO1ToES6		equ 0020A68h\r
_CpyO1ToES7		equ 0020A6Ch\r
_CpyO2ToES4		equ 0020A70h\r
_CpyO2ToES5		equ 0020A74h\r
_CpyO2ToES6		equ 0020A78h\r
_CpyO2ToES7		equ 0020A7Ch\r
_CpyO2ToES8		equ 0020A80h\r
_CpyO2ToES9		equ 0020A84h\r
_CpyO1ToES8		equ 0020A88h\r
_CpyO1ToES9		equ 0020A8Ch\r
_CpyO1ToES10		equ 0020A90h\r
_CpyO1ToES11		equ 0020A94h\r
_CpyO1ToES12		equ 0020A98h\r
_CpyO1ToES13		equ 0020A9Ch\r
_CpyO1ToES14		equ 0020AA0h\r
_EvalF3A		equ 0020AA4h\r
_GetK			equ 0020AA8h\r
_SetTitle		equ 0020AACh\r
_DispVarVal		equ 0020AB0h\r
_RecallEd		equ 0020AB4h\r
_SetUpBuffer		equ 0020AB8h\r
_CreateNumEditBuf	equ 0020ABCh\r
_CallCommon		equ 0020AC0h\r
_CommonKeys		equ 0020AC4h\r
_LeftMore		equ 0020AC8h\r
_FDel			equ 0020ACCh\r
_FClear			equ 0020AD0h\r
_FInsDisp		equ 0020AD4h\r
_FInsDisp02		equ 0020AD8h\r
_SetIndicator		equ 0020ADCh\r
_DspLstsNor		equ 0020AE0h\r
_ReleaseBuffer		equ 0020AE4h\r
_VarNameToOP1HL		equ 0020AE8h\r
_NameToOP1		equ 0020AECh\r
_NumpPutAway		equ 0020AF0h\r
_NumReDisp		equ 0020AF4h\r
_NumError02		equ 0020AF8h\r
_Load_Sfont		equ 0020AFCh\r
_Sfont_Len		equ 0020B00h\r
_InitNumVec		equ 0020B04h\r
_SetxxOP1		equ 0020B08h\r
_SetxxOP2		equ 0020B0Ch\r
_SetxxxxOP2		equ 0020B10h\r
_UCLines		equ 0020B14h\r
_CLine			equ 0020B18h\r
_CLines			equ 0020B1Ch\r
_XrootY			equ 0020B20h\r
_YtoX			equ 0020B24h\r
;0020B28h\r
;0020B2Ch\r
;0020B30h\r
;0020B34h\r
;0020B38h\r
;0020B3Ch\r
;0020B40h\r
;0020B44h\r
;0020B48h\r
;0020B4Ch\r
;0020B50h\r
;0020B54h\r
;0020B58h\r
;0020B5Ch\r
;0020B60h\r
;0020B64h\r
;0020B68h\r
;0020B6Ch\r
_Mov18b			equ 0020B70h\r
_DarkLine		equ 0020B74h\r
_ILine			equ 0020B78h\r
_IPoint			equ 0020B7Ch\r
_XYRndBoth		equ 0020B80h\r
_XYRnd			equ 0020B84h\r
_CheckTOP		equ 0020B88h\r
_CheckXY		equ 0020B8Ch\r
_DarkPnt		equ 0020B90h\r
_CPointS		equ 0020B94h\r
_WToV			equ 0020B98h\r
_VtoWHLDE		equ 0020B9Ch\r
_Xitof			equ 0020BA0h\r
_YftoI			equ 0020BA4h\r
_XftoI			equ 0020BA8h\r
_TraceOff		equ 0020BACh\r
_GrRedisp		equ 0020BB0h\r
_GDispToken		equ 0020BB4h\r
_GrdeCoda		equ 0020BB8h\r
_LabCoor		equ 0020BBCh\r
_CoorDisp		equ 0020BC0h\r
_TmpEquNoSrc		equ 0020BC4h\r
_GrLabels		equ 0020BC8h\r
_YPixSet		equ 0020BCCh\r
_XPixSet		equ 0020BD0h\r
_CopyRng		equ 0020BD4h\r
_ValCur			equ 0020BD8h\r
_GrPutAway		equ 0020BDCh\r
_RstGFlags		equ 0020BE0h\r
_GrReset		equ 0020BE4h\r
_XYCent			equ 0020BE8h\r
_ZoomXYCmd		equ 0020BECh\r
_CptDelY		equ 0020BF0h\r
_CptDelX		equ 0020BF4h\r
_SetFuncM		equ 0020BF8h\r
_SetSeqM		equ 0020BFCh\r
_SetPolM		equ 0020C00h\r
_SetParM		equ 0020C04h\r
_ZmInt			equ 0020C08h\r
_ZmDecml		equ 0020C0Ch\r
_ZmPrev			equ 0020C10h\r
_ZmUsr			equ 0020C14h\r
_SetuZM			equ 0020C18h\r
_ZmFit			equ 0020C1Ch\r
_ZmSquare		equ 0020C20h\r
_ZmTrig			equ 0020C24h\r
_SetXMinMax		equ 0020C28h\r
_ZooDefault		equ 0020C2Ch\r
;0020C30h\r
;0020C34h\r
;0020C38h\r
;0020C3Ch\r
;0020C40h\r
;0020C44h\r
;0020C48h\r
;0020C4Ch\r
;0020C50h\r
;0020C54h\r
_ChkTextCurs		equ 0020C58h\r
;0020C5Ch\r
_DoRefFlags02		equ 0020C60h\r
_InitNSeq		equ 0020C64h\r
_YRes			equ 0020C68h\r
_Ceiling		equ 0020C6Ch\r
_PutXY			equ 0020C70h\r
_PutEquNo		equ 0020C74h\r
_PDspGrph		equ 0020C78h\r
_HorizCmd		equ 0020C7Ch\r
_VertCmd		equ 0020C80h\r
_LineCmd		equ 0020C84h\r
_UnLineCmd		equ 0020C88h\r
_PointCmd		equ 0020C8Ch\r
_PixelTest  		equ 0020C90h\r
_PixelCmd		equ 0020C94h\r
_TanLnF			equ 0020C98h\r
_DrawCmdInit		equ 0020C9Ch\r
_DrawCmd		equ 0020CA0h\r
_ShadeCmd		equ 0020CA4h\r
_InvCmd			equ 0020CA8h\r
_StatShade		equ 0020CACh\r
_DspMatTable		equ 0020CB0h\r
_DspLsts		equ 0020CB4h\r
_CloseEditBuf		equ 0020CB8h\r
_ParseEditBuf		equ 0020CBCh\r
_PutSM			equ 0020CC0h\r
_DspCurTbl		equ 0020CC4h\r
_DspGrTbl		equ 0020CC8h\r
_ZeroTemplate		equ 0020CCCh\r
_SetTblRefs		equ 0020CD0h\r
_DispTblBot		equ 0020CD4h\r
_DispTblTop		equ 0020CD8h\r
_DispTblBody		equ 0020CDCh\r
_VPutBlank		equ 0020CE0h\r
_TblTrace		equ 0020CE4h\r
_DispListNameY		equ 0020CE8h\r
_CurNameLength		equ 0020CECh\r
_NameToBuf		equ 0020CF0h\r
_JPromptCursor		equ 0020CF4h\r
_BufLeft		equ 0020CF8h\r
_BufRight		equ 0020CFCh\r
_BufInsert		equ 0020D00h\r
_BufQueueChar		equ 0020D04h\r
_BufReplace		equ 0020D08h\r
_BufDelete		equ 0020D0Ch\r
_BufPeek		equ 0020D10h\r
_BufPeek1		equ 0020D14h\r
_BufPeek2		equ 0020D18h\r
_BufPeek3		equ 0020D1Ch\r
_BufToBtm		equ 0020D20h\r
_SetupEditEqu		equ 0020D24h\r
_BufToTop		equ 0020D28h\r
_IsEditFull		equ 0020D2Ch\r
_IsEditEmpty		equ 0020D30h\r
_IsAtTOP		equ 0020D34h\r
_IsAtBtm		equ 0020D38h\r
;0020D3Ch\r
_JCursorFirst		equ 0020D40h\r
_JCursorLast		equ 0020D44h\r
_JursorLeft		equ 0020D48h\r
_JCursorRight		equ 0020D4Ch\r
_JCursorUp		equ 0020D50h\r
_JursorDown		equ 0020D54h\r
_CursorToOffset		equ 0020D58h\r
_InsDisp		equ 0020D5Ch\r
_FDispBOL1		equ 0020D60h\r
_FDispBOL		equ 0020D64h\r
_DispEOW		equ 0020D68h\r
_DispHead		equ 0020D6Ch\r
_DispTail		equ 0020D70h\r
_PutTokString		equ 0020D74h\r
_SetUpEditCmd		equ 0020D78h\r
_SetEmptyeditEqu	equ 0020D7Ch\r
_SetEmptyEditPtr	equ 0020D80h\r
_CloseEditEqu		equ 0020D84h\r
_GetPrevTok		equ 0020D88h\r
_GetKey			equ 0020D8Ch\r
_CanIndic		equ 0020D90h\r
_FormDisp		equ 0020D94h\r
_FormMatrix		equ 0020D98h\r
_WScrollLeft		equ 0020D9Ch\r
_WScrollUp		equ 0020DA0h\r
_WScrollDown		equ 0020DA4h\r
_WScrollRight		equ 0020DA8h\r
_FormEReal		equ 0020DACh\r
_FormERealTok		equ 0020DB0h\r
_FormDCplx		equ 0020DB4h\r
_FormReal		equ 0020DB8h\r
_FormScrollUp		equ 0020DBCh\r
_SetWinAbove		equ 0020DC0h\r
_DisarmScroll		equ 0020DC4h\r
_MinToEdit		equ 0020DC8h\r
_RclVarToEdit		equ 0020DCCh\r
_RclVarToEditPtr	equ 0020DD0h\r
_RclEntryToEdit		equ 0020DD4h\r
_RclToQueue		equ 0020DD8h\r
_FormToTok		equ 0020DDCh\r
_DispInterval		equ 0020DE0h\r
_DispLstName		equ 0020DE4h\r
_DispSLstNameHL		equ 0020DE8h\r
;0020DECh\r
;0020DF0h\r
;0020DF4h\r
;0020DF8h\r
;0020DFCh\r
;0020E00h\r
_DispForward		equ 0020E04h\r
_DispYPrompt2		equ 0020E08h\r
_StringWidth		equ 0020E0Ch\r
_DispErrorScreen	equ 0020E10h\r
_PopCX			equ 0020E14h\r
_LoadNoEEntry		equ 0020E18h\r
_SaveScreen		equ 0020E1Ch\r
_RetScreen		equ 0020E20h\r
_RetScreenErr		equ 0020E24h\r
_CheckSplitFlag		equ 0020E28h\r
_SolveRedisp		equ 0020E2Ch\r
_SolveDisp		equ 0020E30h\r
_ItemName		equ 0020E34h\r
_SetNorm_Vals		equ 0020E38h\r
_SetYOffset		equ 0020E3Ch\r
_ConvKeyToTok		equ 0020E40h\r
_ConvFCKeyToTok		equ 0020E44h\r
_ConvFEKeyToTok		equ 0020E48h\r
_TokToKey		equ 0020E4Ch\r
;0020E50h\r
;0020E54h\r
;0020E58h\r
_DelRes			equ 0020E5Ch\r
;0020E60h\r
;0020E64h\r
;0020E68h\r
;0020E6Ch\r
;0020E70h\r
;0020E74h\r
;0020E78h\r
;0020E7Ch\r
;0020E80h\r
;0020E84h\r
;0020E88h\r
;0020E8Ch\r
;0020E90h\r
;0020E94h\r
;0020E98h\r
;0020E9Ch\r
;0020EA0h\r
;0020EA4h\r
;0020EA8h\r
;0020EACh\r
;0020EB0h\r
;0020EB4h\r
;0020EB8h\r
;0020EBCh\r
;0020EC0h\r
;0020EC4h\r
;0020EC8h\r
;0020ECCh\r
;0020ED0h\r
;0020ED4h\r
;0020ED8h\r
;0020EDCh\r
;0020EE0h\r
;0020EE4h\r
;0020EE8h\r
;0020EECh\r
;0020EF0h\r
;0020EF4h\r
;0020EF8h\r
;0020EFCh\r
_ParseInp		equ 0020F00h\r
_ParseOn		equ 0020F04h\r
_ParseScan		equ 0020F08h\r
_GetParse		equ 0020F0Ch\r
_SaveParse		equ 0020F10h\r
_InitPFlgs		equ 0020F14h\r
_CkEndLineRR		equ 0020F18h\r
_OP2Set60		equ 0020F1Ch\r
_GetStatPtr		equ 0020F20h\r
_CmpStatPtr		equ 0020F24h\r
_VarSysAdr		equ 0020F28h\r
_StoSyStok		equ 0020F2Ch\r
_StoAns			equ 0020F30h\r
_StoTheta		equ 0020F34h\r
_StoR			equ 0020F38h\r
_StoY			equ 0020F3Ch\r
_StoN			equ 0020F40h\r
_StoT			equ 0020F44h\r
_StoX			equ 0020F48h\r
_StoOther		equ 0020F4Ch\r
_RclAns			equ 0020F50h\r
_RclY			equ 0020F54h\r
_RclN			equ 0020F58h\r
_RclX			equ 0020F5Ch\r
_RclVarSym		equ 0020F60h\r
_RclsyStok		equ 0020F64h\r
_StMatel		equ 0020F68h\r
_StLstvecel		equ 0020F6Ch\r
_ConvOP1		equ 0020F70h\r
_FindParseFormula	equ 0020F74h\r
_ParseFormula		equ 0020F78h\r
_StrngEnt1		equ 0020F7Ch\r
_Prgrdlp		equ 0020F80h\r
_VarEnt			equ 0020F84h\r
_ParseOnc		equ 0020F88h\r
_ParseOn_Dup		equ 0020F8Ch\r
_ParseCmd		equ 0020F90h\r
_StoType		equ 0020F94h\r
_CreatePair		equ 0020F98h\r
_PushNum		equ 0020F9Ch\r
_IncCurPCErrEnd		equ 0020FA0h\r
_ErrEnd			equ 0020FA4h\r
_CommaErrF		equ 0020FA8h\r
_CommaErr		equ 0020FACh\r
_StEQArg2		equ 0020FB0h\r
_StEQArg		equ 0020FB4h\r
_InpArg			equ 0020FB8h\r
_StEQArg3		equ 0020FBCh\r
_NxtFetch		equ 0020FC0h\r
_CkFetchVar		equ 0020FC4h\r
_FetchVarA		equ 0020FC8h\r
_FetchVar		equ 0020FCCh\r
_CkEndLin		equ 0020FD0h\r
_CkEndExp		equ 0020FD4h\r
_CkParsEnd		equ 0020FD8h\r
_StoTypeArg		equ 0020FDCh\r
_ConvDim		equ 0020FE0h\r
_ConvDim00		equ 0020FE4h\r
_AheadEqual		equ 0020FE8h\r
_ParsaHeads		equ 0020FECh\r
_ParsaHead 		equ 0020FF0h\r
_AnsName		equ 0020FF4h\r
_StoCmpReals		equ 0020FF8h\r
_GetDEPtr		equ 0020FFCh\r
_Push2BOper		equ 0021000h\r
_Push3BOper		equ 0021004h\r
_Pop2BOper		equ 0021008h\r
_Pop3BOper		equ 002100Ch\r
_PushOper		equ 0021010h\r
_PopOper		equ 0021014h\r
_FindEUndef		equ 0021018h\r
_SttmpEQ		equ 002101Ch\r
_FindEOL		equ 0021020h\r
_BrkInc			equ 0021024h\r
_IncFetch		equ 0021028h\r
_CurFetch		equ 002102Ch\r
_Random			equ 0021030h\r
_StoRand		equ 0021034h\r
_RandInit		equ 0021038h\r
_ResetStacks		equ 002103Ch\r
;0021040h\r
;0021044h\r
;0021048h\r
;002104Ch\r
;0021050h\r
;0021054h\r
;0021058h\r
;002105Ch\r
;0021060h\r
;0021064h\r
;0021068h\r
;002106Ch\r
;0021070h\r
;0021074h\r
;0021078h\r
;002107Ch\r
;0021080h\r
;0021084h\r
;0021088h\r
;002108Ch\r
;0021090h\r
;0021094h\r
;0021098h\r
_GrBufClr		equ 002109Ch\r
_GrBufCpyV		equ 00210A0h\r
_FndSelEQ		equ 00210A4h\r
_ClrGraphXY		equ 00210A8h\r
_NEDXTYStyle		equ 00210ACh\r
_PlotPt			equ 00210B0h\r
_NewWindEP		equ 00210B4h\r
_DrawAxes		equ 00210B8h\r
_SetPenX		equ 00210BCh\r
_SetPenY		equ 00210C0h\r
_SetPenT		equ 00210C4h\r
_TanEquDisp		equ 00210C8h\r
_PutAns			equ 00210CCh\r
_DispOP1A		equ 00210D0h\r
;00210D4h\r
_SetTblGraphDraw	equ 00210D8h\r
_MemClear		equ 00210DCh\r
_MemSet			equ 00210E0h\r
_PointOn		equ 00210E4h\r
_ExecuteNewPrgm		equ 00210E8h\r
_StrLength		equ 00210ECh\r
_VPutMapRec		equ 00210F0h\r
;00210F4h\r
;00210F8h\r
;00210FCh\r
;0021100h\r
_AddHL259		equ 0021104h\r
;0021108h\r
_IBounds		equ 002110Ch\r
_IOffset		equ 0021110h\r
;0021114h\r
_CanAlphIns		equ 0021118h\r
;002111Ch\r
_GetBaseVer		equ 0021120h\r
_OPSet0DES		equ 0021124h\r
;0021128h\r
_SetIgnoreKey		equ 002112Ch\r
_SetSendThisKeyBack	equ 0021130h\r
_DisableAPD		equ 0021134h\r
_EnableAPD		equ 0021138h\r
_Set2IY34		equ 002113Ch\r
_ForceCmd		equ 0021140h\r
_ApdSetup		equ 0021144h\r
_Get_NumKey		equ 0021148h\r
_AppSetup		equ 002114Ch\r
_ReleaseSedit		equ 0021150h\r
_InitSmallEditLine	equ 0021154h\r
_StartSmallEdit		equ 0021158h\r
;002115Ch\r
_SGetTokString		equ 0021160h\r
_LoadPattern		equ 0021164h\r
_SStringLength		equ 0021168h\r
_RestorePenCol		equ 002116Ch\r
;0021170h\r
_EmptyHook		equ 0021174h\r
_ForceSmallEditReturn2	equ 0021178h\r
;002117Ch\r
;0021180h\r
_ClearRow		equ 0021184h\r
;0021188h\r
;002118Ch\r
;0021190h\r
;0021194h\r
;0021198h\r
;002119Ch\r
;00211A0h\r
;00211A4h\r
;00211A8h\r
;00211ACh\r
;00211B0h\r
;00211B4h\r
;00211B8h\r
;00211BCh\r
;00211C0h\r
;00211C4h\r
;00211C8h\r
;00211CCh\r
;00211D0h\r
;00211D4h\r
;00211D8h\r
;00211DCh\r
;00211E0h\r
;00211E4h\r
;00211E8h\r
;00211ECh\r
;00211F0h\r
;00211F4h\r
;00211F8h\r
;00211FCh\r
;0021200h\r
;0021204h\r
;0021208h\r
_ErrCustom1		equ 002120Ch\r
_ErrCustom2		equ 0021210h\r
_Ret_1			equ 0021214h\r
_ClearRect		equ 0021218h\r
_InvertRect		equ 002121Ch\r
_FillRect		equ 0021220h\r
;0021224h\r
;0021228h\r
;002122Ch\r
;0021230h\r
;0021234h\r
;0021238h\r
_DrawRectBorder		equ 002123Ch\r
;0021240h\r
;0021244h\r
_EraseRectBorder	equ 0021248h\r
_FillRectPattern	equ 002124Ch\r
_DrawRectBorderClear	equ 0021250h\r
;0021254h\r
;0021258h\r
;002125Ch\r
;0021260h\r
;0021264h\r
;0021268h\r
;002126Ch\r
;0021270h\r
;0021274h\r
;0021278h\r
;002127Ch\r
;0021280h\r
;0021284h\r
;0021288h\r
;002128Ch\r
;0021290h\r
;0021294h\r
;0021298h\r
;002129Ch\r
;00212A0h\r
;00212A4h\r
;00212A8h\r
;00212ACh\r
;00212B0h\r
;00212B4h\r
;00212B8h\r
;00212BCh\r
;00212C0h\r
;00212C4h\r
;00212C8h\r
;00212CCh\r
;00212D0h\r
;00212D4h\r
;00212D8h\r
;00212DCh\r
;00212E0h\r
;00212E4h\r
;00212E8h\r
;00212ECh\r
;00212F0h\r
;00212F4h\r
;00212F8h\r
;00212FCh\r
;0021300h\r
;0021304h\r
;0021308h\r
;002130Ch\r
;0021310h\r
;0021314h\r
;0021318h\r
;002131Ch\r
_GetStringInput		equ 0021320h\r
_GetStringInput2	equ 0021324h\r
_WaitEnterKeyValue	equ 0021328h\r
_HorizontalLine		equ 002132Ch\r
_CreateAppVar		equ 0021330h\r
_CreateProtProg		equ 0021334h\r
_CreateVar		equ 0021338h\r
_AsmComp		equ 002133Ch\r
_GetAsmSize		equ 0021340h\r
_SquishPrgm		equ 0021344h\r
_ExecutePrgm		equ 0021348h\r
_ChkFindSymAsm		equ 002134Ch\r
_ParsePrgmName		equ 0021350h\r
_CAdd			equ 0021354h\r
_CSqaure		equ 0021358h\r
_CMult			equ 002135Ch\r
_CRecip			equ 0021360h\r
_CDiv			equ 0021364h\r
_CAbs			equ 0021368h\r
_AddSquares		equ 002136Ch\r
_CSqroot		equ 0021370h\r
_CLn			equ 0021374h\r
_CLog			equ 0021378h\r
_CTenX			equ 002137Ch\r
_CEtoX			equ 0021380h\r
_CXrootY		equ 0021384h\r
;0021388h\r
_CYtoX			equ 002138Ch\r
_InvertNonReal		equ 0021390h\r
_CplxMult		equ 0021394h\r
_CplxDiv		equ 0021398h\r
_CplxTrunc		equ 002139Ch\r
_CplxFrac		equ 00213A0h\r
_CplxFloor		equ 00213A4h\r
;00213A8h\r
_FlashWriteDisable	equ 00213ACh\r
_Disp			equ 00213B0h\r
_GetBytePaged_Unpaged	equ 00213B4h\r
_RunCursorHook		equ 00213B8h\r
_RunLibraryHook		equ 00213BCh\r
_RunRawkeyHook		equ 00213C0h\r
_SetCursorHook		equ 00213C4h\r
_SetLibraryHook		equ 00213C8h\r
_SetGetKeyHook		equ 00213CCh\r
_ClrCursorHook		equ 00213D0h\r
_ClrLibraryHook		equ 00213D4h\r
_ClrRawKeyHook		equ 00213D8h\r
_GetKeyHook		equ 00213DCh\r
_SetGetCSCHook		equ 00213E0h\r
_ClrGetKeyHook		equ 00213E4h\r
_SetCatalog2Hook	equ 00213E8h\r
_ClrCatalog2Hook	equ 00213ECh\r
_SetLocalizeHook	equ 00213F0h\r
_ClrLocalizeHook	equ 00213F4h\r
_SetTokenHook		equ 00213F8h\r
_ClrTokenHook		equ 00213FCh\r
;0021400h\r
;0021404h\r
_DispListElementOffLA	equ 0021408h\r
_Bit_VertSplit		equ 002140Ch\r
_SetHomescreenHook	equ 0021410h\r
_ClrHomescreenHook	equ 0021414h\r
_SetWIndowHook		equ 0021418h\r
_ClrWindowHook		equ 002141Ch\r
_SetGraphModeHook	equ 0021420h\r
_ClrGraphModeHook	equ 0021424h\r
_ParseAndStoreSysVar	equ 0021428h\r
_DisplayEditSysVar	equ 002142Ch\r
_JForceWIndowSettings	equ 0021430h\r
_DelVarArc		equ 0021434h\r
_DelVarNoArc		equ 0021438h\r
_SetAllPlots		equ 002143Ch\r
_SetYeditHook		equ 0021440h\r
_ClrYeditHook		equ 0021444h\r
_Arc_Unarc		equ 0021448h\r
\r
_ArchiveVar		equ 4FDBh ;set 0,(iy+24h) to check for low battery first\r
_UnarchiveVar		equ 4FDEh\r
\r
;002144Ch\r
;0021450h\r
_SetFontHook		equ 0021454h\r
_ClrFontHook		equ 0021458h\r
_SetRegraphHook		equ 002145Ch\r
_ClrRegraphHook		equ 0021460h\r
_RunGraphingHook	equ 0021464h\r
_SetTraceHook		equ 0021468h\r
_ClrTraceHook		equ 002146Ch\r
_RunTraceHook		equ 0021470h\r
_NDeriv			equ 0021474h\r
_PolarDerivative	equ 0021478h\r
_JForceGraphNoKey	equ 002147Ch\r
_JForceGraphKey		equ 0021480h\r
_PowerOff		equ 0021484h\r
_GetKeyRetOff		equ 0021488h\r
_FindGroupSym		equ 002148Ch\r
_LoadDEIndPaged_Unpaged	equ 0021490h\r
_SetUpPagedPtr_Unpaged	equ 0021494h\r
_PagedGet_Unpaged	equ 0021498h\r
_SetParserHook		equ 002149Ch\r
_ClrParserHook		equ 00214A0h\r
_SetAppChangeHook	equ 00214A4h\r
_ClrAppChangeHook	equ 00214A8h\r
_SetGraphicsHook	equ 00214ACh\r
_ClrGraphicsHook	equ 00214B0h\r
_ILineNoGraphicsHook	equ 00214B4h\r
_ILineNoHook		equ 00214B8h\r
;00214BCh\r
_DeleteTempPrograms	equ 00214C0h\r
_SetCatalog1Hook	equ 00214C4h\r
_ClrCatalog1Hook	equ 00214C8h\r
_SetHelpHook		equ 00214CCh\r
_ClrHelpHook		equ 00214D0h\r
_DispCatalogEnd		equ 00214D4h\r
_GetMenuKeypress	equ 00214D8h\r
_GetCatalogItem		equ 00214DCh\r
_RunCatalog2Hook	equ 00214E0h\r
_RunCatalog1Hook	equ 00214E4h\r
;00214E8h\r
;00214ECh\r
_DispMenuTitle		equ 00214F0h\r
;00214F4h\r
_SetcxReDispHook	equ 00214F8h\r
_ClrcxReDispHook	equ 00214FCh\r
;0021500h\r
;0021504h\r
;0021508h\r
;002150Ch\r
;0021510h\r
;0021514h\r
_SetMenuHook		equ 0021518h\r
_ClrMenuHook		equ 002151Ch\r
_GetBCOffSetIX		equ 0021520h\r
_GetBCOffSetIX_Duplicate	equ 0021524h\r
_ForceFullScreen	equ 0021528h\r
_HLMinus5		equ 002152Ch\r
_Ret_2			equ 0021530h\r
;0021534h\r
;0021538h\r
_Arc_Unarc_Dup		equ 002153Ch\r
;0021540h\r
_SetSilentLinkHook	equ 0021544h\r
_ClrSilentLinkHook	equ 0021548h\r
;002154Ch\r
_ExecClassCToken	equ 0021550h\r
_ExecClass3Token	equ 0021554h\r
_GetSysInfo		equ 0021558h\r
;002155Ch\r
_TenXNoClr		equ 0021560h\r
;0021564h\r
;0021568h\r
;002156Ch\r
;0021570h\r
;0021574h\r
;0021578h\r
;002157Ch\r
;0021580h\r
;0021584h\r
;0021588h\r
;002158Ch\r
;0021590h\r
;0021594h\r
;0021598h\r
;002159Ch\r
;00215A0h\r
_DispCoords		equ 00215A4h\r
;00215A8h\r
;00215ACh\r
_ChkTmr			equ 00215B0h\r
_ClockOff		equ 00215B4h\r
_ClockOn		equ 00215B8h\r
;00215BCh\r
_GetDate		equ 00215C0h\r
_GetDateString		equ 00215C4h\r
_GetDtFmt		equ 00215C8h\r
_GetDtStr		equ 00215CCh\r
_GetTime		equ 00215D0h\r
_FormTime		equ 00215D4h\r
_GetTmFmt		equ 00215D8h\r
_GetTmStr		equ 00215DCh\r
_SetZeroOne		equ 00215E0h\r
_SetDate		equ 00215E4h\r
_IsOneTwoThree		equ 00215E8h\r
_SetTime		equ 00215ECh\r
_IsOP112or24		equ 00215F0h\r
_ChkTimer0		equ 00215F4h\r
_TimeCnv		equ 00215F8h\r
_ClrWindowAndFlags	equ 00215FCh\r
;0021600h\r
;0021604h\r
;0021608h\r
;002160Ch\r
;0021610h\r
_CPOP1OP2Rounded	equ 0021614h\r
_CPOP1OP2Rounded2	equ 0021618h\r
;002161Ch\r
;0021620h\r
;0021624h\r
;0021628h\r
_SetUpEditor		equ 002162Ch\r
_SortA			equ 0021630h\r
_SortD			equ 0021634h\r
;0021638h\r
_IsOP1ResID		equ 002163Ch\r
;0021640h\r
;0021644h\r
;0021648h\r
_ForceModeKeypress	equ 002164Ch\r
_DispAboutScreen	equ 0021650h\r
_ChkHelpHookVer		equ 0021654h\r
;0021658h\r
;002165Ch\r
;0021660h\r
;0021664h\r
;0021668h\r
_DrawTableEditor	equ 002166Ch\r
_DisplayListNameEquals	equ 0021670h\r
_DisplayListHeader	equ 0021674h\r
_DispMatrixDimensions	equ 0021678h\r
_HighlightListEdItem	equ 002167Ch\r
;0021680h\r
;0021684h\r
;0021688h\r
;002168Ch\r
;0021690h\r
;0021694h\r
;0021698h\r
;002169Ch\r
;00216A0h\r
_NumError02_Dup		equ 00216A4h\r
;00216A8h\r
;00216ACh\r
;00216B0h\r
;00216B4h\r
;00216B8h\r
;00216BCh\r
;00216C0h\r
;00216C4h\r
;00216C8h\r
;00216CCh\r
;00216D0h\r
;00216D4h\r
;00216D8h\r
_DrawRectBorder_Dup_2	equ 00216DCh\r
;00216E0h\r
;00216E4h\r
;00216E8h\r
;00216ECh\r
;00216F0h\r
;00216F4h\r
;00216F8h\r
;00216FCh\r
;0021700h\r
;0021704h\r
;0021708h\r
;002170Ch\r
;0021710h\r
;0021714h\r
;0021718h\r
_SetUSBActivityHook	equ 002171Ch\r
_ClrUSBActivityHook	equ 0021720h\r
;0021724h\r
;0021728h\r
;002172Ch\r
;0021730h\r
;0021734h\r
;0021738h\r
;002173Ch\r
;0021740h\r
;0021744h\r
;0021748h\r
;002174Ch\r
;0021750h\r
;0021754h\r
;0021758h\r
;002175Ch\r
;0021760h\r
;0021764h\r
;0021768h\r
;002176Ch\r
;0021770h\r
;0021774h\r
;0021778h\r
;002177Ch\r
;0021780h\r
;0021784h\r
;0021788h\r
;002178Ch\r
;0021790h\r
;0021794h\r
;0021798h\r
;002179Ch\r
;00217A0h\r
;00217A4h\r
;00217A8h\r
;00217ACh\r
;00217B0h\r
;00217B4h\r
;00217B8h\r
;00217BCh\r
;00217C0h\r
;00217C4h\r
;00217C8h\r
;00217CCh\r
;00217D0h\r
;00217D4h\r
;00217D8h\r
;00217DCh\r
;00217E0h\r
;00217E4h\r
;00217E8h\r
;00217ECh\r
;00217F0h\r
;00217F4h\r
;00217F8h\r
;00217FCh\r
;0021800h\r
;0021804h\r
;0021808h\r
;002180Ch\r
;0021810h\r
;0021814h\r
;0021818h\r
;002181Ch\r
;0021820h\r
;0021824h\r
;0021828h\r
;002182Ch\r
;0021830h\r
;0021834h\r
;0021838h\r
;002183Ch\r
;0021840h\r
;0021844h\r
;0021848h\r
;002184Ch\r
;0021850h\r
;0021854h\r
;0021858h\r
;002185Ch\r
;0021860h\r
;0021864h\r
;0021868h\r
;002186Ch\r
;0021870h\r
;0021874h\r
;0021878h\r
;002187Ch\r
;0021880h\r
;0021884h\r
;0021888h\r
;002188Ch\r
;0021890h\r
;0021894h\r
;0021898h\r
;002189Ch\r
;00218A0h\r
;00218A4h\r
;00218A8h\r
;00218ACh\r
;00218B0h\r
;00218B4h\r
;00218B8h\r
;00218BCh\r
;00218C0h\r
;00218C4h\r
;00218C8h\r
;00218CCh\r
;00218D0h\r
;00218D4h\r
;00218D8h\r
;00218DCh\r
;00218E0h\r
;00218E4h\r
;00218E8h\r
;00218ECh\r
_RunInitialBootMenu	equ 00218F0h\r
;00218F4h\r
;00218F8h\r
;00218FCh\r
;0021900h\r
;0021904h\r
;0021908h\r
;002190Ch\r
;0021910h\r
;0021914h\r
;0021918h\r
;002191Ch\r
;0021920h\r
;0021924h\r
;0021928h\r
;002192Ch\r
;0021930h\r
;0021934h\r
;0021938h\r
;002193Ch\r
_CommonKeys_Dup		equ 0021940h\r
;0021944h\r
;0021948h\r
;002194Ch\r
;0021950h\r
;0021954h\r
;0021958h\r
;002195Ch\r
;0021960h\r
;0021964h\r
;0021968h\r
;002196Ch\r
;0021970h\r
;0021974h\r
;0021978h\r
;002197Ch\r
;0021980h\r
;0021984h\r
;0021988h\r
;002198Ch\r
;0021990h\r
;0021994h\r
;0021998h\r
;002199Ch\r
;00219A0h\r
;00219A4h\r
;00219A8h\r
;00219ACh\r
;00219B0h\r
;00219B4h\r
;00219B8h\r
;00219BCh\r
;00219C0h\r
;00219C4h\r
;00219C8h\r
;00219CCh\r
;00219D0h\r
;00219D4h\r
;00219D8h\r
_EnterSelfTest		equ 00219DCh\r
;00219E0h\r
;00219E4h\r
;00219E8h\r
;00219ECh\r
;00219F0h\r
;00219F4h\r
;00219F8h\r
;00219FCh\r
;0021A00h\r
;0021A04h\r
;0021A08h\r
;0021A0Ch\r
_ClrLCDAll		equ 0021A10h\r
;0021A14h\r
;0021A18h\r
;0021A1Ch\r
;0021A20h\r
;0021A24h\r
_SetDrawFGColorA	equ 0021A28h\r
;0021A2Ch\r
;0021A30h\r
;0021A34h\r
;0021A38h\r
_DrawStatusBar		equ 0021A3Ch\r
;0021A40h\r
;0021A44h\r
;0021A48h\r
;0021A4Ch\r
_DrawBatteryIndicator	equ 0021A50h\r
;0021A54h\r
;0021A58h\r
;0021A5Ch\r
;0021A60h\r
;0021A64h\r
;0021A68h\r
;0021A6Ch\r
;0021A70h\r
;0021A74h\r
;0021A78h\r
;0021A7Ch\r
;0021A80h\r
;0021A84h\r
;0021A88h\r
;0021A8Ch\r
;0021A90h\r
;0021A94h\r
;0021A98h\r
;0021A9Ch\r
;0021AA0h\r
;0021AA4h\r
;0021AA8h\r
;0021AACh\r
;0021AB0h\r
_DrawStatusBarInfo	equ 0021AB4h\r
_RestoreLCDbrightness	equ 0021AB8h\r
_RestoreLCDbrightness2	equ 0021ABCh\r
_DimLCDSlow		equ 0021AC0h\r
;0021AC4h\r
;0021AC8h\r
;0021ACCh\r
;0021AD0h\r
;0021AD4h\r
;0021AD8h\r
;0021ADCh\r
_SetTextFGBGcolors_Duplicate	equ 0021AE0h\r
_SetTextFGBGcolors	equ 0021AE4h\r
_SetTextBGcolor		equ 0021AE8h\r
_VPutPS			equ 0021AECh\r
;0021AF0h\r
;0021AF4h\r
;0021AF8h\r
;0021AFCh\r
;0021B00h\r
_DrawThickRectBorder	equ 0021B04h\r
;0021B08h\r
;0021B0Ch\r
;0021B10h\r
;0021B14h\r
;0021B18h\r
;0021B1Ch\r
_VPutPSN		equ 0021B20h\r
;0021B24h\r
;0021B28h\r
;0021B2Ch\r
;0021B30h\r
;0021B34h\r
;0021B38h\r
;0021B3Ch\r
;0021B40h\r
;0021B44h\r
;0021B48h\r
;0021B4Ch\r
;0021B50h\r
;0021B54h\r
;0021B58h\r
;0021B5Ch\r
;0021B60h\r
;0021B64h\r
;0021B68h\r
;0021B6Ch\r
;0021B70h\r
;0021B74h\r
;0021B78h\r
;0021B7Ch\r
;0021B80h\r
;0021B84h\r
;0021B88h\r
;0021B8Ch\r
;0021B90h\r
;0021B94h\r
;0021B98h\r
;0021B9Ch\r
;0021BA0h\r
;0021BA4h\r
;0021BA8h\r
_GetColorValue		equ 0021BACh\r
;0021BB0h\r
;0021BB4h\r
;0021BB8h\r
;0021BBCh\r
;0021BC0h\r
;0021BC4h\r
;0021BC8h\r
;0021BCCh\r
;0021BD0h\r
;0021BD4h\r
;0021BD8h\r
;0021BDCh\r
_DrawRectBorder_Dup		equ 0021BE0h\r
;0021BE4h\r
;0021BE8h\r
;0021BECh\r
;0021BF0h\r
;0021BF4h\r
;0021BF8h\r
;0021BFCh\r
;0021C00h\r
;0021C04h\r
;0021C08h\r
;0021C0Ch\r
;0021C10h\r
;0021C14h\r
;0021C18h\r
;0021C1Ch\r
;0021C20h\r
;0021C24h\r
;0021C28h\r
;0021C2Ch\r
;0021C30h\r
;0021C34h\r
;0021C38h\r
;0021C3Ch\r
;0021C40h\r
;0021C44h\r
;0021C48h\r
;0021C4Ch\r
;0021C50h\r
;0021C54h\r
;0021C58h\r
;0021C5Ch\r
;0021C60h\r
;0021C64h\r
;0021C68h\r
_Bit_grfFuncM		equ 0021C6Ch\r
;0021C70h\r
;0021C74h\r
;0021C78h\r
_PopErrorHandler_Dup	equ 0021C7Ch\r
;0021C80h\r
;0021C84h\r
;0021C88h\r
;0021C8Ch\r
;0021C90h\r
;0021C94h\r
;0021C98h\r
;0021C9Ch\r
;0021CA0h\r
;0021CA4h\r
;0021CA8h\r
;0021CACh\r
;0021CB0h\r
;0021CB4h\r
;0021CB8h\r
;0021CBCh\r
;0021CC0h\r
;0021CC4h\r
;0021CC8h\r
;0021CCCh\r
;0021CD0h\r
;0021CD4h\r
;0021CD8h\r
;0021CDCh\r
;0021CE0h\r
;0021CE4h\r
;0021CE8h\r
;0021CECh\r
;0021CF0h\r
;0021CF4h\r
;0021CF8h\r
;0021CFCh\r
;0021D00h\r
;0021D04h\r
;0021D08h\r
;0021D0Ch\r
;0021D10h\r
;0021D14h\r
;0021D18h\r
;0021D1Ch\r
;0021D20h\r
;0021D24h\r
;0021D28h\r
;0021D2Ch\r
;0021D30h\r
;0021D34h\r
;0021D38h\r
_GetCSC_HL		equ 0021D3Ch\r
;0021D40h\r
;0021D44h\r
_ChkBCIs0		equ 0021D48h\r
_ChkDEIs0		equ 0021D4Ch\r
_ChkHLIs0		equ 0021D50h\r
_SetAToBCU		equ 0021D54h\r
_SetAToDEU		equ 0021D58h\r
_SetAToHLU		equ 0021D5Ch\r
_SetBCUToA		equ 0021D60h\r
_SetBCUToB		equ 0021D64h\r
_SetDEUToA		equ 0021D68h\r
_SetDEUToB		equ 0021D6Ch\r
_SetHLUToA		equ 0021D70h\r
_SetHLUToB		equ 0021D74h\r
_SignExtendBC		equ 0021D78h\r
_SignExtendDE		equ 0021D7Ch\r
_SignExtendHL		equ 0021D80h\r
_SetBCUTo0		equ 0021D84h\r
_SetDEUTo0		equ 0021D88h\r
_SetHLUTo0		equ 0021D8Ch\r
_DivHLByA		equ 0021D90h\r
_CpHLDE_s		equ 0021D94h\r
_CpHLDE_Duplicate	equ 0021D98h\r
_LoadDEInd_s		equ 0021D9Ch\r
_LoadDEInd		equ 0021DA0h\r
_CpHLDEBC		equ 0021DA4h\r
_NegBC			equ 0021DA8h\r
_NegDE			equ 0021DACh\r
_StrCmpre		equ 0021DB0h\r
_AddHLAndA		equ 0021DB4h\r
;0021DB8h\r
;0021DBCh\r
_SwapEndianHL_s		equ 0021DC0h\r
;0021DC4h\r
;0021DC8h\r
;0021DCCh\r
;0021DD0h\r
;0021DD4h\r
;0021DD8h\r
;0021DDCh\r
;0021DE0h\r
;0021DE4h\r
;0021DE8h\r
;0021DECh\r
;0021DF0h\r
;0021DF4h\r
;0021DF8h\r
;0021DFCh\r
;0021E00h\r
;0021E04h\r
;0021E08h\r
;0021E0Ch\r
;0021E10h\r
;0021E14h\r
;0021E18h\r
;0021E1Ch\r
_SetDrawBGColor		equ 0021E20h\r
_SetDrawFGColor		equ 0021E24h\r
;0021E28h\r
;0021E2Ch\r
;0021E30h\r
;0021E34h\r
;0021E38h\r
;0021E3Ch\r
;0021E40h\r
;0021E44h\r
;0021E48h\r
;0021E4Ch\r
;0021E50h\r
;0021E54h\r
;0021E58h\r
;0021E5Ch\r
;0021E60h\r
;0021E64h\r
;0021E68h\r
;0021E6Ch\r
;0021E70h\r
;0021E74h\r
;0021E78h\r
;0021E7Ch\r
;0021E80h\r
;0021E84h\r
;0021E88h\r
;0021E8Ch\r
;0021E90h\r
;0021E94h\r
;0021E98h\r
;0021E9Ch\r
;0021EA0h\r
;0021EA4h\r
;0021EA8h\r
;0021EACh\r
;0021EB0h\r
;0021EB4h\r
;0021EB8h\r
;0021EBCh\r
;0021EC0h\r
;0021EC4h\r
;0021EC8h\r
;0021ECCh\r
;0021ED0h\r
;0021ED4h\r
;0021ED8h\r
;0021EDCh\r
_DispHL			equ 0021EE0h\r
;0021EE4h\r
_GetDrawFGColor		equ 0021EE8h\r
;0021EECh\r
;0021EF0h\r
;0021EF4h\r
;0021EF8h\r
;0021EFCh\r
;0021F00h\r
;0021F04h\r
;0021F08h\r
;0021F0Ch\r
;0021F10h\r
;0021F14h\r
;0021F18h\r
;0021F1Ch\r
;0021F20h\r
;0021F24h\r
;0021F28h\r
;0021F2Ch\r
;0021F30h\r
;0021F34h\r
;0021F38h\r
;0021F3Ch\r
;0021F40h\r
_VPutmapNoReset0IY23	equ 0021F44h\r
;0021F48h\r
;0021F4Ch\r
;0021F50h\r
;0021F54h\r
;0021F58h\r
;0021F5Ch\r
;0021F60h\r
;0021F64h\r
;0021F68h\r
;0021F6Ch\r
;0021F70h\r
;0021F74h\r
;0021F78h\r
;0021F7Ch\r
;0021F80h\r
;0021F84h\r
;0021F88h\r
;0021F8Ch\r
;0021F90h\r
;0021F94h\r
_ChkInRam		equ 0021F98h\r
;0021F9Ch\r
;0021FA0h\r
;0021FA4h\r
;0021FA8h\r
;0021FACh\r
_GetSymTablePtr		equ 0021FB0h\r
;0021FB4h\r
;0021FB8h\r
;0021FBCh\r
;0021FC0h\r
;0021FC4h\r
;0021FC8h\r
;0021FCCh\r
;0021FD0h\r
;0021FD4h\r
;0021FD8h\r
;0021FDCh\r
;0021FE0h\r
;0021FE4h\r
;0021FE8h\r
;0021FECh\r
;0021FF0h\r
;0021FF4h\r
;0021FF8h\r
;0021FFCh\r
;0022000h\r
;0022004h\r
;0022008h\r
;002200Ch\r
;0022010h\r
;0022014h\r
;0022018h\r
;002201Ch\r
;0022020h\r
;0022024h\r
;0022028h\r
;002202Ch\r
;0022030h\r
;0022034h\r
;0022038h\r
;002203Ch\r
;0022040h\r
;0022044h\r
_ChkInRamB		equ 0022048h\r
;002204Ch\r
;0022050h\r
;0022054h\r
;0022058h\r
;002205Ch\r
;0022060h\r
;0022064h\r
;0022068h\r
;002206Ch\r
;0022070h\r
_Mov11ToOP1		equ 0022074h\r
;0022078h\r
;002207Ch\r
;0022080h\r
;0022084h\r
;0022088h\r
;002208Ch\r
;0022090h\r
;0022094h\r
_RunLocalizeHook	equ 0022098h\r
;002209Ch\r
;00220A0h\r
;00220A4h\r
_NMIHandler		equ 00220A8h\r
;00220ACh\r
;00220B0h\r
;00220B4h\r
;00220B8h\r
;00220BCh\r
;00220C0h\r
;00220C4h\r
;00220C8h\r
;00220CCh\r
;00220D0h\r
;00220D4h\r
;00220D8h\r
;00220DCh\r
;00220E0h\r
;00220E4h\r
;00220E8h\r
;00220ECh\r
;00220F0h\r
;00220F4h\r
;00220F8h\r
;00220FCh\r
;0022100h\r
;0022104h\r
;0022108h\r
;002210Ch\r
;0022110h\r
;0022114h\r
;0022118h\r
;002211Ch\r
;0022120h\r
;0022124h\r
;0022128h\r
;002212Ch\r
;0022130h\r
;0022134h\r
;0022138h\r
;002213Ch\r
;0022140h\r
;0022144h\r
;0022148h\r
;002214Ch\r
;0022150h\r
;0022154h\r
;0022158h\r
;002215Ch\r
;0022160h\r
_RToP_Dup		equ 0022164h\r
_PToR_Dup		equ 0022168h\r
;002216Ch\r
;0022170h\r
;0022174h\r
;0022178h\r
;002217Ch\r
;0022180h\r
;0022184h\r
;0022188h\r
;002218Ch\r
;0022190h\r
;0022194h\r
;0022198h\r
;002219Ch\r
;00221A0h\r
;00221A4h\r
;00221A8h\r
;00221ACh\r
;00221B0h\r
;00221B4h\r
\r
;RAM Equates\r
;--------------------------------\r
flags			equ 0D00080h		; Location of OS Flags (+-80h)\r
textFlagsLoc		equ 0D00085h\r
apdFlagsLoc		equ 0D00088h		; Location of APD Flags\r
\r
appData			equ 0D00429h		; Used for OFFSCRPT and ONSCRPT\r
;D0053F	3 byte scrap\r
kbdScanCode		equ 0D00587h		; Scancode returned by GetCSC\r
kbdLGSC			equ 0D00588h\r
kbdPSC			equ 0D00589h\r
kbdWUR			equ 0D0058Ah\r
kbdDebncCnt		equ 0D0058Bh\r
kbdKey			equ 0D0058Ch\r
kbdGetKy		equ 0D0058Dh\r
keyExtend		equ 0D0058Eh\r
brightness		equ 0D0058Fh\r
apdSubTimer		equ 0D00590h\r
apdTimer		equ 0D00591h\r
curTime			equ 0D00594h\r
curRow			equ 0D00595h\r
curCol			equ 0D00596h\r
\r
curUnder		equ 0D00599h\r
curY			equ 0D0059Ch\r
curType			equ 0D0059Fh\r
curXRow			equ 0D005A0h\r
\r
lFont_record		equ 0D005A4h\r
sFont_record		equ 0D005C5h\r
tokVarPtr		equ 0D005E9h\r
;D005F5\r
;D005F6\r
OP1			equ 0D005F8h\r
OP1M			equ 0D005FAh\r
OP2			equ 0D00603h\r
OP2M			equ 0D00605h\r
OP2EXT			equ 0D0060Ch\r
OP3			equ 0D0060Eh\r
OP3M			equ 0D00610h\r
OP4			equ 0D00619h\r
OP4M			equ 0D0061Bh\r
OP5			equ 0D00624h\r
OP5M			equ 0D00626h\r
OP6			equ 0D0062Fh\r
OP6M			equ 0D00631h\r
OP6EXT			equ 0D00638h\r
\r
iMathPtr1		equ 0D0066Fh\r
iMathPtr2		equ 0D00672h\r
iMathPtr3		equ 0D00675h\r
iMathPtr4		equ 0D00678h\r
iMathPtr5		equ 0D0067Bh\r
asm_data_ptr1		equ 0D0067Eh\r
asm_data_ptr2		equ 0D00681h\r
\r
onSP			equ 0D007FAh\r
promptRow		equ 0D00800h\r
promptCol		equ 0D00802h\r
promptIns		equ 0D00803h\r
promptShift		equ 0D00804h\r
\r
textShadow		equ 0D006C0h\r
textShadCur		equ 0D007C4h\r
textShadTop		equ 0D007C7h\r
textShadAlph		equ 0D007C8h\r
textShadIns		equ 0D007C9h\r
cxMain			equ 0D007CAh\r
cxPPutAway		equ 0D007CDh\r
cxPutAway		equ 0D007D0h\r
cxErrorEP		equ 0D007D6h\r
cxSizeWind		equ 0D007D9h\r
\r
penCol			equ 0D008D2h\r
penRow			equ 0D008D5h\r
rclQueue		equ 0D008D6h\r
rclQueueEnd		equ 0D008D9h\r
\r
errNo			equ 0D008DFh\r
errSP			equ 0D008E0h\r
errOffset		equ 0D008E3h\r
\r
statVarsOffset		equ 0D0117Fh\r
asm_prgm_size		equ 0D0118Ch\r
bstCounter		equ 0D0118Fh\r
statVars		equ 0D01191h\r
\r
uXmin			equ 0D01D61h\r
uXmax			equ 0D01D6Ah\r
uXscl			equ 0D01D73h\r
uYmin			equ 0D01D7Ch\r
uYmax			equ 0D01D85h\r
uYscl			equ 0D01D8Eh\r
uThetMin		equ 0D01D97h\r
uThetMax		equ 0D01DA0h\r
uThetStep		equ 0D01DA9h\r
uTmin			equ 0D01DB2h\r
uTmax			equ 0D01DBBh\r
uTStep			equ 0D01DC4h\r
uPlotStart		equ 0D01DCDh\r
unMax			equ 0D01DD6h\r
uu0			equ 0D01DDFh\r
uv0			equ 0D01DE8h\r
unMin			equ 0D01DF1h\r
uu02			equ 0D01DFAh\r
uv02			equ 0D01E03h\r
uw0			equ 0D01E0Ch\r
uPlotStep		equ 0D01E15h\r
uXres			equ 0D01E1Eh\r
uw02			equ 0D01E27h\r
Xmin			equ 0D01E33h\r
Xmax			equ 0D01E3Ch\r
Xscl			equ 0D01E45h\r
Ymin			equ 0D01E4Eh\r
Ymax			equ 0D01E57h\r
Yscl			equ 0D01E60h\r
ThetaMin		equ 0D01E69h\r
ThetaMax		equ 0D01E72h\r
ThetaStep		equ 0D01E7Bh\r
TminPar			equ 0D01E84h\r
TmaxPar			equ 0D01E8Dh\r
Tstep			equ 0D01E96h\r
PlotStart		equ 0D01E9Fh\r
nMax			equ 0D01EA8h\r
u0			equ 0D01EB1h\r
v0			equ 0D01EBAh\r
nMin			equ 0D01EC3h\r
u02			equ 0D01ECCh\r
v02			equ 0D01ED5h\r
w0			equ 0D01EDEh\r
PlotStep		equ 0D01EE7h\r
XresO			equ 0D01EF0h\r
w02			equ 0D01EF9h\r
un1			equ 0D01F02h\r
un2			equ 0D01F0Bh\r
vn1			equ 0D01F14h\r
vn2			equ 0D01F1Dh\r
wn1			equ 0D01F26h\r
wn2			equ 0D01F2Fh\r
fin_N			equ 0D01F38h\r
fin_I			equ 0D01F41h\r
fin_PV			equ 0D01F4Ah\r
fin_PMT			equ 0D01F53h\r
fin_FV			equ 0D01F5Ch\r
fin_PY			equ 0D01F65h\r
fin_CY			equ 0D01F6Eh\r
cal_N			equ 0D01F77h\r
cal_I			equ 0D01F80h\r
cal_PV			equ 0D01F89h\r
cal_PMT			equ 0D01F92h\r
cal_FV			equ 0D01F9Bh\r
cal_PY			equ 0D01FA4h\r
\r
ES			equ 0D022BAh\r
\r
seed1			equ 0D022FCh\r
seed2			equ 0D02305h\r
basic_prog		equ 0D0230Eh\r
begPC			equ 0D02317h\r
curPC			equ 0D0231Ah\r
endPC			equ 0D0231Dh\r
\r
cmdShadow		equ 0D0232Dh\r
cmdShadCur		equ 0D02431h\r
cmdShadAlph		equ 0D02433h\r
cmdShadIns		equ 0D02435h\r
cmdCursor		equ 0D02434h\r
\r
editTop			equ 0D02437h\r
editCursor		equ 0D0243Ah\r
editTail		equ 0D0243Dh\r
editBtm			equ 0D02440h\r
\r
listName1		equ 0D02459h\r
listName2		equ 0D0245Eh\r
listName3		equ 0D02463h\r
listName4		equ 0D02468h\r
listName5		equ 0D0246Dh\r
listName6		equ 0D02472h\r
listName7		equ 0D02477h\r
listName8		equ 0D0247Ch\r
listName9		equ 0D02481h\r
listName10		equ 0D02486h\r
listName11		equ 0D0248Bh\r
listName12		equ 0D02490h\r
listName13		equ 0D02495h\r
listName14		equ 0D0249Ah\r
listName15		equ 0D0249Fh\r
listName16		equ 0D024A4h\r
listName17		equ 0D024A9h\r
listName18		equ 0D024AEh\r
listName19		equ 0D024B3h\r
listName20		equ 0D024B8h\r
currGrphStyle		equ 0D024BEh\r
y1LineType		equ 0D024BFh\r
y2LineType		equ 0D024C0h\r
y3LineType		equ 0D024C1h\r
y4LineType		equ 0D024C2h\r
y5LineType		equ 0D024C3h\r
y6LineType		equ 0D024C4h\r
y7LineType		equ 0D024C5h\r
y8LineType		equ 0D024C6h\r
y9LineType		equ 0D024C7h\r
y0LineType		equ 0D024C8h\r
para1LineType		equ 0D024C9h\r
para2LineType		equ 0D024CAh\r
para3LineType		equ 0D024CBh\r
para4LineType		equ 0D024CCh\r
para5LineType		equ 0D024CDh\r
para6LineType		equ 0D024CEh\r
polar1LineType		equ 0D024CFh\r
polar2LineType		equ 0D024D0h\r
polar3LineType		equ 0D024D1h\r
polar4LineType		equ 0D024D2h\r
polar5LineType		equ 0D024D3h\r
polar6LineType		equ 0D024D4h\r
secULineType		equ 0D024D5h\r
secVLineType		equ 0D024D6h\r
secWLineType		equ 0D024D7h\r
y1LineColor		equ 0D024D8h\r
y2LineColor		equ 0D024D9h\r
y3LineColor		equ 0D024DAh\r
y4LineColor		equ 0D024DBh\r
y5LineColor		equ 0D024DCh\r
y6LineColor		equ 0D024DDh\r
y7LineColor		equ 0D024DEh\r
y8LineColor		equ 0D024DFh\r
y9LineColor		equ 0D024E0h\r
y0LineColor		equ 0D024E1h\r
para1LineColor		equ 0D024E2h\r
para2LineColor		equ 0D024E3h\r
para3LineColor		equ 0D024E4h\r
para4LineColor		equ 0D024E5h\r
para5LineColor		equ 0D024E6h\r
para6LineColor		equ 0D024E7h\r
polar1LineColor		equ 0D024E8h\r
polar2LineColor		equ 0D024E9h\r
polar3LineColor		equ 0D024EAh\r
polar4LineColor		equ 0D024EBh\r
polar5LineColor		equ 0D024ECh\r
polar6LineColor		equ 0D024EDh\r
secULineColor		equ 0D024EEh\r
secVLineColor		equ 0D024EFh\r
secWLineColor		equ 0D024F0h\r
\r
winTop			equ 0D02504h\r
winBtm			equ 0D02505h\r
winLeftEdge		equ 0D02506h\r
winLeft			equ 0D02507h\r
winAbove		equ 0D02509h\r
winRow			equ 0D0250Bh\r
winCol			equ 0D0250Dh\r
fmtDigits		equ 0D0250Fh\r
fmtString		equ 0D02510h\r
\r
fmtLeft			equ 0D02561h\r
fmtIndex		equ 0D02564h\r
fmtMatSym		equ 0D02567h\r
fmtMatMem		equ 0D0256Ah\r
EQS			equ 0D0256Dh\r
\r
tSymPtr1		equ 0D0257Bh\r
tSymPtr2		equ 0D0257Eh\r
chkDelPtr3		equ 0D02581h\r
chkDelPtr4		equ 0D02584h\r
tempMem			equ 0D02587h\r
FPSbase			equ 0D0258Ah\r
FPS			equ 0D0258Dh\r
OPBase			equ 0D02590h\r
OPS			equ 0D02593h\r
pTempCnt		equ 0D02596h\r
cleanTmp		equ 0D02598h\r
pTemp			equ 0D0259Ah\r
progPtr			equ 0D0259Dh\r
newDataPtr		equ 0D025A0h \r
pagedGetPtr		equ 0D025A3h	; 2 byte scrap (unstable)\r
\r
cursorHookPtr		equ 0D025D5h\r
libraryHookPtr		equ 0D025D8h\r
rawKeyHookPtr		equ 0D025DBh\r
getKeyHookPtr		equ 0D025DEh\r
homescreenHookPtr	equ 0D025E1h\r
windowHookPtr		equ 0D025E4h\r
graphHookPtr		equ 0D025E7h\r
yEqualsHookPtr		equ 0D025EAh\r
fontHookPtr		equ 0D025EDh\r
regraphHookPtr		equ 0D025F0h\r
graphicsHookPtr		equ 0D025F3h\r
traceHookPtr		equ 0D025E6h\r
parserHookPtr		equ 0D025F9h\r
appChangeHookPtr	equ 0D025FCh\r
catalog1HookPtr		equ 0D025FFh\r
helpHookPtr		equ 0D02602h\r
cxRedispHookPtr		equ 0D02605h\r
menuHookPtr		equ 0D02608h\r
catalog2HookPtr		equ 0D0260Bh\r
tokenHookPtr		equ 0D0260Eh\r
localizeHookPtr		equ 0D02611h\r
silentLinkHookPtr	equ 0D02614h\r
USBActivityHookPtr	equ 0D02617h\r
\r
textBGcolor		equ 0D02688h\r
textFGcolor		equ 0D0268Ah\r
\r
drawBGColor		equ 0D026AAh\r
drawFGColor		equ 0D026ACh\r
drawColorCode		equ 0D026AEh\r
\r
keyToStrRam		equ 0D026EAh\r
\r
statusBarBGColor	equ 0D02ACCh\r
fillRectColor		equ 0D02AC0h\r
;D02A28\r
scrapMem		equ 0D02AD7h	; 3 byte scrap (unstable)\r
\r
;safeRAM Locations\r
;---------------------------------------------\r
;appData		equ 0D00429h ; 256 bytes\r
pixelShadow		equ 0D031F6h ; 8400 bytes\r
pixelShadow2		equ 0D052C6h ; 8400 bytes\r
cmdPixelShadow		equ 0D07396h ; 8400 bytes\r
plotSScreen		equ 0D09466h ; 21945 bytes	; Set GraphDraw Flag to redraw graph if used\r
saveSScreen		equ 0D0EA1Fh ; 21945 bytes	; Set GraphDraw Flag to redraw graph if used\r
;textShadow		equ 0D006C0h ; 260 bytes	; Call _ClrTxtShdw to put spaces in here\r
;cmdShadow		equ 0D0232Dh ; 260 bytes\r
cursorImage		equ 0E30800h ; 1020 bytes\r
\r
;RAM Equates Continued\r
;---------------------------------------------\r
userMem			equ 0D1A881h\r
symTable		equ 0D3FFFFh\r
vRam			equ 0D40000h\r
vRamEnd			equ 0D65800h\r
\r
; BOOTCode Calls Cont.\r
;---------------------------------------------\r
_DETimesA		equ 0000348h			; HL = DE*A\r
_HLDivE			equ 000034Ch			; DE = HL/E\r
_HLDivDE		equ 0000350h			; DE = HL/DE\r
_DrawBootCodeVer	equ 0000394h			; Draws "BOOTCODE 5.0.0.0089" on top row\r
\r
;Ports\r
;--------------------------------\r
pCpuSpeed		equ 0001h\r
pHardwareId		equ 0003h\r
pUsbRange		equ 3000h\r
\r
;LCD Ports\r
;--------------------------------\r
pLcdCtrlRange		equ 4000h\r
mpLcdCtrlRange		equ 0E30000h\r
pLcdBase		equ 4010h\r
mpLcdBase		equ 0E30010h\r
\r
pLcdCtrl		equ 4018h\r
mpLcdCtrl		equ 0E30018h\r
\r
lcdEn			equ 01h\r
lcdTft			equ 20h\r
lcdBpp1			equ 0000b | lcdTft | lcdEn\r
lcdBpp2			equ 0010b | lcdTft | lcdEn\r
lcdBpp4			equ 0100b | lcdTft | lcdEn\r
lcdBpp8			equ 0110b | lcdTft | lcdEn\r
lcdBpp16Alt		equ 1000b | lcdTft | lcdEn\r
lcdBpp24		equ 1010b | lcdTft | lcdEn\r
lcdBpp16		equ 1100b | lcdTft | lcdEn ; Default LCD mode\r
lcdBpp12		equ 1110b | lcdTft | lcdEn\r
lcdBgr			equ 100h\r
lcdBigEndian		equ 200h\r
lcdBigEndianPixels	equ 400h\r
lcdPwr			equ 800h\r
lcdIntVSync		equ 00h\r
lcdIntBack		equ 1000h\r
lcdIntActiveVideo	equ 2000h\r
lcdIntFront		equ 4000h\r
lcdWatermark		equ 10000h\r
lcdNormalMode		equ lcdPwr | lcdBgr | lcdBpp16\r
\r
pLcdPalette		equ 4200h\r
mpLcdPalette		equ 0E30200h\r
pLcdCursorImg		equ 4800h\r
mpLcdCursorImg		equ 0E30800h\r
pLcdCrsrCtrl		equ 4C00h\r
mpLcdCrsrCtrl		equ 0E30C00h\r
pLcdCrsrConfig		equ 4C04h\r
mpLcdCrsrConfig		equ 0E30C04h\r
pLcdCrsrPal0		equ 4C08h\r
mpLcdCrsrPal0		equ 0E30C08h\r
pLcdCrsrPal1		equ 4C0Ch\r
mpLcdCrsrPal1		equ 0E30C0Ch\r
pLcdCrsrXy		equ 4C10h\r
mpLcdCrsrXy		equ 0E30C10h\r
pLcdCrsrClip		equ 4C14h\r
mpLcdCrsrClip		equ 0E30C14h\r
\r
;RTC Ports\r
;-----------------------------------\r
pRtcRange		equ 8000h\r
mpRtcRange		equ 0F30000h\r
\r
;Backlight Ports\r
;-----------------------------------\r
pBlLevel		equ 0B024h\r
mpBlLevel		equ 0F60024h\r
\r
; Boot Calls\r
;-----------------------------------\r
__getBootVerMajor	equ 0000080h\r
__getHardwareVersion	equ 0000084h\r
__getKeyID		equ 0000088h\r
__getBootVerMinor	equ 000008Ch\r
__getBootVerBuild	equ 0000090h\r
			   ;0000094h ;outputs A to 0FFFEh and locks up, only on certain hardware revision?\r
__longjmp		equ 0000098h\r
__memchr		equ 000009Ch\r
__memcmp		equ 00000A0h\r
__memcpy		equ 00000A4h\r
__memmove		equ 00000A8h\r
__memset		equ 00000ACh\r
__memclear		equ 00000B0h\r
__setjmp		equ 00000B8h\r
__sprintf		equ 00000BCh\r
__strcat		equ 00000C0h\r
__strchr		equ 00000C4h\r
__strcmp		equ 00000C8h\r
__strcpy		equ 00000CCh\r
__strcspn		equ 00000D0h\r
__strlen		equ 00000D4h\r
__strncat		equ 00000D8h\r
__strncmp		equ 00000DCh\r
__strncpy		equ 00000E0h\r
__strpbrk		equ 00000E4h\r
__strrchr		equ 00000E8h\r
__strspn		equ 00000ECh\r
__strstr		equ 00000F0h\r
__strtok		equ 00000F4h; Uses static 24-bit variable at 0D0FFFFh\r
__DoNothing		equ 00000F8h\r
__case			equ 0000110h\r
__case16		equ 0000114h\r
__case16D		equ 0000118h\r
__case24		equ 000011Ch\r
__case24D		equ 0000120h\r
__case8			equ 0000124h\r
__case8D		equ 0000128h\r
__frameset0		equ 0000130h\r
__frameset		equ 000012Ch\r
__iand			equ 0000134h\r
__icmpzero		equ 0000138h\r
__idivs			equ 000013Ch\r
__idivu			equ 0000140h\r
__idvrmu		equ 0000144h\r
__ildix			equ 0000148h\r
__ildiy			equ 000014Ch\r
__imul_b		equ 0000150h\r
__imuls			equ 0000154h\r
__imulu			equ 0000158h\r
__indcall		equ 000015Ch\r
__ineg			equ 0000160h\r
__sneg			equ 000022Ch\r
__inot			equ 0000164h\r
__snot			equ 0000230h\r
__ior			equ 0000168h\r
__irems			equ 000016Ch\r
__iremu			equ 0000170h\r
__ishl_b		equ 0000178h\r
__ishl			equ 0000174h\r
__ishrs_b		equ 0000180h\r
__ishrs			equ 000017Ch\r
__ishru_b		equ 0000188h\r
__ishru			equ 0000184h\r
__istix			equ 000018Ch\r
__istiy			equ 0000190h\r
__itol			equ 0000194h\r
__ixor			equ 0000198h\r
__ladd_b		equ 00001A0h\r
__ladd			equ 000019Ch\r
__land			equ 00001A4h\r
__lcmps			equ 00001A8h\r
__lcmpu			equ 00001ACh\r
__lcmpzero		equ 00001B0h\r
__ldivs			equ 00001B4h\r
__ldivu			equ 00001B8h\r
__ldvrmu		equ 00001BCh\r
__lldix			equ 00001C0h\r
__lldiy			equ 00001C4h\r
__lmuls			equ 00001C8h\r
__lmulu			equ 00001CCh\r
__lneg			equ 00001D0h\r
__lnot			equ 00001D4h\r
__lor			equ 00001D8h\r
__lrems			equ 00001DCh\r
__lremu			equ 00001E0h\r
__lshl			equ 00001E4h\r
__lshrs			equ 00001E8h\r
__lshru			equ 00001ECh\r
__bshru			equ 0000104h\r
__bshl			equ 0000100h\r
__bldiy			equ 00000FCh\r
__bstiy			equ 0000108h\r
__bstix			equ 000010Ch\r
__lstix			equ 00001F0h\r
__lstiy			equ 00001F4h\r
__lsub			equ 00001F8h\r
__lxor			equ 00001FCh\r
__sand			equ 0000200h\r
__scmp0			equ 0000204h\r
__sdivs			equ 0000208h\r
__sdivu			equ 000020Ch\r
__seqcase		equ 0000210h\r
__seqcaseD		equ 0000214h\r
__setflag		equ 0000218h\r
__sldix			equ 000021Ch\r
__sldiy			equ 0000220h\r
__smuls			equ 0000224h\r
__smulu			equ 0000228h\r
__sor			equ 0000234h\r
__srems			equ 0000238h\r
__sremu			equ 000023Ch\r
__sshl_b		equ 0000244h\r
__sshl			equ 0000240h\r
__sshrs_b		equ 000024Ch\r
__sshrs			equ 0000248h\r
__sshru_b		equ 0000254h\r
__sshru			equ 0000250h\r
__sstix			equ 0000258h\r
__sstiy			equ 000025Ch\r
__stoi			equ 0000260h\r
__stoiu			equ 0000264h\r
__sxor			equ 0000268h\r
			   ;00002D0h   ;checks something about field 80C0h in the OS header (value 0101h)\r
__WriteAByte		equ 00002D4h\r
__EraseFlash		equ 00002D8h\r
__EraseFlashPage	equ 00002DCh\r
__WriteFlash		equ 00002E0h\r
__WriteAByte2		equ 00002E4h	;no difference from 00002D4h\r
__WriteAByteA		equ 00002E8h	;byte is in A, not B\r
			   ;00002ECh   ;lots of writes/erases involving sectors 3Bh/3Fh\r
			   ;00002F0h   ;zeroes out 4KB at 0D1887Ch and writes 0D18C7Ch to start of it\r
__WriteFlashUnsafe	equ 0000334h\r
__DispStr		equ 0000378h\r
__NewLine_Boot		equ 0000390h\r
\r
__fppack		equ 000026Ch\r
__FLT_MAX		equ 0000294h	; Not A Routine\r
__fadd			equ 0000270h\r
__fcmp			equ 0000274h\r
__fdiv			equ 0000278h\r
__ftol			equ 000027Ch\r
__ltof			equ 0000284h\r
__fmul			equ 0000288h\r
__fneg			equ 000028Ch\r
__fsub			equ 0000290h\r
__ultof			equ 0000280h\r
__fsqrt			equ 0000298h\r
__frbtof		equ 000029Ch\r
__frftob		equ 00002A0h\r
__frftoi		equ 00002A8h\r
__frftos		equ 00002B0h\r
__frftoub		equ 00002A4h\r
__frftoui		equ 00002ACh\r
__frftous		equ 00002B4h\r
__fritof		equ 00002B8h\r
__frstof		equ 00002C0h\r
__frubtof		equ 00002C4h\r
__fruitof		equ 00002BCh\r
__frustof		equ 00002C8h\r
\r
;Character Font Equates  \r
;-------------------------------------\r
LrecurN			equ 001h\r
LrecurU			equ 002h\r
LrecurV			equ 003h\r
LrecurW			equ 004h\r
Lconvert		equ 005h\r
LsqUp			equ 006h\r
LsqDown			equ 007h\r
Lintegral		equ 008h\r
Lcross			equ 009h\r
LboxIcon 		equ 00Ah\r
LcrossIcon 		equ 00Bh\r
LdotIcon 		equ 00Ch\r
LsubT   		equ 00Dh ;small capital T for parametric mode.\r
LcubeR  		equ 00Eh ;slightly different 3 for cubed root.\r
LhexF			equ 00Fh\r
Lroot			equ 010h\r
Linverse		equ 011h\r
Lsquare			equ 012h\r
Langle			equ 013h\r
Ldegree			equ 014h\r
Lradian			equ 015h\r
Ltranspose		equ 016h\r
LLE			equ 017h\r
LNE			equ 018h\r
LGE			equ 019h\r
Lneg			equ 01Ah\r
Lexponent		equ 01Bh\r
Lstore			equ 01Ch\r
Lten			equ 01Dh\r
LupArrow		equ 01Eh\r
LdownArrow		equ 01Fh\r
Lspace			equ 020h\r
Lexclam			equ 021h\r
Lquote			equ 022h\r
Lpound			equ 023h\r
Lfourth			equ 024h\r
Lpercent		equ 025h\r
Lampersand		equ 026h\r
Lapostrophe		equ 027h\r
LlParen			equ 028h\r
LrParen			equ 029h\r
Lasterisk		equ 02Ah\r
LplusSign		equ 02Bh\r
Lcomma			equ 02Ch\r
Ldash			equ 02Dh\r
Lperiod			equ 02Eh\r
Lslash			equ 02Fh\r
L0			equ 030h\r
L1			equ 031h\r
L2			equ 032h\r
L3			equ 033h\r
L4			equ 034h\r
L5			equ 035h\r
L6			equ 036h\r
L7			equ 037h\r
L8			equ 038h\r
L9			equ 039h\r
Lcolon			equ 03Ah\r
Lsemicolon		equ 03Bh\r
LLT			equ 03Ch\r
LEQ			equ 03Dh\r
LGT			equ 03Eh\r
Lquestion		equ 03Fh\r
LatSign			equ 040h\r
LcapA			equ 041h\r
LcapB			equ 042h\r
LcapC			equ 043h\r
LcapD			equ 044h\r
LcapE			equ 045h\r
LcapF			equ 046h\r
LcapG			equ 047h\r
LcapH			equ 048h\r
LcapI			equ 049h\r
LcapJ			equ 04Ah\r
LcapK			equ 04Bh\r
LcapL			equ 04Ch\r
LcapM			equ 04Dh\r
LcapN			equ 04Eh\r
LcapO			equ 04Fh\r
LcapP			equ 050h\r
LcapQ			equ 051h\r
LcapR			equ 052h\r
LcapS			equ 053h\r
LcapT			equ 054h\r
LcapU			equ 055h\r
LcapV			equ 056h\r
LcapW			equ 057h\r
LcapX			equ 058h\r
LcapY			equ 059h\r
LcapZ			equ 05Ah\r
Ltheta			equ 05Bh\r
Lbackslash		equ 05Ch\r
LrBrack			equ 05Dh\r
Lcaret			equ 05Eh\r
Lunderscore		equ 05Fh\r
Lbackquote		equ 060h\r
La			equ 061h\r
Lb			equ 062h\r
Lc			equ 063h\r
Ld			equ 064h\r
Le			equ 065h\r
Lf			equ 066h\r
Lg			equ 067h\r
Lh			equ 068h\r
Li			equ 069h\r
Lj			equ 06Ah\r
Lk			equ 06Bh\r
Ll			equ 06Ch\r
Lm			equ 06Dh\r
Ln			equ 06Eh\r
Lo			equ 06Fh\r
Lp			equ 070h\r
Lq			equ 071h\r
Lr			equ 072h\r
Ls			equ 073h\r
Lt			equ 074h\r
Lu			equ 075h\r
Lv			equ 076h\r
Lw			equ 077h\r
Lx			equ 078h\r
Ly			equ 079h\r
Lz			equ 07Ah\r
LlBrace			equ 07Bh\r
Lbar			equ 07Ch\r
LrBrace			equ 07Dh\r
Ltilde			equ 07Eh\r
LinvEQ			equ 07Fh\r
Lsub0			equ 080h\r
Lsub1			equ 081h\r
Lsub2			equ 082h\r
Lsub3			equ 083h\r
Lsub4			equ 084h\r
Lsub5			equ 085h\r
Lsub6			equ 086h\r
Lsub7			equ 087h\r
Lsub8			equ 088h\r
Lsub9			equ 089h\r
LcapAAcute		equ 08Ah\r
LcapAGrave		equ 08Bh\r
LcapACaret		equ 08Ch\r
LcapADier		equ 08Dh\r
LaAcute			equ 08Eh\r
LaGrave			equ 08Fh\r
LaCaret			equ 090h\r
LaDier			equ 091h\r
LcapEAcute		equ 092h\r
LcapEGrave		equ 093h\r
LcapECaret		equ 094h\r
LcapEDier		equ 095h\r
LeAcute			equ 096h\r
LeGrave			equ 097h\r
LeCaret			equ 098h\r
LeDier			equ 099h\r
LcapIAcute		equ 09Ah\r
LcapIGrave		equ 09Bh\r
LcapICaret		equ 09Ch\r
LcapIDier		equ 09Dh\r
LiAcute			equ 09Eh\r
LiGrave			equ 09Fh\r
LiCaret			equ 0A0h\r
LiDier			equ 0A1h\r
LcapOAcute		equ 0A2h\r
LcapOGrave		equ 0A3h\r
LcapOCaret		equ 0A4h\r
LcapODier		equ 0A5h\r
LoAcute			equ 0A6h\r
LoGrave			equ 0A7h\r
LoCaret			equ 0A8h\r
LoDier			equ 0A9h\r
LcapUAcute		equ 0AAh\r
LcapUGrave		equ 0ABh\r
LcapUCaret		equ 0ACh\r
LcapUDier		equ 0ADh\r
LuAcute			equ 0AEh\r
LuGrave			equ 0AFh\r
LuCaret			equ 0B0h\r
LuDier			equ 0B1h\r
LcapCCed		equ 0B2h\r
LcCed			equ 0B3h\r
LcapNTilde		equ 0B4h\r
LnTilde			equ 0B5h\r
Laccent			equ 0B6h\r
Lgrave			equ 0B7h\r
Ldieresis		equ 0B8h\r
LquesDown		equ 0B9h\r
LexclamDown		equ 0BAh\r
Lalpha			equ 0BBh\r
Lbeta			equ 0BCh\r
Lgamma			equ 0BDh\r
LcapDelta		equ 0BEh\r
Ldelta			equ 0BFh\r
Lepsilon		equ 0C0h\r
LlBrack 		equ 0C1h\r
Llambda			equ 0C2h\r
Lmu			equ 0C3h\r
Lpi			equ 0C4h\r
Lrho			equ 0C5h\r
LcapSigma		equ 0C6h\r
Lsigma			equ 0C7h\r
Ltau			equ 0C8h\r
Lphi			equ 0C9h\r
LcapOmega		equ 0CAh\r
LxMean			equ 0CBh\r
LyMean			equ 0CCh\r
LsupX			equ 0CDh\r
Lellipsis		equ 0CEh\r
Lleft			equ 0CFh\r
Lblock			equ 0D0h\r
Lper			equ 0D1h\r
Lhyphen			equ 0D2h\r
Larea			equ 0D3h\r
Ltemp			equ 0D4h\r
Lcube			equ 0D5h\r
Lenter			equ 0D6h\r
LimagI			equ 0D7h\r
Lphat			equ 0D8h\r
Lchi			equ 0D9h\r
LstatF			equ 0DAh\r
Llne			equ 0DBh\r
LlistL			equ 0DCh\r
LfinanN 		equ 0DDh\r
L2_r_paren 		equ 0DEh\r
LblockArrow		equ 0DFh\r
LcurO   		equ 0E0h\r
LcurO2  		equ 0E1h\r
LcurOcapA		equ 0E2h\r
LcurOa  		equ 0E3h\r
LcurI   		equ 0E4h\r
LcurI2  		equ 0E5h\r
LcurIcapA		equ 0E6h\r
LcurIa  		equ 0E7h\r
LGline			equ 0E8h ; = 0\r
LGthick			equ 0E9h ; = 1\r
LGabove			equ 0EAh ; = 2\r
LGbelow			equ 0EBh ; = 3\r
LGpath			equ 0ECh ; = 4\r
LGanimate		equ 0EDh ; = 5\r
LGdot			equ 0EEh ; = 6\r
LUpBlk			equ 0EFh ;Up arrow and Block in solver\r
LDnBlk			equ 0F0h ;Down arrow and Block in solver\r
LcurFull		equ 0F1h ;note: must be last char (PutMap checks)\r
\r
;(MenuCurrent) Values\r
;-----------------------------------\r
mConfirmation		equ 01h\r
mApps			equ 02h\r
mProgramHome		equ 03h\r
mPrgm_Run		equ 00h\r
mPrgm_Edit		equ 01h\r
mPrgm_New		equ 02h\r
mZoom			equ 04h\r
mZoom_Zoom		equ 00h\r
mZoom_Memory		equ 01h\r
mDraw			equ 05h\r
mDraw_Draw		equ 00h\r
mDraw_Points		equ 01h\r
mDraw_Store		equ 02h\r
mStatPlots		equ 06h\r
mStat			equ 07h\r
mStat_Edit		equ 00h\r
mStat_Calc		equ 01h\r
mStat_Tests		equ 02h\r
mMath			equ 08h\r
mMath_Math		equ 00h\r
mMath_Number		equ 01h\r
mMath_Complex		equ 02h\r
mMath_Prob		equ 03h\r
mTest			equ 09h\r
mTest_Test		equ 00h\r
mTest_Logic		equ 01h\r
mVars			equ 0Ah\r
mVars_Vars		equ 00h\r
mVars_YVars		equ 01h\r
mMemory			equ 0Ch\r
mMatrix			equ 0Dh\r
mMatrix_Name		equ 00h\r
mMatrix_Math		equ 01h\r
mMatrix_Edit		equ 02h\r
mDistr			equ 0Eh\r
mDistr_Distr		equ 00h\r
mDistr_Draw		equ 01h\r
mAngle			equ 0Fh\r
mList			equ 10h\r
mList_Names		equ 00h\r
mList_Ops		equ 01h\r
mList_Math		equ 02h\r
mCalculate		equ 11h\r
mVarsWin		equ 14h\r
mVarsWin_XY		equ 00h\r
mVarsWin_TTh		equ 01h\r
mVarsWin_UVW		equ 02h\r
mVarsZoom		equ 15h\r
mVarsZoom_ZXY		equ 00h\r
mVarsZoom_ZT		equ 01h\r
mVarsZoom_UVW		equ 02h\r
mVarsGDB		equ 16h\r
mVarsPics		equ 17h\r
mVarsStrings		equ 18h\r
mVarsStat		equ 19h\r
mVarsStat_XY		equ 00h\r
mVarsStat_Sigma		equ 01h\r
mVarsStat_EQ		equ 02h\r
mVarsStat_Test		equ 03h\r
mVarsStat_Pts		equ 04h\r
mVarsTable		equ 1Ah\r
mVarsYequ 		equ 1Bh\r
mVarsParametric		equ 1Ch\r
mVarsPolar		equ 1Dh\r
mVarsFnOnOff		equ 1Eh\r
mMemReset		equ 1Fh\r
mMemReset_RAM		equ 00h\r
mMemReset_ROM		equ 01h\r
mMemReset_All		equ 02h\r
mMemMgmtDel		equ 20h\r
mMemResetDefaults	equ 21h\r
mMemResetRAMAll		equ 23h\r
mMemResetROMVars	equ 24h\r
mMemResetROMApps	equ 25h\r
mMemResetROMAll		equ 26h\r
mMemResetAll		equ 27h\r
mGroup			equ 28h\r
mGroup_New		equ 00h\r
mGroup_Ungroup		equ 01h\r
mGroupVars		equ 29h\r
mProgramEdit		equ 2Ah\r
mPrgmEd_Ctrl		equ 00h\r
mPrgmEd_IO		equ 01h\r
mPrgmEd_Exec		equ 02h\r
mPrgmZoom		equ 2Bh\r
mPrgmZoom_Zoom		equ 00h\r
mPrgmZoom_Mem		equ 01h\r
mPrgmDraw		equ 2Ch\r
mPrgmDraw_Draw		equ 00h\r
mPrgmDraw_Pt		equ 01h\r
mPrgmDraw_Store		equ 02h\r
mPrgmStatPlot		equ 2Dh\r
mPrgmSP_Plots		equ 00h\r
mPrgmSP_Type		equ 01h\r
mPrgmSP_Mark		equ 02h\r
mPrgmStat		equ 2Eh\r
mPrgmStat_Edit		equ 00h\r
mPrgmStat_Calc		equ 01h\r
mPrgmStat_Tests		equ 02h\r
mPrgmMath		equ 2Fh\r
mPrgmMath_Math		equ 00h\r
mPrgmMath_Num		equ 01h\r
mPrgmMath_Cplx		equ 02h\r
mPrgmMath_Prob		equ 03h\r
mLink			equ 30h\r
mLink_Send		equ 00h\r
mLink_Recieve		equ 01h\r
mLinkTrasmit		equ 31h\r
mLinkXmit_Xmit		equ 01h\r
mGarbageCollect		equ 3Fh\r
mSelectGroupVars	equ 40h\r
mSelGrpVars_Sel		equ 00h\r
mSelGrpVars_Grp		equ 01h\r
mDuplicateName		equ 42h\r
mCatalog		equ 45h\r
mFinance		equ 22h\r
mFinance_Calc		equ 00h\r
mFinance_Vars		equ 01h\r
\r
;Keypress Equates\r
;-----------------------------------\r
kRight			equ 001h\r
kLeft			equ 002h\r
kUp			equ 003h\r
kDown			equ 004h\r
kEnter			equ 005h\r
kAlphaEnter		equ 006h\r
kAlphaUp		equ 007h\r
kAlphaDown		equ 008h\r
kClear			equ 009h\r
kDel			equ 00Ah\r
kIns			equ 00Bh\r
kRecall			equ 00Ch\r
kLastEnt		equ 00Dh\r
kBOL			equ 00Eh\r
kEOL			equ 00Fh\r
\r
kSelAll			equ 010h\r
kUnselAll		equ 011h\r
kLtoTI82		equ 012h\r
kBackup			equ 013h\r
kRecieve		equ 014h\r
kLnkQuit		equ 015h\r
kTrans			equ 016h\r
kRename			equ 017h\r
kOverw			equ 018h\r
kOmit			equ 019h\r
kCont			equ 01Ah\r
kSendID			equ 01Bh\r
kSendSW			equ 01Ch\r
kYes			equ 01Dh\r
kNoWay			equ 01Eh\r
kvSendType		equ 01Fh\r
kOverWAll		equ 020h\r
kNo			equ 025h\r
kKReset			equ 026h\r
kApp			equ 027h\r
kDoug			equ 028h\r
kListflag		equ 029h\r
menuStart		equ 02Bh\r
kAreYouSure		equ 02Bh\r
kAppsMenu		equ 02Ch\r
kPrgm			equ 02Dh\r
kZoom			equ 02Eh\r
kDraw			equ 02Fh\r
kSPlot			equ 030h\r
kStat			equ 031h\r
kMath			equ 032h\r
kTest			equ 033h\r
kChar			equ 034h\r
kVars			equ 035h\r
kMem			equ 036h\r
kMatrix			equ 037h\r
kDist			equ 038h\r
kAngle			equ 039h\r
kList			equ 03Ah\r
kCalc			equ 03Bh\r
kFin			equ 03Ch\r
menuEnd			equ kFin\r
kCatalog		equ 03Eh\r
kInputDone		equ 03Fh\r
kOff			equ kInputDone\r
kQuit			equ 040h\r
appStart		equ kQuit\r
kLinkIO			equ 041h\r
kMatrixEd		equ 042h\r
kStatEd			equ 043h\r
kGraph			equ 044h\r
kMode			equ 045h\r
kPrgmEd			equ 046h ;PROGRAM EDIT\r
kPrgmCr			equ 047h ;PROGRAM CREATE\r
kWindow			equ 048h ;RANGE EDITOR\r
kYequ 			equ 049h ;EQUATION EDITOR\r
kTable			equ 04Ah ;TABLE EDITOR\r
kTblSet			equ 04Bh ;TABLE SET\r
kChkRAM			equ 04Ch ;CHECK RAM (About screen)\r
kDelMem			equ 04Dh ;DELETE MEM\r
kResetMem		equ 04Eh ;RESET MEM\r
kResetDef		equ 04Fh ;RESET DEFAULT\r
kPrgmInput		equ 050h ;PROGRAM INPUT\r
kZFactEd		equ 051h ;ZOOM FACTOR EDITOR\r
kError			equ 052h ;ERROR\r
kSolveTVM		equ 053h ;TVM SOLVER\r
kSolveRoot		equ 054h ;SOLVE EDITOR\r
kStatP			equ 055h ;stat plot\r
kInfStat		equ 056h ;Inferential Statistic\r
kFormat			equ 057h ;FORMAT\r
kExtApps		equ 058h ;External Applications.		NEW\r
kNewApps		equ 059h ;New Apps for Cerberus.\r
append			equ kNewApps\r
echoStart1		equ 05Ah\r
kTrace			equ 05Ah\r
kZFit			equ 05Bh\r
kZIn			equ 05Ch\r
kZOut			equ 05Dh\r
kZPrev			equ 05Eh\r
kBox			equ 05Fh\r
kDecml			equ 060h\r
kSetZm			equ 061h\r
kSquar			equ 062h\r
kStd			equ 063h\r
kTrig			equ 064h\r
kUsrZm			equ 065h\r
kZSto			equ 066h\r
kZInt			equ 067h\r
kZStat			equ 068h\r
echoStart2		equ 069h\r
kSelect			equ 069h\r
kCircl			equ 06Ah\r
kClDrw			equ 06Bh\r
kLine			equ 06Ch\r
kPen			equ 06Dh\r
kPtChg			equ 06Eh\r
kPtOff			equ 06Fh\r
kPtOn			equ 070h\r
kVert			equ 071h\r
kHoriz			equ 072h\r
kText			equ 073h\r
kTanLn			equ 074h\r
kEval			equ 075h\r
kInters			equ 076h\r
kDYDX			equ 077h\r
kFnIntg			equ 078h\r
kRootG			equ 079h\r
kDYDT			equ 07Ah\r
kDXDT			equ 07Bh\r
kDRDo			equ 07Ch\r
KGFMin			equ 07Dh\r
KGFMax			equ 07Eh\r
EchoStart		equ 07Fh\r
kListName		equ 07Fh\r
kAdd			equ 080h\r
kSub			equ 081h\r
kMul			equ 082h\r
kDiv			equ 083h\r
kExpon			equ 084h\r
kLParen			equ 085h\r
kRParen			equ 086h\r
kLBrack			equ 087h\r
kRBrack			equ 088h\r
kShade			equ 089h\r
kStore			equ 08Ah\r
kComma			equ 08Bh\r
kChs			equ 08Ch\r
kDecPnt			equ 08Dh\r
k0			equ 08Eh\r
k1			equ 08Fh\r
k2			equ 090h\r
k3			equ 091h\r
k4			equ 092h\r
k5			equ 093h\r
k6			equ 094h\r
k7			equ 095h\r
k8			equ 096h\r
k9			equ 097h\r
kEE			equ 098h\r
kSpace			equ 099h\r
kCapA			equ 09Ah\r
kCapB			equ 09Bh\r
kCapC			equ 09Ch\r
kCapD			equ 09Dh\r
kCapE			equ 09Eh\r
kCapF			equ 09Fh\r
kCapG			equ 0A0h\r
kCapH			equ 0A1h\r
kCapI			equ 0A2h\r
kCapJ			equ 0A3h\r
kCapK			equ 0A4h\r
kCapL			equ 0A5h\r
kCapM			equ 0A6h\r
kCapN			equ 0A7h\r
kCapO			equ 0A8h\r
kCapP			equ 0A9h\r
kCapQ			equ 0AAh\r
kCapR			equ 0ABh\r
kCapS			equ 0ACh\r
kCapT			equ 0ADh\r
kCapU			equ 0AEh\r
kCapV			equ 0AFh\r
kCapW			equ 0B0h\r
kCapX			equ 0B1h\r
kCapY			equ 0B2h\r
kCapZ			equ 0B3h\r
kVarx			equ 0B4h\r
kPi			equ 0B5h\r
kInv			equ 0B6h\r
kSin			equ 0B7h\r
kASin			equ 0B8h\r
kCos			equ 0B9h\r
kACos			equ 0BAh\r
kTan			equ 0BBh\r
kATan			equ 0BCh\r
kSquare			equ 0BDh\r
kSqrt			equ 0BEh\r
kLn			equ 0BFh\r
kExp			equ 0C0h\r
kLog			equ 0C1h\r
kALog			equ 0C2h\r
kToABC			equ 0C3h\r
kClrTbl			equ 0C4h\r
kAns			equ 0C5h\r
kColon			equ 0C6h\r
kNDeriv			equ 0C7h\r
kFnInt			equ 0C8h\r
kRoot			equ 0C9h\r
kQuest			equ 0CAh\r
kQuote			equ 0CBh\r
kTheta			equ 0CCh\r
kIf			equ 0CDh\r
kThen			equ 0CEh\r
kElse			equ 0CFh\r
kFor			equ 0D0h\r
kWhile			equ 0D1h\r
kRepeat			equ 0D2h\r
kEnd			equ 0D3h\r
kPause			equ 0D4h\r
kLbl			equ 0D5h\r
kGoto			equ 0D6h\r
kISG			equ 0D7h\r
kDSL			equ 0D8h\r
kMenu			equ 0D9h\r
kExec			equ 0DAh\r
kReturn			equ 0DBh\r
kStop			equ 0DCh\r
kInput			equ 0DDh\r
kPrompt			equ 0DEh\r
kDisp			equ 0DFh\r
kDispG			equ 0E0h\r
kDispT			equ 0E1h\r
kOutput			equ 0E2h\r
kGetKey			equ 0E3h\r
kClrHome		equ 0E4h\r
kPrtScr			equ 0E5h\r
kSinH			equ 0E6h\r
kCosH			equ 0E7h\r
kTanH			equ 0E8h\r
kASinH			equ 0E9h\r
kACosH			equ 0EAh\r
kATanH			equ 0EBh\r
kLBrace			equ 0ECh\r
kRBrace			equ 0EDh\r
kI			equ 0EEh\r
kCONSTeA		equ 0EFh\r
kPlot3			equ 0F0h\r
kFMin			equ 0F1h\r
kFMax			equ 0F2h\r
kL1A			equ 0F3h\r
kL2A			equ 0F4h\r
kL3A			equ 0F5h\r
kL4A			equ 0F6h\r
kL5A			equ 0F7h\r
kL6A			equ 0F8h\r
kunA			equ 0F9h\r
kvnA			equ 0FAh\r
kwnA			equ 0FBh\r
\r
; THIS KEY MEANS THAT IT IS A 2 BYTE KEYCODE\r
; THERE ARE 2 OF THESE KEYS; BE CAREFUL WITH USAGE\r
;--------------------------------------------------------\r
kExtendEcho2		equ 0FCh\r
\r
; THIS KEY MEANS THAT THE KEY PRESS IS ONE THAT ECHOS\r
; INTO A BUFFER, AND IT IS A 2 BYTE KEY CODE, GO LOOK AT\r
; (EXTECHO) FOR THE KEY VALUE\r
;--------------------------------------------------------\r
kExtendEcho		equ 0FEh\r
\r
kE1BT			equ 0\r
kDrawInv		equ kE1BT\r
kDrawF			equ kE1BT+1\r
kPixelOn		equ kE1BT+2\r
kPixelOff		equ kE1BT+3\r
kPxlTest		equ kE1BT+4\r
kRCGDB			equ kE1BT+5\r
kRCPic			equ kE1BT+6\r
kSTGDB			equ kE1BT+7\r
kSTPic			equ kE1BT+8\r
kAbs			equ kE1BT+9\r
kTequ 		equ kE1BT+10 ;==\r
kTNoteQ			equ kE1BT+11 ;<>\r
kTGT			equ kE1BT+12 ;>\r
kTGTE			equ kE1BT+13 ;>=\r
kTLT			equ kE1BT+14 ;<\r
kTLTE			equ kE1BT+15 ;<=\r
kAnd			equ kE1BT+16\r
kOr			equ kE1BT+17\r
kXor			equ kE1BT+18\r
kNot			equ kE1BT+19\r
kLR1			equ kE1BT+20\r
kXRoot			equ kE1BT+21\r
kCube			equ kE1BT+22\r
kCbRt			equ kE1BT+23 ;Cube ROOT\r
kToDec			equ kE1BT+24\r
kCubicR			equ kE1BT+25\r
kQuartR			equ kE1BT+26\r
kPlot1			equ kE1BT+27\r
kPlot2			equ kE1BT+28\r
kRound			equ kE1BT+29\r
kIPart			equ kE1BT+30\r
kFPart			equ kE1BT+31\r
kInt			equ kE1BT+32\r
kRand			equ kE1BT+33\r
kNPR			equ kE1BT+34\r
kNCR			equ kE1BT+35\r
kXFactorial		equ kE1BT+36\r
kRad			equ kE1BT+37\r
kDegr			equ kE1BT+38 ;DEGREES CONV\r
kAPost			equ kE1BT+39\r
kToDMS			equ kE1BT+40\r
kRToPo			equ kE1BT+41 ;R\r
kRToPr			equ kE1BT+42\r
kPToRx			equ kE1BT+43\r
kPToRy			equ kE1BT+44\r
kRowSwap		equ kE1BT+45\r
kRowPlus		equ kE1BT+46\r
kTimRow			equ kE1BT+47\r
kTRowP			equ kE1BT+48\r
kSortA			equ kE1BT+49\r
kSortD			equ kE1BT+50\r
kSeq			equ kE1BT+51\r
kMin			equ kE1BT+52\r
kMax			equ kE1BT+53\r
kMean			equ kE1BT+54\r
kMedian			equ kE1BT+55\r
kSum			equ kE1BT+56\r
kProd			equ kE1BT+57\r
kDet			equ kE1BT+58\r
kTransp			equ kE1BT+59\r
kDim			equ kE1BT+60\r
kFill			equ kE1BT+61\r
kIdent			equ kE1BT+62\r
kRandm			equ kE1BT+63\r
kAug			equ kE1BT+64\r
kOneVar			equ kE1BT+65\r
kTwoVar			equ kE1BT+66\r
kLR			equ kE1BT+67\r
kLRExp			equ kE1BT+68\r
kLRLn			equ kE1BT+69\r
kLRPwr			equ kE1BT+70\r
kMedMed			equ kE1BT+71\r
kQuad			equ kE1BT+72\r
kClrLst			equ kE1BT+73\r
kHist			equ kE1BT+74\r
kxyLine			equ kE1BT+75\r
kScatter		equ kE1BT+76\r
kmRad			equ kE1BT+77\r
kmDeg			equ kE1BT+78\r
kmNormF			equ kE1BT+79\r
kmSci			equ kE1BT+80\r
kmEng			equ kE1BT+81\r
kmFloat			equ kE1BT+82\r
kFix			equ kE1BT+83\r
kSplitOn		equ kE1BT+84\r
kFullScreen		equ kE1BT+85\r
kStndrd			equ kE1BT+86\r
kParam			equ kE1BT+87\r
kPolar			equ kE1BT+88\r
kSeqG			equ kE1BT+89\r
kAFillOn		equ kE1BT+90\r
kAFillOff		equ kE1BT+91\r
kACalcOn		equ kE1BT+92\r
kACalcOff		equ kE1BT+93\r
kFNOn			equ kE1BT+94\r
kFNOff			equ kE1BT+95\r
kPlotsOn		equ kE1BT+96\r
kPlotsOff		equ kE1BT+97\r
kPixelChg		equ kE1BT+98\r
kSendMBL		equ kE1BT+99\r
kRecvMBL		equ kE1BT+100\r
kBoxPlot		equ kE1BT+101\r
kBoxIcon		equ kE1BT+102\r
kCrossIcon		equ kE1BT+103\r
kDotIcon		equ kE1BT+104\r
kE2BT			equ kE1BT+105\r
kSeqential		equ kE2BT\r
kSimulG			equ kE2BT+1\r
kPolarG			equ kE2BT+2\r
kRectG			equ kE2BT+3\r
kCoordOn		equ kE2BT+4\r
kCoordOff		equ kE2BT+5\r
kDrawLine		equ kE2BT+6\r
kDrawDot		equ kE2BT+7\r
kAxisOn			equ kE2BT+8\r
kAxisOff		equ kE2BT+9\r
kGridOn			equ kE2BT+10\r
kGridOff		equ kE2BT+11\r
kLblOn			equ kE2BT+12\r
kLblOff			equ kE2BT+13\r
kL1			equ kE2BT+14\r
kL2			equ kE2BT+15\r
kL3			equ kE2BT+16\r
kL4			equ kE2BT+17\r
kL5			equ kE2BT+18\r
kL6			equ kE2BT+19\r
\r
;These keys are laid on top of existing keys to\r
;enable localization in the inferential stats editor.\r
;----------------------------------------------------\r
kinfData		equ kL1\r
kinfStats		equ kL1+1\r
kinfYes			equ kL1+2\r
kinfNo			equ kL1+3\r
kinfCalc		equ kL1+4\r
kinfDraw		equ kL1+5\r
kinfAlt1ne		equ kL1+6\r
kinfAlt1lt		equ kL1+7\r
kinfAlt1gt		equ kL1+8\r
kinfAlt2ne		equ kL1+9\r
kinfAlt2lt		equ kL1+10\r
kinfAlt2gt		equ kL1+11\r
kinfAlt3ne		equ kL1+12\r
kinfAlt3lt		equ kL1+13\r
kinfAlt3gt		equ kL1+14\r
kinfAlt4ne		equ kL1+15\r
kinfAlt4lt		equ kL1+16\r
kinfAlt4gt		equ kL1+17\r
kinfAlt5ne		equ kL1+18\r
kinfAlt5lt		equ kL1+19\r
kinfAlt5gt		equ kL1+20\r
kinfAlt6ne		equ kL1+21\r
kinfAlt6lt		equ kL1+22\r
kinfAlt6gt		equ kL1+23\r
kMatA			equ kE2BT+20\r
kMatB			equ kE2BT+21\r
kMatC			equ kE2BT+22\r
kMatD			equ kE2BT+23\r
kMatE			equ kE2BT+24\r
kXmin			equ kE2BT+25\r
kXmax			equ kE2BT+26\r
kXscl			equ kE2BT+27\r
kYmin			equ kE2BT+28\r
kYmax			equ kE2BT+29\r
kYscl			equ kE2BT+30\r
kTmin			equ kE2BT+31\r
kTmax			equ kE2BT+32\r
kTStep			equ kE2BT+33\r
kOmin			equ kE2BT+34\r
kOmax			equ kE2BT+35\r
kOStep			equ kE2BT+36\r
ku0			equ kE2BT+37\r
kv0			equ kE2BT+38\r
knMin			equ kE2BT+39\r
knMax			equ kE2BT+40\r
kDeltaY			equ kE2BT+41\r
kDeltaX			equ kE2BT+42\r
kZXmin			equ kE2BT+43\r
kZXmax			equ kE2BT+44\r
kZXscl			equ kE2BT+45\r
kZYmin			equ kE2BT+46\r
kZYmax			equ kE2BT+47\r
kZYscl			equ kE2BT+48\r
kZTmin			equ kE2BT+49\r
kZTmax			equ kE2BT+50\r
kZTStep			equ kE2BT+51\r
kZOmin			equ kE2BT+52\r
kZOmax			equ kE2BT+53\r
kZOStep			equ kE2BT+54\r
kZu0			equ kE2BT+55\r
kZv0			equ kE2BT+56\r
kZnMin			equ kE2BT+57\r
kZnMax			equ kE2BT+58\r
kDelLast		equ kE2BT+59\r
kSinReg			equ kE2BT+60\r
kConstE			equ kE2BT+61\r
kPic1			equ kE2BT+62\r
kPic2			equ kE2BT+63\r
kPic3			equ kE2BT+64\r
kDelVar			equ kE2BT+65\r
kGetCalc		equ kE2BT+66\r
kRealM			equ kE2BT+67\r
kPolarM			equ kE2BT+68\r
kRectM			equ kE2BT+69\r
kuv			equ kE2BT+70 ;U vs V\r
kvw			equ kE2BT+71 ;V vs W\r
kuw			equ kE2BT+72 ;U vs W\r
kFinPMTend		equ kE2BT+73\r
kFinPMTbeg		equ kE2BT+74\r
kGraphStyle		equ kE2BT+75\r
kExprOn			equ kE2BT+76\r
kExprOff		equ kE2BT+77\r
kStatA			equ kE2BT+78\r
kStatB			equ kE2BT+79\r
kStatC			equ kE2BT+80\r
kCorr			equ kE2BT+81\r
kStatD			equ kE2BT+82\r
kStatE			equ kE2BT+83\r
kRegEq			equ kE2BT+84\r
kMinX			equ kE2BT+85\r
kQ1			equ kE2BT+86\r
kMD			equ kE2BT+87\r
kQ3			equ kE2BT+88\r
kMaxX			equ kE2BT+89\r
kStatX1			equ kE2BT+90\r
kStatY1			equ kE2BT+91\r
kStatX2			equ kE2BT+92\r
kStatY2			equ kE2BT+93\r
kStatX3			equ kE2BT+94\r
kStatY3			equ kE2BT+95\r
kTblMin			equ kE2BT+96\r
kTblStep		equ kE2BT+97\r
kSetupLst		equ kE2BT+98\r
kClrAllLst		equ kE2BT+99\r
kLogistic		equ kE2BT+100\r
kZTest			equ kE2BT+101\r
kTTest			equ kE2BT+102\r
k2SampZTest		equ kE2BT+103\r
k2SampTTest		equ kE2BT+104\r
k1PropZTest		equ kE2BT+105\r
k2PropZTest		equ kE2BT+106\r
kChiTest		equ kE2BT+107\r
k2SampFTest		equ kE2BT+108\r
kZIntVal		equ kE2BT+109\r
kTIntVal		equ kE2BT+110\r
k2SampTInt		equ kE2BT+111\r
k2SampZInt		equ kE2BT+112\r
k1PropZInt		equ kE2BT+113\r
k2PropZInt		equ kE2BT+114\r
kDNormal		equ kE2BT+115\r
kInvNorm		equ kE2BT+116\r
kDT			equ kE2BT+117\r
kChi			equ kE2BT+118\r
kDF			equ kE2BT+119\r
kBinPDF			equ kE2BT+120\r
kBinCDF			equ kE2BT+121\r
kPoiPDF			equ kE2BT+122\r
kPoiCDF			equ kE2BT+123\r
kun			equ kE2BT+124\r
kvn			equ kE2BT+125\r
kwn			equ kE2BT+126\r
kRecn			equ kE2BT+127\r
kPlotStart		equ kE2BT+128\r
kZPlotStart		equ kE2BT+129 ;recursion n\r
kXFact			equ kE2BT+130 ;PlotStart\r
kYFact			equ kE2BT+131 ;ZPlotStart\r
kANOVA			equ kE2BT+132 ;XFact\r
kMaxY			equ kE2BT+133 ;YFact\r
kWebOn			equ kE2BT+134 ;MinY\r
kWebOff			equ kE2BT+135 ;MaxY\r
kTblInput		equ kE2BT+136 ;WEB ON\r
kGeoPDF			equ kE2BT+137 ;WEB OFF\r
kGeoCDF			equ kE2BT+138 ;WEB OFF\r
kShadeNorm		equ kE2BT+139\r
kShadeT			equ kE2BT+140\r
kShadeChi		equ kE2BT+141\r
kShadeF			equ kE2BT+142\r
kPlotStep		equ kE2BT+143\r
kZPlotStep		equ kE2BT+144\r
kLinRegtTest		equ kE2BT+145\r
KMGT			equ kE2BT+146 ;VERT SPLIT\r
kSelectA		equ kE2BT+147\r
kZFitA			equ kE2BT+148\r
kE2BT_End		equ kZFitA\r
\r
;More 2 Byte Keys \r
;-------------------------------------\r
kE2BT2			equ 00h\r
kGDB1			equ kE2BT2\r
kGDB2			equ kE2BT2+1\r
kGDB3			equ kE2BT2+2\r
kY1			equ kE2BT2+3\r
kY2			equ kE2BT2+4\r
kY3			equ kE2BT2+5\r
kY4			equ kE2BT2+6\r
kY5			equ kE2BT2+7\r
kY6			equ kE2BT2+8\r
kY7			equ kE2BT2+9\r
kY8			equ kE2BT2+10\r
kY9			equ kE2BT2+11\r
kY0			equ kE2BT2+12\r
kX1T			equ kE2BT2+13\r
kY1T			equ kE2BT2+14\r
kX2T			equ kE2BT2+15\r
kY2T			equ kE2BT2+16\r
kX3T			equ kE2BT2+17\r
kY3T			equ kE2BT2+18\r
kX4T			equ kE2BT2+19\r
kY4T			equ kE2BT2+20\r
kX5T			equ kE2BT2+21\r
kY5T			equ kE2BT2+22\r
kX6T			equ kE2BT2+23\r
kY6T			equ kE2BT2+24\r
kR1			equ kE2BT2+25\r
kR2			equ kE2BT2+26\r
kR3			equ kE2BT2+27\r
kR4			equ kE2BT2+28\r
kR5			equ kE2BT2+29\r
kR6			equ kE2BT2+30\r
kGDB4			equ kE2BT2+31\r
kGDB5			equ kE2BT2+32\r
kGDB6			equ kE2BT2+33\r
kPic4			equ kE2BT2+34\r
kPic5			equ kE2BT2+35\r
kPic6			equ kE2BT2+36\r
kGDB7			equ kE2BT2+37\r
kGDB8			equ kE2BT2+38\r
kGDB9			equ kE2BT2+39\r
kGDB0			equ kE2BT2+40\r
kPic7			equ kE2BT2+41\r
kPic8			equ kE2BT2+42\r
kPic9			equ kE2BT2+43\r
kPic0			equ kE2BT2+44\r
kStatN			equ kE2BT2+45\r
kXMean			equ kE2BT2+46\r
kConj			equ kE2BT2+47\r
kReal			equ kE2BT2+48\r
kFAngle			equ kE2BT2+49\r
kLCM			equ kE2BT2+50\r
kGCD			equ kE2BT2+51\r
kRandInt		equ kE2BT2+52\r
kRandNorm		equ kE2BT2+53\r
kToPolar		equ kE2BT2+54\r
kToRect			equ kE2BT2+55\r
kYMean			equ kE2BT2+56\r
kStdX			equ kE2BT2+57\r
kStdX1			equ kE2BT2+58\r
kw0			equ kE2BT2+59\r
kMatF			equ kE2BT2+60\r
kMatG			equ kE2BT2+61\r
kMatRH			equ kE2BT2+62\r
kMatI			equ kE2BT2+63\r
kMatJ			equ kE2BT2+64\r
kYMean1			equ kE2BT2+65\r
kStdY			equ kE2BT2+66\r
kStdY1			equ kE2BT2+67\r
kMatToLst		equ kE2BT2+68\r
kLstToMat		equ kE2BT2+69\r
kCumSum			equ kE2BT2+70\r
kDeltaLst		equ kE2BT2+71\r
kStdDev			equ kE2BT2+72\r
kVariance		equ kE2BT2+73\r
kLength			equ kE2BT2+74\r
kEquToStrng		equ kE2BT2+75\r
kStrngToequ 		equ kE2BT2+76\r
kExpr			equ kE2BT2+77\r
kSubStrng		equ kE2BT2+78\r
kInStrng		equ kE2BT2+79\r
kStr1			equ kE2BT2+80\r
kStr2			equ kE2BT2+81\r
kStr3			equ kE2BT2+82\r
kStr4		 	equ kE2BT2+83\r
kStr5		 	equ kE2BT2+84\r
kStr6		 	equ kE2BT2+85\r
kStr7		 	equ kE2BT2+86\r
kStr8		 	equ kE2BT2+87\r
kStr9		 	equ kE2BT2+88\r
kStr0		 	equ kE2BT2+89\r
kFinN		 	equ kE2BT2+90\r
kFinI		 	equ kE2BT2+91\r
kFinPV			equ kE2BT2+92\r
kFinPMT			equ kE2BT2+93\r
kFinFV			equ kE2BT2+94\r
kFinPY			equ kE2BT2+95\r
kFinCY			equ kE2BT2+96\r
kFinFPMT		equ kE2BT2+97\r
kFinFI			equ kE2BT2+98\r
kFinFPV			equ kE2BT2+99\r
kFinFN			equ kE2BT2+100\r
kFinFFV			equ kE2BT2+101\r
kFinNPV			equ kE2BT2+102\r
kFinIRR			equ kE2BT2+103\r
kFinBAL			equ kE2BT2+104\r
kFinPRN			equ kE2BT2+105\r
kFinINT			equ kE2BT2+106\r
kSumX		 	equ kE2BT2+107\r
kSumX2			equ kE2BT2+108\r
kFinToNom		equ kE2BT2+109\r
kFinToEff		equ kE2BT2+110\r
kFinDBD			equ kE2BT2+111\r
kStatVP			equ kE2BT2+112\r
kStatZ			equ kE2BT2+113\r
kStatT			equ kE2BT2+114\r
kStatChi		equ kE2BT2+115\r
kStatF			equ kE2BT2+116\r
kStatDF			equ kE2BT2+117\r
kStatPhat		equ kE2BT2+118\r
kStatPhat1		equ kE2BT2+119\r
kStatPhat2		equ kE2BT2+120\r
kStatMeanX1		equ kE2BT2+121\r
kStatMeanX2		equ kE2BT2+122\r
kStatStdX1		equ kE2BT2+123\r
kStatStdX2		equ kE2BT2+124\r
kStatStdXP		equ kE2BT2+125\r
kStatN1			equ kE2BT2+126\r
kStatN2			equ kE2BT2+127\r
kStatLower		equ kE2BT2+128\r
kStatUpper		equ kE2BT2+129\r
kuw0			equ kE2BT2+130\r
kImag			equ kE2BT2+131\r
kSumY			equ kE2BT2+132\r
kXres			equ kE2BT2+133\r
kStat_s			equ kE2BT2+134\r
kSumY2			equ kE2BT2+135\r
kSumXY			equ kE2BT2+136\r
kuXres			equ kE2BT2+137\r
kModBox			equ kE2BT2+138\r
kNormProb		equ kE2BT2+139\r
kNormalPDF		equ kE2BT2+140\r
kTPDF			equ kE2BT2+141\r
kChiPDF			equ kE2BT2+142\r
kFPDF			equ kE2BT2+143\r
kMinY			equ kE2BT2+144 ;MinY\r
kRandBin		equ kE2BT2+145\r
kRef			equ kE2BT2+146\r
kRRef			equ kE2BT2+147\r
kLRSqr			equ kE2BT2+148\r
kBRSqr			equ kE2BT2+149\r
kDiagOn			equ kE2BT2+150\r
kDiagOff		equ kE2BT2+151\r
kun1			equ kE2BT2+152 ;FOR RCL USE WHEN GOTTEN FROM 82\r
kvn1			equ kE2BT2+153 ;FOR RCL USE WHEN GOTTEN FROM 82\r
k83_00End		equ kvn1 ;end of original keys...\r
kArchive		equ k83_00End + 1\r
kUnarchive		equ k83_00End + 2\r
kAsm			equ k83_00End + 3 ;Asm(\r
kAsmPrgm		equ k83_00End + 4 ;AsmPrgm\r
kAsmComp		equ k83_00End + 5 ;AsmComp(\r
kcapAAcute		equ k83_00End + 6\r
kcapAGrave		equ k83_00End + 7\r
kcapACaret		equ k83_00End + 8\r
kcapADier		equ k83_00End + 9\r
kaAcute			equ k83_00End + 10\r
kaGrave			equ k83_00End + 11\r
kaCaret			equ k83_00End + 12\r
kaDier			equ k83_00End + 13\r
kcapEAcute		equ k83_00End + 14\r
kcapEGrave		equ k83_00End + 15\r
kcapECaret		equ k83_00End + 16\r
kcapEDier		equ k83_00End + 17\r
keAcute			equ k83_00End + 18\r
keGrave			equ k83_00End + 19\r
keCaret			equ k83_00End + 20\r
keDier			equ k83_00End + 21\r
kcapIAcute		equ k83_00End + 22\r
kcapIGrave		equ k83_00End + 23\r
kcapICaret		equ k83_00End + 24\r
kcapIDier		equ k83_00End + 25\r
kiAcute			equ k83_00End + 26\r
kiGrave			equ k83_00End + 27\r
kiCaret			equ k83_00End + 28\r
kiDier			equ k83_00End + 29\r
kcapOAcute		equ k83_00End + 30\r
kcapOGrave		equ k83_00End + 31\r
kcapOCaret		equ k83_00End + 32\r
kcapODier		equ k83_00End + 33\r
koAcute			equ k83_00End + 34\r
koGrave			equ k83_00End + 35\r
koCaret			equ k83_00End + 36\r
koDier			equ k83_00End + 37\r
kcapUAcute		equ k83_00End + 38\r
kcapUGrave		equ k83_00End + 39\r
kcapUCaret		equ k83_00End + 40\r
kcapUDier		equ k83_00End + 41\r
kuAcute			equ k83_00End + 42\r
kuGrave			equ k83_00End + 43\r
kuCaret			equ k83_00End + 44\r
kuDier			equ k83_00End + 45\r
kcapCCed		equ k83_00End + 46\r
kcCed			equ k83_00End + 47\r
kcapNTilde		equ k83_00End + 48\r
knTilde			equ k83_00End + 49\r
kaccent			equ k83_00End + 50\r
kgrave			equ k83_00End + 51\r
kdieresis		equ k83_00End + 52\r
kquesDown		equ k83_00End + 53\r
kexclamDown		equ k83_00End + 54\r
kalpha			equ k83_00End + 55\r
kbeta		 	equ k83_00End + 56\r
kgamma			equ k83_00End + 57\r
kcapDelta		equ k83_00End + 58\r
kdelta			equ k83_00End + 59\r
kepsilon		equ k83_00End + 60\r
klambda			equ k83_00End + 61\r
kmu			equ k83_00End + 62\r
kpi2			equ k83_00End + 63\r
krho			equ k83_00End + 64\r
kcapSigma		equ k83_00End + 65\r
ksigma			equ k83_00End + 66\r
ktau			equ k83_00End + 67\r
kphi			equ k83_00End + 68\r
kcapOmega		equ k83_00End + 69\r
kphat			equ k83_00End + 70\r
kchi2			equ k83_00End + 71\r
kstatF2			equ k83_00End + 72\r
kLa			equ k83_00End + 73\r
kLb			equ k83_00End + 74\r
kLc			equ k83_00End + 75\r
kLd			equ k83_00End + 76\r
kLe			equ k83_00End + 77\r
kLf			equ k83_00End + 78\r
kLg			equ k83_00End + 79\r
kLh			equ k83_00End + 80\r
kLi			equ k83_00End + 81\r
kLj			equ k83_00End + 82\r
kLk			equ k83_00End + 83\r
kLl			equ k83_00End + 84\r
kLm			equ k83_00End + 85\r
kLsmalln		equ k83_00End + 86\r
kLo			equ k83_00End + 87\r
kLp			equ k83_00End + 88\r
kLq			equ k83_00End + 89\r
kLsmallr		equ k83_00End + 90\r
kLs			equ k83_00End + 91\r
kLt			equ k83_00End + 92\r
kLu			equ k83_00End + 93\r
kLv			equ k83_00End + 94\r
kLw			equ k83_00End + 95\r
kLx			equ k83_00End + 96\r
kLy			equ k83_00End + 97\r
kLz			equ k83_00End + 98\r
kGarbageC		equ k83_00End + 99 ;GarbageCollect\r
kE2BT2_End		equ kGarbageC\r
\r
;TI-83 Plus Context Equates\r
;--------------------------------------------------------------\r
cxCmd			equ kQuit ;home screen\r
cxMatEdit		equ kMatrixEd ;matrix editor\r
cxPrgmEdit		equ kPrgmEd ;program editor\r
cxEquEdit		equ kYequ ;equation editor\r
cxGrRange		equ kWindow ;graph range editor\r
cxGrZfact		equ kZFactEd ;graph zoom factors editor\r
cxGraph			equ kGraph ;graph mode\r
cxStatEdit		equ kStatEd ;statistics list editor\r
cxPrgmInput		equ kPrgmInput ;programmed input\r
cxError			equ kError ;error handler\r
cxLinkIO		equ kLinkIO ;LINK I/O interface\r
cxMem			equ kResetMem ;reset memory\r
cxDefMem		equ kResetDef ;reset default\r
cxRAMApp		equ kChkRAM ;RAM usage screen\r
cxMode			equ kMode ;mode settings screen\r
cxErase			equ kDelMem ;memory erase\r
cxPrgmCreate		equ kPrgmCr ;PROGRAM CREATE\r
cxTableEditor		equ kTable ;TABLE EDITOR\r
cxTableSet		equ kTblSet ;TABLE SET UP\r
cxStatPlot		equ kStatP ;STAT PLOTS\r
cxInfStat		equ kInfStat ;Inferential Statistic\r
cxFormat		equ kFormat ;FORMAT CONTEXT\r
cxSolveTVM		equ kSolveTVM ;Solve TVM\r
cxSolveRoot		equ kSolveRoot ;Solve Root\r
lastOldApp		equ kExtApps ;external applications\r
cxextapps		equ kExtApps\r
cxNewApps		equ kNewApps ;new cerberus applications\r
cxGroup			equ cxNewApps+0 ;1st new app.\r
cxUnGroup		equ cxNewApps+1 ;2nd new app.\r
lastNewApp		equ cxUnGroup ;last new app for this ver\r
\r
;Scan Code Equates\r
;------------------------------\r
skDown			equ 01h\r
skLeft			equ 02h\r
skRight			equ 03h\r
skUp			equ 04h\r
skEnter			equ 09h\r
skAdd			equ 0Ah\r
skSub			equ 0Bh\r
skMul			equ 0Ch\r
skDiv			equ 0Dh\r
skPower			equ 0Eh\r
skClear			equ 0Fh\r
skChs			equ 11h\r
sk3			equ 12h\r
sk6			equ 13h\r
sk9			equ 14h\r
skRParen		equ 15h\r
skTan			equ 16h\r
skVars			equ 17h\r
skDecPnt		equ 19h\r
sk2			equ 1Ah\r
sk5			equ 1Bh\r
sk8			equ 1Ch\r
skLParen		equ 1Dh\r
skCos			equ 1Eh\r
skPrgm			equ 1Fh\r
skStat			equ 20h\r
sk0			equ 21h\r
sk1			equ 22h\r
sk4			equ 23h\r
sk7			equ 24h\r
skComma			equ 25h\r
skSin			equ 26h\r
skMatrix		equ 27h\r
skGraphvar		equ 28h\r
skStore			equ 2Ah\r
skLn			equ 2Bh\r
skLog			equ 2Ch\r
skSquare		equ 2Dh\r
skRecip			equ 2Eh\r
skMath			equ 2Fh\r
skAlpha			equ 30h\r
skGraph			equ 31h\r
skTrace			equ 32h\r
skZoom			equ 33h\r
skWindow		equ 34h\r
skYequ 			equ 35h\r
sk2nd			equ 36h\r
skMode			equ 37h\r
skDel			equ 38h\r
\r
; DI Keyboard Equates\r
;---------------------------\r
DI_Mode		equ 0F50000h\r
DI_Cntrl	equ 0F50004h\r
DI_Int		equ 0F50008h\r
DI_IntMask	equ 0F5000Ch\r
\r
kbdG1		equ 0F50012h\r
;----------------------------\r
kbdGraph	equ 00000001b\r
kbdTrace	equ 00000010b\r
kbdZoom		equ 00000100b\r
kbdWindow	equ 00001000b\r
kbdYequ 	equ 00010000b\r
kbd2nd		equ 00100000b\r
kbdMode		equ 01000000b\r
kbdDel		equ 10000000b\r
\r
kbitGraph	equ 00h\r
kbitTrace	equ 01h\r
kbitZoom	equ 02h\r
kbitWindow	equ 03h\r
kbitYequ equ 04h\r
kbit2nd		equ 05h\r
kbitMode	equ 06h\r
kbitDel		equ 07h\r
\r
kbdG2		equ 0F50014h\r
;----------------------------\r
kbdStore	equ 00000010b\r
kbdLn		equ 00000100b\r
kbdLog		equ 00001000b\r
kbdSquare	equ 00010000b\r
kbdRecip	equ 00100000b\r
kbdMath		equ 01000000b\r
kbdAlpha	equ 10000000b\r
\r
kbitStore	equ 01h\r
kbitLn		equ 02h\r
kbitLog		equ 03h\r
kbitSquare	equ 04h\r
kbitRecip	equ 05h\r
kbitMath	equ 06h\r
kbitAlpha	equ 07h\r
\r
kbdG3		equ 0F50016h\r
;----------------------------\r
kbd0		equ 00000001b\r
kbd1		equ 00000010b\r
kbd4		equ 00000100b\r
kbd7		equ 00001000b\r
kbdComma	equ 00010000b\r
kbdSin		equ 00100000b\r
kbdApps		equ 01000000b\r
kbdGraphVar	equ 10000000b\r
\r
kbit0		equ 00h\r
kbit1		equ 01h\r
kbit4		equ 02h\r
kbit7		equ 03h\r
kbitComma	equ 04h\r
kbitSin		equ 05h\r
kbitApps	equ 06h\r
kbitGraphVar	equ 07h\r
\r
kbdG4		equ 0F50018h\r
;----------------------------\r
kbdDecPnt	equ 00000001b\r
kbd2		equ 00000010b\r
kbd5		equ 00000100b\r
kbd8		equ 00001000b\r
kbdLParen	equ 00010000b\r
kbdCos		equ 00100000b\r
kbdPgrm		equ 01000000b\r
kbdStat		equ 10000000b\r
\r
kbitDecPnt	equ 00h\r
kbit2		equ 01h\r
kbit5		equ 02h\r
kbit8		equ 03h\r
kbitLParen	equ 04h\r
kbitCos		equ 05h\r
kbitPgrm	equ 06h\r
kbitStat	equ 07h\r
\r
kbdG5		equ 0F5001Ah\r
;----------------------------\r
kbdChs		equ 00000001b\r
kbd3		equ 00000010b\r
kbd6		equ 00000100b\r
kbd9		equ 00001000b\r
kbdRParen	equ 00010000b\r
kbdTan		equ 00100000b\r
kbdVars		equ 01000000b\r
\r
kbitChs		equ 00h\r
kbit3		equ 01h\r
kbit6		equ 02h\r
kbit9		equ 03h\r
kbitRParen	equ 04h\r
kbitTan		equ 05h\r
kbitVars	equ 06h\r
\r
kbdG6		equ 0F5001Ch\r
;----------------------------\r
kbdEnter	equ 00000001b\r
kbdAdd		equ 00000010b\r
kbdSub		equ 00000100b\r
kbdMul		equ 00001000b\r
kbdDiv		equ 00010000b\r
kbdPower	equ 00100000b\r
kbdClear	equ 01000000b\r
\r
kbitEnter	equ 00h\r
kbitAdd		equ 01h\r
kbitSub		equ 02h\r
kbitMul		equ 03h\r
kbitDiv		equ 04h\r
kbitPower	equ 05h\r
kbitClear	equ 06h\r
\r
kbdG7		equ 0F5001Eh\r
;----------------------------\r
kbdDown		equ 00000001b\r
kbdLeft		equ 00000010b\r
kbdRight	equ 00000100b\r
kbdUp		equ 00001000b\r
\r
kbitDown	equ 00h\r
kbitLeft	equ 01h\r
kbitRight	equ 02h\r
kbitUp		equ 03h\r
\r
;Tokens\r
;-----------------------------------------------------\r
EOSSTART		equ 00h\r
\r
;DISPLAY CONVERSIONS COME IMMEDIATELY BEFORE 'TSTORE'\r
;\r
DCONV			equ 01h\r
;\r
tToDMS			equ DCONV ;01h\r
tToDEC			equ DCONV+1 ;02h\r
tToAbc			equ DCONV+2 ;03h > A b/c\r
;\r
tStore			equ DCONV+3 ;04h Lstore 01\r
;\r
tBoxPlot		equ 05h\r
;\r
BRACKS			equ 06h\r
;\r
tLBrack			equ BRACKS ;06h '['\r
tRBrack			equ BRACKS+1 ;07h ']'\r
tLBrace			equ BRACKS+2 ;08h '{'\r
tRBrace			equ BRACKS+3 ;09h '}'\r
;\r
tPOST1			equ BRACKS+4\r
;\r
tFromRad		equ tPOST1 ;0Ah Lradian\r
tFromDeg		equ tPOST1+1 ;0Bh Ldegree\r
tRecip			equ tPOST1+2 ;0Ch Linverse\r
tSqr			equ tPOST1+3 ;0Dh Lsquare\r
tTrnspos		equ tPOST1+4 ;0Eh Ltranspose\r
tCube			equ tPOST1+5 ;0Fh '^3'\r
;\r
tLParen			equ 10h ;10h '('\r
tRParen			equ 11h ;11h ')'\r
;\r
IMUN			equ 12h\r
;\r
tRound			equ IMUN ;12h 'round'\r
tPxTst			equ IMUN+1 ;13h 'PXL-TEST'\r
tAug			equ IMUN+2 ;14h 'aug'\r
tRowSwap		equ IMUN+3 ;15h 'rSwap'\r
tRowPlus		equ IMUN+4 ;16h 'rAdd'\r
tmRow			equ IMUN+5 ;17h 'multR'\r
tmRowPlus		equ IMUN+6 ;18h 'mRAdd'\r
tMax			equ IMUN+7 ;19h 'max'\r
tMin			equ IMUN+8 ;1Ah 'min'\r
tRToPr			equ IMUN+9 ;1Bh 'R>Pr\r
tRToPo			equ IMUN+10 ;1Ch 'R>Po\r
tPToRx			equ IMUN+11 ;1Dh 'P>Rx\r
tPToRy			equ IMUN+12 ;1Eh 'P>Ry\r
tMedian			equ IMUN+13 ;1Fh 'MEDIAN\r
tRandM			equ IMUN+14 ;20h 'randM'\r
tMean			equ IMUN+15 ;21h\r
tRoot			equ IMUN+16 ;22h 'ROOT'\r
tSeries			equ IMUN+17 ;23h 'seq'\r
tFnInt			equ IMUN+18 ;24h 'fnInt'\r
tNDeriv			equ IMUN+19 ;25h 'fnIr'\r
tEvalF			equ IMUN+20 ;26h\r
tFmin			equ IMUN+21 ;27h\r
tFmax			equ IMUN+22 ;28h\r
;\r
tEOSEL			equ IMUN+23\r
;\r
tSpace			equ tEOSEL ;29h ' '\r
tString			equ tEOSEL+1 ;2Ah '"'\r
tComma			equ tEOSEL+2 ;2Bh ','\r
;\r
tii			equ 2Ch ;i\r
\r
;Postfix Functions\r
;-----------------------------------------\r
tPost			equ 2Dh\r
;\r
tFact			equ tPost ;2Dh '!'\r
;\r
tCubicR			equ 2Eh\r
tQuartR			equ 2Fh\r
\r
;Number Tokens \r
;---------------------------------------\r
NUMS			equ 30h\r
;\r
t0			equ NUMS ;30h\r
t1			equ NUMS+1 ;31h\r
t2			equ NUMS+2 ;32h\r
t3			equ NUMS+3 ;33h\r
t4			equ NUMS+4 ;34h\r
t5			equ NUMS+5 ;35h\r
t6			equ NUMS+6 ;36h\r
t7			equ NUMS+7 ;37h\r
t8			equ NUMS+8 ;38h\r
t9			equ NUMS+9 ;39h\r
tDecPt			equ NUMS+10 ;3Ah\r
tee			equ NUMS+11 ;3Bh\r
\r
;Binary OP\r
;-------------------------------------------\r
tOr			equ 3Ch ;3Ch '_or_'\r
tXor			equ 3Dh ;3Dh\r
;\r
tColon			equ 3Eh ;3Eh ':'\r
tEnter			equ 3Fh ;3Fh Lenter\r
;\r
tAnd			equ 40h ;40h '_and_'\r
\r
;Letter Tokens\r
;--------------------------------------\r
LET			equ 41h\r
tA			equ LET ;41h\r
tB			equ LET+1 ;42h\r
tC			equ LET+2 ;43h\r
tD			equ LET+3 ;44h\r
tE			equ LET+4 ;45h\r
tF			equ LET+5 ;46h\r
tG			equ LET+6 ;47h\r
tH			equ LET+7 ;48h\r
tI			equ LET+8 ;49h\r
tJ			equ LET+9 ;4Ah\r
tK			equ LET+10 ;4Bh\r
tL			equ LET+11 ;4Ch\r
tM			equ LET+12 ;4Dh\r
tN			equ LET+13 ;4Eh\r
tO			equ LET+14 ;4Fh\r
tP			equ LET+15 ;50h\r
tQ			equ LET+16 ;51h\r
tR			equ LET+17 ;52h\r
tS			equ LET+18 ;53h\r
tT			equ LET+19 ;54h\r
tU			equ LET+20 ;55h\r
tV			equ LET+21 ;56h\r
tW			equ LET+22 ;57h\r
tX			equ LET+23 ;58h\r
tY			equ LET+24 ;59h\r
tZ			equ LET+25 ;5Ah\r
tTheta			equ LET+26 ;5Bh\r
\r
; Extended Tokens\r
;---------------------------\r
tExtTok		equ	0EFh\r
\r
tSetDate	equ	00h\r
tSetTime	equ	01h\r
tCheckTmr	equ	02h\r
tSetDtFmt	equ	03h\r
tSetTmFmt	equ	04h\r
tTimeCnv	equ	05h\r
tDayOfWk	equ	06h\r
tGetDtStr	equ	07h\r
tGetTmStr	equ	08h\r
tGetDate	equ	09h\r
tGetTime	equ	0Ah\r
tStartTmr	equ	0Bh\r
tGtDtFmt	equ	0Ch\r
tGetTmFmt	equ	0Dh\r
tIsClockOn	equ	0Eh\r
tClockOff	equ	0Fh\r
tClockOn	equ	10h\r
tOpenLib	equ	11h\r
tExecLib	equ	12h\r
tInvT		equ	13h\r
tChiSquaredGofTest	equ	14h\r
tLinRegTInt	equ	15h\r
tManualFit	equ	16h\r
\r
; MathPrint\r
tZQuadrant	equ	17h\r
tZFracHalf	equ	18h\r
tZFracThird	equ	19h\r
tZFracFourth	equ	1Ah\r
tZFracFifth	equ	1Bh\r
tZFracEighth	equ	1Ch\r
tZFracTenth	equ	1Dh\r
tFracSlash	equ	2Eh\r
tFracMixedNum	equ	2Fh\r
tSwapImProper	equ	30h\r
tSwapFracDec	equ	31h\r
tRemainder	equ	32h\r
tSummationSigma	equ	33h\r
tLogBase	equ	34h\r
tRandIntNoRep	equ	35h\r
tMathPrint	equ	37h\r
tClassic	equ	38h\r
tAutoAnswer	equ	3Bh\r
tDecAnswer	equ	3Ch\r
tFracAnswer	equ	3Dh\r
\r
; TI-84+CSE/CE\r
tBlue		equ	41h\r
tRed		equ	42h\r
tBlack 		equ	43h\r
tMagenta	equ	44h\r
tGreen		equ	45h\r
tOrange		equ	46h\r
tBrown		equ	47h\r
tNavy		equ	48h\r
tLtBlue		equ	49h\r
tYellow		equ	4Ah\r
tWhite		equ	4Bh\r
tLtGray		equ	4Ch\r
tMedGray	equ	4Dh\r
tGray		equ	4Eh\r
tDarkGray	equ	4Fh\r
\r
tGraphColor	equ	65h\r
tTextColor	equ	67h\r
tBackgroundOn	equ	5Bh\r
tBackgroundOff	equ	64h\r
\r
tThin		equ	74h\r
;tThick - 0x7E 0x06 (was "Connected"?)\r
tAsm84CPrgm	equ	68h\r
tAsm84CCmp	equ	69h\r
tBorderColor	equ	6Ch\r
\r
tAsm84CeCmp	equ	07Bh\r
tAsm84CePrgm	equ	07Ah\r
\r
;These Var Tokens Are 1st Of A Double Token\r
;-----------------------------------------------\r
\r
vToks			equ LET+27\r
\r
;User Matrix Token, 2nd Token Needed For Name\r
;\r
tVarMat			equ vToks ;5Ch\r
;\r
;User List Token, 2nd Token Needed For Name\r
;\r
tVarLst			equ vToks+1 ;5Dh\r
;\r
;User Equation Token, 2nd Token Needed For Name\r
;\r
tVarequ 		equ vToks+2 ;5Eh\r
tProg			equ vToks+3 ;5Fh\r
;\r
;User Pict Token, 2nd Token Needed For Name\r
;\r
tVarPict		equ vToks+4 ;60h\r
;\r
;User GDB Token, 2nd Token Needed For Name\r
;\r
tVarGDB			equ vToks+5 ;61h\r
tVarOut			equ vToks+6 ;62h\r
tVarSys			equ vToks+7 ;63h\r
\r
;Mode Setting Commands\r
;-------------------------------------------------\r
MODESA			equ vToks+8 ;64h\r
tRad			equ MODESA ;64h 'Radian'\r
tDeg			equ MODESA+1 ;65h 'Degree'\r
tNormF			equ MODESA+2 ;66h 'Normal'\r
tSci			equ MODESA+3 ;67h 'Sci'\r
tEng			equ MODESA+4 ;68h 'Eng'\r
tFloat			equ MODESA+5 ;69h 'Float'\r
CMPS			equ 6Ah\r
tEQ			equ CMPS ;6Ah '=='\r
tLT			equ CMPS+1 ;6Bh '<'\r
tGT			equ CMPS+2 ;6Ch '>'\r
tLE			equ CMPS+3 ;6Dh LLE\r
tGE			equ CMPS+4 ;6Eh LGE\r
tNE			equ CMPS+5 ;6Fh LNE\r
\r
;Binary OP\r
;---------------------------------------\r
tAdd			equ 70h ;70h '+'\r
tSub			equ 71h ;71h '-'\r
tAns			equ 72h ;72h\r
\r
;Mode Setting Commands\r
;------------------------------------------------------\r
MODES			equ 73h\r
tFix			equ MODES ;73h 'Fix_'\r
tSplitOn		equ MODES+1 ;74h\r
tFullScreen		equ MODES+2 ;75h\r
tStndrd			equ MODES+3 ;76h 'Func'\r
tParam			equ MODES+4 ;77h 'Param'\r
tPolar			equ MODES+5 ;78h 'Pol'\r
tSeqG			equ MODES+6 ;79h\r
tAFillOn		equ MODES+7 ;7Ah 'AUTO FILL ON'\r
tAFillOff		equ MODES+8 ;7Bh\r
tACalcOn		equ MODES+9 ;7Ch\r
tACalcOff		equ MODES+10 ;7Dh 'AutoFill OFF'\r
\r
;Graph Format Tokens Are 2 Byte Tokens\r
;----------------------------------------\r
tGFormat		equ MODES+11 ;7Eh\r
tBoxIcon		equ 7Fh\r
tCrossIcon		equ 80h\r
tDotIcon		equ 81h\r
\r
;(More) Binary OP\r
;---------------------------------------\r
tMul			equ 82h ;82h '*'\r
tDiv			equ 83h ;83h '/'\r
\r
;Some Graph Commands\r
;-----------------------------------------------------\r
GRCMDS			equ 84h\r
tTrace			equ GRCMDS ; 84h 'Trace'\r
tClDrw			equ GRCMDS+1 ; 85h 'ClDrw'\r
tZoomStd		equ GRCMDS+2 ; 86h 'ZStd'\r
tZoomtrg		equ GRCMDS+3 ; 87h 'Ztrg'\r
tZoomBox		equ GRCMDS+4 ; 88h 'ZBOX'\r
tZoomIn			equ GRCMDS+5 ; 89h 'ZIn'\r
tZoomOut		equ GRCMDS+6 ; 8Ah 'ZOut'\r
tZoomSqr		equ GRCMDS+7 ; 8Bh 'ZSqr'\r
tZoomInt		equ GRCMDS+8 ; 8Ch 'ZInt'\r
tZoomPrev		equ GRCMDS+9 ; 8Dh 'ZPrev'\r
tZoomDec		equ GRCMDS+10 ; 8Eh 'ZDecm'\r
tZoomStat		equ GRCMDS+11 ; 8Fh 'ZStat\r
tUsrZm			equ GRCMDS+12 ; 90h 'ZRcl'\r
tPrtScrn		equ GRCMDS+13 ; 91h 'PrtScrn'\r
tZoomSto		equ GRCMDS+14 ; 92h  ZOOM STORE\r
tText			equ GRCMDS+15 ; 93h\r
\r
;Binary OP (Combination & Permutation)\r
;-------------------------------------------------\r
tnPr			equ GRCMDS+16 ;94h '_nPr_'\r
tnCr			equ GRCMDS+17 ;95h '_nCr_'\r
\r
;More Graph Commands\r
;--------------------------------------------------\r
tYOn			equ GRCMDS+18 ;96h 'FnOn_'\r
tYOff			equ GRCMDS+19 ;97h 'FnOff_'\r
tStPic			equ GRCMDS+20 ;98h 'StPic_'\r
tRcPic			equ GRCMDS+21 ;99h 'RcPic_'\r
tStoDB			equ GRCMDS+22 ;9Ah 'StGDB_'\r
tRclDB			equ GRCMDS+23 ;9Bh 'RcGDB_'\r
tLine			equ GRCMDS+24 ;9Ch 'Line'\r
tVert			equ GRCMDS+25 ;9Dh 'Vert_'\r
tPtOn			equ GRCMDS+26 ;9Eh 'PtOn'\r
tPtOff			equ GRCMDS+27 ;9Fh 'PtOff'\r
\r
;Token A0 Cannot Be An EOS Function Since Low MULT=A0 Already\r
;-----------------------------------------------------\r
tPtChg			equ GRCMDS+28 ;A0h 'PtChg'\r
tPXOn			equ GRCMDS+29 ;A1h\r
tPXOff			equ GRCMDS+30 ;A2h\r
tPXChg			equ GRCMDS+31 ;A3h\r
tShade			equ GRCMDS+32 ;A4h 'Shade'\r
tCircl			equ GRCMDS+33 ;A5h 'Circl'\r
tHorz			equ GRCMDS+34 ;A6h 'HORIZONTAL'\r
tTanLn			equ GRCMDS+35 ;A7h 'TanLn'\r
tDrInv			equ GRCMDS+36 ;A8h 'DrInv_'\r
tDrawF			equ GRCMDS+37 ;A9h 'DrawF_'\r
tVarStrng		equ 0AAh\r
\r
;Functions with No Arguments								\r
;--------------------------------------------------\r
NOARG			equ 0ABh\r
tRand			equ NOARG ;ABh 'rand'\r
tPi			equ NOARG+1 ;ACh  Lpi\r
tGetKey			equ NOARG+2 ;ADh 'getKy'\r
tAPost			equ tGetKey+1 ;APOSTROPHY\r
tQuest			equ tAPost+1 ;QUESTION MARK\r
UNARY			equ tQuest+1 ;B0h\r
tChs			equ UNARY ;B0h\r
tInt			equ UNARY+1 ;B1h\r
tAbs			equ UNARY+2 ;B2h\r
tDet			equ UNARY+3 ;B3h\r
tIdent			equ UNARY+4 ;B4h\r
tDim			equ UNARY+5 ;B5h\r
tSum			equ UNARY+6 ;B6h\r
tProd			equ UNARY+7 ;B7h\r
tNot			equ UNARY+8 ;B8h\r
tIPart			equ UNARY+9 ;B9h\r
tFPart			equ UNARY+10 ;BAh\r
\r
;New 2 Byte Tokens\r
;------------------------------------------\r
t2ByteTok		equ 0BBh\r
UNARYLR			equ UNARY+12\r
tSqrt			equ UNARYLR ;BCh\r
tCubRt			equ UNARYLR+1 ;BDh\r
tLn			equ UNARYLR+2 ;BEh\r
tExp			equ UNARYLR+3 ;BFh\r
tLog			equ UNARYLR+4 ;C0h\r
tALog			equ UNARYLR+5 ;C1h\r
tSin			equ UNARYLR+6 ;C2h\r
tASin			equ UNARYLR+7 ;C3h\r
tCos			equ UNARYLR+8 ;C4h\r
tACos			equ UNARYLR+9 ;C5h\r
tTan			equ UNARYLR+10 ;C6h\r
tATan			equ UNARYLR+11 ;C7h\r
tSinH			equ UNARYLR+12 ;C8h\r
tASinH			equ UNARYLR+13 ;C9h\r
tCoshH			equ UNARYLR+14 ;CAh\r
tACosH			equ UNARYLR+15 ;CBh\r
tTanH			equ UNARYLR+16 ;CCh\r
tATanH			equ UNARYLR+17 ;CDh\r
\r
;Some Programming Commands\r
;---------------------------------------------------\r
PROGTOK			equ UNARYLR+18\r
tIf			equ PROGTOK ;CEh\r
tThen			equ PROGTOK+1 ;CFh\r
tElse			equ PROGTOK+2 ;D0h\r
tWhile			equ PROGTOK+3 ;D1h\r
tRepeat			equ PROGTOK+4 ;D2h\r
tFor			equ PROGTOK+5 ;D3h\r
tEnd			equ PROGTOK+6 ;D4h\r
tReturn			equ PROGTOK+7 ;D5h\r
tLbl			equ PROGTOK+8 ;D6h 'Lbl_'\r
tGoto			equ PROGTOK+9 ;D7h 'Goto_'\r
tPause			equ PROGTOK+10 ;D8h 'Pause_'\r
tStop			equ PROGTOK+11 ;D9h 'Stop'\r
tISG			equ PROGTOK+12 ;DAh 'IS>'\r
tDSL			equ PROGTOK+13 ;DBh 'DS<'\r
tInput			equ PROGTOK+14 ;DCh 'Input_'\r
tPrompt			equ PROGTOK+15 ;DDh 'Prompt_'\r
tDisp			equ PROGTOK+16 ;DEh 'Disp_'\r
tDispG			equ PROGTOK+17 ;DFh 'DispG'\r
tOutput			equ PROGTOK+18 ;E0h 'Outpt'\r
tClLCD			equ PROGTOK+19 ;E1h 'ClLCD'\r
tConst			equ PROGTOK+20 ;E2h 'Fill'\r
tSortA			equ PROGTOK+21 ;E3h 'sortA_'\r
tSortD			equ PROGTOK+22 ;E4h 'sortD_'\r
tDispTab		equ PROGTOK+23 ;E5h 'Disp Table\r
tMenu			equ PROGTOK+24 ;E6h 'Menu'\r
tSendMBL		equ PROGTOK+25 ;E7h 'SEND'\r
tGetMBL			equ PROGTOK+26 ;E8h 'GET'\r
\r
;Stat Plot Commands\r
;-----------------------------------------------------\r
statPCmd		equ PROGTOK+27\r
tPlotOn			equ statPCmd ;E9h ' PLOTSON'\r
tPlotOff		equ statPCmd+1 ;EAh ' PLOTSOFF\r
tListName		equ 0EBh ;LIST DESignATOR\r
tPlot1			equ 0ECh\r
tPlot2			equ 0EDh\r
tPlot3			equ 0EEh\r
tUnused01		equ 0EFh ;available?\r
tPower			equ 0F0h ;'^'\r
tXRoot			equ 0F1h ;LsupX,Lroot\r
STATCMD			equ 0F2h\r
tOneVar			equ STATCMD ;F2h 'OneVar_'\r
tTwoVar			equ STATCMD+1 ;F3h\r
tLR			equ STATCMD+2 ;F4h 'LinR(A+BX\r
tLRExp			equ STATCMD+3 ;F5h 'ExpR_'\r
tLRLn			equ STATCMD+4 ;F6h 'LnR_'\r
tLRPwr			equ STATCMD+5 ;F7h 'PwrR_'\r
tMedMed			equ STATCMD+6 ;F8h\r
tQuad			equ STATCMD+7 ;F9h\r
tClrLst			equ STATCMD+8 ;FAh 'CLEAR LIST\r
tClrTbl			equ STATCMD+9 ;FBh CLEAR TABLE\r
tHist			equ STATCMD+10 ;FCh 'Hist_'\r
txyLine			equ STATCMD+11 ;FDh 'xyline_'\r
tScatter		equ STATCMD+12 ;FEh 'Scatter_'\r
tLR1			equ STATCMD+13 ;FFh 'LINR(AX+B\r
\r
;2nd Half Of Graph Format Tokens\r
;Format settings commands\r
;---------------------------------------------\r
GFMT			equ 00h\r
tSeq			equ GFMT ; 'SeqG'\r
tSimulG			equ GFMT+1 ; 'SimulG'\r
tPolarG			equ GFMT+2 ; 'PolarGC'\r
tRectG			equ GFMT+3 ; 'RectGC'\r
tCoordOn		equ GFMT+4 ; 'CoordOn'\r
tCoordOff		equ GFMT+5 ; 'CoordOff'\r
tDrawLine		equ GFMT+6 ; 'DrawLine'\r
tDrawDot		equ GFMT+7 ; 'DrawDot'\r
tAxisOn			equ GFMT+8 ; 'AxesOn'\r
tAxisOff		equ GFMT+9 ; 'AxesOff'\r
tGridOn			equ GFMT+10 ; 'GridOn'\r
tGridOff		equ GFMT+11 ; 'GridOff'\r
tLblOn			equ GFMT+12 ; 'LabelOn'\r
tLblOff			equ GFMT+13 ; 'LabelOff'\r
tWebOn			equ GFMT+14 ; 'WebOn'\r
tWebOff			equ GFMT+15 ; 'WebOFF'\r
tuv			equ GFMT+16 ; U vs V\r
tvw			equ GFMT+17 ; V vs W\r
tuw			equ GFMT+18 ; U vs W\r
\r
;2nd Half Of User Matrix Tokens\r
;-------------------------------------\r
tMatA			equ 00h ;MAT A\r
tMatB			equ 01h ;MAT B\r
tMatC			equ 02h ;MAT C\r
tMatD			equ 03h ;MAT D\r
tMatE			equ 04h ;MAT E\r
tMatF			equ 05h ;MAT F\r
tMatG			equ 06h ;MAT G\r
tMatH			equ 07h ;MAT H\r
tMatI			equ 08h ;MAT I\r
tMatJ			equ 09h ;MAT J\r
\r
;2nd Half Of User List Tokens\r
;--------------------------------------\r
tL1			equ 00h ;LIST 1\r
tL2			equ 01h ;LIST 2\r
tL3			equ 02h ;LIST 3\r
tL4			equ 03h ;LIST 4\r
tL5			equ 04h ;LIST 5\r
tL6			equ 05h ;LIST 6\r
\r
;2nd Half Of User Equation Tokens\r
;----------------------------------\r
;  "Y" EQUATIONS HAVE BIT 4 SET\r
;\r
tY1			equ 10h ;Y1\r
tY2			equ 11h ;Y2\r
tY3			equ 12h ;Y3\r
tY4			equ 13h ;Y4\r
tY5			equ 14h ;Y5\r
tY6			equ 15h ;Y6\r
tY7			equ 16h ;Y7\r
tY8			equ 17h ;Y8\r
tY9			equ 18h ;Y9\r
tY0			equ 19h ;Y0\r
\r
;Param Equations Have Bit 5 Set\r
;-----------------------------------\r
tX1T			equ 20h ;X1t\r
tY1T			equ 21h ;Y1t\r
tX2T			equ 22h ;X2t\r
tY2T			equ 23h ;Y2t\r
tX3T			equ 24h ;X3t\r
tY3T			equ 25h ;Y3t\r
tX4T			equ 26h ;X4t\r
tY4T			equ 27h ;Y4t\r
tX5T			equ 28h ;X5t\r
tY5T			equ 29h ;Y5t\r
tX6T			equ 2Ah ;X6t\r
tY6T			equ 2Bh ;Y6t\r
\r
;Polar Equations Have Bit 6 Set\r
;----------------------------------\r
tR1			equ 40h ;R1\r
tR2			equ 41h ;R2\r
tR3			equ 42h ;R3\r
tR4			equ 43h ;R4\r
tR5			equ 44h ;R5\r
tR6			equ 45h ;R6\r
\r
;Recursion Equations Have Bit 7 Set\r
;----------------------------------\r
tun			equ 80h ;Un\r
tvn			equ 81h ;Vn\r
twn			equ 82h ;Wn\r
\r
;2nd Half User Picture Tokens\r
;------------------------------------\r
tPic1			equ 00h ;PIC1\r
tPic2			equ 01h ;PIC2\r
tPic3			equ 02h ;PIC3\r
tPic4			equ 03h ;PIC4\r
tPic5			equ 04h ;PIC5\r
tPic6			equ 05h ;PIC6\r
tPic7			equ 06h ;PIC7\r
tPic8			equ 07h ;PIC8\r
tPic9			equ 08h ;PIC9\r
tPic0			equ 09h ;PIC0\r
\r
;2nd Half User Graph Database Tokens\r
;------------------------------------\r
tGDB1			equ 00h ;GDB1\r
tGDB2			equ 01h ;GDB2\r
tGDB3			equ 02h ;GDB3\r
tGDB4			equ 03h ;GDB4\r
tGDB5			equ 04h ;GDB5\r
tGDB6			equ 05h ;GDB6\r
tGDB7			equ 06h ;GDB7\r
tGDB8			equ 07h ;GDB8\r
tGDB9			equ 08h ;GDB9\r
tGDB0			equ 09h ;GDB0\r
\r
;2nd Half Of String Vars\r
;------------------------------\r
tStr1			equ 00h\r
tStr2			equ 01h\r
tStr3			equ 02h\r
tStr4			equ 03h\r
tStr5			equ 04h\r
tStr6			equ 05h\r
tStr7			equ 06h\r
tStr8			equ 07h\r
tStr9			equ 08h\r
tStr0			equ 09h\r
\r
;2nd Half Of System Output Only Variables\r
;----------------------------------------------------------------\r
;OPEN			equ 00h\r
tRegEq			equ 01h ;REGRESSION EQUATION\r
tStatN			equ 02h ;STATISTICS N\r
tXMean			equ 03h ;X MEAN\r
tSumX			equ 04h ;SUM(X)\r
tSumXSqr		equ 05h ;SUM(X^2)\r
tStdX			equ 06h ;STANDARD DEV X\r
tStdPX			equ 07h ;STANDARD DEV POP X\r
tMinX			equ 08h ;Min X VALUE\r
tMaxX			equ 09h ;Max X VALUE\r
tMinY			equ 0Ah ;Min Y VALUE\r
tMaxY			equ 0Bh ;Max Y VALUE\r
tYmean			equ 0Ch ;Y MEAN\r
tSumY			equ 0Dh ;SUM(Y)\r
tSumYSqr		equ 0Eh ;SUM(Y^2)\r
tStdY			equ 0Fh ;STANDARD DEV Y\r
tStdPY			equ 10h ;STANDARD DEV POP Y\r
tSumXY			equ 11h ;SUM(XY)\r
tCorr			equ 12h ;CORRELATION\r
tMedX			equ 13h ;MED(X)\r
tQ1			equ 14h ;1ST QUADRANT OF X\r
tQ3			equ 15h ;3RD QUADRANT OF X\r
tQuadA			equ 16h ;1ST TERM OF QUAD POLY REG/ Y-INT\r
tQuadB			equ 17h ;2ND TERM OF QUAD POLY REG/ SLOPE\r
tQuadC			equ 18h ;3RD TERM OF QUAD POLY REG\r
tCubeD			equ 19h ;4TH TERM OF CUBIC POLY REG\r
tQuartE			equ 1Ah ;5TH TERM OF QUART POLY REG\r
tMedX1			equ 1Bh ;x1 FOR MED-MED\r
tMedX2			equ 1Ch ;x2 FOR MED-MED\r
tMedX3			equ 1Dh ;x3 FOR MED-MED\r
tMedY1			equ 1Eh ;y1 FOR MED-MED\r
tMedY2			equ 1Fh ;y2 FOR MED-MED\r
tMedY3			equ 20h ;y3 FOR MED-MED\r
tRecurn			equ 21h	;RECURSION N\r
tStatP			equ 22h\r
tStatZ			equ 23h\r
tStatT			equ 24h\r
tStatChi		equ 25h\r
tStatF			equ 26h\r
tStatDF			equ 27h\r
tStatPhat		equ 28h\r
tStatPhat1		equ 29h\r
tStatPhat2		equ 2Ah\r
tStatMeanX1		equ 2Bh\r
tStatStdX1		equ 2Ch\r
tStatN1			equ 2Dh\r
tStatMeanX2		equ 2Eh\r
tStatStdX2		equ 2Fh\r
tStatN2			equ 30h\r
tStatStdXP		equ 31h\r
tStatLower		equ 32h\r
tStatUpper		equ 33h\r
tStat_s			equ 34h\r
tLRSqr			equ 35h ;r^2\r
tBRSqr			equ 36h ;R^2\r
\r
;These next tokens are only used to access the data\r
;they are display only and the user cannot access them at all\r
;------------------------------------------------------------\r
tF_DF			equ 37h ;ANOFAV FACTOR DF\r
tF_SS			equ 38h ;ANOFAV FACTOR SS\r
tF_MS			equ 39h ;ANOFAV FACTOR MS\r
tE_DF			equ 3Ah ;ANOFAV ERROR DF\r
tE_SS			equ 3Bh ;ANOFAV ERROR SS\r
tE_MS			equ 3Ch ;ANOFAV ERROR MS\r
\r
;2nd Half Of System Input/Output Variables\r
;------------------------------------------------\r
;		SYSTEM VARIABLE EQUATES\r
;\r
tuXscl			equ 0\r
tuYscl			equ 1\r
tXscl			equ 2\r
tYscl			equ 3\r
tRecuru0		equ 4 ;U 1ST INITIAL COND\r
tRecurv0		equ 5 ;V 1ST INITIAL COND\r
tun1			equ 6 ;U(N-1); NOT USED\r
tvn1			equ 7 ;V(N-1); NOT USED\r
tuRecuru0		equ 8 ;\r
tuRecurv0		equ 9 ;\r
tXmin			equ 0Ah\r
tXmax			equ 0Bh\r
tYmin			equ 0Ch\r
tYmax			equ 0Dh\r
tTmin			equ 0Eh\r
tTmax			equ 0Fh\r
tThetaMin		equ 10h\r
tThetaMax		equ 11h\r
tuXmin			equ 12h\r
tuXmax			equ 13h\r
tuYmin			equ 14h\r
tuYmax			equ 15h\r
tuThetMin		equ 16h\r
tuThetMax		equ 17h\r
tuTmin			equ 18h\r
tuTmax			equ 19h\r
tTblMin			equ 1Ah\r
tPlotStart		equ 1Bh\r
tuPlotStart		equ 1Ch\r
tnMax			equ 1Dh\r
tunMax			equ 1Eh\r
tnMin			equ 1Fh\r
tunMin			equ 20h\r
tTblStep		equ 21h\r
tTStep			equ 22h\r
tThetaStep		equ 23h\r
tuTStep			equ 24h\r
tuThetStep		equ 25h\r
tDeltaX			equ 26h\r
tDeltaY			equ 27h\r
tXFact			equ 28h\r
tYFact			equ 29h\r
tTblInput		equ 2Ah\r
tFinN			equ 2Bh\r
tFinI			equ 2Ch\r
tFinPV			equ 2Dh\r
tFinPMT			equ 2Eh\r
tFinFV			equ 2Fh\r
tFinPY			equ 30h\r
tFinCY			equ 31h\r
tRecurw0		equ 32h ;w0(1)\r
tuRecurw0		equ 33h\r
tPlotStep		equ 34h\r
tuPlotStep		equ 35h\r
tXres			equ 36h\r
tuXres			equ 37h\r
tRecuru02		equ 38h ;u0(2)\r
tuRecuru02		equ 39h\r
tRecurv02		equ 3Ch ;v0(2)\r
tuRecurv02		equ 3Dh\r
tRecurw02		equ 3Eh ;w0(2)\r
tuRecurw02		equ 3Fh\r
\r
;2nd Byte Of t2ByteTok Tokens\r
;------------------------------\r
tFinNPV			equ 00h\r
tFinIRR			equ 01h\r
tFinBAL			equ 02h\r
tFinPRN			equ 03h\r
tFinINT			equ 04h\r
tFinToNom		equ 05h\r
tFinToEff		equ 06h\r
tFinDBD			equ 07h\r
tLCM			equ 08h\r
tGCD			equ 09h\r
tRandInt		equ 0Ah\r
tRandBin		equ 0Bh\r
tSubStrng		equ 0Ch\r
tStdDev			equ 0Dh\r
tVariance		equ 0Eh\r
tInStrng		equ 0Fh\r
tDNormal		equ 10h\r
tInvNorm		equ 11h\r
tDT			equ 12h\r
tChI			equ 13h\r
tDF			equ 14h\r
tBINPDF			equ 15h\r
tBINCDF			equ 16h\r
tPOIPDF			equ 17h\r
tPOICDF			equ 18h\r
tGEOPDF			equ 19h\r
tGEOCDF			equ 1Ah\r
tNormalPDF		equ 1Bh\r
tTPDF			equ 1Ch\r
tChiPDF			equ 1Dh\r
tFPDF			equ 1Eh\r
tRandNorm		equ 1Fh\r
tFinFPMT		equ 20h\r
tFinFI			equ 21h\r
tFinFPV			equ 22h\r
tFinFN			equ 23h\r
tFinFFV			equ 24h\r
tConj			equ 25h\r
tReal			equ 26h\r
tImag			equ 27h\r
tAngle			equ 28h\r
tCumSum			equ 29h\r
tExpr			equ 2Ah\r
tLength			equ 2Bh\r
tDeltaLst		equ 2Ch\r
tRef			equ 2Dh\r
tRRef			equ 2Eh\r
tToRect			equ 2Fh\r
tToPolar		equ 30h\r
tConste			equ 31h\r
tSinReg			equ 32h\r
tLogistic		equ 33h\r
tLinRegTTest		equ 34h\r
tShadeNorm		equ 35h\r
tShadeT			equ 36h\r
tShadeChi		equ 37h\r
tShadeF			equ 38h\r
tMatToLst		equ 39h\r
tLstToMat		equ 3Ah\r
tZTest			equ 3Bh\r
tTTest			equ 3Ch\r
t2SampZTest		equ 3Dh\r
t1PropZTest		equ 3Eh\r
t2PropZTest		equ 3Fh\r
tChiTest		equ 40h\r
tZIntVal		equ 41h\r
t2SampZInt		equ 42h\r
t1PropZInt		equ 43h\r
t2PropZInt		equ 44h\r
tGraphStyle		equ 45h\r
t2SampTTest		equ 46h\r
t2SampFTest		equ 47h\r
tTIntVal		equ 48h\r
t2SampTInt		equ 49h\r
tSetupLst		equ 4Ah\r
tFinPMTend		equ 4Bh\r
tFinPMTbeg		equ 4Ch\r
tRealM			equ 4Dh\r
tPolarM			equ 4Eh\r
tRectM			equ 4Fh\r
tExprOn			equ 50h\r
tExprOff		equ 51h\r
tClrAllLst		equ 52h\r
tGetCalc		equ 53h\r
tDelVar			equ 54h\r
tEquToStrng		equ 55h\r
tStrngToequ 		equ 56h\r
tDelLast		equ 57h\r
tSelect			equ 58h\r
tANOVA			equ 59h\r
tModBox			equ 5Ah\r
tNormProb		equ 5Bh\r
tMGT			equ 64h ;VERTICAL SPLIT\r
tZFit			equ 65h ;ZOOM FIT\r
tDiag_on		equ 66h ;DIANOSTIC DISPLAY ON\r
tDiag_off		equ 67h ;DIANOSTIC DISPLAY OFF\r
tOkEnd2v0		equ 67h ;end of 2byte tokens for version 0.\r
tArchive		equ 68h ;archive\r
tUnarchive		equ 69h ;unarchive\r
tasm			equ 6Ah\r
tasmComp		equ 6Bh	;asm compile\r
tasmPrgm		equ 6Ch	;Signifies a program is asm\r
tasmCmp			equ 6Dh	;asm program is compiled\r
tLcapAAcute		equ 6Eh\r
tLcapAGrave		equ 6Fh\r
tLcapACaret		equ 70h\r
tLcapADier		equ 71h\r
tLaAcute		equ 72h\r
tLaGrave		equ 73h\r
tLaCaret		equ 74h\r
tLaDier			equ 75h\r
tLcapEAcute		equ 76h\r
tLcapEGrave		equ 77h\r
tLcapECaret		equ 78h\r
tLcapEDier		equ 79h\r
tLeAcute		equ 7Ah\r
tLeGrave		equ 7Bh\r
tLeCaret		equ 7Ch\r
tLeDier			equ 7Dh\r
tLcapIGrave		equ 7Fh\r
tLcapICaret		equ 80h\r
tLcapIDier		equ 81h\r
tLiAcute		equ 82h\r
tLiGrave		equ 83h\r
tLiCaret		equ 84h\r
tLiDier			equ 85h\r
tLcapOAcute		equ 86h\r
tLcapOGrave		equ 87h\r
tLcapOCaret		equ 88h\r
tLcapODier		equ 89h\r
tLoAcute		equ 8Ah\r
tLoGrave		equ 8Bh\r
tLoCaret		equ 8Ch\r
tLoDier			equ 8Dh\r
tLcapUAcute		equ 8Eh\r
tLcapUGrave		equ 8Fh\r
tLcapUCaret		equ 90h\r
tLcapUDier		equ 91h\r
tLuAcute		equ 92h\r
tLuGrave		equ 93h\r
tLuCaret		equ 94h\r
tLuDier			equ 95h\r
tLcapCCed		equ 96h\r
tLcCed			equ 97h\r
tLcapNTilde		equ 98h\r
tLnTilde		equ 99h\r
tLaccent		equ 9Ah\r
tLgrave			equ 9Bh\r
tLdieresis		equ 9Ch\r
tLquesDown		equ 9Dh\r
tLexclamDown		equ 9Eh\r
tLalpha			equ 9Fh\r
tLbeta			equ 0A0h\r
tLgamma			equ 0A1h\r
tLcapDelta		equ 0A2h\r
tLdelta			equ 0A3h\r
tLepsilon		equ 0A4h\r
tLlambda		equ 0A5h\r
tLmu			equ 0A6h\r
tLpi			equ 0A7h\r
tLrho			equ 0A8h\r
tLcapSigma		equ 0A9h\r
tLphi			equ 0ABh\r
tLcapOmega		equ 0ACh\r
tLphat			equ 0ADh\r
tLchi			equ 0AEh\r
tLstatF			equ 0AFh\r
tLa			equ 0B0h\r
tLb			equ 0B1h\r
tLc			equ 0B2h\r
tLd			equ 0B3h\r
tLsmalle		equ 0B4h\r
tLf			equ 0B5h\r
tLsmallg		equ 0B6h\r
tLh			equ 0B7h\r
tLi			equ 0B8h\r
tLj			equ 0B9h\r
tLk			equ 0BAh\r
tLl			equ 0BCh\r
tLm			equ 0BDh\r
tLsmalln		equ 0BEh\r
tLo			equ 0BFh\r
tLp			equ 0C0h\r
tLq			equ 0C1h\r
tLsmallr		equ 0C2h\r
tLs			equ 0C3h\r
tLsmallt		equ 0C4h\r
tLu			equ 0C5h\r
tLv			equ 0C6h\r
tLw			equ 0C7h\r
tLx			equ 0C8h\r
tLy			equ 0C9h\r
tLz			equ 0CAh\r
tLsigma			equ 0CBh\r
tLtau			equ 0CCh\r
tLcapIAcute		equ 0CDh\r
tGarbagec		equ 0CEh\r
LastToken		equ 0CEh ;tLAST TOKEN IN THIS VERSION...\r
\r
;Data Type Equates												\r
;---------------------------------------------------------------------\r
RealObj			equ 0\r
ListObj			equ 1\r
MatObj			equ 2\r
EquObj			equ 3\r
StrngObj		equ 4\r
ProgObj			equ 5\r
ProtProgObj		equ 6\r
PictObj			equ 7\r
GDBObj			equ 8\r
UnknownObj		equ 9\r
UnknownEquObj		equ 0Ah\r
NewEquObj		equ 0Bh\r
CplxObj			equ 0Ch\r
CListObj		equ 0Dh\r
UndefObj		equ 0Eh\r
WindowObj		equ 0Fh\r
ZStoObj			equ 10h\r
TblRngObj		equ 11h\r
LCDObj			equ 12h\r
BackupObj		equ 13h\r
AppObj			equ 14h	;application, only used in menus/link\r
AppVarObj		equ 15h	;application variable\r
TempProgObj		equ 16h ;program, home deletes when finished\r
GroupObj		equ 17h ;group.\r
\r
;System Error Codes												\r
;-----------------------------------------------------------\r
E_EDITF			equ 7 ;allow re-entering application\r
E_EDIT			equ 1<<E_EDITF\r
E_Mask			equ 7Fh\r
E_Overflow		equ 1+E_EDIT\r
E_DivBy0		equ 2+E_EDIT\r
E_SingularMat		equ 3+E_EDIT\r
E_Domain		equ 4+E_EDIT\r
E_Increment		equ 5+E_EDIT\r
E_Break			equ 6+E_EDIT\r
E_NonReal		equ 7+E_EDIT\r
E_Syntax		equ 8+E_EDIT\r
E_DataType		equ 9+E_EDIT\r
E_Argument		equ 10+E_EDIT\r
E_DimMismatch		equ 11+E_EDIT\r
E_Dimension		equ 12+E_EDIT\r
E_Undefined		equ 13+E_EDIT\r
E_Memory		equ 14+E_EDIT		; 142\r
E_Invalid		equ 15+E_EDIT		; 143\r
E_IllegalNest		equ 16+E_EDIT		; 144\r
E_Bound			equ 17+E_EDIT		; 145\r
E_GraphRange		equ 18+E_EDIT		; 146\r
E_Zoom			equ 19+E_EDIT		; 147\r
E_Label			equ 20			; 148\r
E_Stat			equ 21			; 149\r
E_Solver		equ 22+E_EDIT\r
E_Singularity		equ 23+E_EDIT\r
E_SignChange		equ 24+E_EDIT\r
E_Iterations		equ 25+E_EDIT\r
E_BadGuess		equ 26+E_EDIT\r
E_StatPlo		equ 27\r
E_TolTooSmall		equ 28+E_EDIT\r
E_Reserved		equ 29+E_EDIT\r
E_Mode			equ 30+E_EDIT\r
E_LnkErr		equ 31+E_EDIT\r
E_LnkMemErr		equ 32+E_EDIT\r
E_LnkTransErr		equ 33+E_EDIT\r
E_LnkDupErr		equ 34+E_EDIT\r
E_LnkMemFull		equ 35+E_EDIT\r
E_Unknown		equ 36+E_EDIT\r
E_Scale			equ 37+E_EDIT\r
E_IdNotFound		equ 38\r
E_NoMode		equ 39+E_EDIT\r
E_Validation		equ 40\r
E_Length		equ 41+E_EDIT\r
E_Application		equ 42+E_EDIT\r
E_AppErr1		equ 43+E_EDIT\r
E_AppErr2		equ 44+E_EDIT\r
E_ExpiredApp		equ 45\r
E_BadAdd		equ 46\r
E_Archived		equ 47+E_EDIT\r
E_Version		equ 48\r
E_ArchFull		equ 49\r
E_Variable		equ 50+E_EDIT\r
E_Duplicate		equ 51+E_EDIT\r
\r
;System Variable Equates\r
;------------------------------\r
XSCLt			equ 02h\r
YSCLt			equ 03h\r
XMINt			equ 0Ah\r
XMAXt			equ 0Bh\r
YMINt			equ 0Ch\r
YMAXt			equ 0Dh\r
TMINt			equ 0Eh\r
TMAXt			equ 0Fh\r
THETMINt		equ 10h\r
THETMAXt		equ 11h\r
TBLMINt			equ 1Ah\r
PLOTSTARTt		equ 1Bh\r
NMAXt			equ 1Dh\r
NMINt			equ 1Fh\r
TBLSTEPt		equ 21h\r
TSTEPt			equ 22h\r
THETSTEPt		equ 23h\r
DELTAXt			equ 26h\r
DELTAYt			equ 27h\r
XFACTt			equ 28h\r
YFACTt			equ 29h\r
FINNt			equ 2Bh\r
FINIt			equ 2Ch\r
FINPVt			equ 2Dh\r
FINPMTt			equ 2Eh\r
FINFVt			equ 2Fh\r
FINPYt			equ 30h\r
FINCYt			equ 31h\r
PLOTSTEPt		equ 34h\r
XRESt			equ 36h\r
\r
;Equates To RAM Locations For Stat Vars\r
;----------------------------------------------------------------\r
FPLEN			equ 9 ;Length of a floating-point number.\r
StatN			equ statVars\r
XMean			equ StatN + FPLEN\r
SumX			equ XMean + FPLEN\r
SumXSqr			equ SumX + FPLEN\r
StdX			equ SumXSqr + FPLEN\r
StdPX			equ StdX + FPLEN\r
MinX			equ StdPX + FPLEN\r
MaxX			equ MinX + FPLEN\r
MinY			equ MaxX + FPLEN\r
MaxY			equ MinY + FPLEN\r
YMean			equ MaxY + FPLEN\r
SumY			equ YMean + FPLEN\r
SumYSqr			equ SumY + FPLEN\r
StdY			equ SumYSqr + FPLEN\r
StdPY			equ StdY + FPLEN\r
SumXY			equ StdPY + FPLEN\r
Corr			equ SumXY + FPLEN\r
MedX			equ Corr + FPLEN\r
Q1			equ MedX + FPLEN\r
Q3			equ Q1 + FPLEN\r
QuadA			equ Q3 + FPLEN\r
QuadB			equ QuadA + FPLEN\r
QuadC			equ QuadB + FPLEN\r
CubeD			equ QuadC + FPLEN\r
QuartE			equ CubeD + FPLEN\r
MedX1			equ QuartE + FPLEN\r
MedX2			equ MedX1 + FPLEN\r
MedX3			equ MedX2 + FPLEN\r
MedY1			equ MedX3 + FPLEN\r
MedY2			equ MedY1 + FPLEN\r
MedY3			equ MedY2 + FPLEN\r
PStat			equ MedY3 + 2*FPLEN\r
ZStat			equ PStat + FPLEN\r
TStat			equ ZStat + FPLEN\r
ChiStat			equ TStat + FPLEN\r
FStat			equ ChiStat + FPLEN\r
DF			equ FStat + FPLEN\r
Phat			equ DF + FPLEN\r
Phat1			equ Phat + FPLEN\r
Phat2			equ Phat1 + FPLEN\r
MeanX1			equ Phat2 + FPLEN\r
StdX1			equ MeanX1 + FPLEN\r
StatN1			equ StdX1 + FPLEN\r
MeanX2			equ StatN1 + FPLEN\r
StdX2			equ MeanX2 + FPLEN\r
StatN2			equ StdX2 + FPLEN\r
StdXP2			equ StatN2 + FPLEN\r
SLower			equ StdXP2 + FPLEN\r
SUpper			equ SLower + FPLEN\r
SStat			equ SUpper + FPLEN\r
F_DF			equ anovaf_vars\r
F_SS			equ F_DF + FPLEN\r
F_MS			equ F_SS + FPLEN\r
E_DF			equ F_MS + FPLEN\r
E_SS			equ E_DF + FPLEN\r
E_MS			equ E_SS + FPLEN\r
\r
;System Flags\r
;----------------------------------------------------------------------\r
ioDelFlag		equ 0h\r
inDelete		equ 0		;1 = DELETE SCREEN \r
\r
trigFlags		equ 0h	;Trigonometry mode settings\r
trigDeg			equ 2		;1=degrees, 0=radians\r
\r
kbdFlags		equ 0h	;Keyboard scan\r
kbdSCR			equ 3		;1=scan code ready\r
kbdKeyPress		equ 4		;1=key has been pressed\r
\r
doneFlags		equ 0h	;display "Done"\r
donePrgm		equ 5		;1=display "Done" after prgm\r
;----------------------------------------------------------------------\r
editFlags		equ 1h\r
editOpen		equ 2		;1=edit buffer is open\r
\r
ansFlags		equ 1\r
AnsScroll		equ 3		;1=answer can scroll, seems must be reset in order to move about edit buffer\r
\r
monFlags		equ 1h	 ;monitor flags\r
monAbandon		equ 4		;1=don't start any long process in put away (#715)\r
;----------------------------------------------------------------------\r
plotFlags		equ 2h	;plot generation flags\r
plotLoc 		equ 1		;0=bkup & display, 1=display only\r
plotDisp		equ 2		;1=plot is in display, 0=text in display, this also indicates whether graph is being shown or not\r
\r
grfModeFlags		equ 2h	;graph mode settings\r
grfFuncM		equ 4		;1=function graph\r
grfPolarM		equ 5		;1=polar graph\r
grfParamM		equ 6		;1=parametric graph\r
grfRecurM		equ 7		;1=RECURSION graph\r
;----------------------------------------------------------------------\r
graphFlags		equ 3h\r
graphDraw		equ 0		;0=graph is valid, 1=redraw graph(dirty)\r
graphCursor		equ 2\r
;----------------------------------------------------------------------\r
grfDBFlags		equ 4h\r
grfDot			equ 0		;0=line, 1=dot\r
grfSimul		equ 1		;0=sequential, 1=simultaneous\r
grfGrid 		equ 2		;0=no grid, 1=grid\r
grfPolar		equ 3		;0=rectangular, 1=polar coordinates\r
grfNoCoord		equ 4		;0=display coordinates, 1=off\r
grfNoAxis		equ 5		;0=axis, 1=no axis\r
grfLabel		equ 6		;0=off, 1=axis label\r
;----------------------------------------------------------------------\r
textFlags		equ 5h	;Text output flags\r
textEraseBelow		equ 1		;1=erase line below small char\r
textScrolled		equ 2		;1=screen scrolled\r
textInverse		equ 3		;1=display inverse bit-map\r
textInsMode		equ 4		;0=overstrike, 1=insert mode\r
;----------------------------------------------------------------------\r
ParsFlag		equ 6h	;PARSER flags\r
;----------------------------------------------------------------------\r
ParsFlag2		equ 7h	;PARSER flags\r
numOP1			equ 0		;1=RESULT IN OP1, 0=NO RESULT\r
;----------------------------------------------------------------------\r
newDispF		equ 8h	;Derivative mode flags\r
preClrForMode		equ 0		;1=HELP BLINK ON MODE SCREEN\r
allowProgTokens		equ 1		;1=allow programming tokens to be parsed in BASIC programs\r
\r
apdFlags		equ 8h	;Automatic power-down\r
apdAble 		equ 2		;1=APD enabled\r
apdRunning		equ 3		;1=APD clock running\r
apdWarmStart		equ 4		;1=calculator is turning on from APD or power loss\r
;----------------------------------------------------------------------\r
web_err_mask		equ 60h\r
;----------------------------------------------------------------------\r
onFlags 		equ 9h	;on key flags\r
parseInput		equ 1		;1=parse input when done\r
onRunning		equ 3		;1=calculator is running\r
onInterrupt		equ 4		;1=on key interrupt request\r
\r
statFlags		equ 9h	;statistics flags\r
;unknown		equ 5		;unknown\r
statsValid		equ 6		;1=stats are valid\r
;----------------------------------------------------------------------\r
fmtFlags		equ 0Ah	;numeric format flags\r
fmtExponent		equ 0	 	;1=show exponent, 0=no exponent\r
fmtEng			equ 1	 	;1=engineering notion, 0=scientific\r
fmtHex			equ 2	 	;1=hexadecimal\r
fmtOct			equ 3	 	;1=octal\r
fmtBin			equ 4	 	;1=binary\r
\r
numMode			equ 0Ah\r
fmtReal			equ 5\r
fmtRect			equ 6\r
fmtPolar		equ 7\r
\r
realMode		equ 5\r
rectMode		equ 6\r
polarMode		equ 7\r
;					;if Hex and Oct both = 1\r
;					; then Bin=0 means >Frac\r
;					; Bin=1 means >DMS\r
fmtBaseMask		equ  00011100b	; mask to base flags\r
fmtBaseShift		equ  2		; offset to base flags\r
;\r
;       CHECK IF THESE ARE USED BY NUMFORM,\r
;\r
;               	equ  6\r
;               	equ  7\r
;----------------------------------------------------------------------\r
fmtOverride		equ 0Bh	;copy of fmtFlags with conversion override\r
;----------------------------------------------------------------------\r
fmtEditFlags		equ 0Ch	;numeric editing flags\r
fmtEdit			equ 0		;1=format number for editing\r
\r
curFlags		equ 0Ch	;Cursor\r
curAble 		equ 2		;1=cursor flash is enabled\r
curOn			equ 3		;1=cursor is showing\r
curLock 		equ 4		;1=cursor is locked off\r
\r
cmdFlags		equ 0Ch	;command editor flags\r
cmdVirgin		equ 5		;1=nothing has been typed in cmd bfr\r
;----------------------------------------------------------------------\r
appFlags		equ 0Dh	;application flags\r
appWantIntrpt		equ 0		;1=want ON key interrupts\r
appTextSave		equ 1		;1=save characters in textShadow\r
appAutoScroll		equ 2		;1=auto-scroll text on last line\r
appMenus		equ 3		;1=process keys that bring up menus, 0=check Lock menu flag\r
appLockMenus		equ 4		;1=ignore menu keys, 0=switch to home screen and bring up menu\r
appCurGraphic		equ 5		;1=graphic cursor\r
appCurWord		equ 6		;1=text cursor covers entire word\r
appExit 		equ 7		;1=application handles [EXIT] key itself\r
\r
appWantIntrptF		equ 1<<appWantIntrpt\r
appTextSaveF		equ 1<<appTextSave\r
appAutoScrollF		equ 1<<appAutoScroll\r
appMenusF		equ 1<<appMenus\r
appLockMenusF		equ 1<<appLockMenus\r
appCurGraphicF		equ 1<<appCurGraphic\r
appCurWordF		equ 1<<appCurWord\r
appExitF		equ 1<<appExit\r
;----------------------------------------------------------------------\r
rclFlag			equ 0Eh	;OS recall queue flags\r
enableQueue		equ 7		;1 = enable recall queue\r
;----------------------------------------------------------------------\r
seqFlags		equ 0Fh	;Sequential Graph flags\r
webMode			equ 0		;0 = NORMAL SEQ MODE, 1 = WEB MODE\r
webVert			equ 1\r
sequv			equ 2		;U vs V\r
seqvw			equ 3		;V vs W\r
sequw			equ 4		;U vs W\r
;----------------------------------------------------------------------\r
promptFlags		equ 11h	;prompt line flags\r
promptEdit		equ 0		;1=editing in prompt buffer\r
;----------------------------------------------------------------------\r
indicFlags		equ 12h	;Indicator flags\r
indicRun		equ 0		;1=run indicator ON\r
indicInUse		equ 1		;indicator save area in use=1, free=0 ;resetting will disable 2nd while in _getkey\r
indicOnly		equ 2		;interrupt handler only checks run indicator\r
\r
shiftFlags		equ 12h	;[2nd] and [ALPHA] flags\r
shift2nd		equ 3		;1=[2nd] has been pressed\r
shiftAlpha		equ 4		;1=[ALPHA] has been pressed\r
shiftLwrAlph		equ 5		;1=lower case, 0=upper case\r
shiftALock		equ 6		;1=alpha lock has been pressed\r
shiftKeepAlph		equ 7		;1=cannot cancel alpha shift\r
;----------------------------------------------------------------------\r
tblFlags		equ 13h	;table flags.\r
autoFill		equ 4		;1=prompt, 0=fillAuto\r
autoCalc		equ 5		;1=prompt, 0=CalcAuto\r
reTable			equ 6		;0=table is okay, 1=must recompute table.\r
;----------------------------------------------------------------------\r
sGrFlags		equ 14h\r
grfSplit		equ 0		;1=Split Graph, 0=Normal\r
vertSplit		equ 1		;1=Vertical (left-right) Split\r
grfSChanged		equ 2		;1=Graph just changed Split <-> normal\r
grfSplitOverride	equ 3		;1 = ignore graph split flag if set\r
write_on_graph		equ 4		;1 = TEXT OR EQU WRITING TO GRAPH SCREEN\r
g_style_active		equ 5		;1 = GRAPH STYLES ARE ENABLED, USE THEM\r
cmp_mod_box		equ 6		;1 = DOING MOD BOX PLOT COMPUTATION\r
textWrite		equ 7\r
;----------------------------------------------------------------------\r
newIndicFlags		equ 15h\r
extraIndic		equ 0\r
saIndic			equ 1\r
;3 has something to do with stat/list editor\r
;----------------------------------------------------------------------\r
interruptFlags		equ 16h\r
secondTimerEnabled	equ 0		;1 = second hardware timer enabled\r
batteryFlags		equ 16h\r
batteriesGood		equ 2		;1 = batteries good, I think this being reset will force the calc to shut off, used in USB error handler\r
;----------------------------------------------------------------------\r
smartFlags		equ 17h\r
smarter_mask		equ 3\r
smarter_test		equ 1\r
smartGraph		equ 0\r
smartGraph_inv		equ 1\r
;----------------------------------------------------------------------\r
traceFlags		equ 18h\r
grfExpr			equ 0		;set to hide expression while tracing\r
;----------------------------------------------------------------------\r
;There is a flag 19h.\r
;----------------------------------------------------------------------\r
statFlags2		equ 1Ah\r
statDiagnosticsOn	equ 0		;1 = stat diagnostics on\r
;----------------------------------------------------------------------\r
linkFlags		equ 1Bh\r
IDis95h			equ 1		;1 = link routines use machine ID 95h (CBL)\r
IDis82h			equ 2		;1 = link routines use machine ID 82h (TI-82)\r
IDis83h			equ 3		;1 = link routines use machine ID 83h (TI-83)\r
IDis03h			equ 4		;1 = link routines use machine ID 03h (PC to TI-83)\r
USBenabled		equ 5		;1 = use USB port first, or at least try to\r
;----------------------------------------------------------------------\r
;There is a flag 1Ch (stats-related).\r
;----------------------------------------------------------------------\r
;There is a flag 1Dh.\r
;----------------------------------------------------------------------\r
;There is a flag 1Eh.\r
;----------------------------------------------------------------------\r
varTypeMask		equ 1Fh	;is this a flag byte? yes\r
varGraphRef		equ 6\r
;----------------------------------------------------------------------\r
graphFlags2		equ 1Fh\r
splitOverride		equ 3		;0 = force full screen with ParseInp, or something\r
;----------------------------------------------------------------------\r
asm_Flag1		equ 21h	;ASM CODING\r
asm_Flag2		equ 22h	;ASM CODING\r
asm_Flag3		equ 23h	;ASM CODING\r
;----------------------------------------------------------------------\r
arcFlag			equ 24h\r
checkBatteryLevelFirst	equ 0		;1 = check battery levels in Arc_Unarc first and throw error if low\r
\r
getSendFlg		equ 24h\r
comFailed		equ 1		;1 = Get/Send Communication Failed\r
\r
selfTestFlag		equ 24h\r
resetOnPowerOn		equ 2		;1 = Force RAM reset when APD disabled on next power on\r
\r
appLwrCaseFlag		equ 24h\r
lwrCaseActive		equ 3\r
;----------------------------------------------------------------------\r
contextFlags		equ 25h\r
nocxPutAway		equ 5		;1 = do not call cxPutAway routine\r
;----------------------------------------------------------------------\r
groupFlags		equ 26h ;used temporarily in Arc_Unarc\r
inGroup			equ 1		;1 = IN GROUP CONTEXT\r
noCompletionByte	equ 2		;1 = do not write 0FCh when calling Arc_Unarc, leave as 0FEh\r
noDataWrite		equ 3		;1 = do not write data when calling Arc_Unarc, nor size bytes\r
writeSizeBytesOnly	equ 5		;1 = only write size bytes when calling Arc_Unarc\r
;----------------------------------------------------------------------\r
;There is a flag 27h.\r
;----------------------------------------------------------------------\r
APIFlg			equ 28h\r
appAllowContext		equ 0           ;App wants context changes to happen\r
;1 set to ignore a key after returning from rawkeyhook\r
;2 set to send this key back?\r
;3\r
appRunning		equ 4		;app is currently running\r
;5\r
;6\r
appRetKeyOff		equ 7		;1 = GetKey returns kOff when [2nd]+[ON] pressed\r
;----------------------------------------------------------------------\r
apiFlg2			equ 29h\r
;----------------------------------------------------------------------\r
apiFlg3			equ 2Ah\r
;1 set means using small font?\r
;----------------------------------------------------------------------\r
apiFlg4			equ 2Bh\r
cellOverride		equ 1		;use cell override\r
fullScrnDraw		equ 2		;DRAW INTO LAST ROW/COL OF SCREEN\r
;----------------------------------------------------------------------\r
mouseFlag1		equ 2Ch\r
;----------------------------------------------------------------------\r
mouseFlag2		equ 2Dh ;might want to keep this always reset\r
;----------------------------------------------------------------------\r
xapFlag0		equ 2Eh	;external app flags, do not use 0,(iy+2Eh) (used by mouse routines)\r
xapFlag1		equ 2Fh\r
xapFlag2		equ 30h\r
xapFlag3		equ 31h\r
;----------------------------------------------------------------------\r
fontFlags		equ 32h\r
fracDrawLFont		equ 2\r
fracTallLFont		equ 3\r
customFont		equ 7\r
;----------------------------------------------------------------------\r
hookflags1		equ 33h ;also scriptFlag, rclFlag2, backGroundLink\r
alt_On			equ 0		;run ONSCRPT at startup\r
alt_Off			equ 1		;run OFFSCRPT at shutdown\r
useRclQueueEnd		equ 2		;1 = external mode\r
ignoreBPLink		equ 3		;1 = override flag for link activity hook\r
bPLinkOn		equ 4		;1 = link activity hook active\r
enableKeyEcho		equ 5		;1 = sends keypresses back to connected calc as remote control packets (with GetCSC vs. GetKey codes...really dumb, TI)\r
noTempDelete		equ 6		;1 = do not delete temporary programs at homescreen\r
;----------------------------------------------------------------------\r
hookflags2		equ 34h ;also sysHookFlg\r
getCSCHookActive	equ 0		;1 = GetCSC hook active\r
libraryHookActive	equ 1		;1 = library hook active\r
;2 This is set in the OS, but never referenced and the code is never executed\r
homescreenHookActive	equ 4		;1 = homescreen hook active\r
rawKeyHookActive	equ 5		;1 = raw key hook active\r
catalog2HookActive	equ 6		;1 = catalog 2 hook active\r
cursorHookActive	equ 7		;1 = cursor hook active\r
;----------------------------------------------------------------------\r
hookflags3		equ 35h ;also sysHookFlg1\r
tokenHookActive		equ 0		;1 = token hook active\r
localizeHookActive	equ 1		;1 = localize hook active\r
windowHookActive	equ 2		;1 = window hook active\r
graphHookActive		equ 3		;1 = graph hook active\r
yEquHookActive		equ 4		;1 = Y= hook active\r
fontHookActive		equ 5		;1 = font hook active\r
regraphHookActive	equ 6		;1 = regraph hook active\r
drawingHookActive	equ 7		;1 = drawing hook active\r
;----------------------------------------------------------------------\r
hookflags4		equ 36h ;also sysHookFlag2\r
traceHookActive		equ 0		;1 = trace hook active\r
parserHookActive	equ 1		;1 = parser hook active\r
appChangeHookActive	equ 2		;1 = app change hook active\r
catalog1HookActive	equ 3		;1 = catalog 1 hook active\r
helpHookActive		equ 4		;1 = help hook active\r
cxRedispHookActive	equ 5		;1 = cxRedisp hook active\r
menuHookActive		equ 6		;1 = menu hook active\r
silentLinkHookActive	equ 7		;1 = silent link hook active\r
;----------------------------------------------------------------------\r
;hookflags2Override	equ 37h		;set corresponding bit to kill iy+35h hook when executing app\r
;----------------------------------------------------------------------\r
;hookflags3Override	equ 38h		;set corresponding bit to kill iy+36h hook when executing app\r
;----------------------------------------------------------------------\r
;hookflags4Override	equ 39h		;set corresponding bit to kill iy+37h hook when executing app\r
;----------------------------------------------------------------------\r
;hookflags5		equ 3Ah\r
usbActivityHookActive	equ 0		;1 = USB activity hook active\r
;----------------------------------------------------------------------\r
plotFlag3		equ 3Ch  \r
bufferOnly		equ 0\r
useFastCirc		equ 4\r
;----------------------------------------------------------------------\r
dBKeyFlags		equ 3Dh\r
keyDefaultsF		equ 6		;1 = GetKey returns extended keycodes with TI-Keyboard\r
;----------------------------------------------------------------------\r
silentLinkFlags		equ 3Eh\r
silentLinkActive	equ 0		;1 = SE/84+ silent link is active\r
\r
extraHookFlags		equ 3Eh\r
checkCatalog2HookVer	equ 3		;1 = check catalog 2 hook's version before executing it (and error or take other action if so)\r
openLibActive		equ 4		;1 = OpenLib( was successfully called on a Flash application (ExecLib will error if zero)\r
;5\r
;----------------------------------------------------------------------\r
clockFlags		equ 3Fh\r
notMDYMode		equ 0		;0 = M/D/Y format\r
isYMDMode		equ 1		;1 = Y/M/D format\r
is24Hour		equ 2		;1 = clock in 24 hour mode\r
inAfternoon		equ 3		;1 = current time is in afternoon (PM) (I think)\r
useTokensInString	equ 4		;1 = use tokens instead of characters when displaying clock as string (for getTmStr and getDtStr vs. MODE screen) (keep this reset)\r
displayClock		equ 5		;1 = display clock (this is set every second, reset otherwise)\r
clockOn			equ 6		;1 = clock on\r
#endif\r
.list`;export{e as default};