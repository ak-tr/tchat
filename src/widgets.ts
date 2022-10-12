import { blessed } from "./ui";

export function getCenteredBox(){
  return blessed.box({
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
}

export function getLogoBox() {
  const logo = [
    "    __       __          __  ",
    "   / /______/ /_  ____ _/ /_ ",
    "  / __/ ___/ __ \/ __ `/ __/ ",
    " / /_/ /__/ / / / /_/ / /_   ",
    " \__/\___/_/ /_/\__,_/\__/   ",
  ]

  return blessed.text({
    top: "25%",
    left: "center",
    content: logo.join("\n"),
  })
}

export function getTextBox() {
  return blessed.textbox({
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
}

export function getLogBox(offset: number, screenRows: number) {
  return blessed.log({
    top: offset,
    width: "100%",
    height: screenRows - offset - 2,
    border: {
      type: "line",
    },
    tags: true,
  })
}

export function getInfoBar(offset: number) {
  return blessed.box({
    top: 0,
    width: "100%",
    height: offset + 1,
    border: {
      type: "line",
    },
    tags: true,
  })
}
