function moveDistance({ turtle, drawCommands }, distance) {
  const newX = distance + turtle.x;
  return {
    drawCommands: [
      ...drawCommands,
      { drawCommand: 'drawLine', x1: turtle.x, y1: turtle.y, x2: newX, y2: turtle.y }
    ],
    turtle: {
      ...turtle,
      x: newX
    }
  };
}

function rotate({ turtle, drawCommands }, addAngle) {
  return {
    drawCommands: drawCommands,
    turtle: {
      ...turtle,
      angle: addAngle + turtle.angle
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

const intValueOrError = (arg, f) => {
  const integerArgument = parseInt(arg);
  if (Number.isNaN(integerArgument)) {
    return {
      error: {
        description: 'Argument is not an integer'
      }
    }
  }
  return f(integerArgument);
};

const waitCommand = seconds => ({ drawCommand: 'wait', seconds: seconds });
const wait = (instruction, nextArg) =>
  !nextArg ? instruction :
  intValueOrError(nextArg, integerArgument => ({
    ...instruction,
    isComplete: true,
    perform: state => ({ ...state, drawCommands: [ ...state.drawCommands, waitCommand(integerArgument)] })
  }));

const forward = (instruction, nextArg) =>
  !nextArg ? instruction :
  intValueOrError(nextArg, integerArgument => ({
    ...instruction,
    isComplete: true,
    perform: state => moveDistance(state, integerArgument)
  }));

const backward = (instruction, nextArg) =>
  !nextArg ? instruction :
  intValueOrError(nextArg, integerArgument => ({
    ...instruction,
    isComplete: true,
    perform: state => moveDistance(state, -integerArgument)
  }));

const left = (instruction, nextArg) =>
  !nextArg ? instruction :
  intValueOrError(nextArg, integerArgument => ({
    ...instruction,
    isComplete: true,
    perform: state => rotate(state, -integerArgument)
  }));

const right = (instruction, nextArg) =>
  !nextArg ? instruction :
  intValueOrError(nextArg, integerArgument => ({
    ...instruction,
    isComplete: true,
    perform: state => rotate(state, integerArgument)
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
      const allInstructions = duplicateArrayItems(instruction.innerInstructions.reverse(), instruction.times);
      return {
        ...instruction,
        isComplete: true,
        perform: state => allInstructions.reduce((state, instruction) => instruction.perform(state), state)
      };
    }
    if (instruction.innerInstructions[0].isComplete) {
      return { ...instruction, innerInstructions: [ parseToken({}, nextArg), ...instruction.innerInstructions ] };
    } else {
      const [ currentInstruction, ...rest ] = instruction.innerInstructions;
      return { ...instruction, innerInstructions: [ parseToken(currentInstruction, nextArg), ...rest ] };
    }
  } else {
    return intValueOrError(nextArg, integerArgument => ({
      ...instruction,
      times: integerArgument
    }));
  }
};

const to = (instruction, nextArg) => {
  if (!nextArg) return { ...instruction, innerInstructions: [{}] };
  if (!instruction.name) {
    return { ...instruction, name: nextArg };
  }
  if (nextArg === 'end') {
    const instructions = instruction.innerInstructions.reverse();
    return {
      ...instruction,
      isComplete: true,
      perform: state => instructions.reduce((state, instruction) => instruction.perform(state), state)
    };
  }
  if (instruction.innerInstructions[0].isComplete) {
    return { ...instruction, innerInstructions: [ parseToken({}, nextArg), ... instruction.innerInstructions ] };
  } else {
    const [ currentInstruction, ... rest ] = instruction.innerInstructions;
    return { ...instruction, innerInstructions: [ parseToken(currentInstruction, nextArg), ...rest ] };
  }
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
  to: to
};

const removeEmptyTokens = tokens => tokens.filter(token => token !== '');
const tokens = line => removeEmptyTokens(line.split(' '));

const findFunction = nextArg => {
  const functionName = nextArg;
  const foundFunction = builtInFunctions[functionName];
  if (foundFunction) {
    return foundFunction({ type: functionName });
  }
  return {
    error: {
      description: `Unknown function: ${functionName}`,
      position: { start: 0, end: functionName.length - 1 }
    }
  };
};

export function parseToken(instruction, nextToken) {
  if (instruction.error) return instruction;
  if (instruction.type) {
    return builtInFunctions[instruction.type](instruction, nextToken);
  }
  return findFunction(nextToken);
}

export function parseLine(line, state) {
  const updatedState = { ...state, lastLine: line };
  const updatedFunction = tokens(line).reduce(parseToken, state.currentFunction);
  if (updatedFunction.error) {
    return { ...updatedState, error: updatedFunction.error };
  }
  if (updatedFunction.isComplete) {
    return {
      ...updatedFunction.perform(updatedState),
      currentFunction: {}
    };
  }
  return { ...updatedState, currentFunction: updatedFunction };
}
