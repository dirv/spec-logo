import { forward, backward, left, right } from './language/movement';
import { wait } from './language/wait';
import { penup, pendown } from './language/pen';
import { clearScreen } from './language/clearScreen';
import { valueOrError } from './language/values';
import { parseCall } from './language/parseCall';
import { parameterValue } from './language/values';

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
  const { currentInstruction: instruction, allFunctions } = state;
  if (!instruction.name) {
    const existingFunction = functionWithName(nextArg, allFunctions);
    if (existingFunction && existingFunction.isWriteProtected) {
      return {
        error: { text: `Cannot override the built-in function '${nextArg.toLowerCase()}'` }
      }
    }
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
  const functionDefinition = {
    names: [instruction.name],
    isWriteProtected: false,
    initial: {
      collectedParameters: {},
      isComplete: instruction.parameters.length === 0,
      innerInstructions: instruction.innerInstructions
    },
    parameters: instruction.parameters,
    parseToken: parseCall,
    perform: performCall
  };
  return {
    allFunctions: {
      ...state.allFunctions,
      [instruction.name]: functionDefinition
    }
  }
};

const mapObjectValues = (object, f) =>
  Object.keys(object).reduce((mapped, key) => ({ ...mapped, [key]: f(object[key]) }), {});

const insertParameterValues = (parameters, state) =>
  mapObjectValues(parameters, value => {
    if (value.startsWith(':')) return parameterValue(value.substring(1)).get(state);
    return value;
  });

const performCall = state => {
  const { innerInstructions } = state.currentInstruction;
  const instructionsWithParameterValues = innerInstructions.map(instruction => ({
    ...instruction,
    collectedParameters: insertParameterValues(instruction.collectedParameters, state)
  }));
  return performAll(state, instructionsWithParameterValues);
};

export const builtInFunctions = {
  forward, backward, left, right, wait, penup, pendown, clearScreen,
  repeat: {
    names: [ 'repeat', 'rp' ],
    isWriteProtected: true,
    initial: { innerInstructions: [] },
    parseToken: parseRepeat,
    perform: performRepeat },
  to: {
    names: [ 'to' ],
    isWriteProtected: true,
    initial: { innerInstructions: [], parameters: [] },
    parseToken: parseTo,
    perform: performTo }
};

const functionWithName = (name, functions) => {
  const lowerCaseName = name.toLowerCase();
  const key = Object.keys(functions).find(k => functions[k].names.includes(lowerCaseName));
  if (key) return functions[key];
};

const findFunction = ({ allFunctions }, nextArg) => {
  const functionName = nextArg;
  const foundFunction = functionWithName(functionName, allFunctions);
  if (foundFunction) {
    return {
      currentInstruction: {
        ...foundFunction.initial,
        functionDefinition: foundFunction,
        collectedParameters: {}
      }
    };
  }
  return {
    error: {
      description: `Unknown function: ${functionName.toLowerCase()}`,
      position: { start: 0, end: functionName.length - 1 }
    }
  };
};

const removeEmptyTokens = tokens => tokens.filter(token => token !== '');
const tokens = line => removeEmptyTokens(line.split(' '));

function perform(state) {
  const { currentInstruction, collectedParameters } = state;
  if (currentInstruction && currentInstruction.isComplete) {
    const stateWithParams = { ...state, collectedParameters: { ...collectedParameters, ...currentInstruction.collectedParameters } };
    try {
      return {
        ...state,
        ...currentInstruction.functionDefinition.perform(stateWithParams),
        currentInstruction: undefined
      };
    } catch(e) {
      return { ...state, error: e };
    }
  }
  return state;
}

function parseToken(state, nextToken) {
  if (state.error) return state;
  const { currentInstruction, allFunctions } = state;
  if (currentInstruction) {
    const newInstructionProperties = currentInstruction.functionDefinition.parseToken(state, nextToken);
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
  if (!state.allFunctions) {
    state = { ...state, allFunctions: builtInFunctions };
  }
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
