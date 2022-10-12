import blessed, { text } from "blessed";

enum Selection {
  Google = 0,
  UserPass = 1,
}

class UI {
  screen: blessed.Widgets.Screen;
  selected: number;
  userId: string;
  userName: string;
  messages: string[][];

  constructor() {
    // Create a screen object.
    this.screen = blessed.screen({
      fastCSR: true,
      autoPadding: true,
      dockBorders: true,
      log: "log.txt",
    });
    
    this.screen.title = "Tchat";
    this.selected = Selection.Google;

    // Quit on Escape, q, or Control-C.
    this.screen.key(["escape", "q", "C-c"], () => {
      return process.exit(0);
    });
    
    this.userName = "909ak";
    this.messages = [["", `Chat started at ${new Date()}`]];
  }

  _addMessage(userName: string, message: string, recvMsgBox: blessed.Widgets.Log) {
    recvMsgBox.pushLine(`{underline}${userName}:{/} ${message}`);
  }

  _loginScreen() {
    const logo = [
      "    __       __          __  ",
      "   / /______/ /_  ____ _/ /_ ",
      "  / __/ ___/ __ \/ __ `/ __/ ",
      " / /_/ /__/ / / / /_/ / /_   ",
      " \__/\___/_/ /_/\__,_/\__/   ",
    ]
    // Create a box perfectly centered horizontally and vertically.
    const box = blessed.box({
      parent: this.screen,
      top: "center",
      left: "center",
      width: "shrink",
      height: "shrink",
      tags: true,
      border: {
        type: "line"
      },
      style: {
        border: {
          fg: "#f0f0f0"
        }
      }
    });

    const logoBox = blessed.text({
      parent: this.screen,
      top: "25%",
      left: "center",
      content: logo.join("\n"),
    })

    box.setContent(setSelectedLogin(this.selected));

    const elements = [box, logoBox];

    box.key(["up", "down"], () => {
      if (this.selected == Selection.Google) {
        box.setContent(setSelectedLogin(Selection.UserPass));
        this.selected = Selection.UserPass;
      } else {
        box.setContent(setSelectedLogin(Selection.Google));
        this.selected = Selection.Google;
      }

      this.screen.render();
    });

    box.key("enter", () => {
      elements.forEach((elem) => this.screen.remove(elem));
      this._chatScreen();
    })

    // Focus our element.
    box.focus();

    // Render the screen.
    this.screen.render();
  }

  _chatScreen() {
    const textBox = blessed.textbox({
      bottom: 0,
      width: "100%",
      height: 3,
      border: {
        type: "line"
      },
      style: {
        border: {
          fg: "#f0f0f0"
        },
      },
      valign: "middle",
    })

    const offset = 2;

    const recvMsgBox = blessed.log({
      top: offset,
      width: "100%",
      height: this.screen.rows - offset - 2,
      border: {
        type: "line",
      },
      tags: true,
    })

    const topBar = blessed.box({
      top: 0,
      width: "100%",
      height: offset + 1,
      border: {
        type: "line",
      },
      tags: true,
    })

    topBar.setContent(`${new Date().toISOString()}{|}Connected to chat room:`);

    const elements = [textBox, recvMsgBox, topBar];

    elements.forEach((elem) => this.screen.append(elem));

    this._readInput(textBox, recvMsgBox);
    this._timer(topBar);

    this.screen.render();
  }

  _timer(topBar: blessed.Widgets.BoxElement) {
    setInterval(() => {
      topBar.setContent(` ${new Date().toISOString()}{|}Connected to chat room: `);
      this.screen.render();
    }, 25);
  }

  _readInput(textBox: blessed.Widgets.TextboxElement, log: blessed.Widgets.Log) {
    textBox.focus();
    textBox.readInput((_err, value) => {
      textBox.clearValue();
      this._addMessage(this.userName, value, log);
      this.screen.render();

      // Quit on Escape, q, or Control-C.
      textBox.key(["escape", "C-c"], () => {
        return process.exit(0);
      });

      this._readInput(textBox, log);
    });
  }

  start() {
    this._loginScreen();
  }
}

const loginContent = [
  "Sign in with Google",
  "Sign in with User/Pass"
];

const setSelectedLogin = (selection: number) => {
  return (loginContent.map((text, index) => index == selection ? "[*] " + text : "[ ] " + text)).join("\n");
}

export { UI };
