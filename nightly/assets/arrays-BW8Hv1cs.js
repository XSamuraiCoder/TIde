var e=`#IFNDEF ARRAY_INC\r
#DEFINE ARRAY_INC\r
\r
#macro new_array(name)\r
  #define str_name concat("\\"",name,"\\"")\r
\r
  clr()\r
  wr("#define ",str_name,"(ind)  #define zind concat(\\"ind\\")\\\\ clr()\\\\ wr(\\"#define ",str_name,"(ind) \\\\\\\\ #define zind concat(\\\\\\"ind\\\\\\")\\\\ #if zind=\\",zind,\\"\\\\\\\\ ",str_name,"\\",zind,\\"\\\\\\\\ #else\\\\\\\\",str_name," #endif\\\\\\\\\\")\\\\ wr(\\"\\\\\\\\",str_name,"\\",zind)\\\\ #undefine zind\\\\ run()\\\\\\")\r
  run()\r
#endmacro\r
\r
#ENDIF\r
`;export{e as default};