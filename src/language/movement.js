import { parseSingle, negateIntegerValue } from './values';
import { moveDistance } from './moveDistance';

const rotate = (state, addAngleValue) => {
  const { turtle } = state;
  return {
    turtle: { ...turtle, angle: addAngleValue.get(state) + turtle.angle }
  };
};

export const forward = {
  names: [ 'forward', 'fd' ],
  isWriteProtected: true,
  initial: {},
  parseToken: parseSingle,
  perform: state => moveDistance(state, state.currentInstruction.value)
};

export const backward = {
  names: [ 'backward', 'bd' ],
  isWriteProtected: true,
  initial: {},
  parseToken: parseSingle,
  perform: state => moveDistance(state, negateIntegerValue(state.currentInstruction.value))
};

export const left = {
  names: [ 'left', 'lt' ],
  isWriteProtected: true,
  initial: {},
  parseToken: parseSingle,
  perform: state => rotate(state, negateIntegerValue(state.currentInstruction.value))
};

export const right = {
  names: [ 'right', 'rt' ],
  isWriteProtected: true,
  initial: {},
  parseToken: parseSingle,
  perform: state => rotate(state, state.currentInstruction.value)
};
