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

const requiresIntegerArgument = f => {
  return (state, args) => {
    if (args.length == 0) {
      return state;
    } else {
      return f(state, parseInt(args[0]));
    }
  }
};

const builtInFunctions = {
  forward: requiresIntegerArgument((state, integerArgument) => moveDistance(state, integerArgument)),
  backward: requiresIntegerArgument((state, integerArgument) => moveDistance(state, -integerArgument)),
  left: requiresIntegerArgument((state, integerArgument) => rotate(state, -integerArgument)),
  right: requiresIntegerArgument((state, integerArgument) => rotate(state, integerArgument)),
  penup: (state, _) => ({ ...state, pen: { ...state.pen, down: false } })
};

const removeEmptyTokens = tokens => tokens.filter(token => token !== '');
const tokens = line => removeEmptyTokens(line.split(' '));

export function parseTokens(tokens, state) {
  if (state.currentFunction) {
    return state.currentFunction(state, tokens);
  }
  const [ functionName, ...rest ] = tokens;
  const foundFunction = builtInFunctions[functionName];
  if (foundFunction) {
    return parseTokens(rest, { ...state, currentFunction: foundFunction });
  } else {
    return {
      ...state,
      error: {
        description: `Unknown function: ${functionName}`,
        position: { start: 0, end: functionName.length - 1 }
      }
    };
  }
}

export function parseLine(line, state) {
  return parseTokens(tokens(line), { ... state, lastLine: line });
}
