
# import logging
# import subprocess
# import os

# def run_kcpp():
#     try:
#       print("run_kcpp func active")
#       #os.system('echo "test"')
#       subprocess.run("ls")
#     except Exception as e:
#         print(f"Error in test: {str(e)}")  

# run_kcpp()



# import os
# os.system('"host\koboldcpp_nocuda.exe"')
# cmd = '"./koboldcpp_nocuda.exe"'
# os.system(cmd)


import os
import subprocess
import logging
import sys

def run_kcpp():
    try:
        print("run_kcpp func active")
        # Use subprocess instead of os.system
        subprocess.Popen([r"C:\Users\Nachiket\Documents\Browserllama\host\koboldcpp_nocuda.exe"], 
                         creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == "win32" else 0)
        print("$$$$$$$$$$$run_kcpp after$$$$$$$$$$$$")
    except Exception as e:
        print(f"Error in kcpp: {str(e)}")

# Ensure this function is called early in your script
run_kcpp()