import blessed from "blessed";
import * as customWidgets from "./widgets";
import * as database from "./db";

enum Selection {
  Google = 0,
  UserPass = 1,
}

class UI {
  screen: blessed.Widgets.Screen;
  selected: number;
  userId: string;
  userName: string;
  loadingScreenInstance: blessed.Widgets.BoxElement;

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
    
    this.userId = "c1kjf89";
    this.userName = "909ak";
  }

  _addMessage(userName: string, message: string, recvMsgBox: blessed.Widgets.Log) {
    recvMsgBox.pushLine(`{underline}${userName}:{/} ${message}`);
  }

  _loginScreen() {
    // Get widget elements from exports
    const logoBox = customWidgets.getLogoBox();
    const centeredBox = customWidgets.getCenteredBox();

    centeredBox.setContent(setSelectedLogin(this.selected));

    // Add elements to screen
    const elements = [centeredBox, logoBox];
    elements.forEach((elem) => this.screen.append(elem));

    // Add functionality for selecting
    centeredBox.key(["up", "down"], () => {
      if (this.selected == Selection.Google) {
        centeredBox.setContent(setSelectedLogin(Selection.UserPass));
        this.selected = Selection.UserPass;
      } else {
        centeredBox.setContent(setSelectedLogin(Selection.Google));
        this.selected = Selection.Google;
      }

      this.screen.render();
    });

    centeredBox.key("enter", () => {
      elements.forEach((elem) => this.screen.remove(elem));
      this._connectToDatabase().then(() => this._chatScreen());
    })

    // Focus our element.
    centeredBox.focus();

    // Render the screen.
    this.screen.render();
  }

  _chatScreen() {
    const textBox = customWidgets.getTextBox();
    const recvMsgBox = customWidgets.getLogBox(this.screen.rows);
    const infoBar = customWidgets.getInfoBar();

    infoBar.setContent(`${new Date().toISOString()}{|}Connected to chat room:`);

    // Add elements to screen
    const elements = [textBox, recvMsgBox, infoBar];
    elements.forEach((elem) => this.screen.append(elem));

    // Read text input and add timer to info bar
    this._readInput(textBox, recvMsgBox);
    this._timer(infoBar);

    this.screen.render();
  }

  _timer(topBar: blessed.Widgets.BoxElement) {
    setInterval(() => {
      topBar.setContent(` ${new Date().toISOString()}{|}Connected to chat room: `);
      this.screen.render();
    }, 100);
  }

  _readInput(textBox: blessed.Widgets.TextboxElement, log: blessed.Widgets.Log) {
    textBox.focus();
    textBox.readInput((_err, value) => {
      textBox.clearValue();
      this._addMessage(this.userName, value, log);
      this.screen.render();

      // Quit on Escape, q, or Control-C.
      textBox.key(["escape", "C-c"], () => {
        database.closeDatabase();
        return process.exit(0);
      });

      database.sendMessage("V75CE93", this.userId, value).then(() => {
        this._readInput(textBox, log);
      });
    });
  }

  start() {
    this._loginScreen();
  }

  _connectToDatabase(): Promise<void>  {
    return new Promise((resolve, _reject) => {
      this._addLoadingScreen("Connecting to database...");
      database.connectToDatabase();
      this._killLoadingScreen();
      resolve();
    })
  }

  _addLoadingScreen(content: string) {
    this.loadingScreenInstance = customWidgets.getLoadingScreen();

    const loadSequence = ['⣾','⣽','⣻','⢿','⡿','⣟','⣯','⣷'];
    let index = 0;

    setInterval(() => {
      index += 1;
      this.loadingScreenInstance.setContent(`{center}${content}{/center}\n${loadSequence[index].padStart(content.length / 2)}`);
      if (index == loadSequence.length - 1) {
        index = 0;
      }
      this.screen.render();
    }, 100);

    this.screen.append(this.loadingScreenInstance);

    this.screen.render();
  }

  _killLoadingScreen() {
    this.screen.remove(this.loadingScreenInstance);
    this.screen.render()
  }
}



const loginContent = [
  "Sign in with Google",
  "Sign in with User/Pass"
];

const setSelectedLogin = (selection: number) => {
  return (loginContent.map((text, index) => index == selection ? "[*] " + text : "[ ] " + text)).join("\n");
}

export { UI, blessed };
