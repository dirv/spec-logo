import { parseSingle, negateIntegerValue } from './values';
import { moveDistance } from './moveDistance';

const rotate = (state, addAngleValue) => {
  const { turtle } = state;
  return {
    turtle: { ...turtle, angle: addAngleValue.get(state) + turtle.angle }
  };
};

export const forward = {
  initial: {},
  parseToken: parseSingle,
  perform: state => moveDistance(state, state.currentInstruction.value)
};

export const backward = {
  initial: {},
  parseToken: parseSingle,
  perform: state => moveDistance(state, negateIntegerValue(state.currentInstruction.value))
};

export const left = {
  initial: {},
  parseToken: parseSingle,
  perform: state => rotate(state, negateIntegerValue(state.currentInstruction.value))
};

export const right = {
  initial: {},
  parseToken: parseSingle,
  perform: state => rotate(state, state.currentInstruction.value)
};

