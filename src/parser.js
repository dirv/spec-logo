import { moveDistance } from './language/moveDistance';

const constantValue = value => ({ get: _ => value });
const parameterValue = parameter => ({ get: state => parseInt(state.collectedParameters[parameter.substring(1)]) });
const negateIntegerValue = value => ({ get: state => -value.get(state) });

function rotate(state, addAngleValue) {
  const { drawCommands, turtle } = state;
  return {
    ...state,
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

const parseSingle = ({ currentInstruction }, nextArg) =>
  valueOrError(nextArg, value => ({
    ...currentInstruction,
    isComplete: true,
    value
  }));

const waitCommand = seconds => ({ drawCommand: 'wait', seconds: seconds });
const performWait = state => ({
  ...state,
  drawCommands: [...state.drawCommands, waitCommand(state.currentInstruction.value.get(state))]
});

const performForward = state => moveDistance(state, state.currentInstruction.value);

const performBackward = state => moveDistance(state, negateIntegerValue(state.currentInstruction.value));

const performLeft = state => rotate(state, negateIntegerValue(state.currentInstruction.value));

const performRight = state => rotate(state, state.currentInstruction.value);

const duplicateArrayItems = (array, times) => Array(times).fill(array).flat();

const parseRepeat = (state, nextArg) => {
  const { currentInstruction: instruction } = state;
  if (instruction.times) {
    if (!instruction.inRepeatBlock) {
      return { ...instruction, inRepeatBlock: true };
    }
    if (nextArg === ']') {
      if (instruction.innerInstructions[0] && !instruction.innerInstructions[0].isComplete) {
        return { error: { description: 'The last command to repeat is not complete' } };
      }
      return { ...instruction, isComplete: true };
    }
    if (instruction.innerInstructions[0] && instruction.innerInstructions[0].isComplete) {
      const innerState = { ...state, currentInstruction: undefined };
      return { ...instruction, innerInstructions: [ parseToken(innerState, nextArg).currentInstruction, ...instruction.innerInstructions ] };
    } else {
      const [ currentInstruction, ...rest ] = instruction.innerInstructions;
      const innerState = { ...state, currentInstruction: currentInstruction };
      return { ...instruction, innerInstructions: [ parseToken(innerState, nextArg).currentInstruction, ...rest ] };
    }
  } else {
    return valueOrError(nextArg, value => ({
      ...instruction,
      times: value
    }));
  }
};

const performRepeat = state => {
  const instruction = state.currentInstruction;
  const allInstructions = duplicateArrayItems(instruction.innerInstructions.reverse(), instruction.times.get(state));
  return allInstructions.reduce((state, instruction) => builtInFunctions[instruction.type].perform({ ...state, currentInstruction: instruction }), state);
};

const addFunctionParameter = (instruction, nextArg) => ({ ...instruction, parameters: [ ...instruction.parameters, nextArg.substring(1) ] });
const parseTo = (state, nextArg) => {
  const { currentInstruction: instruction } = state;
  if (!instruction.name) {
    return { ...instruction, name: nextArg, collectingParameters: true };
  }
  if (instruction.collectingParameters && nextArg.startsWith(':')) {
    return addFunctionParameter(instruction, nextArg);
  }
  if (nextArg === 'end') {
    return { ...instruction, isComplete: true };
  }
  if (instruction.innerInstructions[0] && instruction.innerInstructions[0].isComplete) {
    const innerState = { ...state, currentInstruction: undefined };
    return { ...instruction, innerInstructions: [ parseToken(innerState, nextArg).currentInstruction, ...instruction.innerInstructions ] };
  } else {
    const [ currentInstruction, ...rest ] = instruction.innerInstructions;
    const innerState = { ...state, currentInstruction: currentInstruction };
    return { ...instruction, innerInstructions: [ parseToken(innerState, nextArg).currentInstruction, ...rest ], collectingParameters: false };
  }
};

const performTo = state => {
  const instruction = state.currentInstruction;
  return { ...state, userDefinedFunctions: { ...state.userDefinedFunctions, [instruction.name]: instruction } }
};

const parseCall = (state, nextArg) => {
  let { currentInstruction: instruction, userDefinedFunctions } = state;
  const func = userDefinedFunctions[instruction.functionName];
  if(nextArg) {
    const nextArgName = func.parameters[Object.keys(instruction.collectedParameters).length];
    instruction = {
      ...instruction,
      collectedParameters: { ...instruction.collectedParameters, [nextArgName]: nextArg }
    };
  }
  if (Object.keys(instruction.collectedParameters).length === func.parameters.length) {
    return { ...instruction, isComplete: true };
  }
  return instruction;
};

const performCall = state => {
  const instruction = state.currentInstruction;
  const func = state.userDefinedFunctions[instruction.functionName];
  const allInstructions = func.innerInstructions.reverse();
  state = { ...state, collectedParameters: { ...state.collectedParameters, ...instruction.collectedParameters } };
  return allInstructions.reduce((state, instruction) => builtInFunctions[instruction.type].perform({ ...state, currentInstruction: instruction }), state);
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
    const foundFunction = builtInFunctions['call'];
    return { currentInstruction: foundFunction.parseToken({ ...state, currentInstruction: { type: 'call', functionName, ...foundFunction.initial } }) };
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
    const updatedInstruction = builtInFunctions[currentInstruction.type].parseToken(state, nextToken);
    return {
      ...state,
      error: updatedInstruction.error,
      currentInstruction: updatedInstruction
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
