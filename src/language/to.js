import { parseCall, parseNextToken } from './parseCall';
import { parameterValue } from './values';
import { functionWithName } from './functionTable';
import { performAll } from './perform';

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
    allFunctions: [ ...state.allFunctions, functionDefinition ]
  }
};

export const to = {
  names: [ 'to' ],
  isWriteProtected: true,
  initial: { innerInstructions: [], parameters: [] },
  parseToken: parseTo,
  perform: performTo
};
