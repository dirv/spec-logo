import { forward, backward, left, right } from './language/movement';
import { wait } from './language/wait';
import { penup, pendown } from './language/pen';
import { clearScreen } from './language/clearScreen';
import { valueOrError } from './language/values';

const duplicateArrayItems = (array, times) => Array(times).fill(array).flat();

const parseInnerBlock = (endToken, state, nextArg) => {
  const { currentInstruction: instruction } = state;
  const latestInstruction = instruction.innerInstructions[0];
  if (nextArg === endToken) {
    if (latestInstruction && !latestInstruction.isComplete) {
      return { error: { description: 'The last command is not complete' } };
    }
    return { ...instruction, isComplete: true, innerInstructions: instruction.innerInstructions.reverse() };
  }
  if (latestInstruction && latestInstruction.isComplete) {
    const innerState = { ...state, currentInstruction: undefined };
    return { innerInstructions: [ parseToken(innerState, nextArg).currentInstruction, ...instruction.innerInstructions ] };
  } else {
    const [ currentInstruction, ...rest ] = instruction.innerInstructions;
    const innerState = { ...state, currentInstruction: currentInstruction };
    return { ...instruction, innerInstructions: [ parseToken(innerState, nextArg).currentInstruction, ...rest ] };
  }
};

const parseRepeat = (state, nextArg) => {
  const { currentInstruction: instruction } = state;
  if (instruction.times) {
    if (!instruction.inRepeatBlock) {
      return { inRepeatBlock: true };
    }
    return parseInnerBlock(']', state, nextArg);
  } else {
    return valueOrError(nextArg, value => ({ times: value }));
  }
};

const performAll = (state, instructions) =>
  instructions.reduce((state, instruction) => perform({ ...state, currentInstruction: instruction }), state);

const performRepeat = state => {
  const instruction = state.currentInstruction;
  return performAll(state, duplicateArrayItems(instruction.innerInstructions, instruction.times.get(state)));
};

const parseTo = (state, nextArg) => {
  const { currentInstruction: instruction } = state;
  if (!instruction.name) {
    return { name: nextArg, collectingParameters: true };
  }
  if (instruction.collectingParameters && nextArg.startsWith(':')) {
    return { parameters: [ ...instruction.parameters, nextArg.substring(1).toLowerCase() ] };
  }
  const newInstruction = { ...instruction, collectingParameters: false };
  return parseInnerBlock('end', { ...state, currentInstruction: newInstruction }, nextArg);
};

const performTo = state => {
  const instruction = state.currentInstruction;
  return { userDefinedFunctions: { ...state.userDefinedFunctions, [instruction.name]: instruction } }
};

const parseCall = (state, nextArg) => {
  let { currentInstruction: instruction, userDefinedFunctions } = state;
  const func = userDefinedFunctions[instruction.functionName];
  let collectedParameters = instruction.collectedParameters;
  if(nextArg) {
    const nextArgName = func.parameters[Object.keys(instruction.collectedParameters).length];
    collectedParameters = { ...collectedParameters, [nextArgName]: nextArg };
  }
  if (Object.keys(collectedParameters).length === func.parameters.length) {
    return { collectedParameters, isComplete: true, innerInstructions: func.innerInstructions };
  }
  return { collectedParameters };
};

const performCall = state => {
  const instruction = state.currentInstruction;
  state = { ...state, collectedParameters: { ...state.collectedParameters, ...instruction.collectedParameters } };
  return performAll(state, instruction.innerInstructions);
};

export const builtInFunctions = {
  forward, backward, left, right, wait, penup, pendown, clearScreen,
  repeat: {
    names: [ 'repeat', 'rp' ],
    initial: { innerInstructions: [] },
    parseToken: parseRepeat,
    perform: performRepeat },
  to: {
    names: [ 'to' ],
    initial: { innerInstructions: [], parameters: [] },
    parseToken: parseTo,
    perform: performTo },
  call: {
    names: [ 'call' ],
    initial: { collectedParameters: {} },
    parseToken: parseCall,
    perform: performCall }
};

const functionWithName = (name, functions) => {
  const lowerCaseName = name.toLowerCase();
  return Object.keys(functions).find(k => functions[k].names.includes(lowerCaseName));
};

const findFunction = (state, nextArg) => {
  const { userDefinedFunctions } = state;
  const functionName = nextArg;
  const foundFunctionKey = functionWithName(functionName, builtInFunctions);
  if (foundFunctionKey) {
    return { currentInstruction: { type: foundFunctionKey, ...builtInFunctions[foundFunctionKey].initial } };
  }
  if (Object.keys(userDefinedFunctions).includes(functionName.toLowerCase())) {
    const currentInstruction = {
      type: 'call',
      functionName: functionName.toLowerCase(),
      ...builtInFunctions['call'].initial };
    return parseToken({ ... state, currentInstruction });
  }
  return {
    error: {
      description: `Unknown function: ${functionName}`,
      position: { start: 0, end: functionName.length - 1 }
    }
  };
};

const removeEmptyTokens = tokens => tokens.filter(token => token !== '');
const tokens = line => removeEmptyTokens(line.split(' '));

function perform(state) {
  const { currentInstruction } = state;
  if (currentInstruction && currentInstruction.isComplete) {
    return {
      ...state,
      ...builtInFunctions[currentInstruction.type].perform(state),
      currentInstruction: undefined
    };
  }
  return state;
}

function parseToken(state, nextToken) {
  if (state.error) return state;
  const { currentInstruction } = state;
  if (currentInstruction) {
    const newInstructionProperties = builtInFunctions[currentInstruction.type].parseToken(state, nextToken);
    return {
      ...state,
      error: newInstructionProperties.error,
      currentInstruction: { ...currentInstruction, ...newInstructionProperties }
    };
  }
  return {
    ...state,
    ...findFunction(state, nextToken)
  };
}

function parseAndPerform(state, nextToken) {
  return perform(parseToken(state, nextToken));
}

export function parseLine(line, state) {
  const updatedState = tokens(line).reduce(parseAndPerform, state);
  if(!updatedState.error) {
    return {
      ...updatedState,
      acceptedLines: [...updatedState.acceptedLines, line]
    };
  } else {
    return {
      ...updatedState,
      error: { ...updatedState.error, line }
    };
  };
}
