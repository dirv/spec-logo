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
  if (!nextArg) return instruction;
  if (instruction.times) {
    if (!instruction.inRepeatBlock) {
      return { ...instruction, inRepeatBlock: true, innerInstructions: [{}] };
    }
    if (nextArg === ']') {
      const functions = instruction.innerInstructions.reverse().map(instruction => instruction.currentFunction);
      const allInstructions = duplicateArrayItems(functions, instruction.times);
      return {
        ...instruction,
        isComplete: true,
        perform: state => allInstructions.reduce((state, instruction) => instruction.perform(state), state)
      };
    }
    console.log(instruction.innerInstructions);
    if (instruction.innerInstructions[0].currentFunction && instruction.innerInstructions[0].currentFunction.isComplete) {
      console.log('yes ' + nextArg);
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

const builtInFunctions = {
  forward: forward,
  backward: backward,
  left: left,
  right: right,
  penup: changePen({ down: false }),
  pendown: changePen({ down: true }),
  wait: wait,
  repeat: repeat
};

const removeEmptyTokens = tokens => tokens.filter(token => token !== '');
const tokens = line => removeEmptyTokens(line.split(' '));

export function parseToken(state, nextToken) {
  if (state.error) return state;
  if (state.currentFunction) {
    const foundFunction = builtInFunctions[state.currentFunction.type];
    const newFunction = foundFunction(state.currentFunction, nextToken);
    if (newFunction.error) {
      return { ...state, error: newFunction.error };
    }
    return { ...state, currentFunction: newFunction };
  }
  const functionName = nextToken;
  const foundFunction = builtInFunctions[functionName];
  if (foundFunction) {
    return { ...state, currentFunction: foundFunction({ type: nextToken })};
  }
  return {
    ...state,
    error: {
      description: `Unknown function: ${functionName}`,
      position: { start: 0, end: functionName.length - 1 }
    }
  };
}

export function parseLine(line, state) {
  const updatedState = tokens(line).reduce(parseToken, { ... state, lastLine: line, charsRead: 0 });
  if (!updatedState.error && updatedState.currentFunction.isComplete) {
    return updatedState.currentFunction.perform(state);
  } else {
    return updatedState;
  }
}
