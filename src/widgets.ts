import { blessed } from "./ui";

const offset = 2;

export const getText = (content: string, offset: string, extraHeight?: number) => {
  return blessed.text({
    top: `50%${offset}`,
    left: "center",
    align: "center",
    height: 2 + (extraHeight ?? 0),
    width: "shrink",
    tags: true,
    content,
    style: {
      align: "center"
    }
  })
}

export const getInputBox = (offset?: string, width?: number, label?: string, censor?: boolean) => {
  return blessed.textbox({
    top: `50%${offset ?? ""}`,
    left: "center",
    height: label ? 3 : 3,
    width: width ?? 15,
    label,
    tags: true,
    censor,
    padding: {
      left: 1,
      right: 1,
    },
    border: {
      type: "line"
    },
  });
}

export const getCenteredBox = () => {
  return blessed.box({
    top: "center",
    left: "center",
    width: "shrink",
    height: "shrink",
    padding: {
      left: 1,
      right: 1,
    },
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

export const getLogoBox = () => {
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

export const getTextBox = () => {
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

export const getLogBox = (screenRows: number) => {
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

export const getInfoBar = () => {
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
