import { functionWithName } from './functionTable';

const areAllParametersFilled = (parameters, functionDefinition) =>
  Object.keys(parameters).length === functionDefinition.parameters.length;

function addNextParameter(existingParameters, functionDefinition, value) {
  const nextArgName = functionDefinition.parameters[Object.keys(existingParameters).length];
  const newParameters = { ...existingParameters, [nextArgName]: value };
  return {
    collectedParameters: newParameters,
    isComplete: areAllParametersFilled(newParameters, functionDefinition)
  };
}

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
  throw {
    description: `Unknown function: ${functionName.toLowerCase()}`,
    position: { start: 0, end: functionName.length - 1 }
  };
};

export const parseNextToken = (state, nextToken) => {
  const { currentInstruction, allFunctions } = state;
  if (currentInstruction) {
    const newInstructionProperties = currentInstruction.functionDefinition.parseToken(state, nextToken);
    return {
      ...state,
      currentInstruction: { ...currentInstruction, ...newInstructionProperties }
    };
  }
  return { ...state, ...findFunction(state, nextToken) };
};

export const parseNextListValue = (state, nextArg) => {
  const { collectedParameters, functionDefinition, parsingListValue, currentListValue } = state.currentInstruction;
  const latestInstruction = currentListValue[0];
  if (latestInstruction && latestInstruction.isComplete) {
    const innerState = { ...state, currentInstruction: undefined };
    return {
      currentListValue: [ parseNextToken(innerState, nextArg).currentInstruction, ... currentListValue ] };
  } else {
    const [ currentInstruction, ...rest ] = currentListValue;
    const innerState = { ...state, currentInstruction: currentInstruction };
    return {
      currentListValue: [ parseNextToken(innerState, nextArg).currentInstruction, ...rest ]
    };
  }
};

export const finishParsingList = ({ collectedParameters, functionDefinition, currentListValue }) => {
  const latestInstruction = currentListValue[0];
  if (latestInstruction && !latestInstruction.isComplete) {
    throw { description: 'The last command is not complete' };
  }
  return {
    ...addNextParameter(collectedParameters, functionDefinition, currentListValue.reverse()),
    parsingListValue: false,
    currentListValue: undefined
  };
};

export const parseCall = (state, nextArg) => {
  const { collectedParameters, functionDefinition, parsingListValue, currentListValue } = state.currentInstruction;
  if (nextArg === '[') {
    return { parsingListValue: true, currentListValue: [] };
  }
  if (nextArg === ']') {
    return finishParsingList(state.currentInstruction);
  }
  if (parsingListValue) {
    return parseNextListValue(state, nextArg);
  } else {
    return addNextParameter(collectedParameters, functionDefinition, nextArg);
  }
};
