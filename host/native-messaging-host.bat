@echo off 

python "%~dp0/native-messaging-host.py" %* 

::exe misbehaves when ran from here
::start /b "" "%~dp0/native-messaging-host.exe" %* > "%~dp0/native-host.log" 2>&1
::exit
