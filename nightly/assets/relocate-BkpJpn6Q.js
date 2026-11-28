var e=`#macro relocate(new_location)\r
 #ifdef old_location\r
   .echo "Zelda: ",__file,":",__line,": error: You cannot nest relocate blocks."\r
 #else\r
   #define old_location eval($)\r
   .org new_location\r
   #define g_location eval(new_location)\r
 #endif\r
#endmacro\r
\r
#macro endrelocate()\r
 #ifdef g_location\r
   .org $-g_location + old_location\r
   #undefine g_location\r
   #undefine old_location\r
 #else\r
   .echo "Error line ",__line,": No relocate statements corresponds to this endrelocate."\r
 #endif\r
#endmacro`;export{e as default};