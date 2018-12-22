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

const changePen = option => (instruction, nextArg) => {
  return {
    ...instruction,
    isComplete: true,
    perform: state => ({ ...state, pen: { ...state.pen, ...option } })
  };
};

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
const wait = (instruction, nextArg) =>
  !nextArg ? instruction :
  valueOrError(nextArg, value => ({
    ...instruction,
    isComplete: true,
    perform: state => ({ ...state, drawCommands: [ ...state.drawCommands, waitCommand(value.get(state))] })
  }));

const forward = (instruction, nextArg) =>
  !nextArg ? instruction :
  valueOrError(nextArg, value => ({
    ...instruction,
    isComplete: true,
    perform: state => moveDistance(state, value)
  }));

const backward = (instruction, nextArg) =>
  !nextArg ? instruction :
  valueOrError(nextArg, value => ({
    ...instruction,
    isComplete: true,
    perform: state => moveDistance(state, negateIntegerValue(value))
  }));

const left = (instruction, nextArg) =>
  !nextArg ? instruction :
  valueOrError(nextArg, value => ({
    ...instruction,
    isComplete: true,
    perform: state => rotate(state, negateIntegerValue(value))
  }));

const right = (instruction, nextArg) =>
  !nextArg ? instruction :
  valueOrError(nextArg, value => ({
    ...instruction,
    isComplete: true,
    perform: state => rotate(state, value)
  }));

const duplicateArrayItems = (array, times) => Array(times).fill(array).flat();

const repeat = (instruction, nextArg) => {
  if (!nextArg) return { ...instruction, innerInstructions: [{}] };
  if (instruction.times) {
    if (!instruction.inRepeatBlock) {
      return { ...instruction, inRepeatBlock: true };
    }
    if (nextArg === ']') {
      if (!instruction.innerInstructions[0].isComplete) {
        return { error: { description: 'The last command to repeat is not complete' } };
      }
      const allInstructions = state => duplicateArrayItems(instruction.innerInstructions.reverse(), instruction.times.get(state));
      return {
        ...instruction,
        isComplete: true,
        perform: state => allInstructions(state).reduce((state, instruction) => instruction.perform(state), state)
      };
    }
    if (instruction.innerInstructions[0].isComplete) {
      return { ...instruction, innerInstructions: [ parseToken({}, {}, nextArg), ...instruction.innerInstructions ] };
    } else {
      const [ currentInstruction, ...rest ] = instruction.innerInstructions;
      return { ...instruction, innerInstructions: [ parseToken(currentInstruction, {}, nextArg), ...rest ] };
    }
  } else {
    return valueOrError(nextArg, value => ({
      ...instruction,
      times: value
    }));
  }
};

const addFunctionParameter = (instruction, nextArg) => ({ ...instruction, parameters: [ ...instruction.parameters, nextArg.substring(1) ] });
const to = (instruction, nextArg) => {
  if (!nextArg) return { ...instruction, innerInstructions: [{}], parameters: [] };
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
  if (instruction.innerInstructions[0].isComplete) {
    return { ...instruction, innerInstructions: [ parseToken({}, {}, nextArg), ... instruction.innerInstructions ] };
  } else {
    const [ currentInstruction, ...rest ] = instruction.innerInstructions;
    return { ...instruction, innerInstructions: [ parseToken(currentInstruction, {}, nextArg), ...rest ], collectingParameters: false };
  }
};

const call = (instruction, nextArg, userDefinedFunctions) => {
  const func = userDefinedFunctions[instruction.functionName];
  if (nextArg) {
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
  forward: forward,
  backward: backward,
  left: left,
  right: right,
  penup: changePen({ down: false }),
  pendown: changePen({ down: true }),
  wait: wait,
  repeat: repeat,
  to: to,
  call: call
};

const removeEmptyTokens = tokens => tokens.filter(token => token !== '');
const tokens = line => removeEmptyTokens(line.split(' '));

const findFunction = (userDefinedFunctions, nextArg) => {
  const functionName = nextArg;
  const foundFunction = builtInFunctions[functionName];
  if (foundFunction) {
    return foundFunction({ type: functionName });
  }
  if (Object.keys(userDefinedFunctions).includes(functionName)) {
    const foundFunction = builtInFunctions['call'];
    return foundFunction({ type: 'call', functionName, collectedParameters: {} }, undefined, userDefinedFunctions);
  }
  return {
    error: {
      description: `Unknown function: ${functionName}`,
      position: { start: 0, end: functionName.length - 1 }
    }
  };
};

export function parseToken(instruction, userDefinedFunctions, nextToken) {
  if (instruction.error) return instruction;
  if (instruction.type) {
    return builtInFunctions[instruction.type](instruction, nextToken, userDefinedFunctions);
  }
  return findFunction(userDefinedFunctions, nextToken);
}

export function parseLine(line, state) {
  const updatedState = { ...state };
  const updatedFunction = tokens(line).reduce((instruction, nextToken) => parseToken(instruction, state.userDefinedFunctions, nextToken), state.currentFunction);
  if (updatedFunction.error) {
    return {
      ...updatedState,
      error: { ...updatedFunction.error, line: line }
    };
  }
  if (updatedFunction.isComplete) {
    return {
      ...updatedFunction.perform(updatedState),
      acceptedLines: [...updatedState.acceptedLines, line],
      currentFunction: {}
    };
  }
  return { ...updatedState, currentFunction: updatedFunction };
}
