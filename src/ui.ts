import blessed from "blessed";
import * as customWidgets from "./widgets";
import * as database from "./db";

enum LoginSelection {
  SignIn = 0,
  SignUp = 1,
}

enum ChatRoomSelection {
  Create = 0,
  Join = 1,
}
class UI {
  screen: blessed.Widgets.Screen;
  loginSelected: LoginSelection;
  chatRoomSelected: ChatRoomSelection;
  userId: string;
  userName: string;
  loadingScreenInstance: blessed.Widgets.BoxElement;
  chatRoomId: string;

  constructor() {
    // Create a screen object.
    this.screen = blessed.screen({
      fastCSR: true,
      autoPadding: true,
      dockBorders: true,
      log: "log.txt",
    });
    
    this.screen.title = "Tchat";
    this.loginSelected = LoginSelection.SignIn;
    this.chatRoomSelected = ChatRoomSelection.Create;

    // Quit on Escape, q, or Control-C.
    this.screen.key(["escape", "q", "C-c"], () => {
      return process.exit(0);
    });
    
    this.userId = "c1kjf89";
    this.userName = "909ak";
  }

  start() {
    this._loginScreen();
  }

  _loginScreen() {
    // Get widget elements from exports
    const logoBox = customWidgets.getLogoBox();
    const centeredBox = customWidgets.getCenteredBox();

    centeredBox.setContent(tickSelected(this.loginSelected, loginContent));

    // Add elements to screen
    const elements = [centeredBox, logoBox];
    elements.forEach((elem) => this.screen.append(elem));

    // Add functionality for selecting
    centeredBox.key(["up", "down"], () => {
      if (this.loginSelected == LoginSelection.SignIn) {
        centeredBox.setContent(tickSelected(LoginSelection.SignUp, loginContent));
        this.loginSelected = LoginSelection.SignUp;
      } else {
        centeredBox.setContent(tickSelected(LoginSelection.SignIn, loginContent));
        this.loginSelected = LoginSelection.SignIn;
      }

      this.screen.render();
    });

    centeredBox.key("enter", () => {
      elements.forEach((elem) => this.screen.remove(elem));
      database.connectToDatabase();
      this._chatRoomSelection()
    })

    // Focus our element.
    centeredBox.focus();

    // Render the screen.
    this.screen.render();
  }

  _chatRoomSelection() {
    const centeredBox = customWidgets.getCenteredBox();

    centeredBox.setContent(tickSelected(this.chatRoomSelected, chatRoomSelectionContent));

    this.screen.append(centeredBox);

    // Add functionality for selecting
    centeredBox.key(["up", "down"], () => {
      if (this.chatRoomSelected == ChatRoomSelection.Create) {
        centeredBox.setContent(tickSelected(ChatRoomSelection.Join, chatRoomSelectionContent));
        this.chatRoomSelected = ChatRoomSelection.Join;
      } else {
        centeredBox.setContent(tickSelected(ChatRoomSelection.Create, chatRoomSelectionContent));
        this.chatRoomSelected = ChatRoomSelection.Create;
      }

      this.screen.render();
    });

    centeredBox.key("enter", () => {
      this.screen.remove(centeredBox);
      this.screen.log(this.chatRoomSelected);
      if (this.chatRoomSelected == ChatRoomSelection.Create) {
        database.createChatRoom(this.userId, this.userName).then((chatRoomId) => {
          this.chatRoomId = chatRoomId;
          this._chatScreen();
        })
      }
    })

    // Focus our element.
    centeredBox.focus();

    this.screen.render();
  }

  _chatScreen() {
    const textBox = customWidgets.getTextBox();
    const recvMsgBox = customWidgets.getLogBox(this.screen.rows);
    const infoBar = customWidgets.getInfoBar();

    infoBar.setContent(` ${new Date().toISOString()}{|}Connected to chat room: ${this.chatRoomId}`);

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
      topBar.setContent(` ${new Date().toISOString()}{|}Connected to chat room: ${this.chatRoomId} `);
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

      database.sendMessage(this.chatRoomId, this.userId, value).then(() => {
        this._readInput(textBox, log);
      });
    });
  }

  _addMessage(userName: string, message: string, recvMsgBox: blessed.Widgets.Log) {
    recvMsgBox.pushLine(`{inverse}${new Date().toLocaleTimeString()} → ${userName}{/}: ${message}`);
  }
}

const chatRoomSelectionContent = [
  "Create a chat room",
  "Join chat room using ID",
]

const loginContent = [
  "Sign in",
  "Sign up"
];

const tickSelected = (selection: number, content: string[]) => {
  return (content.map((text, index) => index == selection ? "[*] " + text : "[ ] " + text)).join("\n");
}

export { UI, blessed };
