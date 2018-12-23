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

const changePen = option => ({
  isComplete: true,
  perform: state => ({ ...state, pen: { ...state.pen, ...option } })
});

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

const waitCommand = seconds => ({ drawCommand: 'wait', seconds: seconds });
const wait = ({ currentInstruction: instruction }, nextArg) =>
  valueOrError(nextArg, value => ({
    ...instruction,
    isComplete: true,
    perform: state => ({ ...state, drawCommands: [ ...state.drawCommands, waitCommand(value.get(state))] })
  }));

const forward = ({ currentInstruction: instruction }, nextArg) =>
  valueOrError(nextArg, value => ({
    ...instruction,
    isComplete: true,
    perform: state => moveDistance(state, value)
  }));

const backward = ({ currentInstruction: instruction }, nextArg) =>
  valueOrError(nextArg, value => ({
    ...instruction,
    isComplete: true,
    perform: state => moveDistance(state, negateIntegerValue(value))
  }));

const left = ({ currentInstruction: instruction }, nextArg) =>
  valueOrError(nextArg, value => ({
    ...instruction,
    isComplete: true,
    perform: state => rotate(state, negateIntegerValue(value))
  }));

const right = ({ currentInstruction: instruction }, nextArg) =>
  valueOrError(nextArg, value => ({
    ...instruction,
    isComplete: true,
    perform: state => rotate(state, value)
  }));

const duplicateArrayItems = (array, times) => Array(times).fill(array).flat();

const repeat = (state, nextArg) => {
  const { currentInstruction: instruction } = state;
  if (instruction.times) {
    if (!instruction.inRepeatBlock) {
      return { ...instruction, inRepeatBlock: true };
    }
    if (nextArg === ']') {
      if (instruction.innerInstructions[0] && !instruction.innerInstructions[0].isComplete) {
        return { error: { description: 'The last command to repeat is not complete' } };
      }
      const allInstructions = state => duplicateArrayItems(instruction.innerInstructions.reverse(), instruction.times.get(state));
      return {
        ...instruction,
        isComplete: true,
        perform: state => allInstructions(state).reduce((state, instruction) => instruction.perform(state), state)
      };
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

const addFunctionParameter = (instruction, nextArg) => ({ ...instruction, parameters: [ ...instruction.parameters, nextArg.substring(1) ] });
const to = (state, nextArg) => {
  const { currentInstruction: instruction } = state;
  if (!instruction.name) {
    return { ...instruction, name: nextArg, collectingParameters: true };
  }
  if (instruction.collectingParameters && nextArg.startsWith(':')) {
    return addFunctionParameter(instruction, nextArg);
  }
  if (nextArg === 'end') {
    return {
      ...instruction,
      isComplete: true,
      perform: state => ({ ...state, userDefinedFunctions: { ...state.userDefinedFunctions, [instruction.name]: instruction } })
    };
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

const call = (state, nextArg) => {
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
    const instructions = func.innerInstructions.reverse();
    return {
      ...instruction,
      isComplete: true,
      perform: state => {
        state = { ...state, collectedParameters: { ...state.collectedParameters, ...instruction.collectedParameters } };
        return instructions.reduce((state, instruction) => instruction.perform(state), state);
      }
    };
  }
  return instruction;
};

const builtInFunctions = {
  forward: { initial: {}, parseToken: forward },
  backward: { initial: {}, parseToken: backward },
  left: { initial: {}, parseToken: left },
  right: { initial: {} , parseToken: right },
  penup: { initial: changePen({ down: false }) },
  pendown: { initial: changePen({ down: true }) },
  wait: { initial: {}, parseToken: wait },
  repeat: { initial: { innerInstructions: [] }, parseToken: repeat },
  to: { initial: { innerInstructions: [], parameters: [] }, parseToken: to },
  call: {initial: { collectedParameters: {} }, parseToken: call}
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
    return currentInstruction.perform({ ...state, currentInstruction: undefined });
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
