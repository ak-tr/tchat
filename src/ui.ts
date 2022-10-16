import blessed from "blessed";
import * as customWidgets from "./widgets";
import * as database from "./db";
import { User } from "./user";

class UI {
  screen: blessed.Widgets.Screen;

  loginSelected: LoginSelection;
  chatRoomSelected: ChatRoomSelection;
  userPassSelected: UserPassSelection;
  loadingScreenInstance: blessed.Widgets.BoxElement;

  user: User;
  userNameValue: string;
  userPassValue: string;
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
    this.userPassSelected = UserPassSelection.User;

    // Allow quit on Escape, q, or Control-C.
    this.screen.key(["escape", "q", "C-c"], () => {
      return process.exit(0);
    });
    
    // Temporarily set a user for testing
    this.user = new User("909ak", "c1kjf89");
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
      this._userPassScreen();
      // this._chatRoomSelection()
    })

    // Focus element.
    centeredBox.focus();
    this.screen.render();
  }

  _userPassScreen() {
    const text = customWidgets.getText(
      "Enter your username and password\nUse {#ff0000-fg}TAB key{/} to go to next input box\nPress {#00ff00-fg}ENTER{/} to proceed",
      "-6",
      1
    );
    const usernameInput = customWidgets.getInputBox("-2", 35, "Username");
    const passwordInput = customWidgets.getInputBox("+1", 35, "Password", true);
    const validationText = customWidgets.getText("{red-fg}{/}", "+5");

    const widgets = [text, usernameInput, passwordInput, validationText]
    widgets.forEach((elem) => this.screen.append(elem));
    
    validationText.hide();
    const inputBoxes = [usernameInput, passwordInput];

    inputBoxes.forEach((box) => {
      box.key("tab", () => {
        inputBoxes[this.userPassSelected].submit();
        if (this.userPassSelected == UserPassSelection.User) {
          this.userPassSelected = UserPassSelection.Pass;
        } else {
          this.userPassSelected = UserPassSelection.User;
        }
        inputBoxes[this.userPassSelected].focus();
        this._readInputForUserPass(inputBoxes[this.userPassSelected]);
      })

      box.key("enter", () => {
        if (this.userPassSelected == UserPassSelection.User) {
          return
        }

        const resetValidationText = (ms: number) => {
          setInterval(() => {
            validationText.hide();
            this.screen.render();
          }, ms);
        }

        const showValidationError = (message: string) => {
          validationText.setContent(`{red-fg}${message}{/}`);
          validationText.show();
          this.screen.render();
          return resetValidationText(5000);
        }

        const showSuccessMessage = (message: string) => {
          validationText.setContent(`{green-fg}${message}{/}`);
          validationText.show();
          this.screen.render();
        }

        inputBoxes[this.userPassSelected].submit();
        if (this.userNameValue.length <= 4 || this.userPassValue.length <= 4) {
          return showValidationError("Username or password must be longer than 4 characters.");
        }

        if (this.loginSelected == LoginSelection.SignUp) {
          this.user = new User(this.userNameValue);
          database.userSignUp(this.user, this.userPassValue).then((result) => {
            if (!result) {
              return showValidationError("Username already exists.\nPlease try with a different username.");
            } else {
              showSuccessMessage("You have successfully signed up!")
              setTimeout(() => {
                widgets.forEach((elem) => this.screen.remove(elem));
                this._chatRoomSelection();
              }, 1500);
            }
          })
        } else {
          database.userSignIn(this.userNameValue, this.userPassValue).then((result) => {
            if (result == null) {
              showValidationError("Username or password is wrong. Please try again.");
            } else {
              showSuccessMessage("You have successfully logged in!")
              this.user = new User(result.userName, result.userId);
              setTimeout(() => {
                widgets.forEach((elem) => this.screen.remove(elem));
                this._chatRoomSelection();
              }, 1500);
            }
          })
        }
      })
    })

    this._readInputForUserPass(usernameInput);


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
        database.createChatRoom(this.user).then((chatRoomId) => {
          this.chatRoomId = chatRoomId;
          this._chatScreen();
        })
      } else {
        // Ask for chat room ID to join
        const inputBox = customWidgets.getInputBox("-1");
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

    database.getChatRoomDetails(this.chatRoomId).then((details) => {
      const toSlice = details.messages.length >= 50 ? 50 : details.messages.length;
      // Add last 15 messages to chat box
      details.messages.slice(-toSlice).forEach((message) => {
        this._addMessage(
          message.fromUserName,
          message.content,
          message.timestamp,
          message.fromUserId == this.user.getUserId() ? true : false,
          recvMsgBox,
        )
      })
      this._addSystemMessage("Retrieved message history", recvMsgBox);
    })

    database.messageListener(this.chatRoomId).on("change", (next) => {
      // Ignore if change doesn't have any update fields
      // Shouldn't ever hit but you never know...
      if (!next?.updateDescription?.updatedFields) {
        return;
      }

      // Get new message from changeStream
      const newMessage = Object.values(next.updateDescription.updatedFields)[0];
      // Parse fields
      const { fromUserName, fromUserId, content, timestamp } = newMessage;

      // Guard clause for non existent props
      if (!(fromUserName || fromUserId || content || timestamp)) {
        return;
      }

      // Check if we made the update?
      const outbound = fromUserId == this.user.getUserId() ? true : false;
      // Add to message box
      this._addMessage(
        fromUserName,
        content,
        timestamp,
        outbound,
        recvMsgBox,
      )
    })

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

      // this._addMessage(this.user.getUserName(), value, messageScreen);
      database.sendMessage(
        this.chatRoomId,
        this.user,
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
      // Check if chat room exists
      database.checkIfChatRoomExists(value).then((exists) => {
        if (!exists) { // If chat room does not exist, show error for 10 seconds
          validationText.show();
          // Clear value on validation
          inputBox.clearValue();
          this.screen.render();

          setTimeout(() => {
            validationText.hide()
            this.screen.render();
          }, 10000);

          // Call for input again
          this._readInputForSelection(inputBox, validationText);
        } else {
          this.chatRoomId = value;
          database.addUserToChatRoom(this.user, value).then(() => {
            this._chatScreen();
          })
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

  _readInputForUserPass(inputBox: blessed.Widgets.TextboxElement) {
    inputBox.focus();

    inputBox.readInput((_err, value) => {
      if (this.userPassSelected == UserPassSelection.User) this.userNameValue = value.trim();
      else this.userPassValue = value.trim();

      // Allow quit on Escape or Control-C.
      inputBox.key(["escape", "C-c"], () => {
        database.closeDatabase();
        return process.exit(0);
      });
    })
  }

  _addMessage(userName: string, message: string, timestamp: number, outbound: boolean, recvMsgBox: blessed.Widgets.Log) {
    recvMsgBox.pushLine(
      `{#CECECE-fg}${new Date(timestamp).toLocaleTimeString()}{/} ${outbound ? "→" : "←"} {#D00000-fg}${userName.padStart(10)}{/} | ${message}`
    );
  }

  _addSystemMessage(message: string, recvMsgBox: blessed.Widgets.Log) {
    recvMsgBox.pushLine(
      `{#CECECE-fg}${new Date().toLocaleTimeString()}{/} ← {white-fg}${"System".padStart(10)}{/} | ${message}`
    );
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

enum UserPassSelection {
  User = 0,
  Pass = 1,
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
