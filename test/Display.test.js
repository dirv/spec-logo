import React from 'react';
import ReactDOM from 'react-dom';
import { mount, shallow } from 'enzyme';
import { StoreContext } from 'redux-react-hook';
import { expectRedux, storeSpy } from 'expect-redux';
import { configureStore } from '../src/store';
import { AnimatedLine, StaticCommands, AnimatedCommands, DrawingLine, Drawing, ReduxConnectedDisplay } from '../src/Display';

let lineA = { drawCommand: 'drawLine', id: 123, x1: 100, y1: 100, x2: 200, y2: 100 };
let lineB = { drawCommand: 'drawLine', id: 234, x1: 200, y1: 100, x2: 200, y2: 200 };
let lineC = { drawCommand: 'drawLine', id: 235, x1: 200, y1: 200, x2: 300, y2: 300 };

describe('AnimatedLine', () => {
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

  function mountAnimatedLine(props) {
    wrapper = mount(<svg><AnimatedLine {...lineA} {...props} /></svg>);
  }

  function triggerRequestAnimationFrame(time) {
    const frameFn = requestAnimationFrameSpy.mock.calls[0][0];
    frameFn(time);
  }

  it('draws a line for a draw command in state', () => {
    mountAnimatedLine({ delay: 0 });
    expect(line().exists()).toBeTruthy();
    expect(line().type()).toEqual('line');
    expect(line().prop('x1')).toEqual(100);
    expect(line().prop('y1')).toEqual(100);
  });

  it('initially sets end of line to beginning of line, ready for animation', () => {
    mountAnimatedLine({ delay: 0 });
    expect(line().prop('x2')).toEqual(100);
    expect(line().prop('y2')).toEqual(100);
  });

  it('sets a stroke width of 2 on each line', () => {
    mountAnimatedLine({ delay: 0 });
    expect(line().prop('strokeWidth')).toEqual('2');
  });

  it('sets a stroke color of black on each line', () => {
    mountAnimatedLine({ delay: 0 });
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
      mountAnimatedLine({ beginAt: 1 });
      await new Promise(setTimeoutOriginal);
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.anything(), 1);
    });
  });

  it('invokes requestAnimationFrame when the timeout fires', async () => {
    mountAnimatedLine({ beginAt: 0 });
    await new Promise(setTimeout);
    await new Promise(setTimeout);
    expect(requestAnimationFrameSpy).toHaveBeenCalled();
  });

  it('renders proportionate x2 and y2 values after invoking the requestAnimationFrame handler with a duration', async () => {
    mountAnimatedLine({ beginAt: 0, duration: 500 });
    await new Promise(setTimeout);
    await new Promise(setTimeout);
    triggerRequestAnimationFrame(0);
    triggerRequestAnimationFrame(250);
    wrapper = wrapper.update();
    expect(line().prop('x2')).toEqual(150);
    expect(line().prop('y2')).toEqual(100);
  });

  it('invokes requestAnimationFrame again when time is not up', async () => {
    mountAnimatedLine({ beginAt: 0, duration: 500 });
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

  function mountSvg(component) {
    return mount(<svg>{component}</svg>);
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

  it('sends all commands to AnimatedCommands on initial render', () => {
    wrapper = mount(<Drawing drawCommands={[ lineA, lineB, lineC ]} />);
    expect(wrapper.find('AnimatedCommands').exists()).toBeTruthy();
    expect(wrapper.find('AnimatedCommands').prop('drawCommands')).toEqual([ lineA, lineB, lineC ]);
  });

  describe('on subsequent renders', () => {

    beforeEach(() => {
      wrapper = mount(<Drawing drawCommands={[ lineA, lineB ]} />);
      wrapper.setProps({ drawCommands: [ lineA, lineB, lineC ] });
    });

    it('sends all previous commands to StaticCommands', () => {
      expect(wrapper.find('StaticCommands').exists()).toBeTruthy();
      expect(wrapper.find('StaticCommands').prop('drawCommands')).toEqual([ lineA, lineB ]);
    });

    it('sends the new commands to AnimatedCommands', () => {
      expect(wrapper.find('AnimatedCommands').exists()).toBeTruthy();
      expect(wrapper.find('AnimatedCommands').prop('drawCommands')).toEqual([ lineC ]);
    });
  });

  describe('StaticCommands', () => {
    it('renders a line with the line coordinates', () => {
      wrapper = mountSvg(<StaticCommands drawCommands={[ lineA ]} />);
      expect(svg().find('line').exists()).toBeTruthy();
      expect(svg().find('line').containsMatchingElement(
        <line x1={100} y1={100} x2={200} y2={100} />)).toBeTruthy();
    });

    it('does not draw any commands for non-drawLine commands', () => {
      wrapper = mountSvg(<StaticCommands drawCommands={ [ { drawCommand: 'unknown' } ] }/>);
      expect(svg().find('line').length).toEqual(0);
    });

    it('draws every drawLine command', () => {
      wrapper = mountSvg(<StaticCommands drawCommands={ [ lineA, lineB, lineC ] }/>);
      expect(svg().find('line').length).toEqual(3);
    });

    it('does not draw any commands for non-drawLine commands', () => {
      wrapper = mountSvg(<StaticCommands drawCommands={ [ { drawCommand: 'unknown' } ] }/>);
      expect(svg().find('line').length).toEqual(0);
    });

    it('sets a stroke width of 2 on each line', () => {
      wrapper = mountSvg(<StaticCommands drawCommands={ [ lineA ] }/>);
      expect(svg().find('line').prop('strokeWidth')).toEqual('2');
    });

    it('sets a stroke color of black on each line', () => {
      wrapper = mountSvg(<StaticCommands drawCommands={ [ lineA ] }/>);
      expect(svg().find('line').prop('stroke')).toEqual('black');
    });
  });

  describe('AnimatedCommands', () => {
    it('renders an AnimatedLine with the line coordinates', () => {
      wrapper = mountSvg(<AnimatedCommands drawCommands={[ lineA ]} />);
      expect(svg().find('AnimatedLine').exists()).toBeTruthy();
      expect(svg().find('AnimatedLine').containsMatchingElement(
        <AnimatedLine x1={100} y1={100} x2={200} y2={100} />)).toBeTruthy();
    });

    it('renders a DrawingLine with a duration of 500ms for a horizontal line of length 100', () => {
      wrapper = mountSvg(<AnimatedCommands drawCommands={[ lineA ]} />);
      expect(wrapper.find('AnimatedLine').exists()).toBeTruthy();
      expect(wrapper.find('AnimatedLine').prop('duration')).toEqual(500);
    });

    it('has a duration based on a speed of 5 units per ms', () => {
      wrapper = mountSvg(<AnimatedCommands drawCommands={[ lineC ]} />);
      const distance = Math.sqrt(100 * 100 * 2);
      expect(wrapper.find('AnimatedLine').prop('duration')).toEqual(distance * 5);
    });

    it('sets an incrementing delay on each draw command', () => {
      wrapper = mountSvg(<AnimatedCommands drawCommands={ [ lineA, lineB ] } />);
      const delays = wrapper.find('AnimatedLine').map(line => line.prop('beginAt'));
      expect(delays).toEqual([ 0, 500 ]);
    });
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
