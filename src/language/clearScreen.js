export const clearScreen = {
  initial: { isComplete: true },
  perform: state => ({ ...state, drawCommands: [], turtle: { x: 0, y: 0, angle: 0 } })
}
