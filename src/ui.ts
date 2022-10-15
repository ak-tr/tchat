import blessed from "blessed";
import * as customWidgets from "./widgets";
import * as database from "./db";
import { User } from "./user";
class UI {
  screen: blessed.Widgets.Screen;
  loginSelected: LoginSelection;
  chatRoomSelected: ChatRoomSelection;
  loadingScreenInstance: blessed.Widgets.BoxElement;
  user: User;
  chatRoomId: string;

  constructor() {
    // Create a screen object.
    this.screen = blessed.screen({
      fastCSR: true,
      autoPadding: true,
      dockBorders: true,
      log: "log.txt",
    });
    
    // Set screen title and default selections
    this.screen.title = "Tchat";
    this.loginSelected = LoginSelection.SignIn;
    this.chatRoomSelected = ChatRoomSelection.Create;

    // Allow quit on Escape, q, or Control-C.
    this.screen.key(["escape", "q", "C-c"], () => {
      return process.exit(0);
    });
    
    // Temporarily set a user for testing
    this.user = new User("c1kjf89", "909ak");
  }

  // Start the UI by entering login screen
  start() {
    this._loginScreen();
  }

  _loginScreen() {
    // Get widget elements from exports
    const logoBox = customWidgets.getLogoBox();
    const centeredBox = customWidgets.getCenteredBox();
    // Set tick on default
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

    // Connect to database and call next step on selection
    centeredBox.key("enter", () => {
      elements.forEach((elem) => this.screen.remove(elem));
      database.connectToDatabase();
      this._chatRoomSelection()
    })

    // Focus element.
    centeredBox.focus();
    this.screen.render();
  }

  _chatRoomSelection() {
    // Get centered box
    const centeredBox = customWidgets.getCenteredBox();
    // Set default selections
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
      // On enter remove box
      this.screen.remove(centeredBox);

      // If create selected, create room, otherwise ask for chat room ID
      if (this.chatRoomSelected == ChatRoomSelection.Create) {
        // Creating new chat room...
        database.createChatRoom(this.user.getUserId(), this.user.getUserName()).then((chatRoomId) => {
          this.chatRoomId = chatRoomId;
          this._chatScreen();
        })
      } else {
        // Ask for chat room ID to join
        const inputBox = customWidgets.getInputBox();
        const promptText = customWidgets.getText("Enter chat room ID:", "-3");
        const validationText = customWidgets.getText("{red-fg}Invalid chat room ID{/}", "+3");

        [inputBox, promptText, validationText].forEach((elem) => this.screen.append(elem));
        validationText.hide();

        this._readInputForSelection(inputBox, validationText);

        this.screen.render();
      }
    })

    // Focus our element.
    centeredBox.focus();
    this.screen.render();
  }

  _chatScreen() {
    // Get info bar, text box and message box
    const textBox = customWidgets.getTextBox();
    const recvMsgBox = customWidgets.getLogBox(this.screen.rows);
    const infoBar = customWidgets.getInfoBar();

    // Add elements to screen
    [textBox, recvMsgBox, infoBar].forEach((elem) => this.screen.append(elem));

    // Read text input and add timer to info bar
    this._readInputForMessages(textBox, recvMsgBox);
    this._timer(infoBar);

    this.screen.render();
  }

  _timer(topBar: blessed.Widgets.BoxElement) {
    // Update info bar every 100ms
    setInterval(() => {
      topBar.setContent(` ${new Date().toISOString()}{|}Connected to chat room: ${this.chatRoomId} `);
      this.screen.render();
    }, 100);
  }

  _readInputForMessages(textBox: blessed.Widgets.TextboxElement, messageScreen: blessed.Widgets.Log) {
    // Focus textbox and then call readInput function
    textBox.focus();
    textBox.readInput((_err, value) => {
      // On submit, clear value, add message to textbox and send to database
      textBox.clearValue();

      this._addMessage(this.user.getUserName(), value, messageScreen);
      database.sendMessage(
        this.chatRoomId,
        this.user.getUserId(),
        this.user.getUserName(),
        value
      ).then(() => {
        this._readInputForMessages(textBox, messageScreen); // Call readInput again for next message
      });

      this.screen.render();

      // Allow quit on Escape or Control-C.
      textBox.key(["escape", "C-c"], () => {
        database.closeDatabase();
        return process.exit(0);
      });


    });
  }

  _readInputForSelection(inputBox: blessed.Widgets.TextboxElement, validationText: blessed.Widgets.TextElement) {
    // Read input from box...
    inputBox.focus();

    inputBox.readInput((_err, value) => {
      // Clear value on call
      inputBox.clearValue();

      // Check if chat room exists
      database.checkIfChatRoomExists(value).then((exists) => {
        if (!exists) { // If chat room does not exist, show error for 10 seconds
          validationText.show();
          this.screen.render();

          setTimeout(() => {
            validationText.hide()
            this.screen.render();
          }, 10000);

          // Call for input again
          this._readInputForSelection(inputBox, validationText);
        } else {
          this.chatRoomId = value;
          this._chatScreen();
        }
      })

      // Allow quit on Escape or Control-C.
      inputBox.key(["escape", "C-c"], () => {
        database.closeDatabase();
        return process.exit(0);
      });

      this.screen.render();
    })
  }

  _addMessage(userName: string, message: string, recvMsgBox: blessed.Widgets.Log) {
    recvMsgBox.pushLine(`{#CECECE-fg}${new Date().toLocaleTimeString()}{/} → {#D00000-fg}${userName.padStart(15-userName.length)}{/} | ${message}`);
  }
}

enum LoginSelection {
  SignIn = 0,
  SignUp = 1,
}

enum ChatRoomSelection {
  Create = 0,
  Join = 1,
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
