var e=`; Fatal error macro. Displays message prefixed with "error" \r
; and returns with error code\r
#define fatal(str,return) .error str\r
#macro defpage(page, appname)\r
#if page = 0\r
  #ifndef gpage\r
    #define free_space 0\r
    #define gpage 0\r
    #ifndef appname\r
      .echo "Warning: No name given, using \\"Default\\""\r
      #define appname "Default"\r
    #endif\r
    .org $4000\r
    .db $80,$0F,0,0,0,0\r
    .db $80,$12,1,4\r
    .db $80,$21,1\r
    .db $80,$31,1\r
    .db $80,$48\r
\r
	#define gappname eval(appname)\r
\r
_   .db appname\r
    #define apnamlen eval($ - -_)\r
    echo_fill(apnamlen,"-","------------------------------------------")\r
    .echo "Beginning APP \\"",appname,"\\", courtesy of SPASM macros"\r
    echo_fill(apnamlen,"-","------------------------------------------")\r
\r
    #if apnamlen <= 8\r
      .fill 8-apnamlen,' '\r
    #else\r
      #define err "App name is ",apnamlen-8," character(s) too long."\r
      fatal(err,1)\r
    #endif\r
\r
    .db $80,$81,0\r
    .db $80,$90\r
    .db $03,$26,$09,$04,$04,$06f,$1b,$80\r
    .db $02,$0d,$40\r
    .db $a1,$6b,$99,$f6,$59,$bc,$67 \r
    .db $f5,$85,$9c,$09,$6c,$0f,$b4,$03,$9b,$c9 \r
    .db $03,$32,$2c,$e0,$03,$20,$e3,$2c,$f4,$2d \r
    .db $73,$b4,$27,$c4,$a0,$72,$54,$b9,$ea,$7c \r
    .db $3b,$aa,$16,$f6,$77,$83,$7a,$ee,$1a,$d4 \r
    .db $42,$4c,$6b,$8b,$13,$1f,$bb,$93,$8b,$fc\r
    .db $19,$1c,$3c,$ec,$4d,$e5,$75 \r
    .db $80,$7F,0,0,0,0\r
    .dw 0,0,0,0,0,0,0,0\r
  #else\r
    fatal("There was already a page 0.",1)\r
  #endif\r
#else\r
  #if ($ & $0000FFFF) > $8000\r
   #define err "Page ",gpage," went over bounds by ",$-$8000," bytes."\r
   fatal(err, 1)\r
  #endif\r
  #if page <= gpage\r
    fatal("Your page numbers must increase.")\r
  #endif\r
  #if page > gpage+1\r
    .echo "Warning: Skipping page ",gpage+1," at user request."\r
  #endif\r
  #define free_space eval(free_space + $8000-($ & $0000FFFF))\r
  .echo "Page ",gpage," free space: ",$8000-($ & $0000FFFF)\r
  .block ($8000-($ & $0000FFFF) + ((page-gpage-1)*$4000))\r
  #define gpage eval(page)\r
  .org $4000+(gpage*$10000)\r
#endif\r
#endmacro\r
	\r
#macro validate\r
#if ($ & $0000FFFF) > $8000\r
  #define err "Page ",gpage," went over bounds by ",$-$8000," bytes."\r
  fatal(err, 1)\r
#else\r
  .echo "Page ",gpage," free space: ",$8000-($ & $0000FFFF)\r
  #define free_space eval(free_space + $8000 - ($ & $0000FFFF))\r
  .echo "Success: Page sizes validated and \\"",gappname,"\\" is ready for signing."\r
  .echo "           In ",gpage+1," page(s), ",free_space," bytes are available."\r
#endif\r
#endmacro\r
\r
#macro echo_fill(times, char, base)\r
#if times > 0\r
 #define base base,char\r
 echo_fill(eval(times-1), char, base)\r
#else\r
 .echo base\r
#endif\r
#endmacro\r
\r
#define .defpage defpage(\r
#define .validate validate`;export{e as default};