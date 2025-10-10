#!/usr/bin/env python3

import time
import keyboard

def main():
    print("Auto-key script started. Press Ctrl+C to stop.")
    try:
        while True:
            keyboard.press_and_release('enter')
            time.sleep(3)
    except KeyboardInterrupt:
        print("\nAuto-key script stopped.")

if __name__ == "__main__":
    main()