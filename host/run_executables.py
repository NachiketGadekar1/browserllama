import subprocess
import sys
import os

def run_executable(exe, args, name):
    try:
        print(f"Starting {name}: {exe}")
        sys.stdout.flush()  # Force log flush
        # Only append arguments if provided
        cmd = [exe] + args if args else [exe]
        
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1)
        print(f"{name} started with PID: {process.pid}")
        sys.stdout.flush()  # Force log flush
        return process
    except Exception as e:
        print(f"Error starting {name}: {e}")
        sys.stdout.flush()  # Force log flush
        return None

def print_output(process, name):
    try:
        while process.poll() is None:
            output = process.stdout.readline()
            if output:
                print(f"{name}: {output.strip()}")
                sys.stdout.flush()  # Force log flush
        # Read any remaining output
        for line in process.stdout:
            print(f"{name}: {line.strip()}")
            sys.stdout.flush()  # Force log flush
        for line in process.stderr:
            print(f"{name} (ERROR): {line.strip()}")
            sys.stdout.flush()  # Force log flush
    except Exception as e:
        print(f"Error reading from {name}: {e}")
        sys.stdout.flush()  # Force log flush

def run_executables(exe1, exe2, args1, args2):
    try:
        process1 = run_executable(exe1, args1, "Process 1")
        process2 = run_executable(exe2, args2, "Process 2")

        if process1:
            print_output(process1, "Process 1")
        
        if process2:
            print_output(process2, "Process 2")

        if process1:
            process1.wait()
            print(f"Process 1 exit code: {process1.returncode}")
            sys.stdout.flush()  # Force log flush
        if process2:
            process2.wait()
            print(f"Process 2 exit code: {process2.returncode}")
            sys.stdout.flush()  # Force log flush

    except Exception as e:
        print(f"An error occurred in main execution: {e}")
        sys.stdout.flush()  # Force log flush

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    exe1 = os.path.join(script_dir, "native-messaging-host.exe")
    exe2 = os.path.join(script_dir, "koboldcpp_nocuda.exe")

    print(f"Python version: {sys.version}")
    print(f"Script directory: {script_dir}")
    print(f"Exe1 path: {exe1}")
    print(f"Exe2 path: {exe2}")
    sys.stdout.flush()  # Force log flush

    if not os.path.exists(exe1):
        print(f"Error: {exe1} does not exist!")
        sys.stdout.flush()  # Force log flush
    if not os.path.exists(exe2):
        print(f"Error: {exe2} does not exist!")
        sys.stdout.flush()  # Force log flush

    # Arguments for native-messaging-host.exe
    args1 = sys.argv[1:]
    print(f"Arguments for native-messaging-host.exe: {args1}")
    sys.stdout.flush()  # Force log flush

    # No arguments for koboldcpp_nocuda.exe
    args2 = []  # Empty list since you don't want to pass args for exe2
    print(f"Arguments for koboldcpp_nocuda.exe: {args2}")
    sys.stdout.flush()  # Force log flush

    run_executables(exe1, exe2, args1, args2)

    print("Execution completed.")
    sys.stdout.flush()  # Force log flush
