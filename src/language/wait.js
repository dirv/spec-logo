import { parseSingle } from './values';

const waitCommand = seconds => ({ drawCommand: 'wait', seconds: seconds });

export const wait = {
  names: [ 'wait', 'wt' ],
  initial: {},
  parseToken: parseSingle,
  perform: state => ({
    drawCommands: [...state.drawCommands, waitCommand(state.currentInstruction.value.get(state))]
  })
}
