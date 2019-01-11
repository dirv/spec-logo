import React from 'react';
import ReactDOM from 'react-dom';
import { mount, shallow } from 'enzyme';
import { StoreContext } from 'redux-react-hook';
import { expectRedux, storeSpy } from 'expect-redux';
import { configureStore } from '../src/store';
import { DrawingLine, Drawing, ReduxConnectedDisplay } from '../src/Display';

let lineA = { id: 123, x1: 100, y1: 100, x2: 200, y2: 100 };
let lineB = { id: 234, x1: 200, y1: 100, x2: 200, y2: 200 };
let lineC = { id: 235, x1: 200, y1: 200, x2: 300, y2: 300 };

describe('DrawingLine', () => {
  let wrapper;
  let requestAnimationFrameSpy;

  beforeEach(() => {
    requestAnimationFrameSpy = jest.fn();
    window.requestAnimationFrame = requestAnimationFrameSpy;
  });

  afterEach(() => {
    wrapper.unmount();
  });

  function line() {
    return wrapper.find('line');
  }

  function mountDrawingLine(props) {
    wrapper = mount(<svg><DrawingLine {...lineA} {...props} /></svg>);
  }

  function triggerRequestAnimationFrame(time) {
    const frameFn = requestAnimationFrameSpy.mock.calls[0][0];
    frameFn(time);
  }

  it('draws a line for a draw command in state', () => {
    mountDrawingLine({ delay: 0 });
    expect(line().exists()).toBeTruthy();
    expect(line().type()).toEqual('line');
    expect(line().prop('x1')).toEqual(100);
    expect(line().prop('y1')).toEqual(100);
  });

  it('initially sets end of line to beginning of line, ready for animation', () => {
    mountDrawingLine({ delay: 0 });
    expect(line().prop('x2')).toEqual(100);
    expect(line().prop('y2')).toEqual(100);
  });

  it('sets a stroke width of 2 on each line', () => {
    mountDrawingLine({ delay: 0 });
    expect(line().prop('strokeWidth')).toEqual('2');
  });

  it('sets a stroke color of black on each line', () => {
    mountDrawingLine({ delay: 0 });
    expect(line().prop('stroke')).toEqual('black');
  });

  describe('setTimeout call', () => {
    let setTimeoutSpy;
    let setTimeoutOriginal;

    beforeEach(() => {
      setTimeoutOriginal = window.setTimeout;
      setTimeoutSpy = jest.fn(window.setTimeout);
      window.setTimeout = setTimeoutSpy;
    });

    afterEach(() => {
      window.setTimeout = setTimeoutOriginal;
    });

    it('triggers a setTimeout to run after the delay', async () => {
      mountDrawingLine({ beginAt: 1 });
      await new Promise(setTimeoutOriginal);
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.anything(), 1);
    });
  });

  it('invokes requestAnimationFrame when the timeout fires', async () => {
    mountDrawingLine({ beginAt: 0 });
    await new Promise(setTimeout);
    await new Promise(setTimeout);
    expect(requestAnimationFrameSpy).toHaveBeenCalled();
  });

  it('renders proportionate x2 and y2 values after invoking the requestAnimationFrame handler with a duration', async () => {
    mountDrawingLine({ beginAt: 0, duration: 500 });
    await new Promise(setTimeout);
    await new Promise(setTimeout);
    triggerRequestAnimationFrame(0);
    triggerRequestAnimationFrame(250);
    wrapper = wrapper.update();
    expect(line().prop('x2')).toEqual(150);
    expect(line().prop('y2')).toEqual(100);
  });

  it('invokes requestAnimationFrame again when time is not up', async () => {
    mountDrawingLine({ beginAt: 0, duration: 500 });
    await new Promise(setTimeout);
    await new Promise(setTimeout);
    triggerRequestAnimationFrame(0);
    expect(requestAnimationFrameSpy.mock.calls.length).toEqual(2);
  });
});

// TODO: would be better if these tests used shallow
describe('Drawing', () => {
  let store;
  let wrapper;

  function svg() {
    return wrapper.find('svg');
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

  it('renders a DrawingLine with the line coordinates', () => {
    wrapper = mount(<Drawing drawCommands={[ lineA ]} />);
    expect(wrapper.find('DrawingLine').exists()).toBeTruthy();
    expect(wrapper.find('DrawingLine').containsMatchingElement(
      <DrawingLine x1={100} y1={100} x2={200} y2={100} />)).toBeTruthy();
  });

  describe('duration', () => {
    it('renders a DrawingLine with a duration of 500ms for a horizontal line of length 100', () => {
      wrapper = mount(<Drawing drawCommands={[ lineA ]} />);
      expect(wrapper.find('DrawingLine').exists()).toBeTruthy();
      expect(wrapper.find('DrawingLine').prop('duration')).toEqual(500);
    });

    it('has a duration based on a speed of 5 units per ms', () => {
      wrapper = mount(<Drawing drawCommands={[ lineC ]} />);
      const distance = Math.sqrt(100 * 100 * 2);
      expect(wrapper.find('DrawingLine').prop('duration')).toEqual(distance * 5);
    });
  });

  it('sets an incrementing delay on each draw command', () => {
    wrapper = mount(<Drawing drawCommands={ [ lineA, lineB ] }/>);
    const delays = wrapper.find('DrawingLine').map(line => line.prop('beginAt'));
    expect(delays).toEqual([0, 500]);
  });

  it('does not adjust increments on existing lines when re-rendering', () => {
    wrapper = mount(<Drawing drawCommands={ [ lineA, lineB ] }/>);
    wrapper.setProps({ drawCommands: [ lineA, lineB, lineC ] });
    const delays = wrapper.find('DrawingLine').map(line => line.prop('beginAt'));
    expect(delays).toEqual([0, 500, 0]);
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