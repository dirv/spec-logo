import React from 'react';
import ReactDOM from 'react-dom';
import { mount, shallow } from 'enzyme';
import { StoreContext } from 'redux-react-hook';
import { expectRedux, storeSpy } from 'expect-redux';
import { configureStore } from '../src/store';
import { AnimatedLine, StaticLines, Drawing, ReduxConnectedDisplay } from '../src/Display';

const lineA = { drawCommand: 'drawLine', id: 123, x1: 100, y1: 100, x2: 200, y2: 100 };
const lineB = { drawCommand: 'drawLine', id: 234, x1: 200, y1: 100, x2: 200, y2: 200 };
const lineC = { drawCommand: 'drawLine', id: 235, x1: 200, y1: 200, x2: 300, y2: 300 };
const turtle = { x: 0, y: 0, angle: 0 };

function mountSvg(component) {
  return mount(<svg>{component}</svg>);
}

describe('AnimatedLine', () => {
  let wrapper;

  function line() {
    return wrapper.find('line');
  }

  it('draws a line starting at the x1,y1 co-ordinate of the command being drawn', () => {
    wrapper = mountSvg(<AnimatedLine commandToAnimate={lineA} turtle={turtle} />)
    expect(line().exists()).toBeTruthy();
    expect(line().prop('x1')).toEqual(lineA.x1);
    expect(line().prop('y1')).toEqual(lineA.y1);
  });

  it('draws a line ending at the current position of the turtle', () => {
    wrapper = mountSvg(<AnimatedLine commandToAnimate={lineA} turtle={ { x: 10, y: 20 } } />)
    expect(line().prop('x2')).toEqual(10);
    expect(line().prop('y2')).toEqual(20);
  });

  it('sets a stroke width of 2 on each line', () => {
    wrapper = mountSvg(<AnimatedLine commandToAnimate={lineA} turtle={turtle} />)
    expect(line().prop('strokeWidth')).toEqual('2');
  });

  it('sets a stroke color of black on each line', () => {
    wrapper = mountSvg(<AnimatedLine commandToAnimate={lineA} turtle={turtle} />)
    expect(line().prop('stroke')).toEqual('black');
  });
});

describe('StaticLines', () => {
  let wrapper;

  function line() {
    return wrapper.find('line');
  }

  it('renders a line with the line coordinates', () => {
    wrapper = mountSvg(<StaticLines drawCommands={[ lineA ]} />);
    expect(line().exists()).toBeTruthy();
    expect(line().containsMatchingElement(
      <line x1={100} y1={100} x2={200} y2={100} />)).toBeTruthy();
  });

  it('sets a stroke width of 2 on each line', () => {
    wrapper = mountSvg(<StaticLines drawCommands={ [ lineA ] }/>);
    expect(line().prop('strokeWidth')).toEqual('2');
  });

  it('sets a stroke color of black on each line', () => {
    wrapper = mountSvg(<StaticLines drawCommands={ [ lineA ] }/>);
    expect(line().prop('stroke')).toEqual('black');
  });

  it('draws every drawLine command', () => {
    wrapper = mountSvg(<StaticLines drawCommands={ [ lineA, lineB, lineC ] }/>);
    expect(line().length).toEqual(3);
  });
});

describe('not', () => {
  let wrapper;

  afterEach(() => {
    wrapper.unmount();
  });

});

describe('Drawing', () => {
  let wrapper;
  let requestAnimationFrameSpy;

  beforeEach(() => {
    requestAnimationFrameSpy = jest.fn();
    window.requestAnimationFrame = requestAnimationFrameSpy;
  });

  function triggerRequestAnimationFrame(time) {
    const frameFn = requestAnimationFrameSpy.mock.calls[0][0];
    frameFn(time);
  }

  function svg() {
    return wrapper.find('svg');
  }

  function line() {
    return wrapper.find('line');
  }

  it('renders an svg inside div#viewport', () => {
    wrapper = mount(<Drawing drawCommands={[]} />);
    expect(wrapper.find('div#viewport > svg').exists()).toBeTruthy();
  });

  it('sets a viewbox of +/- 300 in either axis and preserves aspect ratio', () => {
    wrapper = mount(<Drawing drawCommands={[]} />);
    expect(svg().exists()).toBeTruthy();
    expect(svg().prop('viewBox')).toEqual('-300 -300 600 600');
    expect(svg().prop('preserveAspectRatio')).toEqual('xMidYMid slice');
  });

  it('sends all previous commands to StaticLines', () => {
    wrapper = mount(<Drawing drawCommands={[ lineA, lineB ]} />);
    wrapper.setProps({ drawCommands: [ lineA, lineB, lineC ] });
    expect(wrapper.find('StaticLines').exists()).toBeTruthy();
    expect(wrapper.find('StaticLines').prop('drawCommands')).toEqual([ lineA, lineB ]);
  });

  it('does not draw any commands for non-drawLine commands', () => {
    const unknown = { drawCommand: 'unknown' };
    wrapper = mount(<Drawing drawCommands={[ unknown ]} />);
    wrapper.setProps({ drawCommands: [ unknown, lineA ] });
    expect(wrapper.find('StaticLines').prop('drawCommands')).toEqual([]);
  });

  it('does not draw any commands on the initial render', () => {
    wrapper = mount(<Drawing drawCommands={[ lineA ]} />);
    expect(wrapper.find('StaticLines').prop('drawCommands')).toEqual([]);
  });

  it('invokes requestAnimationFrame when the timeout fires', async () => {
    wrapper = mount(<Drawing drawCommands={[ lineA ]} />);
    await new Promise(setTimeout);
    expect(requestAnimationFrameSpy).toHaveBeenCalled();
  });

  it('renders an AnimatedLine with turtle at the start position when the animation has run for 0s', async () => {
    wrapper = mount(<Drawing drawCommands={[ lineA ]} />);
    await new Promise(setTimeout);
    triggerRequestAnimationFrame(0);
    wrapper = wrapper.update();
    expect(wrapper.find('AnimatedLine').exists()).toBeTruthy();
    expect(wrapper.find('AnimatedLine').prop('commandToAnimate')).toEqual(lineA);
    expect(wrapper.find('AnimatedLine').prop('turtle')).toEqual({ x: 100, y: 100 });
  });

  it('renders an AnimatedLine with turtle at a position based on a speed of 5px per ms', async () => {
    wrapper = mount(<Drawing drawCommands={[ lineA ]} />);
    await new Promise(setTimeout);
    triggerRequestAnimationFrame(0);
    triggerRequestAnimationFrame(250);
    wrapper = wrapper.update();
    expect(wrapper.find('AnimatedLine').prop('commandToAnimate')).toEqual(lineA);
    expect(wrapper.find('AnimatedLine').prop('turtle')).toEqual({ x: 150, y: 100 });
  });

  it('invokes requestAnimationFrame again if there is another comand', async () => {
    wrapper = mount(<Drawing drawCommands={[ lineA ]} />);
    await new Promise(setTimeout);
    triggerRequestAnimationFrame(500);
    expect(requestAnimationFrameSpy.mock.calls.length).toEqual(2);
  });

  it('moves rendering of line to StaticLines once it has rendered', async () => {
    wrapper = mount(<Drawing drawCommands={[ lineA ]} />);
    await new Promise(setTimeout);
    triggerRequestAnimationFrame(0);
    triggerRequestAnimationFrame(500);
    wrapper = wrapper.update();
    expect(wrapper.find('StaticLines').prop('drawCommands')).toEqual([ lineA ]);
  });

  it('does not invoke requestAnimationFrame if there are no commands', async () => {
    wrapper = mount(<Drawing drawCommands={[ ]} />);
    await new Promise(setTimeout);
    expect(requestAnimationFrameSpy).not.toHaveBeenCalled();
  });
});

describe('ReduxConnectedDisplay', () => {
  let store;
  let wrapper;

  beforeEach(() => {
    store = configureStore([storeSpy], { script: { present: {
      drawCommands: [
        lineA, lineB
      ]
    }}});
  });

  function mountWithStore(component) {
    return mount(<StoreContext.Provider value={store}>{component}</StoreContext.Provider>);
  }

  it('renders a Drawing with drawCommands as props', () => {
    wrapper = mountWithStore(<ReduxConnectedDisplay />);
    expect(wrapper.find('Drawing').exists()).toBeTruthy();
    expect(wrapper.find('Drawing').prop('drawCommands')).toEqual([ lineA, lineB ]);
  });
});
