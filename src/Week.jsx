import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import momentTimezone from 'moment-timezone';

import { HOUR_IN_PIXELS, RULER_WIDTH_IN_PIXELS } from './Constants';
import Day from './Day';
import DayHeader from './DayHeader';
import Ruler from './Ruler';
import getIncludedEvents from './getIncludedEvents';
import styles from './Week.css';

function flatten(selections) {
  const result = [];
  selections.forEach((selectionsInDay) => {
    result.push(...selectionsInDay);
  });
  return result;
}

function weekEvents(week, items, timeZone) {
  const result = [];
  week.days.forEach(({ date }) => {
    const startMoment = momentTimezone.tz(date, timeZone).hour(0);
    const end = momentTimezone.tz(startMoment, timeZone).date(startMoment.date() + 1).toDate();
    const start = startMoment.toDate();
    result.push(getIncludedEvents(items || [], start, end));
  });
  return result;
}

export default class Week extends PureComponent {
  constructor({ week, events, initialSelections, timeZone }) {
    super();
    this.state = {
      dayEvents: weekEvents(week, events, timeZone),
      daySelections: weekEvents(week, initialSelections, timeZone),
    };
    this.handleDayChange = this.handleDayChange.bind(this);
    this.handleDaysRef = this.handleDaysRef.bind(this);
    this.setDaysWidth = () => this.setState({
      daysWidth: this.daysRef.offsetWidth,
    });
  }

  componentWillMount() {
    window.addEventListener('resize', this.setDaysWidth);
  }

  componentWillReceiveProps({ week, events, timeZone }) {
    if (events === this.props.events) {
      // nothing changed
      return;
    }
    this.setState({
      dayEvents: weekEvents(week, events, timeZone),
    });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setDaysWidth);
  }

  handleDaysRef(element) {
    if (!element) {
      return;
    }
    this.daysRef = element;
    this.setState({ daysWidth: element.offsetWidth });
  }

  handleDayChange(dayIndex, selections) {
    this.setState(({ daySelections }) => {
      const { onChange } = this.props;
      if (!onChange) {
        return undefined;
      }
      // eslint-disable-next-line no-param-reassign
      daySelections[dayIndex] = selections;
      const flattened = flatten(daySelections);
      onChange(this.props.week, flattened);
      return { daySelections };
    });
  }

  // eslint-disable-next-line class-methods-use-this
  renderLines() {
    const result = [];
    for (let i = 0; i < 24; i++) {
      result.push(
        <div
          key={i}
          className={styles.hour}
          style={{
            height: HOUR_IN_PIXELS,
          }}
        />,
      );
    }
    return result;
  }

  render() {
    const {
      week,
      availableWidth,
      timeConvention,
      timeZone,
      recurring,
      touchToDeleteSelection,
    } = this.props;

    const { dayEvents, daySelections, daysWidth } = this.state;

    return (
      <div className={styles.component}>
        <div
          className={styles.header}
          style={{
            paddingLeft: RULER_WIDTH_IN_PIXELS,
            maxWidth: daysWidth,
          }}
        >
          {week.days.map((day, i) => (
            <DayHeader
              timeZone={timeZone}
              availableWidth={(availableWidth - RULER_WIDTH_IN_PIXELS) / 7}
              day={day}
              key={day.date}
              events={dayEvents[i]}
              hideDates={recurring}
            />
          ))}
        </div>
        <div
          className={styles.daysWrapper}
          ref={(element) => {
            if (!element || this.alreadyScrolled) {
              return;
            }
            this.alreadyScrolled = true;
            // eslint-disable-next-line no-param-reassign
            element.scrollTop = HOUR_IN_PIXELS * 6.5;
          }}
        >
          <div className={styles.lines}>
            {this.renderLines()}
          </div>
          <div
            className={styles.days}
            ref={this.handleDaysRef}
          >
            <Ruler timeConvention={timeConvention} />
            {week.days.map((day, i) => (
              <Day
                availableWidth={(availableWidth - RULER_WIDTH_IN_PIXELS) / 7}
                timeConvention={timeConvention}
                timeZone={timeZone}
                index={i}
                key={day.date}
                date={day.date}
                events={dayEvents[i]}
                initialSelections={daySelections[i]}
                onChange={this.handleDayChange}
                touchToDeleteSelection={touchToDeleteSelection}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
}

Week.propTypes = {
  availableWidth: PropTypes.number.isRequired,
  timeConvention: PropTypes.oneOf(['12h', '24h']),
  timeZone: PropTypes.string.isRequired,
  events: PropTypes.arrayOf(PropTypes.shape({
    start: PropTypes.instanceOf(Date),
    end: PropTypes.instanceOf(Date),
    title: PropTypes.string,
    backgroundColor: PropTypes.string,
    foregroundColor: PropTypes.string,
    offset: PropTypes.number,
    width: PropTypes.number,
  })),
  initialSelections: PropTypes.arrayOf(PropTypes.shape({
    start: PropTypes.instanceOf(Date),
    end: PropTypes.instanceOf(Date),
  })),
  onChange: PropTypes.func,
  // eslint-disable-next-line react/forbid-prop-types
  week: PropTypes.object.isRequired,
  recurring: PropTypes.bool,
  touchToDeleteSelection: PropTypes.bool,
};
