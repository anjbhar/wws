# wws

An RPG Maker MZ game in development. You can play the GitHub version in a desktop web browser without owning RPG Maker MZ.

## Play the GitHub version in your browser

1. On [the GitHub repository](https://github.com/anjbhar/wws), select **Code → Download ZIP**, then extract the ZIP. Alternatively, clone it with `git clone https://github.com/anjbhar/wws.git`.
2. Open a terminal in the extracted or cloned `wws` folder. Make sure this is the folder containing `index.html`, `package.json`, and `data/`.
3. Start a local web server using **Python 3**. If Python is not installed, install it first.

   On Windows:

   ```powershell
   py -3 -m http.server 8000 --bind 127.0.0.1
   ```

   On macOS or Linux:

   ```sh
   python3 -m http.server 8000 --bind 127.0.0.1
   ```

4. Keep that terminal open and visit [http://127.0.0.1:8000/](http://127.0.0.1:8000/) in your browser.
5. Choose **New Game** on the title screen. Use **Continue** to load a save made in that browser.

When you finish playing, press **Ctrl+C** in the terminal to stop the server. To play again, start the server from the same folder and open the same address.

Do not double-click `index.html`: opening it as a `file://` URL can prevent the game from loading its data. The GitHub file preview also does not run the game. No `npm install` or build step is needed; this repository already contains the JavaScript runtime and game assets. The source checkout does not include a bundled desktop executable.

### Controls

| Action | Keyboard |
| --- | --- |
| Move / navigate menus | Arrow keys |
| Confirm / interact | Enter, Space, or Z |
| Cancel / open menu | Esc or X |
| Dash | Hold Shift while moving |

You can also click to move and select menu options, and right-click to cancel or open the menu.

### Saves and troubleshooting

- **Browser saves:** saves are stored in your browser's site storage. Use the same browser profile and the same address and port each time. Clearing site data can erase saves; private browsing may discard them when closed. Browser saves are separate from RPG Maker desktop playtest saves.
- **Python command not found:** install Python 3, then reopen the terminal. On Windows, if `py` is unavailable but `python` runs Python 3, use `python -m http.server 8000 --bind 127.0.0.1`.
- **Port 8000 is already in use:** stop the other server or replace `8000` with `8001` in both the command and browser address. Changing the port also changes which browser saves are available.
- **Directory listing instead of the game:** stop the server and restart it from the folder containing `index.html`.
- **Loading errors or missing files:** extract the entire ZIP before starting the server, keep the folder structure intact, and check the terminal for failed file requests. Use a desktop browser with JavaScript and WebGL enabled.

## Playtest or edit with RPG Maker MZ

If you own RPG Maker MZ, open `game.rmmzproject` from the downloaded or cloned folder, then choose **Game → Playtest**. This launches the project through the editor. RPG Maker MZ is only required for this editor workflow; the browser instructions above work without it.
