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
      const integerArgument = parseInt(args[0]);
      if (Number.isNaN(integerArgument)) {
        return {
          ...state,
          error: {
            description: 'Argument is not an integer',
            position: { start: state.charsRead, end: state.charsRead + args[0].length }
          }
        }
      }

      return f(state, integerArgument);
    }
  }
};

const changePen = option => (state) => ({ ...state, pen: { ...state.pen, ...option } });

const waitCommand = seconds => ({ drawCommand: 'wait', seconds: seconds });
const wait = (state, integerArgument) => ({ ...state, drawCommands: [ ...state.drawCommands, waitCommand(integerArgument) ]});

const builtInFunctions = {
  forward: requiresIntegerArgument((state, integerArgument) => moveDistance(state, integerArgument)),
  backward: requiresIntegerArgument((state, integerArgument) => moveDistance(state, -integerArgument)),
  left: requiresIntegerArgument((state, integerArgument) => rotate(state, -integerArgument)),
  right: requiresIntegerArgument((state, integerArgument) => rotate(state, integerArgument)),
  penup: changePen({ down: false }),
  pendown: changePen({ down: true }),
  wait: requiresIntegerArgument(wait)
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
    return parseTokens(rest, { ...state, currentFunction: foundFunction, charsRead: functionName.length + 1});
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
  return parseTokens(tokens(line), { ... state, lastLine: line, charsRead: 0 });
}
