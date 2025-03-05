!include "MUI2.nsh"

!macro preInit
  ; 在安装时，将安装程序所在目录记录到注册表
  WriteRegStr HKCU "Software\${PRODUCT_NAME}" "InstallerPath" "$INSTDIR"
!macroend