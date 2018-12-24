import { forward, backward, left, right } from './language/movement';
import { wait } from './language/wait';
import { penup, pendown } from './language/pen';
import { clearScreen } from './language/clearScreen';
import { repeat } from './language/repeat';
import { parseCall } from './language/parseCall';
import { parameterValue } from './language/values';
import { parseNextToken } from './language/parseCall';
import { functionWithName } from './language/functionTable';
import { perform, performAll } from './language/perform';

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
    return { innerInstructions: [ parseNextToken(innerState, nextArg).currentInstruction, ...instruction.innerInstructions ] };
  } else {
    const [ currentInstruction, ...rest ] = instruction.innerInstructions;
    const innerState = { ...state, currentInstruction: currentInstruction };
    return { ...instruction, innerInstructions: [ parseNextToken(innerState, nextArg).currentInstruction, ...rest ] };
  }
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
  forward, backward, left, right, wait, penup, pendown, clearScreen, repeat,
  to: {
    names: [ 'to' ],
    isWriteProtected: true,
    initial: { innerInstructions: [], parameters: [] },
    parseToken: parseTo,
    perform: performTo }
};

const removeEmptyTokens = tokens => tokens.filter(token => token !== '');
const tokens = line => removeEmptyTokens(line.split(' '));

function parseAndPerform(state, nextToken) {
  try {
    return perform(parseNextToken(state, nextToken));
  } catch(e) {
    return {...state, error: e};
  }
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
