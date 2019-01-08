import React from 'react';
import ReactDOM from 'react-dom';
import { mount } from 'enzyme';
import { StoreContext } from 'redux-react-hook';
import { expectRedux, storeSpy } from 'expect-redux';
import { configureStore } from '../src/store';
import { StaticCommands, AnimatedCommands, Drawing, ReduxConnectedDisplay } from '../src/Display';

let lineA = { drawCommand: 'drawLine', id: 123, x1: 10, y1: 10, x2: 20, y2: 20 };
let lineB = { drawCommand: 'drawLine', id: 234, x1: 10, y1: 10, x2: 20, y2: 20 };
let lineC = { drawCommand: 'drawLine', id: 235, x1: 10, y1: 10, x2: 20, y2: 20 };

describe('Drawing', () => {
  let store;
  let wrapper;

  function svg() {
    return wrapper.find('svg');
  }

  function mountSvg(component) {
    return mount(<svg>{component}</svg>);
  }

  function drawLine() {
    store.dispatch({ type: 'SUBMIT_EDIT_LINE', text: 'forward 10\n' });
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

  it('draws a line for a draw command in state', () => {
    wrapper = mount(<Drawing drawCommands={ [ lineA ] }/>);
    expect(svg().find('svg line').exists()).toBeTruthy();
    expect(svg().find('svg line').prop('x1')).toEqual(10);
    expect(svg().find('svg line').prop('y1')).toEqual(10);
  });

  describe('AnimatedCommands', () => {
    it('initially sets end of line to beginning of line, ready for animation', () => {
      wrapper = mountSvg(<AnimatedCommands drawCommands={ [ lineA ] } startTime={0} />);
      expect(svg().find('line').prop('x2')).toEqual(10);
      expect(svg().find('line').prop('y2')).toEqual(10);
    });

    it('draws every drawLine command', () => {
      wrapper = mountSvg(<AnimatedCommands drawCommands={ [ lineA, lineB, lineC ] } startTime={0} />);
      expect(svg().find('line').length).toEqual(3);
    });

    it('does not draw any commands for non-drawLine commands', () => {
      wrapper = mountSvg(<AnimatedCommands drawCommands={ [ { drawCommand: 'unknown' } ] } startTime={0} />);
      expect(svg().find('line').length).toEqual(0);
    });

    it('sets a stroke width of 2 on each line', () => {
      wrapper = mountSvg(<AnimatedCommands drawCommands={ [ lineA ] } startTime={0} />);
      expect(svg().find('line').prop('strokeWidth')).toEqual('2');
    });

    it('sets a stroke color of black on each line', () => {
      wrapper = mountSvg(<AnimatedCommands drawCommands={ [ lineA ] } startTime={0} />);
      expect(svg().find('line').prop('stroke')).toEqual('black');
    });
  });

  describe('StaticCommands', () => {
    it('renders lines with correct co-ordinate values', () => {
      wrapper = mountSvg(<StaticCommands drawCommands={ [lineA ] } />);
      expect(svg().find('line').prop('x1')).toEqual(10);
      expect(svg().find('line').prop('y1')).toEqual(10);
      expect(svg().find('line').prop('x2')).toEqual(20);
      expect(svg().find('line').prop('y2')).toEqual(20);
    });

    it('does not draw any commands for non-drawLine commands', () => {
      wrapper = mountSvg(<StaticCommands drawCommands={ [ { drawCommand: 'unknown' } ] }/>);
      expect(svg().find('line').length).toEqual(0);
    });

    it('draws every drawLine command', () => {
      wrapper = mountSvg(<Drawing drawCommands={ [ lineA, lineB, lineC ] }/>);
      expect(svg().find('line').length).toEqual(3);
    });

    it('does not draw any commands for non-drawLine commands', () => {
      wrapper = mountSvg(<AnimatedCommands drawCommands={ [ { drawCommand: 'unknown' } ] }/>);
      expect(svg().find('line').length).toEqual(0);
    });

    it('sets a stroke width of 2 on each line', () => {
      wrapper = mountSvg(<Drawing drawCommands={ [ lineA ] }/>);
      expect(svg().find('line').prop('strokeWidth')).toEqual('2');
    });

    it('sets a stroke color of black on each line', () => {
      wrapper = mountSvg(<Drawing drawCommands={ [ lineA ] }/>);
      expect(svg().find('line').prop('stroke')).toEqual('black');
    });
  });

  describe('animating', () => {
    describe('x2 coordinate', () => {
      it('renders animate element', () => {
        wrapper = mount(<Drawing drawCommands={ [ lineA ] }/>);
        const firstLine = svg().find('svg line');
        expect(firstLine.childAt(0).type()).toEqual('animate');
        expect(firstLine.childAt(0).prop('attributeName')).toEqual('x2');
        expect(firstLine.childAt(0).prop('to')).toEqual(20);
      });

      it('sets the begin time to 0 when component first mounts', () => {
        wrapper = mount(<Drawing drawCommands={ [ lineA ] }/>);
        const firstLine = svg().find('svg line');
        expect(firstLine.childAt(0).prop('begin')).toEqual(0);
      });

      it('has a duration of 0.5s', () => {
        wrapper = mount(<Drawing drawCommands={ [ lineA ] }/>);
        const firstLine = svg().find('svg line');
        expect(firstLine.childAt(0).prop('dur')).toEqual(0.5);
      });

      it('sets the fill to freeze', () => {
        wrapper = mount(<Drawing drawCommands={ [ lineA ] }/>);
        const firstLine = svg().find('svg line');
        expect(firstLine.childAt(0).prop('fill')).toEqual('freeze');
      });
    });

    describe('y2 coordinate', () => {
      it('renders animate element', () => {
        wrapper = mount(<Drawing drawCommands={ [ lineA ] }/>);
        const firstLine = svg().find('svg line').at(0);
        expect(firstLine.childAt(1).type()).toEqual('animate');
        expect(firstLine.childAt(1).prop('attributeName')).toEqual('y2');
        expect(firstLine.childAt(1).prop('to')).toEqual(20);
      });

      it('sets the begin time to 0 when component first mounts', () => {
        wrapper = mount(<Drawing drawCommands={ [ lineA ] }/>);
        const firstLine = svg().find('svg line');
        expect(firstLine.childAt(1).prop('begin')).toEqual(0);
      });

      it('has a duration of 0.5s', () => {
        wrapper = mount(<Drawing drawCommands={ [ lineA ] }/>);
        const firstLine = svg().find('svg line');
        expect(firstLine.childAt(1).prop('dur')).toEqual(0.5);
      });

      it('sets the fill to freeze', () => {
        wrapper = mount(<Drawing drawCommands={ [ lineA ] }/>);
        const firstLine = svg().find('svg line');
        expect(firstLine.childAt(1).prop('fill')).toEqual('freeze');
      });
    });

    it('creates x2 and y2 animations for every line drawn', () => {
      wrapper = mount(<Drawing drawCommands={[
        { drawCommand: 'drawLine', id: 123, x1: 10, y1: 10, x2: 20, y2: 20 },
        { drawCommand: 'drawLine', id: 234, x1: 10, y1: 10, x2: 20, y2: 20 },
        { drawCommand: 'drawLine', id: 345, x1: 10, y1: 10, x2: 20, y2: 20 },
      ]}/>);
      expect(wrapper.find('animate').length).toEqual(6);
    });

    describe('later draw commands', () => {
      let timeSpy;
      let root;

      beforeEach(async () => {
        timeSpy = jest.fn();
        timeSpy.mockReturnValue(5);
        SVGSVGElement.prototype.getCurrentTime = timeSpy;
        root = document.createElement('div');
        wrapper = mount(<Drawing drawCommands={ [  ] }/>);
        wrapper.setProps({ drawCommands: [ lineA, lineB ] });
        await new Promise(setTimeout);
        wrapper = wrapper.update();
      });

      it('uses getCurrentTime function to find current document animation time on second render', () => {
        expect(timeSpy).toHaveBeenCalled();
      });

      it('sets the first new draw command begin to the current time', () => {
        expect(wrapper.find('line').at(0).childAt(0).prop('begin')).toEqual(5);
      });

      it('sets the next draw command to that time plus the duration', () => {
        expect(wrapper.find('line').at(1).childAt(0).prop('begin')).toEqual(5.5);
      });
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
