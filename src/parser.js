import { moveDistance } from './language/moveDistance';

const constantValue = value => ({ get: _ => value });
const parameterValue = parameter => ({ get: state => parseInt(state.collectedParameters[parameter.substring(1)]) });
const negateIntegerValue = value => ({ get: state => -value.get(state) });

function rotate(state, addAngleValue) {
  const { drawCommands, turtle } = state;
  return {
    drawCommands: drawCommands,
    turtle: {
      ...turtle,
      angle: addAngleValue.get(state) + turtle.angle
    }
  };
}

const changePen = option => state => ({ ...state, pen: { ...state.pen, ...option } });

const valueOrError = (arg, f) => {
  if (arg.startsWith(':')) {
    return f(parameterValue(arg));
  }
  const integerArgument = parseInt(arg);
  if (Number.isNaN(integerArgument)) {
    return {
      error: {
        description: 'Argument is not an integer'
      }
    }
  }
  return f(constantValue(integerArgument));
};

const parseSingle = (_, nextArg) =>
  valueOrError(nextArg, value => ({ isComplete: true, value }));

const waitCommand = seconds => ({ drawCommand: 'wait', seconds: seconds });
const performWait = state => ({
  drawCommands: [...state.drawCommands, waitCommand(state.currentInstruction.value.get(state))]
});

const performForward = state => moveDistance(state, state.currentInstruction.value);

const performBackward = state => moveDistance(state, negateIntegerValue(state.currentInstruction.value));

const performLeft = state => rotate(state, negateIntegerValue(state.currentInstruction.value));

const performRight = state => rotate(state, state.currentInstruction.value);

const duplicateArrayItems = (array, times) => Array(times).fill(array).flat();

const parseInnerBlock = (endToken, state, nextArg) => {
  const { currentInstruction: instruction } = state;
  if (nextArg === endToken) {
    if (instruction.innerInstructions[0] && !instruction.innerInstructions[0].isComplete) {
      return { error: { description: 'The last command is not complete' } };
    }
    return { ...instruction, isComplete: true, innerInstructions: instruction.innerInstructions.reverse() };
  }
  if (instruction.innerInstructions[0] && instruction.innerInstructions[0].isComplete) {
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
    return { parameters: [ ...instruction.parameters, nextArg.substring(1) ] };
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

const builtInFunctions = {
  forward: { initial: {}, parseToken: parseSingle, perform: performForward },
  backward: { initial: {}, parseToken: parseSingle, perform: performBackward },
  left: { initial: {}, parseToken: parseSingle, perform: performLeft },
  right: { initial: {} , parseToken: parseSingle, perform: performRight },
  penup: { initial: { isComplete: true }, perform: changePen({ down: false }) },
  pendown: { initial: { isComplete: true}, perform: changePen({ down: true }) },
  wait: { initial: {}, parseToken: parseSingle, perform: performWait },
  repeat: { initial: { innerInstructions: [] }, parseToken: parseRepeat, perform: performRepeat },
  to: { initial: { innerInstructions: [], parameters: [] }, parseToken: parseTo, perform: performTo },
  call: {initial: { collectedParameters: {} }, parseToken: parseCall, perform: performCall }
};

const findFunction = (state, nextArg) => {
  const { userDefinedFunctions } = state;
  const functionName = nextArg;
  const foundFunction = builtInFunctions[functionName];
  if (foundFunction) {
    return { currentInstruction: { type: functionName, ...foundFunction.initial } };
  }
  if (Object.keys(userDefinedFunctions).includes(functionName)) {
    const currentInstruction = {
      type: 'call', functionName,...builtInFunctions['call'].initial };
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
